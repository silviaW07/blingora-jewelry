'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { OptimizedProductImage } from '@/frontend/components/OptimizedProductImage'
import { WishlistHeartButton } from '@/frontend/components/WishlistHeartButton'
import { MobileStorefrontHeader } from '@/frontend/components/MobileStorefrontHeader'
import { fetchStorefrontBootstrap } from '@/frontend/utils/storefrontBootstrapClient'
import { pickComingSoonRecommendZone } from '@/frontend/utils/recommendZoneDisplay'
import {
  buildLastNDays,
  isDateKeyProductName,
  toDateKeyInTimeZone,
} from '@/frontend/utils/dailyNewArrival'
import { hardNavigate, productHref } from '@/frontend/utils/hardNavigate'
import { normalizeLocale, readStoredLocale } from '@/frontend/i18n'
import { cn } from '@/lib/utils'
import type { HomeRecommendZoneSection } from '@/frontend/actions/Home'

type ComingProductCard = {
  itemId: string
  productId: string
  productName: string
  productSlug?: string | null
  imageUrl?: string | null
  status?: string | null
  /** YYYY-MM-DD for date tab filtering */
  dateKey: string
}

const resolveComingDateKey = (rawName?: string | null, createdAtTimestamp?: number | null) => {
  const raw = String(rawName || '').trim()
  if (isDateKeyProductName(raw)) return raw
  if (typeof createdAtTimestamp === 'number' && Number.isFinite(createdAtTimestamp) && createdAtTimestamp > 0) {
    return toDateKeyInTimeZone(new Date(createdAtTimestamp), 'Asia/Shanghai')
  }
  return toDateKeyInTimeZone(new Date(), 'Asia/Shanghai')
}

function comingProductsFromZones(zones: HomeRecommendZoneSection[] | undefined | null): {
  products: ComingProductCard[]
  zoneTitle: string
  mobileCols: 1 | 2
} {
  const zone = pickComingSoonRecommendZone(zones || [])
  if (!zone) {
    return { products: [], zoneTitle: 'coming soon', mobileCols: 2 }
  }
  const list = (zone.items || [])
    .filter((item): item is HomeRecommendZoneSection['items'][number] => {
      return Boolean(item && item.entityType === 'PRODUCT' && 'productId' in item && item.productId)
    })
    .map((item) => {
      const product = item as HomeRecommendZoneSection['items'][number] & {
        productId: string
        rawProductName?: string
        productName?: string
        productSlug?: string | null
        imageUrl?: string | null
        status?: string | null
        createdAtTimestamp?: number | null
        itemId?: string
      }
      const rawName = String(product.rawProductName || product.productName || '')
      const dateKey = resolveComingDateKey(rawName, product.createdAtTimestamp)
      const displayName = isDateKeyProductName(rawName) ? '' : String(product.productName || '')
      return {
        itemId: String(product.itemId || product.productId),
        productId: String(product.productId),
        productName: displayName,
        productSlug: product.productSlug || null,
        imageUrl: product.imageUrl || null,
        status: product.status || null,
        dateKey,
      } satisfies ComingProductCard
    })
  return {
    products: list,
    zoneTitle: zone.title || 'coming soon',
    mobileCols: zone.mobileCols === 1 ? 1 : 2,
  }
}

/**
 * 移动端 Coming：
 * - 商品仍来自网页端推荐专区「coming soon」（与后台挂载一致）
 * - 上方恢复日期 Tab；快速发图商品名=YYYY-MM-DD 归到对应日期
 */
