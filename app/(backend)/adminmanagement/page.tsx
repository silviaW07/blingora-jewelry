// {"router": "/adminmanagement", "id": "b19", "en_name": "AdminManagement"}
'use client';

import { useAdminManagement } from '@/backend/hooks/useAdminManagement';
import AdminManagementView from '@/backend/components/AdminManagementView';

export default function AdminManagementPage() {
  const { state, handlers } = useAdminManagement();
  return <AdminManagementView state={state} handlers={handlers} />;
}
