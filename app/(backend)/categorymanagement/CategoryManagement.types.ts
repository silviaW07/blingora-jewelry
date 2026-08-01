'use server'

// ===== Enums =====
/** 状态：激活(ACTIVE) | 停用(INACTIVE) */
export type CategoryStatus = 'ACTIVE' | 'INACTIVE'

// ===== Data Structures =====
export interface CategoryItem {
  category_id: string          // data-from: category-id
  category_name: string        // data-from: category-name
  category_slug: string        // data-from: category-slug
  image_url: string | null     // data-from: category-imageUrl
  description: string | null   // data-from: category-description
  sort_weight: number          // data-from: category-sortWeight
  status: CategoryStatus       // data-from: category-status
  product_count: number        // aggregated
  created_at: string           // data-from: category-createdAt
  updated_at: string           // data-from: category-updatedAt
}

// ===== Input / Output =====
export interface GetCategoryListInput {
  keyword?: string
  status?: CategoryStatus
  page?: number
  page_size?: number
}

export interface GetCategoryListOutput {
  list: CategoryItem[]
  total: number
}

export interface CreateCategoryInput {
  category_name: string
  category_slug: string
  image_url?: string | null
  description?: string | null
  sort_weight: number
  status: CategoryStatus
}

export interface UpdateCategoryInput {
  category_id: string
  category_name: string
  category_slug: string
  image_url?: string | null
  description?: string | null
  sort_weight: number
  status: CategoryStatus
}

export interface UpdateCategoryStatusInput {
  category_id: string
  status: CategoryStatus
}

export interface UpdateCategorySortWeightInput {
  category_id: string
  sort_weight: number
}

export interface DeleteCategoryInput {
  category_id: string
}

// ===== Imports =====
import prisma from '@/tools/prisma'
import {
  requireRole,
  withResult,
  UserRole
} from '@/backend/action_utils'

// ===== Internal Helpers =====
/**
 * 执行带有领域级联闭环的分类更新
 * 同步更新相关联的购物车条目有效性
 */
async function updateCategoryAndCascade(categoryId: string, updateData: Record<string, any>, newStatus: CategoryStatus) {
  // 1. 查出受影响的商品
  const affectedProducts = await prisma.product.findMany({
    where: { categoryId },
    select: { id: true }
  })
  const productIds = affectedProducts.map(p => p.id)

  // 2. 如果变为激活且有商品，提前查出当前可能需要恢复的购物车条目
  const items = newStatus === 'ACTIVE' && productIds.length > 0 ? await prisma.cartitem.findMany({
    where: { productId: { in: productIds } },
    include: { product: true, productSku: true }
  }) : []

  // 3. 开启事务保证一致性
  await prisma.$transaction(async (tx) => {
    // 3.1 更新分类自身
    await tx.category.update({
      where: { id: categoryId },
      data: updateData
    })

    // 3.2 级联处理购物车有效性
    if (productIds.length === 0) return

    if (newStatus === 'INACTIVE') {
      await tx.cartitem.updateMany({
        where: { productId: { in: productIds } },
        data: { status: 'INVALID' }
      })
    } else if (newStatus === 'ACTIVE') {
      const toValidIds: string[] = []
      const toInvalidIds: string[] = []
      
      for (const item of items) {
        // 商品本身是 ACTIVE 且库存满足加购数量，才能变为 VALID
        const isValid = item.product.status === 'ACTIVE' && item.productSku.stock >= item.quantity
        if (isValid && item.status !== 'VALID') {
          toValidIds.push(item.id)
        } else if (!isValid && item.status !== 'INVALID') {
          toInvalidIds.push(item.id)
        }
      }
      
      if (toValidIds.length > 0) {
        await tx.cartitem.updateMany({
          where: { id: { in: toValidIds } },
          data: { status: 'VALID' }
        })
      }
      if (toInvalidIds.length > 0) {
        await tx.cartitem.updateMany({
          where: { id: { in: toInvalidIds } },
          data: { status: 'INVALID' }
        })
      }
    }
  })
}


// ===== Actions =====

/**
 * 分页获取分类列表
 */
export const getCategoryList = requireRole([UserRole.ADMIN])(
  withResult(async (input: GetCategoryListInput): Promise<GetCategoryListOutput> => {
    const { keyword, status, page = 1, page_size = 20 } = input
    const skip = (page - 1) * page_size
    const take = page_size

    const where: Record<string, any> = {}
    if (keyword) {
      where.name = { contains: keyword }
    }
    if (status) {
      where.status = status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'
    }

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip,
        take,
        orderBy: [
          { sortWeight: 'desc' },
          { createdAt: 'desc' }
        ],
        include: {
          _count: {
            select: { products: true }
          }
        }
      }),
      prisma.category.count({ where })
    ])

    return {
      list: categories.map(c => ({
        category_id: c.id,
        category_name: c.name,
        category_slug: c.slug,
        image_url: c.imageUrl,
        description: c.description,
        sort_weight: c.sortWeight,
        status: c.status as CategoryStatus,
        product_count: c._count.products,
        created_at: c.createdAt.toISOString(),
        updated_at: c.updatedAt.toISOString(),
      })),
      total
    }
  })
)

