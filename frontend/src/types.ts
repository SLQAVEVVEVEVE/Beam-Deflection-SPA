export interface Beam {
  id: number
  name: string
  material: string
  elasticity_gpa: number
  inertia_cm4: number
  allowed_deflection_ratio?: number | null
  image_url?: string | null
  image_key?: string | null
  description?: string | null
  created_at?: string
  updated_at?: string
}

export interface BeamsResponse {
  beams: Beam[]
  meta?: {
    current_page?: number
    total_count?: number
    per_page?: number
  }
  source: 'api' | 'mock'
}

export interface BeamFilters {
  name?: string
  material?: string
  elasticityMin?: number
  elasticityMax?: number
  inertiaMin?: number
  inertiaMax?: number
  ratioMin?: number
  ratioMax?: number
  createdFrom?: string
  createdTo?: string
  page?: number
  perPage?: number
}
