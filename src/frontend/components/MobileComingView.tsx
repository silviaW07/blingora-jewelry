'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { OptimizedProductImage } from '@/frontend/components/OptimizedProductImage'
import { WishlistHeartButton } from '@/frontend/components/WishlistHeartButton'
import { loadHomeRecommendZonesCached } from '@/frontend/utils/homeRecommendZonesCache'
import {
  limitRecommendZoneItems,
  pickComingSoonRecommendZone,
} from '@/frontend/utils/recommendZoneDisplay'
import { ProductDetail } from '@/frontend/route-params'
import { normalizeLocale, readStoredLocale } from '@/frontend/i18n'
import { cn } from '@/lib/utils'

type ComingProductCard = {
  itemId: string
  productId: string
  productName: string
  productSlug?: string | null
  imageUrl?: string | null
  status?: string | null
}

/**
 * 移动端 Coming：对接网页端推荐专区「coming soon」商品，
 * 不再走每日上新/按日期预告接口。
 */
export default function MobileComingView() {
  const router = useRouter()
  const { t, i18n } = useTranslation()
  const [products, setProducts] = useState<ComingProductCard[]>([])
  const [zoneTitle, setZoneTitle] = useState('coming soon')
  const [mobileCols, setMobileCols] = useState<1 | 2>(2)
  const [loading, setLoading] = useState(true)

  const lang = useMemo(
    () =>
      normalizeLocale(
        i18n.language || (typeof window !== 'undefined' ? readStoredLocale() : 'en'),
      ),
    [i18n.language],
  )

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    loadHomeRecommendZonesCached(lang)
      .then((zones) => {
        if (cancelled) return
        const zone = pickComingSoonRecommendZone(zones)
        if (!zone) {
          setProducts([])
          setZoneTitle('coming soon')
          return
        }
        setZoneTitle(zone.title || 'coming soon')
        setMobileCols(zone.mobileCols === 1 ? 1 : 2)
        const limited = limitRecommendZoneItems(zone, zone.items || [])
        const list = limited
          .filter((item): item is ComingProductCard & { entityType: 'PRODUCT' } => {
            return Boolean(item && (item as any).entityType === 'PRODUCT' && (item as any).productId)
          })
          .map((item) => ({
            itemId: String((item as any).itemId || (item as any).productId),
            productId: String((item as any).productId),
            productName: String((item as any).productName || ''),
            productSlug: (item as any).productSlug || null,
            imageUrl: (item as any).imageUrl || null,
            status: (item as any).status || null,
          }))
        setProducts(list)
      })
      .catch(() => {
        if (!cancelled) setProducts([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [lang])

  const openProduct = (item: ComingProductCard) => {
    if (!item.productId) return
    if (item.productSlug) {
      ProductDetail.navigateToBySlug(router, { slug: item.productSlug })
      return
    }
    ProductDetail.navigateToById(router, { productId: item.productId })
  }

  return (
    <div
      className="mobile-coming-page min-h-screen bg-[#f7f4ee] text-[#4a4a4a]"
      data-controller-name="移动端Coming推荐专区"
    >
      <div className="mobile-coming-page__body">
        <div className="px-4 pt-3 pb-1">
          <h1 className="text-base font-semibold tracking-tight text-[#1f1a14]">{zoneTitle}</h1>
          <p className="mt-0.5 text-[11px] text-[#8a8073]">
            {t('mobile.comingFromRecommendZone', {
              defaultValue: 'Same products as the website Coming Soon zone',
            })}
          </p>
        </div>

        {loading && products.length === 0 ? (
          <div className="flex justify-center py-16 text-[#8b8477]">
            <Loader2 className="size-6 animate-spin" aria-label={t('common.loading')} />
          </div>
        ) : products.length === 0 ? (
          <p className="mt-12 text-center text-sm text-[#8a8073]">
            {t('mobile.noComingProducts', {
              defaultValue: 'No Coming Soon products yet',
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
            {products.map((item) => (
              <article key={item.itemId} className="mobile-coming-product-card">
                <button
                  type="button"
                  className="mobile-coming-product-card__media"
                  onClick={() => openProduct(item)}
                  aria-label={item.productName}
                >
                  {item.imageUrl ? (
                    <OptimizedProductImage
                      src={item.imageUrl}
                      alt={item.productName}
                      sizes="(max-width: 480px) 50vw, 33vw"
                      imageWidth={480}
                      className="object-cover"
                    />
                  ) : (
                    <span className="mobile-coming-product-card__media-empty" aria-hidden />
                  )}
                </button>

                <div className="mobile-coming-product-card__heart">
                  <WishlistHeartButton
                    productId={item.productId}
                    productName={item.productName}
                    size={18}
                    className="!rounded-full bg-white/95 p-1.5 shadow-sm"
                    requireAuth
                  />
                </div>

                <button
                  type="button"
                  className="mobile-coming-product-card__title"
                  onClick={() => openProduct(item)}
                  title={item.productName}
                >
                  {item.productName}
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
