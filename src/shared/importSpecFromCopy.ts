/** 文案里的尺寸/规格，录入为前台 Size options（如 32cm、31*23）。 */

import { extractProductDimensionSpec, isTruncatedDimensionOf } from '@/shared/tableImportSpec'

const COPY_COLOR_WORDS: Array<{ match: RegExp; label: string }> = [
  { match: /象牙白|米白|奶白|白色|白/u, label: '白色' },
  { match: /黑色|黑/u, label: '黑色' },
  { match: /咖啡|棕色|褐色|棕色|棕/u, label: '棕色' },
  { match: /红色|紅|红/u, label: '红色' },
  { match: /粉色|粉/u, label: '粉色' },
  { match: /蓝色|藍|蓝/u, label: '蓝色' },
  { match: /绿色|綠|绿/u, label: '绿色' },
  { match: /米色|杏|卡其/u, label: '米色' },
  { match: /灰色|灰/u, label: '灰色' },
  { match: /金色|金/u, label: '金色' },
  { match: /银色|銀|银/u, label: '银色' },
  { match: /橙色|橘|橙/u, label: '橙色' },
  { match: /紫色|紫/u, label: '紫色' },
]

/** 相册文案里的「白色/红色/黑色」当颜色 SKU，不要写进规格。 */
export function extractColorLabelsFromCopy(
  ...texts: Array<string | null | undefined>
): string[] {
  const src = texts.filter(Boolean).join('\n')
  if (!src.trim()) return []
  const found: string[] = []
  const seen = new Set<string>()
  const push = (label: string) => {
    if (!label || seen.has(label)) return
    seen.add(label)
    found.push(label)
  }
  const labelOf = (token: string) => {
    const compact = token.replace(/\s+/g, '')
    if (!compact || compact.length > 8) return ''
    for (const row of COPY_COLOR_WORDS) {
      if (row.match.test(compact) && (compact.includes('色') || compact.length <= 2)) return row.label
    }
    return ''
  }
  const colorLine = src.match(/(?:颜色|顏色|colour|color|款式)\s*[:：]?\s*([^\n]{2,48})/i)
  const chunks = (colorLine?.[1] || src).split(/[\/／、,，|｜;；\s]+/)
  for (const token of chunks) {
    const label = labelOf(token)
    if (label) push(label)
  }
  if (found.length >= 2) return found.slice(0, 12)
  const short = src.match(/[白黑红紅粉蓝藍棕米](?:\s*[\/／、]\s*[白黑红紅粉蓝藍棕米]){1,10}/)
  if (short) {
    for (const ch of short[0].split(/[\/／、\s]+/)) {
      const label = labelOf(ch)
      if (label) push(label)
    }
  }
  return found.length >= 2 ? found.slice(0, 12) : []
}

const LABEL_SPEC_RE =
  /(?:尺寸|尺码|规格|size)\s*[:：]?\s*(\d+(?:\.\d+)?(?:(?:\s*[*xX×]\s*|\s+)\d+(?:\.\d+)?){0,2}(?:\s*(?:cm|CM|厘米|mm|MM))?)/gi
const DIM_RE =
  /\b(\d{1,3}(?:\.\d+)?\s*[*xX×]\s*\d{1,3}(?:\.\d+)?(?:\s*[*xX×]\s*\d{1,3}(?:\.\d+)?)?(?:\s*(?:cm|CM|厘米))?)\b/gi
const CM_RE = /\b(\d{2,3}(?:\.\d+)?\s*(?:cm|CM|厘米))\b/g

function normalizeSpecLabel(raw: string): string {
  return String(raw || '')
    .replace(/厘米/gi, 'cm')
    .replace(/(\d)\s+(\d)/g, '$1*$2')
    .replace(/[xX×]/g, '*')
    .replace(/\s+/g, '')
    .trim()
}

function isUsefulSpec(value: string): boolean {
  if (!value) return false
  if (/^\d+$/.test(value) && Number(value) > 80) return false
  return /\d/.test(value)
}

export function extractSpecLabelsFromCopy(
  ...texts: Array<string | null | undefined>
): string[] {
  const src = texts.filter(Boolean).join('\n')
  if (!src.trim()) return []
  const found: string[] = []
  const push = (raw: string) => {
    const value = normalizeSpecLabel(raw)
    if (!isUsefulSpec(value) || found.includes(value)) return
    found.push(value)
  }
  const complete = extractProductDimensionSpec(src)
  if (complete) push(complete)
  for (const match of src.matchAll(LABEL_SPEC_RE)) push(match[1] || '')
  for (const match of src.matchAll(DIM_RE)) push(match[1] || '')
  if (!found.length) {
    for (const match of src.matchAll(CM_RE)) push(match[1] || '')
  }
  const collapsed = found.filter(
    (value) => !found.some((other) => other !== value && isTruncatedDimensionOf(value, other)),
  )
  return collapsed.slice(0, 8)
}

export function composeFullImportTitle(raw: string | null | undefined, maxLen = 200): string {
  const text = String(raw || '')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  if (!text) return ''
  return text.length <= maxLen ? text : text.slice(0, maxLen)
}
