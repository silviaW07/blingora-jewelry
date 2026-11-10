'use server'

import prisma from '@/tools/prisma'
import { requireStaff } from '@/backend/staffAccess'
import { withResult, getAuthContext } from '@/backend/action_utils'
import { resolveAiSecrets } from '@/thirdparty/secret-resolver'
import sharp from 'sharp'
import {
  DEFAULT_SALES_META,
  DEFAULT_COLUMN_LABELS,
  canonicalPeriodKey,
  compactPeriodText,
  backendSalesOrderId,
  comparePeriodStats,
  compareSalesOrders,
  computedOrderAmount,
  isBackendSyncedSalesOrderId,
  isPeriodTitleText,
  normalizeHeaderLabels,
  parsePeriodInfo,
  type SalesColumnKey,
  type SalesColumnLabels,
  type SalesLedgerOrder,
  type SalesPeriodStat,
  type SalesShipmentLine,
  type SalesStatsDetail,
  type SalesStatsMeta,
  type SalesStatsSummary,
} from '@/backend/salesStatsShared'

export type {
  SalesColumnKey,
  SalesLedgerOrder,
  SalesPeriodStat,
  SalesShipmentLine,
  SalesStatsDetail,
  SalesStatsMeta,
  SalesStatsSummary,
} from '@/backend/salesStatsShared'
export { DEFAULT_SALES_META } from '@/backend/salesStatsShared'

const LEDGER_TITLE = 'SALES_LEDGER_V1'

function money(value: unknown): number | null {
  if (value == null || value === '') return null
  const textValue = String(value).replace(/[$,￥¥USD\s,]/gi, '').trim()
  if (!textValue) return null
  const amount = Number(textValue)
  return Number.isFinite(amount) ? Math.round(amount * 100) / 100 : null
}

/** 定金允许文字（如「定金2000」），纯数字则存 number */
function depositValue(value: unknown): number | string | null {
  if (value == null) return null
  const raw = String(value).trim().slice(0, 80)
  if (!raw) return null
  if (/^-?\d+(\.\d+)?$/.test(raw)) {
    const amount = Number(raw)
    return Number.isFinite(amount) ? Math.round(amount * 100) / 100 : raw
  }
  return raw
}

function depositAsNumber(value: number | string | null | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  return money(value) || 0
}

function text(value: unknown, max = 500): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
}

function splitNamePhone(raw: string): { customerName: string; phone: string } {
  const value = text(raw, 200)
  if (!value) return { customerName: '', phone: '' }
  const at = value.split('@')
  if (at.length >= 2) {
    return { customerName: text(at[0], 100), phone: text(at.slice(1).join('@'), 40) }
  }
  const phoneMatch = value.match(/(\+?\d[\d\s\-()]{5,}\d)/)
  if (phoneMatch) {
    const phone = text(phoneMatch[1], 40)
    const customerName = text(value.replace(phoneMatch[1], ''), 100)
    return { customerName, phone }
  }
  return { customerName: value.slice(0, 100), phone: '' }
}

function emptyPeriodStat(label: string, sortKey: number): SalesPeriodStat {
  return {
    label,
    sortKey,
    orderCount: 0,
    shipmentCount: 0,
    orderAmountTotal: 0,
    goodsAmountTotal: 0,
    usdShippingTotal: 0,
    freightCostTotal: 0,
  }
}

function summarize(orders: SalesLedgerOrder[]): SalesStatsSummary {
  let shipmentCount = 0
  let orderAmountTotal = 0
  let goodsAmountTotal = 0
  let usdShippingTotal = 0
  let depositTotal = 0
  let freightCostTotal = 0
  const periodMap = new Map<string, SalesPeriodStat>()

  for (const order of orders) {
    shipmentCount += Math.max(1, order.lines.length)
    if (order.orderAmount != null) orderAmountTotal += order.orderAmount
    if (order.goodsAmount != null) goodsAmountTotal += order.goodsAmount
    if (order.usdShipping != null) usdShippingTotal += order.usdShipping
    if (order.deposit != null) depositTotal += depositAsNumber(order.deposit)
    let orderFreight = 0
    for (const line of order.lines) {
      const cost = money(line.freightCost)
      if (cost != null) {
        freightCostTotal += cost
        orderFreight += cost
      }
    }

    const label = order.periodLabel || '未标注表标题'
    const sortKey = Number(order.periodSortKey || 0)
    const key = canonicalPeriodKey(label, sortKey)
    const bucket = periodMap.get(key) || emptyPeriodStat(label, sortKey)
    bucket.orderCount += 1
    bucket.shipmentCount += Math.max(1, order.lines.length)
    bucket.orderAmountTotal += order.orderAmount || 0
    bucket.goodsAmountTotal += order.goodsAmount || 0
    bucket.usdShippingTotal += order.usdShipping || 0
    bucket.freightCostTotal += orderFreight
    periodMap.set(key, bucket)
  }

  const periods = Array.from(periodMap.values())
    .map((item) => ({
      ...item,
      orderAmountTotal: Math.round(item.orderAmountTotal * 100) / 100,
      goodsAmountTotal: Math.round(item.goodsAmountTotal * 100) / 100,
      usdShippingTotal: Math.round(item.usdShippingTotal * 100) / 100,
      freightCostTotal: Math.round(item.freightCostTotal * 100) / 100,
    }))
    .sort(comparePeriodStats)

  return {
    orderCount: orders.length,
    shipmentCount,
    orderAmountTotal: Math.round(orderAmountTotal * 100) / 100,
    goodsAmountTotal: Math.round(goodsAmountTotal * 100) / 100,
    usdShippingTotal: Math.round(usdShippingTotal * 100) / 100,
    depositTotal: Math.round(depositTotal * 100) / 100,
    freightCostTotal: Math.round(freightCostTotal * 100) / 100,
    periods,
  }
}

function resolveOrderPeriod(
  order: Pick<SalesLedgerOrder, 'periodLabel' | 'periodSortKey'>,
  fallbackYear = new Date().getFullYear(),
): { periodLabel: string; periodSortKey: number } {
  // 只认表标题（如 2026年7月 / 2026年8-9月），绝不看订单日期列
  const rawLabel = text(order.periodLabel, 40)
  const fromLabel = parsePeriodInfo(rawLabel, fallbackYear)
  if (fromLabel) {
    return {
      periodLabel: rawLabel || fromLabel.label,
      periodSortKey: fromLabel.sortKey,
    }
  }
  if (rawLabel) {
    return {
      periodLabel: rawLabel,
      periodSortKey: Number(order.periodSortKey) || fallbackYear * 100 + 99,
    }
  }
  return {
    periodLabel: '未标注表标题',
    periodSortKey: Number(order.periodSortKey) || fallbackYear * 100 + 99,
  }
}

