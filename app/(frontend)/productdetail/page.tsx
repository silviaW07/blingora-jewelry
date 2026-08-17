// {"router": "/productdetail", "id": "f03", "en_name": "ProductDetail"}
import ProductDetailClient from './ProductDetailClient'
import { loadProductDetail } from '@/frontend/lib/loadProductDetail'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type SearchParams = {
  productId?: string | string[]
  slug?: string | string[]
  decorate?: string | string[]
}

const first = (value?: string | string[]) =>
  String(Array.isArray(value) ? value[0] : value || '').trim()

export default async function ProductDetailPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams> | SearchParams
}) {
  const sp = await Promise.resolve(searchParams)
  const productId = first(sp.productId)
  const slug = first(sp.slug)
  const decorate = first(sp.decorate) === '1'
  const initialProduct =
    productId || slug ? await loadProductDetail({ productId, slug }) : null

  return (
    <ProductDetailClient
      productId={productId}
      slug={slug}
      decorate={decorate}
      initialProduct={initialProduct}
    />
  )
}
