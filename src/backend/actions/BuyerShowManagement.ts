'use server'

export type BuyerShowMediaType = 'IMAGE' | 'VIDEO'
export type BuyerShowCommentStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface BuyerShowMediaItem {
  id: string
  mediaType: BuyerShowMediaType
  mediaUrl: string
  title: string | null
  sortWeight: number
  isEnabled: boolean
  createdAt: string
}

export interface BuyerShowCommentItem {
  id: string
  authorName: string
  content: string
  rating: number | null
  status: BuyerShowCommentStatus
  createdAt: string
}

export interface CreateBuyerShowMediaInput {
  mediaType: BuyerShowMediaType
  mediaUrl: string
  title?: string | null
  sortWeight?: number
  isEnabled?: boolean
}

export interface UpdateBuyerShowMediaInput {
  id: string
  title?: string | null
  sortWeight?: number
  isEnabled?: boolean
}

import prisma from '@/tools/prisma'
import { requireRole, withResult, UserRole } from '@/backend/action_utils'

function toMedia(row: {
  id: string
  mediaType: BuyerShowMediaType
  mediaUrl: string
  title: string | null
  sortWeight: number
  isEnabled: boolean
  createdAt: Date
}): BuyerShowMediaItem {
  return {
    id: row.id,
    mediaType: row.mediaType,
    mediaUrl: row.mediaUrl,
    title: row.title,
    sortWeight: row.sortWeight,
    isEnabled: row.isEnabled,
    createdAt: row.createdAt.toISOString(),
  }
}

export const listBuyerShowMediaAdmin = requireRole([UserRole.ADMIN, UserRole.SUB_ADMIN])(
  withResult(async (): Promise<{ list: BuyerShowMediaItem[] }> => {
    try {
      const records = await (prisma as any).buyershowmedia.findMany({
        orderBy: [{ sortWeight: 'desc' }, { createdAt: 'desc' }],
      })
      return { list: (records || []).map(toMedia) }
    } catch {
      return { list: [] }
    }
  }),
)

export const createBuyerShowMedia = requireRole([UserRole.ADMIN, UserRole.SUB_ADMIN])(
  withResult(async (input: CreateBuyerShowMediaInput): Promise<{ success: boolean; id: string }> => {
    const mediaUrl = String(input.mediaUrl || '').trim()
    if (!mediaUrl) throw new Error('请先上传图片或视频')
    const mediaType = input.mediaType === 'VIDEO' ? 'VIDEO' : 'IMAGE'
    const title = String(input.title || '').trim().slice(0, 160) || null
    const created = await (prisma as any).buyershowmedia.create({
      data: {
        mediaType,
        mediaUrl: mediaUrl.slice(0, 700),
        title,
        sortWeight: Number.isFinite(Number(input.sortWeight)) ? Number(input.sortWeight) : 0,
        isEnabled: input.isEnabled !== false,
      },
    })
    return { success: true, id: created.id }
  }),
)

export const updateBuyerShowMedia = requireRole([UserRole.ADMIN, UserRole.SUB_ADMIN])(
  withResult(async (input: UpdateBuyerShowMediaInput): Promise<{ success: boolean }> => {
    const title =
      input.title === undefined ? undefined : String(input.title || '').trim().slice(0, 160) || null
    await (prisma as any).buyershowmedia.update({
      where: { id: input.id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(input.sortWeight !== undefined ? { sortWeight: Number(input.sortWeight) || 0 } : {}),
        ...(input.isEnabled !== undefined ? { isEnabled: Boolean(input.isEnabled) } : {}),
      },
    })
    return { success: true }
  }),
)

export const deleteBuyerShowMedia = requireRole([UserRole.ADMIN, UserRole.SUB_ADMIN])(
  withResult(async (input: { id: string }): Promise<{ success: boolean }> => {
    await (prisma as any).buyershowmedia.delete({ where: { id: input.id } })
    return { success: true }
  }),
)

export const listBuyerShowCommentsAdmin = requireRole([UserRole.ADMIN, UserRole.SUB_ADMIN])(
  withResult(async (input?: { status?: BuyerShowCommentStatus | 'ALL' }): Promise<{ list: BuyerShowCommentItem[] }> => {
    try {
      const status = input?.status && input.status !== 'ALL' ? input.status : undefined
      const records = await (prisma as any).buyershowcomment.findMany({
        where: status ? { status } : {},
        orderBy: { createdAt: 'desc' },
        take: 500,
      })
      return {
        list: (records || []).map((row: any) => ({
          id: row.id,
          authorName: row.authorName,
          content: row.content,
          rating: typeof row.rating === 'number' ? row.rating : null,
          status: row.status,
          createdAt: row.createdAt.toISOString(),
        })),
      }
    } catch {
      return { list: [] }
    }
  }),
)

export const reviewBuyerShowComment = requireRole([UserRole.ADMIN, UserRole.SUB_ADMIN])(
  withResult(async (input: { id: string; status: 'APPROVED' | 'REJECTED' }): Promise<{ success: boolean }> => {
    await prisma.buyershowcomment.update({
      where: { id: input.id },
      data: { status: input.status, reviewedAt: new Date() },
    })
    return { success: true }
  }),
)

export const deleteBuyerShowComment = requireRole([UserRole.ADMIN, UserRole.SUB_ADMIN])(
  withResult(async (input: { id: string }): Promise<{ success: boolean }> => {
    await prisma.buyershowcomment.delete({ where: { id: input.id } })
    return { success: true }
  }),
)
