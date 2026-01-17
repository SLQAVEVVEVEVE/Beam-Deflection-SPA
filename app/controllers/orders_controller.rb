class OrdersController < ApplicationController
  include MinioHelper
  helper_method :minio_image_url
  
  before_action :set_beam_deflection, only: [:show, :complete]

  # GET /orders/:id
  def show
    @items = @beam_deflection.beam_deflection_beams.includes(:beam).order(:id)
    @item_deflections = {}

    if @beam_deflection.result_deflection_mm.present?
      @items.each do |item|
        beam = item.beam
        next if beam.nil? || item.length_m.blank? || item.udl_kn_m.blank?
        next if item.length_m.to_f <= 0 || item.udl_kn_m.to_f < 0

        @item_deflections[item.id] = Calc::Deflection.call(item, beam)
      end
    end
  end
  
  # POST /orders/:id/complete
  def complete
    # In a real app, add authorization check here (e.g., check if user is a moderator)
    return redirect_to(order_path(@beam_deflection), alert: "Request must be in formed status") unless @beam_deflection.formed?

    BeamDeflection.transaction do
      @beam_deflection.update!(
        status: BeamDeflection::STATUSES[:completed],
        completed_at: Time.current,
        moderator: current_user,
        result_deflection_mm: nil,
        within_norm: nil,
        calculated_at: nil
      )
    end

    AsyncDeflectionClient.trigger_for!(@beam_deflection)
    
    redirect_to order_path(@beam_deflection), notice: "Заявка завершена, прогиб рассчитан."
  rescue => e
    Rails.logger.error "Failed to complete order: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
    redirect_to order_path(@beam_deflection), alert: "Не удалось завершить заявку: #{e.message}"
  end
  
  private
  
  def set_beam_deflection
    @beam_deflection = BeamDeflection.find(params[:id])
    # Uncomment to hide deleted requests
    # redirect_to root_path, alert: "Заявка не найдена" if @beam_deflection.deleted?
  end
end
