'use server'

import prisma from '@/tools/prisma'
import { requireStaff } from '@/backend/staffAccess'
import { withResult, getAuthContext } from '@/backend/action_utils'
import { resolveAiSecrets } from '@/thirdparty/secret-resolver'
import sharp from 'sharp'

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
  lines: SalesShipmentLine[]
}

export type SalesStatsSummary = {
  orderCount: number
  shipmentCount: number
  orderAmountTotal: number
  goodsAmountTotal: number
  usdShippingTotal: number
  freightCostTotal: number
}

export type SalesStatsDetail = {
  updatedAt: string
  orders: SalesLedgerOrder[]
  summary: SalesStatsSummary
}

const LEDGER_TITLE = 'SALES_LEDGER_V1'

function money(value: unknown): number | null {
  if (value == null || value === '') return null
  const text = String(value).replace(/[$,￥¥USD\s,]/gi, '').trim()
  if (!text) return null
  const amount = Number(text)
  return Number.isFinite(amount) ? Math.round(amount * 100) / 100 : null
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

function summarize(orders: SalesLedgerOrder[]): SalesStatsSummary {
  let shipmentCount = 0
  let orderAmountTotal = 0
  let goodsAmountTotal = 0
  let usdShippingTotal = 0
  let freightCostTotal = 0
  for (const order of orders) {
    shipmentCount += Math.max(1, order.lines.length)
    if (order.orderAmount != null) orderAmountTotal += order.orderAmount
    if (order.goodsAmount != null) goodsAmountTotal += order.goodsAmount
    if (order.usdShipping != null) usdShippingTotal += order.usdShipping
    for (const line of order.lines) {
      const cost = money(line.freightCost)
      if (cost != null) freightCostTotal += cost
    }
  }
  return {
    orderCount: orders.length,
    shipmentCount,
    orderAmountTotal: Math.round(orderAmountTotal * 100) / 100,
    goodsAmountTotal: Math.round(goodsAmountTotal * 100) / 100,
    usdShippingTotal: Math.round(usdShippingTotal * 100) / 100,
    freightCostTotal: Math.round(freightCostTotal * 100) / 100,
  }
}

function normalizeOrders(raw: unknown): SalesLedgerOrder[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return []
    const row = item as Record<string, unknown>
    const linesRaw = Array.isArray(row.lines) ? row.lines : []
    const lines = linesRaw.flatMap((line) => {
      if (!line || typeof line !== 'object' || Array.isArray(line)) return []
      const itemLine = line as Record<string, unknown>
      return [{
        freightCost: text(itemLine.freightCost, 40),
        chargeWeight: text(itemLine.chargeWeight, 40),
        remark: text(itemLine.remark, 200),
      }]
    })
    const order: SalesLedgerOrder = {
      id: text(row.id, 80) || `sales-${index + 1}`,
      dateText: text(row.dateText, 40),
      customerName: text(row.customerName, 100),
      phone: text(row.phone, 40),
      address: text(row.address, 500),
      orderAmount: money(row.orderAmount),
      goodsAmount: money(row.goodsAmount),
      usdShipping: money(row.usdShipping),
      lines: lines.length ? lines : [{ freightCost: '', chargeWeight: '', remark: '' }],
    }
    if (!order.customerName && !order.phone && !order.address && order.orderAmount == null && !order.lines.some((line) => line.freightCost || line.chargeWeight || line.remark)) {
      return []
    }
    return [order]
  })
}

async function readLedger(): Promise<{ orders: SalesLedgerOrder[]; updatedAt: string }> {
  const setting = await prisma.sitesetting.findFirst({
    where: { settingType: 'STATIC_COPY', title: LEDGER_TITLE },
    orderBy: { updatedAt: 'desc' },
  })
  const content = setting?.contentJson
  const orders = content && typeof content === 'object' && !Array.isArray(content)
    ? normalizeOrders((content as { orders?: unknown }).orders)
    : Array.isArray(content)
      ? normalizeOrders(content)
      : []
  return {
    orders,
    updatedAt: setting?.updatedAt?.toISOString?.() || new Date().toISOString(),
  }
}

