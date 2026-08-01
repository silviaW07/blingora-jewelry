// {"router": "/productcategory", "id": "f02", "en_name": "ProductCategory"}
'use client';

import { useProductCategory } from '@/frontend/hooks/useProductCategory';
import ProductCategoryView from '@/frontend/components/ProductCategoryView';
export default function ProductCategoryPage() {
  const {
    state,
    handlers
  } = useProductCategory();
  return <ProductCategoryView state={state} handlers={handlers} />;
}
