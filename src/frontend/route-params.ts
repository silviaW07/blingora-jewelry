/**
 * 路由参数工具文件 (Frontend)
 *
 * 核心目标：统一所有页面的 URL 参数解析和跳转方法，标注参数的数据库来源，防止跨页面传错 ID。
 */

export interface AppRouterInstance {
  push: (href: string) => void;
  replace: (href: string) => void;
  back: () => void;
}

export interface ParamMeta {
  source_table: string;
  source_column: string;
  description: string;
}

function buildUrl(path: string, params: Record<string, string>): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) sp.set(k, v);
  });
  const query = sp.toString();
  // 禁止附带 hash，避免进入页面后被锚点拉到底部
  const cleanPath = path.split('#')[0];
  return query ? `${cleanPath}?${query}` : cleanPath;
}

// ================================================================
// F01 首页 — 无入参
// ================================================================
export const Home = {
  id: 'F01',
  path: '/home',
  paramsMeta: {} as Record<string, ParamMeta>,
  getParams: (_sp: URLSearchParams) => ({}),
  navigateTo: (router: AppRouterInstance) => router.push(Home.path)
}

// ================================================================
// F02 商品分类页 — 入参: categoryId, stockStatus, sortBy, page, minPrice, maxPrice, search, brandCategoryId
// ================================================================
export const ProductCategory = {
  id: 'F02',
  path: '/',
  paramsMeta: {
    categoryId: {
      source_table: 'category',
      source_column: 'id',
      description: '分类ID',
    },
    stockStatus: {
      source_table: 'productsku',
      source_column: 'stockStatus',
      description: '库存状态 (IN_STOCK/LOW_STOCK/OUT_OF_STOCK)',
    },
    sortBy: {
      source_table: '',
      source_column: '',
      description: '排序方式 (上新时间/价格升序/价格降序/热度排序)',
    },
    page: {
      source_table: '',
      source_column: '',
      description: '分页页码',
    },
    minPrice: {
      source_table: '',
      source_column: '',
      description: '价格区间最小值',
    },
    maxPrice: {
      source_table: '',
      source_column: '',
      description: '价格区间最大值',
    },
    search: {
      source_table: 'product / productsku',
      source_column: 'name / skuCode',
      description: '商品标题或 SKU 模糊搜索词',
    },
    brandCategoryId: {
      source_table: 'category',
      source_column: 'id',
      description: '品牌类目 ID（快捷筛选）',
    },
  },
  getParams: (() => {
    const cache = new WeakMap<URLSearchParams, { categoryId: string; stockStatus: string; sortBy: string; page: string; minPrice: string; maxPrice: string; search: string; brandCategoryId: string }>();
    return (sp: URLSearchParams) => {
      if (cache.has(sp)) return cache.get(sp)!;
      const result = {
        categoryId: sp.get('categoryId') || '',
        stockStatus: sp.get('stockStatus') || '',
        sortBy: sp.get('sortBy') || '',
        page: sp.get('page') || '',
        minPrice: sp.get('minPrice') || '',
        maxPrice: sp.get('maxPrice') || '',
        search: sp.get('search') || '',
        brandCategoryId: sp.get('brandCategoryId') || '',
      };
      cache.set(sp, result);
      return result;
    };
  })(),
  navigateToDefault: (router: AppRouterInstance) =>
    router.push(ProductCategory.path),
  navigateToCategory: (
    router: AppRouterInstance,
    params: { categoryId: string; categorySlug?: string | null },
  ) => {
    const slug = String(params.categorySlug || '').trim()
    // 去掉首尾斜杠，避免 /category//foo 或 slug 自带路径前缀
    const normalizedSlug = slug.replace(/^\/+|\/+$/g, '')
    if (normalizedSlug) {
      router.push(`/category/${encodeURIComponent(normalizedSlug)}`)
      return
    }
    // 无 slug 时不要把 id 塞进 /category/[slug]（会导致「未找到对应分类」）
    const categoryId = String(params.categoryId || '').trim()
    if (!categoryId) {
      router.push(ProductCategory.path)
      return
    }
    router.push(buildUrl(ProductCategory.path, { categoryId }))
  },
  navigateToFiltered: (router: AppRouterInstance, params: { categoryId: string; stockStatus: string; sortBy: string; page: string }) =>
    router.push(buildUrl(ProductCategory.path, params)),
}

