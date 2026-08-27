// ===== Enums =====
export type CategoryStatus = 'ACTIVE' | 'INACTIVE';
export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE';
export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
export type ImportTaskStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

// ===== Data Structures =====

export interface AdminProfile_Output {
  // data-from: sysuser-account
  account: string;
  // data-from: sysuser-username
  username: string;
  // data-from: sysuser-email
  email: string;
  // data-from: sysuser-avatarUrl
  avatarUrl: string | null;
}

export interface UpdateAdminProfile_Input {
  username: string;
  avatarUrl?: string;
}

export interface KpiStats_Output {
  // data-from: product-id | 全部商品（含草稿）
  totalProductCount: number;
  // data-from: product-id | 当前前台上架数
  listedProductCount: number;
  weekListedCount: number;
  monthListedCount: number;
  prevWeekListedCount: number;
  prevMonthListedCount: number;
  monthOverMonthPercent: number;
  weekOverWeekPercent: number;
  weekListedDelta: number;
  monthListedDelta: number;
  // data-from: importtask-id | 聚合计算今日任务数
  todayImportCount: number;
  // data-from: productsku-id | 聚合计算低库存数
  lowStockAlertCount: number;
  // data-from: sysuser-id | 聚合计算新注册买家数
  newRegisteredUserCount: number;
  totalCustomerCount: number;
  totalOrderCount: number;
  sources: ListingSourceRow_Output[];
}

export interface ListingSourceRow_Output {
  source: string;
  label: string;
  listedCount: number;
  weekCount: number;
  monthCount: number;
  sharePercent: number;
}

export interface PeriodCount_Output {
  key: string;
  label: string;
  count: number;
}

export interface ListingStatsDetail_Output {
  generatedAt: string;
  listedProductCount: number;
  monthListedCount: number;
  weeks: PeriodCount_Output[];
  months: PeriodCount_Output[];
  sources: ListingSourceRow_Output[];
}

export interface ImportTaskOverview_Output {
  // data-from: importtask-id
  id: string;
  // data-from: importtask-taskName
  taskName: string;
  // data-from: importtask-status
  status: ImportTaskStatus;
  // data-from: importtask-progressPercent
  progressPercent: number;
  // data-from: importtask-createdAt
  createdAt: Date;
}

export interface StockAlert_Output {
  // data-from: productsku-id
  id: string;
  // data-from: productsku-skuCode
  skuCode: string;
  // data-from: product-name
  productName: string;
  // data-from: productsku-stock
  stock: number;
}

export interface RecentProduct_Output {
  // data-from: product-id
  id: string;
  // data-from: product-productCode
  productCode: string;
  // data-from: product-name
  name: string;
  // data-from: category-name
  categoryName: string;
  // data-from: productsku-price
  price: number;
  // data-from: product-status
  status: ProductStatus;
  // data-from: product-mainImageUrl
  mainImageUrl: string;
  // data-from: product-createdAt
  createdAt: Date;
}

export interface RecentUser_Output {
  // data-from: sysuser-id
  id: string;
  // data-from: sysuser-username
  username: string;
  // data-from: sysuser-email
  email: string;
  // data-from: sysuser-avatarUrl
  avatarUrl: string | null;
  // data-from: sysuser-createdAt
  createdAt: Date;
}

export interface ShelfBrandCount_Output {
  id: string;
  name: string;
  slug: string | null;
  count: number;
}

export interface ShelfL2Node_Output {
  id: string;
  name: string;
  slug: string | null;
  count: number;
  emptyBrandCount: number;
  unmatchedBrandCount: number;
  brands: ShelfBrandCount_Output[];
}

export interface ShelfL1Node_Output {
  id: string;
  name: string;
  slug: string | null;
  count: number;
  emptyChildCount: number;
  unmatchedL2Count: number;
  children: ShelfL2Node_Output[];
}

export interface CategoryBrandShelfTree_Output {
  generatedAt: string;
  activeProductCount: number;
  emptyL2Count: number;
  emptyBrandSlotCount: number;
  tree: ShelfL1Node_Output[];
}

// ===== Input =====
export interface RetryTask_Input {
  // data-from: importtask-id
  id: string;
}

// ===== Output =====
// (List/Array structures are returned directly based on above data structures)

// ===== Actions（declare function 签名 + JSDoc）=====