export default function MobileComingView({
  initialZones,
}: {
  initialZones?: HomeRecommendZoneSection[]
}) {
  const { t, i18n } = useTranslation()
  const dateChips = useMemo(() => buildLastNDays(10), [])
  const seeded = useMemo(() => comingProductsFromZones(initialZones), [initialZones])
  const [selectedDateKey, setSelectedDateKey] = useState(dateChips[0]?.date_key || '')
  const [products, setProducts] = useState<ComingProductCard[]>(seeded.products)
  const [zoneTitle, setZoneTitle] = useState(seeded.zoneTitle)
  const [mobileCols, setMobileCols] = useState<1 | 2>(seeded.mobileCols)
  const [loading, setLoading] = useState(seeded.products.length === 0)

  const lang = useMemo(
    () =>
      normalizeLocale(
        i18n.language || (typeof window !== 'undefined' ? readStoredLocale() : 'en'),
      ),
    [i18n.language],
  )

  const applyComingList = (list: ComingProductCard[], title: string, cols: 1 | 2) => {
    setProducts(list)
    setZoneTitle(title)
    setMobileCols(cols)
    const counts = new Map<string, number>()
    for (const p of list) {
      counts.set(p.dateKey, (counts.get(p.dateKey) || 0) + 1)
    }
    const todayKey = dateChips[0]?.date_key
    const firstWithProducts =
      (todayKey && counts.get(todayKey) ? todayKey : null) ||
      dateChips.find((d) => (counts.get(d.date_key) || 0) > 0)?.date_key ||
      todayKey ||
      ''
    if (firstWithProducts) setSelectedDateKey(firstWithProducts)
  }

  useEffect(() => {
    if (seeded.products.length > 0) {
      applyComingList(seeded.products, seeded.zoneTitle, seeded.mobileCols)
      setLoading(false)
    }

    let cancelled = false
    const safety = window.setTimeout(() => {
      if (!cancelled) setLoading(false)
    }, 2500)

    void fetchStorefrontBootstrap(lang)
      .then((boot) => {
        if (cancelled) return
        const next = comingProductsFromZones(boot?.recommendZones)
        applyComingList(next.products, next.zoneTitle, next.mobileCols)
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false)
        window.clearTimeout(safety)
      })

    return () => {
      cancelled = true
      window.clearTimeout(safety)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dateChips is stable
  }, [lang])

  const visibleProducts = useMemo(
    () => products.filter((item) => item.dateKey === selectedDateKey),
    [products, selectedDateKey],
  )

  const productCountByDate = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of products) {
      map.set(item.dateKey, (map.get(item.dateKey) || 0) + 1)
    }
    return map
  }, [products])

  const openProduct = (item: ComingProductCard) => {
    if (!item.productId) return
    hardNavigate(productHref(item.productId))
  }

  return (
    <div
      className="mobile-coming-page min-h-screen bg-[#f7f4ee] text-[#4a4a4a]"
      data-controller-name="移动端Coming推荐专区"
    >
      <MobileStorefrontHeader />
      <div className="mobile-coming-page__body">
        <div className="px-1 pt-1 pb-1">
          <h1 className="px-1 text-base font-semibold tracking-tight text-[#1f1a14]">{zoneTitle}</h1>
        </div>

        <div
          className="mobile-coming-dates"
          role="tablist"
          aria-label={t('mobile.comingDates', { defaultValue: 'Coming dates' })}
        >
          {dateChips.map((day) => {
            const count = productCountByDate.get(day.date_key) || 0
            const isActive = day.date_key === selectedDateKey
            return (
              <button
                key={day.date_key}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={cn('mobile-coming-dates__item', isActive && 'is-active')}
                onClick={() => setSelectedDateKey(day.date_key)}
              >
                {day.date_label}
                {count > 0 ? (
                  <span className="sr-only">
                    {` ${count} ${t('common.products', { defaultValue: 'products' })}`}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>

        {loading && products.length === 0 ? (
          <div className="flex justify-center py-16 text-[#8b8477]">
            <Loader2 className="size-6 animate-spin" aria-label={t('common.loading')} />
          </div>
        ) : visibleProducts.length === 0 ? (
          <p className="mt-12 text-center text-sm text-[#8a8073]">
            {t('mobile.noComingProductsForDate', {
              defaultValue: 'No products for {{date}}',
              date:
                dateChips.find((d) => d.date_key === selectedDateKey)?.date_label ||
                selectedDateKey,
            })}
          </p>
        ) : (
          <div
            className={cn(
              'mobile-coming-product-grid',
              mobileCols === 1 && 'mobile-coming-product-grid--cols-1',
            )}
            data-controller-name="Coming推荐专区商品网格"
            style={
              mobileCols === 1
                ? ({ gridTemplateColumns: '1fr' } as React.CSSProperties)
                : undefined
            }
          >
            {visibleProducts.map((item) => (
              <article key={item.itemId} className="mobile-coming-product-card">
                <button
                  type="button"
                  className="mobile-coming-product-card__media"
                  onClick={() => openProduct(item)}
                  aria-label={item.productName || zoneTitle}
                >
                  {item.imageUrl ? (
                    <OptimizedProductImage
                      src={item.imageUrl}
                      alt={item.productName || zoneTitle}
                      sizes="(max-width: 480px) 50vw, 33vw"
                      imageWidth={800}
                      className="object-cover"
                    />
                  ) : (
                    <span className="mobile-coming-product-card__media-empty" aria-hidden />
                  )}
                </button>

                <div className="mobile-coming-product-card__heart">
                  <WishlistHeartButton
                    productId={item.productId}
                    productName={item.productName || zoneTitle}
                    size={18}
                    className="!rounded-full bg-white/95 p-1.5 shadow-sm"
                    requireAuth
                  />
                </div>

                {item.productName ? (
                  <button
                    type="button"
                    className="mobile-coming-product-card__title"
                    onClick={() => openProduct(item)}
                    title={item.productName}
                  >
                    {item.productName}
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
