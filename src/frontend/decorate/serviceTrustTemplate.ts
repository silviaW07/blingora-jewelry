export type TrustSection = {
  title: string
  body: string
  images: string[]
  videoUrl: string
}

export type ServiceTrustTemplate = {
  company: TrustSection
  shipping: TrustSection
  ordering: TrustSection
}

function blankSection(title: string): TrustSection {
  return { title, body: '', images: [], videoUrl: '' }
}

export const DEFAULT_SERVICE_TRUST_TEMPLATE: ServiceTrustTemplate = {
  company: blankSection('公司信息'),
  shipping: blankSection('发货流程'),
  ordering: blankSection('下单流程'),
}

function readSection(raw: unknown, fallbackTitle: string): TrustSection {
  const data = raw && typeof raw === 'object' ? (raw as Partial<TrustSection>) : {}
  const images = Array.isArray(data.images)
    ? data.images.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 8)
    : []
  return {
    title: String(data.title || fallbackTitle).trim().slice(0, 80),
    body: String(data.body || '').trim().slice(0, 4000),
    images,
    videoUrl: String(data.videoUrl || '').trim().slice(0, 500),
  }
}

export function parseServiceTrustTemplate(raw?: string | null): ServiceTrustTemplate | null {
  const text = String(raw || '').trim()
  if (!text) return null
  try {
    const data = JSON.parse(text) as Record<string, unknown>
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null
    if (data.company || data.shipping || data.ordering) {
      return {
        company: readSection(data.company, '公司信息'),
        shipping: readSection(data.shipping, '发货流程'),
        ordering: readSection(data.ordering, '下单流程'),
      }
    }
    const images = Array.isArray(data.images)
      ? data.images.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 8)
      : []
    const legacyBody = [data.address, data.note].map((item) => String(item || '').trim()).filter(Boolean).join('\n\n')
    if (!legacyBody && images.length === 0 && !String(data.videoUrl || '').trim()) return null
    return {
      company: {
        title: String(data.headline || '公司信息').trim().slice(0, 80) || '公司信息',
        body: legacyBody.slice(0, 4000),
        images,
        videoUrl: String(data.videoUrl || '').trim().slice(0, 500),
      },
      shipping: blankSection('发货流程'),
      ordering: blankSection('下单流程'),
    }
  } catch {
    return null
  }
}

export function sectionHasContent(section: TrustSection): boolean {
  return Boolean(section.body || section.images.length || section.videoUrl)
}

export function trustHasContent(template: ServiceTrustTemplate | null | undefined): boolean {
  if (!template) return false
  return [template.company, template.shipping, template.ordering].some(sectionHasContent)
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
