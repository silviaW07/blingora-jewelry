/**
 * Project file / image upload (admin, product, decorate toolbar).
 *
 * Compresses client-side via dynamic import of compress-image so this module
 * stays free of a static dependency on canvas compress helpers.
 * Never import this from EditableImg — use get-image-url instead.
 */

const DEFAULT_PROJECT_ID =
  process.env.NEXT_PUBLIC_PROJECT_ID || 'PROJ_fcb9e6ee_snap_20260726_092922_893'

/**
 * Self-hosted endpoint (app/api/upload-image). Do NOT use AutoCoder's cloud
 * upload API — it caps the project at 200 uploads/day and bulk imports hit it
 * immediately. Trailing slash matches next.config trailingSlash.
 */
const SELF_HOSTED_UPLOAD_URL = `${(process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/+$/, '')}/api/upload-image/`

/**
 * Optional custom gateway. AutoCoder URLs are ignored even if present in .env —
 * that env var used to force the quota-limited endpoint at build time.
 */
function resolveUploadTarget(): string {
  const configured = (process.env.NEXT_PUBLIC_IMAGE_UPLOAD_URL || '').trim()
  if (!configured) return SELF_HOSTED_UPLOAD_URL
  if (/autocoder\.cc/i.test(configured)) {
    console.warn(
      '[upload] ignoring NEXT_PUBLIC_IMAGE_UPLOAD_URL pointing at AutoCoder (200/day quota); using self-hosted /api/upload-image/',
    )
    return SELF_HOSTED_UPLOAD_URL
  }
  return configured
}

const PRIMARY_UPLOAD_URL = resolveUploadTarget()

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

/** Extra context so the caller can decide whether a second endpoint is worth trying. */
type UploadFailure = Error & { httpStatus?: number; transportError?: boolean }

function uploadError(
  message: string,
  meta: { httpStatus?: number; transportError?: boolean } = {},
): UploadFailure {
  return Object.assign(new Error(message), meta)
}

/** Quota rejections are permanent for the day — never worth retrying. */
function isQuotaFailure(message: string): boolean {
  return /上限|quota|limit exceeded|too many/i.test(message)
}

