import { useEffect, useState } from 'react'
import { Alert, Badge, Col, Form, InputGroup, Row, Spinner, Stack } from 'react-bootstrap'
import { BeamCard } from '../components/BeamCard'
import { FiltersBar, MATERIAL_PRESETS } from '../components/FiltersBar'
import { fetchBeams } from '../services/api'
import { applyFilters, resetFilters, selectAppliedFilters, selectCurrentFilters, setFilters } from '../store/filtersSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import type { Beam, BeamFilters } from '../types'

export function BeamsListPage() {
  const dispatch = useAppDispatch()
  const filters = useAppSelector(selectCurrentFilters)
  const appliedFilters = useAppSelector(selectAppliedFilters)

  const [beams, setBeams] = useState<Beam[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<'api' | 'mock'>('api')
  const [total, setTotal] = useState<number | undefined>()
  const [materialSearch, setMaterialSearch] = useState('')

  useEffect(() => {
    setMaterialSearch(filters.material || '')
  }, [filters.material])

  const load = async (activeFilters: BeamFilters) => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchBeams(activeFilters)
      setBeams(result.beams)
      setSource(result.source)
      setTotal(result.meta?.total_count ?? result.beams.length)
    } catch (err) {
      setError((err as Error).message)
      setBeams([])
      setSource('mock')
      setTotal(undefined)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(appliedFilters)
  }, [appliedFilters])

  const submitFilters = () => {
    dispatch(applyFilters())
  }

  const updateFilters = (next: BeamFilters) => {
    dispatch(setFilters(next))
  }

  const findMaterialCode = (value: string) => {
    const normalized = value.trim().toLowerCase()
    if (!normalized) return undefined
    if (normalized.includes('ст') || normalized.includes('steel')) return 'steel'
    if (normalized.includes('дер') || normalized.includes('wood')) return 'wooden'
    if (normalized.includes('жб') || normalized.includes('ж/б') || normalized.includes('железобет') || normalized.includes('concrete'))
      return 'reinforced_concrete'
    return undefined
  }

  const applyMaterialSearch = () => {
    const code = findMaterialCode(materialSearch)
    const preset = code ? MATERIAL_PRESETS[code] : undefined
    const updated: BeamFilters = {
      ...filters,
      material: code,
      ratioMin: preset?.min,
      ratioMax: preset?.max,
      page: 1,
    }
    dispatch(setFilters(updated))
    dispatch(applyFilters(updated))
  }

  const handleReset = () => {
    setMaterialSearch('')
    dispatch(resetFilters())
    dispatch(applyFilters({ perPage: 12, page: 1 }))
  }

  return (
    <Stack gap={2} className="page-container">
      <div className="section-title d-flex align-items-center justify-content-center gap-2 flex-wrap">
        <span>Типы балок</span>
        <Badge bg="secondary" pill>
          {total ?? '...'}
        </Badge>
      </div>

      <div className="search-bar">
        <InputGroup>
          <Form.Control
            placeholder="Материал (Сталь, Дерево, ЖБ)"
            value={materialSearch}
            onChange={(e) => setMaterialSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyMaterialSearch()}
          />
          <button className="btn btn-search" type="button" onClick={applyMaterialSearch} disabled={loading}>
            Найти
          </button>
        </InputGroup>
      </div>

      <FiltersBar filters={filters} onChange={updateFilters} onSubmit={submitFilters} onReset={handleReset} disabled={loading} />

      {error && <Alert variant="danger">Не удалось загрузить данные: {error}</Alert>}

      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div className="text-muted">
          Показано {beams.length} / {total ?? '—'}
        </div>
        <Badge bg={source === 'api' ? 'success' : 'warning'} text={source === 'api' ? undefined : 'dark'}>
          {source === 'api' ? 'API' : 'Mock'} источник
        </Badge>
      </div>

      {loading ? (
        <div className="text-center py-4">
          <Spinner animation="border" role="status" />
        </div>
      ) : beams.length === 0 ? (
        <Alert variant="info">Нет балок по заданным фильтрам.</Alert>
      ) : (
        // Настройка адаптива: 1 колонка <768px, 2 колонки 768–1199px, 3 колонки ≥1200px
        <Row xs={1} md={2} xl={3} className="g-3">
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
