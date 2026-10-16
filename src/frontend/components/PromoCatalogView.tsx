'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Download, Heart, Images, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { OptimizedProductImage } from '@/frontend/components/OptimizedProductImage'
import {
  addProductWishlistIds,
  removeProductWishlistIds,
  useLocalWishlistIds,
} from '@/frontend/hooks/useLocalWishlist'
import { useCanViewStorePrice } from '@/frontend/components/GuestPricePlaceholder'
import { hardNavigate } from '@/frontend/utils/hardNavigate'
import { loadCategoryListCached } from '@/frontend/utils/categoryListCache'
import { translateCatalogLabel } from '@/frontend/i18n/catalogLabels'
import { polishStorefrontProductTitle } from '@/frontend/i18n/productTranslation'
import { StorefrontPagination } from '@/frontend/components/StorefrontPagination'
import { cn } from '@/lib/utils'
import type { CategoryItem } from '@/frontend/actions/ProductCategory'

export type PromoCatalogCard = {
  id: string
  name: string
  productCode: string
  imageUrl: string
  extraImageUrls: string[]
  usdPrice: number | null
}

type PriceMode = 'hidden' | 'multiplier' | 'manual'

const PAGE_SIZE = 40
const LOOKBOOK_MAX = 80

function roundUsd(value: number) {
  return Math.round(value * 100) / 100
}

function sellingPrice(
  wholesale: number | null,
  multiplier: number,
  override: number | undefined,
  mode: PriceMode,
): number | null {
  if (mode === 'hidden') return null
  if (typeof override === 'number' && override > 0) return roundUsd(override)
  if (mode === 'manual') return null
  if (wholesale != null && wholesale > 0 && multiplier > 0) return roundUsd(wholesale * multiplier)
  return null
}

function formatUsd(value: number | null) {
  if (value == null || !(value > 0)) return ''
  return `$${value.toFixed(2)}`
}

function parseQueryIds(raw: string | null): string[] {
  if (!raw) return []
  return Array.from(
    new Set(
      raw
        .split(/[,;\s]+/)
        .map((id) => id.trim())
        .filter((id) => /^[a-zA-Z0-9-]{8,80}$/.test(id)),
    ),
  ).slice(0, LOOKBOOK_MAX)
}

function pickDefaultCategory(list: CategoryItem[]): string {
  const ranked = list.find((item) => /jewelry|in.?stock/i.test(item.category_name || ''))
  return ranked?.category_id || list[0]?.category_id || ''
}

