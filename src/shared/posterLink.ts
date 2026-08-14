/**
 * 海报/横幅跳转链接规范化：支持站内路径、完整 URL、无协议域名。
 */
export function normalizePosterLinkUrl(raw?: string | null): string | null {
  const text = String(raw || '').trim()
  if (!text) return null
  if (text.startsWith('/')) return text
  if (/^https?:\/\//i.test(text)) return text
  if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(text)) {
    return text.startsWith('//') ? `https:${text}` : `https://${text.replace(/^\/+/, '')}`
  }
  return `/${text.replace(/^\/+/, '')}`
}

export function isAbsoluteHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url)
}
