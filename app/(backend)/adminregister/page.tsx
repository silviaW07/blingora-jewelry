// {"router": "/adminregister", "id": "b02", "en_name": "AdminRegister"}
'use client';

import { useAdminRegister } from '@/backend/hooks/useAdminRegister';
import AdminRegisterView from '@/backend/components/AdminRegisterView';
export default function AdminRegisterPage() {
  const {
    state,
    handlers
  } = useAdminRegister();
  return <AdminRegisterView state={state} handlers={handlers} />;
}
