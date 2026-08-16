import { getHomeRecommendZones } from '@/frontend/actions/Home'
import { fetchStorefrontBootstrap } from '@/frontend/utils/storefrontBootstrapClient'

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
const STORAGE_KEY = 'sj.home-zones.v2'

function readSession(lang: string): CacheEntry | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CacheEntry
    if (!Array.isArray(parsed?.zones) || parsed.zones.length === 0) return null
    if (parsed.lang !== lang) return null
    if (Date.now() - parsed.fetchedAt > TTL_MS) return null
    return parsed
  } catch {
    return null
  }
}

function writeSession(entry: CacheEntry) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entry))
  } catch {
    // quota / private mode
  }
}

export function seedHomeRecommendZonesCache(zones: HomeRecommendZoneSection[], lang = 'en') {
  if (!Array.isArray(zones) || zones.length === 0) return
  const entry: CacheEntry = {
    lang: String(lang || 'en').trim() || 'en',
    zones,
    fetchedAt: Date.now(),
  }
  cache = entry
  writeSession(entry)
}

export function peekCachedHomeRecommendZones(lang?: string): HomeRecommendZoneSection[] | null {
  const normalized = String(lang || '').trim()
  if (cache) {
    if ((!normalized || cache.lang === normalized) && Date.now() - cache.fetchedAt <= TTL_MS) {
      return cache.zones
    }
  }
  if (normalized) {
    const fromSession = readSession(normalized)
    if (fromSession) {
      cache = fromSession
      return fromSession.zones
    }
  }
  return null
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
  inflight = fetchStorefrontBootstrap(normalized)
    .then((boot) => {
      if (boot?.recommendZones?.length) return boot.recommendZones
      return getHomeRecommendZones({ lang: normalized }).then((res) =>
        Array.isArray(res.zones) ? res.zones : [],
      )
    })
    .then((zones) => {
      cache = { lang: normalized, zones, fetchedAt: Date.now() }
      writeSession(cache)
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
