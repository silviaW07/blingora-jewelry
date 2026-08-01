'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ImportFrom1688 } from '@/backend/route-params'
import type {
  ProductStatusType,
  ImportTaskStatusType,
  CategoryOption,
  ImportTaskRecord,
  ImportTaskItemRecord
} from '@/backend/actions/ImportFrom1688'
import {
  getCategoryOptions,
  getImportTaskList,
  getImportTaskDetail,
  createImportTask,
  startParseTask,
  updateTaskItemPreview,
  confirmImportProducts,
  retryImportTask,
  deleteImportTask
} from '@/backend/actions/ImportFrom1688'
import { toast } from 'sonner'

interface CreateFormFields {
  urls: string
  defaultCategoryId: string
  markupRate: number | ''
  defaultStatus: ProductStatusType
  stockStrategyStock: number | ''
}

interface EditItemFormFields {
  name: string
  categoryId: string
  price: number | ''
  mainImageUrl: string
  shortDescription: string
}

export interface ImportFrom1688State {
  /** 当前激活的标签页 */
  activeTab: string
  /** 分类选项列表 */
  categoryOptions: CategoryOption[]
  /** 是否正在全局刷新 */
  isRefreshing: boolean
  /** 创建任务的表单数据 */
  createForm: CreateFormFields
  /** 是否正在提交创建任务 */
  isSubmitting: boolean
  /** 当前选中的任务详情 */
  currentTask: ImportTaskRecord | null
  /** 当前任务下的商品项列表 */
  currentItems: ImportTaskItemRecord[]
  /** 是否正在加载任务详情 */
  isLoadingDetail: boolean
  /** 当前正在编辑/查看的项 ID */
  activeItemId: string | null
  /** 已选中的商品项 ID 集合 */
  selectedItemIds: string[]
  /** 是否正在确认导入商品 */
  isConfirmingImport: boolean
  /** 修正字段的表单数据 */
  editForm: EditItemFormFields
  /** 是否正在保存修正数据 */
  isSavingCorrection: boolean
  /** 历史记录的状态筛选条件 */
  historyStatusFilter: ImportTaskStatusType | 'ALL'
  /** 历史记录当前页码 */
  historyPage: number
  /** 历史记录任务列表 */
  historyList: ImportTaskRecord[]
  /** 历史记录总条数 */
  historyTotal: number
  /** 是否正在加载历史记录 */
  isLoadingHistory: boolean
  /** 历史记录总页数 */
  totalPages: number
  /** 可勾选导入的商品项 */
  selectableItems: ImportTaskItemRecord[]
  /** 是否已全选可导入项 */
  isAllSelected: boolean
  /** 当前激活项的详细数据 */
  activeItemDetails: ImportTaskItemRecord | undefined
  /** 当前任务 ID */
  taskId: string | undefined
}

export interface ImportFrom1688Handlers {
  /** 切换标签页 */
  setActiveTab: (tab: string) => void
  /** 全局手动刷新状态 */
  handleGlobalRefresh: () => Promise<void>
  /** 处理创建表单字段变更 */
  handleCreateFormChange: <K extends keyof CreateFormFields>(field: K, value: CreateFormFields[K]) => void
  /** 处理编辑表单字段变更 */
  handleEditFormChange: <K extends keyof EditItemFormFields>(field: K, value: EditItemFormFields[K]) => void
  /** 创建导入任务 */
  handleCreateTask: () => Promise<void>
  /** 切换全选/全取消 */
  handleToggleSelectAll: (checked: boolean) => void
  /** 切换单个商品项勾选状态 */
  handleToggleSelectItem: (id: string, checked: boolean) => void
  /** 设置当前激活的商品项 */
  setActiveItemId: (id: string | null) => void
  /** 保存字段修正 */
  handleSaveCorrection: () => Promise<void>
  /** 确认导入勾选的商品 */
  handleConfirmImport: () => Promise<void>
  /** 重试任务 */
  handleRetryTask: (id: string) => Promise<void>
  /** 删除任务记录 */
  handleDeleteTask: (id: string) => Promise<void>
  /** 设置历史记录状态筛选 */
  setHistoryStatusFilter: (status: ImportTaskStatusType | 'ALL') => void
  /** 设置历史记录页码 */
  setHistoryPage: (page: number | ((prev: number) => number)) => void
}

