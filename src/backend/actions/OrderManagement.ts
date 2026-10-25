'use server'

import prisma from '@/tools/prisma'
import { saveUploadedImage } from '@/lib/uploadStorage'
import {
  requireRole,
  getAuthContext,
  withResult,
  UserRole
} from '@/backend/action_utils'
import { getUsdExchangeRate, toUsdFromCny } from '@/shared/exchangeRate'
import { normalizeSupplierSourceUrl, tradeImportSourceUrl } from '@/shared/supplierSourceUrl'
import { isPlaceholderCompareAt, resolveListedCompareAt } from '@/shared/pricingPromotionCalc'

// ===== Enums =====

/** 订单状态：待付款(PENDING_PAYMENT) | 已支付(PAID) | 处理中(PROCESSING) | 已发货(SHIPPED) | 已送达(DELIVERED) | 已取消(CANCELLED) | 已退款(REFUNDED) */
export type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'

/** 已支付 Tab：付款后进入待发货 / 运输中 / 已送达的订单仍算已付款 */
const PAID_TAB_STATUSES: OrderStatus[] = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED']

/** 入库：未入库 / 部分入库 / 已入库 */
export type InboundState = 'NONE' | 'PARTIAL' | 'DONE'

export interface OrderInboundLine {
  id: string
  productName: string
  skuCode: string
  /** Product code, used to group purchasing lines. */
  spu: string
  quantity: number
  inboundQty: number
  inboundNote: string
  mainImageUrl: string | null
  unitPrice: number | null
  /** Unit price after the order discount. Equals unitPrice when the order has no discount. */
  discountUnitPrice: number | null
  lineAmount: number | null
  currencyCode: string
  costPrice: number | null
  supplierName: string
  supplierUrl: string
  productStatus: string
  goodsStatus: string
  /** PENDING 待采购 | PREPARING 备货中 | TRANSIT 运输中 | ARRIVED 已到货 */
  inboundStage: string
  shipmentImageUrl: string | null
  /** Saved quantity 0 means this line was confirmed out of stock. Unsaved 0 is not. */
  outOfStock: boolean
  /** Set in the check-in screen after the operator clicks 确认. */
  acknowledged?: boolean
  openedQty?: number
  openedNote?: string
  openedStage?: string
  openedImage?: string
}

function clampInboundQty(quantity: number, raw: number) {
  const ordered = Math.max(0, Math.floor(Number(quantity) || 0))
  const qty = Math.max(0, Math.floor(Number(raw) || 0))
  return ordered > 0 ? Math.min(ordered, qty) : 0
}

function inboundStateOf(orderedQty: number, inboundQty: number): InboundState {
  if (inboundQty <= 0 || orderedQty <= 0) return 'NONE'
  if (inboundQty >= orderedQty) return 'DONE'
  return 'PARTIAL'
}

function inboundWasRecorded(inboundAt: Date | string | null | undefined) {
  if (inboundAt == null) return false
  if (inboundAt instanceof Date) return !Number.isNaN(inboundAt.getTime())
  return String(inboundAt).trim() !== ''
}

function moneyAmount(value: unknown): number | null {
  if (value == null || value === '') return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'object' && value && typeof (value as { toNumber?: unknown }).toNumber === 'function') {
    const n = (value as { toNumber: () => number }).toNumber()
    return Number.isFinite(n) ? n : null
  }
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

const inboundProductSelect = {
  productCode: true,
  mainImageUrl: true,
  weightGram: true,
  costPrice: true,
  supplierName: true,
  status: true,
  goodsStatus: true,
  tradeInfoJson: true,
  galleryJson: true,
  importTaskItems: {
    select: { sourceUrl: true, supplierName: true },
    orderBy: { updatedAt: 'desc' as const },
    take: 8,
  },
}

const INBOUND_STAGES = new Set(['PENDING', 'STOCK', 'PREPARING', 'FACTORY', 'TRANSIT', 'ARRIVED', 'PARCEL'])

function cleanInboundStage(value: unknown): string {
  const text = String(value || '').trim().toUpperCase()
  return INBOUND_STAGES.has(text) ? text : 'PENDING'
}

function supplierLinkFromProduct(product: {
  supplierName?: string | null
  tradeInfoJson?: unknown
  importTaskItems?: Array<{ sourceUrl?: string | null; supplierName?: string | null }> | null
} | null | undefined): { supplierName: string; supplierUrl: string } {
  const sources = product?.importTaskItems || []
  const supplierName = String(
    product?.supplierName
    || sources.find((row) => String(row.supplierName || '').trim())?.supplierName
    || ''
  ).trim()
  const supplierUrl = tradeImportSourceUrl(product?.tradeInfoJson)
    || sources.map((row) => normalizeSupplierSourceUrl(row.sourceUrl)).find(Boolean)
    || ''
  return { supplierName, supplierUrl }
}

function carryDiscountAmount(previousSubtotal: unknown, previousDiscount: unknown, subtotal: number) {
  const before = moneyAmount(previousSubtotal) ?? 0
  const discountBefore = Math.max(0, moneyAmount(previousDiscount) ?? 0)
  if (!(before > 0) || !(discountBefore > 0)) return 0
  const next = Math.round(subtotal * (discountBefore / before) * 100) / 100
  return Math.min(Math.max(0, next), Math.max(0, subtotal))
}

function discountedUnitPrice(unitPrice: number | null, subtotal: unknown, discount: unknown): number | null {
  if (unitPrice == null) return null
  const sub = Number(subtotal || 0)
  const disc = Number(discount || 0)
  if (!(disc > 0.009) || !(sub > 0)) return unitPrice
  const ratio = (sub - disc) / sub
  if (!Number.isFinite(ratio) || ratio >= 1) return unitPrice
  return Math.round(unitPrice * Math.max(0, ratio) * 100) / 100
}

function inboundSpuOf(item: { skuCode?: string | null; product?: { productCode?: string | null } | null }) {
  const code = String(item.product?.productCode || '').trim()
  if (code) return code
  const sku = String(item.skuCode || '').trim()
  const cut = sku.indexOf('-')
  return cut > 0 ? sku.slice(0, cut) : sku
}

function compareInboundSpu(a: { spu?: string | null; skuCode?: string | null }, b: { spu?: string | null; skuCode?: string | null }) {
  const manual = (row: { skuCode?: string | null }) => String(row.skuCode || '').startsWith('ADD-') ? 1 : 0
  const rank = manual(a) - manual(b)
  if (rank) return rank
  const spu = String(a.spu || '').localeCompare(String(b.spu || ''), 'en', { numeric: true, sensitivity: 'base' })
  if (spu) return spu
  return String(a.skuCode || '').localeCompare(String(b.skuCode || ''), 'en', { numeric: true, sensitivity: 'base' })
}

function mapInboundLine(item: {
  id: string
  productName: string
  skuCode: string
  quantity: number
  inboundQty?: number | null
  inboundNote?: string | null
  inboundAt?: Date | string | null
  inboundStage?: string | null
  shipmentImageUrl?: string | null
  unitPrice?: unknown
  lineAmount?: unknown
  productSku?: { imageUrl?: string | null } | null
  product?: {
    productCode?: string | null
    mainImageUrl?: string | null
    galleryJson?: unknown
    costPrice?: unknown
    supplierName?: string | null
    status?: string | null
    goodsStatus?: string | null
    tradeInfoJson?: unknown
    importTaskItems?: Array<{ sourceUrl?: string | null; supplierName?: string | null }> | null
  } | null
}, currencyCode?: string | null, orderAmounts?: { subtotalAmount?: unknown; discountAmount?: unknown } | null): OrderInboundLine {
  const quantity = Math.max(0, Math.floor(Number(item.quantity) || 0))
  const inboundQty = clampInboundQty(quantity, Number(item.inboundQty) || 0)
  const supplier = supplierLinkFromProduct(item.product)
  const unitPrice = moneyAmount(item.unitPrice)
  return {
    id: item.id,
    productName: item.productName,
    skuCode: item.skuCode,
    spu: inboundSpuOf(item),
    quantity,
    inboundQty,
    inboundNote: String(item.inboundNote || ''),
    mainImageUrl: item.productSku?.imageUrl || item.product?.mainImageUrl || firstGalleryUrl(item.product?.galleryJson) || null,
    shipmentImageUrl: String(item.shipmentImageUrl || '').trim() || null,
    unitPrice,
    discountUnitPrice: discountedUnitPrice(unitPrice, orderAmounts?.subtotalAmount, orderAmounts?.discountAmount),
    lineAmount: moneyAmount(item.lineAmount),
    currencyCode: String(currencyCode || 'USD'),
    costPrice: moneyAmount(item.product?.costPrice),
    supplierName: supplier.supplierName,
    supplierUrl: supplier.supplierUrl,
    productStatus: String(item.product?.status || ''),
    goodsStatus: String(item.product?.goodsStatus || ''),
    inboundStage: cleanInboundStage(item.inboundStage),
    outOfStock: inboundWasRecorded(item.inboundAt) && inboundQty <= 0,
  }
}

function summarizeInbound(lines: OrderInboundLine[]) {
  const orderedQty = lines.reduce((sum, line) => sum + line.quantity, 0)
  const inboundQty = lines.reduce((sum, line) => sum + line.inboundQty, 0)
  return { orderedQty, inboundQty, state: inboundStateOf(orderedQty, inboundQty) }
}

/** 发货方式：标准(STANDARD) | 加急(EXPRESS) */
export type OrderShipMethod = 'STANDARD' | 'EXPRESS'

/** 支付方式：PayPal(PAYPAL) | 银行转账(BANK_TRANSFER) | Stripe(STRIPE) | 信用卡(CREDIT_CARD) */
export type PaymentMethodType = 'PAYPAL' | 'BANK_TRANSFER' | 'STRIPE' | 'CREDIT_CARD'


// ===== Data Structures =====

export interface OrderItemDetail {
  id: string                   // data-from: orderitem-id
  productId: string            // data-from: orderitem-productId
  productSkuId: string         // data-from: orderitem-productSkuId
  productName: string          // data-from: orderitem-productName
  skuCode: string              // data-from: orderitem-skuCode
  materialLabel: string | null // data-from: orderitem-materialLabel
  sizeLabel: string | null     // data-from: orderitem-sizeLabel
  engravingText: string | null // data-from: orderitem-engravingText
  quantity: number             // data-from: orderitem-quantity
  inboundQty: number           // data-from: orderitem-inboundQty
  inboundNote: string | null   // data-from: orderitem-inboundNote
  unitPrice: number            // data-from: orderitem-unitPrice (Decimal -> number)
  lineAmount: number           // data-from: orderitem-lineAmount (Decimal -> number)
  mainImageUrl?: string        // data-from: product-mainImageUrl (关联查询补全)
}

export interface OrderLogisticsSegmentDetail {
  id: string                           // data-from: orderlogisticssegment-id
  segmentType: string                  // data-from: orderlogisticssegment-segmentType
  carrierName: string | null           // data-from: orderlogisticssegment-carrierName
  trackingNumber: string | null        // data-from: orderlogisticssegment-trackingNumber
  statusLabel: string | null           // data-from: orderlogisticssegment-statusLabel
  estimatedArrivalAt: string | null    // data-from: orderlogisticssegment-estimatedArrivalAt (ISO String)
  shippedAt: string | null             // data-from: orderlogisticssegment-shippedAt (ISO String)
  remark: string | null                // data-from: orderlogisticssegment-remark
  timelineJson: { time: string, label: string }[] | null // data-from: orderlogisticssegment-timelineJson
  createdAt: string                    // data-from: orderlogisticssegment-createdAt (ISO String)
}

export interface OrderOperationLogDetail {
  id: string                   // data-from: orderoperationlog-id
  actionType: string           // data-from: orderoperationlog-actionType
  actionNote: string | null    // data-from: orderoperationlog-actionNote
  operatorName: string | null  // data-from: orderoperationlog-operatorName
  createdAt: string            // data-from: orderoperationlog-createdAt (ISO String)
}

export interface OrderAddressInfo {
  recipientName: string        // data-from: useraddress-recipientName
  phone: string | null         // data-from: useraddress-phone
  countryCode: string          // data-from: useraddress-countryCode
  countryName: string          // data-from: useraddress-countryName
  stateName: string | null     // data-from: useraddress-stateName
  cityName: string | null      // data-from: useraddress-cityName
  addressLine1: string         // data-from: useraddress-addressLine1
  addressLine2: string | null  // data-from: useraddress-addressLine2
  postalCode: string | null    // data-from: useraddress-postalCode
}

export interface OrderListItem {
  id: string                   // data-from: orderrecord-id
  orderNo: string              // data-from: orderrecord-orderNo
  status: OrderStatus          // data-from: orderrecord-status
  totalAmount: number          // data-from: orderrecord-totalAmount (Decimal -> number)
  subtotalAmount: number       // data-from: orderrecord-subtotalAmount
  discountAmount: number       // data-from: orderrecord-discountAmount
  currencyCode: string         // data-from: orderrecord-currencyCode
  paymentMethod: PaymentMethodType // data-from: orderrecord-paymentMethod
  paymentStatus: string | null // data-from: orderrecord-paymentStatus
  trackingCarrier: string | null // data-from: orderrecord-trackingCarrier
  trackingNumber: string | null  // data-from: orderrecord-trackingNumber
  createdAt: string            // data-from: orderrecord-createdAt (ISO String)
  
  // 关联摘要数据
  customerName: string         // data-from: sysuser-username
  customerEmail: string        // data-from: sysuser-email
  customerWhatsapp: string | null // data-from: sysuser-phone
  countryName: string | null   // data-from: useraddress-countryName
  itemSummary: string          // aggregated (如：商品A等共X件)
  itemImageUrl: string | null  // aggregated (取第一个商品的图片)
  totalWeightGrams: number     // aggregated from product.weightGram * qty
  internalNote: string | null  // data-from: orderrecord-internalNote
  inboundOrderedQty: number
  inboundReceivedQty: number
  inboundState: InboundState
  inboundLines: OrderInboundLine[]
}

export interface OrderExcelExportRow {
  productId: string
  sku: string
  spu: string
  imageUrl: string
  originalPriceUsd: number
  discountPriceUsd: number
  quantity: number
  totalPriceUsd: number
  costPrice: number | null
  supplierName: string
  supplierUrl: string
  productName: string
  orderNo: string
  inboundQty: number
  inboundNote: string
}

export interface OrderDetail extends OrderListItem {
  subtotalAmount: number       // data-from: orderrecord-subtotalAmount (Decimal -> number)
  discountAmount: number       // data-from: orderrecord-discountAmount (Decimal -> number)
  shippingAmount: number       // data-from: orderrecord-shippingAmount (Decimal -> number)
  giftWrapAmount: number       // data-from: orderrecord-giftWrapAmount (Decimal -> number)
  shipMethod: OrderShipMethod  // data-from: orderrecord-shipMethod
  estimatedArrivalAt: string | null // data-from: orderrecord-estimatedArrivalAt (ISO String)
  shippedAt: string | null     // data-from: orderrecord-shippedAt (ISO String)
  internalNote: string | null  // data-from: orderrecord-internalNote
  note: string | null          // data-from: orderrecord-note (买家备注)
  
  address: OrderAddressInfo | null
  items: OrderItemDetail[]
  logistics: OrderLogisticsSegmentDetail[]
  logs: OrderOperationLogDetail[]
}

// ===== Input / Output =====

export interface GetDashboardStatsOutput {
  pendingShipmentCount: number // 待发货
  todayNewOrderCount: number   // 今日新增
  refundingCount: number       // 退款处理中
  totalOrderCount: number      // 全部订单数
}

export interface GetOrderListInput {
  keyword?: string             // 订单号 / 客户名 / 邮箱
  status?: OrderStatus
  paymentStatus?: string       // 对应订单的 paymentStatus
  startDate?: string           // ISO String
  endDate?: string             // ISO String
  countryName?: string
  page?: number                // 默认 1
  pageSize?: number            // 默认 20
}