// ================================================================
// F03 商品详情页 — 入参: productId, slug
// ================================================================
export const ProductDetail = {
  id: 'F03',
  path: '/productdetail',
  paramsMeta: {
    productId: {
      source_table: 'product',
      source_column: 'id',
      description: '商品唯一标识',
    },
    slug: {
      source_table: 'product',
      source_column: 'slug',
      description: '商品URL别名',
    },
  },
  getParams: (() => {
    const cache = new WeakMap<URLSearchParams, { productId: string; slug: string; }>();
    return (sp: URLSearchParams) => {
      if (cache.has(sp)) return cache.get(sp)!;
      const result = {
        productId: sp.get('productId') || '',
        slug: sp.get('slug') || '',
      };
      cache.set(sp, result);
      return result;
    };
  })(),
  navigateToById: (_router: AppRouterInstance, params: { productId: string }) => {
    const productId = (params.productId || '').trim()
    if (!productId) return
    const href = `/productdetail/?productId=${encodeURIComponent(productId)}`
    if (typeof window !== 'undefined') {
      window.location.assign(href)
      return
    }
    _router.push(href)
  },
  navigateToBySlug: (router: AppRouterInstance, params: { slug: string }) => {
    const slug = (params.slug || '').trim()
    if (!slug) return
    router.push(buildUrl(ProductDetail.path, { slug }).split('#')[0])
  },
}

// ================================================================
// F04 购物车页 — 无入参
// ================================================================
export const Cart = {
  id: 'F04',
  path: '/cart',
  paramsMeta: {} as Record<string, ParamMeta>,
  getParams: (_sp: URLSearchParams) => ({}),
  navigateTo: (router: AppRouterInstance) => router.push(Cart.path)
}

// ================================================================
// F04b 结算页（地址 + 物流）— 无入参
// ================================================================
export const Checkout = {
  id: 'F04b',
  path: '/checkout',
  paramsMeta: {} as Record<string, ParamMeta>,
  getParams: (_sp: URLSearchParams) => ({}),
  navigateTo: (router: AppRouterInstance) => router.push(Checkout.path),
}

// ================================================================
// F02c 移动端分类浏览 — 无入参
// ================================================================
export const MobileCategories = {
  id: 'F02c',
  path: '/categories',
  paramsMeta: {} as Record<string, ParamMeta>,
  getParams: (_sp: URLSearchParams) => ({}),
  navigateTo: (router: AppRouterInstance) => router.push(MobileCategories.path),
}

// ================================================================
// F02d 移动端品牌浏览 — 无入参
// ================================================================
export const MobileBrand = {
  id: 'F02d',
  path: '/brand',
  paramsMeta: {} as Record<string, ParamMeta>,
  getParams: (_sp: URLSearchParams) => ({}),
  navigateTo: (router: AppRouterInstance) => router.push(MobileBrand.path),
}

export const MobileComing = {
  ...MobileBrand,
  id: 'F02e',
  path: '/coming',
  navigateTo: (router: AppRouterInstance) => router.push('/coming'),
}


