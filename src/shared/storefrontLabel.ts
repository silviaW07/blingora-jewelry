/** Leftover after CJK strip is only a capacity / size token (100ml, 125ML, G8857 125ml). */
const VOLUME_OR_SIZE_ONLY_RE = /^\d+(?:\.\d+)?\s*(?:ml|oz|l|cm|mm|g|kg)?$/i

export function leftoverIsVolumeOnly(text: string): boolean {
  const compact = String(text || '')
    .replace(/[#]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!compact) return true
  if (VOLUME_OR_SIZE_ONLY_RE.test(compact)) return true
  const withoutSku = compact.replace(/[A-Za-z]+\d+/g, '').replace(/[#]/g, ' ').replace(/\s+/g, ' ').trim()
  return !withoutSku || VOLUME_OR_SIZE_ONLY_RE.test(withoutSku)
}

/** 雾暖茶香125ml → 雾暖茶香 125ml */
export function formatPackedNameAndVolume(raw: string): string {
  const value = String(raw || '').trim()
  const matched = value.match(/^(.*?)(\d+(?:\.\d+)?\s*(?:ml|oz|l))\s*$/i)
  if (!matched) return value
  const name = matched[1].replace(/[-–—_#\s]+$/g, '').trim()
  const volume = matched[2].replace(/\s+/g, '').replace(/ML/gi, 'ml')
  if (!name) return value
  return `${name} ${volume}`
}
