'use client'

import React, { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, Package } from 'lucide-react'
import { useHome } from '@/frontend/hooks/useHome'
import { StorefrontStickyHeader } from '@/frontend/components/StorefrontStickyHeader'
import { HomeRecommendZoneSection } from '@/frontend/components/HomeRecommendZoneSection'

type RecommendZonePageViewProps = {
  /** 可选；未传时从 URL ?zoneId= 读取（静态导出兼容） */
  zoneId?: string
}

export const RecommendZonePageView = ({ zoneId: zoneIdProp }: RecommendZonePageViewProps) => {
  const searchParams = useSearchParams()
  const zoneId = useMemo(() => {
    if (zoneIdProp) return zoneIdProp
    const raw = searchParams.get('zoneId') || ''
    try {
      return decodeURIComponent(raw)
    } catch {
      return raw
    }
  }, [zoneIdProp, searchParams])

  const { state, handlers } = useHome()

  const zone = useMemo(
    () =>
      state.recommendZones.find(
        (item) =>
          item.zoneId === zoneId && (item.zoneType === 'PRODUCT' || item.zoneType === 'CATEGORY'),
      ) || null,
    [state.recommendZones, zoneId],
  )

  return (
    <div className="min-h-screen bg-[#FFF5F5] text-[#111111]">
      <StorefrontStickyHeader />
      <main className="storefront-container py-8">
        {state.isLoadingRecommendZones ? (
          <div className="flex items-center justify-center gap-2 rounded-[32px] border border-[#f0dede] bg-white px-6 py-16 text-sm text-[#7a756c] shadow-[0_18px_45px_-36px_rgba(0,0,0,0.28)]">
            <Loader2 className="size-4 animate-spin" />
            专区加载中...
          </div>
        ) : zone ? (
          <HomeRecommendZoneSection
            zone={zone}
            handlers={handlers}
            headingAs="h1"
            className="w-full"
          />
        ) : (
          <div className="rounded-[32px] border border-dashed border-[#f0dede] bg-white px-6 py-16 text-center shadow-[0_18px_45px_-36px_rgba(0,0,0,0.18)]">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#f0ebe2] text-[#4a4137]">
              <Package className="size-6" />
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-[#40372f]">专区不存在或暂无内容</h2>
            <p className="mt-2 text-sm text-[#8a8073]">请返回首页，从可展示的推荐专区重新进入。</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default RecommendZonePageView
