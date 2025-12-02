import type { Beam } from '../types'

export const mockBeams: Beam[] = [
  {
    id: 1,
    name: 'Wooden Beam 50x150',
    material: 'wooden',
    elasticity_gpa: 12,
    inertia_cm4: 1500,
    allowed_deflection_ratio: 250,
    image_url: 'http://localhost:9000/beam-deflection/wooden-beam.jpg',
    created_at: '2024-10-01T10:00:00Z',
  },
  {
    id: 2,
    name: 'Steel Beam 100x200',
    material: 'steel',
    elasticity_gpa: 200,
    inertia_cm4: 3500,
    allowed_deflection_ratio: 300,
    image_url: 'http://localhost:9000/beam-deflection/steel-beam.jpg',
    created_at: '2024-10-05T10:00:00Z',
  },
  {
    id: 3,
    name: 'Reinforced Concrete 120x300',
    material: 'reinforced_concrete',
    elasticity_gpa: 32,
    inertia_cm4: 8200,
    allowed_deflection_ratio: 400,
    image_url: null,
    created_at: '2024-11-12T08:00:00Z',
  },
  {
    id: 4,
    name: 'Steel Beam Slim 80x160',
    material: 'steel',
    elasticity_gpa: 190,
    inertia_cm4: 2600,
    allowed_deflection_ratio: 280,
    image_url: null,
    created_at: '2024-11-20T12:00:00Z',
  },
]
