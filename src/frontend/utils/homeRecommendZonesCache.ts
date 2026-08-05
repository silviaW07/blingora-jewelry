import { getHomeRecommendZones } from '@/frontend/actions/Home'

/** Mirrors HomeRecommendZoneSection without importing the type from 'use server' module. */
type HomeRecommendZoneSection = Awaited<
  ReturnType<typeof getHomeRecommendZones>
>['zones'][number]

type CacheEntry = {
  lang: string
  zones: HomeRecommendZoneSection[]
  fetchedAt: number
}

let cache: CacheEntry | null = null
let inflight: Promise<HomeRecommendZoneSection[]> | null = null
let inflightLang = ''

/** Short TTL — zones change infrequently; names refresh on next fetch. */
const TTL_MS = 2 * 60 * 1000

export function peekCachedHomeRecommendZones(lang?: string): HomeRecommendZoneSection[] | null {
  if (!cache) return null
  if (lang && cache.lang !== lang) return null
  if (Date.now() - cache.fetchedAt > TTL_MS) return null
  return cache.zones
}

/**
 * Deduped home recommend-zone fetch (critical path for mobile + desktop home).
 * Keeps last good zones on failure so the stream does not flash empty.
 */
export async function loadHomeRecommendZonesCached(lang: string): Promise<HomeRecommendZoneSection[]> {
  const normalized = String(lang || 'en').trim() || 'en'
  const fresh = peekCachedHomeRecommendZones(normalized)
  if (fresh) return fresh

  if (inflight && inflightLang === normalized) {
    return inflight
  }

  inflightLang = normalized
  inflight = getHomeRecommendZones({ lang: normalized })
    .then((res) => {
      const zones = Array.isArray(res.zones) ? res.zones : []
      cache = { lang: normalized, zones, fetchedAt: Date.now() }
      return zones
    })
    .catch((err) => {
      if (cache?.zones?.length) return cache.zones
      throw err
    })
    .finally(() => {
      inflight = null
      inflightLang = ''
    })

  return inflight
}
