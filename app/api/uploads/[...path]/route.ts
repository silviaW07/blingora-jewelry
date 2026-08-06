/**
 * Serve self-hosted uploads from UPLOAD_DIR (written by app/api/upload-image).
 *
 * Keys are immutable (uuid file names), so responses are cached for a year.
 * In production nginx can serve the same files directly — see deploy notes.
 */

import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { Readable } from 'node:stream'

import { NextResponse, type NextRequest } from 'next/server'

import { contentTypeForKey, resolveStoredFile } from '@/lib/uploadStorage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const IMMUTABLE_CACHE = 'public, max-age=31536000, immutable'

function notFound() {
  return new NextResponse('Not Found', { status: 404 })
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  const { path: segments } = await context.params
  const filePath = resolveStoredFile(segments || [])
  if (!filePath) return notFound()

  let info: Awaited<ReturnType<typeof stat>>
  try {
    info = await stat(filePath)
  } catch {
    return notFound()
  }
  if (!info.isFile()) return notFound()

  const etag = `"${info.size.toString(16)}-${Math.floor(info.mtimeMs).toString(16)}"`
  const headers: Record<string, string> = {
    'Content-Type': contentTypeForKey(filePath),
    'Cache-Control': IMMUTABLE_CACHE,
    ETag: etag,
    'X-Content-Type-Options': 'nosniff',
    // Uploaded SVGs must not be able to run scripts when opened same-origin
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
  }

  if (request.headers.get('if-none-match') === etag) {
    return new NextResponse(null, { status: 304, headers })
  }

  const body = Readable.toWeb(createReadStream(filePath)) as ReadableStream<Uint8Array>
  return new NextResponse(body, {
    status: 200,
    headers: { ...headers, 'Content-Length': String(info.size) },
  })
}
