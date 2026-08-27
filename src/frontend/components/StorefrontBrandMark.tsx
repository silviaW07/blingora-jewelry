'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { DecorateText } from '@/frontend/decorate/DecorateText'
import { useDecorateMode } from '@/frontend/decorate/DecorateContext'
import { StorefrontBrandLogo } from '@/frontend/components/StorefrontBrandLogo'
import { hardNavProps } from '@/frontend/utils/hardNavigate'

type StorefrontBrandMarkProps = {
  className?: string
  /** 结账顶栏等更紧凑场景 */
  compact?: boolean
  /** 使用 next/link（首页）或原生 <a> */
  useNextLink?: boolean
  ariaLabel?: string
}

/**
 * 顶栏品牌区：左侧 Logo 图标 + 右侧品牌字（同级垂直居中）。
 * 字体族固定为衬线珠宝风；字号/颜色可由可视化装修覆盖。点击整块回首页。
 */
export function StorefrontBrandMark({
  className,
  compact = false,
  useNextLink = false,
  ariaLabel = 'Back to home',
}: StorefrontBrandMarkProps) {
  const { getPatch } = useDecorateMode()
  const wordmarkPatch = getPatch('home_brand_wordmark')
  const hasSolidColor = Boolean(wordmarkPatch?.color?.trim())

  const content = (
    <>
      <StorefrontBrandLogo
        sizeClassName={
          compact
            ? 'size-10 rounded-[14px] sm:size-11'
            : 'size-11 sm:size-12'
        }
        gemClassName={compact ? 'size-4 sm:size-5' : 'size-5'}
      />
      <DecorateText
        propKey="home_brand_wordmark"
        as="span"
        className={cn(
          'storefront-brand-wordmark',
          compact && 'storefront-brand-wordmark--compact',
          hasSolidColor && 'is-solid-color',
        )}
      >
        SOURCING JEWELRY
      </DecorateText>
    </>
  )

  const markClass = cn(
    'storefront-brand-mark inline-flex max-w-full items-center gap-3 text-left transition-opacity hover:opacity-80',
    className,
  )

  return (
    <a
      {...hardNavProps('/')}
      className={markClass}
      aria-label={ariaLabel}
      data-controller-name="站点品牌标识"
    >
      {content}
    </a>
  )
}

export default StorefrontBrandMark
