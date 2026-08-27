'use server'

import prisma from '@/tools/prisma'
import { tryGetAuthContext, withResult } from '@/frontend/action_utils'

export interface StorefrontBuyerShowMedia {
  id: string
  mediaType: 'IMAGE' | 'VIDEO'
  mediaUrl: string
  title: string | null
}

export interface StorefrontBuyerShowComment {
  id: string
  authorName: string
  content: string
  createdAt: string
}

export const getBuyerShowPage = withResult(async (): Promise<{
  media: StorefrontBuyerShowMedia[]
  comments: StorefrontBuyerShowComment[]
}> => {
  const [media, comments] = await Promise.all([
    prisma.buyershowmedia.findMany({
      where: { isEnabled: true },
      orderBy: [{ sortWeight: 'desc' }, { createdAt: 'desc' }],
      select: { id: true, mediaType: true, mediaUrl: true, title: true },
    }),
    prisma.buyershowcomment.findMany({
      where: { status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      take: 80,
      select: { id: true, authorName: true, content: true, createdAt: true },
    }),
  ])
  return {
    media,
    comments: comments.map((row) => ({
      id: row.id,
      authorName: row.authorName,
      content: row.content,
      createdAt: row.createdAt.toISOString(),
    })),
  }
})

export const submitBuyerShowComment = withResult(async (input: {
  authorName: string
  content: string
}): Promise<{ success: boolean }> => {
  const ctx = tryGetAuthContext()
  const authorName = String(input.authorName || ctx?.username || '').trim().slice(0, 80)
  const content = String(input.content || '').trim().slice(0, 800)
  if (authorName.length < 2) throw new Error('Please enter your name.')
  if (content.length < 4) throw new Error('Please write a short message.')
  await prisma.buyershowcomment.create({
    data: {
      authorName,
      content,
      status: 'PENDING',
    },
  })
  return { success: true }
})
