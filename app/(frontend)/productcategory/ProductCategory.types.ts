'use server'

// ===== Enums =====

/** 
 * 库存状态：现货(IN_STOCK) | 库存告急(LOW_STOCK) | 缺货(OUT_OF_STOCK) 
 */
export type StockStatusEnum = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'

/** 
 * 排序方式：上新时间(NEWEST) | 价格升序(PRICE_ASC) | 价格降序(PRICE_DESC) | 热度排序(POPULARITY) 
 */
export type SortByEnum = 'NEWEST' | 'PRICE_ASC' | 'PRICE_DESC' | 'POPULARITY'

// ===== Data Structures =====

export interface CategoryItem {
  category_id: string          // data-from: category-id
  category_name: string        // data-from: category-name
  category_slug: string        // data-from: category-slug
}

export interface CategoryDetail {
  category_id: string          // data-from: category-id
  category_name: string        // data-from: category-name
  category_description: string | null // data-from: category-description
  product_count: number        // aggregated
}

export interface ProductItem {
  product_id: string           // data-from: product-id
  product_slug: string         // data-from: product-slug
  product_name: string         // data-from: product-name
  main_image_url: string       // data-from: product-mainImageUrl
  short_description: string | null // data-from: product-shortDescription
  rating_average: number       // data-from: product-ratingAverage
  rating_count: number         // data-from: product-ratingCount
  stock_status: StockStatusEnum // aggregated
  price: number                // aggregated (minimum sku price)
  original_price: number | null // aggregated (original price of the minimum sku)
  has_discount: boolean        // aggregated (original_price > price)
  sku_count: number            // aggregated
  first_sku_id: string         // aggregated (id of the minimum sku, used for direct add-to-cart)
  created_at_timestamp: number // aggregated (used for NEWEST sorting)
  sort_weight: number          // data-from: product-sortWeight (used for POPULARITY sorting)
}

// ===== Input / Output =====

export interface GetCategoryListOutput {
  list: CategoryItem[]
}

export interface GetCategoryDetailInput {
  category_id: string
}

export interface GetCategoryDetailOutput {
  detail: CategoryDetail | null
}

export interface GetProductListInput {
  category_id?: string
  stock_status?: StockStatusEnum[]
  sort_by?: SortByEnum
  page?: number
  page_size?: number
  min_price?: number
  max_price?: number
  has_discount?: boolean
  min_rating?: number
}

export interface GetProductListOutput {
  list: ProductItem[]
  total: number
}

export interface AddToCartInput {
  product_id: string
  product_sku_id: string
  quantity: number
}

export interface AddToCartOutput {
  success: boolean
}

// ===== Imports =====
import prisma from '@/tools/prisma'
import {
  requireAuth, requireRole, getAuthContext, tryGetAuthContext,
  withResult, hashPassword, signToken, UserRole
} from '@/frontend/action_utils'

// ===== Actions =====

/**
 * 获取活跃分类列表（用于导航、分类树展示）
 */
export const getCategoryList = withResult(async (): Promise<GetCategoryListOutput> => {
  const categories = await prisma.category.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { sortWeight: 'desc' }
  })

  return {
    list: categories.map(cat => ({
      category_id: cat.id,
      category_name: cat.name,
      category_slug: cat.slug
    }))
  }
})

/**
 * 获取特定分类详情与该分类下的有效商品数（用于分类标题区展示）
 */
export const getCategoryDetail = withResult(async (input: GetCategoryDetailInput): Promise<GetCategoryDetailOutput> => {
  const category = await prisma.category.findUnique({
    where: { id: input.category_id, status: 'ACTIVE' }
  })

  if (!category) {
    return { detail: null }
  }

  const productCount = await prisma.product.count({
    where: {
      categoryId: input.category_id,
      status: 'ACTIVE',
      category: { status: 'ACTIVE' }
    }
  })

  return {
    detail: {
      category_id: category.id,
      category_name: category.name,
      category_description: category.description,
      product_count: productCount
    }
  }
})

/**
 * 获取商品列表，支持多重条件筛选、排序和分页。
 * 由于涉及到跨层级的多条件（包括基于动态提取的SKU展示价格）与排序需求，
 * 采用数据库预筛选 + 内存精确过滤与排序的混合模式确保功能的绝对可靠。
 */
