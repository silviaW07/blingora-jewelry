// {"router": "/customerfollowup", "id": "b22", "en_name": "CustomerFollowUp"}
'use client';

import { useCustomerFollowUp } from '@/backend/hooks/useCustomerFollowUp';
import { CustomerFollowUpView } from '@/backend/components/CustomerFollowUpView';

export default function CustomerFollowUpPage() {
  const board = useCustomerFollowUp();
  return <CustomerFollowUpView {...board} />;
}
