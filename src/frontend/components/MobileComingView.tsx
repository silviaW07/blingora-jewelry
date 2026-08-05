'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { OptimizedProductImage } from '@/frontend/components/OptimizedProductImage'
import { WishlistHeartButton } from '@/frontend/components/WishlistHeartButton'
import {
  getComingSoonProductsByDate,
  type ComingSoonProductItem,
} from '@/frontend/actions/Home'
import { ProductDetail } from '@/frontend/route-params'
import { buildLastNDays } from '@/frontend/utils/dailyNewArrival'
import { normalizeLocale, readStoredLocale } from '@/frontend/i18n'
import { cn } from '@/lib/utils'

/**
 * Coming: horizontal last-10-days date switcher + two-column product grid
 * (image, title, wishlist). Client-side date switch, no full page reload.
 */
export default function MobileComingView() {
  const router = useRouter()
  const { t, i18n } = useTranslation()
  const dateChips = useMemo(() => buildLastNDays(10), [])
  const [selectedDateKey, setSelectedDateKey] = useState(
    () => dateChips[0]?.date_key ?? '',
  )
  const [products, setProducts] = useState<ComingSoonProductItem[]>([])
  const [loading, setLoading] = useState(true)

  const lang = useMemo(
    () =>
      normalizeLocale(
        i18n.language || (typeof window !== 'undefined' ? readStoredLocale() : 'en'),
      ),
    [i18n.language],
  )

  useEffect(() => {
    if (!selectedDateKey) {
      setProducts([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    const load = async () => {
      try {
        const api = getComingSoonProductsByDate
        if (typeof api !== 'function') {
          if (!cancelled) setProducts([])
          return
        }
        const res = await api({ date_key: selectedDateKey, lang })
        if (cancelled) return
        setProducts(Array.isArray(res?.list) ? res.list : [])
      } catch {
        if (!cancelled) setProducts([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [selectedDateKey, lang])

  const openProduct = (item: ComingSoonProductItem) => {
    if (!item.product_id) return
    if (item.product_slug) {
      ProductDetail.navigateToBySlug(router, { slug: item.product_slug })
      return
    }
    ProductDetail.navigateToById(router, { productId: item.product_id })
  }

  const showInitialSpinner = loading && products.length === 0

  return (
    <div
      className="mobile-coming-page min-h-screen bg-[#f7f4ee] text-[#4a4a4a]"
      data-controller-name="移动端Coming新品预告"
    >
      <div className="mobile-coming-page__body">
        <div
          className="mobile-coming-dates"
          role="tablist"
          aria-label={t('mobile.comingDateBar', { defaultValue: 'Select date' })}
        >
          {dateChips.map((chip) => {
            const active = chip.date_key === selectedDateKey
            return (
              <button
                key={chip.date_key}
                type="button"
                role="tab"
                aria-selected={active}
                className={cn('mobile-coming-dates__item', active && 'is-active')}
                onClick={() => setSelectedDateKey(chip.date_key)}
              >
                {chip.date_label}
              </button>
            )
          })}
        </div>

        {showInitialSpinner ? (
          <div className="flex justify-center py-16 text-[#8b8477]">
            <Loader2 className="size-6 animate-spin" aria-label={t('common.loading')} />
          </div>
        ) : products.length === 0 && !loading ? (
          <p className="mt-12 text-center text-sm text-[#8a8073]">
            {t('mobile.noComingProducts', {
              defaultValue: 'No previews for this day',
            })}
          </p>
        ) : (
          <div
            className={cn(
              'mobile-coming-product-grid',
              loading && 'opacity-60 transition-opacity',
            )}
            data-controller-name="Coming日期商品网格"
          >
            {products.map((item) => (
              <article key={item.product_id} className="mobile-coming-product-card">
                <button
                  type="button"
                  className="mobile-coming-product-card__media"
                  onClick={() => openProduct(item)}
                  aria-label={item.product_name}
                >
                  {item.main_image_url ? (
                    <OptimizedProductImage
                      src={item.main_image_url}
                      alt={item.product_name}
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
                    productId={item.product_id}
                    productName={item.product_name}
                    size={18}
                    className="!rounded-full bg-white/95 p-1.5 shadow-sm"
                    requireAuth
                  />
                </div>

                <button
                  type="button"
                  className="mobile-coming-product-card__title"
                  onClick={() => openProduct(item)}
                  title={item.product_name}
                >
                  {item.product_name}
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
