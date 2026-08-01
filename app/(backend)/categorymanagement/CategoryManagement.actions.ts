'use server'

// ===== Enums =====
/** 状态：激活(ACTIVE) | 停用(INACTIVE) */
export type CategoryStatus = 'ACTIVE' | 'INACTIVE'
export type CategoryLevel = 1 | 2

// ===== Data Structures =====
export interface CategoryOption {
  category_id: string
  category_name: string
  level: CategoryLevel
  parent_id: string | null
}

export interface HomepagePosterItem {
  id: string
  title: string
  image_url: string
  link?: string | null
  sort_weight: number
  is_active: boolean
}

export interface HomepagePosterConfig {
  category_id: string
  items: HomepagePosterItem[]
}

export interface CategoryItem {
  category_id: string
  category_name: string
  category_slug: string
  parent_id: string | null
  parent_name: string | null
  level: CategoryLevel
  image_url: string | null
  banner_image_url: string | null
  description: string | null
  sort_weight: number
  status: CategoryStatus
  product_count: number
  child_count: number
  created_at: string
  updated_at: string
}

// ===== Input / Output =====
export interface GetCategoryListInput {
  keyword?: string
  status?: CategoryStatus
  level?: CategoryLevel
  page?: number
  page_size?: number
}

export interface GetCategoryListOutput {
  list: CategoryItem[]
  total: number
  parent_options: CategoryOption[]
  poster_configs: HomepagePosterConfig[]
}

export interface CreateCategoryInput {
  category_name: string
  category_slug: string
  parent_id?: string | null
  level: CategoryLevel
  image_url?: string | null
  banner_image_url?: string | null
  description?: string | null
  sort_weight: number
  status: CategoryStatus
}

