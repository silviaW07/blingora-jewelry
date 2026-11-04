'use client'

/**
 * Home service benefit cards (Shipping / Payment / Buyer show / Why choose us).
 * Shared by desktop + mobile storefront.
 * Shipping / Payment are display-only; Buyer show / Why choose us keep page links.
 * Layout/sizing fully split in CSS: desktop `@media (min-width: 1024px)`, mobile `max-width: 1023px`.
 * Single DOM tree so decorate propKeys (title/desc/icon/card) stay unique.
 */
import React, { useState } from 'react'
import EditableImg from '@/@base/EditableImg'
import { DecorateFrame } from '@/frontend/decorate/DecorateFrame'
import { DecorateText } from '@/frontend/decorate/DecorateText'
import { useDecorateMode } from '@/frontend/decorate/DecorateContext'
import { SERVICE_PAGE_CONFIGS } from '@/frontend/content/servicePages'
import { getServiceBenefitDecorateKeys } from '@/frontend/decorate/serviceBenefitKeys'
import { parseServiceTrustTemplate } from '@/frontend/decorate/serviceTrustTemplate'
import { ServiceTrustDialog } from '@/frontend/components/ServiceTrustDialog'
import { translateCatalogLabel } from '@/frontend/i18n/catalogLabels'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { categoryHref, hardNavProps } from '@/frontend/utils/hardNavigate'

/** Same L1 category as the nav item “Send Now”. */
const SEND_NOW_CATEGORY_SLUG = 'in-stock'

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
  const [openTrustIndex, setOpenTrustIndex] = useState<number | null>(null)

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

        const trust = parseServiceTrustTemplate(getPatch(keys.trust)?.text)
        const hasTrust = Boolean(trust && (trust.address || trust.note || trust.images.length || trust.videoUrl || trust.headline))
        const isClickable = item.slug === 'buyer-show' || item.slug === 'why-choose-us'
        const href =
          item.slug === 'why-choose-us' ? categoryHref(SEND_NOW_CATEGORY_SLUG) : `/${item.slug}/`
        const Wrapper = !isDecorateMode && isClickable && !hasTrust ? 'a' : 'div'
        const wrapperNav = Wrapper === 'a' ? hardNavProps(href) : {}

        return (
          <Wrapper
            key={keys.card}
            className={cn('home-service-card-cell', !isClickable && !hasTrust && 'is-static', hasTrust && 'cursor-pointer')}
            onClick={
              hasTrust && !isDecorateMode
                ? () => setOpenTrustIndex(index)
                : undefined
            }
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
      {openTrustIndex != null ? (
        <ServiceTrustDialog
          template={
            parseServiceTrustTemplate(
              getPatch(getServiceBenefitDecorateKeys(openTrustIndex).trust)?.text,
            )!
          }
          onClose={() => setOpenTrustIndex(null)}
        />
      ) : null}
    </div>
  )
}
