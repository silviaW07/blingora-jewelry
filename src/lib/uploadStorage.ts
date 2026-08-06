/**
 * Self-hosted image upload storage (replaces the AutoCoder cloud upload quota).
 *
 * Server-only (node:fs / node:path) — only import from `app/api/**` route handlers.
 * Files are written outside `.next` so standalone rebuilds / redeploys keep them:
 * set `UPLOAD_DIR=/home/admin/my-website/uploads` in production `.env`.
 */

import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

/** Public URL prefix, served by `app/api/uploads/[...path]/route.ts` */
export const UPLOAD_URL_PREFIX = '/api/uploads'

/** Hard server cap (client compresses first, so this is only a safety net). */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

/** Whitelisted extensions — keeps non-image files out of the upload dir. */
const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
}

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/pjpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/bmp': 'bmp',
  'image/x-ms-bmp': 'bmp',
  'image/svg+xml': 'svg',
}

/** Generated file names only ever contain uuid + extension. */
const SAFE_SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]*$/

export function resolveUploadDir(): string {
  const configured = String(process.env.UPLOAD_DIR || '').trim()
  return configured ? path.resolve(configured) : path.join(process.cwd(), 'uploads')
}

/** Resolve the stored extension from mime first, then the original name. `null` = not an image. */
export function extensionForUpload(fileName?: string | null, mimeType?: string | null): string | null {
  const mime = String(mimeType || '')
    .toLowerCase()
    .split(';')[0]
    .trim()
  if (EXT_BY_MIME[mime]) return EXT_BY_MIME[mime]
  // Some browsers / clients send an empty or generic type — fall back to the file name
  if (mime && mime !== 'application/octet-stream' && !mime.startsWith('image/')) return null

  const ext = path
    .extname(String(fileName || ''))
    .replace('.', '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
  return ext && MIME_BY_EXT[ext] ? ext : null
}

export function contentTypeForKey(key: string): string {
  const ext = path.extname(key).slice(1).toLowerCase()
  return MIME_BY_EXT[ext] || 'application/octet-stream'
}

/** `2026/08/06/<uuid>.jpg` — date shards keep directories small and easy to back up. */
function buildObjectKey(ext: string): string {
  const now = new Date()
  const year = String(now.getFullYear())
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}/${month}/${day}/${randomUUID()}.${ext}`
}

export type SavedUpload = {
  /** Storage key relative to UPLOAD_DIR, e.g. `2026/08/06/<uuid>.jpg` */
  key: string
  /** Same-origin URL the client stores in the DB */
  url: string
  absolutePath: string
  size: number
}

export async function saveUploadedImage(bytes: Uint8Array, ext: string): Promise<SavedUpload> {
  const key = buildObjectKey(ext)
  const absolutePath = path.join(resolveUploadDir(), ...key.split('/'))
  await mkdir(path.dirname(absolutePath), { recursive: true })
  await writeFile(absolutePath, bytes)
  return { key, url: `${UPLOAD_URL_PREFIX}/${key}`, absolutePath, size: bytes.byteLength }
}

/**
 * Map request segments to an absolute path inside UPLOAD_DIR.
 * Returns `null` for anything suspicious (traversal, separators, odd characters).
 */
export function resolveStoredFile(segments: string[]): string | null {
  if (!segments.length || segments.length > 8) return null
  for (const segment of segments) {
    if (!SAFE_SEGMENT.test(segment) || segment === '..') return null
  }

  const root = resolveUploadDir()
  const target = path.resolve(root, ...segments)
  // Defense in depth: never serve anything outside the upload root
  if (target !== root && !target.startsWith(root + path.sep)) return null
  return target
}
