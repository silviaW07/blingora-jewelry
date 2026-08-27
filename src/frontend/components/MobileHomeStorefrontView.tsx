'use client'

/**
 * Mobile-only home stream. Desktop keeps HomeStorefrontView layout.
 * Order: chrome → search → L1 chips → banner → services → recommend zones
 */
import React, { useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
} from 'lucide-react'
import EditableImg from '@/@base/EditableImg'
import { cn } from '@/lib/utils'
import type { HomeHandlers, HomeState } from '@/frontend/hooks/useHome'
import type { HomeRecommendZoneSection } from '@/frontend/actions/Home'
import { MobileStorefrontHeader } from '@/frontend/components/MobileStorefrontHeader'
import { HomeRecommendZoneSection as RecommendZoneSection } from '@/frontend/components/HomeRecommendZoneSection'
import { ProductListCard } from '@/frontend/components/ProductListCard'
import { ProductListToolbar } from '@/frontend/components/ProductListToolbar'
import { ListingPageHead } from '@/frontend/components/ListingPageHead'
import { HomeServiceBenefitGrid } from '@/frontend/components/HomeServiceBenefitGrid'
import { isDailyNewArrivalCategoryName, findDailyNewArrivalCategory } from '@/frontend/utils/dailyNewArrival'
import { isStorefrontHomeContentZone, isComingSoonRecommendZoneTitle } from '@/frontend/utils/recommendZoneDisplay'
import { translateCatalogLabel } from '@/frontend/i18n/catalogLabels'
import { useTranslation } from 'react-i18next'
import { categoryHref, hardNavigate, hardNavProps, useChromeActivate, useStorefrontLink } from '@/frontend/utils/hardNavigate'
import { isAbsoluteHttpUrl, normalizePosterLinkUrl } from '@/shared/posterLink'
import type { HomeBannerItem } from '@/frontend/hooks/useHome'

const isDefaultHomeQueryState = (state: HomeState) => {
  if (state.isDailyNewArrivalMode || state.selectedDailyNewArrivalMonthKey) return false
  const q = state.queryState
  return !(
    q.categoryId ||
    q.searchKeyword ||
    q.keywordId ||
    q.keywordGroupId ||
    q.brandCategoryId ||
    q.minPrice !== undefined ||
    q.maxPrice !== undefined ||
    q.hasDiscount ||
    q.minRating !== undefined ||
    q.stockStatus.length > 0
  )
}

function BannerDotButton({
  index,
  active,
  onSelect,
}: {
  index: number
  active: boolean
  onSelect: () => void
}) {
  const dotEvents = useChromeActivate(onSelect)
  return (
    <button
      type="button"
      className={cn(
        'h-1.5 rounded-full transition-all',
        active ? 'w-5 bg-white' : 'w-1.5 bg-white/40',
      )}
      {...dotEvents}
      aria-label={`Banner ${index + 1}`}
    />
  )
}

interface Props {
  state: HomeState
  handlers: HomeHandlers
}

function HomeChipLink({
  label,
  isActive,
  href,
}: {
  label: string
  isActive: boolean
  href: string
}) {
  const link = useStorefrontLink(href)
  return (
    <a
      {...link}
      data-active={isActive}
      className={cn(
        'mobile-home__chip relative shrink-0 py-2 text-[0.8125rem] font-semibold tracking-[0.02em] transition-colors',
        isActive ? 'text-[#f254a6]' : 'text-[#3a3a3a]',
      )}
    >
      <span className="whitespace-nowrap">{label}</span>
    </a>
  )
}

