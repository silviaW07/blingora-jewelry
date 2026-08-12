'use client';

/**
 * Legacy homepage composition (ProductCategoryView + recommend modules).
 * Active homepage UI is `HomeStorefrontView` — keep this file for rollback / reference only.
 */
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import EditableImg from '@/@base/EditableImg';
import { Package, ShoppingCart, Star, Globe2, ShieldCheck, Headphones, Gift } from 'lucide-react';
import { WishlistHeartButton } from '@/frontend/components/WishlistHeartButton';
import { ProductCategoryView } from '@/frontend/components/ProductCategoryView';
import type { HomeHandlers, HomeState } from '@/frontend/hooks/useHome';
import type {
  HomeRecommendCategoryCard,
  HomeRecommendProductCard,
  HomeRecommendZoneSection
} from '@/frontend/actions/Home';
import { limitRecommendZoneItems } from '@/frontend/utils/recommendZoneDisplay';

interface Props {
  state: HomeState;
  handlers: HomeHandlers;
}

type RecommendProductCard = HomeRecommendProductCard;
type RecommendCategoryCard = HomeRecommendCategoryCard;

const serviceBenefitItems = [{
  title: 'Worldwide Delivery',
  description: 'Fast global shipping from curated suppliers to your doorstep.',
  icon: Globe2
}, {
  title: 'Secure Payment',
  description: 'Protected checkout with verified payment handling and order coverage.',
  icon: ShieldCheck
}, {
  title: '24/7 Support',
  description: 'Always-on assistance for product questions, orders, and after-sales help.',
  icon: Headphones
}, {
  title: 'Member Rewards',
  description: 'Create an account to unlock coupons, saved carts, and faster reorders.',
  icon: Gift
}] as const;

const isDefaultHomeQueryState = (state: HomeState) => {
  const queryState = state.queryState;
  return !(queryState.categoryId || queryState.searchKeyword || queryState.keywordId || queryState.keywordGroupId || queryState.brandCategoryId || queryState.minPrice !== undefined || queryState.maxPrice !== undefined || queryState.hasDiscount || queryState.minRating !== undefined || queryState.stockStatus.length > 0);
};

const formatPrice = (price?: number | null) => {
  if (typeof price !== 'number' || Number.isNaN(price)) {
    return 'US$ --';
  }
  return `US$ ${price.toFixed(2)}`;
};

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
  const safeRating = typeof rating === 'number' && !Number.isNaN(rating) ? Math.max(0, Math.min(5, rating)) : 0;
  const fullStars = Math.round(safeRating);
  return Array.from({
    length: 5
  }, (_, index) => <Star key={`star-${index}`} className={`size-3.5 ${index < fullStars ? 'fill-[#f4a261] text-[#f4a261]' : 'text-[#d5cec1]'}`} data-api-unique-id='homeview-rstar-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView' />);
};

const getZoneGridClassName = (zone: HomeRecommendZoneSection) => cn('grid gap-4', zone.mobileCols === 1 ? 'grid-cols-1' : 'grid-cols-2', zone.pcCols === 3 ? 'md:grid-cols-3' : zone.pcCols === 5 ? 'md:grid-cols-3 xl:grid-cols-5' : 'md:grid-cols-3 xl:grid-cols-4');

