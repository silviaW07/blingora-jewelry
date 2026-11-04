export type ServiceTrustTemplate = {
  headline: string
  address: string
  note: string
  images: string[]
  videoUrl: string
}

export const DEFAULT_SERVICE_TRUST_TEMPLATE: ServiceTrustTemplate = {
  headline: 'How we take your order',
  address: '',
  note: 'Pay by PayPal or bank transfer. Orders are packed at our own workshop and shipped with a tracking number.',
  images: [],
  videoUrl: '',
}

export function parseServiceTrustTemplate(raw?: string | null): ServiceTrustTemplate | null {
  const text = String(raw || '').trim()
  if (!text) return null
  try {
    const data = JSON.parse(text) as Partial<ServiceTrustTemplate>
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null
    const images = Array.isArray(data.images)
      ? data.images.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 8)
      : []
    return {
      headline: String(data.headline || '').trim().slice(0, 120),
      address: String(data.address || '').trim().slice(0, 600),
      note: String(data.note || '').trim().slice(0, 1000),
      images,
      videoUrl: String(data.videoUrl || '').trim().slice(0, 500),
    }
  } catch {
    return null
  }
}

export function serializeServiceTrustTemplate(template: ServiceTrustTemplate): string {
  return JSON.stringify(template)
}

export function youtubeEmbedUrl(url: string): string | null {
  const text = url.trim()
  const match = text.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/i,
  )
  if (!match) return null
  return `https://www.youtube.com/embed/${match[1]}`
}
