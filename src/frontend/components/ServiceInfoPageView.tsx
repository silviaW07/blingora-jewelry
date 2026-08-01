'use client'

import React from 'react'
import EditableImg from '@/@base/EditableImg'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { StorefrontStickyHeader } from '@/frontend/components/StorefrontStickyHeader'
import { DecorateFrame } from '@/frontend/decorate/DecorateFrame'
import { DecorateText } from '@/frontend/decorate/DecorateText'
import type { ServicePageConfig } from '@/frontend/content/servicePages'

type Props = {
  config: ServicePageConfig
}

export default function ServiceInfoPageView({ config }: Props) {
  const router = useRouter()
  const keyBase = `service_page_${config.slug}`

  return (
    <div className="min-h-screen bg-[#FFF5F5] text-[#111111]">
      <StorefrontStickyHeader />
      <main className="storefront-container py-8">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6">
          <Button
            type="button"
            variant="outline"
            className="w-fit rounded-full border-[#d8d4ca] bg-white px-4 py-2 text-sm font-semibold text-[#111111] hover:bg-[#f7f4ee]"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 size-4" />
            Back
          </Button>

          <DecorateFrame
            propKey={`${keyBase}_hero`}
            kind="block"
            className="overflow-hidden rounded-[20px] border border-[#f0dede] bg-white shadow-[0_18px_48px_-36px_rgba(0,0,0,0.25)]"
          >
            <section className="grid min-h-[360px] gap-0 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="flex flex-col justify-center gap-4 px-6 py-8 sm:px-8 lg:px-10">
                <DecorateText
                  propKey={`${keyBase}_eyebrow`}
                  as="p"
                  className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a8073]"
                >
                  {config.heroEyebrow}
                </DecorateText>
                <DecorateText
                  propKey={`${keyBase}_title`}
                  as="h1"
                  className="max-w-[14ch] text-[clamp(28px,4vw,48px)] font-black leading-tight text-[#111111]"
                >
                  {config.heroTitle}
                </DecorateText>
                <DecorateText
                  propKey={`${keyBase}_desc`}
                  as="p"
                  className="max-w-[62ch] text-sm leading-7 text-[#6f6a62] sm:text-base"
                >
                  {config.heroDescription}
                </DecorateText>
              </div>

              <div className="flex items-center justify-center border-t border-[#f0ebe3] bg-[#faf8f4] p-8 lg:border-l lg:border-t-0">
                <EditableImg
                  propKey={`${keyBase}_hero_image`}
                  src={config.iconSrc}
                  alt={config.title}
                  className="h-[220px] w-full max-w-[320px] object-contain"
                  style={{ objectFit: 'contain', aspectRatio: '1 / 1' }}
                />
              </div>
            </section>
          </DecorateFrame>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <DecorateFrame
              propKey={`${keyBase}_body`}
              kind="block"
              className="rounded-[20px] border border-[#f0dede] bg-white px-6 py-6 shadow-[0_18px_48px_-40px_rgba(0,0,0,0.22)] sm:px-8"
            >
              <DecorateText
                propKey={`${keyBase}_section_title`}
                as="h2"
                className="text-2xl font-semibold text-[#111111]"
              >
                {config.sectionTitle}
              </DecorateText>
              <DecorateText
                propKey={`${keyBase}_section_body`}
                as="p"
                className="mt-4 text-sm leading-7 text-[#6f6a62] sm:text-base"
              >
                {config.sectionBody}
              </DecorateText>
            </DecorateFrame>

            <DecorateFrame
              propKey={`${keyBase}_side_card`}
              kind="block"
              className="rounded-[20px] border border-[#f0dede] bg-white px-6 py-6 shadow-[0_18px_48px_-40px_rgba(0,0,0,0.22)] sm:px-8"
            >
              <div className="flex items-start gap-4">
                <EditableImg
                  propKey={`${keyBase}_side_icon`}
                  src={config.iconSrc}
                  alt={`${config.title} icon`}
                  className="size-14 shrink-0 object-contain"
                  style={{ objectFit: 'contain', aspectRatio: '1 / 1' }}
                />
                <div className="min-w-0">
                  <DecorateText
                    propKey={`${keyBase}_side_title`}
                    as="h3"
                    className="text-lg font-semibold text-[#111111]"
                  >
                    {config.title}
                  </DecorateText>
                  <DecorateText
                    propKey={`${keyBase}_side_desc`}
                    as="p"
                    className="mt-2 text-sm leading-7 text-[#6f6a62]"
                  >
                    {config.description}
                  </DecorateText>
                </div>
              </div>

              <div className="mt-6 rounded-[16px] bg-[#faf8f4] p-4">
                <DecorateText
                  propKey={`${keyBase}_tip_title`}
                  as="p"
                  className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8a8073]"
                >
                  Detail suggestion
                </DecorateText>
                <DecorateText
                  propKey={`${keyBase}_tip_desc`}
                  as="p"
                  className="mt-2 text-sm leading-7 text-[#6f6a62]"
                >
                  Replace this area with richer operational rules, guarantee details, real buyer examples, or any long-form content you want to manage in decorate mode.
                </DecorateText>
                <div className="mt-4 inline-flex items-center text-sm font-semibold text-[#111111]">
                  <span>Continue refining this page in decorate mode</span>
                  <ChevronRight className="ml-1 size-4" />
                </div>
              </div>
            </DecorateFrame>
          </div>
        </div>
      </main>
    </div>
  )
}
