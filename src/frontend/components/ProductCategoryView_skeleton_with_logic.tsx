'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ProductCategory, ProductDetail, CustomerLogin } from '@/frontend/route-params';
import { useUserSession } from '@/tools/FrontendSession';
import type { StockStatusEnum, SortByEnum, CategoryItem, CategoryDetail, ProductItem } from '@/frontend/actions/ProductCategory';
import { getCategoryList, getCategoryDetail, getProductList, addToCart } from '@/frontend/actions/ProductCategory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// ===== 枚举映射 =====
const STOCK_STATUS_LABELS: Record<StockStatusEnum, string> = {
  IN_STOCK: '现货 (In Stock)',
  LOW_STOCK: '库存告急 (Low Stock)',
  OUT_OF_STOCK: '缺货 (Out of Stock)'
};
const SORT_BY_LABELS: Record<SortByEnum, string> = {
  NEWEST: '上新时间 (Newest)',
  PRICE_ASC: '价格升序 (Price: Low to High)',
  PRICE_DESC: '价格降序 (Price: High to Low)',
  POPULARITY: '热度排序 (Popularity)'
};
export default function ProductCategoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeParams = useMemo(() => ProductCategory.getParams(searchParams), [searchParams]);
  const {
    role
  } = useUserSession();

  // ===== State =====

  // 查询状态 (包含所有筛选、排序、分页)
  const [queryState, setQueryState] = useState({
    categoryId: routeParams.categoryId || '',
    stockStatus: (routeParams.stockStatus ? routeParams.stockStatus.split(',') : []) as StockStatusEnum[],
    sortBy: routeParams.sortBy as SortByEnum || 'NEWEST',
    page: routeParams.page ? parseInt(routeParams.page) : 1,
    pageSize: 24,
    minPrice: routeParams.minPrice ? parseFloat(routeParams.minPrice) : undefined,
    maxPrice: routeParams.maxPrice ? parseFloat(routeParams.maxPrice) : undefined,
    hasDiscount: false,
    minRating: undefined as number | undefined
  });

  // 价格区间的受控输入状态 (应用前仅更新此状态)
  const [priceInput, setPriceInput] = useState({
    min: routeParams.minPrice || '',
    max: routeParams.maxPrice || ''
  });

  // 数据状态
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [categoryDetail, setCategoryDetail] = useState<CategoryDetail | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // 页面状态
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // ===== Effects =====

  // 1. 初始加载分类列表
  useEffect(() => {
    setIsLoadingCategories(true);
    getCategoryList().then(res => setCategories(res.list)).catch(err => toast.error(err.message)).finally(() => setIsLoadingCategories(false));
  }, []);

  // 2. 根据当前的 categoryId 加载该分类详情（用于 Hero Section）
  useEffect(() => {
    if (queryState.categoryId) {
      getCategoryDetail({
        category_id: queryState.categoryId
      }).then(res => setCategoryDetail(res.detail)).catch(err => toast.error(err.message));
    } else {
      setCategoryDetail(null);
    }
  }, [queryState.categoryId]);

  // 3. 依赖查询状态的变化，加载商品列表
  const memoizedStockStatus = useMemo(() => queryState.stockStatus.join(','), [queryState.stockStatus]);
  useEffect(() => {
    setIsLoadingProducts(true);
    getProductList({
      category_id: queryState.categoryId || undefined,
      stock_status: queryState.stockStatus.length > 0 ? queryState.stockStatus : undefined,
      sort_by: queryState.sortBy,
      page: queryState.page,
      page_size: queryState.pageSize,
      min_price: queryState.minPrice,
      max_price: queryState.maxPrice,
      has_discount: queryState.hasDiscount,
      min_rating: queryState.minRating
    }).then(res => {
      setProducts(res.list);
      setTotalCount(res.total);
    }).catch(err => toast.error(err.message)).finally(() => setIsLoadingProducts(false));
  }, [queryState.categoryId, memoizedStockStatus, queryState.sortBy, queryState.page, queryState.pageSize, queryState.minPrice, queryState.maxPrice, queryState.hasDiscount, queryState.minRating]);

  // ===== Handlers =====

  // 通用筛选条件更新 (会导致 page 重置为 1)
  const handleFilterChange = useCallback(<K extends keyof typeof queryState,>(field: K, value: typeof queryState[K]) => {
    setQueryState(prev => {
      const newPage = field === 'page' ? value as number : 1;
      return {
        ...prev,
        [field]: value,
        page: newPage
      };
    });
  }, []);

  // 一键重置所有条件
  const handleClearAllFilters = useCallback(() => {
    setQueryState(prev => ({
      ...prev,
      categoryId: '',
      stockStatus: [],
      sortBy: 'NEWEST',
      page: 1,
      minPrice: undefined,
      maxPrice: undefined,
      hasDiscount: false,
      minRating: undefined
    }));
    setPriceInput({
      min: '',
      max: ''
    });
  }, []);

  // 价格区间输入 (仅本地态)
  const handlePriceInputChange = (field: 'min' | 'max', value: string) => {
    setPriceInput(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 价格区间确认 (合并至查询态)
  const handleApplyPriceRange = () => {
    const minVal = parseFloat(priceInput.min);
    const maxVal = parseFloat(priceInput.max);
    setQueryState(prev => ({
      ...prev,
      page: 1,
      minPrice: isNaN(minVal) ? undefined : minVal,
      maxPrice: isNaN(maxVal) ? undefined : maxVal
    }));
  };

  // 库存状态选择
  const handleStockStatusToggle = (status: StockStatusEnum, checked: boolean) => {
    const current = queryState.stockStatus;
    if (checked) {
      handleFilterChange('stockStatus', [...current, status]);
    } else {
      handleFilterChange('stockStatus', current.filter(s => s !== status));
    }
  };

  // 评分条件选择
  const handleRatingChange = (val: string) => {
    const num = val === 'ALL' ? undefined : parseInt(val);
    handleFilterChange('minRating', num);
  };

  // 点击加购按钮
  const handleAddToCart = async (item: ProductItem) => {
    if (role !== 'CUSTOMER') {
      CustomerLogin.navigateToWithReturn(router, {
        returnTo: ProductCategory.path
      });
      return;
    }
    if (item.sku_count > 1) {
      ProductDetail.navigateToById(router, {
        productId: item.product_id
      });
      return;
    }
    if (item.stock_status === 'OUT_OF_STOCK') {
      toast.error('该商品已缺货');
      return;
    }
    try {
      await addToCart({
        product_id: item.product_id,
        product_sku_id: item.first_sku_id,
        quantity: 1
      });
      toast.success('已成功加入购物车');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // ===== Render =====
  const totalPages = Math.max(1, Math.ceil(totalCount / queryState.pageSize));
  return <main data-api-unique-id='productcategoryview-skeleton-with-logic-r6f0c4c636ccc7191-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>
      {/* 1. Hero Section (分类标题与说明) */}
      <header data-api-unique-id='productcategoryview-skeleton-with-logic-rb470b16034336449-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>
        {categoryDetail ? <div data-api-unique-id='productcategoryview-skeleton-with-logic-re1ef03468e546987-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>
            <h1 data-api-unique-id='productcategoryview-skeleton-with-logic-r7437e52b4b948d30-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>{categoryDetail.category_name}</h1>
            {categoryDetail.category_description && <p data-api-unique-id='productcategoryview-skeleton-with-logic-r7abd3a7c22dd7e35-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>{categoryDetail.category_description}</p>}
            <p data-api-unique-id='productcategoryview-skeleton-with-logic-rcaccbec0dc15ed39-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>Displaying {categoryDetail.product_count} Verified Products</p>
          </div> : <div data-api-unique-id='productcategoryview-skeleton-with-logic-r7c87c0328f185824-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>
            <h1 data-api-unique-id='productcategoryview-skeleton-with-logic-r87f8d5208edd19c5-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>Global Industrial Equipment & Components</h1>
            <p data-api-unique-id='productcategoryview-skeleton-with-logic-r33f4fc6fca4cdd60-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>
              Engineered for precision. Sourced globally for enterprise-grade reliability and seamless
              integration into high-demand workflows.
            </p>
            <p data-api-unique-id='productcategoryview-skeleton-with-logic-red6d985aa3470b21-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>Displaying {totalCount} Verified Products</p>
          </div>}
      </header>

      <div data-api-unique-id='productcategoryview-skeleton-with-logic-r82d65e1d0312f05a-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>
        {/* 2. 主体左侧：高密度筛选模块 */}
        <aside data-api-unique-id='productcategoryview-skeleton-with-logic-re48ab03bdd996993-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>
          <div data-api-unique-id='productcategoryview-skeleton-with-logic-rb968d6fd7753e859-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>
            <h2 data-api-unique-id='productcategoryview-skeleton-with-logic-r48480cf13f84eda6-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>Filters</h2>
            <Button variant="ghost" onClick={handleClearAllFilters} data-api-unique-id='productcategoryview-skeleton-with-logic-rc1e2c83706e03867-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>
              Clear All
            </Button>
          </div>

          <section data-api-unique-id='productcategoryview-skeleton-with-logic-r2fb7b73a6e1368a9-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>
            <h3 data-api-unique-id='productcategoryview-skeleton-with-logic-rb2ee96095362b9f7-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>Categories</h3>
            {isLoadingCategories ? <p data-api-unique-id='productcategoryview-skeleton-with-logic-r7cde04bc3b96542e-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>Loading categories...</p> : categories.length === 0 ? <p data-api-unique-id='productcategoryview-skeleton-with-logic-rf84b634d54e13388-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>No categories found.</p> : <ul data-api-unique-id='productcategoryview-skeleton-with-logic-ra5f40428f4e8ddfd-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>
                <li data-api-unique-id='productcategoryview-skeleton-with-logic-r19cf45dacd823e63-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>
                  <Button variant={queryState.categoryId === '' ? 'default' : 'outline'} onClick={() => handleFilterChange('categoryId', '')} data-api-unique-id='productcategoryview-skeleton-with-logic-r28319c9fac164338-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>
                    All Categories
                  </Button>
                </li>
                {categories.map((cat, index) => <li key={cat.category_id} data-api-unique-id='productcategoryview-skeleton-with-logic-r475bb83bddd34206-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic' data-api-in-loop='1'>
                    <Button variant={queryState.categoryId === cat.category_id ? 'default' : 'outline'} onClick={() => handleFilterChange('categoryId', cat.category_id)} data-api-unique-id='productcategoryview-skeleton-with-logic-r8b5d47bea22837bc-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`categories-${index}-category_name`} data-api-map-var-name='cat'>
                      {cat.category_name}
                    </Button>
                  </li>)}
              </ul>}
          </section>

          <section data-api-unique-id='productcategoryview-skeleton-with-logic-r9919344ec276d26d-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>
            <h3 data-api-unique-id='productcategoryview-skeleton-with-logic-r2d8a155bd17855fe-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>Price Range</h3>
            <div data-api-unique-id='productcategoryview-skeleton-with-logic-r5446faa7c7261aa4-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>
              <Input type="number" placeholder="Min ($)" value={priceInput.min} onChange={e => handlePriceInputChange('min', e.target.value)} data-api-unique-id='productcategoryview-skeleton-with-logic-r2adb91c2d130b369-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic' />
              <span data-api-unique-id='productcategoryview-skeleton-with-logic-r3a6df2d8d35ac25f-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>-</span>
              <Input type="number" placeholder="Max ($)" value={priceInput.max} onChange={e => handlePriceInputChange('max', e.target.value)} data-api-unique-id='productcategoryview-skeleton-with-logic-rf317bf6ab7dd4c7f-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic' />
            </div>
            <Button onClick={handleApplyPriceRange} data-api-unique-id='productcategoryview-skeleton-with-logic-re2dedb38f2ad9f03-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>Apply</Button>
          </section>

          <section data-api-unique-id='productcategoryview-skeleton-with-logic-rffe584e915e2a419-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>
            <h3 data-api-unique-id='productcategoryview-skeleton-with-logic-r680a7ffa02ad69f6-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>Stock Status</h3>
            <ul data-api-unique-id='productcategoryview-skeleton-with-logic-rc23082da8a24ba76-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>
              {(Object.keys(STOCK_STATUS_LABELS) as StockStatusEnum[]).map((status, index) => <li key={status} data-api-unique-id='productcategoryview-skeleton-with-logic-rc3acc660328d69d3-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic' data-api-in-loop='1'>
                  <Checkbox id={`stock-${status}`} checked={queryState.stockStatus.includes(status)} onCheckedChange={checked => handleStockStatusToggle(status, !!checked)} data-api-unique-id='productcategoryview-skeleton-with-logic-r06cb6e2af2bc2627-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic' data-api-in-loop='1' />
                  <Label htmlFor={`stock-${status}`} data-api-unique-id='productcategoryview-skeleton-with-logic-r1a6d442eac938e2a-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic' data-api-in-loop='1'>{STOCK_STATUS_LABELS[status]}</Label>
                </li>)}
            </ul>
          </section>

          <section data-api-unique-id='productcategoryview-skeleton-with-logic-r064fc201e921168d-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>
            <h3 data-api-unique-id='productcategoryview-skeleton-with-logic-rf94873fe28d28561-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>Other Filters</h3>
            <div data-api-unique-id='productcategoryview-skeleton-with-logic-r6b7e078066a4ffcd-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>
              <Switch id="discount-switch" checked={queryState.hasDiscount} onCheckedChange={val => handleFilterChange('hasDiscount', val)} data-api-unique-id='productcategoryview-skeleton-with-logic-rc287d500cf4186d4-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic' />
              <Label htmlFor="discount-switch" data-api-unique-id='productcategoryview-skeleton-with-logic-rc4819af5f81d46a7-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>Only show items with discount</Label>
            </div>
            <div data-api-unique-id='productcategoryview-skeleton-with-logic-r2623e844007bcd3c-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>
              <Label data-api-unique-id='productcategoryview-skeleton-with-logic-r5cb6eb78848ccef2-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>Minimum Rating</Label>
              <Select value={queryState.minRating ? queryState.minRating.toString() : 'ALL'} onValueChange={handleRatingChange} data-api-unique-id='productcategoryview-skeleton-with-logic-r3b2685c87ab881c9-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>
                <SelectTrigger data-api-unique-id='productcategoryview-skeleton-with-logic-rf4876787ebd5f416-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>
                  <SelectValue placeholder="Select Rating" data-api-unique-id='productcategoryview-skeleton-with-logic-rd5bd6a00ac68177f-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic' />
                </SelectTrigger>
                <SelectContent data-api-unique-id='productcategoryview-skeleton-with-logic-r9125ede5686b008f-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>
                  <SelectItem value="ALL" data-api-unique-id='productcategoryview-skeleton-with-logic-r28072320f51b4991-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>All Ratings</SelectItem>
                  <SelectItem value="4" data-api-unique-id='productcategoryview-skeleton-with-logic-r845fb8ad7880fe3b-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>4 Stars & Up</SelectItem>
                  <SelectItem value="3" data-api-unique-id='productcategoryview-skeleton-with-logic-r8468d61bcf5a465f-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>3 Stars & Up</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>
        </aside>

        {/* 3. 主体右侧：排序与视图控制区 + 商品列表 */}
        <section data-api-unique-id='productcategoryview-skeleton-with-logic-rb43d1ad7730a41bf-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>
          {/* 排序控制区 */}
          <header data-api-unique-id='productcategoryview-skeleton-with-logic-r210148394d54970a-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>
            <p data-api-unique-id='productcategoryview-skeleton-with-logic-rb02661b23692e4ce-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>
              Showing {(queryState.page - 1) * queryState.pageSize + 1} -{' '}
              {Math.min(queryState.page * queryState.pageSize, totalCount)} of {totalCount} products
            </p>
            <Select value={queryState.sortBy} onValueChange={val => handleFilterChange('sortBy', val as SortByEnum)} data-api-unique-id='productcategoryview-skeleton-with-logic-r50ad029739dafb80-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>
              <SelectTrigger data-api-unique-id='productcategoryview-skeleton-with-logic-r7847af9d655993b6-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>
                <SelectValue placeholder="Sort By" data-api-unique-id='productcategoryview-skeleton-with-logic-red8afb8aa285ad69-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic' />
              </SelectTrigger>
              <SelectContent data-api-unique-id='productcategoryview-skeleton-with-logic-r51391c517988b0d2-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>
                {(Object.entries(SORT_BY_LABELS) as [SortByEnum, string][]).map(([val, label], index) => <SelectItem key={val} value={val} data-api-unique-id='productcategoryview-skeleton-with-logic-rfb6af4f2d1296b44-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic' data-api-in-loop='1'>
                    {label}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </header>

          {/* 商品网格区 */}
          <div data-api-unique-id='productcategoryview-skeleton-with-logic-r7c61c2582fc97f70-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>
            {isLoadingProducts ? <p data-api-unique-id='productcategoryview-skeleton-with-logic-re127161ee2d4b64a-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>Loading products...</p> : products.length === 0 ? <section data-api-unique-id='productcategoryview-skeleton-with-logic-r6a8a093de1456168-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>
                <h2 data-api-unique-id='productcategoryview-skeleton-with-logic-r0f28b4e69f7163b1-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>No products found</h2>
                <p data-api-unique-id='productcategoryview-skeleton-with-logic-r5da3f81f5b057301-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>Try adjusting your filters or category selection.</p>
                <Button onClick={handleClearAllFilters} data-api-unique-id='productcategoryview-skeleton-with-logic-r40ac1d2782864a3c-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>Clear All Filters</Button>
              </section> : <ul data-api-unique-id='productcategoryview-skeleton-with-logic-rd05f75f73061b469-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>
                {products.map((item, index) => <li key={item.product_id} data-api-unique-id='productcategoryview-skeleton-with-logic-r44513fb22774fdc3-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic' data-api-in-loop='1'>
                    <article data-api-unique-id='productcategoryview-skeleton-with-logic-r0ccbf6723fb0ed44-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic' data-api-in-loop='1'>
                      <div onClick={() => ProductDetail.navigateToById(router, {
                  productId: item.product_id
                })} data-api-unique-id='productcategoryview-skeleton-with-logic-r32ec1e70b6891f1f-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic' data-api-in-loop='1'>
                        <img src={item.main_image_url} alt={item.product_name} data-api-unique-id='productcategoryview-skeleton-with-logic-r02e97446d4791943-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic' data-api-in-loop='1' />
                        {item.has_discount && <span data-api-unique-id='productcategoryview-skeleton-with-logic-rf96694840589a4f5-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic' data-api-in-loop='1'>Discount</span>}
                        {item.stock_status === 'LOW_STOCK' && <span data-api-unique-id='productcategoryview-skeleton-with-logic-r93fbdabcafcb4e30-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic' data-api-in-loop='1'>Low Stock</span>}
                      </div>

                      <div data-api-unique-id='productcategoryview-skeleton-with-logic-ra2487bfc950ead58-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic' data-api-in-loop='1'>
                        <p data-api-unique-id='productcategoryview-skeleton-with-logic-r9d217e4d1caee5fb-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`products-${index}-rating_count`} data-api-map-var-name='item'>★ {item.rating_average.toFixed(1)} ({item.rating_count})</p>
                        <h3 onClick={() => ProductDetail.navigateToById(router, {
                    productId: item.product_id
                  })} data-api-unique-id='productcategoryview-skeleton-with-logic-rfa5a36303468071c-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`products-${index}-product_name`} data-api-map-var-name='item'>
                          {item.product_name}
                        </h3>
                        {item.short_description && <p data-api-unique-id='productcategoryview-skeleton-with-logic-r1144e02aa2488a0d-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`products-${index}-short_description`} data-api-map-var-name='item'>{item.short_description}</p>}
                      </div>

                      <div data-api-unique-id='productcategoryview-skeleton-with-logic-raca3d97aca3944be-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic' data-api-in-loop='1'>
                        <div data-api-unique-id='productcategoryview-skeleton-with-logic-ref0f86a106ae59c2-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic' data-api-in-loop='1'>
                          <strong data-api-unique-id='productcategoryview-skeleton-with-logic-r2ec7b09329090e66-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic' data-api-in-loop='1'>${item.price.toFixed(2)}</strong>
                          {item.has_discount && item.original_price && <del data-api-unique-id='productcategoryview-skeleton-with-logic-r247e4380ef83a23d-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic' data-api-in-loop='1'>${item.original_price.toFixed(2)}</del>}
                        </div>
                        <p data-api-unique-id='productcategoryview-skeleton-with-logic-r86dcd35cb41beee9-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic' data-api-in-loop='1'>{STOCK_STATUS_LABELS[item.stock_status]}</p>
                      </div>

                      <Button disabled={item.stock_status === 'OUT_OF_STOCK'} onClick={() => handleAddToCart(item)} data-api-unique-id='productcategoryview-skeleton-with-logic-r24628a9d8f84ab0e-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic' data-api-in-loop='1'>
                        {item.sku_count > 1 ? 'Select Options' : 'Add to Cart'}
                      </Button>
                    </article>
                  </li>)}
              </ul>}
          </div>

          {/* 分页控制区 */}
          {!isLoadingProducts && products.length > 0 && <nav data-api-unique-id='productcategoryview-skeleton-with-logic-r189d879e59b7bc68-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>
              <Button variant="outline" disabled={queryState.page <= 1} onClick={() => handleFilterChange('page', queryState.page - 1)} data-api-unique-id='productcategoryview-skeleton-with-logic-r62a8406d1d3d9460-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>
                Previous
              </Button>
              <span data-api-unique-id='productcategoryview-skeleton-with-logic-rddd4cb0b53c11d02-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>
                Page {queryState.page} of {totalPages}
              </span>
              <Button variant="outline" disabled={queryState.page >= totalPages} onClick={() => handleFilterChange('page', queryState.page + 1)} data-api-unique-id='productcategoryview-skeleton-with-logic-r426185a959f6f11b-s3862225275' data-api-unique-page-name='src/frontend/components/ProductCategoryView_skeleton_with_logic'>
                Next
              </Button>
            </nav>}
        </section>
      </div>
    </main>;
}