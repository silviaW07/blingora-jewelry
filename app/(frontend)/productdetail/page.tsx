// {"router": "/productdetail", "id": "f03", "en_name": "ProductDetail"}
'use client';

import { useProductDetail } from '@/frontend/hooks/useProductDetail';
import ProductDetailView from '@/frontend/components/ProductDetailView';
export default function ProductDetailPage() {
  const {
    state,
    handlers
  } = useProductDetail();
  return <ProductDetailView state={state} handlers={handlers} />;
}
