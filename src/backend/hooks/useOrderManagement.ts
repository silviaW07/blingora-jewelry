'use client'

import { useState, useEffect, useMemo } from 'react'
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
  exportOrdersExcel,
} from '@/backend/actions/OrderManagement'

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
    },
  }
}