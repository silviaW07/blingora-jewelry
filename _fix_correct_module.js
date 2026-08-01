const fs = require('fs');

const pcPath = 'D:/clash Ver/AutoCoder.cc/src/frontend/components/ProductCategoryView.tsx';
const homePath = 'D:/clash Ver/AutoCoder.cc/src/frontend/components/HomeView.tsx';
let pc = fs.readFileSync(pcPath, 'utf8');
let home = fs.readFileSync(homePath, 'utf8');

const sidenavBlock = fs.readFileSync('D:/clash Ver/AutoCoder.cc/_pc_sidenav_block.txt', 'utf8');
const bannerOld = fs.readFileSync('D:/clash Ver/AutoCoder.cc/_pc_banner_old.txt', 'utf8');

// Extract category ternary from sidenav block
const catStart = sidenavBlock.indexOf('              {!showProductResults ? <section data-controller-name="左侧分类浏览模块"');
const catEnd = sidenavBlock.indexOf('                </section>}', catStart) + '                </section>}'.length;
if (catStart < 0 || catEnd < catStart) throw new Error('category ternary not found in sidenav block');
const categoryTernary = sidenavBlock.slice(catStart, catEnd);

// Extract banner section only (before floors)
const bannerStart = bannerOld.indexOf('          {!showProductResults ? <section className="rounded-[36px] bg-white');
const bannerEnd = bannerOld.indexOf('          {!showProductResults ? <section className="space-y-5" data-controller-name="推荐关键词楼层区"');
if (bannerStart < 0 || bannerEnd < 0) throw new Error('banner section not found');
const bannerSection = bannerOld.slice(bannerStart, bannerEnd);

// --- ProductCategoryView ---
// 1) imports + helper
pc = pc.replace(
  `import { Camera, Search, Heart, ShoppingCart, ChevronDown, ChevronRight, Flame, Sparkles, Gem, Clock3, UserCircle2, Package, LogOut, SlidersHorizontal, ArrowUpDown, Star, Loader2, BadgePercent, Boxes, Filter, Tag } from 'lucide-react';
import type { ProductCategoryState, ProductCategoryHandlers, ProductCategoryKeywordItem } from '@/frontend/hooks/useProductCategory';
interface Props {
  state: ProductCategoryState;
  handlers: ProductCategoryHandlers;
  afterNavSlot?: React.ReactNode;
}
const renderKeywordLabel = (item: ProductCategoryKeywordItem) => item.keyword_label || '推荐关键词';`,
  `import { Camera, Search, Heart, ShoppingCart, ChevronDown, ChevronRight, ChevronLeft, ChevronRight as ChevronRightIcon, Flame, Sparkles, Gem, Clock3, UserCircle2, Package, LogOut, SlidersHorizontal, ArrowUpDown, Star, Loader2, BadgePercent, Boxes, Filter, Tag } from 'lucide-react';
import type { ProductCategoryState, ProductCategoryHandlers, ProductCategoryBannerItem, ProductCategoryKeywordItem } from '@/frontend/hooks/useProductCategory';
interface Props {
  state: ProductCategoryState;
  handlers: ProductCategoryHandlers;
}
const renderBannerHrefLabel = (banner: ProductCategoryBannerItem) => banner.link_text || 'Discover More';
const renderKeywordLabel = (item: ProductCategoryKeywordItem) => item.keyword_label || '推荐关键词';`
);

pc = pc.replace(
  `export const ProductCategoryView = ({
  state,
  handlers,
  afterNavSlot
}: Props) => {`,
  `export const ProductCategoryView = ({
  state,
  handlers
}: Props) => {`
);

pc = pc.replace(
  `    leftNavKeywordGroups,
    activeLeftNavGroupId,
    leftNavKeywords,
    recommendationFloors,
    activeRecommendationGroupId,
    promotionBanner,`,
  `    leftNavKeywordGroups,
    activeLeftNavGroupId,
    posters,
    leftNavKeywords,
    recommendationFloors,
    activeRecommendationGroupId,
    activeBannerIndex,
    promotionBanner,`
);

pc = pc.replace(
  `  } = state;
  const currentCategoryName =`,
  `  } = state;
  const sideNavZone = state.sideNavZones[0] || null;
  const sideNavItems = sideNavZone?.items || [];
  const activeBanner = posters[activeBannerIndex] || null;
  const currentCategoryName =`
);

// Remove afterNavSlot render
pc = pc.replace('\n      {afterNavSlot}\n\n      <section', '\n      <section');

