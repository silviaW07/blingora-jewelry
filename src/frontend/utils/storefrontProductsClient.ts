import { slimProductCards, type ShelfProductCard } from '@/frontend/utils/categoryPreviewProducts'

export async function fetchCategoryShelfProducts(input: {
  categoryId?: string
  brandCategoryId?: string
  slug?: string
  daily?: boolean
  search?: string
  lang?: string
  page?: number
  pageSize?: number
  minPrice?: number
  maxPrice?: number
  sortBy?: string
}): Promise<{ list: ShelfProductCard[]; total: number }> {
  if (typeof window === 'undefined') return { list: [], total: 0 }
  const params = new URLSearchParams()
  if (input.daily) params.set('daily', '1')
  if (input.search) params.set('search', input.search)
  if (input.slug) params.set('slug', input.slug)
  if (!input.daily && input.categoryId) params.set('category_id', input.categoryId)
  if (input.brandCategoryId) params.set('brand_category_id', input.brandCategoryId)
  if (input.minPrice !== undefined && !Number.isNaN(input.minPrice)) {
    params.set('min_price', String(input.minPrice))
  }
  if (input.maxPrice !== undefined && !Number.isNaN(input.maxPrice)) {
    params.set('max_price', String(input.maxPrice))
  }
  params.set('page', String(Math.max(1, input.page || 1)))
  params.set('page_size', String(Math.min(60, Math.max(1, input.pageSize || 60))))
  params.set('lang', String(input.lang || 'en'))
  params.set('sort_by', String(input.sortBy || 'NEWEST'))

  const controller = new AbortController()
  // Chrome Android (especially behind VPN / slow DNS) may take >12s to return.
  // Keep longer so UI doesn't settle early with an empty list.
  const timer = window.setTimeout(() => controller.abort(), 20000)
  try {
    const res = await fetch(`/api/storefront/products?${params.toString()}`, {
      cache: 'no-store',
      credentials: 'same-origin',
      headers: { Accept: 'application/json', 'Cache-Control': 'no-store' },
      signal: controller.signal,
    })
    if (!res.ok) return { list: [], total: 0 }
    const data = (await res.json()) as { list?: unknown; total?: number }
    const list = slimProductCards(data?.list)
    const total = typeof data?.total === 'number' ? data.total : list.length
    return { list, total }
  } catch {
    return { list: [], total: 0 }
  } finally {
    window.clearTimeout(timer)
  }
}
