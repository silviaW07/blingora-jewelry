/**
 * Fetch one image, mosaic 1688-style corner watermarks, save to /api/uploads.
 * Shared by /api/process-watermark and admin batch mosaic.
 */

import { readFile } from 'node:fs/promises'

import { mosaicWatermarkCorners, detectCornerWatermark } from '@/lib/mosaicWatermark'
import { resolveStoredFile, saveUploadedImage } from '@/lib/uploadStorage'

const MAX_FETCH_BYTES = 12 * 1024 * 1024

const IMG_PROXY_ORIGIN: Record<string, string> = {
  cbu01: 'https://cbu01.alicdn.com',
  cbu02: 'https://cbu02.alicdn.com',
  gw: 'https://gw.alicdn.com',
  img: 'https://img.alicdn.com',
}

/** `/img-proxy/cbu01/foo.jpg` → `https://cbu01.alicdn.com/foo.jpg` */
function rewriteImgProxyToAlicdn(pathname: string, search = ''): string | null {
  const parts = String(pathname || '').split('/').filter(Boolean)
  if (parts[0] !== 'img-proxy' || parts.length < 3) return null
  const origin = IMG_PROXY_ORIGIN[parts[1]]
  if (!origin) return null
  return `${origin}/${parts.slice(2).join('/')}${search || ''}`
}

function isOwnHost(hostname: string): boolean {
  const host = hostname.toLowerCase()
  for (const raw of [siteOrigin(), String(process.env.NEXT_PUBLIC_IMAGE_CDN_BASE || '').trim()]) {
    if (!raw) continue
    try {
      if (new URL(raw).hostname.toLowerCase() === host) return true
    } catch {
      // ignore bad env
    }
  }
  return false
}

function isAllowedRemoteHost(hostname: string): boolean {
  const host = hostname.toLowerCase()
  if (isOwnHost(host)) return true
  return (
    host.endsWith('.alicdn.com') ||
    host === 'alicdn.com' ||
    host.endsWith('.aliyuncs.com') ||
    host.endsWith('.tbcdn.cn') ||
    host.endsWith('.taobaocdn.com') ||
    host.endsWith('.1688.com')
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

function siteOrigin(): string {
  return String(process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || '').replace(/\/$/, '')
}

function resolveFetchUrl(raw: string): string | null {
  const text = String(raw || '').trim()
  if (!text) return null
  const origin = siteOrigin()

  if (text.startsWith('/img-proxy/')) {
    const [pathPart, ...queryParts] = text.split('?')
    const search = queryParts.length ? `?${queryParts.join('?')}` : ''
    return rewriteImgProxyToAlicdn(pathPart, search) || (origin ? `${origin}${text}` : null)
  }
  if (text.startsWith('/api/uploads/')) {
    if (!origin) return null
    return `${origin}${text}`
  }

  try {
    const url = new URL(text)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    if (url.pathname.startsWith('/img-proxy/')) {
      return rewriteImgProxyToAlicdn(url.pathname, url.search) || url.toString()
    }
    if (url.pathname.startsWith('/api/uploads/')) {
      return url.toString()
    }
    if (!isAllowedRemoteHost(url.hostname)) return null
    return url.toString()
  } catch {
    return null
  }
}

async function loadImageBytes(imageUrl: string): Promise<Buffer> {
  const localKey = uploadsKeyFromUrl(imageUrl)
  if (localKey) {
    const absolute = resolveStoredFile(localKey)
    if (!absolute) throw new Error('本地上传图片路径无效')
    return Buffer.from(await readFile(absolute))
  }

  const fetchUrl = resolveFetchUrl(imageUrl)
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

export async function mosaicImageUrlToUpload(imageUrl: string): Promise<string> {
  const source = await loadImageBytes(imageUrl)
  const mosaicked = await mosaicWatermarkCorners(source)
  const saved = await saveUploadedImage(new Uint8Array(mosaicked), 'jpg')
  return saved.url
}

export async function mosaicImageUrlIfWatermark(imageUrl: string): Promise<{
  url: string
  mosaicked: boolean
}> {
  const source = await loadImageBytes(imageUrl)
  const hasMark = await detectCornerWatermark(source)
  if (!hasMark) return { url: imageUrl, mosaicked: false }
  const mosaicked = await mosaicWatermarkCorners(source)
  const saved = await saveUploadedImage(new Uint8Array(mosaicked), 'jpg')
  return { url: saved.url, mosaicked: true }
}

export async function mapPool<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let cursor = 0
  const workers = Array.from({ length: Math.min(Math.max(1, limit), items.length || 1) }, async () => {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      results[index] = await mapper(items[index], index)
    }
  })
  if (items.length) await Promise.all(workers)
  return results
}