/** POST the file to one endpoint; resolves to a URL or throws a described failure. */
async function postToUploadEndpoint(
  targetUrl: string,
  uploadFile: File,
  project_id: string,
): Promise<string> {
  const formData = new FormData()
  formData.append('image', uploadFile)
  formData.append('project_id', project_id)

  let response: Response
  try {
    response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json, text/plain, */*',
      },
      body: formData,
    })
  } catch (networkErr) {
    throw uploadError(
      `图片上传失败：网络请求未完成（${networkErr instanceof Error ? networkErr.message : String(networkErr)}）`,
      { transportError: true },
    )
  }

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
        throw uploadError(
          `图片上传失败：HTTP ${response.status}${rawText.slice(0, 120) ? ` — ${rawText.slice(0, 120)}` : ''}`,
          { httpStatus: response.status },
        )
      }
      throw uploadError(
        formatUploadFailure(
          null,
          `图片上传失败：未返回有效地址（响应非 JSON，HTTP ${response.status}）`,
        ),
        { httpStatus: response.status },
      )
    }
  }

  if (!response.ok) {
    console.error('Failed to upload image. Status:', response.status, data)
    throw uploadError(formatUploadFailure(data, `图片上传失败：HTTP ${response.status}`), {
      httpStatus: response.status,
    })
  }

  const url = pickUploadUrl(data)
  if (url) return url

  const codeHint =
    data && typeof data === 'object' && 'code' in (data as object)
      ? `code=${String((data as { code?: unknown }).code)}`
      : 'no url field'

  console.error('Image upload response missing URL:', data)
  throw uploadError(formatUploadFailure(data, `图片上传失败：未返回有效地址（${codeHint}）`), {
    httpStatus: response.status,
  })
}

function pickBatchUploadUrls(payload: unknown): string[] {
  if (!payload || typeof payload !== 'object') return []
  const root = payload as Record<string, unknown>
  const data =
    root.data && typeof root.data === 'object'
      ? (root.data as Record<string, unknown>)
      : root

  if (Array.isArray(data.urls)) {
    return data.urls
      .map(value => (typeof value === 'string' && isLikelyUrl(value) ? value.trim() : ''))
      .filter(Boolean)
  }

  const images = Array.isArray(data.images)
    ? data.images
    : Array.isArray(root.images)
      ? root.images
      : []
  return images.map(image => pickUploadUrl(image)).filter(Boolean)
}

/** Upload an ordered gallery in one multipart request (one cross-border round trip). */
async function postBatchToUploadEndpoint(
  targetUrl: string,
  uploadFiles: File[],
  projectId: string,
): Promise<string[]> {
  const formData = new FormData()
  for (const file of uploadFiles) formData.append('image', file)
  formData.append('project_id', projectId)

  let response: Response
  try {
    response = await fetch(targetUrl, {
      method: 'POST',
      headers: { Accept: 'application/json, text/plain, */*' },
      body: formData,
    })
  } catch (networkErr) {
    throw uploadError(
      `图片批量上传失败：网络请求未完成（${networkErr instanceof Error ? networkErr.message : String(networkErr)}）`,
      { transportError: true },
    )
  }

  const rawText = await response.text()
  let data: unknown = null
  if (rawText) {
    try {
      data = JSON.parse(rawText)
    } catch {
      throw uploadError(`图片批量上传失败：服务器响应格式异常（HTTP ${response.status}）`, {
        httpStatus: response.status,
      })
    }
  }
  if (!response.ok) {
    throw uploadError(formatUploadFailure(data, `图片批量上传失败：HTTP ${response.status}`), {
      httpStatus: response.status,
    })
  }

  const urls = pickBatchUploadUrls(data)
  if (urls.length !== uploadFiles.length) {
    throw uploadError(
      `图片批量上传失败：选择 ${uploadFiles.length} 张，服务器仅返回 ${urls.length} 张`,
      { httpStatus: response.status },
    )
  }
  return urls
}

/**
 * Upload an image to self-hosted storage only (never AutoCoder — that API is
 * capped at 200 uploads/day). NEXT_PUBLIC_IMAGE_UPLOAD_URL may override to a
 * non-AutoCoder gateway. Compresses client-side before send.
 */
export async function upload_image_file(
  file: File,
  projectId?: string,
  options?: { skipCompress?: boolean },
): Promise<string> {
  try {
    const maxSize = 5 * 1024 * 1024

    // Dynamic import: keep compress-image off upload-image's static module graph
    // so compress HMR does not tightly couple invalidation of upload.
    let uploadFile = file
    if (!options?.skipCompress) {
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
    }

    if (uploadFile.size > maxSize) {
      throw new Error(
        `图片上传失败：文件超过 5MB 限制（压缩后 ${(uploadFile.size / 1024 / 1024).toFixed(1)}MB）`,
      )
    }

    const project_id = (projectId && projectId.trim()) || DEFAULT_PROJECT_ID
    return await postToUploadEndpoint(PRIMARY_UPLOAD_URL, uploadFile, project_id)
  } catch (error) {
    console.error('An error occurred while uploading image:', error)
    if (error instanceof Error && isQuotaFailure(error.message)) {
      throw new Error(
        '图片上传失败：仍在调用已限流的旧图床。请清除浏览器缓存后重试，或确认已用 webpack 重新部署（上传应走 /api/upload-image/）。',
      )
    }
    throw error
  }
}

/** Image or video. Images use JPEG/WebP compress; videos re-encode when possible. */
export async function upload_media_file(file: File, projectId?: string): Promise<string> {
  const isVideo = /^video\//i.test(file.type) || /\.(mp4|webm|mov|m4v)$/i.test(file.name)
  if (isVideo) {
    let uploadFile = file
    try {
      const { compressVideoForUpload } = await import('./compress-video')
      uploadFile = await compressVideoForUpload(file)
    } catch (error) {
      console.warn('[upload] video compression failed, uploading original', error)
    }
    const maxSize = 80 * 1024 * 1024
    if (uploadFile.size > maxSize) {
      throw new Error('Video is over 80MB.')
    }
    const project_id = (projectId && projectId.trim()) || DEFAULT_PROJECT_ID
    return postToUploadEndpoint(PRIMARY_UPLOAD_URL, uploadFile, project_id)
  }
  return upload_image_file(file, projectId)
}

/** Run async work over items with a fixed concurrency (keeps order in results). */
async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
  onItemDone?: (done: number, total: number) => void,
): Promise<R[]> {
  if (!items.length) return []
  const results = new Array<R>(items.length)
  let cursor = 0
  let done = 0
  const run = async () => {
    while (true) {
      const index = cursor
      cursor += 1
      if (index >= items.length) return
      results[index] = await worker(items[index], index)
      done += 1
      onItemDone?.(done, items.length)
    }
  }
  const pool = Math.min(Math.max(1, concurrency), items.length)
  await Promise.all(Array.from({ length: pool }, () => run()))
  return results
}

/**
 * Upload many images with limited parallelism (default 4).
 * Much faster than serial await for gallery / multi-select uploads.
 */
export async function upload_image_files(
  files: File[],
  options?: {
    projectId?: string
    concurrency?: number
    skipCompress?: boolean
    onProgress?: (done: number, total: number) => void
  },
): Promise<string[]> {
  const result = await upload_image_files_detailed(files, options)
  if (result.failures.length) {
    const error = new Error(
      `有 ${result.failures.length} 张图片上传失败：${result.failures.map(item => item.fileName).slice(0, 3).join('、')}`,
    ) as Error & { partialUrls?: string[]; failures?: UploadImageFailure[] }
    error.partialUrls = result.urls
    error.failures = result.failures
    throw error
  }
  return result.urls
}

export type UploadImageFailure = {
  index: number
  fileName: string
  message: string
}

export type UploadImageBatchResult = {
  urls: string[]
  failures: UploadImageFailure[]
}

/**
 * Fast path: one compressed multipart request.
 * Recovery path: if that request fails, retry each image independently once and
 * return successful URLs so callers can persist partial progress.
 */
export async function upload_image_files_detailed(
  files: File[],
  options?: {
    projectId?: string
    concurrency?: number
    skipCompress?: boolean
    /** Skip one giant multipart; upload each file separately (better for large multi-select). */
    sequential?: boolean
    onProgress?: (done: number, total: number) => void
  },
): Promise<UploadImageBatchResult> {
  const list = files.filter(Boolean)
  if (!list.length) return { urls: [], failures: [] }

  const maxSize = 5 * 1024 * 1024
  const concurrency = Math.max(1, options?.concurrency ?? 4)
  const sequential = Boolean(options?.sequential) || list.length > 6
  let prepared = list
  if (!options?.skipCompress) {
    const { compressImageForUpload } = await import('./compress-image')
    // Compress with the same low pool so other products can keep uploading.
    prepared = await mapPool(
      list,
      Math.min(concurrency, sequential ? 2 : 4),
      async file => {
        try {
          return await compressImageForUpload(file)
        } catch (error) {
          console.warn('[upload] image compression failed, using original', error)
          return file
        }
      },
    )
  }
  for (const file of prepared) {
    if (file.size > maxSize) {
      throw new Error(
        `图片上传失败：${file.name} 超过 5MB 限制（压缩后 ${(file.size / 1024 / 1024).toFixed(1)}MB）`,
      )
    }
  }

  options?.onProgress?.(0, list.length)
  const projectId = options?.projectId?.trim() || DEFAULT_PROJECT_ID

  // Large multi-select: avoid one huge multipart that stalls the whole admin UI/network.
  if (!sequential) {
    try {
      const urls = await postBatchToUploadEndpoint(PRIMARY_UPLOAD_URL, prepared, projectId)
      options?.onProgress?.(urls.length, list.length)
      return { urls, failures: [] }
    } catch (batchError) {
      console.warn('[upload] batch request failed; retrying images individually', batchError)
    }
  }

  let completed = 0
  const recovered = await mapPool(
    prepared,
    sequential ? Math.min(concurrency, 2) : concurrency,
    async (file, index) => {
      let lastError: unknown = null
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const url = await postToUploadEndpoint(PRIMARY_UPLOAD_URL, file, projectId)
          completed += 1
          options?.onProgress?.(completed, list.length)
          return { index, url, error: null }
        } catch (error) {
          lastError = error
        }
      }
      completed += 1
      options?.onProgress?.(completed, list.length)
      return { index, url: '', error: lastError }
    },
  )

  return {
    urls: recovered.map(item => item.url).filter(Boolean),
    failures: recovered
      .filter(item => !item.url)
      .map(item => ({
        index: item.index,
        fileName: list[item.index]?.name || `第 ${item.index + 1} 张`,
        message:
          item.error instanceof Error
            ? item.error.message
            : String(item.error || '上传失败'),
      })),
  }
}

/** Alias used by product management upload flows */
export const upload_project_file = upload_image_file
export const upload_project_files = upload_image_files
export const upload_project_files_detailed = upload_image_files_detailed
