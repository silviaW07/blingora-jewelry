/**
 * Project file / image upload (admin, product, decorate toolbar).
 *
 * Compresses client-side via dynamic import of compress-image so this module
 * stays free of a static dependency on canvas compress helpers.
 * Never import this from EditableImg — use get-image-url instead.
 */

const DEFAULT_PROJECT_ID =
  process.env.NEXT_PUBLIC_PROJECT_ID || 'PROJ_fcb9e6ee_snap_20260726_092922_893'

const DEFAULT_IMAGE_UPLOAD_URL =
  process.env.NEXT_PUBLIC_IMAGE_UPLOAD_URL ||
  'https://project.autocoder.cc/api/project/image/upload/project'

const URL_FIELD_KEYS = [
  'image_url',
  'file_url',
  'url',
  'imageUrl',
  'fileUrl',
  'cdn_url',
  'cdnUrl',
  'oss_url',
  'ossUrl',
  'public_url',
  'publicUrl',
  'src',
  'path',
  'location',
] as const

const NEST_KEYS = ['data', 'result', 'payload', 'file', 'image', 'body'] as const

function isLikelyUrl(value: string): boolean {
  const text = value.trim()
  if (!text) return false
  return (
    text.startsWith('http://') ||
    text.startsWith('https://') ||
    text.startsWith('//') ||
    text.startsWith('/') ||
    text.startsWith('data:image/')
  )
}

/** Best-effort URL extraction across AutoCoder / OSS response shapes. */
function pickUploadUrl(payload: unknown, depth = 0): string {
  if (payload == null || depth > 4) return ''

  if (typeof payload === 'string') {
    return isLikelyUrl(payload) ? payload.trim() : ''
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const found = pickUploadUrl(item, depth + 1)
      if (found) return found
    }
    return ''
  }

  if (typeof payload !== 'object') return ''

  const obj = payload as Record<string, unknown>

  for (const key of URL_FIELD_KEYS) {
    const value = obj[key]
    if (typeof value === 'string' && isLikelyUrl(value)) return value.trim()
  }

  for (const key of NEST_KEYS) {
    if (key in obj) {
      const found = pickUploadUrl(obj[key], depth + 1)
      if (found) return found
    }
  }

  // Some APIs wrap a single file object under arbitrary keys
  for (const value of Object.values(obj)) {
    if (value && typeof value === 'object') {
      const found = pickUploadUrl(value, depth + 1)
      if (found) return found
    }
  }

  return ''
}

function pickServerMessage(payload: unknown, depth = 0): string {
  if (payload == null || depth > 3) return ''
  if (typeof payload === 'string') return payload.trim()
  if (typeof payload !== 'object') return ''

  const obj = payload as Record<string, unknown>
  for (const key of ['message', 'msg', 'error', 'errMsg', 'errorMessage', 'detail', 'reason']) {
    const value = obj[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  for (const nest of NEST_KEYS) {
    if (nest in obj) {
      const nested = pickServerMessage(obj[nest], depth + 1)
      if (nested) return nested
    }
  }
  return ''
}

function formatUploadFailure(data: unknown, fallback: string): string {
  const msg = pickServerMessage(data)
  if (!msg) return fallback
  if (fallback.includes(msg)) return fallback
  return `${fallback}（${msg}）`
}

/**
 * Upload an image to AutoCoder project storage (or NEXT_PUBLIC_IMAGE_UPLOAD_URL).
 * Compresses client-side (canvas) before send so callers automatically get smaller files.
 * Always returns a non-empty URL string, or throws with a server/friendly message.
 */
export async function upload_image_file(file: File, projectId?: string): Promise<string> {
  try {
    const maxSize = 5 * 1024 * 1024

    // Dynamic import: keep compress-image off upload-image's static module graph
    // so compress HMR does not tightly couple invalidation of upload.
    let uploadFile = file
    try {
      const { compressImageForUpload } = await import('./compress-image')
      uploadFile = await compressImageForUpload(file)
      if (uploadFile.size !== file.size || uploadFile.type !== file.type) {
        console.info(
          `[upload] compressed image: ${(file.size / 1024).toFixed(0)}KB → ${(uploadFile.size / 1024).toFixed(0)}KB (${uploadFile.type})`,
        )
      }
    } catch (compressErr) {
      console.warn('[upload] image compression failed, uploading original', compressErr)
      uploadFile = file
    }

    if (uploadFile.size > maxSize) {
      throw new Error(
        `图片上传失败：文件超过 5MB 限制（压缩后 ${(uploadFile.size / 1024 / 1024).toFixed(1)}MB）`,
      )
    }

    const project_id = (projectId && projectId.trim()) || DEFAULT_PROJECT_ID

    const formData = new FormData()
    formData.append('image', uploadFile)
    formData.append('project_id', project_id)

    const authToken =
      (typeof localStorage !== 'undefined' &&
        (localStorage.getItem('full_token') || localStorage.getItem('token') || '')) ||
      ''

    const response = await fetch(DEFAULT_IMAGE_UPLOAD_URL, {
      method: 'POST',
      headers: {
        'AGC-language': 'en-US',
        Accept: 'application/json, text/plain, */*',
        'X-Browser': 'Blink',
        'X-Language': 'en',
        ...(authToken ? { Authorization: authToken } : {}),
      },
      body: formData,
    })

    let data: unknown = null
    const rawText = await response.text()
    if (rawText) {
      try {
        data = JSON.parse(rawText)
      } catch {
        // Plain text URL body
        if (response.ok && isLikelyUrl(rawText)) {
          return rawText.trim()
        }
        if (!response.ok) {
          throw new Error(
            `图片上传失败：HTTP ${response.status}${rawText.slice(0, 120) ? ` — ${rawText.slice(0, 120)}` : ''}`,
          )
        }
        throw new Error(
          formatUploadFailure(
            null,
            `图片上传失败：未返回有效地址（响应非 JSON，HTTP ${response.status}）`,
          ),
        )
      }
    }

    if (!response.ok) {
      console.error('Failed to upload image. Status:', response.status, data)
      throw new Error(formatUploadFailure(data, `图片上传失败：HTTP ${response.status}`))
    }

    const url = pickUploadUrl(data)
    if (url) return url

    const codeHint =
      data && typeof data === 'object' && 'code' in (data as object)
        ? `code=${String((data as { code?: unknown }).code)}`
        : 'no url field'

    console.error('Image upload response missing URL:', data)
    throw new Error(formatUploadFailure(data, `图片上传失败：未返回有效地址（${codeHint}）`))
  } catch (error) {
    console.error('An error occurred while uploading image:', error)
    throw error
  }
}

/** Alias used by product management upload flows */
export const upload_project_file = upload_image_file
