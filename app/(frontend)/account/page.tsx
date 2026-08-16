// {"router": "/account", "id": "f07", "en_name": "AccountCenter"}
'use client'

import { useEffect } from 'react'

export default function AccountIndexPage() {
  useEffect(() => {
    window.location.replace('/account/profile/')
  }, [])
  return (
    <div className="flex min-h-[40vh] items-center justify-center bg-[#FFF5F5] text-sm text-[#7a7468]">
      Loading account…
    </div>
  )
}
