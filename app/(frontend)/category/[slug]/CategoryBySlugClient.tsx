'use client'

import { useProductCategory } from '@/frontend/hooks/useProductCategory'
import ProductCategoryView from '@/frontend/components/ProductCategoryView'
import type { StorefrontBootstrap } from '@/frontend/types/storefrontBootstrap'
import type { ProductItem } from '@/frontend/actions/ProductCategory'

export default function CategoryBySlugClient({
  bootstrap,
  initialCategoryId,
  initialProducts,
}: {
  bootstrap?: StorefrontBootstrap | null
  initialCategoryId?: string
  initialProducts?: ProductItem[]
}) {
  const { state, handlers } = useProductCategory(bootstrap, {
    categoryId: initialCategoryId,
    products: initialProducts,
  })
  return <ProductCategoryView state={state} handlers={handlers} />
}
