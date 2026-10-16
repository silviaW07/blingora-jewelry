'use server'

import prisma from '@/tools/prisma'
import { withResult } from '@/frontend/action_utils'
import { listBuyerShowProofs } from '@/shared/buyerShowProof'

export interface StorefrontBuyerShowMedia {
  id: string
  mediaType: 'IMAGE' | 'VIDEO'
  mediaUrl: string
  title: string | null
}

export interface StorefrontBuyerShowProof {
  id: string
  imageUrl: string
  title: string
  body: string
}

export const getBuyerShowPage = withResult(async (): Promise<{
  media: StorefrontBuyerShowMedia[]
  proofs: StorefrontBuyerShowProof[]
}> => {
  const proofs = await listBuyerShowProofs(true)
    .then((rows) =>
      rows.map((row) => ({
        id: row.id,
        imageUrl: row.imageUrl,
        title: row.title,
        body: row.body,
      })),
    )
    .catch((error) => {
      console.error('[getBuyerShowPage proofs]', error)
      return [] as StorefrontBuyerShowProof[]
    })

  try {
    const client = prisma as { buyershowmedia?: { findMany: (args: unknown) => Promise<StorefrontBuyerShowMedia[]> } }
    if (!client.buyershowmedia) {
      throw new Error('buyershowmedia model unavailable')
    }
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
      proofs,
    }
  } catch (error) {
    console.error('[getBuyerShowPage]', error)
    try {
      const rows = await prisma.$queryRawUnsafe<Array<{
        id: string
        media_type: string
        media_url: string
        title: string | null
      }>>(
        `SELECT id, media_type, media_url, title
         FROM buyer_show_media
         WHERE is_enabled = 1
         ORDER BY sort_weight DESC, createdAt DESC`,
      )
      return {
        media: (rows || [])
          .map((row) => ({
            id: row.id,
            mediaType: row.media_type === 'VIDEO' ? 'VIDEO' as const : 'IMAGE' as const,
            mediaUrl: String(row.media_url || '').trim(),
            title: row.title,
          }))
          .filter((item) => {
            const url = item.mediaUrl
            return url.startsWith('http') || url.startsWith('/') || url.startsWith('data:')
          }),
        proofs,
      }
    } catch (fallbackError) {
      console.error('[getBuyerShowPage fallback]', fallbackError)
      return { media: [], proofs }
    }
  }
})
