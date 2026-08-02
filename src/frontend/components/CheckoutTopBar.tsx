'use client'

import React from 'react'
import { ShieldCheck } from 'lucide-react'
import { StorefrontBrandMark } from '@/frontend/components/StorefrontBrandMark'

/**
 * 结账/购物车页专用顶部导航：浅白底、Logo + 安全结账标识，sticky 固定。
 * 仅应挂载在结账相关页面，不影响其它前台页。
 */
export function CheckoutTopBar() {
  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-[#f0dede] bg-[#fffafa]/95 backdrop-blur-md"
      data-controller-name="结账页顶部导航头"
    >
      <div className="storefront-container flex h-[58px] items-center justify-between gap-4 sm:h-[64px]">
        <StorefrontBrandMark compact ariaLabel="返回首页" />

        <div className="flex shrink-0 items-center gap-2 rounded-full border border-[#c7ebe6] bg-[#f0faf8] px-3 py-1.5 text-[#0f766e] sm:gap-2.5 sm:px-4 sm:py-2">
          <ShieldCheck className="size-4 shrink-0 sm:size-5" strokeWidth={2.25} />
          <div className="leading-tight">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] sm:text-[11px]">
              Secure Checkout
            </p>
            <p className="hidden text-[11px] font-medium text-[#14756d] sm:block">安全结账</p>
          </div>
        </div>
      </div>
    </header>
  )
}
