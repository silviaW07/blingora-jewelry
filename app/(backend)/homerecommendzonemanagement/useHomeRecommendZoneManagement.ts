'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { HomeRecommendZoneManagement } from '@/backend/route-params'
import {
  getRecommendZoneList,
  getRecommendZoneDetail,
  createRecommendZone,
  updateRecommendZone,
  deleteRecommendZone,
  updateRecommendZoneStatus,
  batchUpdateZoneSortWeight,
  getSelectableProducts,
  getSelectableCategories,
} from '@/backend/actions/HomeRecommendZoneManagement'
import type {
  RecommendZoneItem,
  ZoneType,
  RecommendZoneDetail,
  ZoneDetailContentItem,
  SelectableProductItem,
  SelectableCategoryItem,
} from '@/backend/actions/HomeRecommendZoneManagement'
import { toast } from 'sonner'

export interface FormFields {
  title: string
  zoneType: ZoneType
  pcCols: number
  mobileCols: number
  sortWeight: number
  isActive: boolean
  collectionName: string
}

export interface HomeRecommendZoneManagementState {
  // 列表相关
  loading: boolean // 列表加载状态
  list: RecommendZoneItem[] // 推荐专区列表数据
  total: number // 列表总条数
  page: number // 列表当前页码
  pageSize: number // 列表每页条数
  
  // 抽屉(配置)相关
  drawerOpen: boolean // 配置抽屉是否打开
  editingId: string | null // 当前编辑的专区ID，null表示新增
  drawerLoading: boolean // 详情加载状态
  drawerSaving: boolean // 保存提交状态
  drawerFormData: FormFields // 配置表单数据
  drawerItems: ZoneDetailContentItem[] // 专区明细内容列表
  
  // 删除确认相关
  deleteOpen: boolean // 删除确认弹窗是否打开
  deletingId: string | null // 待删除的专区ID
  deleteLoading: boolean // 删除提交状态
  
  // 选择器弹窗相关
  selectorOpen: boolean // 商品/类目选择器是否打开
  modalKeyword: string // 选择器搜索关键字
  modalPage: number // 选择器当前页码
  modalLoading: boolean // 选择器加载状态
  modalTotal: number // 选择器总条数
  modalProducts: SelectableProductItem[] // 可选商品列表
  modalCategories: SelectableCategoryItem[] // 可选类目列表
  modalFilterCategories: SelectableCategoryItem[] // 过滤用的类目列表
  modalCategoryIdFilter: string // 选择器中的类目筛选值
  modalSelectedItems: ZoneDetailContentItem[] // 选择器中已勾选的临时列表
}

export interface HomeRecommendZoneManagementHandlers {
  // 列表操作
  onPageChange: (page: number) => void // 切换主列表分页
  onOpenDrawer: (id?: string | null, isCopy?: boolean) => void // 打开新增/编辑/复制抽屉
  onCloseDrawer: (open: boolean) => void // 关闭或切换抽屉状态
  onDeleteClick: (id: string) => void // 点击列表删除按钮
  onConfirmDelete: () => Promise<void> // 确认执行删除
  onCancelDelete: (open: boolean) => void // 取消或关闭删除弹窗
  onToggleStatus: (id: string, currentStatus: boolean) => Promise<void> // 切换专区启用状态
  onWeightBlur: (id: string, weight: number) => Promise<void> // 修改权重失去焦点
  onListDragStart: (index: number) => void // 列表行拖拽开始
  onListDragEnter: (index: number) => void // 列表行拖拽进入
  onListDragEnd: () => Promise<void> // 列表行拖拽结束并保存排序
  
  // 抽屉操作
  onDrawerFieldChange: <K extends keyof FormFields>(field: K, value: FormFields[K]) => void // 修改表单字段
  onDrawerSave: () => Promise<void> // 保存专区配置
  onDrawerItemRemove: (index: number) => void // 移除专区明细项
  onDrawerItemDragStart: (index: number) => void // 明细项拖拽开始
  onDrawerItemDragEnter: (index: number) => void // 明细项拖拽进入
  onDrawerItemDragEnd: () => void // 明细项拖拽结束
  