function alignIncomingPeriods(existing: SalesLedgerOrder[], incoming: SalesLedgerOrder[]): SalesLedgerOrder[] {
  const map = new Map<string, { label: string; sortKey: number; headerLabels: SalesColumnLabels }>()
  for (const order of existing) {
    const key = canonicalPeriodKey(order.periodLabel, order.periodSortKey)
    if (!map.has(key)) {
      map.set(key, {
        label: order.periodLabel,
        sortKey: Number(order.periodSortKey) || 0,
        headerLabels: normalizeHeaderLabels(order.headerLabels, order.periodLabel),
      })
    }
  }
  return incoming.map((order) => {
    const key = canonicalPeriodKey(order.periodLabel, order.periodSortKey)
    const hit = map.get(key)
    // 同月才并入已有分组；不同月（7月 vs 8-9月）绝不改对方标题
    if (!hit) {
      return {
        ...order,
        headerLabels: normalizeHeaderLabels(order.headerLabels, order.periodLabel),
      }
    }
    return {
      ...order,
      periodLabel: hit.label,
      periodSortKey: hit.sortKey,
      headerLabels: hit.headerLabels,
    }
  })
}

function normalizeMeta(raw: unknown): SalesStatsMeta {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {}
  const columnsRaw =
    source.columns && typeof source.columns === 'object' && !Array.isArray(source.columns)
      ? (source.columns as Record<string, unknown>)
      : {}
  const columns = normalizeHeaderLabels(columnsRaw)
  // 全局列名里的「日期」若被改成某个月份，一律复位，月份只跟每张表走
  columns.date = DEFAULT_COLUMN_LABELS.date
  return {
    pageTitle: text(source.pageTitle, 80) || DEFAULT_SALES_META.pageTitle,
    pageHint: text(source.pageHint, 300) || DEFAULT_SALES_META.pageHint,
    columns,
  }
}

function buildSheetHeaderLabels(headers: string[], idx: ReturnType<typeof resolveColumnIndexes>, periodLabel: string): SalesColumnLabels {
  const pick = (index: number, fallback: string) => {
    const value = String(headers[index] ?? '').replace(/\s+/g, ' ').trim()
    if (!value) return fallback
    // 第一列若是月份标题，表头展示用 periodLabel；其余列保留原表头文字
    if (parsePeriodInfo(value)) return fallback
    return value.slice(0, 40)
  }
  return normalizeHeaderLabels(
    {
      date: periodLabel,
      namePhone: pick(idx.namePhone, DEFAULT_COLUMN_LABELS.namePhone),
      address: pick(idx.address, DEFAULT_COLUMN_LABELS.address),
      orderAmount: pick(idx.orderAmount, DEFAULT_COLUMN_LABELS.orderAmount),
      goodsAmount: pick(idx.goodsAmount, DEFAULT_COLUMN_LABELS.goodsAmount),
      usdShipping: pick(idx.usdShipping, DEFAULT_COLUMN_LABELS.usdShipping),
      deposit: pick(idx.deposit, DEFAULT_COLUMN_LABELS.deposit),
      costFreight: DEFAULT_COLUMN_LABELS.costFreight,
      freightCost: pick(idx.freightCost, DEFAULT_COLUMN_LABELS.freightCost),
      chargeWeight: pick(idx.chargeWeight, DEFAULT_COLUMN_LABELS.chargeWeight),
      remark: pick(idx.remark, DEFAULT_COLUMN_LABELS.remark),
    },
    periodLabel,
  )
}

function normalizeOrders(raw: unknown): SalesLedgerOrder[] {
  if (!Array.isArray(raw)) return []
  const fallbackYear = new Date().getFullYear()
  const orders = raw.flatMap((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return []
    const row = item as Record<string, unknown>
    const linesRaw = Array.isArray(row.lines) ? row.lines : []
    const lines = linesRaw.flatMap((line) => {
      if (!line || typeof line !== 'object' || Array.isArray(line)) return []
      const itemLine = line as Record<string, unknown>
      // 表头误写入的「发货日期」不当作真实日期
      const shipDateRaw = text(itemLine.shipDate, 20)
      const shipDate = shipDateRaw === '发货日期' || shipDateRaw === '订单日期' ? '' : shipDateRaw
      const freightCost = text(itemLine.freightCost, 40)
      const chargeWeight = text(itemLine.chargeWeight, 40)
      const remark = text(itemLine.remark, 200)
      if (!shipDate && !freightCost && !chargeWeight && !remark) return []
      return [{ shipDate, freightCost, chargeWeight, remark }]
    })
    const goodsAmount = money(row.goodsAmount)
    const usdShipping = money(row.usdShipping)
    const period = resolveOrderPeriod(
      {
        periodLabel: text(row.periodLabel, 40),
        periodSortKey: Number(row.periodSortKey) || 0,
      },
      fallbackYear,
    )
    const rawDateText = text(row.dateText, 40)
    const order: SalesLedgerOrder = {
      id: text(row.id, 80) || `sales-${index + 1}`,
      dateText: rawDateText === '发货日期' || rawDateText === '订单日期' ? '' : rawDateText,
      customerName: text(row.customerName, 100),
      phone: text(row.phone, 40),
      address: text(row.address, 500),
      goodsAmount,
      usdShipping,
      deposit: depositValue(row.deposit),
      // 订单金额始终 = 商品金额 + USD运费
      orderAmount: computedOrderAmount(goodsAmount, usdShipping),
      periodLabel: period.periodLabel,
      periodSortKey: period.periodSortKey,
      headerLabels: normalizeHeaderLabels(row.headerLabels, period.periodLabel),
      lines: lines.length ? lines : [{ shipDate: '', freightCost: '', chargeWeight: '', remark: '' }],
    }
    const keepBlankPlaceholder = String(order.id || '').startsWith('sales-blank-')
    if (
      !keepBlankPlaceholder &&
      !order.dateText &&
      !order.customerName &&
      !order.phone &&
      !order.address &&
      order.goodsAmount == null &&
      order.usdShipping == null &&
      order.deposit == null &&
      !order.lines.some((line) => line.shipDate || line.freightCost || line.chargeWeight || line.remark)
    ) {
      return []
    }
    return [order]
  })
  return orders.sort(compareSalesOrders)
}

