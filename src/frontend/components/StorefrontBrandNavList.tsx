'use client'

/**
 * Shared Brand list used by:
 * - Home left rail (always visible under CATEGORIES)
 * - Non-home CATEGORIES flyout (StorefrontFloatingSideNav)
 */
import React from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import { translateCatalogLabel } from '@/frontend/i18n/catalogLabels'
import type { BrandNavListItem } from '@/frontend/utils/brandSideNav'

interface Props {
  items: BrandNavListItem[]
  activeId?: string | null
  onSelect: (id: string) => void
  /** rail = home left column; flyout = dropdown under CATEGORIES */
  variant?: 'rail' | 'flyout'
  className?: string
  emptyText?: string
  /** Optional decorate / API bind helpers for home rail */
  getItemBindInfo?: (index: number) => string | undefined
  getItemMapVarName?: () => string | undefined
}

export const StorefrontBrandNavList = ({
  items,
  activeId = null,
  onSelect,
  variant = 'rail',
  className,
  emptyText = '暂无类目',
  getItemBindInfo,
  getItemMapVarName,
}: Props) => {
  const { t } = useTranslation()
  const listClass =
    variant === 'flyout' ? 'floating-side-nav-list' : 'home-side-nav-list'
  const itemClass = 'brand-nav-item'

  if (items.length === 0) {
    return (
      <nav
        className={cn(listClass, className)}
        data-controller-name="首页左侧分类导航按钮列表"
      >
        <p className="px-3 py-4 text-center text-xs text-[#8c867d]">{emptyText}</p>
      </nav>
    )
  }

  return (
    <nav
      className={cn(listClass, className)}
      data-controller-name="首页左侧分类导航按钮列表"
    >
      {items.map((item, index) => {
        const isActive = activeId === item.id
        const bindInfo = getItemBindInfo?.(index)
        const mapVar = getItemMapVarName?.()
        return (
          <button
            key={item.key || item.id}
            type="button"
            data-active={isActive ? 'true' : 'false'}
            className={itemClass}
            onClick={() => onSelect(item.id)}
            {...(bindInfo ? { 'data-api-bind-info': bindInfo } : {})}
            {...(mapVar ? { 'data-api-map-var-name': mapVar } : {})}
          >
            <span className="truncate pr-2">
              {translateCatalogLabel(t, item.label)}
            </span>
            <ChevronRight className="brand-nav-chevron" aria-hidden />
          </button>
        )
      })}
    </nav>
  )
}

export default StorefrontBrandNavList
