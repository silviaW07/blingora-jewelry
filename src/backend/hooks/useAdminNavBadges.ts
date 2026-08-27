'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { getAdminUnreadCounts } from '@/backend/actions/Dashboard'

const CUSTOMER_KEY = 'admin-nav-seen-customers-v2'
const ORDER_KEY = 'admin-nav-seen-orders-v2'

function storageKey(base: string, userId: string) {
  return `${base}:${userId}`
}

function readSeen(key: string): string {
  if (typeof window === 'undefined') return ''
  try {
    return window.localStorage.getItem(key) || ''
  } catch {
    return ''
  }
}

function writeSeen(key: string) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, new Date().toISOString())
  } catch {
    /* ignore */
  }
}

/** 从未点开过该菜单时，只统计最近 7 天的新注册/新订单，避免一次亮出历史全量。 */
function unseenFallbackSince() {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
}

export function useAdminNavBadges(enabled: boolean, userId?: string | null) {
  const pathname = usePathname() || ''
  const [newCustomers, setNewCustomers] = useState(0)
  const [newOrders, setNewOrders] = useState(0)

  const onCustomersPage = pathname.startsWith('/usermanagement')
  const onOrdersPage = pathname.startsWith('/ordermanagement')
  const actorId = String(userId || '').trim()

  const refresh = useCallback(async () => {
    if (!enabled || !actorId) return
    const customerKey = storageKey(CUSTOMER_KEY, actorId)
    const orderKey = storageKey(ORDER_KEY, actorId)
    if (onCustomersPage) writeSeen(customerKey)
    if (onOrdersPage) writeSeen(orderKey)
    try {
      const result = await getAdminUnreadCounts({
        customerSince: onCustomersPage
          ? new Date().toISOString()
          : readSeen(customerKey) || unseenFallbackSince(),
        orderSince: onOrdersPage
          ? new Date().toISOString()
          : readSeen(orderKey) || unseenFallbackSince(),
      })
      setNewCustomers(onCustomersPage ? 0 : Number(result?.newCustomers || 0))
      setNewOrders(onOrdersPage ? 0 : Number(result?.newOrders || 0))
    } catch {
      /* stay on last known */
    }
  }, [enabled, actorId, onCustomersPage, onOrdersPage])

  useEffect(() => {
    if (onCustomersPage) setNewCustomers(0)
    if (onOrdersPage) setNewOrders(0)
  }, [onCustomersPage, onOrdersPage])

  useEffect(() => {
    if (!enabled || !actorId) {
      setNewCustomers(0)
      setNewOrders(0)
      return
    }
    void refresh()
    const timer = window.setInterval(() => void refresh(), 15000)
    const onFocus = () => {
      if (document.visibilityState === 'hidden') return
      void refresh()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [enabled, actorId, refresh])

  return { newCustomers, newOrders }
}

export function formatBadgeCount(count: number) {
  if (count <= 0) return ''
  if (count > 99) return '99+'
  return String(count)
}
