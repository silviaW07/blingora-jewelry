'use server'

import prisma from '@/tools/prisma'
import {
  requireRole,
  withResult,
  UserRole
} from '@/backend/action_utils'
import { invalidateHomeRecommendZoneCache } from '@/backend/actions/homeRecommendZoneCache'
import { toDateKeyInTimeZone } from '@/frontend/utils/dailyNewArrival'

// ===== Enums =====
/** 专区展示类型：商品专区(PRODUCT) | 类目专区(CATEGORY) */
export type ZoneType = 'PRODUCT' | 'CATEGORY' | 'SIDE_NAV'

/** 启用状态：激活(ACTIVE) | 停用(INACTIVE) */
export type EntityStatus = 'ACTIVE' | 'INACTIVE'

/** 商品状态：草稿(DRAFT) | 上架(ACTIVE) | 下架(INACTIVE) | 缺货(OUT_OF_STOCK) | 预售(PREORDER) */
export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK' | 'PREORDER'

// ===== Data Structures =====

/** 推荐专区列表项 */
export interface RecommendZoneItem {
  id: string                  // data-from: homeRecommendZone-id
  title: string               // data-from: homeRecommendZone-title
  zoneType: ZoneType          // data-from: homeRecommendZone-zoneType
  pcCols: number              // data-from: homeRecommendZone-pcCols
  mobileCols: number          // data-from: homeRecommendZone-mobileCols
  pcRows: number              // data-from: homeRecommendZone-pcRows
  sortWeight: number          // data-from: homeRecommendZone-sortWeight
  isActive: boolean           // data-from: homeRecommendZone-isActive
  boundCollectionId: string | null // data-from: homeRecommendZone-boundCollectionId
  isBoundCollection: boolean  // aggregated: bool based on boundCollectionId
  itemCount: number           // aggregated: 专区内条目数
  createdAt: string           // data-from: homeRecommendZone-createdAt
  updatedAt: string           // data-from: homeRecommendZone-updatedAt
}

/** 专区明细内容项 (商品/类目统一结构) */
export interface ZoneDetailContentItem {
  id: string                  // aggregated: 内部唯一标识 (使用商品/类目自身ID即可)
  entityId: string            // data-from: product-id | category-id
  name: string                // data-from: product-name | category-name
  codeOrSku: string           // data-from: product-productCode | category-slug
  imageUrl: string | null     // data-from: product-mainImageUrl | category-imageUrl
  status: string              // data-from: product-status | category-status
  sortWeight: number          // data-from: homeRecommendZoneItem-sortWeight (对应此项在专区中的排序)
  /** 上新/创建时间（展示商品草稿用） */
  createdAt?: string | null
}

export interface SideNavCategoryItem {
  id: string                  // aggregated: 内部唯一标识 (使用类目自身ID即可)
  entityId: string            // data-from: category-id
  name: string                // data-from: category-name
  codeOrSku: string           // data-from: category-slug
  imageUrl: string | null     // data-from: category-imageUrl
  status: string              // data-from: category-status
  sortWeight: number          // data-from: homeRecommendZoneItem-sortWeight (对应此项在专区中的排序)
  level: number               // data-from: category-level
  parentId: string | null     // data-from: category-parentId
  parentName: string | null   // data-from: category-name (parent)
  productCount: number        // aggregated: category._count.products
  createdAt?: string | null
}

/** 专区完整详情（用于编辑） */
export interface RecommendZoneDetail {
  id: string                  // data-from: homeRecommendZone-id
  title: string               // data-from: homeRecommendZone-title
  zoneType: ZoneType          // data-from: homeRecommendZone-zoneType
  pcCols: number              // data-from: homeRecommendZone-pcCols
  mobileCols: number          // data-from: homeRecommendZone-mobileCols
  pcRows: number              // data-from: homeRecommendZone-pcRows
  sortWeight: number          // data-from: homeRecommendZone-sortWeight
  isActive: boolean           // data-from: homeRecommendZone-isActive
  boundCollectionId: string | null // data-from: homeRecommendZone-boundCollectionId
  collectionName: string      // data-from: homeRecommendCollection-name
  items: Array<ZoneDetailContentItem | SideNavCategoryItem> // aggregated: 关联的明细项
}

