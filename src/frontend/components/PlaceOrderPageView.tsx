'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { StorefrontResponsiveHeader } from '@/frontend/components/MobileStorefrontHeader'
import { useDecorateMode } from '@/frontend/decorate/DecorateContext'
import { getServiceBenefitDecorateKeys, SERVICE_BENEFIT_CARD_COUNT } from '@/frontend/decorate/serviceBenefitKeys'
import { parseServiceTrustTemplate, youtubeEmbedUrl } from '@/frontend/decorate/serviceTrustTemplate'
import { hardNavProps } from '@/frontend/utils/hardNavigate'

export default function PlaceOrderPageView() {
  const params = useParams<{ index: string }>()
  const index = Number(params?.index)
  const { getPatch } = useDecorateMode()
  const valid = Number.isInteger(index) && index >= 0 && index < SERVICE_BENEFIT_CARD_COUNT
  const template = valid
    ? parseServiceTrustTemplate(getPatch(getServiceBenefitDecorateKeys(index).trust)?.text)
    : null
  const embed = template ? youtubeEmbedUrl(template.videoUrl) : null

  return (
    <div className="min-h-screen bg-[#f7f4ee] text-[#111111]">
      <StorefrontResponsiveHeader />
      <main className="storefront-container py-6 sm:py-10">
        <div className="mx-auto flex w-full max-w-[960px] flex-col gap-6">
          <a
            className="inline-flex w-fit items-center rounded-full border border-[#d8d4ca] bg-white px-4 py-2 text-sm font-semibold"
            {...hardNavProps('/')}
          >
            <ArrowLeft className="mr-2 size-4" />
            Back
          </a>

          {!template ? (
            <section className="rounded-[20px] bg-white px-6 py-16 text-center shadow-sm">
              <h1 className="text-2xl font-semibold">This page is not ready yet</h1>
              <p className="mt-3 text-sm text-[#6f6a62]">
                Add a company address, photos, or a video in the homepage editor, then publish.
              </p>
            </section>
          ) : (
            <>
              <header className="rounded-[20px] bg-white px-6 py-8 shadow-sm sm:px-10">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a8073]">
                  How to place an order
                </p>
                <h1 className="mt-3 text-[clamp(28px,4vw,44px)] font-black leading-tight">
                  {template.headline || 'How we take your order'}
                </h1>
                {template.note ? (
                  <p className="mt-4 max-w-[68ch] whitespace-pre-line text-base leading-7 text-[#3f3a34]">
                    {template.note}
                  </p>
                ) : null}
              </header>

              {template.address ? (
                <section className="rounded-[20px] bg-white px-6 py-8 shadow-sm sm:px-10">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8a8073]">
                    Company address
                  </h2>
                  <p className="mt-3 whitespace-pre-line text-lg leading-8">{template.address}</p>
                </section>
              ) : null}

              {template.images.length > 0 ? (
                <section className="grid gap-3 sm:grid-cols-2">
                  {template.images.map((src) => (
                    <img
                      key={src}
                      src={src}
                      alt=""
                      className="h-72 w-full rounded-[20px] bg-white object-cover shadow-sm"
                    />
                  ))}
                </section>
              ) : null}

              {template.videoUrl ? (
                <section className="overflow-hidden rounded-[20px] bg-black shadow-sm">
                  {embed ? (
                    <iframe
                      src={embed}
                      title="Workshop video"
                      className="aspect-video w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video src={template.videoUrl} controls className="aspect-video w-full" />
                  )}
                </section>
              ) : null}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