async function readLedger(): Promise<{ orders: SalesLedgerOrder[]; meta: SalesStatsMeta; updatedAt: string }> {
  const setting = await prisma.sitesetting.findFirst({
    where: { settingType: 'STATIC_COPY', title: LEDGER_TITLE },
    orderBy: { updatedAt: 'desc' },
  })
  const content = setting?.contentJson
  let orders: SalesLedgerOrder[] = []
  let meta = DEFAULT_SALES_META
  if (content && typeof content === 'object' && !Array.isArray(content)) {
    const payload = content as { orders?: unknown; meta?: unknown }
    orders = normalizeOrders(payload.orders)
    meta = normalizeMeta(payload.meta)
  } else if (Array.isArray(content)) {
    orders = normalizeOrders(content)
  }
  return {
    orders,
    meta,
    updatedAt: setting?.updatedAt?.toISOString?.() || new Date().toISOString(),
  }
}

async function writeLedger(orders: SalesLedgerOrder[], meta?: SalesStatsMeta) {
  const current = await readLedger()
  const payload = {
    orders: normalizeOrders(orders),
    meta: normalizeMeta(meta || current.meta),
  }
  const existing = await prisma.sitesetting.findFirst({
    where: { settingType: 'STATIC_COPY', title: LEDGER_TITLE },
    orderBy: { updatedAt: 'desc' },
  })
  if (existing) {
    await prisma.sitesetting.update({
      where: { id: existing.id },
      data: { contentJson: payload, isActive: true },
    })
  } else {
    await prisma.sitesetting.create({
      data: {
        settingType: 'STATIC_COPY',
        title: LEDGER_TITLE,
        subtitle: 'sales ledger',
        contentJson: payload,
        isActive: true,
        sortWeight: 0,
      },
    })
  }
}

function detailFrom(orders: SalesLedgerOrder[], meta: SalesStatsMeta, updatedAt: string): SalesStatsDetail {
  return {
    updatedAt,
    orders,
    meta,
    summary: summarize(orders),
  }
}

function normHeader(value: unknown): string {
  return String(value ?? '')
    .replace(/[（(][^）)]*[）)]/g, '')
    .replace(/[\s_\-：:·•/\\]+/g, '')
    .toLowerCase()
}

function headerIndex(headers: string[], aliases: string[]): number {
  const normalized = headers.map((item) => normHeader(item))
  for (const alias of aliases) {
    const key = normHeader(alias)
    if (!key) continue
    const exact = normalized.findIndex((item) => item === key)
    if (exact >= 0) return exact
  }
  for (const alias of aliases) {
    const key = normHeader(alias)
    if (!key || key.length < 2) continue
    const soft = normalized.findIndex((item) => item.length >= 2 && item.includes(key))
    if (soft >= 0) return soft
  }
  return -1
}

function resolveColumnIndexes(headers: string[]) {
  const idx = {
    date: headerIndex(headers, ['日期', 'date']),
    namePhone: headerIndex(headers, ['姓名@电话', '姓名电话', '姓名', '客户姓名', '客户', '收件人', 'name']),
    address: headerIndex(headers, ['地址', '收货地址', '详细地址', 'address']),
    orderAmount: headerIndex(headers, ['订单金额', '订单总额', '总金额', 'orderamount', '总额']),
    goodsAmount: headerIndex(headers, ['商品金额', '货款', '货值', '产品金额', '商品总额', 'goodsamount', 'goods']),
    usdShipping: headerIndex(headers, ['usd运费', '运费usd', '美金运费', '客户运费', 'usdshipping', 'shippingusd']),
    deposit: headerIndex(headers, ['定金', 'deposit', 'downpayment', '预付款']),
    freightCost: headerIndex(headers, ['运费成本', '快递成本', '物流成本', '实际运费', 'freightcost']),
    chargeWeight: headerIndex(headers, ['计费重量', '计费重', '收费重量', '重量', 'weight']),
    remark: headerIndex(headers, ['订单备注', '物流号', '快递单号', '跟踪号', '运单号', 'tracking', '备注']),
  }

  // 业务表固定布局兜底：A日期 B姓名 C地址 D订单金额 E商品金额 F USD运费 … J运费 K计费重量 L订单备注
  if (idx.date < 0 && headers.length >= 1) idx.date = 0
  if (idx.namePhone < 0 && headers.length >= 2) idx.namePhone = 1
  if (idx.address < 0 && headers.length >= 3) idx.address = 2
  if (idx.orderAmount < 0 && headers.length >= 4) idx.orderAmount = 3
  if (idx.goodsAmount < 0) {
    if (idx.orderAmount >= 0) idx.goodsAmount = idx.orderAmount + 1
    else if (headers.length >= 5) idx.goodsAmount = 4
  }
  if (idx.usdShipping < 0) {
    if (idx.goodsAmount >= 0) idx.usdShipping = idx.goodsAmount + 1
    else if (idx.orderAmount >= 0) idx.usdShipping = idx.orderAmount + 2
    else if (headers.length >= 6) idx.usdShipping = 5
  }
  if (idx.chargeWeight < 0 && headers.length >= 11) idx.chargeWeight = 10
  if (idx.remark < 0 && headers.length >= 12) idx.remark = 11
  if (idx.freightCost < 0) {
    // 精确匹配「运费」，避开 USD运费列
    const exactFreight = headers.findIndex((item, index) => {
      const key = normHeader(item)
      return key === '运费' && index !== idx.usdShipping
    })
    if (exactFreight >= 0) idx.freightCost = exactFreight
    else if (idx.chargeWeight >= 1) idx.freightCost = idx.chargeWeight - 1
    else if (headers.length >= 10) idx.freightCost = 9
  }
  return idx
}

function deriveAmounts(orderAmount: number | null, goodsAmount: number | null, usdShipping: number | null) {
  let goods = goodsAmount
  let shipping = usdShipping
  if (goods == null && orderAmount != null && shipping != null) {
    goods = Math.round((orderAmount - shipping) * 100) / 100
  }
  if (shipping == null && orderAmount != null && goods != null) {
    shipping = Math.round((orderAmount - goods) * 100) / 100
  }
  // 只要读到订单金额、商品/运费却落在错误列时，用订单金额回填商品金额，避免只显示运费
  if (goods == null && shipping == null && orderAmount != null) {
    goods = orderAmount
  }
  return {
    goodsAmount: goods,
    usdShipping: shipping,
    orderAmount: computedOrderAmount(goods, shipping),
  }
}

function cell(row: unknown[], index: number): string {
  if (index < 0 || index >= row.length) return ''
  return text(row[index], 500)
}

