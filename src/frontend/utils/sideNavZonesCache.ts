import {
  getCategorySideNavZones,
  type GetCategorySideNavZonesOutput,
  type SideNavZoneSection,
} from '@/frontend/actions/ProductCategory'

type CacheEntry = {
  lang: string
  zones: SideNavZoneSection[]
  fetchedAt: number
}

let cache: CacheEntry | null = null
let inflight: Promise<SideNavZoneSection[]> | null = null
let inflightLang = ''

const TTL_MS = 2 * 60 * 1000

export function peekCachedSideNavZones(lang?: string): SideNavZoneSection[] | null {
  if (!cache) return null
  if (lang && cache.lang !== lang) return null
  if (Date.now() - cache.fetchedAt > TTL_MS) return null
  return cache.zones
}

export async function loadSideNavZonesCached(lang: string): Promise<SideNavZoneSection[]> {
  const normalized = String(lang || 'en').trim() || 'en'
  const fresh = peekCachedSideNavZones(normalized)
  if (fresh) return fresh

  if (inflight && inflightLang === normalized) {
    return inflight
  }

  inflightLang = normalized
  inflight = getCategorySideNavZones({ lang: normalized })
    .then((res: GetCategorySideNavZonesOutput) => {
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
