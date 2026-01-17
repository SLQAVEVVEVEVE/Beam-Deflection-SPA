# frozen_string_literal: true

require "json"
require "net/http"
require "openssl"
require "uri"

class AsyncDeflectionClient
  DEFAULT_SIM_DELAY_SECONDS = 7

  class << self
    def trigger_for!(beam_deflection)
      service_url = ENV["ASYNC_SERVICE_URL"].to_s.strip

      if service_url.present?
        trigger_external_async(service_url, beam_deflection.id)
      else
        simulate_async_in_process(beam_deflection.id, delay_seconds: sim_delay_seconds)
      end
    end

    private

    def sim_delay_seconds
      Integer(ENV.fetch("ASYNC_SIM_DELAY_SECONDS", DEFAULT_SIM_DELAY_SECONDS))
    rescue ArgumentError, TypeError
      DEFAULT_SIM_DELAY_SECONDS
    end

    def trigger_external_async(service_url, beam_deflection_id)
      Thread.new do
        Rails.application.executor.wrap do
          ActiveRecord::Base.connection_pool.with_connection do
            beam_deflection = BeamDeflection.includes(beam_deflection_beams: :beam).find_by(id: beam_deflection_id)
            next unless beam_deflection&.completed?

            payload = build_trigger_payload(beam_deflection)
            post_json(service_url, payload)
          end
        rescue => e
          Rails.logger.error("[AsyncDeflectionClient] Trigger failed: #{e.class}: #{e.message}")
        end
      end
    end

    def simulate_async_in_process(beam_deflection_id, delay_seconds:)
      Thread.new do
        Rails.application.executor.wrap do
          sleep(delay_seconds)
          ActiveRecord::Base.connection_pool.with_connection do
            beam_deflection = BeamDeflection.includes(beam_deflection_beams: :beam).find_by(id: beam_deflection_id)
            next unless beam_deflection&.completed?
            next if beam_deflection.result_deflection_mm.present?

            beam_deflection.compute_result!
          end
        rescue => e
          Rails.logger.error("[AsyncDeflectionClient] Simulation failed: #{e.class}: #{e.message}")
        end
      end
    end

    def build_trigger_payload(beam_deflection)
      {
        beam_deflection_id: beam_deflection.id,
        items: beam_deflection.beam_deflection_beams.map do |item|
          beam = item.beam
          {
            beam_id: item.beam_id,
            quantity: item.quantity,
            length_m: item.length_m,
            udl_kn_m: item.udl_kn_m,
            beam: {
              elasticity_gpa: beam&.elasticity_gpa,
              inertia_cm4: beam&.inertia_cm4,
              allowed_deflection_ratio: beam&.allowed_deflection_ratio
            }
          }
        end,
        callback: callback_payload_for(beam_deflection.id)
      }.compact
    end

    def callback_payload_for(beam_deflection_id)
      template = ENV["ASYNC_CALLBACK_URL"].to_s.strip
      return nil if template.blank?

      url = template.gsub("{id}", beam_deflection_id.to_s)
      url = url.gsub(":id", beam_deflection_id.to_s)

      payload = { url: url }
      token = ENV["ASYNC_CALLBACK_TOKEN"].to_s.strip
      payload[:token] = token if token.present?
      payload
    end

    def post_json(url, body)
      uri = URI.parse(url)

      request = Net::HTTP::Post.new(uri)
      request["Content-Type"] = "application/json"

      trigger_token = ENV["ASYNC_TRIGGER_TOKEN"].to_s.strip
      request["X-Async-Token"] = trigger_token if trigger_token.present?

      request.body = JSON.generate(body)

      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = uri.scheme == "https"
      http.verify_mode = OpenSSL::SSL::VERIFY_NONE if http.use_ssl?
      http.open_timeout = 2
      http.read_timeout = 5
      http.request(request)
    end
  end
end