export interface GetOrderListOutput {
  list: OrderListItem[]
  total: number
}

export interface ShipOrderInput {
  orderId: string
  trackingCarrier: string
  trackingNumber: string
  shippedAt: string            // 实际发货时间 (ISO String)
  internalNote?: string
}

export interface AddLogisticsSegmentInput {
  orderId: string
  segmentType: string          // 如: "国内段" / "国际段"
  carrierName?: string
  trackingNumber?: string
  statusLabel?: string
  estimatedArrivalAt?: string  // ISO String
  remark?: string
}

export interface UpdateOrderStatusInput {
  orderId: string
  newStatus: OrderStatus
  actionNote?: string           // 列表快捷切换可省略，自动生成备注
}

export interface UpdateOrderRemarkInput {
  orderId: string
  internalNote: string
}

export interface UpdateOrderInboundLineInput {
  orderItemId: string
  inboundQty: number
  inboundNote?: string
  /** True when the operator confirmed this line. Quantity 0 is out of stock only then. */
  confirmed?: boolean
  inboundStage?: string
  shipmentImageUrl?: string | null
}

export interface UpdateOrderInboundInput {
  orderId: string
  lines: UpdateOrderInboundLineInput[]
}

export interface UpdateOrderInboundOutput {
  lines: OrderInboundLine[]
  orderedQty: number
  receivedQty: number
  state: InboundState
}

export interface ExportOrdersExcelInput {
  orderIds: string[]
}

export interface ExportOrdersExcelOutput {
  rows: OrderExcelExportRow[]
  fileName: string
}

export interface ExportOrdersExcelFileOutput {
  fileName: string
  /** base64-encoded .xlsx bytes */
  fileBase64: string
  /** whether thumbnails were embedded into cells */
  embeddedThumbnails: boolean
}

// ===== Actions =====

/**
 * 获取订单管理顶部关键指标
 */
export const getOrderDashboardStats = requireRole([UserRole.ADMIN])(
  withResult(async (): Promise<GetDashboardStatsOutput> => {
    // 待发货 (PROCESSING 或 PENDING_PAYMENT等视具体业务而定，按需求一般把 PAID/PROCESSING 当作待发货)
    const pendingShipmentCount = await prisma.orderrecord.count({
      where: { status: 'PROCESSING' }
    })

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    
    const todayNewOrderCount = await prisma.orderrecord.count({
      where: { createdAt: { gte: todayStart } }
    })

    const refundingCount = await prisma.orderrecord.count({
      where: { status: 'REFUNDED' } // 根据需求可以独立扩展 REFUNDING 等，按Schema用已退款或找退款申请，此处用已有REFUNDED近似替代
    })

    const totalOrderCount = await prisma.orderrecord.count()

    return {
      pendingShipmentCount,
      todayNewOrderCount,
      refundingCount,
      totalOrderCount
    }
  })
)

/**
 * 获取订单列表（支持复合检索）
 */
export const getOrderList = requireRole([UserRole.ADMIN])(
  withResult(async (input: GetOrderListInput): Promise<GetOrderListOutput> => {
    const {
      keyword, status, paymentStatus, startDate, endDate, countryName,
      page = 1, pageSize = 50
    } = input

    const safePageSize = Math.max(1, Math.min(200, Math.floor(Number(pageSize) || 50)))
    const skip = (Math.max(1, page) - 1) * safePageSize
    
    // 构建过滤条件
    const whereCondition: any = {}

    if (status === 'PAID') {
      whereCondition.status = { in: PAID_TAB_STATUSES }
    } else if (status) {
      whereCondition.status = status
    }

    if (paymentStatus) {
      whereCondition.paymentStatus = paymentStatus
    }

    if (startDate || endDate) {
      whereCondition.createdAt = {}
      if (startDate) whereCondition.createdAt.gte = new Date(startDate)
      if (endDate) whereCondition.createdAt.lte = new Date(endDate)
    }

    if (countryName) {
      whereCondition.address = { countryName: { contains: countryName } }
    }

    if (keyword) {
      whereCondition.OR = [
        { orderNo: { contains: keyword } },
        { user: { username: { contains: keyword } } },
        { user: { email: { contains: keyword } } }
      ]
    }

    const [total, records] = await Promise.all([
      prisma.orderrecord.count({ where: whereCondition }),
      prisma.orderrecord.findMany({
        where: whereCondition,
        skip,
        take: safePageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
          address: true,
          items: {
            orderBy: { createdAt: 'asc' },
            include: {
              product: { select: inboundProductSelect },
              productSku: { select: { imageUrl: true } },
            },
          }
        }
      })
    ])

    const list: OrderListItem[] = records.map(record => {
      // 聚合商品摘要
      let itemSummary = ''
      if (record.items.length > 0) {
        const firstItem = record.items[0]
        const totalQty = record.items.reduce((sum, item) => sum + item.quantity, 0)
        itemSummary = `${firstItem.productName} 等共 ${totalQty} 件`
      }

      const totalWeightGrams = record.items.reduce((sum, item) => {
        const unitGrams = item.product?.weightGram != null ? Number(item.product.weightGram) : 0
        return sum + (Number.isFinite(unitGrams) ? unitGrams : 0) * item.quantity
      }, 0)
      const inboundLines = record.items.map((item) => mapInboundLine(item, record.currencyCode, record)).sort(compareInboundSpu)
      const inbound = summarizeInbound(inboundLines)

      return {
        id: record.id,
        orderNo: record.orderNo,
        status: record.status as OrderStatus,
        totalAmount: record.totalAmount.toNumber(),
        subtotalAmount: record.subtotalAmount.toNumber(),
        discountAmount: record.discountAmount.toNumber(),
        currencyCode: record.currencyCode,
        paymentMethod: record.paymentMethod as PaymentMethodType,
        paymentStatus: record.paymentStatus,
        trackingCarrier: record.trackingCarrier,
        trackingNumber: record.trackingNumber,
        createdAt: record.createdAt.toISOString(),
        customerName: record.user.username,
        customerEmail: record.user.email,
        customerWhatsapp: record.user.phone || null,
        countryName: record.address?.countryName || null,
        itemSummary,
        itemImageUrl: record.items[0]?.product?.mainImageUrl || null,
        totalWeightGrams: Math.round(totalWeightGrams * 100) / 100,
        internalNote: record.internalNote || null,
        inboundOrderedQty: inbound.orderedQty,
        inboundReceivedQty: inbound.inboundQty,
        inboundState: inbound.state,
        inboundLines,
      }
    })

    return { list, total }
  })
)

/**
 * 获取订单详情（抽屉用全量数据）
 */
export const getOrderDetail = requireRole([UserRole.ADMIN])(
  withResult(async (orderId: string): Promise<OrderDetail> => {
    const record = await prisma.orderrecord.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        address: true,
        items: {
          orderBy: { createdAt: 'asc' },
          include: {
            product: { select: inboundProductSelect },
            productSku: { select: { imageUrl: true } },
          },
        },
        logistics: {
          orderBy: { createdAt: 'desc' }
        },
        logs: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!record) {
      throw new Error('订单不存在')
    }

    let itemSummary = ''
    if (record.items.length > 0) {
      const firstItem = record.items[0]
      const totalQty = record.items.reduce((sum, item) => sum + item.quantity, 0)
      itemSummary = `${firstItem.productName} 等共 ${totalQty} 件`
    }

    return {
      id: record.id,
      orderNo: record.orderNo,
      status: record.status as OrderStatus,
      totalAmount: record.totalAmount.toNumber(),
      subtotalAmount: record.subtotalAmount.toNumber(),
      discountAmount: record.discountAmount.toNumber(),
      shippingAmount: record.shippingAmount.toNumber(),
      giftWrapAmount: record.giftWrapAmount.toNumber(),
      currencyCode: record.currencyCode,
      paymentMethod: record.paymentMethod as PaymentMethodType,
      paymentStatus: record.paymentStatus,
      shipMethod: record.shipMethod as OrderShipMethod,
      trackingCarrier: record.trackingCarrier,
      trackingNumber: record.trackingNumber,
      estimatedArrivalAt: record.estimatedArrivalAt?.toISOString() || null,
      shippedAt: record.shippedAt?.toISOString() || null,
      note: record.note,
      createdAt: record.createdAt.toISOString(),
      
      customerName: record.user.username,
      customerEmail: record.user.email,
      customerWhatsapp: record.user.phone || null,
      countryName: record.address?.countryName || null,
      itemSummary,
      itemImageUrl: record.items[0]?.product?.mainImageUrl || null,
      totalWeightGrams: Math.round(record.items.reduce((sum, item) => {
        const unitGrams = item.product?.weightGram != null ? Number(item.product.weightGram) : 0
        return sum + (Number.isFinite(unitGrams) ? unitGrams : 0) * item.quantity
      }, 0) * 100) / 100,
      internalNote: record.internalNote || null,
      ...(() => {
        const inboundLines = record.items.map((item) => mapInboundLine(item, record.currencyCode, record)).sort(compareInboundSpu)
        const inbound = summarizeInbound(inboundLines)
        return {
          inboundOrderedQty: inbound.orderedQty,
          inboundReceivedQty: inbound.inboundQty,
          inboundState: inbound.state,
          inboundLines,
        }
      })(),

      address: record.address ? {
        recipientName: record.address.recipientName,
        phone: record.address.phone,
        countryCode: record.address.countryCode,
        countryName: record.address.countryName,
        stateName: record.address.stateName,
        cityName: record.address.cityName,
        addressLine1: record.address.addressLine1,
        addressLine2: record.address.addressLine2,
        postalCode: record.address.postalCode,
      } : null,

      items: [...record.items].sort((a, b) => compareInboundSpu(
        { spu: inboundSpuOf(a), skuCode: a.skuCode },
        { spu: inboundSpuOf(b), skuCode: b.skuCode },
      )).map(item => ({
        id: item.id,
        productId: item.productId,
        productSkuId: item.productSkuId,
        productName: item.productName,
        skuCode: item.skuCode,
        materialLabel: item.materialLabel,
        sizeLabel: item.sizeLabel,
        engravingText: item.engravingText,
        quantity: item.quantity,
        inboundQty: clampInboundQty(item.quantity, Number(item.inboundQty) || 0),
        inboundNote: item.inboundNote || null,
        unitPrice: item.unitPrice.toNumber(),
        lineAmount: item.lineAmount.toNumber(),
        mainImageUrl: item.product?.mainImageUrl
      })),

      logistics: record.logistics.map(log => ({
        id: log.id,
        segmentType: log.segmentType,
        carrierName: log.carrierName,
        trackingNumber: log.trackingNumber,
        statusLabel: log.statusLabel,
        estimatedArrivalAt: log.estimatedArrivalAt?.toISOString() || null,
        shippedAt: log.shippedAt?.toISOString() || null,
        remark: log.remark,
        timelineJson: log.timelineJson as { time: string, label: string }[] | null,
        createdAt: log.createdAt.toISOString(),
      })),

      logs: record.logs.map(log => ({
        id: log.id,
        actionType: log.actionType,
        actionNote: log.actionNote,
        operatorName: log.operatorName,
        createdAt: log.createdAt.toISOString(),
      }))
    }
  })
)

/**
 * 处理发货（履约工作台）
 * 更新订单的主物流信息、状态，并同步写入操作日志和主段物流记录
 */
export const shipOrder = requireRole([UserRole.ADMIN])(
  withResult(async (input: ShipOrderInput): Promise<void> => {
    const { userId, username } = getAuthContext()
    
    await prisma.$transaction(async (tx) => {
      const order = await tx.orderrecord.findUnique({ where: { id: input.orderId } })
      if (!order) throw new Error('订单不存在')
      if (order.status === 'CANCELLED' || order.status === 'REFUNDED') {
        throw new Error('已取消或已退款的订单无法发货')
      }

      const shipDate = new Date(input.shippedAt)
      
      // 1. 更新主订单记录
      await tx.orderrecord.update({
        where: { id: input.orderId },
        data: {
          status: 'SHIPPED',
          trackingCarrier: input.trackingCarrier,
          trackingNumber: input.trackingNumber,
          shippedAt: shipDate,
          ...(input.internalNote ? { internalNote: input.internalNote } : {})
        }
      })

      // 2. 自动生成一个"出库/主干"的物流段记录
      await tx.orderlogisticssegment.create({
        data: {
          orderId: input.orderId,
          segmentType: '国际段/主干', // 默认作为主干录入
          carrierName: input.trackingCarrier,
          trackingNumber: input.trackingNumber,
          statusLabel: '已发货',
          shippedAt: shipDate,
          remark: '管理员操作主干发货',
          timelineJson: [
            { time: shipDate.toISOString(), label: '包裹已出库发货' }
          ]
        }
      })

      // 3. 记录履约操作日志
      await tx.orderoperationlog.create({
        data: {
          orderId: input.orderId,
          actionType: '发货处理',
          actionNote: `通过承运商 ${input.trackingCarrier} 发货，单号：${input.trackingNumber}。备注：${input.internalNote || '无'}`,
          operatorName: username
        }
      })
    })
  })
)

/**
 * 录入/追加多段国际物流追踪信息
 */
export const addLogisticsSegment = requireRole([UserRole.ADMIN])(
  withResult(async (input: AddLogisticsSegmentInput): Promise<void> => {
    const { username } = getAuthContext()

    await prisma.$transaction(async (tx) => {
      const order = await tx.orderrecord.findUnique({ where: { id: input.orderId } })
      if (!order) throw new Error('订单不存在')

      // 1. 创建新增的物流段
      await tx.orderlogisticssegment.create({
        data: {
          orderId: input.orderId,
          segmentType: input.segmentType,
          carrierName: input.carrierName,
          trackingNumber: input.trackingNumber,
          statusLabel: input.statusLabel,
          estimatedArrivalAt: input.estimatedArrivalAt ? new Date(input.estimatedArrivalAt) : null,
          remark: input.remark
        }
      })

      // 2. 如果包含预计送达时间，同步更新主订单看板的ETA
      if (input.estimatedArrivalAt) {
        await tx.orderrecord.update({
          where: { id: input.orderId },
          data: { estimatedArrivalAt: new Date(input.estimatedArrivalAt) }
        })
      }

      // 3. 操作记录
      await tx.orderoperationlog.create({
        data: {
          orderId: input.orderId,
          actionType: '物流节点更新',
          actionNote: `更新了 [${input.segmentType}] 物流记录：${input.carrierName || ''} - ${input.statusLabel || ''}`,
          operatorName: username
        }
      })
    })
  })
)

/**
 * 更新订单状态（退款处理、取消等强干预流转）
 */
export const updateOrderStatus = requireRole([UserRole.ADMIN])(
  withResult(async (input: UpdateOrderStatusInput): Promise<void> => {
    const { username } = getAuthContext()
    const { orderId, newStatus } = input
    const actionNote = String(input.actionNote || '').trim() || `列表快捷切换状态为 ${newStatus}`

    await prisma.$transaction(async (tx) => {
      const order = await tx.orderrecord.findUnique({ where: { id: orderId } })
      if (!order) throw new Error('订单不存在')

      if (order.status === newStatus) {
        return // 状态无变化，不做处理
      }

      // 1. 更新状态
      await tx.orderrecord.update({
        where: { id: orderId },
        data: { status: newStatus }
      })

      // 2. 写入操作记录，保障记录不可篡改
      await tx.orderoperationlog.create({
        data: {
          orderId,
          actionType: `状态变更 (${order.status} -> ${newStatus})`,
          actionNote,
          operatorName: username
        }
      })
    })
  })
)

/**
 * 登记订单商品入库数量。数量不能超过下单件数。保存 0 表示这行缺货。
 */
