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
  KpiStats_Output,
  ImportTaskOverview_Output,
  RetryTask_Input,
  StockAlert_Output,
  RecentProduct_Output,
  RecentUser_Output,
  ImportTaskStatus,
  ProductStatus
} from '@/backend/types/Dashboard'

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

export const getKpiStats = requireRole(UserRole.ADMIN)(
  withResult(async (): Promise<KpiStats_Output> => {
    // 1. 获取总商品数
    const totalProductCount = await prisma.product.count()

    // 2. 获取今日创建的任务数
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayImportCount = await prisma.importtask.count({
      where: {
        createdAt: {
          gte: today
        }
      }
    })

    // 3. 获取库存预警数量（以20为阈值，必须且是 ACTIVE 商品的有效 SKU）
    const lowStockAlertCount = await prisma.productsku.count({
      where: {
        stock: { lte: 20 },
        product: {
          status: 'ACTIVE' as any
        }
      }
    })

    // 4. 获取本周新注册买家数（role = CUSTOMER）
    const now = new Date()
    const dayOfWeek = now.getDay()
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // 将周日转换为6，周一转换为0
    const thisWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff)
    thisWeekStart.setHours(0, 0, 0, 0)

    const newRegisteredUserCount = await prisma.sysuser.count({
      where: {
        role: 'CUSTOMER' as any,
        createdAt: {
          gte: thisWeekStart
        }
      }
    })

    return {
      totalProductCount,
      todayImportCount,
      lowStockAlertCount,
      newRegisteredUserCount
    }
  })
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