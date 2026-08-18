import { slimProductCards, type ShelfProductCard } from '@/frontend/utils/categoryPreviewProducts'

export async function fetchCategoryShelfProducts(input: {
  categoryId?: string
  slug?: string
  daily?: boolean
  search?: string
  lang?: string
  page?: number
  pageSize?: number
}): Promise<ShelfProductCard[]> {
  if (typeof window === 'undefined') return []
  const params = new URLSearchParams()
  if (input.daily) params.set('daily', '1')
  if (input.search) params.set('search', input.search)
  if (input.slug) params.set('slug', input.slug)
  if (!input.daily && input.categoryId) params.set('category_id', input.categoryId)
  params.set('page', String(Math.max(1, input.page || 1)))
  params.set('page_size', String(Math.min(48, Math.max(1, input.pageSize || 24))))
  params.set('lang', String(input.lang || 'en'))
  params.set('sort_by', 'NEWEST')

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 12000)
  try {
    const res = await fetch(`/api/storefront/products?${params.toString()}`, {
      cache: 'no-store',
      credentials: 'same-origin',
      headers: { Accept: 'application/json', 'Cache-Control': 'no-store' },
      signal: controller.signal,
    })
    if (!res.ok) return []
    const data = (await res.json()) as { list?: unknown }
    return slimProductCards(data?.list)
  } catch {
    return []
  } finally {
    window.clearTimeout(timer)
  }
}
