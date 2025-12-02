import { Container, Nav, Navbar } from 'react-bootstrap'
import { Link, NavLink } from 'react-router-dom'

export function Navigation() {
  return (
    <Navbar expand="lg" className="top-nav shadow-sm">
      <Container className="d-flex align-items-center">
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center gap-2">
          <img src="/logo.png" alt="Строй и пой" className="brand-logo" />
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
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}