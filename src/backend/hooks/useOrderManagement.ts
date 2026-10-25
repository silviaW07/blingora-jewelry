'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { OrderManagement, UserManagement } from '@/backend/route-params'

// Types & Enums
import type {
  OrderStatus,
  OrderShipMethod,
  PaymentMethodType,
  GetDashboardStatsOutput,
  GetOrderListInput,
  OrderListItem,
  OrderDetail,
  OrderInboundLine,
  ShipOrderInput,
  AddLogisticsSegmentInput,
  UpdateOrderStatusInput
} from '@/backend/actions/OrderManagement'

// Actions
import {
  getOrderDashboardStats,
  getOrderList,
  getOrderDetail,
  shipOrder,
  addLogisticsSegment,
  updateOrderStatus,
  updateOrderRemark,
  updateOrderInbound,
  appendOrderGoods,
  updateOrderDiscount,
  appendManualOrderLine,
  importInboundSheet,
  updateManualOrderLine,
  deleteInboundLines,
  importCustomerOrder,
  listInboundShipments,
  saveInboundShipment,
  updateInboundShipment,
  exportOrdersExcel,
  exportInboundSheet as exportInboundSheetAction,
} from '@/backend/actions/OrderManagement'
import type { ExportInboundSheetInput } from '@/backend/actions/OrderManagement'

/** Decode server-returned Excel payload to bytes (standard / URL-safe / data-URL base64). */
function decodeExcelBase64(raw: unknown): Uint8Array {
  if (raw == null || raw === '') {
    throw new Error('导出失败：服务端未返回文件数据，请重建后端后重试')
  }
  if (typeof raw !== 'string') {
    throw new Error('导出失败：文件数据格式无效')
  }
  let s = raw.trim()
  const comma = s.indexOf(',')
  if (s.startsWith('data:') && comma !== -1) {
    s = s.slice(comma + 1)
  }
  s = s.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/')
  const pad = s.length % 4
  if (pad) s += '='.repeat(4 - pad)
  try {
    const binary = atob(s)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return bytes
  } catch {
    throw new Error('导出失败：文件 Base64 解码错误')
  }
}

export interface OrderManagementState {
  /** 看板统计数据 */
  stats: GetDashboardStatsOutput | null
  /** 看板加载状态 */
  statsLoading: boolean
  /** 订单列表数据 */
  list: OrderListItem[]
  /** 列表总数 */
  total: number
  /** 列表加载状态 */
  listLoading: boolean
  /** 筛选表单 */
  filterForm: GetOrderListInput
  /** 详情数据 */
  detailData: OrderDetail | null
  /** 详情加载状态 */
  detailLoading: boolean
  /** 状态变更弹窗开关 */
  isStatusDialogOpen: boolean
  /** 状态变更表单 */
  statusForm: UpdateOrderStatusInput
  /** 发货表单 */
  shipForm: ShipOrderInput
  /** 物流弹窗开关 */
  isLogisticsDialogOpen: boolean
  /** 追加物流表单 */
  logisticsForm: AddLogisticsSegmentInput
  /** URL中的订单ID参数 */
  queryOrderId: string | undefined
  /** 行内备注草稿 */
  remarkDrafts: Record<string, string>
  /** 正在更新备注的订单 */
  remarkSavingId: string | null
  /** 正在导出 */
  exportLoading: boolean
  /** 正在登记入库的订单 */
  inboundOrderId: string | null
  inboundDrafts: OrderInboundLine[]
  inboundSaving: boolean
  inboundShipments: Array<{ id: string; shippedAt: string; trackingNumber: string; channel: string; note: string }>
}

export interface OrderManagementHandlers {
  /** 筛选条件变更 */
  handleFilterChange: <K extends keyof GetOrderListInput>(field: K, value: GetOrderListInput[K]) => void
  /** 点击搜索 */
  handleSearchClick: () => void
  /** 清空筛选 */
  handleClearFilter: () => void
  /** 状态页签切换 */
  handleTabChange: (value: string) => void
  /** 分页切换 */
  handlePageChange: (newPage: number) => void
  /** 每页条数切换 */
  handlePageSizeChange: (newPageSize: number) => void
  /** 打开详情 */
  handleOpenDetail: (id: string) => Promise<void>
  /** 关闭详情 */
  handleCloseDetail: () => void
  /** 发货表单变更 */
  handleShipFormChange: <K extends keyof ShipOrderInput>(field: K, value: ShipOrderInput[K]) => void
  /** 提交发货 */
  submitShipOrder: () => Promise<void>
  /** 打开状态变更弹窗 */
  openStatusDialog: (id: string, currentStatus: OrderStatus) => void
  /** 设置状态弹窗显示隐藏 */
  setIsStatusDialogOpen: (open: boolean) => void
  /** 提交状态变更 */
  submitStatusChange: () => Promise<void>
  /** 设置状态表单 */
  setStatusForm: React.Dispatch<React.SetStateAction<UpdateOrderStatusInput>>
  /** 打开物流弹窗 */
  openLogisticsDialog: (id: string) => void
  /** 设置物流弹窗显示隐藏 */
  setIsLogisticsDialogOpen: (open: boolean) => void
  /** 提交物流段记录 */
  submitLogisticsSegment: () => Promise<void>
  /** 设置物流表单 */
  setLogisticsForm: React.Dispatch<React.SetStateAction<AddLogisticsSegmentInput>>
  /** 跳转至客户详情 */
  jumpToCustomer: (email: string) => void
  /** 行内状态快捷切换 */
  handleQuickStatusChange: (orderId: string, newStatus: OrderStatus) => Promise<void>
  /** 备注草稿变更 */
  handleRemarkDraftChange: (orderId: string, value: string) => void
  /** 提交备注 */
  submitOrderRemark: (orderId: string) => Promise<void>
  /** 导出 Excel（全部当前页或指定订单） */
  handleExportExcel: (orderIds?: string[]) => Promise<void>
  /** 打开入库登记 */
  openInboundDialog: (orderId: string) => void
  /** 关闭入库登记 */
  closeInboundDialog: () => void
  /** 修改一行入库草稿 */
  setInboundDraft: (lineId: string, patch: Partial<Pick<OrderInboundLine, 'inboundQty' | 'inboundNote' | 'inboundStage' | 'shipmentImageUrl' | 'unitPrice' | 'lineAmount' | 'costPrice' | 'supplierName' | 'supplierUrl'>>) => void
  /** 本行按订购数量填到货数量，并记为已确认 */
  markInboundLineFull: (lineId: string) => void
  /** 确认这一行的到货数量。0 只有确认后才是缺货。 */
  acknowledgeInboundLine: (lineId: string) => void
  persistInboundLine: (lineId: string, patch?: Partial<OrderInboundLine>, options?: { quiet?: boolean }) => void
  persistInboundStages: (lineIds: string[], stage: string) => void
  /** 全部商品标为已到齐 */
  markInboundAllFull: () => void
  /** 保存入库登记 */
  submitInbound: (options?: { allowEmpty?: boolean; keepOpen?: boolean }) => Promise<void>
  /** 把导入的图片和可选字段写进当前商品，空字段不覆盖。 */
  applyInboundImport: (patches: Array<{ id: string } & Partial<OrderInboundLine>>) => Promise<void>
  appendInboundGoods: (lines: Array<{ skuCode: string; quantity?: number; unitPrice?: number | null; inboundQty?: number; inboundNote?: string; inboundStage?: string; shipmentImageUrl?: string | null }>) => Promise<{ missingSkus: string[]; addedCount: number } | null>
  updateInboundDiscount: (discountPercent: number) => Promise<void>
  appendManualOrderLine: (input: { imageUrl?: string | null; unitPrice?: number | null; quantity?: number | null; costPrice?: number | null; lineAmount?: number | null; lines?: Array<{ imageUrl?: string | null; unitPrice?: number | null; quantity?: number | null; costPrice?: number | null; lineAmount?: number | null }> }) => Promise<boolean>
  importInboundSheet: (input: { fileBase64: string; fileName?: string }) => Promise<boolean>
  updateManualOrderLine: (input: { orderItemId: string; unitPrice?: number | null; quantity?: number | null; lineAmount?: number | null; costPrice?: number | null; supplierName?: string | null; productName?: string | null }) => Promise<boolean>
  deleteInboundLines: (lineIds: string[]) => Promise<boolean>
  saveInboundShipment: (input: { blocks: Array<{ shippedAt: string; trackingNumber?: string; channel?: string; note?: string; images?: string[] }> }) => Promise<boolean>
  updateInboundShipment: (input: { id: string; shippedAt: string; trackingNumber?: string; channel?: string; note?: string; images?: string[] }) => Promise<boolean>
  importCustomerOrder: (input: { email: string; fileBase64: string; fileName?: string; shippingMethod?: string; weightGrams?: number | null; orderNote?: string; status?: OrderStatus }) => Promise<{ orderId: string; orderNo: string; itemCount: number; totalAmount: number } | null>
  exportInboundSheet: (input: ExportInboundSheetInput) => Promise<void>
}

