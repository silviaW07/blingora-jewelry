'use server'

import prisma from '@/tools/prisma'
import {
  requireRole,
  getAuthContext,
  withResult,
  UserRole
} from '@/backend/action_utils'
import type {
  AdminProfile_Output,
  UpdateAdminProfile_Input,
  KpiStats_Output,
  ImportTaskOverview_Output,
  RetryTask_Input,
  StockAlert_Output,
  RecentProduct_Output,
  RecentUser_Output,
  ImportTaskStatus,
  ProductStatus,
  CategoryBrandShelfTree_Output,
  ShelfL1Node_Output,
  ListingStatsDetail_Output,
} from '@/backend/types/Dashboard'
import {
  isAggregatePricingCategoryName,
} from '@/shared/categoryPricing'
import { isAttributeOrFilterCategory } from '@/shared/categoryMatchGuards'
import {
  addDays,
  buildMonthSeries,
  buildSourceRows,
  buildWeekSeries,
  countListed,
  listingDateRangeWhere,
  percentChange,
  startOfMonth,
  startOfWeekMonday,
} from '@/backend/lib/listingStats'

export const getAdminProfile = requireRole(UserRole.ADMIN)(
  withResult(async (): Promise<AdminProfile_Output> => {
    const { userId } = getAuthContext()
    const user = await prisma.sysuser.findUnique({
      where: { id: userId },
      select: {
        account: true,
        username: true,
        email: true,
        avatarUrl: true
      }
    })

    if (!user) {
      throw new Error('当前用户信息不存在')
    }

    return user
  })
)

/**
 * 更新管理员个人资料（姓名、头像）
 */
export const updateAdminProfile = requireRole(UserRole.ADMIN)(
  withResult(async (input: UpdateAdminProfile_Input): Promise<AdminProfile_Output> => {
    const { userId } = getAuthContext()
    const username = (input.username || '').trim()
    if (!username) throw new Error('请填写姓名')

    const user = await prisma.sysuser.update({
      where: { id: userId },
      data: {
        username,
        avatarUrl: (input.avatarUrl || '').trim() || null,
      },
      select: {
        account: true,
        username: true,
        email: true,
        avatarUrl: true,
      },
    })

    return user
  }),
)

export const getKpiStats = requireRole(UserRole.ADMIN)(
  withResult(async (): Promise<KpiStats_Output> => {
    const now = new Date()
    const weekStart = startOfWeekMonday(now)
    const prevWeekStart = addDays(weekStart, -7)
    const monthStart = startOfMonth(now)
    const prevMonthStart = new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1)
    const nextMonthStart = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dayOfWeek = now.getDay()
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const thisWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff)
    thisWeekStart.setHours(0, 0, 0, 0)

    const [
      totalProductCount,
      listedProductCount,
      weekListedCount,
      prevWeekListedCount,
      monthListedCount,
      prevMonthListedCount,
      todayImportCount,
      lowStockAlertCount,
      newRegisteredUserCount,
      sources,
    ] = await Promise.all([
      prisma.product.count(),
      countListed(),
      countListed(listingDateRangeWhere(weekStart, addDays(weekStart, 7))),
      countListed(listingDateRangeWhere(prevWeekStart, weekStart)),
      countListed(listingDateRangeWhere(monthStart, nextMonthStart)),
      countListed(listingDateRangeWhere(prevMonthStart, monthStart)),
      prisma.importtask.count({ where: { createdAt: { gte: today } } }),
      prisma.productsku.count({
        where: {
          stock: { lte: 20 },
          product: { status: 'ACTIVE' as any },
        },
      }),
      prisma.sysuser.count({
        where: {
          role: 'CUSTOMER' as any,
          createdAt: { gte: thisWeekStart },
        },
      }),
      buildSourceRows(weekStart, monthStart),
    ])

    return {
      totalProductCount,
      listedProductCount,
      weekListedCount,
      monthListedCount,
      prevWeekListedCount,
      prevMonthListedCount,
      weekOverWeekPercent: percentChange(weekListedCount, prevWeekListedCount),
      monthOverMonthPercent: percentChange(monthListedCount, prevMonthListedCount),
      weekListedDelta: weekListedCount - prevWeekListedCount,
      monthListedDelta: monthListedCount - prevMonthListedCount,
      todayImportCount,
      lowStockAlertCount,
      newRegisteredUserCount,
      sources,
    }
  })
)

