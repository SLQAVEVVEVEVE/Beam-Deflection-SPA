import { Link } from 'react-router-dom'
import { displayImage, materialLabel } from '../services/api'
import type { Beam } from '../types'

interface Props {
  beam: Beam
}

const FALLBACK_IMG = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='140' viewBox='0 0 200 140'><rect width='200' height='140' fill='%23e9ecef'/><rect x='35' y='25' width='130' height='90' fill='none' stroke='%23c0c4c9' stroke-width='3' stroke-dasharray='6 6'/><text x='100' y='75' text-anchor='middle' fill='%237a828c' font-family='Arial, sans-serif' font-size='12'>Нет изображения</text></svg>`

export function BeamCard({ beam }: Props) {
  const src = displayImage(beam) || FALLBACK_IMG

  return (
    <div className="beam-card">
      <div className="beam-image">
        <img
          src={src}
          alt={beam.name}
          onError={(e) => {
            if (e.currentTarget.src !== FALLBACK_IMG) {
              e.currentTarget.src = FALLBACK_IMG
            }
          }}
        />
      </div>
      <div>
        <h5>{beam.name}</h5>
        <div className="beam-meta">
          <div>Материал: {materialLabel(beam.material)}</div>
          <div>
            Норма: L/{beam.allowed_deflection_ratio ?? '-'} · E = {beam.elasticity_gpa} ГПа · I = {beam.inertia_cm4} см⁴
          </div>
        </div>
        <div className="beam-actions single">
          <Link to={`/beams/${beam.id}`} className="btn btn-outline-light beam-btn">
            Подробнее
          </Link>
        </div>
      </div>
    </div>
  )
}
