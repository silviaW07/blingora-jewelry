'use client'

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Menu } from 'lucide-react'
import Sidebar from "@/components/layout/backend/Sidebar"
import "@/index.css"
import "./theme-style.css"
import { PageErrorBoundary } from '@/default/NextPageErrorBoundary'
import BackendAuthGuard from "@/tools/BackendAuthGuard"
import { AuthExpiredDialog } from '@/backend/auth/rpc-auth'







// 不需要侧边栏的路径白名单（模板，后续可修改）
const FULLSCREEN_PATHS = ['/adminlogin', '/adminregister']

interface RootLayoutProps {
  children: React.ReactNode
}

export default function BackendLayout({ children }: RootLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const handleGoBack = () => router.back()
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false)
  React.useEffect(() => { setMobileNavOpen(false) }, [pathname])
  const isFullscreen = FULLSCREEN_PATHS.some((p) => pathname.toLowerCase().startsWith(p.toLowerCase()))

  return (
    <div className={`font-sans min-h-screen`}>
      <AuthExpiredDialog />
      <BackendAuthGuard>
        {isFullscreen ? (
          <div className="flex-1"> 
            <PageErrorBoundary key={pathname} onGoBack={handleGoBack}>{children}</PageErrorBoundary>
          </div>
        ) : (
          <div className="flex h-dvh min-w-0">
            <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <div className="sticky top-0 z-40 flex h-12 shrink-0 items-center gap-2 border-b bg-white px-3 md:hidden">
                <button type="button" aria-label="打开菜单" className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-700" onClick={() => setMobileNavOpen(true)}>
                  <Menu className="h-5 w-5" />
                </button>
                <span className="truncate text-sm font-semibold text-slate-900">后台</span>
              </div>
              <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-auto">
                <PageErrorBoundary key={pathname} onGoBack={handleGoBack}>{children}</PageErrorBoundary>
              </div>
            </div>
          </div>
        )}
      </BackendAuthGuard>
    </div>
  )
}
