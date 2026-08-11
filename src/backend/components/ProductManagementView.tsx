'use client';

import React, { useMemo, useState } from 'react';
import { Search, RotateCcw, Plus, Trash2, Package, ArrowUpCircle, ArrowDownCircle, Info, Layers, Image as ImageIcon, Settings2, AlertCircle, TableProperties, Upload, Building2, FileSpreadsheet, Percent, Coins, FolderTree, Sparkles, Tags, Link2, Unlink, ChevronDown, RefreshCw, Languages, Square } from 'lucide-react';
import { Button, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Checkbox, Sheet, SheetContent, SheetHeader, SheetTitle, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, Textarea, Badge, Card, CardContent, Separator, Alert, AlertTitle, AlertDescription, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/backend/components/ui';
import EditableImg from '@/@base/EditableImg';
import type { ProductManagementState, ProductManagementHandlers } from '@/backend/hooks/useProductManagement';
import { ProductTreeRows } from '@/backend/components/ProductSkuTreeRows';
import { PendingCategoryTreeDialog } from '@/backend/components/PendingCategoryTreeDialog';
import { PendingImportTableRows } from '@/backend/components/PendingImportTableRows'
import { ImportFrom1688CollectModal } from '@/backend/components/ImportFrom1688CollectModal'
import { ImportFromPinduoduoCollectModal } from '@/backend/components/ImportFromPinduoduoCollectModal'
import { Sync1688StatusResultPanel } from '@/backend/components/Sync1688StatusResultPanel'
import { SharedProductBatchUtilityButtons } from '@/backend/components/SharedProductBatchUtilityButtons'
import CalibrateResultDialog from '@/backend/components/CalibrateResultDialog'
import type { ProductStatus, ProductSource, GoodsStatus as ManagementGoodsStatus, PendingImportItemFetchStatus, PendingImportItemPublishStatus } from '@/backend/types/ProductManagement';

/** Compact page list with ellipsis for pending-upload / product list pagers. */
function buildVisiblePageItems(currentPage: number, totalPages: number): Array<number | 'ellipsis'> {
  const total = Math.max(1, Math.floor(totalPages) || 1)
  const current = Math.min(Math.max(1, Math.floor(currentPage) || 1), total)
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const selected = new Set<number>([1, total])
  for (let p = current - 1; p <= current + 1; p += 1) {
    if (p >= 1 && p <= total) selected.add(p)
  }
  if (current <= 3) {
    selected.add(2)
    selected.add(3)
    selected.add(4)
  }
  if (current >= total - 2) {
    selected.add(total - 1)
    selected.add(total - 2)
    selected.add(total - 3)
  }
  const sorted = [...selected].sort((a, b) => a - b)
  const items: Array<number | 'ellipsis'> = []
  for (let i = 0; i < sorted.length; i += 1) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) items.push('ellipsis')
    items.push(sorted[i])
  }
  return items
}

