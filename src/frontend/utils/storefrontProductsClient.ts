import { slimProductCards, type ShelfProductCard } from '@/frontend/utils/categoryPreviewProducts'

export async function fetchCategoryShelfProducts(input: {
  categoryId?: string
  daily?: boolean
  lang?: string
}): Promise<ShelfProductCard[]> {
  if (typeof window === 'undefined') return []
  const params = new URLSearchParams()
  if (input.daily) params.set('daily', '1')
  else if (input.categoryId) params.set('category_id', input.categoryId)
  params.set('page', '1')
  params.set('page_size', '24')
  params.set('lang', String(input.lang || 'en'))
  params.set('sort_by', 'NEWEST')

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 12000)
  try {
    const res = await fetch(`/api/storefront/products?${params.toString()}`, {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
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