function rawCell(row: unknown[], index: number): string {
  if (index < 0 || index >= row.length) return ''
  return String(row[index] ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim()
}

function splitParts(value: string): string[] {
  const parts = String(value || '')
    .split(/[\n\r;|]+/)
    .map((item) => item.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
  return parts.length ? parts : ['']
}

function buildShipmentLines(freightRaw: string, weightRaw: string, remarkRaw: string): SalesShipmentLine[] {
  const freights = splitParts(freightRaw)
  const weights = splitParts(weightRaw)
  const remarks = splitParts(remarkRaw)
  const count = Math.max(freights.length, weights.length, remarks.length, 1)
  const lines: SalesShipmentLine[] = []
  for (let i = 0; i < count; i += 1) {
    lines.push({
      freightCost: text(freights[i] || '', 40),
      chargeWeight: text(weights[i] || '', 40),
      remark: text(remarks[i] || '', 200),
    })
  }
  return lines
}

function firstNonEmptyCell(row: unknown[]): string {
  for (const item of row) {
    const value = String(item ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim()
    if (value) return value
  }
  return ''
}

function extractSheetPeriodTitle(
  aoa: unknown[][],
  headerRow: number,
  headers: string[],
  fallbackYear: number,
): { label: string; sortKey: number; raw: string } | null {
  // 优先：表头行第一格（图二 A1 = 2026. 7月）——整张表严格跟这一格
  if (headers[0]) {
    const parsed = parsePeriodInfo(headers[0], fallbackYear)
    if (parsed) return { label: parsed.label, sortKey: parsed.sortKey, raw: String(headers[0]) }
  }
  // 其次：表头之前的标题行
  for (let i = 0; i < headerRow; i += 1) {
    const row = Array.isArray(aoa[i]) ? aoa[i] : []
    const title = firstNonEmptyCell(row)
    const parsed = parsePeriodInfo(title, fallbackYear)
    if (parsed) return { label: parsed.label, sortKey: parsed.sortKey, raw: title }
  }
  // 再扫表头行其它格（极少见）
  for (const header of headers.slice(1, 3)) {
    const parsed = parsePeriodInfo(header, fallbackYear)
    if (parsed) return { label: parsed.label, sortKey: parsed.sortKey, raw: String(header) }
  }
  return null
}

function isSectionTitleRow(row: unknown[], idx: ReturnType<typeof resolveColumnIndexes>): string | null {
  const dateText = cell(row, idx.date)
  const namePhone = cell(row, idx.namePhone)
  const address = cell(row, idx.address)
  const hasAmounts =
    money(cell(row, idx.orderAmount)) != null ||
    money(cell(row, idx.goodsAmount)) != null ||
    money(cell(row, idx.usdShipping)) != null ||
    money(cell(row, idx.deposit)) != null
  const hasLines = Boolean(
    rawCell(row, idx.freightCost) || rawCell(row, idx.chargeWeight) || rawCell(row, idx.remark),
  )
  if (hasAmounts || hasLines || address) return null

  const candidates = [dateText, namePhone, firstNonEmptyCell(row)].filter(Boolean)
  for (const candidate of candidates) {
    if (!isPeriodTitleText(candidate)) continue
    // 标题行通常没有完整客户电话，或整行几乎只有这一个文本
    const filled = row.filter((item) => String(item || '').trim()).length
    if (namePhone && /@|\d{6,}/.test(namePhone) && !isPeriodTitleText(namePhone)) continue
    if (filled <= 3 || isPeriodTitleText(dateText) || isPeriodTitleText(firstNonEmptyCell(row))) {
      return candidate
    }
  }
  return null
}

function parseAoa(aoa: unknown[][], sheetTitleHint = ''): SalesLedgerOrder[] {
  if (!aoa.length) return []
  let headerRow = 0
  for (let i = 0; i < Math.min(8, aoa.length); i += 1) {
    const joined = (aoa[i] || []).map((item) => String(item || '')).join(' ')
    // 姓名/电话/地址才是真正表头；日期格可能是「2026. 7 月」
    if (/姓名|电话|地址|订单金额|商品金额|运费成本|usd运费|日期/i.test(joined)) {
      headerRow = i
      break
    }
  }
  const headers = (aoa[headerRow] || []).map((item) => String(item || ''))
  const idx = resolveColumnIndexes(headers)
  const fallbackYear = new Date().getFullYear()

  const orders: SalesLedgerOrder[] = []
  let current: SalesLedgerOrder | null = null
  let activePeriodLabel = ''
  let activePeriodSortKey = fallbackYear * 100 + 99

  const sheetPeriod = extractSheetPeriodTitle(aoa, headerRow, headers, fallbackYear)
  if (sheetPeriod) {
    // 严格按表格第一格日期：图二写 2026.7月 就是 7 月
    activePeriodLabel = sheetPeriod.label
    activePeriodSortKey = sheetPeriod.sortKey
  } else if (sheetTitleHint) {
    const parsed = parsePeriodInfo(sheetTitleHint, fallbackYear)
    if (parsed) {
      activePeriodLabel = parsed.label
      activePeriodSortKey = parsed.sortKey
    }
  }
  if (!activePeriodLabel) {
    const hint = String(sheetTitleHint || '').replace(/\s+/g, ' ').trim().slice(0, 40)
    activePeriodLabel = hint || `导入表`
    activePeriodSortKey = fallbackYear * 100 + 99
  }
  let activeHeaderLabels = buildSheetHeaderLabels(headers, idx, activePeriodLabel)

  for (let r = headerRow + 1; r < aoa.length; r += 1) {
    const row = Array.isArray(aoa[r]) ? aoa[r] : []
    if (!row.some((item) => String(item || '').trim())) continue

    const sectionTitle = isSectionTitleRow(row, idx)
    if (sectionTitle) {
      const parsed = parsePeriodInfo(sectionTitle, fallbackYear)
      activePeriodLabel = parsed?.label || sectionTitle
      activePeriodSortKey = parsed?.sortKey || activePeriodSortKey
      activeHeaderLabels = buildSheetHeaderLabels(headers, idx, activePeriodLabel)
      current = null
      continue
    }

    const dateText = cell(row, idx.date)
    const namePhone = cell(row, idx.namePhone)
    const address = cell(row, idx.address)
    const rawOrderAmount = money(cell(row, idx.orderAmount))
    const rawGoodsAmount = money(cell(row, idx.goodsAmount))
    const rawUsdShipping = money(cell(row, idx.usdShipping))
    const amounts = deriveAmounts(rawOrderAmount, rawGoodsAmount, rawUsdShipping)
    const deposit = money(cell(row, idx.deposit))
    const lines = buildShipmentLines(
      rawCell(row, idx.freightCost),
      rawCell(row, idx.chargeWeight),
      rawCell(row, idx.remark),
    )
    const startsNew = Boolean(
      namePhone ||
        address ||
        amounts.goodsAmount != null ||
        amounts.usdShipping != null ||
        deposit != null ||
        rawOrderAmount != null ||
        (dateText && !current),
    )
    if (startsNew || !current) {
      const { customerName, phone } = splitNamePhone(namePhone)
      current = {
        id: `sales-${Date.now()}-${orders.length + 1}`,
        dateText,
        customerName,
        phone,
        address,
        goodsAmount: amounts.goodsAmount,
        usdShipping: amounts.usdShipping,
        deposit,
        orderAmount: amounts.orderAmount,
        periodLabel: activePeriodLabel,
        periodSortKey: activePeriodSortKey,
        headerLabels: activeHeaderLabels,
        lines,
      }
      orders.push(current)
    } else {
      if (dateText && !current.dateText) current.dateText = dateText
      current.lines.push(...lines)
    }
  }
  return normalizeOrders(orders)
}

function fillMergedCells(sheet: Record<string, any> | null | undefined, XLSX: { utils: { encode_cell: Function } }) {
  if (!sheet || typeof sheet !== 'object') return
  const merges = Array.isArray(sheet['!merges']) ? sheet['!merges'] : []
  for (const merge of merges) {
    if (!merge?.s || !merge?.e) continue
    const startRef = XLSX.utils.encode_cell(merge.s)
    const source = sheet[startRef]
    if (!source || (source.v == null && source.w == null)) continue
    for (let r = merge.s.r; r <= merge.e.r; r += 1) {
      for (let c = merge.s.c; c <= merge.e.c; c += 1) {
        if (r === merge.s.r && c === merge.s.c) continue
        const ref = XLSX.utils.encode_cell({ r, c })
        const existing = sheet[ref]
        if (existing && existing.v != null && String(existing.v).trim() !== '') continue
        sheet[ref] = { ...source }
      }
    }
  }
}

function sheetHasCells(sheet: Record<string, any> | null | undefined) {
  if (!sheet || typeof sheet !== 'object') return false
  if (typeof sheet['!ref'] === 'string' && sheet['!ref'].trim()) return true
  return Object.keys(sheet).some((key) => key && !key.startsWith('!'))
}

function cellToPlainText(value: unknown): string {
  if (value == null || value === '') return ''
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (value instanceof Date) {
    const y = value.getFullYear()
    const m = String(value.getMonth() + 1).padStart(2, '0')
    const d = String(value.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  if (typeof value === 'object') {
    const row = value as Record<string, unknown>
    if (row.result != null) return cellToPlainText(row.result)
    if (row.text != null) return String(row.text)
    if (Array.isArray(row.richText)) {
      return row.richText.map((part) => String((part as { text?: string })?.text || '')).join('')
    }
    if (row.hyperlink != null && row.text != null) return String(row.text)
    if (row.formula != null && row.result != null) return cellToPlainText(row.result)
  }
  return String(value)
}

function fillAoaMerges(aoa: string[][], mergeRefs: string[]) {
  for (const ref of mergeRefs) {
    const matched = String(ref || '').trim().match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i)
    if (!matched) continue
    const colToIndex = (label: string) => {
      let n = 0
      const up = label.toUpperCase()
      for (let i = 0; i < up.length; i += 1) n = n * 26 + (up.charCodeAt(i) - 64)
      return n - 1
    }
    const c1 = colToIndex(matched[1])
    const r1 = Number(matched[2]) - 1
    const c2 = colToIndex(matched[3])
    const r2 = Number(matched[4]) - 1
    if (![c1, r1, c2, r2].every((n) => Number.isFinite(n) && n >= 0)) continue
    const master = String(aoa[r1]?.[c1] || '')
    if (!master.trim()) continue
    for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r += 1) {
      if (!aoa[r]) aoa[r] = []
      for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c += 1) {
        if (!String(aoa[r][c] || '').trim()) aoa[r][c] = master
      }
    }
  }
}

function loadExcelJS(): any | null {
  try {
    const loaded = require('exceljs') as { default?: unknown } | undefined
    return (loaded as any)?.default || loaded
  } catch {
    return null
  }
}

async function parseWithExcelJS(raw: Buffer, fileName: string): Promise<SalesLedgerOrder[]> {
  const ExcelJS = loadExcelJS()
  if (!ExcelJS?.Workbook) throw new Error('ExcelJS unavailable')
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(raw)
  const sheets = Array.isArray(workbook.worksheets) ? workbook.worksheets : []
  if (!sheets.length) throw new Error('exceljs-empty')
  const allOrders: SalesLedgerOrder[] = []
  for (const sheet of sheets) {
    if (!sheet || sheet.state === 'hidden' || sheet.state === 'veryHidden') continue
    const rowCount = Math.max(0, Number(sheet.rowCount) || 0)
    const colCount = Math.max(0, Number(sheet.columnCount) || 0)
    if (!rowCount || !colCount) continue
    const aoa: string[][] = []
    for (let r = 1; r <= rowCount; r += 1) {
      const row = sheet.getRow(r)
      const line: string[] = []
      for (let c = 1; c <= colCount; c += 1) {
        const cell = row.getCell(c)
        const text = cellToPlainText(cell?.value)
        line.push(text || cellToPlainText(cell?.text) || '')
      }
      if (line.some((cell) => String(cell || '').trim())) aoa.push(line)
      else aoa.push(line)
    }
    const mergeRefs: string[] = Array.isArray((sheet as any)?.model?.merges)
      ? ((sheet as any).model.merges as string[])
      : []
    fillAoaMerges(aoa, mergeRefs)
    const trimmed = aoa.filter((line) => line.some((cell) => String(cell || '').trim()))
    if (!trimmed.length) continue
    allOrders.push(...parseAoa(trimmed, fileName || String(sheet.name || '')))
  }
  if (!allOrders.length) throw new Error('exceljs-no-orders')
  return allOrders
}

async function parseWithXlsx(raw: Buffer, fileName: string): Promise<SalesLedgerOrder[]> {
  const XLSX = require('xlsx') as {
    read: Function
    utils: { sheet_to_json: Function; encode_cell: Function }
  }
  const workbook = XLSX.read(raw, {
    type: 'buffer',
    cellDates: true,
    cellNF: false,
    cellText: false,
    dense: false,
  })
  const sheetNames: string[] = Array.isArray(workbook?.SheetNames) ? workbook.SheetNames : []
  const sheets = workbook?.Sheets && typeof workbook.Sheets === 'object' ? workbook.Sheets : {}
  const usableNames = sheetNames.filter((name) => sheetHasCells(sheets[name]))
  const targetNames = usableNames.length ? usableNames : sheetNames.filter((name) => sheets[name])
  if (!targetNames.length) throw new Error('xlsx-empty-sheets')
  const allOrders: SalesLedgerOrder[] = []
  for (const name of targetNames) {
    const sheet = sheets[name]
    if (!sheet) continue
    fillMergedCells(sheet, XLSX)
    const aoa = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: '',
      raw: false,
      blankrows: false,
    }) as unknown[][]
    if (!Array.isArray(aoa) || !aoa.length) continue
    allOrders.push(...parseAoa(aoa, fileName || name))
  }
  if (!allOrders.length) throw new Error('xlsx-no-orders')
  return allOrders
}

