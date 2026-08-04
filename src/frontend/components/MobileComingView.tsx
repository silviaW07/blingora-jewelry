'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { MobileStorefrontHeader } from '@/frontend/components/MobileStorefrontHeader'
import { OptimizedProductImage } from '@/frontend/components/OptimizedProductImage'
import { WishlistHeartButton } from '@/frontend/components/WishlistHeartButton'
import {
  getComingSoonDateCards,
  type ComingSoonDateCard,
} from '@/frontend/actions/Home'
import { ProductDetail } from '@/frontend/route-params'

/**
 * Mobile Coming page: grid of pure date cards (MM/DD) + preview image + wishlist.
 * Source: unpublished / teaser products grouped by admin publishedAt (fallback createdAt).
 */
export default function MobileComingView() {
  const router = useRouter()
  const { t } = useTranslation()
  const [cards, setCards] = useState<ComingSoonDateCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getComingSoonDateCards()
      .then((res) => {
        if (cancelled) return
        setCards(Array.isArray(res.cards) ? res.cards : [])
      })
      .catch(() => {
        if (!cancelled) setCards([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const openPreview = (card: ComingSoonDateCard) => {
    if (!card.preview_product_id) return
    if (card.preview_product_slug) {
      ProductDetail.navigateToBySlug(router, { slug: card.preview_product_slug })
      return
    }
    ProductDetail.navigateToById(router, { productId: card.preview_product_id })
  }

  return (
    <div
      className="mobile-coming-page min-h-screen bg-[#f7f4ee] text-[#111111]"
      data-controller-name="移动端Coming新品预告"
    >
      <MobileStorefrontHeader />

      <div className="mobile-coming-page__body">
        <h1 className="mobile-coming-page__title">
          {t('nav.coming', { defaultValue: 'Coming' })}
        </h1>

        {loading ? (
          <div className="flex justify-center py-16 text-[#8b8477]">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : cards.length === 0 ? (
          <p className="mt-10 text-center text-sm text-[#8a8073]">
            {t('mobile.noComingDates', {
              defaultValue: 'No upcoming previews yet',
            })}
          </p>
        ) : (
          <div
            className="mobile-coming-grid"
            data-controller-name="Coming日期卡片网格"
          >
            {cards.map((card) => (
              <article
                key={card.date_key}
                className="mobile-coming-card"
              >
                <button
                  type="button"
                  className="mobile-coming-card__surface"
                  onClick={() => openPreview(card)}
                  aria-label={`${card.date_label}`}
                >
                  <span className="mobile-coming-card__date">{card.date_label}</span>
                </button>

                <div className="mobile-coming-card__heart">
                  <WishlistHeartButton
                    productId={card.preview_product_id}
                    productName={card.preview_product_name || card.date_label}
                    size={18}
                    className="!rounded-full bg-white/90 p-1.5 shadow-sm"
                    requireAuth
                  />
                </div>

                <button
                  type="button"
                  className="mobile-coming-card__media"
                  onClick={() => openPreview(card)}
                >
                  {card.preview_image_url ? (
                    <OptimizedProductImage
                      src={card.preview_image_url}
                      alt={card.date_label}
                      sizes="50vw"
                      imageWidth={480}
                      className="object-cover"
                    />
                  ) : (
                    <span className="mobile-coming-card__media-empty" aria-hidden />
                  )}
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