export const updateOrderInbound = requireRole([UserRole.ADMIN])(
  withResult(async (input: UpdateOrderInboundInput): Promise<UpdateOrderInboundOutput> => {
    const { username } = getAuthContext()
    const order = await prisma.orderrecord.findUnique({
      where: { id: input.orderId },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
          include: {
            product: { select: inboundProductSelect },
            productSku: { select: { imageUrl: true } },
          },
        },
      },
    })
    if (!order) throw new Error('订单不存在')

    const itemIds = new Set(order.items.map((item) => item.id))
    for (const line of input.lines || []) {
      if (!itemIds.has(line.orderItemId)) throw new Error('订单商品不存在')
    }
    const requested = new Map((input.lines || []).map((line) => [line.orderItemId, line]))
    const changes: string[] = []

    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        const line = requested.get(item.id)
        if (!line) continue
        const nextQty = clampInboundQty(item.quantity, Number(line.inboundQty) || 0)
        const nextNote = String(line.inboundNote || '').trim().slice(0, 255)
        const prevQty = clampInboundQty(item.quantity, Number(item.inboundQty) || 0)
        const prevNote = String(item.inboundNote || '')
        const markStockout = nextQty <= 0 && line.confirmed === true
        const recordArrival = nextQty > 0
        const prevStage = cleanInboundStage(item.inboundStage)
        const nextStage = line.inboundStage
          ? cleanInboundStage(line.inboundStage)
          : (recordArrival ? 'ARRIVED' : prevStage)
        const hasImage = line.shipmentImageUrl !== undefined
        const nextImage = hasImage ? String(line.shipmentImageUrl || '').trim().slice(0, 512) : String(item.shipmentImageUrl || '')
        const prevImage = String(item.shipmentImageUrl || '')
        const imageChanged = hasImage && nextImage !== prevImage
        if (
          nextQty === prevQty
          && nextNote === prevNote
          && nextStage === prevStage
          && !imageChanged
          && !(markStockout && !inboundWasRecorded(item.inboundAt))
        ) continue
        await tx.orderitem.update({
          where: { id: item.id },
          data: {
            inboundQty: nextQty,
            inboundNote: nextNote || null,
            inboundAt: markStockout || recordArrival ? new Date() : item.inboundAt,
            inboundStage: nextStage,
            ...(hasImage ? { shipmentImageUrl: nextImage || null } : {}),
          },
        })
        const stockoutLabel = markStockout ? '缺货 ' : ''
        const imageLabel = imageChanged ? ' 发货图片' : ''
        changes.push(`${stockoutLabel}${item.skuCode || item.productName} ${prevQty}->${nextQty}${nextNote ? `（${nextNote}）` : ''}${imageLabel}`)
      }
      if (changes.length) {
        await tx.orderoperationlog.create({
          data: {
            orderId: order.id,
            actionType: '入库登记',
            actionNote: changes.join('；').slice(0, 4000),
            operatorName: username,
          },
        })
      }
    })

    const fresh = await prisma.orderitem.findMany({
      where: { orderId: order.id },
      include: {
        product: { select: inboundProductSelect },
        productSku: { select: { imageUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    })
    const lines = fresh.map((item) => mapInboundLine(item, order.currencyCode, order)).sort(compareInboundSpu)
    const summary = summarizeInbound(lines)
    return {
      lines,
      orderedQty: summary.orderedQty,
      receivedQty: summary.inboundQty,
      state: summary.state,
    }
  }),
)

export interface AppendOrderGoodsLineInput {
  skuCode: string
  quantity?: number
  unitPrice?: number | null
  inboundQty?: number
  inboundNote?: string
  inboundStage?: string
  shipmentImageUrl?: string | null
}

export interface AppendOrderGoodsInput {
  orderId: string
  lines: AppendOrderGoodsLineInput[]
}

export interface AppendOrderGoodsOutput extends UpdateOrderInboundOutput {
  addedCount: number
  missingSkus: string[]
  totalAmount: number
}

/**
 * 给已有订单加货。SKU 已在订单里则增加数量；否则按商品库 SKU 新增一行。
 */
