import type { StorefrontBootstrap } from '@/frontend/types/storefrontBootstrap'

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

export async function loadStorefrontBootstrap(lang = 'en'): Promise<StorefrontBootstrap> {
  const normalized = String(lang || 'en').trim() || 'en'
  const [categories, posters, recommendZones] = await Promise.all([
    rpcAction<{ list?: StorefrontBootstrap['categories'] }>(
      'src.frontend.actions.ProductCategory.getCategoryList',
      [{ lang: normalized }],
    )
      .then((res) => (Array.isArray(res.list) ? res.list : []))
      .catch((err) => {
        console.error('[storefront-bootstrap] categories', err)
        return []
      }),
    rpcAction<{ list?: StorefrontBootstrap['posters'] }>(
      'src.frontend.actions.ProductCategory.getCategoryPosterList',
      [{}],
    )
      .then((res) => (Array.isArray(res.list) ? res.list : []))
      .catch((err) => {
        console.error('[storefront-bootstrap] posters', err)
        return []
      }),
    rpcAction<{ zones?: StorefrontBootstrap['recommendZones'] }>(
      'src.frontend.actions.Home.getHomeRecommendZones',
      [{ lang: normalized }],
    )
      .then((res) => (Array.isArray(res.zones) ? res.zones : []))
      .catch((err) => {
        console.error('[storefront-bootstrap] zones', err)
        return []
      }),
  ])
  return { categories, posters, recommendZones }
}
