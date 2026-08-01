'use client'

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
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
          <div className="flex h-screen">
            <div className="shrink-0 w-fit"><Sidebar /></div>
            <div className="flex-1 overflow-y-auto">
              <PageErrorBoundary key={pathname} onGoBack={handleGoBack}>{children}</PageErrorBoundary>
            </div>
          </div>
        )}
      </BackendAuthGuard>
    </div>
  )
}
