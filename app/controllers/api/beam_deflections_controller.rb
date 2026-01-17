module Api
  class BeamDeflectionsController < BaseController
    before_action :require_auth!, except: [:async_result]
    before_action :require_async_callback_auth!, only: [:async_result]
    before_action :set_beam_deflection, only: [:show, :update, :form, :complete, :reject, :destroy, :async_result]
    before_action :authorize_view!, only: [:show]
    before_action :check_owner, only: [:update, :form, :destroy]
    before_action :require_moderator!, only: [:complete, :reject]

    # GET /api/beam_deflections
    # List all non-deleted beam_deflections
    # - Moderators see ALL non-deleted (including draft)
    # - Regular users see only their own non-draft
    def index
      scope = BeamDeflection.not_deleted.includes(:creator, :moderator, beam_deflection_beams: :beam)

      if Current.user&.moderator?
        # Moderators see all non-deleted beam_deflections (including draft)
      else
        # Regular users see only their own non-draft beam_deflections
        scope = scope.where(creator_id: Current.user.id).not_draft
      end

      statuses = Array(params[:status]).presence
      scope = scope.by_statuses(statuses) if statuses

      from = parse_date_boundary(params[:from], :start)
      to = parse_date_boundary(params[:to], :end)
      if from.present?
        scope = scope.where('formed_at >= ?', from)
      end
      if to.present?
        scope = scope.where('formed_at <= ?', to)
      end

      scope = scope.order(formed_at: :desc)

      # simple pagination (optional)
      page = [params[:page].to_i, 1].max
      per  = params[:per_page].to_i
      per  = 20 if per.zero? || per < 0
      per  = [per, 100].min
      beam_deflections = scope.page(page).per(per)

      data = beam_deflections.map do |bd|
        item_deflections =
          if bd.result_deflection_mm.present?
            bd.beam_deflection_beams.map do |bdb|
              beam = bdb.beam
              next if beam.nil? || bdb.length_m.blank? || bdb.udl_kn_m.blank?
              next if bdb.length_m.to_f <= 0 || bdb.udl_kn_m.to_f < 0

              Calc::Deflection.call(bdb, beam).round(6)
            end.compact
          end

        {
          id: bd.id,
          status: bd.status,
          formed_at: bd.formed_at,
          completed_at: bd.completed_at,
          note: bd.note,
          creator_login: bd.creator&.email,
          moderator_login: bd.moderator&.email,
          items_with_result_count: item_deflections&.length,
          items_count: bd.beam_deflection_beams.size,
          result_deflection_mm: bd.result_deflection_mm,
          item_deflections_mm: item_deflections
        }
      end

      render json: {
        beam_deflections: data,
        meta: {
          current_page: beam_deflections.current_page,
          next_page:    beam_deflections.next_page,
          prev_page:    beam_deflections.prev_page,
          total_pages:  beam_deflections.total_pages,
          total_count:  beam_deflections.total_count
        }
      }
    end

    # GET /api/requests/:id
    def show
      render json: serialize_beam_deflection(@beam_deflection)
    end

    # PUT /api/requests/:id
    # Only topic fields; allow on draft (and formed if needed by LR3)
    def update
      allowed = @beam_deflection.draft? || @beam_deflection.formed?
      return render_error('Not authorized', :forbidden) unless allowed && @beam_deflection.creator == Current.user

      if @beam_deflection.update(beam_deflection_params)
        render json: serialize_beam_deflection(@beam_deflection)
      else
        render_error(@beam_deflection.errors.full_messages, :unprocessable_entity)
      end
    end

    # PUT /api/requests/:id/form
    def form
      # Ensure draft ownership for LR3
      return render_error('Request must be in draft status', :unprocessable_entity) unless @beam_deflection.draft?
      return render_error('Not authorized', :forbidden) unless @beam_deflection.creator == Current.user

      items = @beam_deflection.beam_deflection_beams
      return render_error('Empty cart', :unprocessable_entity) unless items.exists?

      missing = items.where(length_m: nil).or(items.where(udl_kn_m: nil)).exists?
      return render_error('Required fields missing', :unprocessable_entity) if missing

      @beam_deflection.update!(status: BeamDeflection::STATUSES[:formed], formed_at: Time.current)
      render json: serialize_beam_deflection(@beam_deflection)
    rescue => e
      render_error(@beam_deflection.errors.full_messages.presence || e.message, :unprocessable_entity)
    end

    # PUT /api/requests/:id/complete
    def complete
      unless @beam_deflection.formed?
        return render_error('Request must be in formed status', :unprocessable_entity)
      end

      BeamDeflection.transaction do
        @beam_deflection.update!(
          status: BeamDeflection::STATUSES[:completed],
          moderator: Current.user,
          completed_at: Time.current,
          result_deflection_mm: nil,
          within_norm: nil,
          calculated_at: nil
        )
      end

      AsyncDeflectionClient.trigger_for!(@beam_deflection)
      render json: serialize_beam_deflection(@beam_deflection)
    rescue => e
      render_error(@beam_deflection.errors.full_messages.presence || e.message, :unprocessable_entity)
    end

    # POST /api/beam_deflections/:id/async_result
    # Callback endpoint for an async service that provides calculation results.
    def async_result
      if params[:beam_deflection_id].present? && params[:beam_deflection_id].to_i != @beam_deflection.id
        return render_error('beam_deflection_id mismatch', :unprocessable_entity)
      end

      return render_error('Request must be in completed status', :unprocessable_entity) unless @beam_deflection.completed?

      permitted = params.permit(:result_deflection_mm, :within_norm, :calculated_at, items: [:beam_id])
      items = permitted[:items]
      return render_error('items must be an array', :unprocessable_entity) if items.present? && !items.is_a?(Array)

      within_norm = permitted[:within_norm]
      calculated_at =
        if permitted[:calculated_at].present?
          Time.zone.parse(permitted[:calculated_at].to_s)
        else
          Time.current
        end

      BeamDeflection.transaction do
        result_deflection_mm = permitted[:result_deflection_mm]

        if result_deflection_mm.nil? || within_norm.nil?
          computed = @beam_deflection.compute_result_values
          result_deflection_mm ||= computed[:total_deflection_mm]
          within_norm = computed[:within_norm] if within_norm.nil?
        end

        @beam_deflection.update!(
          result_deflection_mm: result_deflection_mm,
          within_norm: within_norm,
          calculated_at: calculated_at
        )
      end

      render json: { ok: true }
    rescue => e
      render_error(e.message, :unprocessable_entity)
    end

    # PUT /api/requests/:id/reject
    def reject
      unless Current.user&.moderator?
        return render_error('Moderator access required', :forbidden)
      end
      unless @beam_deflection.formed?
        return render_error('Request must be in formed status', :unprocessable_entity)
      end

      @beam_deflection.update!(
        status: BeamDeflection::STATUSES[:rejected],
        moderator: Current.user,
        completed_at: Time.current
      )
      render json: serialize_beam_deflection(@beam_deflection)
    rescue => e
      render_error(@beam_deflection.errors.full_messages.presence || e.message, :unprocessable_entity)
    end

    # DELETE /api/requests/:id
    def destroy
      return render_error('Not authorized', :forbidden) unless @beam_deflection.creator == Current.user
      @beam_deflection.update!(status: BeamDeflection::STATUSES[:deleted], completed_at: Time.current)
      head :no_content
    rescue => e
      render_error(@beam_deflection.errors.full_messages.presence || e.message, :unprocessable_entity)
    end

    private

    def require_async_callback_auth!
      expected = ENV['ASYNC_CALLBACK_TOKEN'].to_s.strip
      return if expected.blank?

      actual = request.headers['X-Async-Token'].to_s.strip
      if actual.bytesize == expected.bytesize && ActiveSupport::SecurityUtils.secure_compare(actual, expected)
        return
      end

      render_error('Unauthorized', :unauthorized)
    end

    def set_beam_deflection
      @beam_deflection = BeamDeflection.not_deleted.find(params[:id])
    rescue ActiveRecord::RecordNotFound
      render_error('BeamDeflection not found', :not_found)
    end

    def beam_deflection_params
      params.require(:beam_deflection).permit(:note)
    end

    def check_owner
      return if @beam_deflection.creator == Current.user

      render_error('Not authorized', :forbidden)
    end

    def authorize_view!
      return if Current.user&.moderator? || @beam_deflection.creator == Current.user

      render_error('Not authorized', :forbidden)
    end

    def serialize_beam_deflection(bd)
      items = bd.beam_deflection_beams.includes(:beam).map do |bdb|
        beam = bdb.beam
        computed_deflection = nil
        if bd.result_deflection_mm.present? && beam && bdb.length_m.present? && bdb.udl_kn_m.present?
          if bdb.length_m.to_f > 0 && bdb.udl_kn_m.to_f >= 0
            computed_deflection = Calc::Deflection.call(bdb, beam).round(6)
          end
        end
        {
          beam_id: bdb.beam_id,
          beam_name: beam&.name,
          beam_material: beam&.material,
          beam_image_url: beam&.respond_to?(:image_url) ? beam&.image_url : beam&.try(:image_key),
          quantity: bdb.quantity,
          length_m: bdb.length_m,
          udl_kn_m: bdb.udl_kn_m,
          position: bdb.position,
          deflection_mm: computed_deflection
        }
      end

      {
        id: bd.id,
        status: bd.status,
        within_norm: bd.within_norm,
        note: bd.note,
        formed_at: bd.formed_at,
        completed_at: bd.completed_at,
        creator_login: bd.creator&.email,
        moderator_login: bd.moderator&.email,
        items: items,
        result_deflection_mm: bd.result_deflection_mm
      }
    end

    def parse_date_boundary(raw, boundary)
      return nil if raw.blank?

      value = raw.to_s
      has_time = value.match?(/\d{2}:\d{2}/)
      has_zone = value.match?(/Z$|[+-]\d{2}:\d{2}$/)

      if has_time
        parsed =
          if has_zone
            begin
              Time.iso8601(value)
            rescue ArgumentError
              Time.parse(value)
            end
          else
            Time.zone.parse(value)
          end
        return parsed&.utc
      end

      parsed = Time.zone.parse(value)
      return nil unless parsed

      (boundary == :start ? parsed.beginning_of_day : parsed.end_of_day).utc
    end
  end
end
