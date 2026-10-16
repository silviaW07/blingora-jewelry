/**
 * Wholesale album titles often encode cost at the front:
 * `38💰围巾` / `38 # 围巾` / `P38` / `35 GUCCI` / `120 代工厂`
 * `477# p21` → 21（477# 是货号，不是价）
 */
const YEAR_LIKE = /^(?:19|20)\d{2}$/
const LEADING_JUNK = /[\uFFFC\uFEFF\u200B-\u200D\uFE0E\uFE0F]/g

function isPlausibleWholesaleRmb(value: number): boolean {
  if (!Number.isFinite(value) || value < 5 || value > 800) return false
  const whole = Math.round(value)
  if (Math.abs(value - whole) < 0.001 && YEAR_LIKE.test(String(whole))) return false
  return true
}

function takePrice(raw: string | undefined): number | null {
  const n = Number(raw)
  return isPlausibleWholesaleRmb(n) ? Math.round(n * 100) / 100 : null
}

function looksLikeDateOrSpuCode(code: string): boolean {
  return /^20[2-3]\d(?:0[1-9]|1[0-2])/.test(code)
}

/** Yupoo 货号前两位：131000920 → 13。跳过 202609… 日期/SPU 串。 */
function twoDigitCostFromTitle(title: string): number | null {
  const text = String(title || '').trim()
  const prefixed = text.match(/^(\d{2})(?:[\s\-_/．.]+(?=\d{5,}))?(\d{5,})/)
  if (prefixed) {
    const compact = `${prefixed[1]}${prefixed[2]}`
    if (!looksLikeDateOrSpuCode(compact)) {
      const price = takePrice(prefixed[1])
      if (price != null) return price
    }
  }
  const codes = text.match(/\d{5,}/g) || []
  for (const code of codes) {
    if (looksLikeDateOrSpuCode(code)) continue
    const price = takePrice(code.slice(0, 2))
    if (price != null) return price
  }
  return null
}

function stripDecor(text: string): string {
  return String(text || '')
    .replace(LEADING_JUNK, ' ')
    .replace(/^[^0-9A-Za-z\u4e00-\u9fff]+/, '')
    .trim()
}

/** 标题里的 P 价：`p21` / `#p22` / `长款p20, 运动p17`。多档取最低拿货价。 */
export function collectTitlePPrices(text: string): number[] {
  const found: number[] = []
  const re = /(?:^|[^A-Za-z])P\s*[:：]?\s*([0-9]{1,3}(?:\.[0-9]+)?)\b/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(String(text || '')))) {
    const price = takePrice(match[1])
    if (price != null) found.push(price)
  }
  return found
}

function collectPiPrices(text: string): number[] {
  const found: number[] = []
  const re = /(?:出货)?批\s*[:：]?\s*([0-9]{1,3}(?:\.[0-9]+)?)/g
  let match: RegExpExecArray | null
  while ((match = re.exec(String(text || '')))) {
    const price = takePrice(match[1])
    if (price != null) found.push(price)
  }
  return found
}

export function titleHasStrongPriceHint(...texts: Array<string | null | undefined>): boolean {
  const blob = texts.filter(Boolean).join('\n')
  if (!blob) return false
  if (collectTitlePPrices(blob).length > 0) return true
  if (collectPiPrices(blob).length > 0) return true
  if (/💰/.test(blob)) return true
  if (/(?:¥|￥|价格|拿货价|成本|特价|批发价|特批)\s*[:：]?\s*[0-9]/.test(blob)) return true
  return false
}

export function extractAlbumTitlePrice(...texts: Array<string | null | undefined>): number | null {
  for (const raw of texts) {
    const full = String(raw || '').trim()
    if (!full) continue

    const pPrices = collectTitlePPrices(full)
    if (pPrices.length) return Math.min(...pPrices)

    const labeled =
      full.match(/(?:¥|￥|价格|拿货价|成本|特价|批发价|特批)\s*[:：]?\s*([0-9]+(?:\.[0-9]+)?)/i) ||
      full.match(/\b([0-9]+(?:\.[0-9]+)?)\s*元/) ||
      full.match(/💰\s*([0-9]+(?:\.[0-9]+)?)/)
    const labeledPrice = takePrice(labeled?.[1])
    if (labeledPrice != null) return labeledPrice

    const piPrices = collectPiPrices(full)
    if (piPrices.length) return Math.min(...piPrices)

    const text = stripDecor(full)
    // 仅 1–2 位 + #/💰 当价：`38#围巾`。`477#` / `469#` 是货号。
    const hashed = text.match(/^([0-9]{1,2}(?:\.[0-9]+)?)\s*(?:💰|#|＃)/)
    const hashedPrice = takePrice(hashed?.[1])
    if (hashedPrice != null) return hashedPrice

    const fromCode = twoDigitCostFromTitle(full) ?? twoDigitCostFromTitle(text)
    if (fromCode != null) return fromCode

    const leading = text.match(/^([0-9]{1,3}(?:\.[0-9]+)?)\s+(?=[\u4e00-\u9fffA-Za-z💰])/)
    const leadingPrice = takePrice(leading?.[1])
    if (
      leadingPrice != null &&
      !/^\d+\s*[-~～到至*x×]\d+\s*(?:cm|mm|m|码)/i.test(text) &&
      !/^size\s*[:：]/i.test(text)
    ) {
      return leadingPrice
    }
  }
  return null
}

/** 标题里已写明 P/批/💰 时，覆盖 1688 接口把货号当成售价的脏数据。 */
export function pickAlbumCostFromTitleAndFetched(
  fetchedPrice: number | null | undefined,
  ...texts: Array<string | null | undefined>
): number | null {
  const inferred = extractAlbumTitlePrice(...texts)
  const api =
    typeof fetchedPrice === 'number' && Number.isFinite(fetchedPrice) && fetchedPrice > 0
      ? Math.round(fetchedPrice * 100) / 100
      : null
  if (inferred != null && inferred > 0 && titleHasStrongPriceHint(...texts)) return inferred
  if (api != null && inferred != null && Math.abs(api - inferred) < 0.021) return inferred
  return api ?? inferred
}
