import { NextResponse } from 'next/server'
import { loadStorefrontBootstrap } from '@/frontend/lib/loadStorefrontBootstrap'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export async function GET(request: Request) {
  const lang = new URL(request.url).searchParams.get('lang') || 'en'
  const data = await loadStorefrontBootstrap(lang)
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  })
}
