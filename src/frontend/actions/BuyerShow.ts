'use server'

import prisma from '@/tools/prisma'
import { withResult } from '@/frontend/action_utils'

export interface StorefrontBuyerShowMedia {
  id: string
  mediaType: 'IMAGE' | 'VIDEO'
  mediaUrl: string
  title: string | null
}

export const getBuyerShowPage = withResult(async (): Promise<{
  media: StorefrontBuyerShowMedia[]
}> => {
  try {
    const client = prisma as { buyershowmedia?: { findMany: (args: unknown) => Promise<StorefrontBuyerShowMedia[]> } }
    if (!client.buyershowmedia) return { media: [] }
    const media = await client.buyershowmedia.findMany({
      where: { isEnabled: true },
      orderBy: [{ sortWeight: 'desc' }, { createdAt: 'desc' }],
      select: { id: true, mediaType: true, mediaUrl: true, title: true },
    })
    const rows = Array.isArray(media) ? media : []
    return {
      media: rows.filter((item) => {
        const url = String(item.mediaUrl || '').trim()
        return url.startsWith('http') || url.startsWith('/') || url.startsWith('data:')
      }),
    }
  } catch {
    return { media: [] }
  }
})
