import { Container } from 'react-bootstrap'
import { Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import { Breadcrumbs } from './components/Breadcrumbs'
import { Navigation } from './components/Navigation'
import { BeamDetailPage } from './pages/BeamDetailPage'
import { BeamsListPage } from './pages/BeamsListPage'
import { HomePage } from './pages/HomePage'

function AppShell() {
  const location = useLocation()
  const showBreadcrumbs = location.pathname !== '/'

  return (
    <div className="app-shell">
      <Navigation />
      <Container fluid className="pb-4">
        {showBreadcrumbs && <Breadcrumbs />}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/beams" element={<BeamsListPage />} />
          <Route path="/beams/:id" element={<BeamDetailPage />} />
          <Route path="*" element={<div>Страница не найдена</div>} />
        </Routes>
      </Container>
    </div>
  )
}

export default function App() {
  return <AppShell />
}