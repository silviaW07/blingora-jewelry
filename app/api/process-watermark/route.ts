/**
 * Fetch an image URL, mosaic likely watermark corners, save to self-hosted uploads.
 * Used by admin「处理当前图」on 1688 pending import detail.
 */

import { NextResponse, type NextRequest } from 'next/server'

import { mosaicImageUrlToUpload } from '@/lib/mosaicRemoteImage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function fail(message: string, status: number) {
  return NextResponse.json({ code: status, message, error: message }, { status })
}

export async function POST(request: NextRequest) {
  let body: { imageUrl?: string }
  try {
    body = (await request.json()) as { imageUrl?: string }
  } catch {
    return fail('请求体无效', 400)
  }

  const imageUrl = String(body.imageUrl || '').trim()
  if (!imageUrl) return fail('缺少 imageUrl', 400)

  try {
    const url = await mosaicImageUrlToUpload(imageUrl)
    return NextResponse.json({
      code: 200,
      message: 'ok',
      data: {
        image_url: url,
        url,
        sourceUrl: imageUrl,
      },
    })
  } catch (error) {
    console.error('[process-watermark]', error)
    return fail((error as Error).message || '处理失败', 500)
  }
}
