'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Slider } from '@/components/ui/slider'
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
      className={cn('listing-toolbar flex flex-wrap items-end justify-end gap-x-4 gap-y-2', className)}
      data-controller-name="商品列表筛选排序工具栏"
    >
      {showBrandFilter ? (
        <div className="listing-toolbar__brands min-w-0 flex-1 basis-full sm:basis-auto sm:max-w-[min(100%,420px)]">
          <div className="mb-1 text-xs font-medium text-[#3f3a34]">{t('product.brandFilter')}</div>
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

      <div className="listing-toolbar__price w-full min-w-0 sm:w-[200px] sm:shrink-0">
        <div className="listing-toolbar__price-cluster">
          <div className="listing-toolbar__price-meta">
            <span className="listing-toolbar__price-label">{t('product.priceRange')}</span>
            <p className="listing-toolbar__price-values">
              {formatUsd(range[0])} – {formatUsd(range[1])}
            </p>
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
            className="listing-price-slider w-full overflow-visible [&_[data-slot=slider-track]]:h-1.5 [&_[data-slot=slider-track]]:bg-[#ebe7de] [&_[data-slot=slider-range]]:bg-[#111111] [&_[data-slot=slider-thumb]]:size-4 [&_[data-slot=slider-thumb]]:border-[#111111] [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-thumb]]:shadow-none [&_[data-slot=slider-thumb]]:ring-0 [&_[data-slot=slider-thumb]]:hover:ring-2 [&_[data-slot=slider-thumb]]:hover:ring-[#111111]/20 [&_[data-slot=slider-thumb]]:focus-visible:ring-2 [&_[data-slot=slider-thumb]]:focus-visible:ring-[#111111]/25"
            aria-label={t('product.priceRange')}
          />
        </div>
      </div>

      <div className="listing-toolbar__sort flex w-full min-w-0 shrink-0 items-center gap-2 sm:w-auto">
        <label className="sr-only" htmlFor="listing-sort-native">
          {t('product.sortBy')}
        </label>
        <select
          id="listing-sort-native"
          className="listing-sort-native"
          value={activeSort}
          onChange={(event) => onSortChange(event.target.value as SortByEnum)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {t(option.labelKey)}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default ProductListToolbar
