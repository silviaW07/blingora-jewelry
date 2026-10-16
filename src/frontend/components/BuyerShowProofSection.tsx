'use client'

import { useTranslation } from 'react-i18next'
import { OptimizedProductImage } from '@/frontend/components/OptimizedProductImage'

export type BuyerShowProofCard = {
  id: string
  imageUrl: string
  title: string
  body: string
}

export function BuyerShowProofSection({
  proofs,
  onOpen,
}: {
  proofs: BuyerShowProofCard[]
  onOpen: (item: BuyerShowProofCard) => void
}) {
  const { t } = useTranslation()
  if (!proofs.length) return null

  return (
    <section className="rounded-[28px] border border-[#f0dede] bg-white p-4 sm:p-6 md:p-8">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#f254a6]">
          {t('buyerShow.proofKicker')}
        </p>
        <h2 className="mt-2 text-[clamp(24px,3vw,36px)] font-black leading-tight tracking-tight">
          {t('buyerShow.proofTitle')}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#6f6a62]">{t('buyerShow.proofLead')}</p>
        <p className="mt-3 w-fit rounded-full bg-[#fff1f4] px-3 py-1 text-xs font-semibold text-[#c81e6a]">
          {t('buyerShow.proofCount', { count: proofs.length })}
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {proofs.map((item, index) => (
          <article
            key={item.id}
            className="grid overflow-hidden rounded-2xl border border-[#f3e4e4] bg-[#fffaf8] md:grid-cols-[minmax(220px,320px)_minmax(0,1fr)]"
          >
            <button
              type="button"
              className="relative block aspect-[4/3] w-full overflow-hidden bg-[#f7f4ee] text-left md:aspect-auto md:min-h-[230px]"
              onClick={() => onOpen(item)}
              aria-label={item.title}
            >
              <OptimizedProductImage
                src={item.imageUrl}
                alt={item.title}
                imageWidth={960}
                quality={86}
                priority={index < 2}
              />
            </button>
            <div className="flex flex-col justify-center gap-2 px-4 py-4 md:px-6 md:py-6">
              <p className="font-mono text-xs font-semibold tracking-[0.2em] text-[#f254a6]">
                {String(index + 1).padStart(2, '0')}
              </p>
              <h3 className="text-lg font-bold leading-snug text-[#111111] md:text-xl">{item.title}</h3>
              <p className="whitespace-pre-line text-sm leading-6 text-[#4a453f]">{item.body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
