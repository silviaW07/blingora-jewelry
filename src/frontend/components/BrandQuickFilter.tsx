'use client'

import { useTranslation } from 'react-i18next'
import EditableImg from '@/@base/EditableImg'
import type { BrandCategoryItem } from '@/frontend/actions/ProductCategory'
import { cn } from '@/lib/utils'
import { translateCatalogLabel } from '@/frontend/i18n/catalogLabels'

const DEFAULT_VISIBLE_COUNT = 8

export type BrandQuickFilterProps = {
  brands: BrandCategoryItem[]
  selectedBrandId?: string
  onToggle: (brandId: string) => void
  isExpanded?: boolean
  onExpandToggle?: () => void
  visibleCount?: number
  isLoading?: boolean
  className?: string
}

export function BrandQuickFilter({
  brands,
  selectedBrandId = '',
  onToggle,
  isExpanded = false,
  onExpandToggle,
  visibleCount = DEFAULT_VISIBLE_COUNT,
  isLoading = false,
  className,
}: BrandQuickFilterProps) {
  const { t } = useTranslation()

  if (isLoading && brands.length === 0) {
    return (
      <div className={cn('flex min-w-0 flex-wrap items-center gap-3', className)}>
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={`brand-skeleton-${index}`} className="flex flex-col items-center gap-1">
            <div className="size-12 animate-pulse rounded-full bg-[#ebe7de]" />
            <div className="h-2.5 w-10 animate-pulse rounded-full bg-[#ebe7de]" />
          </div>
        ))}
      </div>
    )
  }

  if (brands.length === 0) {
    return null
  }

  const hasOverflow = brands.length > visibleCount
  const visibleBrands = isExpanded ? brands : brands.slice(0, visibleCount)

  return (
    <div
      className={cn('flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2', className)}
      data-controller-name="品牌快捷筛选"
    >
      {visibleBrands.map((brand) => {
        const isSelected = selectedBrandId === brand.category_id
        const label = translateCatalogLabel(t, brand.category_name)
        return (
          <button
            key={brand.category_id}
            type="button"
            aria-pressed={isSelected}
            title={label}
            onClick={() => onToggle(brand.category_id)}
            className="group flex flex-col items-center gap-1 outline-none"
          >
            <span
              className={cn(
                'flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 transition-all',
                isSelected
                  ? 'border-[#111111] ring-2 ring-[#111111]/20'
                  : 'border-[#e6e0d5] bg-[#faf8f3] group-hover:border-[#aaa49c]',
              )}
            >
              {brand.image_url ? (
                <EditableImg
                  propKey={`brand-quick-filter-${brand.category_id}`}
                  keywords={brand.image_url || label}
                  className="size-full object-cover"
                />
              ) : (
                <span className="text-[10px] font-bold uppercase text-[#6f6a62] leading-none text-center px-0.5">
                  {label.slice(0, 2)}
                </span>
              )}
            </span>
            <span
              className={cn(
                'max-w-[56px] truncate text-center text-[10px] leading-tight transition-colors',
                isSelected ? 'font-semibold text-[#111111]' : 'text-[#6f6a62] group-hover:text-[#111111]',
              )}
            >
              {label}
            </span>
          </button>
        )
      })}

      {hasOverflow && onExpandToggle ? (
        <button
          type="button"
          onClick={onExpandToggle}
          className="flex flex-col items-center gap-1 outline-none group"
        >
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-[#d8d4ca] text-[11px] font-medium text-[#6f6a62] transition-colors group-hover:border-[#111111] group-hover:text-[#111111]">
            {isExpanded ? '↑' : '···'}
          </span>
          <span className="max-w-[56px] truncate text-center text-[10px] leading-tight text-[#6f6a62] group-hover:text-[#111111]">
            {isExpanded ? t('product.brandFilterCollapse') : t('product.brandFilterMore')}
          </span>
        </button>
      ) : null}
    </div>
  )
}

export default BrandQuickFilter