export interface UpdateCategoryInput {
  category_id: string
  category_name: string
  category_slug: string
  parent_id?: string | null
  level: CategoryLevel
  image_url?: string | null
  banner_image_url?: string | null
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

export interface SaveHomepagePosterConfigInput {
  category_id: string
  items: HomepagePosterItem[]
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
type PosterContentPayload = {
  categoryId?: string | null
  items?: Array<{
    id?: string
    title?: string
    image_url?: string
    imageUrl?: string
    link?: string | null
    sort_weight?: number
    sortWeight?: number
    is_active?: boolean
    isActive?: boolean
  }>
}

const normalizePosterItems = (items: HomepagePosterItem[]): HomepagePosterItem[] => {
  return items
    .filter(item => item.image_url?.trim())
    .map((item, index) => ({
      id: item.id?.trim() || `poster-${Date.now()}-${index}`,
      title: item.title?.trim() || `海报 ${index + 1}`,
      image_url: item.image_url.trim(),
      link: item.link?.trim() || null,
      sort_weight: Number.isFinite(item.sort_weight) ? item.sort_weight : index,
      is_active: item.is_active !== false,
    }))
    .sort((a, b) => b.sort_weight - a.sort_weight)
}

const parsePosterConfigs = async (): Promise<HomepagePosterConfig[]> => {
  const posterSettings = await prisma.sitesetting.findMany({
    where: { settingType: 'HOMEPAGE_POSTER' },
    orderBy: [
      { sortWeight: 'desc' },
      { createdAt: 'asc' }
    ]
  })

  return posterSettings
    .map(setting => {
      const payload = (setting.contentJson ?? {}) as PosterContentPayload
      const categoryId = payload.categoryId || null
      if (!categoryId) return null

      return {
        category_id: categoryId,
        items: (payload.items ?? []).map((item, index) => ({
          id: item.id || `poster-${setting.id}-${index}`,
          title: item.title || `海报 ${index + 1}`,
          image_url: item.image_url || item.imageUrl || '',
          link: item.link || null,
          sort_weight: item.sort_weight ?? item.sortWeight ?? index,
          is_active: item.is_active ?? item.isActive ?? true,
        })).filter(item => item.image_url)
      } satisfies HomepagePosterConfig
    })
    .filter((config): config is HomepagePosterConfig => !!config)
}

const validateCategoryHierarchy = async (params: {
  category_id?: string
  parent_id?: string | null
  level: CategoryLevel
}) => {
  const { category_id, parent_id, level } = params

  if (level === 1) {
    return { parentId: null as string | null }
  }

  if (!parent_id) {
    throw new Error('二级分类必须选择上级分类')
  }

  if (parent_id === category_id) {
    throw new Error('分类不能设置自己为上级分类')
  }

  const parent = await prisma.category.findUnique({ where: { id: parent_id } })
  if (!parent) {
    throw new Error('所选上级分类不存在')
  }

  if (parent.level !== 1) {
    throw new Error('二级分类的上级分类必须为一级分类')
  }

  return { parentId: parent.id }
}

async function updateCategoryAndCascade(categoryId: string, updateData: Record<string, any>, newStatus: CategoryStatus) {
  const affectedProducts = await prisma.product.findMany({
    where: { categoryId },
    select: { id: true }
  })
  const productIds = affectedProducts.map(p => p.id)

  const items = newStatus === 'ACTIVE' && productIds.length > 0 ? await prisma.cartitem.findMany({
    where: { productId: { in: productIds } },
    include: { product: true, productSku: true }
  }) : []

  await prisma.$transaction(async (tx) => {
    await tx.category.update({
      where: { id: categoryId },
      data: updateData
    })

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

export const getCategoryList = requireRole([UserRole.ADMIN])(
  withResult(async (input: GetCategoryListInput): Promise<GetCategoryListOutput> => {
    const { keyword, status, level, page = 1, page_size = 20 } = input
    const skip = (page - 1) * page_size
    const take = page_size

    const where: Record<string, any> = {}
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { slug: { contains: keyword } }
      ]
    }
    if (status) {
      where.status = status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'
    }
    if (level) {
      where.level = level
    }

    const [categories, total, parentOptions, posterConfigs] = await Promise.all([
      prisma.category.findMany({
        where,
        skip,
        take,
        orderBy: [
          { level: 'asc' },
          { sortWeight: 'desc' },
          { createdAt: 'desc' }
        ],
        include: {
          parent: {
            select: { id: true, name: true }
          },
          _count: {
            select: { products: true, children: true }
          }
        }
      }),
      prisma.category.count({ where }),
      prisma.category.findMany({
        where: { level: 1 },
        orderBy: [
          { sortWeight: 'desc' },
          { createdAt: 'desc' }
        ],
        select: {
          id: true,
          name: true,
          level: true,
          parentId: true
        }
      }),
      parsePosterConfigs()
    ])

    return {
      list: categories.map(c => ({
        category_id: c.id,
        category_name: c.name,
        category_slug: c.slug,
        parent_id: c.parentId,
        parent_name: c.parent?.name || null,
        level: (c.level === 2 ? 2 : 1) as CategoryLevel,
        image_url: c.imageUrl,
        banner_image_url: c.bannerImageUrl,
        description: c.description,
        sort_weight: c.sortWeight,
        status: c.status as CategoryStatus,
        product_count: c._count.products,
        child_count: c._count.children,
        created_at: c.createdAt.toISOString(),
        updated_at: c.updatedAt.toISOString(),
      })),
      total,
      parent_options: parentOptions.map(item => ({
        category_id: item.id,
        category_name: item.name,
        level: (item.level === 2 ? 2 : 1) as CategoryLevel,
        parent_id: item.parentId,
      })),
      poster_configs: posterConfigs,
    }
  })
)

export const createCategory = requireRole([UserRole.ADMIN])(
  withResult(async (input: CreateCategoryInput): Promise<void> => {
    const { category_name, category_slug, parent_id, level, image_url, banner_image_url, description, sort_weight, status } = input

    const existName = await prisma.category.findUnique({ where: { name: category_name } })
    if (existName) throw new Error('分类名称已存在')

    const existSlug = await prisma.category.findUnique({ where: { slug: category_slug } })
    if (existSlug) throw new Error('分类标识(Slug)已存在')

    const { parentId } = await validateCategoryHierarchy({ parent_id, level })

    await prisma.category.create({
      data: {
        name: category_name,
        slug: category_slug,
        parentId,
        level,
        imageUrl: image_url ?? null,
        bannerImageUrl: banner_image_url ?? null,
        description: description ?? null,
        sortWeight: sort_weight,
        status: status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
      }
    })
  })
)

export const updateCategory = requireRole([UserRole.ADMIN])(
  withResult(async (input: UpdateCategoryInput): Promise<void> => {
    const { category_id, category_name, category_slug, parent_id, level, image_url, banner_image_url, description, sort_weight, status } = input

    const category = await prisma.category.findUnique({ where: { id: category_id } })
    if (!category) throw new Error('分类不存在')

    const existName = await prisma.category.findFirst({ where: { name: category_name, id: { not: category_id } } })
    if (existName) throw new Error('分类名称已存在')

    const existSlug = await prisma.category.findFirst({ where: { slug: category_slug, id: { not: category_id } } })
    if (existSlug) throw new Error('分类标识(Slug)已存在')

    const { parentId } = await validateCategoryHierarchy({ category_id, parent_id, level })

    const newStatus = status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'
    const updateData: Parameters<typeof prisma.category.update>[0]['data'] = {
      name: category_name,
      slug: category_slug,
      parentId,
      level,
      imageUrl: image_url ?? null,
      bannerImageUrl: banner_image_url ?? null,
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

export const saveHomepagePosterConfig = requireRole([UserRole.ADMIN])(
  withResult(async (input: SaveHomepagePosterConfigInput): Promise<void> => {
    const { category_id, items } = input

    const category = await prisma.category.findUnique({ where: { id: category_id } })
    if (!category) throw new Error('分类不存在')
    if (category.level !== 1) throw new Error('仅一级分类可维护目录海报')

    const normalizedItems = normalizePosterItems(items)

    const existing = await prisma.sitesetting.findFirst({
      where: {
        settingType: 'HOMEPAGE_POSTER',
        contentJson: {
          path: ['categoryId'],
          equals: category_id,
        }
      }
    })

    const contentJson = {
      categoryId: category_id,
      items: normalizedItems,
    }

    if (existing) {
      await prisma.sitesetting.update({
        where: { id: existing.id },
        data: {
          title: `${category.name} 首页海报`,
          contentJson,
          imageUrl: normalizedItems[0]?.image_url || null,
          isActive: true,
        }
      })
      return
    }

    await prisma.sitesetting.create({
      data: {
        settingType: 'HOMEPAGE_POSTER',
        title: `${category.name} 首页海报`,
        subtitle: '分类目录海报配置',
        contentJson,
        imageUrl: normalizedItems[0]?.image_url || null,
        sortWeight: category.sortWeight,
        isActive: true,
      }
    })
  })
)

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

    // 有关联商品时：仅改挂到父分类/「未分类」，不改商品状态，再删除分类
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

      await tx.productcategory.deleteMany({ where: { categoryId: category_id } })
      await tx.product_category_relations.deleteMany({ where: { categoryId: category_id } })
      await tx.homeRecommendZoneItem.deleteMany({ where: { categoryId: category_id } })
      await tx.categorykeywordlink.deleteMany({ where: { categoryId: category_id } })
      await tx.categoryfilterbinding.deleteMany({ where: { categoryId: category_id } })
      await tx.categoryspectemplatebinding.deleteMany({ where: { categoryId: category_id } })
      await tx.categorynavconfig.deleteMany({ where: { categoryId: category_id } })
      await tx.category.delete({ where: { id: category_id } })
    })
  })
)