export const getListingStatsDetail = requireRole(UserRole.ADMIN)(
  withResult(async (): Promise<ListingStatsDetail_Output> => {
    const weekStart = startOfWeekMonday()
    const monthStart = startOfMonth()
    const [listedProductCount, weeks, months, sources] = await Promise.all([
      countListed(),
      buildWeekSeries(12),
      buildMonthSeries(12),
      buildSourceRows(weekStart, monthStart),
    ])
    return {
      generatedAt: new Date().toISOString(),
      listedProductCount,
      weeks,
      months,
      sources,
    }
  }),
)

export const getImportTasksOverview = requireRole(UserRole.ADMIN)(
  withResult(async (): Promise<ImportTaskOverview_Output[]> => {
    const list = await prisma.importtask.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: {
        id: true,
        taskName: true,
        status: true,
        progressPercent: true,
        createdAt: true
      }
    })

    return list.map((item) => ({
      id: item.id,
      taskName: item.taskName,
      status: item.status as ImportTaskStatus,
      progressPercent: item.progressPercent,
      createdAt: item.createdAt
    }))
  })
)

export const retryImportTask = requireRole(UserRole.ADMIN)(
  withResult(async (input: RetryTask_Input): Promise<void> => {
    await prisma.$transaction(async (tx) => {
      const task = await tx.importtask.findUnique({
        where: { id: input.id },
        select: { id: true, status: true }
      })

      if (!task) {
        throw new Error('导入任务不存在')
      }

      if ((task.status as string) !== 'FAILED') {
        throw new Error('只有失败的任务才可以重试')
      }

      // 重置主任务状态为 PENDING，并重置进度和失败统计
      await tx.importtask.update({
        where: { id: input.id },
        data: {
          status: 'PENDING' as any,
          progressPercent: 0,
          failureCount: 0
        }
      })

      // 清空该任务下所有明细的失败原因
      await tx.importtaskitem.updateMany({
        where: { importTaskId: input.id },
        data: {
          failureReason: null
        }
      })
    })
  })
)

export const getStockAlerts = requireRole(UserRole.ADMIN)(
  withResult(async (): Promise<StockAlert_Output[]> => {
    const list = await prisma.productsku.findMany({
      where: {
        stock: { lte: 20 },
        product: {
          status: 'ACTIVE' as any
        }
      },
      take: 10,
      select: {
        id: true,
        skuCode: true,
        stock: true,
        product: {
          select: {
            name: true
          }
        }
      }
    })

    return list.map((item) => ({
      id: item.id,
      skuCode: item.skuCode,
      productName: item.product.name,
      stock: item.stock
    }))
  })
)

export const getRecentProducts = requireRole(UserRole.ADMIN)(
  withResult(async (): Promise<RecentProduct_Output[]> => {
    const list = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        productCode: true,
        name: true,
        status: true,
        mainImageUrl: true,
        createdAt: true,
        category: {
          select: {
            name: true
          }
        },
        skus: {
          take: 1,
          select: {
            price: true
          }
        }
      }
    })

    return list.map((item) => ({
      id: item.id,
      productCode: item.productCode,
      name: item.name,
      categoryName: item.category?.name || '',
      price: item.skus?.[0]?.price ? item.skus[0].price.toNumber() : 0,
      status: item.status as ProductStatus,
      mainImageUrl: item.mainImageUrl,
      createdAt: item.createdAt
    }))
  })
)

const hasCategoryParentId = (parentId?: string | null) => {
  const text = String(parentId || '').trim()
  return text.length > 0 && text !== '0'
}

const isLevel1 = (cat: { level?: number | null; parentId?: string | null }) =>
  !hasCategoryParentId(cat.parentId) && Number(cat.level) !== 2

