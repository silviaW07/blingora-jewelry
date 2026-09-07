import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { resolveUploadDir } from '@/lib/uploadStorage'

const RESIZABLE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.bmp'])
const MAX_CONCURRENCY = 2

let active = 0
const waiters: Array<() => void> = []

async function withLimit<T>(fn: () => Promise<T>): Promise<T> {
  if (active >= MAX_CONCURRENCY) {
    await new Promise<void>((resolve) => {
      waiters.push(resolve)
    })
  }
  active += 1
  try {
    return await fn()
  } finally {
    active -= 1
    waiters.shift()?.()
  }
}

export function parseUploadThumbParams(search: URLSearchParams): { width: number; quality: number } | null {
  const rawWidth = Number(search.get('w') || 0)
  if (!Number.isFinite(rawWidth) || rawWidth <= 0) return null
  const width = Math.min(1600, Math.max(80, Math.round(rawWidth)))
  const rawQuality = Number(search.get('q') || 75)
  const quality = Number.isFinite(rawQuality) ? Math.min(90, Math.max(40, Math.round(rawQuality))) : 75
  return { width, quality }
}

export function canResizeUpload(filePath: string): boolean {
  return RESIZABLE_EXT.has(path.extname(filePath).toLowerCase())
}

export async function getOrCreateUploadThumb(
  sourcePath: string,
  width: number,
  quality: number,
): Promise<{ body: Buffer; contentType: 'image/jpeg'; etagSeed: string }> {
  const rel = path.relative(resolveUploadDir(), sourcePath)
  const cachePath = path.join(
    resolveUploadDir(),
    '.thumbs',
    `w${width}q${quality}`,
    rel.replace(/\.[^.]+$/i, '.jpg'),
  )

  const source = await stat(sourcePath)

  const readCache = async () => {
    try {
      const cached = await stat(cachePath)
      if (!cached.isFile() || cached.mtimeMs < source.mtimeMs) return null
      const body = await readFile(cachePath)
      return {
        body,
        contentType: 'image/jpeg' as const,
        etagSeed: `${cached.size.toString(16)}-${Math.floor(cached.mtimeMs).toString(16)}`,
      }
    } catch {
      return null
    }
  }

  const hit = await readCache()
  if (hit) return hit

  return withLimit(async () => {
    const again = await readCache()
    if (again) return again

    const sharp = (await import('sharp')).default
    const body = await sharp(sourcePath)
      .rotate()
      .resize({
        width,
        height: width,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer()

    await mkdir(path.dirname(cachePath), { recursive: true })
    await writeFile(cachePath, body)
    return {
      body,
      contentType: 'image/jpeg' as const,
      etagSeed: `${body.byteLength.toString(16)}-${Math.floor(Date.now()).toString(16)}`,
    }
  })
}
