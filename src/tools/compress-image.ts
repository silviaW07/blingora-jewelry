/**
 * Client-side image compression for upload flows.
 * Canvas-based, no extra deps. Skips GIF / SVG / tiny files.
 */

const MAX_EDGE_PX = 1920
const JPEG_QUALITY = 0.85
const WEBP_QUALITY = 0.84
/** Skip compression when already small enough for fast upload */
const SKIP_UNDER_BYTES = 250 * 1024
/** Prefer JPEG conversion for opaque images larger than this */
const PREFER_JPEG_OVER_PNG_BYTES = 400 * 1024

export type CompressImageOptions = {
  maxEdge?: number
  quality?: number
  skipUnderBytes?: number
}

function extensionOf(name: string): string {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i + 1).toLowerCase() : ''
}

function basenameWithoutExt(name: string): string {
  const base = name.replace(/[/\\]/g, '_').trim() || 'image'
  const i = base.lastIndexOf('.')
  return i > 0 ? base.slice(0, i) : base
}

function mimeFromFile(file: File): string {
  if (file.type) return file.type.toLowerCase()
  const ext = extensionOf(file.name)
  if (ext === 'png') return 'image/png'
  if (ext === 'webp') return 'image/webp'
  if (ext === 'gif') return 'image/gif'
  if (ext === 'svg' || ext === 'svgz') return 'image/svg+xml'
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  if (ext === 'bmp') return 'image/bmp'
  if (ext === 'avif') return 'image/avif'
  return ''
}

function shouldSkipCompress(file: File): boolean {
  const mime = mimeFromFile(file)
  // GIF: keep animation; SVG: vector / not safe on canvas
  if (mime === 'image/gif' || mime === 'image/svg+xml') return true
  if (extensionOf(file.name) === 'gif' || extensionOf(file.name) === 'svg') return true
  // Not a raster image we can re-encode
  if (mime && !mime.startsWith('image/')) return true
  return false
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('无法读取图片，压缩跳过'))
    }
    img.src = url
  })
}

function canvasHasTransparency(ctx: CanvasRenderingContext2D, w: number, h: number): boolean {
  try {
    // Downsample via a small offscreen canvas for a cheap alpha probe
    const sample = document.createElement('canvas')
    const sw = Math.min(64, w)
    const sh = Math.min(64, h)
    sample.width = sw
    sample.height = sh
    const sctx = sample.getContext('2d', { alpha: true })
    if (!sctx) return false
    sctx.drawImage(ctx.canvas, 0, 0, w, h, 0, 0, sw, sh)
    const data = sctx.getImageData(0, 0, sw, sh).data
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 250) return true
    }
    return false
  } catch {
    // Tainted canvas or getImageData blocked — assume no transparency for raster uploads
    return false
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality)
  })
}

function replaceExtension(originalName: string, newExt: string): string {
  const base = basenameWithoutExt(originalName)
  return `${base}.${newExt}`
}

/**
 * Compress a browser File for product / admin uploads.
 * Returns the original file when compression is skipped or would not help.
 */
export async function compressImageForUpload(
  file: File,
  options: CompressImageOptions = {},
): Promise<File> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return file
  }

  const maxEdge = options.maxEdge ?? MAX_EDGE_PX
  const quality = options.quality ?? JPEG_QUALITY
  const skipUnder = options.skipUnderBytes ?? SKIP_UNDER_BYTES

  if (shouldSkipCompress(file)) return file
  if (file.size > 0 && file.size < skipUnder) return file

  let img: HTMLImageElement
  try {
    img = await loadImageFromFile(file)
  } catch {
    return file
  }

  const srcW = img.naturalWidth || img.width
  const srcH = img.naturalHeight || img.height
  if (!srcW || !srcH) return file

  const scale = Math.min(1, maxEdge / Math.max(srcW, srcH))
  const targetW = Math.max(1, Math.round(srcW * scale))
  const targetH = Math.max(1, Math.round(srcH * scale))

  const canvas = document.createElement('canvas')
  canvas.width = targetW
  canvas.height = targetH
  const ctx = canvas.getContext('2d', { alpha: true })
  if (!ctx) return file

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, targetW, targetH)

  const srcMime = mimeFromFile(file)
  const isPng = srcMime === 'image/png' || extensionOf(file.name) === 'png'
  const hasAlpha = isPng && canvasHasTransparency(ctx, targetW, targetH)

  // Keep PNG when transparency is needed
  if (hasAlpha) {
    // Only re-encode if we scaled down; otherwise leave original PNG
    if (scale >= 1 && file.size < PREFER_JPEG_OVER_PNG_BYTES * 2) {
      return file
    }
    const pngBlob = await canvasToBlob(canvas, 'image/png')
    if (!pngBlob || pngBlob.size >= file.size) return file
    return new File([pngBlob], replaceExtension(file.name, 'png'), {
      type: 'image/png',
      lastModified: Date.now(),
    })
  }

  // Try WebP when source was WebP and browser supports it
  if (srcMime === 'image/webp') {
    const webpBlob = await canvasToBlob(canvas, 'image/webp', options.quality ?? WEBP_QUALITY)
    if (webpBlob && webpBlob.size < file.size) {
      return new File([webpBlob], replaceExtension(file.name, 'webp'), {
        type: 'image/webp',
        lastModified: Date.now(),
      })
    }
  }

  // Opaque raster → JPEG (smaller for product photos)
  // White backdrop so any residual alpha doesn't become black
  ctx.globalCompositeOperation = 'destination-over'
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, targetW, targetH)
  ctx.globalCompositeOperation = 'source-over'

  const jpegBlob = await canvasToBlob(canvas, 'image/jpeg', quality)
  if (!jpegBlob) return file

  // Only use compressed result if smaller (or we had to shrink dimensions)
  if (jpegBlob.size >= file.size && scale >= 1) {
    return file
  }

  return new File([jpegBlob], replaceExtension(file.name, 'jpg'), {
    type: 'image/jpeg',
    lastModified: Date.now(),
  })
}

// Named-export-only module (no default). Browser APIs only inside functions above.
// Keep free of imports from ./tools to avoid cyclic HMR factory invalidation.
