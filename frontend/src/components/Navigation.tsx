import { Button, Container, Nav, Navbar } from 'react-bootstrap'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { logoutUserAsync, selectAuthUser, selectIsAuthenticated } from '../store/authSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'

const logo = `${import.meta.env.BASE_URL}logo.png`

export function Navigation() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const isAuthed = useAppSelector(selectIsAuthenticated)
  const user = useAppSelector(selectAuthUser)

  const onLogout = async () => {
    await dispatch(logoutUserAsync()).unwrap()
    navigate('/', { replace: true })
  }

  return (
    <Navbar expand="lg" className="top-nav shadow-sm">
      <Container className="d-flex align-items-center">
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center gap-2">
          <img src={logo} alt="Логотип сервиса" className="brand-logo" />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-nav" />
        <Navbar.Collapse id="main-nav" className="justify-content-end">
          <Nav className="align-items-center gap-2">
            <Nav.Link as={NavLink} to="/">
              Главная
            </Nav.Link>
            <Nav.Link as={NavLink} to="/beams">
              Балки
            </Nav.Link>

            {isAuthed ? (
              <>
                <Nav.Link as={NavLink} to="/deflections">
                  Заявки
                </Nav.Link>
                <Nav.Link as={NavLink} to="/profile">
                  Профиль
                </Nav.Link>

                <span className="text-muted small">{user?.email}</span>
                <Button variant="outline-danger" onClick={onLogout}>
                  Выйти
                </Button>
              </>
            ) : (
              <>
                <Nav.Link as={NavLink} to="/login">
                  Вход
                </Nav.Link>
                <Nav.Link as={NavLink} to="/register">
                  Регистрация
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}

