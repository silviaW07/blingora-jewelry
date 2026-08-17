import { isComingSoonRecommendZoneTitle } from '@/frontend/utils/recommendZoneDisplay'
import { isDailyNewArrivalCategoryName } from '@/frontend/utils/dailyNewArrival'

export type ShelfProductCard = {
  product_id: string
  product_name: string
  main_image_url: string
  price: number
  price_max?: number | null
  variant_thumbnails?: string[]
  min_order_quantity?: number | null
}

type CategoryRef = {
  category_id: string
  category_name: string
  children?: Array<{ category_id: string }>
}

type ZoneProductLike = {
  entityType?: string
  productId?: string
  product_id?: string
  categoryId?: string | null
  productName?: string
  product_name?: string
  imageUrl?: string | null
  main_image_url?: string
  price?: number | null
  priceMin?: number | null
  priceMax?: number | null
  price_max?: number | null
  latestProducts?: ZoneProductLike[]
}

type ZoneLike = {
  title?: string | null
  zoneType?: string | null
  items?: ZoneProductLike[]
}

const norm = (value?: string | null) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s/_-]+/g, '')

function toCard(item: ZoneProductLike | null | undefined): ShelfProductCard | null {
  if (!item) return null
  const productId = String(item.productId || item.product_id || '').trim()
  if (!productId) return null
  const name = String(item.productName || item.product_name || '').trim()
  const image = String(item.imageUrl || item.main_image_url || '').trim()
  const priceRaw = item.price ?? item.priceMin
  const price = typeof priceRaw === 'number' && Number.isFinite(priceRaw) ? priceRaw : 0
  const priceMax = item.priceMax ?? item.price_max ?? null
  return {
    product_id: productId,
    product_name: name || 'Product',
    main_image_url: image,
    price,
    price_max: typeof priceMax === 'number' && Number.isFinite(priceMax) ? priceMax : null,
  }
}

function collectIds(cat: CategoryRef): Set<string> {
  const ids = new Set<string>()
  if (cat.category_id) ids.add(cat.category_id)
  for (const child of cat.children || []) {
    if (child.category_id) ids.add(child.category_id)
  }
  return ids
}

function pushUnique(
  out: ShelfProductCard[],
  seen: Set<string>,
  item: ZoneProductLike | null | undefined,
) {
  const card = toCard(item)
  if (!card || seen.has(card.product_id)) return
  seen.add(card.product_id)
  out.push(card)
}

/**
 * Instant category-shelf products from home recommend zones (SSR HTML).
 * Chrome mobile can show L2 + cards before any client RPC/server action.
 */
export function buildCategoryPreviewProducts(
  categories: CategoryRef[],
  zones: ZoneLike[] | null | undefined,
): Record<string, ShelfProductCard[]> {
  const list = Array.isArray(zones) ? zones : []
  const result: Record<string, ShelfProductCard[]> = {}

  for (const cat of categories) {
    const ids = collectIds(cat)
    const out: ShelfProductCard[] = []
    const seen = new Set<string>()
    const isNew = isDailyNewArrivalCategoryName(cat.category_name)

    for (const zone of list) {
      if (isComingSoonRecommendZoneTitle(zone.title)) continue
      for (const item of zone.items || []) {
        if (item.entityType === 'CATEGORY' && item.categoryId && ids.has(item.categoryId)) {
          for (const latest of item.latestProducts || []) pushUnique(out, seen, latest)
          continue
        }
        if (item.entityType === 'PRODUCT' || item.productId) {
          if (isNew) {
            pushUnique(out, seen, item)
            continue
          }
          if (item.categoryId && ids.has(item.categoryId)) {
            pushUnique(out, seen, item)
          }
        }
      }
    }

    if (out.length === 0 && !isNew) {
      const catKey = norm(cat.category_name)
      if (catKey) {
        const matched = list.find((zone) => {
          const titleKey = norm(zone.title)
          return Boolean(titleKey) && (titleKey.includes(catKey) || catKey.includes(titleKey))
        })
        for (const item of matched?.items || []) {
          if (item.entityType === 'PRODUCT' || item.productId) pushUnique(out, seen, item)
        }
      }
    }

    result[cat.category_id] = out.slice(0, 24)
  }

  return result
}

export function findZoneItemImage(categoryId: string, zones: ZoneLike[] | null | undefined): string | null {
  const id = String(categoryId || '').trim()
  if (!id) return null
  for (const zone of Array.isArray(zones) ? zones : []) {
    for (const item of zone.items || []) {
      if (item.entityType === 'CATEGORY' && String(item.categoryId || '') === id) {
        const self = String(item.imageUrl || item.main_image_url || '').trim()
        if (self) return self
        const latest = item.latestProducts?.[0]
        const fromLatest = String(latest?.imageUrl || latest?.main_image_url || '').trim()
        if (fromLatest) return fromLatest
      }
      if ((item.entityType === 'PRODUCT' || item.productId) && String(item.categoryId || '') === id) {
        const url = String(item.imageUrl || item.main_image_url || '').trim()
        if (url) return url
      }
    }
  }
  return null
}

export function slimProductCards(list: unknown): ShelfProductCard[] {
  if (!Array.isArray(list)) return []
  const out: ShelfProductCard[] = []
  const seen = new Set<string>()
  for (const raw of list) {
    const row = (raw || {}) as Record<string, unknown>
    const productId = String(row.product_id || row.productId || '').trim()
    if (!productId || seen.has(productId)) continue
    seen.add(productId)
    const priceRaw = row.price
    const priceMaxRaw = row.price_max ?? row.priceMax
    out.push({
      product_id: productId,
      product_name: String(row.product_name || row.productName || 'Product'),
      main_image_url: String(row.main_image_url || row.imageUrl || ''),
      price: typeof priceRaw === 'number' && Number.isFinite(priceRaw) ? priceRaw : 0,
      price_max:
        typeof priceMaxRaw === 'number' && Number.isFinite(priceMaxRaw) ? priceMaxRaw : null,
      variant_thumbnails: Array.isArray(row.variant_thumbnails)
        ? row.variant_thumbnails.filter((url): url is string => typeof url === 'string')
        : undefined,
      min_order_quantity:
        typeof row.min_order_quantity === 'number' ? row.min_order_quantity : null,
    })
  }
  return out
}
