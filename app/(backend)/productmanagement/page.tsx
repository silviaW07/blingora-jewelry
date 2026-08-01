// {"router": "/productmanagement", "id": "b04", "en_name": "ProductManagement"}
'use client';

import { useProductManagement } from '@/backend/hooks/useProductManagement';
import ProductManagementView from '@/backend/components/ProductManagementView';
export default function ProductManagementPage() {
  const {
    state,
    handlers
  } = useProductManagement();
  return <ProductManagementView state={state} handlers={handlers} />;
}
