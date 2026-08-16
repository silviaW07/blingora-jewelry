'use client'

/**
 * Mobile-only home stream (md:hidden). Desktop keeps HomeStorefrontView layout.
 * Order: chrome → search → L1 chips → banner → services → recommend zones
 */
import React, { useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
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
import { HomeServiceBenefitGrid } from '@/frontend/components/HomeServiceBenefitGrid'
import { isDailyNewArrivalCategoryName } from '@/frontend/utils/dailyNewArrival'
import { translateCatalogLabel } from '@/frontend/i18n/catalogLabels'
import { useTranslation } from 'react-i18next'

interface Props {
  state: HomeState
  handlers: HomeHandlers
}

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

  const isDefaultHomeState = isDefaultHomeQueryState(state)
  const activeBanner = posters[activeBannerIndex] || null

  /** PRODUCT + CATEGORY zones keep individual titles (e.g. 包包) */
  const contentZones = useMemo(
    () => recommendZones.filter((z) => z.zoneType === 'PRODUCT' || z.zoneType === 'CATEGORY'),
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

  const isHomeChipActive = isDefaultHomeState

  const renderChipButton = (
    key: string,
    label: string,
    isActive: boolean,
    onClick: () => void,
  ) => (
    <button
      key={key}
      type="button"
      data-active={isActive}
      className={cn(
        'mobile-home__chip relative shrink-0 py-2 text-[0.8125rem] font-semibold tracking-[0.02em] transition-colors',
        isActive ? 'text-[#f254a6]' : 'text-[#3a3a3a]',
      )}
      onClick={onClick}
    >
      <span className="whitespace-nowrap">{label}</span>
      {isActive ? (
        <span className="absolute bottom-0 left-1/2 h-0.5 w-[70%] -translate-x-1/2 rounded-full bg-[#f254a6]" />
      ) : null}
    </button>
  )

  return (
    <div className="mobile-home bg-[#f7f4f0]" data-controller-name="移动端首页流式布局">
      <MobileStorefrontHeader initialKeyword={queryState.searchKeyword || ''} />

      {/* Horizontal L1 directory only — no Expand all */}
      <div className="mobile-home__chips mb-3 border-b border-[#ebe4d8] bg-[#f7f4f0]">
        <div className="mobile-home__chips-row">
          {renderChipButton('home', t('nav.home'), isHomeChipActive, goHomeClear)}
          {categories.map((category) => {
            const isActive =
              queryState.categoryId === category.category_id ||
              category.children.some((c) => c.category_id === queryState.categoryId) ||
              (isDailyNewArrivalCategoryName(category.category_name) &&
                Boolean(selectedDailyNewArrivalMonthKey))
            return renderChipButton(
              category.category_id,
              translateCatalogLabel(t, category.category_name),
              isActive,
              () =>
                selectTopCategory(
                  category.category_id,
                  category.category_slug,
                  category.category_name,
                ),
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
            <div className="mobile-home__banner-shell relative w-full overflow-hidden rounded-xl bg-[#1a1a1a]">
              {activeBanner ? (
                <>
                  <button
                    type="button"
                    className="mobile-home__banner-hit absolute inset-0 z-[1] block h-full w-full overflow-hidden"
                    onClick={() => handlers.handleBannerClick(activeBanner)}
                    aria-label={activeBanner.title || 'Banner'}
                  >
                    <EditableImg
                      propKey={`mobile-category-poster-${activeBanner.poster_id}`}
                      src={activeBanner.image_url || undefined}
                      keywords={activeBanner.image_url || activeBanner.title}
                      alt={activeBanner.title || 'Banner'}
                      className="mobile-home__banner-media absolute inset-0 h-full w-full object-cover"
                    />
                  </button>
                  {posters.length > 1 ? (
                    <>
                      <button
                        type="button"
                        className="absolute left-2 top-1/2 z-[2] flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#111]"
                        onClick={() => handlers.handleBannerChange(activeBannerIndex - 1)}
                        aria-label="Previous banner"
                      >
                        <ChevronLeft className="size-4" />
                      </button>
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 z-[2] flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#111]"
                        onClick={() => handlers.handleBannerChange(activeBannerIndex + 1)}
                        aria-label="Next banner"
                      >
                        <ChevronRight className="size-4" />
                      </button>
                      <div className="absolute bottom-2 left-1/2 z-[2] flex -translate-x-1/2 gap-1.5">
                        {posters.map((banner, index) => (
                          <button
                            key={banner.poster_id}
                            type="button"
                            className={cn(
                              'h-1.5 rounded-full transition-all',
                              index === activeBannerIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/40',
                            )}
                            onClick={() => handlers.handleBannerChange(index)}
                            aria-label={`Banner ${index + 1}`}
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
                {contentZones.map((zone: HomeRecommendZoneSection) => (
                  <RecommendZoneSection
                    key={zone.zoneId}
                    zone={zone}
                    handlers={handlers}
                    showViewAll
                    onViewAll={handlers.handleNavigateRecommendZone}
                    className="mobile-home-zone"
                    variant="mobile-squircle"
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
                  {dailyNewArrivalProducts.map((item) => (
                    <ProductListCard
                      key={item.product_id}
                      item={item}
                      imagePropKey={`mobile-home-daily-${item.product_id}`}
                      onNavigate={handlers.handleNavigateToDetail}
                      onAddToCart={handlers.handleAddToCart}
                      onAddToWishlist={handlers.handleAddToWishlist}
                      controllerName="每日上新商品卡片"
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
            <section ref={categoryProductsRef} className="scroll-mt-4 py-4">
              <button
                type="button"
                className="mb-3 inline-flex items-center gap-1.5 text-[0.875rem] font-semibold text-[#444]"
                onClick={goHomeClear}
              >
                <ArrowLeft className="size-3.5" />
                {t('common.backToHome')}
              </button>
              <h2 className="text-[0.9375rem] font-semibold leading-tight text-[#333]">
                {currentCategoryName}
              </h2>
              <p className="mt-1 text-[0.875rem] text-[#6f6a62]">
                {isLoadingProducts
                  ? t('product.loadingShort')
                  : t('product.totalCount', { count: totalCount })}
              </p>
              <ProductListToolbar
                className="mt-3 w-full"
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
                isLoadingBrands={state.isLoadingBrandFilters}
              />
              {isLoadingProducts ? (
                <div className="mt-8 flex flex-col items-center gap-2 text-[0.875rem] text-[#7a756c]">
                  <Loader2 className="size-5 animate-spin" />
                  {t('product.loading')}
                </div>
              ) : products.length > 0 ? (
                <div className="storefront-product-grid mt-4 grid grid-cols-2 gap-2.5">
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
                      priority={index < 4}
                    />
                  ))}
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
