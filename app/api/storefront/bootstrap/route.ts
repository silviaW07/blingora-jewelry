import { NextResponse } from 'next/server'
import { loadStorefrontBootstrap } from '@/frontend/lib/loadStorefrontBootstrap'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams
  const lang = searchParams.get('lang') || 'en'
  const force = searchParams.has('refresh')
  const data = await loadStorefrontBootstrap(lang, {
    force,
  })
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': force
        ? 'private, no-store, max-age=0'
        : 'public, s-maxage=60, stale-while-revalidate=300',
    },
  })
}
