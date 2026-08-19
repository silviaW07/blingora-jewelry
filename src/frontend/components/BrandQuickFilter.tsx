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
      <div className={cn('flex min-w-0 flex-wrap items-center gap-1.5', className)}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`brand-skeleton-${index}`}
            className="h-7 w-14 animate-pulse rounded-full bg-[#ebe7de]"
          />
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
      className={cn('flex min-w-0 flex-wrap items-center gap-1.5', className)}
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
            className={cn(
              'inline-flex h-7 max-w-[120px] shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-medium transition-colors',
              isSelected
                ? 'border-[#111111] bg-[#111111] text-white'
                : 'border-[#e6e0d5] bg-[#faf8f3] text-[#3f3a34] hover:border-[#cfc8bb] hover:bg-white',
            )}
          >
            {brand.image_url ? (
              <span className="relative size-4 shrink-0 overflow-hidden rounded-full bg-white">
                <EditableImg
                  propKey={`brand-quick-filter-${brand.category_id}`}
                  keywords={brand.image_url || label}
                  className="size-full object-cover"
                />
              </span>
            ) : null}
            <span className="truncate">{label}</span>
          </button>
        )
      })}

      {hasOverflow && onExpandToggle ? (
        <button
          type="button"
          onClick={onExpandToggle}
          className="inline-flex h-7 shrink-0 items-center rounded-full border border-dashed border-[#d8d4ca] px-2.5 text-[11px] font-medium text-[#6f6a62] transition-colors hover:border-[#111111] hover:text-[#111111]"
        >
          {isExpanded ? t('product.brandFilterCollapse') : t('product.brandFilterMore')}
        </button>
      ) : null}
    </div>
  )
}

export default BrandQuickFilter
