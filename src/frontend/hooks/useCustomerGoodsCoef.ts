'use client'

import { useEffect, useState } from 'react'
import { isStorefrontGuestSession } from '@/frontend/components/GuestPricePlaceholder'
import { getMyGoodsCoef } from '@/frontend/actions/CustomerPromo'
import { useUserSession } from '@/tools/FrontendSession'

type CacheEntry = { userId: string; coef: number | null; at: number }

let cache: CacheEntry | null = null
const TTL_MS = 60_000

export function useCustomerGoodsCoef(): number | null {
  const session = useUserSession()
  const userId = String(session.user_id || '').trim()
  const guest = isStorefrontGuestSession(session)
  const [coef, setCoef] = useState<number | null>(() => {
    if (guest || !userId) return null
    if (cache && cache.userId === userId && Date.now() - cache.at < TTL_MS) return cache.coef
    return null
  })

  useEffect(() => {
    if (guest || !userId) {
      setCoef(null)
      return
    }
    if (cache && cache.userId === userId && Date.now() - cache.at < TTL_MS) {
      setCoef(cache.coef)
      return
    }
    let cancelled = false
    getMyGoodsCoef()
      .then((res) => {
        const next = res?.coef ?? null
        cache = { userId, coef: next, at: Date.now() }
        if (!cancelled) setCoef(next)
      })
      .catch(() => {
        if (!cancelled) setCoef(null)
      })
    return () => {
      cancelled = true
    }
  }, [guest, userId, session.token])

  return coef
}
