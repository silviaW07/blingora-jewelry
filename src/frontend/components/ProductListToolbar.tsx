'use client'

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
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

/** Native thumbs + pointer capture. Radix Slider thumbs are invisible / un-draggable on Chrome Android. */
function ListingPriceSlider({
  min,
  max,
  value,
  onChange,
  ariaLabel,
}: {
  min: number
  max: number
  value: [number, number]
  onChange: (next: [number, number]) => void
  ariaLabel: string
}) {
  const railRef = useRef<HTMLDivElement>(null)
  const valueRef = useRef(value)
  valueRef.current = value
  const dragRef = useRef<'lo' | 'hi' | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const applyFromClientX = useCallback(
    (clientX: number, which: 'lo' | 'hi') => {
      const rail = railRef.current
      if (!rail) return
      const rect = rail.getBoundingClientRect()
      const spanPx = rect.width
      if (spanPx <= 0) return
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / spanPx))
      const raw = Math.round(min + ratio * (max - min))
      const [lo, hi] = valueRef.current
      if (which === 'lo') onChangeRef.current([Math.min(raw, hi), hi])
      else onChangeRef.current([lo, Math.max(raw, lo)])
    },
    [min, max],
  )

  const thumbFromClientX = (clientX: number): 'lo' | 'hi' => {
    const rail = railRef.current
    const [lo, hi] = valueRef.current
    if (!rail) return 'lo'
    const rect = rail.getBoundingClientRect()
    const spanPx = rect.width || 1
    const at = min + Math.min(1, Math.max(0, (clientX - rect.left) / spanPx)) * (max - min)
    return Math.abs(at - lo) <= Math.abs(at - hi) ? 'lo' : 'hi'
  }

  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (!dragRef.current) return
      applyFromClientX(event.clientX, dragRef.current)
    }
    const up = () => {
      dragRef.current = null
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [applyFromClientX])

  const onPointerDown = (which: 'lo' | 'hi' | 'rail') => (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button != null && event.button > 0) return
    event.stopPropagation()
    const next = which === 'rail' ? thumbFromClientX(event.clientX) : which
    dragRef.current = next
    applyFromClientX(event.clientX, next)
  }

  const span = Math.max(1, max - min)
  const loPct = ((value[0] - min) / span) * 100
  const hiPct = ((value[1] - min) / span) * 100

  return (
    <div
      className="listing-price-slider"
      role="group"
      aria-label={ariaLabel}
      onPointerDown={onPointerDown('rail')}
    >
      <div className="listing-price-slider__rail" ref={railRef}>
        <div
          className="listing-price-slider__fill"
          style={{ left: `${loPct}%`, width: `${Math.max(0, hiPct - loPct)}%` }}
        />
      </div>
      <button
        type="button"
        className="listing-price-slider__thumb"
        style={{ left: `${loPct}%` }}
        aria-label={`${ariaLabel} min`}
        aria-valuemin={min}
        aria-valuemax={value[1]}
        aria-valuenow={value[0]}
        onPointerDown={onPointerDown('lo')}
      />
      <button
        type="button"
        className="listing-price-slider__thumb"
        style={{ left: `${hiPct}%` }}
        aria-label={`${ariaLabel} max`}
        aria-valuemin={value[0]}
        aria-valuemax={max}
        aria-valuenow={value[1]}
        onPointerDown={onPointerDown('hi')}
      />
    </div>
  )
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
          <ListingPriceSlider
            min={PRICE_SLIDER_MIN}
            max={boundMax}
            value={range}
            onChange={commitRange}
            ariaLabel={t('product.priceRange')}
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
