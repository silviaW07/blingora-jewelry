import { readFile } from 'node:fs/promises'
import sharp from 'sharp'
import { resolveStoredFile, UPLOAD_URL_PREFIX } from '@/lib/uploadStorage'
import {
  pickVotedBackdropBrand,
  scoreBrandFromRgb,
  type BackdropBrand,
  type BackdropBrandGuess,
} from '@/shared/brandFromBackdrop'

export function uploadUrlToPath(url: string): string | null {
  const text = String(url || '').trim()
  if (!text) return null
  const marker = `${UPLOAD_URL_PREFIX}/`
  const idx = text.indexOf(marker)
  if (idx < 0) return null
  const key = text.slice(idx + marker.length).split('?')[0]
  const segments = key.split('/').map((part) => part.trim()).filter(Boolean)
  return resolveStoredFile(segments)
}

export async function detectBrandFromImageBytes(bytes: Buffer): Promise<BackdropBrandGuess | null> {
  if (!bytes?.length) return null
  try {
    const { data, info } = await sharp(bytes)
      .rotate()
      .resize(96, 96, { fit: 'fill' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
    if (info.channels < 3) return null
    return scoreBrandFromRgb(data, info.width, info.height)
  } catch {
    return null
  }
}

export async function readUploadImageBytes(url: string): Promise<Buffer | null> {
  const abs = uploadUrlToPath(url)
  if (!abs) return null
  try {
    return await readFile(abs)
  } catch {
    return null
  }
}

export async function detectBrandFromBackdropUrl(url: string): Promise<BackdropBrandGuess | null> {
  const bytes = await readUploadImageBytes(url)
  if (!bytes) return null
  return detectBrandFromImageBytes(bytes)
}

export async function detectBrandFromBackdropUrls(urls: Array<string | null | undefined>): Promise<BackdropBrand | null> {
  const unique = Array.from(new Set(urls.map((url) => String(url || '').trim()).filter(Boolean))).slice(0, 12)
  const guesses: BackdropBrandGuess[] = []
  for (const url of unique) {
    const guess = await detectBrandFromBackdropUrl(url)
    if (guess) guesses.push(guess)
  }
  return pickVotedBackdropBrand(guesses)
}
