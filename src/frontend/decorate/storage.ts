'use client'

import type { DecoratePatch, DecorateStore } from './types'
import { DECORATE_STORAGE_KEY } from './types'

export function readDecorateStore(): DecorateStore {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(DECORATE_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as DecorateStore) : {}
  } catch {
    return {}
  }
}

export function writeDecorateStore(store: DecorateStore) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(DECORATE_STORAGE_KEY, JSON.stringify(store))
}

export function getDecoratePatch(propKey: string): DecoratePatch | undefined {
  const store = readDecorateStore()
  return store[propKey]
}

export function mergeDecoratePatch(propKey: string, patch: DecoratePatch) {
  const store = readDecorateStore()
  store[propKey] = { ...(store[propKey] || {}), ...patch }
  writeDecorateStore(store)
  return store
}
