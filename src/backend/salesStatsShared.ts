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

export type SalesStatsSummary = {
  orderCount: number
  shipmentCount: number
  orderAmountTotal: number
  goodsAmountTotal: number
  usdShippingTotal: number
  depositTotal: number
  freightCostTotal: number
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
