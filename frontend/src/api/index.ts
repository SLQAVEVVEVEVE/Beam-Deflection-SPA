import { getAuthToken } from '../services/auth'
import { Api } from './Api'

const isTauri =
  import.meta.env.MODE === 'tauri' ||
  (typeof window !== 'undefined' && ('__TAURI__' in window || '__TAURI_IPC__' in window))

const apiBaseFromEnv = (isTauri ? import.meta.env.VITE_TAURI_API_BASE : import.meta.env.VITE_API_BASE) || '/api'
const normalizedBase = apiBaseFromEnv.replace(/\/$/, '')

const baseURL =
  normalizedBase === '/api'
    ? typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost'
    : normalizedBase.endsWith('/api')
      ? normalizedBase.slice(0, -4)
      : normalizedBase

export const api = new Api({
  baseURL,
  securityWorker: () => {
    const token = getAuthToken()
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
  },
})
