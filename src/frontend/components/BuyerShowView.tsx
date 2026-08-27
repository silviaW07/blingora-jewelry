'use client'

import React, { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { StorefrontResponsiveHeader } from '@/frontend/components/MobileStorefrontHeader'
import { getBuyerShowPage } from '@/frontend/actions/BuyerShow'
import type { StorefrontBuyerShowMedia } from '@/frontend/actions/BuyerShow'
import { OptimizedProductImage } from '@/frontend/components/OptimizedProductImage'

export default function BuyerShowView() {
  const router = useRouter()
  const [media, setMedia] = useState<StorefrontBuyerShowMedia[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getBuyerShowPage()
      .then((result) => {
        if (!cancelled) setMedia(result.media || [])
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
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a8073]">Buyer Real Photos</p>
            <h1 className="mt-2 text-[clamp(28px,4vw,44px)] font-black">Click to see</h1>
          </div>

          {loading ? (
            <p className="text-sm text-[#8a8073]">Loading...</p>
          ) : media.length === 0 ? (
            <p className="rounded-2xl border border-[#f0dede] bg-white p-8 text-sm text-[#6f6a62]">
              No photos yet. Please check back soon.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {media.map((item) => (
                <figure key={item.id} className="overflow-hidden rounded-2xl border border-[#f0dede] bg-white">
                  {item.mediaType === 'VIDEO' ? (
                    <video
                      src={item.mediaUrl}
                      className="aspect-square w-full bg-black object-cover"
                      controls
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <div className="relative aspect-square w-full overflow-hidden bg-[#f7f4ee]">
                      <OptimizedProductImage
                        src={item.mediaUrl}
                        alt={item.title || 'Buyer photo'}
                        imageWidth={280}
                        quality={70}
                        priority={false}
                      />
                    </div>
                  )}
                  {item.title ? (
                    <figcaption className="truncate px-3 py-2 text-sm font-semibold">{item.title}</figcaption>
                  ) : null}
                </figure>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
