import { NextResponse } from 'next/server'
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
  const page = Math.max(1, Number(url.searchParams.get('page') || 1) || 1)
  const pageSize = Math.min(24, Math.max(1, Number(url.searchParams.get('page_size') || 24) || 24))

  const data = await loadStorefrontProducts({
    lang,
    daily,
    search,
    slug,
    categoryId,
    page,
    pageSize,
  })
  return NextResponse.json(
    { list: data.list },
    {
      headers: {
        'Cache-Control': 'private, no-store, max-age=0',
      },
    },
  )
}
