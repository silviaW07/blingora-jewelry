/**
 * Fetch an image URL, mosaic likely watermark corners, save to self-hosted uploads.
 * Used by admin「处理当前图」on 1688 pending import detail.
 */

import { readFile } from 'node:fs/promises'
import { NextResponse, type NextRequest } from 'next/server'

import { mosaicWatermarkCorners } from '@/lib/mosaicWatermark'
import { resolveStoredFile, saveUploadedImage } from '@/lib/uploadStorage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_FETCH_BYTES = 12 * 1024 * 1024

function fail(message: string, status: number) {
  return NextResponse.json({ code: status, message, error: message }, { status })
}

function isAllowedRemoteHost(hostname: string): boolean {
  const host = hostname.toLowerCase()
  return (
    host.endsWith('.alicdn.com') ||
    host === 'alicdn.com' ||
    host.endsWith('.aliyuncs.com') ||
    host.endsWith('.tbcdn.cn') ||
    host.endsWith('.taobaocdn.com')
  )
}

function uploadsKeyFromUrl(raw: string): string[] | null {
  const text = String(raw || '').trim()
  if (!text) return null
  try {
    if (text.startsWith('/api/uploads/')) {
      return text.slice('/api/uploads/'.length).split('/').filter(Boolean)
    }
    const url = new URL(text)
    if (url.pathname.startsWith('/api/uploads/')) {
      return url.pathname.slice('/api/uploads/'.length).split('/').filter(Boolean)
    }
  } catch {
    return null
  }
  return null
}

function resolveFetchUrl(raw: string, request: NextRequest): string | null {
  const text = String(raw || '').trim()
  if (!text) return null

  if (text.startsWith('/img-proxy/') || text.startsWith('/api/uploads/')) {
    return new URL(text, request.nextUrl.origin).toString()
  }

  try {
    const url = new URL(text)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    if (url.pathname.startsWith('/img-proxy/') || url.pathname.startsWith('/api/uploads/')) {
      return url.toString()
    }
    if (!isAllowedRemoteHost(url.hostname)) return null
    return url.toString()
  } catch {
    return null
  }
}

async function loadImageBytes(imageUrl: string, request: NextRequest): Promise<Buffer> {
  const localKey = uploadsKeyFromUrl(imageUrl)
  if (localKey) {
    const absolute = resolveStoredFile(localKey)
    if (!absolute) throw new Error('本地上传图片路径无效')
    return Buffer.from(await readFile(absolute))
  }

  const fetchUrl = resolveFetchUrl(imageUrl, request)
  if (!fetchUrl) {
    throw new Error('仅支持 1688/alicdn 图或本站已上传图片')
  }

  const res = await fetch(fetchUrl, {
    redirect: 'follow',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; BlingoraWatermarkMosaic/1.0; +https://sourcingjewelry.com)',
      Accept: 'image/*,*/*;q=0.8',
    },
    signal: AbortSignal.timeout(25_000),
  })
  if (!res.ok) {
    throw new Error(`拉取图片失败（HTTP ${res.status}）`)
  }
  const len = Number(res.headers.get('content-length') || 0)
  if (len > MAX_FETCH_BYTES) {
    throw new Error('图片过大，无法处理')
  }
  const buf = Buffer.from(await res.arrayBuffer())
  if (!buf.byteLength) throw new Error('图片内容为空')
  if (buf.byteLength > MAX_FETCH_BYTES) throw new Error('图片过大，无法处理')
  return buf
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
    const source = await loadImageBytes(imageUrl, request)
    const mosaicked = await mosaicWatermarkCorners(source)
    const saved = await saveUploadedImage(new Uint8Array(mosaicked), 'jpg')
    return NextResponse.json({
      code: 200,
      message: 'ok',
      data: {
        image_url: saved.url,
        url: saved.url,
        key: saved.key,
        size: saved.size,
        sourceUrl: imageUrl,
      },
    })
  } catch (error) {
    console.error('[process-watermark]', error)
    return fail((error as Error).message || '处理失败', 500)
  }
}
