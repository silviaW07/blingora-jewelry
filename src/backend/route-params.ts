/**
 * 路由参数工具文件 (route-params.ts)
 * 平台：Backend
 * 目标：统一所有页面的 URL 参数解析和跳转方法，标注参数的数据库来源，防止跨页面传错 ID。
 */

import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

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
  return query ? `${path}?${query}` : path;
}

// ================================================================
// B01 后台登录页 — 无入参
// ================================================================
export const AdminLogin = {
  id: 'B01',
  path: '/adminlogin',
  paramsMeta: {} as Record<string, ParamMeta>,
  getParams: (_sp: URLSearchParams) => ({}),
  navigateTo: (router: AppRouterInstance) => router.push(AdminLogin.path),
};

// ================================================================
// B02 后台注册页 — 无入参
// ================================================================
export const AdminRegister = {
  id: 'B02',
  path: '/adminregister',
  paramsMeta: {} as Record<string, ParamMeta>,
  getParams: (_sp: URLSearchParams) => ({}),
  navigateTo: (router: AppRouterInstance) => router.push(AdminRegister.path),
};

// ================================================================
// B03 管理概览 — 无入参
// ================================================================
export const Dashboard = {
  id: 'B03',
  path: '/dashboard',
  paramsMeta: {} as Record<string, ParamMeta>,
  getParams: (_sp: URLSearchParams) => ({}),
  navigateTo: (router: AppRouterInstance) => router.push(Dashboard.path),
};

// ================================================================
// B18 管理员个人设置 — 无入参
// ================================================================
export const AdminProfile = {
  id: 'B18',
  path: '/adminprofile',
  paramsMeta: {} as Record<string, ParamMeta>,
  getParams: (_sp: URLSearchParams) => ({}),
  navigateTo: (router: AppRouterInstance) => router.push(AdminProfile.path),
};

// ================================================================
// B04 商品管理 — 入参: name, categoryId, status, tab
// ================================================================
export const ProductManagement = {
  id: 'B04',
  path: '/productmanagement',
  paramsMeta: {
    name: {
      source_table: 'product',
      source_column: 'name',
      description: '商品名称搜索关键字，映射自 product.name',
    },
    categoryId: {
      source_table: 'category',
      source_column: 'id',
      description: '商品分类筛选，来自 category 表的主键 id',
    },
    status: {
      source_table: 'product',
      source_column: 'status',
      description: '商品状态筛选，映射自 product.status (DRAFT/ACTIVE/INACTIVE)',
    },
    tab: {
      source_table: '',
      source_column: '',
      description: '商品管理页签：products | pending_imports',
    },
  },
  getParams: (() => {
    const cache = new WeakMap<URLSearchParams, { name: string; categoryId: string; status: string; tab: string }>();
    return (sp: URLSearchParams) => {
      if (cache.has(sp)) return cache.get(sp)!;
      const result = {
        name: sp.get('name') || '',
        categoryId: sp.get('categoryId') || '',
        status: sp.get('status') || '',
        tab: sp.get('tab') || '',
      };
      cache.set(sp, result);
      return result;
    };
  })(),
  navigateToAll: (router: AppRouterInstance) => router.push(ProductManagement.path),
  navigateToWithFilters: (router: AppRouterInstance, params: { name: string; categoryId: string; status: string }) =>
    router.push(buildUrl(ProductManagement.path, params)),
  navigateToPendingImports: (router: AppRouterInstance) =>
    router.push(buildUrl(ProductManagement.path, { tab: 'pending_imports' })),
};

// ================================================================
// B05 1688商品导入 — 入参: taskId, mode
// ================================================================
export const ImportFrom1688 = {
  id: 'B05',
  path: '/importfrom1688',
  paramsMeta: {
    taskId: {
      source_table: 'importtask',
      source_column: 'id',
      description: '任务唯一标识，来自 importtask 表的主键 id',
    },
    mode: {
      source_table: '',
      source_column: '',
      description: '创建入口：1688 | table | manual',
    },
  },
  getParams: (() => {
    const cache = new WeakMap<URLSearchParams, { taskId: string; mode: string }>();
    return (sp: URLSearchParams) => {
      if (cache.has(sp)) return cache.get(sp)!;
      const result = {
        taskId: sp.get('taskId') || '',
        mode: sp.get('mode') || '',
      };
      cache.set(sp, result);
      return result;
    };
  })(),
  navigateToMain: (router: AppRouterInstance) => router.push(ImportFrom1688.path),
  navigateToTaskDetail: (router: AppRouterInstance, params: { taskId: string }) =>
    router.push(buildUrl(ImportFrom1688.path, params)),
  navigateToTableImport: (router: AppRouterInstance) =>
    router.push(buildUrl(ImportFrom1688.path, { mode: 'table' })),
};