async function parseSpreadsheet(fileBase64: string, fileName = ''): Promise<SalesLedgerOrder[]> {
  const raw = Buffer.from(String(fileBase64 || '').replace(/^data:[^;]+;base64,/, ''), 'base64')
  if (!raw.length) throw new Error('表格内容为空')
  const lower = String(fileName || '').toLowerCase()
  const magic = raw.subarray(0, 4).toString('hex')
  const looksZip = magic === '504b0304' || magic === '504b0506' || magic === '504b0708'
  const looksOle = magic === 'd0cf11e0'
  const asTextHead = raw.subarray(0, Math.min(raw.length, 200)).toString('utf8')

  if (lower.endsWith('.csv') || lower.endsWith('.txt')) {
    const textBody = raw.toString('utf8')
    return parseAoa(textBody.split(/\r?\n/).map((line) => line.split(',')), fileName)
  }
  if (/<\/?(?:table|html|body)\b/i.test(asTextHead)) {
    throw new Error('当前文件像是网页另存，请用 Excel/WPS 另存为 .xlsx 后再导入')
  }

  const errors: string[] = []
  // 与入库导入一致：xlsx 优先走 ExcelJS，兼容 WPS/合并单元格
  if (looksZip || lower.endsWith('.xlsx') || lower.endsWith('.xlsm') || !looksOle) {
    try {
      return await parseWithExcelJS(raw, fileName)
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error))
    }
  }
  try {
    return await parseWithXlsx(raw, fileName)
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error))
  }

  if (looksOle || lower.endsWith('.xls')) {
    try {
      return await parseWithXlsx(raw, fileName)
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error))
    }
  }

  const detail = errors.filter(Boolean).slice(0, 3).join(' / ')
  throw new Error(
    `无法读取「${fileName || '表格'}」（${Math.round(raw.length / 1024)}KB, ${magic || '00000000'}）${detail ? `：${detail}` : ''}。请用 Excel/WPS 另存为 .xlsx 后再试`,
  )
}

