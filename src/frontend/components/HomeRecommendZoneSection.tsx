'use client'

import React from 'react'
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

type RecommendProductCard = HomeRecommendProductCard
type RecommendCategoryCard = HomeRecommendCategoryCard

type ZoneHandlers = Pick<
  HomeHandlers,
  | 'handleNavigateRecommendProduct'
  | 'handleNavigateRecommendCategory'
  | 'handleAddRecommendProductToCart'
  | 'handleAddRecommendProductToWishlist'
>

type HomeRecommendZoneSectionProps = {
  zone: HomeRecommendZoneSectionType
  handlers: ZoneHandlers
  headingAs?: 'h1' | 'h2'
  showViewAll?: boolean
  onViewAll?: (zoneId: string) => void
  className?: string
}

const formatPrice = (price?: number | null) => {
  if (typeof price !== 'number' || Number.isNaN(price)) return 'US$ --'
  return `US$ ${price.toFixed(2)}`
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

const resolveCategoryCardSrc = (imageUrl?: string | null) => {
  const text = String(imageUrl || '').trim()
  return text || CATEGORY_CARD_PLACEHOLDER
}

const renderRecommendZoneContent = (
  zone: HomeRecommendZoneSectionType,
  handlers: ZoneHandlers,
  t: ReturnType<typeof useTranslation>['t'],
) => {
  const productItems = zone.items.filter(
    (item): item is RecommendProductCard => item.entityType === 'PRODUCT',
  )
  const categoryItems = zone.items.filter(
    (item): item is RecommendCategoryCard => item.entityType === 'CATEGORY',
  )

  if (zone.zoneType === 'PRODUCT') {
    if (productItems.length === 0) {
      return (
        <div className="rounded-none border-b border-[#ececec] bg-transparent px-2 py-10 text-center text-sm text-[#8a8073]">
          当前商品专区暂无可展示内容
        </div>
      )
    }

    return (
      <div className={getZoneGridClassName(zone)} data-controller-name="首页推荐专区商品网格">
        {productItems.map((item, index) => {
          const isDraft = item.status === 'DRAFT'
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
                <div className="mt-auto flex items-end justify-between gap-3 pt-1">
                  {isDraft ? (
                    <div className="min-h-[40px] flex-1" aria-hidden="true" />
                  ) : (
                    <div>
                      <StorePrice className="text-2xl font-bold">
                        <p className="text-2xl font-bold text-[#111111]">{formatPrice(item.price)}</p>
                        {item.originalPrice ? (
                          <p className="mt-1 text-sm text-[#8b8477] line-through">{formatPrice(item.originalPrice)}</p>
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
                      onClick={() => handlers.handleAddRecommendProductToCart(item)}
                    >
                      <ShoppingCart className="mr-2 size-4" />
                      <DecorateText propKey="home_add_to_cart_label" as="span">
                        加入购物车
                      </DecorateText>
                    </Button>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    )
  }

  if (zone.zoneType === 'CATEGORY') {
    if (categoryItems.length === 0) {
      return (
        <div className="rounded-none border-b border-[#ececec] bg-transparent px-2 py-3 text-center text-sm text-[#8a8073]">
          当前类目专区暂无可展示内容
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
                  fallbackSrc={CATEGORY_CARD_PLACEHOLDER}
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
      当前专区暂无可展示内容
    </div>
  )
}

export const HomeRecommendZoneSection = ({
  zone,
  handlers,
  headingAs = 'h2',
  showViewAll = false,
  onViewAll,
  className,
}: HomeRecommendZoneSectionProps) => {
  const { t } = useTranslation()
  const HeadingTag = headingAs

  return (
    <section
      className={cn('home-zone-section p-0 sm:p-0', className)}
      data-controller-name="首页推荐专区分组"
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <DecorateText
            propKey={`home_zone_title_${zone.zoneId}`}
            as={HeadingTag}
            className={cn(
              headingAs === 'h1' ? 'text-[34px]' : 'text-[28px]',
              'truncate font-semibold tracking-[0.02em] text-[#4a4137]',
            )}
          >
            {translateCatalogLabel(t, zone.title)}
          </DecorateText>
          <div className="h-px flex-1 bg-[#d8d1c7]" />
        </div>
        {showViewAll && zone.zoneType === 'PRODUCT' ? (
          <button
            type="button"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-[#4a4137] transition hover:text-[#111111]"
            onClick={() => onViewAll?.(zone.zoneId)}
          >
            <span>View All</span>
            <ChevronRight className="size-4" />
          </button>
        ) : null}
      </div>
      {renderRecommendZoneContent(zone, handlers, t)}
    </section>
  )
}

export default HomeRecommendZoneSection
