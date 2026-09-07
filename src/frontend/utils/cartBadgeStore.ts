'use client'

type Listener = (count: number) => void

let badgeCount = 0
const listeners = new Set<Listener>()

export function getCartBadgeCount() {
  return badgeCount
}

export function setCartBadgeCount(next: number) {
  const count = Math.max(0, Math.floor(Number(next) || 0))
  if (count === badgeCount) return
  badgeCount = count
  listeners.forEach((fn) => fn(badgeCount))
}

export function bumpCartBadgeCount(delta: number) {
  setCartBadgeCount(badgeCount + Number(delta || 0))
}

export function subscribeCartBadge(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export async function refreshCartBadgeCount() {
  if (typeof window === 'undefined') return
  try {
    const { useUserSession } = await import('@/tools/FrontendSession')
    const token = String(useUserSession.getState().token || '').trim()
    if (!token) {
      setCartBadgeCount(0)
      return
    }
    const { getCartData } = await import('@/frontend/actions/Cart')
    const { getClientPreferredLang } = await import('@/frontend/i18n')
    const data = await getCartData({ lang: getClientPreferredLang() })
    const total = (data.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
    setCartBadgeCount(total)
  } catch {
    /* keep last known count */
  }
}
