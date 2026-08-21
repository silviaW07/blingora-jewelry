import { NextResponse } from 'next/server'
import { loadStorefrontBootstrap } from '@/frontend/lib/loadStorefrontBootstrap'
import { loadStorefrontProducts } from '@/frontend/lib/loadStorefrontProducts'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export async function GET(request: Request) {
  const url = new URL(request.url)
  const lang = url.searchParams.get('lang') || 'en'
  const daily = url.searchParams.get('daily') === '1'
  const search = String(url.searchParams.get('search') || '').trim()
  const slug = String(url.searchParams.get('slug') || '').trim()
  const categoryId = String(url.searchParams.get('category_id') || '').trim()
  const brandCategoryId = String(url.searchParams.get('brand_category_id') || '').trim()
  const sortBy = String(url.searchParams.get('sort_by') || 'NEWEST').trim() || 'NEWEST'
  const minPriceRaw = url.searchParams.get('min_price')
  const maxPriceRaw = url.searchParams.get('max_price')
  const minPrice =
    minPriceRaw !== null && minPriceRaw !== '' && !Number.isNaN(Number(minPriceRaw))
      ? Number(minPriceRaw)
      : undefined
  const maxPrice =
    maxPriceRaw !== null && maxPriceRaw !== '' && !Number.isNaN(Number(maxPriceRaw))
      ? Number(maxPriceRaw)
      : undefined
  const page = Math.max(1, Number(url.searchParams.get('page') || 1) || 1)
  const pageSize = Math.min(24, Math.max(1, Number(url.searchParams.get('page_size') || 24) || 24))

  // Floating recommend tags (Normal quality / Below 13usd) are not in the nav tree;
  // bootstrap.recommendZones lets slug → id resolve before RPC fallback.
  const needsBootstrap = Boolean(slug && !categoryId && !daily && !search)
  const bootstrap = needsBootstrap ? await loadStorefrontBootstrap(lang).catch(() => null) : null

  const data = await loadStorefrontProducts({
    lang,
    daily,
    search,
    slug,
    categoryId,
    brandCategoryId,
    sortBy,
    minPrice,
    maxPrice,
    page,
    pageSize,
    categoryTree: bootstrap?.categories,
    recommendZones: bootstrap?.recommendZones,
  })
  return NextResponse.json(
    { list: data.list, total: data.total },
    {
      headers: {
        'Cache-Control': 'private, no-store, max-age=0',
      },
    },
  )
}
