import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import App from './App.tsx'
import { store } from './store'

const isTauri =
  import.meta.env.MODE === 'tauri' ||
  (typeof window !== 'undefined' && ('__TAURI__' in window || '__TAURI_IPC__' in window))
const Router = isTauri ? HashRouter : BrowserRouter

const enablePwaInDev = import.meta.env.VITE_PWA_DEV === 'true'
const shouldRegisterSW = !isTauri && (import.meta.env.PROD || enablePwaInDev)

if (shouldRegisterSW) {
  try {
    registerSW({ immediate: true })
  } catch (error) {
    console.warn('Не удалось зарегистрировать service worker PWA', error)
  }
} else if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
    .catch(() => {
      // ignore cleanup errors
    })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <Router basename={isTauri ? '/' : import.meta.env.BASE_URL}>
        <App />
      </Router>
    </Provider>
  </StrictMode>,
)