const renderRecommendZoneContent = (zone: HomeRecommendZoneSection, _state: HomeState, handlers: HomeHandlers) => {
  const limitedItems = limitRecommendZoneItems(zone, zone.items);
  const productItems = limitedItems.filter((item): item is RecommendProductCard => item.entityType === 'PRODUCT');
  const categoryItems = limitedItems.filter((item): item is RecommendCategoryCard => item.entityType === 'CATEGORY');

  if (productItems.length === 0 && categoryItems.length === 0) {
    return <div className="rounded-[28px] border border-dashed border-[#ddd6c8] bg-white px-6 py-10 text-center text-sm text-[#8a8073]" data-api-unique-id='homeview-rzone-empty-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView'>
        当前专区暂无可展示内容
      </div>;
  }

  return <div className="space-y-6" data-api-unique-id='homeview-rzone-content-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView'>
      {productItems.length > 0 ? <div className={getZoneGridClassName(zone)} data-controller-name="首页推荐专区商品网格" data-api-unique-id='homeview-rzone-product-grid-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView'>
          {productItems.map((item, index) => {
            const isDraft = item.status === 'DRAFT'
            return (
            <article key={item.itemId} className="group overflow-hidden rounded-[32px] border border-[#ece7dc] bg-white p-4 shadow-[0_18px_42px_-30px_rgba(17,17,17,0.28)] transition hover:-translate-y-0.5 hover:border-[#111111]" data-controller-name="首页推荐专区商品卡片" data-api-unique-id='homeview-rzone-product-card-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView' data-api-in-loop='1'>
              <button type="button" className="block w-full overflow-hidden rounded-[24px] bg-[#f7f4ee] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111]/20" onClick={() => handlers.handleNavigateRecommendProduct(item.productId)} data-api-unique-id='homeview-rzone-product-image-btn-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView' data-api-in-loop='1'>
                <EditableImg propKey={`home-recommend-product-${item.productId}`} keywords={item.imageUrl || item.productName} className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-[1.03]" data-api-unique-id='homeview-rzone-product-image-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView' data-api-in-loop='1' />
              </button>
              <div className="mt-5 space-y-4" data-api-unique-id='homeview-rzone-product-body-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView' data-api-in-loop='1'>
                <button type="button" className="line-clamp-2 text-left text-lg font-semibold leading-7 text-[#111111] transition-colors hover:text-[#5f4b32] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111]/20" onClick={() => handlers.handleNavigateRecommendProduct(item.productId)} data-api-unique-id='homeview-rzone-product-name-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView' data-api-in-loop='1' data-api-bind-info={`productItems-${index}-productName`} data-api-map-var-name='item'>
                  {item.productName}
                </button>
                {!isDraft ? (
                  <div className="flex items-center gap-3 text-sm text-[#7a756c]" data-api-unique-id='homeview-rzone-product-rating-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView' data-api-in-loop='1'>
                    <div className="flex items-center gap-1" data-api-unique-id='homeview-rzone-product-stars-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView' data-api-in-loop='1'>{renderRatingStars(item.ratingAverage)}</div>
                    <span data-api-unique-id='homeview-rzone-product-score-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView' data-api-in-loop='1'>{item.ratingAverage.toFixed(1)} / 5</span>
                    <span data-api-unique-id='homeview-rzone-product-count-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView' data-api-in-loop='1'>({item.ratingCount})</span>
                  </div>
                ) : null}
                <div className="flex items-end justify-between gap-3" data-api-unique-id='homeview-rzone-product-price-row-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView' data-api-in-loop='1'>
                  {isDraft ? (
                    <div className="min-h-[40px] flex-1" aria-hidden="true" />
                  ) : (
                    <div data-api-unique-id='homeview-rzone-product-price-wrap-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView' data-api-in-loop='1'>
                      <p className="text-2xl font-bold text-[#111111]" data-api-unique-id='homeview-rzone-product-price-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView' data-api-in-loop='1'>
                        {formatPriceRange(item.priceMin, item.priceMax)}
                      </p>
                      {item.originalPrice ? <p className="mt-1 text-sm text-[#8b8477] line-through" data-api-unique-id='homeview-rzone-product-original-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView' data-api-in-loop='1'>{formatPrice(item.originalPrice)}</p> : null}
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
                    <Button type="button" className="rounded-full bg-[#111111] px-4 py-2 text-sm font-semibold text-white hover:bg-[#262626]" onClick={() => handlers.handleAddRecommendProductToCart(item)} data-api-unique-id='homeview-rzone-product-cart-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView' data-api-in-loop='1'>
                      <ShoppingCart className="mr-2 size-4" data-api-unique-id='homeview-rzone-product-cart-icon-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView' data-api-in-loop='1' />
                      加入购物车
                    </Button>
                  )}
                </div>
              </div>
            </article>
            )
          })}
        </div> : null}

      {categoryItems.length > 0 ? (
        <div className={getZoneGridClassName(zone)} data-controller-name="首页推荐专区类目卡片网格" data-api-unique-id='homeview-rzone-category-grid-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView'>
          {categoryItems.map((item) => {
            const imageSrc = String(item.imageUrl || '').trim() || '/category-covers/placeholder.svg'
            const shelfFallback = String(item.fallbackImageUrl || '').trim()
            const hasRealShelf = Boolean(shelfFallback && shelfFallback !== imageSrc && shelfFallback !== '/category-covers/placeholder.svg')
            return (
              <button
                key={item.itemId}
                type="button"
                className="group flex flex-col overflow-hidden rounded-[24px] border border-[#ece7dc] bg-white text-left shadow-[0_12px_28px_-24px_rgba(17,17,17,0.28)] transition hover:-translate-y-0.5 hover:border-[#111111]"
                onClick={() => handlers.handleNavigateRecommendCategory(item.categoryId, item.categorySlug)}
              >
                <div className="relative aspect-square w-full overflow-hidden bg-[#e8e4dc]">
                  <EditableImg
                    propKey={`home-recommend-category-${item.categoryId}`}
                    src={imageSrc}
                    keywords={undefined}
                    disableKeywordSearch
                    fallbackSrc={hasRealShelf ? shelfFallback : '/category-covers/placeholder.svg'}
                    slowFallbackMs={hasRealShelf ? 1200 : 0}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="px-3 py-3">
                  <span className="truncate text-base font-semibold text-[#111111]">{item.categoryName}</span>
                </div>
              </button>
            )
          })}
        </div>
      ) : null}
    </div>;
};

