export type SalesShipmentLine = {
  freightCost: string
  chargeWeight: string
  remark: string
}

export type SalesLedgerOrder = {
  id: string
  dateText: string
  customerName: string
  phone: string
  address: string
  orderAmount: number | null
  goodsAmount: number | null
  usdShipping: number | null
  deposit: number | null
  periodLabel: string
  periodSortKey: number
  lines: SalesShipmentLine[]
}

export type SalesColumnKey =
  | 'date'
  | 'namePhone'
  | 'address'
  | 'orderAmount'
  | 'goodsAmount'
  | 'usdShipping'
  | 'deposit'
  | 'freightCost'
  | 'chargeWeight'
  | 'remark'

export type SalesColumnLabels = Record<SalesColumnKey, string>

export type SalesStatsMeta = {
  pageTitle: string
  pageHint: string
  columns: SalesColumnLabels
}

export type SalesPeriodStat = {
  label: string
  sortKey: number
  orderCount: number
  shipmentCount: number
  orderAmountTotal: number
  goodsAmountTotal: number
  usdShippingTotal: number
  freightCostTotal: number
}

export type SalesStatsSummary = {
  orderCount: number
  shipmentCount: number
  orderAmountTotal: number
  goodsAmountTotal: number
  usdShippingTotal: number
  depositTotal: number
  freightCostTotal: number
  periods: SalesPeriodStat[]
}

export type SalesStatsDetail = {
  updatedAt: string
  orders: SalesLedgerOrder[]
  summary: SalesStatsSummary
  meta: SalesStatsMeta
}

export const DEFAULT_SALES_META: SalesStatsMeta = {
  pageTitle: '销售额统计',
  pageHint: '格式对齐业务表：日期 / 姓名@电话 / 地址 / 订单金额 / 商品金额 / USD运费 / 定金 / 运费成本 / 计费重量 / 物流号',
  columns: {
    date: '日期',
    namePhone: '姓名@电话',
    address: '地址',
    orderAmount: '订单金额',
    goodsAmount: '商品金额',
    usdShipping: 'USD运费',
    deposit: '定金',
    freightCost: '运费成本',
    chargeWeight: '计费重量',
    remark: '订单备注',
  },
}

export function computedOrderAmount(goodsAmount: number | null, usdShipping: number | null): number | null {
  if (goodsAmount == null && usdShipping == null) return null
  return Math.round(((goodsAmount || 0) + (usdShipping || 0)) * 100) / 100
}

/** 压缩单元格里的换行/空格，兼容「2026. 7 月」「2026.\n7\n月」 */
export function compactPeriodText(raw: unknown): string {
  return String(raw ?? '')
    .replace(/[\u00a0\u3000]/g, ' ')
    .replace(/[\r\n\t]+/g, '')
    .replace(/\s+/g, '')
    .trim()
}

const PERIOD_TITLE_RE =
  /^(?:((?:19|20)\d{2})[.年/\-])?(\d{1,2})(?:月)?[-~～—到至](\d{1,2})月$|^(?:((?:19|20)\d{2})[.年/\-])(\d{1,2})月$|^(\d{1,2})月$/

export function isPeriodTitleText(raw: string): boolean {
  const value = compactPeriodText(raw)
  if (!value || value.length > 40) return false
  if (/姓名|地址|订单|商品|运费|电话|备注|重量|客户|短袖|拖鞋|包包|日期/.test(value)) return false
  // 订单日期如 7.1 / 7/22 不是表标题
  if (/^\d{1,2}[.\/\-]\d{1,2}$/.test(value)) return false
  return PERIOD_TITLE_RE.test(value) || /^(?:19|20)\d{2}[.年/\-]\d{1,2}(?:[-~～—到至]\d{1,2})?月?$/.test(value)
}

export function parsePeriodInfo(
  raw: string,
  fallbackYear = new Date().getFullYear(),
): { label: string; sortKey: number; canonicalKey: string } | null {
  const source = String(raw || '').trim()
  if (!source) return null
  const compact = compactPeriodText(source)
  // 明确排除订单日期，避免 7.1 被当成月份标题
  if (/^\d{1,2}[.\/\-]\d{1,2}$/.test(compact)) return null
  if (/^((?:19|20)\d{2})[.\/\-](\d{1,2})[.\/\-](\d{1,2})$/.test(compact)) return null

  let match = compact.match(/^(?:((?:19|20)\d{2})[.年/\-])?(\d{1,2})(?:月)?[-~～—到至](\d{1,2})月?$/)
  if (match) {
    const year = Number(match[1] || fallbackYear)
    const startMonth = Number(match[2])
    const endMonth = Number(match[3])
    if (startMonth >= 1 && startMonth <= 12 && endMonth >= 1 && endMonth <= 12) {
      const label = `${year}年${startMonth}-${endMonth}月`
      const canonicalKey = `${year}-${String(startMonth).padStart(2, '0')}-${String(endMonth).padStart(2, '0')}`
      return { label, sortKey: year * 100 + startMonth, canonicalKey }
    }
  }

  // 2026.7月 / 2026年7月 / 2026.7
  match = compact.match(/^(?:((?:19|20)\d{2})[.年/\-])(\d{1,2})月?$/)
  if (match) {
    const year = Number(match[1])
    const month = Number(match[2])
    if (month >= 1 && month <= 12) {
      return {
        label: `${year}年${month}月`,
        sortKey: year * 100 + month,
        canonicalKey: `${year}-${String(month).padStart(2, '0')}`,
      }
    }
  }

  match = compact.match(/^(\d{1,2})月$/)
  if (match) {
    const month = Number(match[1])
    if (month >= 1 && month <= 12) {
      return {
        label: `${fallbackYear}年${month}月`,
        sortKey: fallbackYear * 100 + month,
        canonicalKey: `${fallbackYear}-${String(month).padStart(2, '0')}`,
      }
    }
  }

  if (isPeriodTitleText(source)) {
    return {
      label: source.slice(0, 40),
      sortKey: fallbackYear * 100,
      canonicalKey: `custom:${compact.slice(0, 40)}`,
    }
  }
  return null
}

/** 合并判断只看表标题对应的月份区间，不看订单日期 */
export function canonicalPeriodKey(label: string, sortKey = 0, fallbackYear = new Date().getFullYear()): string {
  const parsed = parsePeriodInfo(label, fallbackYear)
  if (parsed?.canonicalKey) return parsed.canonicalKey
  const cleaned = String(label || '').trim()
  if (cleaned) return `custom:${cleaned}`
  return `sort:${Number(sortKey) || 0}`
}

export function periodSalesLabel(label: string): string {
  const cleaned = String(label || '').trim()
  if (!cleaned || cleaned === '未标注表标题') return '销售额'
  if (/销售额$/.test(cleaned)) return cleaned
  return `${cleaned}销售额`
}

export function compareSalesOrders(a: SalesLedgerOrder, b: SalesLedgerOrder): number {
  const ak = Number(a.periodSortKey || 0)
  const bk = Number(b.periodSortKey || 0)
  if (ak !== bk) return ak - bk
  const labelCmp = String(a.periodLabel || '').localeCompare(String(b.periodLabel || ''))
  if (labelCmp !== 0) return labelCmp
  return String(a.id).localeCompare(String(b.id))
}
