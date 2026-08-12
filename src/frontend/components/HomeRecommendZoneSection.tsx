'use client'

import React, { useState } from 'react'
import { ChevronRight, ShoppingCart, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
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
import { StorePrice } from '@/frontend/components/GuestPricePlaceholder'
import { limitRecommendZoneItems } from '@/frontend/utils/recommendZoneDisplay'

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
  if (fallback && fallback !== primary) return fallback
  return CATEGORY_CARD_PLACEHOLDER
}

/** Horizontal squircle strip: ≤5 fill row; >5 scrolls (5 visible). */
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

type RecommendZoneProductCardProps = {
  item: RecommendProductCard
  index: number
  handlers: ZoneHandlers
  t: ReturnType<typeof useTranslation>['t']
}

const RecommendZoneProductCard = ({ item, index, handlers, t }: RecommendZoneProductCardProps) => {
  const isDraft = item.status === 'DRAFT'
  const [selectedSkuId, setSelectedSkuId] = useState<string>(() => {
    return (
      (item.defaultSkuId || '') ||
      (item.skuOptions?.[0]?.skuId || '') ||
      ''
    )
  })

  const selectedOption =
    item.skuOptions?.find((opt) => opt.skuId === selectedSkuId) ||
    item.skuOptions?.[0] ||
    null

  const showOptions = !isDraft && item.skuOptions && item.skuOptions.length > 1

  const priceToShow = selectedOption?.price ?? item.price
  const originalPriceToShow = selectedOption?.originalPrice ?? item.originalPrice

  return (
    <article
      key={item.itemId}
      className="home-product-card group flex h-full flex-col overflow-hidden p-0 transition"
      data-controller-name="首页推荐专区商品卡片"
    >
      <button
        type="button"
        className="home-product-card-media relative block w-full shrink-0 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111]/20"
        onClick={() => handlers.handleNavigateRecommendProduct(item.productId)}
      >
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
      </button>

      <div className="flex flex-1 flex-col gap-2 px-2.5 pb-2.5 pt-2 sm:px-3 sm:pb-3">
        <button
          type="button"
          className="line-clamp-2 text-left text-lg font-semibold leading-7 text-[#111111] transition-colors hover:text-[#5f4b32]"
          onClick={() => handlers.handleNavigateRecommendProduct(item.productId)}
          data-api-bind-info={`productItems-${index}-productName`}
          data-api-map-var-name="item"
        >
          <DecorateText propKey={`home_product_name_${item.productId}`} as="span">
            {item.productName}
          </DecorateText>
        </button>

        {!isDraft ? (
          <div className="flex items-center gap-3 text-sm text-[#7a756c]">
            <div className="flex items-center gap-1">{renderRatingStars(item.ratingAverage)}</div>
            <span>{item.ratingAverage.toFixed(1)} / 5</span>
            <span>({item.ratingCount})</span>
          </div>
        ) : null}

        {showOptions ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {item.skuOptions.map((opt) => {
              const isActive = opt.skuId === selectedSkuId
              return (
                <button
                  key={opt.skuId}
                  type="button"
                  className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition ${
                    isActive
                      ? 'border-[#111111] bg-[#111111] text-white'
                      : 'border-[#ebe7de] bg-white text-[#111111] hover:border-[#111111]'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedSkuId(opt.skuId)
                  }}
                  title={opt.label}
                >
                  <span className="truncate max-w-[90px]">{opt.label}</span>
                  <span className="shrink-0">
                    {typeof opt.price === 'number' ? `US$ ${opt.price.toFixed(2)}` : 'US$ --'}
                  </span>
                </button>
              )
            })}
          </div>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-3 pt-1">
          {isDraft ? (
            <div className="min-h-[40px] flex-1" aria-hidden="true" />
          ) : (
            <div>
              <StorePrice className="text-2xl font-bold">
                <p className="text-2xl font-bold text-[#111111]">{formatPrice(priceToShow)}</p>
                {originalPriceToShow ? (
                  <p className="mt-1 text-sm text-[#8b8477] line-through">{formatPrice(originalPriceToShow)}</p>
                ) : null}
              </StorePrice>
            </div>
          )}

          {isDraft ? (
            <WishlistHeartButton
              productId={item.productId}
              productName={item.productName}
              className="size-10 rounded-full"
              size={20}
              onToggle={(favorited) => handlers.handleAddRecommendProductToWishlist(item, favorited)}
            />
          ) : (
            <Button
              type="button"
              className="rounded-full bg-[#111111] px-4 py-2 text-sm font-semibold text-white hover:bg-[#262626]"
              onClick={() => {
                if (showOptions && selectedSkuId) {
                  void handlers.handleAddRecommendProductSkuToCart(item, selectedSkuId)
                } else {
                  void handlers.handleAddRecommendProductToCart(item)
                }
              }}
            >
              <ShoppingCart className="mr-2 size-4" />
              <DecorateText propKey="home_add_to_cart_label" as="span">
                {t('product.addToCart', { defaultValue: 'Add to cart' })}
              </DecorateText>
            </Button>
          )}
        </div>
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
  const limitedItems = limitDisplay
    ? limitRecommendZoneItems(zone, zone.items)
    : Array.isArray(zone.items)
      ? zone.items
      : []
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
    return (
      <MobileSquircleStrip count={productItems.length}>
        {productItems.map((item) => (
          <button
            key={item.itemId}
            type="button"
            className="mobile-zone-squircle"
            onClick={() => handlers.handleNavigateRecommendProduct(item.productId)}
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
                className="h-full w-full object-cover"
                style={{ aspectRatio: '1 / 1' }}
              />
            </span>
            <span className="mobile-zone-squircle__label">
              <DecorateText propKey={`home_product_name_${item.productId}`} as="span">
                {item.productName}
              </DecorateText>
            </span>
          </button>
        ))}
      </MobileSquircleStrip>
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
    return (
      <MobileSquircleStrip count={categoryItems.length}>
        {categoryItems.map((item) => {
          const displayName = translateCatalogLabel(t, item.categoryName)
          const imageSrc = resolveCategoryCardSrc(item.imageUrl)
          return (
            <button
              key={item.itemId}
              type="button"
              className="mobile-zone-squircle"
              onClick={() =>
                handlers.handleNavigateRecommendCategory(item.categoryId, item.categorySlug)
              }
              data-controller-name="移动端推荐类目图标"
            >
              <span className="mobile-zone-squircle__media">
                <EditableImg
                  propKey={`home-recommend-category-m-${item.categoryId}`}
                  src={imageSrc}
                  alt={displayName}
                  keywords={undefined}
                  disableKeywordSearch
                  fallbackSrc={resolveCategoryCardFallback(item)}
                  slowFallbackMs={CATEGORY_PRODUCT_IMAGE_SLOW_MS}
                  loading="lazy"
                  orientation="square"
                  className="h-full w-full object-cover"
                  style={{ aspectRatio: '1 / 1' }}
                />
              </span>
              <span className="mobile-zone-squircle__label">
                <DecorateText propKey={`home_category_card_name_${item.categoryId}`} as="span">
                  {displayName}
                </DecorateText>
              </span>
            </button>
          )
        })}
      </MobileSquircleStrip>
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
                  fallbackSrc={resolveCategoryCardFallback(item)}
                  slowFallbackMs={CATEGORY_PRODUCT_IMAGE_SLOW_MS}
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
          'flex items-center justify-between',
          isMobileSquircle ? 'mb-2.5 gap-3' : 'mb-5 gap-4',
        )}
      >
        <div className={cn('flex min-w-0 flex-1 items-center', isMobileSquircle ? 'gap-3' : 'gap-4')}>
          <DecorateText
            propKey={`home_zone_title_${zone.zoneId}`}
            as={HeadingTag}
            className={cn(
              isMobileSquircle
                ? 'home-zone-section__title--mobile text-[0.875rem] font-semibold tracking-[0.02em] text-[#3a322a]'
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
          <button
            type="button"
            className={cn(
              'inline-flex shrink-0 items-center font-semibold text-[#4a4137] transition hover:text-[#111111]',
              isMobileSquircle ? 'gap-0.5 text-[0.8125rem]' : 'gap-1 text-sm',
            )}
            onClick={() => onViewAll?.(zone.zoneId)}
          >
            <span>{t('common.viewAll', { defaultValue: 'View All' })}</span>
            <ChevronRight className={isMobileSquircle ? 'size-3.5' : 'size-4'} />
          </button>
        ) : null}
      </div>
      {isMobileSquircle
        ? renderMobileSquircleContent(zone, handlers, t, limitDisplay)
        : renderRecommendZoneContent(zone, handlers, t, limitDisplay)}
    </section>
  )
}

export default HomeRecommendZoneSection
