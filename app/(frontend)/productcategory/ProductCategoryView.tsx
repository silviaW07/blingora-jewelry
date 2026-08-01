'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import EditableImg from '@/@base/EditableImg';
import { Camera, Search, Heart, ShoppingCart, ChevronDown, ChevronRight, ChevronLeft, ChevronRight as ChevronRightIcon, Flame, Sparkles, Gem, Clock3, UserCircle2, Package, LogOut, SlidersHorizontal, ArrowUpDown, Star, Loader2, BadgePercent, Boxes, Filter, Tag } from 'lucide-react';
import type { ProductCategoryState, ProductCategoryHandlers, ProductCategoryBannerItem, ProductCategoryKeywordItem } from '@/frontend/hooks/useProductCategory';
interface Props {
  state: ProductCategoryState;
  handlers: ProductCategoryHandlers;
}
const renderBannerHrefLabel = (banner: ProductCategoryBannerItem) => banner.link_text || 'Discover More';
const renderKeywordLabel = (item: ProductCategoryKeywordItem) => item.keyword_label || '推荐关键词';
const formatPrice = (price?: number | null) => {
  if (typeof price !== 'number' || Number.isNaN(price)) {
    return 'US$ --';
  }
  return `US$ ${price.toFixed(2)}`;
};
const renderRatingStars = (rating?: number | null) => {
  const safeRating = typeof rating === 'number' && !Number.isNaN(rating) ? Math.max(0, Math.min(5, rating)) : 0;
  const fullStars = Math.round(safeRating);
  return Array.from({
    length: 5
  }, (_, index) => <Star key={`star-${index}`} className={`size-3.5 ${index < fullStars ? 'fill-[#f4a261] text-[#f4a261]' : 'text-[#d5cec1]'}`} />);
};
export const ProductCategoryView = ({
  state,
  handlers
}: Props) => {
  const {
    categories,
    expandedCategoryIds,
    queryState,
    posters,
    leftNavKeywordGroups,
    recommendationKeywordGroups,
    activeLeftNavGroupId,
    leftNavKeywords,
    recommendationFloors,
    activeBannerIndex,
    promotionBanner,
    userSession,
    cartBadgeCount,
    isUserMenuOpen,
    hoveredTopCategoryId,
    expandedTopNavCategoryIds,
    products,
    totalCount,
    isLoadingProducts,
    sortByLabels,
    stockStatusLabels,
    categoryDetail
  } = state;
  const activeBanner = posters[activeBannerIndex] || null;
  const currentCategoryName = categoryDetail?.category_name || categories.find(category => category.category_id === queryState.categoryId)?.category_name || categories.flatMap(category => category.children).find(child => child.category_id === queryState.categoryId)?.category_name || '全部商品';
  const activeSortLabel = sortByLabels[queryState.sortBy] || '默认排序';
  const selectedStockStatuses = queryState.stockStatus || [];
  /* Extracted array: _items */
  const _items = ['', '4', '3', '2'];
  return <main className="min-h-screen bg-[#f4f4f1] text-[#111111]" data-controller-name="分类页整体布局">
      <section className="border-b border-[#dfddd6] bg-[#f4f4f1]" data-controller-name="顶部品牌导航与搜索区">
        <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-5 px-4 py-5 sm:px-6 xl:px-10">
          <div className="flex flex-col gap-5 rounded-[36px] bg-white px-4 py-5 shadow-[0_20px_55px_-38px_rgba(0,0,0,0.36)] sm:px-6 xl:px-8" data-controller-name="品牌展示与快捷入口">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="flex flex-wrap items-center gap-4 xl:w-[320px] xl:shrink-0">
                <button type="button" className="flex items-center gap-4 text-left transition-opacity hover:opacity-80" onClick={() => handlers.handleSelectCategory('')}>
                  <div className="relative flex size-16 items-center justify-center rounded-[24px] bg-[linear-gradient(145deg,#111111,#3c2f7d)] text-white shadow-[0_18px_36px_-22px_rgba(17,17,17,0.65)]">
                    <span className="absolute left-2 top-2 size-4 rounded-full bg-[#f4a261] opacity-95" />
                    <span className="absolute bottom-2 right-2 size-3 rounded-full bg-[#2ec4b6] opacity-90" />
                    <Gem className="size-7" />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.34em] text-[#6f6a62]">BLINGORA</p>
                    <h1 className="mt-1 text-[24px] font-black tracking-[0.16em] text-[#111111]">JEWELRY</h1>
                  </div>
                </button>
              </div>

              <div className="flex flex-1 flex-col gap-4 xl:max-w-[720px]">
                <div className="flex items-center" data-controller-name="搜索栏单行区">
                  <div className="flex min-w-0 flex-1 items-center overflow-hidden rounded-full border border-[#1e1e1e] bg-white shadow-[0_14px_38px_-30px_rgba(0,0,0,0.65)]">
                    <div className="flex min-w-0 flex-1 items-center gap-3 px-5 text-[#6b6b6b]">
                      <Camera className="size-5 shrink-0" />
                      <Input placeholder="Please Input" className="h-14 border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0" />
                    </div>
                    <Button className="h-14 rounded-none rounded-r-full bg-black px-6 text-sm font-semibold tracking-[0.08em] text-white hover:bg-[#222222] sm:px-8">
                      <Search className="mr-2 size-4" />
                      Search
                    </Button>
                  </div>
                </div>

                <div className="rounded-[28px] bg-[#faf8f3] px-4 py-4" data-controller-name="顶部目录导航">
                  <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:gap-2.5">
                    {categories.map((category, index) => {
                    const isActive = queryState.categoryId === category.category_id || category.children.some(child => child.category_id === queryState.categoryId);
                    const hasChildren = category.children.length > 0;
                    const isDesktopPanelVisible = hoveredTopCategoryId === category.category_id && hasChildren;
                    const isMobileExpanded = expandedTopNavCategoryIds.includes(category.category_id);
                    return <div key={`${category.category_id}-hero`} className="relative lg:flex lg:items-start" onMouseEnter={() => handlers.handleTopCategoryHoverChange(category.category_id)} onMouseLeave={() => handlers.handleTopCategoryHoverChange(null)}>
                        <div className="flex flex-col gap-2 lg:block">
                          <div className="flex items-center gap-2">
                            <button type="button" className={`min-w-0 rounded-full border px-4 py-2.5 text-sm font-semibold tracking-[0.06em] transition-all ${isActive ? 'border-[#111111] bg-[#111111] text-white shadow-[0_18px_30px_-20px_rgba(17,17,17,0.85)]' : 'border-[#e2ddcf] bg-white text-[#232323] hover:-translate-y-0.5 hover:border-[#111111]'}`} onClick={() => handlers.handleSelectCategory(category.category_id)}>
                              {category.category_name}
                            </button>
                            {hasChildren ? <button type="button" className="flex size-10 items-center justify-center rounded-full border border-[#e2ddcf] bg-white text-[#232323] transition hover:border-[#111111] hover:text-[#111111] lg:hidden" onClick={() => handlers.handleToggleTopNavCategory(category.category_id)} aria-label={isMobileExpanded ? '收起二级类目' : '展开二级类目'}>
                                <ChevronDown className={`size-4 transition-transform ${isMobileExpanded ? 'rotate-180' : ''}`} />
                              </button> : null}
                          </div>

                          {hasChildren && isMobileExpanded ? <div className="grid grid-cols-1 gap-2 rounded-[24px] border border-[#e5dfd2] bg-white p-3 shadow-[0_18px_35px_-28px_rgba(17,17,17,0.28)] lg:hidden" data-controller-name="移动端一级类目二级折叠">
                              {category.children.map((child, index1) => <button key={child.category_id} type="button" className={`flex w-full items-center justify-between rounded-[16px] px-3 py-2.5 text-left text-sm transition-colors ${queryState.categoryId === child.category_id ? 'bg-[#111111] text-white' : 'text-[#2b2b2b] hover:bg-[#f5f1e8]'}`} onClick={() => handlers.handleSelectCategory(child.category_id, {
                          parentCategoryId: category.category_id
                        })}>
                                  <span>{child.category_name}</span>
                                  <ChevronRight className="size-4 opacity-60" />
                                </button>)}
                            </div> : null}
                        </div>

                        {isDesktopPanelVisible ? <div className="absolute left-[calc(100%+12px)] top-1/2 z-20 hidden min-w-[240px] -translate-y-1/2 rounded-[22px] border border-[#e5dfd2] bg-white p-3 shadow-[0_24px_55px_-28px_rgba(17,17,17,0.35)] lg:block" data-controller-name="一级类目二级悬浮面板">
                            <div className="space-y-1.5">
                              {category.children.map((child, index1) => <button key={child.category_id} type="button" className={`flex w-full items-center justify-between rounded-[16px] px-3 py-2.5 text-left text-sm transition-colors ${queryState.categoryId === child.category_id ? 'bg-[#111111] text-white' : 'text-[#2b2b2b] hover:bg-[#f5f1e8]'}`} onClick={() => handlers.handleSelectCategory(child.category_id, {
                          parentCategoryId: category.category_id
                        })}>
                                  <span>{child.category_name}</span>
                                  <ChevronRight className="size-4 opacity-60" />
                                </button>)}
                            </div>
                          </div> : null}
                      </div>;
                  })}
                  </div>
                </div>
              </div>

              <div className="relative flex w-full shrink-0 items-center justify-end xl:w-auto" data-controller-name="右上统一功能区">
                <div className="flex w-full max-w-full flex-nowrap items-center justify-end gap-2 overflow-x-auto rounded-full bg-[#f6f2ea] p-2 shadow-[inset_0_0_0_1px_rgba(216,212,202,0.9)] xl:w-auto xl:min-w-[520px]">
                  {userSession.isLoggedIn ? <div className="relative ml-auto">
                      <button type="button" className="flex items-center gap-3 rounded-full border border-[#d8d4ca] bg-white px-4 py-2.5 text-sm font-medium text-[#111111] shadow-sm transition hover:bg-[#f3f1eb]" onClick={handlers.handleToggleUserMenu}>
                        <span className="flex size-9 items-center justify-center rounded-full bg-[#111111] text-sm font-semibold text-white">{userSession.avatarText}</span>
                        <span className="max-w-[120px] truncate">{userSession.username}</span>
                        <ChevronDown className={`size-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isUserMenuOpen ? <div className="absolute right-0 top-[calc(100%+10px)] z-20 w-[220px] rounded-[24px] border border-[#e7e1d5] bg-white p-2 shadow-[0_24px_48px_-24px_rgba(17,17,17,0.35)]">
                          <button type="button" className="flex w-full items-center gap-3 rounded-[18px] px-4 py-3 text-left text-sm font-medium text-[#111111] transition hover:bg-[#f6f2ea]" onClick={handlers.handleNavigateToAccountCenter}>
                            <UserCircle2 className="size-4" />
                            个人中心
                          </button>
                          <button type="button" className="flex w-full items-center gap-3 rounded-[18px] px-4 py-3 text-left text-sm font-medium text-[#111111] transition hover:bg-[#f6f2ea]" onClick={handlers.handleNavigateToOrderCenter}>
                            <Package className="size-4" />
                            我的订单
                          </button>
                          <button type="button" className="flex w-full items-center gap-3 rounded-[18px] px-4 py-3 text-left text-sm font-medium text-[#c43d3d] transition hover:bg-[#fff1f1]" onClick={handlers.handleLogout}>
                            <LogOut className="size-4" />
                            退出登录
                          </button>
                        </div> : null}
                    </div> : <>
                      <Button type="button" variant="outline" className="rounded-full border-[#d8d4ca] bg-white px-4 py-2.5 text-sm font-medium text-[#111111] hover:bg-[#f3f1eb]" onClick={handlers.handleNavigateToRegister}>
                        注册
                      </Button>
                      <Button type="button" variant="outline" className="rounded-full border-[#d8d4ca] bg-white px-4 py-2.5 text-sm font-medium text-[#111111] hover:bg-[#f3f1eb]" onClick={handlers.handleNavigateToLogin}>
                        登录
                      </Button>
                    </>}
                  <Button type="button" variant="outline" className="rounded-full border-[#d8d4ca] bg-white px-4 py-2.5 text-sm font-medium text-[#111111] hover:bg-[#f3f1eb]" onClick={handlers.handleNavigateToWishlist}>
                    <Heart className="mr-2 size-4" />
                    心愿单
                  </Button>
                  <Button type="button" variant="outline" className="relative rounded-full border-[#d8d4ca] bg-white px-4 py-2.5 text-sm font-medium text-[#111111] hover:bg-[#f3f1eb]" onClick={handlers.handleNavigateToCart}>
                    <span className="relative mr-2 inline-flex">
                      <ShoppingCart className="size-4" />
                      <span className="absolute -right-2 -top-2 flex min-w-[18px] items-center justify-center rounded-full bg-[#d93535] px-1 text-[10px] font-semibold leading-4 text-white">
                        {cartBadgeCount}
                      </span>
                    </span>
                    购物车
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-[1680px] flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row xl:px-10" data-controller-name="左侧导航与内容区">
        <aside className="w-full shrink-0 lg:w-[320px]" data-controller-name="左侧一体化导航栏">
          <div className="rounded-[32px] bg-white p-5 shadow-[0_18px_50px_-40px_rgba(0,0,0,0.45)] lg:sticky lg:top-6">

            <section className="mt-5 space-y-5" data-controller-name="左侧关键词导航模块">
              <nav className="flex flex-wrap gap-2">
                {leftNavKeywordGroups.map((group, index) => <button key={group.group_id} type="button" className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${activeLeftNavGroupId === group.group_id ? 'border-[#111111] bg-[#111111] text-white' : 'border-[#ddd6c8] bg-[#faf8f3] text-[#5f5a52] hover:border-[#111111] hover:bg-white'}`} onClick={() => handlers.handleSelectLeftNavGroup(group.group_id)}>
                    {group.group_name}
                  </button>)}
              </nav>

              <div className="space-y-2">
                {leftNavKeywords.length > 0 ? leftNavKeywords.map((item, index) => <button key={item.keyword_id} type="button" className="flex w-full items-center justify-between rounded-[22px] border border-transparent bg-[#faf8f3] px-4 py-3 text-left text-sm font-medium text-[#1f1f1f] transition hover:border-[#111111] hover:bg-white" onClick={() => handlers.handleSelectKeyword(item)}>
                    <span>{renderKeywordLabel(item)}</span>
                    <ChevronRight className="size-4 opacity-60" />
                  </button>) : <div className="rounded-[24px] border border-dashed border-[#ddd6c8] bg-[#faf8f3] px-4 py-6 text-center text-sm text-[#7a756c]">
                    当前分组暂无可用关键词
                  </div>}
              </div>

              <section data-controller-name="左侧分类浏览模块">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold tracking-[0.12em] text-[#111111]">分类浏览</h3>
                  <span className="text-xs text-[#7a756c]">{categories.length} 个目录</span>
                </div>
                <nav className="space-y-2">
                  {categories.map((category, index) => {
                  const isExpanded = expandedCategoryIds.includes(category.category_id);
                  const isActive = queryState.categoryId === category.category_id || category.children.some(child => child.category_id === queryState.categoryId);
                  const canToggleChildren = category.display_config.allowChildrenCollapse && category.children.length > 0;
                  return <div key={category.category_id} className="rounded-[24px] border border-transparent bg-[#faf8f3] p-2">
                        <div className="flex items-center gap-2">
                          <button type="button" className={`flex flex-1 items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium transition-colors ${isActive ? 'bg-[#111111] text-white' : 'text-[#1f1f1f] hover:bg-[#f1eee7]'}`} onClick={() => handlers.handleSelectCategory(category.category_id)}>
                            <span>{category.category_name}</span>
                            <span className={`text-xs ${isActive ? 'text-white/80' : 'text-[#7a756c]'}`}>{category.children.length}</span>
                          </button>
                          {canToggleChildren ? <button type="button" className="flex size-10 items-center justify-center rounded-2xl text-[#5f5a52] transition-colors hover:bg-[#f1eee7]" onClick={() => handlers.handleToggleCategoryChildren(category.category_id)} aria-label={isExpanded ? '收起二级类目' : '展开二级类目'}>
                              {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                            </button> : null}
                        </div>
                        {isExpanded && category.children.length > 0 ? <div className="mt-2 space-y-1 px-2 pb-1">
                            {category.children.map((child, index1) => {
                        const isChildActive = queryState.categoryId === child.category_id;
                        return <button key={child.category_id} type="button" className={`flex w-full items-center justify-between rounded-2xl px-4 py-2.5 text-left text-sm transition-colors ${isChildActive ? 'bg-[#ece7dc] text-[#111111]' : 'text-[#5f5a52] hover:bg-[#f4f1ea]'}`} onClick={() => handlers.handleSelectCategory(child.category_id)}>
                                  <span>{child.category_name}</span>
                                  <ChevronRight className="size-4 opacity-60" />
                                </button>;
                      })}
                          </div> : null}
                      </div>;
                })}
                </nav>
              </section>
            </section>
          </div>
        </aside>

        <div className="min-w-0 flex-1 space-y-8" data-controller-name="右侧横幅与热门搜索区">
          <section className="rounded-[36px] bg-white px-4 py-4 shadow-[0_18px_55px_-42px_rgba(0,0,0,0.4)] sm:px-6 sm:py-6 lg:px-8" data-controller-name="首页横幅轮播区">
            {activeBanner ? <div className="space-y-5">
                <div className="relative overflow-hidden rounded-[32px] bg-[#d9d2c3]">
                  <button type="button" className="group relative block h-[360px] w-full overflow-hidden bg-[#ddd7ca] sm:h-[460px] lg:h-[520px]" onClick={() => handlers.handleBannerClick(activeBanner)}>
                    <EditableImg propKey={`category-poster-${activeBanner.poster_id}`} keywords={activeBanner.image_url || activeBanner.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,17,17,0.62),rgba(17,17,17,0.14))]" />
                    <div className="absolute inset-y-0 left-0 flex max-w-[76%] flex-col items-start justify-center gap-4 px-6 text-left text-white sm:px-10 lg:max-w-[58%] lg:px-12">
                      <span className="rounded-full border border-white/25 bg-white/12 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] backdrop-blur-sm">
                        Latest Drop
                      </span>
                      <div className="space-y-3">
                        <h3 className="text-[clamp(28px,4vw,48px)] font-black uppercase tracking-[0.14em] leading-tight">{activeBanner.title}</h3>
                        {activeBanner.subtitle ? <p className="max-w-[520px] text-sm leading-6 text-white/85 sm:text-base">{activeBanner.subtitle}</p> : null}
                      </div>
                      <div className="inline-flex items-center rounded-full bg-white px-5 py-2 text-sm font-semibold tracking-[0.08em] text-[#111111] shadow-[0_10px_30px_-20px_rgba(0,0,0,0.55)]">
                        {renderBannerHrefLabel(activeBanner)}
                      </div>
                    </div>
                  </button>

                  <button type="button" className="absolute left-4 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/88 text-[#111111] shadow-[0_12px_30px_-20px_rgba(0,0,0,0.45)] transition hover:bg-white" onClick={() => handlers.handleBannerChange(activeBannerIndex - 1)} aria-label="上一张横幅">
                    <ChevronLeft className="size-5" />
                  </button>
                  <button type="button" className="absolute right-4 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/88 text-[#111111] shadow-[0_12px_30px_-20px_rgba(0,0,0,0.45)] transition hover:bg-white" onClick={() => handlers.handleBannerChange(activeBannerIndex + 1)} aria-label="下一张横幅">
                    <ChevronRightIcon className="size-5" />
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2">
                  {posters.map((banner, index) => <button key={banner.poster_id} type="button" className={`h-2.5 rounded-full transition-all ${index === activeBannerIndex ? 'w-8 bg-[#111111]' : 'w-2.5 bg-[#d2cbbd] hover:bg-[#b9b19f]'}`} onClick={() => handlers.handleBannerChange(index)} aria-label={`切换到第 ${index + 1} 张横幅`} />)}
                </div>
              </div> : <div className="flex min-h-[360px] items-center justify-center rounded-[32px] bg-[#f1eee8] text-sm text-[#7a756c] sm:min-h-[420px] lg:min-h-[480px]">
                暂无可展示横幅
              </div>}
          </section>

          <section className="space-y-5" data-controller-name="推荐关键词楼层区">
            {recommendationFloors.length > 0 ? recommendationFloors.map((floor, index) => <div key={floor.group_id} className="rounded-[40px] bg-white p-4 shadow-[0_18px_55px_-42px_rgba(0,0,0,0.4)] sm:p-6" data-controller-name="推荐关键词楼层卡片">
                <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-full bg-[#111111] text-white">
                      <Flame className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b8477]">Floor {index + 1}</p>
                      <h2 className="mt-1 text-[26px] font-semibold tracking-[0.12em] text-[#111111]">{floor.group_name}</h2>
                      <p className="mt-1 text-sm text-[#6f6a62]">当前楼层按独立分组展示推荐关键词，点击即可进入对应分类。</p>
                    </div>
                  </div>
                  <div className="rounded-full border border-[#e6e0d5] bg-[#faf8f3] px-4 py-2 text-sm font-medium text-[#5f5a52]">
                    {floor.keywords.length} 个关键词
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {floor.keywords.map((item, index1) => <button key={item.keyword_id} type="button" className="group flex min-h-[88px] flex-col items-start justify-between rounded-[28px] border border-[#ece7dc] bg-[#faf8f3] px-5 py-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#111111] hover:bg-white" onClick={() => handlers.handleSelectKeyword(item)}>
                      <span className="text-base font-semibold text-[#111111] transition-colors group-hover:text-black">{renderKeywordLabel(item)}</span>
                      <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium uppercase tracking-[0.14em] text-[#7a756c] group-hover:text-[#111111]">
                        查看分类
                        <ChevronRight className="size-3.5" />
                      </span>
                    </button>)}
                </div>
              </div>) : <div className="rounded-[30px] border border-dashed border-[#ddd6c8] bg-[#faf8f3] px-6 py-12 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#ebe7de] text-[#111111]">
                  <Flame className="size-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[#111111]">暂无推荐关键词</h3>
                <p className="mt-2 text-sm text-[#7a756c]">当前专区暂无可用推荐内容，后续接入后台分组后将自动展示。</p>
              </div>}
          </section>
        </div>
      </section>
    </main>;
};
export default ProductCategoryView;
