'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ImportFrom1688 } from '@/backend/route-params';
import type { ProductStatusType, ImportTaskStatusType, CategoryOption, ImportTaskRecord, ImportTaskItemRecord } from '@/backend/actions/ImportFrom1688';
import { getCategoryOptions, getImportTaskList, getImportTaskDetail, createImportTask, startParseTask, updateTaskItemPreview, confirmImportProducts, retryImportTask, deleteImportTask } from '@/backend/actions/ImportFrom1688';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

// ===== 枚举映射 =====
const PRODUCT_STATUS_LABELS: Record<ProductStatusType, string> = {
  DRAFT: '草稿',
  ACTIVE: '上架',
  INACTIVE: '下架'
};
const TASK_STATUS_LABELS: Record<ImportTaskStatusType, string> = {
  PENDING: '待处理',
  RUNNING: '解析中',
  COMPLETED: '已完成',
  FAILED: '失败'
};

// ===== 页面入参 =====
const getParams = ImportFrom1688.getParams;
interface CreateFormFields {
  urls: string;
  defaultCategoryId: string;
  costDeductionUsd: number | '';
  defaultStatus: ProductStatusType;
  stockStrategyStock: number | '';
}
interface EditItemFormFields {
  name: string;
  categoryId: string;
  price: number | '';
  mainImageUrl: string;
  shortDescription: string;
}
export default function ImportFrom1688Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    taskId
  } = getParams(searchParams);

  // ===== State: Global & Layout =====
  const [activeTab, setActiveTab] = useState<string>('current');
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ===== State: Left Panel (Create Form) =====
  const [createForm, setCreateForm] = useState<CreateFormFields>({
    urls: '',
    defaultCategoryId: '',
    costDeductionUsd: 0,
    defaultStatus: 'DRAFT',
    stockStrategyStock: 100
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ===== State: Right Panel - Tab A (Current Task) =====
  const [currentTask, setCurrentTask] = useState<ImportTaskRecord | null>(null);
  const [currentItems, setCurrentItems] = useState<ImportTaskItemRecord[]>([]);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [isConfirmingImport, setIsConfirmingImport] = useState(false);
  const [editForm, setEditForm] = useState<EditItemFormFields>({
    name: '',
    categoryId: '',
    price: '',
    mainImageUrl: '',
    shortDescription: ''
  });
  const [isSavingCorrection, setIsSavingCorrection] = useState(false);

  // ===== State: Right Panel - Tab B (History List) =====
  const [historyStatusFilter, setHistoryStatusFilter] = useState<ImportTaskStatusType | 'ALL'>('ALL');
  const [historyPage, setHistoryPage] = useState(1);
  const [historyList, setHistoryList] = useState<ImportTaskRecord[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const historyPageSize = 20;

  // ===== Handlers: Forms =====
  const handleCreateFormChange = <K extends keyof CreateFormFields,>(field: K, value: CreateFormFields[K]) => {
    setCreateForm(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handleEditFormChange = <K extends keyof EditItemFormFields,>(field: K, value: EditItemFormFields[K]) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // ===== Data Loaders =====
  const loadCategories = useCallback(async () => {
    try {
      const res = await getCategoryOptions();
      setCategoryOptions(res.list);
    } catch (error) {
      toast.error((error as Error).message);
    }
  }, []);
  const loadDetail = useCallback(async (id: string) => {
    setIsLoadingDetail(true);
    try {
      const res = await getImportTaskDetail({
        taskId: id
      });
      setCurrentTask(res.task);
      setCurrentItems(res.items);
      // 默认选中所有可导入的项
      setSelectedItemIds(res.items.filter(i => i.item_isSelected && !i.item_failureReason && !i.item_importedProductId).map((i, index) => i.item_id));
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);
  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const res = await getImportTaskList({
        status: historyStatusFilter === 'ALL' ? '' : historyStatusFilter,
        page: historyPage,
        pageSize: historyPageSize
      });
      setHistoryList(res.list);
      setHistoryTotal(res.total);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [historyStatusFilter, historyPage]);
  const handleGlobalRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (activeTab === 'current' && taskId) {
        await loadDetail(taskId);
      } else if (activeTab === 'history') {
        await loadHistory();
      }
      toast.success('刷新成功');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsRefreshing(false);
    }
  }, [activeTab, taskId, loadDetail, loadHistory]);

  // ===== Effects =====
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);
  useEffect(() => {
    if (taskId) {
      setActiveTab('current');
      loadDetail(taskId);
    } else {
      setCurrentTask(null);
      setCurrentItems([]);
    }
  }, [taskId, loadDetail]);
  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab, historyStatusFilter, historyPage, loadHistory]);
  useEffect(() => {
    const item = currentItems.find(i => i.item_id === activeItemId);
    if (item && item.item_previewDataJson) {
      setEditForm({
        name: item.item_previewDataJson.name || '',
        categoryId: item.item_previewDataJson.categoryId || '',
        price: item.item_previewDataJson.price ?? '',
        mainImageUrl: item.item_previewDataJson.mainImageUrl || '',
        shortDescription: item.item_previewDataJson.shortDescription || ''
      });
    } else {
      setEditForm({
        name: '',
        categoryId: '',
        price: '',
        mainImageUrl: '',
        shortDescription: ''
      });
    }
  }, [activeItemId, currentItems]);

  // ===== Action Handlers =====
  const handleCreateTask = async () => {
    if (!createForm.urls.trim()) {
      toast.error('请输入商品源链接');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await createImportTask({
        urls: createForm.urls,
        defaultCategoryId: createForm.defaultCategoryId || undefined,
        costDeductionUsd: createForm.costDeductionUsd === '' ? undefined : createForm.costDeductionUsd,
        defaultStatus: createForm.defaultStatus,
        stockStrategyStock: createForm.stockStrategyStock === '' ? undefined : createForm.stockStrategyStock
      });
      toast.success('任务已创建，正在开始解析');
      setCreateForm(prev => ({
        ...prev,
        urls: ''
      })); // 清空输入框

      // 触发解析（异步）
      startParseTask({
        taskId: res.taskId
      }).catch(e => {
        // 如果解析报错，仅抛出提示，不阻塞跳转
        toast.error(`解析异常: ${(e as Error).message}`);
      });

      // 跳转到详情
      ImportFrom1688.navigateToTaskDetail(router, {
        taskId: res.taskId
      });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItemIds(currentItems.filter(i => !i.item_failureReason && !i.item_importedProductId).map((i, index) => i.item_id));
    } else {
      setSelectedItemIds([]);
    }
  };
  const handleToggleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItemIds(prev => [...prev, id]);
    } else {
      setSelectedItemIds(prev => prev.filter(v => v !== id));
    }
  };
  const handleSaveCorrection = async () => {
    if (!activeItemId) return;
    setIsSavingCorrection(true);
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
      });
      toast.success('字段修正已保存');
      if (taskId) loadDetail(taskId);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSavingCorrection(false);
    }
  };
  const handleConfirmImport = async () => {
    if (!taskId || selectedItemIds.length === 0) return;
    setIsConfirmingImport(true);
    try {
      await confirmImportProducts({
        taskId,
        itemIds: selectedItemIds
      });
      toast.success('商品导入成功');
      loadDetail(taskId);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsConfirmingImport(false);
    }
  };
  const handleRetryTask = async (id: string) => {
    try {
      await retryImportTask({
        taskId: id
      });
      toast.success('任务已重置，重新开始解析');
      startParseTask({
        taskId: id
      }).catch(e => {
        toast.error(`解析异常: ${(e as Error).message}`);
      });
      if (activeTab === 'current' && taskId === id) {
        loadDetail(id);
      } else if (activeTab === 'history') {
        loadHistory();
      }
    } catch (error) {
      toast.error((error as Error).message);
    }
  };
  const handleDeleteTask = async (id: string) => {
    try {
      await deleteImportTask({
        taskId: id
      });
      toast.success('任务记录已删除');
      if (activeTab === 'current' && taskId === id) {
        ImportFrom1688.navigateToMain(router);
      } else if (activeTab === 'history') {
        loadHistory();
      }
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  // ===== Render Variables =====
  const totalPages = Math.max(1, Math.ceil(historyTotal / historyPageSize));
  const selectableItems = currentItems.filter(i => !i.item_failureReason && !i.item_importedProductId);
  const isAllSelected = selectableItems.length > 0 && selectedItemIds.length === selectableItems.length;
  const activeItemDetails = useMemo(() => currentItems.find(i => i.item_id === activeItemId), [currentItems, activeItemId]);

  // ===== Render =====
  return <div data-api-unique-id='importfrom1688view-skeleton-with-logic-r55d51e28647264ed-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
      <header data-api-unique-id='importfrom1688view-skeleton-with-logic-ra024b8e6819ed432-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
        <h1 data-api-unique-id='importfrom1688view-skeleton-with-logic-r4cbfadaaa8df03ef-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>1688商品导入</h1>
        <Button onClick={handleGlobalRefresh} disabled={isRefreshing} data-api-unique-id='importfrom1688view-skeleton-with-logic-rd89a22b6d1cbd831-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
          手动刷新状态
        </Button>
      </header>

      <main data-api-unique-id='importfrom1688view-skeleton-with-logic-r2ccf012c23a000b0-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
        {/* === 左侧：任务创建与配置区 === */}
        <aside data-api-unique-id='importfrom1688view-skeleton-with-logic-rd4dd2ad58201cc28-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
          <h2 data-api-unique-id='importfrom1688view-skeleton-with-logic-r240b423aafe05d30-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>新建导入任务</h2>
          
          <label data-api-unique-id='importfrom1688view-skeleton-with-logic-r4e5a3c5454ddb974-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>1688商品源链接</label>
          <Textarea value={createForm.urls} onChange={e => handleCreateFormChange('urls', e.target.value)} placeholder="支持多行批量粘贴换行输入 URL" data-api-unique-id='importfrom1688view-skeleton-with-logic-rb59193945a8a2d6a-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic' />

          <label data-api-unique-id='importfrom1688view-skeleton-with-logic-r6c8942a173f6bec1-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>默认分类</label>
          <Select value={createForm.defaultCategoryId} onValueChange={val => handleCreateFormChange('defaultCategoryId', val)} data-api-unique-id='importfrom1688view-skeleton-with-logic-r37c05188702a530f-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
            <SelectTrigger data-api-unique-id='importfrom1688view-skeleton-with-logic-re326fa715dadbb84-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
              <SelectValue placeholder="请选择默认分类" data-api-unique-id='importfrom1688view-skeleton-with-logic-r31070460c5727ad9-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic' />
            </SelectTrigger>
            <SelectContent data-api-unique-id='importfrom1688view-skeleton-with-logic-r801cdc358802c45d-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
              {categoryOptions.map((cat, index) => <SelectItem key={cat.category_id} value={cat.category_id} data-api-unique-id='importfrom1688view-skeleton-with-logic-rc07f8a8859ac3687-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`categoryOptions-${index}-category_name`} data-api-map-var-name='cat'>
                  {cat.category_name}
                </SelectItem>)}
            </SelectContent>
          </Select>

          <label data-api-unique-id='importfrom1688view-skeleton-with-logic-r305a75ad946572f7-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>成本减法 (USD)</label>
          <Input type="number" value={createForm.costDeductionUsd} onChange={e => handleCreateFormChange('costDeductionUsd', e.target.value === '' ? '' : Number(e.target.value))} placeholder="默认0" data-api-unique-id='importfrom1688view-skeleton-with-logic-r93115c008ef68be6-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic' />

          <label data-api-unique-id='importfrom1688view-skeleton-with-logic-rb18db03c4c97d092-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>默认状态</label>
          <Select value={createForm.defaultStatus} onValueChange={val => handleCreateFormChange('defaultStatus', val as ProductStatusType)} data-api-unique-id='importfrom1688view-skeleton-with-logic-rbbababf664dcbb81-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
            <SelectTrigger data-api-unique-id='importfrom1688view-skeleton-with-logic-r39c9b48448960e7f-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
              <SelectValue placeholder="请选择导入默认状态" data-api-unique-id='importfrom1688view-skeleton-with-logic-rbd1d524ab7f4465c-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic' />
            </SelectTrigger>
            <SelectContent data-api-unique-id='importfrom1688view-skeleton-with-logic-r0ba7d0d87e10e8ec-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
              {Object.entries(PRODUCT_STATUS_LABELS).map(([val, label], index) => <SelectItem key={val} value={val} data-api-unique-id='importfrom1688view-skeleton-with-logic-r59c01bc64ad02743-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic' data-api-in-loop='1'>{label}</SelectItem>)}
            </SelectContent>
          </Select>

          <label data-api-unique-id='importfrom1688view-skeleton-with-logic-rb4744a6bbb279d88-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>默认库存数量</label>
          <Input type="number" value={createForm.stockStrategyStock} onChange={e => handleCreateFormChange('stockStrategyStock', e.target.value === '' ? '' : Number(e.target.value))} placeholder="留空则不限制默认库存" data-api-unique-id='importfrom1688view-skeleton-with-logic-r8aea75ff4be84f65-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic' />

          <Button onClick={handleCreateTask} disabled={isSubmitting || !createForm.urls.trim()} data-api-unique-id='importfrom1688view-skeleton-with-logic-r73e146873d7eeaa7-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
            创建任务并开始解析
          </Button>
        </aside>

        {/* === 右侧：任务管控工作台 === */}
        <section data-api-unique-id='importfrom1688view-skeleton-with-logic-r7bb67841809e2004-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
          <Tabs value={activeTab} onValueChange={setActiveTab} data-api-unique-id='importfrom1688view-skeleton-with-logic-rda63726eee3ae579-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
            <TabsList data-api-unique-id='importfrom1688view-skeleton-with-logic-r62b9056407287485-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
              <TabsTrigger value="current" data-api-unique-id='importfrom1688view-skeleton-with-logic-r598a1554bc6df511-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>当前任务处理</TabsTrigger>
              <TabsTrigger value="history" data-api-unique-id='importfrom1688view-skeleton-with-logic-r768a73cea1e88063-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>历史任务记录</TabsTrigger>
            </TabsList>

            {/* TAB A: 当前任务处理 */}
            <TabsContent value="current" data-api-unique-id='importfrom1688view-skeleton-with-logic-r07d9d8646f8cc17c-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
              {!taskId || !currentTask ? <div data-api-unique-id='importfrom1688view-skeleton-with-logic-rc7a883a68ddd339a-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
                  <p data-api-unique-id='importfrom1688view-skeleton-with-logic-rd395a27c997f9068-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>未选择任务</p>
                  <p data-api-unique-id='importfrom1688view-skeleton-with-logic-reb11b1165aaef593-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>请在左侧新建导入任务，或从历史任务记录中选择一个任务查看详情。</p>
                </div> : isLoadingDetail ? <p data-api-unique-id='importfrom1688view-skeleton-with-logic-rf0abd8f3ba54f316-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>加载详情中...</p> : <div data-api-unique-id='importfrom1688view-skeleton-with-logic-rbda9742be8a070b5-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
                  <header data-api-unique-id='importfrom1688view-skeleton-with-logic-r995365011e819462-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
                    <div data-api-unique-id='importfrom1688view-skeleton-with-logic-r212df79693472563-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
                      <span data-api-unique-id='importfrom1688view-skeleton-with-logic-r3ae30a32c4de042f-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>任务 ID: {currentTask.task_id}</span>
                      <span data-api-unique-id='importfrom1688view-skeleton-with-logic-rbcf1e79e560b8ff0-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>创建时间: {new Date(currentTask.task_createdAt).toLocaleString('zh-CN')}</span>
                    </div>
                    <Badge data-api-unique-id='importfrom1688view-skeleton-with-logic-reb175d63de42915d-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>{TASK_STATUS_LABELS[currentTask.task_status]}</Badge>
                    <div data-api-unique-id='importfrom1688view-skeleton-with-logic-r102f9f498164e73f-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
                      <span data-api-unique-id='importfrom1688view-skeleton-with-logic-r6502072c2a9b0c4d-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>总链接: {currentTask.task_sourceLinkCount}</span>
                      <span data-api-unique-id='importfrom1688view-skeleton-with-logic-re094591291c2824f-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>成功: {currentTask.task_successCount}</span>
                      <span data-api-unique-id='importfrom1688view-skeleton-with-logic-rb8ff279d26441ca3-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>失败: {currentTask.task_failureCount}</span>
                      <span data-api-unique-id='importfrom1688view-skeleton-with-logic-rb697e490a3d413b8-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>进度: {currentTask.task_progressPercent}%</span>
                    </div>
                    <Button onClick={handleConfirmImport} disabled={isConfirmingImport || selectedItemIds.length === 0 || currentTask.task_status !== 'COMPLETED'} data-api-unique-id='importfrom1688view-skeleton-with-logic-r1e48b6aa0c7ce364-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
                      全选勾选导入 ({selectedItemIds.length})
                    </Button>
                    {currentTask.task_status === 'FAILED' && <Button onClick={() => handleRetryTask(currentTask.task_id)} data-api-unique-id='importfrom1688view-skeleton-with-logic-r28dd49e59d84ed4c-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>重试任务</Button>}
                  </header>

                  <section data-api-unique-id='importfrom1688view-skeleton-with-logic-r94361af71af53855-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
                    {/* Master Data Grid */}
                    <article data-api-unique-id='importfrom1688view-skeleton-with-logic-r80e88dedb8833ff2-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
                      {currentItems.length === 0 ? <p data-api-unique-id='importfrom1688view-skeleton-with-logic-r67dc8b0f47bbbd54-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>该任务下暂无解析明细数据。</p> : <Table data-api-unique-id='importfrom1688view-skeleton-with-logic-r32420eac6e4a131f-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
                          <TableHeader data-api-unique-id='importfrom1688view-skeleton-with-logic-rabf8f624c011c889-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
                            <TableRow data-api-unique-id='importfrom1688view-skeleton-with-logic-rfbf59a912b1e05ac-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
                              <TableHead data-api-unique-id='importfrom1688view-skeleton-with-logic-r25465d5541838255-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
                                <Checkbox checked={isAllSelected} onCheckedChange={handleToggleSelectAll} disabled={selectableItems.length === 0} data-api-unique-id='importfrom1688view-skeleton-with-logic-r4a516b4f7f0561ad-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic' />
                              </TableHead>
                              <TableHead data-api-unique-id='importfrom1688view-skeleton-with-logic-r8bc5b9db48d36afc-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>主图</TableHead>
                              <TableHead data-api-unique-id='importfrom1688view-skeleton-with-logic-rc606a3fa83c40553-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>商品名称</TableHead>
                              <TableHead data-api-unique-id='importfrom1688view-skeleton-with-logic-rfcc79b4ac9e0c049-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>价格区间</TableHead>
                              <TableHead data-api-unique-id='importfrom1688view-skeleton-with-logic-r3ae967537d8e4ce3-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>规格摘要</TableHead>
                              <TableHead data-api-unique-id='importfrom1688view-skeleton-with-logic-rbbbd595de5209195-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>状态</TableHead>
                              <TableHead data-api-unique-id='importfrom1688view-skeleton-with-logic-r9636d7877e7eaa98-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>来源链接</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody data-api-unique-id='importfrom1688view-skeleton-with-logic-rbe68ba1b453b20d3-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
                            {currentItems.map((item, index) => <TableRow key={item.item_id} onClick={() => setActiveItemId(item.item_id)} data-state={activeItemId === item.item_id ? 'selected' : undefined} data-api-unique-id='importfrom1688view-skeleton-with-logic-r5b40e6b7f4b0dea3-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic' data-api-in-loop='1'>
                                <TableCell onClick={e => e.stopPropagation()} data-api-unique-id='importfrom1688view-skeleton-with-logic-rb445031b10793732-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic' data-api-in-loop='1'>
                                  <Checkbox checked={selectedItemIds.includes(item.item_id)} onCheckedChange={c => handleToggleSelectItem(item.item_id, !!c)} disabled={!!item.item_failureReason || !!item.item_importedProductId} data-api-unique-id='importfrom1688view-skeleton-with-logic-raabbd84af505d0ce-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic' data-api-in-loop='1' />
                                </TableCell>
                                <TableCell data-api-unique-id='importfrom1688view-skeleton-with-logic-r40db6b8e58e3b098-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic' data-api-in-loop='1'>
                                  {item.item_parsedMainImageUrl ? <img src={item.item_parsedMainImageUrl} alt="商品图" data-api-unique-id='importfrom1688view-skeleton-with-logic-r892dc0ebbe800323-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic' data-api-in-loop='1' /> : <span data-api-unique-id='importfrom1688view-skeleton-with-logic-r546b0be3a06bf9ab-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic' data-api-in-loop='1'>无图</span>}
                                </TableCell>
                                <TableCell data-api-unique-id='importfrom1688view-skeleton-with-logic-r763dbc0a6800de5d-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic' data-api-in-loop='1'>{item.item_parsedName || '-'}</TableCell>
                                <TableCell data-api-unique-id='importfrom1688view-skeleton-with-logic-r3f44eafbacbefc58-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`currentItems-${index}-item_parsedPriceMin`} data-api-map-var-name='item'>
                                  {item.item_parsedPriceMin} - {item.item_parsedPriceMax}
                                </TableCell>
                                <TableCell data-api-unique-id='importfrom1688view-skeleton-with-logic-rb48c2c08a0e3d19b-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic' data-api-in-loop='1'>
                                  {item.item_specSummaryJson?.map((s, index1) => <div key={index1} data-api-unique-id='importfrom1688view-skeleton-with-logic-r8a25f5c8d67ecc85-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`currentItems-${index}-item.item_specSummaryJson-${index1}-name`} data-api-map-var-name='s'>{s.name}: {s.values?.join('/')}</div>)}
                                </TableCell>
                                <TableCell data-api-unique-id='importfrom1688view-skeleton-with-logic-rdfd81f3010899f90-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic' data-api-in-loop='1'>
                                  {item.item_importedProductId ? '已导入' : item.item_failureReason ? '失败' : '成功'}
                                </TableCell>
                                <TableCell data-api-unique-id='importfrom1688view-skeleton-with-logic-r341c4a651e1dabc6-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic' data-api-in-loop='1'>
                                  <a href={item.item_sourceUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} data-api-unique-id='importfrom1688view-skeleton-with-logic-rde0932b09158c680-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic' data-api-in-loop='1'>打开</a>
                                </TableCell>
                              </TableRow>)}
                          </TableBody>
                        </Table>}
                    </article>

                    {/* Detail Panel */}
                    <aside data-api-unique-id='importfrom1688view-skeleton-with-logic-r6d8178e2325aa106-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
                      {!activeItemId ? <p data-api-unique-id='importfrom1688view-skeleton-with-logic-rd1428b1f40a957e7-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>请在左侧列表选择一项查看详情或修正</p> : activeItemDetails ? activeItemDetails.item_failureReason ? <div data-api-unique-id='importfrom1688view-skeleton-with-logic-r2b5fc8fceaf715f6-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
                            <h3 data-api-unique-id='importfrom1688view-skeleton-with-logic-r2edebcb7e036450f-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>解析失败详情</h3>
                            <p data-api-unique-id='importfrom1688view-skeleton-with-logic-r36feb06707b552fc-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>失败原因: {activeItemDetails.item_failureReason}</p>
                            <p data-api-unique-id='importfrom1688view-skeleton-with-logic-r8dd1236ad9a3b51c-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>原始链接: <a href={activeItemDetails.item_sourceUrl} target="_blank" rel="noreferrer" data-api-unique-id='importfrom1688view-skeleton-with-logic-r09ec229b9fdb5fd8-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>{activeItemDetails.item_sourceUrl}</a></p>
                            <Button onClick={() => handleRetryTask(activeItemDetails.item_importTaskId)} data-api-unique-id='importfrom1688view-skeleton-with-logic-rbec5f4b157b27298-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>重试抓取此任务</Button>
                          </div> : <div data-api-unique-id='importfrom1688view-skeleton-with-logic-r9182a8e1c1f8cb93-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
                            <h3 data-api-unique-id='importfrom1688view-skeleton-with-logic-r58ec5029b363e8aa-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>字段修正</h3>
                            <label data-api-unique-id='importfrom1688view-skeleton-with-logic-rabfc8cfbe0ee306a-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>商品名称</label>
                            <Input value={editForm.name} onChange={e => handleEditFormChange('name', e.target.value)} data-api-unique-id='importfrom1688view-skeleton-with-logic-r195d62d5f030c7c6-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic' />
                            
                            <label data-api-unique-id='importfrom1688view-skeleton-with-logic-r8456a0751467387a-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>所属分类</label>
                            <Select value={editForm.categoryId} onValueChange={val => handleEditFormChange('categoryId', val)} data-api-unique-id='importfrom1688view-skeleton-with-logic-r9563e6d0026e78ab-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
                              <SelectTrigger data-api-unique-id='importfrom1688view-skeleton-with-logic-r5c6479857223107d-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
                                <SelectValue placeholder="选择分类" data-api-unique-id='importfrom1688view-skeleton-with-logic-r70c1e1d4fdbe9aae-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic' />
                              </SelectTrigger>
                              <SelectContent data-api-unique-id='importfrom1688view-skeleton-with-logic-r06e6d694863e380f-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
                                {categoryOptions.map((cat, index) => <SelectItem key={cat.category_id} value={cat.category_id} data-api-unique-id='importfrom1688view-skeleton-with-logic-r90b2870792abf959-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`categoryOptions-${index}-category_name`} data-api-map-var-name='cat'>
                                    {cat.category_name}
                                  </SelectItem>)}
                              </SelectContent>
                            </Select>

                            <label data-api-unique-id='importfrom1688view-skeleton-with-logic-rc5a70537af825c5b-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>系统售价</label>
                            <Input type="number" value={editForm.price} onChange={e => handleEditFormChange('price', e.target.value === '' ? '' : Number(e.target.value))} data-api-unique-id='importfrom1688view-skeleton-with-logic-r28c0541bb217629c-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic' />

                            <label data-api-unique-id='importfrom1688view-skeleton-with-logic-rcf45e7d05ac53a89-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>主图 URL</label>
                            <Input value={editForm.mainImageUrl} onChange={e => handleEditFormChange('mainImageUrl', e.target.value)} data-api-unique-id='importfrom1688view-skeleton-with-logic-rf081f88608789898-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic' />
                            {editForm.mainImageUrl && <img src={editForm.mainImageUrl} alt="预览主图" data-api-unique-id='importfrom1688view-skeleton-with-logic-r5ca8f3c6db8927c3-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic' />}

                            <label data-api-unique-id='importfrom1688view-skeleton-with-logic-r232c4cd1916cc498-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>简要描述</label>
                            <Textarea value={editForm.shortDescription} onChange={e => handleEditFormChange('shortDescription', e.target.value)} data-api-unique-id='importfrom1688view-skeleton-with-logic-r424645f4e8cff0ca-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic' />

                            <Button onClick={handleSaveCorrection} disabled={isSavingCorrection || !!activeItemDetails.item_importedProductId} data-api-unique-id='importfrom1688view-skeleton-with-logic-r8105d244932e4853-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
                              保存修正
                            </Button>
                          </div> : null}
                    </aside>
                  </section>
                </div>}
            </TabsContent>

            {/* TAB B: 历史任务记录 */}
            <TabsContent value="history" data-api-unique-id='importfrom1688view-skeleton-with-logic-r9195c5f531f0096e-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
              <header data-api-unique-id='importfrom1688view-skeleton-with-logic-rb2cb65a6f8d167f8-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
                <Select value={historyStatusFilter} onValueChange={val => setHistoryStatusFilter(val as ImportTaskStatusType | 'ALL')} data-api-unique-id='importfrom1688view-skeleton-with-logic-r5baaef3bb8596ff7-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
                  <SelectTrigger data-api-unique-id='importfrom1688view-skeleton-with-logic-r12855e3c9bcd28e8-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
                    <SelectValue placeholder="筛选任务状态" data-api-unique-id='importfrom1688view-skeleton-with-logic-r745d3d3c42f69e1b-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic' />
                  </SelectTrigger>
                  <SelectContent data-api-unique-id='importfrom1688view-skeleton-with-logic-ra3c04ecff5c60b07-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
                    <SelectItem value="ALL" data-api-unique-id='importfrom1688view-skeleton-with-logic-r4aa4f17df2e9e199-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>全部状态</SelectItem>
                    {Object.entries(TASK_STATUS_LABELS).map(([val, label], index) => <SelectItem key={val} value={val} data-api-unique-id='importfrom1688view-skeleton-with-logic-r253b989ab944447a-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic' data-api-in-loop='1'>{label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </header>

              {isLoadingHistory ? <p data-api-unique-id='importfrom1688view-skeleton-with-logic-r53f18f0e22812514-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>加载历史记录中...</p> : historyList.length === 0 ? <p data-api-unique-id='importfrom1688view-skeleton-with-logic-r22d452dcb2a90222-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>暂无任务记录数据。</p> : <>
                  <Table data-api-unique-id='importfrom1688view-skeleton-with-logic-r03f17d1888c78d2a-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
                    <TableHeader data-api-unique-id='importfrom1688view-skeleton-with-logic-r19a1277e5cb8da06-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
                      <TableRow data-api-unique-id='importfrom1688view-skeleton-with-logic-r92db12d75944d1e9-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
                        <TableHead data-api-unique-id='importfrom1688view-skeleton-with-logic-r6ca8a145abb7ec5e-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>任务 ID</TableHead>
                        <TableHead data-api-unique-id='importfrom1688view-skeleton-with-logic-r1058b9d12fcbd6ee-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>创建时间</TableHead>
                        <TableHead data-api-unique-id='importfrom1688view-skeleton-with-logic-r77093663e53a5286-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>进度状态</TableHead>
                        <TableHead data-api-unique-id='importfrom1688view-skeleton-with-logic-r2e250e8ef4751fc6-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>链接总数/成功/失败</TableHead>
                        <TableHead data-api-unique-id='importfrom1688view-skeleton-with-logic-rc2f8337fe7ec854e-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody data-api-unique-id='importfrom1688view-skeleton-with-logic-rd23ce9c54c0e530d-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
                      {historyList.map((task, index) => <TableRow key={task.task_id} data-api-unique-id='importfrom1688view-skeleton-with-logic-reb483cc4503c38ab-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic' data-api-in-loop='1'>
                          <TableCell data-api-unique-id='importfrom1688view-skeleton-with-logic-r57504d00f5ba14f4-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`historyList-${index}-task_id`} data-api-map-var-name='task'>{task.task_id}</TableCell>
                          <TableCell data-api-unique-id='importfrom1688view-skeleton-with-logic-r11be1af620633c8d-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic' data-api-in-loop='1'>{new Date(task.task_createdAt).toLocaleString('zh-CN')}</TableCell>
                          <TableCell data-api-unique-id='importfrom1688view-skeleton-with-logic-r3ba25e638430ea96-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic' data-api-in-loop='1'>
                            <Badge data-api-unique-id='importfrom1688view-skeleton-with-logic-r78137a1b247b2e2b-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic' data-api-in-loop='1'>{TASK_STATUS_LABELS[task.task_status]}</Badge>
                            <span data-api-unique-id='importfrom1688view-skeleton-with-logic-r9eccd514abdf5694-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`historyList-${index}-task_progressPercent`} data-api-map-var-name='task'> {task.task_progressPercent}%</span>
                          </TableCell>
                          <TableCell data-api-unique-id='importfrom1688view-skeleton-with-logic-rfccfeee6c47ea134-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`historyList-${index}-task_sourceLinkCount`} data-api-map-var-name='task'>
                            {task.task_sourceLinkCount} / {task.task_successCount} / {task.task_failureCount}
                          </TableCell>
                          <TableCell data-api-unique-id='importfrom1688view-skeleton-with-logic-r5648712989e8fe3a-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic' data-api-in-loop='1'>
                            <Button variant="ghost" onClick={() => ImportFrom1688.navigateToTaskDetail(router, {
                        taskId: task.task_id
                      })} data-api-unique-id='importfrom1688view-skeleton-with-logic-re6e4ed9397aa9737-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic' data-api-in-loop='1'>
                              查看详情
                            </Button>
                            {(task.task_status === 'COMPLETED' || task.task_status === 'FAILED') && <Button variant="destructive" onClick={() => handleDeleteTask(task.task_id)} data-api-unique-id='importfrom1688view-skeleton-with-logic-rf6d8d7beab546f2d-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic' data-api-in-loop='1'>
                                删除
                              </Button>}
                          </TableCell>
                        </TableRow>)}
                    </TableBody>
                  </Table>

                  <footer data-api-unique-id='importfrom1688view-skeleton-with-logic-r00b1a1b952e950b6-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
                    <Button disabled={historyPage <= 1} onClick={() => setHistoryPage(p => Math.max(1, p - 1))} data-api-unique-id='importfrom1688view-skeleton-with-logic-rb8a4e98147f0d664-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
                      上一页
                    </Button>
                    <span data-api-unique-id='importfrom1688view-skeleton-with-logic-r418097a15272ba7c-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>第 {historyPage} / {totalPages} 页 (共 {historyTotal} 条)</span>
                    <Button disabled={historyPage >= totalPages} onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))} data-api-unique-id='importfrom1688view-skeleton-with-logic-r7a899104add652c9-s2213022640' data-api-unique-page-name='src/backend/components/ImportFrom1688View_skeleton_with_logic'>
                      下一页
                    </Button>
                  </footer>
                </>}
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>;
}