import { useEffect, useRef, useState } from 'react'
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { materialLabel } from '../services/api'
import { bootstrapAuthAsync, selectAuthUser, selectIsAuthenticated } from '../store/authSlice'
import { completeBeamDeflectionAsync, rejectBeamDeflectionAsync } from '../store/requestsSlice'
import {
  deleteBeamDeflectionDraftAsync,
  fetchBeamDeflectionDraftBadgeAsync,
  formBeamDeflectionDraftAsync,
  loadBeamDeflectionDraftAsync,
  pollBeamDeflectionDraftAsync,
  removeBeamDeflectionDraftItemAsync,
  selectCurrentBeamDeflection,
  selectDraftError,
  selectDraftLoading,
  selectDraftUpdatingItemIds,
  updateBeamDeflectionDraftFieldsAsync,
  updateBeamDeflectionDraftItemAsync,
} from '../store/draftSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'

const FALLBACK_IMG = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='140' viewBox='0 0 200 140'><rect width='200' height='140' fill='%23e9ecef'/><rect x='35' y='25' width='130' height='90' fill='none' stroke='%23c0c4c9' stroke-width='3' stroke-dasharray='6 6'/><text x='100' y='75' text-anchor='middle' fill='%237a828c' font-family='Arial, sans-serif' font-size='12'>Нет изображения</text></svg>`

const MINIO_PUBLIC = (import.meta.env.VITE_MINIO_PUBLIC || 'http://localhost:9000/beam-deflection/').replace(/\/?$/, '/')
const POLL_INTERVAL_MS = 3000

const statusLabel: Record<string, string> = {
  draft: 'Черновик',
  formed: 'Сформирована',
  completed: 'Завершена',
  rejected: 'Отклонена',
  deleted: 'Удалена',
}

function displayItemImage(raw?: string | null) {
  if (!raw) return FALLBACK_IMG
  if (/^https?:\/\//i.test(raw)) return raw
  return `${MINIO_PUBLIC}${raw.replace(/^\//, '')}`
}

export function RequestPage() {
  const { id } = useParams()
  const requestId = Number(id)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const isAuthed = useAppSelector(selectIsAuthenticated)
  const user = useAppSelector(selectAuthUser)
  const loading = useAppSelector(selectDraftLoading)
  const error = useAppSelector(selectDraftError)
  const request = useAppSelector(selectCurrentBeamDeflection)
  const updatingItemIds = useAppSelector(selectDraftUpdatingItemIds)
  const isModerator = Boolean(user?.moderator)

  useEffect(() => {
    if (!isAuthed) return
    dispatch(bootstrapAuthAsync())
  }, [dispatch, isAuthed])

  const [lengthsM, setLengthsM] = useState<Record<number, string>>({})
  const [udlKnM, setUdlKnM] = useState<Record<number, string>>({})
  const [note, setNote] = useState<string>('')
  const [quantities, setQuantities] = useState<Record<number, string>>({})
  const [localError, setLocalError] = useState<string | null>(null)
  const [moderatorAction, setModeratorAction] = useState<'complete' | 'reject' | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const pollInFlightRef = useRef<{ abort: () => void } | null>(null)

  useEffect(() => {
    if (!isAuthed) return
    if (!Number.isFinite(requestId) || requestId <= 0) return
    dispatch(loadBeamDeflectionDraftAsync(requestId))
  }, [dispatch, isAuthed, requestId])

  const shouldPoll = request?.status === 'completed' && request?.result_deflection_mm == null

  useEffect(() => {
    if (!isAuthed) return
    if (!Number.isFinite(requestId) || requestId <= 0) return
    if (!shouldPoll) return

    const pollOnce = () => {
      pollInFlightRef.current?.abort()
      const action = dispatch(pollBeamDeflectionDraftAsync(requestId))
      pollInFlightRef.current = action as unknown as { abort: () => void }
    }

    pollOnce()
    const intervalId = window.setInterval(pollOnce, POLL_INTERVAL_MS)

    return () => {
      window.clearInterval(intervalId)
      pollInFlightRef.current?.abort()
    }
  }, [dispatch, isAuthed, requestId, shouldPoll])

  useEffect(() => {
    if (!request || request.id !== requestId) return
    setNote(request.note ?? '')
    setQuantities(
      Object.fromEntries(request.items.map((item) => [item.beam_id, String(item.quantity ?? 1)])) as Record<number, string>,
    )
    setLengthsM(
      Object.fromEntries(
        request.items.map((item) => [item.beam_id, item.length_m != null ? String(item.length_m) : '']),
      ) as Record<number, string>,
    )
    setUdlKnM(
      Object.fromEntries(
        request.items.map((item) => [item.beam_id, item.udl_kn_m != null ? String(item.udl_kn_m) : '']),
      ) as Record<number, string>,
    )
  }, [request, requestId])

  const requestItems = request?.items ?? []
  const isDraft = request?.status === 'draft'
  const canEdit = Boolean(isDraft)
  const canDelete = request != null && request.status !== 'deleted'

  const canForm =
    isDraft &&
    requestItems.length > 0 &&
    requestItems.every((item) => {
      const length = Number(lengthsM[item.beam_id] ?? '')
      const udl = Number(udlKnM[item.beam_id] ?? '')
      return Number.isFinite(length) && length > 0 && Number.isFinite(udl) && udl >= 0
    })

  if (!isAuthed) return <Navigate to="/login" replace />

  if (!Number.isFinite(requestId) || requestId <= 0) {
    return (
      <div className="page-container">
        <Alert variant="danger">Некорректный id заявки</Alert>
      </div>
    )
  }

  const saveNote = async () => {
    setLocalError(null)
    await dispatch(updateBeamDeflectionDraftFieldsAsync({ id: requestId, note })).unwrap()
    return true
  }

  const toErrorMessage = (err: unknown): string => {
    if (typeof err === 'string') return err
    if (err instanceof Error) return err.message
    return 'Не удалось выполнить запрос'
  }

  const onModeratorComplete = async () => {
    setLocalError(null)
    setModeratorAction('complete')
    try {
      await dispatch(completeBeamDeflectionAsync(requestId)).unwrap()
      await dispatch(pollBeamDeflectionDraftAsync(requestId)).unwrap()
    } catch (e) {
      setLocalError(toErrorMessage(e))
    } finally {
      setModeratorAction(null)
    }
  }

  const onModeratorReject = async () => {
    setLocalError(null)
    setModeratorAction('reject')
    try {
      await dispatch(rejectBeamDeflectionAsync(requestId)).unwrap()
      await dispatch(pollBeamDeflectionDraftAsync(requestId)).unwrap()
    } catch (e) {
      setLocalError(toErrorMessage(e))
    } finally {
      setModeratorAction(null)
    }
  }

  const saveItemFields = async (beamId: number) => {
    if (!canEdit) return true
    setLocalError(null)

    const lengthRaw = lengthsM[beamId] ?? ''
    const udlRaw = udlKnM[beamId] ?? ''

    const nextLength = lengthRaw === '' ? null : Number(lengthRaw)
    const nextUdl = udlRaw === '' ? null : Number(udlRaw)

    if (nextLength == null || !Number.isFinite(nextLength) || nextLength <= 0) {
      setLocalError('Длина должна быть положительным числом')
      return false
    }

    if (nextUdl == null || !Number.isFinite(nextUdl) || nextUdl < 0) {
      setLocalError('Нагрузка должна быть числом больше либо равным 0')
      return false
    }

    await dispatch(
      updateBeamDeflectionDraftItemAsync({ draftId: requestId, beamId, length_m: nextLength, udl_kn_m: nextUdl }),
    ).unwrap()
    await dispatch(loadBeamDeflectionDraftAsync(requestId))
    return true
  }

  const saveAll = async () => {
    if (!request) return false
    for (const item of request.items) {
      const ok = await saveItemFields(item.beam_id)
      if (!ok) return false
    }
    await saveNote()
    return true
  }

  const onUpdateQuantity = async (beamId: number) => {
    if (!request || !isDraft) return
    const rawValue = quantities[beamId]
    const nextQty = Number(rawValue)
    const current = request.items.find((i) => i.beam_id === beamId)
    if (!current) return

    if (!Number.isFinite(nextQty) || nextQty < 1) {
      setQuantities((prev) => ({ ...prev, [beamId]: String(current.quantity) }))
      return
    }

    if (nextQty === current.quantity) return

    await dispatch(updateBeamDeflectionDraftItemAsync({ draftId: requestId, beamId, quantity: nextQty })).unwrap()
    await dispatch(loadBeamDeflectionDraftAsync(requestId))
    await dispatch(fetchBeamDeflectionDraftBadgeAsync())
  }

  const onRemoveItem = async (beamId: number) => {
    if (!isDraft) return
    await dispatch(removeBeamDeflectionDraftItemAsync({ draftId: requestId, beamId })).unwrap()
    await dispatch(loadBeamDeflectionDraftAsync(requestId))
    await dispatch(fetchBeamDeflectionDraftBadgeAsync())
  }

  const onForm = async () => {
    const ok = await saveAll()
    if (!ok) return
    await dispatch(formBeamDeflectionDraftAsync(requestId)).unwrap()
    navigate('/deflections', { replace: true })
  }

  const onSaveAll = async () => {
    if (!canEdit) return
    setLocalError(null)
    setSaving(true)
    try {
      await saveAll()
    } finally {
      setSaving(false)
    }
  }

  const onDeleteRequest = async () => {
    if (!canDelete) return
    const confirmed = window.confirm('Удалить заявку? Действие нельзя отменить.')
    if (!confirmed) return
    setLocalError(null)
    setDeleting(true)
    try {
      await dispatch(deleteBeamDeflectionDraftAsync(requestId)).unwrap()
      await dispatch(fetchBeamDeflectionDraftBadgeAsync())
      navigate('/deflections', { replace: true })
    } catch (e) {
      setLocalError(toErrorMessage(e))
    } finally {
      setDeleting(false)
    }
  }

  const formatDeflection = (value: number) => value.toFixed(2)
  const hasMultipleItems = (request?.items?.length ?? 0) > 1
  const itemDeflections = request
    ? request.items
        .map((item) => item.deflection_mm)
        .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
    : []
  const allItemsComputed = request ? itemDeflections.length === request.items.length && request.items.length > 0 : false
  const resultSummary =
    hasMultipleItems && itemDeflections.length > 0
      ? allItemsComputed
        ? itemDeflections.map((value) => formatDeflection(value)).join(', ')
        : '—'
      : !hasMultipleItems && request?.result_deflection_mm != null
        ? formatDeflection(request.result_deflection_mm)
        : null

  return (
    <div className="page-container">
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <h2 className="m-0">Заявка #{requestId}</h2>
        <div className="d-flex align-items-center gap-2">
          {isDraft && (
            <Button variant="success" onClick={onForm} disabled={!canForm || loading}>
              {loading ? <Spinner size="sm" animation="border" /> : 'Сформировать заявку'}
            </Button>
          )}
          {canDelete && (
            <Button variant="outline-danger" onClick={() => void onDeleteRequest()} disabled={deleting || loading}>
              {deleting ? <Spinner size="sm" animation="border" /> : 'Удалить заявку'}
            </Button>
          )}
        </div>
      </div>

      {(error || localError) && <Alert variant="danger">{localError ?? error}</Alert>}

      {!request || request.id !== requestId ? (
        <div className="text-center py-4">
          <Spinner animation="border" role="status" />
        </div>
      ) : (
        <Card>
          <Card.Body>
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div>
                <div className="text-muted">Статус</div>
                <div className="fw-semibold d-flex align-items-center gap-2 flex-wrap">
                  <span>{statusLabel[request.status] ?? request.status}</span>
                  {request.status === 'completed' && request.result_deflection_mm == null && (
                    <Badge bg="warning" text="dark">
                      Вычисляется
                    </Badge>
                  )}
                </div>
                {resultSummary != null && (
                  <div className="text-muted small">
                    Результат: <span className="fw-semibold">{resultSummary}</span> мм
                  </div>
                )}
              </div>
          {canEdit && (
            <Button variant="accent" onClick={() => void onSaveAll()} disabled={saving || loading}>
              {saving ? <Spinner size="sm" animation="border" /> : 'Сохранить поля'}
            </Button>
          )}
            </div>

            {isModerator && request.status === 'formed' && (
              <div className="d-flex flex-wrap gap-2 justify-content-end mt-2">
                <Button
                  variant="success"
                  onClick={() => void onModeratorComplete()}
                  disabled={Boolean(moderatorAction) || loading}
                >
                  {moderatorAction === 'complete' ? <Spinner size="sm" animation="border" /> : 'Завершить'}
                </Button>
                <Button
                  variant="outline-danger"
                  onClick={() => void onModeratorReject()}
                  disabled={Boolean(moderatorAction) || loading}
                >
                  {moderatorAction === 'reject' ? <Spinner size="sm" animation="border" /> : 'Отклонить'}
                </Button>
              </div>
            )}

            <hr />

            <h5 className="mb-3">Услуги в заявке</h5>

            {request.items.length === 0 ? (
              <Alert variant="info">В заявке пока нет услуг.</Alert>
            ) : (
              <div className="request-items">
                {request.items.map((item) => {
                  const isUpdating = updatingItemIds.includes(item.beam_id)
                  const title = item.beam_name ?? `#${item.beam_id}`
                  const src = displayItemImage(item.beam_image_url)

                  return (
                    <div key={item.beam_id} className="request-item-card">
                      <div className="request-item-thumb">
                        <img
                          src={src}
                          alt={title}
                          onError={(e) => {
                            if (e.currentTarget.src !== FALLBACK_IMG) {
                              e.currentTarget.src = FALLBACK_IMG
                            }
                          }}
                        />
                      </div>

                      <div>
                        <div className="d-flex flex-wrap align-items-start justify-content-between gap-2">
                          <div>
                            <div className="request-item-title">{title}</div>
                            <div className="request-item-meta">
                              Материал: {materialLabel(item.beam_material)}{' '}
                              {item.deflection_mm != null ? `· Прогиб: ${formatDeflection(item.deflection_mm)} мм` : ''}
                            </div>
                          </div>

                          <div className="d-flex gap-2 align-items-center">
                            {isDraft && (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => onRemoveItem(item.beam_id)}
                                disabled={isUpdating || loading}
                              >
                                {isUpdating ? <Spinner size="sm" animation="border" /> : 'Удалить'}
                              </Button>
                            )}
                          </div>
                        </div>

                        <Row className="g-2 mt-3">
                          <Col xs={12} md={4}>
                            <Form.Group controlId={`request-length-${item.beam_id}`}>
                              <Form.Label>Длина, м</Form.Label>
                              <Form.Control
                                type="number"
                                step="0.001"
                                min="0"
                                value={lengthsM[item.beam_id] ?? ''}
                                onChange={(e) =>
                                  setLengthsM((prev) => ({
                                    ...prev,
                                    [item.beam_id]: e.target.value,
                                  }))
                                }
                                onBlur={() => void saveItemFields(item.beam_id)}
                                disabled={!canEdit || loading}
                              />
                            </Form.Group>
                          </Col>

                          <Col xs={12} md={4}>
                            <Form.Group controlId={`request-udl-${item.beam_id}`}>
                              <Form.Label>Нагрузка q, кН/м</Form.Label>
                              <Form.Control
                                type="number"
                                step="0.001"
                                min="0"
                                value={udlKnM[item.beam_id] ?? ''}
                                onChange={(e) =>
                                  setUdlKnM((prev) => ({
                                    ...prev,
                                    [item.beam_id]: e.target.value,
                                  }))
                                }
                                onBlur={() => void saveItemFields(item.beam_id)}
                                disabled={!canEdit || loading}
                              />
                            </Form.Group>
                          </Col>

                          <Col xs={12} md={4}>
                            <Form.Group controlId={`request-qty-${item.beam_id}`}>
                              <Form.Label>Количество</Form.Label>
                              <Form.Control
                                type="number"
                                min="1"
                                value={quantities[item.beam_id] ?? ''}
                                onChange={(e) =>
                                  setQuantities((prev) => ({
                                    ...prev,
                                    [item.beam_id]: e.target.value,
                                  }))
                                }
                                onBlur={() => void onUpdateQuantity(item.beam_id)}
                                disabled={!canEdit || loading}
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <hr />

            <Form.Group controlId="request-note">
              <Form.Label>Примечание</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onBlur={() => void saveNote()}
                disabled={!canEdit || loading}
              />
            </Form.Group>
          </Card.Body>
        </Card>
      )}
    </div>
  )
}

