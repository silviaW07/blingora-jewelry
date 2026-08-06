/**
 * Self-hosted image upload (admin product / banner / decorate / avatar uploads).
 *
 * Replaces `https://project.autocoder.cc/api/project/image/upload/project`, which caps
 * the project at 200 uploads/day. Response shape mirrors the old API so the client
 * URL extraction (`pickUploadUrl` in src/tools/upload-image.ts) keeps working.
 */

import { NextResponse, type NextRequest } from 'next/server'

import {
  MAX_UPLOAD_BYTES,
  extensionForUpload,
  saveUploadedImage,
} from '@/lib/uploadStorage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function fail(message: string, status: number) {
  return NextResponse.json({ code: status, message, error: message }, { status })
}

function isFileLike(value: unknown): value is File {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as File).arrayBuffer === 'function'
  )
}

export async function POST(request: NextRequest) {
  // Reject oversized bodies before buffering them
  const declaredLength = Number(request.headers.get('content-length') || 0)
  if (declaredLength > MAX_UPLOAD_BYTES * 1.1) {
    return fail(`图片上传失败：文件超过 ${MAX_UPLOAD_BYTES / 1024 / 1024}MB 限制`, 413)
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return fail('图片上传失败：请求不是合法的 multipart/form-data', 400)
  }

  // `image` is the field the client has always used; `file` accepted for convenience
  const entry = form.get('image') ?? form.get('file')
  if (!isFileLike(entry)) {
    return fail('图片上传失败：缺少 image 字段', 400)
  }

  const ext = extensionForUpload(entry.name, entry.type)
  if (!ext) {
    return fail(`图片上传失败：不支持的文件类型（${entry.type || entry.name || 'unknown'}）`, 415)
  }

  const bytes = new Uint8Array(await entry.arrayBuffer())
  if (!bytes.byteLength) {
    return fail('图片上传失败：文件内容为空', 400)
  }
  if (bytes.byteLength > MAX_UPLOAD_BYTES) {
    return fail(
      `图片上传失败：文件超过 ${MAX_UPLOAD_BYTES / 1024 / 1024}MB 限制（${(bytes.byteLength / 1024 / 1024).toFixed(1)}MB）`,
      413,
    )
  }

  try {
    const saved = await saveUploadedImage(bytes, ext)
    return NextResponse.json({
      code: 200,
      message: 'ok',
      // Duplicated at both levels so any caller shape (`data.image_url` / `image_url`) resolves
      data: { image_url: saved.url, url: saved.url, key: saved.key, size: saved.size },
      image_url: saved.url,
    })
  } catch (error) {
    // Almost always a permission / missing-dir problem on the server (check UPLOAD_DIR)
    console.error('[upload-image] failed to persist upload:', error)
    return fail('图片上传失败：服务器写入失败，请检查 UPLOAD_DIR 权限', 500)
  }
}
