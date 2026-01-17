function normalizeOrigin(origin: string) {
  return origin.replace(/\/+$/, '')
}

export function webOrigin() {
  const origin = import.meta.env.VITE_WEB_ORIGIN
  return origin ? normalizeOrigin(String(origin)) : ''
}

export function withWebOrigin(pathname: string) {
  const origin = webOrigin()
  if (!pathname.startsWith('/')) return `${origin}/${pathname}`
  return `${origin}${pathname}`
}

