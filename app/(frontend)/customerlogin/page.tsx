// {"router": "/customerlogin", "id": "f05", "en_name": "CustomerLogin"}
'use client';

import { useCustomerLogin } from '@/frontend/hooks/useCustomerLogin';
import CustomerLoginView from '@/frontend/components/CustomerLoginView';
export default function CustomerLoginPage() {
  const {
    state,
    handlers
  } = useCustomerLogin();
  return <CustomerLoginView state={state} handlers={handlers} />;
}
