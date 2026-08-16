import {
  getCategoryList,
  type CategoryItem,
  type GetCategoryListOutput,
} from '@/frontend/actions/ProductCategory'
import { fetchStorefrontBootstrap } from '@/frontend/utils/storefrontBootstrapClient'

type CacheEntry = {
  lang: string
  list: CategoryItem[]
  fetchedAt: number
}

let cache: CacheEntry | null = null
let inflight: Promise<CategoryItem[]> | null = null
let inflightLang = ''

const TTL_MS = 5 * 60 * 1000
const STORAGE_KEY = 'sj.category-list.v1'

function readSession(lang: string): CacheEntry | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CacheEntry
    if (!Array.isArray(parsed?.list) || parsed.list.length === 0) return null
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

export function seedCategoryListCache(list: CategoryItem[], lang = 'en') {
  if (!Array.isArray(list) || list.length === 0) return
  const entry: CacheEntry = {
    lang: String(lang || 'en').trim() || 'en',
    list,
    fetchedAt: Date.now(),
  }
  cache = entry
  writeSession(entry)
}

export function peekCachedCategoryList(lang?: string): CategoryItem[] | null {
  const normalized = String(lang || '').trim()
  if (cache) {
    if ((!normalized || cache.lang === normalized) && Date.now() - cache.fetchedAt <= TTL_MS) {
      return cache.list
    }
  }
  if (normalized) {
    const fromSession = readSession(normalized)
    if (fromSession) {
      cache = fromSession
      return fromSession.list
    }
  }
  return null
}

/**
 * Deduped category-list fetch. Keeps last good list on failure so nav never flashes empty.
 */
export async function loadCategoryListCached(lang: string): Promise<CategoryItem[]> {
  const normalized = String(lang || 'en').trim() || 'en'
  const fresh = peekCachedCategoryList(normalized)
  if (fresh) return fresh

  if (inflight && inflightLang === normalized) {
    return inflight
  }

  inflightLang = normalized
  inflight = fetchStorefrontBootstrap(normalized)
    .then((boot) => {
      if (boot?.categories?.length) return boot.categories
      return getCategoryList({ lang: normalized }).then((res: GetCategoryListOutput) =>
        Array.isArray(res.list) ? res.list : [],
      )
    })
    .then((list) => {
      cache = { lang: normalized, list, fetchedAt: Date.now() }
      writeSession(cache)
      return list
    })
    .catch((err) => {
      // Keep previous list if any (even expired) — avoid empty nav flash
      if (cache?.list?.length) return cache.list
      throw err
    })
    .finally(() => {
      inflight = null
      inflightLang = ''
    })

  return inflight
}
