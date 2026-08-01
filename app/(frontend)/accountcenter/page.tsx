// 兼容旧链接 /accountcenter → /account/profile
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AccountProfile } from '@/frontend/route-params'

export default function AccountCenterRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace(AccountProfile.path)
  }, [router])
  return null
}
