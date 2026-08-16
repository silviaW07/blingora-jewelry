'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { HomeRecommendZoneManagement } from '@/backend/route-params'
import {
  getRecommendZoneList,
  getRecommendZoneDetail,
  createRecommendZone,
  updateRecommendZone,
  duplicateRecommendZone,
  deleteRecommendZone,
  updateRecommendZoneStatus,
  batchUpdateZoneSortWeight,
  batchUpdateZoneItemSortWeight,
  getSelectableCategories,
  createDraftDisplayProducts,
  deleteDraftDisplayProducts,
} from '@/backend/actions/HomeRecommendZoneManagement'
import type {
  RecommendZoneItem,
  ZoneType,
  RecommendZoneDetail,
  ZoneDetailContentItem,
  SelectableProductItem,
  SelectableCategoryItem,
  SideNavCategoryItem,
} from '@/backend/actions/HomeRecommendZoneManagement'
import { toast } from 'sonner'
import { upload_project_files } from '@/tools/tools'

export interface FormFields {
  title: string
  zoneType: ZoneType
  pcCols: number
  mobileCols: number
  pcRows: number
  sortWeight: number
  isActive: boolean
  collectionName: string
}

export interface HomeRecommendZoneManagementState {
  // 列表相关
  loading: boolean // 列表加载状态
  keyword: string // 列表搜索关键词
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
  modalSelectedItems: Array<ZoneDetailContentItem | SideNavCategoryItem> // 选择器中已勾选的临时列表
  modalCollectionName: string // 商品选择弹窗底部的集合名称输入
  draftUploadLoading: boolean // 快速发图上传中
  selectedDraftIds: string[] // 抽屉内勾选的草稿展示商品
}

export interface HomeRecommendZoneManagementHandlers {
  // 列表操作
  onPageChange: (page: number) => void // 切换主列表分页
  onKeywordChange: (value: string) => void // 修改列表搜索关键词
  onSearch: () => void // 执行列表搜索
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
  onDrawerItemDragEnd: () => Promise<void> // 明细项拖拽结束并自动保存排序
  onToggleDraftSelect: (productId: string, checked: boolean) => void
  onToggleAllDraftSelect: (checked: boolean) => void
  onBatchDeleteDrafts: () => Promise<void>
  
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
  onUploadDisplayImages: (files: FileList | File[]) => Promise<void> // 本地上传图片创建草稿展示商品
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
  const [keyword, setKeyword] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
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
    pcRows: 2,
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
  const [modalSelectedItems, setModalSelectedItems] = useState<Array<ZoneDetailContentItem | SideNavCategoryItem>>([])
  const [modalCollectionName, setModalCollectionName] = useState('')
  const [draftUploadLoading, setDraftUploadLoading] = useState(false)
  const [selectedDraftIds, setSelectedDraftIds] = useState<string[]>([])

  // --- Ref 变量 ---
  const dragItemIndex = useRef<number | null>(null)
  const dragOverItemIndex = useRef<number | null>(null)
  const drawerDragItemIndex = useRef<number | null>(null)
  const drawerDragOverItemIndex = useRef<number | null>(null)
  const drawerDragDirty = useRef(false)
  const drawerItemsRef = useRef(drawerItems)
  drawerItemsRef.current = drawerItems

