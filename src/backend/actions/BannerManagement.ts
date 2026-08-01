'use server'

// ===== Enums =====
/** Banner 状态筛选：全部(ALL) | 已启用(ENABLED) | 已禁用(DISABLED) */
export type BannerFilterStatus = 'ALL' | 'ENABLED' | 'DISABLED'

// ===== Data Structures =====
export interface BannerItem {
  banner_id: string          // data-from: categorybanner-id
  banner_title: string | null // data-from: categorybanner-title
  banner_imageUrl: string    // data-from: categorybanner-imageUrl
  banner_linkUrl: string     // data-from: categorybanner-linkUrl
  banner_sortWeight: number  // data-from: categorybanner-sortWeight
  banner_isEnabled: boolean  // data-from: categorybanner-isEnabled
  banner_updatedAt: string   // data-from: categorybanner-updatedAt
}

// ===== Input / Output =====
export interface GetBannerListInput {
  search_keyword?: string
  filter_status?: BannerFilterStatus
  page?: number
  page_size?: number
}
export interface GetBannerListOutput {
  list: BannerItem[]
  total: number
}

export interface CreateBannerInput {
  banner_title?: string | null
  banner_imageUrl: string
  banner_linkUrl: string
  banner_sortWeight: number
  banner_isEnabled: boolean
}
export interface CreateBannerOutput {
  success: boolean
}

export interface UpdateBannerInput {
  banner_id: string
  banner_title?: string | null
  banner_imageUrl: string
  banner_linkUrl: string
  banner_sortWeight: number
  banner_isEnabled: boolean
}
export interface UpdateBannerOutput {
  success: boolean
}

export interface DeleteBannerInput {
  banner_id: string
}
export interface DeleteBannerOutput {
  success: boolean
}

export interface BatchDeleteBannersInput {
  banner_ids: string[]
}
export interface BatchDeleteBannersOutput {
  count: number
}

export interface BatchUpdateBannerStatusInput {
  banner_ids: string[]
  banner_isEnabled: boolean
}
export interface BatchUpdateBannerStatusOutput {
  count: number
}

export interface UpdateBannerSortWeightInput {
  banner_id: string
  banner_sortWeight: number
}
export interface UpdateBannerSortWeightOutput {
  success: boolean
}

export interface UpdateBannerStatusInput {
  banner_id: string
  banner_isEnabled: boolean
}
export interface UpdateBannerStatusOutput {
  success: boolean
}

// ===== Imports =====
import prisma from '@/tools/prisma'
import {
  requireRole,
  withResult,
  UserRole
} from '@/backend/action_utils'

// ===== Actions =====

/**
 * 获取 Banner 列表
 */
export const getBannerList = requireRole([UserRole.ADMIN])(
  withResult(async (input: GetBannerListInput): Promise<GetBannerListOutput> => {
    const {
      search_keyword = '',
      filter_status = 'ALL',
      page = 1,
      page_size = 50,
    } = input

    const safePageSize = Math.max(1, Math.min(200, Math.floor(Number(page_size) || 50)))
    const skip = Math.max(0, (page - 1) * safePageSize)
    const take = safePageSize

    const where: NonNullable<Parameters<typeof prisma.categorybanner.findMany>[0]>['where'] = {
      ...(search_keyword ? { title: { contains: search_keyword } } : {}),
      ...(filter_status === 'ENABLED' ? { isEnabled: true } : {}),
      ...(filter_status === 'DISABLED' ? { isEnabled: false } : {}),
    }

    const [total, records] = await prisma.$transaction([
      prisma.categorybanner.count({ where }),
      prisma.categorybanner.findMany({
        where,
        orderBy: [
          { sortWeight: 'desc' },
          { updatedAt: 'desc' }
        ],
        skip,
        take,
      }),
    ])

    const list: BannerItem[] = records.map(record => ({
      banner_id: record.id,
      banner_title: record.title,
      banner_imageUrl: record.imageUrl,
      banner_linkUrl: record.linkUrl,
      banner_sortWeight: record.sortWeight,
      banner_isEnabled: record.isEnabled,
      banner_updatedAt: record.updatedAt.toISOString(),
    }))

    return { list, total }
  })
)

