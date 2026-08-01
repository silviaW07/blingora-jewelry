'use server'

// ===== Enums =====
/** 用户角色：普通用户(CUSTOMER) | 管理员(ADMIN) */
export type UserRoleType = 'CUSTOMER' | 'ADMIN'

/** 产品状态：草稿(DRAFT) | 上架(ACTIVE) | 下架(INACTIVE) */
export type ProductStatusType = 'DRAFT' | 'ACTIVE' | 'INACTIVE'

/** 导入任务状态：待处理(PENDING) | 解析中(RUNNING) | 已完成(COMPLETED) | 失败(FAILED) */
export type ImportTaskStatusType = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'

// ===== Data Structures =====

export interface CategoryOption {
  category_id: string // data-from: category-id
  category_name: string // data-from: category-name
}

export interface StockStrategyJson {
  type?: string
  stock?: number
}

export interface SpecSummaryJson {
  name?: string
  values?: string[]
}

export interface PreviewDataJson {
  name?: string
  categoryId?: string
  price?: number
  mainImageUrl?: string
  shortDescription?: string
}

export interface ImportTaskItemRecord {
  item_id: string // data-from: importtaskitem-id
  item_importTaskId: string // data-from: importtaskitem-importTaskId
  item_sourceUrl: string // data-from: importtaskitem-sourceUrl
  item_parsedName: string | null // data-from: importtaskitem-parsedName
  item_parsedMainImageUrl: string | null // data-from: importtaskitem-parsedMainImageUrl
  item_parsedPriceMin: string | null // data-from: importtaskitem-parsedPriceMin
  item_parsedPriceMax: string | null // data-from: importtaskitem-parsedPriceMax
  item_specSummaryJson: SpecSummaryJson[] | null // data-from: importtaskitem-specSummaryJson
  item_previewDataJson: PreviewDataJson | null // data-from: importtaskitem-previewDataJson
  item_isSelected: boolean // data-from: importtaskitem-isSelected
  item_importedProductId: string | null // data-from: importtaskitem-importedProductId
  item_failureReason: string | null // data-from: importtaskitem-failureReason
  item_createdAt: Date // data-from: importtaskitem-createdAt
}

export interface ImportTaskRecord {
  task_id: string // data-from: importtask-id
  task_taskName: string // data-from: importtask-taskName
  task_status: ImportTaskStatusType // data-from: importtask-status
  task_sourceLinkCount: number // data-from: importtask-sourceLinkCount
  task_successCount: number // data-from: importtask-successCount
  task_failureCount: number // data-from: importtask-failureCount
  task_progressPercent: number // data-from: importtask-progressPercent
  task_markupRate: string | null // data-from: importtask-markupRate
  task_defaultStatus: ProductStatusType // data-from: importtask-defaultStatus
  task_defaultCategoryId: string | null // data-from: importtask-defaultCategoryId
  task_stockStrategyJson: StockStrategyJson | null // data-from: importtask-stockStrategyJson
  task_createdAt: Date // data-from: importtask-createdAt
}

// ===== Input / Output =====

export interface GetCategoryOptionsOutput {
  list: CategoryOption[]
}

export interface GetImportTaskListInput {
  status?: ImportTaskStatusType | ''
  page?: number
  pageSize?: number
}

export interface GetImportTaskListOutput {
  list: ImportTaskRecord[]
  total: number
}

export interface GetImportTaskDetailInput {
  taskId: string
}

export interface GetImportTaskDetailOutput {
  task: ImportTaskRecord
  items: ImportTaskItemRecord[]
}

export interface CreateImportTaskInput {
  urls: string // 换行符分隔的多行链接
  defaultCategoryId?: string
  markupRate?: number // 加价比例百分比，如 20 代表 20%
  defaultStatus: ProductStatusType
  stockStrategyStock?: number // 简化的库存策略值
}

export interface CreateImportTaskOutput {
  taskId: string
}

export interface StartParseTaskInput {
  taskId: string
}

export interface UpdateTaskItemPreviewInput {
  itemId: string
  previewData: PreviewDataJson
}

export interface ConfirmImportProductsInput {
  taskId: string
  itemIds: string[]
}

export interface RetryImportTaskInput {
  taskId: string
}

export interface DeleteImportTaskInput {
  taskId: string
}

// ===== Imports =====
import prisma from '@/tools/prisma'
import { Prisma } from '@prisma/client'
import {
  requireRole,
  getAuthContext,
  withResult,
  UserRole
} from '@/backend/action_utils'

