'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
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

/** Native range thumbs for paint; wrapper TouchEvents so Chrome Android can drag. */
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
      if (rect.width <= 0) return
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
      const raw = Math.round(min + ratio * (max - min))
      const [lo, hi] = valueRef.current
      if (which === 'lo') onChangeRef.current([Math.min(raw, hi), hi])
      else onChangeRef.current([lo, Math.max(raw, lo)])
    },
    [min, max],
  )

  const whichFromClientX = (clientX: number): 'lo' | 'hi' => {
    const [lo, hi] = valueRef.current
    const rail = railRef.current
    if (!rail) return 'lo'
    const rect = rail.getBoundingClientRect()
    const at =
      min +
      Math.min(1, Math.max(0, (clientX - rect.left) / Math.max(1, rect.width))) * (max - min)
    return Math.abs(at - lo) <= Math.abs(at - hi) ? 'lo' : 'hi'
  }

  const startAt = (clientX: number) => {
    const next = whichFromClientX(clientX)
    dragRef.current = next
    applyFromClientX(clientX, next)
  }

  useEffect(() => {
    const moveTouch = (event: TouchEvent) => {
      if (!dragRef.current || !event.touches[0]) return
      event.preventDefault()
      applyFromClientX(event.touches[0].clientX, dragRef.current)
    }
    const movePointer = (event: PointerEvent) => {
      if (!dragRef.current) return
      applyFromClientX(event.clientX, dragRef.current)
    }
    const up = () => {
      dragRef.current = null
    }
    window.addEventListener('touchmove', moveTouch, { passive: false })
    window.addEventListener('touchend', up)
    window.addEventListener('touchcancel', up)
    window.addEventListener('pointermove', movePointer)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      window.removeEventListener('touchmove', moveTouch)
      window.removeEventListener('touchend', up)
      window.removeEventListener('touchcancel', up)
      window.removeEventListener('pointermove', movePointer)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [applyFromClientX])

  return (
    <div
      ref={railRef}
      className="listing-price-slider"
      role="group"
      aria-label={ariaLabel}
      onPointerDown={(event) => {
        if (event.button != null && event.button > 0) return
        event.stopPropagation()
        startAt(event.clientX)
      }}
      onTouchStart={(event) => {
        if (!event.touches[0]) return
        event.stopPropagation()
        startAt(event.touches[0].clientX)
      }}
    >
      <div className="listing-price-slider__rail">
        <div
          className="listing-price-slider__fill"
          style={{
            left: `${((value[0] - min) / Math.max(1, max - min)) * 100}%`,
            width: `${((value[1] - value[0]) / Math.max(1, max - min)) * 100}%`,
          }}
        />
      </div>
      <input
        type="range"
        className="listing-price-slider__native listing-price-slider__native--min"
        min={min}
        max={max}
        step={1}
        value={value[0]}
        tabIndex={-1}
        aria-hidden
        readOnly
      />
      <input
        type="range"
        className="listing-price-slider__native listing-price-slider__native--max"
        min={min}
        max={max}
        step={1}
        value={value[1]}
        tabIndex={-1}
        aria-hidden
        readOnly
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
