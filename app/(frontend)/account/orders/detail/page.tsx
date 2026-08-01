// {"router": "/account/orders/detail", "id": "f08d", "en_name": "AccountOrderDetail"}
'use client'

import { Suspense } from 'react'
import AccountOrderDetailView from '@/frontend/components/AccountOrderDetailView'

export default function AccountOrderDetailPage() {
  return (
    <Suspense fallback={null}>
      <AccountOrderDetailView />
    </Suspense>
  )
}
