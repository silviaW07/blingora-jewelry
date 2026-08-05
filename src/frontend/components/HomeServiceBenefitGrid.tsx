'use client'

/**
 * Home service benefit cards (Shipping / Payment / Buyer show / Why choose us).
 * Shared by desktop + mobile storefront — static display, no navigation links.
 * Layout/sizing fully split in CSS: desktop `@media (min-width: 768px)`, mobile `max-width: 767px`.
 * Single DOM tree so decorate propKeys (title/desc/icon/card) stay unique.
 */
import React from 'react'
import EditableImg from '@/@base/EditableImg'
import { DecorateFrame } from '@/frontend/decorate/DecorateFrame'
import { DecorateText } from '@/frontend/decorate/DecorateText'
import { useDecorateMode } from '@/frontend/decorate/DecorateContext'
import { SERVICE_PAGE_CONFIGS } from '@/frontend/content/servicePages'
import { getServiceBenefitDecorateKeys } from '@/frontend/decorate/serviceBenefitKeys'
import { cn } from '@/lib/utils'

const serviceBenefitItems = SERVICE_PAGE_CONFIGS.map((cfg) => ({
  title: cfg.title,
  description: cfg.description,
  iconSrc: cfg.iconSrc,
}))

type Props = {
  className?: string
  /** Optional controller name for the outer section wrapper (caller usually owns the section). */
  gridControllerName?: string
}

export function HomeServiceBenefitGrid({
  className,
  gridControllerName = '首页服务权益网格',
}: Props) {
  const { getPatch } = useDecorateMode()

  return (
    <div
      className={cn('home-service-cards', className)}
      data-controller-name={gridControllerName}
    >
      {serviceBenefitItems.map((item, index) => {
        const keys = getServiceBenefitDecorateKeys(index)
        const cardPatch = getPatch(keys.card)
        if (cardPatch?.hidden === true) {
          return null
        }

        return (
          <div
            key={keys.card}
            className="home-service-card-cell"
            data-controller-name="首页服务权益卡片"
          >
            <DecorateFrame
              propKey={keys.card}
              kind="block"
              className="home-service-card"
            >
              <div className="home-service-card__icon">
                <EditableImg
                  propKey={keys.icon}
                  src={item.iconSrc}
                  alt={item.title}
                  className="home-service-card__icon-img"
                  style={{ objectFit: 'contain', aspectRatio: '1 / 1' }}
                  disableKeywordSearch
                />
              </div>
              <div className="home-service-card__body">
                <DecorateText
                  propKey={keys.title}
                  as="h2"
                  className="home-service-card__title"
                >
                  {item.title}
                </DecorateText>
                <DecorateText
                  propKey={keys.desc}
                  as="p"
                  className="home-service-card__desc"
                >
                  {item.description}
                </DecorateText>
              </div>
            </DecorateFrame>
          </div>
        )
      })}
    </div>
  )
}
