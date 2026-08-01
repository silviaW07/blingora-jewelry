'use client'

import React from 'react'
import { Gem, ShieldCheck } from 'lucide-react'

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
        <a
          href="/"
          className="flex min-w-0 items-center gap-3 text-left transition-opacity hover:opacity-80"
          aria-label="返回首页"
        >
          <div className="relative flex size-10 shrink-0 items-center justify-center rounded-[14px] bg-[linear-gradient(145deg,#111111,#3c2f7d)] text-white shadow-[0_12px_28px_-18px_rgba(17,17,17,0.55)] sm:size-11">
            <span className="absolute left-1.5 top-1.5 size-2.5 rounded-full bg-[#f4a261] opacity-95" />
            <span className="absolute bottom-1.5 right-1.5 size-2 rounded-full bg-[#2ec4b6] opacity-90" />
            <Gem className="size-4 sm:size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#6f6a62] sm:text-[11px]">
              BLINGORA
            </p>
            <p className="mt-0.5 truncate text-[16px] font-black tracking-[0.14em] text-[#111111] sm:text-[18px]">
              JEWELRY
            </p>
          </div>
        </a>

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
