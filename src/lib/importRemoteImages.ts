import { extensionForUpload, saveUploadedImage } from '@/lib/uploadStorage'

const MAX_FETCH_BYTES = 10 * 1024 * 1024
const MAX_IMAGES = 40

function isPrivateHostname(hostname: string): boolean {
  const host = hostname.toLowerCase()
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return true
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    const [a, b] = host.split('.').map(Number)
    if (a === 10 || a === 127 || a === 0) return true
    if (a === 192 && b === 168) return true
    if (a === 169 && b === 254) return true
    if (a === 172 && b >= 16 && b <= 31) return true
  }
  return false
}

function refererFor(url: string): string {
  try {
    const host = new URL(url).hostname.toLowerCase()
    if (host.endsWith('szwego.com') || host.endsWith('wegooooo.com') || host.endsWith('wsxcme.com')) {
      return 'https://www.szwego.com/'
    }
    if (host.endsWith('qpic.cn') || host.endsWith('qlogo.cn')) {
      return 'https://www.szwego.com/'
    }
    if (host.endsWith('yupoo.com')) {
      return 'https://x.yupoo.com/'
    }
    if (
      host.includes('alicdn.com') ||
      host.includes('aliimg.com') ||
      host.endsWith('1688.com') ||
      host.includes('cbu01.alicdn')
    ) {
      return 'https://detail.1688.com/'
    }
  } catch {
    // ignore
  }
  return 'https://www.google.com/'
}

async function fetchOneImage(url: string): Promise<{ bytes: Uint8Array; ext: string }> {
  const parsed = new URL(url)
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('只支持 http/https 图片地址')
  }
  if (isPrivateHostname(parsed.hostname)) {
    throw new Error('不支持内网地址')
  }

  const res = await fetch(url, {
    redirect: 'follow',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      Referer: refererFor(url),
    },
    signal: AbortSignal.timeout(25_000),
  })
  if (!res.ok) throw new Error(`拉取失败 HTTP ${res.status}`)
  const len = Number(res.headers.get('content-length') || 0)
  if (len > MAX_FETCH_BYTES) throw new Error('图片过大')
  const bytes = new Uint8Array(await res.arrayBuffer())
  if (!bytes.byteLength) throw new Error('图片内容为空')
  if (bytes.byteLength > MAX_FETCH_BYTES) throw new Error('图片过大')
  const ext =
    extensionForUpload(parsed.pathname, res.headers.get('content-type')) ||
    'jpg'
  return { bytes, ext }
}

export async function importRemoteImageUrls(urls: string[]): Promise<{
  urls: string[]
  failed: Array<{ url: string; reason: string }>
}> {
  const unique = Array.from(new Set(urls.map((item) => String(item || '').trim()).filter(Boolean)))
  if (!unique.length) throw new Error('没有可导入的图片地址')
  if (unique.length > MAX_IMAGES) {
    throw new Error(`一次最多导入 ${MAX_IMAGES} 张图`)
  }

  const saved: string[] = []
  const failed: Array<{ url: string; reason: string }> = []
  for (const url of unique) {
    try {
      const { bytes, ext } = await fetchOneImage(url)
      if (bytes.byteLength < 8000) continue
      const stored = await saveUploadedImage(bytes, ext)
      saved.push(stored.url)
    } catch (error) {
      failed.push({
        url,
        reason: error instanceof Error ? error.message : '导入失败',
      })
    }
  }
  return { urls: saved, failed }
}