// ===== Actions =====

/**
 * 获取可用分类列表（供任务配置及字段修正使用）
 */
export const getCategoryOptions = requireRole([UserRole.ADMIN])(
  withResult(async (): Promise<GetCategoryOptionsOutput> => {
    const categories = await prisma.category.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true },
      orderBy: { sortWeight: 'desc' }
    })

    return {
      list: categories.map(c => ({
        category_id: c.id,
        category_name: c.name
      }))
    }
  })
)

/**
 * 获取任务记录列表
 */
export const getImportTaskList = requireRole([UserRole.ADMIN])(
  withResult(async (input: GetImportTaskListInput): Promise<GetImportTaskListOutput> => {
    const page = input.page && input.page > 0 ? input.page : 1
    const pageSize = input.pageSize && input.pageSize > 0 ? input.pageSize : 20
    const skip = (page - 1) * pageSize

    const where = {
      ...(input.status ? { status: input.status as any } : {})
    }

    const [total, tasks] = await Promise.all([
      prisma.importtask.count({ where }),
      prisma.importtask.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' }
      })
    ])

    return {
      total,
      list: tasks.map(t => ({
        task_id: t.id,
        task_taskName: t.taskName,
        task_status: t.status as ImportTaskStatusType,
        task_sourceLinkCount: t.sourceLinkCount,
        task_successCount: t.successCount,
        task_failureCount: t.failureCount,
        task_progressPercent: t.progressPercent,
        task_markupRate: t.markupRate?.toString() || null,
        task_defaultStatus: t.defaultStatus as ProductStatusType,
        task_defaultCategoryId: t.defaultCategoryId,
        task_stockStrategyJson: (t.stockStrategyJson as unknown as StockStrategyJson) || null,
        task_createdAt: t.createdAt
      }))
    }
  })
)

/**
 * 获取导入任务详情及明细
 */
