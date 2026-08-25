'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import EditableImg from '@/@base/EditableImg';
import { ChevronRight, ChevronLeft, ChevronRight as ChevronRightIcon, Flame, Package } from 'lucide-react';
import type { ProductCategoryState, ProductCategoryHandlers, ProductCategoryBannerItem, ProductCategoryKeywordItem } from '@/frontend/hooks/useProductCategory';
import { ProductListCard } from '@/frontend/components/ProductListCard';
import { StorefrontPagination } from '@/frontend/components/StorefrontPagination';
import { ProductListToolbar } from '@/frontend/components/ProductListToolbar';
import { ListingPageHead } from '@/frontend/components/ListingPageHead';
import { StorefrontResponsiveHeader } from '@/frontend/components/MobileStorefrontHeader';
import { useTranslation } from 'react-i18next';
import { translateCatalogLabel } from '@/frontend/i18n/catalogLabels';
interface Props {
  state: ProductCategoryState;
  handlers: ProductCategoryHandlers;
}
export const ProductCategoryView = ({
  state,
  handlers
}: Props) => {
  const { t } = useTranslation();
  const router = useRouter();
  const renderBannerHrefLabel = (banner: ProductCategoryBannerItem) =>
    banner.link_text || t('product.discoverMore');
  const renderKeywordLabel = (item: ProductCategoryKeywordItem) =>
    item.keyword_label || t('product.recommendedKeyword');
  const {
    categories,
    queryState,
    posters,
    recommendationFloors,
    activeRecommendationGroupId,
    activeBannerIndex,
    products,
    isSecondaryCategoryResults,
    totalCount,
    totalPages,
    isLoadingProducts,
    isResolvingCategoryRoute,
    routeCategorySlug,
    stockStatusLabels,
    categoryDetail
  } = state;
  const activeBanner = posters[activeBannerIndex] || null;
  const currentCategoryName = queryState.searchKeyword
    ? t('product.searchPrefix', { keyword: queryState.searchKeyword })
    : translateCatalogLabel(
        t,
        categoryDetail?.category_name ||
          categories.find((category) => category.category_id === queryState.categoryId)?.category_name ||
          categories.flatMap((category) => category.children).find((child) => child.category_id === queryState.categoryId)?.category_name ||
          (routeCategorySlug ? routeCategorySlug.replace(/-/g, ' ') : '') ||
          t('product.allProducts'),
      );
  const selectedStockStatuses = queryState.stockStatus || [];
  const handleGoToPage = (nextPage: number) => {
    handlers.handleFilterChange('page', nextPage);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const handleChangePageSize = (nextSize: number) => {
    handlers.handleFilterChange('pageSize', nextSize);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  // Prefer product listing shell as soon as we have any listing intent (incl. pending slug resolve)
  const showProductResults = Boolean(
    queryState.categoryId ||
      isResolvingCategoryRoute ||
      routeCategorySlug ||
      queryState.searchKeyword ||
      queryState.keywordId ||
      queryState.keywordGroupId ||
      queryState.brandCategoryId ||
      queryState.minPrice !== undefined ||
      queryState.maxPrice !== undefined ||
      queryState.hasDiscount ||
      queryState.minRating !== undefined ||
      queryState.stockStatus.length > 0,
  );
  const hasBrowseChrome = Boolean(activeBanner) || recommendationFloors.length > 0;
  return <main className="min-h-screen max-w-full overflow-x-hidden bg-[#FFF5F5] text-[#111111]" data-controller-name="分类页整体布局" data-api-unique-id='productcategoryview-r3cbcd43ae04fc8af-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
      <StorefrontResponsiveHeader isHome={false} />

      {!showProductResults ? hasBrowseChrome ? <section className="storefront-container py-6" data-controller-name="首页分类浏览与横幅联动区" data-api-unique-id='productcategoryview-r220efc53b28f746c-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
        {activeBanner ? <div className="flex w-full flex-col items-stretch rounded-[36px] bg-[#f5f4ef] p-3 shadow-[0_24px_60px_-48px_rgba(0,0,0,0.34)] sm:p-4 lg:p-5" data-api-unique-id='productcategoryview-home-hero-row-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
          <div className="flex min-h-0 min-w-0 flex-1 self-stretch" data-controller-name="首页横幅轮播区" data-api-unique-id='productcategoryview-r549ced684abd2c7f-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
            <div className="relative flex h-full min-h-[360px] w-full flex-1 overflow-hidden rounded-[32px] bg-[#111111] sm:min-h-[460px] lg:min-h-[520px]" data-api-unique-id='productcategoryview-rc2738a2bb48f760c-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
                <button type="button" className="group relative block h-full min-h-[360px] w-full overflow-hidden bg-[#111111] sm:min-h-[460px] lg:min-h-[520px]" onClick={() => handlers.handleBannerClick(activeBanner)} data-api-unique-id='productcategoryview-re6b0d609650b4efa-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
                  <EditableImg propKey={`category-poster-${activeBanner.poster_id}`} keywords={activeBanner.image_url || activeBanner.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" data-api-unique-id='productcategoryview-r1ba76f4aa78e3c09-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' />
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,17,17,0.72),rgba(17,17,17,0.18))]" data-api-unique-id='productcategoryview-rbe6fb0b11d49a793-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' />
                  <div className="absolute inset-y-0 left-0 flex w-[90%] max-w-full flex-col items-start justify-center gap-3 px-5 text-left text-white sm:w-[72%] sm:gap-4 sm:px-8 lg:w-[58%] lg:px-12" data-api-unique-id='productcategoryview-r1b6c214c2ea2def3-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
                    <span className="rounded-full border border-white/25 bg-white/12 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] backdrop-blur-sm" data-api-unique-id='productcategoryview-r8682873e13f0c4f5-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
                      Latest Drop
                    </span>
                    <div className="space-y-3" data-api-unique-id='productcategoryview-rd3957ec65d74f9da-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
                      <h3 className="text-[clamp(24px,3.8vw,48px)] font-black uppercase tracking-[0.14em] leading-tight" data-api-unique-id='productcategoryview-r7b94cb5c7c504400-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>{activeBanner.title}</h3>
                      {activeBanner.subtitle ? <p className="max-w-[520px] text-sm leading-6 text-white/85 sm:text-base" data-api-unique-id='productcategoryview-r38fc5603036e60ad-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>{activeBanner.subtitle}</p> : null}
                    </div>
                    <div className="inline-flex items-center rounded-full bg-white px-5 py-2 text-sm font-semibold tracking-[0.08em] text-[#111111] shadow-[0_10px_30px_-20px_rgba(0,0,0,0.55)]" data-api-unique-id='productcategoryview-re2528365f60b9c7b-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
                      {renderBannerHrefLabel(activeBanner)}
                    </div>
                  </div>
                </button>

                <button type="button" className="absolute left-3 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/88 text-[#111111] shadow-[0_12px_30px_-20px_rgba(0,0,0,0.45)] transition hover:bg-white sm:left-4 sm:size-11" onClick={() => handlers.handleBannerChange(activeBannerIndex - 1)} aria-label="Previous banner" data-api-unique-id='productcategoryview-r54014f18580d9e9e-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
                  <ChevronLeft className="size-5" data-api-unique-id='productcategoryview-r671215b03c0e2786-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' />
                </button>
                <button type="button" className="absolute right-3 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/88 text-[#111111] shadow-[0_12px_30px_-20px_rgba(0,0,0,0.45)] transition hover:bg-white sm:right-4 sm:size-11" onClick={() => handlers.handleBannerChange(activeBannerIndex + 1)} aria-label="Next banner" data-api-unique-id='productcategoryview-r91b5d7ac78d33ec2-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
                  <ChevronRightIcon className="size-5" data-api-unique-id='productcategoryview-ra16ed3630867bbde-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' />
                </button>

                <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2" data-api-unique-id='productcategoryview-rf853f0b93917954f-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
                  {posters.map((banner, index) => <button key={banner.poster_id} type="button" className={`h-2.5 rounded-full transition-all ${index === activeBannerIndex ? 'w-8 bg-white' : 'w-2.5 bg-white/35 hover:bg-white/60'}`} onClick={() => handlers.handleBannerChange(index)} aria-label={`Go to banner ${index + 1}`} data-api-unique-id='productcategoryview-ra28ec7f140a8a8b7-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1' />)}
                </div>
              </div>
          </div>
        </div> : null}

        <section className={`w-full space-y-5 ${activeBanner ? 'mt-6' : ''}`} data-controller-name="推荐关键词楼层区" data-api-unique-id='productcategoryview-rbbc35a071596ce95-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
          {recommendationFloors.length > 0 ? recommendationFloors.map((floor, index) => {
            const isFloorActive = activeRecommendationGroupId === floor.group_id;
            return <div key={floor.group_id} className={`rounded-[40px] bg-white p-4 shadow-[0_18px_55px_-42px_rgba(0,0,0,0.4)] sm:p-6 ${isFloorActive ? 'ring-2 ring-[#111111]/15' : ''}`} data-controller-name="推荐关键词楼层卡片" data-api-unique-id='productcategoryview-rd0eef43ba619624f-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>
                <div className="mb-5 flex flex-wrap items-start justify-between gap-4" data-api-unique-id='productcategoryview-r696b67c61e8efd65-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>
                  <div className="flex items-center gap-3" data-api-unique-id='productcategoryview-rcebcc0af56842b28-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>
                    <div className="flex size-11 items-center justify-center rounded-full bg-[#111111] text-white" data-api-unique-id='productcategoryview-rb1cf11fbb77fe23e-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>
                      <Flame className="size-5" data-api-unique-id='productcategoryview-r73d2f571564b8291-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1' />
                    </div>
                    <div data-api-unique-id='productcategoryview-rcb29103897389b8d-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b8477]" data-api-unique-id='productcategoryview-r77d4cca2a4ad9673-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>Floor {index + 1}</p>
                      <h2 className="mt-1 text-[26px] font-semibold tracking-[0.12em] text-[#111111]" data-api-unique-id='productcategoryview-rbff8c23634d2e45a-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1' data-api-bind-info={`recommendationFloors-${index}-group_name`} data-api-map-var-name='floor'>{floor.group_name}</h2>
                      <p className="mt-1 text-sm text-[#6f6a62]" data-api-unique-id='productcategoryview-raf84ac0e74ca05c7-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>Click a floor title to see products in this group. Keywords still open the usual category filters.</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2" data-api-unique-id='productcategoryview-r400196e86aab0698-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>
                    <div className="rounded-full border border-[#e6e0d5] bg-[#faf8f3] px-4 py-2 text-sm font-medium text-[#5f5a52]" data-api-unique-id='productcategoryview-r623db2de2905aa3b-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1' data-api-bind-info={`recommendationFloors-${index}-keywords.length`} data-api-map-var-name='floor'>
                      {floor.keywords.length} keywords
                    </div>
                    <Button type="button" variant="outline" className={`rounded-full border-[#d8d4ca] bg-white px-4 py-2 text-sm font-medium ${isFloorActive ? 'border-[#111111] bg-[#111111] text-white hover:bg-[#111111]' : 'text-[#111111] hover:bg-[#f3f1eb]'}`} onClick={() => handlers.handleSelectRecommendationGroup(floor.group_id)} data-api-unique-id='productcategoryview-r2d4422e01806f1fc-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>
                      {isFloorActive ? 'Viewing all results' : 'View this group'}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" data-api-unique-id='productcategoryview-r7be088fcd62fc104-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>
                  {floor.keywords.map((item) => <button key={item.keyword_id} type="button" className="group flex min-h-[88px] flex-col items-start justify-between rounded-[28px] border border-[#ece7dc] bg-[#faf8f3] px-5 py-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#111111] hover:bg-white" onClick={() => handlers.handleSelectKeyword(item)} data-api-unique-id='productcategoryview-r372953bfdff54fba-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>
                      <span className="text-base font-semibold text-[#111111] transition-colors group-hover:text-black" data-api-unique-id='productcategoryview-re2ac97899345ac53-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>{renderKeywordLabel(item)}</span>
                      <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium uppercase tracking-[0.14em] text-[#7a756c] group-hover:text-[#111111]" data-api-unique-id='productcategoryview-r6e89f0b3cb9ed46c-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>
                        View category
                        <ChevronRight className="size-3.5" data-api-unique-id='productcategoryview-r5116f35fa66ecde1-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1' />
                      </span>
                    </button>)}
                </div>
              </div>;
          }) : null}
        </section>
      </section> : null : <section className="storefront-container py-6" data-controller-name="商品结果内容区" data-api-unique-id='productcategoryview-r220efc53b28f746c-results-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
        <div className="min-w-0 w-full space-y-6" data-controller-name="商品结果区" data-api-unique-id='productcategoryview-r549ced684abd2c7f-results-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>

          <section className="space-y-6" data-controller-name="商品结果展示区" data-api-unique-id='productcategoryview-r81884d5ddb85b4ab-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
              <div className="rounded-[36px] bg-white px-5 py-5 shadow-[0_18px_55px_-42px_rgba(0,0,0,0.4)] sm:px-6 lg:px-8" data-api-unique-id='productcategoryview-r8d0e44f2c72aff49-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
                <div className="category-listing-head flex flex-col gap-2 border-b border-[#ece7dc] pb-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:pb-5" data-api-unique-id='productcategoryview-r54d4d55ec42aabc8-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
                  <div className="min-w-0 w-full shrink" data-api-unique-id='productcategoryview-ra6f6136bd984af62-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
                    <ListingPageHead
                      title={currentCategoryName}
                      countText={
                        isLoadingProducts && products.length === 0
                          ? t('product.loading')
                          : `(${t('product.totalCount', { count: totalCount })})`
                      }
                      backLabel={t('common.backToHome')}
                      onBack={(event) => {
                        event.preventDefault()
                        handlers.handleClearAllFilters()
                        router.push('/')
                      }}
                    />
                    {selectedStockStatuses.length > 0 ? <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-[#6f6a62]" data-api-unique-id='productcategoryview-r6414cea585b640ff-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
                      <span className="rounded-full border border-[#e6e0d5] bg-[#faf8f3] px-4 py-2" data-api-unique-id='productcategoryview-r4c9c835c0e945511-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>{selectedStockStatuses.map((status) => stockStatusLabels[status]).join(' · ')}</span>
                    </div> : null}
                  </div>

                  <ProductListToolbar
                    className="w-full min-w-0 shrink-0 sm:w-auto sm:justify-end"
                    minPrice={queryState.minPrice}
                    maxPrice={queryState.maxPrice}
                    sortBy={queryState.sortBy}
                    onPriceRangeChange={handlers.handlePriceRangeChange}
                    onSortChange={handlers.handleSortChange}
                    brandOptions={
                      state.availableBrandFilters.length > 0
                        ? state.availableBrandFilters
                        : state.visibleBrandOptions
                    }
                    selectedBrandId={queryState.brandCategoryId}
                    onBrandToggle={handlers.handleBrandQuickFilterToggle}
                    isBrandExpanded={state.isBrandExpanded}
                    onBrandExpandToggle={handlers.handleToggleBrandExpand}
                    isLoadingBrands={
                      state.isLoadingBrandFilters &&
                      state.availableBrandFilters.length === 0 &&
                      state.visibleBrandOptions.length === 0
                    }
                  />
                </div>

                {isLoadingProducts && products.length === 0 ? <div className="storefront-product-grid mt-6 grid grid-cols-2 gap-2.5 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5" data-api-unique-id='productcategoryview-skeleton-grid' data-api-unique-page-name='src/frontend/components/ProductCategoryView' aria-busy="true" aria-label={t('product.loading')}>
                    {Array.from({ length: 10 }).map((_, index) => (
                      <div key={`product-skeleton-${index}`} className="animate-pulse space-y-3">
                        <div className="aspect-[3/4] min-h-[160px] rounded-[24px] bg-[#ebe7de]" />
                        <div className="h-3 w-3/4 rounded-full bg-[#ebe7de]" />
                        <div className="h-3 w-1/2 rounded-full bg-[#ebe7de]" />
                      </div>
                    ))}
                  </div> : products.length > 0 ? <div className={`storefront-product-grid mt-6 grid grid-cols-2 gap-2.5 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5 ${isLoadingProducts ? 'opacity-60 transition-opacity' : ''}`} data-api-unique-id='productcategoryview-r14d0c19cf3b6eaf2-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
                    {products.map((item, index) => <ProductListCard key={item.product_id} item={item} imagePropKey={`category-product-${item.product_id}`} onNavigate={handlers.handleNavigateToDetail} onAddToCart={handlers.handleAddToCart} onAddToWishlist={handlers.handleAddToWishlist} controllerName={isSecondaryCategoryResults ? '二级类目商品图片名称卡片' : '分类商品信息卡片'} priority={index < 4} />)}
                  </div> : <div className="mt-6 rounded-[28px] border border-dashed border-[#ddd6c8] bg-[#faf8f3] px-6 py-14 text-center" data-api-unique-id='productcategoryview-rf8e519298f81db85-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
                    <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#ebe7de] text-[#111111]" data-api-unique-id='productcategoryview-re1ac063fbce010dd-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
                      <Package className="size-6" data-api-unique-id='productcategoryview-r6345d54118218303-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-[#111111]" data-api-unique-id='productcategoryview-rfe3d71fe117bd8be-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>{queryState.searchKeyword ? t('product.emptySearchTitle') : t('product.emptyCategoryTitle')}</h3>
                    <p className="mt-2 text-sm text-[#7a756c]" data-api-unique-id='productcategoryview-rf2517b47779e392b-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>{queryState.searchKeyword ? t('product.emptySearchHint', { keyword: queryState.searchKeyword }) : t('product.emptyCategoryFilterHint')}</p>
                  </div>}
                {products.length > 0 && totalPages > 1 ? <StorefrontPagination page={queryState.page} pageSize={queryState.pageSize} total={totalCount} totalPages={totalPages} onPageChange={handleGoToPage} /> : null}
              </div>
            </section>
        </div>
      </section>}
    </main>;
};
export default ProductCategoryView;