export const appendOrderGoods = requireRole([UserRole.ADMIN])(
  withResult(async (input: AppendOrderGoodsInput): Promise<AppendOrderGoodsOutput> => {
    const { username } = getAuthContext()
    const grouped = new Map<string, AppendOrderGoodsLineInput & { skuCode: string; quantity: number }>()
    for (const line of input.lines || []) {
      const skuCode = String(line.skuCode || '').trim()
      if (!skuCode) continue
      const quantity = Math.max(1, Math.floor(Number(line.quantity) || 1))
      const prev = grouped.get(skuCode)
      if (!prev) {
        grouped.set(skuCode, { ...line, skuCode, quantity })
      } else {
        prev.quantity += quantity
        if (line.unitPrice != null && Number.isFinite(Number(line.unitPrice))) prev.unitPrice = Number(line.unitPrice)
        if (line.inboundQty != null && Number.isFinite(Number(line.inboundQty))) prev.inboundQty = Number(line.inboundQty)
        if (String(line.inboundNote || '').trim()) prev.inboundNote = String(line.inboundNote)
        if (String(line.inboundStage || '').trim()) prev.inboundStage = String(line.inboundStage)
        if (String(line.shipmentImageUrl || '').trim()) prev.shipmentImageUrl = String(line.shipmentImageUrl)
      }
    }
    if (!grouped.size) throw new Error('请填写要加货的 SKU')

    const order = await prisma.orderrecord.findUnique({
      where: { id: input.orderId },
      include: { items: true },
    })
    if (!order) throw new Error('订单不存在')

    const skuRows = await prisma.productsku.findMany({
      where: { skuCode: { in: [...grouped.keys()] } },
      include: { product: { select: { id: true, name: true } } },
    })
    const skuByCode = new Map(skuRows.map((row) => [row.skuCode, row]))
    const missingSkus = [...grouped.keys()].filter((sku) => !skuByCode.has(sku) && !order.items.some((item) => item.skuCode === sku))
    const rate = await getUsdExchangeRate(prisma)
    const currency = String(order.currencyCode || 'USD').toUpperCase()
    const changes: string[] = []
    let addedCount = 0

    await prisma.$transaction(async (tx) => {
      for (const line of grouped.values()) {
        const existing = order.items.find((item) => item.skuCode === line.skuCode)
        if (existing) {
          const nextQuantity = Math.max(1, existing.quantity + line.quantity)
          const unit = moneyAmount(existing.unitPrice) ?? 0
          const inboundQty = line.inboundQty != null && Number.isFinite(Number(line.inboundQty))
            ? Math.max(0, Math.min(nextQuantity, Math.floor(Number(line.inboundQty))))
            : Math.max(0, Math.min(nextQuantity, Number(existing.inboundQty) || 0))
          await tx.orderitem.update({
            where: { id: existing.id },
            data: {
              quantity: nextQuantity,
              lineAmount: Math.round(unit * nextQuantity * 100) / 100,
              inboundQty,
              ...(String(line.inboundNote || '').trim() ? { inboundNote: String(line.inboundNote).trim().slice(0, 255) } : {}),
              ...(String(line.inboundStage || '').trim() ? { inboundStage: cleanInboundStage(line.inboundStage) } : {}),
              ...(String(line.shipmentImageUrl || '').trim() ? { shipmentImageUrl: String(line.shipmentImageUrl).trim().slice(0, 512) } : {}),
            },
          })
          changes.push(`${line.skuCode} 加货 ${existing.quantity}->${nextQuantity}`)
          addedCount += 1
          continue
        }
        const sku = skuByCode.get(line.skuCode)
        if (!sku?.product) continue
        const sheetPrice = line.unitPrice != null && Number.isFinite(Number(line.unitPrice)) ? Number(line.unitPrice) : null
        const cny = moneyAmount(sku.price) ?? 0
        const unit = sheetPrice != null
          ? Math.round(sheetPrice * 100) / 100
          : (currency === 'CNY' ? Math.round(cny * 100) / 100 : toUsdFromCny(cny, rate))
        const quantity = line.quantity
        const inboundQty = line.inboundQty != null && Number.isFinite(Number(line.inboundQty))
          ? Math.max(0, Math.min(quantity, Math.floor(Number(line.inboundQty))))
          : 0
        await tx.orderitem.create({
          data: {
            orderId: order.id,
            productId: sku.productId,
            productSkuId: sku.id,
            productName: String(sku.product.name || line.skuCode).slice(0, 200),
            skuCode: sku.skuCode,
            materialLabel: sku.materialLabel,
            sizeLabel: sku.sizeLabel,
            quantity,
            unitPrice: unit,
            lineAmount: Math.round(unit * quantity * 100) / 100,
            inboundQty,
            inboundNote: String(line.inboundNote || '').trim().slice(0, 255) || null,
            inboundStage: String(line.inboundStage || '').trim() ? cleanInboundStage(line.inboundStage) : (inboundQty > 0 ? 'ARRIVED' : 'PENDING'),
            inboundAt: inboundQty > 0 ? new Date() : null,
            shipmentImageUrl: String(line.shipmentImageUrl || '').trim().slice(0, 512) || null,
            giftWrapSelected: false,
          },
        })
        changes.push(`${sku.skuCode} 新增加货 x${quantity}`)
        addedCount += 1
      }

      const items = await tx.orderitem.findMany({ where: { orderId: order.id } })
      const subtotal = Math.round(items.reduce((sum, item) => sum + (moneyAmount(item.lineAmount) ?? 0), 0) * 100) / 100
      const discount = carryDiscountAmount(order.subtotalAmount, order.discountAmount, subtotal)
      const shipping = moneyAmount(order.shippingAmount) ?? 0
      const gift = moneyAmount(order.giftWrapAmount) ?? 0
      const total = Math.round(Math.max(0, subtotal - discount + shipping + gift) * 100) / 100
      await tx.orderrecord.update({
        where: { id: order.id },
        data: { subtotalAmount: subtotal, discountAmount: discount, totalAmount: total },
      })
      if (changes.length) {
        await tx.orderoperationlog.create({
          data: {
            orderId: order.id,
            actionType: '客户加货',
            actionNote: changes.join('；').slice(0, 4000),
            operatorName: username,
          },
        })
      }
    })

    const freshOrder = await prisma.orderrecord.findUnique({ where: { id: order.id } })
    const fresh = await prisma.orderitem.findMany({
      where: { orderId: order.id },
      include: {
        product: { select: inboundProductSelect },
        productSku: { select: { imageUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    })
    const amounts = {
      subtotalAmount: freshOrder?.subtotalAmount,
      discountAmount: freshOrder?.discountAmount,
    }
    const lines = fresh.map((item) => mapInboundLine(item, order.currencyCode, amounts)).sort(compareInboundSpu)
    const summary = summarizeInbound(lines)
    return {
      lines,
      orderedQty: summary.orderedQty,
      receivedQty: summary.inboundQty,
      state: summary.state,
      addedCount,
      missingSkus,
      totalAmount: moneyAmount(freshOrder?.totalAmount) ?? 0,
    }
  }),
)



export interface ManualOrderLineInput {
  imageUrl?: string | null
  unitPrice?: number | null
  quantity?: number | null
  costPrice?: number | null
  lineAmount?: number | null
  supplierName?: string | null
  inboundNote?: string | null
  inboundStage?: string | null
  inboundQty?: number | null
}

export interface AppendManualOrderLineInput extends ManualOrderLineInput {
  orderId: string
  lines?: ManualOrderLineInput[]
}

function manualMoney(value: unknown): number | null {
  if (value == null || value === '') return null
  const number = Number(value)
  if (!Number.isFinite(number)) return null
  return Math.round(number * 100) / 100
}

function normalizeManualLine(row: ManualOrderLineInput) {
  const quantity = row.quantity == null || !Number.isFinite(Number(row.quantity)) || Number(row.quantity) <= 0
    ? 1
    : Math.max(1, Math.floor(Number(row.quantity)))
  const unitPrice = manualMoney(row.unitPrice)
  const lineAmount = manualMoney(row.lineAmount)
  const unit = unitPrice != null ? unitPrice : (lineAmount != null ? Math.round((lineAmount / quantity) * 100) / 100 : 0)
  const total = Math.round(unit * quantity * 100) / 100
  const costPrice = manualMoney(row.costPrice)
  const stageText = String(row.inboundStage || 'PENDING').toUpperCase()
  const inboundStage = ['PENDING', 'PREPARING', 'TRANSIT', 'ARRIVED', 'PARCEL', 'STOCK', 'FACTORY'].includes(stageText) ? stageText : 'PENDING'
  const inboundQty = Math.max(0, Math.min(quantity, Math.floor(Number(row.inboundQty) || 0)))
  return {
    quantity,
    unitPrice: unit,
    lineAmount: total,
    costPrice,
    imageUrl: String(row.imageUrl || '').trim().slice(0, 700),
    supplierName: String(row.supplierName || '').trim().slice(0, 160),
    inboundNote: String(row.inboundNote || '').trim().slice(0, 255),
    inboundStage,
    inboundQty,
  }
}

async function insertManualOrderLines(
  tx: any,
  order: { id: string; subtotalAmount?: unknown; discountAmount: unknown; shippingAmount: unknown; giftWrapAmount: unknown },
  categoryId: string,
  rows: ManualOrderLineInput[],
  username: string,
) {
  const notes: string[] = []
  for (const [index, raw] of rows.entries()) {
    const row = normalizeManualLine(raw)
    const code = `ADD-${Date.now().toString(36)}-${index}-${Math.random().toString(36).slice(2, 6)}`.slice(0, 100)
    const addedName = String(row.inboundNote || '').trim().slice(0, 200)
    const product = await tx.product.create({
      data: {
        name: addedName,
        slug: code,
        productCode: code,
        source: 'MANUAL',
        status: 'DRAFT',
        costPrice: row.costPrice,
        supplierName: row.supplierName || null,
        mainImageUrl: row.imageUrl,
        galleryJson: row.imageUrl ? [{ url: row.imageUrl, sort: 1, type: 'image' }] : [],
        category: { connect: { id: categoryId } },
        skus: {
          create: {
            skuCode: code,
            imageUrl: row.imageUrl || null,
            price: row.costPrice ?? 0,
            stock: 0,
            stockStatus: 'IN_STOCK',
            attributeJson: [],
          },
        },
      },
      include: { skus: true },
    })
    const sku = product.skus[0]
    if (!sku) throw new Error('加货行创建失败')
    await tx.orderitem.create({
      data: {
        orderId: order.id,
        productId: product.id,
        productSkuId: sku.id,
        productName: addedName,
        skuCode: code,
        quantity: row.quantity,
        unitPrice: row.unitPrice,
        lineAmount: row.lineAmount,
        inboundQty: row.inboundQty,
        inboundNote: row.inboundNote || null,
        inboundStage: row.inboundStage,
        giftWrapSelected: false,
      },
    })
    notes.push(`x${row.quantity} 售价 ${row.unitPrice} 总价 ${row.lineAmount}`)
  }
  const items = await tx.orderitem.findMany({ where: { orderId: order.id } })
  const subtotal = Math.round(items.reduce((sum: number, item: { lineAmount: unknown }) => sum + (moneyAmount(item.lineAmount) ?? 0), 0) * 100) / 100
  const discount = carryDiscountAmount(order.subtotalAmount, order.discountAmount, subtotal)
  const shipping = moneyAmount(order.shippingAmount) ?? 0
  const gift = moneyAmount(order.giftWrapAmount) ?? 0
  const total = Math.round(Math.max(0, subtotal - discount + shipping + gift) * 100) / 100
  await tx.orderrecord.update({
    where: { id: order.id },
    data: { subtotalAmount: subtotal, discountAmount: discount, totalAmount: total },
  })
  await tx.orderoperationlog.create({
    data: {
      orderId: order.id,
      actionType: '客户加货',
      actionNote: `手动加货 ${notes.join('；')}`.slice(0, 4000),
      operatorName: username,
    },
  })
}

async function inboundLinesAfterGoods(orderId: string, currencyCode: string | null): Promise<UpdateOrderDiscountOutput> {
  const freshOrder = await prisma.orderrecord.findUnique({ where: { id: orderId } })
  const fresh = await prisma.orderitem.findMany({
    where: { orderId },
    include: {
      product: { select: inboundProductSelect },
      productSku: { select: { imageUrl: true } },
    },
    orderBy: { createdAt: 'asc' },
  })
  const subtotalAmount = moneyAmount(freshOrder?.subtotalAmount) ?? 0
  const discountAmount = moneyAmount(freshOrder?.discountAmount) ?? 0
  const lines = fresh.map((item) => mapInboundLine(item, currencyCode, {
    subtotalAmount,
    discountAmount,
  })).sort(compareInboundSpu)
  const summary = summarizeInbound(lines)
  return {
    lines,
    orderedQty: summary.orderedQty,
    receivedQty: summary.inboundQty,
    state: summary.state,
    subtotalAmount,
    discountAmount,
    totalAmount: moneyAmount(freshOrder?.totalAmount) ?? 0,
    discountPercent: subtotalAmount > 0 ? Math.round((discountAmount / subtotalAmount) * 10000) / 100 : 0,
  }
}

/**
 * 不填 SKU，按售价、数量、总价在订单末尾加行。缺的金额可以先空着。
 */
export const appendManualOrderLine = requireRole([UserRole.ADMIN])(
  withResult(async (input: AppendManualOrderLineInput): Promise<UpdateOrderDiscountOutput> => {
    const { username } = getAuthContext()
    const order = await prisma.orderrecord.findUnique({ where: { id: input.orderId } })
    if (!order) throw new Error('订单不存在')
    const category = await prisma.category.findFirst({ select: { id: true }, orderBy: { createdAt: 'asc' } })
    if (!category) throw new Error('没有可用分类，无法保存加货')
    const rows = input.lines?.length ? input.lines : [input]
    await prisma.$transaction(async (tx) => {
      await insertManualOrderLines(tx, order, category.id, rows, username)
    })
    return inboundLinesAfterGoods(order.id, order.currencyCode)
  }),
)

export interface ImportInboundSheetInput {
  orderId: string
  fileName?: string
  fileBase64: string
}

export interface ImportInboundSheetOutput extends UpdateOrderDiscountOutput {
  addedCount: number
}

function sheetCellText(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'object') {
    const record = value as { result?: unknown; text?: unknown; richText?: Array<{ text?: string }> }
    if (record.result != null) return sheetCellText(record.result)
    if (typeof record.text === 'string') return record.text.trim()
    if (Array.isArray(record.richText)) return record.richText.map((part) => part.text || '').join('').trim()
  }
  return String(value).trim()
}

const SHEET_HEADERS: Array<[keyof ManualOrderLineInput | 'sku', string[]]> = [
  ['unitPrice', ['售价', '售价(美金)', '单价']],
  ['quantity', ['数量']],
  ['lineAmount', ['总价', '总价(美金)']],
  ['costPrice', ['成本价', '采购价']],
  ['sku', ['SKU', 'sku', 'Sku']],
  ['inboundNote', ['备注', '入库备注', '说明']],
]

function loadJSZip(): any | null {
  try {
    const exceljsPath = require.resolve('exceljs')
    return require(require.resolve('jszip', { paths: [require('path').dirname(exceljsPath)] }))
  } catch {
    try {
      return require('jszip')
    } catch {
      return null
    }
  }
}

function resolveZipTarget(fromFile: string, target: string) {
  const clean = target.split('?')[0].replace(/\\/g, '/')
  if (clean.startsWith('/')) return clean.replace(/^\/+/, '')
  const dir = fromFile.split('/').slice(0, -1)
  for (const part of clean.split('/')) {
    if (part === '..') dir.pop()
    else if (part && part !== '.') dir.push(part)
  }
  return dir.join('/')
}

type SheetCellImage = { buffer: Buffer; extension: string }

/** WPS 嵌入单元格、Excel 单元格图片、以及画在格子上但没被 exceljs 认到的图。 */
async function embeddedCellImages(raw: Buffer): Promise<{ byRow: Map<number, SheetCellImage>; ordered: SheetCellImage[] }> {
  const byRow = new Map<number, SheetCellImage>()
  const ordered: SheetCellImage[] = []
  const JSZip = loadJSZip()
  if (!JSZip) return { byRow, ordered }
  let zip: { files?: Record<string, { async: (type: string) => Promise<Buffer | string> }>; file: (name: string) => { async: (type: string) => Promise<Buffer | string> } | null }
  try {
    zip = await JSZip.loadAsync(raw)
  } catch {
    return { byRow, ordered }
  }
  const entries = Object.keys(zip.files || {})
  const byLower = new Map(entries.map((name) => [name.toLowerCase(), name]))
  const entry = (name: string) => {
    const hit = byLower.get(name.toLowerCase())
    return hit ? zip.file(hit) : null
  }
  const readMedia = async (filePath: string) => {
    const hit = entry(filePath) || entry(filePath.replace(/^xl\//i, ''))
    if (!hit) return null
    const buffer = Buffer.from(await hit.async('nodebuffer'))
    if (!buffer.length) return null
    const ext = (filePath.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '')
    return { buffer, extension: ext === 'jpeg' ? 'jpg' : ext || 'png' }
  }
  const relMapFrom = (xml: string) => {
    const relMap = new Map<string, string>()
    const re = /<Relationship\b([^>]*)\/?>/g
    let match: RegExpExecArray | null
    while ((match = re.exec(xml))) {
      const id = match[1].match(/\bId="([^"]+)"/)?.[1]
      const target = match[1].match(/\bTarget="([^"]+)"/)?.[1]
      if (id && target) relMap.set(id, target)
    }
    return relMap
  }
  const imageIdIn = (xml: string) => xml.match(/DISPIMG\(\s*(?:&quot;|&#34;|["'“”])([^"'“”&<]+)/i)?.[1]?.trim() || ''
  const remember = (row: number, img: SheetCellImage | null | undefined) => {
    if (!row || !img || byRow.has(row)) return
    byRow.set(row, img)
  }

  const cellImageNames = entries.filter((name) => /(^|\/)cellimages\.xml$/i.test(name) && !/\/_rels\//i.test(name))
  const idToMedia = new Map<string, SheetCellImage>()
  for (const imageName of cellImageNames) {
    const xmlFile = zip.file(imageName)
    const relFile = entry(imageName.replace(/^(.*\/)?([^/]+)$/i, '$1_rels/$2.rels'))
      || entry('xl/_rels/cellimages.xml.rels')
    if (!xmlFile || !relFile) continue
    const xml = String(await xmlFile.async('string'))
    const relMap = relMapFrom(String(await relFile.async('string')))
    const chunks = xml.match(/<[^>]*:?cellImage\b[\s\S]*?<\/[^>]*:?cellImage>/gi) || []
    for (const chunk of chunks) {
      const name = chunk.match(/\b(?:name|descr)="([^"]+)"/i)?.[1]
      const rid = chunk.match(/\br:(?:embed|link)="([^"]+)"/i)?.[1]
      const target = rid ? relMap.get(rid) : ''
      if (!target) continue
      const img = await readMedia(resolveZipTarget(imageName, target))
      if (!img) continue
      ordered.push(img)
      if (name) idToMedia.set(name, img)
    }
  }

  const workbookXml = entry('xl/workbook.xml')
  const workbookRels = entry('xl/_rels/workbook.xml.rels')
  let sheetPath = 'xl/worksheets/sheet1.xml'
  if (workbookXml && workbookRels) {
    const wbXml = String(await workbookXml.async('string'))
    const rid = wbXml.match(/<sheet\b[^>]*\br:id="([^"]+)"/i)?.[1]
    const relMap = relMapFrom(String(await workbookRels.async('string')))
    const target = rid ? relMap.get(rid) : ''
    if (target) sheetPath = resolveZipTarget('xl/workbook.xml', target)
  }
  const sheetFile = entry(sheetPath)
  const sheetXml = sheetFile ? String(await sheetFile.async('string')) : ''
  const sharedFile = entry('xl/sharedStrings.xml')
  const sharedStrings: string[] = []
  if (sharedFile) {
    const sharedXml = String(await sharedFile.async('string'))
    for (const item of sharedXml.match(/<si\b[\s\S]*?<\/si>/g) || []) {
      sharedStrings.push(item.replace(/<[^>]+>/g, ''))
    }
  }
  const formulaRows: number[] = []
  if (sheetXml) {
    const rowRe = /<row\b([^>]*)>([\s\S]*?)<\/row>/g
    let rowMatch: RegExpExecArray | null
    let fallbackRow = 1
    while ((rowMatch = rowRe.exec(sheetXml))) {
      const row = Number(rowMatch[1].match(/\br="(\d+)"/)?.[1] || fallbackRow)
      fallbackRow = row + 1
      const body = rowMatch[2]
      let imageId = imageIdIn(body)
      if (!imageId) {
        const stringIndex = body.match(/\bt="s"[^>]*>[\s\S]*?<v>(\d+)<\/v>/)?.[1]
          || body.match(/<v>(\d+)<\/v>[\s\S]*?\bt="s"/)?.[1]
        if (stringIndex && imageIdIn(sharedStrings[Number(stringIndex)] || '')) imageId = imageIdIn(sharedStrings[Number(stringIndex)] || '')
      }
      const named = imageId ? idToMedia.get(imageId) : undefined
      if (named) {
        remember(row, named)
        formulaRows.push(row)
      } else if (imageId) formulaRows.push(row)
    }
    if (!byRow.size && formulaRows.length && formulaRows.length === ordered.length) {
      formulaRows.forEach((row, index) => remember(row, ordered[index]))
    }
  }

  const metaFile = entry('xl/metadata.xml')
  const richFile = entry('xl/richData/rdrichvalue.xml') || entry('xl/richData/rdRichValue.xml')
  const richRelPath = byLower.get('xl/richdata/richvaluerel.xml') || byLower.get('xl/richdata/rdrichvaluerel.xml') || ''
  const richRelFile = richRelPath ? zip.file(richRelPath) : null
  const richRelRelsFile = entry('xl/richData/_rels/richValueRel.xml.rels') || entry('xl/richData/_rels/rdRichValueRel.xml.rels')
  if (metaFile && richFile && richRelFile && richRelRelsFile && sheetXml && !byRow.size) {
    const meta = String(await metaFile.async('string'))
    const richXml = String(await richFile.async('string'))
    const richRelXml = String(await richRelFile.async('string'))
    const rels = relMapFrom(String(await richRelRelsFile.async('string')))
    const vmToRich: number[] = []
    const vmBlocks = meta.match(/<valueMetadata\b[\s\S]*?<\/valueMetadata>/i)?.[0] || ''
    for (const block of vmBlocks.match(/<bk\b[\s\S]*?<\/bk>/g) || []) {
      const index = block.match(/\bv="(\d+)"/)?.[1]
      vmToRich.push(index == null ? -1 : Number(index))
    }
    const richValues: number[][] = []
    for (const block of richXml.match(/<rv\b[\s\S]*?<\/rv>/g) || []) {
      richValues.push([...block.matchAll(/<v>(\d+)<\/v>/g)].map((item) => Number(item[1])))
    }
    const relIds = [...richRelXml.matchAll(/\br:id="([^"]+)"/g)].map((item) => item[1])
    const mediaByRel: Array<SheetCellImage | null> = []
    for (const id of relIds) {
      const target = rels.get(id)
      const img = target ? await readMedia(resolveZipTarget(richRelPath, target)) : null
      mediaByRel.push(img)
    }
    const richCellRe = /<c\b([^>]*)>/g
    let richCell: RegExpExecArray | null
    while ((richCell = richCellRe.exec(sheetXml))) {
      const vm = richCell[1].match(/\bvm="(\d+)"/)?.[1]
      const ref = richCell[1].match(/\br="[A-Z]+(\d+)"/)
      if (!vm || !ref) continue
      const values = richValues[vmToRich[Number(vm) - 1]] || []
      const relIndex = values.find((value) => value >= 0 && value < mediaByRel.length && mediaByRel[value])
      remember(Number(ref[1]), relIndex == null ? null : mediaByRel[relIndex])
    }
    if (!ordered.length) {
      for (const img of mediaByRel) if (img) ordered.push(img)
    }
  }

  if (!byRow.size) {
    const drawingNames = entries.filter((name) => /xl\/drawings\/drawing[^/]*\.xml$/i.test(name))
    for (const drawingName of drawingNames) {
      const drawingFile = zip.file(drawingName)
      const relName = drawingName.replace(/\/([^/]+)$/, '/_rels/$1.rels')
      const relFile = entry(relName)
      if (!drawingFile || !relFile) continue
      const drawingXml = String(await drawingFile.async('string'))
      const relMap = relMapFrom(String(await relFile.async('string')))
      const anchors = drawingXml.match(/<(?:[^:>]+:)?(?:twoCellAnchor|oneCellAnchor)\b[\s\S]*?<\/(?:[^:>]+:)?(?:twoCellAnchor|oneCellAnchor)>/gi) || []
      const drawingImages: SheetCellImage[] = []
      for (const anchor of anchors) {
        const rowText = anchor.match(/<(?:[^:>]+:)?row>(\d+)<\/(?:[^:>]+:)?row>/i)?.[1]
        const rid = anchor.match(/\br:embed="([^"]+)"/i)?.[1]
        const target = rid ? relMap.get(rid) : ''
        if (rowText == null || !target) continue
        const img = await readMedia(resolveZipTarget(drawingName, target))
        remember(Number(rowText) + 1, img)
        if (img) drawingImages.push(img)
      }
      if (!ordered.length) ordered.push(...drawingImages)
    }
  }
  return { byRow, ordered }
}

/**
 * 导入表格。SKU 可以不填，表头对上售价、数量、总价即可先存入。
 */
export const importInboundSheet = requireRole([UserRole.ADMIN])(
  withResult(async (input: ImportInboundSheetInput): Promise<ImportInboundSheetOutput> => {
    const { username } = getAuthContext()
    const order = await prisma.orderrecord.findUnique({
      where: { id: input.orderId },
      include: { items: true },
    })
    if (!order) throw new Error('订单不存在')
    const raw = Buffer.from(String(input.fileBase64 || ''), 'base64')
    const fileName = String(input.fileName || '')
    const imagesByRow = new Map<number, { buffer?: Buffer | Uint8Array | ArrayBuffer; extension?: string }>()
  const unplacedCellImages: Array<{ buffer: Buffer; extension: string }> = []
    const matrix: string[][] = []
    if (/\.(csv|xls)$/i.test(fileName)) {
      const XLSX = require('xlsx') as { read: Function; utils: { sheet_to_json: Function } }
      const book = XLSX.read(raw, { type: 'buffer' })
      const first = book.Sheets?.[book.SheetNames?.[0]]
      if (!first) throw new Error('表格是空的')
      const aoa = XLSX.utils.sheet_to_json(first, { header: 1, defval: '', raw: false }) as unknown[][]
      for (const line of aoa) matrix.push((line || []).map((cell) => sheetCellText(cell)))
    } else {
      const ExcelJS = loadExcelJS()
      if (!ExcelJS) throw new Error('表格解析不可用')
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(raw)
      const sheet = workbook.worksheets[0]
      if (!sheet) throw new Error('表格是空的')
      for (const image of sheet.getImages?.() || []) {
        const anchor = image?.range?.tl?.nativeRow ?? image?.range?.tl?.row ?? 0
        const row = Math.round(Number(anchor)) + 1
        if (imagesByRow.has(row)) continue
        const media = workbook.getImage(Number(image.imageId))
        if (media?.buffer) imagesByRow.set(row, media)
      }
      const embedded = await embeddedCellImages(raw)
      for (const [row, media] of embedded.byRow) {
        if (!imagesByRow.has(row)) imagesByRow.set(row, media)
      }
      if (!embedded.byRow.size) unplacedCellImages.push(...embedded.ordered)
      const last = Math.max(sheet.rowCount || 1, ...[...imagesByRow.keys(), 1])
      for (let rowNumber = 1; rowNumber <= last; rowNumber += 1) {
        const line: string[] = []
        sheet.getRow(rowNumber).eachCell({ includeEmpty: true }, (cell: { value?: unknown }, col: number) => {
          line[col - 1] = sheetCellText(cell.value)
        })
        matrix.push(line)
      }
    }
    if (!matrix.length) throw new Error('表格是空的')
    let headerRow = 0
    const columns: Partial<Record<keyof ManualOrderLineInput | 'sku', number>> = {}
    for (let index = 0; index < Math.min(matrix.length, 8); index += 1) {
      const found: Partial<Record<keyof ManualOrderLineInput | 'sku', number>> = {}
      matrix[index].forEach((text, col) => {
        const label = String(text || '').trim()
        if (!label) return
        for (const [key, names] of SHEET_HEADERS) {
          if (names.includes(label)) found[key] = col + 1
        }
      })
      if (Object.keys(found).length) {
        headerRow = index + 1
        Object.assign(columns, found)
        break
      }
    }
    if (!headerRow || (columns.unitPrice == null && columns.quantity == null && columns.lineAmount == null)) {
      throw new Error('请让表头包含售价、数量或总价')
    }
    const read = (rowNumber: number, key: keyof ManualOrderLineInput | 'sku') => {
      const col = columns[key]
      if (!col) return ''
      return String(matrix[rowNumber - 1]?.[col - 1] || '').trim()
    }
    const parsed: Array<ManualOrderLineInput & { skuCode: string }> = []
    let emptyRun = 0
    const lastRow = Math.max(matrix.length, ...[...imagesByRow.keys(), headerRow])
    for (let rowNumber = headerRow + 1; rowNumber <= lastRow; rowNumber += 1) {
      const skuCode = read(rowNumber, 'sku')
      const unitText = read(rowNumber, 'unitPrice')
      const quantityText = read(rowNumber, 'quantity')
      const totalText = read(rowNumber, 'lineAmount')
      const costText = read(rowNumber, 'costPrice')
      const noteText = read(rowNumber, 'inboundNote')
      let image = imagesByRow.get(rowNumber)
    if (!image && unplacedCellImages.length && (skuCode || unitText || quantityText || totalText || costText || noteText)) image = unplacedCellImages.shift()
      if (!skuCode && !unitText && !quantityText && !totalText && !costText && !noteText && !image) {
        emptyRun += 1
        if (emptyRun >= 3) break
        continue
      }
      emptyRun = 0
      let imageUrl = ''
      if (image?.buffer) {
        const ext = String(image.extension || 'png').toLowerCase() === 'jpeg' ? 'jpg' : String(image.extension || 'png').toLowerCase()
        const safeExt = ext === 'jpg' || ext === 'png' || ext === 'webp' || ext === 'gif' ? ext : 'png'
        const saved = await saveUploadedImage(Buffer.from(image.buffer), safeExt)
        imageUrl = saved.url
      }
      parsed.push({
        skuCode,
        imageUrl,
        unitPrice: unitText ? Number(unitText) : null,
        quantity: quantityText ? Number(quantityText) : null,
        lineAmount: totalText ? Number(totalText) : null,
        costPrice: costText ? Number(costText) : null,
        inboundNote: noteText || null,
      })
    }
    if (!parsed.length) throw new Error('没有读到商品')
    const category = await prisma.category.findFirst({ select: { id: true }, orderBy: { createdAt: 'asc' } })
    if (!category) throw new Error('没有可用分类，无法保存加货')
    const skuRows = await prisma.productsku.findMany({
      where: { skuCode: { in: parsed.map((row) => row.skuCode).filter(Boolean) } },
      include: { product: { select: { id: true, name: true } } },
    })
    const skuByCode = new Map(skuRows.map((row) => [row.skuCode, row]))
    await prisma.$transaction(async (tx) => {
      const manual: ManualOrderLineInput[] = []
      for (const row of parsed) {
        const known = row.skuCode ? skuByCode.get(row.skuCode) : null
        const existing = row.skuCode ? order.items.find((item) => item.skuCode === row.skuCode) : null
        if (existing) {
          const addQty = row.quantity == null || !Number.isFinite(Number(row.quantity)) || Number(row.quantity) <= 0
            ? 0
            : Math.floor(Number(row.quantity))
          const nextQuantity = Math.max(1, existing.quantity + addQty)
          const unit = manualMoney(row.unitPrice) ?? (moneyAmount(existing.unitPrice) ?? 0)
          await tx.orderitem.update({
            where: { id: existing.id },
            data: {
              quantity: nextQuantity,
              unitPrice: unit,
              lineAmount: manualMoney(row.lineAmount) ?? Math.round(unit * nextQuantity * 100) / 100,
              ...(row.inboundNote ? { inboundNote: String(row.inboundNote).slice(0, 255) } : {}),
            },
          })
          continue
        }
        if (known?.product) {
          const quantity = row.quantity == null || !Number.isFinite(Number(row.quantity)) || Number(row.quantity) <= 0
            ? 1
            : Math.max(1, Math.floor(Number(row.quantity)))
          const unit = manualMoney(row.unitPrice) ?? manualMoney(row.lineAmount) ?? 0
          const total = manualMoney(row.lineAmount) ?? Math.round((unit || 0) * quantity * 100) / 100
          await tx.orderitem.create({
            data: {
              orderId: order.id,
              productId: known.productId,
              productSkuId: known.id,
              productName: String(known.product.name || row.skuCode).slice(0, 200),
              skuCode: known.skuCode,
              materialLabel: known.materialLabel,
              sizeLabel: known.sizeLabel,
              quantity,
              unitPrice: unit || 0,
              lineAmount: total,
              inboundQty: 0,
              inboundStage: 'PENDING',
              inboundNote: row.inboundNote ? String(row.inboundNote).slice(0, 255) : null,
              shipmentImageUrl: row.imageUrl || null,
              giftWrapSelected: false,
            },
          })
          continue
        }
        manual.push(row)
      }
      if (manual.length) await insertManualOrderLines(tx, order, category.id, manual, username)
      else {
        const items = await tx.orderitem.findMany({ where: { orderId: order.id } })
        const subtotal = Math.round(items.reduce((sum: number, item: { lineAmount: unknown }) => sum + (moneyAmount(item.lineAmount) ?? 0), 0) * 100) / 100
        const discount = carryDiscountAmount(order.subtotalAmount, order.discountAmount, subtotal)
        const total = Math.round(Math.max(0, subtotal - discount + (moneyAmount(order.shippingAmount) ?? 0) + (moneyAmount(order.giftWrapAmount) ?? 0)) * 100) / 100
        await tx.orderrecord.update({
          where: { id: order.id },
          data: { subtotalAmount: subtotal, discountAmount: discount, totalAmount: total },
        })
      }
    })
    const result = await inboundLinesAfterGoods(order.id, order.currencyCode)
    return { ...result, addedCount: parsed.length }
  }),
)

export interface ImportCustomerOrderInput {
  email: string
  fileName?: string
  fileBase64: string
  shippingMethod?: string
  weightGrams?: number | null
  orderNote?: string
  status?: OrderStatus
}

export interface ImportCustomerOrderOutput {
  orderId: string
  orderNo: string
  itemCount: number
  totalAmount: number
}

async function readGoodsSheet(fileBase64: string, fileName: string): Promise<Array<ManualOrderLineInput & { skuCode: string }>> {
  const raw = Buffer.from(String(fileBase64 || ''), 'base64')
  const imagesByRow = new Map<number, { buffer?: Buffer | Uint8Array | ArrayBuffer; extension?: string }>()
  const unplacedCellImages: Array<{ buffer: Buffer; extension: string }> = []
  const matrix: string[][] = []
  if (/\.(csv|xls)$/i.test(fileName)) {
    const XLSX = require('xlsx') as { read: Function; utils: { sheet_to_json: Function } }
    const book = XLSX.read(raw, { type: 'buffer' })
    const first = book.Sheets?.[book.SheetNames?.[0]]
    if (!first) throw new Error('表格是空的')
    const aoa = XLSX.utils.sheet_to_json(first, { header: 1, defval: '', raw: false }) as unknown[][]
    for (const line of aoa) matrix.push((line || []).map((cell) => sheetCellText(cell)))
  } else {
    const ExcelJS = loadExcelJS()
    if (!ExcelJS) throw new Error('表格解析不可用')
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(raw)
    const sheet = workbook.worksheets[0]
    if (!sheet) throw new Error('表格是空的')
    for (const image of sheet.getImages?.() || []) {
      const anchor = image?.range?.tl?.nativeRow ?? image?.range?.tl?.row ?? 0
      const row = Math.round(Number(anchor)) + 1
      if (imagesByRow.has(row)) continue
      const media = workbook.getImage(Number(image.imageId))
      if (media?.buffer) imagesByRow.set(row, media)
    }
    const embedded = await embeddedCellImages(raw)
    for (const [row, media] of embedded.byRow) {
      if (!imagesByRow.has(row)) imagesByRow.set(row, media)
    }
    if (!embedded.byRow.size) unplacedCellImages.push(...embedded.ordered)
    const last = Math.max(sheet.rowCount || 1, ...[...imagesByRow.keys(), 1])
    for (let rowNumber = 1; rowNumber <= last; rowNumber += 1) {
      const line: string[] = []
      sheet.getRow(rowNumber).eachCell({ includeEmpty: true }, (cell: { value?: unknown }, col: number) => {
        line[col - 1] = sheetCellText(cell.value)
      })
      matrix.push(line)
    }
  }
  if (!matrix.length) throw new Error('表格是空的')
  let headerRow = 0
  const columns: Partial<Record<keyof ManualOrderLineInput | 'sku', number>> = {}
  for (let index = 0; index < Math.min(matrix.length, 8); index += 1) {
    const found: Partial<Record<keyof ManualOrderLineInput | 'sku', number>> = {}
    matrix[index].forEach((cell, col) => {
      const label = String(cell || '').trim()
      if (!label) return
      for (const [key, names] of SHEET_HEADERS) {
        if (names.includes(label)) found[key] = col + 1
      }
    })
    if (Object.keys(found).length) {
      headerRow = index + 1
      Object.assign(columns, found)
      break
    }
  }
  if (!headerRow || (columns.unitPrice == null && columns.quantity == null && columns.lineAmount == null)) {
    throw new Error('请让表头包含售价、数量或总价')
  }
  const read = (rowNumber: number, key: keyof ManualOrderLineInput | 'sku') => {
    const col = columns[key]
    if (!col) return ''
    return String(matrix[rowNumber - 1]?.[col - 1] || '').trim()
  }
  const parsed: Array<ManualOrderLineInput & { skuCode: string }> = []
  let emptyRun = 0
  const lastRow = Math.max(matrix.length, ...[...imagesByRow.keys(), headerRow])
  for (let rowNumber = headerRow + 1; rowNumber <= lastRow; rowNumber += 1) {
    const skuCode = read(rowNumber, 'sku')
    const unitText = read(rowNumber, 'unitPrice')
    const quantityText = read(rowNumber, 'quantity')
    const totalText = read(rowNumber, 'lineAmount')
    const costText = read(rowNumber, 'costPrice')
    const noteText = read(rowNumber, 'inboundNote')
    let image = imagesByRow.get(rowNumber)
    if (!image && unplacedCellImages.length && (skuCode || unitText || quantityText || totalText || costText || noteText)) image = unplacedCellImages.shift()
    if (!skuCode && !unitText && !quantityText && !totalText && !costText && !noteText && !image) {
      emptyRun += 1
      if (emptyRun >= 3) break
      continue
    }
    emptyRun = 0
    let imageUrl = ''
    if (image?.buffer) {
      const ext = String(image.extension || 'png').toLowerCase() === 'jpeg' ? 'jpg' : String(image.extension || 'png').toLowerCase()
      const safeExt = ext === 'jpg' || ext === 'png' || ext === 'webp' || ext === 'gif' ? ext : 'png'
      const saved = await saveUploadedImage(Buffer.from(image.buffer), safeExt)
      imageUrl = saved.url
    }
    parsed.push({
      skuCode,
      imageUrl,
      unitPrice: unitText ? Number(unitText) : null,
      quantity: quantityText ? Number(quantityText) : null,
      lineAmount: totalText ? Number(totalText) : null,
      costPrice: costText ? Number(costText) : null,
      inboundNote: noteText || null,
    })
  }
  if (!parsed.length) throw new Error('没有读到商品')
  return parsed
}

function shanghaiOrderPrefix(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? ''
  return `BJ${part('year').slice(-2)}${part('month')}${part('day')}`
}

async function withNextOrderNo<T>(tx: { $queryRawUnsafe: Function }, run: (orderNo: string) => Promise<T>): Promise<T> {
  const lockRows = await tx.$queryRawUnsafe(
    'SELECT GET_LOCK(?, 10) AS acquired',
    'orderno_bj_global_seq',
  ) as Array<{ acquired: number | bigint | null }>
  if (Number(lockRows?.[0]?.acquired ?? 0) !== 1) throw new Error('订单号正在分配，请稍后重试')
  try {
    const maxRows = await tx.$queryRawUnsafe(
      `SELECT MAX(CAST(RIGHT(orderNo, 4) AS UNSIGNED)) AS maxSeq
       FROM orderrecord
       WHERE orderNo REGEXP '^BJ[0-9]{10}$'`,
    ) as Array<{ maxSeq: number | bigint | null }>
    const nextSeq = Number(maxRows?.[0]?.maxSeq ?? 0) + 1
    if (!Number.isFinite(nextSeq) || nextSeq > 9999) throw new Error('订单号序号已满')
    return await run(`${shanghaiOrderPrefix()}${String(nextSeq).padStart(4, '0')}`)
  } finally {
    await tx.$queryRawUnsafe('SELECT RELEASE_LOCK(?)', 'orderno_bj_global_seq')
  }
}

const IMPORT_ORDER_STATUSES: OrderStatus[] = ['PENDING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED']

/**
 * 按客户邮箱导入一张订单。表格不要求 SKU，表头对上售价、数量、总价即可。
 * 订单号按 BJ + 当天日期 + 全局递增序号生成。客户登录该邮箱后能在我的订单里看到。
 */
export const importCustomerOrder = requireRole([UserRole.ADMIN])(
  withResult(async (input: ImportCustomerOrderInput): Promise<ImportCustomerOrderOutput> => {
    const { username } = getAuthContext()
    const email = String(input.email || '').trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('请填写客户邮箱')
    const users = await prisma.$queryRawUnsafe(
      'SELECT id, status FROM sysuser WHERE LOWER(email) = ? LIMIT 1',
      email,
    ) as Array<{ id: string; status: string }>
    const user = users[0]
    if (!user) throw new Error('没有这个客户邮箱，请让客户先用这个邮箱注册')
    if (String(user.status || '').toUpperCase() !== 'ACTIVE') throw new Error('这个客户账号已停用')
    const status = IMPORT_ORDER_STATUSES.includes(input.status as OrderStatus) ? input.status as OrderStatus : 'PROCESSING'
    const parsed = await readGoodsSheet(String(input.fileBase64 || ''), String(input.fileName || ''))
    const category = await prisma.category.findFirst({ select: { id: true }, orderBy: { createdAt: 'asc' } })
    if (!category) throw new Error('没有可用分类，无法保存订单')
    const skuRows = await prisma.productsku.findMany({
      where: { skuCode: { in: parsed.map((row) => row.skuCode).filter(Boolean) } },
      include: { product: { select: { id: true, name: true } } },
    })
    const skuByCode = new Map(skuRows.map((row) => [row.skuCode, row]))
    const shippingText = String(input.shippingMethod || '').trim().slice(0, 255)
    const note = String(input.orderNote || '').trim().slice(0, 4000)
    const weight = input.weightGrams == null || !Number.isFinite(Number(input.weightGrams)) || Number(input.weightGrams) <= 0
      ? 0
      : Math.round(Number(input.weightGrams) * 100) / 100
    const created = await prisma.$transaction(async (tx) => withNextOrderNo(tx, async (orderNo) => {
      const order = await tx.orderrecord.create({
        data: {
          orderNo,
          userId: user.id,
          status,
          currencyCode: 'USD',
          localeCode: 'en',
          subtotalAmount: 0,
          discountAmount: 0,
          shippingAmount: 0,
          giftWrapAmount: 0,
          totalAmount: 0,
          paymentMethod: 'BANK_TRANSFER',
          paymentStatus: status === 'PENDING_PAYMENT' ? 'UNPAID' : 'PAID',
          shipMethod: 'STANDARD',
          trackingCarrier: shippingText || null,
          internalNote: note || null,
        },
      })
      const manual: ManualOrderLineInput[] = []
      for (const row of parsed) {
        const known = row.skuCode ? skuByCode.get(row.skuCode) : null
        if (known?.product) {
          const quantity = row.quantity == null || !Number.isFinite(Number(row.quantity)) || Number(row.quantity) <= 0
            ? 1
            : Math.max(1, Math.floor(Number(row.quantity)))
          const unit = manualMoney(row.unitPrice) ?? manualMoney(row.lineAmount) ?? 0
          const total = manualMoney(row.lineAmount) ?? Math.round((unit || 0) * quantity * 100) / 100
          await tx.orderitem.create({
            data: {
              orderId: order.id,
              productId: known.productId,
              productSkuId: known.id,
              productName: String(known.product.name || row.skuCode).slice(0, 200),
              skuCode: known.skuCode,
              materialLabel: known.materialLabel,
              sizeLabel: known.sizeLabel,
              quantity,
              unitPrice: unit || 0,
              lineAmount: total,
              inboundQty: 0,
              inboundStage: 'PENDING',
              shipmentImageUrl: row.imageUrl || null,
              giftWrapSelected: false,
            },
          })
          continue
        }
        manual.push(row)
      }
      if (manual.length) await insertManualOrderLines(tx, order, category.id, manual, username)
      else {
        const items = await tx.orderitem.findMany({ where: { orderId: order.id } })
        const subtotal = Math.round(items.reduce((sum: number, item: { lineAmount: unknown }) => sum + (moneyAmount(item.lineAmount) ?? 0), 0) * 100) / 100
        await tx.orderrecord.update({
          where: { id: order.id },
          data: { subtotalAmount: subtotal, totalAmount: subtotal },
        })
      }
      if (weight > 0) {
        const items = await tx.orderitem.findMany({ where: { orderId: order.id }, orderBy: { createdAt: 'asc' } })
        const carrier = items.find((item) => String(item.skuCode || '').startsWith('ADD-'))
        if (carrier) {
          await tx.product.update({
            where: { id: carrier.productId },
            data: { weightGram: Math.round((weight / Math.max(1, carrier.quantity)) * 100) / 100 },
          })
        }
      }
      const fresh = await tx.orderrecord.findUnique({ where: { id: order.id }, include: { items: true } })
      await tx.orderoperationlog.create({
        data: {
          orderId: order.id,
          actionType: '导入订单',
          actionNote: `邮箱 ${email}，${fresh?.items.length || 0} 行`.slice(0, 4000),
          operatorName: username,
        },
      })
      return {
        orderId: order.id,
        orderNo,
        itemCount: (fresh?.items || []).reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0),
        totalAmount: moneyAmount(fresh?.totalAmount) ?? 0,
      }
    }))
    return created
  }),
)

export interface InboundShipmentBlockInput {
  shippedAt: string
  trackingNumber?: string
  channel?: string
  note?: string
  images?: string[]
}

export interface SaveInboundShipmentInput {
  orderId: string
  /** 一块对应一次发货。旧的 shippedAt + legs 仍可用。 */
  blocks?: InboundShipmentBlockInput[]
  shippedAt?: string
  legs?: Array<{ trackingNumber?: string; channel?: string; note?: string }>
}

export interface InboundShipmentRow {
  id: string
  shippedAt: string
  trackingNumber: string
  channel: string
  note: string
  images: string[]
}

const INBOUND_SHIP_SEGMENT = '入库发货'

function parseShanghaiDateTime(value: string): Date {
  const text = String(value || '').trim()
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(text)
  if (!match) throw new Error('请填写发货日期')
  const date = new Date(`${match[1]}-${match[2]}-${match[3]}T${match[4] || '00'}:${match[5] || '00'}:00+08:00`)
  if (Number.isNaN(date.getTime())) throw new Error('请填写发货日期')
  return date
}

async function listInboundShipmentRows(orderId: string): Promise<InboundShipmentRow[]> {
  const rows = await prisma.orderlogisticssegment.findMany({
    where: { orderId, segmentType: INBOUND_SHIP_SEGMENT },
    orderBy: [{ shippedAt: 'asc' }, { createdAt: 'asc' }],
  })
  return rows.map((row) => {
    const timeline = Array.isArray(row.timelineJson) ? row.timelineJson : []
    const images = timeline.map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return ''
      return String((item as { imageUrl?: unknown }).imageUrl || '')
    }).filter(Boolean)
    return {
      id: row.id,
      shippedAt: row.shippedAt ? row.shippedAt.toISOString() : '',
      trackingNumber: String(row.trackingNumber || ''),
      channel: String(row.carrierName || ''),
      note: String(row.remark || ''),
      images,
    }
  })
}

