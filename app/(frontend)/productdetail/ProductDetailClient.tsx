'use client'

import { useProductDetail } from '@/frontend/hooks/useProductDetail'
import ProductDetailView from '@/frontend/components/ProductDetailView'
import type { ProductDetailData } from '@/frontend/actions/ProductDetail'

type Props = {
  productId: string
  slug: string
  decorate?: boolean
  initialProduct?: ProductDetailData | null
}

export default function ProductDetailClient({
  productId,
  slug,
  decorate = false,
  initialProduct = null,
}: Props) {
  const { state, handlers } = useProductDetail({
    productId,
    slug,
    decorate,
    initialProduct,
  })
  return <ProductDetailView state={state} handlers={handlers} />
}
