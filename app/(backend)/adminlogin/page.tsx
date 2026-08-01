// {"router": "/adminlogin", "id": "b01", "en_name": "AdminLogin"}
'use client';

import { useAdminLogin } from '@/backend/hooks/useAdminLogin';
import AdminLoginView from '@/backend/components/AdminLoginView';
export default function AdminLoginPage() {
  const {
    state,
    handlers
  } = useAdminLogin();
  return <AdminLoginView state={state} handlers={handlers} />;
}
