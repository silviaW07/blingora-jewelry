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
import { StorefrontNavBridge } from '@/frontend/components/StorefrontNavBridge'

// 不需要导航栏和页脚的路径白名单（模板，后续可修改）
const FULLSCREEN_PATHS = ['/customerlogin', '/customerregister']
/** 结账/购物车页：隐藏全站粉色促销倒计时条，改用页面内专用导航头 */
const CHECKOUT_PATHS = ['/cart', '/checkout']
/** Coming 等精简单页：不显示促销横幅 / 搜索顶栏冗余 */
const MINIMAL_STORE_PATHS = ['/coming', '/brand']

interface RootLayoutProps {
  children: React.ReactNode
}

export default function FrontendLayout({ children }: RootLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const handleGoBack = () => router.back()
  const normalizedPath = (pathname || '/').toLowerCase().replace(/\/+$/, '') || '/'
  const isFullscreen = FULLSCREEN_PATHS.some((p) => normalizedPath.startsWith(p.toLowerCase()))
  const isCheckoutPage = CHECKOUT_PATHS.some((p) => normalizedPath === p || normalizedPath.startsWith(`${p}/`))
  const isMinimalStorePage = MINIMAL_STORE_PATHS.some(
    (p) => normalizedPath === p || normalizedPath.startsWith(`${p}/`),
  )
  const showPromotionBanner = !isFullscreen && !isCheckoutPage && !isMinimalStorePage
  // 完整页脚：移动端仅首页；桌面端全站（非全屏）
  const isStorefrontHome = normalizedPath === '/' || normalizedPath === '/home'
  const showFooter = !isFullscreen

  return (
    <I18nProvider>
      <CustomerAuthModalProvider>
        <div className="font-sans min-h-screen bg-[#FFF5F5] flex flex-col notranslate" translate="no">
              <AuthExpiredDialog />
              <StorefrontNavBridge />
              <DecorateModeProvider>
                {showPromotionBanner ? <TopPromotionBanner /> : null}
                <main className="flex-1 w-full min-h-0 storefront-main-with-mobile-nav">
                  <Suspense fallback={<div className="min-h-[40vh] bg-[#FFF5F5] px-4 py-10 text-center text-sm text-[#7a7468]">Loading…</div>}>
                    <PageErrorBoundary onGoBack={handleGoBack}>
                      <FrontendAuthGuard>{children}</FrontendAuthGuard>
                    </PageErrorBoundary>
                  </Suspense>
                </main>
                {showFooter ? (
                  <div className={isStorefrontHome ? undefined : 'storefront-footer-desktop-only hidden lg:block'}>
                    <Footer />
                  </div>
                ) : null}
                {isFullscreen ? null : <MobileBottomNav />}
                <WhatsAppFloatButton />
              </DecorateModeProvider>
              <CustomerAuthModal />
              <CustomerAuthModalDecorateBridge />
        </div>
      </CustomerAuthModalProvider>
    </I18nProvider>
  )
}
