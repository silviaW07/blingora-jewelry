// {"router": "/account", "id": "f07", "en_name": "AccountCenter"}
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AccountProfile } from '@/frontend/route-params'

export default function AccountIndexPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace(AccountProfile.path)
  }, [router])
  return null
}
