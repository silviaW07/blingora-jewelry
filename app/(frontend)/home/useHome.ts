'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import type {
  Home_AddCartInput,
  Home_BrandShelfItem,
  Home_CategoryGuideItem,
  Home_FeaturedProductItem,
  Home_ReviewItem,
  Home_ReviewSummary,
  HomeSceneKeywordGroup,
} from '@/frontend/actions/Home';
import {
  addCartItem,
  getBrandShelf,
  getHomeCategoryGuide,
  getHomeFeaturedProducts,
  getHomeReviewSection,
  getHomeSceneKeywordGroups,
} from '@/frontend/actions/Home';
import {
  ProductCategory,
  ProductDetail,
  CustomerLogin,
  CustomerRegister,
} from '@/frontend/route-params';
import { useUserSession } from '@/tools/FrontendSession';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export interface UseHomeState {
  featuredProducts: Home_FeaturedProductItem[];
  categories: Home_CategoryGuideItem[];
  selectedCategoryId: string;
  selectedCategory: Home_CategoryGuideItem | null;
  brandShelf: Array<{
    brandName: string;
    items: Home_BrandShelfItem[];
  }>;
  visibleBrandRows: number;
  reviewSummary: Home_ReviewSummary | null;
  reviews: Home_ReviewItem[];
  homepageKeywordFloors: HomeSceneKeywordGroup[];
  isLoading: boolean;
  isAddingToCart: boolean;
  errorMsg: string;
}

export interface UseHomeHandlers {
  handleShopNowClick: (router: AppRouterInstance) => void;
  handleRegisterClick: (router: AppRouterInstance) => void;
  handleProductClick: (router: AppRouterInstance, productId: string, slug?: string) => void;
  handleQuickAddCart: (router: AppRouterInstance, productId: string, defaultSkuId: string) => Promise<void>;
  handleCategoryClick: (router: AppRouterInstance, categoryId: string) => void;
  handleCategoryTabChange: (categoryId: string) => void;
  handleBrandMoreClick: (router: AppRouterInstance) => void;
  handleBrandClick: (router: AppRouterInstance, brandName: string, brandCategoryId?: string | null) => void;
  handleKeywordClick: (router: AppRouterInstance, keyword: string, floorLink?: string | null) => void;
}

const DEFAULT_VISIBLE_BRAND_ROWS = 3;
const BRAND_COLUMNS_PER_ROW = 4;

