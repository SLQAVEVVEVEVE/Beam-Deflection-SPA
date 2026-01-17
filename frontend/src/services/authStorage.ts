export type AuthUser = {
  id: number
  email: string
  moderator: boolean
}

const tokenKey = import.meta.env.VITE_AUTH_STORAGE_KEY || 'authToken'
const userKey = `${tokenKey}.user`

export function loadAuthToken(): string | null {
  try {
    return localStorage.getItem(tokenKey)
  } catch {
    return null
  }
}

export function saveAuthToken(token: string) {
  try {
    localStorage.setItem(tokenKey, token)
  } catch {
    // ignore storage failures
  }
}

export function clearAuthToken() {
  try {
    localStorage.removeItem(tokenKey)
  } catch {
    // ignore storage failures
  }
}

export function loadAuthUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(userKey)
    if (!raw) return null
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function saveAuthUser(user: AuthUser) {
  try {
    localStorage.setItem(userKey, JSON.stringify(user))
  } catch {
    // ignore storage failures
  }
}

export function clearAuthUser() {
  try {
    localStorage.removeItem(userKey)
  } catch {
    // ignore storage failures
  }
}

