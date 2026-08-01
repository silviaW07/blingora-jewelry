// {"router": "/account/orders/pay", "id": "f08p", "en_name": "AccountOrderPay"}
'use client'

import { Suspense } from 'react'
import AccountOrderPayView from '@/frontend/components/AccountOrderPayView'

export default function AccountOrderPayPage() {
  return (
    <Suspense fallback={null}>
      <AccountOrderPayView />
    </Suspense>
  )
}

