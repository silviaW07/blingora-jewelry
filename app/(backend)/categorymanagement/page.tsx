'use client';

import { useCategoryManagement } from '@/backend/hooks/useCategoryManagement';
import { CategoryManagementView } from '@/backend/components/CategoryManagementView';

export default function CategoryManagementPage() {
  const { state, handlers } = useCategoryManagement();
  return <CategoryManagementView state={state} handlers={handlers} />;
}
