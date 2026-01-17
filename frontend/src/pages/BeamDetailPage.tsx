import { useEffect, useMemo, useState } from 'react'
import { Alert, Badge, ProgressBar, Spinner } from 'react-bootstrap'
import { Link, useParams } from 'react-router-dom'
import { useBeamSimilarBeams } from '../hooks/useBeamSimilarBeams'
import { displayImage, fetchBeam, fetchBeams, materialLabel } from '../services/api'
import type { Beam } from '../types'

const SIMILAR_LIMIT = 4

export function BeamDetailPage() {
  const { id } = useParams()
  const numericId = Number(id)

  const [beam, setBeam] = useState<Beam | null>(null)
  const [source, setSource] = useState<'api' | 'mock'>('api')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [catalogBeams, setCatalogBeams] = useState<Beam[]>([])
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [catalogError, setCatalogError] = useState<string | null>(null)

  useEffect(() => {
    if (!numericId) {
      setError('Некорректный идентификатор балки')
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

  useEffect(() => {
    if (!numericId) return

    let isActive = true

    const loadCatalog = async () => {
      setCatalogLoading(true)
      setCatalogError(null)
      try {
        const result = await fetchBeams({ page: 1, perPage: 100 })
        if (!isActive) return
        setCatalogBeams(result.beams)
      } catch {
        if (!isActive) return
        setCatalogError('Не удалось загрузить список балок для сравнения.')
        setCatalogBeams([])
      } finally {
        if (isActive) setCatalogLoading(false)
      }
    }

    loadCatalog()

    return () => {
      isActive = false
    }
  }, [numericId])

  const comparisonPool = useMemo(() => {
    if (!beam) return catalogBeams
    const hasCurrent = catalogBeams.some((item) => item.id === beam.id)
    return hasCurrent ? catalogBeams : [beam, ...catalogBeams]
  }, [beam, catalogBeams])

  const { similarBeams, ready: similarReady, progress: similarProgress, error: similarError } = useBeamSimilarBeams(
    beam,
    comparisonPool,
  )
  const topSimilarBeams = useMemo(() => similarBeams.slice(0, SIMILAR_LIMIT), [similarBeams])
  const hasSimilarData = comparisonPool.length > 1
  const isSimilarLoading = catalogLoading || (hasSimilarData && !similarReady)

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
            Тестовые данные (API недоступен)
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
            <div className="detail-value">{beam.inertia_cm4} см^4</div>
          </div>
          <div>
            <div className="detail-label">Допустимое соотношение</div>
            <div className="detail-value">
              {beam.allowed_deflection_ratio ? `L/${beam.allowed_deflection_ratio}` : '—'}
            </div>
          </div>
        </div>

        <div className="mb-2 fw-semibold">Описание</div>
        <div className="mb-3">{beam.description || 'Описание отсутствует'}</div>

        <div className="detail-actions">
          <Link to="/beams" className="btn btn-outline-light">
            Назад к списку
          </Link>
        </div>
      </div>

      <section className="similar-section">
        <div className="similar-section__header">
          <div>
            <div className="similar-section__title">Похожие балки</div>
            <div className="similar-section__subtitle">Подбор по близости описаний</div>
          </div>
        </div>

        {catalogError && <Alert variant="warning">{catalogError}</Alert>}
        {similarError && <Alert variant="warning">{similarError}</Alert>}

        {isSimilarLoading ? (
          <div className="similar-section__loading">
            <Spinner animation="border" size="sm" role="status" />
            <span>Подбираем похожие балки...</span>
            {similarProgress > 0 && (
              <ProgressBar now={Math.round(similarProgress)} label={`${Math.round(similarProgress)}%`} animated />
            )}
          </div>
        ) : !hasSimilarData ? (
          <div className="text-muted">Недостаточно данных для подбора похожих балок.</div>
        ) : topSimilarBeams.length === 0 ? (
          <div className="text-muted">Похожие балки не найдены.</div>
        ) : (
          <div className="similar-grid">
            {topSimilarBeams.map((item) => (
              <Link key={item.id} to={`/beams/${item.id}`} className="similar-card">
                <div className="similar-card__image">
                  <img src={displayImage(item)} alt={item.name} />
                </div>
                <div className="similar-card__content">
                  <div className="similar-card__title">{item.name}</div>
                  <div className="similar-card__meta">Материал: {materialLabel(item.material)}</div>
                  <div className="similar-card__meta">
                    E = {item.elasticity_gpa} ГПа · I = {item.inertia_cm4} см^4
                  </div>
                  <div className="similar-card__score">Сходство: {(item.score * 100).toFixed(1)}%</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