export const listInboundShipments = requireRole([UserRole.ADMIN])(
  withResult(async (orderId: string): Promise<InboundShipmentRow[]> => {
    if (!orderId) return []
    return listInboundShipmentRows(orderId)
  }),
)

/**
 * 登记一次发货。发货时间必填。同一时间可以有多组物流号、渠道、备注。
 */
export const saveInboundShipment = requireRole([UserRole.ADMIN])(
  withResult(async (input: SaveInboundShipmentInput): Promise<InboundShipmentRow[]> => {
    const { username } = getAuthContext()
    const order = await prisma.orderrecord.findUnique({ where: { id: input.orderId }, select: { id: true } })
    if (!order) throw new Error('订单不存在')
    const blocks = (input.blocks?.length ? input.blocks : (input.legs || [{}]).map((leg) => ({
      shippedAt: input.shippedAt,
      trackingNumber: leg?.trackingNumber,
      channel: leg?.channel,
      note: leg?.note,
      images: [],
    }))).map((block) => ({
      shippedAt: parseShanghaiDateTime(String(block?.shippedAt || '')),
      shippedAtText: String(block?.shippedAt || ''),
      trackingNumber: String(block?.trackingNumber || '').trim().slice(0, 120),
      channel: String(block?.channel || '').trim().slice(0, 100),
      note: String(block?.note || '').trim().slice(0, 2000),
      images: (block?.images || []).map((url) => String(url || '').trim()).filter(Boolean).slice(0, 12),
    }))
    await prisma.$transaction(async (tx) => {
      for (const block of blocks) {
        await tx.orderlogisticssegment.create({
          data: {
            orderId: order.id,
            segmentType: INBOUND_SHIP_SEGMENT,
            carrierName: block.channel || null,
            trackingNumber: block.trackingNumber || null,
            statusLabel: '已发货',
            shippedAt: block.shippedAt,
            remark: block.note || null,
            timelineJson: block.images.map((imageUrl) => ({ time: block.shippedAt.toISOString(), label: '发货图片', imageUrl })),
          },
        })
      }
      await tx.orderoperationlog.create({
        data: {
          orderId: order.id,
          actionType: '入库发货',
          actionNote: `登记 ${blocks.length} 批发货`.slice(0, 4000),
          operatorName: username,
        },
      })
    })
    return listInboundShipmentRows(order.id)
  }),
)

