'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** 兼容旧入口 /apphome，统一跳转到前台首页 */
export default function AppHomeRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/')
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-white text-sm text-muted-foreground">
      Redirecting...
    </div>
  )
}
