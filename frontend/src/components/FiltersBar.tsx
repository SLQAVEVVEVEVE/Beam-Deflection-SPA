import { useEffect, useState } from 'react'
import { Button, Col, Form, Row } from 'react-bootstrap'
import type { BeamFilters } from '../types'

const MATERIAL_PRESETS: Record<string, { min: number; max: number }> = {
  steel: { min: 260, max: 320 },
  wooden: { min: 230, max: 280 },
  reinforced_concrete: { min: 360, max: 450 },
}

interface Props {
  filters: BeamFilters
  onChange: (filters: BeamFilters) => void
  onSubmit: () => void
  disabled?: boolean
  onReset?: () => void
}

type FormEl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

export function FiltersBar({ filters, onChange, onSubmit, disabled, onReset }: Props) {
  const [local, setLocal] = useState<BeamFilters>(filters)

  useEffect(() => {
    setLocal(filters)
  }, [filters])

  const updateLocal = (patch: Partial<BeamFilters>) => {
    setLocal((prev) => ({ ...prev, ...patch, page: 1 }))
  }

  const handleNumber =
    (key: keyof BeamFilters) =>
    (e: React.ChangeEvent<FormEl>): void => {
      const value = e.target.value
      updateLocal({ [key]: value ? Number(value) : undefined } as Partial<BeamFilters>)
    }

  const handleMaterial = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const material = e.target.value || undefined
    const preset = material ? MATERIAL_PRESETS[material] : undefined
    updateLocal({
      material,
      ratioMin: preset?.min ?? undefined,
      ratioMax: preset?.max ?? undefined,
    })
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const next = { ...local, page: 1 }
    onChange(next)
    onSubmit()
  }

  const reset = () => {
    if (onReset) {
      onReset()
      return
    }
    const cleared: BeamFilters = { perPage: filters.perPage || 12, page: 1 }
    setLocal(cleared)
    onChange(cleared)
    onSubmit()
  }

  return (
    <Form onSubmit={submit} className="mb-3 filters-bar">
      <Row className="gy-3 gx-3 align-items-end">
        <Col md={4}>
          <Form.Label className="filters-label">Материал</Form.Label>
          <Form.Select value={local.material || ''} onChange={handleMaterial}>
            <option value="">Все материалы</option>
            <option value="steel">Сталь</option>
            <option value="wooden">Дерево</option>
            <option value="reinforced_concrete">Железобетон</option>
          </Form.Select>
        </Col>
        <Col md={4}>
          <Form.Label className="filters-label">Соотношение L/прогиб (от)</Form.Label>
          <Form.Control
            type="number"
            placeholder="Например, 260"
            value={local.ratioMin ?? ''}
            onChange={handleNumber('ratioMin')}
          />
        </Col>
        <Col md={4}>
          <Form.Label className="filters-label">Соотношение L/прогиб (до)</Form.Label>
          <Form.Control
            type="number"
            placeholder="Например, 320"
            value={local.ratioMax ?? ''}
            onChange={handleNumber('ratioMax')}
          />
        </Col>
      </Row>
      <div className="filters-actions-row">
        <Button type="submit" variant="accent" className="filters-apply" disabled={disabled}>
          Применить
        </Button>
        <Button variant="outline-secondary" className="filters-reset" onClick={reset} disabled={disabled}>
          Сбросить
        </Button>
      </div>
    </Form>
  )
}