  // --- 列表逻辑 ---
  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getRecommendZoneList({ keyword: searchKeyword, page, pageSize })
      setList(data.list)
      setTotal(data.total)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '获取列表失败')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, searchKeyword])

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
        pcRows: data.pcRows ?? 2,
        sortWeight: data.sortWeight,
        isActive: data.isActive,
        collectionName: data.collectionName,
      })
      // 权重高优先；同权时最新上新在最上
      const sortedItems = [...data.items].sort((a, b) => {
        const weightDiff = (b.sortWeight || 0) - (a.sortWeight || 0)
        if (weightDiff !== 0) return weightDiff
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return bTime - aTime
      })
      setDrawerItems(sortedItems)
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
        const data = await getSelectableCategories({
          page: 1,
          pageSize: 500,
        })
        setModalCategories(data.list)
        setModalTotal(data.total)
        setModalProducts([])
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

  // --- Handlers 实现 ---
  const handlers: HomeRecommendZoneManagementHandlers = {
    onPageChange: setPage,
    onKeywordChange: setKeyword,
    onSearch: () => {
      setPage(1)
      setSearchKeyword(keyword.trim())
    },
    onOpenDrawer: (id = null, isCopy = false) => {
      if (isCopy && id) {
        const performCopy = async () => {
          try {
            await duplicateRecommendZone({ id })
            toast.success('复制成功，已生成新专区')
            await fetchList()
          } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : '复制失败')
          }
        }
        void performCopy()
        return
      }
      setEditingId(id)
      setSelectedDraftIds([])
      setDrawerOpen(true)
      if (id) {
        fetchDetail(id)
      } else {
        setDrawerFormData({
          title: '',
          zoneType: 'PRODUCT',
          pcCols: 4,
          mobileCols: 2,
          pcRows: 2,
          sortWeight: 0,
          isActive: true,
          collectionName: '',
        })
        setDrawerItems([])
        setModalCollectionName('')
      }
    },
    onCloseDrawer: (open) => {
      setDrawerOpen(open)
      if (!open) {
        setEditingId(null)
        setDrawerItems([])
        setModalCollectionName('')
      }
    },
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
        setModalSelectedItems([])
        setModalKeyword('')
        setModalPage(1)
        setModalCategoryIdFilter('all')
        setDrawerFormData(prev => ({ ...prev, [field]: value, collectionName: '' }))
        setModalCollectionName('')
      } else {
        setDrawerFormData(prev => ({ ...prev, [field]: value }))
        if (field === 'collectionName') {
          setModalCollectionName(String(value))
        }
      }
    },
    onDrawerSave: async () => {
      if (!drawerFormData.title.trim()) {
        toast.error('专区标题不能为空')
        return
      }
      if (![3, 4, 5].includes(drawerFormData.pcCols)) {
        toast.error('PC端列数仅支持 3、4、5 列')
        return
      }
      if (![1, 2].includes(drawerFormData.mobileCols)) {
        toast.error('手机端列数仅支持 1、2 列')
        return
      }
      if (!Number.isFinite(drawerFormData.pcRows) || drawerFormData.pcRows < 1 || drawerFormData.pcRows > 12) {
        toast.error('行数仅支持 1~12 行')
        return
      }
      setDrawerSaving(true)
      try {
        const baseSortWeight = drawerItems.length * 10
        const formattedItems = drawerItems.map((item, index) => ({
          entityId: item.entityId,
          sortWeight: baseSortWeight - index * 10,
          itemKind:
            'itemKind' in item && (item.itemKind === 'PRODUCT' || item.itemKind === 'CATEGORY')
              ? item.itemKind
              : drawerFormData.zoneType === 'PRODUCT'
                ? item.status === 'DRAFT'
                  ? 'PRODUCT'
                  : 'CATEGORY'
                : undefined,
        }))
        const categoryIds = formattedItems
          .filter((item) => item.itemKind !== 'PRODUCT')
          .map((item) => item.entityId)
        const payload = {
          ...drawerFormData,
          collectionName: drawerFormData.zoneType === 'PRODUCT' ? modalCollectionName.trim() : '',
          items: formattedItems,
          categoryIds: drawerFormData.zoneType === 'PRODUCT' ? categoryIds : undefined,
        }
        if (editingId) {
          await updateRecommendZone({ id: editingId, ...payload })
          toast.success('编辑成功')
        } else {
          await createRecommendZone(payload)
          toast.success('新增成功')
        }
        void fetchList()
        setDrawerOpen(false)
        setModalCollectionName('')
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : '保存失败')
      } finally {
        setDrawerSaving(false)
      }
    },
    onDrawerItemRemove: (index) => {
      const removed = drawerItems[index]
      setDrawerItems(prev => prev.filter((_, i) => i !== index))
      if (removed?.entityId) {
        setSelectedDraftIds((prev) => prev.filter((id) => id !== removed.entityId))
      }
    },
    onToggleDraftSelect: (productId, checked) => {
      setSelectedDraftIds((prev) => {
        if (checked) return prev.includes(productId) ? prev : [...prev, productId]
        return prev.filter((id) => id !== productId)
      })
    },
    onToggleAllDraftSelect: (checked) => {
      const draftIds = drawerItems
        .filter((item) => item.status === 'DRAFT')
        .map((item) => item.entityId)
      setSelectedDraftIds(checked ? draftIds : [])
    },
    onBatchDeleteDrafts: async () => {
      if (selectedDraftIds.length === 0) {
        toast.error('请先勾选草稿展示商品')
        return
      }
      try {
        const res = await deleteDraftDisplayProducts({
          productIds: selectedDraftIds,
          zoneId: editingId,
        })
        setDrawerItems((prev) => prev.filter((item) => !selectedDraftIds.includes(item.entityId)))
        setSelectedDraftIds([])
        toast.success(`已删除 ${res.deletedCount} 个草稿展示商品`)
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : '批量删除失败')
      }
    },
    onDrawerItemDragStart: (index) => {
      drawerDragItemIndex.current = index
      drawerDragOverItemIndex.current = index
      drawerDragDirty.current = false
    },
    onDrawerItemDragEnter: (index) => {
      const fromIndex = drawerDragItemIndex.current
      drawerDragOverItemIndex.current = index
      if (fromIndex === null || fromIndex === index) return
      // 拖入时立刻换位，列表马上跟着动（松手才落库）
      setDrawerItems((prev) => {
        if (fromIndex < 0 || fromIndex >= prev.length || index < 0 || index >= prev.length) {
          return prev
        }
        const next = [...prev]
        const [moved] = next.splice(fromIndex, 1)
        next.splice(index, 0, moved)
        drawerDragItemIndex.current = index
        drawerDragDirty.current = true
        return next
      })
    },
    onDrawerItemDragEnd: async () => {
      const dirty = drawerDragDirty.current
      drawerDragItemIndex.current = null
      drawerDragOverItemIndex.current = null
      drawerDragDirty.current = false
      if (!dirty) return

      const current = drawerItemsRef.current
      const baseSortWeight = Math.max(current.length * 10, 10)
      const orderedItems = current.map((item, index) => ({
        ...item,
        sortWeight: baseSortWeight - index * 10,
      }))
      setDrawerItems(orderedItems)

      // 已存在专区：拖拽结束即写入 homeRecommendZoneItem.sortWeight
      if (!editingId) return

      try {
        await batchUpdateZoneItemSortWeight({
          zoneId: editingId,
          updates: orderedItems.map(item => ({
            entityId: item.entityId,
            sortWeight: item.sortWeight,
          })),
        })
        toast.success('明细顺序已保存')
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : '明细排序保存失败')
      }
    },
    onOpenSelector: () => {
      setModalKeyword('')
      setModalPage(1)
      setModalSelectedItems([])
      setModalCategoryIdFilter('all')
      setModalCollectionName(drawerFormData.zoneType === 'PRODUCT' ? drawerFormData.collectionName : '')
      setSelectorOpen(true)
    },
    onCloseSelector: (open) => {
      setSelectorOpen(open)
      if (!open) {
        setModalSelectedItems([])
      }
    },
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
        let newItem: ZoneDetailContentItem | SideNavCategoryItem
        if (drawerFormData.zoneType === 'PRODUCT') {
          const c = item as SelectableCategoryItem
          newItem = {
            id: c.id,
            entityId: c.id,
            name: c.name,
            codeOrSku: c.parentName ? `${c.parentName} / ${c.name}` : c.name,
            imageUrl: c.imageUrl,
            status: 'ACTIVE',
            sortWeight: 0,
            itemKind: 'CATEGORY',
          }
        } else {
          const c = item as SelectableCategoryItem
          const baseCategoryItem = {
            id: c.id,
            entityId: c.id,
            name: c.name,
            codeOrSku: '-',
            imageUrl: c.imageUrl,
            status: 'ACTIVE',
            sortWeight: 0,
          }
          newItem = drawerFormData.zoneType === 'SIDE_NAV'
            ? {
                ...baseCategoryItem,
                level: c.level,
                parentId: null,
                parentName: c.parentName,
                productCount: 0,
              }
            : baseCategoryItem
        }
        setModalSelectedItems(prev => [...prev, newItem])
      } else {
        setModalSelectedItems(prev => prev.filter(i => i.id !== item.id))
      }
    },
    onModalToggleAll: (checked) => {
      const pageItems = modalCategories
      const existingIds = drawerItems.map(i => i.entityId)
      const selectablePageItems = pageItems.filter(item => !existingIds.includes(item.id))
      if (checked) {
        const toAdd = selectablePageItems.filter(p => !modalSelectedItems.some(si => si.id === p.id)).map(p => {
          if (drawerFormData.zoneType === 'PRODUCT') {
            const ci = p as SelectableCategoryItem
            return {
              id: ci.id,
              entityId: ci.id,
              name: ci.name,
              codeOrSku: ci.parentName ? `${ci.parentName} / ${ci.name}` : ci.name,
              imageUrl: ci.imageUrl,
              status: 'ACTIVE',
              sortWeight: 0,
              itemKind: 'CATEGORY' as const,
            }
          } else {
            const ci = p as SelectableCategoryItem
            const baseCategoryItem = { id: ci.id, entityId: ci.id, name: ci.name, codeOrSku: '-', imageUrl: ci.imageUrl, status: 'ACTIVE', sortWeight: 0 }
            return drawerFormData.zoneType === 'SIDE_NAV'
              ? {
                  ...baseCategoryItem,
                  level: ci.level,
                  parentId: null,
                  parentName: ci.parentName,
                  productCount: 0,
                }
              : baseCategoryItem
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
      setDrawerFormData(prev => ({
        ...prev,
        collectionName: prev.zoneType === 'PRODUCT' ? modalCollectionName.trim() : ''
      }))
      setModalSelectedItems([])
      setSelectorOpen(false)
    },
    onUploadDisplayImages: async (files) => {
      if (drawerFormData.zoneType !== 'PRODUCT') {
        toast.error('仅商品专区支持快速发图')
        return
      }
      const fileList = Array.from(files || []).filter((file) => file.type.startsWith('image/'))
      if (fileList.length === 0) {
        toast.error('请选择图片文件')
        return
      }

      setDraftUploadLoading(true)
      try {
        // 商品名称固定为当天日期 YYYY-MM-DD（Asia/Shanghai），供 Coming 按日归组
        const dateProductName = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Shanghai',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(new Date())

        const urls = await upload_project_files(fileList, {
          concurrency: 4,
          onProgress: (done, total) => {
            if (total > 1) toast.message(`图片上传中 ${done}/${total}`)
          },
        })
        const uploaded: Array<{ url: string; name?: string }> = urls.map((url, index) => {
          if (!url) throw new Error(`图片上传失败：${fileList[index]?.name || 'unknown'}`)
          return {
            url,
            name: dateProductName,
          }
        })

        const res = await createDraftDisplayProducts({
          zoneId: editingId,
          images: uploaded,
        })

        setDrawerItems((prev) => {
          const existing = new Set(prev.map((item) => item.entityId))
          const toAdd = res.items.filter((item) => !existing.has(item.entityId))
          return [...toAdd, ...prev]
        })

        toast.success(
          editingId
            ? `已创建并绑定 ${res.items.length} 个草稿展示商品`
            : `已创建 ${res.items.length} 个草稿展示商品，请保存专区完成绑定`,
        )
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : '快速发图失败')
      } finally {
        setDraftUploadLoading(false)
      }
    },
  }

  return {
    state: {
      loading, keyword, list, total, page, pageSize,
      drawerOpen, editingId, drawerLoading, drawerSaving, drawerFormData, drawerItems,
      deleteOpen, deletingId, deleteLoading,
      selectorOpen, modalKeyword, modalPage, modalLoading, modalTotal, modalProducts, modalCategories, modalFilterCategories, modalCategoryIdFilter, modalSelectedItems, modalCollectionName,
      draftUploadLoading, selectedDraftIds,
    },
    handlers
  }
}