export const getImportTaskDetail = requireRole([UserRole.ADMIN])(
  withResult(async (input: GetImportTaskDetailInput): Promise<GetImportTaskDetailOutput> => {
    const task = await prisma.importtask.findUnique({
      where: { id: input.taskId },
      include: {
        items: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!task) {
      throw new Error('未找到该导入任务')
    }

    return {
      task: {
        task_id: task.id,
        task_taskName: task.taskName,
        task_status: task.status as ImportTaskStatusType,
        task_sourceLinkCount: task.sourceLinkCount,
        task_successCount: task.successCount,
        task_failureCount: task.failureCount,
        task_progressPercent: task.progressPercent,
        task_markupRate: task.markupRate?.toString() || null,
        task_defaultStatus: task.defaultStatus as ProductStatusType,
        task_defaultCategoryId: task.defaultCategoryId,
        task_stockStrategyJson: (task.stockStrategyJson as unknown as StockStrategyJson) || null,
        task_createdAt: task.createdAt
      },
      items: task.items.map(item => ({
        item_id: item.id,
        item_importTaskId: item.importTaskId,
        item_sourceUrl: item.sourceUrl,
        item_parsedName: item.parsedName,
        item_parsedMainImageUrl: item.parsedMainImageUrl,
        item_parsedPriceMin: item.parsedPriceMin?.toString() || null,
        item_parsedPriceMax: item.parsedPriceMax?.toString() || null,
        item_specSummaryJson: (item.specSummaryJson as unknown as SpecSummaryJson[]) || null,
        item_previewDataJson: (item.previewDataJson as unknown as PreviewDataJson) || null,
        item_isSelected: item.isSelected,
        item_importedProductId: item.importedProductId,
        item_failureReason: item.failureReason,
        item_createdAt: item.createdAt
      }))
    }
  })
)

/**
 * 创建导入任务
 */
export const createImportTask = requireRole([UserRole.ADMIN])(
  withResult(async (input: CreateImportTaskInput): Promise<CreateImportTaskOutput> => {
    const { userId } = getAuthContext()

    // 去重与校验
    const rawUrls = input.urls.split('\n').map(u => u.trim()).filter(Boolean)
    const uniqueUrls = Array.from(new Set(rawUrls))
    
    if (uniqueUrls.length === 0) {
      throw new Error('请输入有效的商品链接')
    }

    const validUrls = uniqueUrls.filter(u => u.startsWith('http://') || u.startsWith('https://'))
    if (validUrls.length === 0) {
      throw new Error('链接格式不正确，需以 http 或 https 开头')
    }

    // 构建库存策略 JSON
    let stockStrategyJson: any = null
    if (typeof input.stockStrategyStock === 'number') {
      stockStrategyJson = { type: 'fixed', stock: input.stockStrategyStock }
    }

    const taskName = `导入任务 ${new Date().toLocaleString('zh-CN')}`

    const task = await prisma.$transaction(async (tx) => {
      const newTask = await tx.importtask.create({
        data: {
          creatorId: userId,
          taskName,
          status: 'PENDING',
          sourceLinkCount: validUrls.length,
          successCount: 0,
          failureCount: 0,
          progressPercent: 0,
          markupRate: input.markupRate !== undefined ? input.markupRate : null,
          defaultStatus: input.defaultStatus as any,
          defaultCategoryId: input.defaultCategoryId || null,
          stockStrategyJson
        }
      })

      // 批量创建任务明细
      await tx.importtaskitem.createMany({
        data: validUrls.map(url => ({
          importTaskId: newTask.id,
          operatorId: userId,
          sourceUrl: url,
          isSelected: true // 默认选中，方便解析完成后直接确认
        }))
      })

      return newTask
    })

    return { taskId: task.id }
  })
)

/**
 * 开始解析导入任务（模拟后台解析逻辑）
 */
export const startParseTask = requireRole([UserRole.ADMIN])(
  withResult(async (input: StartParseTaskInput): Promise<void> => {
    const task = await prisma.importtask.findUnique({
      where: { id: input.taskId },
      include: { items: true }
    })

    if (!task) throw new Error('未找到该导入任务')
    if (task.status !== 'PENDING') throw new Error('只有待处理状态的任务才可以开始解析')

    // 1. 将状态更新为 RUNNING
    await prisma.importtask.update({
      where: { id: task.id },
      data: { status: 'RUNNING' }
    })

    // 2. 模拟解析过程
    let successCount = 0
    let failureCount = 0
    const markupRateNum = task.markupRate ? task.markupRate.toNumber() : 0

    await prisma.$transaction(async (tx) => {
      for (const item of task.items) {
        // 简单模拟：如果 URL 包含 "error" 字符串则解析失败，否则解析成功
        if (item.sourceUrl.includes('error')) {
          failureCount++
          await tx.importtaskitem.update({
            where: { id: item.id },
            data: { failureReason: '网络超时或链接失效，抓取失败' }
          })
        } else {
          successCount++
          const basePrice = 50 + Math.floor(Math.random() * 50)
          const finalPrice = Number((basePrice * (1 + markupRateNum / 100)).toFixed(2))

          const previewData: PreviewDataJson = {
            name: `[1688抓取] 工业配件 ${item.id.slice(0, 6)}`,
            categoryId: task.defaultCategoryId || undefined,
            price: finalPrice,
            mainImageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158',
            shortDescription: '自动抓取的商品简介内容，请根据需要修改。'
          }

          await tx.importtaskitem.update({
            where: { id: item.id },
            data: {
              parsedName: previewData.name,
              parsedMainImageUrl: previewData.mainImageUrl,
              parsedPriceMin: basePrice,
              parsedPriceMax: basePrice + 20,
              specSummaryJson: [{ name: '规格', values: ['标准版'] }] as any,
              previewDataJson: previewData as any
            }
          })
        }
      }

      // 更新主任务状态
      const isAllFailed = failureCount === task.sourceLinkCount
      await tx.importtask.update({
        where: { id: task.id },
        data: {
          status: isAllFailed ? 'FAILED' : 'COMPLETED',
          successCount,
          failureCount,
          progressPercent: 100
        }
      })
    })
  })
)

/**
 * 字段修正（更新预览数据）
 */
export const updateTaskItemPreview = requireRole([UserRole.ADMIN])(
  withResult(async (input: UpdateTaskItemPreviewInput): Promise<void> => {
    const item = await prisma.importtaskitem.findUnique({
      where: { id: input.itemId },
      include: { importTask: true }
    })

    if (!item) throw new Error('未找到该导入明细')
    if (item.importTask.status === 'RUNNING') throw new Error('解析中任务不可修改')

    const currentPreview = (item.previewDataJson as unknown as PreviewDataJson) || {}
    const newPreview: PreviewDataJson = {
      ...currentPreview,
      ...input.previewData
    }

    await prisma.importtaskitem.update({
      where: { id: input.itemId },
      data: {
        previewDataJson: newPreview as any,
        isSelected: true // 只要修改了，默认让其选中
      }
    })
  })
)

/**
 * 确认勾选并导入为商品
 */
export const confirmImportProducts = requireRole([UserRole.ADMIN])(
  withResult(async (input: ConfirmImportProductsInput): Promise<void> => {
    if (input.itemIds.length === 0) {
      throw new Error('请至少勾选一项进行导入')
    }

    const task = await prisma.importtask.findUnique({
      where: { id: input.taskId }
    })

    if (!task) throw new Error('未找到任务记录')
    if (task.status !== 'COMPLETED') throw new Error('任务尚未完成解析，无法导入')

    const items = await prisma.importtaskitem.findMany({
      where: { 
        id: { in: input.itemIds },
        importTaskId: input.taskId,
        importedProductId: null // 排除已经导入的
      }
    })

    if (items.length === 0) throw new Error('所选项均已导入过或不存在')

    const stockStrategy = (task.stockStrategyJson as unknown as StockStrategyJson) || {}
    const defaultStock = stockStrategy.type === 'fixed' && stockStrategy.stock ? stockStrategy.stock : 0

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const preview = (item.previewDataJson as unknown as PreviewDataJson)
        
        if (!preview || !preview.name || !preview.categoryId || !preview.price || !preview.mainImageUrl) {
          throw new Error(`明细项 [${item.sourceUrl}] 数据不完整，请补充必填字段（名称/分类/价格/主图）`)
        }

        const uniqueSuffix = Date.now().toString() + Math.floor(Math.random() * 1000).toString()
        const productCode = `IMP-${uniqueSuffix}`
        const slug = `p-${uniqueSuffix}`
        const skuCode = `SKU-${uniqueSuffix}`

        // 创建商品
        const newProduct = await tx.product.create({
          data: {
            categoryId: preview.categoryId,
            name: preview.name,
            slug: slug,
            productCode: productCode,
            source: 'IMPORT_1688',
            status: task.defaultStatus as any,
            mainImageUrl: preview.mainImageUrl,
            galleryJson: [{ url: preview.mainImageUrl, sort: 1 }],
            shortDescription: preview.shortDescription,
            skus: {
              create: [{
                skuCode: skuCode,
                imageUrl: preview.mainImageUrl,
                price: preview.price,
                stock: defaultStock,
                stockStatus: defaultStock > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
                attributeJson: []
              }]
            }
          }
        })

        // 回写 productId 到明细
        await tx.importtaskitem.update({
          where: { id: item.id },
          data: { importedProductId: newProduct.id }
        })
      }
    })
  })
)

