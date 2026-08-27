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
  MAX_VIDEO_UPLOAD_BYTES,
  extensionForUpload,
  isVideoUploadExt,
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
  // A gallery is sent as one multipart request. Keep a generous body cap while
  // enforcing the existing per-image limit below.
  const declaredLength = Number(request.headers.get('content-length') || 0)
  const maxBatchBytes = MAX_VIDEO_UPLOAD_BYTES * 2
  if (declaredLength > maxBatchBytes * 1.05) {
    return fail(`图片上传失败：单次上传总大小超过 ${maxBatchBytes / 1024 / 1024}MB`, 413)
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return fail('图片上传失败：请求不是合法的 multipart/form-data', 400)
  }

  // `image` is repeatable for galleries; `file` remains accepted for compatibility.
  const entries = [
    ...form.getAll('image'),
    ...form.getAll('file'),
  ].filter(isFileLike)
  if (!entries.length) {
    return fail('图片上传失败：缺少 image 字段', 400)
  }
  if (entries.length > 24) {
    return fail('图片上传失败：单次最多上传 24 张图片', 413)
  }

  const prepared: Array<{ bytes: Uint8Array; ext: string }> = []
  for (const entry of entries) {
    const ext = extensionForUpload(entry.name, entry.type)
    if (!ext) {
      return fail(`图片上传失败：不支持的文件类型（${entry.type || entry.name || 'unknown'}）`, 415)
    }
    const bytes = new Uint8Array(await entry.arrayBuffer())
    if (!bytes.byteLength) {
      return fail(`图片上传失败：${entry.name || '图片'}内容为空`, 400)
    }
    const maxBytes = isVideoUploadExt(ext) ? MAX_VIDEO_UPLOAD_BYTES : MAX_UPLOAD_BYTES
    if (bytes.byteLength > maxBytes) {
      return fail(
        `图片上传失败：${entry.name || '图片'}超过 ${maxBytes / 1024 / 1024}MB 限制（${(bytes.byteLength / 1024 / 1024).toFixed(1)}MB）`,
        413,
      )
    }
    prepared.push({ bytes, ext })
  }

  try {
    const saved = await Promise.all(
      prepared.map(({ bytes, ext }) => saveUploadedImage(bytes, ext)),
    )
    const first = saved[0]
    return NextResponse.json({
      code: 200,
      message: 'ok',
      // Keep legacy single-image fields while exposing the complete ordered gallery.
      data: {
        image_url: first.url,
        url: first.url,
        key: first.key,
        size: first.size,
        images: saved.map(item => ({
          image_url: item.url,
          url: item.url,
          key: item.key,
          size: item.size,
        })),
        urls: saved.map(item => item.url),
      },
      image_url: first.url,
      images: saved.map(item => ({ image_url: item.url, url: item.url })),
    })
  } catch (error) {
    // Almost always a permission / missing-dir problem on the server (check UPLOAD_DIR)
    console.error('[upload-image] failed to persist upload:', error)
    return fail('图片上传失败：服务器写入失败，请检查 UPLOAD_DIR 权限', 500)
  }
}