async function recognizeSalesImage(fileBase64: string): Promise<SalesLedgerOrder[]> {
  let secrets: any = null
  try {
    secrets = resolveAiSecrets()
  } catch {
    secrets = null
  }
  const apiKey = String(secrets?.apiKey || process.env.OPENAI_API_KEY || '').trim()
  if (!apiKey) throw new Error('未配置图片识别密钥，请先导入表格，或配置 AI 密钥后再识别图片')
  const baseUrl = String(secrets?.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '')
  const model = String(secrets?.defaultModel || 'gpt-4o-mini').trim() || 'gpt-4o-mini'
  const raw = Buffer.from(String(fileBase64 || '').replace(/^data:[^;]+;base64,/, ''), 'base64')
  if (!raw.length) throw new Error('图片内容为空')
  const jpeg = await sharp(raw).rotate().resize(1600, 1600, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer()
  const dataUrl = `data:image/jpeg;base64,${jpeg.toString('base64')}`
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      max_tokens: 4000,
      messages: [
        {
          role: 'system',
          content:
            'Extract sales ledger rows from a spreadsheet screenshot. Return JSON only: {"orders":[{"dateText":"","customerName":"","phone":"","address":"","orderAmount":0,"goodsAmount":0,"usdShipping":0,"deposit":0,"periodLabel":"2026年8-9月","lines":[{"freightCost":"","chargeWeight":"","remark":""}]}]} . periodLabel MUST come only from sheet title rows like 2026年7月 / 2026年8-9月, NEVER from order date cells such as 7.1 or notes like 买短袖. All rows under one title share that periodLabel. Critical columns: goodsAmount, usdShipping, freightCost, chargeWeight, remark. orderAmount = goodsAmount + usdShipping. Expand stacked shipment values into separate lines[]. Use null for missing numbers.',
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Parse this sales sheet image into JSON orders.' },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
  })
  if (!response.ok) throw new Error(`图片识别失败 HTTP ${response.status}`)
  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> }
  const content = String(data.choices?.[0]?.message?.content || '')
  const matched = content.match(/\{[\s\S]*\}/)
  if (!matched) throw new Error('图片识别未返回可用数据')
  let parsed: any
  try {
    parsed = JSON.parse(matched[0])
  } catch {
    throw new Error('图片识别结果不是合法 JSON')
  }
  const orders = normalizeOrders(parsed?.orders).map((order, index) => ({
    ...order,
    id: order.id || `sales-img-${Date.now()}-${index + 1}`,
  }))
  if (!orders.length) throw new Error('图片里没有识别到销售行')
  return orders
}

const SYNC_PAID_STATUSES = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] as const

/** 同步起点：当年 10 月 1 日（上海时区日历）及以后 */
function salesSyncStartDate(now = new Date()): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(now)
  const year = Number(parts.find((part) => part.type === 'year')?.value || now.getUTCFullYear())
  // Asia/Shanghai = UTC+8，用 UTC 存 10-01 00:00+08 = 9-30 16:00Z
  return new Date(Date.UTC(year, 9, 1, -8, 0, 0))
}

function shanghaiDateParts(value: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(value)
  const year = Number(parts.find((part) => part.type === 'year')?.value)
  const month = Number(parts.find((part) => part.type === 'month')?.value)
  const day = Number(parts.find((part) => part.type === 'day')?.value)
  return { year, month, day }
}

function formatAddressFromRecord(address: {
  recipientName?: string | null
  phone?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  cityName?: string | null
  stateName?: string | null
  postalCode?: string | null
  countryName?: string | null
} | null | undefined, fallbackText = '') {
  if (fallbackText.trim()) return text(fallbackText, 500)
  if (!address) return ''
  return [
    address.addressLine1,
    address.addressLine2,
    [address.cityName, address.stateName, address.postalCode].filter(Boolean).join(', '),
    address.countryName,
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500)
}

function decimalToMoney(value: { toNumber(): number } | number | null | undefined): number | null {
  if (value == null) return null
  const amount = typeof value === 'object' && typeof value.toNumber === 'function' ? Number(value.toNumber()) : Number(value)
  return Number.isFinite(amount) ? Math.round(amount * 100) / 100 : null
}

