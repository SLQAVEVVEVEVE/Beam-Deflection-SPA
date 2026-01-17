import { getAuthToken } from './auth'
import { withWebOrigin } from './webOrigin'

export async function fetchCartItemsCount(): Promise<number> {
  const token = getAuthToken()
  if (!token) return 0

  try {
    const response = await fetch(withWebOrigin('/api/beam_deflections/cart_badge'), {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) return 0

    const data = (await response.json()) as { items_count?: number }
    return typeof data.items_count === 'number' ? data.items_count : 0
  } catch {
    return 0
  }
}
