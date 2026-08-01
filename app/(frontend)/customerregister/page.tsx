// {"router": "/customerregister", "id": "f06", "en_name": "CustomerRegister"}
'use client';

import { useCustomerRegister } from '@/frontend/hooks/useCustomerRegister';
import CustomerRegisterView from '@/frontend/components/CustomerRegisterView';
export default function CustomerRegisterPage() {
  const {
    state,
    handlers
  } = useCustomerRegister();
  return <CustomerRegisterView state={state} handlers={handlers} />;
}