/** 供选择的商品列表项 */
export interface SelectableProductItem {
  id: string                  // data-from: product-id
  name: string                // data-from: product-name
  productCode: string         // data-from: product-productCode
  mainImageUrl: string        // data-from: product-mainImageUrl
  categoryName: string        // data-from: category-name
  price: number               // aggregated: 从sku获取最低价
}

/** 供选择的类目列表项 */
export interface SelectableCategoryItem {
  id: string                  // data-from: category-id
  name: string                // data-from: category-name
  level: number               // data-from: category-level
  imageUrl: string | null     // data-from: category-imageUrl
  parentName: string | null   // data-from: category-name (parent)
}

// ===== Input / Output =====

export interface GetRecommendZoneListInput {
  keyword?: string
  page?: number
  pageSize?: number
}

export interface GetRecommendZoneListOutput {
  list: RecommendZoneItem[]
  total: number
}

export interface SaveRecommendZoneItemInput {
  entityId: string            // 商品或类目ID
  sortWeight: number
}

export interface CreateRecommendZoneInput {
  title: string
  zoneType: ZoneType
  pcCols: number
  mobileCols: number
  pcRows: number
  sortWeight: number
  isActive: boolean
  collectionName?: string     // 填了则生成永久集合（仅限 PRODUCT 专区有效）
  items: SaveRecommendZoneItemInput[]
}

export interface UpdateRecommendZoneInput extends CreateRecommendZoneInput {
  id: string
}

export interface DuplicateRecommendZoneInput {
  id: string
}

export interface BatchUpdateZoneSortWeightInput {
  updates: { id: string, sortWeight: number }[]
}

/** 专区明细项拖拽排序（独立写入 homeRecommendZoneItem.sortWeight） */
export interface BatchUpdateZoneItemSortWeightInput {
  zoneId: string
  updates: { entityId: string, sortWeight: number }[]
}

export interface GetSelectableProductsInput {
  keyword?: string
  categoryId?: string
  page?: number
  pageSize?: number
}

export interface GetSelectableProductsOutput {
  list: SelectableProductItem[]
  total: number
}

export interface GetSelectableCategoriesInput {
  keyword?: string
  page?: number
  pageSize?: number
}

export interface GetSelectableCategoriesOutput {
  list: SelectableCategoryItem[]
  total: number
}

const sanitizeZoneConfig = (input: CreateRecommendZoneInput | UpdateRecommendZoneInput) => {
  const title = input.title.trim()
  if (!title) throw new Error('专区标题不能为空')

  if (![3, 4, 5].includes(input.pcCols)) {
    throw new Error('PC端列数仅支持 3、4、5 列')
  }

  if (![1, 2].includes(input.mobileCols)) {
    throw new Error('手机端列数仅支持 1、2 列')
  }

  const pcRows = Number.isFinite(input.pcRows) ? Math.floor(input.pcRows) : 2
  if (pcRows < 1 || pcRows > 12) {
    throw new Error('行数仅支持 1~12 行')
  }

  const sortWeight = Number.isFinite(input.sortWeight) ? input.sortWeight : 0
  const uniqueItems = new Map<string, SaveRecommendZoneItemInput>()
  input.items.forEach((item, index) => {
    if (!item.entityId) {
      throw new Error(`第 ${index + 1} 条内容缺少实体ID`)
    }
    if (!uniqueItems.has(item.entityId)) {
      uniqueItems.set(item.entityId, {
        entityId: item.entityId,
        sortWeight: Number.isFinite(item.sortWeight) ? item.sortWeight : 0,
      })
    }
  })

  return {
    title,
    zoneType: input.zoneType,
    pcCols: input.pcCols,
    mobileCols: input.mobileCols,
    pcRows,
    sortWeight,
    isActive: input.isActive,
    collectionName: input.zoneType === 'PRODUCT' ? input.collectionName?.trim() || '' : '',
    items: Array.from(uniqueItems.values()),
  }
}