const ORDER_LINK_TITLE = 'ORDER_GROUP_LINKS'

async function readSalesOrderLinks(): Promise<Array<{ primaryId: string; children: string[] }>> {
  const setting = await prisma.sitesetting.findFirst({
    where: { settingType: 'STATIC_COPY', title: ORDER_LINK_TITLE },
    orderBy: { updatedAt: 'desc' },
  })
  const raw = setting?.contentJson
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return []
    const primaryId = String((item as { primaryId?: unknown }).primaryId || '').trim()
    const childrenRaw = (item as { children?: unknown }).children
    if (!primaryId || !Array.isArray(childrenRaw)) return []
    const children = childrenRaw.flatMap((child) => {
      if (!child || typeof child !== 'object' || Array.isArray(child)) return []
      const id = String((child as { id?: unknown }).id || '').trim()
      if (!id || id === primaryId) return []
      return [id]
    })
    return children.length ? [{ primaryId, children }] : []
  })
}

type BackendSalesRecord = {
  id: string
  createdAt: Date
  subtotalAmount: { toNumber(): number } | number
  shippingAmount: { toNumber(): number } | number
  totalAmount: { toNumber(): number } | number
  trackingNumber: string | null
  registerInfoJson: unknown
  user: { username: string; phone: string | null }
  address: {
    recipientName: string
    phone: string | null
    addressLine1: string
    addressLine2: string | null
    cityName: string | null
    stateName: string | null
    postalCode: string | null
    countryName: string
  } | null
}

/** 从订单管理同款 registerInfo / 金额字段抽出销售额一行所需内容 */
function extractManagedSalesFields(record: BackendSalesRecord) {
  const info =
    record.registerInfoJson && typeof record.registerInfoJson === 'object' && !Array.isArray(record.registerInfoJson)
      ? (record.registerInfoJson as Record<string, unknown>)
      : {}
  // 订单列表「金额」= 商品金额（双击改的 totalAmount / register.orderAmount）
  // 「运费USD」= register.usdShipping；销售额订单金额 = 商品金额 + 运费USD
  // 不要用原始 subtotal，也不要把列表金额当成含运费总额再倒减
  const usdShipping = money(info.usdShipping) ?? decimalToMoney(record.shippingAmount)
  const goodsAmount =
    money(info.orderAmount) ??
    decimalToMoney(record.totalAmount) ??
    money(info.goodsAmount)
  const orderAmount = computedOrderAmount(goodsAmount, usdShipping)
  const deposit = depositValue(info.depositText ?? info.deposit)
  const customerName = text(info.customerName || record.address?.recipientName || record.user.username, 100)
  const phone = text(info.phone || record.address?.phone || record.user.phone || '', 40)
  const address = formatAddressFromRecord(record.address, String(info.address || ''))
  const freightLines = Array.isArray(info.freightLines) ? info.freightLines : []
  const lines: SalesShipmentLine[] = freightLines.flatMap((line) => {
    if (!line || typeof line !== 'object' || Array.isArray(line)) return []
    const row = line as Record<string, unknown>
    const shipDate = text(row.shipDate, 20)
    const freightCost = text(row.freightCost, 40)
    const chargeWeight = text(row.chargeWeight, 40)
    const remark = text(row.remark, 200)
    if (!shipDate && !freightCost && !chargeWeight && !remark) return []
    return [{ shipDate, freightCost, chargeWeight, remark }]
  })
  if (!lines.length) {
    lines.push({
      shipDate: '',
      freightCost: '',
      chargeWeight: '',
      remark: text(record.trackingNumber || '', 200),
    })
  }
  const { year, month, day } = shanghaiDateParts(new Date(record.createdAt))
  return {
    year,
    month,
    day,
    // 销售额日期列固定用订单日期，不用发货日期
    dateText: `${month}.${day}`,
    customerName,
    phone,
    address,
    orderAmount,
    goodsAmount,
    usdShipping,
    deposit,
    lines,
  }
}

function mapBackendOrderToSales(
  record: BackendSalesRecord,
  options?: {
    orderAmount?: number | null
    goodsAmount?: number | null
    usdShipping?: number | null
    deposit?: number | string | null
    lines?: SalesShipmentLine[]
    mergeCount?: number
  },
): SalesLedgerOrder {
  const fields = extractManagedSalesFields(record)
  const periodLabel = `${fields.year}年${fields.month}月`
  const periodSortKey = fields.year * 100 + fields.month
  const lines = options?.lines?.length ? options.lines.map((line) => ({ ...line })) : fields.lines
  if (options?.mergeCount && options.mergeCount > 1) {
    const first = lines[0]
    if (first && !/合并\d+单/.test(first.remark)) {
      first.remark = text([first.remark, `合并${options.mergeCount}单`].filter(Boolean).join(' · '), 200)
    }
  }
  const goodsAmount = options?.goodsAmount ?? fields.goodsAmount
  const usdShipping = options?.usdShipping ?? fields.usdShipping
  const orderAmount = options?.orderAmount ?? computedOrderAmount(goodsAmount, usdShipping)
  return {
    id: backendSalesOrderId(record.id),
    dateText: fields.dateText,
    customerName: fields.customerName,
    phone: fields.phone,
    address: fields.address,
    orderAmount,
    goodsAmount,
    usdShipping,
    deposit: options?.deposit ?? fields.deposit,
    periodLabel,
    periodSortKey,
    headerLabels: normalizeHeaderLabels({ ...DEFAULT_COLUMN_LABELS, date: periodLabel }, periodLabel),
    lines,
  }
}

const backendOrderSelect = {
  id: true,
  createdAt: true,
  subtotalAmount: true,
  shippingAmount: true,
  totalAmount: true,
  trackingNumber: true,
  registerInfoJson: true,
  user: { select: { username: true, phone: true } },
  address: {
    select: {
      recipientName: true,
      phone: true,
      addressLine1: true,
      addressLine2: true,
      cityName: true,
      stateName: true,
      postalCode: true,
      countryName: true,
    },
  },
} as const