const HomeView = ({
  state,
  handlers
}: Props) => {
  const {
    recommendZones,
    isLoadingRecommendZones
  } = state;
  const isDefaultHomeState = isDefaultHomeQueryState(state);
  const contentZones = recommendZones.filter(zone => zone.zoneType !== 'SIDE_NAV');
  const linkedProductZoneId = contentZones.find(zone => zone.items.some(item => item.entityType === 'PRODUCT'))?.zoneId;
  const linkedProductZones = linkedProductZoneId ? contentZones.filter(zone => zone.zoneId === linkedProductZoneId && zone.items.length > 0) : [];
  const staticContentZones = linkedProductZoneId ? contentZones.filter(zone => zone.zoneId !== linkedProductZoneId) : contentZones;
  return <>
      <ProductCategoryView state={state} handlers={handlers} data-api-unique-id='homeview-rcf81425b173c8376-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView' />

      {isDefaultHomeState ? <section className="storefront-container pt-6" data-controller-name="首页服务权益条模块" data-api-unique-id='homeview-r12b51d77be7038c3-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView'>
          <div className="mx-auto grid w-full gap-4 md:grid-cols-2 xl:grid-cols-4" data-api-unique-id='homeview-r989ff82ab392c508-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView'>
            {serviceBenefitItems.map((item, index) => <article key={item.title} className="flex h-full gap-4 rounded-[28px] border border-[#e8e2d8] bg-white/95 px-5 py-5 shadow-[0_18px_42px_-36px_rgba(0,0,0,0.32)]" data-controller-name="首页服务权益卡片" data-api-unique-id='homeview-r2a70f7e5f7241036-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView' data-api-in-loop='1'>
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#f4efe8] text-[#3d342c]" data-api-unique-id='homeview-r3e987314d219e895-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView' data-api-in-loop='1'>
                  <item.icon className="size-5" data-api-bind-info={`serviceBenefitItems-${index}-icon`} data-api-map-var-name='item' data-api-unique-id='homeview-r867cb82a1ff0359d-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView' data-api-in-loop='1' />
                </div>
                <div className="min-w-0 space-y-1.5" data-api-unique-id='homeview-r37851487c9274698-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView' data-api-in-loop='1'>
                  <h2 className="text-base font-semibold text-[#40372f]" data-api-unique-id='homeview-re007a33024939a5a-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView' data-api-in-loop='1' data-api-bind-info={`serviceBenefitItems-${index}-title`} data-api-map-var-name='item'>{item.title}</h2>
                  <p className="text-sm leading-6 text-[#7d7366]" data-api-unique-id='homeview-r889be422c7221340-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView' data-api-in-loop='1' data-api-bind-info={`serviceBenefitItems-${index}-description`} data-api-map-var-name='item'>{item.description}</p>
                </div>
              </article>)}
          </div>
        </section> : null}

      {isDefaultHomeState ? <section className="storefront-container pb-12" data-controller-name="首页推荐专区模块" data-api-unique-id='homeview-rc4afff86ef1b1c41-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView'>
          <div className="space-y-6" data-api-unique-id='homeview-r3f14577a464b34c8-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView'>
            {isLoadingRecommendZones ? <div className="rounded-[32px] border border-[#e7e2d8] bg-white px-6 py-10 text-center text-sm text-[#7a756c] shadow-[0_18px_45px_-36px_rgba(0,0,0,0.28)]" data-api-unique-id='homeview-r343871ae93123199-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView'>
                推荐专区加载中...
              </div> : <div className="space-y-6" data-api-unique-id='homeview-rea2a9c80bfb7662e-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView'>
                  {linkedProductZones.map((zone, index) => <section key={zone.zoneId} className="rounded-[34px] border border-[#e8e2d8] bg-[#fbfaf7] p-4 shadow-[0_18px_48px_-40px_rgba(0,0,0,0.35)] sm:p-6" data-controller-name="首页推荐专区分组" data-api-unique-id='homeview-r062a383f61b9e3fb-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView' data-api-in-loop='1'>
                      <div className="mb-5 flex items-center gap-4" data-api-unique-id='homeview-rdf9b5e50b8fcdd31-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView' data-api-in-loop='1'>
                        <div className="shrink-0 text-[30px] font-semibold leading-none text-[#4d4338]" data-api-unique-id='homeview-rb39ce600fd34c450-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView' data-api-in-loop='1'>{String(index + 1).padStart(2, '0')}</div>
                        <div className="flex flex-1 items-center gap-4" data-api-unique-id='homeview-r5017ea6889640355-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView' data-api-in-loop='1'>
                          <h2 className="text-[28px] font-semibold tracking-[0.02em] text-[#4a4137]" data-api-unique-id='homeview-r485e66810322487a-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView' data-api-in-loop='1' data-api-bind-info={`linkedProductZones-${index}-title`} data-api-map-var-name='zone'>{zone.title}</h2>
                          <div className="h-px flex-1 bg-[#d8d1c7]" data-api-unique-id='homeview-r753c2f5569ade3fd-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView' data-api-in-loop='1' />
                        </div>
                      </div>

                      {renderRecommendZoneContent(zone, state, handlers)}
                    </section>)}
                  {staticContentZones.map((zone, index) => <section key={zone.zoneId} className="rounded-[34px] border border-[#e8e2d8] bg-[#fbfaf7] p-4 shadow-[0_18px_48px_-40px_rgba(0,0,0,0.35)] sm:p-6" data-controller-name="首页推荐专区分组" data-api-unique-id='homeview-r0a72786a8464b631-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView' data-api-in-loop='1'>
                      <div className="mb-5 flex items-center gap-4" data-api-unique-id='homeview-rf761a4f1f410fb2c-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView' data-api-in-loop='1'>
                        <div className="shrink-0 text-[30px] font-semibold leading-none text-[#4d4338]" data-api-unique-id='homeview-rcbf17fc5dc648be0-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView' data-api-in-loop='1'>{String(linkedProductZones.length + index + 1).padStart(2, '0')}</div>
                        <div className="flex flex-1 items-center gap-4" data-api-unique-id='homeview-re4bc4708f2449922-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView' data-api-in-loop='1'>
                          <h2 className="text-[28px] font-semibold tracking-[0.02em] text-[#4a4137]" data-api-unique-id='homeview-ra55b6ac8042d209b-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView' data-api-in-loop='1' data-api-bind-info={`staticContentZones-${index}-title`} data-api-map-var-name='zone'>{zone.title}</h2>
                          <div className="h-px flex-1 bg-[#d8d1c7]" data-api-unique-id='homeview-r289a75dc9d201c0e-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView' data-api-in-loop='1' />
                        </div>
                      </div>

                      {renderRecommendZoneContent(zone, state, handlers)}
                    </section>)}
                </div>}

            {!isLoadingRecommendZones && recommendZones.length === 0 ? <div className="rounded-[32px] border border-dashed border-[#ddd6c8] bg-white px-6 py-12 text-center" data-controller-name="首页推荐专区空状态" data-api-unique-id='homeview-r193001c939216228-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView'>
                <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#f0ebe2] text-[#4a4137]" data-api-unique-id='homeview-rb711b431f2c337cd-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView'>
                  <Package className="size-6" data-api-unique-id='homeview-rd8437f3d6456a1d4-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView' />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[#40372f]" data-api-unique-id='homeview-r626fe27c79ece115-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView'>当前暂无可展示专区</h3>
                <p className="mt-2 text-sm text-[#8a8073]" data-api-unique-id='homeview-ra0449977115cbf1e-s1535147481' data-api-unique-page-name='src/frontend/components/HomeView'>后台启用并配置商品或类目后，这里会自动展示在首页横幅下方。</p>
              </div> : null}
          </div>
        </section> : null}
    </>;
};

export default HomeView;
