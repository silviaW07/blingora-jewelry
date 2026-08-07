/**
 * Client-side image compression for upload flows.
 * Prefers createImageBitmap (faster decode/downscale) over HTMLImageElement + high-quality canvas.
 * Skips GIF / SVG / already-small files.
 */

const MAX_EDGE_PX = 1024
const JPEG_QUALITY = 0.72
const WEBP_QUALITY = 0.72
/** Generic small-file skip (PNG / unknown) */
const SKIP_UNDER_BYTES = 120 * 1024
/** Only truly small JPEG/WebP files skip re-encode on high-latency cross-border upload. */
const SKIP_JPEG_WEBP_UNDER_BYTES = 150 * 1024
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
  if (mime === 'image/gif' || mime === 'image/svg+xml') return true
  if (extensionOf(file.name) === 'gif' || extensionOf(file.name) === 'svg') return true
  if (mime && !mime.startsWith('image/')) return true
  return false
}

function canvasHasTransparency(ctx: CanvasRenderingContext2D, w: number, h: number): boolean {
  try {
    const sample = document.createElement('canvas')
    const sw = Math.min(48, w)
    const sh = Math.min(48, h)
    sample.width = sw
    sample.height = sh
    const sctx = sample.getContext('2d', { alpha: true, willReadFrequently: true })
    if (!sctx) return false
    sctx.drawImage(ctx.canvas, 0, 0, w, h, 0, 0, sw, sh)
    const data = sctx.getImageData(0, 0, sw, sh).data
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 250) return true
    }
    return false
  } catch {
    return false
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob | null> {
  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), type, quality)
  })
}

function replaceExtension(originalName: string, newExt: string): string {
  return `${basenameWithoutExt(originalName)}.${newExt}`
}

async function decodeBitmap(
  file: File,
  maxEdge: number,
): Promise<{ bitmap: ImageBitmap; didScale: boolean }> {
  // First pass: decode (honor EXIF orientation when supported)
  const full = await createImageBitmap(file, {
    imageOrientation: 'from-image',
  } as ImageBitmapOptions)

  const srcW = full.width
  const srcH = full.height
  const scale = Math.min(1, maxEdge / Math.max(srcW, srcH))
  if (scale >= 1) return { bitmap: full, didScale: false }

  const targetW = Math.max(1, Math.round(srcW * scale))
  const targetH = Math.max(1, Math.round(srcH * scale))
  try {
    // Second pass: downscale from bitmap (cheaper than re-decoding the file)
    const resized = await createImageBitmap(full, {
      resizeWidth: targetW,
      resizeHeight: targetH,
      resizeQuality: 'medium',
    } as ImageBitmapOptions)
    full.close()
    return { bitmap: resized, didScale: true }
  } catch {
    return { bitmap: full, didScale: false }
  }
}

async function loadViaImageElement(file: File): Promise<{ width: number; height: number; draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void; dispose: () => void }> {
  const url = URL.createObjectURL(file)
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image()
    el.onload = () => resolve(el)
    el.onerror = () => reject(new Error('无法读取图片'))
    el.src = url
  })
  return {
    width: img.naturalWidth || img.width,
    height: img.naturalHeight || img.height,
    draw: (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h),
    dispose: () => URL.revokeObjectURL(url),
  }
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

  const srcMime = mimeFromFile(file)
  const isJpegLike =
    srcMime === 'image/jpeg' ||
    srcMime === 'image/jpg' ||
    srcMime === 'image/webp' ||
    extensionOf(file.name) === 'jpg' ||
    extensionOf(file.name) === 'jpeg' ||
    extensionOf(file.name) === 'webp'
  // Phone/product JPEGs under ~1MB: upload as-is (biggest perceived speedup)
  if (isJpegLike && file.size > 0 && file.size < SKIP_JPEG_WEBP_UNDER_BYTES) {
    return file
  }

  const isPng = srcMime === 'image/png' || extensionOf(file.name) === 'png'

  let bitmap: ImageBitmap | null = null
  let fallback: Awaited<ReturnType<typeof loadViaImageElement>> | null = null
  let outW = 0
  let outH = 0
  let didScale = false

  try {
    if (typeof createImageBitmap === 'function') {
      const decoded = await decodeBitmap(file, maxEdge)
      bitmap = decoded.bitmap
      didScale = decoded.didScale
      outW = bitmap.width
      outH = bitmap.height
    } else {
      fallback = await loadViaImageElement(file)
      const scale = Math.min(1, maxEdge / Math.max(fallback.width, fallback.height))
      didScale = scale < 1
      outW = Math.max(1, Math.round(fallback.width * scale))
      outH = Math.max(1, Math.round(fallback.height * scale))
    }
  } catch {
    return file
  }

  if (!outW || !outH) {
    bitmap?.close()
    fallback?.dispose()
    return file
  }

  const canvas = document.createElement('canvas')
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d', { alpha: isPng, desynchronized: true })
  if (!ctx) {
    bitmap?.close()
    fallback?.dispose()
    return file
  }

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'medium'
  if (bitmap) {
    ctx.drawImage(bitmap, 0, 0, outW, outH)
    bitmap.close()
  } else if (fallback) {
    fallback.draw(ctx, outW, outH)
    fallback.dispose()
  }

  const hasAlpha = isPng && canvasHasTransparency(ctx, outW, outH)

  if (hasAlpha) {
    if (!didScale && file.size < PREFER_JPEG_OVER_PNG_BYTES * 2) {
      return file
    }
    const pngBlob = await canvasToBlob(canvas, 'image/png')
    if (!pngBlob || pngBlob.size >= file.size) return file
    return new File([pngBlob], replaceExtension(file.name, 'png'), {
      type: 'image/png',
      lastModified: Date.now(),
    })
  }

  if (srcMime === 'image/webp') {
    const webpBlob = await canvasToBlob(canvas, 'image/webp', options.quality ?? WEBP_QUALITY)
    if (webpBlob && webpBlob.size < file.size) {
      return new File([webpBlob], replaceExtension(file.name, 'webp'), {
        type: 'image/webp',
        lastModified: Date.now(),
      })
    }
  }

  ctx.globalCompositeOperation = 'destination-over'
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, outW, outH)
  ctx.globalCompositeOperation = 'source-over'

  const jpegBlob = await canvasToBlob(canvas, 'image/jpeg', quality)
  if (!jpegBlob) return file

  if (jpegBlob.size >= file.size && !didScale) {
    return file
  }

  return new File([jpegBlob], replaceExtension(file.name, 'jpg'), {
    type: 'image/jpeg',
    lastModified: Date.now(),
  })
}