export interface UpdateInboundShipmentInput {
  orderId: string
  id: string
  shippedAt: string
  trackingNumber?: string
  channel?: string
  note?: string
  images?: string[]
}

/** 改一条已经保存的发货记录。 */
export const updateInboundShipment = requireRole([UserRole.ADMIN])(
  withResult(async (input: UpdateInboundShipmentInput): Promise<InboundShipmentRow[]> => {
    const { username } = getAuthContext()
    const order = await prisma.orderrecord.findUnique({ where: { id: input.orderId }, select: { id: true } })
    if (!order) throw new Error('订单不存在')
    const existing = await prisma.orderlogisticssegment.findFirst({
      where: { id: input.id, orderId: order.id, segmentType: INBOUND_SHIP_SEGMENT },
      select: { id: true },
    })
    if (!existing) throw new Error('发货记录不存在')
    const shippedAt = parseShanghaiDateTime(String(input.shippedAt || ''))
    const images = (input.images || []).map((url) => String(url || '').trim()).filter(Boolean).slice(0, 12)
    await prisma.$transaction(async (tx) => {
      await tx.orderlogisticssegment.update({
        where: { id: existing.id },
        data: {
          carrierName: String(input.channel || '').trim().slice(0, 100) || null,
          trackingNumber: String(input.trackingNumber || '').trim().slice(0, 120) || null,
          shippedAt,
          remark: String(input.note || '').trim().slice(0, 2000) || null,
          timelineJson: images.map((imageUrl) => ({ time: shippedAt.toISOString(), label: '发货图片', imageUrl })),
        },
      })
      await tx.orderoperationlog.create({
        data: {
          orderId: order.id,
          actionType: '入库发货',
          actionNote: '修改发货记录',
          operatorName: username,
        },
      })
    })
    return listInboundShipmentRows(order.id)
  }),
)

export interface UpdateManualOrderLineInput {
  orderId: string
  orderItemId: string
  unitPrice?: number | null
  quantity?: number | null
  lineAmount?: number | null
  costPrice?: number | null
  supplierName?: string | null
  productName?: string | null
}

/**
 * 补手动加货行的售价、数量、总价、成本价，并重算订单金额。
 */
export const updateManualOrderLine = requireRole([UserRole.ADMIN])(
  withResult(async (input: UpdateManualOrderLineInput): Promise<UpdateOrderDiscountOutput> => {
    const order = await prisma.orderrecord.findUnique({ where: { id: input.orderId } })
    if (!order) throw new Error('订单不存在')
    const item = await prisma.orderitem.findFirst({ where: { id: input.orderItemId, orderId: order.id } })
    if (!item) throw new Error('订单商品不存在')
    const quantity = input.quantity == null || !Number.isFinite(Number(input.quantity)) || Number(input.quantity) <= 0
      ? Math.max(1, item.quantity)
      : Math.max(1, Math.floor(Number(input.quantity)))
    const statedUnit = input.unitPrice === undefined ? (moneyAmount(item.unitPrice) ?? 0) : manualMoney(input.unitPrice)
    const unitPrice = statedUnit ?? 0
    const lineAmount = Math.round(unitPrice * quantity * 100) / 100
    const costPrice = input.costPrice === undefined ? undefined : manualMoney(input.costPrice)
    await prisma.$transaction(async (tx) => {
      await tx.orderitem.update({
        where: { id: item.id },
        data: {
          quantity,
          unitPrice,
          lineAmount,
          inboundQty: Math.min(Math.max(0, Number(item.inboundQty) || 0), quantity),
          ...(input.productName !== undefined ? { productName: String(input.productName || '').trim().slice(0, 200) } : {}),
        },
      })
      if (costPrice !== undefined) {
        await tx.product.update({ where: { id: item.productId }, data: { costPrice } })
        if (String(item.skuCode || '').startsWith('ADD-')) {
          await tx.productsku.update({ where: { id: item.productSkuId }, data: { price: costPrice ?? 0 } })
        }
      }
      if (input.supplierName !== undefined) {
        await tx.product.update({
          where: { id: item.productId },
          data: { supplierName: String(input.supplierName || '').trim().slice(0, 160) || null },
        })
      }
      const items = await tx.orderitem.findMany({ where: { orderId: order.id } })
      const subtotal = Math.round(items.reduce((sum: number, row: { lineAmount: unknown }) => sum + (moneyAmount(row.lineAmount) ?? 0), 0) * 100) / 100
      const discount = carryDiscountAmount(order.subtotalAmount, order.discountAmount, subtotal)
      const total = Math.round(Math.max(0, subtotal - discount + (moneyAmount(order.shippingAmount) ?? 0) + (moneyAmount(order.giftWrapAmount) ?? 0)) * 100) / 100
      await tx.orderrecord.update({
        where: { id: order.id },
        data: { subtotalAmount: subtotal, discountAmount: discount, totalAmount: total },
      })
    })
    return inboundLinesAfterGoods(order.id, order.currencyCode)
  }),
)


export const deleteInboundLines = requireRole([UserRole.ADMIN])(
  withResult(async (input: { orderId: string; lineIds: string[] }): Promise<UpdateOrderDiscountOutput> => {
    const order = await prisma.orderrecord.findUnique({
      where: { id: input.orderId },
      include: { items: { select: { id: true } } },
    })
    if (!order) throw new Error('订单不存在')
    const ids = [...new Set((input.lineIds || []).map((id) => String(id || '').trim()).filter(Boolean))]
      .filter((id) => order.items.some((item) => item.id === id))
    if (!ids.length) throw new Error('请先勾选商品')
    await prisma.$transaction(async (tx) => {
      await tx.orderitem.deleteMany({ where: { orderId: order.id, id: { in: ids } } })
      const items = await tx.orderitem.findMany({ where: { orderId: order.id } })
      const subtotal = Math.round(items.reduce((sum: number, row: { lineAmount: unknown }) => sum + (moneyAmount(row.lineAmount) ?? 0), 0) * 100) / 100
      const discount = carryDiscountAmount(order.subtotalAmount, order.discountAmount, subtotal)
      const total = Math.round(Math.max(0, subtotal - discount + (moneyAmount(order.shippingAmount) ?? 0) + (moneyAmount(order.giftWrapAmount) ?? 0)) * 100) / 100
      await tx.orderrecord.update({
        where: { id: order.id },
        data: { subtotalAmount: subtotal, discountAmount: discount, totalAmount: total },
      })
    })
    return inboundLinesAfterGoods(order.id, order.currencyCode)
  }),
)

export interface UpdateOrderDiscountInput {
  orderId: string
  /** 0 to 100. 3 means the order is discounted by 3 percent. */
  discountPercent: number
}

export interface UpdateOrderDiscountOutput extends UpdateOrderInboundOutput {
  subtotalAmount: number
  discountAmount: number
  totalAmount: number
  discountPercent: number
}

/**
 * 修改整单折扣百分比。折扣价按新的优惠比例重算。
 */