// Restore always-visible aside
pc = pc.replace(
  '        {showProductResults ? <aside className="w-full shrink-0 lg:w-[320px]" data-controller-name="左侧一体化导航栏"',
  '        <aside className="w-full shrink-0 lg:w-[320px]" data-controller-name="左侧一体化导航栏"'
);
pc = pc.replace(
  "        </aside> : null}\n\n        <div className={cn('min-w-0 flex-1 space-y-6', !showProductResults && 'w-full')} data-controller-name=\"右侧横幅与热门搜索区\"",
  '        </aside>\n\n        <div className="min-w-0 flex-1 space-y-6" data-controller-name="右侧横幅与热门搜索区"'
);

// Replace categories-only with full ternary
const onlyCatStart = pc.indexOf('              <section data-controller-name="左侧分类浏览模块" data-api-unique-id=\'productcategoryview-reb7d5dd17ce76d71-s780999859\'');
const onlyCatEnd = pc.indexOf('                </section>\n            </section>', onlyCatStart);
if (onlyCatStart < 0 || onlyCatEnd < 0) throw new Error('current categories-only block missing');
pc = pc.slice(0, onlyCatStart) + categoryTernary + pc.slice(onlyCatEnd + '                </section>'.length);

// Insert banner before floors
const floorsMarker = '          {!showProductResults ? <section className="space-y-5" data-controller-name="推荐关键词楼层区"';
const floorsIdx = pc.indexOf(floorsMarker);
if (floorsIdx < 0) throw new Error('floors marker missing');
if (!pc.includes('首页横幅轮播区')) {
  pc = pc.slice(0, floorsIdx) + bannerSection + pc.slice(floorsIdx);
}

fs.writeFileSync(pcPath, pc);

// --- HomeView: remove wrong Summer Jewelry module ---
home = home.replace(
  `import { ChevronRight, Package, ShoppingCart, Star, Globe2, ShieldCheck, Headphones, Gift } from 'lucide-react';
import { ProductCategoryView } from '@/frontend/components/ProductCategoryView';
import type { HomeHandlers, HomeState } from '@/frontend/hooks/useHome';
import type {
  HomeRecommendCategoryCard,
  HomeRecommendProductCard,
  HomeRecommendSideNavItem,
  HomeRecommendZoneSection
} from '@/frontend/actions/Home';

interface Props {
  state: HomeState;
  handlers: HomeHandlers;
}

type RecommendSideNavItem = HomeRecommendSideNavItem;
type RecommendProductCard = HomeRecommendProductCard;
type RecommendCategoryCard = HomeRecommendCategoryCard;`,
  `import { Package, ShoppingCart, Star, Globe2, ShieldCheck, Headphones, Gift } from 'lucide-react';
import { ProductCategoryView } from '@/frontend/components/ProductCategoryView';
import type { HomeHandlers, HomeState } from '@/frontend/hooks/useHome';
import type {
  HomeRecommendCategoryCard,
  HomeRecommendProductCard,
  HomeRecommendZoneSection
} from '@/frontend/actions/Home';

interface Props {
  state: HomeState;
  handlers: HomeHandlers;
}

type RecommendProductCard = HomeRecommendProductCard;
type RecommendCategoryCard = HomeRecommendCategoryCard;`
);

const homeViewStart = home.indexOf('const HomeView = ({');
const returnIdx = home.indexOf('  return <>', homeViewStart);
const productCatLine = home.indexOf('<ProductCategoryView', returnIdx);
if (homeViewStart < 0 || returnIdx < 0 || productCatLine < 0) throw new Error('HomeView markers missing');

const newHomeBody = `const HomeView = ({
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
`;

// Keep everything from service benefits onward (first isDefaultHomeState section after ProductCategoryView)
const serviceIdx = home.indexOf("{isDefaultHomeState ? <section className=\"mx-auto w-full max-w-[1680px] px-4 pt-6 sm:px-6 xl:px-10\" data-controller-name=\"首页服务权益条模块\"");
if (serviceIdx < 0) throw new Error('service section missing');
home = home.slice(0, homeViewStart) + newHomeBody + '\n      ' + home.slice(serviceIdx);

fs.writeFileSync(homePath, home);

console.log('done');
console.log('PC has banner', pc.includes('首页横幅轮播区'));
console.log('PC has home sidenav', pc.includes('productcategoryview-rba31c6c28c87ab61'));
console.log('PC afterNav', pc.includes('afterNavSlot'));
console.log('Home Summer', home.includes('Summer Jewelry'));
console.log('Home afterNav', home.includes('afterNavSlot'));
console.log('Home service', home.includes('首页服务权益条模块'));
console.log('Home recommend', home.includes('首页推荐专区模块'));
