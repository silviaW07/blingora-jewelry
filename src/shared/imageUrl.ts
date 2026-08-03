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
        return `${text.split('?')[0]}_${width}x${width}q80.jpg${text.includes('?') ? `?${text.split('?')[1]}` : ''}`
      }
    }
    return text
  }

  try {
    const url = new URL(text)
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
        url.pathname = `${path}_${width}x${width}q80.jpg`
      }
      return url.toString()
    }

    // autocoder / s3 生成图：无法在客户端转码，保持原链（应由业务侧上传压缩图）
    return text
  } catch {
    return text
  }
}

export const resolveCategoryCardImageUrl = (
  imageUrl?: string | null,
  bannerImageUrl?: string | null,
  productImageUrl?: string | null,
): string => {
  return (
    optimizeCatalogImageUrl(imageUrl, 640) ||
    optimizeCatalogImageUrl(bannerImageUrl, 640) ||
    optimizeCatalogImageUrl(productImageUrl, 640) ||
    CATEGORY_CARD_PLACEHOLDER_URL
  )
}
