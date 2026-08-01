// {"router": "/usermanagement", "id": "b07", "en_name": "UserManagement"}
'use client';

import { useUserManagement } from '@/backend/hooks/useUserManagement';
import UserManagementView from '@/backend/components/UserManagementView';
export default function UserManagementPage() {
  const {
    state,
    handlers
  } = useUserManagement();
  return <UserManagementView state={state} handlers={handlers} />;
}