// ================================================================
// B06 分类管理 — 入参: status, categoryId
// ================================================================
export const CategoryManagement = {
  id: 'B06',
  path: '/categorymanagement',
  paramsMeta: {
    status: {
      source_table: 'category',
      source_column: 'status',
      description: '过滤分类状态，映射自 category.status (ACTIVE/INACTIVE)',
    },
    categoryId: {
      source_table: 'category',
      source_column: 'id',
      description: '指定编辑的分类，来自 category 表的主键 id',
    },
  },
  getParams: (() => {
    const cache = new WeakMap<URLSearchParams, { status: string; categoryId: string }>();
    return (sp: URLSearchParams) => {
      if (cache.has(sp)) return cache.get(sp)!;
      const result = {
        status: sp.get('status') || '',
        categoryId: sp.get('categoryId') || '',
      };
      cache.set(sp, result);
      return result;
    };
  })(),
  navigateToAll: (router: AppRouterInstance) => router.push(CategoryManagement.path),
  navigateToFiltered: (router: AppRouterInstance, params: { status: string }) =>
    router.push(buildUrl(CategoryManagement.path, { status: params.status })),
  navigateToDetail: (router: AppRouterInstance, params: { categoryId: string }) =>
    router.push(buildUrl(CategoryManagement.path, { categoryId: params.categoryId })),
};

// ================================================================
// B07 客户管理 — 入参: account, email, role, status, userId, sortBy, sortOrder
// ================================================================
export const UserManagement = {
  id: 'B07',
  path: '/usermanagement',
  paramsMeta: {
    account: {
      source_table: 'sysuser',
      source_column: 'account',
      description: '账户名搜索，映射自 sysuser.account',
    },
    email: {
      source_table: 'sysuser',
      source_column: 'email',
      description: '邮箱搜索，映射自 sysuser.email',
    },
    role: {
      source_table: 'sysuser',
      source_column: 'role',
      description: '角色筛选，映射自 sysuser.role (CUSTOMER/ADMIN)',
    },
    status: {
      source_table: 'sysuser',
      source_column: 'status',
      description: '状态筛选，映射自 sysuser.status (ACTIVE/DISABLED)',
    },
    userId: {
      source_table: 'sysuser',
      source_column: 'id',
      description: '客户详情页用户 ID',
    },
    sortBy: {
      source_table: 'sysuser',
      source_column: 'createdAt',
      description: '排序字段：createdAt / lastLoginAt / cartUsdTotal',
    },
    sortOrder: {
      source_table: 'sysuser',
      source_column: 'createdAt',
      description: '排序方向：asc / desc',
    },
  },
  getParams: (() => {
    const cache = new WeakMap<
      URLSearchParams,
      {
        account: string
        email: string
        role: string
        status: string
        userId: string
        sortBy: string
        sortOrder: string
      }
    >()
    return (sp: URLSearchParams) => {
      if (cache.has(sp)) return cache.get(sp)!
      const result = {
        account: sp.get('account') || '',
        email: sp.get('email') || '',
        role: sp.get('role') || '',
        status: sp.get('status') || '',
        userId: sp.get('userId') || '',
        sortBy: sp.get('sortBy') || 'createdAt',
        sortOrder: sp.get('sortOrder') || 'desc',
      }
      cache.set(sp, result)
      return result
    }
  })(),
  navigateToDefault: (router: AppRouterInstance) => router.push(UserManagement.path),
  navigateToWithFilters: (
    router: AppRouterInstance,
    params: {
      account?: string
      email?: string
      role?: string
      status?: string
      userId?: string
      sortBy?: string
      sortOrder?: string
    }
  ) => router.push(buildUrl(UserManagement.path, params)),
  navigateToDetail: (router: AppRouterInstance, params: { userId: string }) =>
    router.push(buildUrl(UserManagement.path, { userId: params.userId })),
}

// ================================================================
// B08 Order Management Page — 入参: status, orderId
// ================================================================
export const OrderManagement = {
  id: 'B08',
  path: '/ordermanagement',
  paramsMeta: {
    status: {
      source_table: 'orderrecord',
      source_column: 'status',
      description: '订单状态筛选，如待付款、待发货、运输中等',
    },
    orderId: {
      source_table: 'orderrecord',
      source_column: 'id',
      description: '订单唯一标识，用于查看订单详情',
    },
  } as Record<string, ParamMeta>,
  getParams: (() => {
    const cache = new WeakMap<URLSearchParams, { status: string; orderId: string }>();
    return (sp: URLSearchParams) => {
      if (cache.has(sp)) return cache.get(sp)!;
      const result = {
        status: sp.get('status') || '',
        orderId: sp.get('orderId') || '',
      };
      cache.set(sp, result);
      return result;
    };
  })(),
  navigateToStandard: (router: AppRouterInstance) =>
    router.push(OrderManagement.path),
  navigateToWithParams: (router: AppRouterInstance, params: { status: string; orderId: string }) =>
    router.push(buildUrl(OrderManagement.path, params)),
};