/**
 * 创建新分类
 */
export const createCategory = requireRole([UserRole.ADMIN])(
  withResult(async (input: CreateCategoryInput): Promise<void> => {
    const { category_name, category_slug, image_url, description, sort_weight, status } = input

    // 唯一性约束检查
    const existName = await prisma.category.findUnique({ where: { name: category_name } })
    if (existName) throw new Error('分类名称已存在')

    const existSlug = await prisma.category.findUnique({ where: { slug: category_slug } })
    if (existSlug) throw new Error('分类标识(Slug)已存在')

    await prisma.category.create({
      data: {
        name: category_name,
        slug: category_slug,
        imageUrl: image_url ?? null,
        description: description ?? null,
        sortWeight: sort_weight,
        status: status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
      }
    })
  })
)

/**
 * 更新分类信息
 */
export const updateCategory = requireRole([UserRole.ADMIN])(
  withResult(async (input: UpdateCategoryInput): Promise<void> => {
    const { category_id, category_name, category_slug, image_url, description, sort_weight, status } = input

    const category = await prisma.category.findUnique({ where: { id: category_id } })
    if (!category) throw new Error('分类不存在')

    // 唯一性约束检查 (排除自身)
    const existName = await prisma.category.findFirst({ where: { name: category_name, id: { not: category_id } } })
    if (existName) throw new Error('分类名称已存在')

    const existSlug = await prisma.category.findFirst({ where: { slug: category_slug, id: { not: category_id } } })
    if (existSlug) throw new Error('分类标识(Slug)已存在')

    const newStatus = status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'
    const updateData: Parameters<typeof prisma.category.update>[0]['data'] = {
      name: category_name,
      slug: category_slug,
      imageUrl: image_url ?? null,
      description: description ?? null,
      sortWeight: sort_weight,
      status: newStatus as any,
    }

    if (category.status !== newStatus) {
      await updateCategoryAndCascade(category_id, updateData, newStatus)
    } else {
      await prisma.category.update({
        where: { id: category_id },
        data: updateData
      })
    }
  })
)

/**
 * 快速更新分类状态
 */
export const updateCategoryStatus = requireRole([UserRole.ADMIN])(
  withResult(async (input: UpdateCategoryStatusInput): Promise<void> => {
    const { category_id, status } = input

    const category = await prisma.category.findUnique({ where: { id: category_id } })
    if (!category) throw new Error('分类不存在')

    const newStatus = status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'
    if (category.status !== newStatus) {
      await updateCategoryAndCascade(category_id, { status: newStatus }, newStatus)
    }
  })
)

/**
 * 快速更新分类排序权重
 */
export const updateCategorySortWeight = requireRole([UserRole.ADMIN])(
  withResult(async (input: UpdateCategorySortWeightInput): Promise<void> => {
    const { category_id, sort_weight } = input

    const category = await prisma.category.findUnique({ where: { id: category_id } })
    if (!category) throw new Error('分类不存在')

    await prisma.category.update({
      where: { id: category_id },
      data: { sortWeight: sort_weight }
    })
  })
)

/**
 * 删除分类
 */
export const deleteCategory = requireRole([UserRole.ADMIN])(
  withResult(async (input: DeleteCategoryInput): Promise<void> => {
    const { category_id } = input

    const category = await prisma.category.findUnique({
      where: { id: category_id },
      include: {
        _count: {
          select: { children: true }
        }
      }
    })
    if (!category) throw new Error('分类不存在')

    if (category._count.children > 0) {
      throw new Error('该分类下仍存在子分类，请先迁移或删除子分类后再操作')
    }

    // 有关联商品时仅改挂分类，不改商品状态
    await prisma.$transaction(async (tx) => {
      await tx.product.updateMany({
        where: { brandCategoryId: category_id },
        data: { brandCategoryId: null },
      })

      const boundCount = await tx.product.count({ where: { categoryId: category_id } })
      if (boundCount > 0) {
        let fallbackId =
          category.parentId && category.parentId !== category_id ? category.parentId : null

        if (!fallbackId) {
          const uncategorized = await tx.category.findFirst({
            where: {
              id: { not: category_id },
              OR: [{ slug: 'uncategorized' }, { name: '未分类' }],
            },
            select: { id: true },
          })
          fallbackId = uncategorized?.id ?? null
        }

        if (!fallbackId) {
          const anyOther = await tx.category.findFirst({
            where: { id: { not: category_id } },
            orderBy: [{ level: 'asc' }, { sortWeight: 'desc' }],
            select: { id: true },
          })
          fallbackId = anyOther?.id ?? null
        }

        if (!fallbackId) {
          const created = await tx.category.create({
            data: {
              name: '未分类',
              slug: 'uncategorized',
              level: 1,
              status: 'ACTIVE',
              sortWeight: -9999,
              isBrandCategory: false,
            },
            select: { id: true },
          })
          fallbackId = created.id
        }

        await tx.product.updateMany({
          where: { categoryId: category_id },
          data: { categoryId: fallbackId },
        })
      }

      await tx.categorykeywordlink.deleteMany({ where: { categoryId: category_id } })
      await tx.category.delete({ where: { id: category_id } })
    })
  })
)