// ================================================================
// F05 前台登录页 — 入参: returnTo
// ================================================================
export const CustomerLogin = {
  id: 'F05',
  path: '/customerlogin',
  paramsMeta: {
    returnTo: {
      source_table: '',
      source_column: '',
      description: '登录成功后需要跳转回的目标页面路径',
    },
  },
  getParams: (() => {
    const cache = new WeakMap<URLSearchParams, { returnTo: string; }>();
    return (sp: URLSearchParams) => {
      if (cache.has(sp)) return cache.get(sp)!;
      const result = {
        returnTo: sp.get('returnTo') || '',
      };
      cache.set(sp, result);
      return result;
    };
  })(),
  navigateToDefault: (router: AppRouterInstance) =>
    router.push(CustomerLogin.path),
  navigateToWithReturn: (router: AppRouterInstance, params: { returnTo: string }) =>
    router.push(buildUrl(CustomerLogin.path, params)),
}

// ================================================================
// F06 前台注册页 — 入参: returnTo
// ================================================================
export const CustomerRegister = {
  id: 'F06',
  path: '/customerregister',
  paramsMeta: {
    returnTo: {
      source_table: '',
      source_column: '',
      description: '注册成功并登录后需要返回的页面路径',
    },
  },
  getParams: (() => {
    const cache = new WeakMap<URLSearchParams, { returnTo: string; }>();
    return (sp: URLSearchParams) => {
      if (cache.has(sp)) return cache.get(sp)!;
      const result = {
        returnTo: sp.get('returnTo') || '',
      };
      cache.set(sp, result);
      return result;
    };
  })(),
  navigateToDefault: (router: AppRouterInstance) =>
    router.push(CustomerRegister.path),
  navigateToWithReturn: (router: AppRouterInstance, params: { returnTo: string }) =>
    router.push(buildUrl(CustomerRegister.path, params)),
}

// ================================================================
// F07 客户个人中心 — 子路由: profile / orders / addresses
// ================================================================
export const AccountProfile = {
  id: 'F07',
  path: '/account/profile',
  paramsMeta: {} as Record<string, ParamMeta>,
  getParams: (_sp: URLSearchParams) => ({}),
  navigateTo: (router: AppRouterInstance) => router.push('/account/profile/'),
}

export const AccountOrders = {
  id: 'F08',
  path: '/account/orders',
  paramsMeta: {} as Record<string, ParamMeta>,
  getParams: (_sp: URLSearchParams) => ({}),
  navigateTo: (router: AppRouterInstance) => router.push('/account/orders/'),
}

export const AccountOrderDetail = {
  id: 'F08D',
  path: '/account/orders/detail',
  paramsMeta: {
    orderId: {
      source_table: 'orderrecord',
      source_column: 'id',
      description: '当前客户订单唯一标识',
    },
  },
  getParams: (sp: URLSearchParams) => ({
    orderId: sp.get('orderId') || '',
  }),
  navigateTo: (router: AppRouterInstance, params: { orderId: string }) => {
    const orderId = (params.orderId || '').trim()
    if (!orderId) return
    router.push(buildUrl(AccountOrderDetail.path, { orderId }))
  },
}

/** F08P 订单支付页 — 占位路由，供 PayPal 等后续接入 */
export const AccountOrderPay = {
  id: 'F08P',
  path: '/account/orders/pay',
  paramsMeta: {
    orderId: {
      source_table: 'orderrecord',
      source_column: 'id',
      description: '待支付订单唯一标识',
    },
  },
  getParams: (sp: URLSearchParams) => ({
    orderId: sp.get('orderId') || '',
  }),
  navigateTo: (router: AppRouterInstance, params: { orderId: string }) => {
    const orderId = (params.orderId || '').trim()
    if (!orderId) return
    router.push(buildUrl(AccountOrderPay.path, { orderId }))
  },
}

export const AccountAddresses = {
  id: 'F09',
  path: '/account/addresses',
  paramsMeta: {} as Record<string, ParamMeta>,
  getParams: (_sp: URLSearchParams) => ({}),
  navigateTo: (router: AppRouterInstance) => router.push('/account/addresses/'),
}

