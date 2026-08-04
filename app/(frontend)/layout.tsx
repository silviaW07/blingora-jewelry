'use client'

import React, { Suspense } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Footer from '@/components/layout/frontend/Footer'
import TopPromotionBanner from '@/components/layout/frontend/TopPromotionBanner'
import FrontendAuthGuard from '@/tools/FrontendAuthGuard'
import { PageErrorBoundary } from '@/default/NextPageErrorBoundary'
import { DecorateModeProvider } from '@/frontend/decorate/DecorateContext'
import { WhatsAppFloatButton } from '@/frontend/components/WhatsAppFloatButton'
import { MobileBottomNav } from '@/frontend/components/MobileBottomNav'
import { CustomerAuthModalProvider } from '@/frontend/auth/CustomerAuthModalContext'
import { CustomerAuthModal } from '@/frontend/components/CustomerAuthModal'
import { CustomerAuthModalDecorateBridge } from '@/frontend/auth/CustomerAuthModalDecorateBridge'
import { I18nProvider } from '@/frontend/i18n/I18nProvider'

import '@/index.css'
import './theme-style.css'
import { AuthExpiredDialog } from '@/frontend/auth/rpc-auth'

// 不需要导航栏和页脚的路径白名单（模板，后续可修改）
const FULLSCREEN_PATHS = ['/customerlogin', '/customerregister']
/** 结账/购物车页：隐藏全站粉色促销倒计时条，改用页面内专用导航头 */
const CHECKOUT_PATHS = ['/cart']

interface RootLayoutProps {
  children: React.ReactNode
}

export default function FrontendLayout({ children }: RootLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const handleGoBack = () => router.back()
  const normalizedPath = pathname.toLowerCase()
  const isFullscreen = FULLSCREEN_PATHS.some((p) => normalizedPath.startsWith(p.toLowerCase()))
  const isCheckoutPage = CHECKOUT_PATHS.some((p) => normalizedPath === p || normalizedPath.startsWith(`${p}/`))
  const showPromotionBanner = !isFullscreen && !isCheckoutPage

  // Keep original nesting: Guard outside → avoids pulling auth-modal/RPC into the
  // outer module graph incorrectly. Auth modal open is driven by zustand store.
  return (
    <FrontendAuthGuard>
      <I18nProvider>
        <div className="font-sans min-h-screen bg-[#FFF5F5] flex flex-col">
          <AuthExpiredDialog />
          <Suspense fallback={null}>
            <CustomerAuthModalProvider>
              <DecorateModeProvider>
                {showPromotionBanner ? <TopPromotionBanner /> : null}
                <main className="flex-1 w-full min-h-0 storefront-main-with-mobile-nav">
                  <PageErrorBoundary key={pathname} onGoBack={handleGoBack}>{children}</PageErrorBoundary>
                </main>
                {isFullscreen ? null : <Footer />}
                {isFullscreen ? null : <MobileBottomNav />}
                <WhatsAppFloatButton />
              </DecorateModeProvider>
              <CustomerAuthModal />
              <CustomerAuthModalDecorateBridge />
            </CustomerAuthModalProvider>
          </Suspense>
        </div>
      </I18nProvider>
    </FrontendAuthGuard>
  )
}
