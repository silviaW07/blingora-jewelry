'use client'

import { useProductCategory } from '@/frontend/hooks/useProductCategory'
import ProductCategoryView from '@/frontend/components/ProductCategoryView'

export default function CategoryBySlugClient() {
  const { state, handlers } = useProductCategory()
  return <ProductCategoryView state={state} handlers={handlers} />
}