const INBOUND_DRAFT_PREFIX = 'sj-inbound-draft:'

type StoredInboundLine = {
  inboundQty: number
  inboundNote: string
  inboundStage: string
  shipmentImageUrl: string | null
}

function readInboundDraftStore(orderId: string): { lines: Record<string, StoredInboundLine>; selected: string[] } | null {
  if (typeof window === 'undefined' || !orderId) return null
  try {
    const raw = window.sessionStorage.getItem(INBOUND_DRAFT_PREFIX + orderId)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { lines?: Record<string, StoredInboundLine>; selected?: unknown }
    const selected = Array.isArray(parsed?.selected) ? parsed.selected.map((id) => String(id)) : []
    return {
      lines: parsed?.lines && typeof parsed.lines === 'object' ? parsed.lines : {},
      selected,
    }
  } catch {
    return null
  }
}

function writeInboundDraftStore(orderId: string, patch: { lines?: Record<string, StoredInboundLine>; selected?: string[] }) {
  if (typeof window === 'undefined' || !orderId) return
  const prev = readInboundDraftStore(orderId)
  const next = {
    lines: patch.lines ?? prev?.lines ?? {},
    selected: patch.selected ?? prev?.selected ?? [],
  }
  window.sessionStorage.setItem(INBOUND_DRAFT_PREFIX + orderId, JSON.stringify(next))
}

export function readInboundSelection(orderId: string): string[] {
  return readInboundDraftStore(orderId)?.selected || []
}

export function writeInboundSelection(orderId: string, selected: string[]) {
  writeInboundDraftStore(orderId, { selected })
}

function clearInboundDraftStore(orderId: string | null) {
  if (typeof window === 'undefined' || !orderId) return
  window.sessionStorage.removeItem(INBOUND_DRAFT_PREFIX + orderId)
}