/**
 * @requires: ADMIN
 * @Prisma_Model: sysuser
 * @Description: 获取当前登录的管理员个人信息
 * @Steps:
 *   1. [前置校验]: 从请求上下文中获取当前登录用户 ID
 *   2. [核心查询]: 使用 prisma.sysuser.findUnique 查询当前用户信息，提取 username, email, avatarUrl 等
 *   3. [返回结果]: 组装并返回 AdminProfile_Output 格式数据
 */
declare function getAdminProfile(): Promise<AdminProfile_Output>;

/**
 * @requires: ADMIN
 * @Prisma_Model: sysuser
 * @Description: 更新当前登录管理员的个人资料（姓名、头像）
 */
declare function updateAdminProfile(input: UpdateAdminProfile_Input): Promise<AdminProfile_Output>;

/**
 * @requires: ADMIN
 * @Prisma_Model: product, importtask, productsku, sysuser
 * @Description: 获取仪表盘 KPI 统计卡片数据
 * @Steps:
 *   1. [核心查询]: 
 *      - count prisma.product 获取总商品数
 *      - count prisma.importtask 获取今日创建(createdAt >= 今日0点)的任务数
 *      - count prisma.productsku 获取库存预警(例如 stock <= 10)的数量
 *      - count prisma.sysuser 获取本周注册的 role=CUSTOMER 用户数
 *   2. [返回结果]: 组装并返回 KpiStats_Output
 */
declare function getKpiStats(): Promise<KpiStats_Output>;

/**
 * @requires: ADMIN
 * @Prisma_Model: importtask
 * @Description: 获取最近的 1688 导入任务概览
 * @Steps:
 *   1. [核心查询]: 使用 prisma.importtask.findMany 按 createdAt 降序查询最近 6 条记录
 *   2. [返回结果]: 映射为 ImportTaskOverview_Output 数组并返回
 */
declare function getImportTasksOverview(): Promise<ImportTaskOverview_Output[]>;

/**
 * @requires: ADMIN
 * @Prisma_Model: importtask
 * @Description: 重新尝试失败的导入任务
 * @Steps:
 *   1. [前置校验]: 校验 args.id 对应的任务是否存在，且状态是否为 FAILED
 *   2. [核心操作]: 开启事务，清空任务明细失败原因，更新 importtask 状态为 PENDING，progressPercent 归 0
 *   3. [返回结果]: 返回 void
 */
declare function retryImportTask(input: RetryTask_Input): Promise<void>;

/**
 * @requires: ADMIN
 * @Prisma_Model: productsku
 * @Description: 获取需要预警的库存列表
 * @Steps:
 *   1. [核心查询]: 使用 prisma.productsku.findMany 查询 stock <= 20 (阈值可配置/写死) 且关联的商品处于 ACTIVE 状态的前 10 条记录，同时 include product
 *   2. [数据组装]: 将商品名称和 SKU 编码结合组装成 StockAlert_Output 格式
 *   3. [返回结果]: 返回 StockAlert_Output 数组
 */
declare function getStockAlerts(): Promise<StockAlert_Output[]>;

/**
 * @requires: ADMIN
 * @Prisma_Model: product
 * @Description: 获取最近上架的商品列表
 * @Steps:
 *   1. [核心查询]: 使用 prisma.product.findMany 查询最近创建的 10 条商品记录，include category 和首个 sku (取价格)
 *   2. [数据组装]: 组装包含分类名称、商品主图和首个 SKU 价格的 RecentProduct_Output
 *   3. [返回结果]: 返回 RecentProduct_Output 数组
 */
declare function getRecentProducts(): Promise<RecentProduct_Output[]>;

/**
 * @requires: ADMIN
 * @Prisma_Model: sysuser
 * @Description: 获取最新注册的买家用户列表
 * @Steps:
 *   1. [核心查询]: 使用 prisma.sysuser.findMany 查询 role = CUSTOMER 的最新 8 条记录，按 createdAt 降序排列
 *   2. [返回结果]: 映射为 RecentUser_Output 数组并返回
 */
declare function getRecentUsers(): Promise<RecentUser_Output[]>;

/**
 * @requires: ADMIN
 * @Prisma_Model: category, product, product_category_relations
 * @Description: 前台货架树：一级类目 → 二级类目 → 品牌，统计 ACTIVE 上架商品数，用于补货缺口监控
 */
declare function getCategoryBrandShelfTree(): Promise<CategoryBrandShelfTree_Output>;

/**
 * @requires: ADMIN
 * @Prisma_Model: product
 * @Description: 上架数据详情：近 12 周 / 12 月及上传途径拆分
 */
declare function getListingStatsDetail(): Promise<ListingStatsDetail_Output>;