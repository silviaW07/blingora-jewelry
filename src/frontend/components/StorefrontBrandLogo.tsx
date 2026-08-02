'use client'

import React from 'react'
import { Gem } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DecorateFrame } from '@/frontend/decorate/DecorateFrame'
import { useDecorateMode } from '@/frontend/decorate/DecorateContext'

/** 页面可视化装修中的站点 Logo 配置键（imageUrl） */
export const SITE_LOGO_PROP_KEY = 'site_logo'

type StorefrontBrandLogoProps = {
  className?: string
  /** 外层尺寸，默认与顶栏一致 */
  sizeClassName?: string
  gemClassName?: string
}

/**
 * 前台品牌 Logo：装修态可选中上传；未配置时回退默认 Gem 图标。
 */
export function StorefrontBrandLogo({
  className,
  sizeClassName = 'size-11 sm:size-12',
  gemClassName = 'size-5',
}: StorefrontBrandLogoProps) {
  const { getPatch } = useDecorateMode()
  const logoUrl = (getPatch(SITE_LOGO_PROP_KEY)?.imageUrl || '').trim()

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-[16px] text-white shadow-[0_12px_28px_-18px_rgba(17,17,17,0.55)]',
        logoUrl ? 'bg-white' : 'bg-[linear-gradient(145deg,#111111,#3c2f7d)]',
        sizeClassName,
        className,
      )}
      data-controller-name="站点Logo"
    >
      <DecorateFrame propKey={SITE_LOGO_PROP_KEY} kind="image" className="relative size-full">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="Logo" className="size-full object-contain p-1.5" />
        ) : (
          <>
            <span className="absolute left-1.5 top-1.5 size-3 rounded-full bg-[#f4a261] opacity-95" />
            <span className="absolute bottom-1.5 right-1.5 size-2.5 rounded-full bg-[#2ec4b6] opacity-90" />
            <div className="flex size-full items-center justify-center">
              <Gem className={gemClassName} />
            </div>
          </>
        )}
      </DecorateFrame>
    </div>
  )
}

export default StorefrontBrandLogo