export const getProductList = withResult(async (input: GetProductListInput): Promise<GetProductListOutput> => {
  const page = input.page && input.page > 0 ? input.page : 1
  const pageSize = input.page_size && input.page_size > 0 ? input.page_size : 24

  // 1. 构建数据库层的基础 where 条件
  const dbWhere: any = {
    status: 'ACTIVE',
    category: { status: 'ACTIVE' }
  }
  
  if (input.category_id) {
    dbWhere.categoryId = input.category_id
  }
  
  if (input.min_rating !== undefined) {
    dbWhere.ratingAverage = { gte: input.min_rating }
  }

  // 为避免提取过多数据影响性能，此处限制最大查询基数 2000
  // 对于具有大量数据的电商平台，此处应利用冗余字段如 minPrice 依托 DB 层实现。
  const dbProducts = await prisma.product.findMany({
    where: dbWhere,
    include: { skus: true },
    take: 2000 
  })

  // 2. 将数据映射为统一的 ProductItem 结构
  let items: ProductItem[] = dbProducts.map(p => {
    const skus = p.skus
    const skuCount = skus.length
    
    // 寻找用来代表该商品的"最低价 SKU"
    const sortedSkus = [...skus].sort((a, b) => a.price.toNumber() - b.price.toNumber())
    const defaultSku = sortedSkus.length > 0 ? sortedSkus[0] : null
    
    // 综合判断库存状态 (只要有至少一个在售算 IN_STOCK)
    let stockStatus: StockStatusEnum = 'OUT_OF_STOCK'
    if (skus.some(s => s.stockStatus === 'IN_STOCK')) {
      stockStatus = 'IN_STOCK'
    } else if (skus.some(s => s.stockStatus === 'LOW_STOCK')) {
      stockStatus = 'LOW_STOCK'
    }

    const priceNum = defaultSku ? defaultSku.price.toNumber() : 0
    const originalPriceNum = (defaultSku && defaultSku.originalPrice) ? defaultSku.originalPrice.toNumber() : null
    const hasDiscount = originalPriceNum !== null && originalPriceNum > priceNum

    return {
      product_id: p.id,
      product_slug: p.slug,
      product_name: p.name,
      main_image_url: p.mainImageUrl,
      short_description: p.shortDescription,
      rating_average: p.ratingAverage,
      rating_count: p.ratingCount,
      stock_status: stockStatus,
      price: priceNum,
      original_price: originalPriceNum,
      has_discount: hasDiscount,
      sku_count: skuCount,
      first_sku_id: defaultSku ? defaultSku.id : '',
      created_at_timestamp: p.createdAt.getTime(),
      sort_weight: p.sortWeight
    }
  })

  // 3. 在内存中进行高层过滤（价格区间、库存状态集、折扣标签）
  if (input.min_price !== undefined) {
    items = items.filter(i => i.price >= input.min_price!)
  }
  
  if (input.max_price !== undefined) {
    items = items.filter(i => i.price <= input.max_price!)
  }
  
  if (input.has_discount) {
    items = items.filter(i => i.has_discount)
  }
  
  if (input.stock_status && input.stock_status.length > 0) {
    items = items.filter(i => input.stock_status!.includes(i.stock_status))
  }

  // 4. 应用排序
  const sortBy = input.sort_by || 'NEWEST'
  items.sort((a, b) => {
    switch (sortBy) {
      case 'PRICE_ASC':
        return a.price - b.price
      case 'PRICE_DESC':
        return b.price - a.price
      case 'POPULARITY':
        // 优先使用业务层面的商品热度(sort_weight)，若相同则用购买/评价数(rating_count)
        if (b.sort_weight !== a.sort_weight) return b.sort_weight - a.sort_weight
        return b.rating_count - a.rating_count
      case 'NEWEST':
      default:
        return b.created_at_timestamp - a.created_at_timestamp
    }
  })

  // 5. 分页截取
  const total = items.length
  const skip = (page - 1) * pageSize
  const pagedList = items.slice(skip, skip + pageSize)

  return {
    list: pagedList,
    total
  }
})

/**
 * 将商品加入购物车 (仅限 CUSTOMER，单规格或具体已选规格)
 */
export const addToCart = requireRole([UserRole.CUSTOMER])(
  withResult(async (input: AddToCartInput): Promise<AddToCartOutput> => {
    const { userId } = getAuthContext()

    // 1. 验证商品与分类的有效性
    const product = await prisma.product.findUnique({
      where: { id: input.product_id },
      include: { category: true }
    })

    if (!product || product.status !== 'ACTIVE' || product.category.status !== 'ACTIVE') {
      throw new Error('该商品不存在或已下架')
    }

    // 2. 验证 SKU 有效性与库存
    const sku = await prisma.productsku.findUnique({
      where: { id: input.product_sku_id }
    })

    if (!sku || sku.productId !== input.product_id) {
      throw new Error('请求的商品规格无效')
    }

    if (input.quantity <= 0) {
      throw new Error('加购数量必须大于零')
    }

    if (sku.stock < input.quantity) {
      throw new Error('商品库存不足')
    }

    // 3. 查找或自动创建购物车
    let cart = await prisma.cart.findUnique({
      where: { accountId: userId }
    })

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          account: { connect: { id: userId } }
        }
      })
    }

    // 4. 检查购物车内是否已有该 SKU 记录
    const existingItem = await prisma.cartitem.findUnique({
      where: {
        cartId_productSkuId: {
          cartId: cart.id,
          productSkuId: sku.id
        }
      }
    })

    if (existingItem) {
      // 合并数量并重新校验上限
      const newQuantity = existingItem.quantity + input.quantity
      if (newQuantity > sku.stock) {
        throw new Error('加购后数量超过了当前商品库存上限')
      }
      
      await prisma.cartitem.update({
        where: { id: existingItem.id },
        data: { 
          quantity: newQuantity,
          status: 'VALID' // 更新为业务有效态
        }
      })
    } else {
      // 插入新条目
      await prisma.cartitem.create({
        data: {
          cart: { connect: { id: cart.id } },
          product: { connect: { id: product.id } },
          productSku: { connect: { id: sku.id } },
          quantity: input.quantity,
          status: 'VALID'
        }
      })
    }

    return { success: true }
  })
)
