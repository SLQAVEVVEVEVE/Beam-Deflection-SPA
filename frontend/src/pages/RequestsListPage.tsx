import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Badge, Button, Col, Form, Row, Spinner, Table } from 'react-bootstrap'
import { Link, Navigate } from 'react-router-dom'
import { bootstrapAuthAsync, selectAuthUser, selectIsAuthenticated } from '../store/authSlice'
import {
  completeBeamDeflectionAsync,
  fetchBeamDeflectionsAsync,
  rejectBeamDeflectionAsync,
  selectRequests,
  selectRequestsError,
  selectRequestsLoading,
  selectRequestsMeta,
} from '../store/requestsSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import type { BeamDeflectionStatus } from '../types'

const POLL_INTERVAL_MS = 3000
const PER_PAGE = 20

const statusLabel: Record<BeamDeflectionStatus, string> = {
  draft: 'Черновик',
  formed: 'Сформирована',
  completed: 'Завершена',
  rejected: 'Отклонена',
  deleted: 'Удалена',
}

type StatusFilter = '' | Exclude<BeamDeflectionStatus, 'deleted'>

function isComputing(status: BeamDeflectionStatus, resultDeflection: number | null | undefined) {
  return status === 'completed' && resultDeflection == null
}

function formatDateTime(raw?: string | null) {
  if (!raw) return '—'
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString()
}

function formatDeflection(value: number) {
  return value.toFixed(2)
}

function formatResults(values: number[]) {
  return values.map((value) => formatDeflection(value)).join(', ')
}

function getTodayInputValue() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function buildBoundaryDateTime(value: string, boundary: 'start' | 'end') {
  if (!value) return ''
  const [yearRaw, monthRaw, dayRaw] = value.split('-')
  const year = Number(yearRaw)
  const month = Number(monthRaw)
  const day = Number(dayRaw)
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return value
  const hours = boundary === 'start' ? 0 : 23
  const minutes = boundary === 'start' ? 0 : 59
  const seconds = boundary === 'start' ? 0 : 59
  const localDate = new Date(year, month - 1, day, hours, minutes, seconds)
  const offsetMinutes = localDate.getTimezoneOffset()
  const sign = offsetMinutes <= 0 ? '+' : '-'
  const absOffset = Math.abs(offsetMinutes)
  const offsetHours = String(Math.floor(absOffset / 60)).padStart(2, '0')
  const offsetMins = String(absOffset % 60).padStart(2, '0')
  const offset = `${sign}${offsetHours}:${offsetMins}`
  const yearText = String(localDate.getFullYear()).padStart(4, '0')
  const monthText = String(localDate.getMonth() + 1).padStart(2, '0')
  const dayText = String(localDate.getDate()).padStart(2, '0')
  const hourText = String(hours).padStart(2, '0')
  const minuteText = String(minutes).padStart(2, '0')
  const secondText = String(seconds).padStart(2, '0')
  return `${yearText}-${monthText}-${dayText}T${hourText}:${minuteText}:${secondText}${offset}`
}

