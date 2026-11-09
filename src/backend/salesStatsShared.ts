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

const PERIOD_TITLE_RE =
  /(?:((?:19|20)\d{2})\s*[.年/\-])?\s*(\d{1,2})\s*(?:月)?\s*[-~～—到至]\s*(\d{1,2})\s*月?|(?:((?:19|20)\d{2})\s*[.年/\-])\s*(\d{1,2})\s*月|(\d{1,2})\s*月/

export function isPeriodTitleText(raw: string): boolean {
  const value = String(raw || '').replace(/\s+/g, '')
  if (!value || value.length > 40) return false
  if (/姓名|地址|订单|商品|运费|电话|备注|重量/.test(value)) return false
  return PERIOD_TITLE_RE.test(value)
}

export function parsePeriodInfo(
  raw: string,
  fallbackYear = new Date().getFullYear(),
): { label: string; sortKey: number } | null {
  const source = String(raw || '').trim()
  if (!source) return null
  const compact = source.replace(/\s+/g, '')

  let match = compact.match(/(?:((?:19|20)\d{2})[.年/\-])?(\d{1,2})(?:月)?[-~～—到至](\d{1,2})月?/)
  if (match) {
    const year = Number(match[1] || fallbackYear)
    const startMonth = Number(match[2])
    const endMonth = Number(match[3])
    if (startMonth >= 1 && startMonth <= 12 && endMonth >= 1 && endMonth <= 12) {
      const label = match[1] ? `${year}.${startMonth}-${endMonth}月` : `${startMonth}-${endMonth}月`
      return { label, sortKey: year * 100 + startMonth }
    }
  }

  match = compact.match(/(?:((?:19|20)\d{2})[.年/\-])(\d{1,2})月?/)
  if (match) {
    const year = Number(match[1])
    const month = Number(match[2])
    if (month >= 1 && month <= 12) {
      return { label: `${year}.${month}月`, sortKey: year * 100 + month }
    }
  }

  match = compact.match(/^(\d{1,2})月$/)
  if (match) {
    const month = Number(match[1])
    if (month >= 1 && month <= 12) {
      return { label: `${month}月`, sortKey: fallbackYear * 100 + month }
    }
  }

  // 日期格常见写法：7.1 / 8/15 / 2026-8-1
  match = compact.match(/^((?:19|20)\d{2})[.\/\-](\d{1,2})(?:[.\/\-]\d{1,2})?$/)
  if (match) {
    const year = Number(match[1])
    const month = Number(match[2])
    if (month >= 1 && month <= 12) {
      return { label: `${year}.${month}月`, sortKey: year * 100 + month }
    }
  }

  match = compact.match(/^(\d{1,2})[.\/\-](\d{1,2})$/)
  if (match) {
    const month = Number(match[1])
    const day = Number(match[2])
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { label: `${month}月`, sortKey: fallbackYear * 100 + month }
    }
  }

  if (isPeriodTitleText(source)) {
    return { label: source.slice(0, 40), sortKey: fallbackYear * 100 }
  }
  return null
}

export function periodSalesLabel(label: string): string {
  const cleaned = String(label || '').trim()
  if (!cleaned) return '未标注月份销售额'
  if (/销售额$/.test(cleaned)) return cleaned
  return `${cleaned}销售额`
}

export function compareSalesOrders(a: SalesLedgerOrder, b: SalesLedgerOrder): number {
  const ak = Number(a.periodSortKey || 0)
  const bk = Number(b.periodSortKey || 0)
  if (ak !== bk) return ak - bk
  return String(a.id).localeCompare(String(b.id))
}
