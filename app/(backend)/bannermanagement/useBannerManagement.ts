'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { CategoryManagement } from '@/backend/route-params'
import { toast } from 'sonner'
import { upload_image_file } from '@/tools/tools'

import type {
  BannerFilterStatus,
  BannerItem,
  CreateBannerInput,
  UpdateBannerInput,
} from '@/backend/actions/BannerManagement'
import {
  getBannerList,
  createBanner,
  updateBanner,
  deleteBanner,
  batchDeleteBanners,
  batchUpdateBannerStatus,
  updateBannerSortWeight,
  updateBannerStatus,
} from '@/backend/actions/BannerManagement'

// Inner Type
type FormMode = 'CREATE' | 'EDIT' | null

// Export States
export interface BannerManagementState {
  /** 加载状态 */
  loading: boolean
  /** Banner 列表数据 */
  list: BannerItem[]
  /** 总条数 */
  total: number
  /** 输入框中的搜索关键词（未点击查询前） */
  inputKeyword: string
  /** 过滤状态 */
  filterStatus: BannerFilterStatus
  /** 当前页码 */
  page: number
  /** 每页条数 */
  pageSize: number
  /** 已选中的行 ID 集合 */
  selectedIds: string[]
  /** 行内编辑的权重暂存值 */
  editingWeights: Record<string, number>
  /** 弹窗模式：新增、编辑或关闭 */
  formMode: FormMode
  /** 表单数据 */
  formData: CreateBannerInput | UpdateBannerInput | null
  /** 图片上传中状态 */
  uploading: boolean
  /** 表单提交中状态 */
  submitting: boolean
  /** 总页数 */
  totalPages: number
  /** 是否全选 */
  isAllSelected: boolean
  /** 状态标签映射 */
  STATUS_LABELS: Record<BannerFilterStatus, string>
}

// Export Handlers
export interface BannerManagementHandlers {
  /** 设置输入关键词 */
  setInputKeyword: (val: string) => void
  /** 设置过滤状态 */
  setFilterStatus: (val: BannerFilterStatus) => void
  /** 执行搜索 */
  handleSearch: () => void
  /** 重置筛选条件 */
  handleReset: () => void
  /** 批量删除 */
  handleBatchDelete: () => Promise<void>
  /** 批量更新启用状态 */
  handleBatchUpdateStatus: (targetStatus: boolean) => Promise<void>
  /** 打开新增弹窗 */
  openCreateModal: () => void
  /** 全选/取消全选 */
  handleSelectAll: (checked: boolean) => void
  /** 选中/取消选中单行 */
  handleSelectRow: (id: string, checked: boolean) => void
  /** 设置行内编辑权重 */
  setEditingWeights: (updater: (prev: Record<string, number>) => Record<string, number>) => void
  /** 快速更新排序权重 */
  handleQuickUpdateSortWeight: (id: string, originalWeight: number) => Promise<void>
  /** 快速更新启用状态 */
  handleQuickUpdateStatus: (id: string, newStatus: boolean) => Promise<void>
  /** 打开编辑弹窗 */
  openEditModal: (item: BannerItem) => void
  /** 删除单项 */
  handleDelete: (id: string) => Promise<void>
  /** 设置分页大小 */
  handlePageSizeChange: (size: number) => void
  /** 设置当前页码 */
  setPage: (updater: number | ((p: number) => number)) => void
  /** 关闭弹窗 */
  closeFormModal: () => void
  /** 处理表单字段变更 */
  handleFormFieldChange: <K extends keyof (CreateBannerInput & UpdateBannerInput)>(field: K, value: any) => void
  /** 处理图片上传 */
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
  /** 提交表单 */
  handleFormSubmit: () => Promise<void>
  /** 复制链接 */
  handleCopyLink: (link: string) => void
  /** 跳转到分类管理 */
  navigateToCategoryManagement: () => void
}

