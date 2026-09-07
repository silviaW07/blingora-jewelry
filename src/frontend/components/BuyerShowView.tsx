'use client'

import React, { useEffect, useRef, useState } from 'react'
import { ArrowLeft, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { StorefrontResponsiveHeader } from '@/frontend/components/MobileStorefrontHeader'
import { getBuyerShowPage } from '@/frontend/actions/BuyerShow'
import type { StorefrontBuyerShowMedia } from '@/frontend/actions/BuyerShow'
import { OptimizedProductImage } from '@/frontend/components/OptimizedProductImage'
import { toProxiedImageUrl } from '@/frontend/utils/toProxiedImageUrl'

const GRID_PAGE_SIZE = 20
const GRID_THUMB_WIDTH = 400
const GRID_THUMB_QUALITY = 72
const LIGHTBOX_WIDTH = 960

function hasBuyerShowMediaUrl(url?: string | null) {
  const value = String(url || '').trim()
  return value.startsWith('http') || value.startsWith('/') || value.startsWith('data:')
}

function filterMedia(list: StorefrontBuyerShowMedia[] | null | undefined) {
  return (list || []).filter((item) => hasBuyerShowMediaUrl(item.mediaUrl))
}

export default function BuyerShowView({
  initialMedia,
}: {
  initialMedia?: StorefrontBuyerShowMedia[]
}) {
  const router = useRouter()
  const { t } = useTranslation()
  const [media, setMedia] = useState<StorefrontBuyerShowMedia[]>(() => filterMedia(initialMedia))
  const [loading, setLoading] = useState(initialMedia == null)
  const [visibleCount, setVisibleCount] = useState(() =>
    Math.min(GRID_PAGE_SIZE, filterMedia(initialMedia).length),
  )
  const [active, setActive] = useState<StorefrontBuyerShowMedia | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (initialMedia) return
    let cancelled = false
    getBuyerShowPage()
      .then((result) => {
        if (cancelled) return
        const next = filterMedia(result.media)
        setMedia(next)
        setVisibleCount(Math.min(GRID_PAGE_SIZE, next.length))
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
  }, [initialMedia])

  const visibleMedia = media.slice(0, visibleCount)
  const hasMore = visibleCount < media.length

  useEffect(() => {
    if (!hasMore) return
    const el = loadMoreRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleCount((count) => Math.min(media.length, count + GRID_PAGE_SIZE))
        }
      },
      { rootMargin: '800px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, media.length, visibleCount])

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

  const lightboxSrc =
    active && active.mediaType !== 'VIDEO'
      ? toProxiedImageUrl(active.mediaUrl, { width: LIGHTBOX_WIDTH, quality: 82 }) || active.mediaUrl
      : ''

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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {Array.from({ length: 10 }).map((_, index) => (
                <div
                  key={index}
                  className="aspect-[3/4] rounded-2xl bg-[#f7f4ee]"
                  aria-hidden
                />
              ))}
            </div>
          ) : media.length === 0 ? (
            <p className="rounded-2xl border border-[#f0dede] bg-white p-8 text-sm text-[#6f6a62]">
              {t('buyerShow.empty')}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {visibleMedia.map((item, index) => (
                <figure
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-[#f0dede] bg-white [contain-intrinsic-size:240px_320px] [content-visibility:auto]"
                >
                  <button
                    type="button"
                    className="relative block aspect-[3/4] w-full overflow-hidden bg-[#f7f4ee]"
                    onClick={() => setActive(item)}
                    aria-label={item.title || 'View buyer photo'}
                  >
                    {item.mediaType === 'VIDEO' ? (
                      <video
                        src={item.mediaUrl}
                        className="absolute inset-0 h-full w-full bg-black object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <OptimizedProductImage
                        src={item.mediaUrl}
                        alt={item.title || 'Buyer photo'}
                        imageWidth={GRID_THUMB_WIDTH}
                        quality={GRID_THUMB_QUALITY}
                        priority={index < 8}
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
          {hasMore ? <div ref={loadMoreRef} className="h-8" aria-hidden /> : null}
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
                src={lightboxSrc}
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