export const useImportFrom1688 = (): { state: ImportFrom1688State, handlers: ImportFrom1688Handlers } => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { taskId } = ImportFrom1688.getParams(searchParams)

  const [activeTab, setActiveTab] = useState<string>('current')
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [createForm, setCreateForm] = useState<CreateFormFields>({
    urls: '',
    defaultCategoryId: '',
    markupRate: 20,
    defaultStatus: 'DRAFT',
    stockStrategyStock: 100
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [currentTask, setCurrentTask] = useState<ImportTaskRecord | null>(null)
  const [currentItems, setCurrentItems] = useState<ImportTaskItemRecord[]>([])
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const [isConfirmingImport, setIsConfirmingImport] = useState(false)
  const [editForm, setEditForm] = useState<EditItemFormFields>({
    name: '',
    categoryId: '',
    price: '',
    mainImageUrl: '',
    shortDescription: ''
  })
  const [isSavingCorrection, setIsSavingCorrection] = useState(false)

  const [historyStatusFilter, setHistoryStatusFilter] = useState<ImportTaskStatusType | 'ALL'>('ALL')
  const [historyPage, setHistoryPage] = useState(1)
  const [historyList, setHistoryList] = useState<ImportTaskRecord[]>([])
  const [historyTotal, setHistoryTotal] = useState(0)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  const historyPageSize = 20

  const loadCategories = useCallback(async () => {
    try {
      const res = await getCategoryOptions()
      setCategoryOptions(res.list)
    } catch (error) {
      toast.error((error as Error).message)
    }
  }, [])

  const loadDetail = useCallback(async (id: string) => {
    setIsLoadingDetail(true)
    try {
      const res = await getImportTaskDetail({ taskId: id })
      setCurrentTask(res.task)
      setCurrentItems(res.items)
      setSelectedItemIds(
        res.items
          .filter(i => i.item_isSelected && !i.item_failureReason && !i.item_importedProductId)
          .map(i => i.item_id)
      )
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setIsLoadingDetail(false)
    }
  }, [])

  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true)
    try {
      const res = await getImportTaskList({
        status: historyStatusFilter === 'ALL' ? '' : historyStatusFilter,
        page: historyPage,
        pageSize: historyPageSize
      })
      setHistoryList(res.list)
      setHistoryTotal(res.total)
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setIsLoadingHistory(false)
    }
  }, [historyStatusFilter, historyPage])

  const handleGlobalRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      if (activeTab === 'current' && taskId) {
        await loadDetail(taskId)
      } else if (activeTab === 'history') {
        await loadHistory()
      }
      toast.success('刷新成功')
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setIsRefreshing(false)
    }
  }, [activeTab, taskId, loadDetail, loadHistory])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    if (taskId) {
      setActiveTab('current')
      loadDetail(taskId)
    } else {
      setCurrentTask(null)
      setCurrentItems([])
    }
  }, [taskId, loadDetail])

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory()
    }
  }, [activeTab, historyStatusFilter, historyPage, loadHistory])

  useEffect(() => {
    const item = currentItems.find(i => i.item_id === activeItemId)
    if (item && item.item_previewDataJson) {
      setEditForm({
        name: item.item_previewDataJson.name || '',
        categoryId: item.item_previewDataJson.categoryId || '',
        price: item.item_previewDataJson.price ?? '',
        mainImageUrl: item.item_previewDataJson.mainImageUrl || '',
        shortDescription: item.item_previewDataJson.shortDescription || ''
      })
    } else {
      setEditForm({ name: '', categoryId: '', price: '', mainImageUrl: '', shortDescription: '' })
    }
  }, [activeItemId, currentItems])

  const handleCreateFormChange = <K extends keyof CreateFormFields>(field: K, value: CreateFormFields[K]) => {
    setCreateForm(prev => ({ ...prev, [field]: value }))
  }

  const handleEditFormChange = <K extends keyof EditItemFormFields>(field: K, value: EditItemFormFields[K]) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

  const handleCreateTask = async () => {
    if (!createForm.urls.trim()) {
      toast.error('请输入商品源链接')
      return
    }
    setIsSubmitting(true)
    try {
      const res = await createImportTask({
        urls: createForm.urls,
        defaultCategoryId: createForm.defaultCategoryId || undefined,
        markupRate: createForm.markupRate === '' ? undefined : createForm.markupRate,
        defaultStatus: createForm.defaultStatus,
        stockStrategyStock: createForm.stockStrategyStock === '' ? undefined : createForm.stockStrategyStock
      })
      toast.success('任务已创建，正在开始解析')
      setCreateForm(prev => ({ ...prev, urls: '' }))
      
      startParseTask({ taskId: res.taskId }).catch(e => {
        toast.error(`解析异常: ${(e as Error).message}`)
      })
      
      ImportFrom1688.navigateToTaskDetail(router, { taskId: res.taskId })
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItemIds(
        currentItems
          .filter(i => !i.item_failureReason && !i.item_importedProductId)
          .map(i => i.item_id)
      )
    } else {
      setSelectedItemIds([])
    }
  }

  const handleToggleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItemIds(prev => [...prev, id])
    } else {
      setSelectedItemIds(prev => prev.filter(v => v !== id))
    }
  }

  const handleSaveCorrection = async () => {
    if (!activeItemId) return
    setIsSavingCorrection(true)
    try {
      await updateTaskItemPreview({
        itemId: activeItemId,
        previewData: {
          name: editForm.name,
          categoryId: editForm.categoryId,
          price: editForm.price === '' ? 0 : editForm.price,
          mainImageUrl: editForm.mainImageUrl,
          shortDescription: editForm.shortDescription
        }
      })
      toast.success('字段修正已保存')
      if (taskId) loadDetail(taskId)
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setIsSavingCorrection(false)
    }
  }

  const handleConfirmImport = async () => {
    if (!taskId || selectedItemIds.length === 0) return
    setIsConfirmingImport(true)
    try {
      await confirmImportProducts({
        taskId,
        itemIds: selectedItemIds
      })
      toast.success('商品导入成功')
      loadDetail(taskId)
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setIsConfirmingImport(false)
    }
  }

  const handleRetryTask = async (id: string) => {
    try {
      await retryImportTask({ taskId: id })
      toast.success('任务已重置，重新开始解析')
      startParseTask({ taskId: id }).catch(e => {
        toast.error(`解析异常: ${(e as Error).message}`)
      })
      if (activeTab === 'current' && taskId === id) {
        loadDetail(id)
      } else if (activeTab === 'history') {
        loadHistory()
      }
    } catch (error) {
      toast.error((error as Error).message)
    }
  }

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteImportTask({ taskId: id })
      toast.success('任务记录已删除')
      if (activeTab === 'current' && taskId === id) {
        ImportFrom1688.navigateToMain(router)
      } else if (activeTab === 'history') {
        loadHistory()
      }
    } catch (error) {
      toast.error((error as Error).message)
    }
  }

  const totalPages = Math.max(1, Math.ceil(historyTotal / historyPageSize))
  const selectableItems = currentItems.filter(i => !i.item_failureReason && !i.item_importedProductId)
  const isAllSelected = selectableItems.length > 0 && selectedItemIds.length === selectableItems.length
  const activeItemDetails = useMemo(() => currentItems.find(i => i.item_id === activeItemId), [currentItems, activeItemId])

  return {
    state: {
      activeTab,
      categoryOptions,
      isRefreshing,
      createForm,
      isSubmitting,
      currentTask,
      currentItems,
      isLoadingDetail,
      activeItemId,
      selectedItemIds,
      isConfirmingImport,
      editForm,
      isSavingCorrection,
      historyStatusFilter,
      historyPage,
      historyList,
      historyTotal,
      isLoadingHistory,
      totalPages,
      selectableItems,
      isAllSelected,
      activeItemDetails,
      taskId
    },
    handlers: {
      setActiveTab,
      handleGlobalRefresh,
      handleCreateFormChange,
      handleEditFormChange,
      handleCreateTask,
      handleToggleSelectAll,
      handleToggleSelectItem,
      setActiveItemId,
      handleSaveCorrection,
      handleConfirmImport,
      handleRetryTask,
      handleDeleteTask,
      setHistoryStatusFilter,
      setHistoryPage
    }
  }
}