async function writeLedger(orders: SalesLedgerOrder[]) {
  const payload = { orders: normalizeOrders(orders) }
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

function headerIndex(headers: string[], aliases: string[]): number {
  const normalized = headers.map((item) => item.replace(/\s+/g, '').toLowerCase())
  for (const alias of aliases) {
    const key = alias.replace(/\s+/g, '').toLowerCase()
    const exact = normalized.findIndex((item) => item === key || item.includes(key))
    if (exact >= 0) return exact
  }
  return -1
}

function cell(row: unknown[], index: number): string {
  if (index < 0 || index >= row.length) return ''
  return text(row[index], 500)
}

function parseAoa(aoa: unknown[][]): SalesLedgerOrder[] {
  if (!aoa.length) return []
  let headerRow = 0
  for (let i = 0; i < Math.min(8, aoa.length); i += 1) {
    const joined = (aoa[i] || []).map((item) => String(item || '')).join(' ')
    if (/日期|姓名|地址|订单金额|运费/.test(joined)) {
      headerRow = i
      break
    }
  }
  const headers = (aoa[headerRow] || []).map((item) => String(item || ''))
  const idx = {
    date: headerIndex(headers, ['日期', 'date']),
    namePhone: headerIndex(headers, ['姓名@电话', '姓名电话', '姓名', '客户', 'name']),
    address: headerIndex(headers, ['地址', 'address']),
    orderAmount: headerIndex(headers, ['订单金额', 'orderamount', '总额']),
    goodsAmount: headerIndex(headers, ['商品金额', '货值', 'goodsamount']),
    usdShipping: headerIndex(headers, ['usd运费', '运费usd', 'usdshipping', '运费']),
    freightCost: headerIndex(headers, ['运费成本', 'freight', '成本运费']),
    chargeWeight: headerIndex(headers, ['计费重量', '计费重', '重量', 'weight']),
    remark: headerIndex(headers, ['订单备注', '物流号', 'tracking', '备注']),
  }

  const orders: SalesLedgerOrder[] = []
  let current: SalesLedgerOrder | null = null
  for (let r = headerRow + 1; r < aoa.length; r += 1) {
    const row = Array.isArray(aoa[r]) ? aoa[r] : []
    if (!row.some((item) => String(item || '').trim())) continue
    const dateText = cell(row, idx.date)
    const namePhone = cell(row, idx.namePhone)
    const address = cell(row, idx.address)
    const orderAmount = money(cell(row, idx.orderAmount))
    const goodsAmount = money(cell(row, idx.goodsAmount))
    const usdShipping = money(cell(row, idx.usdShipping))
    const line = {
      freightCost: cell(row, idx.freightCost),
      chargeWeight: cell(row, idx.chargeWeight),
      remark: cell(row, idx.remark),
    }
    const startsNew = Boolean(namePhone || address || orderAmount != null || goodsAmount != null || usdShipping != null || (dateText && !current))
    if (startsNew || !current) {
      const { customerName, phone } = splitNamePhone(namePhone)
      current = {
        id: `sales-${Date.now()}-${orders.length + 1}`,
        dateText,
        customerName,
        phone,
        address,
        orderAmount,
        goodsAmount,
        usdShipping,
        lines: [line],
      }
      orders.push(current)
    } else {
      if (dateText && !current.dateText) current.dateText = dateText
      current.lines.push(line)
    }
  }
  return normalizeOrders(orders)
}

async function parseSpreadsheet(fileBase64: string, fileName = ''): Promise<SalesLedgerOrder[]> {
  const raw = Buffer.from(String(fileBase64 || '').replace(/^data:[^;]+;base64,/, ''), 'base64')
  if (!raw.length) throw new Error('表格内容为空')
  const lower = String(fileName || '').toLowerCase()
  try {
    const XLSX = require('xlsx') as { read: Function; utils: { sheet_to_json: Function } }
    const workbook = XLSX.read(raw, { type: 'buffer', cellDates: true })
    const first = workbook.Sheets[workbook.SheetNames[0]]
    const aoa = XLSX.utils.sheet_to_json(first, { header: 1, defval: '', raw: false }) as unknown[][]
    return parseAoa(aoa)
  } catch (error) {
    if (lower.endsWith('.csv')) {
      const textBody = raw.toString('utf8')
      const rows = textBody.split(/\r?\n/).map((line) => line.split(','))
      return parseAoa(rows)
    }
    throw error instanceof Error ? error : new Error('表格解析失败')
  }
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
            'Extract sales ledger rows from a spreadsheet screenshot. Return JSON only: {"orders":[{"dateText":"","customerName":"","phone":"","address":"","orderAmount":0,"goodsAmount":0,"usdShipping":0,"lines":[{"freightCost":"","chargeWeight":"","remark":""}]}]} . Merge vertically merged order cells into one order with multiple lines. remark is tracking number. Use null for missing numbers.',
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

export const getSalesStatsDetail = requireStaff('dashboard')(
  withResult(async (): Promise<SalesStatsDetail> => {
    const { orders, updatedAt } = await readLedger()
    return { updatedAt, orders, summary: summarize(orders) }
  }),
)

export const importSalesStatsSheet = requireStaff('dashboard')(
  withResult(async (input: { fileBase64: string; fileName?: string; mode?: 'replace' | 'append' }): Promise<SalesStatsDetail> => {
    getAuthContext()
    const imported = await parseSpreadsheet(String(input.fileBase64 || ''), String(input.fileName || ''))
    if (!imported.length) throw new Error('表格里没有读到销售数据')
    const mode = input.mode === 'append' ? 'append' : 'replace'
    const current = mode === 'append' ? (await readLedger()).orders : []
    const next = normalizeOrders([...current, ...imported]).map((order, index) => ({
      ...order,
      id: order.id || `sales-${Date.now()}-${index + 1}`,
    }))
    await writeLedger(next)
    const saved = await readLedger()
    return { updatedAt: saved.updatedAt, orders: saved.orders, summary: summarize(saved.orders) }
  }),
)

export const importSalesStatsImage = requireStaff('dashboard')(
  withResult(async (input: { fileBase64: string; fileName?: string; mode?: 'replace' | 'append' }): Promise<SalesStatsDetail> => {
    getAuthContext()
    const imported = await recognizeSalesImage(String(input.fileBase64 || ''))
    const mode = input.mode === 'append' ? 'append' : 'replace'
    const current = mode === 'append' ? (await readLedger()).orders : []
    const next = normalizeOrders([...current, ...imported]).map((order, index) => ({
      ...order,
      id: order.id || `sales-img-${Date.now()}-${index + 1}`,
    }))
    await writeLedger(next)
    const saved = await readLedger()
    return { updatedAt: saved.updatedAt, orders: saved.orders, summary: summarize(saved.orders) }
  }),
)

export const clearSalesStatsLedger = requireStaff('dashboard')(
  withResult(async (): Promise<SalesStatsDetail> => {
    await writeLedger([])
    return { updatedAt: new Date().toISOString(), orders: [], summary: summarize([]) }
  }),
)
