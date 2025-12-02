import { useEffect, useState } from 'react'
import { Alert, Col, Form, InputGroup, Row, Spinner, Stack } from 'react-bootstrap'
import { BeamCard } from '../components/BeamCard'
import { fetchBeams } from '../services/api'
import type { Beam, BeamFilters } from '../types'

export function BeamsListPage() {
  const [filters, setFilters] = useState<BeamFilters>({ perPage: 12 })
  const [beams, setBeams] = useState<Beam[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchBeams(filters)
      setBeams(result.beams)
    } catch (err) {
      setError((err as Error).message)
      setBeams([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Stack gap={2} className="page-container">
      <div className="section-title">Типы балок</div>

      <div className="search-bar">
        <InputGroup>
          <Form.Control
            placeholder="Поиск по названию, материалу..."
            value={filters.name || ''}
            onChange={(e) => setFilters((prev) => ({ ...prev, name: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && load()}
          />
          <button className="btn btn-search" type="button" onClick={load} disabled={loading}>
            Найти
          </button>
        </InputGroup>
      </div>

      {error && <Alert variant="danger">Не удалось загрузить данные: {error}</Alert>}

      {loading ? (
        <div className="text-center py-4">
          <Spinner animation="border" role="status" />
        </div>
      ) : beams.length === 0 ? (
        <Alert variant="info">Нет балок по заданным фильтрам.</Alert>
      ) : (
        <Row xs={1} md={2} className="g-3">
          {beams.map((beam) => (
            <Col key={beam.id}>
              <BeamCard beam={beam} />
            </Col>
          ))}
        </Row>
      )}
    </Stack>
  )
}