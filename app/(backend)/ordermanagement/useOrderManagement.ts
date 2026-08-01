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
  updateOrderStatus
} from '@/backend/actions/OrderManagement'

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
    pageSize: 20,
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
    const defaultForm: GetOrderListInput = { page: 1, pageSize: 20 }
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
    if (!statusForm.actionNote) {
      toast.error('必须填写操作备注')
      return
    }
    try {
      await updateOrderStatus(statusForm)
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
    },
    handlers: {
      handleFilterChange,
      handleSearchClick,
      handleClearFilter,
      handleTabChange,
      handlePageChange,
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
    },
  }
}
