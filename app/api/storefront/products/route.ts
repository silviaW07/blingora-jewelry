import { NextResponse } from 'next/server'
import { slimProductCards } from '@/frontend/utils/categoryPreviewProducts'

export const dynamic = 'force-dynamic'
export const revalidate = 60

const PROJECT_ID =
  process.env.NEXT_PUBLIC_PROJECT_ID || 'PROJ_fcb9e6ee_snap_20260726_092922_893'

function rpcUrl() {
  const base = process.env.RPC_INTERNAL_URL || 'http://127.0.0.1:3100'
  return `${base.replace(/\/$/, '')}/rpc/${PROJECT_ID}/`
}

async function rpcAction<T>(actionName: string, args: unknown[] = []): Promise<T> {
  const resp = await fetch(rpcUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actionName, args }),
    cache: 'no-store',
  })
  if (!resp.ok) {
    throw new Error(`${actionName} HTTP ${resp.status}`)
  }
  const raw = await resp.json()
  return (raw?.json ?? raw) as T
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const lang = url.searchParams.get('lang') || 'en'
  const daily = url.searchParams.get('daily') === '1'
  const search = String(url.searchParams.get('search') || '').trim()
  const categoryId = String(url.searchParams.get('category_id') || '').trim()
  const page = Math.max(1, Number(url.searchParams.get('page') || 1) || 1)
  const pageSize = Math.min(24, Math.max(1, Number(url.searchParams.get('page_size') || 24) || 24))

  try {
    const data = daily
      ? await rpcAction<{ list?: unknown }>(
          'src.frontend.actions.Home.getDailyNewArrivalProducts',
          [{ page, page_size: pageSize, lang }],
        )
      : await rpcAction<{ list?: unknown }>(
          'src.frontend.actions.ProductCategory.getProductList',
          [
            {
              category_id: categoryId || undefined,
              search_keyword: search || undefined,
              page,
              page_size: pageSize,
              sort_by: 'NEWEST',
              lang,
            },
          ],
        )
    return NextResponse.json(
      { list: slimProductCards(data?.list) },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      },
    )
  } catch (error) {
    console.error('[storefront-products]', error)
    return NextResponse.json({ list: [] }, { status: 200 })
  }
}
