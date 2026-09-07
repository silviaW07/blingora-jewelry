'use client'

import { useEffect, useState } from 'react'
import { useUserSession } from '@/tools/FrontendSession'
import {
  getCartBadgeCount,
  refreshCartBadgeCount,
  setCartBadgeCount,
  subscribeCartBadge,
} from '@/frontend/utils/cartBadgeStore'

export function useCartBadge() {
  const token = useUserSession((s) => s.token)
  const [cartBadgeCount, setCount] = useState(() => getCartBadgeCount())

  useEffect(() => subscribeCartBadge(setCount), [])

  useEffect(() => {
    const loggedIn = Boolean(String(token || '').trim())
    if (!loggedIn) {
      setCartBadgeCount(0)
      return
    }
    void refreshCartBadgeCount()
  }, [token])

  return cartBadgeCount
}