export function useBannerManagement(): {
  state: BannerManagementState
  handlers: BannerManagementHandlers
} {
  const router = useRouter()

  const STATUS_LABELS: Record<BannerFilterStatus, string> = {
    ALL: '全部状态',
    ENABLED: '已启用',
    DISABLED: '已禁用',
  }

  // ===== 状态管理 =====
  const [loading, setLoading] = useState<boolean>(true)
  const [list, setList] = useState<BannerItem[]>([])
  const [total, setTotal] = useState<number>(0)
  const [filterKeyword, setFilterKeyword] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<BannerFilterStatus>('ALL')
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(20)
  const [inputKeyword, setInputKeyword] = useState<string>('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [editingWeights, setEditingWeights] = useState<Record<string, number>>({})
  const [formMode, setFormMode] = useState<FormMode>(null)
  const [formData, setFormData] = useState<CreateBannerInput | UpdateBannerInput | null>(null)
  const [uploading, setUploading] = useState<boolean>(false)
  const [submitting, setSubmitting] = useState<boolean>(false)

  // ===== 数据获取 =====
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getBannerList({
        search_keyword: filterKeyword,
        filter_status: filterStatus,
        page,
        page_size: pageSize,
      })
      setList(data.list)
      setTotal(data.total)
      setSelectedIds([])
      setEditingWeights({})
    } catch (error: any) {
      toast.error(error.message || '获取列表失败')
    } finally {
      setLoading(false)
    }
  }, [filterKeyword, filterStatus, page, pageSize])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ===== 衍生状态 =====
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize])
  const isAllSelected = useMemo(() => list.length > 0 && selectedIds.length === list.length, [list, selectedIds])

  // ===== 逻辑处理 =====
  const handleSearch = () => {
    setFilterKeyword(inputKeyword)
    setPage(1)
  }

  const handleReset = () => {
    setInputKeyword('')
    setFilterKeyword('')
    setFilterStatus('ALL')
    setPage(1)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(list.map(item => item.banner_id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id])
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id))
    }
  }

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) {
      toast.warning('请先选择要删除的项')
      return
    }
    if (!window.confirm(`确定要删除选中的 ${selectedIds.length} 项吗？`)) return
    
    try {
      await batchDeleteBanners({ banner_ids: selectedIds })
      toast.success('批量删除成功')
      loadData()
    } catch (error: any) {
      toast.error(error.message || '批量删除失败')
    }
  }

  const handleBatchUpdateStatus = async (targetStatus: boolean) => {
    if (selectedIds.length === 0) {
      toast.warning('请先选择要操作的项')
      return
    }
    try {
      await batchUpdateBannerStatus({
        banner_ids: selectedIds,
        banner_isEnabled: targetStatus,
      })
      toast.success(`批量${targetStatus ? '启用' : '禁用'}成功`)
      loadData()
    } catch (error: any) {
      toast.error(error.message || '批量更新状态失败')
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除此项吗？')) return
    try {
      await deleteBanner({ banner_id: id })
      toast.success('删除成功')
      loadData()
    } catch (error: any) {
      toast.error(error.message || '删除失败')
    }
  }

  const handleQuickUpdateStatus = async (id: string, newStatus: boolean) => {
    try {
      await updateBannerStatus({ banner_id: id, banner_isEnabled: newStatus })
      toast.success('状态更新成功')
      loadData()
    } catch (error: any) {
      toast.error(error.message || '状态更新失败')
    }
  }

  const handleQuickUpdateSortWeight = async (id: string, originalWeight: number) => {
    const newWeight = editingWeights[id]
    if (newWeight === undefined || newWeight === originalWeight) return

    try {
      await updateBannerSortWeight({ banner_id: id, banner_sortWeight: newWeight })
      toast.success('排序更新成功')
      loadData()
    } catch (error: any) {
      toast.error(error.message || '排序更新失败')
    }
  }

  const handleCopyLink = (link: string) => {
    if (!link) return
    navigator.clipboard.writeText(link)
    toast.success('链接已复制')
  }

  const openCreateModal = () => {
    setFormMode('CREATE')
    setFormData({
      banner_title: '',
      banner_imageUrl: '',
      banner_linkUrl: '',
      banner_sortWeight: 0,
      banner_isEnabled: true,
    })
  }

  const openEditModal = (item: BannerItem) => {
    setFormMode('EDIT')
    setFormData({
      banner_id: item.banner_id,
      banner_title: item.banner_title || '',
      banner_imageUrl: item.banner_imageUrl,
      banner_linkUrl: item.banner_linkUrl,
      banner_sortWeight: item.banner_sortWeight,
      banner_isEnabled: item.banner_isEnabled,
    })
  }

  const closeFormModal = () => {
    setFormMode(null)
    setFormData(null)
  }

  const handleFormFieldChange = <K extends keyof (CreateBannerInput & UpdateBannerInput)>(
    field: K,
    value: any
  ) => {
    setFormData(prev => {
      if (!prev) return prev
      return { ...prev, [field]: value } as any
    })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploading(true)
      const url = await upload_image_file(file)
      handleFormFieldChange('banner_imageUrl', url)
    } catch (error: any) {
      toast.error(error.message || '上传图片失败')
    } finally {
      setUploading(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleFormSubmit = async () => {
    if (!formData) return
    if (!formData.banner_imageUrl) {
      toast.error('请上传封面图')
      return
    }

    try {
      setSubmitting(true)
      if (formMode === 'CREATE') {
        await createBanner(formData as CreateBannerInput)
        toast.success('新增成功')
      } else if (formMode === 'EDIT') {
        await updateBanner(formData as UpdateBannerInput)
        toast.success('编辑成功')
      }
      closeFormModal()
      loadData()
    } catch (error: any) {
      toast.error(error.message || '保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPage(1)
  }

  const navigateToCategoryManagement = () => {
    CategoryManagement.navigateToAll(router)
  }

  const state: BannerManagementState = {
    loading,
    list,
    total,
    inputKeyword,
    filterStatus,
    page,
    pageSize,
    selectedIds,
    editingWeights,
    formMode,
    formData,
    uploading,
    submitting,
    totalPages,
    isAllSelected,
    STATUS_LABELS,
  }

  const handlers: BannerManagementHandlers = {
    setInputKeyword,
    setFilterStatus,
    handleSearch,
    handleReset,
    handleBatchDelete,
    handleBatchUpdateStatus,
    openCreateModal,
    handleSelectAll,
    handleSelectRow,
    setEditingWeights,
    handleQuickUpdateSortWeight,
    handleQuickUpdateStatus,
    openEditModal,
    handleDelete,
    handlePageSizeChange,
    setPage,
    closeFormModal,
    handleFormFieldChange,
    handleImageUpload,
    handleFormSubmit,
    handleCopyLink,
    navigateToCategoryManagement,
  }

  return { state, handlers }
}
