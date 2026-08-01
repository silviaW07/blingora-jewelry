import type { DecoratePatch, DecorateStore } from '@/frontend/decorate/types'

export const PAGE_DECORATE_SETTING_TITLE = 'PAGE_VISUAL_DECORATE'

export type PageDecorateConfigResult = {
  store: DecorateStore
  /** 是否已有后台持久化记录；false 时前端应保留本地装修草稿 */
  persisted: boolean
}

export function normalizeStore(raw: unknown): DecorateStore {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const next: DecorateStore = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!key || !value || typeof value !== 'object' || Array.isArray(value)) continue
    next[key] = value as DecoratePatch
  }
  return next
}
