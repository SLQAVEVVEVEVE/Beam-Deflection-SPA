import { mockBeams } from '../data/mockBeams'
import type { Beam, BeamFilters, BeamsResponse } from '../types'

const API_BASE = '/api'

const DEFAULT_PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="360" viewBox="0 0 600 360" preserveAspectRatio="xMidYMid meet"><rect width="600" height="360" fill="%23f4f6f8"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23808b96" font-family="Arial" font-size="20">No image</text></svg>'

const MINIO_PUBLIC = import.meta.env.VITE_MINIO_PUBLIC || 'http://localhost:9000/beam-deflection/'

const MATERIAL_LABELS: Record<string, string> = {
  wooden: 'Деревянная',
  steel: 'Стальная',
  reinforced_concrete: 'Железобетонная',
}

export function displayImage(beam?: Beam | null) {
  if (!beam) return DEFAULT_PLACEHOLDER

  const url = beam.image_url || beam.image_key
  if (!url) return DEFAULT_PLACEHOLDER

  if (/^https?:\/\//i.test(url)) return url

  return `${MINIO_PUBLIC}${url.replace(/^\//, '')}`
}

export function materialLabel(material?: string) {
  return MATERIAL_LABELS[material ?? ''] || material || '—'
}

function buildQuery(filters: BeamFilters) {
  const params = new URLSearchParams()
  if (filters.name) params.set('name', filters.name)
  if (filters.material) params.set('material', filters.material)
  if (filters.elasticityMin != null) params.set('elasticity_gpa_min', String(filters.elasticityMin))
  if (filters.elasticityMax != null) params.set('elasticity_gpa_max', String(filters.elasticityMax))
  if (filters.inertiaMin != null) params.set('inertia_cm4_min', String(filters.inertiaMin))
  if (filters.inertiaMax != null) params.set('inertia_cm4_max', String(filters.inertiaMax))
  if (filters.ratioMin != null) params.set('allowed_deflection_ratio_min', String(filters.ratioMin))
  if (filters.ratioMax != null) params.set('allowed_deflection_ratio_max', String(filters.ratioMax))
  if (filters.createdFrom) params.set('created_from', filters.createdFrom)
  if (filters.createdTo) params.set('created_to', filters.createdTo)
  if (filters.page) params.set('page', String(filters.page))
  if (filters.perPage) params.set('per_page', String(filters.perPage))
  return params.toString()
}

function withinRange(value: number, min?: number, max?: number) {
  if (min != null && value < min) return false
  if (max != null && value > max) return false
  return true
}

function filterMock(filters: BeamFilters): BeamsResponse {
  const filtered = mockBeams.filter((beam) => {
    const createdAt = beam.created_at ? new Date(beam.created_at) : null
    const createdFrom = filters.createdFrom ? new Date(filters.createdFrom) : null
    const createdTo = filters.createdTo ? new Date(filters.createdTo) : null

    if (filters.name && !beam.name.toLowerCase().includes(filters.name.toLowerCase())) return false
    if (filters.material && beam.material !== filters.material) return false
    if (!withinRange(beam.elasticity_gpa, filters.elasticityMin, filters.elasticityMax)) return false
    if (!withinRange(beam.inertia_cm4, filters.inertiaMin, filters.inertiaMax)) return false
    if (filters.ratioMin != null || filters.ratioMax != null) {
      if (beam.allowed_deflection_ratio == null) return false
      if (!withinRange(beam.allowed_deflection_ratio, filters.ratioMin, filters.ratioMax)) return false
    }

    if (createdAt) {
      if (createdFrom && createdAt < createdFrom) return false
      if (createdTo && createdAt > createdTo) return false
    }

    return true
  })

  return {
    beams: filtered,
    meta: { current_page: 1, total_count: filtered.length, per_page: filtered.length },
    source: 'mock',
  }
}

export async function fetchBeams(filters: BeamFilters): Promise<BeamsResponse> {
  const query = buildQuery(filters)
  const url = `${API_BASE}/beams${query ? `?${query}` : ''}`

  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`API error: ${response.status}`)
    const data = await response.json()
    return { beams: data.beams ?? data.data ?? [], meta: data.meta, source: 'api' }
  } catch (error) {
    console.warn('Falling back to mock data', error)
    return filterMock(filters)
  }
}

export async function fetchBeam(id: number): Promise<{ beam: Beam; source: 'api' | 'mock' }> {
  try {
    const response = await fetch(`${API_BASE}/beams/${id}`)
    if (!response.ok) throw new Error(`API error: ${response.status}`)
    const data = await response.json()
    return { beam: data.beam ?? data, source: 'api' }
  } catch (error) {
    console.warn('Falling back to mock beam', error)
    const beam = mockBeams.find((b) => b.id === id)
    if (!beam) throw new Error('Beam not found in mock data')
    return { beam, source: 'mock' }
  }
}