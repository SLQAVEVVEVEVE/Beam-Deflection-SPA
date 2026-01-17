Rails.application.routes.draw do
  mount Rswag::Api::Engine => '/api-json'
  mount Rswag::Ui::Engine => '/api-docs'

  # API routes
  namespace :api do
    # Beam domain
    resources :beams, only: [:index, :show, :create, :update, :destroy] do
      member do
        post :add_to_draft
        post :image
      end
    end

    # BeamDeflections utility endpoints
    get 'beam_deflections/cart_badge', to: 'beam_deflections/cart_badge#cart_badge'

    # BeamDeflection domain
    resources :beam_deflections, only: [:index, :show, :update, :destroy] do
      member do
        put :form
        put :complete
        put :reject
        post :async_result
      end

      # m-m operations by beam_id (without PK m-m)
      resource :items, only: [], controller: 'beam_deflection_items' do
        put :update_item
        delete :remove_item
      end
    end

    # Auth / Me (simple, minimal)
    namespace :auth do
      post :sign_in
      post :sign_out
      post :sign_up
    end

    resource :me, only: [:show, :update], controller: 'me'
    # Explicit aliases for current user endpoints
    get 'me', to: 'me#show'
    put 'me', to: 'me#update'
  end

  # Web routes
  root "beams#index"
  resources :beams, only: [:index, :show]
  resources :orders, only: [:show] do
    member do
      post :complete
    end
  end
  
  resource  :cart, only: [:show], controller: "carts" do
    resources :items, only: [:create], controller: "cart_items"
    post :delete, to: "carts#delete"
  end

  # Health check
  get "up" => "rails/health#show", as: :rails_health_check
end