export function RequestsListPage() {
  const dispatch = useAppDispatch()

  const isAuthed = useAppSelector(selectIsAuthenticated)
  const user = useAppSelector(selectAuthUser)
  const isModerator = Boolean(user?.moderator)

  useEffect(() => {
    if (!isAuthed) return
    dispatch(bootstrapAuthAsync())
  }, [dispatch, isAuthed])

  const loading = useAppSelector(selectRequestsLoading)
  const error = useAppSelector(selectRequestsError)
  const meta = useAppSelector(selectRequestsMeta)
  const requests = useAppSelector(selectRequests)

  const [status, setStatus] = useState<StatusFilter>('')
  const [from, setFrom] = useState<string>(() => getTodayInputValue())
  const [to, setTo] = useState<string>(() => getTodayInputValue())
  const [creatorQuery, setCreatorQuery] = useState<string>('')
  const [page, setPage] = useState<number>(1)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busyIds, setBusyIds] = useState<number[]>([])

  const inFlightRef = useRef<{ abort: () => void } | null>(null)

  useEffect(() => {
    setPage(1)
  }, [status, from, to])

  const query = useMemo(
    () => ({
      status: status || undefined,
      from: from ? buildBoundaryDateTime(from, 'start') : undefined,
      to: to ? buildBoundaryDateTime(to, 'end') : undefined,
      page,
      per_page: PER_PAGE,
    }),
    [status, from, to, page],
  )

  const filteredRequests = useMemo(() => {
    const needle = creatorQuery.trim().toLowerCase()
    if (!isModerator || !needle) return requests
    return requests.filter((row) => (row.creator_login ?? '').toLowerCase().includes(needle))
  }, [creatorQuery, isModerator, requests])

  const runFetch = useCallback(
    (silent: boolean) => {
      inFlightRef.current?.abort()
      const action = dispatch(fetchBeamDeflectionsAsync({ ...query, silent }))
      inFlightRef.current = action as unknown as { abort: () => void }
    },
    [dispatch, query],
  )

  useEffect(() => {
    if (!isAuthed) return

    runFetch(false)

    const intervalId = window.setInterval(() => {
      runFetch(true)
    }, POLL_INTERVAL_MS)

    return () => {
      window.clearInterval(intervalId)
      inFlightRef.current?.abort()
    }
  }, [isAuthed, runFetch])

  if (!isAuthed) return <Navigate to="/login" replace />

  const isBusy = (id: number) => busyIds.includes(id)

  const onComplete = async (id: number) => {
    setActionError(null)
    setBusyIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
    try {
      await dispatch(completeBeamDeflectionAsync(id)).unwrap()
      runFetch(true)
    } catch (e) {
      setActionError(typeof e === 'string' ? e : e instanceof Error ? e.message : 'Не удалось завершить заявку')
    } finally {
      setBusyIds((prev) => prev.filter((item) => item !== id))
    }
  }

  const onReject = async (id: number) => {
    setActionError(null)
    setBusyIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
    try {
      await dispatch(rejectBeamDeflectionAsync(id)).unwrap()
      runFetch(true)
    } catch (e) {
      setActionError(typeof e === 'string' ? e : e instanceof Error ? e.message : 'Не удалось отклонить заявку')
    } finally {
      setBusyIds((prev) => prev.filter((item) => item !== id))
    }
  }

  const currentPage = meta?.current_page ?? page
  const totalPages = meta?.total_pages ?? null
  const prevPage = meta?.prev_page ?? null
  const nextPage = meta?.next_page ?? null

  return (
    <div className="page-container">
      <div className="d-flex flex-wrap align-items-baseline justify-content-between gap-2 mb-3">
        <div>
          <h2 className="mb-1">{isModerator ? 'Заявки (модератор)' : 'Мои заявки'}</h2>
          <div className="text-muted small">
            Обновление каждые {Math.round(POLL_INTERVAL_MS / 1000)} сек · страница {currentPage}
            {totalPages ? ` из ${totalPages}` : ''}
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Button
            variant="outline-secondary"
            size="sm"
            disabled={!prevPage || loading}
            onClick={() => prevPage && setPage(prevPage)}
          >
            Назад
          </Button>
          <Button
            variant="outline-secondary"
            size="sm"
            disabled={!nextPage || loading}
            onClick={() => nextPage && setPage(nextPage)}
          >
            Вперед
          </Button>
        </div>
      </div>

      {(error || actionError) && <Alert variant="danger">{actionError ?? error}</Alert>}

      <Form className="mb-3">
        <Row className="g-2 align-items-end">
          <Col xs={12} md={3}>
            <Form.Group controlId="requests-status">
              <Form.Label>Статус</Form.Label>
              <Form.Select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
                <option value="">Все</option>
                <option value="draft">Черновик</option>
                <option value="formed">Сформирована</option>
                <option value="completed">Завершена</option>
                <option value="rejected">Отклонена</option>
              </Form.Select>
            </Form.Group>
          </Col>

          <Col xs={12} md={3}>
            <Form.Group controlId="requests-from">
              <Form.Label>Дата формирования (с)</Form.Label>
              <Form.Control type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </Form.Group>
          </Col>

          <Col xs={12} md={3}>
            <Form.Group controlId="requests-to">
              <Form.Label>Дата формирования (по)</Form.Label>
              <Form.Control type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </Form.Group>
          </Col>

          {isModerator && (
            <Col xs={12} md={3}>
              <Form.Group controlId="requests-creator">
                <Form.Label>Создатель (email)</Form.Label>
                <Form.Control
                  type="search"
                  placeholder="user@example.com"
                  value={creatorQuery}
                  onChange={(e) => setCreatorQuery(e.target.value)}
                />
              </Form.Group>
            </Col>
          )}
        </Row>
      </Form>

      {loading ? (
        <div className="text-center py-4">
          <Spinner animation="border" role="status" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <Alert variant="info">Заявки не найдены.</Alert>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>ID</th>
              <th>Статус</th>
              <th>Сформирована</th>
              {isModerator && <th>Создатель</th>}
              {isModerator && <th>Модератор</th>}
              <th>Результат</th>
              <th className="text-nowrap" />
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((request) => {
              const computing = isComputing(request.status, request.result_deflection_mm)
              const itemResults = Array.isArray(request.item_deflections_mm) ? request.item_deflections_mm : null
              const itemsCount = request.items_count ?? itemResults?.length ?? 0
              const hasMultipleItems = itemsCount > 1
              const allItemsComputed = itemResults != null && itemResults.length === itemsCount && itemsCount > 0
              const resultCell = computing
                ? '—'
                : hasMultipleItems
                  ? allItemsComputed
                    ? formatResults(itemResults ?? [])
                    : '—'
                  : itemResults && itemResults.length === 1
                    ? formatDeflection(itemResults[0])
                    : request.result_deflection_mm != null
                      ? formatDeflection(request.result_deflection_mm)
                      : '—'
              return (
                <tr key={request.id}>
                  <td>{request.id}</td>
                  <td className="text-nowrap">
                    {statusLabel[request.status] ?? request.status}
                    {computing && (
                      <>
                        {' '}
                        <Badge bg="warning" text="dark">
                          Вычисляется
                        </Badge>
                      </>
                    )}
                  </td>
                  <td>{formatDateTime(request.formed_at)}</td>
                  {isModerator && <td>{request.creator_login ?? '—'}</td>}
                  {isModerator && <td>{request.moderator_login ?? '—'}</td>}
                  <td className="text-nowrap">{resultCell}</td>
                  <td className="text-nowrap">
                    <div className="d-flex flex-wrap gap-2 justify-content-end">
                      <Link className="btn btn-sm btn-accent" to={`/deflections/${request.id}`}>
                        Открыть
                      </Link>

                      {isModerator && request.status === 'formed' && (
                        <>
                          <Button
                            size="sm"
                            variant="success"
                            disabled={isBusy(request.id)}
                            onClick={() => void onComplete(request.id)}
                          >
                            {isBusy(request.id) ? <Spinner size="sm" animation="border" /> : 'Завершить'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            disabled={isBusy(request.id)}
                            onClick={() => void onReject(request.id)}
                          >
                            {isBusy(request.id) ? <Spinner size="sm" animation="border" /> : 'Отклонить'}
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      )}
    </div>
  )
}

