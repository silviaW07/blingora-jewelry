import type { ProductDetailData } from '@/frontend/actions/ProductDetail'
import { isStorefrontVisibleProduct } from '@/shared/storefrontProductVisibility'

const PROJECT_ID =
  process.env.NEXT_PUBLIC_PROJECT_ID || 'PROJ_fcb9e6ee_snap_20260726_092922_893'

function rpcUrl() {
  const base = process.env.RPC_INTERNAL_URL || 'http://127.0.0.1:3100'
  return `${base.replace(/\/$/, '')}/rpc/${PROJECT_ID}/`
}

export async function loadProductDetail(input: {
  productId?: string
  slug?: string
  lang?: string
}): Promise<ProductDetailData | null> {
  const productId = String(input.productId || '').trim()
  const slug = String(input.slug || '').trim()
  if (!productId && !slug) return null
  try {
    const resp = await fetch(rpcUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actionName: 'src.frontend.actions.ProductDetail.getProductDetail',
        args: [{ productId, slug, lang: input.lang || 'en' }],
      }),
      cache: 'no-store',
    })
    if (!resp.ok) return null
    const raw = await resp.json()
    const data = raw?.json ?? raw
    const product = data?.product as ProductDetailData | undefined
    if (!product?.id || !isStorefrontVisibleProduct(product)) return null
    return product
  } catch (err) {
    console.error('[loadProductDetail]', err)
    return null
  }
}
