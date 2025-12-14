import { useEffect, useState } from 'react'
import { Alert, Col, Form, InputGroup, Row, Spinner, Stack } from 'react-bootstrap'
import { BeamCard } from '../components/BeamCard'
import { FloatingCart } from '../components/FloatingCart'
import { fetchBeams } from '../services/api'
import { fetchCartItemsCount } from '../services/cartBadge'
import { isAuthenticated } from '../services/auth'
import { withWebOrigin } from '../services/webOrigin'
import { applyFilters, selectAppliedFilters, selectCurrentFilters, setFilters } from '../store/filtersSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import type { Beam } from '../types'

export function BeamsListPage() {
  const dispatch = useAppDispatch()
  const currentFilters = useAppSelector(selectCurrentFilters)
  const appliedFilters = useAppSelector(selectAppliedFilters)

  const [beams, setBeams] = useState<Beam[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cartItemsCount, setCartItemsCount] = useState(0)

  useEffect(() => {
    let cancelled = false

    const loadBeams = async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await fetchBeams(appliedFilters)
        if (!cancelled) setBeams(result.beams)
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message)
          setBeams([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadBeams()

    return () => {
      cancelled = true
    }
  }, [appliedFilters])

  useEffect(() => {
    let cancelled = false

    const loadBadge = async () => {
      const count = await fetchCartItemsCount()
      if (!cancelled) setCartItemsCount(count)
    }

    if (isAuthenticated()) {
      loadBadge()
    }

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Stack gap={2} className="page-container">
      <div className="section-title">Типы балок</div>

      <div className="search-bar">
        <InputGroup>
          <Form.Control
            placeholder="Поиск по названию, материалу..."
            value={currentFilters.name || ''}
            onChange={(e) => dispatch(setFilters({ name: e.target.value, page: 1 }))}
            onKeyDown={(e) => e.key === 'Enter' && dispatch(applyFilters(undefined))}
          />
          <button
            className="btn btn-search"
            type="button"
            onClick={() => dispatch(applyFilters(undefined))}
            disabled={loading}
          >
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

      <FloatingCart href={withWebOrigin('/cart')} count={cartItemsCount} disabled={!isAuthenticated()} />
    </Stack>
  )
}