const STATUS_CONFIG: Record<ProductStatus, {
  label: string;
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
  color: string;
}> = {
  DRAFT: {
    label: '待上传',
    variant: 'secondary',
    color: 'bg-slate-100 text-slate-700'
  },
  ACTIVE: {
    label: '已上架',
    variant: 'default',
    color: 'bg-emerald-500 text-white'
  },
  INACTIVE: {
    label: '已下架',
    variant: 'outline',
    color: 'bg-amber-50 text-amber-700 border-amber-200'
  }
};
const GOODS_STATUS_CONFIG: Record<ManagementGoodsStatus, {
  label: string;
  className: string;
}> = {
  ACTIVE: {
    label: '现货',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-100'
  },
  INACTIVE: {
    label: '备货中',
    className: 'bg-amber-50 text-amber-700 border-amber-100'
  },
  DRAFT: {
    label: '待上传',
    className: 'bg-sky-50 text-sky-700 border-sky-100'
  },
  DELETED: {
    label: '已删除',
    className: 'bg-slate-100 text-slate-600 border-slate-200'
  }
};
const SOURCE_CONFIG: Record<ProductSource, {
  label: string;
  icon: React.ReactNode;
}> = {
  MANUAL: {
    label: '手动创建',
    icon: <Package className="w-3 h-3 mr-1" data-api-unique-id='productmanagementview-rd9202e53e932e7d6-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />
  },
  IMPORT_1688: {
    label: '1688导入',
    icon: <Layers className="w-3 h-3 mr-1" data-api-unique-id='productmanagementview-r2212d888d1d2237a-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />
  },
  TABLE_IMPORT: {
    label: '表格导入',
    icon: <TableProperties className="w-3 h-3 mr-1" data-api-unique-id='productmanagementview-r384a26ae0a044ab2-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />
  }
};
const PENDING_FETCH_STATUS_CONFIG: Record<PendingImportItemFetchStatus, {
  label: string;
  className: string;
}> = {
  PENDING: {
    label: '待抓取',
    className: 'bg-slate-100 text-slate-700 border-slate-200'
  },
  RUNNING: {
    label: '抓取中',
    className: 'bg-sky-50 text-sky-700 border-sky-200'
  },
  COMPLETED: {
    label: '抓取成功',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  FAILED: {
    label: '抓取失败',
    className: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  RATE_LIMITED: {
    label: '限流',
    className: 'bg-orange-50 text-orange-700 border-orange-200'
  },
  RETRY_PENDING: {
    label: '待重试',
    className: 'bg-violet-50 text-violet-700 border-violet-200'
  }
};
const PENDING_PUBLISH_STATUS_CONFIG: Record<PendingImportItemPublishStatus, {
  label: string;
  className: string;
}> = {
  PENDING: {
    label: '待发布',
    className: 'bg-slate-100 text-slate-700 border-slate-200'
  },
  RUNNING: {
    label: '发布中',
    className: 'bg-sky-50 text-sky-700 border-sky-200'
  },
  COMPLETED: {
    label: '已发布',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  FAILED: {
    label: '发布失败',
    className: 'bg-rose-50 text-rose-700 border-rose-200'
  }
};
interface Props {
  state: ProductManagementState;
  handlers: ProductManagementHandlers;
}
export const ProductManagementView = ({
  state,
  handlers
}: Props) => {
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const selectedProductIds = state.selectedIds.filter(id => !id.startsWith('sku:'));
  const selectedSkuIds = state.selectedIds.filter(id => id.startsWith('sku:'));
  const hasSelected = state.selectedIds.length > 0;
  const hasProductSelected = selectedProductIds.length > 0;
  const hasPendingSelected = state.pendingImportSelectedIds.length > 0;
  const pendingQueueAllSelected = state.pendingImportQueue.length > 0 && state.pendingImportSelectedIds.length === state.pendingImportQueue.length;
  const showPendingLandingNotice = state.shouldShowPendingImportLanding;
  const showPublishedLandingNotice = state.shouldShowPublishedDraftLanding;
  const isPendingTab = state.activeTab === 'pending_imports';
  const activeSelectionCount = isPendingTab ? state.pendingImportSelectedIds.length : state.selectedIds.length;
  const pendingParseActive = state.pendingImportParseActive || state.pendingImportParseCancelling;
  const pendingParseButtonLabel = state.pendingImportParseCancelling
    ? '终止中…'
    : pendingParseActive
      ? '终止解析'
      : '解析';
  const pendingPageItems = useMemo(
    () => buildVisiblePageItems(state.pendingImportPage, state.pendingImportTotalPages),
    [state.pendingImportPage, state.pendingImportTotalPages],
  );
  const productPageItems = useMemo(
    () =>
      buildVisiblePageItems(
        state.currentPage,
        Math.max(1, Math.ceil((state.total || 0) / Math.max(1, state.pageSize || 1))),
      ),
    [state.currentPage, state.total, state.pageSize],
  );

  // 共享的「商品列表 / 待上传区 / 上传Excel / 采集 / 新增」标签导航。
  // 商品列表 tab 放在顶部工具条右侧；待上传区 tab 单独成行（第三排）。
  const categoryNavTabs = (
    <div className="flex items-center gap-2 flex-wrap" data-api-unique-id='productmanagementview-rcb55fbaf95eea81c-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
      <Button variant={state.activeTab === 'products' ? 'default' : 'outline'} className="h-10 px-5" onClick={() => handlers.setActiveTab('products')} data-api-unique-id='productmanagementview-r6b7c6696ae97e829-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
        <Package className="w-4 h-4 mr-2" data-api-unique-id='productmanagementview-ra93ccb15e8dc857f-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />商品列表
      </Button>
      <Button variant={state.activeTab === 'pending_imports' ? 'default' : 'outline'} className="h-10 px-5" onClick={() => handlers.setActiveTab('pending_imports')} data-api-unique-id='productmanagementview-rf97fb52fbb7ba786-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
        <Sparkles className="w-4 h-4 mr-2" data-api-unique-id='productmanagementview-ra3d684920e365dec-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />待上传区
        {state.pendingImportQueueTotal > 0 && <Badge className="ml-2 bg-white/20 text-current border-0 px-2 py-0.5" data-api-unique-id='productmanagementview-r25a7d85fd9cdfdb0-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>{state.pendingImportQueueTotal}</Badge>}
      </Button>
      <Button variant="outline" className="h-10 border-dashed border-slate-300 bg-slate-50/70" onClick={handlers.navigateToTableImport} data-api-unique-id='productmanagementview-r3219db1ba6c2046d-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
        <FileSpreadsheet className="w-4 h-4 mr-2" data-api-unique-id='productmanagementview-r96b081cc490849c6-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />上传 Excel/CSV 导入待上传
      </Button>
      <Button variant="outline" className="h-10 border-dashed border-primary/40 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground" onClick={() => handlers.setPendingImportDialogOpen(true)} data-api-unique-id='productmanagementview-radd4b3c8cafd97dc-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
        <Link2 className="w-4 h-4 mr-2" data-api-unique-id='productmanagementview-rba173deb9cf80df0-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />1688 多链接采集
      </Button>
      <Button variant="outline" className="h-10 border-dashed border-rose-300 bg-rose-50/70 text-rose-700 hover:bg-rose-600 hover:text-white" onClick={() => handlers.setPinduoduoImportDialogOpen(true)} data-api-unique-id='productmanagementview-pinduoduo-collect-btn-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
        <Link2 className="w-4 h-4 mr-2" data-api-unique-id='productmanagementview-pinduoduo-collect-icon-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />拼多多多链接采集
      </Button>
      <Button className="h-10 bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all" onClick={handlers.handleOpenCreate} data-api-unique-id='productmanagementview-re974db461807473f-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
        <Plus className="w-4 h-4 mr-2" data-api-unique-id='productmanagementview-re0a54b0747e57709-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />新增跨境商品
      </Button>
    </div>
  );

  // 待上传区第二排「操作功能区」：批量发布并上架 / 解析 / 批量删除 / 批量工具（改价·起订量·加后缀）
  const pendingActionButtons = (
    <div className="flex items-center gap-2 flex-wrap" data-api-unique-id='productmanagementview-rpendingactionrow-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
      <Button className="h-9 bg-emerald-600 text-white hover:bg-emerald-700" disabled={!hasPendingSelected || state.pendingImportPublishing || pendingParseActive} onClick={handlers.publishSelectedPendingImportItems} data-api-unique-id='productmanagementview-rpendingbulkpublish-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
        <ArrowUpCircle className="w-4 h-4 mr-2" data-api-unique-id='productmanagementview-rpendingbulkpublishicon-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />{state.pendingImportPublishing ? '发布中...' : '批量发布并上架'}
      </Button>
      <Button
        variant={pendingParseActive ? 'destructive' : 'outline'}
        className={pendingParseActive ? 'h-9' : 'h-9 border-slate-200'}
        disabled={state.pendingImportPublishing || state.pendingImportParseCancelling || (!pendingParseActive && !hasPendingSelected)}
        onClick={() => void handlers.handlePendingImportParseButton()}
        title={pendingParseActive ? (state.pendingImportParseStatusLabel || '点击终止当前解析') : '解析勾选的待上传商品'}
        data-api-unique-id='productmanagementview-rpendingbulkreparse-s2030557363'
        data-api-unique-page-name='src/backend/components/ProductManagementView'
      >
        {pendingParseActive
          ? <Square className="w-4 h-4 mr-2 fill-current" />
          : <RefreshCw className="w-4 h-4 mr-2" data-api-unique-id='productmanagementview-rpendingbulkreparseicon-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />}
        {pendingParseButtonLabel}
      </Button>
      {state.pendingImportParseStatusLabel ? (
        <span className="text-xs text-sky-700 max-w-[280px] leading-snug">{state.pendingImportParseStatusLabel}</span>
      ) : null}
      <Button variant="outline" size="sm" className="h-9 border-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground" disabled={!hasPendingSelected || state.pendingImportPublishing} onClick={() => handlers.openConfirmDialog('PENDING_DELETE', state.pendingImportSelectedIds)} data-api-unique-id='productmanagementview-rpendingbulkdelete-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
        <Trash2 className="w-4 h-4 mr-2" data-api-unique-id='productmanagementview-rpendingbulkdeleteicon-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />批量删除
      </Button>
      <SharedProductBatchUtilityButtons
        selectedCount={state.pendingImportSelectedIds.length}
        disabled={state.pendingImportPublishing}
        titleSuffixLoading={state.titleSuffixRunning}
        onOpenWeightPrice={() => handlers.openConfirmDialog('WEIGHT_PRICE', state.pendingImportSelectedIds)}
        onOpenMinOrderQty={() => handlers.openConfirmDialog('MIN_ORDER_QTY', state.pendingImportSelectedIds)}
        onConfirmTitleSuffix={handlers.handleBatchAppendPendingTitleSuffix}
      />
      <Button
        variant="outline"
        size="sm"
        className="h-9 border-sky-200 bg-sky-50/70 text-sky-800 hover:bg-sky-100"
        disabled={!hasPendingSelected || state.reclassifyRunning || state.pendingImportPublishing || pendingParseActive}
        onClick={() => void handlers.handleCalibratePendingImportItems()}
      >
        <Tags className={`w-4 h-4 mr-2 ${state.reclassifyRunning ? 'animate-pulse' : ''}`} />
        {state.reclassifyRunning && state.activeTab === 'pending_imports' ? '校准中...' : '一键校准选中'}
      </Button>
      {activeSelectionCount > 0 && <span className="ml-2 text-sm text-muted-foreground font-medium" data-api-unique-id='productmanagementview-rpendingselcount-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>已选择 <span className="text-primary">{activeSelectionCount}</span> 项</span>}
    </div>
  );

  return <div className="min-h-screen bg-background font-body text-foreground" data-api-unique-id='productmanagementview-r557b459a1eb090b6-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
      <section className="w-full bg-white border-b" data-controller-name="商品检索与筛选" data-api-unique-id='productmanagementview-r04bd34ec02b335d2-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
        <div className="container mx-auto px-8 py-6" data-api-unique-id='productmanagementview-rb1fe9b44bb50f022-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(220px,1fr)_220px_180px_180px_150px_160px_auto] gap-4 items-end" data-api-unique-id='productmanagementview-r3db458e81e302023-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
            <div className="min-w-[240px]" data-api-unique-id='productmanagementview-r5f9b22dc687f7f42-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block" data-api-unique-id='productmanagementview-r3d2c37a52a3ea9b9-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>商品名称 / 关键词</label>
              <Input className="h-10 px-3" placeholder="搜索商品名称、SKU基础编码..." value={state.filterKeyword} onChange={e => handlers.setFilterKeyword(e.target.value)} data-api-unique-id='productmanagementview-r81d0f01239989219-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />
            </div>
            <div data-api-unique-id='productmanagementview-r925450a500205bd7-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block" data-api-unique-id='productmanagementview-rf1e8fb25ffd9b9ff-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>类目层级</label>
              <Select value={state.filterCategoryId} onValueChange={handlers.setFilterCategoryId} data-api-unique-id='productmanagementview-rfd3b13e605764143-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                <SelectTrigger className="h-10" data-api-unique-id='productmanagementview-rc13d830b867fa362-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><SelectValue placeholder="全部分类" data-api-unique-id='productmanagementview-rae4085f39d03bdf4-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' /></SelectTrigger>
                <SelectContent data-api-unique-id='productmanagementview-r3a70875eeee81cad-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                  <SelectItem value="ALL" data-api-unique-id='productmanagementview-rb6e2042a03f1fd16-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>全部分类</SelectItem>
                  {(state.hierarchicalCategoryOptions?.length ? state.hierarchicalCategoryOptions : state.categoryOptions).map((c, index) => <SelectItem key={c.category_id} value={c.category_id} data-api-unique-id='productmanagementview-r188e3d042c2c91d9-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1'>{c.category_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div data-api-unique-id='productmanagementview-r65d68ab19c9ebbe5-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block" data-api-unique-id='productmanagementview-r8a9e7c5335f53e93-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>供应商</label>
              <div className="relative" data-api-unique-id='productmanagementview-ra7d91002ea5b5af1-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" data-api-unique-id='productmanagementview-r27e73d62d6d3f619-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />
                <Input className="h-10 pl-9" placeholder="按供应商名称筛选" value={state.filterSupplierName} onChange={e => handlers.setFilterSupplierName(e.target.value)} data-api-unique-id='productmanagementview-r8fd41c92f5438658-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />
              </div>
            </div>
            <div data-api-unique-id='productmanagementview-r294aeecd2aaebd56-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block" data-api-unique-id='productmanagementview-r2626e9c9a9fbbd07-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>品牌关键词 / Brand Keyword</label>
              <Input className="h-10 px-3" placeholder="按品牌关键词筛选" value={state.filterBrandKeyword} onChange={e => handlers.setFilterBrandKeyword(e.target.value)} data-api-unique-id='productmanagementview-r1aff89ea7a8eb1e2-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />
            </div>
            <div data-api-unique-id='productmanagementview-r967ec2752c16a929-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block" data-api-unique-id='productmanagementview-r5ce912a3ae5d25e3-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>运营状态</label>
              <Select value={state.filterStatus} onValueChange={handlers.setFilterStatus} data-api-unique-id='productmanagementview-rb6a97c4cc2adcad0-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                <SelectTrigger className="h-10" data-api-unique-id='productmanagementview-r2fd831ef28acdc9d-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><SelectValue placeholder="全部状态" data-api-unique-id='productmanagementview-r55ee48accf89cfa2-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' /></SelectTrigger>
                <SelectContent data-api-unique-id='productmanagementview-r64af6bfcb9e0af94-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                  <SelectItem value="ALL" data-api-unique-id='productmanagementview-r3a89377a0714da6d-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>全部状态</SelectItem>
                  <SelectItem value="DRAFT" data-api-unique-id='productmanagementview-r97dfe2e9c2195241-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>待上传</SelectItem>
                  <SelectItem value="ACTIVE" data-api-unique-id='productmanagementview-r56f569fcf39c976a-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>已上架</SelectItem>
                  <SelectItem value="INACTIVE" data-api-unique-id='productmanagementview-r029040d4b8966c33-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>已下架</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div data-api-unique-id='productmanagementview-r21b7e07bb0194c96-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block" data-api-unique-id='productmanagementview-r80b0d99e21cd8f40-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>后台状态筛选</label>
              <Select value={state.filterManagementStatus} onValueChange={handlers.setFilterManagementStatus} data-api-unique-id='productmanagementview-r1c14fba1a5a2f822-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                <SelectTrigger className="h-10" data-api-unique-id='productmanagementview-r1d6eed8277fe0e17-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><SelectValue placeholder="默认展示上架/下架" data-api-unique-id='productmanagementview-r61bee8f3e3fd7e9f-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' /></SelectTrigger>
                <SelectContent data-api-unique-id='productmanagementview-r79c9570faf5c427b-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                  <SelectItem value="ALL" data-api-unique-id='productmanagementview-re58cc20aadba2659-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>已上架 + 已下架</SelectItem>
                  <SelectItem value="ACTIVE" data-api-unique-id='productmanagementview-r2eed86a46a82d162-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>仅看已上架</SelectItem>
                  <SelectItem value="INACTIVE" data-api-unique-id='productmanagementview-r71d42d2fd444e9a9-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>仅看已下架</SelectItem>
                  <SelectItem value="DRAFT" data-api-unique-id='productmanagementview-r29c8487bc902d693-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>待上传</SelectItem>
                  <SelectItem value="DELETED" data-api-unique-id='productmanagementview-r29c8487bc902d693-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>已删除 / 回收站</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 mb-[1px]" data-api-unique-id='productmanagementview-r33581179b27bccfc-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
              <Button variant="outline" className="h-10 px-4 border-slate-200 hover:bg-secondary hover:text-secondary-foreground" onClick={handlers.handleReset} data-api-unique-id='productmanagementview-r7d4d957e26058c73-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                <RotateCcw className="w-4 h-4 mr-2" data-api-unique-id='productmanagementview-r659ccbcbc3181e02-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />重置
              </Button>
              <Button className="h-10 px-6 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handlers.handleSearch} data-api-unique-id='productmanagementview-r916bdc0e818317bf-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                <Search className="w-4 h-4 mr-2" data-api-unique-id='productmanagementview-re331466ac9f9df0b-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />查询
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full" data-controller-name="商品批量管控" data-api-unique-id='productmanagementview-rb03bc8a77bcd363e-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
        <div className="w-full max-w-none px-4 xl:px-6 py-6" data-api-unique-id='productmanagementview-rd2ea31f9da92c66c-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
          <Card className="mb-6 border-primary/15 shadow-sm" data-controller-name="首页推荐关键词维护" data-api-unique-id='productmanagementview-r04a9fa5c77d23b6f-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
          </Card>
          {!isPendingTab && (
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4" data-api-unique-id='productmanagementview-rdbf826b6f43eda19-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
            <div className="flex items-center gap-2 flex-wrap" data-api-unique-id='productmanagementview-r4ec6b7a2733f5aa5-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
              {<>
                <Button variant="outline" size="sm" className="h-9 border-slate-200" disabled={!hasProductSelected} onClick={() => handlers.openConfirmDialog('ACTIVE', selectedProductIds)} data-api-unique-id='productmanagementview-r698d32f132f9413e-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                  <ArrowUpCircle className="w-4 h-4 mr-2 text-emerald-600" data-api-unique-id='productmanagementview-r510343d934b6d95a-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />批量上架
                </Button>
                <Button variant="outline" size="sm" className="h-9 border-slate-200" disabled={!hasProductSelected} onClick={() => handlers.openConfirmDialog('INACTIVE', selectedProductIds)} data-api-unique-id='productmanagementview-rdc704b838e611929-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                  <ArrowDownCircle className="w-4 h-4 mr-2 text-amber-600" data-api-unique-id='productmanagementview-rf1bd4bed0fdf701c-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />批量下架
                </Button>
                <Button variant="outline" size="sm" className="h-9 border-amber-200 bg-amber-50/60 text-amber-900 hover:bg-amber-100" disabled={!hasProductSelected} onClick={() => handlers.openConfirmDialog('RETURN_TO_PENDING', selectedProductIds)} data-api-unique-id='productmanagementview-rreturnpendingbulk-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                  <RotateCcw className="w-4 h-4 mr-2 text-amber-700" data-api-unique-id='productmanagementview-rreturnpendingbulkicon-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />退回待上传
                </Button>
                <Button variant="outline" size="sm" className="h-9 border-slate-200" disabled={!hasProductSelected} onClick={() => handlers.openConfirmDialog('CATEGORY', selectedProductIds)} data-api-unique-id='productmanagementview-r82b03d061a1d74d6-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                  <FolderTree className="w-4 h-4 mr-2 text-primary" data-api-unique-id='productmanagementview-r514b7d9c64f26f4a-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />批量修改分类
                </Button>
                <Button variant="outline" size="sm" className="h-9 border-slate-200" disabled={!hasProductSelected} onClick={() => handlers.openConfirmDialog('BIND_CATEGORIES', selectedProductIds)} data-api-unique-id='productmanagementview-rc37a95d65777f348-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                  <Link2 className="w-4 h-4 mr-2 text-primary" data-api-unique-id='productmanagementview-r2bc328bab7621444-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />批量绑定类目
                </Button>
                <Button variant="outline" size="sm" className="h-9 border-slate-200" disabled={!hasProductSelected} onClick={() => handlers.openConfirmDialog('UNBIND_CATEGORIES', selectedProductIds)} data-api-unique-id='productmanagementview-runbindcats-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                  <Unlink className="w-4 h-4 mr-2 text-rose-600" data-api-unique-id='productmanagementview-runbindcatsicon-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />批量移除类目
                </Button>
                <SharedProductBatchUtilityButtons
                  selectedCount={selectedProductIds.length}
                  titleSuffixLoading={state.titleSuffixRunning}
                  onOpenWeightPrice={() => handlers.openConfirmDialog('WEIGHT_PRICE', selectedProductIds)}
                  onOpenMinOrderQty={() => handlers.openConfirmDialog('MIN_ORDER_QTY', state.selectedIds)}
                  onConfirmTitleSuffix={handlers.handleBatchAppendTitleSuffix}
                />
                <Button variant="outline" size="sm" className="h-9 border-slate-200" disabled={!hasProductSelected} onClick={() => handlers.openConfirmDialog('DELETE', selectedProductIds)} data-api-unique-id='productmanagementview-r05e8a0586f9bdefb-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                  <Trash2 className="w-4 h-4 mr-2" data-api-unique-id='productmanagementview-r03ccea60e0274f2e-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />批量删除
                </Button>
                <Button variant="outline" size="sm" className="h-9 border-orange-200 bg-orange-50/60 text-orange-800 hover:bg-orange-100" disabled={!hasProductSelected || state.sync1688Syncing} onClick={() => void handlers.handleSync1688Status()} data-api-unique-id='productmanagementview-rsync1688status-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                  <RefreshCw className={`w-4 h-4 mr-2 ${state.sync1688Syncing ? 'animate-spin' : ''}`} data-api-unique-id='productmanagementview-rsync1688statusicon-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />
                  {state.sync1688Syncing ? '1688 同步中...' : '1688 状态同步'}
                </Button>
                <Button variant="outline" size="sm" className="h-9 border-sky-200 bg-sky-50/70 text-sky-800 hover:bg-sky-100" disabled={!hasProductSelected || state.reclassifyRunning} onClick={() => void handlers.handleReclassifyPublishedProducts()} data-api-unique-id='productmanagementview-rreclassify-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                  <Tags className={`w-4 h-4 mr-2 ${state.reclassifyRunning ? 'animate-pulse' : ''}`} data-api-unique-id='productmanagementview-rreclassifyicon-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />
                  {state.reclassifyRunning && state.activeTab === 'products' ? '校准中...' : '一键校准选中'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 border-emerald-200 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100"
                  disabled={state.priceThresholdClassifyRunning}
                  onClick={() => void handlers.handleAutoClassifyPriceThresholdProducts()}
                >
                  <Tags className={`w-4 h-4 mr-2 ${state.priceThresholdClassifyRunning ? 'animate-pulse' : ''}`} />
                  {state.priceThresholdClassifyRunning ? '价格分类中...' : '价格阈值自动分类'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 border-violet-200 bg-violet-50/70 text-violet-800 hover:bg-violet-100"
                  disabled={state.spanishTitleBackfillRunning}
                  onClick={() => void handlers.handleBatchTranslateTitlesToSpanish()}
                >
                  <Languages className={`w-4 h-4 mr-2 ${state.spanishTitleBackfillRunning ? 'animate-pulse' : ''}`} />
                  {state.spanishTitleBackfillRunning ? '西语翻译中...' : '批量翻译西语标题'}
                </Button>
              </>}
              {activeSelectionCount > 0 && <span className="ml-2 text-sm text-muted-foreground font-medium animate-in fade-in-0 slide-in-from-left-2" data-api-unique-id='productmanagementview-reed35d2c1c1b7d04-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>已选择 <span className="text-primary" data-api-unique-id='productmanagementview-r16c87a4a657b76eb-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>{activeSelectionCount}</span> 项</span>}
            </div>
            {categoryNavTabs}
          </div>
          )}

          {state.is1688NameSearch && <Alert className={`mb-4 ${showPublishedLandingNotice ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : showPendingLandingNotice ? 'border-sky-200 bg-sky-50 text-sky-900' : 'border-slate-200 bg-slate-50 text-slate-900'}`} data-api-unique-id='productmanagementview-r978079cc146d0d8e-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
              <Sparkles className="h-4 w-4" data-api-unique-id='productmanagementview-r6b1dbe4c972f3645-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />
              <AlertTitle className="text-sm font-semibold" data-api-unique-id='productmanagementview-r894d3371968364a2-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>1688 导入结果落点说明</AlertTitle>
              <AlertDescription className="mt-1 space-y-2 text-sm leading-relaxed" data-api-unique-id='productmanagementview-r5fdb3962e1ea1e79-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                <p data-api-unique-id='productmanagementview-r893873d290e4075d-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>当前 URL 中的 name 参数 <span className="font-mono text-xs" data-api-unique-id='productmanagementview-raf9995aaba8a4359-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>{state.landingSearchName || '--'}</span> 会优先作为商品列表搜索词使用。</p>
                {showPublishedLandingNotice ? <p data-api-unique-id='productmanagementview-r8489425e6f2a429c-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>这条 1688 结果已经发布成待上传商品，因此会继续落在上方商品列表中。你可以直接在商品列表里编辑、补充信息或继续发布。</p> : <p data-api-unique-id='productmanagementview-r44d390bdff6926ee-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>如果这条 1688 结果尚未发布成待上传，它不会被塞进普通商品列表，而是继续留在下方待上传区里校对与发布。</p>}
                {showPendingLandingNotice && <p data-api-unique-id='productmanagementview-r5ce349b0df80acb4-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>未发布条目请切换到 <span className="font-semibold" data-api-unique-id='productmanagementview-rdc6503eb8184a09b-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>待上传区</span> 继续处理；若队列暂时刷新失败，系统会尽量保留上一次成功结果，不会把它误判成“未进入待上传区”。</p>}
              </AlertDescription>
            </Alert>}

          {<>
          <div className={state.activeTab === 'products' ? undefined : 'hidden'} aria-hidden={state.activeTab !== 'products'}>
              <Card className="border-none shadow-sm overflow-hidden w-full" data-api-unique-id='productmanagementview-r1d17722794256fd4-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
            <div className="w-full overflow-x-auto">
            <Table className="w-full min-w-full table-auto" data-api-unique-id='productmanagementview-r3c52188b538bb888-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
              <TableHeader className="bg-slate-50/50" data-api-unique-id='productmanagementview-r248581449befb05d-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                <TableRow className="hover:bg-transparent" data-api-unique-id='productmanagementview-r8eb9a08272b26c35-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                  <TableHead className="w-[50px] pl-6" data-api-unique-id='productmanagementview-r2ecd6235231e55de-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><Checkbox checked={state.list.length > 0 && state.selectedIds.length === state.list.length} onCheckedChange={checked => handlers.handleSelectAll(!!checked)} data-api-unique-id='productmanagementview-r8d5110d455f34062-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' /></TableHead>
                  <TableHead className="font-header font-bold text-slate-700 min-w-[260px]" data-api-unique-id='productmanagementview-r4bdfd42ada22c507-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>商品详情 / SKU</TableHead>
                  <TableHead className="font-header font-bold text-slate-700" data-api-unique-id='productmanagementview-raacf8869bcaa7ea1-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>来源</TableHead>
                  <TableHead className="font-header font-bold text-slate-700" data-api-unique-id='productmanagementview-rce310c5c4e65830b-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>供应商</TableHead>
                  <TableHead className="font-header font-bold text-slate-700 min-w-[180px]" data-api-unique-id='productmanagementview-rdb9c2d7d765b234c-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>主类目 / 系数</TableHead>
                  <TableHead className="font-header font-bold text-slate-700" data-api-unique-id='productmanagementview-r8f3b6e6233c481bc-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>货物状态</TableHead>
                  <TableHead className="font-header font-bold text-slate-700 text-right" data-api-unique-id='productmanagementview-r27cea4fbf4967ad1-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>重量(g)</TableHead>
                  <TableHead className="font-header font-bold text-slate-700 text-right" data-api-unique-id='productmanagementview-re83b4085a77f25f6-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>成本价(￥)</TableHead>
                  <TableHead className="font-header font-bold text-slate-700 text-right" data-api-unique-id='productmanagementview-rea18cddebe129355-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>当前系数</TableHead>
                  <TableHead className="font-header font-bold text-slate-700 text-right" data-api-unique-id='productmanagementview-r418aab222ccc8b2a-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>人民币售价区间</TableHead>
                  <TableHead className="font-header font-bold text-slate-700 text-right" data-api-unique-id='productmanagementview-rda2e87bb322a3899-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>美元预估区间</TableHead>
                  <TableHead className="font-header font-bold text-slate-700 text-right" data-api-unique-id='productmanagementview-r5bd2c61b156c3ad1-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>起订量</TableHead>
                  <TableHead className="font-header font-bold text-slate-700 text-right" data-api-unique-id='productmanagementview-r0f0644152397d384-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>可用库存</TableHead>
                  <TableHead className="font-header font-bold text-slate-700 text-center" data-api-unique-id='productmanagementview-r63799768c5fde4dd-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>状态</TableHead>
                  <TableHead className="font-header font-bold text-slate-700" data-api-unique-id='productmanagementview-r8fba21357f6f91b6-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>创建时间</TableHead>
                  <TableHead className="font-header font-bold text-slate-700" data-api-unique-id='productmanagementview-ruploadtime-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>上传时间</TableHead>
                  <TableHead className="font-header font-bold text-slate-700 text-right pr-6" data-api-unique-id='productmanagementview-recb322ad6c2152a0-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody data-api-unique-id='productmanagementview-r1a5fa8354fec1df3-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                {state.loading ? <TableRow data-api-unique-id='productmanagementview-r2f7c4ff3fc6628a6-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><TableCell colSpan={17} className="h-64 text-center" data-api-unique-id='productmanagementview-r19d770030f80fdd0-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><div className="flex flex-col items-center justify-center space-y-3" data-api-unique-id='productmanagementview-rf6b82bb7a3c05948-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" data-api-unique-id='productmanagementview-r419d681372ac07e1-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'></div><p className="text-sm text-muted-foreground" data-api-unique-id='productmanagementview-r1ca1d57f0b0c638e-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>正在同步云端商品数据...</p></div></TableCell></TableRow> : state.list.length === 0 ? <TableRow data-api-unique-id='productmanagementview-r76c5fb31d9d4af92-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><TableCell colSpan={17} className="h-64 text-center" data-api-unique-id='productmanagementview-raec18d86df3794be-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><div className="flex flex-col items-center justify-center py-12" data-api-unique-id='productmanagementview-r3061d355f29465ad-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><Package className="w-12 h-12 text-slate-200 mb-4" data-api-unique-id='productmanagementview-r2f4ec4593160d849-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' /><p className="text-slate-500 font-medium" data-api-unique-id='productmanagementview-ra922116e7169a2ab-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>未查询到符合条件的商品</p><Button variant="link" onClick={handlers.handleReset} data-api-unique-id='productmanagementview-ra7cbbc996c6bff20-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>重置搜索条件</Button></div></TableCell></TableRow> : state.list.map((item) => (
                  <ProductTreeRows
                    key={item.product_id}
                    item={item}
                    state={state}
                    handlers={handlers}
                    statusConfig={STATUS_CONFIG}
                    goodsStatusConfigMap={GOODS_STATUS_CONFIG}
                    sourceConfig={SOURCE_CONFIG}
                  />
                ))}
              </TableBody>
            </Table>
            </div>
              </Card>

              <div className="flex items-center justify-between mt-6 px-2" data-api-unique-id='productmanagementview-r90e32b8cc04d23f2-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                <div className="text-sm text-slate-500" data-api-unique-id='productmanagementview-r2863deb6f2f2e772-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>显示第 <span className="font-bold text-slate-700" data-api-unique-id='productmanagementview-re150b9a0b49b2f66-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>{state.total === 0 ? 0 : (state.currentPage - 1) * state.pageSize + 1}</span> 到 <span className="font-bold text-slate-700" data-api-unique-id='productmanagementview-r34b5db4c2f20b681-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'> {Math.min(state.currentPage * state.pageSize, state.total)}</span> 条，共 <span className="font-bold text-slate-700" data-api-unique-id='productmanagementview-r4549ff34125fe7f1-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>{state.total}</span> 条商品记录</div>
                <div className="flex items-center gap-2 flex-wrap justify-end" data-api-unique-id='productmanagementview-r39264338d35ea619-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                  <span className="text-xs text-slate-500 mr-1 tabular-nums">
                    第 {state.currentPage} / {Math.max(1, Math.ceil((state.total || 0) / Math.max(1, state.pageSize || 1)))} 页
                  </span>
                  <Button variant="outline" size="sm" className="h-9 px-4" disabled={state.currentPage <= 1 || state.loading} onClick={() => handlers.setCurrentPage(state.currentPage - 1)} data-api-unique-id='productmanagementview-r043a8e9c280c19c7-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>上一页</Button>
                  {productPageItems.map((item, index) =>
                    item === 'ellipsis' ? (
                      <span
                        key={`product-ellipsis-${index}`}
                        className="inline-flex h-9 min-w-[28px] items-center justify-center text-slate-400"
                        aria-hidden
                      >
                        …
                      </span>
                    ) : (
                      <Button
                        key={`product-page-${item}`}
                        type="button"
                        variant={item === state.currentPage ? 'default' : 'outline'}
                        size="sm"
                        className="h-9 min-w-[40px] px-3 tabular-nums"
                        disabled={state.loading}
                        aria-current={item === state.currentPage ? 'page' : undefined}
                        onClick={() => handlers.setCurrentPage(item)}
                        data-api-unique-id={`productmanagementview-rproduct-page-${item}-s2030557363`}
                        data-api-unique-page-name='src/backend/components/ProductManagementView'
                      >
                        {item}
                      </Button>
                    ),
                  )}
                  <Button variant="outline" size="sm" className="h-9 px-4" disabled={state.currentPage * state.pageSize >= state.total || state.loading} onClick={() => handlers.setCurrentPage(state.currentPage + 1)} data-api-unique-id='productmanagementview-r3e35d9c400f049dc-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>下一页</Button>
                </div>
              </div>
            </div>
            <div
              className={state.activeTab === 'pending_imports' ? 'space-y-4' : 'hidden'}
              aria-hidden={state.activeTab !== 'pending_imports'}
              data-controller-name="1688待上传区"
              data-api-unique-id='productmanagementview-r797d689e3a37a2c1-s2030557363'
              data-api-unique-page-name='src/backend/components/ProductManagementView'
            >
              {showPendingLandingNotice && <Alert className="border-sky-200 bg-sky-50 text-sky-900" data-controller-name="1688导入落点提示" data-api-unique-id='productmanagementview-r6d2dd13d7b13fe53-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                  <Sparkles className="h-4 w-4" data-api-unique-id='productmanagementview-r11f7545332699a5c-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />
                  <AlertTitle className="text-sm font-semibold" data-api-unique-id='productmanagementview-rcb134221650f62b8-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>未发布的 1688 结果请在这里继续处理</AlertTitle>
                  <AlertDescription className="mt-1 space-y-2 text-sm leading-relaxed" data-api-unique-id='productmanagementview-r00ab0a36c831cd4a-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                    <p data-api-unique-id='productmanagementview-r9076b119ab08bc47-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>当前搜索词 <span className="font-mono text-xs" data-api-unique-id='productmanagementview-r4f917e4a7df2b168-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>{state.landingSearchName || '--'}</span> 仅用于命中已发布商品；未发布条目仍以共享待上传队列为准，并在本区继续校对、编辑与一键发布。</p>
                    {state.pendingImportQueueError ? <p data-api-unique-id='productmanagementview-r1af2c9cc48c13441-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>待上传区刚刚刷新失败：{state.pendingImportQueueError}。系统会优先保留上一次成功读取到的队列结果，你仍可先继续处理已展示条目，再稍后点击“刷新队列”。</p> : <p data-api-unique-id='productmanagementview-rd10130764ea1eda2-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>如果解析刚完成但尚未发布，请先在本区检查名称、分类、价格、库存和主图等字段，再执行发布。</p>}
                  </AlertDescription>
                </Alert>}

              {/* 仅在真正有进行中的解析作业时展示进度；卡住的「导入任务」统计条已移除 */}
              {state.pendingImportParseJob?.busy ? (
                <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 space-y-3" data-controller-name="当前解析进度">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-sky-700">当前解析进度</div>
                      <div className="mt-1 text-base font-semibold text-sky-950">
                        {state.pendingImportParseStatusLabel || '正在解析…'}
                      </div>
                      {state.pendingImportParseJob.label ? (
                        <div className="mt-1 text-xs text-sky-700/80 font-mono">{state.pendingImportParseJob.label}</div>
                      ) : null}
                    </div>
                    <Button
                      variant="destructive"
                      className="h-10"
                      disabled={state.pendingImportParseCancelling}
                      onClick={() => void handlers.cancelPendingImportParse()}
                    >
                      <Square className="w-4 h-4 mr-2 fill-current" />
                      {state.pendingImportParseCancelling ? '终止中…' : '终止解析'}
                    </Button>
                  </div>
                  {state.pendingImportParseJob.total > 0 ? (
                    <>
                      <div className="flex items-end justify-between gap-3">
                        <div className="text-3xl font-header font-bold text-sky-900">
                          {Math.min(100, Math.round((state.pendingImportParseJob.done / Math.max(1, state.pendingImportParseJob.total)) * 100))}%
                        </div>
                        <span className="text-xs text-sky-700">
                          已完成 {state.pendingImportParseJob.done} / {state.pendingImportParseJob.total}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-sky-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-sky-600 transition-all"
                          style={{
                            width: `${Math.max(0, Math.min(100, Math.round((state.pendingImportParseJob.done / Math.max(1, state.pendingImportParseJob.total)) * 100)))}%`,
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-sky-800">后台正在处理，进度会每几秒自动刷新。若长时间无变化可点「终止解析」后重试。</p>
                  )}
                </div>
              ) : null}

              {/* 第二排：操作功能区 */}
              {pendingActionButtons}

              {/* 第三排：标签导航区（与商品列表页共享同一组导航按钮，保持视觉平行） */}
              {categoryNavTabs}

              <Card className="border-none shadow-sm overflow-hidden" data-controller-name="待上传条目列表" data-api-unique-id='productmanagementview-r3adb9edc37c0cc17-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                <CardContent className="p-0" data-api-unique-id='productmanagementview-rff81e6b750bd03f6-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                  <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b bg-white" data-api-unique-id='productmanagementview-r09950f0048f3b36e-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                    <div data-api-unique-id='productmanagementview-rd91131efc907ef4a-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                      <div className="text-lg font-header font-bold text-slate-900" data-api-unique-id='productmanagementview-r917d88f1a7a09b66-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>待上传条目</div>
                      <p className="text-sm text-slate-500 mt-1" data-api-unique-id='productmanagementview-r309e5bebfed4797b-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>全字段支持双击编辑：文字/数字回车或失焦保存；目标分类弹出分类树；货物状态可选「待上传 / 发布」。主行【上传/编辑图片】用于详情页顶部主图轮播；展开子 SKU 后可单独【上传颜色图】。</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap" data-api-unique-id='productmanagementview-ra39dddcb912be772-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                      {hasPendingSelected && <span className="text-sm text-muted-foreground font-medium" data-api-unique-id='productmanagementview-r2829f14a93306ee9-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>已选择 <span className="text-primary" data-api-unique-id='productmanagementview-rb402189cfe941d97-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>{state.pendingImportSelectedIds.length}</span> 项</span>}
                      <Button variant="outline" className="h-10 border-slate-200" disabled={state.pendingImportRefreshing || state.pendingImportQueueLoading} onClick={() => handlers.refreshPendingImportQueue()} data-api-unique-id='productmanagementview-r229f655f659cc41f-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                        <RotateCcw className={`w-4 h-4 mr-2 ${state.pendingImportRefreshing || state.pendingImportQueueLoading ? 'animate-spin' : ''}`} data-api-unique-id='productmanagementview-r87fece432f878dec-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />刷新队列
                      </Button>
                      <Button className="h-10 bg-emerald-600 text-white hover:bg-emerald-700" disabled={!hasPendingSelected || state.pendingImportPublishing} onClick={handlers.publishSelectedPendingImportItems} data-api-unique-id='productmanagementview-r21dd9eb44fdc6480-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                        <ArrowUpCircle className="w-4 h-4 mr-2" data-api-unique-id='productmanagementview-ra4cb692981cf2dd5-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />{state.pendingImportPublishing ? '发布中...' : '一键发布并上架'}
                      </Button>
                      <Button
                        variant={pendingParseActive ? 'destructive' : 'outline'}
                        className={pendingParseActive ? 'h-10' : 'h-10 border-slate-200'}
                        disabled={state.pendingImportPublishing || state.pendingImportParseCancelling || (!pendingParseActive && !hasPendingSelected)}
                        onClick={() => void handlers.handlePendingImportParseButton()}
                        title={pendingParseActive ? (state.pendingImportParseStatusLabel || '点击终止当前解析') : '解析勾选的待上传商品'}
                        data-api-unique-id='productmanagementview-rpendingreparse-s2030557363'
                        data-api-unique-page-name='src/backend/components/ProductManagementView'
                      >
                        {pendingParseActive
                          ? <Square className="w-4 h-4 mr-2 fill-current" />
                          : <RefreshCw className={`w-4 h-4 mr-2 ${state.pendingImportReparsing ? 'animate-spin' : ''}`} data-api-unique-id='productmanagementview-rpendingreparseicon-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />}
                        {pendingParseButtonLabel}
                      </Button>
                    </div>
                  </div>

                  <div
                    className="overflow-x-auto pending-import-table-scroll [scrollbar-width:thin] [scrollbar-color:rgb(203_213_225)_transparent] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 hover:[&::-webkit-scrollbar-thumb]:bg-slate-400"
                    data-api-unique-id='productmanagementview-rpending-hscroll-s2030557363'
                    data-api-unique-page-name='src/backend/components/ProductManagementView'
                  >
                    <Table className="min-w-[1720px]" data-api-unique-id='productmanagementview-rcdbe1b04c864b903-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                      <TableHeader className="bg-slate-50/50" data-api-unique-id='productmanagementview-rc7e49a10cb0458f9-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                        <TableRow className="hover:bg-transparent" data-api-unique-id='productmanagementview-r42b96fd218176334-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                          <TableHead className="w-[50px] pl-6" data-api-unique-id='productmanagementview-re03def6b5ddf0235-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><Checkbox checked={pendingQueueAllSelected} onCheckedChange={checked => handlers.handleSelectAllPendingImport(!!checked)} data-api-unique-id='productmanagementview-r1524bdf0a7af2d1b-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' /></TableHead>
                          <TableHead className="font-header font-bold text-slate-700 min-w-[260px]" data-api-unique-id='productmanagementview-r94c8e0e666556134-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>商品详情 / SKU</TableHead>
                          <TableHead className="font-header font-bold text-slate-700 min-w-[120px]" data-api-unique-id='productmanagementview-rpending-extcode-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>外部货号</TableHead>
                          <TableHead className="font-header font-bold text-slate-700" data-api-unique-id='productmanagementview-rpending-source-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>来源</TableHead>
                          <TableHead className="font-header font-bold text-slate-700" data-api-unique-id='productmanagementview-r5fa3a82e958d03bf-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>供应商</TableHead>
                          <TableHead className="font-header font-bold text-slate-700 min-w-[180px]" data-api-unique-id='productmanagementview-r60fabef8c038f168-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>主类目 / 系数</TableHead>
                          <TableHead className="font-header font-bold text-slate-700" data-api-unique-id='productmanagementview-rd1945507879edad6-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>货物状态</TableHead>
                          <TableHead className="font-header font-bold text-slate-700 text-right" data-api-unique-id='productmanagementview-r437711f647a7cc7c-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>重量(g)</TableHead>
                          <TableHead className="font-header font-bold text-slate-700 text-right" data-api-unique-id='productmanagementview-ra0412348a5abaf69-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>成本价(￥)</TableHead>
                          <TableHead className="font-header font-bold text-slate-700 text-right" data-api-unique-id='productmanagementview-r8e486ac10aec068b-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>当前系数</TableHead>
                          <TableHead className="font-header font-bold text-slate-700 text-right" data-api-unique-id='productmanagementview-r60c08e97e72607a9-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>人民币售价区间</TableHead>
                          <TableHead className="font-header font-bold text-slate-700 text-right" data-api-unique-id='productmanagementview-ree5e0c8e31d151f6-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>美元预估区间</TableHead>
                          <TableHead className="font-header font-bold text-slate-700 text-right" data-api-unique-id='productmanagementview-r7c38085b3732130d-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>起订量</TableHead>
                          <TableHead className="font-header font-bold text-slate-700 text-right" data-api-unique-id='productmanagementview-rec15ee36b7a1d60f-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>可用库存</TableHead>
                          <TableHead className="font-header font-bold text-slate-700 text-center" data-api-unique-id='productmanagementview-r6569f473651f37a9-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>状态</TableHead>
                          <TableHead className="font-header font-bold text-slate-700" data-api-unique-id='productmanagementview-rpending-created-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>创建时间</TableHead>
                          <TableHead className="font-header font-bold text-slate-700 text-right pr-6" data-api-unique-id='productmanagementview-rpendingops001-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody data-api-unique-id='productmanagementview-r55de4cba683d38e3-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                        {state.pendingImportQueueLoading && state.pendingImportQueue.length === 0 ? <TableRow data-api-unique-id='productmanagementview-rabde92a7bf1c85b2-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><TableCell colSpan={17} className="h-52 text-center" data-api-unique-id='productmanagementview-rfa7f2d0d383b3f18-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><div className="flex flex-col items-center justify-center gap-3" data-api-unique-id='productmanagementview-rb9bdaaffa4ae51a9-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" data-api-unique-id='productmanagementview-rd9af88e226b5f15f-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' /><p className="text-sm text-slate-500" data-api-unique-id='productmanagementview-r05dfce6dcee92df1-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>正在拉取待上传条目...</p></div></TableCell></TableRow> : state.pendingImportQueue.length === 0 ? <TableRow data-api-unique-id='productmanagementview-r1f392d0b7dc01512-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><TableCell colSpan={17} className="h-52 text-center" data-api-unique-id='productmanagementview-r96eaf3f7bfa13387-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><div className="flex flex-col items-center justify-center gap-4 py-8" data-api-unique-id='productmanagementview-r16a90b615e4fe597-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><Sparkles className="w-12 h-12 text-slate-200" data-api-unique-id='productmanagementview-r8d8d5114b9fc2a8a-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' /><div data-api-unique-id='productmanagementview-re768b1619e0183b7-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><div className="font-semibold text-slate-900" data-api-unique-id='productmanagementview-rdfeb29d90778d882-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>当前待上传区为空</div><p className="text-sm text-slate-500 mt-1" data-api-unique-id='productmanagementview-r66173ec0f6d26fc4-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>{state.pendingImportActiveTask ? '当前采集任务的待上传条目已处理完成，可继续新建任务或查看正式商品列表。' : '先发起 1688 多链接采集任务，采集成功后条目会自动出现在这里。'}</p></div><div className="flex items-center gap-2" data-api-unique-id='productmanagementview-rb19e02dd7829dbc4-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><Button variant="outline" onClick={() => handlers.setActiveTab('products')} data-api-unique-id='productmanagementview-rd21abd638ef3b220-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>返回商品列表</Button><Button className="bg-primary text-primary-foreground" onClick={() => handlers.setPendingImportDialogOpen(true)} data-api-unique-id='productmanagementview-r2dda823a37a9234b-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>前往导入工作台</Button></div></div></TableCell></TableRow> : state.pendingImportPagedQueue.map(item => {
                      const fetchStatusConfig = PENDING_FETCH_STATUS_CONFIG[item.item_fetchStatus];
                      const publishStatusConfig = PENDING_PUBLISH_STATUS_CONFIG[item.item_publishStatus];
                      return <PendingImportTableRows key={item.item_id} item={item} state={state} handlers={handlers} fetchStatusConfig={fetchStatusConfig} publishStatusConfig={publishStatusConfig} sourceConfig={SOURCE_CONFIG} />;
                    })}
                      </TableBody>
                    </Table>
                  </div>

                  {state.pendingImportQueueTotal > 0 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t bg-white" data-api-unique-id='productmanagementview-rpending-pager-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                      <div className="text-sm text-slate-500" data-api-unique-id='productmanagementview-rpending-pager-text-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                        显示第 <span className="font-bold text-slate-700">{state.pendingImportQueueTotal === 0 ? 0 : (state.pendingImportPage - 1) * state.pendingImportPageSize + 1}</span> 到 <span className="font-bold text-slate-700">{Math.min(state.pendingImportPage * state.pendingImportPageSize, state.pendingImportQueueTotal)}</span> 条，共 <span className="font-bold text-slate-700">{state.pendingImportQueueTotal}</span> 条待上传条目（每页 {state.pendingImportPageSize} 条）
                      </div>
                      <div className="flex items-center gap-2 flex-wrap justify-end" data-api-unique-id='productmanagementview-rpending-pager-btns-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                        <span className="text-xs text-slate-500 mr-1 tabular-nums">
                          第 {state.pendingImportPage} / {state.pendingImportTotalPages} 页
                        </span>
                        <Button variant="outline" size="sm" className="h-9 px-4" disabled={state.pendingImportPage <= 1 || state.pendingImportQueueLoading} onClick={() => handlers.setPendingImportPage(state.pendingImportPage - 1)} data-api-unique-id='productmanagementview-rpending-prev-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>上一页</Button>
                        {pendingPageItems.map((item, index) =>
                          item === 'ellipsis' ? (
                            <span
                              key={`pending-ellipsis-${index}`}
                              className="inline-flex h-9 min-w-[28px] items-center justify-center text-slate-400"
                              aria-hidden
                            >
                              …
                            </span>
                          ) : (
                            <Button
                              key={`pending-page-${item}`}
                              type="button"
                              variant={item === state.pendingImportPage ? 'default' : 'outline'}
                              size="sm"
                              className="h-9 min-w-[40px] px-3 tabular-nums"
                              disabled={state.pendingImportQueueLoading}
                              aria-current={item === state.pendingImportPage ? 'page' : undefined}
                              onClick={() => handlers.setPendingImportPage(item)}
                              data-api-unique-id={`productmanagementview-rpending-page-${item}-s2030557363`}
                              data-api-unique-page-name='src/backend/components/ProductManagementView'
                            >
                              {item}
                            </Button>
                          ),
                        )}
                        <Button variant="outline" size="sm" className="h-9 px-4" disabled={state.pendingImportPage >= state.pendingImportTotalPages || state.pendingImportQueueLoading} onClick={() => handlers.setPendingImportPage(state.pendingImportPage + 1)} data-api-unique-id='productmanagementview-rpending-next-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>下一页</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>}
        </div>
      </section>

      <PendingCategoryTreeDialog
        open={!!state.productCategoryPicker}
        title="选择商品分类"
        options={state.categoryOptions}
        selectedId={state.productCategoryPicker?.selectedId || ''}
        onOpenChange={open => {
          if (!open) handlers.cancelProductCategoryPicker();
        }}
        onConfirm={async categoryId => {
          if (!state.productCategoryPicker) return;
          try {
            await handlers.saveProductField(state.productCategoryPicker.productId, 'category_id', categoryId);
            handlers.cancelProductCategoryPicker();
          } catch {
            // toast already shown in saveProductField
          }
        }}
      />

      <PendingCategoryTreeDialog
        open={!!state.pendingCategoryPicker}
        title="选择大类归属"
        options={state.categoryOptions}
        selectedId={state.pendingCategoryPicker?.selectedId || ''}
        selectL1Only
        onOpenChange={open => {
          if (!open) handlers.cancelPendingCategoryPicker();
        }}
        onConfirm={async categoryId => {
          if (!state.pendingCategoryPicker) return;
          try {
            await handlers.savePendingImportField(state.pendingCategoryPicker.itemId, 'target_category_id', categoryId);
            handlers.cancelPendingCategoryPicker();
          } catch {
            // toast already shown in savePendingImportField
          }
        }}
      />

      <Sheet open={state.drawerOpen} onOpenChange={handlers.setDrawerOpen} data-api-unique-id='productmanagementview-rc218169e373172ea-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
        <SheetContent className="sm:max-w-[90vw] md:max-w-[76vw] lg:max-w-[1100px] p-0 flex flex-col h-full bg-slate-50" data-api-unique-id='productmanagementview-r479b0f5fd41822f8-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
          <SheetHeader className="px-8 py-6 bg-white border-b sticky top-0 z-10 flex-shrink-0" data-api-unique-id='productmanagementview-r79d923a2f329630f-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
            <div className="flex items-center justify-between" data-api-unique-id='productmanagementview-rbcd1941c841ba824-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
              <div data-api-unique-id='productmanagementview-r43463559732620cc-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                <SheetTitle className="text-2xl font-header font-bold text-slate-900" data-api-unique-id='productmanagementview-rf5e00707f9850287-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>{state.drawerMode === 'create' ? '新增跨境出口商品' : `编辑商品: ${state.formData.name}`}</SheetTitle>
                <div className="flex items-center gap-2 mt-1" data-api-unique-id='productmanagementview-rc62321ab54b0a637-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tight" data-api-unique-id='productmanagementview-rf5c2ae1b8388cd4d-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>人民币主展示</Badge>{state.drawerMode === 'edit' && <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100" data-api-unique-id='productmanagementview-rd9f17b4db4e9b5a5-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>支持单商品调价重算</Badge>}</div>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 pb-32" data-api-unique-id='productmanagementview-r38ac5edc3f282027-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
            {state.drawerLoading ? <div className="h-full flex items-center justify-center" data-api-unique-id='productmanagementview-r8d34df8cbfaf1ae2-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" data-api-unique-id='productmanagementview-r0679284ad1d4fe13-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'></div></div> : <div className="max-w-5xl mx-auto space-y-8" data-api-unique-id='productmanagementview-r289d5786c6415ff0-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                <Card className="border-slate-200" data-api-unique-id='productmanagementview-r6cf860a127c1b625-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                  <CardContent className="p-6" data-api-unique-id='productmanagementview-r554071d7014a777c-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                    <div className="flex items-center gap-2 mb-6 border-l-4 border-primary pl-3" data-api-unique-id='productmanagementview-r4c80255b9cf01ecd-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><Info className="w-5 h-5 text-primary" data-api-unique-id='productmanagementview-r77a5dd39bc132b13-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' /><h3 className="text-lg font-bold text-slate-900" data-api-unique-id='productmanagementview-r685181197e6efc9e-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>基础属性</h3></div>
                    <div className="grid grid-cols-2 gap-6" data-api-unique-id='productmanagementview-r907d2e636381a26f-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                      <div className="col-span-2" data-api-unique-id='productmanagementview-r39300ad0165f6ef8-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><label className="text-sm font-bold text-slate-700 mb-2 block" data-api-unique-id='productmanagementview-r2f2e4feacc9a424d-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>商品展示全称 <span className="text-destructive" data-api-unique-id='productmanagementview-r8d06d4ebffcb738f-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>*</span></label><Input className="h-11" value={state.formData.name} onChange={e => handlers.handleFormFieldChange('name', e.target.value)} placeholder="例如: 2024夏季新款高强度工业级不锈钢连接器" data-api-unique-id='productmanagementview-rbea19d1128263740-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' /></div>
                      <div data-api-unique-id='productmanagementview-rcb253d7d4d1c69ba-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><label className="text-sm font-bold text-slate-700 mb-2 block" data-api-unique-id='productmanagementview-r53399d6977a70303-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>行业分类挂载 <span className="text-destructive" data-api-unique-id='productmanagementview-r3b9cf016489ce0c9-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>*</span></label><Select value={state.formData.category_id} onValueChange={v => handlers.handleFormFieldChange('category_id', v)} data-api-unique-id='productmanagementview-rabdcb96e1a18cdd5-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><SelectTrigger className="h-11" data-api-unique-id='productmanagementview-r34ff121971db3579-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><SelectValue placeholder="请选择对应类目" data-api-unique-id='productmanagementview-re52839f02886af52-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' /></SelectTrigger><SelectContent data-api-unique-id='productmanagementview-r9b1a52e2e0686ff3-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>{state.categoryOptions.map((c, index) => <SelectItem key={c.category_id} value={c.category_id} data-api-unique-id='productmanagementview-ra024468677f17c39-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1'>{c.category_name}</SelectItem>)}</SelectContent></Select></div>
                      <div data-api-unique-id='productmanagementview-rcab7007f9d905bdf-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><label className="text-sm font-bold text-slate-700 mb-2 block" data-api-unique-id='productmanagementview-rcf543955cddc1a87-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>货物状态 <span className="text-destructive" data-api-unique-id='productmanagementview-ra7da10d7e0a1ae5f-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>*</span></label><Select value={state.formData.goods_status || 'ACTIVE'} onValueChange={v => handlers.handleFormFieldChange('goods_status', v as ManagementGoodsStatus)} data-api-unique-id='productmanagementview-r80f37cb922299e38-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><SelectTrigger className="h-11" data-api-unique-id='productmanagementview-r062b58cb80c77638-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><SelectValue placeholder="请选择货物状态" data-api-unique-id='productmanagementview-ra4fea0eea85d80f9-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' /></SelectTrigger><SelectContent data-api-unique-id='productmanagementview-rbbdd30978c8219ac-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><SelectItem value="ACTIVE" data-api-unique-id='productmanagementview-r307280a112004a40-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>已上架</SelectItem><SelectItem value="INACTIVE" data-api-unique-id='productmanagementview-r3170aacf24ed3fe1-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>已下架</SelectItem><SelectItem value="DELETED" data-api-unique-id='productmanagementview-re9a3da900a01cad5-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>已删除</SelectItem></SelectContent></Select></div>
                      <div className="col-span-2 rounded-xl border border-primary/10 bg-primary/5 p-4" data-api-unique-id='productmanagementview-rb8f6a9315ae385e0-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><div className="flex flex-wrap items-center justify-between gap-3" data-api-unique-id='productmanagementview-r2165774b020aea09-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><div data-api-unique-id='productmanagementview-r19a21f9f2a4f7ed5-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><p className="text-sm font-bold text-slate-900" data-api-unique-id='productmanagementview-r4e51989c7cb27de0-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>主类目售价策略</p><p className="text-xs text-slate-500 mt-1" data-api-unique-id='productmanagementview-r2152cde69edc052b-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>默认优先使用主类目售价系数；商品自身系数字段继续保留，可做单商品调价。</p></div><div className="flex flex-wrap gap-2" data-api-unique-id='productmanagementview-re366660f5680342f-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>{state.formData.main_category_name ? <Badge variant="outline" className="bg-white text-slate-700 border-slate-200" data-api-unique-id='productmanagementview-r2e64a4e27184027d-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><FolderTree className="w-3 h-3 mr-1" data-api-unique-id='productmanagementview-r2600cacaeed9843b-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />{state.formData.main_category_name}</Badge> : <Badge variant="outline" data-api-unique-id='productmanagementview-r490a6fd7bfdb8615-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>未选择主类目</Badge>}<Badge className="bg-white text-primary border border-primary/20" data-api-unique-id='productmanagementview-r3b6f419525c2e05d-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><Percent className="w-3 h-3 mr-1" data-api-unique-id='productmanagementview-r0a53a16faadba677-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />类目系数 {state.formData.main_category_price_coefficient ? state.formData.main_category_price_coefficient.toFixed(2) : '--'}</Badge><Badge className="bg-white text-slate-700 border border-slate-200" data-api-unique-id='productmanagementview-r263ef0368a782754-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><Coins className="w-3 h-3 mr-1" data-api-unique-id='productmanagementview-rc9990b5344bff719-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />当前生效系数 {state.formData.effective_price_coefficient ? state.formData.effective_price_coefficient.toFixed(2) : '--'}</Badge></div></div></div>
                      <div className="col-span-2 rounded-xl border border-slate-200 bg-white p-4" data-api-unique-id='productmanagementview-r807abad7d1a61ff3-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                        <div className="flex items-center justify-between gap-3 mb-3" data-api-unique-id='productmanagementview-r4265a0375659bc92-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><div data-api-unique-id='productmanagementview-r446ef927ea9a433e-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><label className="text-sm font-bold text-slate-700 block" data-api-unique-id='productmanagementview-re0600c2909f7d99e-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>关联类目（多选）</label><p className="text-xs text-slate-500 mt-1" data-api-unique-id='productmanagementview-r4eb8cb52416cda84-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>保留主类目作为默认归属，同时补充辅助命中类目。</p></div><Badge variant="outline" className="bg-slate-50" data-api-unique-id='productmanagementview-r101653557f25f198-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>已选 {state.formData.linked_category_ids?.length || 0}</Badge></div>
                        <div className="max-h-44 overflow-auto rounded-lg border border-slate-200 p-3 space-y-2 bg-slate-50/60" data-api-unique-id='productmanagementview-r10bb7080377302d6-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                          {state.bindingCategoryOptions.map((option, index) => <label key={option.value} className="flex items-center gap-3 rounded-md bg-white px-3 py-2 text-sm text-slate-700 border border-slate-100 hover:border-primary/30 cursor-pointer" data-api-unique-id='productmanagementview-r1aab1dd1cd9321dc-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1'><Checkbox checked={state.formData.linked_category_ids?.includes(option.value)} onCheckedChange={checked => handlers.toggleFormLinkedCategory(option.value, !!checked)} data-api-unique-id='productmanagementview-rbb5989f2742d4b6c-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1' /><span className="flex-1" data-api-unique-id='productmanagementview-rff5277709199c9af-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1'>{option.label}</span></label>)}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3" data-api-unique-id='productmanagementview-rf2da949f6291b211-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>{state.formData.linked_category_ids?.length ? state.formData.linked_category_ids.map((categoryId, index) => <Badge key={categoryId} variant="secondary" className="bg-primary/10 text-primary" data-api-unique-id='productmanagementview-r958c5cba98752e5c-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1'>{state.bindingCategoryOptions.find(option => option.value === categoryId)?.label || categoryId}</Badge>) : <span className="text-xs text-slate-400" data-api-unique-id='productmanagementview-r6e5409a8358f27d0-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>未选择关联类目</span>}</div>
                      </div>
                      <div data-api-unique-id='productmanagementview-r10400fc57e79a5af-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><label className="text-sm font-bold text-slate-700 mb-2 block" data-api-unique-id='productmanagementview-rbd5af73acc7b268f-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>供应商名称</label><Input className="h-11" value={state.formData.supplier_name || ''} onChange={e => handlers.handleFormFieldChange('supplier_name', e.target.value)} placeholder="例如：深圳华峰供应链" data-api-unique-id='productmanagementview-rfc271b61f866d033-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' /></div>
                      <div data-api-unique-id='productmanagementview-rc390ecf0f7102b89-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><label className="text-sm font-bold text-slate-700 mb-2 block" data-api-unique-id='productmanagementview-rf78dfd03dee6e8e7-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>商品重量(g) <span className="text-destructive" data-api-unique-id='productmanagementview-r3d4e5a018f2e6e7f-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>*</span></label><Input type="number" className="h-11" value={state.formData.weight_gram ?? ''} onChange={e => handlers.handleFormFieldChange('weight_gram', e.target.value ? Number(e.target.value) : null)} onBlur={e => handlers.handleFormFieldChange('weight_gram', e.target.value ? Number(e.target.value) : null)} placeholder="例如 500" data-api-unique-id='productmanagementview-rb6005cd4c3348753-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' /></div>
                      <div data-api-unique-id='productmanagementview-r75ab50652a1fcde8-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><label className="text-sm font-bold text-slate-700 mb-2 block" data-api-unique-id='productmanagementview-r2438090f5dd3b877-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>成本价(￥) <span className="text-destructive" data-api-unique-id='productmanagementview-r5f9d1a3ebc6dc033-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>*</span></label><Input type="number" step="0.01" className="h-11" value={state.formData.cost_price ?? ''} onChange={e => handlers.handleFormFieldChange('cost_price', e.target.value ? Number(e.target.value) : null)} placeholder="例如 120" data-api-unique-id='productmanagementview-reb3145499c0faddf-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' /></div>
                      <div data-api-unique-id='productmanagementview-rc56885b6b6e9514c-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><label className="text-sm font-bold text-slate-700 mb-2 block" data-api-unique-id='productmanagementview-r8a4481b8477e6492-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>商品系数 <span className="text-destructive" data-api-unique-id='productmanagementview-r6f567ba076bf9442-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>*</span></label><div className="space-y-2" data-api-unique-id='productmanagementview-rab0b957bc153ccc7-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><Input type="number" step="0.01" className="h-11" value={state.formData.price_coefficient ?? ''} onChange={e => handlers.handleFormFieldChange('price_coefficient', e.target.value ? Number(e.target.value) : null)} placeholder="例如 1.2" data-api-unique-id='productmanagementview-r13614152989a511a-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' /><div className="flex flex-wrap items-center gap-2 text-xs" data-api-unique-id='productmanagementview-r2e784800461390cc-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><Badge variant="outline" className="bg-white" data-api-unique-id='productmanagementview-r0f1c504970fd2c98-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>字段保留值 {state.formData.price_coefficient ? state.formData.price_coefficient.toFixed(2) : '--'}</Badge><Button type="button" variant="outline" size="sm" className="h-8 border-dashed" onClick={handlers.handleApplyCategoryCoefficientToForm} data-api-unique-id='productmanagementview-r800e03a37a19a184-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>按主类目系数重算保存</Button></div></div></div>
                      <div data-api-unique-id='productmanagementview-rcfb1cfa9a16469f6-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><label className="text-sm font-bold text-slate-700 mb-2 block" data-api-unique-id='productmanagementview-rf9288813b5187b89-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>批量起订量</label><Input type="number" min="1" className="h-11" value={state.formData.trade_info_json?.minOrderQty ?? 1} onChange={e => handlers.handleTradeInfoChange('minOrderQty', e.target.value ? Math.max(1, Number(e.target.value)) : 1)} placeholder="例如 10" data-api-unique-id='productmanagementview-r23b006bd504211eb-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' /></div>
                      <div className="col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4" data-api-unique-id='productmanagementview-r27eb0ce2bba07cc8-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><div className="flex items-center justify-between gap-3" data-api-unique-id='productmanagementview-r9f85051c862e80cc-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><div data-api-unique-id='productmanagementview-rcda2e520203b54a8-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><p className="text-sm font-bold text-slate-900" data-api-unique-id='productmanagementview-rec8a3d3ae8f2ec87-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>交易信息预览</p><p className="text-xs text-slate-500 mt-1" data-api-unique-id='productmanagementview-r1cb46e8bc4c0bad5-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>当前商品将按该起订量参与询盘与下单展示。</p></div><Badge variant="outline" className="bg-white text-slate-700 border-slate-200" data-api-unique-id='productmanagementview-r7ae18c5aceab7704-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>起订量 {state.formData.trade_info_json?.minOrderQty ?? 1} 件</Badge></div></div>
                      <div className="col-span-2" data-api-unique-id='productmanagementview-r26413ddd42ac8ac5-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><label className="text-sm font-bold text-slate-700 mb-2 block" data-api-unique-id='productmanagementview-r3a38b7938b1e184a-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>核心营销摘要 / 卖点</label><Textarea className="min-h-[88px] resize-none" placeholder="描述商品的核心竞争优势，将展示在商品详情页顶部..." value={state.formData.short_description || ''} onChange={e => handlers.handleFormFieldChange('short_description', e.target.value)} data-api-unique-id='productmanagementview-r255663b664dccf34-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' /></div>
                      <div className="col-span-2" data-api-unique-id='productmanagementview-r39c28326077b1bc2-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><label className="text-sm font-bold text-slate-700 mb-2 block" data-api-unique-id='productmanagementview-rc8d0eedc61800545-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>详情文本 <span className="text-destructive" data-api-unique-id='productmanagementview-r8fb6ed3ee0ed4e90-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>*</span></label><Textarea className="min-h-[140px] resize-none" placeholder="支持粘贴图文详情中的纯文本内容，将同步写入详情内容区。" value={state.formData.detail_text || ''} onChange={e => handlers.handleFormFieldChange('detail_text', e.target.value)} data-api-unique-id='productmanagementview-rb63053b6fbcbf76d-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' /></div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200" data-controller-name="商品媒体与详情录入" data-api-unique-id='productmanagementview-r5adac1f88cc23554-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                  <CardContent className="p-6" data-api-unique-id='productmanagementview-r1a3c9369c8801702-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                    <div className="flex items-center gap-2 mb-6 border-l-4 border-primary pl-3" data-api-unique-id='productmanagementview-r0ae6e57b98595e20-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><ImageIcon className="w-5 h-5 text-primary" data-api-unique-id='productmanagementview-rd2886f3ea1ce233c-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' /><h3 className="text-lg font-bold text-slate-900" data-api-unique-id='productmanagementview-r60c86e8e1afab84b-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>媒体资产库</h3></div>
                    <div className="space-y-6" data-api-unique-id='productmanagementview-r4420d2fb62a07b8e-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                      <div data-api-unique-id='productmanagementview-rb8b88391d1e021d5-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                        <label className="text-sm font-bold text-slate-700 mb-2 block" data-api-unique-id='productmanagementview-r0a8dac2891445452-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>主图录入 (mainImageUrl)</label>
                        <div className="mb-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-start gap-2" data-api-unique-id='productmanagementview-r5b7556c570a003f5-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><Upload className="w-4 h-4 mt-0.5" data-api-unique-id='productmanagementview-r404f5f9ecb70ef7f-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' /><div data-api-unique-id='productmanagementview-re74c79416a1fbe4e-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><div className="font-semibold" data-api-unique-id='productmanagementview-rdd569c12be2d6289-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>推荐优先直接上传主图</div><div className="text-xs text-emerald-600 mt-1" data-api-unique-id='productmanagementview-ra673eece2e69a971-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>仍保留链接输入能力，上传成功后会自动回填链接地址。</div></div></div>
                        <div className="flex gap-4" data-api-unique-id='productmanagementview-r03c22a753cb8fc79-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                          <div className="w-32 h-32 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 flex-shrink-0 flex items-center justify-center overflow-hidden" data-api-unique-id='productmanagementview-r918c2f3ae658d7f8-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>{state.formData.main_image_url ? <EditableImg propKey="drawer-main-img" keywords={state.formData.main_image_url} description="preview" data-api-unique-id='productmanagementview-r43eb46985a7f40c3-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' /> : <ImageIcon className="w-8 h-8 text-slate-300" data-api-unique-id='productmanagementview-r2e0ed4b6d4846921-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />}</div>
                          <div className="flex-1 space-y-3" data-api-unique-id='productmanagementview-r0e00d66960703b16-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                            <Input className="font-mono text-xs" value={state.formData.main_image_url} onChange={e => handlers.handleFormFieldChange('main_image_url', e.target.value)} placeholder="https://example.com/image.jpg" data-api-unique-id='productmanagementview-r08b9f754aff347da-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />
                            <div className="flex flex-wrap gap-2" data-api-unique-id='productmanagementview-r42dfc900f52a30a2-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><Button type="button" variant="outline" className="h-9 border-dashed border-slate-300" disabled={state.mainImageUploading} data-api-unique-id='productmanagementview-r4da5999c59074bd8-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><label className="cursor-pointer flex items-center" data-api-unique-id='productmanagementview-r3476089765f7f6d2-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><Upload className="w-4 h-4 mr-2" data-api-unique-id='productmanagementview-r61d911dfcb6a09c9-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />{state.mainImageUploading ? '上传中...' : '本地上传主图'}<input type="file" accept="image/*" className="hidden" onChange={handlers.handleUploadMainImage} data-api-unique-id='productmanagementview-r5ca8cd027f1537cd-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' /></label></Button><span className="text-xs text-slate-500 flex items-center" data-api-unique-id='productmanagementview-r75bc40e2a84a65d7-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>支持手动链接或本地图片上传，上传成功后自动回填主图地址。</span></div>
                            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-500" data-api-unique-id='productmanagementview-refcdeb56a7b2155b-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><div className="font-semibold text-slate-700 mb-1" data-api-unique-id='productmanagementview-rd41e6059c472ce2b-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>录入说明</div><p data-api-unique-id='productmanagementview-r3bad767d7d333bb7-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>主图支持粘贴链接或本地上传到项目存储；保存时仍复用现有主图与图库字段，不改变商品创建和编辑流程。</p></div>
                          </div>
                        </div>
                      </div>
                      <Separator className="bg-slate-100" data-api-unique-id='productmanagementview-r3fa0a51cd7ec898d-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />
                      <div data-api-unique-id='productmanagementview-r0e9b7f53f43c7ad8-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                        <div className="flex items-center justify-between mb-4" data-api-unique-id='productmanagementview-r55eb59cb96dbf59a-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><div data-api-unique-id='productmanagementview-r9a91edbf5aed54cc-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><label className="text-sm font-bold text-slate-700 block" data-api-unique-id='productmanagementview-r91403bda0d8ac5ae-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>详情图库 (galleryJson)</label><p className="text-xs text-slate-500 mt-1" data-api-unique-id='productmanagementview-r63f6c29f3a2552d1-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>可直接本地上传详情图，也可继续手动填写图片链接。</p></div><Button variant="outline" className="h-9 border-dashed bg-slate-50" onClick={handlers.addGalleryItem} data-api-unique-id='productmanagementview-rdebebf39318cde73-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><Upload className="w-4 h-4 mr-2" data-api-unique-id='productmanagementview-r9d5fe95b98d0dfe8-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />新增详情图</Button></div>
                        <div className="grid grid-cols-1 gap-3" data-api-unique-id='productmanagementview-re152df4cde1781a7-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>{state.formData.gallery_json?.map((img, index) => <div key={index} className="flex gap-3 items-center group" data-api-unique-id='productmanagementview-race6e2fa8f29e57c-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1'><div className="w-12 h-12 rounded border bg-slate-50 flex-shrink-0 overflow-hidden" data-api-unique-id='productmanagementview-r4ebb00f9716401a8-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1'>{img.url ? <EditableImg propKey={`gal-${index}`} keywords={img.url} data-api-unique-id='productmanagementview-r4dc844341ad84c7d-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1' /> : <div className="w-full h-full flex items-center justify-center" data-api-unique-id='productmanagementview-ra9644a8a9d983760-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1'><ImageIcon className="w-4 h-4 text-slate-300" data-api-unique-id='productmanagementview-r57d69862eccacf78-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1' /></div>}</div><Input className="h-10 font-mono text-xs flex-1" value={img.url} onChange={e => handlers.updateGalleryItem(index, e.target.value)} placeholder="详情图 URL" data-api-unique-id='productmanagementview-reac1ce3be9ecfdd5-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1' /><Button type="button" variant="outline" className="h-9 border-dashed border-slate-300" disabled={state.galleryUploadingIndex === index} data-api-unique-id='productmanagementview-rfa56f14e95aca192-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1'><label className="cursor-pointer flex items-center px-1" data-api-unique-id='productmanagementview-rf729b5f00184ed92-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1'><Upload className="w-4 h-4 mr-2" data-api-unique-id='productmanagementview-r5f51fa74e133909f-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1' />{state.galleryUploadingIndex === index ? '上传中...' : '本地上传'}<input type="file" accept="image/*" className="hidden" onChange={e => handlers.handleUploadGalleryImage(index, e)} data-api-unique-id='productmanagementview-rb49fae6ef37a1a6a-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1' /></label></Button><Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-destructive" onClick={() => handlers.removeGalleryItem(index)} data-api-unique-id='productmanagementview-r653a1d988007afd8-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1'><Trash2 className="w-4 h-4" data-api-unique-id='productmanagementview-rb89dc77e83bef31f-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1' /></Button></div>)}</div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-4" data-api-unique-id='productmanagementview-r5c5a6fbeddaf1196-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                        <div className="flex items-center justify-between mb-3" data-api-unique-id='productmanagementview-r9dd7b5141086d614-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><div data-api-unique-id='productmanagementview-r962f6c48c23f6f57-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><h4 className="text-sm font-bold text-slate-900" data-api-unique-id='productmanagementview-rf5f477a6944e79a7-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>详情内容预览 (detailContentJson)</h4><p className="text-xs text-slate-500 mt-1" data-api-unique-id='productmanagementview-rd125c0bb4f6182c6-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>详情文本与详情图会在保存时自动汇总为详情内容。</p></div></div>
                        <div className="space-y-2" data-api-unique-id='productmanagementview-ra462f91792a15ffd-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>{(((state.formData.detail_content_json || []).length > 0 ? state.formData.detail_content_json || [] : [{
                        type: 'text',
                        content: state.formData.detail_text || ''
                      }]) as Array<{
                        type: 'text' | 'image';
                        content: string;
                      }>).map((block, index) => <div key={index} className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600" data-api-unique-id='productmanagementview-r661de6dd2b8b3f7d-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1'>{block.type === 'image' ? `图片：${block.content}` : block.content || '详情文本将在此生成预览'}</div>)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200" data-api-unique-id='productmanagementview-r89e1fe9e81095cd2-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                  <CardContent className="p-6" data-api-unique-id='productmanagementview-rd2b06f304b57fde3-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                    <div className="flex items-center justify-between mb-6 border-l-4 border-primary pl-3" data-api-unique-id='productmanagementview-r9c46af0e9499ea17-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><div className="flex items-center gap-2" data-api-unique-id='productmanagementview-r7cca216526439df4-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><Layers className="w-5 h-5 text-primary" data-api-unique-id='productmanagementview-r27bb73f1f11f45c8-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' /><h3 className="text-lg font-bold text-slate-900" data-api-unique-id='productmanagementview-r788bdc11003d6c4d-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>规格矩阵配置</h3></div><TooltipProvider data-api-unique-id='productmanagementview-rf8f09ff56a53eff8-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><Tooltip data-api-unique-id='productmanagementview-r5e75a3336375cfd4-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><TooltipTrigger asChild data-api-unique-id='productmanagementview-red49914a2336e746-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><div className="flex items-center text-xs text-slate-400 cursor-help" data-api-unique-id='productmanagementview-r3104c0602d49431e-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>自动笛卡尔积算法 <Info className="w-3 h-3 ml-1" data-api-unique-id='productmanagementview-rd24b1ce0b7b2b961-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' /></div></TooltipTrigger><TooltipContent data-api-unique-id='productmanagementview-rd379bf1cea6915a7-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>根据定义的属性维度，自动生成所有可能的SKU组合</TooltipContent></Tooltip></TooltipProvider></div>
                    <div className="space-y-4" data-api-unique-id='productmanagementview-r1b3ed8504ecfa270-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>{state.specDimensions.map((dim, index) => <div key={index} className="bg-slate-50/50 p-4 rounded-lg border border-slate-100 flex items-start gap-4" data-api-unique-id='productmanagementview-r015adb1afb2cb837-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1'><div className="flex-1" data-api-unique-id='productmanagementview-r5eb1ec45d9555087-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1'><label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block" data-api-unique-id='productmanagementview-re282a35a21bde486-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1'>规格维度</label><Input className="h-10 bg-white" placeholder="属性名称" value={dim.name} onChange={e => handlers.updateSpecDimension(index, 'name', e.target.value)} data-api-unique-id='productmanagementview-rf1c2b2bc8ae80b2f-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1' /></div><div className="flex-[2]" data-api-unique-id='productmanagementview-r8a5877a09520b4bb-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1'><label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block" data-api-unique-id='productmanagementview-rf3f189f60f16ca5f-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1'>属性选项 (逗号分隔)</label><Input className="h-10 bg-white" placeholder="例如: 红色,蓝色,黑色" value={dim.values} onChange={e => handlers.updateSpecDimension(index, 'values', e.target.value)} data-api-unique-id='productmanagementview-r91cb558512c367e1-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1' /></div><Button variant="ghost" size="icon" className="h-10 w-10 mt-6 text-slate-400 hover:text-destructive" onClick={() => handlers.removeSpecDimension(index)} data-api-unique-id='productmanagementview-r409da514e5b0958e-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1'><Trash2 className="w-4 h-4" data-api-unique-id='productmanagementview-r30e3c836541a9789-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1' /></Button></div>)}<div className="flex gap-3 pt-2" data-api-unique-id='productmanagementview-rdae78144d0bf50fe-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><Button variant="outline" className="flex-1 h-11" onClick={handlers.addSpecDimension} data-api-unique-id='productmanagementview-r928782ebf6fb3c44-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><Plus className="w-4 h-4 mr-2" data-api-unique-id='productmanagementview-r1be206cc0f5ddac2-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />新增规格维度</Button><Button className="flex-1 h-11 bg-slate-800 text-white hover:bg-slate-700" onClick={handlers.generateSkus} data-api-unique-id='productmanagementview-r9aeead86c675e657-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><RotateCcw className="w-4 h-4 mr-2" data-api-unique-id='productmanagementview-r6d17b03d790bba86-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />重新生成 SKU 列表</Button></div>
                      {state.formData.skus.length > 0 && <div className="mt-8 rounded-lg border border-slate-200 overflow-hidden" data-api-unique-id='productmanagementview-ra5724e23fd16fbdd-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><Table data-api-unique-id='productmanagementview-rdd12800ce3f68359-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><TableHeader className="bg-slate-100/50" data-api-unique-id='productmanagementview-r0d077c536c481237-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><TableRow data-api-unique-id='productmanagementview-r56aa0e0f71cdb78a-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><TableHead className="text-[11px] font-bold uppercase" data-api-unique-id='productmanagementview-r05e70f8d45a8a12e-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>规格组合项</TableHead><TableHead className="text-[11px] font-bold uppercase w-[140px]" data-api-unique-id='productmanagementview-rdf4968dc2e014f1f-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>销售价格 (￥)</TableHead><TableHead className="text-[11px] font-bold uppercase w-[140px]" data-api-unique-id='productmanagementview-rb74ce27ff1507484-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>原价预估 (￥)</TableHead><TableHead className="text-[11px] font-bold uppercase w-[160px]" data-api-unique-id='productmanagementview-rbafac3974639da59-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>美元预览 ($)</TableHead><TableHead className="text-[11px] font-bold uppercase w-[150px]" data-api-unique-id='productmanagementview-rb55086e6db18167b-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>实时库存</TableHead></TableRow></TableHeader>
                      <TableBody data-api-unique-id='productmanagementview-rc2fc311fad187544-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>{state.formData.skus.map((sku, index) => <TableRow key={index} className="bg-white" data-api-unique-id='productmanagementview-rbd39f2eebb9da863-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1'><TableCell className="font-medium text-slate-700" data-api-unique-id='productmanagementview-rb60ebd29dfe63a07-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1'><div className="flex gap-1 flex-wrap" data-api-unique-id='productmanagementview-rf0832c190501bfb4-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1'>{sku.attribute_json?.length ? sku.attribute_json?.map((a, index1) => <Badge key={index1} variant="secondary" className="rounded-sm font-normal text-[10px]" data-api-unique-id='productmanagementview-r03a3976e86e0b362-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1' data-api-bind-info={`sku.attribute_json-${index1}-value`} data-api-map-var-name='a'>{a.value}</Badge>) : <span className="text-xs text-slate-400" data-api-unique-id='productmanagementview-r3fc185cdb17d4498-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1'>默认 SKU</span>}</div></TableCell><TableCell data-api-unique-id='productmanagementview-re50cbecb4719c844-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1'><Input type="number" className="h-9 font-header" value={sku.price} onChange={e => handlers.updateSkuRow(index, 'price', Number(e.target.value))} data-api-unique-id='productmanagementview-r405d2c421423c2f1-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1' /></TableCell><TableCell data-api-unique-id='productmanagementview-rac75d9b5288b1ec4-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1'><Input type="number" className="h-9 font-header" value={sku.original_price ?? ''} onChange={e => handlers.updateSkuRow(index, 'original_price', e.target.value ? Number(e.target.value) : null)} data-api-unique-id='productmanagementview-rc27fcc883e72cf57-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1' /></TableCell><TableCell data-api-unique-id='productmanagementview-rebd8dac42bd94be0-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1'><div className="text-xs text-slate-700 font-medium flex flex-col" data-api-unique-id='productmanagementview-rd8b9b5a24e4c8c9d-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1'><span data-api-unique-id='productmanagementview-r7fe84e8e05534748-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1'>${(sku as any).usd_display_price?.toFixed(2) || '--'}</span><span className="text-slate-400" data-api-unique-id='productmanagementview-rb4e011339eba2cd8-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1'>原价 ${(sku as any).usd_display_original_price?.toFixed(2) || '--'}</span></div></TableCell><TableCell data-api-unique-id='productmanagementview-r482f5266fcc0fa64-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1'><Input type="number" className="h-9 font-header" value={sku.stock} onChange={e => handlers.updateSkuRow(index, 'stock', Number(e.target.value))} data-api-unique-id='productmanagementview-r915e65e080277209-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1' /></TableCell></TableRow>)}</TableBody>
                    </Table></div>}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 border-dashed" data-controller-name="商品高级设置">
                  <CardContent className="p-0">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left"
                      onClick={() => setAdvancedSettingsOpen((open) => !open)}
                    >
                      <div className="flex items-center gap-2 border-l-4 border-slate-300 pl-3">
                        <Settings2 className="w-5 h-5 text-slate-500" />
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">高级设置</h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            关联关键词用于前台推荐词筛选命中；日常上架可不填。
                            {state.formData.linked_keyword_ids?.length
                              ? ` 已选 ${state.formData.linked_keyword_ids.length} 个`
                              : ''}
                          </p>
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 shrink-0 text-slate-400 transition-transform ${advancedSettingsOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {advancedSettingsOpen ? (
                      <div className="border-t border-slate-100 px-6 py-5">
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                              <label className="block text-sm font-bold text-slate-700">关联关键词（多选）</label>
                              <p className="mt-1 text-xs text-slate-500">
                                绑定后，前台分类页的推荐关键词点击会按此关系筛选商品；也支持运营批量绑定。
                              </p>
                            </div>
                            <Badge variant="outline" className="bg-slate-50">
                              已选 {state.formData.linked_keyword_ids?.length || 0}
                            </Badge>
                          </div>
                          <div className="max-h-44 space-y-2 overflow-auto rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                            {state.bindingKeywordOptions.map((option) => (
                              <label
                                key={option.value}
                                className="flex cursor-pointer items-center gap-3 rounded-md border border-slate-100 bg-white px-3 py-2 text-sm text-slate-700 hover:border-primary/30"
                              >
                                <Checkbox
                                  checked={state.formData.linked_keyword_ids?.includes(option.value)}
                                  onCheckedChange={(checked) =>
                                    handlers.toggleFormLinkedKeyword(option.value, !!checked)
                                  }
                                />
                                <span className="flex-1">{option.label}</span>
                              </label>
                            ))}
                            {state.bindingKeywordOptions.length === 0 ? (
                              <span className="block py-4 text-center text-xs text-slate-400">
                                暂无可选关键词，请先在分类管理中维护关键词库
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {state.formData.linked_keyword_ids?.length ? (
                              state.formData.linked_keyword_ids.map((keywordId) => (
                                <Badge
                                  key={keywordId}
                                  variant="secondary"
                                  className="border border-amber-100 bg-amber-50 text-amber-700"
                                >
                                  {state.bindingKeywordOptions.find((option) => option.value === keywordId)
                                    ?.label || keywordId}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400">未选择关联关键词</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </div>}
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-white border-t p-6 shadow-2xl flex items-center justify-between z-20" data-api-unique-id='productmanagementview-refc31ec353d9f53c-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
            <div className="flex items-center gap-2 text-slate-400 text-xs" data-api-unique-id='productmanagementview-r955d33089e43e1f7-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><AlertCircle className="w-4 h-4" data-api-unique-id='productmanagementview-rec88a98e76b989a4-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />保存时将按成本价与当前生效系数重算 SKU 人民币售价，并同步生成美元预览。</div>
            <div className="flex gap-3" data-api-unique-id='productmanagementview-rfa5ca956ac18a718-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><Button variant="outline" className="h-11 px-8 border-slate-200" disabled={state.saving} onClick={() => handlers.handleSubmitForm('DRAFT')} data-api-unique-id='productmanagementview-r831bdbf80574160d-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>保存为待上传</Button><Button className="h-11 px-10 bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all" disabled={state.saving} onClick={() => handlers.handleSubmitForm('ACTIVE')} data-api-unique-id='productmanagementview-r29295c9ab7f7f25e-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>{state.saving ? <span className="flex items-center" data-api-unique-id='productmanagementview-r2f3a54ee42649e95-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" data-api-unique-id='productmanagementview-r6165fcf84da32469-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'></div>同步中...</span> : state.drawerMode === 'create' ? '立即同步并上架' : '更新同步信息'}</Button></div>
          </div>
        </SheetContent>
      </Sheet>

      <ImportFrom1688CollectModal
        open={state.pendingImportDialogOpen}
        onOpenChange={handlers.setPendingImportDialogOpen}
        onTaskCreated={() => {
          handlers.setActiveTab('pending_imports')
          void handlers.refreshPendingImportQueue()
        }}
      />

      <ImportFromPinduoduoCollectModal
        open={state.pinduoduoImportDialogOpen}
        onOpenChange={handlers.setPinduoduoImportDialogOpen}
        onTaskCreated={() => {
          handlers.setActiveTab('pending_imports')
          void handlers.refreshPendingImportQueue()
        }}
      />

      <Sync1688StatusResultPanel
        open={state.sync1688PanelOpen}
        syncing={state.sync1688Syncing}
        applying={state.sync1688Applying}
        delisted={state.sync1688Delisted}
        outOfStock={state.sync1688OutOfStock}
        normal={state.sync1688Normal}
        unknownCount={state.sync1688UnknownCount}
        skippedCount={state.sync1688SkippedCount}
        selectedIds={state.sync1688SelectedIds}
        noteDialogOpen={state.sync1688NoteDialogOpen}
        noteDraft={state.sync1688NoteDraft}
        onOpenChange={handlers.setSync1688PanelOpen}
        onToggleItem={handlers.toggleSync1688Item}
        onToggleSection={handlers.toggleSync1688Section}
        onBatchDeactivate={() => void handlers.handleSync1688BatchDeactivate()}
        onOpenNoteDialog={handlers.openSync1688NoteDialog}
        onNoteDialogOpenChange={handlers.setSync1688NoteDialogOpen}
        onNoteDraftChange={handlers.setSync1688NoteDraft}
        onSubmitNotes={() => void handlers.submitSync1688Notes()}
        onDefer={handlers.deferSync1688Panel}
      />

      <CalibrateResultDialog
        open={state.calibrateResultOpen}
        saving={state.calibrateResultSaving}
        scope={state.calibrateResultScope}
        summary={state.calibrateResultSummary}
        drafts={state.calibrateResultDrafts}
        categoryOptions={
          (state.bindingCategoryOptions || []).length
            ? state.bindingCategoryOptions
            : (state.hierarchicalCategoryOptions || []).map(c => ({
                value: c.category_id,
                label: c.category_name,
              }))
        }
        onOpenChange={handlers.setCalibrateResultOpen}
        onToggleCategory={handlers.toggleCalibrateResultCategory}
        onSetPrimary={handlers.setCalibrateResultPrimary}
        onSave={() => void handlers.saveCalibrateResultEdits()}
      />

      <Dialog open={state.confirmDialogOpen} onOpenChange={handlers.setConfirmDialogOpen} data-api-unique-id='productmanagementview-r60d70f17ed8ac551-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
        <DialogContent className={`${state.confirmAction === 'BIND_CATEGORIES' || state.confirmAction === 'UNBIND_CATEGORIES' ? 'max-w-[640px]' : 'max-w-[460px]'} p-0 overflow-hidden border-none shadow-2xl`} data-api-unique-id='productmanagementview-r19e61fe741b21f6d-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
          <div className={`h-2 w-full ${state.confirmAction === 'DELETE' || state.confirmAction === 'RETURN_TO_PENDING' ? 'bg-destructive' : 'bg-primary'}`} data-api-unique-id='productmanagementview-r9b04bb643e195dde-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />
          <div className="p-8" data-api-unique-id='productmanagementview-rf2a27d1c9746c2d5-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
            <DialogHeader className="mb-6" data-api-unique-id='productmanagementview-r8a823be2371673b4-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${state.confirmAction === 'DELETE' || state.confirmAction === 'PENDING_DELETE' || state.confirmAction === 'RETURN_TO_PENDING' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`} data-api-unique-id='productmanagementview-r35ba4648141b8880-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>{state.confirmAction === 'DELETE' || state.confirmAction === 'PENDING_DELETE' ? <Trash2 className="w-6 h-6" data-api-unique-id='productmanagementview-rc48347fe547fa850-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' /> : state.confirmAction === 'RETURN_TO_PENDING' ? <RotateCcw className="w-6 h-6" data-api-unique-id='productmanagementview-rreturnpendingdialogicon-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' /> : state.confirmAction === 'PRICE_COEFFICIENT' ? <Percent className="w-6 h-6" data-api-unique-id='productmanagementview-r9f58efbd042640b1-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' /> : state.confirmAction === 'MIN_ORDER_QTY' ? <Coins className="w-6 h-6" data-api-unique-id='productmanagementview-rminorderdialogicon-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' /> : state.confirmAction === 'BIND_CATEGORIES' ? <Link2 className="w-6 h-6" data-api-unique-id='productmanagementview-r6f22d848de7a1406-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' /> : state.confirmAction === 'UNBIND_CATEGORIES' ? <Unlink className="w-6 h-6" data-api-unique-id='productmanagementview-runbinddialogicon-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' /> : state.confirmAction === 'BIND_KEYWORDS' ? <Tags className="w-6 h-6" data-api-unique-id='productmanagementview-rf721eccfaf4cc9bb-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' /> : <AlertCircle className="w-6 h-6" data-api-unique-id='productmanagementview-r986715dcf361c621-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />}</div><DialogTitle className="text-xl font-header font-bold text-slate-900" data-api-unique-id='productmanagementview-rf32841c4aba88ede-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>{state.confirmAction === 'ACTIVE' && '确认上架操作'}{state.confirmAction === 'INACTIVE' && '确认下架操作'}{state.confirmAction === 'DELETE' && '确认永久删除'}{state.confirmAction === 'RETURN_TO_PENDING' && '确认退回待上传'}{state.confirmAction === 'PENDING_DELETE' && '确认删除待上传条目'}{state.confirmAction === 'PRICE_COEFFICIENT' && '批量设置价格策略'}{state.confirmAction === 'MIN_ORDER_QTY' && '批量设置起订量'}{state.confirmAction === 'BIND_CATEGORIES' && '批量绑定类目'}{state.confirmAction === 'UNBIND_CATEGORIES' && '批量移除类目'}{state.confirmAction === 'BIND_KEYWORDS' && '批量绑定关键词'}</DialogTitle><DialogDescription className="text-slate-500 pt-2 leading-relaxed" data-api-unique-id='productmanagementview-r8bd9780270f77d61-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>{state.confirmAction === 'ACTIVE' && '此操作将使商品在前端门户立即可见并支持下单，请确保价格信息准确无误。'}{state.confirmAction === 'INACTIVE' && '下架后，用户将无法在搜索结果中找到此商品，且无法将其加入购物车。'}{state.confirmAction === 'DELETE' && '警告：此操作不可逆，将从数据库中永久移除该商品及其关联的所有SKU镜像信息。'}{state.confirmAction === 'RETURN_TO_PENDING' && '商品将从商品列表移除，并进入待上传区（状态为「待上传」）。图片、标题、价格、库存与规格会保留，可双击编辑后再次一键发布并上架。'}{state.confirmAction === 'PENDING_DELETE' && '此操作会从待上传队列中移除所选条目，删除后不会再出现在待上传区。'}{state.confirmAction === 'PRICE_COEFFICIENT' && '支持统一写入商品系数，或直接按主类目系数重算所选商品的 SKU 售价与原价。'}{state.confirmAction === 'MIN_ORDER_QTY' && `父级商品将写入混批起订量，已勾选的 ${selectedSkuIds.length > 0 ? 'SKU 会写入独立起订量' : 'SKU 将继续继承父级或默认值 1'}。`}{state.confirmAction === 'BIND_CATEGORIES' && '将为所选商品【追加】关联类目，保留原有主分类与已有关联，不覆盖。'}{state.confirmAction === 'UNBIND_CATEGORIES' && '将从所选商品的关联类目标签中移除指定类目；主分类（categoryId）受保护，不会被移除。'}{state.confirmAction === 'BIND_KEYWORDS' && '将为所选商品追加关联关键词，便于检索命中与运营管理。'}</DialogDescription></DialogHeader>
            <Alert variant={state.confirmAction === 'DELETE' || state.confirmAction === 'PENDING_DELETE' || state.confirmAction === 'RETURN_TO_PENDING' ? 'destructive' : 'default'} className="mb-6 bg-slate-50 border-slate-100" data-api-unique-id='productmanagementview-r15c06eb3166b0d87-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><Info className="h-4 w-4" data-api-unique-id='productmanagementview-r8bac6866f1153a63-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' /><AlertTitle className="text-xs font-bold uppercase tracking-wider mb-1" data-api-unique-id='productmanagementview-r1917fab53666d83f-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>系统提示</AlertTitle><AlertDescription className="text-xs" data-api-unique-id='productmanagementview-ra42b0acf009a79ed-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>涉及条目 ID: {state.confirmTargetIds.length > 0 ? `${state.confirmTargetIds.slice(0, 3).join(', ')}${state.confirmTargetIds.length > 3 ? '...' : ''}` : '--'}</AlertDescription></Alert>
            {state.confirmAction === 'PRICE_COEFFICIENT' && <div className="mb-6 space-y-4" data-api-unique-id='productmanagementview-r44d5bb77e24370af-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><div data-api-unique-id='productmanagementview-r044509275b133efc-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><label className="text-sm font-bold text-slate-700 mb-2 block" data-api-unique-id='productmanagementview-r5b0acc37f8a241b3-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>调价方式</label><Select value={state.batchPriceAdjustMode} onValueChange={value => handlers.setBatchPriceAdjustMode(value as any)} data-api-unique-id='productmanagementview-r7eb8286dba08abbd-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><SelectTrigger className="h-11" data-api-unique-id='productmanagementview-r977138a88c49d7d8-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><SelectValue placeholder="请选择调价方式" data-api-unique-id='productmanagementview-rffb54f53c022872a-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' /></SelectTrigger><SelectContent data-api-unique-id='productmanagementview-r6917c986f6db4612-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><SelectItem value="PRODUCT_COEFFICIENT" data-api-unique-id='productmanagementview-r49512127dfaa948e-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>统一设置商品系数</SelectItem><SelectItem value="CATEGORY_COEFFICIENT" data-api-unique-id='productmanagementview-r9d9084a7e4138730-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>按主类目系数重算售价</SelectItem></SelectContent></Select></div>{state.batchPriceAdjustMode === 'PRODUCT_COEFFICIENT' ? <div data-api-unique-id='productmanagementview-r278aa664fa5c87eb-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><label className="text-sm font-bold text-slate-700 mb-2 block" data-api-unique-id='productmanagementview-r3635f64ff0244c3e-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>统一价格系数</label><Input type="number" step="0.01" className="h-11" value={state.batchPriceCoefficientValue} onChange={e => handlers.setBatchPriceCoefficientValue(e.target.value)} placeholder="例如 1.15" data-api-unique-id='productmanagementview-r41f48af866cb8fcc-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' /></div> : <div className="rounded-lg border border-dashed border-primary/20 bg-primary/5 p-4 text-sm text-slate-600" data-api-unique-id='productmanagementview-r4dd9fd868f18c9a3-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><div className="flex items-center gap-2 font-semibold text-slate-900" data-api-unique-id='productmanagementview-r1bea962a34e2bcb3-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><FolderTree className="w-4 h-4 text-primary" data-api-unique-id='productmanagementview-r476760d38b36eebd-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' />按主类目系数应用</div><p className="text-xs text-slate-500 mt-2" data-api-unique-id='productmanagementview-rdb634e456e79d697-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>确认后，将以每个商品所属主类目的系数作为默认值，重算所选商品的 SKU 人民币售价与原价，并同步美元预览。</p></div>}</div>}
            {state.confirmAction === 'CATEGORY' && <div className="mb-6" data-api-unique-id='productmanagementview-r726fd3f67813bb4d-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><label className="text-sm font-bold text-slate-700 mb-2 block" data-api-unique-id='productmanagementview-rb78ea2c9b736b7ae-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>目标分类</label><Select value={state.batchCategoryId} onValueChange={handlers.setBatchCategoryId} data-api-unique-id='productmanagementview-rce5da28cf16786ae-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><SelectTrigger className="h-11" data-api-unique-id='productmanagementview-r5bc5c11304a48b5d-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><SelectValue placeholder="请选择目标分类" data-api-unique-id='productmanagementview-r6251a8220d45c2f8-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' /></SelectTrigger><SelectContent data-api-unique-id='productmanagementview-r46a5552b4d4ccf68-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>{state.categoryOptions.map((c, index) => <SelectItem key={c.category_id} value={c.category_id} data-api-unique-id='productmanagementview-rd530d892b6aeee0f-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1'>{c.category_name}</SelectItem>)}</SelectContent></Select></div>}
            {state.confirmAction === 'BIND_CATEGORIES' && <div className="mb-6 space-y-3" data-api-unique-id='productmanagementview-r89aa882e5dc0e0d2-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
              <div className="flex items-center justify-between" data-api-unique-id='productmanagementview-rc487ba673fae80b9-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                <label className="text-sm font-bold text-slate-700" data-api-unique-id='productmanagementview-r38865527373ffd64-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>选择关联类目（追加绑定）</label>
                <Badge variant="outline" data-api-unique-id='productmanagementview-r88e4910589de29e8-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>已选 {state.batchBindCategoryIds.length}</Badge>
              </div>
              <p className="text-xs text-slate-500">一级类目为父级，二级类目缩进展示。勾选后下方预览该类目下现有商品。</p>
              <div className="max-h-56 overflow-auto rounded-lg border border-slate-200 p-3 space-y-1 bg-slate-50/70" data-api-unique-id='productmanagementview-rc11537ec2589a295-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                {state.bindingCategoryOptions.map((option, index) => <label key={option.value} className={`flex items-center gap-3 rounded-md bg-white px-3 py-2 text-sm border cursor-pointer ${state.batchCategoryPreviewId === option.value ? 'border-primary/50 bg-primary/5' : 'border-slate-100 hover:border-primary/30'}`} data-api-unique-id='productmanagementview-rcfe06069a1e7f0da-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1'>
                  <Checkbox checked={state.batchBindCategoryIds.includes(option.value)} onCheckedChange={checked => handlers.toggleBatchBindCategory(option.value, !!checked)} data-api-unique-id='productmanagementview-ra8f6e61301f5ad7f-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1' />
                  <span className="flex-1 text-slate-700 whitespace-pre font-mono text-[13px]" data-api-unique-id='productmanagementview-r2c2c989a8b9ab6aa-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1'>{option.label}</span>
                  <button type="button" className="text-[11px] text-primary hover:underline" onClick={e => { e.preventDefault(); handlers.setBatchCategoryPreviewId(option.value) }}>预览</button>
                </label>)}
              </div>
              <div className="flex flex-wrap gap-2" data-api-unique-id='productmanagementview-rbc5c38e99fdd52fc-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
                {state.batchBindCategoryIds.length ? state.batchBindCategoryIds.map((categoryId, index) => <Badge key={categoryId} variant="secondary" className="bg-primary/10 text-primary" data-api-unique-id='productmanagementview-r57c62827d38383a7-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1'>{state.bindingCategoryOptions.find(option => option.value === categoryId)?.label?.replace(/^[　└\s]+/, '') || categoryId}</Badge>) : <span className="text-xs text-slate-400" data-api-unique-id='productmanagementview-r8a17175890c6f2d5-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>未选择关联类目</span>}
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-slate-800">类目下商品预览</p>
                  <Badge variant="outline">{state.batchCategoryPreviewLoading ? '加载中…' : `共 ${state.batchCategoryPreviewTotal} 件`}</Badge>
                </div>
                {!state.batchCategoryPreviewId ? <p className="text-xs text-slate-400">勾选或点击「预览」查看该类目下已有商品。</p> : state.batchCategoryPreviewLoading ? <p className="text-xs text-slate-400">正在加载…</p> : state.batchCategoryPreviewProducts.length === 0 ? <p className="text-xs text-slate-400">该类目下暂无商品。</p> : <div className="max-h-40 overflow-auto space-y-1.5">
                  {state.batchCategoryPreviewProducts.map(product => <div key={product.product_id} className="flex items-start justify-between gap-2 rounded-md border border-slate-100 bg-slate-50/80 px-2.5 py-1.5 text-xs">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-800">{product.product_name}</p>
                      <p className="text-slate-400 font-mono">{product.sku_code_base || product.product_id}</p>
                    </div>
                    {product.is_primary ? <Badge variant="outline" className="shrink-0 text-[10px]">主分类</Badge> : <Badge variant="secondary" className="shrink-0 text-[10px]">关联</Badge>}
                  </div>)}
                </div>}
              </div>
            </div>}
            {state.confirmAction === 'UNBIND_CATEGORIES' && <div className="mb-6 space-y-3" data-api-unique-id='productmanagementview-runbindcatsdialog-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-700">选择要移除的关联类目</label>
                <Badge variant="outline">已选 {state.batchUnbindCategoryIds.length}</Badge>
              </div>
              <p className="text-xs text-slate-500">仅移除关联标签；若类目是某商品的主分类，该商品会自动跳过且不可单独勾选移除主分类。</p>
              <div className="max-h-56 overflow-auto rounded-lg border border-slate-200 p-3 space-y-1 bg-slate-50/70">
                {state.bindingCategoryOptions.map(option => {
                  const selectedProducts = state.list.filter(item => state.confirmTargetIds.includes(item.product_id))
                  const isPrimaryForAll = selectedProducts.length > 0 && selectedProducts.every(item => item.category_id === option.value)
                  const isPrimaryForSome = selectedProducts.some(item => item.category_id === option.value)
                  return <label key={option.value} className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm border ${isPrimaryForAll ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed' : state.batchCategoryPreviewId === option.value ? 'bg-primary/5 border-primary/50 cursor-pointer' : 'bg-white border-slate-100 hover:border-rose-300 cursor-pointer'}`}>
                    <Checkbox
                      checked={state.batchUnbindCategoryIds.includes(option.value)}
                      disabled={isPrimaryForAll}
                      onCheckedChange={checked => {
                        if (isPrimaryForAll) return
                        handlers.toggleBatchUnbindCategory(option.value, !!checked)
                      }}
                    />
                    <span className="flex-1 text-slate-700 whitespace-pre font-mono text-[13px]">{option.label}</span>
                    {isPrimaryForAll ? <Badge variant="outline" className="text-[10px] text-rose-600 border-rose-200">主分类·不可移除</Badge> : isPrimaryForSome ? <Badge variant="outline" className="text-[10px]">部分主分类·将跳过</Badge> : null}
                    <button type="button" className="text-[11px] text-primary hover:underline" onClick={e => { e.preventDefault(); handlers.setBatchCategoryPreviewId(option.value) }}>预览</button>
                  </label>
                })}
              </div>
              <div className="flex flex-wrap gap-2">
                {state.batchUnbindCategoryIds.length ? state.batchUnbindCategoryIds.map(categoryId => <Badge key={categoryId} variant="secondary" className="bg-rose-50 text-rose-700 border border-rose-100">{state.bindingCategoryOptions.find(option => option.value === categoryId)?.label?.replace(/^[　└\s]+/, '') || categoryId}</Badge>) : <span className="text-xs text-slate-400">未选择要移除的类目</span>}
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-slate-800">类目下商品预览</p>
                  <Badge variant="outline">{state.batchCategoryPreviewLoading ? '加载中…' : `共 ${state.batchCategoryPreviewTotal} 件`}</Badge>
                </div>
                {!state.batchCategoryPreviewId ? <p className="text-xs text-slate-400">勾选或点击「预览」查看该类目下已有商品。</p> : state.batchCategoryPreviewLoading ? <p className="text-xs text-slate-400">正在加载…</p> : state.batchCategoryPreviewProducts.length === 0 ? <p className="text-xs text-slate-400">该类目下暂无商品。</p> : <div className="max-h-40 overflow-auto space-y-1.5">
                  {state.batchCategoryPreviewProducts.map(product => <div key={product.product_id} className="flex items-start justify-between gap-2 rounded-md border border-slate-100 bg-slate-50/80 px-2.5 py-1.5 text-xs">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-800">{product.product_name}</p>
                      <p className="text-slate-400 font-mono">{product.sku_code_base || product.product_id}</p>
                    </div>
                    {product.is_primary ? <Badge variant="outline" className="shrink-0 text-[10px]">主分类</Badge> : <Badge variant="secondary" className="shrink-0 text-[10px]">关联</Badge>}
                  </div>)}
                </div>}
              </div>
            </div>}
            {state.confirmAction === 'BIND_KEYWORDS' && <div className="mb-6 space-y-3" data-api-unique-id='productmanagementview-r44283b0365c92d8d-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><div className="flex items-center justify-between" data-api-unique-id='productmanagementview-r714ed7f70e6bddbe-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><label className="text-sm font-bold text-slate-700" data-api-unique-id='productmanagementview-r74ae50235953925d-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>选择关联关键词</label><Badge variant="outline" data-api-unique-id='productmanagementview-r6afc3826776fbe98-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>已选 {state.batchBindKeywordIds.length}</Badge></div><div className="max-h-56 overflow-auto rounded-lg border border-slate-200 p-3 space-y-2 bg-slate-50/70" data-api-unique-id='productmanagementview-r5e7bcdea67c79830-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>{state.bindingKeywordOptions.map((option, index) => <label key={option.value} className="flex items-center gap-3 rounded-md bg-white px-3 py-2 text-sm border border-slate-100 hover:border-primary/30 cursor-pointer" data-api-unique-id='productmanagementview-rc2a7cce4e5ca21c9-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1'><Checkbox checked={state.batchBindKeywordIds.includes(option.value)} onCheckedChange={checked => handlers.toggleBatchBindKeyword(option.value, !!checked)} data-api-unique-id='productmanagementview-r9d0f6fa341db9e23-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1' /><span className="flex-1 text-slate-700" data-api-unique-id='productmanagementview-ra46eda2e2d8f9c85-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1'>{option.label}</span></label>)}</div><div className="flex flex-wrap gap-2" data-api-unique-id='productmanagementview-r490f803f801d6282-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>{state.batchBindKeywordIds.length ? state.batchBindKeywordIds.map((keyword, index) => <Badge key={keyword} variant="secondary" className="bg-amber-50 text-amber-700 border border-amber-100" data-api-unique-id='productmanagementview-rbd519d2beaf4e22e-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' data-api-in-loop='1'>{keyword}</Badge>) : <span className="text-xs text-slate-400" data-api-unique-id='productmanagementview-rc2218e0bb2b960e4-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>未选择关联关键词</span>}</div></div>}
            {state.confirmAction === 'MANAGEMENT_STATUS' && <div className="mb-6" data-api-unique-id='productmanagementview-r5a6370246df9675f-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><label className="text-sm font-bold text-slate-700 mb-2 block" data-api-unique-id='productmanagementview-rccce441f1b609817-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>目标状态</label><Select value={state.batchManagementStatus} onValueChange={value => handlers.setBatchManagementStatus(value as any)} data-api-unique-id='productmanagementview-rabe6a20cf0330a8b-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><SelectTrigger className="h-11" data-api-unique-id='productmanagementview-r5f8068f8a1509c65-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><SelectValue placeholder="请选择目标状态" data-api-unique-id='productmanagementview-rdb651408fc23addd-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' /></SelectTrigger><SelectContent data-api-unique-id='productmanagementview-re98e080019e1de66-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><SelectItem value="ACTIVE" data-api-unique-id='productmanagementview-rffa3cf7c360b480b-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>已上架</SelectItem><SelectItem value="INACTIVE" data-api-unique-id='productmanagementview-r70ae680d931d757b-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>已下架</SelectItem><SelectItem value="DRAFT" data-api-unique-id='productmanagementview-r79484a5c99bf273f-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>待上传</SelectItem><SelectItem value="DELETED" data-api-unique-id='productmanagementview-r79484a5c99bf273f-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>已删除</SelectItem></SelectContent></Select></div>}
            {state.confirmAction === 'WEIGHT_PRICE' && <div className="mb-6 space-y-4" data-api-unique-id='productmanagementview-rbea24865ed92e2de-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><div data-api-unique-id='productmanagementview-r23295f2ec54c27f4-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><label className="text-sm font-bold text-slate-700 mb-2 block" data-api-unique-id='productmanagementview-r84108fdd4737a2de-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>修改字段</label><Select value={state.batchWeightPriceMode} onValueChange={value => handlers.setBatchWeightPriceMode(value as any)} data-api-unique-id='productmanagementview-ree632f576c0faf3b-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><SelectTrigger className="h-11" data-api-unique-id='productmanagementview-r5ee4f4faeb16c517-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><SelectValue placeholder="请选择修改字段" data-api-unique-id='productmanagementview-r8ff94ff81c59a086-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' /></SelectTrigger><SelectContent data-api-unique-id='productmanagementview-rbb745d1067fdb5d1-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><SelectItem value="price_coefficient" data-api-unique-id='productmanagementview-r53750ce5dccd14d2-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>价格系数</SelectItem><SelectItem value="weight_gram" data-api-unique-id='productmanagementview-r24ec33f795c0a92c-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>重量(g)</SelectItem></SelectContent></Select></div><div data-api-unique-id='productmanagementview-r0a56121770fb21a4-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><label className="text-sm font-bold text-slate-700 mb-2 block" data-api-unique-id='productmanagementview-r599e783402ecf7b5-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>统一值</label><Input type="number" step="0.01" className="h-11" value={state.batchWeightPriceValue} onChange={e => handlers.setBatchWeightPriceValue(e.target.value)} placeholder={state.batchWeightPriceMode === 'weight_gram' ? '例如 500' : '例如 1.20'} data-api-unique-id='productmanagementview-r11e64d05c7682054-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView' /></div></div>}
            {state.confirmAction === 'MIN_ORDER_QTY' && <div className="mb-6 space-y-3" data-api-unique-id='productmanagementview-rminorderdialog-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><div><label className="text-sm font-bold text-slate-700 mb-2 block">统一起订量</label><Input type="number" min="1" className="h-11" value={state.batchMinOrderQty} onChange={e => handlers.setBatchMinOrderQty(e.target.value)} placeholder="例如 10" /></div><p className="text-xs text-slate-500">父级商品按混批规则生效；被勾选的 SKU 将写入自己的独立起订量，未单独设置的 SKU 默认继承父级，若父级也未设则按 1 处理。</p></div>}
            <DialogFooter className="flex-col sm:flex-row gap-2 mt-4" data-api-unique-id='productmanagementview-r41ed3ee967d25b02-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'><Button variant="ghost" className="flex-1 h-11 font-medium hover:bg-slate-100" onClick={() => handlers.setConfirmDialogOpen(false)} data-api-unique-id='productmanagementview-r10e9ce469c49786b-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>取消</Button><Button variant={state.confirmAction === 'DELETE' ? 'destructive' : 'default'} className={`flex-1 h-11 font-bold ${state.confirmAction !== 'DELETE' ? 'bg-primary text-primary-foreground' : ''}`} onClick={handlers.handleConfirmAction} disabled={state.confirmLoading} data-api-unique-id='productmanagementview-r446861635eaca88d-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'>{state.confirmLoading ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" data-api-unique-id='productmanagementview-r8b97f133f4394afa-s2030557363' data-api-unique-page-name='src/backend/components/ProductManagementView'></div> : '确认执行'}</Button></DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};
export default ProductManagementView;