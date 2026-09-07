'use client'

import React, { useEffect, useState } from 'react'
import { ArrowLeft, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { StorefrontResponsiveHeader } from '@/frontend/components/MobileStorefrontHeader'
import { getBuyerShowPage } from '@/frontend/actions/BuyerShow'
import type { StorefrontBuyerShowMedia } from '@/frontend/actions/BuyerShow'
import { OptimizedProductImage } from '@/frontend/components/OptimizedProductImage'

function hasBuyerShowMediaUrl(url?: string | null) {
  const value = String(url || '').trim()
  return value.startsWith('http') || value.startsWith('/') || value.startsWith('data:')
}

export default function BuyerShowView() {
  const router = useRouter()
  const { t } = useTranslation()
  const [media, setMedia] = useState<StorefrontBuyerShowMedia[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState<StorefrontBuyerShowMedia | null>(null)

  useEffect(() => {
    let cancelled = false
    getBuyerShowPage()
      .then((result) => {
        if (!cancelled) {
          setMedia((result.media || []).filter((item) => hasBuyerShowMediaUrl(item.mediaUrl)))
        }
      })
      .catch(() => {
        if (!cancelled) setMedia([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!active) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActive(null)
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [active])

  return (
    <div className="min-h-screen bg-[#FFF5F5] text-[#111111]">
      <StorefrontResponsiveHeader />
      <main className="storefront-container py-8">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6">
          <button
            type="button"
            className="inline-flex w-fit items-center rounded-full border border-[#d8d4ca] bg-white px-4 py-2 text-sm font-semibold"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 size-4" />
            Back
          </button>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a8073]">
              {t('buyerShow.kicker')}
            </p>
            <h1 className="mt-2 text-[clamp(28px,4vw,44px)] font-black">{t('home.buyer_show')}</h1>
          </div>

          {loading ? (
            <p className="text-sm text-[#8a8073]">{t('buyerShow.loading')}</p>
          ) : media.length === 0 ? (
            <p className="rounded-2xl border border-[#f0dede] bg-white p-8 text-sm text-[#6f6a62]">
              {t('buyerShow.empty')}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {media.map((item) => (
                <figure key={item.id} className="overflow-hidden rounded-2xl border border-[#f0dede] bg-white">
                  <button
                    type="button"
                    className="relative block aspect-[3/4] w-full overflow-hidden bg-[#f7f4ee]"
                    onClick={() => setActive(item)}
                    aria-label={item.title || 'View buyer photo'}
                  >
                    {item.mediaType === 'VIDEO' ? (
                      <video
                        src={item.mediaUrl}
                        className="h-full w-full bg-black object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <OptimizedProductImage
                        src={item.mediaUrl}
                        alt={item.title || 'Buyer photo'}
                        imageWidth={480}
                        quality={80}
                        priority={false}
                      />
                    )}
                  </button>
                  {item.title ? (
                    <figcaption className="truncate px-3 py-2 text-sm font-semibold">{item.title}</figcaption>
                  ) : null}
                </figure>
              ))}
            </div>
          )}
        </div>
      </main>

      {active ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={active.title || 'Buyer photo'}
          onClick={() => setActive(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 z-[81] flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white"
            aria-label="Close"
            onClick={() => setActive(null)}
          >
            <X className="h-5 w-5" />
          </button>
          <div
            className="max-h-[90vh] max-w-[min(96vw,720px)]"
            onClick={(event) => event.stopPropagation()}
          >
            {active.mediaType === 'VIDEO' ? (
              <video
                src={active.mediaUrl}
                className="max-h-[90vh] w-full rounded-lg bg-black object-contain"
                controls
                autoPlay
                playsInline
              />
            ) : (
              <img
                src={active.mediaUrl}
                alt={active.title || 'Buyer photo'}
                className="max-h-[90vh] w-full rounded-lg object-contain"
              />
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
