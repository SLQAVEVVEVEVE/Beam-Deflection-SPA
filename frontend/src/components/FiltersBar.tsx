import { useEffect, useState } from 'react'
import { Button, Col, Form, Row } from 'react-bootstrap'
import type { BeamFilters } from '../types'

interface Props {
  filters: BeamFilters
  onChange: (filters: BeamFilters) => void
  onSubmit: () => void
  disabled?: boolean
}

type FormEl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

export function FiltersBar({ filters, onChange, onSubmit, disabled }: Props) {
  const [local, setLocal] = useState<BeamFilters>(filters)

  useEffect(() => {
    setLocal(filters)
  }, [filters])

  const handleInput =
    (key: keyof BeamFilters) =>
    (e: React.ChangeEvent<FormEl>): void => {
      const value = e.target.value
      setLocal((prev) => ({ ...prev, [key]: value ? value : undefined }))
    }

  const handleNumber =
    (key: keyof BeamFilters) =>
    (e: React.ChangeEvent<FormEl>): void => {
      const value = e.target.value
      setLocal((prev) => ({ ...prev, [key]: value ? Number(value) : undefined }))
    }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    onChange(local)
    onSubmit()
  }

  return (
    <Form onSubmit={submit} className="mb-3">
      <Row className="gy-2">
        <Col md={3}>
          <Form.Control placeholder="Название" value={local.name || ''} onChange={handleInput('name')} />
        </Col>
        <Col md={2}>
          <Form.Select value={local.material || ''} onChange={handleInput('material')}>
            <option value="">Материал</option>
            <option value="wooden">Wooden</option>
            <option value="steel">Steel</option>
            <option value="reinforced_concrete">Reinforced concrete</option>
          </Form.Select>
        </Col>
        <Col md={2}>
          <Form.Control
            type="number"
            placeholder="E, GPa мин"
            value={local.elasticityMin ?? ''}
            onChange={handleNumber('elasticityMin')}
          />
        </Col>
        <Col md={2}>
          <Form.Control
            type="number"
            placeholder="E, GPa макс"
            value={local.elasticityMax ?? ''}
            onChange={handleNumber('elasticityMax')}
          />
        </Col>
        <Col md={2}>
          <Form.Control
            type="number"
            placeholder="J, cm⁴ мин"
            value={local.inertiaMin ?? ''}
            onChange={handleNumber('inertiaMin')}
          />
        </Col>
        <Col md={2}>
          <Form.Control
            type="number"
            placeholder="J, cm⁴ макс"
            value={local.inertiaMax ?? ''}
            onChange={handleNumber('inertiaMax')}
          />
        </Col>
      </Row>
      <Row className="gy-2 mt-1">
        <Col md={2}>
          <Form.Control
            type="number"
            placeholder="L/ratio мин"
            value={local.ratioMin ?? ''}
            onChange={handleNumber('ratioMin')}
          />
        </Col>
        <Col md={2}>
          <Form.Control
            type="number"
            placeholder="L/ratio макс"
            value={local.ratioMax ?? ''}
            onChange={handleNumber('ratioMax')}
          />
        </Col>
        <Col md={2}>
          <Form.Control type="date" value={local.createdFrom || ''} onChange={handleInput('createdFrom')} />
        </Col>
        <Col md={2}>
          <Form.Control type="date" value={local.createdTo || ''} onChange={handleInput('createdTo')} />
        </Col>
        <Col md={2}>
          <Button type="submit" variant="primary" className="w-100" disabled={disabled}>
            Применить
          </Button>
        </Col>
      </Row>
    </Form>
  )
}
