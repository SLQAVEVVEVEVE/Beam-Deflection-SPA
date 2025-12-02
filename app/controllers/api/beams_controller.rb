module Api
  class BeamsController < BaseController
    include MinioHelper
    before_action :set_beam, only: [:show, :update, :destroy, :add_to_draft, :image]
    before_action :require_auth!, except: [:index, :show]
    before_action :require_moderator!, only: [:create, :update, :destroy, :image]
    
    def index
      # default: only active services; pass active=false to include inactive
      beams = Beam.all
      beams = beams.available unless params.key?(:active) && ActiveModel::Type::Boolean.new.cast(params[:active]) == false
      beams = beams.search(params[:q]) if beams.respond_to?(:search)
      beams = beams.order(created_at: :desc)
      
      # Safely handle pagination
      page = [params[:page].to_i, 1].max
      per_page_param = params[:per_page].to_i
      per_page = per_page_param.positive? ? [per_page_param, 100].min : 20
      
      # Paginate the query
      paginated_beams = beams.page(page).per(per_page)
      
      render json: {
        beams: paginated_beams,
        meta: {
          current_page: paginated_beams.current_page,
          next_page: paginated_beams.next_page,
          prev_page: paginated_beams.prev_page,
          total_pages: paginated_beams.total_pages,
          total_count: paginated_beams.total_count
        }
      }
    end
    
    def show
      render json: @beam.as_json(methods: [:image_url])
    end
    
    def create
      @beam = Beam.new(beam_params)
      
      if @beam.save
        render json: @beam, status: :created
      else
        render_error(@beam.errors.full_messages, :unprocessable_entity)
      end
    end
    
    def update
      if @beam.update(beam_params)
        render json: @beam
      else
        render_error(@beam.errors.full_messages, :unprocessable_entity)
      end
    end
    
    def destroy
      # Delete image from Minio if exists
      MinioHelper.delete_object(@beam.image_key) if @beam.image_key.present?
      @beam.destroy!
      head :no_content
    rescue => e
      render_error(@beam.errors.full_messages.presence || e.message, :unprocessable_entity)
    end
    
    def add_to_draft
      beam_deflection = BeamDeflection.ensure_draft_for(Current.user)
      qty = params[:quantity].to_i
      qty = 1 if qty <= 0

      item = beam_deflection.beam_deflection_beams.find_or_initialize_by(beam_id: @beam.id)
      item.quantity = (item.quantity || 0) + qty
      item.position ||= beam_deflection.beam_deflection_beams.maximum(:position).to_i + 1

      if item.save
        render json: { beam_deflection_id: beam_deflection.id, items_count: beam_deflection.beam_deflection_beams.sum(:quantity) }
      else
        render_error(item.errors.full_messages, :unprocessable_entity)
      end
    end
    
    def image
      upload = params[:file] || params[:image]
      return render_error('No file provided', :unprocessable_entity) unless upload.is_a?(ActionDispatch::Http::UploadedFile)

      return render_error('Invalid file type. Only images are allowed.', :unprocessable_entity) unless upload.content_type.to_s.start_with?('image/')

      extension = File.extname(upload.original_filename).downcase
      filename = "#{@beam.name.to_s.parameterize}-#{SecureRandom.uuid}#{extension}"

      begin
        minio_delete(@beam.image_key) if @beam.image_key.present?
        image_key = minio_upload(upload, key: filename, content_type: upload.content_type)

        if @beam.update(image_key: image_key)
          render json: { image_url: minio_image_url(image_key), image_key: image_key }
        else
          minio_delete(image_key) rescue nil
          render_error(@beam.errors.full_messages, :unprocessable_entity)
        end
      rescue => e
        Rails.logger.error("Error uploading image: #{e.message}")
        render_error('Failed to upload image', :unprocessable_entity)
      end
    end
    
    private
    
    def set_beam
      @beam = Beam.find(params[:id])
    rescue ActiveRecord::RecordNotFound
      render_error('Beam not found', :not_found)
    end
    
    def beam_params
      params.require(:beam).permit(
        :name, 
        :description, 
        :material, 
        :elasticity_gpa, 
        :inertia_cm4,
        :allowed_deflection_ratio,
        :active
      )
    end
  end
end
