/** 首页类目卡片无封面时的轻量占位图（本地静态资源，避免外链关键词拉图） */
export const CATEGORY_CARD_PLACEHOLDER_URL = '/category-covers/placeholder.svg'

/** 判断是否为可直接作为 <img src> 的地址（含相对路径） */
export const isDirectImageSrc = (value?: string | null): value is string => {
  const text = String(value || '').trim()
  if (!text) return false
  if (text.startsWith('/') || text.startsWith('data:') || text.startsWith('blob:')) return true
  try {
    const url = new URL(text)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/** 自建上传（app/api/upload-image → /api/uploads/...）地址判断，含绝对地址形式 */
export const isSelfHostedUploadUrl = (value?: string | null): boolean => {
  const text = String(value || '').trim()
  if (!text) return false
  if (text.startsWith('/api/uploads/')) return true
  try {
    return new URL(text).pathname.startsWith('/api/uploads/')
  } catch {
    return false
  }
}

/**
 * 跳过 Next 图片优化器：这些地址的字节已经压缩过或由 nginx 缓存
 * （/img-proxy 走 nginx 缓存；/api/uploads 上传前已在浏览器压缩）。
 */
export const shouldBypassImageOptimizer = (value?: string | null): boolean => {
  const text = String(value || '').trim()
  if (!text) return false
  if (
    text.startsWith('/img-proxy/') ||
    text.startsWith('data:') ||
    text.startsWith('blob:') ||
    isSelfHostedUploadUrl(text)
  ) {
    return true
  }
  try {
    const url = new URL(text)
    if (url.pathname.startsWith('/img-proxy/')) return true
    // Aliyun OSS (old-shop imports) is already a CDN — skip /_next/image so
    // missing remotePatterns cannot blank home category cards.
    const host = url.hostname.toLowerCase()
    if (host.endsWith('.aliyuncs.com') || host === 'aliyuncs.com') return true
    return false
  } catch {
    return false
  }
}

/**
 * 对已知图床 URL 追加压缩参数（优先 WebP / 限制宽度），降低首页类目卡加载体积。
 * 无法识别的地址原样返回。
 */
export const optimizeCatalogImageUrl = (
  value?: string | null,
  width = 640,
): string | null => {
  const text = String(value || '').trim()
  if (!text) return null
  if (text.startsWith('/') || text.startsWith('data:') || text.startsWith('blob:')) {
    // Already same-origin (incl. /img-proxy) — append alicdn size when possible
    if (text.startsWith('/img-proxy/') && !/_\d+x\d+q?\d*\.(jpe?g|png|webp)$/i.test(text.split('?')[0] || '')) {
      if (/\.(jpe?g|png|webp)$/i.test(text.split('?')[0] || '')) {
        return `${text.split('?')[0]}_${width}x${width}q90.jpg${text.includes('?') ? `?${text.split('?')[1]}` : ''}`
      }
    }
    return text
  }

  try {
    const url = new URL(text)
    // Absolute same-origin img-proxy (nginx JSON rewrite) — treat like relative
    if (url.pathname.startsWith('/img-proxy/')) {
      const path = `${url.pathname}${url.search}`
      if (!/_\d+x\d+q?\d*\.(jpe?g|png|webp)$/i.test(url.pathname) && /\.(jpe?g|png|webp)$/i.test(url.pathname)) {
        return `${url.pathname}_${width}x${width}q90.jpg${url.search}`
      }
      return path
    }
    const host = url.hostname.toLowerCase()

    if (host.includes('images.unsplash.com')) {
      url.searchParams.set('auto', 'format')
      url.searchParams.set('fit', 'crop')
      url.searchParams.set('w', String(width))
      url.searchParams.set('q', '70')
      url.searchParams.set('fm', 'webp')
      return url.toString()
    }

    if (host.includes('images.pexels.com')) {
      url.searchParams.set('auto', 'compress')
      url.searchParams.set('cs', 'tinysrgb')
      url.searchParams.set('w', String(width))
      return url.toString()
    }

    // 1688 / alicdn：官方尺寸后缀，体积从数百 KB 降到几十 KB
    if (host.includes('alicdn.com')) {
      const path = url.pathname
      if (!/_\d+x\d+q?\d*\.(jpe?g|png|webp)$/i.test(path) && /\.(jpe?g|png|webp)$/i.test(path)) {
        url.pathname = `${path}_${width}x${width}q90.jpg`
      }
      return url.toString()
    }

    // 旧站/表格导入：hspi.oss-us-west-1 等 — 用 OSS 图片处理缩略，否则列表拉原图极慢
    if (host.endsWith('.aliyuncs.com') || host === 'aliyuncs.com') {
      const w = Math.min(2000, Math.max(80, Math.round(width)))
      url.searchParams.set(
        'x-oss-process',
        `image/resize,m_lfit,w_${w}/quality,q_85/sharpen,80`,
      )
      return url.toString()
    }

    // autocoder / s3 生成图：无法在客户端转码，保持原链（应由业务侧上传压缩图）
    return text
  } catch {
    return text
  }
}

export const resolveCategoryShelfImageUrl = (
  imageUrl?: string | null,
  bannerImageUrl?: string | null,
  iconUrl?: string | null,
): string | null => {
  return (
    optimizeCatalogImageUrl(imageUrl, 640) ||
    optimizeCatalogImageUrl(bannerImageUrl, 640) ||
    optimizeCatalogImageUrl(iconUrl, 640) ||
    null
  )
}

export const resolveCategoryCardImageUrl = (
  imageUrl?: string | null,
  bannerImageUrl?: string | null,
  iconUrl?: string | null,
  /** @deprecated 类目卡不再回退商品主图，保留参数仅为兼容旧调用 */
  _productImageUrl?: string | null,
): string => {
  return (
    resolveCategoryShelfImageUrl(imageUrl, bannerImageUrl, iconUrl) ||
    CATEGORY_CARD_PLACEHOLDER_URL
  )
}