/** F15 心愿单 / Love — 本地收藏商品列表 */
export const Wishlist = {
  id: 'F15',
  path: '/wishlist',
  paramsMeta: {} as Record<string, ParamMeta>,
  getParams: (_sp: URLSearchParams) => ({}),
  navigateTo: (router: AppRouterInstance) => router.push('/wishlist/'),
}

export const AccountCenter = {
  id: 'F07',
  path: '/account',
  paramsMeta: {} as Record<string, ParamMeta>,
  getParams: (_sp: URLSearchParams) => ({}),
  navigateTo: (router: AppRouterInstance) => router.push('/account/profile/'),
  navigateToOrders: (router: AppRouterInstance) => router.push('/account/orders/'),
  navigateToAddresses: (router: AppRouterInstance) => router.push('/account/addresses/'),
  navigateToProfile: (router: AppRouterInstance) => router.push('/account/profile/'),
  navigateToWishlist: (router: AppRouterInstance) => router.push('/wishlist/'),
}

// ================================================================
// F10 首页推荐专区列表页 — 静态路由: /zone?zoneId=...
// ================================================================
export const RecommendZone = {
  id: 'F10',
  path: '/zone',
  paramsMeta: {
    zoneId: {
      source_table: 'homeRecommendZone',
      source_column: 'id',
      description: '首页推荐专区唯一标识',
    },
  },
  getParams: (() => {
    const cache = new WeakMap<URLSearchParams, { zoneId: string }>()
    return (sp: URLSearchParams) => {
      if (cache.has(sp)) return cache.get(sp)!
      const result = {
        zoneId: sp.get('zoneId') || '',
      }
      cache.set(sp, result)
      return result
    }
  })(),
  navigateTo: (router: AppRouterInstance, params: { zoneId: string }) => {
    const zoneId = (params.zoneId || '').trim()
    if (!zoneId) return
    router.push(buildUrl(RecommendZone.path, { zoneId }))
  },
}

export const ShippingInfo = {
  id: 'F11',
  path: '/shipping',
  paramsMeta: {} as Record<string, ParamMeta>,
  getParams: (_sp: URLSearchParams) => ({}),
  navigateTo: (router: AppRouterInstance) => router.push(ShippingInfo.path),
}

export const PaymentInfo = {
  id: 'F12',
  path: '/payment',
  paramsMeta: {} as Record<string, ParamMeta>,
  getParams: (_sp: URLSearchParams) => ({}),
  navigateTo: (router: AppRouterInstance) => router.push(PaymentInfo.path),
}

export const BuyerShowInfo = {
  id: 'F13',
  path: '/buyer-show',
  paramsMeta: {} as Record<string, ParamMeta>,
  getParams: (_sp: URLSearchParams) => ({}),
  navigateTo: (router: AppRouterInstance) => router.push(BuyerShowInfo.path),
}

export const WhyChooseUsInfo = {
  id: 'F14',
  path: '/why-choose-us',
  paramsMeta: {} as Record<string, ParamMeta>,
  getParams: (_sp: URLSearchParams) => ({}),
  navigateTo: (router: AppRouterInstance) => router.push(WhyChooseUsInfo.path),
}

// ================================================================
// end
// ================================================================

export const FrontendRoutes = {
  Home,
  ProductCategory,
  ProductDetail,
  Cart,
  CustomerLogin,
  CustomerRegister,
  AccountCenter,
  AccountProfile,
  AccountOrders,
  AccountOrderDetail,
  AccountOrderPay,
  AccountAddresses,
  Wishlist,
  RecommendZone,
  ShippingInfo,
  PaymentInfo,
  BuyerShowInfo,
  WhyChooseUsInfo,
};