/**
 * 重试解析失败的任务
 */
export const retryImportTask = requireRole([UserRole.ADMIN])(
  withResult(async (input: RetryImportTaskInput): Promise<void> => {
    const task = await prisma.importtask.findUnique({
      where: { id: input.taskId }
    })

    if (!task) throw new Error('未找到该任务')
    if (task.status !== 'FAILED') throw new Error('仅可重试 FAILED 状态的任务')

    await prisma.$transaction(async (tx) => {
      // 任务状态切回 PENDING
      await tx.importtask.update({
        where: { id: input.taskId },
        data: {
          status: 'PENDING',
          progressPercent: 0,
          failureCount: 0,
          successCount: 0
        }
      })

      // 清空所有明细的失败原因和解析结果，准备重新抓取
      await tx.importtaskitem.updateMany({
        where: { importTaskId: input.taskId },
        data: {
          failureReason: null,
          parsedName: null,
          parsedMainImageUrl: null,
          parsedPriceMin: null,
          parsedPriceMax: null,
          specSummaryJson: Prisma.DbNull,
          previewDataJson: Prisma.DbNull
        }
      })
    })
  })
)

/**
 * 删除已完成或失败的任务记录
 */
export const deleteImportTask = requireRole([UserRole.ADMIN])(
  withResult(async (input: DeleteImportTaskInput): Promise<void> => {
    const task = await prisma.importtask.findUnique({
      where: { id: input.taskId }
    })

    if (!task) throw new Error('未找到该任务')
    if (task.status === 'RUNNING') throw new Error('解析中的任务禁止删除')

    await prisma.$transaction(async (tx) => {
      // 级联删除相关的 item 记录（已创建的 product 不受影响，因为关系保存在 product 自身）
      await tx.importtaskitem.deleteMany({
        where: { importTaskId: input.taskId }
      })

      await tx.importtask.delete({
        where: { id: input.taskId }
      })
    })
  })
)
