import { Container } from 'react-bootstrap'
import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import { Breadcrumbs } from './components/Breadcrumbs'
import { FloatingCart } from './components/FloatingCart'
import { Navigation } from './components/Navigation'
import { BeamDetailPage } from './pages/BeamDetailPage'
import { BeamsListPage } from './pages/BeamsListPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { ProfilePage } from './pages/ProfilePage'
import { RegisterPage } from './pages/RegisterPage'
import { RequestPage } from './pages/RequestPage'
import { RequestsListPage } from './pages/RequestsListPage'
import { bootstrapAuthAsync, selectIsAuthenticated } from './store/authSlice'
import {
  fetchBeamDeflectionDraftBadgeAsync,
  selectBadgeDraftId,
  selectBadgeItemsCount,
  selectHasUsableDraft,
} from './store/draftSlice'
import { useAppDispatch, useAppSelector } from './store/hooks'

function AppShell() {
  const location = useLocation()
  const showBreadcrumbs = location.pathname !== '/'
  const dispatch = useAppDispatch()
  const isAuthed = useAppSelector(selectIsAuthenticated)
  const draftId = useAppSelector(selectBadgeDraftId)
  const itemsCount = useAppSelector(selectBadgeItemsCount)
  const hasUsableDraft = useAppSelector(selectHasUsableDraft)

  useEffect(() => {
    dispatch(bootstrapAuthAsync())
  }, [dispatch])

  useEffect(() => {
    dispatch(fetchBeamDeflectionDraftBadgeAsync())
  }, [dispatch, isAuthed])

  return (
    <div className="app-shell">
      <Navigation />
      <Container fluid className="pb-4">
        {showBreadcrumbs && <Breadcrumbs />}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/index.html" element={<Navigate to="/" replace />} />
          <Route path="/beams" element={<BeamsListPage />} />
          <Route path="/beams/:id" element={<BeamDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/deflections" element={<RequestsListPage />} />
          <Route path="/deflections/:id" element={<RequestPage />} />
          <Route path="*" element={<div>Страница не найдена</div>} />
        </Routes>
      </Container>

      <FloatingCart
        to={draftId && draftId > 0 ? `/deflections/${draftId}` : '/deflections'}
        count={itemsCount}
        disabled={!isAuthed || !hasUsableDraft}
      />
    </div>
  )
}

export default function App() {
  return <AppShell />
}
