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

export type User = {
  id: number
  email: string
  moderator: boolean
}

export type BeamDeflectionStatus = 'draft' | 'formed' | 'completed' | 'rejected' | 'deleted'

export type BeamDeflectionItem = {
  beam_id: number
  beam_name?: string
  beam_material?: string
  beam_image_url?: string | null
  quantity: number
  length_m?: number | null
  udl_kn_m?: number | null
  position?: number
  deflection_mm?: number | null
}

export type BeamDeflection = {
  id: number
  status: BeamDeflectionStatus
  note?: string | null
  formed_at?: string | null
  completed_at?: string | null
  creator_login?: string | null
  moderator_login?: string | null
  result_deflection_mm?: number | null
  within_norm?: boolean | null
  items: BeamDeflectionItem[]
}

export type BeamDeflectionListItem = Omit<BeamDeflection, 'items'> & {
  items_with_result_count?: number | null
  item_deflections_mm?: number[] | null
  items_count?: number | null
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
