import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import App from './App.tsx'
import { store } from './store'

registerSW({
  immediate: true,
})

const isTauri = typeof window !== 'undefined' && '__TAURI_IPC__' in window
const Router = isTauri ? HashRouter : BrowserRouter

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <Router basename={isTauri ? '/' : import.meta.env.BASE_URL}>
        <App />
      </Router>
    </Provider>
  </StrictMode>,
)
