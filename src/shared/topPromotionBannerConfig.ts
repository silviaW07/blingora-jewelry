import type prismaClient from '@/tools/prisma'

type PrismaLike = typeof prismaClient

export const TOP_PROMOTION_SETTING_TITLE = 'CATEGORY_TOP_PROMOTION'

/** 字号预设；也可存具体像素值 */
export type TopPromotionFontSizePreset = 'sm' | 'md' | 'lg'

export type TopPromotionBannerConfig = {
  enabled: boolean
  message: string
  end_time: string | null
  background_color: string
  text_color: string
  /** 字号：sm/md/lg 或数字像素（12–48） */
  font_size: TopPromotionFontSizePreset | number
}

export type TopPromotionCountdownParts = {
  days: string
  hours: string
  minutes: string
  seconds: string
}

export const DEFAULT_TOP_PROMOTION_BANNER_CONFIG: TopPromotionBannerConfig = {
  enabled: false,
  message: '',
  end_time: null,
  background_color: '#000000',
  text_color: '#ffffff',
  font_size: 'md',
}

export const TOP_PROMOTION_FONT_SIZE_PX: Record<TopPromotionFontSizePreset, number> = {
  sm: 13,
  md: 15,
  lg: 18,
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, value))
}

export function normalizeTopPromotionFontSize(raw: unknown): TopPromotionFontSizePreset | number {
  if (raw === 'sm' || raw === 'md' || raw === 'lg') return raw
  if (typeof raw === 'string' && ['small', 'medium', 'large'].includes(raw)) {
    if (raw === 'small') return 'sm'
    if (raw === 'large') return 'lg'
    return 'md'
  }
  const n = typeof raw === 'number' ? raw : Number(raw)
  if (Number.isFinite(n) && n > 0) return Math.round(clamp(n, 12, 48))
  return DEFAULT_TOP_PROMOTION_BANNER_CONFIG.font_size
}

export function resolveTopPromotionFontSizePx(fontSize: TopPromotionFontSizePreset | number | null | undefined): number {
  if (fontSize === 'sm' || fontSize === 'md' || fontSize === 'lg') {
    return TOP_PROMOTION_FONT_SIZE_PX[fontSize]
  }
  const n = Number(fontSize)
  if (Number.isFinite(n) && n > 0) return Math.round(clamp(n, 12, 48))
  return TOP_PROMOTION_FONT_SIZE_PX.md
}

export function normalizeTopPromotionDateTime(raw: unknown): string | null {
  if (raw == null) return null
  const text = String(raw).trim()
  if (!text) return null
  const date = new Date(text)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

export function toTopPromotionDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function normalizeTopPromotionBannerConfig(raw: unknown, fallbackActive = false): TopPromotionBannerConfig {
  const input = (raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}) as Record<string, any>
  const message =
    typeof input.message === 'string'
      ? input.message
      : typeof input.text === 'string'
        ? input.text
        : typeof input.title === 'string'
          ? input.title
          : DEFAULT_TOP_PROMOTION_BANNER_CONFIG.message

  const enabledRaw = input.enabled
  const enabled =
    typeof enabledRaw === 'boolean'
      ? enabledRaw
      : enabledRaw === 'true' || enabledRaw === 1 || enabledRaw === '1'
        ? true
        : enabledRaw === 'false' || enabledRaw === 0 || enabledRaw === '0'
          ? false
          : Boolean(fallbackActive)

  return {
    enabled,
    message: String(message || '').trim(),
    end_time: normalizeTopPromotionDateTime(input.end_time ?? input.endTime ?? input.endsAt),
    background_color:
      String(input.background_color ?? input.backgroundColor ?? input.bgColor ?? DEFAULT_TOP_PROMOTION_BANNER_CONFIG.background_color).trim() ||
      DEFAULT_TOP_PROMOTION_BANNER_CONFIG.background_color,
    text_color:
      String(input.text_color ?? input.textColor ?? input.color ?? DEFAULT_TOP_PROMOTION_BANNER_CONFIG.text_color).trim() ||
      DEFAULT_TOP_PROMOTION_BANNER_CONFIG.text_color,
    font_size: normalizeTopPromotionFontSize(input.font_size ?? input.fontSize ?? input.fontSizePx),
  }
}

export function computeTopPromotionCountdown(
  endTime: string | null | undefined,
  nowMs: number = Date.now(),
): { isEnded: boolean; hasEndTime: boolean; parts: TopPromotionCountdownParts } {
  const empty: TopPromotionCountdownParts = { days: '00', hours: '00', minutes: '00', seconds: '00' }
  if (!endTime) return { isEnded: false, hasEndTime: false, parts: empty }
  const endMs = new Date(endTime).getTime()
  if (!Number.isFinite(endMs)) return { isEnded: false, hasEndTime: false, parts: empty }
  const remainingMs = Math.max(0, endMs - nowMs)
  const totalSeconds = Math.floor(remainingMs / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return {
    isEnded: totalSeconds <= 0,
    hasEndTime: true,
    parts: {
      days: String(days).padStart(2, '0'),
      hours: String(hours).padStart(2, '0'),
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0'),
    },
  }
}

export async function loadTopPromotionBannerConfig(db: PrismaLike): Promise<TopPromotionBannerConfig> {
  try {
    const setting = await db.sitesetting.findFirst({
      where: { title: TOP_PROMOTION_SETTING_TITLE },
      orderBy: [{ updatedAt: 'desc' }],
      select: { contentJson: true, isActive: true },
    })
    if (!setting) return DEFAULT_TOP_PROMOTION_BANNER_CONFIG
    return normalizeTopPromotionBannerConfig(setting.contentJson, setting.isActive)
  } catch {
    return DEFAULT_TOP_PROMOTION_BANNER_CONFIG
  }
}

export async function saveTopPromotionBannerConfig(
  db: PrismaLike,
  config: TopPromotionBannerConfig,
): Promise<TopPromotionBannerConfig> {
  const normalized = normalizeTopPromotionBannerConfig(config, config.enabled)
  const contentJson = {
    enabled: normalized.enabled,
    message: normalized.message,
    end_time: normalized.end_time,
    background_color: normalized.background_color,
    text_color: normalized.text_color,
    font_size: normalized.font_size,
  }

  const existing = await db.sitesetting.findFirst({
    where: { title: TOP_PROMOTION_SETTING_TITLE },
    orderBy: [{ updatedAt: 'desc' }],
    select: { id: true, settingType: true },
  })

  if (existing?.id) {
    await db.sitesetting.update({
      where: { id: existing.id },
      data: {
        settingType: existing.settingType || 'STATIC_COPY',
        title: TOP_PROMOTION_SETTING_TITLE,
        subtitle: '站点顶部促销通栏配置',
        contentJson: contentJson as any,
        imageUrl: null,
        isActive: normalized.enabled,
      },
    })
  } else {
    await db.sitesetting.create({
      data: {
        settingType: 'STATIC_COPY',
        title: TOP_PROMOTION_SETTING_TITLE,
        subtitle: '站点顶部促销通栏配置',
        contentJson: contentJson as any,
        imageUrl: null,
        localeCode: null,
        currencyCode: null,
        sortWeight: 0,
        isActive: normalized.enabled,
      },
    })
  }

  return normalized
}