  // 选择器操作
  onOpenSelector: () => void // 打开内容选择器
  onCloseSelector: (open: boolean) => void // 关闭内容选择器
  onModalSearch: () => void // 触发选择器搜索
  onModalKeywordChange: (val: string) => void // 修改选择器搜索关键字
  onModalCategoryFilterChange: (val: string) => void // 修改选择器类目过滤
  onModalPageChange: (page: number) => void // 切换选择器分页
  onModalToggleSelect: (item: SelectableProductItem | SelectableCategoryItem, checked: boolean) => void // 勾选/取消勾选单个项
  onModalToggleAll: (checked: boolean) => void // 全选/取消全选当前页
  onModalConfirm: () => void // 确认选择器内容并加入明细
}

export const useHomeRecommendZoneManagement = (): {
  state: HomeRecommendZoneManagementState
  handlers: HomeRecommendZoneManagementHandlers
} => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const _params = useMemo(() => HomeRecommendZoneManagement.getParams(searchParams), [searchParams])

  // --- 状态定义 ---
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState<RecommendZoneItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [drawerLoading, setDrawerLoading] = useState(false)
  const [drawerSaving, setDrawerSaving] = useState(false)
  const [drawerFormData, setDrawerFormData] = useState<FormFields>({
    title: '',
    zoneType: 'PRODUCT',
    pcCols: 4,
    mobileCols: 2,
    sortWeight: 0,
    isActive: true,
    collectionName: '',
  })
  const [drawerItems, setDrawerItems] = useState<ZoneDetailContentItem[]>([])

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [selectorOpen, setSelectorOpen] = useState(false)
  const [modalKeyword, setModalKeyword] = useState('')
  const [modalSearchTrigger, setModalSearchTrigger] = useState(0)
  const [modalPage, setModalPage] = useState(1)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalTotal, setModalTotal] = useState(0)
  const [modalProducts, setModalProducts] = useState<SelectableProductItem[]>([])
  const [modalCategories, setModalCategories] = useState<SelectableCategoryItem[]>([])
  const [modalFilterCategories, setModalFilterCategories] = useState<SelectableCategoryItem[]>([])
  const [modalCategoryIdFilter, setModalCategoryIdFilter] = useState<string>('all')
  const [modalSelectedItems, setModalSelectedItems] = useState<ZoneDetailContentItem[]>([])

  // --- Ref 变量 ---
  const dragItemIndex = useRef<number | null>(null)
  const dragOverItemIndex = useRef<number | null>(null)
  const drawerDragItemIndex = useRef<number | null>(null)
  const drawerDragOverItemIndex = useRef<number | null>(null)

  // --- 列表逻辑 ---
  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getRecommendZoneList({ page, pageSize })
      setList(data.list)
      setTotal(data.total)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '获取列表失败')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  // --- 详情/抽屉逻辑 ---
  const fetchDetail = useCallback(async (id: string) => {
    setDrawerLoading(true)
    try {
      const data = await getRecommendZoneDetail(id)
      setDrawerFormData({
        title: data.title,
        zoneType: data.zoneType,
        pcCols: data.pcCols,
        mobileCols: data.mobileCols,
        sortWeight: data.sortWeight,
        isActive: data.isActive,
        collectionName: data.collectionName,
      })
      setDrawerItems(data.items)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '获取详情失败')
      setDrawerOpen(false)
    } finally {
      setDrawerLoading(false)
    }
  }, [])

  // --- 选择器逻辑 ---
  const fetchModalData = useCallback(async () => {
    if (!selectorOpen) return
    setModalLoading(true)
    try {
      if (drawerFormData.zoneType === 'PRODUCT') {
        const data = await getSelectableProducts({
          keyword: modalKeyword,
          categoryId: modalCategoryIdFilter === 'all' ? undefined : modalCategoryIdFilter,
          page: modalPage,
          pageSize: 10
        })
        setModalProducts(data.list)
        setModalTotal(data.total)
      } else {
        const data = await getSelectableCategories({
          keyword: modalKeyword,
          page: modalPage,
          pageSize: 10
        })
        setModalCategories(data.list)
        setModalTotal(data.total)
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '获取数据失败')
    } finally {
      setModalLoading(false)
    }
  }, [selectorOpen, drawerFormData.zoneType, modalKeyword, modalCategoryIdFilter, modalPage, modalSearchTrigger])

  useEffect(() => {
    fetchModalData()
  }, [fetchModalData])

  useEffect(() => {
    const fetchFilter = async () => {
      if (selectorOpen && drawerFormData.zoneType === 'PRODUCT') {
        try {
          const data = await getSelectableCategories({ page: 1, pageSize: 100 })
          setModalFilterCategories(data.list)
        } catch (e: unknown) {}
      }
    }
    fetchFilter()
  }, [selectorOpen, drawerFormData.zoneType])

  // --- Handlers 实现 ---
  const handlers: HomeRecommendZoneManagementHandlers = {
    onPageChange: setPage,
    onOpenDrawer: (id = null, isCopy = false) => {
      if (isCopy && id) {
        const performCopy = async () => {
          try {
            const detail = await getRecommendZoneDetail(id)
            await createRecommendZone({
              title: `${detail.title} (副本)`,
              zoneType: detail.zoneType,
              pcCols: detail.pcCols,
              mobileCols: detail.mobileCols,
              sortWeight: detail.sortWeight,
              isActive: detail.isActive,
              items: detail.items.map(i => ({ entityId: i.entityId, sortWeight: i.sortWeight }))
            })
            toast.success('复制成功')
            fetchList()
          } catch (e: unknown) {
            toast.error('复制失败')
          }
        }
        performCopy()
        return
      }
      setEditingId(id)
      setDrawerOpen(true)
      if (id) {
        fetchDetail(id)
      } else {
        setDrawerFormData({
          title: '',
          zoneType: 'PRODUCT',
          pcCols: 4,
          mobileCols: 2,
          sortWeight: 0,
          isActive: true,
          collectionName: '',
        })
        setDrawerItems([])
      }
    },
    onCloseDrawer: setDrawerOpen,
    onDeleteClick: (id) => {
      setDeletingId(id)
      setDeleteOpen(true)
    },
    onConfirmDelete: async () => {
      if (!deletingId) return
      setDeleteLoading(true)
      try {
        await deleteRecommendZone(deletingId)
        toast.success('删除成功')
        setDeleteOpen(false)
        fetchList()
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : '删除失败')
      } finally {
        setDeleteLoading(false)
      }
    },
    onCancelDelete: setDeleteOpen,
    onToggleStatus: async (id, currentStatus) => {
      try {
        await updateRecommendZoneStatus(id, !currentStatus)
        toast.success('状态已更新')
        fetchList()
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : '更新状态失败')
      }
    },
    onWeightBlur: async (id, weight) => {
      try {
        await batchUpdateZoneSortWeight({ updates: [{ id, sortWeight: weight }] })
        toast.success('权重更新成功')
        fetchList()
      } catch (e: unknown) {
        toast.error('权重更新失败')
      }
    },
    onListDragStart: (index) => {
      dragItemIndex.current = index
    },
    onListDragEnter: (index) => {
      dragOverItemIndex.current = index
    },
    onListDragEnd: async () => {
      if (dragItemIndex.current !== null && dragOverItemIndex.current !== null && dragItemIndex.current !== dragOverItemIndex.current) {
        const newList = [...list]
        const draggedItem = newList.splice(dragItemIndex.current, 1)[0]
        newList.splice(dragOverItemIndex.current, 0, draggedItem)
        setList(newList)

        const oldWeights = list.map(i => i.sortWeight).sort((a, b) => b - a)
        const updates = newList.map((item, idx) => ({ id: item.id, sortWeight: oldWeights[idx] }))

        try {
          await batchUpdateZoneSortWeight({ updates })
          toast.success('排序保存成功')
          fetchList()
        } catch (e: unknown) {
          toast.error('排序保存失败')
          fetchList()
        }
      }
      dragItemIndex.current = null
      dragOverItemIndex.current = null
    },
    onDrawerFieldChange: (field, value) => {
      if (field === 'zoneType' && value !== drawerFormData.zoneType) {
        setDrawerItems([])
        setDrawerFormData(prev => ({ ...prev, [field]: value, collectionName: '' }))
      } else {
        setDrawerFormData(prev => ({ ...prev, [field]: value }))
      }
    },
    onDrawerSave: async () => {
      if (!drawerFormData.title.trim()) {
        toast.error('专区标题不能为空')
        return
      }
      setDrawerSaving(true)
      try {
        const baseSortWeight = drawerItems.length * 10
        const formattedItems = drawerItems.map((item, index) => ({
          entityId: item.entityId,
          sortWeight: baseSortWeight - index * 10
        }))
        const payload = { ...drawerFormData, items: formattedItems }
        if (editingId) {
          await updateRecommendZone({ id: editingId, ...payload })
          toast.success('编辑成功')
        } else {
          await createRecommendZone(payload)
          toast.success('新增成功')
        }
        fetchList()
        setDrawerOpen(false)
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : '保存失败')
      } finally {
        setDrawerSaving(false)
      }
    },
    onDrawerItemRemove: (index) => {
      setDrawerItems(prev => prev.filter((_, i) => i !== index))
    },
    onDrawerItemDragStart: (index) => {
      drawerDragItemIndex.current = index
    },
    onDrawerItemDragEnter: (index) => {
      drawerDragOverItemIndex.current = index
    },
    onDrawerItemDragEnd: () => {
      if (drawerDragItemIndex.current !== null && drawerDragOverItemIndex.current !== null) {
        const newItems = [...drawerItems]
        const draggedItem = newItems.splice(drawerDragItemIndex.current, 1)[0]
        newItems.splice(drawerDragOverItemIndex.current, 0, draggedItem)
        setDrawerItems(newItems)
      }
      drawerDragItemIndex.current = null
      drawerDragOverItemIndex.current = null
    },
    onOpenSelector: () => {
      setModalKeyword('')
      setModalPage(1)
      setModalSelectedItems([])
      setModalCategoryIdFilter('all')
      setSelectorOpen(true)
    },
    onCloseSelector: setSelectorOpen,
    onModalSearch: () => {
      setModalPage(1)
      setModalSearchTrigger(prev => prev + 1)
    },
    onModalKeywordChange: setModalKeyword,
    onModalCategoryFilterChange: (val) => {
      setModalCategoryIdFilter(val)
      setModalPage(1)
    },
    onModalPageChange: setModalPage,
    onModalToggleSelect: (item, checked) => {
      if (checked) {
        let newItem: ZoneDetailContentItem
        if (drawerFormData.zoneType === 'PRODUCT') {
          const p = item as SelectableProductItem
          newItem = { id: p.id, entityId: p.id, name: p.name, codeOrSku: p.productCode, imageUrl: p.mainImageUrl, status: 'ACTIVE', sortWeight: 0 }
        } else {
          const c = item as SelectableCategoryItem
          newItem = { id: c.id, entityId: c.id, name: c.name, codeOrSku: '-', imageUrl: c.imageUrl, status: 'ACTIVE', sortWeight: 0 }
        }
        setModalSelectedItems(prev => [...prev, newItem])
      } else {
        setModalSelectedItems(prev => prev.filter(i => i.id !== item.id))
      }
    },
    onModalToggleAll: (checked) => {
      const pageItems = drawerFormData.zoneType === 'PRODUCT' ? modalProducts : modalCategories
      const existingIds = drawerItems.map(i => i.entityId)
      const selectablePageItems = pageItems.filter(item => !existingIds.includes(item.id))
      if (checked) {
        const toAdd = selectablePageItems.filter(p => !modalSelectedItems.some(si => si.id === p.id)).map(p => {
          if (drawerFormData.zoneType === 'PRODUCT') {
            const pi = p as SelectableProductItem
            return { id: pi.id, entityId: pi.id, name: pi.name, codeOrSku: pi.productCode, imageUrl: pi.mainImageUrl, status: 'ACTIVE', sortWeight: 0 }
          } else {
            const ci = p as SelectableCategoryItem
            return { id: ci.id, entityId: ci.id, name: ci.name, codeOrSku: '-', imageUrl: ci.imageUrl, status: 'ACTIVE', sortWeight: 0 }
          }
        })
        setModalSelectedItems(prev => [...prev, ...toAdd])
      } else {
        const pageIds = selectablePageItems.map(p => p.id)
        setModalSelectedItems(prev => prev.filter(i => !pageIds.includes(i.id)))
      }
    },
    onModalConfirm: () => {
      setDrawerItems(prev => [...prev, ...modalSelectedItems])
      setSelectorOpen(false)
    }
  }

  return {
    state: {
      loading, list, total, page, pageSize,
      drawerOpen, editingId, drawerLoading, drawerSaving, drawerFormData, drawerItems,
      deleteOpen, deletingId, deleteLoading,
      selectorOpen, modalKeyword, modalPage, modalLoading, modalTotal, modalProducts, modalCategories, modalFilterCategories, modalCategoryIdFilter, modalSelectedItems
    },
    handlers
  }
}