export default function PromoCatalogView({
  initialItems = [],
}: {
  initialItems?: PromoCatalogCard[]
}) {
  const { t, i18n } = useTranslation()
  const searchParams = useSearchParams()
  const urlIds = useMemo(() => parseQueryIds(searchParams.get('ids')), [searchParams])
  const wishlistIds = useLocalWishlistIds()
  const canViewPrice = useCanViewStorePrice()

  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [categoryId, setCategoryId] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [viewMode, setViewMode] = useState<'catalog' | 'wishlist'>(urlIds.length ? 'wishlist' : 'catalog')
  const [items, setItems] = useState<PromoCatalogCard[]>(initialItems)
  const [loading, setLoading] = useState(true)
  const [priceMode, setPriceMode] = useState<PriceMode>('hidden')
  const [includeColorImages, setIncludeColorImages] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>(urlIds)
  const [downloading, setDownloading] = useState(false)
  const [multiplierText, setMultiplierText] = useState('1.5')
  const [priceOverrides, setPriceOverrides] = useState<Record<string, number>>({})

  const multiplier = useMemo(() => {
    const n = Number(multiplierText)
    if (!Number.isFinite(n) || n <= 0) return 1
    return Math.min(99, Math.max(0.1, n))
  }, [multiplierText])

  const withPrice = priceMode !== 'hidden'
  const pageIds = items.map((item) => item.id)
  const pageAllSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id))
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  useEffect(() => {
    const lang = i18n.language || 'en'
    void loadCategoryListCached(lang)
      .then((list) => {
        const top = Array.isArray(list) ? list : []
        setCategories(top)
        setCategoryId((prev) => prev || pickDefaultCategory(top))
      })
      .catch(() => setCategories([]))
  }, [i18n.language])

  useEffect(() => {
    if (urlIds.length) {
      setSelectedIds(urlIds)
      addProductWishlistIds(urlIds)
      setViewMode('wishlist')
    }
  }, [urlIds.join(',')])

  useEffect(() => {
    if (viewMode === 'catalog' && !categoryId) {
      setLoading(true)
      return
    }
    let cancelled = false
    const controller = new AbortController()
    const query = new URLSearchParams()
    if (viewMode === 'wishlist') {
      const ids = (selectedIds.length ? selectedIds : wishlistIds).slice(0, LOOKBOOK_MAX)
      if (!ids.length) {
        setItems([])
        setTotal(0)
        setLoading(false)
        return
      }
      query.set('ids', ids.join(','))
    } else {
      if (categoryId) query.set('categoryId', categoryId)
      query.set('page', String(page))
      query.set('pageSize', String(PAGE_SIZE))
    }
    query.set('lang', i18n.language || 'en')
    setLoading(true)
    fetch(`/api/promo-catalog/?${query.toString()}`, { signal: controller.signal })
      .then(async (res) => {
        const payload = (await res.json().catch(() => null)) as {
          data?: { items?: PromoCatalogCard[]; total?: number }
          message?: string
        } | null
        if (!res.ok) throw new Error(payload?.message || `HTTP ${res.status}`)
        return payload?.data
      })
      .then((data) => {
        if (cancelled) return
        const list = Array.isArray(data?.items) ? data.items : []
        setItems(list)
        setTotal(typeof data?.total === 'number' ? data.total : list.length)
      })
      .catch((error) => {
        if (cancelled || (error as Error).name === 'AbortError') return
        setItems([])
        toast.error((error as Error).message || t('lookbook.loadFailed'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [viewMode, categoryId, page, viewMode === 'wishlist' ? selectedIds.join(',') : '', i18n.language, t])

  const priceFor = (item: PromoCatalogCard) =>
    sellingPrice(item.usdPrice, multiplier, priceOverrides[item.id], priceMode)

  const toggleSelected = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = checked
        ? prev.includes(id)
          ? prev
          : [...prev, id]
        : prev.filter((item) => item !== id)
      if (next.length > LOOKBOOK_MAX) {
        toast.error(t('product.lookbookMax', { count: LOOKBOOK_MAX }))
        return next.slice(0, LOOKBOOK_MAX)
      }
      if (checked) addProductWishlistIds([id])
      else removeProductWishlistIds([id])
      return next
    })
  }

  const toggleSelectPage = () => {
    setSelectedIds((prev) => {
      const set = new Set(prev)
      if (pageAllSelected) {
        pageIds.forEach((id) => set.delete(id))
        removeProductWishlistIds(pageIds)
      } else {
        pageIds.forEach((id) => set.add(id))
        addProductWishlistIds(pageIds)
      }
      const next = Array.from(set)
      if (next.length > LOOKBOOK_MAX) {
        toast.error(t('product.lookbookMax', { count: LOOKBOOK_MAX }))
        return next.slice(0, LOOKBOOK_MAX)
      }
      return next
    })
  }

  const handleDownload = async (format: 'zip' | 'pdf' = 'zip') => {
    const ids = selectedIds.slice(0, LOOKBOOK_MAX)
    if (!ids.length || downloading) return
    setDownloading(true)
    try {
      const overrides: Record<string, number> = {}
      if (withPrice) {
        for (const item of items) {
          if (!ids.includes(item.id)) continue
          const sale = priceFor(item)
          if (sale != null) overrides[item.id] = sale
        }
      }
      const res = await fetch('/api/promo-catalog/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: ids,
          withPrice,
          includeColorImages: format === 'zip' ? includeColorImages : false,
          markupMultiplier: withPrice ? multiplier : 1,
          priceOverrides: withPrice ? overrides : {},
          format,
          lang: i18n.language || 'en',
        }),
      })
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { message?: string } | null
        throw new Error(payload?.message || t('lookbook.downloadFailed'))
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sourcingjewelry-lookbook-${withPrice ? 'priced' : 'noprice'}.${format === 'pdf' ? 'pdf' : 'zip'}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success(t('lookbook.downloadReady'))
    } catch (error) {
      toast.error((error as Error).message || t('lookbook.downloadFailed'))
    } finally {
      setDownloading(false)
    }
  }

  const openWishlist = () => {
    if (!selectedIds.length && !wishlistIds.length) {
      toast.error(t('lookbook.selectFirst'))
      return
    }
    setViewMode('wishlist')
  }

  const handlePriceInput = (id: string, raw: string) => {
    const n = Number(raw)
    setPriceOverrides((prev) => {
      const next = { ...prev }
      if (!raw.trim() || !Number.isFinite(n) || n <= 0) {
        delete next[id]
        return next
      }
      next[id] = roundUsd(n)
      return next
    })
  }

  const handleRemove = (id: string) => {
    removeProductWishlistIds([id])
    setSelectedIds((prev) => prev.filter((item) => item !== id))
    if (viewMode === 'wishlist') setItems((prev) => prev.filter((item) => item.id !== id))
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 print:max-w-none print:px-0 print:py-0">
      <div className="mb-6 flex flex-col gap-4 print:hidden">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#9a8f84]">SourcingJewelry</p>
          <h1 className="mt-1 text-2xl font-semibold text-[#2b2420]">{t('lookbook.title')}</h1>
          <p className="mt-1 text-sm text-[#7a7468]">
            {viewMode === 'wishlist' ? t('lookbook.fromLove') : t('lookbook.fromBrowse')}
          </p>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-[#eadfd6] bg-white p-4">
          <div>
            <p className="text-sm font-medium text-[#2b2420]">{t('lookbook.priceMode')}</p>
            <p className="mt-0.5 text-xs text-[#9a8f84]">{t('lookbook.priceModeHint')}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {([
                ['hidden', t('lookbook.modeHidden')],
                ['multiplier', t('lookbook.modeMultiplier')],
                ['manual', t('lookbook.modeManual')],
              ] as Array<[PriceMode, string]>).map(([mode, label]) => (
                <label
                  key={mode}
                  className={cn(
                    'flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-2.5 text-sm',
                    priceMode === mode ? 'border-[#2b2420] bg-[#f7f4ee]' : 'border-[#eadfd6] bg-white',
                  )}
                >
                  <input
                    type="radio"
                    name="lookbook-price-mode"
                    className="mt-0.5"
                    checked={priceMode === mode}
                    onChange={() => setPriceMode(mode)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {priceMode === 'multiplier' ? (
            <label className="flex max-w-sm flex-col gap-1 text-sm">
              <span className="font-medium">{t('lookbook.multiplier')}</span>
              <span className="flex items-center gap-2">
                <span className="text-[#9a8f84]">×</span>
                <input
                  type="number"
                  min="0.1"
                  max="99"
                  step="0.1"
                  value={multiplierText}
                  onChange={(event) => setMultiplierText(event.target.value)}
                  className="h-10 w-28 rounded-lg border border-[#e8ddd4] px-2"
                />
                <button
                  type="button"
                  className="text-xs text-[#9a8f84] underline"
                  onClick={() => setPriceOverrides({})}
                >
                  {t('lookbook.resetPrices')}
                </button>
              </span>
              <span className="text-xs text-[#9a8f84]">{t('lookbook.multiplierHint')}</span>
            </label>
          ) : null}

          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeColorImages}
              onChange={(event) => setIncludeColorImages(event.target.checked)}
            />
            {t('lookbook.includeColors')}
          </label>

          {viewMode === 'catalog' && categories.length ? (
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const active = category.category_id === categoryId
                return (
                  <button
                    key={category.category_id}
                    type="button"
                    className={cn(
                      'h-9 rounded-full border px-3 text-sm font-medium',
                      active
                        ? 'border-[#2b2420] bg-[#2b2420] text-white'
                        : 'border-[#eadfd6] bg-white text-[#2b2420]',
                    )}
                    onClick={() => {
                      setViewMode('catalog')
                      setCategoryId(category.category_id)
                      setPage(1)
                    }}
                  >
                    {translateCatalogLabel(t, category.category_name)}
                  </button>
                )
              })}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={toggleSelectPage}
              disabled={!items.length}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-[#e8ddd4] bg-white px-4 text-sm font-medium text-[#2b2420] disabled:opacity-50"
            >
              {pageAllSelected ? t('product.clearThisPage') : t('product.selectThisPage')}
            </button>
            <button
              type="button"
              onClick={() => (viewMode === 'wishlist' ? setViewMode('catalog') : openWishlist())}
              className={cn(
                'inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium',
                viewMode === 'wishlist'
                  ? 'border-[#e11d48] bg-[#fff1f2] text-[#e11d48]'
                  : 'border-[#e8ddd4] bg-white text-[#2b2420]',
              )}
            >
              <Heart
                className="size-5"
                fill={viewMode === 'wishlist' ? '#e11d48' : 'none'}
                color={viewMode === 'wishlist' ? '#e11d48' : 'currentColor'}
              />
              {t('lookbook.wishlist')}
              {selectedIds.length ? <span>({selectedIds.length})</span> : null}
            </button>
            <button
              type="button"
              onClick={() => void handleDownload('pdf')}
              disabled={downloading || !selectedIds.length}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-[#e8ddd4] bg-white px-4 text-sm font-medium text-[#2b2420] disabled:opacity-50"
            >
              <Printer className="h-4 w-4" />
              {downloading ? t('lookbook.preparing') : t('lookbook.print')}
            </button>
            <button
              type="button"
              disabled={downloading || !selectedIds.length}
              onClick={() => void handleDownload('zip')}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[#2b2420] px-4 text-sm font-medium text-white disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              {downloading ? t('lookbook.preparing') : t('lookbook.download')}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="py-16 text-center text-sm text-[#7a7468]">{t('lookbook.loading')}</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#eadfd6] bg-white px-4 py-16 text-center">
          <Images className="mx-auto mb-3 h-8 w-8 text-[#c9a0a0]" />
          <p className="text-sm font-medium text-[#2b2420]">{t('lookbook.empty')}</p>
          <p className="mt-1 text-sm text-[#7a7468]">{t('lookbook.emptyHint')}</p>
          <button
            type="button"
            className="mt-5 inline-flex h-10 items-center rounded-full bg-[#111111] px-5 text-sm font-semibold text-white"
            onClick={() => {
              setViewMode('catalog')
              hardNavigate('/promo-catalog/')
            }}
          >
            {t('lookbook.browse')}
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 print:grid-cols-4 print:gap-2">
            {items.map((item, index) => {
              const checked = selectedIds.includes(item.id)
              const sale = priceFor(item)
              return (
                <article
                  key={item.id}
                  className={cn(
                    'overflow-hidden rounded-xl bg-white shadow-sm print:break-inside-avoid print:border print:border-[#eee] print:shadow-none',
                    !checked && 'print:hidden',
                    checked && 'ring-2 ring-[#2b2420]',
                  )}
                >
                  <div className="relative aspect-square bg-[#f6f1ec]">
                    <OptimizedProductImage
                      src={item.imageUrl}
                      alt={item.name}
                      imageWidth={360}
                      quality={72}
                      priority={index < 8}
                    />
                    {withPrice && sale ? (
                      <span className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-white">
                        {formatUsd(sale)}
                      </span>
                    ) : null}
                    <label className="absolute left-2 top-2 inline-flex size-7 items-center justify-center rounded-full bg-white/90 print:hidden">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => toggleSelected(item.id, event.target.checked)}
                        aria-label={item.name}
                      />
                    </label>
                  </div>
                  <div className="space-y-1 px-3 py-2.5">
                    <p className="line-clamp-2 text-sm font-medium leading-snug text-[#2b2420]">
                      {polishStorefrontProductTitle(item.name) || item.productCode}
                    </p>
                    <p className="font-mono text-[11px] text-[#9a8f84]">{item.productCode}</p>
                    {withPrice && canViewPrice && item.usdPrice ? (
                      <p className="text-[11px] text-[#9a8f84]">
                        {t('lookbook.wholesale', { price: formatUsd(item.usdPrice) })}
                      </p>
                    ) : null}
                    {withPrice ? (
                      <label className="flex items-center gap-1 print:hidden">
                        <span className="shrink-0 text-[11px] text-[#7a7468]">{t('lookbook.sellingPrice')}</span>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder={priceMode === 'manual' ? 'USD' : undefined}
                          value={sale ?? ''}
                          onChange={(event) => handlePriceInput(item.id, event.target.value)}
                          className="h-8 w-full rounded-md border border-[#e8ddd4] px-2 text-sm"
                        />
                      </label>
                    ) : null}
                    <button
                      type="button"
                      className="text-xs text-[#9a8f84] underline print:hidden"
                      onClick={() => handleRemove(item.id)}
                    >
                      {t('lookbook.remove')}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
          {viewMode === 'catalog' ? (
            <div className="print:hidden">
              <StorefrontPagination
                page={page}
                pageSize={PAGE_SIZE}
                total={total}
                totalPages={totalPages}
                onPageChange={(next) => {
                  setPage(next)
                  if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              />
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
