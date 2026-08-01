'use server'

import prisma from '@/tools/prisma'
import {
  requireRole,
  withResult,
  UserRole
} from '@/backend/action_utils'

// ===== Enums =====
/** 专区展示类型：商品专区(PRODUCT) | 类目专区(CATEGORY) */
export type ZoneType = 'PRODUCT' | 'CATEGORY'

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
  sortWeight: number          // data-from: homeRecommendZone-sortWeight
  isActive: boolean           // data-from: homeRecommendZone-isActive
  boundCollectionId: string | null // data-from: homeRecommendZone-boundCollectionId
  isBoundCollection: boolean  // aggregated: bool based on boundCollectionId
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
}

/** 专区完整详情（用于编辑） */
export interface RecommendZoneDetail {
  id: string                  // data-from: homeRecommendZone-id
  title: string               // data-from: homeRecommendZone-title
  zoneType: ZoneType          // data-from: homeRecommendZone-zoneType
  pcCols: number              // data-from: homeRecommendZone-pcCols
  mobileCols: number          // data-from: homeRecommendZone-mobileCols
  sortWeight: number          // data-from: homeRecommendZone-sortWeight
  isActive: boolean           // data-from: homeRecommendZone-isActive
  collectionName: string      // data-from: homeRecommendCollection-name
  items: ZoneDetailContentItem[] // aggregated: 关联的明细项
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
  sortWeight: number
  isActive: boolean
  collectionName?: string     // 填了则生成永久集合（仅限 PRODUCT 专区有效）
  items: SaveRecommendZoneItemInput[]
}

export interface UpdateRecommendZoneInput extends CreateRecommendZoneInput {
  id: string
}

export interface BatchUpdateZoneSortWeightInput {
  updates: { id: string, sortWeight: number }[]
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
        orderBy: { sortWeight: 'desc' },
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
        sortWeight: item.sortWeight,
        isActive: item.isActive,
        boundCollectionId: item.boundCollectionId,
        isBoundCollection: !!item.boundCollectionId,
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
          orderBy: { sortWeight: 'desc' },
          include: {
            product: true,
            category: true,
          }
        }
      }
    })

    if (!zone) {
      throw new Error('该推荐专区不存在')
    }

    const detailItems: ZoneDetailContentItem[] = zone.items.map(item => {
      if (zone.zoneType === 'PRODUCT' && item.product) {
        return {
          id: item.product.id,
          entityId: item.product.id,
          name: item.product.name,
          codeOrSku: item.product.productCode,
          imageUrl: item.product.mainImageUrl,
          status: item.product.status,
          sortWeight: item.sortWeight
        }
      } else if (zone.zoneType === 'CATEGORY' && item.category) {
        return {
          id: item.category.id,
          entityId: item.category.id,
          name: item.category.name,
          codeOrSku: item.category.slug || '-',
          imageUrl: item.category.imageUrl,
          status: item.category.status,
          sortWeight: item.sortWeight
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
      sortWeight: zone.sortWeight,
      isActive: zone.isActive,
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
    if (!input.title) throw new Error('专区标题不能为空')

    await prisma.$transaction(async (tx) => {
      // 1. 创建专区本身
      const zone = await tx.homeRecommendZone.create({
        data: {
          title: input.title,
          zoneType: input.zoneType,
          pcCols: input.pcCols,
          mobileCols: input.mobileCols,
          sortWeight: input.sortWeight,
          isActive: input.isActive,
        }
      })

      // 2. 插入明细关系
      if (input.items && input.items.length > 0) {
        const itemData = input.items.map(i => ({
          zoneId: zone.id,
          entityType: input.zoneType,
          productId: input.zoneType === 'PRODUCT' ? i.entityId : null,
          categoryId: input.zoneType === 'CATEGORY' ? i.entityId : null,
          sortWeight: i.sortWeight
        }))
        await tx.homeRecommendZoneItem.createMany({ data: itemData })
      }

      // 3. 处理自动生成永久商品集合业务 (Schema约束: 集合只能绑product，故仅限 PRODUCT 类型)
      if (input.zoneType === 'PRODUCT' && input.collectionName && input.collectionName.trim() !== '') {
        const collection = await tx.homeRecommendCollection.create({
          data: {
            name: input.collectionName.trim(),
            sourceZoneId: zone.id,
            isActive: true,
          }
        })
        
        if (input.items && input.items.length > 0) {
          const colItems = input.items.map(i => ({
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
  })
)

/**
 * 编辑推荐专区
 */
export const updateRecommendZone = requireRole([UserRole.ADMIN])(
  withResult(async (input: UpdateRecommendZoneInput): Promise<void> => {
    if (!input.id) throw new Error('缺少专区ID')
    if (!input.title) throw new Error('专区标题不能为空')

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
          title: input.title,
          zoneType: input.zoneType,
          pcCols: input.pcCols,
          mobileCols: input.mobileCols,
          sortWeight: input.sortWeight,
          isActive: input.isActive,
        }
      })

      // 2. 全删全插专区明细
      await tx.homeRecommendZoneItem.deleteMany({ where: { zoneId: input.id } })
      if (input.items && input.items.length > 0) {
        const itemData = input.items.map(i => ({
          zoneId: input.id,
          entityType: input.zoneType,
          productId: input.zoneType === 'PRODUCT' ? i.entityId : null,
          categoryId: input.zoneType === 'CATEGORY' ? i.entityId : null,
          sortWeight: i.sortWeight
        }))
        await tx.homeRecommendZoneItem.createMany({ data: itemData })
      }

      // 3. 处理永久集合更新 (仅限 PRODUCT)
      if (input.zoneType === 'PRODUCT') {
        const wantCollection = !!(input.collectionName && input.collectionName.trim() !== '')
        
        if (wantCollection) {
          if (zone.boundCollectionId) {
            // 已有集合：更新名字并全删全插明细
            await tx.homeRecommendCollection.update({
              where: { id: zone.boundCollectionId },
              data: { name: input.collectionName!.trim() }
            })
            await tx.homeRecommendCollectionItem.deleteMany({ where: { collectionId: zone.boundCollectionId } })
            if (input.items && input.items.length > 0) {
              await tx.homeRecommendCollectionItem.createMany({
                data: input.items.map(i => ({
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
                name: input.collectionName!.trim(),
                sourceZoneId: zone.id,
                isActive: true,
              }
            })
            if (input.items && input.items.length > 0) {
              await tx.homeRecommendCollectionItem.createMany({
                data: input.items.map(i => ({
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
        }
        // 若之前有集合但新传空，需求并未明确说要解绑或删除历史集合，稳妥起见不主动物理删除历史集合。
      }
    })
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
