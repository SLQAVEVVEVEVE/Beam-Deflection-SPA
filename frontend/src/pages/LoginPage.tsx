import { useState } from 'react'
import { Alert, Button, Card, Form, Spinner } from 'react-bootstrap'
import { Navigate, useNavigate } from 'react-router-dom'
import { loginUserAsync, selectAuthError, selectAuthLoading, selectIsAuthenticated } from '../store/authSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'

export function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const loading = useAppSelector(selectAuthLoading)
  const error = useAppSelector(selectAuthError)
  const isAuthed = useAppSelector(selectIsAuthenticated)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (isAuthed) return <Navigate to="/beams" replace />

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    await dispatch(loginUserAsync({ email, password })).unwrap()
    navigate('/beams', { replace: true })
  }

  return (
    <div className="page-container">
      <Card className="mx-auto" style={{ maxWidth: 520 }}>
        <Card.Body>
          <h2 className="mb-3">Вход</h2>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={onSubmit}>
            <Form.Group className="mb-3" controlId="login-email">
              <Form.Label>Эл. почта</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="login-password">
              <Form.Label>Пароль</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </Form.Group>

            <Button type="submit" variant="accent" className="w-100" disabled={loading}>
              {loading ? (
                <>
                  <Spinner size="sm" animation="border" className="me-2" />
                  Входим...
                </>
              ) : (
                'Войти'
              )}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  )
}
