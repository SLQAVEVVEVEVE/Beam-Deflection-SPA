import { useEffect, useState } from 'react'
import { Alert, Badge, Spinner } from 'react-bootstrap'
import { Link, useParams } from 'react-router-dom'
import { displayImage, fetchBeam, materialLabel } from '../services/api'
import type { Beam } from '../types'

export function BeamDetailPage() {
  const { id } = useParams()
  const numericId = Number(id)

  const [beam, setBeam] = useState<Beam | null>(null)
  const [source, setSource] = useState<'api' | 'mock'>('api')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!numericId) {
      setError('Некорректный идентификатор')
      setLoading(false)
      return
    }

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await fetchBeam(numericId)
        setBeam(result.beam)
        setSource(result.source)
      } catch (err) {
        setError((err as Error).message)
        setBeam(null)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [numericId])

  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" role="status" />
      </div>
    )
  }

  if (error || !beam) {
    return <Alert variant="danger">Не удалось загрузить балку: {error}</Alert>
  }

  return (
    <div className="page-container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="mb-0">{beam.name}</h3>
          <div className="text-muted">{materialLabel(beam.material)}</div>
        </div>
        {source === 'api' ? (
          <Badge bg="success">API через прокси</Badge>
        ) : (
          <Badge bg="warning" text="dark">
            Mock (API недоступен)
          </Badge>
        )}
      </div>

      <div className="detail-card">
        <div className="detail-image">
          <img src={displayImage(beam)} alt={beam.name} />
        </div>

        <div className="detail-grid text-center">
          <div>
            <div className="detail-label">Материал</div>
            <div className="detail-value">{materialLabel(beam.material)}</div>
          </div>
          <div>
            <div className="detail-label">Модуль упругости</div>
            <div className="detail-value">{beam.elasticity_gpa} ГПа</div>
          </div>
          <div>
            <div className="detail-label">Момент инерции</div>
            <div className="detail-value">{beam.inertia_cm4} см⁴</div>
          </div>
          <div>
            <div className="detail-label">Норма прогиба</div>
            <div className="detail-value">L/{beam.allowed_deflection_ratio ?? '-'}</div>
          </div>
        </div>

        <div className="mb-2 fw-semibold">Описание</div>
        <div className="mb-3">{beam.description || 'Нет описания'}</div>

        <div className="detail-actions">
          <Link to="/beams" className="btn btn-outline-light">
            Назад к типам
          </Link>
        </div>
      </div>
    </div>
  )
}