/**
 * 新增 Banner
 */
export const createBanner = requireRole([UserRole.ADMIN])(
  withResult(async (input: CreateBannerInput): Promise<CreateBannerOutput> => {
    if (!input.banner_imageUrl) {
      throw new Error('请上传封面图')
    }

    await prisma.categorybanner.create({
      data: {
        title: input.banner_title || null,
        imageUrl: input.banner_imageUrl,
        linkUrl: input.banner_linkUrl || '',
        sortWeight: input.banner_sortWeight,
        isEnabled: input.banner_isEnabled,
      }
    })

    return { success: true }
  })
)

/**
 * 编辑 Banner
 */
export const updateBanner = requireRole([UserRole.ADMIN])(
  withResult(async (input: UpdateBannerInput): Promise<UpdateBannerOutput> => {
    if (!input.banner_id) throw new Error('Banner ID 不能为空')
    if (!input.banner_imageUrl) throw new Error('请上传封面图')

    await prisma.categorybanner.update({
      where: { id: input.banner_id },
      data: {
        title: input.banner_title || null,
        imageUrl: input.banner_imageUrl,
        linkUrl: input.banner_linkUrl || '',
        sortWeight: input.banner_sortWeight,
        isEnabled: input.banner_isEnabled,
      }
    })

    return { success: true }
  })
)

/**
 * 删除单个 Banner
 */
export const deleteBanner = requireRole([UserRole.ADMIN])(
  withResult(async (input: DeleteBannerInput): Promise<DeleteBannerOutput> => {
    if (!input.banner_id) throw new Error('Banner ID 不能为空')

    await prisma.categorybanner.delete({
      where: { id: input.banner_id }
    })

    return { success: true }
  })
)

/**
 * 批量删除 Banner
 */
export const batchDeleteBanners = requireRole([UserRole.ADMIN])(
  withResult(async (input: BatchDeleteBannersInput): Promise<BatchDeleteBannersOutput> => {
    if (!input.banner_ids || input.banner_ids.length === 0) {
      throw new Error('请选择要删除的 Banner')
    }

    const result = await prisma.categorybanner.deleteMany({
      where: { id: { in: input.banner_ids } }
    })

    return { count: result.count }
  })
)

/**
 * 批量更新 Banner 启用状态
 */
export const batchUpdateBannerStatus = requireRole([UserRole.ADMIN])(
  withResult(async (input: BatchUpdateBannerStatusInput): Promise<BatchUpdateBannerStatusOutput> => {
    if (!input.banner_ids || input.banner_ids.length === 0) {
      throw new Error('请选择要更新的 Banner')
    }

    const result = await prisma.categorybanner.updateMany({
      where: { id: { in: input.banner_ids } },
      data: { isEnabled: input.banner_isEnabled }
    })

    return { count: result.count }
  })
)

/**
 * 快捷修改排序权重
 */
export const updateBannerSortWeight = requireRole([UserRole.ADMIN])(
  withResult(async (input: UpdateBannerSortWeightInput): Promise<UpdateBannerSortWeightOutput> => {
    if (!input.banner_id) throw new Error('Banner ID 不能为空')

    await prisma.categorybanner.update({
      where: { id: input.banner_id },
      data: { sortWeight: input.banner_sortWeight }
    })

    return { success: true }
  })
)

/**
 * 快捷修改启用状态
 */
export const updateBannerStatus = requireRole([UserRole.ADMIN])(
  withResult(async (input: UpdateBannerStatusInput): Promise<UpdateBannerStatusOutput> => {
    if (!input.banner_id) throw new Error('Banner ID 不能为空')

    await prisma.categorybanner.update({
      where: { id: input.banner_id },
      data: { isEnabled: input.banner_isEnabled }
    })

    return { success: true }
  })
)