export const useOrderManagement = (): { state: OrderManagementState, handlers: OrderManagementHandlers } => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const paramsObj = useMemo(() => OrderManagement.getParams(searchParams), [searchParams])
  const queryStatus = paramsObj.status
  const queryOrderId = paramsObj.orderId

  const [stats, setStats] = useState<GetDashboardStatsOutput | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [list, setList] = useState<OrderListItem[]>([])
  const [total, setTotal] = useState(0)
  const [listLoading, setListLoading] = useState(true)

  const [filterForm, setFilterForm] = useState<GetOrderListInput>({
    page: 1,
    pageSize: 50,
    status: (queryStatus as OrderStatus) || undefined,
  })

  const [detailData, setDetailData] = useState<OrderDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [statusForm, setStatusForm] = useState<UpdateOrderStatusInput>({
    orderId: '',
    newStatus: 'CANCELLED',
    actionNote: '',
  })

  const [shipForm, setShipForm] = useState<ShipOrderInput>({
    orderId: '',
    trackingCarrier: '',
    trackingNumber: '',
    shippedAt: '',
    internalNote: '',
  })

  const [isLogisticsDialogOpen, setIsLogisticsDialogOpen] = useState(false)
  const [logisticsForm, setLogisticsForm] = useState<AddLogisticsSegmentInput>({
    orderId: '',
    segmentType: '',
    carrierName: '',
    trackingNumber: '',
    statusLabel: '',
    estimatedArrivalAt: '',
    remark: '',
  })
  const [remarkDrafts, setRemarkDrafts] = useState<Record<string, string>>({})
  const [remarkSavingId, setRemarkSavingId] = useState<string | null>(null)
  const [exportLoading, setExportLoading] = useState(false)
  const [inboundOrderId, setInboundOrderId] = useState<string | null>(null)
  const [inboundDrafts, setInboundDrafts] = useState<OrderInboundLine[]>([])
  const [inboundSaving, setInboundSaving] = useState(false)
  const [inboundShipments, setInboundShipments] = useState<Array<{ id: string; shippedAt: string; trackingNumber: string; channel: string; note: string }>>([])
  const inboundBooted = useRef<string | null>(null)
  const inboundClosing = useRef(false)

  const fetchStats = async () => {
    try {
      setStatsLoading(true)
      const res = await getOrderDashboardStats()
      setStats(res)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setStatsLoading(false)
    }
  }

  const fetchList = async (currentForm: GetOrderListInput) => {
    try {
      setListLoading(true)
      const payload = { ...currentForm }
      if (payload.startDate) {
        payload.startDate = new Date(`${payload.startDate}T00:00:00.000Z`).toISOString()
      }
      if (payload.endDate) {
        payload.endDate = new Date(`${payload.endDate}T23:59:59.999Z`).toISOString()
      }

      const res = await getOrderList(payload)
      setList(res.list)
      setTotal(res.total)
      setRemarkDrafts((prev) => {
        const next = { ...prev }
        for (const item of res.list) {
          if (next[item.id] === undefined) {
            next[item.id] = item.internalNote || ''
          }
        }
        return next
      })
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setListLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    fetchList(filterForm)
  }, [filterForm.page, filterForm.pageSize, filterForm.status])

  useEffect(() => {
    if (queryOrderId) {
      handleOpenDetail(queryOrderId)
    } else {
      setDetailData(null)
    }
  }, [queryOrderId])

  const handleFilterChange = <K extends keyof GetOrderListInput>(
    field: K,
    value: GetOrderListInput[K]
  ) => {
    setFilterForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSearchClick = () => {
    handleFilterChange('page', 1)
    fetchList({ ...filterForm, page: 1 })
  }

  const handleClearFilter = () => {
    const defaultForm: GetOrderListInput = { page: 1, pageSize: 50 }
    setFilterForm(defaultForm)
    OrderManagement.navigateToStandard(router)
    fetchList(defaultForm)
  }

  const handleTabChange = (value: string) => {
    const status = value === 'ALL' ? undefined : (value as OrderStatus)
    handleFilterChange('status', status)
    handleFilterChange('page', 1)
  }

  const handlePageChange = (newPage: number) => {
    handleFilterChange('page', newPage)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    const size = Math.max(1, Math.min(200, Math.floor(Number(newPageSize) || 50)))
    handleFilterChange('pageSize', size)
    handleFilterChange('page', 1)
  }

  const handleOpenDetail = async (id: string) => {
    try {
      setDetailLoading(true)
      const data = await getOrderDetail(id)
      setDetailData(data)
      setShipForm({
        orderId: data.id,
        trackingCarrier: data.trackingCarrier || '',
        trackingNumber: data.trackingNumber || '',
        shippedAt: data.shippedAt ? new Date(data.shippedAt).toISOString().slice(0, 16) : '',
        internalNote: data.internalNote || '',
      })
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleCloseDetail = () => {
    OrderManagement.navigateToStandard(router)
  }

  const handleShipFormChange = <K extends keyof ShipOrderInput>(
    field: K,
    value: ShipOrderInput[K]
  ) => {
    setShipForm((prev) => ({ ...prev, [field]: value }))
  }

  const submitShipOrder = async () => {
    if (!shipForm.trackingCarrier || !shipForm.trackingNumber || !shipForm.shippedAt) {
      toast.error('请填写完整发货信息（承运商、单号、发货时间）')
      return
    }
    try {
      await shipOrder({
        ...shipForm,
        shippedAt: new Date(shipForm.shippedAt).toISOString(),
      })
      toast.success('发货处理成功')
      handleOpenDetail(shipForm.orderId)
      fetchList(filterForm)
      fetchStats()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const openStatusDialog = (id: string, currentStatus: OrderStatus) => {
    setStatusForm({ orderId: id, newStatus: currentStatus, actionNote: '' })
    setIsStatusDialogOpen(true)
  }

  const submitStatusChange = async () => {
    try {
      await updateOrderStatus({
        ...statusForm,
        actionNote: statusForm.actionNote?.trim() || undefined,
      })
      toast.success('状态变更成功')
      setIsStatusDialogOpen(false)
      if (detailData && detailData.id === statusForm.orderId) {
        handleOpenDetail(statusForm.orderId)
      }
      fetchList(filterForm)
      fetchStats()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleQuickStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus({
        orderId,
        newStatus,
        actionNote: `列表快捷切换为 ${newStatus}`,
      })
      toast.success('订单状态已更新')
      setList((prev) => prev.map((item) => (item.id === orderId ? { ...item, status: newStatus } : item)))
      fetchStats()
    } catch (err: any) {
      toast.error(err.message)
      fetchList(filterForm)
    }
  }

  const handleRemarkDraftChange = (orderId: string, value: string) => {
    setRemarkDrafts((prev) => ({ ...prev, [orderId]: value }))
  }

  const submitOrderRemark = async (orderId: string) => {
    try {
      setRemarkSavingId(orderId)
      const note = remarkDrafts[orderId] ?? ''
      await updateOrderRemark({ orderId, internalNote: note })
      toast.success('备注已更新')
      setList((prev) => prev.map((item) => (item.id === orderId ? { ...item, internalNote: note } : item)))
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setRemarkSavingId(null)
    }
  }

  const handleExportExcel = async (orderIds?: string[]) => {
    const ids = orderIds?.length ? orderIds : list.map((item) => item.id)
    if (!ids.length) {
      toast.error('当前没有可导出的订单')
      return
    }
    try {
      setExportLoading(true)
      toast.loading('正在导出订单 Excel…', { id: 'order-excel-export' })
      const result = await exportOrdersExcel(
        { orderIds: ids },
        { __rpcTimeoutMs: 90_000 },
      )
      const bytes = decodeExcelBase64(result?.fileBase64)
      const blob = new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = result.fileName || `orders-export-${Date.now()}.xlsx`
      anchor.rel = 'noopener'
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      toast.success(result.embeddedThumbnails ? 'Excel 已导出（含商品缩略图）' : 'Excel 已导出', {
        id: 'order-excel-export',
      })
    } catch (err: any) {
      toast.error(err.message || '导出失败', { id: 'order-excel-export' })
    } finally {
      setExportLoading(false)
    }
  }

  const openLogisticsDialog = (id: string) => {
    setLogisticsForm({
      orderId: id,
      segmentType: '',
      carrierName: '',
      trackingNumber: '',
      statusLabel: '',
      estimatedArrivalAt: '',
      remark: '',
    })
    setIsLogisticsDialogOpen(true)
  }

  const submitLogisticsSegment = async () => {
    if (!logisticsForm.segmentType) {
      toast.error('请填写物流段落名称（如：国际段）')
      return
    }
    try {
      const payload = { ...logisticsForm }
      if (payload.estimatedArrivalAt) {
        payload.estimatedArrivalAt = new Date(payload.estimatedArrivalAt).toISOString()
      } else {
        delete payload.estimatedArrivalAt
      }
      await addLogisticsSegment(payload)
      toast.success('物流记录添加成功')
      setIsLogisticsDialogOpen(false)
      handleOpenDetail(logisticsForm.orderId)
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const syncInboundQuery = (open: boolean, orderId: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (open && orderId) {
      params.set('orderId', orderId)
      params.set('inbound', '1')
    } else {
      params.delete('inbound')
      params.delete('orderId')
    }
    const next = params.toString()
    if (next === searchParams.toString()) return
    router.replace(next ? `${OrderManagement.path}?${next}` : OrderManagement.path, { scroll: false })
  }

  const openInboundDialog = (orderId: string, options?: { skipUrl?: boolean }) => {
    const row = list.find((item) => item.id === orderId)
    const source = (detailData && detailData.id === orderId && detailData.inboundLines?.length
      ? detailData.inboundLines
      : row?.inboundLines) || []
    if (!source.length) {
      toast.error('这笔订单没有可登记的商品')
      return
    }
    const saved = readInboundDraftStore(orderId)
    const drafts = source.map((line) => {
      const extra = saved?.lines?.[line.id]
      const ordered = Math.max(0, Number(line.quantity) || 0)
      const rawQty = extra && Number.isFinite(Number(extra.inboundQty))
        ? Math.floor(Number(extra.inboundQty))
        : line.inboundQty
      const inboundQty = ordered > 0 ? Math.min(ordered, Math.max(0, rawQty)) : Math.max(0, rawQty)
      return {
        ...line,
        inboundQty,
        inboundNote: extra ? String(extra.inboundNote || '') : (line.inboundNote || ''),
        inboundStage: extra?.inboundStage || line.inboundStage || 'PENDING',
        shipmentImageUrl: extra ? (extra.shipmentImageUrl || null) : (line.shipmentImageUrl || null),
        acknowledged: false,
        openedQty: line.inboundQty,
        openedNote: line.inboundNote || '',
        openedStage: line.inboundStage || 'PENDING',
        openedImage: line.shipmentImageUrl || '',
      }
    })
    setInboundDrafts(drafts)
    setInboundOrderId(orderId)
    const dirty = drafts.some((line) => (
      Number(line.inboundQty) !== Number(line.openedQty)
      || (line.inboundNote || '') !== (line.openedNote || '')
      || (line.inboundStage || 'PENDING') !== (line.openedStage || 'PENDING')
      || (line.shipmentImageUrl || '') !== (line.openedImage || '')
    ))
    if (dirty) window.setTimeout(() => { void saveInboundDrafts(drafts, { keepOpen: true, quiet: true }) }, 0)
    inboundBooted.current = orderId
    inboundClosing.current = false
    if (!options?.skipUrl) syncInboundQuery(true, orderId)
  }

  useEffect(() => {
    if (!inboundOrderId) {
      setInboundShipments([])
      return
    }
    let cancelled = false
    listInboundShipments(inboundOrderId).then((rows) => {
      if (!cancelled) setInboundShipments(rows || [])
    }).catch(() => {
      if (!cancelled) setInboundShipments([])
    })
    return () => { cancelled = true }
  }, [inboundOrderId])

  const saveInboundShipmentRows = async (input: { blocks: Array<{ shippedAt: string; trackingNumber?: string; channel?: string; note?: string; images?: string[] }> }) => {
    if (!inboundOrderId) return false
    const blocks = input.blocks || []
    if (!blocks.length || blocks.some((block) => !String(block.shippedAt || '').trim())) {
      toast.error('请填写发货日期')
      return false
    }
    try {
      setInboundSaving(true)
      const rows = await saveInboundShipment({ orderId: inboundOrderId, ...input })
      setInboundShipments(rows || [])
      toast.success('发货信息已保存')
      return true
    } catch (err: any) {
      toast.error(err.message || '保存发货信息失败')
      return false
    } finally {
      setInboundSaving(false)
    }
  }


  const updateInboundShipmentRow = async (input: { id: string; shippedAt: string; trackingNumber?: string; channel?: string; note?: string; images?: string[] }) => {
    if (!inboundOrderId) return false
    if (!String(input.shippedAt || '').trim()) {
      toast.error('请填写发货日期')
      return false
    }
    try {
      setInboundSaving(true)
      const rows = await updateInboundShipment({ orderId: inboundOrderId, ...input })
      setInboundShipments(rows || [])
      toast.success('发货信息已保存')
      return true
    } catch (err: any) {
      toast.error(err.message || '保存发货信息失败')
      return false
    } finally {
      setInboundSaving(false)
    }
  }

  const closeInboundDialog = () => {
    inboundClosing.current = true
    inboundBooted.current = null
    if (inboundOrderId) clearInboundDraftStore(inboundOrderId)
    syncInboundQuery(false, null)
    setInboundOrderId(null)
    setInboundSaving(false)
  }

  useEffect(() => {
    if (!inboundOrderId || inboundDrafts.length === 0) return
    const lines: Record<string, StoredInboundLine> = {}
    for (const line of inboundDrafts) {
      lines[line.id] = {
        inboundQty: line.inboundQty,
        inboundNote: line.inboundNote || '',
        inboundStage: line.inboundStage || 'PENDING',
        shipmentImageUrl: line.shipmentImageUrl || null,
      }
    }
    writeInboundDraftStore(inboundOrderId, { lines })
  }, [inboundOrderId, inboundDrafts])

  useEffect(() => {
    if (!inboundOrderId || inboundDrafts.length === 0 || inboundSaving) return
    const dirty = inboundDrafts.some((line) => (
      line.inboundQty !== line.openedQty
      || (line.inboundNote || '') !== (line.openedNote || '')
      || (line.inboundStage || 'PENDING') !== (line.openedStage || 'PENDING')
      || (line.shipmentImageUrl || '') !== (line.openedImage || '')
    ))
    if (!dirty) return
    const timer = window.setTimeout(() => {
      void saveInboundDrafts(inboundDrafts, { keepOpen: true, quiet: true })
    }, 500)
    return () => window.clearTimeout(timer)
  }, [inboundOrderId, inboundDrafts, inboundSaving])

  useEffect(() => {
    if (searchParams.get('inbound') !== '1' || !queryOrderId) {
      inboundClosing.current = false
      inboundBooted.current = null
      return
    }
    if (inboundClosing.current) return
    if (inboundOrderId === queryOrderId || inboundBooted.current === queryOrderId) return
    const row = list.find((item) => item.id === queryOrderId)
    const detailLines = detailData && detailData.id === queryOrderId ? detailData.inboundLines : undefined
    const source = (detailLines && detailLines.length ? detailLines : row?.inboundLines) || []
    if (!source.length) return
    openInboundDialog(queryOrderId, { skipUrl: true })
  }, [list, detailData, queryOrderId, searchParams, inboundOrderId])

  const setInboundDraft = (
    lineId: string,
    patch: Partial<Pick<OrderInboundLine, 'inboundQty' | 'inboundNote' | 'inboundStage' | 'shipmentImageUrl' | 'unitPrice' | 'lineAmount' | 'costPrice' | 'supplierName' | 'supplierUrl'>>,
  ) => {
    setInboundDrafts((prev) => prev.map((line) => {
      if (line.id !== lineId) return line
      const next = { ...line, ...patch }
      const ordered = Math.max(0, Number(line.quantity) || 0)
      const qty = Math.max(0, Math.floor(Number(next.inboundQty) || 0))
      next.inboundQty = ordered > 0 ? Math.min(ordered, qty) : 0
      return next
    }))
  }

  const markInboundLineFull = (lineId: string) => {
    setInboundDrafts((prev) => prev.map((line) => (
      line.id === lineId ? { ...line, inboundQty: line.quantity, acknowledged: true, inboundStage: line.quantity > 0 ? 'ARRIVED' : (line.inboundStage || 'PENDING') } : line
    )))
  }

  const acknowledgeInboundLine = (lineId: string) => {
    persistInboundLine(lineId, { acknowledged: true })
  }

  const persistInboundStages = (lineIds: string[], stage: string) => {
    const ids = new Set(lineIds)
    const next = inboundDrafts.map((line) => ids.has(line.id) ? { ...line, inboundStage: stage } : line)
    setInboundDrafts(next)
    void saveInboundDrafts(next, { keepOpen: true })
  }

  const persistInboundLine = (lineId: string, patch?: Partial<OrderInboundLine>, options?: { quiet?: boolean }) => {
    const next = inboundDrafts.map((line) => {
      if (line.id !== lineId) return line
      const merged = { ...line, ...patch }
      const ordered = Math.max(0, Number(line.quantity) || 0)
      const qty = Math.max(0, Math.floor(Number(merged.inboundQty) || 0))
      merged.inboundQty = ordered > 0 ? Math.min(ordered, qty) : 0
      if (patch?.acknowledged) {
        merged.acknowledged = true
        if (!patch.inboundStage) merged.inboundStage = merged.inboundQty > 0 ? 'ARRIVED' : (merged.inboundStage || 'PENDING')
      }
      return merged
    })
    setInboundDrafts(next)
    void saveInboundDrafts(next, { keepOpen: true, allowEmpty: true, quiet: options?.quiet })
  }

  const markInboundAllFull = () => {
    setInboundDrafts((prev) => prev.map((line) => ({ ...line, inboundQty: line.quantity, acknowledged: true, inboundStage: 'ARRIVED' })))
  }

  const rememberInboundResult = (orderId: string, drafts: OrderInboundLine[], result: { lines: OrderInboundLine[]; orderedQty: number; receivedQty: number; state: 'NONE' | 'PARTIAL' | 'DONE' }) => {
    setList((prev) => prev.map((row) => (
      row.id === orderId
        ? {
            ...row,
            inboundLines: result.lines,
            inboundOrderedQty: result.orderedQty,
            inboundReceivedQty: result.receivedQty,
            inboundState: result.state,
          }
        : row
    )))
    setDetailData((prev) => {
      if (!prev || prev.id !== orderId) return prev
      const byId = new Map(result.lines.map((line) => [line.id, line]))
      return {
        ...prev,
        inboundLines: result.lines,
        inboundOrderedQty: result.orderedQty,
        inboundReceivedQty: result.receivedQty,
        inboundState: result.state,
        items: prev.items.map((item) => {
          const line = byId.get(item.id)
          return line
            ? { ...item, inboundQty: line.inboundQty, inboundNote: line.inboundNote || null }
            : item
        }),
      }
    })
    setInboundDrafts(result.lines.map((line) => {
      const prev = drafts.find((item) => item.id === line.id)
      return {
        ...line,
        unitPrice: prev?.unitPrice ?? line.unitPrice,
        lineAmount: prev?.lineAmount ?? line.lineAmount,
        costPrice: prev?.costPrice ?? line.costPrice,
        supplierName: prev?.supplierName || line.supplierName,
        supplierUrl: prev?.supplierUrl || line.supplierUrl,
        shipmentImageUrl: line.shipmentImageUrl || prev?.shipmentImageUrl || null,
        acknowledged: false,
        openedQty: line.inboundQty,
        openedNote: line.inboundNote || '',
        openedStage: line.inboundStage || 'PENDING',
        openedImage: line.shipmentImageUrl || '',
      }
    }))
  }

  const saveInboundDrafts = async (drafts: OrderInboundLine[], options?: { allowEmpty?: boolean; keepOpen?: boolean; quiet?: boolean }) => {
    if (!inboundOrderId) return
    const changed = drafts.filter((line) => (
      line.acknowledged
      || line.inboundQty !== line.openedQty
      || (line.inboundNote || '') !== (line.openedNote || '')
      || (line.inboundStage || 'PENDING') !== (line.openedStage || 'PENDING')
      || (line.shipmentImageUrl || '') !== (line.openedImage || '')
    ))
    if (!changed.length) {
      if (options?.allowEmpty) {
        if (!options?.quiet) toast.success('已保存')
        return
      }
      toast.error('请先修改到货数量，或点这一行的确认')
      return
    }
    try {
      setInboundSaving(true)
      const result = await updateOrderInbound({
        orderId: inboundOrderId,
        lines: changed.map((line) => ({
          orderItemId: line.id,
          inboundQty: line.inboundQty,
          inboundNote: line.inboundNote,
          inboundStage: line.inboundStage || 'PENDING',
          confirmed: Boolean(line.acknowledged) || line.inboundQty !== line.openedQty,
          ...((line.shipmentImageUrl || '') !== (line.openedImage || '')
            ? { shipmentImageUrl: line.shipmentImageUrl || '' }
            : {}),
        })),
      })
      rememberInboundResult(inboundOrderId, drafts, result)
      setList((prev) => prev.map((row) => (
        row.id === inboundOrderId
          ? {
              ...row,
              inboundLines: result.lines,
              inboundOrderedQty: result.orderedQty,
              inboundReceivedQty: result.receivedQty,
              inboundState: result.state,
            }
          : row
      )))
      setDetailData((prev) => {
        if (!prev || prev.id !== inboundOrderId) return prev
        const byId = new Map(result.lines.map((line) => [line.id, line]))
        return {
          ...prev,
          inboundLines: result.lines,
          inboundOrderedQty: result.orderedQty,
          inboundReceivedQty: result.receivedQty,
          inboundState: result.state,
          items: prev.items.map((item) => {
            const line = byId.get(item.id)
            return line
              ? { ...item, inboundQty: line.inboundQty, inboundNote: line.inboundNote || null }
              : item
          }),
        }
      })
      toast.success('入库情况已保存')
      if (!options?.keepOpen) {
        clearInboundDraftStore(inboundOrderId)
        inboundClosing.current = true
        syncInboundQuery(false, null)
        setInboundOrderId(null)
      }
    } catch (err: any) {
      toast.error(err.message || '入库保存失败')
    } finally {
      setInboundSaving(false)
    }
  }

  const submitInbound = async (options?: { allowEmpty?: boolean; keepOpen?: boolean; quiet?: boolean }) => {
    await saveInboundDrafts(inboundDrafts, options)
  }

  const applyInboundImport = async (patches: Array<{ id: string } & Partial<OrderInboundLine>>) => {
    const byId = new Map(patches.map((patch) => [patch.id, patch]))
    const next = inboundDrafts.map((line) => {
      const patch = byId.get(line.id)
      if (!patch) return line
      const merged = { ...line, ...patch }
      const ordered = Math.max(0, Number(line.quantity) || 0)
      const qty = Math.max(0, Math.floor(Number(merged.inboundQty) || 0))
      merged.inboundQty = ordered > 0 ? Math.min(ordered, qty) : 0
      return merged
    })
    setInboundDrafts(next)
    await saveInboundDrafts(next, { allowEmpty: true, keepOpen: true })
  }

  const appendInboundGoods = async (lines: Array<{ skuCode: string; quantity?: number; unitPrice?: number | null; inboundQty?: number; inboundNote?: string; inboundStage?: string; shipmentImageUrl?: string | null }>) => {
    if (!inboundOrderId) return null
    const ready = (lines || []).filter((line) => String(line.skuCode || '').trim())
    if (!ready.length) {
      toast.error('请填写要加货的 SKU')
      return null
    }
    try {
      setInboundSaving(true)
      const result = await appendOrderGoods({ orderId: inboundOrderId, lines: ready })
      rememberInboundResult(inboundOrderId, inboundDrafts, result)
      setList((prev) => prev.map((row) => (
        row.id === inboundOrderId ? { ...row, totalAmount: result.totalAmount } : row
      )))
      if (result.missingSkus?.length) toast.error(`未找到 SKU：${result.missingSkus.join('、')}`)
      if (result.addedCount) toast.success(`已加货 ${result.addedCount} 个商品`)
      return { missingSkus: result.missingSkus || [], addedCount: result.addedCount || 0 }
    } catch (err: any) {
      toast.error(err.message || '加货失败')
      return null
    } finally {
      setInboundSaving(false)
    }
  }

  const updateInboundDiscount = async (discountPercent: number) => {
    if (!inboundOrderId) return
    try {
      setInboundSaving(true)
      const result = await updateOrderDiscount({ orderId: inboundOrderId, discountPercent })
      const drafts = inboundDrafts
      setList((prev) => prev.map((row) => (
        row.id === inboundOrderId
          ? {
              ...row,
              subtotalAmount: result.subtotalAmount,
              discountAmount: result.discountAmount,
              totalAmount: result.totalAmount,
              inboundLines: result.lines,
              inboundOrderedQty: result.orderedQty,
              inboundReceivedQty: result.receivedQty,
              inboundState: result.state,
            }
          : row
      )))
      setDetailData((prev) => {
        if (!prev || prev.id !== inboundOrderId) return prev
        return {
          ...prev,
          subtotalAmount: result.subtotalAmount,
          discountAmount: result.discountAmount,
          totalAmount: result.totalAmount,
          inboundLines: result.lines,
        }
      })
      setInboundDrafts(result.lines.map((line) => {
        const prev = drafts.find((item) => item.id === line.id)
        if (!prev) {
          return {
            ...line,
            acknowledged: false,
            openedQty: line.inboundQty,
            openedNote: line.inboundNote || '',
            openedStage: line.inboundStage || 'PENDING',
            openedImage: line.shipmentImageUrl || '',
          }
        }
        return {
          ...line,
          inboundQty: prev.inboundQty,
          inboundNote: prev.inboundNote,
          inboundStage: prev.inboundStage,
          shipmentImageUrl: prev.shipmentImageUrl,
          unitPrice: prev.unitPrice ?? line.unitPrice,
          lineAmount: prev.lineAmount ?? line.lineAmount,
          costPrice: prev.costPrice ?? line.costPrice,
          supplierName: line.supplierName,
          supplierUrl: prev.supplierUrl || line.supplierUrl,
          acknowledged: prev.acknowledged,
          openedQty: prev.openedQty,
          openedNote: prev.openedNote,
          openedStage: prev.openedStage,
          openedImage: prev.openedImage,
        }
      }))
      toast.success(`折扣已改为 ${result.discountPercent}%`)
    } catch (err: any) {
      toast.error(err.message || '修改折扣失败')
    } finally {
      setInboundSaving(false)
    }
  }

  const appendManualOrderLineToOrder = async (input: { imageUrl?: string | null; unitPrice?: number | null; quantity?: number | null; costPrice?: number | null; lineAmount?: number | null; lines?: Array<{ imageUrl?: string | null; unitPrice?: number | null; quantity?: number | null; costPrice?: number | null; lineAmount?: number | null }> }) => {
    if (!inboundOrderId) return false
    try {
      setInboundSaving(true)
      const result = await appendManualOrderLine({ orderId: inboundOrderId, ...input })
      const drafts = inboundDrafts
      setList((prev) => prev.map((row) => (
        row.id === inboundOrderId
          ? {
              ...row,
              subtotalAmount: result.subtotalAmount,
              discountAmount: result.discountAmount,
              totalAmount: result.totalAmount,
              inboundLines: result.lines,
              inboundOrderedQty: result.orderedQty,
              inboundReceivedQty: result.receivedQty,
              inboundState: result.state,
            }
          : row
      )))
      setDetailData((prev) => {
        if (!prev || prev.id !== inboundOrderId) return prev
        return {
          ...prev,
          subtotalAmount: result.subtotalAmount,
          discountAmount: result.discountAmount,
          totalAmount: result.totalAmount,
          inboundLines: result.lines,
        }
      })
      setInboundDrafts(result.lines.map((line) => {
        const prev = drafts.find((item) => item.id === line.id)
        if (!prev) {
          return {
            ...line,
            acknowledged: false,
            openedQty: line.inboundQty,
            openedNote: line.inboundNote || '',
            openedStage: line.inboundStage || 'PENDING',
            openedImage: line.shipmentImageUrl || '',
          }
        }
        return {
          ...line,
          inboundQty: prev.inboundQty,
          inboundNote: prev.inboundNote,
          inboundStage: prev.inboundStage,
          shipmentImageUrl: prev.shipmentImageUrl,
          unitPrice: prev.unitPrice ?? line.unitPrice,
          lineAmount: prev.lineAmount ?? line.lineAmount,
          costPrice: prev.costPrice ?? line.costPrice,
          supplierName: prev.supplierName || line.supplierName,
          supplierUrl: prev.supplierUrl || line.supplierUrl,
          acknowledged: prev.acknowledged,
          openedQty: prev.openedQty,
          openedNote: prev.openedNote,
          openedStage: prev.openedStage,
          openedImage: prev.openedImage,
        }
      }))
      toast.success(input.lines && input.lines.length > 1 ? `已存入 ${input.lines.length} 行` : '已加到最后一行')
      return true
    } catch (err: any) {
      toast.error(err.message || '保存加货失败')
      return false
    } finally {
      setInboundSaving(false)
    }
  }

  const importInboundSheetFile = async (input: { fileBase64: string; fileName?: string }) => {
    if (!inboundOrderId) return false
    try {
      setInboundSaving(true)
      const result = await importInboundSheet({ orderId: inboundOrderId, ...input })
      const drafts = inboundDrafts
      setList((prev) => prev.map((row) => (
        row.id === inboundOrderId
          ? {
              ...row,
              subtotalAmount: result.subtotalAmount,
              discountAmount: result.discountAmount,
              totalAmount: result.totalAmount,
              inboundLines: result.lines,
              inboundOrderedQty: result.orderedQty,
              inboundReceivedQty: result.receivedQty,
              inboundState: result.state,
            }
          : row
      )))
      setDetailData((prev) => {
        if (!prev || prev.id !== inboundOrderId) return prev
        return {
          ...prev,
          subtotalAmount: result.subtotalAmount,
          discountAmount: result.discountAmount,
          totalAmount: result.totalAmount,
          inboundLines: result.lines,
        }
      })
      setInboundDrafts(result.lines.map((line) => {
        const prev = drafts.find((item) => item.id === line.id)
        if (!prev) {
          return {
            ...line,
            acknowledged: false,
            openedQty: line.inboundQty,
            openedNote: line.inboundNote || '',
            openedStage: line.inboundStage || 'PENDING',
            openedImage: line.shipmentImageUrl || '',
          }
        }
        return {
          ...line,
          inboundQty: prev.inboundQty,
          inboundNote: prev.inboundNote,
          inboundStage: prev.inboundStage,
          shipmentImageUrl: prev.shipmentImageUrl ?? line.shipmentImageUrl,
          unitPrice: line.unitPrice,
          lineAmount: line.lineAmount,
          costPrice: line.costPrice ?? prev.costPrice,
          supplierName: prev.supplierName || line.supplierName,
          supplierUrl: prev.supplierUrl || line.supplierUrl,
          acknowledged: prev.acknowledged,
          openedQty: prev.openedQty,
          openedNote: prev.openedNote,
          openedStage: prev.openedStage,
          openedImage: prev.openedImage,
        }
      }))
      toast.success(`已存入 ${result.addedCount} 行，价格和数量可以之后再补`)
      return true
    } catch (err: any) {
      toast.error(err.message || '导入表格失败')
      return false
    } finally {
      setInboundSaving(false)
    }
  }

  const updateManualOrderLineOnOrder = async (input: { orderItemId: string; unitPrice?: number | null; quantity?: number | null; lineAmount?: number | null; costPrice?: number | null; supplierName?: string | null; productName?: string | null }) => {
    if (!inboundOrderId) return false
    try {
      setInboundSaving(true)
      const result = await updateManualOrderLine({ orderId: inboundOrderId, ...input })
      const drafts = inboundDrafts
      setList((prev) => prev.map((row) => (
        row.id === inboundOrderId
          ? {
              ...row,
              subtotalAmount: result.subtotalAmount,
              discountAmount: result.discountAmount,
              totalAmount: result.totalAmount,
              inboundLines: result.lines,
              inboundOrderedQty: result.orderedQty,
              inboundReceivedQty: result.receivedQty,
              inboundState: result.state,
            }
          : row
      )))
      setDetailData((prev) => {
        if (!prev || prev.id !== inboundOrderId) return prev
        return {
          ...prev,
          subtotalAmount: result.subtotalAmount,
          discountAmount: result.discountAmount,
          totalAmount: result.totalAmount,
          inboundLines: result.lines,
        }
      })
      setInboundDrafts(result.lines.map((line) => {
        const prev = drafts.find((item) => item.id === line.id)
        if (!prev) {
          return {
            ...line,
            acknowledged: false,
            openedQty: line.inboundQty,
            openedNote: line.inboundNote || '',
            openedStage: line.inboundStage || 'PENDING',
            openedImage: line.shipmentImageUrl || '',
          }
        }
        return {
          ...line,
          inboundQty: Math.min(prev.inboundQty, line.quantity),
          inboundNote: prev.inboundNote,
          inboundStage: prev.inboundStage,
          shipmentImageUrl: prev.shipmentImageUrl ?? line.shipmentImageUrl,
          unitPrice: line.unitPrice,
          lineAmount: line.lineAmount,
          costPrice: line.costPrice,
          supplierName: prev.supplierName || line.supplierName,
          supplierUrl: prev.supplierUrl || line.supplierUrl,
          acknowledged: prev.acknowledged,
          openedQty: prev.openedQty,
          openedNote: prev.openedNote,
          openedStage: prev.openedStage,
          openedImage: prev.openedImage,
        }
      }))
      return true
    } catch (err: any) {
      toast.error(err.message || '保存价格失败')
      return false
    } finally {
      setInboundSaving(false)
    }
  }


  const deleteInboundLinesOnOrder = async (lineIds: string[]) => {
    if (!inboundOrderId) return false
    const ids = [...new Set(lineIds.map((id) => String(id || '').trim()).filter(Boolean))]
    if (!ids.length) {
      toast.error('请先勾选要删除的商品')
      return false
    }
    try {
      setInboundSaving(true)
      const result = await deleteInboundLines({ orderId: inboundOrderId, lineIds: ids })
      const drafts = inboundDrafts
      setList((prev) => prev.map((row) => (
        row.id === inboundOrderId
          ? {
              ...row,
              subtotalAmount: result.subtotalAmount,
              discountAmount: result.discountAmount,
              totalAmount: result.totalAmount,
              inboundLines: result.lines,
              inboundOrderedQty: result.orderedQty,
              inboundReceivedQty: result.receivedQty,
              inboundState: result.state,
            }
          : row
      )))
      setDetailData((prev) => {
        if (!prev || prev.id !== inboundOrderId) return prev
        return {
          ...prev,
          subtotalAmount: result.subtotalAmount,
          discountAmount: result.discountAmount,
          totalAmount: result.totalAmount,
          inboundLines: result.lines,
        }
      })
      setInboundDrafts(result.lines.map((line) => {
        const prev = drafts.find((item) => item.id === line.id)
        if (!prev) {
          return {
            ...line,
            acknowledged: false,
            openedQty: line.inboundQty,
            openedNote: line.inboundNote || '',
            openedStage: line.inboundStage || 'PENDING',
            openedImage: line.shipmentImageUrl || '',
          }
        }
        return {
          ...prev,
          ...line,
          inboundQty: Math.min(prev.inboundQty, line.quantity),
          inboundNote: prev.inboundNote,
          inboundStage: prev.inboundStage,
        }
      }))
      toast.success(ids.length > 1 ? `已删除 ${ids.length} 件商品` : '已删除商品')
      return true
    } catch (err: any) {
      toast.error(err.message || '删除失败')
      return false
    } finally {
      setInboundSaving(false)
    }
  }

  const importCustomerOrderFile = async (input: { email: string; fileBase64: string; fileName?: string; shippingMethod?: string; weightGrams?: number | null; orderNote?: string; status?: OrderStatus }) => {
    try {
      const result = await importCustomerOrder(input, { __rpcTimeoutMs: 90_000 })
      toast.success(`已生成订单 ${result.orderNo}`)
      const nextForm = { ...filterForm, status: undefined, page: 1 }
      setFilterForm(nextForm)
      fetchList(nextForm)
      fetchStats()
      return result
    } catch (err: any) {
      toast.error(err.message || '导入订单失败')
      return null
    }
  }

  const exportInboundSheet = async (input: ExportInboundSheetInput) => {
    if (!input.rows?.length) {
      toast.error('请先勾选要导出的商品')
      return
    }
    if (input.mode !== 'images' && !input.columns?.length) {
      toast.error('请先勾选要导出的列')
      return
    }
    try {
      setExportLoading(true)
      const toastId = 'inbound-sheet'
      toast.loading(input.mode === 'images' ? '正在导出发货图片…' : '正在下载表格…', { id: toastId })
      const result = await exportInboundSheetAction(input, { __rpcTimeoutMs: 90_000 })
      const bytes = decodeExcelBase64(result?.fileBase64)
      const blob = new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = result.fileName || (input.mode === 'images' ? 'shipping-images.xlsx' : 'inbound.xlsx')
      anchor.rel = 'noopener'
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      toast.success(result.embeddedThumbnails ? '表格已下载（含商品图片）' : '表格已下载', { id: toastId })
    } catch (err: any) {
      toast.error(err.message || '导出失败', { id: 'inbound-sheet' })
    } finally {
      setExportLoading(false)
    }
  }

  const jumpToCustomer = (email: string) => {
    UserManagement.navigateToWithFilters(router, { account: '', email, role: 'CUSTOMER', status: '' })
  }

  return {
    state: {
      stats,
      statsLoading,
      list,
      total,
      listLoading,
      filterForm,
      detailData,
      detailLoading,
      isStatusDialogOpen,
      statusForm,
      shipForm,
      isLogisticsDialogOpen,
      logisticsForm,
      queryOrderId,
      remarkDrafts,
      remarkSavingId,
      exportLoading,
      inboundOrderId,
      inboundDrafts,
      inboundSaving,
      inboundShipments,
    },
    handlers: {
      handleFilterChange,
      handleSearchClick,
      handleClearFilter,
      handleTabChange,
      handlePageChange,
      handlePageSizeChange,
      handleOpenDetail,
      handleCloseDetail,
      handleShipFormChange,
      submitShipOrder,
      openStatusDialog,
      setIsStatusDialogOpen,
      submitStatusChange,
      setStatusForm,
      openLogisticsDialog,
      setIsLogisticsDialogOpen,
      submitLogisticsSegment,
      setLogisticsForm,
      jumpToCustomer,
      handleQuickStatusChange,
      handleRemarkDraftChange,
      submitOrderRemark,
      handleExportExcel,
      openInboundDialog,
      closeInboundDialog,
      setInboundDraft,
      markInboundLineFull,
      acknowledgeInboundLine,
      persistInboundLine,
      persistInboundStages,
      markInboundAllFull,
      submitInbound,
      applyInboundImport,
      appendInboundGoods,
      updateInboundDiscount,
      appendManualOrderLine: appendManualOrderLineToOrder,
      importInboundSheet: importInboundSheetFile,
      updateManualOrderLine: updateManualOrderLineOnOrder,
      deleteInboundLines: deleteInboundLinesOnOrder,
      importCustomerOrder: importCustomerOrderFile,
      saveInboundShipment: saveInboundShipmentRows,
      updateInboundShipment: updateInboundShipmentRow,
      exportInboundSheet,
    },
  }
}