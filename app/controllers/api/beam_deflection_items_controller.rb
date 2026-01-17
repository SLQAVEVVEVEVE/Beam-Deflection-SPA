module Api
  class BeamDeflectionItemsController < BaseController
    before_action :require_auth!
    before_action :set_beam_deflection
    before_action :ensure_mutable_draft

    def update_item
      beam_id = params.require(:beam_id)
      item = @beam_deflection.beam_deflection_beams.find_or_initialize_by(beam_id: beam_id)
      attrs = params.require(:beam_deflection_beam).permit(:quantity, :position, :length_m, :udl_kn_m)
      if item.update(attrs)
        if attrs.key?(:length_m) || attrs.key?(:udl_kn_m)
          @beam_deflection.update_columns(result_deflection_mm: nil, within_norm: nil, calculated_at: nil)
        end
        render json: item
      else
        render_error(item.errors.full_messages, :unprocessable_entity)
      end
    end

    def remove_item
      beam_id = params.require(:beam_id)
      item = @beam_deflection.beam_deflection_beams.find_by!(beam_id: beam_id)
      item.destroy!
      head :no_content
    rescue ActiveRecord::RecordNotFound
      not_found
    end

    private

    def set_beam_deflection
      @beam_deflection = BeamDeflection.find(params[:beam_deflection_id])
    end

    def ensure_mutable_draft
      unless @beam_deflection.draft? && @beam_deflection.creator == Current.user
        render_error('You can only modify your own draft beam deflections', :forbidden)
      end
    end
  end
end
