'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { UserManagement, OrderManagement } from '@/backend/route-params'
import {
  getUserList,
  getUserDetail,
  updateUserStatus,
  deleteUser,
  updateUserAdminNote,
  updateUserCustomerTag,
  impersonateCustomer,
} from '@/backend/actions/UserManagement'
import { CUSTOMER_TAG_OPTIONS } from '@/backend/lib/customerTags'
import type {
  SysUserRole,
  SysUserStatus,
  UserListItem,
  UserDetail,
  UserListSortField,
  SortDirection,
  CustomerTagCode,
} from '@/backend/actions/UserManagement'
import { useUserSession } from '@/tools/FrontendSession'
import { toast } from 'sonner'

type FilterFields = {
  account: string
  email: string
}

const STATUS_LABELS: Record<SysUserStatus, string> = {
  ACTIVE: '激活',
  DISABLED: '禁用',
}

const ROLE_LABELS: Record<SysUserRole, string> = {
  CUSTOMER: '普通客户',
  ADMIN: '管理员',
}

export interface UserManagementState {
  urlParams: ReturnType<typeof UserManagement.getParams>
  localFilters: FilterFields
  page: number
  pageSize: number
  totalPages: number
  loading: boolean
  list: UserListItem[]
  total: number
  detailLoading: boolean
  detailData: UserDetail | null
  deleteDialogOpen: boolean
  userToDelete: UserListItem | null
  actionLoading: boolean
  noteEditingId: string | null
  noteEditingValue: string
  noteSaving: boolean
  tagSavingId: string | null
  impersonatingId: string | null
  sortBy: UserListSortField
  sortOrder: SortDirection
  STATUS_LABELS: Record<SysUserStatus, string>
  ROLE_LABELS: Record<SysUserRole, string>
  CUSTOMER_TAG_OPTIONS: typeof CUSTOMER_TAG_OPTIONS
  isDetailMode: boolean
}

export interface UserManagementHandlers {
  handleTextChange: <K extends keyof FilterFields>(field: K, value: FilterFields[K]) => void
  handleCompositionStart: () => void
  handleCompositionEnd: <K extends keyof FilterFields>(field: K) => void
  handleSelectChange: (key: 'role' | 'status', val: string) => void
  handleResetFilters: () => void
  handlePageChange: (newPage: number) => void
  handlePageSizeChange: (newPageSize: number) => void
  handleOpenDetail: (id: string) => void
  handleBackToList: () => void
  handleToggleStatus: (id: string, currentStatus: SysUserStatus) => Promise<void>
  handleRequestDelete: (user: UserListItem) => void
  handleConfirmDelete: () => Promise<void>
  setDeleteDialogOpen: (open: boolean) => void
  handleSort: (field: UserListSortField) => void
  startNoteEdit: (userId: string, current: string | null) => void
  changeNoteEditingValue: (value: string) => void
  cancelNoteEdit: () => void
  saveNoteEdit: () => Promise<void>
  handleCustomerTagChange: (userId: string, tagCode: CustomerTagCode) => Promise<void>
  handleImpersonate: (userId: string) => Promise<void>
  handleOpenOrder: (orderId: string) => void
  handleCopyOrderNo: (orderNo: string) => Promise<void>
  formatDateTime: (isoString: string | null) => string
  formatUsd: (amount: number) => string
}

