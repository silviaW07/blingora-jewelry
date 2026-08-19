'use client'

import React from 'react'
import { ChevronRight, Plus, ShoppingCart, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import EditableImg from '@/@base/EditableImg'
import { DecorateText } from '@/frontend/decorate/DecorateText'
import { translateCatalogLabel } from '@/frontend/i18n/catalogLabels'
import type { HomeHandlers } from '@/frontend/hooks/useHome'
import type {
  HomeRecommendCategoryCard,
  HomeRecommendProductCard,
  HomeRecommendZoneSection as HomeRecommendZoneSectionType,
} from '@/frontend/actions/Home'
import { WishlistHeartButton } from '@/frontend/components/WishlistHeartButton'
import { GuestPlaceholder, StorePrice, useCanViewStorePrice } from '@/frontend/components/GuestPricePlaceholder'
import {
  limitRecommendZoneItems,
  zoneLooksLikeComingSoon,
} from '@/frontend/utils/recommendZoneDisplay'
import { prefetchProductDetail, writeProductDetailPreview } from '@/frontend/utils/productDetailCache'
import { categoryHref, hardNavProps, productHref, useChromeActivate } from '@/frontend/utils/hardNavigate'

type RecommendProductCard = HomeRecommendProductCard
type RecommendCategoryCard = HomeRecommendCategoryCard

type ZoneHandlers = Pick<
  HomeHandlers,
  | 'handleNavigateRecommendProduct'
  | 'handleNavigateRecommendCategory'
  | 'handleAddRecommendProductToCart'
  | 'handleAddRecommendProductSkuToCart'
  | 'handleAddRecommendProductToWishlist'
>

type HomeRecommendZoneSectionProps = {
  zone: HomeRecommendZoneSectionType
  handlers: ZoneHandlers
  headingAs?: 'h1' | 'h2'
  showViewAll?: boolean
  onViewAll?: (zoneId: string) => void
  /** false = 展示专区全部明细（View All /zone 页）；默认 true 按 PC 列×行截断 */
  limitDisplay?: boolean
  className?: string
  /** Mobile home: horizontal squircle icons + labels (PC layout unchanged). */
  variant?: 'default' | 'mobile-squircle'
}

const formatPrice = (price?: number | null) => {
  if (typeof price !== 'number' || Number.isNaN(price)) return 'US$ --'
  return `US$ ${price.toFixed(2)}`
}

const formatPriceRange = (min?: number | null, max?: number | null) => {
  const minOk = typeof min === 'number' && !Number.isNaN(min)
  const maxOk = typeof max === 'number' && !Number.isNaN(max)
  if (!minOk && !maxOk) return 'US$ --'
  if (minOk && maxOk && Math.abs((max as number) - (min as number)) > 0.009) {
    return `US$ ${(min as number).toFixed(2)} - ${(max as number).toFixed(2)}`
  }
  return formatPrice(minOk ? (min as number) : (max as number))
}

const renderRatingStars = (rating?: number | null) => {
  const safeRating = typeof rating === 'number' && !Number.isNaN(rating) ? Math.max(0, Math.min(5, rating)) : 0
  const fullStars = Math.round(safeRating)
  return Array.from({ length: 5 }, (_, index) => (
    <Star
      key={`star-${index}`}
      className={`size-3.5 ${index < fullStars ? 'fill-[#f4a261] text-[#f4a261]' : 'text-[#d5cec1]'}`}
    />
  ))
}

const getZoneGridClassName = (zone: HomeRecommendZoneSectionType) =>
  cn(
    'grid gap-4',
    zone.mobileCols === 1 ? 'grid-cols-1' : 'grid-cols-2',
    zone.pcCols === 3 ? 'md:grid-cols-3' : zone.pcCols === 5 ? 'md:grid-cols-3 xl:grid-cols-5' : 'md:grid-cols-3 xl:grid-cols-4',
  )

const getCategoryCardGridClassName = (zone: HomeRecommendZoneSectionType) =>
  cn(
    'grid gap-4',
    'grid-cols-2',
    zone.pcCols === 3 ? 'md:grid-cols-3' : zone.pcCols === 5 ? 'md:grid-cols-4 xl:grid-cols-5' : 'md:grid-cols-4',
  )

const CATEGORY_CARD_PLACEHOLDER = '/category-covers/placeholder.svg'
const CATEGORY_PRODUCT_IMAGE_SLOW_MS = 1200

const resolveCategoryCardSrc = (imageUrl?: string | null) => {
  const text = String(imageUrl || '').trim()
  return text || CATEGORY_CARD_PLACEHOLDER
}

const resolveCategoryCardFallback = (item: RecommendCategoryCard) => {
  const fallback = String(item.fallbackImageUrl || '').trim()
  const primary = String(item.imageUrl || '').trim()
  if (
    fallback &&
    fallback !== primary &&
    fallback !== CATEGORY_CARD_PLACEHOLDER
  ) {
    return fallback
  }
  return ''
}

const MOBILE_COMING_SOON_COLS = 5
const MOBILE_COMING_SOON_ROWS = 3
const MOBILE_COMING_SOON_MAX = MOBILE_COMING_SOON_COLS * MOBILE_COMING_SOON_ROWS

const MobileSquircleStrip = ({
  count,
  children,
}: {
  count: number
  children: React.ReactNode
}) => {
  const n = Math.max(count, 0)
  const fillsRow = n > 0 && n <= 5
  return (
    <div
      className={cn(
        'mobile-zone-squircle-row',
        fillsRow ? 'mobile-zone-squircle-row--fill' : 'mobile-zone-squircle-row--scroll',
      )}
      data-count={n}
      style={
        {
          '--zone-item-count': String(Math.max(n, 1)),
          '--zone-visible': '5',
        } as React.CSSProperties
      }
      data-controller-name="移动端推荐专区横向图标行"
    >
      {children}
    </div>
  )
}

const MobileComingSoonGrid = ({ children }: { children: React.ReactNode }) => (
  <div
    className="mobile-zone-squircle-grid"
    data-coming-soon-grid="1"
    data-controller-name="移动端coming soon网格"
    style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${MOBILE_COMING_SOON_COLS}, minmax(0, 1fr))`,
      columnGap: '0.4rem',
      rowGap: '0.55rem',
      width: '100%',
      maxWidth: '100%',
    }}
  >
    {children}
  </div>
)

type RecommendZoneProductCardProps = {
  item: RecommendProductCard
  index: number
  handlers: ZoneHandlers
  t: ReturnType<typeof useTranslation>['t']
}

const RecommendZoneProductCard = ({ item, handlers, t }: RecommendZoneProductCardProps) => {
  const isDraft = item.status === 'DRAFT'
  const canViewPrice = useCanViewStorePrice()
  const href = productHref(item.productId)

  const openProductEvents = useChromeActivate(() => {
    writeProductDetailPreview({
      id: item.productId,
      name: item.productName,
      image: item.imageUrl || '',
    })
    handlers.handleNavigateRecommendProduct(item.productId)
  })
  const addToCartEvents = useChromeActivate(() => {
    void handlers.handleAddRecommendProductToCart(item)
  })

  const priceDisplay = (() => {
    const p = item.priceMin ?? item.price
    const pMax = item.priceMax
    if (typeof p !== 'number') return null
    const fmt = (n: number) => `US$ ${n.toFixed(2)}`
    if (typeof pMax === 'number' && pMax > p) return `${fmt(p)}-${fmt(pMax)}`
    return fmt(p)
  })()

  return (
    <article
      className="home-product-card group flex h-full flex-col overflow-visible transition duration-200 hover:opacity-95"
      data-controller-name="首页推荐专区商品卡片"
      onPointerEnter={() => prefetchProductDetail(item.productId)}
    >
      <a
        {...hardNavProps(href)}
        aria-label={item.productName}
        className="home-product-card-link block text-[#111111] no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111]/20"
        onPointerDown={() => {
          writeProductDetailPreview({
            id: item.productId,
            name: item.productName,
            image: item.imageUrl || '',
          })
        }}
        onClick={openProductEvents.onClick}
      >
        <div className="home-product-card-media relative w-full shrink-0 overflow-hidden">
          <EditableImg
            propKey={`home-recommend-product-${item.productId}`}
            src={item.imageUrl || undefined}
            alt={item.productName}
            keywords={item.imageUrl || undefined}
            disableKeywordSearch
            fallbackSrc={CATEGORY_CARD_PLACEHOLDER}
            loading="lazy"
            orientation="square"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            style={{ aspectRatio: '1 / 1' }}
          />
        </div>
        <h3
          className="w-full truncate px-2 pt-2 text-left text-sm font-medium leading-5 text-[#111111] no-underline sm:px-2.5"
          style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}
          title={item.productName}
        >
          {item.productName}
        </h3>
      </a>

      <div className="flex min-h-0 flex-1 flex-col gap-1 px-2 pb-2 sm:px-2.5 sm:pb-2.5">
        {isDraft ? (
          <p className="truncate text-xs leading-4 text-[#8b8477]">{t('product.preview')}</p>
        ) : canViewPrice ? (
          <p className="truncate text-base font-bold leading-5 text-[#111111]">
            {priceDisplay ?? 'US$ --'}
          </p>
        ) : (
          <GuestPlaceholder compact className="truncate" />
        )}

        {!isDraft ? (
          <div
            className="home-product-card-actions mt-1 flex shrink-0 items-center justify-end gap-2 pt-1"
            data-no-hard-nav=""
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <WishlistHeartButton
              productId={item.productId}
              onToggle={(favorited) => handlers.handleAddRecommendProductToWishlist(item, favorited)}
              className="size-9 shrink-0"
            />
            <button
              type="button"
              aria-label={t('product.addToCart')}
              className="home-product-card-cart-btn relative z-[5] inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-[#ebe7de] bg-white text-[#111111] transition hover:border-[#111111] hover:bg-[#111111] hover:text-white"
              {...addToCartEvents}
            >
              <ShoppingCart className="size-3.5 pointer-events-none" aria-hidden />
              <Plus className="pointer-events-none absolute size-2 translate-x-1.5 -translate-y-1.5" aria-hidden />
            </button>
          </div>
        ) : null}
      </div>
    </article>
  )
}

const renderMobileSquircleContent = (
  zone: HomeRecommendZoneSectionType,
  handlers: ZoneHandlers,
  t: ReturnType<typeof useTranslation>['t'],
  limitDisplay = true,
) => {
  const isComingSoon = zoneLooksLikeComingSoon(zone)
  const sourceItems = Array.isArray(zone.items) ? zone.items : []
  const limitedItems = isComingSoon
    ? sourceItems.slice(0, MOBILE_COMING_SOON_MAX)
    : limitDisplay
      ? limitRecommendZoneItems(zone, sourceItems)
      : sourceItems
  const wrapSquircleItems = (count: number, children: React.ReactNode) =>
    isComingSoon ? (
      <MobileComingSoonGrid>{children}</MobileComingSoonGrid>
    ) : (
      <MobileSquircleStrip count={count}>{children}</MobileSquircleStrip>
    )
  if (zone.zoneType === 'PRODUCT') {
    const productItems = limitedItems.filter(
      (item): item is RecommendProductCard => item.entityType === 'PRODUCT',
    )
    if (productItems.length === 0) {
      return (
        <div className="rounded-none bg-transparent px-1 py-6 text-center text-[0.875rem] text-[#8a8073]">
          {t('home.emptyProductZone', { defaultValue: 'No products in this section yet' })}
        </div>
      )
    }
    return wrapSquircleItems(
      productItems.length,
      productItems.map((item) => {
        const href = productHref(item.productId)
        return (
          <a
            key={item.itemId}
            {...hardNavProps(href)}
            className="mobile-zone-squircle"
            onPointerDown={() => {
              writeProductDetailPreview({
                id: item.productId,
                name: item.productName,
                image: item.imageUrl || '',
              })
            }}
            onPointerEnter={() => prefetchProductDetail(item.productId)}
            data-controller-name="移动端推荐商品图标"
          >
            <span className="mobile-zone-squircle__media">
              <EditableImg
                propKey={`home-recommend-product-m-${item.productId}`}
                src={item.imageUrl || undefined}
                alt={item.productName}
                keywords={item.imageUrl || undefined}
                disableKeywordSearch
                fallbackSrc={CATEGORY_CARD_PLACEHOLDER}
                loading="lazy"
                orientation="square"
                className="mobile-zone-squircle__img h-full w-full object-cover"
              />
            </span>
            <span className="mobile-zone-squircle__label">
              <DecorateText propKey={`home_product_name_${item.productId}`} as="span">
                {item.productName}
              </DecorateText>
            </span>
          </a>
        )
      }),
    )
  }

  if (zone.zoneType === 'CATEGORY') {
    const categoryItems = limitedItems.filter(
      (item): item is RecommendCategoryCard => item.entityType === 'CATEGORY',
    )
    if (categoryItems.length === 0) {
      return (
        <div className="rounded-none bg-transparent px-1 py-6 text-center text-[0.875rem] text-[#8a8073]">
          {t('home.emptyCategoryZone', { defaultValue: 'No categories in this section yet' })}
        </div>
      )
    }
    return wrapSquircleItems(
      categoryItems.length,
      categoryItems.map((item) => {
        const displayName = translateCatalogLabel(t, item.categoryName)
        const imageSrc = resolveCategoryCardSrc(item.imageUrl)
        const shelfFallback = resolveCategoryCardFallback(item)
        return (
          <a
            key={item.itemId}
            {...hardNavProps(categoryHref(item.categorySlug, item.categoryId))}
            className="mobile-zone-squircle"
            data-controller-name="移动端推荐类目图标"
          >
            <span className="mobile-zone-squircle__media">
              <EditableImg
                propKey={`home-recommend-category-m-${item.categoryId}`}
                src={imageSrc}
                alt={displayName}
                keywords={undefined}
                disableKeywordSearch
                fallbackSrc={shelfFallback || CATEGORY_CARD_PLACEHOLDER}
                slowFallbackMs={shelfFallback ? CATEGORY_PRODUCT_IMAGE_SLOW_MS : 0}
                loading="lazy"
                orientation="square"
                className="mobile-zone-squircle__img h-full w-full object-cover"
              />
            </span>
            <span className="mobile-zone-squircle__label">
              <DecorateText propKey={`home_category_card_name_${item.categoryId}`} as="span">
                {displayName}
              </DecorateText>
            </span>
          </a>
        )
      }),
    )
  }

  return (
    <div className="rounded-none bg-transparent px-1 py-6 text-center text-[0.875rem] text-[#8a8073]">
      {t('home.emptyZone', { defaultValue: 'Nothing to show in this section yet' })}
    </div>
  )
}

const renderRecommendZoneContent = (
  zone: HomeRecommendZoneSectionType,
  handlers: ZoneHandlers,
  t: ReturnType<typeof useTranslation>['t'],
  limitDisplay = true,
) => {
  const sourceItems = Array.isArray(zone.items) ? zone.items : []
  const limitedItems = limitDisplay
    ? limitRecommendZoneItems(zone, sourceItems)
    : sourceItems
  const productItems = limitedItems.filter(
    (item): item is RecommendProductCard => item.entityType === 'PRODUCT',
  )
  const categoryItems = limitedItems.filter(
    (item): item is RecommendCategoryCard => item.entityType === 'CATEGORY',
  )

  if (zone.zoneType === 'PRODUCT') {
    if (productItems.length === 0) {
      return (
        <div className="rounded-none border-b border-[#ececec] bg-transparent px-2 py-10 text-center text-sm text-[#8a8073]">
          {t('home.emptyProductZone', { defaultValue: 'No products in this section yet' })}
        </div>
      )
    }

    return (
      <div className={getZoneGridClassName(zone)} data-controller-name="首页推荐专区商品网格">
        {productItems.map((item, index) => (
          <RecommendZoneProductCard
            key={item.itemId}
            item={item}
            index={index}
            handlers={handlers}
            t={t}
          />
        ))}
      </div>
    )
  }

  if (zone.zoneType === 'CATEGORY') {
    if (categoryItems.length === 0) {
      return (
        <div className="rounded-none border-b border-[#ececec] bg-transparent px-2 py-3 text-center text-sm text-[#8a8073]">
          {t('home.emptyCategoryZone', { defaultValue: 'No categories in this section yet' })}
        </div>
      )
    }

    return (
      <div className={getCategoryCardGridClassName(zone)} data-controller-name="首页推荐专区类目卡片网格">
        {categoryItems.map((item) => {
          const displayName = translateCatalogLabel(t, item.categoryName)
          const imageSrc = resolveCategoryCardSrc(item.imageUrl)
          const shelfFallback = resolveCategoryCardFallback(item)
          return (
            <button
              key={item.itemId}
              type="button"
              className="group flex flex-col overflow-hidden rounded-[24px] border border-[#ece7dc] bg-white text-left shadow-[0_12px_28px_-24px_rgba(17,17,17,0.28)] transition hover:-translate-y-0.5 hover:border-[#111111] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111]/20"
              data-controller-name="首页推荐专区类目卡片"
              onClick={() =>
                handlers.handleNavigateRecommendCategory(item.categoryId, item.categorySlug)
              }
            >
              <div className="relative aspect-square w-full overflow-hidden bg-[#e8e4dc]">
                <EditableImg
                  propKey={`home-recommend-category-${item.categoryId}`}
                  src={imageSrc}
                  alt={displayName}
                  keywords={undefined}
                  disableKeywordSearch
                  fallbackSrc={shelfFallback || CATEGORY_CARD_PLACEHOLDER}
                  slowFallbackMs={shelfFallback ? CATEGORY_PRODUCT_IMAGE_SLOW_MS : 0}
                  loading="lazy"
                  orientation="square"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  style={{ aspectRatio: '1 / 1' }}
                />
              </div>
              <div className="flex items-center justify-between gap-2 px-3 py-3 sm:px-4">
                <DecorateText
                  propKey={`home_category_card_name_${item.categoryId}`}
                  as="span"
                  className="truncate text-base font-semibold text-[#111111]"
                >
                  {displayName}
                </DecorateText>
                <ChevronRight className="size-4 shrink-0 text-[#8a8073] transition group-hover:text-[#111111]" />
              </div>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="rounded-none border-b border-[#ececec] bg-transparent px-2 py-10 text-center text-sm text-[#8a8073]">
      {t('home.emptyZone', { defaultValue: 'Nothing to show in this section yet' })}
    </div>
  )
}

export const HomeRecommendZoneSection = ({
  zone,
  handlers,
  headingAs = 'h2',
  showViewAll = false,
  onViewAll,
  limitDisplay = true,
  className,
  variant = 'default',
}: HomeRecommendZoneSectionProps) => {
  const { t } = useTranslation()
  const HeadingTag = headingAs
  const isMobileSquircle = variant === 'mobile-squircle'

  return (
    <section
      className={cn(
        'home-zone-section p-0 sm:p-0',
        isMobileSquircle && 'home-zone-section--mobile-squircle',
        className,
      )}
      data-controller-name="首页推荐专区分组"
    >
      <div
        className={cn(
          'home-zone-section__head flex flex-nowrap items-center justify-between',
          isMobileSquircle ? 'mb-2.5 gap-3' : 'mb-5 gap-4',
        )}
        style={
          isMobileSquircle
            ? {
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'nowrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
              }
            : undefined
        }
      >
        <div
          className={cn(
            'flex min-w-0 flex-1 items-center overflow-hidden',
            isMobileSquircle ? 'gap-3' : 'gap-4',
          )}
        >
          <DecorateText
            propKey={`home_zone_title_${zone.zoneId}`}
            as={HeadingTag}
            className={cn(
              isMobileSquircle
                ? 'home-zone-section__title--mobile min-w-0 text-[0.875rem] font-semibold tracking-[0.02em] text-[#3a322a]'
                : cn(
                    headingAs === 'h1' ? 'text-[34px]' : 'text-[28px]',
                    'font-semibold tracking-[0.02em] text-[#4a4137]',
                  ),
              'truncate',
            )}
          >
            {translateCatalogLabel(t, zone.title)}
          </DecorateText>
          {!isMobileSquircle ? <div className="h-px flex-1 bg-[#d8d1c7]" /> : null}
        </div>
        {showViewAll && (zone.zoneType === 'PRODUCT' || zone.zoneType === 'CATEGORY') ? (
          isMobileSquircle ? (
            <a
              {...hardNavProps(`/zone/?zoneId=${encodeURIComponent(zone.zoneId)}`)}
              className="home-zone-section__view-all ml-auto inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap text-[0.8125rem] font-semibold text-[#4a4137] no-underline"
            >
              <span>{t('common.viewAll', { defaultValue: 'View All' })}</span>
              <ChevronRight className="size-3.5" />
            </a>
          ) : (
          <button
            type="button"
            className="home-zone-section__view-all ml-auto inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-sm font-semibold text-[#4a4137] transition hover:text-[#111111]"
            onClick={() => onViewAll?.(zone.zoneId)}
          >
            <span>{t('common.viewAll', { defaultValue: 'View All' })}</span>
            <ChevronRight className="size-4" />
          </button>
          )
        ) : null}
      </div>
      {isMobileSquircle
        ? renderMobileSquircleContent(zone, handlers, t, limitDisplay)
        : renderRecommendZoneContent(zone, handlers, t, limitDisplay)}
    </section>
  )
}

export default HomeRecommendZoneSection