export const NAVIGATION_MAP: Record<string, string[]> = {
  'F01': ['F02', 'F03', 'F05', 'F06'],
  'F02': ['F03', 'F05'],
  'F03': ['F04', 'F05'],
  'F04': ['F02'],
  'F05': ['F01', 'F06'],
  'F06': ['F05'],
  'F07': ['F08', 'F09', 'F15'],
  'F08': ['F07', 'F08D', 'F08P'],
  'F08D': ['F08'],
  'F08P': ['F08'],
  'F09': ['F07', 'F15'],
  'F10': ['F03', 'F04', 'F05'],
  'F11': ['F01'],
  'F12': ['F01'],
  'F13': ['F01'],
  'F14': ['F01'],
  'F15': ['F01', 'F03'],
};

export const PAGE_ID_MAP: Record<string, string> = {
  'F01': 'Home',
  'F02': 'ProductCategory',
  'F03': 'ProductDetail',
  'F04': 'Cart',
  'F05': 'CustomerLogin',
  'F06': 'CustomerRegister',
  'F07': 'AccountProfile',
  'F08': 'AccountOrders',
  'F08D': 'AccountOrderDetail',
  'F08P': 'AccountOrderPay',
  'F09': 'AccountAddresses',
  'F10': 'RecommendZone',
  'F11': 'ShippingInfo',
  'F12': 'PaymentInfo',
  'F13': 'BuyerShowInfo',
  'F14': 'WhyChooseUsInfo',
  'F15': 'Wishlist',
};

/**
 * 传入页面 ID 或名称，从 route-params.ts 源文件中提取：
 *   1. 当前页面的 export const 代码块
 *   2. 当前页面所有跳转目标的 export const 代码块
 *
 * 返回的字符串可直接作为下游 AI prompt 的入参。
 * 支持 ID（F10）或名称（PaperCompose / papercompose），大小写不敏感。
 *
 * @example
 *   const text = getRouteContextText('F10', fileContent)
 *   const text = getRouteContextText('papercompose', fileContent)
 *   // 返回：PaperCompose + PaperList
 */
export function getRouteContextText(
  pageIdOrName: string,
  fileContent: string
): string {
  // 支持 ID（F10）或名称（PaperCompose），大小写不敏感
  let pageId = pageIdOrName
  let currentName = PAGE_ID_MAP[pageId]


  if (!currentName) {
    // 按名称查找（大小写不敏感）
    const lowerInput = pageIdOrName.toLowerCase()
    const entry = Object.entries(PAGE_ID_MAP).find(
      ([, name]) => name.toLowerCase() === lowerInput
    )
    if (entry) {
      pageId = entry[0]
      currentName = entry[1]
    }
  }


  if (!currentName) return `// 错误：未找到页面 ${pageIdOrName}`


  const targetIds = NAVIGATION_MAP[pageId] || []
  const targetNames = targetIds.map((id) => PAGE_ID_MAP[id]).filter(Boolean)


  // 按 "// ====" 分隔符切分文件为代码块
  const lines = fileContent.split('\n')
  const blocks: Record<string, string> = {}
  let currentBlock: string[] = []
  let currentBlockName = ''


  for (const line of lines) {
    if (line.startsWith('// ====')) {
      if (currentBlockName && currentBlock.length > 0) {
        blocks[currentBlockName] = currentBlock.join('\n').trim()
      }
      currentBlock = [line]
      currentBlockName = ''
      continue
    }
    const exportMatch = line.match(/^export const (\w+)\s*=/)
    if (exportMatch && !currentBlockName) {
      currentBlockName = exportMatch[1]
    }
    currentBlock.push(line)
  }
  if (currentBlockName && currentBlock.length > 0) {
    blocks[currentBlockName] = currentBlock.join('\n').trim()
  }


  function getBlock(name: string): string {
    return blocks[name] || `// 未找到 ${name} 的定义`
  }


  const parts: string[] = []
  parts.push('// ★★★ 当前页面 ★★★')
  parts.push(getBlock(currentName))
  if (targetNames.length > 0) {
    parts.push('// ★★★ 跳转目标页面（当前页面会 navigateTo 以下页面）★★★')
    for (const name of targetNames) {
      parts.push(getBlock(name))
    }
  }
  return parts.join('\n\n')
}
