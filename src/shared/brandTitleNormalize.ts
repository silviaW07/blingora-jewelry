/**
 * Brand alias normalization for product titles.
 * Replaces seller slang / mixed-language brand tokens (e.g. "蔻C", "蔻家", "古驰", "LV")
 * with the canonical brand name ("Coach", "Gucci", "Louis Vuitton") BEFORE the title is
 * translated or written to the DB. Shared by web + backend (no DB access here).
 */

export interface BrandAliasRule {
  /** 原始别名/暗语（如 "蔻C"、"LV"、"路易威登"） */
  alias: string
  /** 目标标准品牌名（如 "Coach"、"Louis Vuitton"） */
  standard: string
}

/** 纯 ASCII 别名（如 "LV"）需要边界匹配，避免命中英文单词内部（如 "solve"） */
const isAsciiAlias = (value: string) => /^[\x00-\x7F]+$/.test(value)

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * 对标题应用品牌别名替换。
 * - 别名按长度倒序，先替换更长的别名，避免短别名抢先造成错替。
 * - ASCII 别名（LV）大小写不敏感，且要求前后不是字母/数字，防止误伤英文单词内部。
 * - 含中文/混合别名直接全局替换。
 * - 幂等：对已归一化文本再次调用不会破坏结果。
 */
export function applyBrandAliases(title: string | null | undefined, rules: BrandAliasRule[]): string {
  let text = String(title ?? '')
  if (!text.trim() || !Array.isArray(rules) || rules.length === 0) return text

  const sorted = [...rules].sort((a, b) => String(b.alias || '').length - String(a.alias || '').length)

  for (const rule of sorted) {
    const alias = String(rule?.alias ?? '').trim()
    const standard = String(rule?.standard ?? '').trim()
    if (!alias || !standard) continue

    if (isAsciiAlias(alias)) {
      const re = new RegExp(`(?<![A-Za-z0-9])${escapeRegExp(alias)}(?![A-Za-z0-9])`, 'gi')
      text = text.replace(re, standard)
    } else {
      text = text.split(alias).join(standard)
    }
  }

  return text
}
