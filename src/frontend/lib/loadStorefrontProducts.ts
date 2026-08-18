import { slimProductCards, type ShelfProductCard } from '@/frontend/utils/categoryPreviewProducts'
import type { ProductItem, StockStatusEnum } from '@/frontend/actions/ProductCategory'

const PROJECT_ID =
  process.env.NEXT_PUBLIC_PROJECT_ID || 'PROJ_fcb9e6ee_snap_20260726_092922_893'

type CategoryRef = {
  category_id?: string
  category_slug?: string | null
  children?: CategoryRef[]
  brand_options?: CategoryRef[]
}

function rpcUrl() {
  const base = process.env.RPC_INTERNAL_URL || 'http://127.0.0.1:3100'
  return `${base.replace(/\/$/, '')}/rpc/${PROJECT_ID}/`
}

async function rpcAction<T>(actionName: string, args: unknown[] = []): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)
  try {
    const resp = await fetch(rpcUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionName, args }),
      cache: 'no-store',
      signal: controller.signal,
    })
    if (!resp.ok) {
      throw new Error(`${actionName} HTTP ${resp.status}`)
    }
    const raw = await resp.json()
    return (raw?.json ?? raw) as T
  } finally {
    clearTimeout(timer)
  }
}

export function resolveCategoryIdFromTree(list: CategoryRef[] | undefined, slugOrId: string): string {
  const normalized = String(slugOrId || '').trim()
  if (!normalized) return ''
  const needle = normalized.toLowerCase()
  const matchId = (item?: CategoryRef | null): string => {
    if (!item) return ''
    if (String(item.category_id || '') === normalized) return String(item.category_id)
    if (String(item.category_slug || '').trim().toLowerCase() === needle) {
      return String(item.category_id || '')
    }
    return ''
  }
  for (const cat of list || []) {
    const self = matchId(cat)
    if (self) return self
    for (const child of cat.children || []) {
      const id = matchId(child)
      if (id) return id
    }
    for (const brand of cat.brand_options || []) {
      const id = matchId(brand)
      if (id) return id
    }
  }
  return ''
}

export function shelfCardsToProductItems(list: ShelfProductCard[]): ProductItem[] {
  return list.map((card) => ({
    product_id: card.product_id,
    product_slug: '',
    product_name: card.product_name,
    main_image_url: card.main_image_url,
    short_description: null,
    rating_average: 0,
    rating_count: 0,
    stock_status: 'IN_STOCK' as StockStatusEnum,
    price: card.price,
    original_price: null,
    has_discount: false,
    sku_count: 1,
    first_sku_id: '',
    first_sku_price_rmb: 0,
    created_at_timestamp: 0,
    sort_weight: 0,
    brand_category_id: null,
    brand_category_name: null,
    variant_thumbnails: card.variant_thumbnails || [],
    min_order_quantity: card.min_order_quantity ?? null,
    price_max: card.price_max ?? null,
  }))
}

export async function loadStorefrontProducts(input: {
  lang?: string
  slug?: string
  categoryId?: string
  search?: string
  daily?: boolean
  page?: number
  pageSize?: number
  categoryTree?: CategoryRef[]
}): Promise<{ list: ShelfProductCard[]; categoryId: string }> {
  const lang = String(input.lang || 'en').trim() || 'en'
  const search = String(input.search || '').trim()
  const slug = String(input.slug || '').trim()
  const daily = Boolean(input.daily)
  const page = Math.max(1, Number(input.page || 1) || 1)
  const pageSize = Math.min(24, Math.max(1, Number(input.pageSize || 24) || 24))
  let categoryId = String(input.categoryId || '').trim()

  try {
    if (!categoryId && slug && !daily && !search) {
      const tree =
        input.categoryTree ||
        (
          await rpcAction<{ list?: CategoryRef[] }>('src.frontend.actions.ProductCategory.getCategoryList', [
            { lang },
          ])
        ).list
      categoryId = resolveCategoryIdFromTree(tree, slug)
    }

    if (!daily && !search && !categoryId) {
      return { list: [], categoryId: '' }
    }

    const data = daily
      ? await rpcAction<{ list?: unknown }>('src.frontend.actions.Home.getDailyNewArrivalProducts', [
          { page, page_size: pageSize, lang },
        ])
      : await rpcAction<{ list?: unknown }>('src.frontend.actions.ProductCategory.getProductList', [
          {
            category_id: categoryId || undefined,
            search_keyword: search || undefined,
            page,
            page_size: pageSize,
            sort_by: 'NEWEST',
            lang,
          },
        ])

    return { list: slimProductCards(data?.list), categoryId }
  } catch (error) {
    console.error('[storefront-products]', error)
    return { list: [], categoryId }
  }
}
