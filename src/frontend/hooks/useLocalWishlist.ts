'use client'

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'storefront_local_wishlist_ids'

type WishlistListener = () => void

const listeners = new Set<WishlistListener>()

const notify = () => {
  listeners.forEach((listener) => listener())
}

const safeParseIds = (raw: string | null): string[] => {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map((id) => String(id || '').trim()).filter(Boolean)
  } catch {
    return []
  }
}

const readWishlistIds = (): string[] => {
  if (typeof window === 'undefined') return []
  try {
    return safeParseIds(window.localStorage.getItem(STORAGE_KEY))
  } catch {
    return []
  }
}

const writeWishlistIds = (ids: string[]) => {
  if (typeof window === 'undefined') return
  const unique = Array.from(new Set(ids.map((id) => String(id || '').trim()).filter(Boolean)))
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(unique))
  } catch {
    // ignore quota / private mode failures
  }
  notify()
}

export const isProductWishlisted = (productId: string): boolean => {
  const id = String(productId || '').trim()
  if (!id) return false
  return readWishlistIds().includes(id)
}

/** 切换收藏状态；返回切换后是否已收藏 */
export const toggleProductWishlist = (productId: string): boolean => {
  const id = String(productId || '').trim()
  if (!id) return false

  const current = readWishlistIds()
  const exists = current.includes(id)
  const next = exists ? current.filter((item) => item !== id) : [...current, id]
  writeWishlistIds(next)
  return !exists
}

const subscribeWishlist = (listener: WishlistListener) => {
  listeners.add(listener)
  if (typeof window !== 'undefined') {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) listener()
    }
    window.addEventListener('storage', onStorage)
    return () => {
      listeners.delete(listener)
      window.removeEventListener('storage', onStorage)
    }
  }
  return () => {
    listeners.delete(listener)
  }
}

const getWishlistSnapshot = () => {
  if (typeof window === 'undefined') return '[]'
  try {
    return window.localStorage.getItem(STORAGE_KEY) || '[]'
  } catch {
    return '[]'
  }
}

const getServerSnapshot = () => '[]'

/** 订阅本地心愿单列表（跨组件/跨标签同步） */
export const useLocalWishlistIds = (): string[] => {
  const snapshot = useSyncExternalStore(subscribeWishlist, getWishlistSnapshot, getServerSnapshot)
  return safeParseIds(snapshot)
}

export const useIsProductWishlisted = (productId: string): boolean => {
  const ids = useLocalWishlistIds()
  const id = String(productId || '').trim()
  return Boolean(id) && ids.includes(id)
}

export const useToggleProductWishlist = () => {
  return useCallback((productId: string) => toggleProductWishlist(productId), [])
}

/** 兼容旧写法：返回 favorited + toggle */
export const useLocalWishlist = (productId: string) => {
  const favorited = useIsProductWishlisted(productId)
  const toggle = useToggleProductWishlist()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return {
    favorited: mounted ? favorited : false,
    toggle: () => toggle(productId),
  }
}
