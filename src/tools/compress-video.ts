/**
 * Client-side video downscale via MediaRecorder.
 * Falls back to the original file when the browser cannot re-encode.
 */

const SKIP_UNDER_BYTES = 6 * 1024 * 1024
const MAX_EDGE_PX = 1280
const TARGET_BITS_PER_SECOND = 1_800_000

function pickMime(): string {
  const candidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
  if (typeof MediaRecorder === 'undefined') return ''
  return candidates.find((item) => MediaRecorder.isTypeSupported(item)) || ''
}

export async function compressVideoForUpload(file: File): Promise<File> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return file
  if (file.size > 0 && file.size < SKIP_UNDER_BYTES) return file
  const mime = pickMime()
  if (!mime) return file

  const objectUrl = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.preload = 'auto'
  video.src = objectUrl

  try {
    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error('video load timeout')), 20000)
      video.onloadedmetadata = () => {
        window.clearTimeout(timer)
        resolve()
      }
      video.onerror = () => {
        window.clearTimeout(timer)
        reject(new Error('video load failed'))
      }
    })

    const srcW = video.videoWidth || 0
    const srcH = video.videoHeight || 0
    if (!srcW || !srcH) return file
    const scale = Math.min(1, MAX_EDGE_PX / Math.max(srcW, srcH))
    const outW = Math.max(2, Math.round((srcW * scale) / 2) * 2)
    const outH = Math.max(2, Math.round((srcH * scale) / 2) * 2)

    const canvas = document.createElement('canvas')
    canvas.width = outW
    canvas.height = outH
    const ctx = canvas.getContext('2d')
    if (!ctx) return file

    const stream = canvas.captureStream(24)
    const recorder = new MediaRecorder(stream, {
      mimeType: mime,
      videoBitsPerSecond: TARGET_BITS_PER_SECOND,
    })
    const chunks: BlobPart[] = []
    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size) chunks.push(event.data)
    }

    const done = new Promise<Blob>((resolve, reject) => {
      recorder.onstop = () => resolve(new Blob(chunks, { type: mime.split(';')[0] }))
      recorder.onerror = () => reject(new Error('video encode failed'))
    })

    recorder.start(400)
    await video.play().catch(() => undefined)
    let stopped = false
    const draw = () => {
      if (stopped) return
      ctx.drawImage(video, 0, 0, outW, outH)
      if (video.ended || video.paused) {
        stopped = true
        if (recorder.state !== 'inactive') recorder.stop()
        return
      }
      requestAnimationFrame(draw)
    }
    draw()

    const encoded = await Promise.race([
      done,
      new Promise<Blob>((_, reject) => {
        window.setTimeout(() => reject(new Error('video encode timeout')), 90000)
      }),
    ])
    video.pause()
    if (encoded.size <= 0 || encoded.size >= file.size * 0.95) return file
    const base = file.name.replace(/\.[^.]+$/, '') || 'video'
    return new File([encoded], `${base}.webm`, { type: encoded.type || 'video/webm' })
  } catch {
    return file
  } finally {
    URL.revokeObjectURL(objectUrl)
    video.removeAttribute('src')
    video.load()
  }
}