export function useHome() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const session = useUserSession();

  const [featuredProducts, setFeaturedProducts] = useState<Home_FeaturedProductItem[]>([]);
  const [categories, setCategories] = useState<Home_CategoryGuideItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [brandShelf, setBrandShelf] = useState<Array<{ brandName: string; items: Home_BrandShelfItem[] }>>([]);
  const [reviewSummary, setReviewSummary] = useState<Home_ReviewSummary | null>(null);
  const [reviews, setReviews] = useState<Home_ReviewItem[]>([]);
  const [homepageKeywordFloors, setHomepageKeywordFloors] = useState<HomeSceneKeywordGroup[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAddingToCart, setIsAddingToCart] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const selectedCategory = useMemo(
    () => categories.find((item) => item.categoryId === selectedCategoryId) || null,
    [categories, selectedCategoryId],
  );

  const visibleBrandRows = useMemo(() => {
    if (brandShelf.length <= BRAND_COLUMNS_PER_ROW * DEFAULT_VISIBLE_BRAND_ROWS) {
      return Math.ceil(brandShelf.length / BRAND_COLUMNS_PER_ROW);
    }

    return DEFAULT_VISIBLE_BRAND_ROWS;
  }, [brandShelf]);

  const fetchCategoryGuide = useCallback(async () => {
    const result = await getHomeCategoryGuide();
    const sortedCategories = [...result.categories].sort((a, b) => {
      if (b.navSortWeight !== a.navSortWeight) {
        return b.navSortWeight - a.navSortWeight;
      }
      return a.categoryName.localeCompare(b.categoryName);
    });

    setCategories(sortedCategories);
    setSelectedCategoryId((prev) => {
      if (prev && sortedCategories.some((item) => item.categoryId === prev)) {
        return prev;
      }
      return sortedCategories[0]?.categoryId || '';
    });
  }, []);

  const fetchReviewSection = useCallback(async () => {
    const reviewResult = await getHomeReviewSection();
    setReviewSummary(reviewResult.summary);
    setReviews(reviewResult.reviews);
  }, []);

  const fetchFeaturedProducts = useCallback(async () => {
    const featuredResult = await getHomeFeaturedProducts();
    setFeaturedProducts(featuredResult.products);
  }, []);

  const fetchSceneKeywordGroups = useCallback(async () => {
    const sceneResult = await getHomeSceneKeywordGroups();
    setHomepageKeywordFloors(sceneResult.groups);
  }, []);

  const fetchCategoryScopedContent = useCallback(async (categoryId: string) => {
    const brandResult = await getBrandShelf({ categoryId });
    setBrandShelf(brandResult.brands);
  }, []);

  const fetchHomeData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      await Promise.all([
        fetchCategoryGuide(),
        fetchReviewSection(),
        fetchFeaturedProducts(),
        fetchSceneKeywordGroups(),
      ]);
    } catch (error: any) {
      setErrorMsg(error?.message || 'Failed to load home data');
    } finally {
      setIsLoading(false);
    }
  }, [fetchCategoryGuide, fetchFeaturedProducts, fetchReviewSection, fetchSceneKeywordGroups]);

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  useEffect(() => {
    if (!selectedCategoryId) {
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    fetchCategoryScopedContent(selectedCategoryId)
      .catch((error: any) => {
        setErrorMsg(error?.message || 'Failed to load category data');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [selectedCategoryId, fetchCategoryScopedContent]);

  const handleShopNowClick = useCallback((router: AppRouterInstance) => {
    if (selectedCategoryId) {
      ProductCategory.navigateToCategory(router, { categoryId: selectedCategoryId });
      return;
    }

    ProductCategory.navigateToDefault(router);
  }, [selectedCategoryId]);

  const handleRegisterClick = useCallback((router: AppRouterInstance) => {
    CustomerRegister.navigateToWithReturn(router, { returnTo: '/' });
  }, []);

  const handleProductClick = useCallback((router: AppRouterInstance, productId: string, slug?: string) => {
    if (slug) {
      ProductDetail.navigateToBySlug(router, { slug });
      return;
    }

    ProductDetail.navigateToById(router, { productId });
  }, []);

  const handleQuickAddCart = useCallback(async (router: AppRouterInstance, productId: string, defaultSkuId: string) => {
    if (isAddingToCart) return;

    const { token, role } = session;
    if (!token || role !== 'CUSTOMER') {
      const currentParams = searchParams.toString();
      const returnTo = `${pathname}${currentParams ? `?${currentParams}` : ''}`;
      CustomerLogin.navigateToWithReturn(router, { returnTo });
      return;
    }

    setIsAddingToCart(true);
    setErrorMsg('');

    try {
      const payload: Home_AddCartInput = {
        productId,
        productSkuId: defaultSkuId,
      };
      await addCartItem(payload);
      toast.success('Product added to cart successfully!');
    } catch (error: any) {
      const message = error?.message || 'Failed to add to cart';
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setIsAddingToCart(false);
    }
  }, [isAddingToCart, pathname, searchParams, session]);

  const handleCategoryClick = useCallback((router: AppRouterInstance, categoryId: string) => {
    ProductCategory.navigateToCategory(router, { categoryId });
  }, []);

  const handleCategoryTabChange = useCallback((categoryId: string) => {
    setSelectedCategoryId(categoryId);
  }, []);

  const handleBrandMoreClick = useCallback((router: AppRouterInstance) => {
    if (selectedCategoryId) {
      ProductCategory.navigateToCategory(router, { categoryId: selectedCategoryId });
      return;
    }

    ProductCategory.navigateToDefault(router);
  }, [selectedCategoryId]);

  const handleBrandClick = useCallback((router: AppRouterInstance, brandName: string, brandCategoryId?: string | null) => {
    if (brandCategoryId) {
      ProductCategory.navigateToCategory(router, { categoryId: brandCategoryId });
      return;
    }

    const query = new URLSearchParams();
    if (selectedCategoryId) {
      query.set('categoryId', selectedCategoryId);
    }
    query.set('keyword', brandName);
    router.push(`/productcategory?${query.toString()}`);
  }, [selectedCategoryId]);

  const handleKeywordClick = useCallback((router: AppRouterInstance, keyword: string, floorLink?: string | null) => {
    const normalizedFloorLink = floorLink?.trim();
    if (normalizedFloorLink) {
      router.push(normalizedFloorLink);
      return;
    }

    const query = new URLSearchParams();
    if (selectedCategoryId) {
      query.set('categoryId', selectedCategoryId);
    }
    query.set('keyword', keyword);
    router.push(`/productcategory?${query.toString()}`);
  }, [selectedCategoryId]);

  return {
    state: {
      featuredProducts,
      categories,
      selectedCategoryId,
      selectedCategory,
      brandShelf,
      visibleBrandRows,
      reviewSummary,
      reviews,
      homepageKeywordFloors,
      isLoading,
      isAddingToCart,
      errorMsg,
    },
    handlers: {
      handleShopNowClick,
      handleRegisterClick,
      handleProductClick,
      handleQuickAddCart,
      handleCategoryClick,
      handleCategoryTabChange,
      handleBrandMoreClick,
      handleBrandClick,
      handleKeywordClick,
    },
  } satisfies { state: UseHomeState; handlers: UseHomeHandlers };
}
