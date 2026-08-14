'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { BrandCategoryItem, SortByEnum } from '@/frontend/actions/ProductCategory'
import { BrandQuickFilter } from '@/frontend/components/BrandQuickFilter'
import { cn } from '@/lib/utils'

const PRICE_SLIDER_MIN = 0
const PRICE_SLIDER_MAX = 120
const DEBOUNCE_MS = 250

const SORT_OPTIONS: Array<{ value: SortByEnum; labelKey: string }> = [
  { value: 'NEWEST', labelKey: 'product.sortNewest' },
  { value: 'PRICE_ASC', labelKey: 'product.sortPriceAsc' },
  { value: 'PRICE_DESC', labelKey: 'product.sortPriceDesc' },
]

export type ProductListToolbarProps = {
  minPrice?: number
  maxPrice?: number
  sortBy: SortByEnum
  onPriceRangeChange: (min: number | undefined, max: number | undefined) => void
  onSortChange: (sortBy: SortByEnum) => void
  /** Upper bound for the dual range slider (USD). Defaults to 120. */
  priceBoundMax?: number
  brandOptions?: BrandCategoryItem[]
  selectedBrandId?: string
  onBrandToggle?: (brandId: string) => void
  isBrandExpanded?: boolean
  onBrandExpandToggle?: () => void
  isLoadingBrands?: boolean
  brandVisibleCount?: number
  className?: string
}

const formatUsd = (value: number) => {
  if (!Number.isFinite(value)) return 'US$ --'
  const rounded = Math.round(value * 100) / 100
  const text = Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(2).replace(/\.?0+$/, '')
  return `US$ ${text}`
}

const toSliderValues = (
  minPrice: number | undefined,
  maxPrice: number | undefined,
  boundMax: number,
): [number, number] => {
  const min = typeof minPrice === 'number' && !Number.isNaN(minPrice) ? minPrice : PRICE_SLIDER_MIN
  const max = typeof maxPrice === 'number' && !Number.isNaN(maxPrice) ? maxPrice : boundMax
  return [Math.max(PRICE_SLIDER_MIN, Math.min(min, boundMax)), Math.max(PRICE_SLIDER_MIN, Math.min(max, boundMax))]
}

const toCommittedRange = (
  min: number,
  max: number,
  boundMax: number,
): [number | undefined, number | undefined] => {
  // Full-left min → no lower bound; max always capped at boundMax (strict 0–boundMax USD)
  const nextMin = min <= PRICE_SLIDER_MIN ? undefined : min
  const nextMax = max >= boundMax ? boundMax : max
  return [nextMin, nextMax]
}

export function ProductListToolbar({
  minPrice,
  maxPrice,
  sortBy,
  onPriceRangeChange,
  onSortChange,
  priceBoundMax = PRICE_SLIDER_MAX,
  brandOptions = [],
  selectedBrandId = '',
  onBrandToggle,
  isBrandExpanded = false,
  onBrandExpandToggle,
  isLoadingBrands = false,
  brandVisibleCount,
  className,
}: ProductListToolbarProps) {
  const { t } = useTranslation()
  const boundMax = Math.max(PRICE_SLIDER_MIN + 1, priceBoundMax)
  const [range, setRange] = useState<[number, number]>(() =>
    toSliderValues(minPrice, maxPrice, boundMax),
  )
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onPriceRangeChangeRef = useRef(onPriceRangeChange)
  onPriceRangeChangeRef.current = onPriceRangeChange

  useEffect(() => {
    setRange(toSliderValues(minPrice, maxPrice, boundMax))
  }, [minPrice, maxPrice, boundMax])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const commitRange = (next: [number, number]) => {
    const [lo, hi] = next[0] <= next[1] ? next : ([next[1], next[0]] as [number, number])
    setRange([lo, hi])
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const [committedMin, committedMax] = toCommittedRange(lo, hi, boundMax)
      onPriceRangeChangeRef.current(committedMin, committedMax)
    }, DEBOUNCE_MS)
  }

  const activeSort = SORT_OPTIONS.some((option) => option.value === sortBy) ? sortBy : 'NEWEST'

  const showBrandFilter = Boolean(onBrandToggle) && (isLoadingBrands || brandOptions.length > 0)

  return (
    <div
      className={cn('flex flex-wrap items-end justify-end gap-x-4 gap-y-3', className)}
      data-controller-name="商品列表筛选排序工具栏"
    >
      {showBrandFilter ? (
        <div className="min-w-0 flex-1 basis-full sm:basis-auto sm:max-w-[min(100%,420px)]">
          <div className="mb-1.5 text-xs font-medium text-[#3f3a34]">{t('product.brandFilter')}</div>
          <BrandQuickFilter
            brands={brandOptions}
            selectedBrandId={selectedBrandId}
            onToggle={onBrandToggle!}
            isExpanded={isBrandExpanded}
            onExpandToggle={onBrandExpandToggle}
            visibleCount={brandVisibleCount}
            isLoading={isLoadingBrands}
          />
        </div>
      ) : null}

      <div className="w-[160px] shrink-0 sm:w-[200px]">
        <div className="mb-1.5 flex items-center justify-between gap-2 text-xs text-[#6f6a62]">
          <span className="font-medium text-[#3f3a34]">{t('product.priceRange')}</span>
        </div>
        <Slider
          min={PRICE_SLIDER_MIN}
          max={boundMax}
          step={1}
          value={range}
          onValueChange={(value) => {
            if (!Array.isArray(value) || value.length < 2) return
            commitRange([value[0], value[1]])
          }}
          className="w-full [&_[data-slot=slider-track]]:h-1.5 [&_[data-slot=slider-track]]:bg-[#ebe7de] [&_[data-slot=slider-range]]:bg-[#111111] [&_[data-slot=slider-thumb]]:size-3.5 [&_[data-slot=slider-thumb]]:border-[#111111] [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-thumb]]:shadow-none [&_[data-slot=slider-thumb]]:ring-0 [&_[data-slot=slider-thumb]]:hover:ring-2 [&_[data-slot=slider-thumb]]:hover:ring-[#111111]/20 [&_[data-slot=slider-thumb]]:focus-visible:ring-2 [&_[data-slot=slider-thumb]]:focus-visible:ring-[#111111]/25"
          aria-label={t('product.priceRange')}
        />
        <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-[#6f6a62] tabular-nums">
          <span>{formatUsd(range[0])}</span>
          <span>{formatUsd(range[1])}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden text-sm text-[#6f6a62] sm:inline">{t('product.sortBy')}</span>
        <Select
          value={activeSort}
          onValueChange={(value) => onSortChange(value as SortByEnum)}
        >
          <SelectTrigger
            size="sm"
            className="h-9 min-w-[148px] rounded-full border-[#e6e0d5] bg-[#faf8f3] px-4 text-sm text-[#111111] shadow-none focus-visible:border-[#111111] focus-visible:ring-[#111111]/15"
          >
            <SelectValue placeholder={t('product.sortBy')} />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-[#e6e0d5] bg-white shadow-[0_16px_40px_-18px_rgba(17,17,17,0.28)]">
            {SORT_OPTIONS.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="rounded-xl text-sm text-[#111111] focus:bg-[#f5f4ef] focus:text-[#111111]"
              >
                {t(option.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export default ProductListToolbar