export function MobileHomeStorefrontView({ state, handlers }: Props) {
  const router = useRouter()
  const { t } = useTranslation()
  const {
    posters,
    activeBannerIndex,
    categories,
    recommendZones,
    isLoadingRecommendZones,
    queryState,
    products,
    isLoadingProducts,
    totalCount,
    categoryDetail,
    isSecondaryCategoryResults,
    selectedParentCategory,
    dailyNewArrivalMonths,
    selectedDailyNewArrivalMonthKey,
    dailyNewArrivalProducts,
    dailyNewArrivalTotalActiveProducts,
    isLoadingDailyNewArrivalProducts,
  } = state

  const categoryProductsRef = useRef<HTMLElement | null>(null)

  // Banner swipe support (Chrome mobile often doesn't respond to overlay button clicks reliably).
  // We detect a horizontal swipe and switch poster index; during swipe we block banner click.
  const bannerTouchRef = useRef<{
    startX: number
    startY: number
    isSwiping: boolean
    endX: number
  } | null>(null)

  const isDefaultHomeState = isDefaultHomeQueryState(state)
  const prevBannerEvents = useChromeActivate(() => handlers.handleBannerChange(activeBannerIndex - 1))
  const nextBannerEvents = useChromeActivate(() => handlers.handleBannerChange(activeBannerIndex + 1))

  const handleBannerLinkClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, banner: HomeBannerItem) => {
      if (bannerTouchRef.current?.isSwiping) {
        event.preventDefault()
        return
      }
      const target = normalizePosterLinkUrl(banner.link_url)
      if (!target) {
        event.preventDefault()
        return
      }
      if (target.startsWith('/')) {
        event.preventDefault()
        hardNavigate(target)
        return
      }
      if (isAbsoluteHttpUrl(target)) {
        event.preventDefault()
        window.location.href = target
      }
    },
    [],
  )

  /** PRODUCT + CATEGORY zones, including the Coming directory. */
  const contentZones = useMemo(
    () => recommendZones.filter((z) => isStorefrontHomeContentZone(z)),
    [recommendZones],
  )

  const currentCategoryName = queryState.searchKeyword
    ? t('product.searchPrefix', { keyword: queryState.searchKeyword })
    : translateCatalogLabel(
        t,
        categoryDetail?.category_name ||
          categories.find((item) => item.category_id === queryState.categoryId)?.category_name ||
          selectedParentCategory?.children.find((c) => c.category_id === queryState.categoryId)
            ?.category_name ||
          selectedParentCategory?.category_name ||
          t('product.categoryProducts'),
      )

  const goHomeClear = () => {
    handlers.handleSelectCategory('')
    router.push('/')
  }

  const selectTopCategory = (categoryId: string, slug?: string | null, name?: string) => {
    if (name && isDailyNewArrivalCategoryName(name)) {
      handlers.handleToggleDesktopTopNavCategory(categoryId, { categorySlug: slug })
      return
    }
    handlers.handleSelectCategory(categoryId, { categorySlug: slug })
  }

  const dailyNewCategory = useMemo(
    () => findDailyNewArrivalCategory(categories),
    [categories],
  )
  const dailyNewHref = dailyNewCategory
    ? categoryHref(dailyNewCategory.category_slug, dailyNewCategory.category_id)
    : '/'
  const isHomeChipActive = isDefaultHomeState
  const isNewChipActive = Boolean(
    (dailyNewCategory && queryState.categoryId === dailyNewCategory.category_id) ||
      selectedDailyNewArrivalMonthKey,
  )

  return (
    <div className="mobile-home bg-[#f7f4f0]" data-controller-name="移动端首页流式布局">
      <MobileStorefrontHeader initialKeyword={queryState.searchKeyword || ''} />

      {/* Horizontal L1 directory only — no Expand all */}
      <div className="mobile-home__chips mb-3 border-b border-[#ebe4d8] bg-[#f7f4f0]">
        <div className="mobile-home__chips-row">
          <HomeChipLink key="home" label={t('nav.home')} isActive={isHomeChipActive} href="/" />
          <HomeChipLink
            key="new"
            label={t('nav.new', { defaultValue: 'new' })}
            isActive={isNewChipActive}
            href={dailyNewHref}
          />
          {categories
            .filter(
              (category) =>
                !isComingSoonRecommendZoneTitle(category.category_name) &&
                !isDailyNewArrivalCategoryName(category.category_name),
            )
            .map((category) => {
            const isActive =
              queryState.categoryId === category.category_id ||
              category.children.some((c) => c.category_id === queryState.categoryId) ||
              (isDailyNewArrivalCategoryName(category.category_name) &&
                Boolean(selectedDailyNewArrivalMonthKey))
            return (
              <HomeChipLink
                key={category.category_id}
                label={translateCatalogLabel(t, category.category_name)}
                isActive={isActive}
                href={categoryHref(category.category_slug, category.category_id)}
              />
            )
          })}
        </div>
      </div>

      {isDefaultHomeState ? (
        <div className="mobile-home__stream px-0 pb-6">
          {/* 2. Full-width banner — fixed height band below chips */}
          <section
            className="mobile-home__banner mb-4 w-full px-3"
            data-controller-name="移动端全宽Banner"
          >
            <div
              className="mobile-home__banner-shell relative w-full overflow-hidden rounded-xl bg-[#1a1a1a]"
              onTouchStart={(e) => {
                if (!posters.length) return
                const t = e.touches[0]
                bannerTouchRef.current = {
                  startX: t.clientX,
                  startY: t.clientY,
                  isSwiping: false,
                  endX: t.clientX,
                }
              }}
              onTouchMove={(e) => {
                const cur = bannerTouchRef.current
                if (!cur) return
                const t = e.touches[0]
                const dx = t.clientX - cur.startX
                const dy = t.clientY - cur.startY
                // Decide swipe only for mostly horizontal gesture.
                if (!cur.isSwiping && Math.abs(dx) > 18 && Math.abs(dx) > Math.abs(dy) * 1.2) {
                  cur.isSwiping = true
                }
                cur.endX = t.clientX
              }}
              onTouchEnd={() => {
                const cur = bannerTouchRef.current
                if (!cur) return
                if (cur.isSwiping && posters.length) {
                  const dx = cur.endX - cur.startX
                  const absDx = Math.abs(dx)
                  const SWIPE_MIN = 48
                  if (absDx >= SWIPE_MIN) {
                    const dir = dx < 0 ? 1 : -1 // left swipe -> next
                    handlers.handleBannerChange(activeBannerIndex + dir)
                  }
                }
                window.setTimeout(() => {
                  if (bannerTouchRef.current) bannerTouchRef.current.isSwiping = false
                }, 320)
              }}
            >
              {posters.length > 0 ? (
                <>
                  <div
                    className="mobile-home__banner-track absolute inset-0 z-[1] flex h-full w-full"
                    style={{ transform: `translate3d(-${activeBannerIndex * 100}%, 0, 0)` }}
                  >
                    {posters.map((banner, index) => {
                      if (Math.abs(index - activeBannerIndex) > 1) {
                        return (
                          <div
                            key={banner.poster_id}
                            className="mobile-home__banner-slide relative h-full w-full shrink-0"
                          />
                        )
                      }
                      const link = normalizePosterLinkUrl(banner.link_url)
                      const slideMedia = (
                        <EditableImg
                          propKey={`mobile-category-poster-${banner.poster_id}`}
                          src={banner.image_url || undefined}
                          keywords={banner.image_url || banner.title}
                          alt={banner.title || 'Banner'}
                          disableKeywordSearch
                          loading={index === 0 ? 'eager' : 'lazy'}
                          proxyWidth={index === 0 ? 720 : 640}
                          proxyQuality={85}
                          className="mobile-home__banner-media absolute inset-0 h-full w-full object-cover"
                        />
                      )
                      return (
                        <div
                          key={banner.poster_id}
                          className="mobile-home__banner-slide relative h-full w-full shrink-0"
                        >
                          {link ? (
                            <a
                              href={link}
                              data-no-hard-nav=""
                              className="mobile-home__banner-hit absolute inset-0 block h-full w-full overflow-hidden"
                              aria-label={banner.title || 'Banner'}
                              onClick={(event) => handleBannerLinkClick(event, banner)}
                            >
                              {slideMedia}
                            </a>
                          ) : (
                            <div className="mobile-home__banner-hit absolute inset-0 block h-full w-full overflow-hidden">
                              {slideMedia}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  {posters.length > 1 ? (
                    <>
                      <button
                        type="button"
                        className="absolute left-2 top-1/2 z-[2] flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#111]"
                        {...prevBannerEvents}
                        aria-label="Previous banner"
                      >
                        <ChevronLeft className="size-4" />
                      </button>
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 z-[2] flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#111]"
                        {...nextBannerEvents}
                        aria-label="Next banner"
                      >
                        <ChevronRight className="size-4" />
                      </button>
                      <div className="absolute bottom-2 left-1/2 z-[2] flex -translate-x-1/2 gap-1.5">
                        {posters.map((banner, index) => (
                          <BannerDotButton
                            key={banner.poster_id}
                            index={index}
                            active={index === activeBannerIndex}
                            onSelect={() => handlers.handleBannerChange(index)}
                          />
                        ))}
                      </div>
                    </>
                  ) : null}
                </>
              ) : (
                <div className="mobile-home__banner-placeholder absolute inset-0 flex flex-col items-start justify-end p-4 text-white">
                  <p className="text-[0.75rem] font-bold uppercase tracking-[0.14em] opacity-90">
                    {t('mobile.promoEyebrow')}
                  </p>
                  <p className="mt-0.5 text-[0.875rem] font-bold leading-tight">
                    {t('mobile.bannerPlaceholderTitle', { defaultValue: 'Wholesale deals for you' })}
                  </p>
                  <span className="mt-2 inline-flex rounded-full bg-white px-3 py-1 text-[0.8125rem] font-bold text-[#c43d5c]">
                    {t('mobile.shopNow', { defaultValue: 'Shop now' })}
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* 3. Service benefit cards — shared with desktop, static, icon+title+desc */}
          <section
            className="mobile-home__services mb-3 px-3"
            data-controller-name="移动端服务权益网格"
          >
            <HomeServiceBenefitGrid gridControllerName="移动端服务权益网格" />
          </section>

          {/* 6. All recommend zones with titles (CATEGORY + PRODUCT, includes 包包 etc.) */}
          <section
            className="mobile-home__zones mb-4 px-3"
            data-controller-name="移动端推荐专区"
          >
            {isLoadingRecommendZones ? (
              <div
                className="flex flex-col gap-4"
                aria-busy="true"
                aria-label={t('common.loading')}
              >
                {[0, 1].map((row) => (
                  <div key={row} className="space-y-3">
                    <div className="h-4 w-28 animate-pulse rounded bg-[#ebe4d8]" />
                    <div className="grid grid-cols-2 gap-2.5">
                      {[0, 1, 2, 3].map((cell) => (
                        <div
                          key={cell}
                          className="aspect-square animate-pulse rounded-2xl bg-[#ebe4d8]"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : contentZones.length > 0 ? (
              <div className="flex flex-col gap-4">
                {contentZones.map((zone: HomeRecommendZoneSection, zoneIndex) => (
                  <RecommendZoneSection
                    key={zone.zoneId}
                    zone={zone}
                    handlers={handlers}
                    showViewAll
                    onViewAll={handlers.handleNavigateRecommendZone}
                    className="mobile-home-zone"
                    variant="mobile-squircle"
                    eagerImageCount={zoneIndex === 0 ? 6 : 0}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[#e0d8cc] bg-white/60 px-4 py-8 text-center text-sm text-[#8a8073]">
                {t('mobile.noRecommendedCategories', { defaultValue: 'No categories yet' })}
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="storefront-container px-3 pb-6">
          {selectedDailyNewArrivalMonthKey ? (
            <section ref={categoryProductsRef} className="scroll-mt-4 py-4">
              <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.14em] text-[#8b8477]">
                {t('product.dailyNewTitle')}
              </p>
              <h2 className="mt-1 text-[0.9375rem] font-semibold text-[#333]">
                {dailyNewArrivalMonths.find((m) => m.monthKey === selectedDailyNewArrivalMonthKey)
                  ?.label || t('product.dailyNewFallback')}
              </h2>
              {isLoadingDailyNewArrivalProducts ? (
                <div className="mt-8 flex flex-col items-center gap-2 text-[0.875rem] text-[#7a756c]">
                  <Loader2 className="size-5 animate-spin" />
                  {t('product.loading')}
                </div>
              ) : dailyNewArrivalProducts.length > 0 ? (
                <div className="storefront-product-grid mt-4 grid grid-cols-2 gap-2.5">
                  {dailyNewArrivalProducts.map((item, index) => (
                    <ProductListCard
                      key={item.product_id}
                      item={item}
                      imagePropKey={`mobile-home-daily-${item.product_id}`}
                      onNavigate={handlers.handleNavigateToDetail}
                      onAddToCart={handlers.handleAddToCart}
                      onAddToWishlist={handlers.handleAddToWishlist}
                      controllerName="每日上新商品卡片"
                      priority={index < 6}
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-8 text-center text-[0.875rem] text-[#7a756c]">
                  {dailyNewArrivalTotalActiveProducts === 0
                    ? t('product.noProducts')
                    : t('product.emptyMonthHint')}
                </div>
              )}
            </section>
          ) : (
            <section ref={categoryProductsRef} className="listing-results-section scroll-mt-4 py-1.5">
              <ListingPageHead
                title={currentCategoryName}
                countText={
                  isLoadingProducts && products.length === 0
                    ? t('product.loadingShort')
                    : `(${t('product.totalCount', { count: totalCount })})`
                }
                backLabel={t('common.backToHome')}
                onBack={goHomeClear}
              />
              <ProductListToolbar
                className="mt-1.5 w-full"
                hideBrands={Boolean(queryState.searchKeyword)}
                minPrice={queryState.minPrice}
                maxPrice={queryState.maxPrice}
                sortBy={queryState.sortBy}
                onPriceRangeChange={handlers.handlePriceRangeChange}
                onSortChange={handlers.handleSortChange}
                brandOptions={state.availableBrandFilters}
                selectedBrandId={queryState.brandCategoryId}
                onBrandToggle={handlers.handleBrandQuickFilterToggle}
                isBrandExpanded={state.isBrandExpanded}
                onBrandExpandToggle={handlers.handleToggleBrandExpand}
                isLoadingBrands={
                  state.isLoadingBrandFilters && state.availableBrandFilters.length === 0
                }
              />
              {products.length > 0 ? (
                <div className="storefront-product-grid mt-3 grid grid-cols-2 gap-2.5">
                  {products.map((item, index) => (
                    <ProductListCard
                      key={item.product_id}
                      item={item}
                      imagePropKey={`mobile-home-cat-product-${item.product_id}`}
                      onNavigate={handlers.handleNavigateToDetail}
                      onAddToCart={handlers.handleAddToCart}
                      onAddToWishlist={handlers.handleAddToWishlist}
                      controllerName={
                        isSecondaryCategoryResults ? '二级类目商品卡片' : '一级类目商品卡片'
                      }
                      priority={index < 6}
                    />
                  ))}
                </div>
              ) : isLoadingProducts ? (
                <div className="mt-8 flex flex-col items-center gap-2 text-[0.875rem] text-[#7a756c]">
                  <Loader2 className="size-5 animate-spin" />
                  {t('product.loading')}
                </div>
              ) : (
                <div className="mt-10 flex flex-col items-center text-center">
                  <Package className="size-8 text-[#bbb]" />
                  <p className="mt-3 text-[0.875rem] text-[#7a756c]">
                    {queryState.searchKeyword
                      ? t('product.emptySearchTitle')
                      : t('product.emptyCategory')}
                  </p>
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  )
}

export default MobileHomeStorefrontView