async function loadBackendSyncedSalesOrders(): Promise<SalesLedgerOrder[]> {
  const startAt = salesSyncStartDate()
  const [records, linkGroups] = await Promise.all([
    prisma.orderrecord.findMany({
      where: {
        status: { in: [...SYNC_PAID_STATUSES] },
        createdAt: { gte: startAt },
      },
      orderBy: { createdAt: 'desc' },
      select: backendOrderSelect,
      take: 2000,
    }),
    readSalesOrderLinks(),
  ])
  const byId = new Map(records.map((record) => [record.id, record as BackendSalesRecord]))
  const childIds = new Set(linkGroups.flatMap((group) => group.children))
  const missingMemberIds = Array.from(
    new Set(
      linkGroups
        .flatMap((group) => [group.primaryId, ...group.children])
        .filter((id) => !byId.has(id)),
    ),
  )
  if (missingMemberIds.length) {
    const extras = await prisma.orderrecord.findMany({
      where: { id: { in: missingMemberIds } },
      select: backendOrderSelect,
    })
    for (const row of extras) byId.set(row.id, row as BackendSalesRecord)
  }

  const mapped = records.flatMap((record) => {
    if (childIds.has(record.id)) return []
    const group = linkGroups.find((item) => item.primaryId === record.id)
    if (!group) return [mapBackendOrderToSales(record as BackendSalesRecord)]

    const memberIds = [group.primaryId, ...group.children]
    const members = memberIds
      .map((id) => byId.get(id))
      .filter((item): item is BackendSalesRecord => Boolean(item))
    const snapshots = members.map((item) => extractManagedSalesFields(item))
    const goodsAmount = Math.round(snapshots.reduce((sum, item) => sum + (item.goodsAmount || 0), 0) * 100) / 100
    const usdShipping = Math.round(snapshots.reduce((sum, item) => sum + (item.usdShipping || 0), 0) * 100) / 100
    const orderAmount = computedOrderAmount(goodsAmount, usdShipping)
    const lines = snapshots.flatMap((item) => item.lines).filter((line) => line.shipDate || line.freightCost || line.chargeWeight || line.remark)
    const primary = extractManagedSalesFields(record as BackendSalesRecord)
    return [
      mapBackendOrderToSales(record as BackendSalesRecord, {
        orderAmount,
        goodsAmount,
        usdShipping,
        deposit: primary.deposit,
        lines: lines.length ? lines : primary.lines,
        mergeCount: memberIds.length,
      }),
    ]
  })
  return normalizeOrders(mapped)
}

function mergeLedgerWithBackendOrders(
  currentOrders: SalesLedgerOrder[],
  syncedOrders: SalesLedgerOrder[],
): SalesLedgerOrder[] {
  const manual = currentOrders.filter((order) => !isBackendSyncedSalesOrderId(order.id))
  return normalizeOrders([...manual, ...syncedOrders])
}

async function syncLedgerFromBackendOrders(forceWrite = false): Promise<{
  orders: SalesLedgerOrder[]
  meta: SalesStatsMeta
  updatedAt: string
  syncedCount: number
  changed: boolean
}> {
  const current = await readLedger()
  const synced = await loadBackendSyncedSalesOrders()
  const next = mergeLedgerWithBackendOrders(current.orders, synced)
  const before = JSON.stringify(current.orders)
  const after = JSON.stringify(next)
  const changed = before !== after
  if (changed || forceWrite) {
    await writeLedger(next, current.meta)
    const saved = await readLedger()
    return {
      orders: saved.orders,
      meta: saved.meta,
      updatedAt: saved.updatedAt,
      syncedCount: synced.length,
      changed,
    }
  }
  return {
    orders: current.orders,
    meta: current.meta,
    updatedAt: current.updatedAt,
    syncedCount: synced.length,
    changed: false,
  }
}

export const getSalesStatsDetail = requireStaff('dashboard')(
  withResult(async (): Promise<SalesStatsDetail> => {
    // 打开页面时自动把 10 月及以后已付款订单同步进对应月份表
    const synced = await syncLedgerFromBackendOrders(false)
    return detailFrom(synced.orders, synced.meta, synced.updatedAt)
  }),
)

export const syncSalesStatsFromOrders = requireStaff('dashboard')(
  withResult(async (): Promise<SalesStatsDetail & { syncedCount: number }> => {
    getAuthContext()
    const synced = await syncLedgerFromBackendOrders(true)
    return {
      ...detailFrom(synced.orders, synced.meta, synced.updatedAt),
      syncedCount: synced.syncedCount,
    }
  }),
)

export const importSalesStatsSheet = requireStaff('dashboard')(
  withResult(async (input: { fileBase64: string; fileName?: string; mode?: 'replace' | 'append' }): Promise<SalesStatsDetail> => {
    getAuthContext()
    const imported = await parseSpreadsheet(String(input.fileBase64 || ''), String(input.fileName || ''))
    if (!imported.length) throw new Error('表格里没有读到销售数据')
    // 默认追加拼接：新表不影响上一张；同标题（如 2026年7月）才合并到同一分组
    const mode = input.mode === 'replace' ? 'replace' : 'append'
    const current = await readLedger()
    const aligned = mode === 'append' ? alignIncomingPeriods(current.orders, imported) : imported
    const next = normalizeOrders([...((mode === 'append' ? current.orders : [])), ...aligned]).map((order, index) => ({
      ...order,
      id: order.id || `sales-${Date.now()}-${index + 1}`,
    }))
    await writeLedger(next, current.meta)
    const saved = await readLedger()
    return detailFrom(saved.orders, saved.meta, saved.updatedAt)
  }),
)

export const importSalesStatsImage = requireStaff('dashboard')(
  withResult(async (input: { fileBase64: string; fileName?: string; mode?: 'replace' | 'append' }): Promise<SalesStatsDetail> => {
    getAuthContext()
    const imported = await recognizeSalesImage(String(input.fileBase64 || ''))
    const mode = input.mode === 'replace' ? 'replace' : 'append'
    const current = await readLedger()
    const aligned = mode === 'append' ? alignIncomingPeriods(current.orders, imported) : imported
    const next = normalizeOrders([...((mode === 'append' ? current.orders : [])), ...aligned]).map((order, index) => ({
      ...order,
      id: order.id || `sales-img-${Date.now()}-${index + 1}`,
    }))
    await writeLedger(next, current.meta)
    const saved = await readLedger()
    return detailFrom(saved.orders, saved.meta, saved.updatedAt)
  }),
)

export const saveSalesStatsLedger = requireStaff('dashboard')(
  withResult(async (input: { orders: SalesLedgerOrder[]; meta?: SalesStatsMeta }): Promise<SalesStatsDetail> => {
    getAuthContext()
    const current = await readLedger()
    const meta = normalizeMeta(input.meta || current.meta)
    const orders = normalizeOrders(input.orders)
    await writeLedger(orders, meta)
    const saved = await readLedger()
    return detailFrom(saved.orders, saved.meta, saved.updatedAt)
  }),
)

export const clearSalesStatsLedger = requireStaff('dashboard')(
  withResult(async (): Promise<SalesStatsDetail> => {
    const current = await readLedger()
    await writeLedger([], current.meta)
    const saved = await readLedger()
    return detailFrom([], saved.meta, saved.updatedAt)
  }),
)
