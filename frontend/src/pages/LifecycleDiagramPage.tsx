import type { ReactNode } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Badge, Button, Card, Col, Form, Row, Stack } from 'react-bootstrap'

type Phase = 'mounting' | 'updating' | 'unmounting'

type LogEntry = {
  id: string
  at: string
  message: string
}

function makeId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function PhaseCard({ title, active, children }: { title: string; active: boolean; children: ReactNode }) {
  return (
    <Card className={`h-100 shadow-sm ${active ? 'bg-dark text-white border-dark' : ''}`}>
      <Card.Body>
        <div className="d-flex align-items-center justify-content-between mb-2">
          <Card.Title className="mb-0">{title}</Card.Title>
          {active ? (
            <Badge bg="warning" text="dark">
              active
            </Badge>
          ) : (
            <Badge bg="secondary">idle</Badge>
          )}
        </div>
        <Card.Text className="mb-0">{children}</Card.Text>
      </Card.Body>
    </Card>
  )
}

function LifecycleChild({
  value,
  onLog,
  onPhase,
}: {
  value: number
  onLog: (message: string) => void
  onPhase: (phase: Phase) => void
}) {
  const [text, setText] = useState('')
  const didInitTextEffect = useRef(false)
  const renderedAt = new Date().toISOString()

  useEffect(() => {
    onPhase('mounting')
    onLog('MOUNT: Child mounted (useEffect([]) ran after first render)')
    return () => {
      onPhase('unmounting')
      onLog('UNMOUNT: Child cleanup (return from useEffect([]))')
    }
  }, [onLog, onPhase])

  useEffect(() => {
    onPhase('updating')
    onLog(`UPDATE: prop value changed -> ${value} (useEffect([value]) ran after render)`)
    return () => {
      onLog(`CLEANUP: before next value effect / unmount (previous value was ${value})`)
    }
  }, [onLog, onPhase, value])

  useEffect(() => {
    if (!didInitTextEffect.current) {
      didInitTextEffect.current = true
      return
    }
    onPhase('updating')
    onLog(`UPDATE: local state text changed -> "${text}"`)
  }, [onLog, onPhase, text])

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
          <Badge bg="primary">Child</Badge>
          <span className="text-muted small">rendered at: {renderedAt}</span>
          <span className="text-muted small">prop value: {value}</span>
        </div>

        <Form.Group>
          <Form.Label className="small text-muted mb-1">Local state (useState):</Form.Label>
          <Form.Control
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type here to trigger Updating (child state)"
          />
        </Form.Group>
      </Card.Body>
    </Card>
  )
}

export function LifecycleDiagramPage() {
  const [mounted, setMounted] = useState(true)
  const [value, setValue] = useState(0)
  const [phase, setPhase] = useState<Phase>('mounting')
  const [log, setLog] = useState<LogEntry[]>([])
  const renderedAt = new Date().toISOString()

  const onLog = useCallback((message: string) => {
    setLog((prev) => {
      const entry: LogEntry = { id: makeId(), at: new Date().toLocaleTimeString(), message }
      return [...prev.slice(-79), entry]
    })
  }, [])

  useEffect(() => {
    onLog('INFO: Render happens in the component function return (JSX). Effects run after render.')
  }, [onLog])

  const onToggleMount = () => {
    setMounted((m) => {
      const next = !m
      setPhase(next ? 'mounting' : 'unmounting')
      return next
    })
  }

  return (
    <Stack gap={3} className="page-container">
      <div className="section-title">React component lifecycle (Mounting → Updating → Unmounting)</div>

      <Alert variant="info" className="mb-0">
        Dev note: in <code>React.StrictMode</code> (enabled in <code>frontend/src/main.tsx</code>) mount effects can run
        twice to help detect side effects.
      </Alert>

      <Row xs={1} md={3} className="g-3">
        <Col>
          <PhaseCard title="Mounting" active={phase === 'mounting'}>
            First render of a component. <code>useEffect(..., [])</code> runs after the first render (commit).
          </PhaseCard>
        </Col>
        <Col>
          <PhaseCard title="Updating" active={phase === 'updating'}>
            Re-render happens on state/props change. <code>useEffect(..., [dep])</code> runs after render when dep
            changes.
          </PhaseCard>
        </Col>
        <Col>
          <PhaseCard title="Unmounting" active={phase === 'unmounting'}>
            Component removed from the tree. Cleanup runs from <code>useEffect</code> return function.
          </PhaseCard>
        </Col>
      </Row>

      <Card className="shadow-sm">
        <Card.Body>
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <Badge bg="dark">Parent</Badge>
              <span className="text-muted small">rendered at: {renderedAt}</span>
              <span className="text-muted small">value (prop for child): {value}</span>
            </div>
            <div className="d-flex flex-wrap gap-2">
              <Button variant={mounted ? 'outline-danger' : 'outline-success'} onClick={onToggleMount}>
                {mounted ? 'Unmount child' : 'Mount child'}
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setPhase('updating')
                  setValue((v) => v + 1)
                }}
                disabled={!mounted}
              >
                Update prop (value++)
              </Button>
              <Button
                variant="outline-secondary"
                onClick={() => {
                  setPhase('updating')
                  setValue(0)
                }}
                disabled={!mounted}
              >
                Reset value
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {mounted ? (
        <LifecycleChild value={value} onLog={onLog} onPhase={setPhase} />
      ) : (
        <Alert variant="secondary" className="mb-0">
          Child is unmounted
        </Alert>
      )}

      <Card className="shadow-sm">
        <Card.Header className="d-flex align-items-center justify-content-between gap-2">
          <div className="d-flex align-items-center gap-2">
            <span className="fw-semibold">Effects log</span>
            <Badge bg="secondary">{log.length}</Badge>
          </div>
          <Button
            size="sm"
            variant="outline-secondary"
            onClick={() => {
              setLog([])
              setPhase(mounted ? 'mounting' : 'unmounting')
            }}
          >
            Clear
          </Button>
        </Card.Header>
        <Card.Body style={{ maxHeight: 320, overflow: 'auto' }}>
          {log.length === 0 ? (
            <div className="text-muted">No entries yet. Mount the child or update state.</div>
          ) : (
            <div className="small" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
              {log
                .slice()
                .reverse()
                .map((entry) => (
                  <div key={entry.id}>
                    <span className="text-muted">[{entry.at}]</span> {entry.message}
                  </div>
                ))}
            </div>
          )}
        </Card.Body>
      </Card>
    </Stack>
  )
}