export const updateOrderDiscount = requireRole([UserRole.ADMIN])(
  withResult(async (input: UpdateOrderDiscountInput): Promise<UpdateOrderDiscountOutput> => {
    const { username } = getAuthContext()
    const order = await prisma.orderrecord.findUnique({ where: { id: input.orderId } })
    if (!order) throw new Error('订单不存在')
    const percent = Math.min(100, Math.max(0, Number(input.discountPercent) || 0))
    const subtotal = moneyAmount(order.subtotalAmount) ?? 0
    const discount = Math.round(subtotal * percent) / 100
    const shipping = moneyAmount(order.shippingAmount) ?? 0
    const gift = moneyAmount(order.giftWrapAmount) ?? 0
    const total = Math.round(Math.max(0, subtotal - discount + shipping + gift) * 100) / 100
    const previous = moneyAmount(order.discountAmount) ?? 0
    await prisma.$transaction(async (tx) => {
      await tx.orderrecord.update({
        where: { id: order.id },
        data: { discountAmount: discount, totalAmount: total },
      })
      await tx.orderoperationlog.create({
        data: {
          orderId: order.id,
          actionType: '修改折扣',
          actionNote: `折扣 ${percent}% ，优惠 ${previous} -> ${discount}`.slice(0, 4000),
          operatorName: username,
        },
      })
    })
    const fresh = await prisma.orderitem.findMany({
      where: { orderId: order.id },
      include: {
        product: { select: inboundProductSelect },
        productSku: { select: { imageUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    })
    const lines = fresh.map((item) => mapInboundLine(item, order.currencyCode, {
      subtotalAmount: subtotal,
      discountAmount: discount,
    })).sort(compareInboundSpu)
    const summary = summarizeInbound(lines)
    return {
      lines,
      orderedQty: summary.orderedQty,
      receivedQty: summary.inboundQty,
      state: summary.state,
      subtotalAmount: subtotal,
      discountAmount: discount,
      totalAmount: total,
      discountPercent: percent,
    }
  }),
)

/**
 * 更新订单内部备注（列表行内编辑）
 */
export const updateOrderRemark = requireRole([UserRole.ADMIN])(
  withResult(async (input: UpdateOrderRemarkInput): Promise<void> => {
    const { username } = getAuthContext()
    const order = await prisma.orderrecord.findUnique({ where: { id: input.orderId } })
    if (!order) throw new Error('订单不存在')

    await prisma.$transaction(async (tx) => {
      await tx.orderrecord.update({
        where: { id: input.orderId },
        data: { internalNote: input.internalNote }
      })
      await tx.orderoperationlog.create({
        data: {
          orderId: input.orderId,
          actionType: '更新订单备注',
          actionNote: input.internalNote?.trim() ? `备注更新为：${input.internalNote}` : '清空订单备注',
          operatorName: username
        }
      })
    })
  })
)

const toUsdAmount = (amount: number, currencyCode: string | null | undefined, usdExchangeRate: number) => {
  if (!Number.isFinite(amount)) return 0
  const code = String(currencyCode || 'USD').toUpperCase()
  if (code === 'USD') return Math.round(amount * 100) / 100
  if (code === 'CNY' || code === 'RMB') return toUsdFromCny(amount, usdExchangeRate)
  return Math.round(amount * 100) / 100
}

function resolveExportUnitPricesUsd(params: {
  unitPrice: number
  currencyCode: string | null | undefined
  usdExchangeRate: number
  skuPriceCny?: number | null
  skuOriginalCny?: number | null
  orderDiscountUsd?: number | null
}): { originalPriceUsd: number; discountPriceUsd: number } {
  const paidUsd = toUsdAmount(params.unitPrice, params.currencyCode, params.usdExchangeRate)
  const orderDiscountUsd = Number(params.orderDiscountUsd || 0)
  const skuPriceCny = params.skuPriceCny != null ? Number(params.skuPriceCny) : null
  const skuOriginalCny = params.skuOriginalCny != null ? Number(params.skuOriginalCny) : null
  const listUsd =
    skuPriceCny != null && Number.isFinite(skuPriceCny)
      ? toUsdFromCny(skuPriceCny, params.usdExchangeRate)
      : paidUsd
  const originalUsd =
    skuOriginalCny != null && Number.isFinite(skuOriginalCny)
      ? toUsdFromCny(skuOriginalCny, params.usdExchangeRate)
      : null
  // No live campaign: SKU originalPrice is often list*1.1 from import, not a sale.
  if (!(orderDiscountUsd > 0.009)) {
    return { originalPriceUsd: paidUsd, discountPriceUsd: paidUsd }
  }
  if (
    originalUsd != null &&
    (isPlaceholderCompareAt(paidUsd, originalUsd) || isPlaceholderCompareAt(listUsd, originalUsd))
  ) {
    return { originalPriceUsd: paidUsd, discountPriceUsd: paidUsd }
  }
  const realCompareAt = resolveListedCompareAt(listUsd, originalUsd)
  return {
    originalPriceUsd: realCompareAt ?? paidUsd,
    discountPriceUsd: paidUsd,
  }
}

function firstGalleryUrl(galleryJson: unknown): string {
  if (!Array.isArray(galleryJson)) return ''
  for (const entry of galleryJson) {
    if (typeof entry === 'string' && entry.trim()) return entry.trim()
    if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
      const url = String((entry as Record<string, unknown>).url || (entry as Record<string, unknown>).src || '').trim()
      if (url) return url
    }
  }
  return ''
}

function preferExcelThumbUrl(url: string): string {
  const normalized = String(url || '').trim()
  if (!normalized || normalized.startsWith('/') || normalized.startsWith('data:')) return normalized
  try {
    const parsed = new URL(normalized)
    const host = parsed.hostname.toLowerCase()
    if (host.includes('alicdn.com')) {
      const pathName = parsed.pathname
      if (!/_\d+x\d+/.test(pathName) && /\.(jpe?g|png|webp)$/i.test(pathName)) {
        parsed.pathname = `${pathName}_240x240q90.jpg`
      }
    }
    return parsed.toString()
  } catch {
    return normalized
  }
}

function magicImageKind(buf: Buffer): 'jpeg' | 'png' | 'gif' | 'webp' | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg'
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png'
  if (buf.length >= 6 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'gif'
  if (
    buf.length >= 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'webp'
  }
  return null
}

async function toExcelEmbedImage(buffer: Buffer): Promise<{ buffer: Buffer; extension: 'png' | 'jpeg' | 'gif' } | null> {
  try {
    const sharp = (await import('sharp')).default
    const jpeg = await sharp(buffer)
      .rotate()
      .resize({ width: 240, height: 240, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer()
    return { buffer: jpeg, extension: 'jpeg' }
  } catch {
    const kind = magicImageKind(buffer)
    if (kind === 'jpeg' || kind === 'png' || kind === 'gif') {
      if (buffer.length > 1_200_000) return null
      return { buffer, extension: kind === 'jpeg' ? 'jpeg' : kind }
    }
    return null
  }
}

async function readLocalUploadBuffer(url: string): Promise<Buffer | null> {
  const text = String(url || '').trim()
  let rel = ''
  if (text.startsWith('/api/uploads/')) rel = text.slice('/api/uploads/'.length)
  else {
    try {
      const parsed = new URL(text)
      if (parsed.pathname.startsWith('/api/uploads/')) {
        rel = parsed.pathname.slice('/api/uploads/'.length)
      }
    } catch {
      return null
    }
  }
  if (!rel) return null
  const { readFile } = await import('node:fs/promises')
  const path = await import('node:path')
  const root = path.resolve(String(process.env.UPLOAD_DIR || '').trim() || path.join(process.cwd(), 'uploads'))
  const target = path.resolve(root, ...rel.split('/').filter(Boolean))
  if (target !== root && !target.startsWith(root + path.sep)) return null
  try {
    return await readFile(target)
  } catch {
    return null
  }
}

async function tryFetchImageBuffer(url: string): Promise<{ buffer: Buffer; extension: 'png' | 'jpeg' | 'gif' } | null> {
  const normalized = String(url || '').trim()
  if (!normalized || normalized.startsWith('data:')) return null
  try {
    const local = await readLocalUploadBuffer(normalized)
    if (local) return toExcelEmbedImage(local)

    const requestUrl = normalized.startsWith('/')
      ? new URL(
          preferExcelThumbUrl(normalized),
          process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://sourcingjewelry.com',
        ).toString()
      : preferExcelThumbUrl(normalized)
    const res = await fetch(requestUrl, {
      cache: 'no-store',
      headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://www.1688.com/' },
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return null
    const ab = await res.arrayBuffer()
    if (ab.byteLength > 4_000_000) return null
    return toExcelEmbedImage(Buffer.from(ab))
  } catch {
    return null
  }
}

function loadExcelJS(): any | null {
  try {
    const loaded = require('exceljs') as { default?: unknown } | undefined
    return (loaded as { default?: unknown })?.default || loaded || null
  } catch {
    return null
  }
}

const cleanExcelText = (value: unknown) => String(value ?? '').trim()
const containsChinese = (value: string) => /[\u3400-\u9fff]/.test(value)

function readProductTranslationName(value: unknown, lang: string): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return ''
  const root = value as Record<string, unknown>
  const languageValue = root[lang]
  if (languageValue && typeof languageValue === 'object' && !Array.isArray(languageValue)) {
    return cleanExcelText((languageValue as Record<string, unknown>).name)
  }
  return ''
}

function readPreviewProductName(value: unknown): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return ''
  return cleanExcelText((value as Record<string, unknown>).name)
}

function resolveChineseExportProductName(params: {
  productNameSnapshot?: string | null
  product?: {
    name?: string | null
    translationsJson?: unknown
    importTaskItems?: Array<{ parsedName?: string | null; previewDataJson?: unknown }>
  } | null
}): string {
  const product = params.product
  const candidates = [
    readProductTranslationName(product?.translationsJson, 'zh'),
    ...(product?.importTaskItems || []).flatMap((row) => [
      cleanExcelText(row.parsedName),
      readPreviewProductName(row.previewDataJson),
    ]),
    cleanExcelText(params.productNameSnapshot),
    cleanExcelText(product?.name),
  ].filter(Boolean)

  return candidates.find(containsChinese) || candidates[0] || ''
}

function resolveSkuSpecification(params: {
  attributeJson?: unknown
  materialLabel?: string | null
  sizeLabel?: string | null
  itemMaterialLabel?: string | null
  itemSizeLabel?: string | null
}): string {
  const attributes = Array.isArray(params.attributeJson)
    ? params.attributeJson
        .map((entry) => {
          if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null
          const row = entry as Record<string, unknown>
          const name = cleanExcelText(row.name || row.label || row.key)
          const value = cleanExcelText(row.value || row.labelValue)
          return value ? { name, value } : null
        })
        .filter((entry): entry is { name: string; value: string } => Boolean(entry))
    : []

  const colorPattern = /颜色|顏色|color|colour|款式|style/i
  const sizePattern = /尺寸|尺码|規格|规格|size|length|长度|長度/i
  const color = attributes.find((entry) => colorPattern.test(entry.name))?.value
    || cleanExcelText(params.itemMaterialLabel)
    || cleanExcelText(params.materialLabel)
  const size = attributes.find((entry) => sizePattern.test(entry.name))?.value
    || cleanExcelText(params.itemSizeLabel)
    || cleanExcelText(params.sizeLabel)
  const otherValues = attributes
    .filter((entry) => !colorPattern.test(entry.name) && !sizePattern.test(entry.name))
    .map((entry) => entry.value)

  const values = [color, size, ...otherValues]
    .map(cleanExcelText)
    .filter((value, index, all) => Boolean(value) && all.indexOf(value) === index)
  return values.join('-') || '默认规格'
}


/** 采购表：同一 SPU 的规格排在一起。组的先后按该 SPU 第一次出现的位置。 */
function groupExcelRowsBySpu(rows: OrderExcelExportRow[]): OrderExcelExportRow[] {
  const groups = new Map<string, OrderExcelExportRow[]>()
  const order: string[] = []
  for (const row of rows) {
    const spu = String(row.spu || '').trim().toLowerCase()
    const productId = String(row.productId || '').trim().toLowerCase()
    const key = spu || productId || `__empty_${order.length}`
    let bucket = groups.get(key)
    if (!bucket) {
      bucket = []
      groups.set(key, bucket)
      order.push(key)
    }
    bucket.push(row)
  }
  const grouped: OrderExcelExportRow[] = []
  for (const key of order) grouped.push(...(groups.get(key) || []))
  return grouped
}

async function buildOrderExcelRows(orderIdsInput: string[]): Promise<ExportOrdersExcelOutput> {
  const orderIds = Array.from(new Set((orderIdsInput || []).filter(Boolean)))
  if (!orderIds.length) throw new Error('请至少选择一笔订单')

  const [usdExchangeRate, orders] = await Promise.all([
    getUsdExchangeRate(prisma),
    prisma.orderrecord.findMany({
      where: { id: { in: orderIds } },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                productCode: true,
                mainImageUrl: true,
                galleryJson: true,
                costPrice: true,
                supplierName: true,
                source: true,
                name: true,
                translationsJson: true,
                // product 表无 sourceUrl；1688 链接在 importtaskitem.sourceUrl
                importTaskItems: {
                  select: {
                    sourceUrl: true,
                    parsedName: true,
                    previewDataJson: true,
                  },
                  orderBy: { publishedAt: 'desc' },
                  take: 5,
                },
              },
            },
            productSku: {
              select: {
                skuCode: true,
                imageUrl: true,
                attributeJson: true,
                materialLabel: true,
                sizeLabel: true,
                price: true,
                originalPrice: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  if (!orders.length) {
    throw new Error('未找到所选订单，请刷新列表后重试')
  }

  const rows: OrderExcelExportRow[] = []
  for (const order of orders) {
    for (const item of order.items) {
      const unitPrice = item.unitPrice.toNumber()
      const lineAmount = item.lineAmount.toNumber()
      const skuOriginal = item.productSku?.originalPrice != null ? Number(item.productSku.originalPrice) : null
      const skuPrice = item.productSku?.price != null ? Number(item.productSku.price) : null
      // SKU price fields are always CNY; order item snapshots use the order currency.
      const { originalPriceUsd, discountPriceUsd } = resolveExportUnitPricesUsd({
        unitPrice,
        currencyCode: order.currencyCode,
        usdExchangeRate,
        skuPriceCny: skuPrice,
        skuOriginalCny: skuOriginal,
        orderDiscountUsd: toUsdAmount(
          order.discountAmount != null ? Number(order.discountAmount) : 0,
          order.currencyCode,
          usdExchangeRate,
        ),
      })
      const totalPriceUsd = toUsdAmount(lineAmount, order.currencyCode, usdExchangeRate)
      const importSourceUrl =
        item.product?.importTaskItems?.find((row) => /1688\.com/i.test(String(row.sourceUrl || '')))?.sourceUrl ||
        item.product?.importTaskItems?.[0]?.sourceUrl ||
        ''
      const supplierUrl =
        item.product?.source === 'IMPORT_1688' || /1688\.com/i.test(importSourceUrl) ? importSourceUrl : ''

      rows.push({
        productId: item.productId,
        sku: resolveSkuSpecification({
          attributeJson: item.productSku?.attributeJson,
          materialLabel: item.productSku?.materialLabel,
          sizeLabel: item.productSku?.sizeLabel,
          itemMaterialLabel: item.materialLabel,
          itemSizeLabel: item.sizeLabel,
        }),
        spu: item.product?.productCode || String(item.skuCode || '').split('-')[0] || '',
        imageUrl:
          item.productSku?.imageUrl ||
          item.product?.mainImageUrl ||
          firstGalleryUrl((item.product as { galleryJson?: unknown } | null)?.galleryJson) ||
          '',
        originalPriceUsd,
        discountPriceUsd,
        quantity: item.quantity,
        totalPriceUsd,
        costPrice: item.product?.costPrice != null ? Number(item.product.costPrice) : null,
        supplierName: item.product?.supplierName || '',
        supplierUrl,
        productName: resolveChineseExportProductName({
          productNameSnapshot: item.productName,
          product: item.product,
        }),
        orderNo: order.orderNo,
        inboundQty: clampInboundQty(item.quantity, Number(item.inboundQty) || 0),
        inboundNote: String(item.inboundNote || ''),
      })
    }
  }

  if (!rows.length) {
    // 常见：勾选了订单但明细为空 / 关联商品缺失导致 include 失败前被吞掉
    // 再兜底用 orderitem 快照直查，避免导出只有表头的空表
    const fallbackItems = await prisma.orderitem.findMany({
      where: { orderId: { in: orderIds } },
      include: {
        order: { select: { orderNo: true, currencyCode: true, discountAmount: true } },
        product: {
          select: {
            productCode: true,
            mainImageUrl: true,
            galleryJson: true,
            costPrice: true,
            supplierName: true,
            name: true,
            translationsJson: true,
          },
        },
        productSku: {
          select: {
            skuCode: true,
            imageUrl: true,
            attributeJson: true,
            materialLabel: true,
            sizeLabel: true,
            price: true,
            originalPrice: true,
          },
        },
      },
    })
    for (const item of fallbackItems) {
      const unitPrice = item.unitPrice.toNumber()
      const lineAmount = item.lineAmount.toNumber()
      const currency = item.order?.currencyCode || 'USD'
      const skuOriginal = item.productSku?.originalPrice != null ? Number(item.productSku.originalPrice) : null
      const skuPrice = item.productSku?.price != null ? Number(item.productSku.price) : null
      const { originalPriceUsd, discountPriceUsd } = resolveExportUnitPricesUsd({
        unitPrice,
        currencyCode: currency,
        usdExchangeRate,
        skuPriceCny: skuPrice,
        skuOriginalCny: skuOriginal,
        orderDiscountUsd: toUsdAmount(
          item.order?.discountAmount != null ? Number(item.order.discountAmount) : 0,
          currency,
          usdExchangeRate,
        ),
      })
      rows.push({
        productId: item.productId,
        sku: resolveSkuSpecification({
          attributeJson: item.productSku?.attributeJson,
          materialLabel: item.productSku?.materialLabel,
          sizeLabel: item.productSku?.sizeLabel,
          itemMaterialLabel: item.materialLabel,
          itemSizeLabel: item.sizeLabel,
        }),
        spu: item.product?.productCode || String(item.skuCode || '').split('-')[0] || '',
        imageUrl:
          item.productSku?.imageUrl ||
          item.product?.mainImageUrl ||
          firstGalleryUrl((item.product as { galleryJson?: unknown } | null)?.galleryJson) ||
          '',
        originalPriceUsd,
        discountPriceUsd,
        quantity: item.quantity,
        totalPriceUsd: toUsdAmount(lineAmount, currency, usdExchangeRate),
        costPrice: item.product?.costPrice != null ? Number(item.product.costPrice) : null,
        supplierName: item.product?.supplierName || '',
        supplierUrl: '',
        productName: resolveChineseExportProductName({
          productNameSnapshot: item.productName,
          product: item.product,
        }),
        orderNo: item.order?.orderNo || '',
        inboundQty: clampInboundQty(item.quantity, Number(item.inboundQty) || 0),
        inboundNote: String(item.inboundNote || ''),
      })
    }
  }

  if (!rows.length) {
    throw new Error('所选订单没有可导出的商品明细（可能明细为空）。请换一笔有商品的订单再试。')
  }

  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  return {
    rows: groupExcelRowsBySpu(rows),
    fileName:
      orderIds.length === 1
        ? `order-export-${orders[0]?.orderNo || stamp}.xlsx`
        : `orders-export-${stamp}.xlsx`,
  }
}

async function buildPlainXlsxFile(
  rows: ExportOrdersExcelOutput['rows'],
  fileName: string,
): Promise<ExportOrdersExcelFileOutput> {
  const XLSX = await import('xlsx')
  const sheetRows = rows.map((row) => ({
    '商品 ID': row.productId,
    SKU: row.sku,
    SPU: row.spu,
    图片: '',
    '原价(美金)': row.originalPriceUsd,
    '折扣价(美金)': row.discountPriceUsd ?? row.originalPriceUsd,
    数量: row.quantity,
    '总价(美金)': row.totalPriceUsd,
    采购价: row.costPrice ?? '',
    供应商名称: row.supplierName,
    供应商链接: row.supplierUrl,
    商品名称: row.productName,
    已入库数量: row.inboundQty,
    入库备注: row.inboundNote,
  }))
  const worksheet = XLSX.utils.json_to_sheet(sheetRows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '订单明细')
  const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer
  return {
    fileName,
    fileBase64: Buffer.from(buf).toString('base64'),
    embeddedThumbnails: false,
  }
}

async function buildOrderExcelFile(orderIds: string[]): Promise<ExportOrdersExcelFileOutput> {
  const { rows, fileName } = await buildOrderExcelRows(orderIds)
  const ExcelJS = loadExcelJS()
  if (!ExcelJS?.Workbook) {
    return buildPlainXlsxFile(rows, fileName)
  }

  const workbook = new ExcelJS.Workbook()
  workbook.created = new Date()
  const worksheet = workbook.addWorksheet('订单明细', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  // Keep the image column roughly square so two-cell anchors do not stretch photos.
  const imageColWidth = 20
  const imageRowHeight = 105

  worksheet.columns = [
    { header: '商品 ID', key: 'productId', width: 18 },
    { header: 'SKU', key: 'sku', width: 18 },
    { header: 'SPU', key: 'spu', width: 18 },
    { header: '图片', key: 'image', width: imageColWidth },
    { header: '原价(美金)', key: 'originalPriceUsd', width: 14 },
    { header: '折扣价(美金)', key: 'discountPriceUsd', width: 14 },
    { header: '数量', key: 'quantity', width: 10 },
    { header: '总价(美金)', key: 'totalPriceUsd', width: 14 },
    { header: '采购价', key: 'costPrice', width: 12 },
    { header: '供应商名称', key: 'supplierName', width: 18 },
    { header: '供应商链接', key: 'supplierUrl', width: 40 },
    { header: '商品名称（中文）', key: 'productName', width: 55 },
    { header: '已入库数量', key: 'inboundQty', width: 14 },
    { header: '入库备注', key: 'inboundNote', width: 24 },
  ]

  const headerRow = worksheet.getRow(1)
  headerRow.height = 28
  headerRow.font = { bold: true, size: 12 }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9D9D9' },
  }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }

  for (const row of rows) {
    worksheet.addRow({
      productId: row.productId,
      sku: row.sku,
      spu: row.spu,
      image: '',
      originalPriceUsd: row.originalPriceUsd,
      discountPriceUsd: row.discountPriceUsd ?? row.originalPriceUsd,
      quantity: row.quantity,
      totalPriceUsd: row.totalPriceUsd,
      costPrice: row.costPrice ?? '',
      supplierName: row.supplierName,
      supplierUrl: row.supplierUrl,
      productName: row.productName,
      inboundQty: row.inboundQty,
      inboundNote: row.inboundNote,
    })
  }

  const imageColIndex = worksheet.getColumn('image').number
  worksheet.getColumn(imageColIndex).alignment = { vertical: 'middle', horizontal: 'center' }

  // Embed procurement-sized SKU images into the "图片" column.
  const imageIdByUrl = new Map<string, number>()
  const imageDeadline = Date.now() + 45_000
  let embeddedCount = 0
  for (let i = 0; i < rows.length; i++) {
    const rowNumber = i + 2 // 1-based row index; row 1 is header
    const excelRow = worksheet.getRow(rowNumber)
    excelRow.height = imageRowHeight
    excelRow.alignment = { vertical: 'middle', wrapText: true }

    const imageUrl = rows[i]?.imageUrl || ''
    if (!imageUrl) continue
    let imageId = imageIdByUrl.get(imageUrl)
    if (imageId == null) {
      if (Date.now() > imageDeadline) continue
      const img = await tryFetchImageBuffer(imageUrl)
      if (!img) continue
      imageId = workbook.addImage({
        buffer: img.buffer,
        extension: img.extension,
      })
      imageIdByUrl.set(imageUrl, imageId)
    }
    // Pin to the cell rectangle. Fractional tl + pixel ext is calculated against
    // ExcelJS default row height, so images float into the row above in WPS/Excel.
    worksheet.addImage(imageId, {
      tl: { col: imageColIndex - 1, row: rowNumber - 1 },
      br: { col: imageColIndex, row: rowNumber },
      editAs: 'twoCell',
    })
    embeddedCount += 1
  }

  const out = await workbook.xlsx.writeBuffer()
  const fileBase64 = Buffer.from(out as any).toString('base64')
  return { fileName, fileBase64, embeddedThumbnails: embeddedCount > 0 }
}


const INBOUND_STAGE_LABEL: Record<string, string> = {
  PENDING: '待采购',
  STOCK: '备货',
  PREPARING: '备货中',
  FACTORY: '工厂发货',
  TRANSIT: '工厂发货',
  ARRIVED: '到达仓库',
  PARCEL: '包裹发货',
}

export interface InboundSheetRowInput {
  productName: string
  skuCode: string
  imageUrl: string
  unitPrice: number | null
  discountUnitPrice: number | null
  currencyCode: string
  quantity: number
  lineAmount: number | null
  costPrice: number | null
  supplierName: string
  supplierUrl: string
  inboundNote: string
  inboundStage: string
  inboundQty: number
}

export interface ExportInboundSheetInput {
  orderNo?: string
  mode: 'sheet' | 'images'
  columns: string[]
  rows: InboundSheetRowInput[]
}

function publicSupplierUrl(value: unknown): string {
  const text = String(value || '').trim()
  return /^https?:\/\//i.test(text) ? text : ''
}

function inboundMoneyCell(value: unknown): number | '' {
  if (value == null || value === '') return ''
  const amount = Number(value)
  if (!Number.isFinite(amount)) return ''
  return Math.round(amount * 100) / 100
}

async function buildInboundSheetFile(input: ExportInboundSheetInput): Promise<ExportOrdersExcelFileOutput> {
  const rows = (Array.isArray(input.rows) ? input.rows : []).slice(0, 200)
  if (!rows.length) throw new Error('请先勾选要导出的商品')
  const imagesOnly = input.mode === 'images'
  const selected = new Set((input.columns || []).map((key) => String(key)))
  const want = (key: string) => imagesOnly || selected.has(key)
  if (!imagesOnly && !['product', 'unitPrice', 'discountPrice', 'quantity', 'lineAmount', 'costPrice', 'supplier', 'note', 'stage', 'inboundQty'].some(want)) {
    throw new Error('请先勾选要导出的列')
  }

  const orderNo = String(input.orderNo || '').trim() || 'inbound'
  const fileName = imagesOnly ? `shipping-images-${orderNo}.xlsx` : `inbound-${orderNo}.xlsx`
  const currency = String(rows.find((row) => row.currencyCode)?.currencyCode || 'USD').toUpperCase()
  const priceHeader = currency === 'USD' ? '售价(美金)' : `售价(${currency})`
  const discountHeader = currency === 'USD' ? '折扣价(美金)' : `折扣价(${currency})`
  const totalHeader = currency === 'USD' ? '总价(美金)' : `总价(${currency})`

  type Col = { header: string; key: string; width: number; value: (row: InboundSheetRowInput) => string | number }
  const columns: Col[] = []
  if (imagesOnly || want('product')) {
    columns.push({ header: '图片', key: 'image', width: 20, value: () => '' })
    columns.push({ header: 'SKU', key: 'sku', width: 22, value: (row) => row.skuCode || '' })
    columns.push({ header: '商品名称（中文）', key: 'productName', width: 36, value: (row) => row.productName || '' })
  }
  if (!imagesOnly && want('unitPrice')) columns.push({ header: priceHeader, key: 'unitPrice', width: 14, value: (row) => inboundMoneyCell(row.unitPrice) })
  if (!imagesOnly && want('discountPrice')) columns.push({ header: discountHeader, key: 'discountPrice', width: 14, value: (row) => inboundMoneyCell(row.discountUnitPrice ?? row.unitPrice) })
  if (imagesOnly || want('quantity')) columns.push({ header: '数量', key: 'quantity', width: 10, value: (row) => row.quantity })
  if (!imagesOnly && want('lineAmount')) columns.push({ header: totalHeader, key: 'lineAmount', width: 14, value: (row) => inboundMoneyCell(row.lineAmount) })
  if (!imagesOnly && want('costPrice')) columns.push({ header: '成本价', key: 'costPrice', width: 12, value: (row) => inboundMoneyCell(row.costPrice) })
  if (!imagesOnly && want('supplier')) {
    columns.push({ header: '供应商名称', key: 'supplierName', width: 22, value: (row) => String(row.supplierName || '').trim() })
    columns.push({ header: '供应商链接', key: 'supplierUrl', width: 42, value: (row) => publicSupplierUrl(row.supplierUrl) })
  }
  if (!imagesOnly && want('note')) columns.push({ header: '备注', key: 'note', width: 24, value: (row) => String(row.inboundNote || '') })
  if (!imagesOnly && want('stage')) columns.push({ header: '商品状态', key: 'stage', width: 12, value: (row) => INBOUND_STAGE_LABEL[cleanInboundStage(row.inboundStage)] || '待采购' })
  if (!imagesOnly && want('inboundQty')) columns.push({ header: '到货数量', key: 'inboundQty', width: 12, value: (row) => row.inboundQty })

  const ExcelJS = loadExcelJS()
  if (!ExcelJS?.Workbook) {
    const XLSX = await import('xlsx')
    const sheetRows = rows.map((row) => {
      const record: Record<string, string | number> = {}
      for (const column of columns) record[column.header] = column.value(row)
      return record
    })
    const worksheet = XLSX.utils.json_to_sheet(sheetRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, imagesOnly ? '发货图片' : '入库明细')
    const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer
    return { fileName, fileBase64: Buffer.from(buf).toString('base64'), embeddedThumbnails: false }
  }

  const workbook = new ExcelJS.Workbook()
  workbook.created = new Date()
  const worksheet = workbook.addWorksheet(imagesOnly ? '发货图片' : '入库明细', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })
  const imageColWidth = 20
  const imageRowHeight = 105
  worksheet.columns = columns.map((column) => ({
    header: column.header,
    key: column.key,
    width: column.key === 'image' ? imageColWidth : column.width,
  }))
  const headerRow = worksheet.getRow(1)
  headerRow.height = 28
  headerRow.font = { bold: true, size: 12 }
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }

  for (const row of rows) {
    const record: Record<string, string | number> = {}
    for (const column of columns) record[column.key] = column.value(row)
    worksheet.addRow(record)
  }

  const imageColumn = columns.find((column) => column.key === 'image')
  const imageIdByUrl = new Map<string, number>()
  const imageDeadline = Date.now() + 45_000
  let embeddedCount = 0
  const imageColIndex = imageColumn ? worksheet.getColumn('image').number : 0
  if (imageColIndex) worksheet.getColumn(imageColIndex).alignment = { vertical: 'middle', horizontal: 'center' }
  for (let i = 0; i < rows.length; i++) {
    const rowNumber = i + 2
    const excelRow = worksheet.getRow(rowNumber)
    excelRow.height = imageColumn ? imageRowHeight : 22
    excelRow.alignment = { vertical: 'middle', wrapText: true }
    const imageUrl = String(rows[i]?.imageUrl || '').trim()
    if (!imageColumn || !imageUrl) continue
    let imageId = imageIdByUrl.get(imageUrl)
    if (imageId == null) {
      if (Date.now() > imageDeadline) continue
      const img = await tryFetchImageBuffer(imageUrl)
      if (!img) continue
      imageId = workbook.addImage({ buffer: img.buffer, extension: img.extension })
      imageIdByUrl.set(imageUrl, imageId)
    }
    worksheet.addImage(imageId, {
      tl: { col: imageColIndex - 1, row: rowNumber - 1 },
      br: { col: imageColIndex, row: rowNumber },
      editAs: 'twoCell',
    })
    embeddedCount += 1
  }

  const out = await workbook.xlsx.writeBuffer()
  return {
    fileName,
    fileBase64: Buffer.from(out as any).toString('base64'),
    embeddedThumbnails: embeddedCount > 0,
  }
}

/**
 * 登记入库表格 / 发货图片。行顺序与勾选顺序无关，按入库表当前顺序导出。
 * 图片沿用订单 Excel：240 内等比缩放，单元格约正方形，避免拉变形。
 */
export const exportInboundSheet = requireRole([UserRole.ADMIN])(
  withResult(async (input: ExportInboundSheetInput): Promise<ExportOrdersExcelFileOutput> => {
    return buildInboundSheetFile(input)
  }),
)

/**
 * 导出订单明细 Excel（服务端生成；“图片”列优先内嵌 SKU 大图）
 */
export const exportOrdersExcel = requireRole([UserRole.ADMIN])(
  withResult(async (input: ExportOrdersExcelInput): Promise<ExportOrdersExcelFileOutput> => {
    try {
      return await buildOrderExcelFile(input.orderIds || [])
    } catch (error) {
      const { rows, fileName } = await buildOrderExcelRows(input.orderIds || [])
      try {
        return await buildPlainXlsxFile(rows, fileName)
      } catch {
        throw error
      }
    }
  }),
)