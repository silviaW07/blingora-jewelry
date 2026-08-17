'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Read `window.location.search` without Next `useSearchParams()`.
 * `useSearchParams` suspends the nearest Suspense boundary; on Chrome mobile
 * that boundary is the whole storefront page, so Account/Categories stay blank.
 */
export function useClientSearchParams(): URLSearchParams {
  const pathname = usePathname()
  const [query, setQuery] = useState(() =>
    typeof window === 'undefined' ? '' : window.location.search.replace(/^\?/, ''),
  )

  useEffect(() => {
    setQuery(window.location.search.replace(/^\?/, ''))
  }, [pathname])

  return useMemo(() => new URLSearchParams(query), [query])
}
