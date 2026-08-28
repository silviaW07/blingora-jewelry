'use client'

/**
 * Home service benefit cards (Shipping / Payment / Buyer show / Why choose us).
 * Shared by desktop + mobile storefront.
 * Shipping / Payment are display-only; Buyer show / Why choose us keep page links.
 * Layout/sizing fully split in CSS: desktop `@media (min-width: 1024px)`, mobile `max-width: 1023px`.
 * Single DOM tree so decorate propKeys (title/desc/icon/card) stay unique.
 */
import React from 'react'
import EditableImg from '@/@base/EditableImg'
import { DecorateFrame } from '@/frontend/decorate/DecorateFrame'
import { DecorateText } from '@/frontend/decorate/DecorateText'
import { useDecorateMode } from '@/frontend/decorate/DecorateContext'
import { SERVICE_PAGE_CONFIGS } from '@/frontend/content/servicePages'
import { getServiceBenefitDecorateKeys } from '@/frontend/decorate/serviceBenefitKeys'
import { translateCatalogLabel } from '@/frontend/i18n/catalogLabels'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { hardNavProps } from '@/frontend/utils/hardNavigate'

const serviceBenefitItems = SERVICE_PAGE_CONFIGS.map((cfg) => ({
  slug: cfg.slug,
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
  const { getPatch, isDecorateMode } = useDecorateMode()
  const { t } = useTranslation()

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

        const isClickable = item.slug === 'buyer-show' || item.slug === 'why-choose-us'
        const href = `/${item.slug}/`
        const Wrapper = !isDecorateMode && isClickable ? 'a' : 'div'
        const wrapperNav = Wrapper === 'a' ? hardNavProps(href) : {}

        return (
          <Wrapper
            key={keys.card}
            className={cn('home-service-card-cell', !isClickable && 'is-static')}
            data-controller-name="首页服务权益卡片"
            {...wrapperNav}
          >
            <DecorateFrame
              propKey={keys.card}
              kind="block"
              className={cn('home-service-card', isClickable && 'home-service-card--pink-flow')}
            >
              <div className="home-service-card__icon">
                <EditableImg
                  propKey={keys.icon}
                  src={item.iconSrc}
                  alt={item.title}
                  className="home-service-card__icon-img"
                  style={{
                    objectFit: 'contain',
                    width: 18,
                    height: 18,
                    maxWidth: 18,
                    maxHeight: 18,
                    aspectRatio: 'auto',
                  }}
                  disableKeywordSearch
                />
              </div>
              <div className="home-service-card__body">
                <DecorateText
                  propKey={keys.title}
                  as="h2"
                  className="home-service-card__title"
                >
                  {translateCatalogLabel(t, item.title) || item.title}
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
          </Wrapper>
        )
      })}
    </div>
  )
}
