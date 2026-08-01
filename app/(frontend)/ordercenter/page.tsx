// 兼容旧链接 /ordercenter → /account/orders
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AccountOrders } from '@/frontend/route-params'

export default function OrderCenterRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace(AccountOrders.path)
  }, [router])
  return null
}