export function useUserManagement(): {
  state: UserManagementState
  handlers: UserManagementHandlers
} {
  const router = useRouter()
  const searchParams = useSearchParams()
  const frontendSession = useUserSession()

  const urlParams = useMemo(() => UserManagement.getParams(searchParams), [searchParams])
  const isDetailMode = !!urlParams.userId

  const [localFilters, setLocalFilters] = useState({
    account: urlParams.account,
    email: urlParams.email,
  })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  const [loading, setLoading] = useState(false)
  const [list, setList] = useState<UserListItem[]>([])
  const [total, setTotal] = useState(0)

  const [detailLoading, setDetailLoading] = useState(false)
  const [detailData, setDetailData] = useState<UserDetail | null>(null)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<UserListItem | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const [noteEditingId, setNoteEditingId] = useState<string | null>(null)
  const [noteEditingValue, setNoteEditingValue] = useState('')
  const [noteSaving, setNoteSaving] = useState(false)
  const [tagSavingId, setTagSavingId] = useState<string | null>(null)
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null)

  const isComposingRef = useRef(false)

  const sortBy = (urlParams.sortBy as UserListSortField) || 'createdAt'
  const sortOrder = (urlParams.sortOrder as SortDirection) || 'desc'

  useEffect(() => {
    setLocalFilters({
      account: urlParams.account,
      email: urlParams.email,
    })
  }, [urlParams])

  const loadData = useCallback(async () => {
    if (isDetailMode) return
    setLoading(true)
    try {
      const result = await getUserList({
        account: urlParams.account,
        email: urlParams.email,
        role: urlParams.role === 'ALL' ? '' : ((urlParams.role as SysUserRole | '') || 'CUSTOMER'),
        status: urlParams.status as SysUserStatus | '',
        sortBy,
        sortOrder,
        page,
        pageSize,
      })
      setList(result.list)
      setTotal(result.total)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [urlParams, page, pageSize, isDetailMode, sortBy, sortOrder])

  const loadDetail = useCallback(async () => {
    if (!urlParams.userId) {
      setDetailData(null)
      return
    }
    setDetailLoading(true)
    try {
      const detail = await getUserDetail({ id: urlParams.userId })
      setDetailData(detail)
    } catch (e: any) {
      toast.error(e.message || '加载客户详情失败')
      setDetailData(null)
    } finally {
      setDetailLoading(false)
    }
  }, [urlParams.userId])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    loadDetail()
  }, [loadDetail])

  const pushFilters = (next: Partial<ReturnType<typeof UserManagement.getParams>>) => {
    UserManagement.navigateToWithFilters(router, {
      account: urlParams.account,
      email: urlParams.email,
      role: urlParams.role || 'CUSTOMER',
      status: urlParams.status,
      sortBy: urlParams.sortBy || 'createdAt',
      sortOrder: urlParams.sortOrder || 'desc',
      ...next,
      userId: next.userId === undefined ? '' : next.userId,
    })
  }

  const handleTextChange = <K extends keyof FilterFields>(field: K, value: FilterFields[K]) => {
    setLocalFilters(prev => ({ ...prev, [field]: value }))
    if (!isComposingRef.current) {
      pushFilters({ [field]: value })
      setPage(1)
    }
  }

  const handleCompositionStart = () => {
    isComposingRef.current = true
  }

  const handleCompositionEnd = <K extends keyof FilterFields>(field: K) => {
    isComposingRef.current = false
    pushFilters({ [field]: localFilters[field] })
    setPage(1)
  }

  const handleSelectChange = (key: 'role' | 'status', val: string) => {
    if (key === 'status') {
      pushFilters({ status: val === 'ALL' ? '' : val })
    } else {
      pushFilters({ role: val })
    }
    setPage(1)
  }

  const handleResetFilters = () => {
    setLocalFilters({ account: '', email: '' })
    setPage(1)
    UserManagement.navigateToWithFilters(router, {
      account: '',
      email: '',
      role: 'CUSTOMER',
      status: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      userId: '',
    })
  }

  const handlePageChange = (newPage: number) => setPage(newPage)

  const handlePageSizeChange = (newPageSize: number) => {
    const size = Math.max(1, Math.min(200, Math.floor(Number(newPageSize) || 50)))
    setPageSize(size)
    setPage(1)
  }

  const handleOpenDetail = (id: string) => {
    UserManagement.navigateToDetail(router, { userId: id })
  }

  const handleBackToList = () => {
    pushFilters({ userId: '' })
  }

  const handleToggleStatus = async (id: string, currentStatus: SysUserStatus) => {
    const nextStatus: SysUserStatus = currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
    try {
      setActionLoading(true)
      await updateUserStatus({ id, status: nextStatus })
      toast.success(nextStatus === 'ACTIVE' ? '已启用' : '已禁用')
      await loadData()
      if (detailData?.id === id) await loadDetail()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRequestDelete = (user: UserListItem) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!userToDelete) return
    try {
      setActionLoading(true)
      await deleteUser({ id: userToDelete.id })
      toast.success('客户已删除')
      setDeleteDialogOpen(false)
      setUserToDelete(null)
      if (urlParams.userId === userToDelete.id) handleBackToList()
      else await loadData()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleSort = (field: UserListSortField) => {
    const nextOrder: SortDirection =
      sortBy === field && sortOrder === 'desc' ? 'asc' : 'desc'
    pushFilters({ sortBy: field, sortOrder: nextOrder })
    setPage(1)
  }

  const startNoteEdit = (userId: string, current: string | null) => {
    setNoteEditingId(userId)
    setNoteEditingValue(current || '')
  }

  const changeNoteEditingValue = (value: string) => setNoteEditingValue(value)
  const cancelNoteEdit = () => {
    setNoteEditingId(null)
    setNoteEditingValue('')
  }

  const saveNoteEdit = async () => {
    if (!noteEditingId) return
    setNoteSaving(true)
    try {
      await updateUserAdminNote({ id: noteEditingId, adminNote: noteEditingValue })
      toast.success('备注已保存')
      setList(prev =>
        prev.map(item =>
          item.id === noteEditingId ? { ...item, adminNote: noteEditingValue.trim() || null } : item
        )
      )
      if (detailData?.id === noteEditingId) {
        setDetailData(prev => (prev ? { ...prev, adminNote: noteEditingValue.trim() || null } : prev))
      }
      cancelNoteEdit()
    } catch (e: any) {
      toast.error(e.message || '备注保存失败')
    } finally {
      setNoteSaving(false)
    }
  }

  const handleCustomerTagChange = async (userId: string, tagCode: CustomerTagCode) => {
    const prev = list.find(item => item.id === userId)
    const prevCode = prev?.customerTagCode || ''
    const prevName = prev?.customerTagName || null
    const nextName = tagCode
      ? CUSTOMER_TAG_OPTIONS.find(item => item.code === tagCode)?.name || null
      : null

    setList(current =>
      current.map(item =>
        item.id === userId
          ? { ...item, customerTagCode: tagCode, customerTagName: nextName }
          : item
      )
    )
    if (detailData?.id === userId) {
      setDetailData(current =>
        current
          ? { ...current, customerTagCode: tagCode, customerTagName: nextName }
          : current
      )
    }

    setTagSavingId(userId)
    try {
      await updateUserCustomerTag({ id: userId, tagCode })
      toast.success('客户标签已保存')
    } catch (e: any) {
      setList(current =>
        current.map(item =>
          item.id === userId
            ? { ...item, customerTagCode: prevCode as CustomerTagCode, customerTagName: prevName }
            : item
        )
      )
      if (detailData?.id === userId) {
        setDetailData(current =>
          current
            ? { ...current, customerTagCode: prevCode as CustomerTagCode, customerTagName: prevName }
            : current
        )
      }
      toast.error(e.message || '客户标签保存失败')
    } finally {
      setTagSavingId(null)
    }
  }

  const handleImpersonate = async (userId: string) => {
    setImpersonatingId(userId)
    try {
      const result = await impersonateCustomer({ userId })
      frontendSession.set({
        token: result.token,
        user_id: result.user_id,
        username: result.username,
        email: result.email,
        preferredLocale: result.preferred_locale,
        role: 'CUSTOMER',
      })
      toast.success('已切换为客户身份，正在打开前台购物车')
      window.open(result.redirect_path, '_blank', 'noopener,noreferrer')
    } catch (e: any) {
      toast.error(e.message || '免密登入失败')
    } finally {
      setImpersonatingId(null)
    }
  }

  const handleOpenOrder = (orderId: string) => {
    OrderManagement.navigateToWithParams(router, {
      status: 'PENDING_PAYMENT',
      orderId,
    })
  }

  const handleCopyOrderNo = async (orderNo: string) => {
    try {
      await navigator.clipboard.writeText(orderNo)
      toast.success('订单号已复制')
    } catch {
      toast.error('复制失败，请手动选择订单号')
    }
  }

  const formatDateTime = (isoString: string | null) => {
    if (!isoString) return '--'
    const date = new Date(isoString)
    if (Number.isNaN(date.getTime())) return '--'
    return date.toLocaleString('zh-CN', { hour12: false })
  }

  const formatUsd = (amount: number) => `US$ ${Number(amount || 0).toFixed(2)}`

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return {
    state: {
      urlParams,
      localFilters,
      page,
      pageSize,
      totalPages,
      loading,
      list,
      total,
      detailLoading,
      detailData,
      deleteDialogOpen,
      userToDelete,
      actionLoading,
      noteEditingId,
      noteEditingValue,
      noteSaving,
      tagSavingId,
      impersonatingId,
      sortBy,
      sortOrder,
      STATUS_LABELS,
      ROLE_LABELS,
      CUSTOMER_TAG_OPTIONS,
      isDetailMode,
    },
    handlers: {
      handleTextChange,
      handleCompositionStart,
      handleCompositionEnd,
      handleSelectChange,
      handleResetFilters,
      handlePageChange,
      handlePageSizeChange,
      handleOpenDetail,
      handleBackToList,
      handleToggleStatus,
      handleRequestDelete,
      handleConfirmDelete,
      setDeleteDialogOpen,
      handleSort,
      startNoteEdit,
      changeNoteEditingValue,
      cancelNoteEdit,
      saveNoteEdit,
      handleCustomerTagChange,
      handleImpersonate,
      handleOpenOrder,
      handleCopyOrderNo,
      formatDateTime,
      formatUsd,
    },
  }
}
