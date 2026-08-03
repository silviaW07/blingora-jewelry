import {
  getCategoryList,
  type CategoryItem,
  type GetCategoryListOutput,
} from '@/frontend/actions/ProductCategory'

type CacheEntry = {
  lang: string
  list: CategoryItem[]
  fetchedAt: number
}

let cache: CacheEntry | null = null
let inflight: Promise<CategoryItem[]> | null = null
let inflightLang = ''

const TTL_MS = 5 * 60 * 1000

export function peekCachedCategoryList(lang?: string): CategoryItem[] | null {
  if (!cache) return null
  if (lang && cache.lang !== lang) return null
  if (Date.now() - cache.fetchedAt > TTL_MS) return null
  return cache.list
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
  inflight = getCategoryList({ lang: normalized })
    .then((res: GetCategoryListOutput) => {
      const list = Array.isArray(res.list) ? res.list : []
      cache = { lang: normalized, list, fetchedAt: Date.now() }
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
