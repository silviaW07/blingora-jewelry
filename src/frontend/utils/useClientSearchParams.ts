'use client'

import { useMemo, useSyncExternalStore } from 'react'

function subscribe(onChange: () => void) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener('popstate', onChange)
  window.addEventListener('storefront:urlchange', onChange)
  return () => {
    window.removeEventListener('popstate', onChange)
    window.removeEventListener('storefront:urlchange', onChange)
  }
}

function getSearchSnapshot() {
  return typeof window === 'undefined' ? '' : window.location.search.replace(/^\?/, '')
}

/**
 * Read `window.location.search` without Next `useSearchParams()`.
 * Must update when only `?search=` changes (same pathname `/`).
 */
export function useClientSearchParams(): URLSearchParams {
  const query = useSyncExternalStore(subscribe, getSearchSnapshot, () => '')
  return useMemo(() => new URLSearchParams(query), [query])
}
