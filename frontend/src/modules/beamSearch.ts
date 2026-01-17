import type { Beam } from '../types'

const MATERIAL_LABELS_EN: Record<string, string> = {
  wooden: 'wooden',
  steel: 'steel',
  reinforced_concrete: 'reinforced concrete',
  concrete: 'concrete',
  aluminum: 'aluminum',
  composite: 'composite',
}

export type BeamSearchEntry = {
  id: number
  description: string
}

const formatNumber = (value?: number | null, unit?: string) => {
  if (value == null || !Number.isFinite(value)) return null
  return unit ? `${value} ${unit}` : String(value)
}

export const buildBeamSearchEntry = (beam: Beam): BeamSearchEntry => {
  const material = MATERIAL_LABELS_EN[beam.material] ?? 'structural'
  const elasticity = formatNumber(beam.elasticity_gpa, 'GPa')
  const inertia = formatNumber(beam.inertia_cm4, 'cm4')
  const parts = [
    `${material} beam`,
    elasticity ? `elasticity ${elasticity}` : null,
    inertia ? `inertia ${inertia}` : null,
    beam.allowed_deflection_ratio ? `deflection ratio L/${beam.allowed_deflection_ratio}` : null,
  ]

  const description = parts.filter(Boolean).join(', ')
  return {
    id: beam.id,
    description: description || 'structural beam for deflection analysis',
  }
}
