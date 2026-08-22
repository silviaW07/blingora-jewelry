'use client';

/**
 * Homepage storefront: shared .storefront-container (max 1440px) + 280px brand rail,
 * filled with the original homepage module content (header, category+banner, services, 01/02 zones).
 * Footer remains in the frontend layout.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import EditableImg from '@/@base/EditableImg';
import {
  Camera,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Globe,
  Menu,
  Loader2,
  LogIn,
  Package,
  Search,
  ShieldCheck,
  ShoppingCart,
  Star,
} from 'lucide-react';
import { useUserSession } from '@/tools/FrontendSession';
import type { HomeHandlers, HomeState } from '@/frontend/hooks/useHome';
import type {
  HomeRecommendCategoryCard,
  HomeRecommendProductCard,
  HomeRecommendSideNavItem,
  HomeRecommendZoneSection,
} from '@/frontend/actions/Home';
import { DecorateText } from '@/frontend/decorate/DecorateText';
import { DecorateFrame } from '@/frontend/decorate/DecorateFrame';
import { StorefrontBrandMark } from '@/frontend/components/StorefrontBrandMark';
import { useDecorateMode } from '@/frontend/decorate/DecorateContext';
import { CustomerAccountMenu } from '@/frontend/components/CustomerAccountMenu';
import { StorefrontBrandNavList } from '@/frontend/components/StorefrontBrandNavList';
import { StorefrontFloatingSideNav } from '@/frontend/components/StorefrontFloatingSideNav';
import { isDailyNewArrivalCategoryName } from '@/frontend/utils/dailyNewArrival';
import { pickBrandSideNavZone } from '@/frontend/utils/brandSideNav';
import { isStorefrontHomeContentZone } from '@/frontend/utils/recommendZoneDisplay';
import { ProductListCard } from '@/frontend/components/ProductListCard';
import { ProductListToolbar } from '@/frontend/components/ProductListToolbar';
import { ListingPageHead } from '@/frontend/components/ListingPageHead';
import { HomeRecommendZoneSection } from '@/frontend/components/HomeRecommendZoneSection';
import { MobileHomeStorefrontView } from '@/frontend/components/MobileHomeStorefrontView';
import { WishlistHeartButton } from '@/frontend/components/WishlistHeartButton';
import { StorePrice } from '@/frontend/components/GuestPricePlaceholder';
import { HomeServiceBenefitGrid } from '@/frontend/components/HomeServiceBenefitGrid';
import { syncNarrowHtmlClass } from '@/frontend/utils/isNarrowViewport';
import { useChromeActivate } from '@/frontend/utils/hardNavigate';
import { useTranslation } from 'react-i18next';
import { APP_LOCALES, getLocaleLabel, normalizeLocale } from '@/frontend/i18n';
import { useSwitchAppLocale } from '@/frontend/i18n/I18nProvider';
import { translateCatalogLabel } from '@/frontend/i18n/catalogLabels';
interface Props {
  state: HomeState;
  handlers: HomeHandlers;
}

type RecommendProductCard = HomeRecommendProductCard;
type RecommendCategoryCard = HomeRecommendCategoryCard;

const isDefaultHomeQueryState = (state: HomeState) => {
  // 每日上新 / New：进入时间窗商品结果态（整段 6 个月或已选月份）
  if (state.isDailyNewArrivalMode || state.selectedDailyNewArrivalMonthKey) {
    return false;
  }

  const queryState = state.queryState;
  const categoryId = queryState.categoryId;

  return !(
    categoryId ||
    queryState.searchKeyword ||
    queryState.keywordId ||
    queryState.keywordGroupId ||
    queryState.brandCategoryId ||
    queryState.minPrice !== undefined ||
    queryState.maxPrice !== undefined ||
    queryState.hasDiscount ||
    queryState.minRating !== undefined ||
    queryState.stockStatus.length > 0
  );
};

const formatPrice = (price?: number | null) => {
  if (typeof price !== 'number' || Number.isNaN(price)) return 'US$ --';
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
  return Array.from({ length: 5 }, (_, index) => (
    <Star
      key={`star-${index}`}
      className={`size-3.5 ${index < fullStars ? 'fill-[#f4a261] text-[#f4a261]' : 'text-[#d5cec1]'}`}
    />
  ));
};

const getZoneGridClassName = (zone: HomeRecommendZoneSection) =>
  cn(
    'grid gap-4',
    zone.mobileCols === 1 ? 'grid-cols-1' : 'grid-cols-2',
    zone.pcCols === 3 ? 'md:grid-cols-3' : zone.pcCols === 5 ? 'md:grid-cols-3 xl:grid-cols-5' : 'md:grid-cols-3 xl:grid-cols-4',
  );

// 类目专区：类目卡片网格
const getCategoryCardGridClassName = (zone: HomeRecommendZoneSection) =>
  cn(
    'grid gap-4',
    'grid-cols-2',
    zone.pcCols === 3 ? 'md:grid-cols-3' : zone.pcCols === 5 ? 'md:grid-cols-4 xl:grid-cols-5' : 'md:grid-cols-4',
  );

const CATEGORY_CARD_PLACEHOLDER = '/category-covers/placeholder.svg';
const CATEGORY_PRODUCT_IMAGE_SLOW_MS = 1200;

const resolveCategoryCardSrc = (imageUrl?: string | null) => {
  const text = String(imageUrl || '').trim();
  return text || CATEGORY_CARD_PLACEHOLDER;
};

const resolveCategoryCardFallback = (item: RecommendCategoryCard) => {
  const fallback = String(item.fallbackImageUrl || '').trim();
  const primary = String(item.imageUrl || '').trim();
  if (
    fallback &&
    fallback !== primary &&
    fallback !== CATEGORY_CARD_PLACEHOLDER
  ) {
    return fallback;
  }
  return '';
};

import { limitRecommendZoneItems } from '@/frontend/utils/recommendZoneDisplay'

type DesktopRecommendZoneProductCardProps = {
  item: HomeRecommendProductCard
  index: number
  handlers: HomeHandlers
  showOptions: boolean
  selectedSkuId: string
  selectedOption: HomeRecommendProductCard['skuOptions'][number] | null
}

const DesktopRecommendZoneProductCard = ({
  item,
  index,
  handlers,
  showOptions,
  selectedSkuId,
  selectedOption,
}: DesktopRecommendZoneProductCardProps) => {
  const { t } = useTranslation()
  const isDraft = item.status === 'DRAFT'
  const [currentSkuId, setCurrentSkuId] = useState<string>(selectedSkuId)

  const currentOption =
    item.skuOptions?.find((opt) => opt.skuId === currentSkuId) || selectedOption

  const priceToShow = currentOption?.price ?? item.priceMin ?? item.price
  const originalPriceToShow = currentOption?.originalPrice ?? item.originalPrice
  const addToCartEvents = useChromeActivate(() => {
    if (showOptions && currentSkuId) {
      void handlers.handleAddRecommendProductSkuToCart(item, currentSkuId)
      return
    }
    void handlers.handleAddRecommendProductToCart(item)
  })

  return (
    <article
      className="group overflow-hidden rounded-[32px] border border-[#ece7dc] bg-white p-4 shadow-[0_18px_42px_-30px_rgba(17,17,17,0.28)] transition hover:-translate-y-0.5 hover:border-[#111111]"
      data-controller-name="首页推荐专区商品卡片"
      key={item.itemId}
    >
      {isDraft ? (
        <div className="relative block w-full overflow-hidden rounded-[24px] bg-[#f7f4ee]">
          <EditableImg
            propKey={`home-recommend-product-${item.productId}`}
            src={item.imageUrl || undefined}
            alt={item.productName}
            keywords={item.imageUrl || undefined}
            disableKeywordSearch
            fallbackSrc={CATEGORY_CARD_PLACEHOLDER}
            loading="lazy"
            className="aspect-[4/5] w-full object-cover"
          />
          <div className="absolute right-3 top-3 z-[3]">
            <WishlistHeartButton
              productId={item.productId}
              productName={item.productName}
              className="size-10 rounded-full bg-white/95 shadow-sm"
              size={20}
              onToggle={(favorited) => handlers.handleAddRecommendProductToWishlist(item, favorited)}
            />
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="block w-full overflow-hidden rounded-[24px] bg-[#f7f4ee] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111]/20"
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
            className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        </button>
      )}

      <div className="mt-5 space-y-4">
        {isDraft ? (
          <p className="line-clamp-2 text-left text-lg font-semibold leading-7 text-[#111111]">
            <DecorateText propKey={`home_product_name_${item.productId}`} as="span">
              {item.productName}
            </DecorateText>
          </p>
        ) : (
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
        )}

        {!isDraft ? (
          <div className="flex items-center gap-3 text-sm text-[#7a756c]">
            <div className="flex items-center gap-1">{renderRatingStars(item.ratingAverage)}</div>
            <span>{item.ratingAverage.toFixed(1)} / 5</span>
            <span>({item.ratingCount})</span>
          </div>
        ) : null}

        <div className="flex items-end justify-between gap-3">
          {isDraft ? (
            <div className="min-h-[40px] flex-1" aria-hidden="true" />
          ) : (
            <div>
              {showOptions ? (
                <div className="mb-2 flex flex-wrap gap-2">
                  {item.skuOptions.map((opt) => {
                    const active = opt.skuId === currentSkuId
                    return (
                      <button
                        key={opt.skuId}
                        type="button"
                        className={`rounded-full border px-3 py-1 text-xs transition ${
                          active
                            ? 'border-[#111111] bg-[#111111] text-white'
                            : 'border-[#ebe7de] bg-white text-[#111111] hover:border-[#111111]'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          setCurrentSkuId(opt.skuId)
                        }}
                        title={opt.label}
                      >
                        <span className="truncate max-w-[80px] block">{opt.label}</span>
                        <span className="block text-[10px] font-semibold opacity-90">
                          {typeof opt.price === 'number' ? `US$ ${opt.price.toFixed(2)}` : 'US$ --'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ) : null}

              <StorePrice className="text-2xl font-bold">
                <p className="text-2xl font-bold text-[#111111]">{formatPrice(priceToShow)}</p>
                {originalPriceToShow ? (
                  <p className="mt-1 text-sm text-[#8b8477] line-through">
                    {formatPrice(originalPriceToShow)}
                  </p>
                ) : null}
              </StorePrice>
            </div>
          )}

          {isDraft ? null : (
            <Button
              type="button"
              className="rounded-full bg-[#111111] px-4 py-2 text-sm font-semibold text-white hover:bg-[#262626]"
              {...addToCartEvents}
            >
              <ShoppingCart className="mr-2 size-4" />
              <DecorateText propKey="home_add_to_cart_label" as="span">
              {t('product.addToCart')}
              </DecorateText>
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}

const renderRecommendZoneContent = (zone: HomeRecommendZoneSection, handlers: HomeHandlers) => {
  // 按后台「PC列数 × 行数」截断（例：4×12=48），避免内容明细 57 条全量铺开
  const limitedItems = limitRecommendZoneItems(zone, zone.items)
  const productItems = limitedItems.filter(
    (item): item is RecommendProductCard => item.entityType === 'PRODUCT',
  );
  const categoryItems = limitedItems.filter(
    (item): item is RecommendCategoryCard => item.entityType === 'CATEGORY',
  );

  if (zone.zoneType === 'PRODUCT') {
    if (productItems.length === 0) {
      return (
        <div className="rounded-[28px] border border-dashed border-[#ddd6c8] bg-white px-6 py-10 text-center text-sm text-[#8a8073]">
          No products in this section yet
        </div>
      );
    }

    return (
      <div className={getZoneGridClassName(zone)} data-controller-name="首页推荐专区商品网格">
        {productItems.map((item, index) => {
          const isDraft = item.status === 'DRAFT'
          const showOptions = !isDraft && item.skuOptions && item.skuOptions.length > 1
          const selectedSkuId = item.defaultSkuId || item.skuOptions?.[0]?.skuId || ''
          const selectedOption = item.skuOptions?.find((opt) => opt.skuId === selectedSkuId) || item.skuOptions?.[0] || null
          return (
            <DesktopRecommendZoneProductCard
              key={item.itemId}
              item={item}
              index={index}
              handlers={handlers}
              selectedSkuId={selectedSkuId}
              selectedOption={selectedOption}
              showOptions={showOptions}
            />
          )
        })}
      </div>
    );
  }

  if (zone.zoneType === 'CATEGORY') {
    if (categoryItems.length === 0) {
      return (
        <div className="rounded-[28px] border border-dashed border-[#ddd6c8] bg-white px-4 py-3 text-center text-sm text-[#8a8073]">
          No categories in this section yet
        </div>
      );
    }

    return (
      <div className={getCategoryCardGridClassName(zone)} data-controller-name="首页推荐专区类目卡片网格">
        {categoryItems.map((item) => {
          const imageSrc = resolveCategoryCardSrc(item.imageUrl);
          const shelfFallback = resolveCategoryCardFallback(item);
          return (
            <button
              key={item.itemId}
              type="button"
              className="group flex flex-col overflow-hidden rounded-[24px] border border-[#ece7dc] bg-white text-left shadow-[0_12px_28px_-24px_rgba(17,17,17,0.28)] transition hover:-translate-y-0.5 hover:border-[#111111] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111]/20"
              data-controller-name="首页推荐专区类目卡片"
              onClick={() => handlers.handleNavigateRecommendCategory(item.categoryId, item.categorySlug)}
            >
              <div className="relative aspect-square w-full overflow-hidden bg-[#e8e4dc]">
                <EditableImg
                  propKey={`home-recommend-category-${item.categoryId}`}
                  src={imageSrc}
                  alt={item.categoryName}
                  keywords={undefined}
                  disableKeywordSearch
                  fallbackSrc={shelfFallback || CATEGORY_CARD_PLACEHOLDER}
                  slowFallbackMs={shelfFallback ? CATEGORY_PRODUCT_IMAGE_SLOW_MS : 0}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="px-3 py-3 sm:px-4">
                <span className="truncate text-base font-semibold text-[#111111]">{item.categoryName}</span>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="rounded-[28px] border border-dashed border-[#ddd6c8] bg-white px-6 py-10 text-center text-sm text-[#8a8073]">
      Nothing to show in this section yet
    </div>
  );
};

export const HomeStorefrontView = ({ state, handlers }: Props) => {
  const { getPatch, isDecorateMode } = useDecorateMode();
  const router = useRouter();
  // Always start null so SSR HTML matches the first client paint (reading
  // window here caused hydration removeChild crashes on mobile Chrome).
  const [viewport, setViewport] = useState<'mobile' | 'desktop' | null>(null)

  useEffect(() => {
    const apply = () => {
      const narrow = syncNarrowHtmlClass()
      setViewport(narrow ? 'mobile' : 'desktop')
    }
    apply()
    window.addEventListener('resize', apply)
    return () => window.removeEventListener('resize', apply)
  }, [])

  const {
    posters,
    activeBannerIndex,
    sideNavZones,
    categories,
    recommendZones,
    isLoadingRecommendZones,
    selectedRecommendCategoryId,
    queryState,
    cartBadgeCount,
    hoveredTopCategoryId,
    expandedTopNavCategoryIds,
    topNavPanelRef,
    products,
    isLoadingProducts,
    totalCount,
    categoryDetail,
    isSecondaryCategoryResults,
    selectedParentCategory,
    userSession,
    dailyNewArrivalMonths,
    selectedDailyNewArrivalMonthKey,
    dailyNewArrivalProducts,
    dailyNewArrivalTotalActiveProducts,
    isLoadingDailyNewArrivalCalendar,
    isLoadingDailyNewArrivalProducts,
  } = state;

  const { preferredLocale, token: sessionToken } = useUserSession();
  const { t, i18n } = useTranslation();
  const switchLocale = useSwitchAppLocale();
  // 前端登录态：优先用 session token，其次用 hook 汇总的 userSession.isLoggedIn
  const isCustomerLoggedIn = Boolean(sessionToken?.trim()) || Boolean(userSession?.isLoggedIn);
  const authEntryLabel = isCustomerLoggedIn
    ? userSession?.username && userSession.username !== 'My Account' && userSession.username !== '我的账户'
      ? t('nav.hiUser', { name: (userSession.username.trim().split(/\s+/)[0] || userSession.username) })
      : t('nav.accountCenter')
    : t('common.login');

  const handleAuthEntryClick = () => {
    if (isCustomerLoggedIn) {
      handlers.handleNavigateToAccountCenter();
      return;
    }
    handlers.handleNavigateToLogin();
  };

  const [isLocaleMenuOpen, setIsLocaleMenuOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState(queryState.searchKeyword || '');
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isFloatingSideNavOpen, setIsFloatingSideNavOpen] = useState(false);
  const sawProductLoadingRef = useRef(false);
  const localeMenuRef = useRef<HTMLDivElement | null>(null);
  const floatingSideNavRef = useRef<HTMLDivElement | null>(null);
  const floatingSideNavCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentLocale = normalizeLocale(i18n.language || preferredLocale || 'en');
  const currentLocaleLabel = getLocaleLabel(currentLocale);

  useEffect(() => {
    setSearchKeyword(queryState.searchKeyword || '');
  }, [queryState.searchKeyword]);

  useEffect(() => {
    if (!isSearchLoading) return;
    if (isLoadingProducts) {
      sawProductLoadingRef.current = true;
      return;
    }
    if (sawProductLoadingRef.current) {
      setIsSearchLoading(false);
      sawProductLoadingRef.current = false;
    }
  }, [isLoadingProducts, isSearchLoading]);

  useEffect(() => {
    if (!isSearchLoading) return;
    const timer = window.setTimeout(() => {
      setIsSearchLoading(false);
      sawProductLoadingRef.current = false;
    }, 10000);
    return () => window.clearTimeout(timer);
  }, [isSearchLoading]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!localeMenuRef.current?.contains(target)) {
        setIsLocaleMenuOpen(false);
      }
      if (floatingSideNavRef.current && !floatingSideNavRef.current.contains(target)) {
        setIsFloatingSideNavOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocaleSwitch = (code: string) => {
    void switchLocale(code);
    setIsLocaleMenuOpen(false);
  };

  const isDefaultHomeState = isDefaultHomeQueryState(state);
  const activeBanner = posters[activeBannerIndex] || null;
  const categoryProductsRef = useRef<HTMLElement | null>(null);
  const wasDefaultHomeRef = useRef(true);

  useEffect(() => {
    if (isDefaultHomeState) {
      setIsFloatingSideNavOpen(false);
    }
  }, [isDefaultHomeState]);

  useEffect(() => {
    return () => {
      if (floatingSideNavCloseTimerRef.current) {
        clearTimeout(floatingSideNavCloseTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const enteringCategoryView =
      wasDefaultHomeRef.current &&
      !isDefaultHomeState &&
      (Boolean(queryState.categoryId) ||
        Boolean(queryState.searchKeyword) ||
        Boolean(selectedDailyNewArrivalMonthKey));

    wasDefaultHomeRef.current = isDefaultHomeState;

    if (!enteringCategoryView) {
      return;
    }

    categoryProductsRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
  }, [isDefaultHomeState, queryState.categoryId, queryState.searchKeyword, selectedDailyNewArrivalMonthKey]);

  const currentCategoryName =
    queryState.searchKeyword
      ? t('product.searchPrefix', { keyword: queryState.searchKeyword })
      : translateCatalogLabel(
          t,
          categoryDetail?.category_name ||
            categories.find((item) => item.category_id === queryState.categoryId)?.category_name ||
            selectedParentCategory?.children.find((child) => child.category_id === queryState.categoryId)?.category_name ||
            sideNavZones
              .flatMap((zone) => zone.items || [])
              .find((item) => item.category_id === queryState.categoryId)?.category_name ||
            recommendZones
              .filter((zone) => zone.zoneType === 'SIDE_NAV')
              .flatMap((zone) => zone.items || [])
              .find(
                (item): item is HomeRecommendSideNavItem =>
                  item.entityType === 'SIDE_NAV' && item.categoryId === queryState.categoryId,
              )?.categoryName ||
            selectedParentCategory?.category_name ||
            t('product.categoryProducts'),
        );

  // 左侧 Brand 栏：优先 Brand SIDE_NAV，其次 Hot，再回退第一个 SIDE_NAV（与 CATEGORIES 飞出层共用规则）
  const hotSideNavZoneFromApi = pickBrandSideNavZone(sideNavZones, { requireSideNavType: false })
  const hotSideNavZoneFromRecommend = pickBrandSideNavZone(recommendZones, { requireSideNavType: true })

  const sideNavItems =
    hotSideNavZoneFromApi && hotSideNavZoneFromApi.items.length > 0
      ? hotSideNavZoneFromApi.items.map((item) => ({
          id: item.category_id,
          key: item.item_id,
          label: item.category_name,
          slug: item.category_slug,
        }))
      : (hotSideNavZoneFromRecommend?.items || [])
          .filter((item): item is HomeRecommendSideNavItem => item.entityType === 'SIDE_NAV')
          .map((item) => ({
            id: item.categoryId,
            key: item.itemId,
            label: item.categoryName,
            slug: item.categorySlug,
          }));

  // 激活的商品/类目专区全量展示；顺序沿用接口返回的列表顺序，不按权重重排
  const contentZones = recommendZones.filter((zone) => isStorefrontHomeContentZone(zone));

  const handleSideNavClick = (categoryId: string, categorySlug?: string | null) => {
    handlers.handleNavigateRecommendCategory(categoryId, categorySlug);
  };

  const clearFloatingSideNavCloseTimer = useCallback(() => {
    if (floatingSideNavCloseTimerRef.current) {
      clearTimeout(floatingSideNavCloseTimerRef.current);
      floatingSideNavCloseTimerRef.current = null;
    }
  }, []);

  const handleFloatingSideNavHoverChange = useCallback(
    (nextOpen: boolean) => {
      clearFloatingSideNavCloseTimer();
      if (nextOpen) {
        setIsFloatingSideNavOpen(true);
        return;
      }
      floatingSideNavCloseTimerRef.current = setTimeout(() => {
        setIsFloatingSideNavOpen(false);
      }, 140);
    },
    [clearFloatingSideNavCloseTimer],
  );

  const goHomeFromListing = useCallback(() => {
    handlers.handleSelectCategory('');
    router.push('/');
  }, [handlers, router]);

  const hasFloatingBrandItems = sideNavItems.length > 0;

  const selectedDailyNewArrivalMonth = dailyNewArrivalMonths.find(
    (item) => item.monthKey === selectedDailyNewArrivalMonthKey,
  ) || null;

  const renderDailyNewArrivalProductCard = (item: (typeof dailyNewArrivalProducts)[number]) => (
    <ProductListCard
      key={item.product_id}
      item={item}
      imagePropKey={`home-daily-new-product-${item.product_id}`}
      onNavigate={handlers.handleNavigateToDetail}
      onAddToCart={handlers.handleAddToCart}
      onAddToWishlist={handlers.handleAddToWishlist}
      controllerName="每日上新商品卡片"
    />
  );

  const renderTopCategoryRow = (includeCategoriesBlock: boolean) => (
    <div className="relative z-20 mt-2 hidden flex-col gap-2 overflow-visible md:flex xl:flex-row xl:items-stretch" data-controller-name="顶部目录导航">
      {includeCategoriesBlock ? (
        isDefaultHomeState ? (
          /* Home only: static label — brand rail below is already open; no flyout */
          <div
            className="flex h-11 shrink-0 items-center justify-center gap-2 bg-[#f254a6] px-4 text-sm font-bold uppercase tracking-[0.08em] text-white"
            data-controller-name="分类导航CATEGORIES标识"
            aria-hidden="true"
          >
            <Menu className="size-4" />
            <span>{t('common.categories')}</span>
          </div>
        ) : (
          /* Listing / category results: same Brand flyout as Product Detail */
          <div
            className="storefront-categories-col relative"
            ref={floatingSideNavRef}
            onMouseEnter={() => {
              if (hasFloatingBrandItems) handleFloatingSideNavHoverChange(true);
            }}
            onMouseLeave={() => {
              if (hasFloatingBrandItems) handleFloatingSideNavHoverChange(false);
            }}
          >
            <div className="relative w-full">
              <button
                type="button"
                className="flex h-11 w-full items-center justify-center gap-2 bg-[#f254a6] px-4 text-sm font-bold uppercase tracking-[0.08em] text-white"
                data-controller-name="分类导航CATEGORIES标识"
                aria-expanded={isFloatingSideNavOpen}
                aria-controls="storefront-floating-brand-nav"
                onClick={() => {
                  if (!hasFloatingBrandItems) return;
                  clearFloatingSideNavCloseTimer();
                  setIsFloatingSideNavOpen((prev) => !prev);
                }}
              >
                <Menu className="size-4" />
                <span>{t('common.categories')}</span>
              </button>

              {hasFloatingBrandItems ? (
                <StorefrontFloatingSideNav
                  open={isFloatingSideNavOpen}
                  items={sideNavItems}
                  activeId={queryState.categoryId || selectedRecommendCategoryId || null}
                  onSelect={(categoryId, categorySlug) => {
                    setIsFloatingSideNavOpen(false);
                    handleSideNavClick(categoryId, categorySlug);
                  }}
                />
              ) : null}
            </div>
          </div>
        )
      ) : null}

      <div
        ref={topNavPanelRef}
        className="storefront-category-nav relative z-20 min-w-0 flex-1 overflow-visible"
        data-controller-name="一级分类标签导航"
      >
        {categories.map((category, index) => {
          const isDailyNewArrival = isDailyNewArrivalCategoryName(category.category_name);
          const isActive =
            queryState.categoryId === category.category_id ||
            category.children.some((child) => child.category_id === queryState.categoryId) ||
            (isDailyNewArrival && Boolean(selectedDailyNewArrivalMonthKey));
          const activeChildren = category.children;
          const hasChildren = activeChildren.length > 0;
          const hasHoverPanel = hasChildren || isDailyNewArrival;
          const isDesktopPanelVisible = hoveredTopCategoryId === category.category_id && hasHoverPanel;
          const isMobileExpanded = expandedTopNavCategoryIds.includes(category.category_id);
          const monthCards = dailyNewArrivalMonths.length > 0 ? dailyNewArrivalMonths : [];

          return (
            <div
              key={`${category.category_id}-hero`}
              className="relative flex min-w-0 items-center justify-center"
              onMouseEnter={() => {
                if (hasHoverPanel) {
                  handlers.handleTopCategoryHoverChange(category.category_id);
                }
              }}
              onMouseLeave={() => handlers.handleTopCategoryHoverChange(null)}
            >
              <div className="flex h-full w-full flex-col gap-2">
                <div className="flex items-center justify-center gap-1">
                  <button
                    type="button"
                    data-active={isActive}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'relative flex min-w-0 items-center justify-center bg-transparent px-2 py-2 text-center text-sm font-bold transition-colors duration-200 lg:text-base lg:whitespace-nowrap',
                      isActive
                        ? 'text-[#f254a6] after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-[calc(100%-8px)] after:-translate-x-1/2 after:rounded-full after:bg-[#f254a6] after:content-[""]'
                        : 'text-[#333333] hover:text-[#f254a6]',
                    )}
                    onClick={(event) => {
                      event.preventDefault();
                      if (isDailyNewArrival) return;
                      handlers.handleToggleDesktopTopNavCategory(category.category_id, {
                        categorySlug: category.category_slug,
                      });
                    }}
                    aria-expanded={hasHoverPanel ? isDesktopPanelVisible : undefined}
                    aria-haspopup={hasHoverPanel ? 'menu' : undefined}
                    data-api-bind-info={`categories-${index}-category_name`}
                    data-api-map-var-name="category"
                  >
                    <span>{translateCatalogLabel(t, category.category_name)}</span>
                  </button>
                  {hasHoverPanel ? (
                    <button
                      type="button"
                      className="flex size-8 shrink-0 items-center justify-center bg-transparent text-[#6b7280] transition hover:text-[#111111] lg:hidden"
                      onClick={(event) => {
                        event.stopPropagation();
                        event.preventDefault();
                        handlers.handleToggleTopNavCategory(category.category_id);
                      }}
                      aria-label={isMobileExpanded ? 'Collapse menu' : 'Expand menu'}
                    >
                      <ChevronDown className={`size-4 transition-transform ${isMobileExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  ) : null}
                </div>

                {hasChildren && isMobileExpanded ? (
                  <div className="grid grid-cols-1 gap-2 rounded-[24px] border border-[#e5dfd2] bg-white p-3 shadow-[0_18px_35px_-28px_rgba(17,17,17,0.28)] lg:hidden" data-controller-name="移动端一级类目二级折叠">
                    {activeChildren.map((child, index1) => (
                      <button
                        key={child.category_id}
                        type="button"
                        className={`flex w-full items-center justify-between rounded-[16px] px-3 py-2.5 text-left text-sm transition-colors ${
                          queryState.categoryId === child.category_id ? 'bg-[#111111] text-white' : 'text-[#2b2b2b] hover:bg-[#f5f1e8]'
                        }`}
                        onClick={(event) => {
                          event.stopPropagation();
                          event.preventDefault();
                          handlers.handleSelectCategory(child.category_id, {
                            parentCategoryId: category.category_id,
                            categorySlug: child.category_slug,
                          });
                        }}
                        data-api-bind-info={`categories-${index}-category.children-${index1}-category_name`}
                        data-api-map-var-name="child"
                      >
                        <span>{translateCatalogLabel(t, child.category_name)}</span>
                        <ChevronRight className="size-4 opacity-60" />
                      </button>
                    ))}
                  </div>
                ) : null}

                {isDailyNewArrival && isMobileExpanded ? (
                  <div className="grid grid-cols-1 gap-2 rounded-[24px] border border-[#e5dfd2] bg-white p-3 shadow-[0_18px_35px_-28px_rgba(17,17,17,0.28)] lg:hidden" data-controller-name="移动端每日上新月历折叠">
                    {isLoadingDailyNewArrivalCalendar ? (
                      <div className="flex items-center justify-center gap-2 py-4 text-sm text-[#7a756c]">
                        <Loader2 className="size-4 animate-spin" />
                        Loading months...
                      </div>
                    ) : (
                      monthCards.map((month) => {
                        const isMonthActive = selectedDailyNewArrivalMonthKey === month.monthKey;
                        return (
                          <button
                            key={month.monthKey}
                            type="button"
                            className={`flex w-full items-center justify-between rounded-[16px] px-3 py-2.5 text-left text-sm transition-colors ${
                              isMonthActive ? 'bg-[#111111] text-white' : 'text-[#2b2b2b] hover:bg-[#f5f1e8]'
                            }`}
                            onClick={(event) => {
                              event.stopPropagation();
                              event.preventDefault();
                              handlers.handleSelectDailyNewArrivalMonth(month.monthKey);
                            }}
                          >
                            <span>{month.label}</span>
                            <ChevronRight className="size-4 opacity-60" />
                          </button>
                        );
                      })
                    )}
                  </div>
                ) : null}
                {isDesktopPanelVisible && hasChildren && !isDailyNewArrival ? (
                  <div
                    className="absolute left-1/2 top-full z-50 hidden w-max min-w-[240px] max-w-[520px] -translate-x-1/2 pt-2 lg:block"
                    role="menu"
                    onMouseEnter={() => handlers.handleTopCategoryHoverChange(category.category_id)}
                    onMouseLeave={() => handlers.handleTopCategoryHoverChange(null)}
                  >
                    <div className="rounded-[16px] border border-[#ebe7de] bg-white p-3 shadow-[0_16px_40px_-12px_rgba(17,17,17,0.28)]">
                      <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
                        {activeChildren.map((child) => (
                          <button
                            key={child.category_id}
                            type="button"
                            role="menuitem"
                            className="flex w-full items-center justify-between rounded-[12px] px-3 py-2.5 text-left text-sm text-[#2b2b2b] transition-colors hover:bg-[#f5f1e8]"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              handlers.handleSelectCategory(child.category_id, {
                                parentCategoryId: category.category_id,
                                categorySlug: child.category_slug,
                              });
                            }}
                          >
                            <span>{translateCatalogLabel(t, child.category_name)}</span>
                            <ChevronRight className="size-4 opacity-60" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                {isDesktopPanelVisible && isDailyNewArrival ? (
                  <div
                    className="absolute left-1/2 top-full z-50 hidden w-max min-w-[240px] max-w-[520px] -translate-x-1/2 pt-2 lg:block"
                    role="menu"
                    onMouseEnter={() => handlers.handleTopCategoryHoverChange(category.category_id)}
                    onMouseLeave={() => handlers.handleTopCategoryHoverChange(null)}
                  >
                    <div className="rounded-[16px] border border-[#ebe7de] bg-white p-3 shadow-[0_16px_40px_-12px_rgba(17,17,17,0.28)]">
                      {isLoadingDailyNewArrivalCalendar ? (
                        <div className="flex min-h-[88px] items-center justify-center gap-2 text-sm text-[#7a756c]">
                          <Loader2 className="size-4 animate-spin" />
                          Loading months...
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
                          {monthCards.map((month) => (
                            <button
                              key={month.monthKey}
                              type="button"
                              role="menuitem"
                              className="flex w-full items-center justify-between rounded-[12px] px-3 py-2.5 text-left text-sm text-[#2b2b2b] transition-colors hover:bg-[#f5f1e8]"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                handlers.handleSelectDailyNewArrivalMonth(month.monthKey);
                              }}
                            >
                              <span>{month.label}</span>
                              <ChevronRight className="size-4 opacity-60" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const handleHeaderSearchSubmit = () => {
    if (isSearchLoading) return;
    setIsSearchLoading(true);
    sawProductLoadingRef.current = false;
    handlers.handleSearchProducts(searchKeyword);
  };

  return (
    <>
    {/* Mount only the active viewport once known — avoids double React trees on mobile. */}
    {viewport !== 'desktop' ? (
    <div data-home-layout="mobile">
      <MobileHomeStorefrontView state={state} handlers={handlers} />
    </div>
    ) : null}
    {viewport === 'desktop' ? (
    <div
      data-home-layout="desktop"
      className="bg-[#FFF5F5] text-[#111111]"
      data-controller-name="首页独立站陈列布局"
    >
      {/* 第 1 层：Logo / 搜索 + 目录导航 */}
      <section
        className="storefront-desktop-chrome border-b border-[#f0dede] bg-[#FFF5F5]"
        data-controller-name="顶部品牌导航与搜索区"
      >
        <div className="storefront-container flex flex-col gap-2.5 py-2.5 sm:py-3">
          <div className="flex flex-col gap-2.5 overflow-visible bg-transparent px-0 py-0" data-controller-name="品牌展示与快捷入口">
            <div className="flex flex-col gap-2.5 overflow-visible">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="storefront-categories-col flex flex-wrap items-center gap-3">
                  <StorefrontBrandMark useNextLink ariaLabel={t('common.backToHome')} />
                </div>

                <div className="flex min-w-0 flex-1 items-center gap-5 sm:gap-6 xl:max-w-[980px]" data-controller-name="搜索栏与用户功能区">
                  <div className="flex min-w-0 flex-1 justify-center">
                    {/* Desktop search: full-width capsule + black search button (not mobile 220px) */}
                    <div className="storefront-desktop-search flex w-full max-w-[560px] items-center overflow-hidden rounded-full border border-[#1e1e1e] bg-white shadow-[0_10px_28px_-24px_rgba(0,0,0,0.55)] xl:max-w-[640px]">
                      <div className="flex min-w-0 flex-1 items-center gap-2.5 px-3 text-[#6b6b6b] sm:gap-3 sm:px-5">
                        <Camera className="size-4 shrink-0 sm:size-5" />
                        <Input
                          placeholder={t('common.pleaseInput')}
                          className="h-10 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0 sm:h-11 sm:text-base"
                          value={searchKeyword}
                          onChange={(event) => setSearchKeyword(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              handleHeaderSearchSubmit();
                            }
                          }}
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={handleHeaderSearchSubmit}
                        disabled={isSearchLoading}
                        aria-busy={isSearchLoading}
                        className="h-10 min-w-[88px] rounded-none rounded-r-full bg-[#111111] px-4 text-sm font-semibold tracking-[0.08em] text-white hover:bg-[#262626] disabled:pointer-events-none disabled:opacity-80 sm:h-11 sm:min-w-[100px] sm:px-6"
                      >
                        {isSearchLoading ? (
                          <Loader2 className="mr-2 size-5 animate-spin" />
                        ) : (
                          <Search className="mr-2 size-5" />
                        )}
                        <DecorateText propKey="home_search_btn" as="span">
                          {t('common.search')}
                        </DecorateText>
                      </Button>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
                  <div className="relative shrink-0" ref={localeMenuRef}>
                    <button
                      type="button"
                      className="inline-flex h-10 items-center gap-2 rounded-full border border-[#d8d4ca] bg-white px-3 text-sm font-semibold text-[#111111] shadow-sm transition hover:border-[#111111] hover:bg-[#f7f4ee] sm:h-11 sm:px-3.5"
                      onClick={() => setIsLocaleMenuOpen((prev) => !prev)}
                      aria-expanded={isLocaleMenuOpen}
                    >
                      <Globe className="size-4" />
                      <span className="max-w-[88px] truncate">{currentLocaleLabel}</span>
                      <ChevronDown className={cn('size-4 transition-transform', isLocaleMenuOpen ? 'rotate-180' : '')} />
                    </button>
                    {isLocaleMenuOpen ? (
                      <div className="absolute right-0 top-[calc(100%+10px)] z-30 w-[200px] rounded-[22px] border border-[#e7e1d5] bg-white p-2 shadow-[0_24px_48px_-24px_rgba(17,17,17,0.35)]">
                        <div className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a8073]">
                          {t('common.language')}
                        </div>
                        {APP_LOCALES.map((option) => (
                          <button
                            key={option.code}
                            type="button"
                            className={cn(
                              'flex w-full items-center justify-between rounded-[16px] px-4 py-3 text-left text-sm font-medium transition',
                              currentLocale === option.code
                                ? 'bg-[#111111] text-white'
                                : 'text-[#232323] hover:bg-[#f6f2ea]',
                            )}
                            onClick={() => handleLocaleSwitch(option.code)}
                          >
                            <span>{option.label}</span>
                            {currentLocale === option.code ? <ShieldCheck className="size-4" /> : null}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <CustomerAccountMenu trigger="hover" />

                  <Button
                    type="button"
                    variant="outline"
                    className="relative h-10 shrink-0 rounded-full border-[#d8d4ca] bg-white px-3 text-sm font-semibold lowercase tracking-[0.04em] text-[#111111] shadow-sm hover:border-[#111111] hover:bg-[#f7f4ee] sm:h-11 sm:px-3.5"
                    onClick={handlers.handleNavigateToCart}
                  >
                    <span className="relative mr-2 inline-flex">
                      <ShoppingCart className="size-4" />
                      {cartBadgeCount > 0 ? (
                        <span className="absolute -right-2 -top-2 flex min-w-[18px] items-center justify-center rounded-full bg-[#d93535] px-1 text-[10px] font-semibold leading-4 text-white">
                          {cartBadgeCount}
                        </span>
                      ) : null}
                    </span>
                    <DecorateText propKey="home_cart_btn" as="span">
                      {t('common.cart')}
                    </DecorateText>
                  </Button>
                  </div>
                </div>
              </div>

              {renderTopCategoryRow(true)}
            </div>
          </div>
        </div>
      </section>

      {/* 左侧 Brand 与顶部 CATEGORIES 左对齐 + Banner */}
      {isDefaultHomeState ? (
        <section className="storefront-container home-hero-fullbleed" data-controller-name="首页分类浏览与横幅联动区">
          <div className="home-hero-grid">
            <aside className="home-side-nav-col" data-controller-name="左侧分类浏览模块">
              <div className="home-side-nav">
                <StorefrontBrandNavList
                  variant="rail"
                  items={sideNavItems}
                  activeId={selectedRecommendCategoryId}
                  onSelect={handleSideNavClick}
                  getItemBindInfo={(index) => `sideNavItems-${index}-categoryName`}
                  getItemMapVarName={() => 'item'}
                />
              </div>
            </aside>

            <div className="home-right-rail min-w-0">
              <div className="home-banner-wrap min-w-0" data-controller-name="首页横幅轮播区">
                <DecorateFrame propKey="home_banner_shell" kind="block" className="home-banner-shell">
                  {activeBanner ? (
                    <>
                      <button
                        type="button"
                        className="group absolute inset-0 block h-full w-full overflow-hidden bg-[#111111]"
                        onClick={() => handlers.handleBannerClick(activeBanner)}
                      >
                        <EditableImg
                          propKey={`category-poster-${activeBanner.poster_id}`}
                          keywords={activeBanner.image_url || activeBanner.title}
                          className="home-banner-media absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        />
                      </button>

                      {posters.length > 1 ? (
                        <>
                          <button
                            type="button"
                            className="absolute left-3 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center bg-white/88 text-[#111111] transition hover:bg-white sm:left-4 sm:size-11"
                            onClick={() => handlers.handleBannerChange(activeBannerIndex - 1)}
                            aria-label="Previous banner"
                          >
                            <ChevronLeft className="size-5" />
                          </button>
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center bg-white/88 text-[#111111] transition hover:bg-white sm:right-4 sm:size-11"
                            onClick={() => handlers.handleBannerChange(activeBannerIndex + 1)}
                            aria-label="Next banner"
                          >
                            <ChevronRight className="size-5" />
                          </button>
                          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
                            {posters.map((banner, index) => (
                              <button
                                key={banner.poster_id}
                                type="button"
                                className={`h-2.5 rounded-full transition-all ${
                                  index === activeBannerIndex ? 'w-8 bg-white' : 'w-2.5 bg-white/35 hover:bg-white/60'
                                }`}
                                onClick={() => handlers.handleBannerChange(index)}
                                aria-label={`Go to banner ${index + 1}`}
                              />
                            ))}
                          </div>
                        </>
                      ) : null}
                    </>
                  ) : null}

                </DecorateFrame>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <div className="storefront-container">
        {/* 每日上新：仅在选中月份后展示商品列表（月历已移入顶部悬浮下拉） */}
        {selectedDailyNewArrivalMonthKey ? (
          <section
            ref={categoryProductsRef}
            className="scroll-mt-4 py-6"
            data-controller-name="每日上新月度商品区"
          >
            <div className="bg-transparent px-0 py-5">
              <div className="flex flex-col gap-3 border-b border-[#ece7dc] pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8b8477]">{t('product.dailyNewTitle')}</p>
                  <h2 className="mt-2 text-[28px] font-semibold tracking-[0.08em] text-[#111111]">
                    {selectedDailyNewArrivalMonth?.label || t('product.dailyNewFallback')}
                  </h2>
                  <p className="mt-2 text-sm text-[#6f6a62]">
                    {isLoadingDailyNewArrivalProducts
                      ? t('product.loadingShort')
                      : dailyNewArrivalTotalActiveProducts === 0
                        ? t('product.noProducts')
                        : t('product.newArrivalsCount', { count: dailyNewArrivalProducts.length })}
                  </p>
                </div>
              </div>

              {dailyNewArrivalTotalActiveProducts === 0 && !isLoadingDailyNewArrivalProducts ? (
                <div className="mt-6 border-b border-[#ececec] px-2 py-14 text-center">
                  <div className="mx-auto flex size-14 items-center justify-center bg-[#ebe7de] text-[#111111]">
                    <Package className="size-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-[#111111]">{t('product.noProducts')}</h3>
                  <p className="mt-2 text-sm text-[#7a756c]">{t('product.emptyDailyHint')}</p>
                </div>
              ) : isLoadingDailyNewArrivalProducts ? (
                <div className="mt-6 flex min-h-[280px] flex-col items-center justify-center gap-3 text-sm text-[#7a756c]">
                  <Loader2 className="size-6 animate-spin" />
                  {t('product.loading')}
                </div>
              ) : dailyNewArrivalProducts.length > 0 ? (
                <div className="storefront-product-grid mt-6 grid grid-cols-2 gap-2.5 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {dailyNewArrivalProducts.map((item) => renderDailyNewArrivalProductCard(item))}
                </div>
              ) : (
                <div className="mt-6 border-b border-[#ececec] px-2 py-14 text-center">
                  <div className="mx-auto flex size-14 items-center justify-center bg-[#ebe7de] text-[#111111]">
                    <Package className="size-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-[#111111]">
                    {t('product.emptyMonthTitle', {
                      month: selectedDailyNewArrivalMonth?.label || t('product.monthFallback'),
                    })}
                  </h3>
                  <p className="mt-2 text-sm text-[#7a756c]">{t('product.emptyMonthHint')}</p>
                </div>
              )}
            </div>
          </section>
        ) : !isDefaultHomeState ? (
          <section
            ref={categoryProductsRef}
            className="scroll-mt-4 py-6"
            data-controller-name="分类商品展示区"
          >
            <div className="bg-transparent px-0 py-2 sm:py-5">
              <div className="category-listing-head flex flex-col gap-2 border-b border-[#ece7dc] pb-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:pb-5">
                <ListingPageHead
                  title={currentCategoryName}
                  countText={
                    isLoadingProducts && products.length === 0
                      ? t('product.loadingShort')
                      : `(${t('product.totalCount', { count: totalCount })})`
                  }
                  backLabel={t('common.backToHome')}
                  onBack={(event) => {
                    event.preventDefault();
                    goHomeFromListing();
                  }}
                  note={
                    isSecondaryCategoryResults
                      ? t('product.secondaryCategoryNote')
                      : queryState.categoryId
                        ? t('product.includesSubcategories')
                        : null
                  }
                />

                <ProductListToolbar
                  className="w-full shrink-0 sm:w-auto sm:justify-end"
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
              </div>

              {products.length > 0 ? (
                <div className="storefront-product-grid mt-6 grid grid-cols-2 gap-2.5 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {products.map((item, index) => (
                    <ProductListCard
                      key={item.product_id}
                      item={item}
                      imagePropKey={`home-category-product-${item.product_id}`}
                      onNavigate={handlers.handleNavigateToDetail}
                      onAddToCart={handlers.handleAddToCart}
                      onAddToWishlist={handlers.handleAddToWishlist}
                      controllerName={isSecondaryCategoryResults ? '二级类目商品卡片' : '一级类目商品卡片'}
                      priority={index < 10}
                    />
                  ))}
                </div>
              ) : isLoadingProducts ? (
                <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-sm text-[#7a756c]">
                  <Loader2 className="size-6 animate-spin" />
                  {t('product.loading')}
                </div>
              ) : (
                <div className="mt-6 border-b border-[#ececec] px-2 py-14 text-center">
                  <div className="mx-auto flex size-14 items-center justify-center bg-[#ebe7de] text-[#111111]">
                    <Package className="size-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-[#111111]">
                    {queryState.searchKeyword ? t('product.emptySearchTitle') : t('product.emptyCategory')}
                  </h3>
                  <p className="mt-2 text-sm text-[#7a756c]">
                    {queryState.searchKeyword
                      ? t('product.emptySearchHint', { keyword: queryState.searchKeyword })
                      : t('product.emptyCategoryHint')}
                  </p>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {/* 第 3 层：四个服务权益卡片（标题/描述/图标可装修，静态展示无跳转） */}
        {isDefaultHomeState ? (
          <section className="bg-transparent pt-2 pb-4 sm:pt-4" data-controller-name="首页服务权益条模块">
            <HomeServiceBenefitGrid />
          </section>
        ) : null}

        {/* 第 4 层：后台推荐专区（商品/类目） */}
        {isDefaultHomeState ? (
          <section className="pb-12" data-controller-name="首页推荐专区模块">
            <div className="space-y-6">
              {isLoadingRecommendZones ? (
                <div className="flex items-center justify-center gap-2 border-b border-[#ececec] bg-transparent px-6 py-10 text-sm text-[#7a756c]">
                  <Loader2 className="size-4 animate-spin" />
                  Loading recommended sections...
                </div>
              ) : (
                <div className="space-y-6">
                  {contentZones.map((zone, index) => (
                    <HomeRecommendZoneSection
                      key={zone.zoneId}
                      zone={zone}
                      handlers={handlers}
                      showViewAll
                      onViewAll={handlers.handleNavigateRecommendZone}
                    />
                  ))}
                </div>
              )}

              {!isLoadingRecommendZones && contentZones.length === 0 ? (
                <div
                  className="border-b border-[#ececec] bg-transparent px-6 py-12 text-center"
                  data-controller-name="首页推荐专区空状态"
                >
                  <div className="mx-auto flex size-14 items-center justify-center bg-[#f0ebe2] text-[#4a4137]">
                    <Package className="size-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-[#40372f]">No sections to display yet</h3>
                  <p className="mt-2 text-sm text-[#8a8073]">
                    Enabled product or category zones will appear here in the order set in admin.
                  </p>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
      {/* 第 5 层页脚由 app/(frontend)/layout.tsx 的 Footer 提供，此处不重复渲染 */}
    </div>
    ) : null}
    </>
  );
};

export default HomeStorefrontView;
