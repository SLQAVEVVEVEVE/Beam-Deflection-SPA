import { useEffect, useState } from 'react'
import { Alert, Button, Card, Form, Spinner } from 'react-bootstrap'
import { Navigate } from 'react-router-dom'
import { selectAuthError, selectAuthLoading, selectAuthUser, selectIsAuthenticated, updateMeAsync } from '../store/authSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'

export function ProfilePage() {
  const dispatch = useAppDispatch()

  const isAuthed = useAppSelector(selectIsAuthenticated)
  const user = useAppSelector(selectAuthUser)
  const loading = useAppSelector(selectAuthLoading)
  const error = useAppSelector(selectAuthError)

  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    setEmail(user?.email ?? '')
  }, [user?.email])

  if (!isAuthed) return <Navigate to="/login" replace />

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSuccess(null)

    const payload = {
      email: email.trim() || undefined,
      password: password || undefined,
      passwordConfirmation: passwordConfirmation || undefined,
    }

    await dispatch(updateMeAsync(payload)).unwrap()
    setPassword('')
    setPasswordConfirmation('')
    setSuccess('Профиль обновлен')
  }

  return (
    <div className="page-container">
      <Card className="mx-auto" style={{ maxWidth: 640 }}>
        <Card.Body>
          <h2 className="mb-3">Личный кабинет</h2>

          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Form onSubmit={onSubmit}>
            <Form.Group className="mb-3" controlId="me-email">
              <Form.Label>Эл. почта</Form.Label>
              <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Form.Group>

            <hr />

            <Form.Group className="mb-3" controlId="me-password">
              <Form.Label>Новый пароль</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="me-password-confirm">
              <Form.Label>Повторите новый пароль</Form.Label>
              <Form.Control
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                autoComplete="new-password"
              />
            </Form.Group>

            <Button type="submit" variant="accent" disabled={loading}>
              {loading ? (
                <>
                  <Spinner size="sm" animation="border" className="me-2" />
                  Сохраняем...
                </>
              ) : (
                'Сохранить'
              )}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  )
}
