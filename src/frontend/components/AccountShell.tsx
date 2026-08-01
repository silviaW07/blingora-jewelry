'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MapPin, Package, UserCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StorefrontStickyHeader } from '@/frontend/components/StorefrontStickyHeader'
import {
  AccountAddresses,
  AccountOrders,
  AccountProfile,
} from '@/frontend/route-params'

const NAV_ITEMS = [
  { href: AccountOrders.path, label: '我的订单', icon: Package },
  { href: AccountAddresses.path, label: '地址管理', icon: MapPin },
  { href: AccountProfile.path, label: '个人资料', icon: UserCircle2 },
] as const

export function AccountShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-[#FFF5F5]" data-controller-name="客户个人中心">
      <StorefrontStickyHeader />
      <div className="storefront-container py-8">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a8073]">Account</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#1f1a14]">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f6558]">{description}</p>
        </div>

        {/* 左侧菜单 width:auto + min-width:140px；右侧 flex:1；两侧等高贴合 */}
        <div className="flex flex-col items-stretch overflow-hidden rounded-[28px] border border-[#f0dede] bg-white shadow-[0_18px_40px_-36px_rgba(0,0,0,0.35)] lg:flex-row">
          <aside className="w-full shrink-0 border-b border-[#f0dede] bg-white p-2.5 lg:w-auto lg:min-w-[140px] lg:border-b-0 lg:border-r lg:border-[#f0dede]">
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2.5 whitespace-nowrap rounded-[16px] px-3 py-2.5 text-sm font-medium transition',
                      active
                        ? 'bg-[#111111] text-white'
                        : 'text-[#2f2a24] hover:bg-[#f6f2ea]',
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </aside>
          <section className="min-w-0 flex-1 overflow-hidden bg-white p-5 sm:p-6">{children}</section>
        </div>
      </div>
    </div>
  )
}