const BRAND_SHELF_NAME_RE = /^(brand|brands|品牌)$/i

export const getCategoryBrandShelfTree = requireRole(UserRole.ADMIN)(
  withResult(async (): Promise<CategoryBrandShelfTree_Output> => {
    const categories = await prisma.category.findMany({
      where: { status: 'ACTIVE' as any },
      select: {
        id: true,
        parentId: true,
        level: true,
        name: true,
        slug: true,
        sortWeight: true,
        isBrandCategory: true,
      },
      orderBy: [{ sortWeight: 'desc' }, { name: 'asc' }],
    })

    const byId = new Map(categories.map((cat) => [cat.id, cat]))
    const brandShelfIds = new Set(
      categories
        .filter(
          (cat) =>
            isLevel1(cat) &&
            (cat.isBrandCategory || BRAND_SHELF_NAME_RE.test(String(cat.name || '').trim())),
        )
        .map((cat) => cat.id),
    )

    const brandTags = categories.filter((cat) => {
      if (!hasCategoryParentId(cat.parentId)) return false
      if (cat.isBrandCategory) return true
      return Boolean(cat.parentId && brandShelfIds.has(cat.parentId))
    })
    const brandTagIds = new Set(brandTags.map((cat) => cat.id))

    const parentNameOf = (cat: { parentId?: string | null }) =>
      cat.parentId ? byId.get(cat.parentId)?.name || null : null

    const l1Shelves = categories.filter((cat) => {
      if (!isLevel1(cat)) return false
      if (brandShelfIds.has(cat.id)) return false
      if (isAggregatePricingCategoryName(cat.name)) return false
      if (isAttributeOrFilterCategory({ name: cat.name })) return false
      return true
    })
    const l1Ids = new Set(l1Shelves.map((cat) => cat.id))

    const l2Shelves = categories.filter((cat) => {
      if (!hasCategoryParentId(cat.parentId) || !cat.parentId) return false
      if (!l1Ids.has(cat.parentId)) return false
      if (brandTagIds.has(cat.id) || cat.isBrandCategory) return false
      if (
        isAttributeOrFilterCategory({
          name: cat.name,
          parentName: parentNameOf(cat),
        })
      ) {
        return false
      }
      return true
    })
    const l2Ids = new Set(l2Shelves.map((cat) => cat.id))
    const l2IdsByL1 = new Map<string, string[]>()
    for (const child of l2Shelves) {
      if (!child.parentId) continue
      const list = l2IdsByL1.get(child.parentId)
      if (list) list.push(child.id)
      else l2IdsByL1.set(child.parentId, [child.id])
    }

    const [products, relationRows] = await Promise.all([
      prisma.product.findMany({
        where: { status: 'ACTIVE' as any },
        select: {
          id: true,
          categoryId: true,
          brandCategoryId: true,
        },
      }),
      prisma.product_category_relations.findMany({
        select: { productId: true, categoryId: true },
      }),
    ])

    const extraByProduct = new Map<string, string[]>()
    for (const row of relationRows) {
      const list = extraByProduct.get(row.productId)
      if (list) list.push(row.categoryId)
      else extraByProduct.set(row.productId, [row.categoryId])
    }

    const l2ProductSets = new Map<string, Set<string>>()
    const l1UnmatchedSets = new Map<string, Set<string>>()
    const l2BrandSets = new Map<string, Map<string, Set<string>>>()
    const l2UnmatchedBrand = new Map<string, Set<string>>()

    const rememberL2 = (l2Id: string, productId: string) => {
      if (!l2ProductSets.has(l2Id)) l2ProductSets.set(l2Id, new Set())
      l2ProductSets.get(l2Id)!.add(productId)
    }
    const rememberL1Unmatched = (l1Id: string, productId: string) => {
      if (!l1UnmatchedSets.has(l1Id)) l1UnmatchedSets.set(l1Id, new Set())
      l1UnmatchedSets.get(l1Id)!.add(productId)
    }
    const rememberBrand = (l2Id: string, brandId: string, productId: string) => {
      if (!l2BrandSets.has(l2Id)) l2BrandSets.set(l2Id, new Map())
      const byBrand = l2BrandSets.get(l2Id)!
      if (!byBrand.has(brandId)) byBrand.set(brandId, new Set())
      byBrand.get(brandId)!.add(productId)
    }
    const rememberUnmatchedBrand = (l2Id: string, productId: string) => {
      if (!l2UnmatchedBrand.has(l2Id)) l2UnmatchedBrand.set(l2Id, new Set())
      l2UnmatchedBrand.get(l2Id)!.add(productId)
    }

    for (const product of products) {
      const linkedIds = [product.categoryId, ...(extraByProduct.get(product.id) || [])]
      const matchedL2 = new Set<string>()
      const matchedL1 = new Set<string>()

      for (const categoryId of linkedIds) {
        if (l2Ids.has(categoryId)) {
          matchedL2.add(categoryId)
          continue
        }
        if (l1Ids.has(categoryId)) matchedL1.add(categoryId)
      }

      for (const l2Id of matchedL2) rememberL2(l2Id, product.id)

      for (const l1Id of matchedL1) {
        const hasChild = (l2IdsByL1.get(l1Id) || []).some((id) => matchedL2.has(id))
        if (!hasChild) rememberL1Unmatched(l1Id, product.id)
      }

      let brandId =
        product.brandCategoryId && brandTagIds.has(product.brandCategoryId)
          ? product.brandCategoryId
          : linkedIds.find((id) => brandTagIds.has(id)) || null

      const l2Targets = matchedL2.size > 0 ? Array.from(matchedL2) : []
      if (l2Targets.length === 0) continue
      for (const l2Id of l2Targets) {
        if (brandId) rememberBrand(l2Id, brandId, product.id)
        else rememberUnmatchedBrand(l2Id, product.id)
      }
    }

    const sortedBrands = [...brandTags].sort((a, b) =>
      String(a.name).localeCompare(String(b.name), 'en', { sensitivity: 'base' }),
    )

    let emptyL2Count = 0
    let emptyBrandSlotCount = 0

    const tree: ShelfL1Node_Output[] = l1Shelves.map((l1) => {
      const children = l2Shelves.filter((child) => child.parentId === l1.id)
      const unmatchedL2Count = l1UnmatchedSets.get(l1.id)?.size || 0
      const childNodes = children.map((l2) => {
        const count = l2ProductSets.get(l2.id)?.size || 0
        if (count === 0) emptyL2Count += 1
        const brandCountMap = l2BrandSets.get(l2.id)
        const brands = sortedBrands.map((brand) => {
          const n = brandCountMap?.get(brand.id)?.size || 0
          if (n === 0) emptyBrandSlotCount += 1
          return {
            id: brand.id,
            name: brand.name,
            slug: brand.slug,
            count: n,
          }
        })
        const emptyBrandCount = brands.filter((item) => item.count === 0).length
        return {
          id: l2.id,
          name: l2.name,
          slug: l2.slug,
          count,
          emptyBrandCount,
          unmatchedBrandCount: l2UnmatchedBrand.get(l2.id)?.size || 0,
          brands,
        }
      })

      const childSum = childNodes.reduce((sum, node) => sum + node.count, 0)
      return {
        id: l1.id,
        name: l1.name,
        slug: l1.slug,
        count: childSum + unmatchedL2Count,
        emptyChildCount: childNodes.filter((node) => node.count === 0).length,
        unmatchedL2Count,
        children: childNodes,
      }
    })

    return {
      generatedAt: new Date().toISOString(),
      activeProductCount: products.length,
      emptyL2Count,
      emptyBrandSlotCount,
      tree,
    }
  }),
)

export const getRecentUsers = requireRole(UserRole.ADMIN)(
  withResult(async (): Promise<RecentUser_Output[]> => {
    const list = await prisma.sysuser.findMany({
      where: {
        role: 'CUSTOMER' as any
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        createdAt: true
      }
    })

    return list.map((item) => ({
      id: item.id,
      username: item.username,
      email: item.email,
      avatarUrl: item.avatarUrl,
      createdAt: item.createdAt
    }))
  })
)