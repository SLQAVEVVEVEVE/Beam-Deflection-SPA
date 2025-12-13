const AUTH_STORAGE_KEYS = [
  import.meta.env.VITE_AUTH_STORAGE_KEY,
  'authToken',
  'access_token',
  'token',
  'jwt',
].filter(Boolean) as string[]

export function getAuthToken(): string | null {
  for (const key of AUTH_STORAGE_KEYS) {
    const value = localStorage.getItem(key)
    if (value) return value
  }
  return null
}

export function isAuthenticated(): boolean {
  return Boolean(getAuthToken())
}