// ================================================================
// B14 Banner Management Page — 无入参
// ================================================================
export const BannerManagement = {
  id: 'B14',
  path: '/bannermanagement',
  paramsMeta: {} as Record<string, ParamMeta>,
  getParams: (_sp: URLSearchParams) => ({}),
  navigateTo: (router: AppRouterInstance) => router.push(BannerManagement.path),
};

// ================================================================
// B15 Home Recommend Zone Management Page — 无入参
// ================================================================
export const HomeRecommendZoneManagement = {
  id: 'B15',
  path: '/homerecommendzonemanagement',
  paramsMeta: {} as Record<string, ParamMeta>,
  getParams: (_sp: URLSearchParams) => ({}),
  navigateTo: (router: AppRouterInstance) => router.push(HomeRecommendZoneManagement.path),
};

// ================================================================
// B16 Shipping Channel Config Page — 无入参
// ================================================================
export const ShippingChannelConfig = {
  id: 'B16',
  path: '/shippingchannelconfig',
  paramsMeta: {} as Record<string, ParamMeta>,
  getParams: (_sp: URLSearchParams) => ({}),
  navigateTo: (router: AppRouterInstance) => router.push(ShippingChannelConfig.path),
};

// ================================================================


// ================================================================


// ================================================================


// ================================================================
// end
// ================================================================

export const BackendRoutes = {
  AdminLogin,
  AdminRegister,
  Dashboard,
  ProductManagement,
  ImportFrom1688,
  CategoryManagement,
  UserManagement,
  OrderManagement,
  BannerManagement,
  HomeRecommendZoneManagement,
  ShippingChannelConfig,
};

export const NAVIGATION_MAP: Record<string, string[]> = {
  'B01': ['B03', 'B02'],
  'B02': ['B01'],
  'B03': ['B04', 'B05', 'B06', 'B07', 'B08', 'B14', 'B15', 'B16'],
  'B04': [],
  'B05': [],
  'B06': [],
  'B07': [],
  'B08': ['B07'], // OrderManagement,
  'B14': ['B12', 'B06'], // BannerManagement,
  'B15': [], // HomeRecommendZoneManagement
  'B16': [], // ShippingChannelConfig
};

export const PAGE_ID_MAP: Record<string, string> = {
  'B01': 'AdminLogin',
  'B02': 'AdminRegister',
  'B03': 'Dashboard',
  'B04': 'ProductManagement',
  'B05': 'ImportFrom1688',
  'B06': 'CategoryManagement',
  'B07': 'UserManagement',
  'B08': 'OrderManagement',
  'B14': 'BannerManagement',
  'B15': 'HomeRecommendZoneManagement',
  'B16': 'ShippingChannelConfig',
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
  let pageId = pageIdOrName;
  let currentName = PAGE_ID_MAP[pageId];

  if (!currentName) {
    // 按名称查找（大小写不敏感）
    const lowerInput = pageIdOrName.toLowerCase();
    const entry = Object.entries(PAGE_ID_MAP).find(
      ([, name]) => name.toLowerCase() === lowerInput
    );
    if (entry) {
      pageId = entry[0];
      currentName = entry[1];
    }
  }

  if (!currentName) return `// 错误：未找到页面 ${pageIdOrName}`;

  const targetIds = NAVIGATION_MAP[pageId] || [];
  const targetNames = targetIds.map((id) => PAGE_ID_MAP[id]).filter(Boolean);

  // 按 "// ====" 分隔符切分文件为代码块
  const lines = fileContent.split('\n');
  const blocks: Record<string, string> = {};
  let currentBlock: string[] = [];
  let currentBlockName = '';

  for (const line of lines) {
    if (line.startsWith('// ====')) {
      if (currentBlockName && currentBlock.length > 0) {
        blocks[currentBlockName] = currentBlock.join('\n').trim();
      }
      currentBlock = [line];
      currentBlockName = '';
      continue;
    }
    const exportMatch = line.match(/^export const (\w+)\s*=/);
    if (exportMatch && !currentBlockName) {
      currentBlockName = exportMatch[1];
    }
    currentBlock.push(line);
  }
  if (currentBlockName && currentBlock.length > 0) {
    blocks[currentBlockName] = currentBlock.join('\n').trim();
  }

  function getBlock(name: string): string {
    return blocks[name] || `// 未找到 ${name} 的定义`;
  }

  const parts: string[] = [];
  parts.push('// ★★★ 当前页面 ★★★');
  parts.push(getBlock(currentName));
  if (targetNames.length > 0) {
    parts.push('// ★★★ 跳转目标页面（当前页面会 navigateTo 以下页面）★★★');
    for (const name of targetNames) {
      parts.push(getBlock(name));
    }
  }
  return parts.join('\n\n');
}