async function assertSelectableEntities(zoneType: ZoneType, items: SaveRecommendZoneItemInput[]) {
  if (items.length === 0) {
    return
  }

  const entityIds = items.map(item => item.entityId)
  if (zoneType === 'PRODUCT') {
    const count = await prisma.product.count({
      where: {
        id: { in: entityIds },
        status: { in: ['ACTIVE', 'DRAFT'] },
        category: {
          status: 'ACTIVE'
        }
      }
    })

    if (count !== entityIds.length) {
      throw new Error('所选商品中包含不可用或所属分类未启用的商品，请刷新后重试')
    }
    return
  }

  const count = await prisma.category.count({
    where: {
      id: { in: entityIds },
      status: 'ACTIVE'
    }
  })

  if (count !== entityIds.length) {
    throw new Error('所选类目中包含未启用类目，请刷新后重试')
  }
}

// ===== Actions =====

/**
 * 获取首页推荐专区列表
 */
export const getRecommendZoneList = requireRole([UserRole.ADMIN])(
  withResult(async (input: GetRecommendZoneListInput): Promise<GetRecommendZoneListOutput> => {
    const page = input.page || 1
    const pageSize = input.pageSize || 20
    const skip = (page - 1) * pageSize

    const whereClause: any = {}
    if (input.keyword) {
      whereClause.title = { contains: input.keyword }
    }

    const [total, list] = await prisma.$transaction([
      prisma.homeRecommendZone.count({ where: whereClause }),
      prisma.homeRecommendZone.findMany({
        where: whereClause,
        include: {
          _count: {
            select: {
              items: true,
            }
          }
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: pageSize,
      })
    ])

    return {
      total,
      list: list.map(item => ({
        id: item.id,
        title: item.title,
        zoneType: item.zoneType as ZoneType,
        pcCols: item.pcCols,
        mobileCols: item.mobileCols,
        pcRows: item.pcRows,
        sortWeight: item.sortWeight,
        isActive: item.isActive,
        boundCollectionId: item.boundCollectionId,
        isBoundCollection: !!item.boundCollectionId,
        itemCount: item._count.items,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      }))
    }
  })
)

/**
 * 获取推荐专区详情 (用于编辑/复制展示)
 */
export const getRecommendZoneDetail = requireRole([UserRole.ADMIN])(
  withResult(async (id: string): Promise<RecommendZoneDetail> => {
    const zone = await prisma.homeRecommendZone.findUnique({
      where: { id },
      include: {
        boundCollection: true,
        items: {
          orderBy: [
            { sortWeight: 'desc' },
            { createdAt: 'asc' }
          ],
          include: {
            product: true,
            category: {
              include: {
                parent: true,
                _count: {
                  select: {
                    products: true,
                  }
                }
              }
            },
          }
        }
      }
    })

    if (!zone) {
      throw new Error('该推荐专区不存在')
    }

    const detailItems: Array<ZoneDetailContentItem | SideNavCategoryItem> = zone.items.map(item => {
      if (zone.zoneType === 'PRODUCT' && item.product) {
        return {
          id: item.product.id,
          entityId: item.product.id,
          name: item.product.name,
          codeOrSku: item.product.productCode,
          imageUrl: item.product.mainImageUrl,
          status: item.product.status,
          sortWeight: item.sortWeight,
          createdAt: item.product.createdAt?.toISOString?.() || null,
        }
      } else if (zone.zoneType === 'CATEGORY' && item.category) {
        return {
          id: item.category.id,
          entityId: item.category.id,
          name: item.category.name,
          codeOrSku: item.category.slug || '-',
          imageUrl: item.category.imageUrl || item.category.iconUrl || null,
          status: item.category.status,
          sortWeight: item.sortWeight
        }
      } else if (zone.zoneType === 'SIDE_NAV' && item.category) {
        return {
          id: item.category.id,
          entityId: item.category.id,
          name: item.category.name,
          codeOrSku: item.category.slug || '-',
          imageUrl: item.category.imageUrl || item.category.iconUrl || null,
          status: item.category.status,
          sortWeight: item.sortWeight,
          level: item.category.level,
          parentId: item.category.parentId,
          parentName: item.category.parent?.name || null,
          productCount: item.category._count.products,
        }
      }
      throw new Error('专区明细数据异常')
    })

    return {
      id: zone.id,
      title: zone.title,
      zoneType: zone.zoneType as ZoneType,
      pcCols: zone.pcCols,
      mobileCols: zone.mobileCols,
      pcRows: zone.pcRows,
      sortWeight: zone.sortWeight,
      isActive: zone.isActive,
      boundCollectionId: zone.boundCollectionId,
      collectionName: zone.boundCollection?.name || '',
      items: detailItems
    }
  })
)

/**
 * 新增推荐专区
 */
export const createRecommendZone = requireRole([UserRole.ADMIN])(
  withResult(async (input: CreateRecommendZoneInput): Promise<void> => {
    const payload = sanitizeZoneConfig(input)
    await assertSelectableEntities(payload.zoneType, payload.items)

    await prisma.$transaction(async (tx) => {
      // 1. 创建专区本身
      const zone = await tx.homeRecommendZone.create({
        data: {
          title: payload.title,
          zoneType: payload.zoneType,
          pcCols: payload.pcCols,
          mobileCols: payload.mobileCols,
          pcRows: payload.pcRows,
          sortWeight: payload.sortWeight,
          isActive: payload.isActive,
        }
      })

      // 2. 插入明细关系
      if (payload.items.length > 0) {
        const isSideNavZone = payload.zoneType === 'SIDE_NAV'
        const itemData = payload.items.map(i => ({
          zoneId: zone.id,
          entityType: payload.zoneType,
          productId: payload.zoneType === 'PRODUCT' ? i.entityId : null,
          categoryId: isSideNavZone || payload.zoneType === 'CATEGORY' ? i.entityId : null,
          sortWeight: i.sortWeight
        }))
        await tx.homeRecommendZoneItem.createMany({ data: itemData })
      }

      // 3. 处理自动生成永久商品集合业务 (Schema约束: 集合只能绑product，故仅限 PRODUCT 类型)
      if (payload.zoneType === 'PRODUCT' && payload.collectionName) {
        const collection = await tx.homeRecommendCollection.create({
          data: {
            name: payload.collectionName,
            sourceZoneId: zone.id,
            isActive: true,
          }
        })
        
        if (payload.items.length > 0) {
          const colItems = payload.items.map(i => ({
            collectionId: collection.id,
            productId: i.entityId,
            sortWeight: i.sortWeight
          }))
          await tx.homeRecommendCollectionItem.createMany({ data: colItems })
        }

        await tx.homeRecommendZone.update({
          where: { id: zone.id },
          data: { boundCollectionId: collection.id }
        })
      }
    })

    invalidateHomeRecommendZoneCache()
  })
)

/**
 * 编辑推荐专区
 */
export const updateRecommendZone = requireRole([UserRole.ADMIN])(
  withResult(async (input: UpdateRecommendZoneInput): Promise<void> => {
    if (!input.id) throw new Error('缺少专区ID')
    const payload = sanitizeZoneConfig(input)
    await assertSelectableEntities(payload.zoneType, payload.items)

    await prisma.$transaction(async (tx) => {
      const zone = await tx.homeRecommendZone.findUnique({
        where: { id: input.id },
        include: { boundCollection: true }
      })

      if (!zone) throw new Error('专区不存在')

      // 1. 更新专区基础信息
      await tx.homeRecommendZone.update({
        where: { id: input.id },
        data: {
          title: payload.title,
          zoneType: payload.zoneType,
          pcCols: payload.pcCols,
          mobileCols: payload.mobileCols,
          pcRows: payload.pcRows,
          sortWeight: payload.sortWeight,
          isActive: payload.isActive,
        }
      })

      // 2. 全删全插专区明细
      await tx.homeRecommendZoneItem.deleteMany({ where: { zoneId: input.id } })
      if (payload.items.length > 0) {
        const isSideNavZone = payload.zoneType === 'SIDE_NAV'
        const itemData = payload.items.map(i => ({
          zoneId: input.id,
          entityType: payload.zoneType,
          productId: payload.zoneType === 'PRODUCT' ? i.entityId : null,
          categoryId: isSideNavZone || payload.zoneType === 'CATEGORY' ? i.entityId : null,
          sortWeight: i.sortWeight
        }))
        await tx.homeRecommendZoneItem.createMany({ data: itemData })
      }

      // 3. 处理永久集合更新 (仅限 PRODUCT)
      if (payload.zoneType === 'PRODUCT') {
        const wantCollection = !!payload.collectionName
        
        if (wantCollection) {
          if (zone.boundCollectionId) {
            // 已有集合：更新名字并全删全插明细
            await tx.homeRecommendCollection.update({
              where: { id: zone.boundCollectionId },
              data: { name: payload.collectionName }
            })
            await tx.homeRecommendCollectionItem.deleteMany({ where: { collectionId: zone.boundCollectionId } })
            if (payload.items.length > 0) {
              await tx.homeRecommendCollectionItem.createMany({
                data: payload.items.map(i => ({
                  collectionId: zone.boundCollectionId!,
                  productId: i.entityId,
                  sortWeight: i.sortWeight
                }))
              })
            }
          } else {
            // 没有集合，新创建
            const collection = await tx.homeRecommendCollection.create({
              data: {
                name: payload.collectionName,
                sourceZoneId: zone.id,
                isActive: true,
              }
            })
            if (payload.items.length > 0) {
              await tx.homeRecommendCollectionItem.createMany({
                data: payload.items.map(i => ({
                  collectionId: collection.id,
                  productId: i.entityId,
                  sortWeight: i.sortWeight
                }))
              })
            }
            await tx.homeRecommendZone.update({
              where: { id: zone.id },
              data: { boundCollectionId: collection.id }
            })
          }
        } else if (zone.boundCollectionId) {
          await tx.homeRecommendZone.update({
            where: { id: zone.id },
            data: { boundCollectionId: null }
          })
        }
      } else if (zone.boundCollectionId) {
        await tx.homeRecommendZone.update({
          where: { id: zone.id },
          data: { boundCollectionId: null }
        })
      }
    })

    invalidateHomeRecommendZoneCache()
  })
)

/**
 * 复制推荐专区（克隆基础配置与全部明细）
 */
export const duplicateRecommendZone = requireRole([UserRole.ADMIN])(
  withResult(async (input: DuplicateRecommendZoneInput): Promise<void> => {
    const zone = await prisma.homeRecommendZone.findUnique({
      where: { id: input.id },
      include: {
        boundCollection: true,
        items: {
          orderBy: [{ sortWeight: 'desc' }, { createdAt: 'asc' }],
        }
      }
    })

    if (!zone) {
      throw new Error('该推荐专区不存在')
    }

    const nextTitle = `${zone.title} (复制)`

    await prisma.$transaction(async (tx) => {
      const duplicatedZone = await tx.homeRecommendZone.create({
        data: {
          title: nextTitle,
          zoneType: zone.zoneType,
          pcCols: zone.pcCols,
          mobileCols: zone.mobileCols,
          pcRows: zone.pcRows,
          sortWeight: zone.sortWeight,
          isActive: zone.isActive,
        }
      })

      if (zone.items.length > 0) {
        await tx.homeRecommendZoneItem.createMany({
          data: zone.items.map(item => ({
            zoneId: duplicatedZone.id,
            entityType: item.entityType,
            productId: item.productId,
            categoryId: item.categoryId,
            sortWeight: item.sortWeight,
          }))
        })
      }

      if (zone.zoneType === 'PRODUCT' && zone.boundCollection && zone.items.length > 0) {
        const duplicatedCollection = await tx.homeRecommendCollection.create({
          data: {
            name: `${zone.boundCollection.name} (复制)`,
            sourceZoneId: duplicatedZone.id,
            isActive: zone.boundCollection.isActive,
          }
        })

        await tx.homeRecommendCollectionItem.createMany({
          data: zone.items
            .filter(item => item.productId)
            .map(item => ({
              collectionId: duplicatedCollection.id,
              productId: item.productId!,
              sortWeight: item.sortWeight,
            }))
        })

        await tx.homeRecommendZone.update({
          where: { id: duplicatedZone.id },
          data: { boundCollectionId: duplicatedCollection.id }
        })
      }
    })

    invalidateHomeRecommendZoneCache()
  })
)

/**
 * 删除推荐专区 (联动删除专区下的明细映射，不删除独立商品或永久集合)
 */
export const deleteRecommendZone = requireRole([UserRole.ADMIN])(
  withResult(async (id: string): Promise<void> => {
    await prisma.$transaction(async (tx) => {
      // 若有绑定的集合，解除关系，以免外键冲突（看业务需要，一般保留集合孤立存在，或直接清空关联）
      await tx.homeRecommendZone.update({
        where: { id },
        data: { boundCollectionId: null }
      })

      // 删除下属条目
      await tx.homeRecommendZoneItem.deleteMany({
        where: { zoneId: id }
      })

      // 删除专区本身
      await tx.homeRecommendZone.delete({
        where: { id }
      })
    })

    invalidateHomeRecommendZoneCache()
  })
)

/**
 * 快捷更新专区状态
 */
export const updateRecommendZoneStatus = requireRole([UserRole.ADMIN])(
  withResult(async (id: string, isActive: boolean): Promise<void> => {
    await prisma.homeRecommendZone.update({
      where: { id },
      data: { isActive }
    })

    invalidateHomeRecommendZoneCache()
  })
)

/**
 * 批量更新专区排序权重 (用于行拖拽)
 */
export const batchUpdateZoneSortWeight = requireRole([UserRole.ADMIN])(
  withResult(async (input: BatchUpdateZoneSortWeightInput): Promise<void> => {
    if (!input.updates || input.updates.length === 0) return

    await prisma.$transaction(
      input.updates.map(u => 
        prisma.homeRecommendZone.update({
          where: { id: u.id },
          data: { sortWeight: u.sortWeight }
        })
      )
    )

    invalidateHomeRecommendZoneCache()
  })
)

/** 批量更新专区明细排序（用于编辑抽屉内拖拽，字段独立于 category.sortWeight） */
export const batchUpdateZoneItemSortWeight = requireRole([UserRole.ADMIN])(
  withResult(async (input: BatchUpdateZoneItemSortWeightInput): Promise<void> => {
    const zoneId = input.zoneId?.trim()
    const updates = (input.updates ?? []).filter(
      item => item?.entityId && Number.isFinite(item.sortWeight),
    )
    if (!zoneId || updates.length === 0) return

    const zone = await prisma.homeRecommendZone.findUnique({
      where: { id: zoneId },
      select: { id: true, zoneType: true },
    })
    if (!zone) throw new Error('该推荐专区不存在')

    await prisma.$transaction(
      updates.map(u => {
        if (zone.zoneType === 'PRODUCT') {
          return prisma.homeRecommendZoneItem.updateMany({
            where: { zoneId, productId: u.entityId },
            data: { sortWeight: Number(u.sortWeight) },
          })
        }
        return prisma.homeRecommendZoneItem.updateMany({
          where: { zoneId, categoryId: u.entityId },
          data: { sortWeight: Number(u.sortWeight) },
        })
      }),
    )

    invalidateHomeRecommendZoneCache()
  })
)

/**
 * 供配置面板弹窗使用的：获取可用商品列表
 * 必须满足全局约束：商品 ACTIVE 且所属分类 ACTIVE
 */
export const getSelectableProducts = requireRole([UserRole.ADMIN])(
  withResult(async (input: GetSelectableProductsInput): Promise<GetSelectableProductsOutput> => {
    const page = input.page || 1
    const pageSize = input.pageSize || 10
    const skip = (page - 1) * pageSize

    const whereClause: any = {
      status: 'ACTIVE',
      category: {
        status: 'ACTIVE'
      }
    }

    if (input.keyword) {
      whereClause.OR = [
        { name: { contains: input.keyword } },
        { productCode: { contains: input.keyword } }
      ]
    }
    
    if (input.categoryId) {
      whereClause.categoryId = input.categoryId
    }

    const [total, products] = await prisma.$transaction([
      prisma.product.count({ where: whereClause }),
      prisma.product.findMany({
        where: whereClause,
        skip,
        take: pageSize,
        orderBy: { sortWeight: 'desc' },
        include: {
          category: { select: { name: true } },
          skus: {
            select: { price: true },
            orderBy: { price: 'asc' },
            take: 1
          }
        }
      })
    ])

    return {
      total,
      list: products.map(p => ({
        id: p.id,
        name: p.name,
        productCode: p.productCode,
        mainImageUrl: p.mainImageUrl,
        categoryName: p.category.name,
        price: p.skus[0]?.price?.toNumber() || 0
      }))
    }
  })
)

/**
 * 供配置面板弹窗使用的：获取可用类目列表
 * 必须满足全局约束：分类 ACTIVE
 */
export const getSelectableCategories = requireRole([UserRole.ADMIN])(
  withResult(async (input: GetSelectableCategoriesInput): Promise<GetSelectableCategoriesOutput> => {
    const page = input.page || 1
    const pageSize = input.pageSize || 10
    const skip = (page - 1) * pageSize

    const whereClause: any = {
      status: 'ACTIVE'
    }

    if (input.keyword) {
      whereClause.name = { contains: input.keyword }
    }

    const [total, categories] = await prisma.$transaction([
      prisma.category.count({ where: whereClause }),
      prisma.category.findMany({
        where: whereClause,
        skip,
        take: pageSize,
        orderBy: { sortWeight: 'desc' },
        include: {
          parent: { select: { name: true } }
        }
      })
    ])

    return {
      total,
      list: categories.map(c => ({
        id: c.id,
        name: c.name,
        level: c.level,
        imageUrl: c.imageUrl,
        parentName: c.parent?.name || null
      }))
    }
  })
)

export interface CreateDraftDisplayProductImageInput {
  url: string
  name?: string
}

export interface CreateDraftDisplayProductsInput {
  /** 当前编辑的专区 ID；有值时立即绑定并写入专区 */
  zoneId?: string | null
  images: CreateDraftDisplayProductImageInput[]
}

export interface CreateDraftDisplayProductsOutput {
  items: ZoneDetailContentItem[]
}

export interface DeleteDraftDisplayProductsInput {
  productIds: string[]
  zoneId?: string | null
}

export interface DeleteDraftDisplayProductsOutput {
  deletedCount: number
}

const makeDisplayProductIdentifiers = () => {
  const stamp = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return {
    productCode: `DISP${stamp}${rand}`,
    slug: `display-${stamp}-${rand}`.toLowerCase(),
  }
}

/**
 * 快速发图：按本地上传图片批量创建 DRAFT 展示商品（无价格/规格/库存），
 * 若传入 zoneId 则立即绑定到该商品专区并保存。
 */
export const createDraftDisplayProducts = requireRole([UserRole.ADMIN])(
  withResult(async (input: CreateDraftDisplayProductsInput): Promise<CreateDraftDisplayProductsOutput> => {
    const images = (input.images || [])
      .map((item) => ({
        url: String(item.url || '').trim(),
        name: String(item.name || '').trim(),
      }))
      .filter((item) => item.url)

    if (images.length === 0) {
      throw new Error('请至少上传一张图片')
    }

    const category = await prisma.category.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: [{ level: 'asc' }, { sortWeight: 'desc' }],
      select: { id: true },
    })

    if (!category) {
      throw new Error('请先创建并启用至少一个商品分类，再上传展示商品')
    }

    let zone: { id: string; zoneType: string } | null = null
    if (input.zoneId) {
      zone = await prisma.homeRecommendZone.findUnique({
        where: { id: input.zoneId },
        select: { id: true, zoneType: true },
      })
      if (!zone) throw new Error('当前专区不存在，请先保存专区后再上传')
      if (zone.zoneType !== 'PRODUCT') throw new Error('仅商品专区支持快速发图')
    }

    const maxSort = zone
      ? (
          await prisma.homeRecommendZoneItem.findFirst({
            where: { zoneId: zone.id },
            orderBy: { sortWeight: 'desc' },
            select: { sortWeight: true },
          })
        )?.sortWeight || 0
      : 0

    const createdItems: ZoneDetailContentItem[] = []

    await prisma.$transaction(async (tx) => {
      for (let index = 0; index < images.length; index += 1) {
        const image = images[index]
        const ids = makeDisplayProductIdentifiers()
        // Coming 按商品名称（YYYY-MM-DD）归日；忽略文件名以免乱码/随机 ID
        const productName = toDateKeyInTimeZone(new Date(), 'Asia/Shanghai')

        const product = await tx.product.create({
          data: {
            categoryId: category.id,
            name: productName.slice(0, 200),
            slug: ids.slug,
            productCode: ids.productCode,
            source: 'MANUAL',
            status: 'DRAFT',
            mainImageUrl: image.url,
            galleryJson: [{ url: image.url, sort: 1 }],
            shortDescription: '快速发图展示商品',
          },
        })

        if (zone) {
          await tx.homeRecommendZoneItem.create({
            data: {
              zoneId: zone.id,
              entityType: 'PRODUCT',
              productId: product.id,
              sortWeight: maxSort + (images.length - index) * 10,
            },
          })
        }

        createdItems.push({
          id: product.id,
          entityId: product.id,
          name: product.name,
          codeOrSku: product.productCode,
          imageUrl: product.mainImageUrl,
          status: product.status,
          sortWeight: maxSort + (images.length - index) * 10,
          createdAt: product.createdAt.toISOString(),
        })
      }
    })

    if (zone) {
      invalidateHomeRecommendZoneCache()
    }

    return { items: createdItems }
  }),
)

/**
 * 批量删除草稿展示商品（并从专区明细中移除）
 */
export const deleteDraftDisplayProducts = requireRole([UserRole.ADMIN])(
  withResult(async (input: DeleteDraftDisplayProductsInput): Promise<DeleteDraftDisplayProductsOutput> => {
    const productIds = Array.from(new Set((input.productIds || []).map((id) => String(id || '').trim()).filter(Boolean)))
    if (productIds.length === 0) {
      throw new Error('请选择要删除的草稿展示商品')
    }

    const drafts = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        status: 'DRAFT',
      },
      select: { id: true },
    })

    const draftIds = drafts.map((item) => item.id)
    if (draftIds.length === 0) {
      throw new Error('仅支持删除状态为草稿的展示商品')
    }

    await prisma.$transaction(async (tx) => {
      await tx.homeRecommendZoneItem.deleteMany({
        where: { productId: { in: draftIds } },
      })
      await tx.product.deleteMany({
        where: { id: { in: draftIds }, status: 'DRAFT' },
      })
    })

    invalidateHomeRecommendZoneCache()
    return { deletedCount: draftIds.length }
  }),
)