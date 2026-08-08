'use client';

import React from 'react';
import type { ImportFrom1688State, ImportFrom1688Handlers } from '@/backend/hooks/useImportFrom1688';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CategoryCascadeSelect } from '@/backend/components/CategoryCascadeSelect';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { RefreshCw, PlusCircle, LayoutGrid, ExternalLink, AlertCircle, Save, Trash2, ChevronLeft, ChevronRight, Info, Link2, TableProperties, PencilLine, ClipboardPaste, Upload, ImagePlus, FileSpreadsheet, WandSparkles } from 'lucide-react';
import type { ImportTaskStatusType } from '@/backend/actions/ImportFrom1688';
import { ProductManagement } from '@/backend/route-params';
import EditableImg from '@/@base/EditableImg';
import { PreviewableThumb } from '@/backend/components/ImageLightbox';
import Link from 'next/link';
import { TableImportPreviewTable } from '@/backend/components/TableImportPreviewTable';
import { ImportFrom1688LinkImportPanel } from '@/backend/components/ImportFrom1688LinkImportPanel';
const TASK_STATUS_LABELS: Record<ImportTaskStatusType, string> = {
  PENDING: '待处理',
  RUNNING: '解析中',
  COMPLETED: '已完成',
  PARTIAL_SUCCESS: '部分成功',
  RATE_LIMITED: '触发限流',
  RETRY_PENDING: '待重试',
  FAILED: '失败'
};
const STATUS_COLOR_MAP: Record<ImportTaskStatusType, string> = {
  PENDING: 'bg-muted text-muted-foreground',
  RUNNING: 'bg-primary text-primary-foreground',
  COMPLETED: 'bg-accent text-accent-foreground',
  PARTIAL_SUCCESS: 'bg-warning/20 text-warning-foreground',
  RATE_LIMITED: 'bg-warning/20 text-warning-foreground',
  RETRY_PENDING: 'bg-secondary text-secondary-foreground',
  FAILED: 'bg-destructive text-destructive-foreground'
};
interface Props {
  state: ImportFrom1688State;
  handlers: ImportFrom1688Handlers;
}
const creationModeCards = [{
  key: '1688',
  title: '1688导入',
  description: '通过链接创建解析任务，保留原有修正与确认导入流程。',
  icon: Link2
}, {
  key: 'table',
  title: '表格导入',
  description: '支持粘贴表格，也支持本地 Excel / CSV 文件生成导入待上传。',
  icon: TableProperties
}, {
  key: 'manual',
  title: '手动新增',
  description: '逐个填写商品基础信息并直接创建商品。',
  icon: PencilLine
}] as const;
const getPendingStatusMeta = (item: ImportFrom1688State['currentItems'][number]) => {
  if (item.item_isPublished || item.item_importedProductId) {
    return {
      label: '已导入/已发布',
      badgeClass: 'bg-accent text-accent-foreground border-none',
      description: item.item_failureReason || '该商品已经成功进入商品库，可到商品管理页继续查看。'
    };
  }
  if (item.item_publishStatus === 'FAILED') {
    return {
      label: '发布失败待修正',
      badgeClass: 'bg-destructive text-destructive-foreground border-none',
      description: item.item_failureReason || '发布阶段失败，请在右侧补齐缺失字段后重新发布。'
    };
  }
  if (item.item_fetchStatus === 'COMPLETED') {
    const draftLabel = item.item_goodsStatus === 'ACTIVE' ? '上架待发布' : item.item_goodsStatus === 'INACTIVE' ? '下架待发布' : '待上传';
    return {
      label: draftLabel,
      badgeClass: 'border-accent text-accent',
      description: item.item_targetCategoryId ? '已解析完成，可继续检查字段后发布。' : '已解析完成，但仍缺少目标分类，请先在右侧补齐后发布。'
    };
  }
  if (item.item_fetchStatus === 'FAILED') {
    return {
      label: '解析失败',
      badgeClass: 'bg-destructive text-destructive-foreground border-none',
      description: item.item_failureReason || '该链接解析失败，可重试任务重新抓取。'
    };
  }
  return {
    label: '解析中',
    badgeClass: 'bg-primary text-primary-foreground border-none',
    description: '系统仍在拉取该商品数据，请稍后刷新查看。'
  };
};
export const ImportFrom1688View = ({
  state,
  handlers
}: Props) => {
  const selectedItemsMissingCategoryCount = state.currentItems.filter(item => state.selectedItemIds.includes(item.item_id) && !item.item_targetCategoryId && !state.currentTask?.task_defaultCategoryId).length;
  const currentQueueReadyCount = state.currentItems.filter(item => item.item_fetchStatus === 'COMPLETED' && !item.item_isPublished).length;
  const currentQueueFailedCount = state.currentItems.filter(item => item.item_publishStatus === 'FAILED').length;
  return <div className="flex flex-col min-h-screen bg-background font-body" data-api-unique-id='importfrom1688view-r204f274eaa018c5e-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
      <section className="border-b bg-card w-full" data-controller-name="页面标题与全局操作" data-api-unique-id='importfrom1688view-rfc54c8b4ca0ebab4-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
        <div className="container mx-auto px-8 py-4 flex items-center justify-between" data-api-unique-id='importfrom1688view-ra0a22cc34c6aabd0-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
          <div className="flex items-center gap-3" data-api-unique-id='importfrom1688view-r36d6fd454064cc44-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
            <div className="bg-primary p-2 rounded-lg" data-api-unique-id='importfrom1688view-rc44bacb6a4da6f89-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
              <LayoutGrid className="w-5 h-5 text-primary-foreground" data-api-unique-id='importfrom1688view-r76b0bfab9bb66eeb-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' />
            </div>
            <div data-api-unique-id='importfrom1688view-rff39073a354bf31a-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
              <h1 className="text-xl font-header font-bold tracking-tight text-foreground" data-api-unique-id='importfrom1688view-rf899cc9d80e6d681-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>1688商品导入工作台</h1>
              <p className="text-sm text-muted-foreground mt-1" data-api-unique-id='importfrom1688view-r236a5866c487e00a-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>统一管理 1688 导入、表格导入与手动建品三种入口。</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handlers.handleGlobalRefresh} disabled={state.isRefreshing} className="flex items-center gap-2" data-api-unique-id='importfrom1688view-rd12ef7615d66851a-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
            <RefreshCw className={`w-4 h-4 ${state.isRefreshing ? 'animate-spin' : ''}`} data-api-unique-id='importfrom1688view-r055e990886682b2e-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' />
            手动刷新状态
          </Button>
        </div>
      </section>

      <section className="flex-1 w-full" data-controller-name="导入任务工作台" data-api-unique-id='importfrom1688view-r62bc7a09c93fb61f-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
        <div className="container mx-auto px-8 py-8 space-y-8" data-api-unique-id='importfrom1688view-r293486af52471b71-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
          <Card className="border-border shadow-sm" data-api-unique-id='importfrom1688view-rff67f89cc0f2e44d-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
            <CardHeader className="pb-4" data-api-unique-id='importfrom1688view-r7dedd1e047cdb828-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
              <CardTitle className="text-base font-header flex items-center gap-2" data-api-unique-id='importfrom1688view-r8f6bcbcfd008c56e-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                <PlusCircle className="w-4 h-4 text-primary" data-api-unique-id='importfrom1688view-r714595370efc6972-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' />
                建品入口选择
              </CardTitle>
              <CardDescription data-api-unique-id='importfrom1688view-ra65941483e1e559b-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>三种入口相互独立：1688 导入保留原任务流，表格导入与手动新增直接建品并标记来源。</CardDescription>
            </CardHeader>
            <CardContent data-api-unique-id='importfrom1688view-rd7f678c34f9aed0a-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4" data-api-unique-id='importfrom1688view-r1b9105e76e58bab7-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                {creationModeCards.map((mode, index) => {
                const Icon = mode.icon;
                const isActive = state.creationMode === mode.key;
                return <button key={mode.key} type="button" onClick={() => handlers.setCreationMode(mode.key)} className={`text-left rounded-xl border p-5 transition-all ${isActive ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/40 hover:bg-muted/30'}`} data-api-unique-id='importfrom1688view-re47f7aa9b520a974-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>
                      <div className="flex items-start justify-between gap-4" data-api-unique-id='importfrom1688view-r1f563904bed005a4-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>
                        <div className="space-y-2" data-api-unique-id='importfrom1688view-re4ec6fbbd6b7b9b7-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>
                          <div className="flex items-center gap-2" data-api-unique-id='importfrom1688view-r6b5e537f58b0a42f-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>
                            <div className={`p-2 rounded-lg ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`} data-api-unique-id='importfrom1688view-r6bfec89662888c42-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>
                              <Icon className="w-4 h-4" data-api-bind-info={`creationModeCards-${index}-icon`} data-api-map-var-name='mode' data-api-unique-id='importfrom1688view-r71e75584a6d50fde-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1' />
                            </div>
                            <p className="text-sm font-bold text-foreground" data-api-unique-id='importfrom1688view-r50cc8096192172a7-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1' data-api-bind-info={`creationModeCards-${index}-title`} data-api-map-var-name='mode'>{mode.title}</p>
                          </div>
                          <p className="text-sm text-muted-foreground leading-6" data-api-unique-id='importfrom1688view-re0c7f350971cddcd-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1' data-api-bind-info={`creationModeCards-${index}-description`} data-api-map-var-name='mode'>{mode.description}</p>
                        </div>
                        {isActive ? <Badge className="bg-primary text-primary-foreground border-none" data-api-unique-id='importfrom1688view-rcd7c5bf2fa03d481-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>当前入口</Badge> : <Badge variant="outline" data-api-unique-id='importfrom1688view-r28c36e772c253314-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>切换</Badge>}
                      </div>
                    </button>;
              })}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6" data-controller-name="三种导入入口表单区" data-api-unique-id='importfrom1688view-r77132d38b8dc066a-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
            {state.creationMode === '1688' ? (
              <ImportFrom1688LinkImportPanel state={state} handlers={handlers} />
            ) : null}

            {state.creationMode === 'table' ? <Card className="shadow-sm border-border overflow-hidden" data-api-unique-id='importfrom1688view-r74059ab7eb80676a-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                <CardHeader className="bg-secondary/50 border-b py-4" data-api-unique-id='importfrom1688view-r46c1e5e02fd16e9a-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                  <CardTitle className="text-base font-header flex items-center gap-2" data-api-unique-id='importfrom1688view-r74a60dca01a49597-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                    <ClipboardPaste className="w-4 h-4 text-primary" data-api-unique-id='importfrom1688view-rd37286c632c0fb06-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' />
                    表格导入商品
                  </CardTitle>
                  <CardDescription data-api-unique-id='importfrom1688view-r7bbf29ec6efe974f-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>固定 9 列（不含 SKU 映射）：产品编号、产品价格、名称、品牌、供应商、类目、颜色、规格、重量。Excel 无 SKU 列可直接导入；系统按产品编号合并 SPU，并自动生成 SKU。预览不含图片列；确认后进入待上传区再上传多图。颜色/规格可用逗号分隔。</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6" data-api-unique-id='importfrom1688view-r1e23403c172d8136-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4" data-controller-name="表格导入来源入口" data-api-unique-id='importfrom1688view-r92f4322b74036c38-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                    <Card className="border-dashed border-primary/40 bg-primary/5 shadow-none" data-api-unique-id='importfrom1688view-r7ce25f570f655ce8-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                      <CardContent className="p-5 space-y-3" data-api-unique-id='importfrom1688view-rc5fc605e8d9eb469-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                        <div className="flex items-start gap-3" data-api-unique-id='importfrom1688view-r1b8b2656a4098c6f-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                          <div className="p-2 rounded-lg bg-primary text-primary-foreground" data-api-unique-id='importfrom1688view-rfd4343c477367aa3-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                            <FileSpreadsheet className="w-4 h-4" data-api-unique-id='importfrom1688view-r5774b784c37880a6-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' />
                          </div>
                          <div className="space-y-1" data-api-unique-id='importfrom1688view-rd1e2eb9685b54346-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                            <p className="text-sm font-bold text-foreground" data-api-unique-id='importfrom1688view-r1bea162e7b8930b5-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>本地表格文件导入</p>
                            <p className="text-xs text-muted-foreground leading-5" data-api-unique-id='importfrom1688view-r8a9db88583ddda93-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>支持 CSV / TXT / TSV / XLSX / XLS。当前先提供最小可用方案：完成文件选择、基础校验与导入草稿生成。</p>
                          </div>
                        </div>
                        <Input type="file" accept=".csv,.txt,.tsv,.xlsx,.xls" onChange={e => handlers.handleSelectTableFile(e.target.files?.[0] ?? null)} className="cursor-pointer" data-api-unique-id='importfrom1688view-r057c38d8e77e9f6b-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' />
                        <div className="flex items-center justify-between rounded-lg border bg-background/80 px-3 py-2 text-xs" data-api-unique-id='importfrom1688view-r5e994e09c7547519-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                          <span className="text-muted-foreground" data-api-unique-id='importfrom1688view-rf8b535d5e087fe18-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>已选文件</span>
                          <span className="font-medium text-foreground" data-api-unique-id='importfrom1688view-r9d1bd824365e03e3-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>{state.tableImportForm.selectedFileName || '未选择'}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-none border-border" data-api-unique-id='importfrom1688view-r0164dafd6f37b3b8-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                      <CardContent className="p-5 space-y-3" data-api-unique-id='importfrom1688view-r8ee607077c375e57-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                        <div className="flex items-start gap-3" data-api-unique-id='importfrom1688view-rc1b03973ae44cf28-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                          <div className="p-2 rounded-lg bg-muted text-muted-foreground" data-api-unique-id='importfrom1688view-re793dec8e62bcfb5-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                            <Upload className="w-4 h-4" data-api-unique-id='importfrom1688view-rd712e825273b4ad9-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' />
                          </div>
                          <div className="space-y-1" data-api-unique-id='importfrom1688view-r5af2520b67fc3199-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                            <p className="text-sm font-bold text-foreground" data-api-unique-id='importfrom1688view-rdc37b9ce079a608c-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>粘贴表格内容</p>
                            <p className="text-xs text-muted-foreground leading-5" data-api-unique-id='importfrom1688view-r8d9e3c588f474dac-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>适合直接从 Excel 复制后粘贴。若已选择本地文件，也可继续人工调整文本后重新解析。</p>
                          </div>
                        </div>
                        <Textarea value={state.tableImportForm.content} onChange={e => handlers.handleTableImportFormChange('content', e.target.value)} placeholder="每行一条商品，按列使用 Tab 或逗号分隔。" className="min-h-[140px] resize-none" data-api-unique-id='importfrom1688view-ra6dd262d04a6c06b-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' />
                      </CardContent>
                    </Card>
                  </div>

                  <Alert data-api-unique-id='importfrom1688view-r2995a2db820c0b94-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                    <Info className="w-4 h-4" data-api-unique-id='importfrom1688view-r944b95ccbf798dbf-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' />
                    <AlertTitle data-api-unique-id='importfrom1688view-r238a6420e84e1348-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>导入说明</AlertTitle>
                    <AlertDescription data-api-unique-id='importfrom1688view-r45cfcbcfde6bbd3d-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>Excel/CSV 会按工作表解析。图片请在「确认创建商品」后，到待上传条目列表中点击「上传/编辑图片」。</AlertDescription>
                  </Alert>

                  <div className="flex flex-wrap gap-3" data-api-unique-id='importfrom1688view-r0dd97b4b5539551e-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                    <Button onClick={handlers.handleParseTableImport} disabled={state.isParsingTableImport || !state.tableImportForm.content.trim()} className="bg-primary hover:bg-primary text-primary-foreground" data-api-unique-id='importfrom1688view-r6f72b524b1eebd18-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                      {state.isParsingTableImport ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" data-api-unique-id='importfrom1688view-re3a7cad36f1e4598-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' /> : null}
                      {state.tableImportForm.importSource === 'file' ? '重新解析文件草稿' : '解析并生成预览'}
                    </Button>
                    <Button variant="outline" onClick={handlers.handleCreateProductsFromTable} disabled={state.isSubmittingTableImport || state.tableImportRows.length === 0} data-api-unique-id='importfrom1688view-r64de7918a1047813-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                      {state.isSubmittingTableImport ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" data-api-unique-id='importfrom1688view-ra80c8c7a8796d15c-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' /> : null}
                      确认创建商品 ({state.tableImportRows.length})
                    </Button>
                  </div>

                  <div className="rounded-xl border overflow-hidden" data-controller-name="表格导入预览">
                    <ScrollArea className="w-full">
                      <TableImportPreviewTable
                        rows={state.tableImportRows}
                        onChange={(rowId, field, value) => handlers.handleTableRowChange(rowId, field as any, value as any)}
                        onDelete={handlers.handleDeleteTableRow}
                      />
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card> : null}

            {state.creationMode === 'manual' ? <Card className="shadow-sm border-border overflow-hidden" data-api-unique-id='importfrom1688view-r0a9d223d5621c939-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                <CardHeader className="bg-secondary/50 border-b py-4" data-api-unique-id='importfrom1688view-r777ad6ebeebd778e-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                  <CardTitle className="text-base font-header flex items-center gap-2" data-api-unique-id='importfrom1688view-r0fefb2e189c9e5f1-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                    <PencilLine className="w-4 h-4 text-primary" data-api-unique-id='importfrom1688view-r077d1a3f927063fa-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' />
                    手动逐个新增商品
                  </CardTitle>
                  <CardDescription data-api-unique-id='importfrom1688view-r76421a4c6006af4e-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>直接填写商品信息并创建商品，来源自动标记为 MANUAL。</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6" data-api-unique-id='importfrom1688view-r363def96d5204848-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                  <Card className="border-dashed border-accent/50 bg-accent/5 shadow-none" data-controller-name="图片上传导入入口" data-api-unique-id='importfrom1688view-r6ee1a9ec66d8b1be-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                    <CardContent className="p-5 space-y-4" data-api-unique-id='importfrom1688view-r250796ea522a17e7-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4" data-api-unique-id='importfrom1688view-rf889be8b0ccc5090-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                        <div className="space-y-2" data-api-unique-id='importfrom1688view-r727c53ff1ead190e-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                          <div className="flex items-center gap-2" data-api-unique-id='importfrom1688view-r83d126b2d145f7ba-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                            <div className="p-2 rounded-lg bg-accent text-accent-foreground" data-api-unique-id='importfrom1688view-rf1bb78df91f30dee-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                              <ImagePlus className="w-4 h-4" data-api-unique-id='importfrom1688view-rd403233a5dd43f93-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' />
                            </div>
                            <p className="text-sm font-bold text-foreground" data-api-unique-id='importfrom1688view-rc32880d5c5b59455-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>图片直接上传</p>
                          </div>
                          <p className="text-xs text-muted-foreground leading-5 max-w-2xl" data-api-unique-id='importfrom1688view-rc0e99b69214af688-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>支持单张或多张图片上传。当前先提供最小可用方案：完成文件选择、基础校验、待识别草稿入列，并可将首张图片带入手动建品表单继续补全信息。</p>
                        </div>
                        <div className="flex flex-wrap gap-3" data-api-unique-id='importfrom1688view-r00452d474996f72b-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                          <Input type="file" multiple accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/bmp" onChange={e => handlers.handleSelectImageFiles(e.target.files)} className="max-w-[320px] cursor-pointer" data-api-unique-id='importfrom1688view-r9786cd0b4a49d640-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' />
                          <Button type="button" variant="outline" onClick={handlers.handleAppendImageDraftsToManual} disabled={state.imageUploadForm.items.length === 0} data-api-unique-id='importfrom1688view-r95804dd6ae1d0d99-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                            <WandSparkles className="w-4 h-4 mr-2" data-api-unique-id='importfrom1688view-re9f2731dc6714ef9-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' />
                            带入手动建品
                          </Button>
                        </div>
                      </div>

                      <div className="rounded-xl border overflow-hidden bg-background" data-api-unique-id='importfrom1688view-r8549ec26ffca3d41-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                        <ScrollArea className="w-full" data-api-unique-id='importfrom1688view-r667d360f6d3ceecf-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                          <div className="min-w-[980px]" data-api-unique-id='importfrom1688view-r3dce8207c9e075e0-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                            <Table data-api-unique-id='importfrom1688view-r76a695ed23f4a58e-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                              <TableHeader className="bg-secondary/20" data-api-unique-id='importfrom1688view-r144bc51572fa2373-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                <TableRow data-api-unique-id='importfrom1688view-rbf15cfb1a995c02c-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                  <TableHead className="w-[180px]" data-api-unique-id='importfrom1688view-r30fd91988affc4a5-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>图片预览</TableHead>
                                  <TableHead className="w-[180px]" data-api-unique-id='importfrom1688view-r3c0c647629f7b300-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>文件名</TableHead>
                                  <TableHead className="w-[160px]" data-api-unique-id='importfrom1688view-r3ab79ae1352fa2ee-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>待识别名称</TableHead>
                                  <TableHead className="w-[180px]" data-api-unique-id='importfrom1688view-r0cd5f2e9ba031070-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>分类</TableHead>
                                  <TableHead className="w-[180px]" data-api-unique-id='importfrom1688view-rbd5090529015ff38-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>品牌</TableHead>
                                  <TableHead className="w-[240px]" data-api-unique-id='importfrom1688view-rbfe3ab50b1d6d2bc-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>状态说明</TableHead>
                                  <TableHead className="w-[80px] text-right" data-api-unique-id='importfrom1688view-r4b68e2293753e781-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>操作</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody data-api-unique-id='importfrom1688view-r68c1505ea0962a53-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                {state.imageUploadForm.items.length === 0 ? <TableRow data-api-unique-id='importfrom1688view-rbc2504bd43bb871a-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground" data-api-unique-id='importfrom1688view-r0a98bd651c88f56a-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>暂无图片上传草稿，请先选择单张或多张图片</TableCell>
                                  </TableRow> : state.imageUploadForm.items.map((item, index) => <TableRow key={item.rowId} data-api-unique-id='importfrom1688view-r9ca3a32191fa73d4-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>
                                      <TableCell data-api-unique-id='importfrom1688view-r5c91680f732f6183-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>
                                        <div className="flex items-center gap-3" data-api-unique-id='importfrom1688view-rfe6670e0a4ee8f80-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>
                                          <PreviewableThumb src={item.imageUrl} alt={item.fileName} className="block w-20 h-20 rounded-lg border overflow-hidden bg-muted">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={item.imageUrl} alt={item.fileName} className="w-full h-full object-cover" data-api-unique-id='importfrom1688view-r79419089ef47156d-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1' />
                                          </PreviewableThumb>
                                          <div className="text-xs text-muted-foreground space-y-1" data-api-unique-id='importfrom1688view-r8f5e131a16058274-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>
                                            <p data-api-unique-id='importfrom1688view-r6e250bf823a7a697-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>{item.sourceLabel}</p>
                                            <p data-api-unique-id='importfrom1688view-r306ef0f354d46f08-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>{item.fileSizeText}</p>
                                          </div>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-sm font-medium" data-api-unique-id='importfrom1688view-r1d2ade0e71021aee-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>{item.fileName}</TableCell>
                                      <TableCell data-api-unique-id='importfrom1688view-rda89c2f4828c993f-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'><Input value={item.productName} onChange={e => handlers.handleImageDraftFieldChange(item.rowId, 'productName', e.target.value)} data-api-unique-id='importfrom1688view-r7a537cb339d3273a-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1' /></TableCell>
                                      <TableCell data-api-unique-id='importfrom1688view-r65c7e6ebc78d5bc6-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>
                                        <CategoryCascadeSelect
                                          options={state.categoryOptions}
                                          value={item.categoryId}
                                          onValueChange={val => handlers.handleImageDraftFieldChange(item.rowId, 'categoryId', val)}
                                          placeholder="选择分类"
                                          triggerClassName="h-9"
                                        />
                                      </TableCell>
                                      <TableCell data-api-unique-id='importfrom1688view-r86a78451c4487162-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'><Input value={item.brand} onChange={e => handlers.handleImageDraftFieldChange(item.rowId, 'brand', e.target.value)} data-api-unique-id='importfrom1688view-ra4e91cd60343f78a-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1' /></TableCell>
                                      <TableCell data-api-unique-id='importfrom1688view-r27e98185bfa97129-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>
                                        <div className="space-y-2" data-api-unique-id='importfrom1688view-r8167d59dd005cc41-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>
                                          <Badge variant="outline" data-api-unique-id='importfrom1688view-rc4179dfe724b5e0e-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>{item.statusLabel}</Badge>
                                          <Textarea value={item.detail} onChange={e => handlers.handleImageDraftFieldChange(item.rowId, 'detail', e.target.value)} className="min-h-[84px] resize-none" data-api-unique-id='importfrom1688view-rd0fdabd26ab6010d-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1' />
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-right" data-api-unique-id='importfrom1688view-r7cd2fe7c7c70d27c-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>
                                        <Button variant="ghost" size="icon" onClick={() => handlers.handleDeleteImageDraftItem(item.rowId)} data-api-unique-id='importfrom1688view-raf945426f8c4db9c-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>
                                          <Trash2 className="w-4 h-4 text-destructive" data-api-unique-id='importfrom1688view-re8236de3c8581470-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1' />
                                        </Button>
                                      </TableCell>
                                    </TableRow>)}
                              </TableBody>
                            </Table>
                          </div>
                        </ScrollArea>
                      </div>

                      {state.isCreatingImageDraft ? <div className="flex items-center gap-2 text-sm text-muted-foreground" data-api-unique-id='importfrom1688view-r8446f258a63354a3-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                          <RefreshCw className="w-4 h-4 animate-spin" data-api-unique-id='importfrom1688view-rbe0598db766fc683-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' />
                          图片草稿生成中...
                        </div> : null}
                    </CardContent>
                  </Card>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-api-unique-id='importfrom1688view-r033ca9facf5acdf0-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                    <div className="space-y-2" data-api-unique-id='importfrom1688view-r51c8b8f474aca822-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                      <label className="text-sm font-medium text-foreground" data-api-unique-id='importfrom1688view-r4009b004dfd7050f-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>产品名称</label>
                      <Input value={state.manualForm.productName} onChange={e => handlers.handleManualFormChange('productName', e.target.value)} data-api-unique-id='importfrom1688view-rbc86323d69e87576-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' />
                    </div>
                    <div className="space-y-2" data-api-unique-id='importfrom1688view-r8926b5884efa57c4-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                      <label className="text-sm font-medium text-foreground" data-api-unique-id='importfrom1688view-r8898525744ac2b44-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>供应商</label>
                      <Input value={state.manualForm.supplier} onChange={e => handlers.handleManualFormChange('supplier', e.target.value)} data-api-unique-id='importfrom1688view-r7dffe22464c5b062-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' />
                    </div>
                    <div className="space-y-2" data-api-unique-id='importfrom1688view-r6d0b41da4dd282ae-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                      <label className="text-sm font-medium text-foreground" data-api-unique-id='importfrom1688view-read384cbd20577e6-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>产品分类</label>
                      <CategoryCascadeSelect
                        options={state.categoryOptions}
                        value={state.manualForm.categoryId}
                        onValueChange={val => handlers.handleManualFormChange('categoryId', val)}
                        placeholder="选择分类"
                      />
                    </div>
                    <div className="space-y-2" data-api-unique-id='importfrom1688view-ra4ddfb83f39e1ba3-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                      <label className="text-sm font-medium text-foreground" data-api-unique-id='importfrom1688view-r6e84093e705ccdc5-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>品牌</label>
                      <Input value={state.manualForm.brand} onChange={e => handlers.handleManualFormChange('brand', e.target.value)} data-api-unique-id='importfrom1688view-rce6235fc997c0e1c-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' />
                    </div>
                    <div className="space-y-2" data-api-unique-id='importfrom1688view-r4df0ef7426046209-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                      <label className="text-sm font-medium text-foreground" data-api-unique-id='importfrom1688view-r0ee634e0aaff8378-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>重量</label>
                      <Input value={state.manualForm.weight} onChange={e => handlers.handleManualFormChange('weight', e.target.value)} data-api-unique-id='importfrom1688view-rb90df3ccafb8ca69-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' />
                    </div>
                    <div className="space-y-2" data-api-unique-id='importfrom1688view-r16367cd3ffa24011-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                      <label className="text-sm font-medium text-foreground" data-api-unique-id='importfrom1688view-rfaea4d01918f063e-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>成本价</label>
                      <Input type="number" value={state.manualForm.costPrice} onChange={e => handlers.handleManualFormChange('costPrice', e.target.value === '' ? '' : Number(e.target.value))} data-api-unique-id='importfrom1688view-rddb810906a46ef77-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' />
                    </div>
                    <div className="space-y-2 md:col-span-2" data-api-unique-id='importfrom1688view-r8e251094818a3e68-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                      <label className="text-sm font-medium text-foreground" data-api-unique-id='importfrom1688view-rcaddb5dc24f3f840-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>图片</label>
                      <Input value={state.manualForm.imageUrl} onChange={e => handlers.handleManualFormChange('imageUrl', e.target.value)} placeholder="粘贴图片 URL" data-api-unique-id='importfrom1688view-r3b614d6c49a48988-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' />
                    </div>
                    <div className="space-y-2 md:col-span-2" data-api-unique-id='importfrom1688view-rceafc38c9abc838a-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                      <label className="text-sm font-medium text-foreground" data-api-unique-id='importfrom1688view-r6d42edd8ea21aaf6-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>商品详情</label>
                      <Textarea value={state.manualForm.detail} onChange={e => handlers.handleManualFormChange('detail', e.target.value)} className="min-h-[140px] resize-none" data-api-unique-id='importfrom1688view-rf806a178b2d3a6ad-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' />
                    </div>
                  </div>

                  <Button className="w-full md:w-auto bg-primary hover:bg-primary text-primary-foreground" onClick={handlers.handleCreateManualProduct} disabled={state.isSubmittingManual} data-api-unique-id='importfrom1688view-r9b7e3052537ff582-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                    {state.isSubmittingManual ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" data-api-unique-id='importfrom1688view-r90de8b73d82e9e9c-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' /> : null}
                    立即创建商品
                  </Button>
                </CardContent>
              </Card> : null}
          </div>

          <div className="grid grid-cols-12 gap-8 items-start" data-api-unique-id='importfrom1688view-r0a436bdc2c143aa3-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
            <div className="col-span-12 lg:col-span-9 space-y-6" data-api-unique-id='importfrom1688view-r14a1218141759ad3-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
              <Tabs value={state.activeTab} onValueChange={handlers.setActiveTab} className="w-full" data-api-unique-id='importfrom1688view-rbc389c7db07f2119-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                <div className="flex items-center justify-between mb-4 border-b pb-1" data-api-unique-id='importfrom1688view-r01a08d28e674ea08-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                  <TabsList className="bg-transparent h-auto p-0 gap-8" data-api-unique-id='importfrom1688view-r4597cee453882ccd-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                    <TabsTrigger value="current" className="px-0 py-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none text-base font-semibold" data-api-unique-id='importfrom1688view-r8769a41accaca3c1-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                      待上传处理区
                    </TabsTrigger>
                    <TabsTrigger value="history" className="px-0 py-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none text-base font-semibold" data-api-unique-id='importfrom1688view-rf51de84f0aecf40a-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                      历史任务记录
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="current" className="space-y-6 mt-0" data-api-unique-id='importfrom1688view-rcf00994d52bceda5-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                  {state.isLoadingDetail ? <div className="flex flex-col items-center justify-center py-20" data-api-unique-id='importfrom1688view-r0ba7b488274bdbed-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                      <RefreshCw className="w-8 h-8 animate-spin text-primary mb-2" data-api-unique-id='importfrom1688view-r04925107dc516403-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' />
                      <p className="text-muted-foreground font-medium" data-api-unique-id='importfrom1688view-r60e57348568c142b-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>待上传队列加载中...</p>
                    </div> : state.currentItems.length === 0 ? <Card className="flex flex-col items-center justify-center py-20 text-center border-dashed border-2" data-api-unique-id='importfrom1688view-rf9c4cfbbbfade190-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                      <div className="bg-muted p-4 rounded-full mb-4" data-api-unique-id='importfrom1688view-r4083590bd250b535-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                        <LayoutGrid className="w-8 h-8 text-muted-foreground" data-api-unique-id='importfrom1688view-re8472bc7ef6b6ca0-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' />
                      </div>
                      <CardTitle className="text-lg" data-api-unique-id='importfrom1688view-raec4c5cf82ade311-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>暂无待上传商品</CardTitle>
                      <CardDescription className="max-w-md mx-auto mt-2" data-api-unique-id='importfrom1688view-r673d3bc83b3965ab-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                        当前待上传区会展示所有已解析完成但尚未发布的商品。即使没有路由 taskId，只要存在待处理商品，也会在这里继续补分类、修正字段并发布到商品库。
                      </CardDescription>
                    </Card> : <>
                      <Card className="border-border shadow-sm" data-controller-name="待上传队列概览" data-api-unique-id='importfrom1688view-reae67f9918ba8153-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                        <CardContent className="p-6" data-api-unique-id='importfrom1688view-ref87a86249571ba4-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                          <div className="flex flex-col md:flex-row md:items-center gap-6" data-api-unique-id='importfrom1688view-r7fcd19c3fb5e04d3-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                            <div className="flex-1 space-y-3" data-api-unique-id='importfrom1688view-r13ee3dc5f5a8a719-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                              <div className="flex items-center gap-3 flex-wrap" data-api-unique-id='importfrom1688view-r65126f60c37f295f-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                {state.currentTask ? <span className="text-xs font-mono font-bold px-2 py-0.5 bg-secondary text-secondary-foreground rounded uppercase tracking-wider" data-api-unique-id='importfrom1688view-r06b17abc470c5ef5-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                    TASK: {state.currentTask.task_id}
                                  </span> : null}
                                {state.currentTask ? <Badge className={`${STATUS_COLOR_MAP[state.currentTask.task_status]} shadow-none`} data-api-unique-id='importfrom1688view-rc47c4bba8a44c21d-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                    {TASK_STATUS_LABELS[state.currentTask.task_status]}
                                  </Badge> : null}
                                <span className="text-sm text-muted-foreground" data-api-unique-id='importfrom1688view-rd095ca7de2ddff79-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                  当前展示 {state.taskId ? '该任务' : '全量待上传队列'} 中尚未发布的商品
                                </span>
                              </div>
                              <div className="space-y-1.5" data-api-unique-id='importfrom1688view-rc30dc0deba9a464b-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                <div className="flex justify-between text-sm mb-1" data-api-unique-id='importfrom1688view-r2c6b5529c9aed79d-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                  <span className="font-medium" data-api-unique-id='importfrom1688view-rff60ba097c0d478d-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>可继续处理的待上传商品</span>
                                  <span className="text-primary font-bold" data-api-unique-id='importfrom1688view-r24a92f37f16092d4-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>{currentQueueReadyCount} 条</span>
                                </div>
                                <Progress value={state.currentItems.length === 0 ? 0 : Math.round(currentQueueReadyCount / state.currentItems.length * 100)} className="h-2" data-api-unique-id='importfrom1688view-rfc0ce8311dfb2db1-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' />
                              </div>
                            </div>

                            <div className="flex items-center gap-8 border-l pl-8" data-api-unique-id='importfrom1688view-r1ef1b42235d25ef6-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                              <div className="text-center" data-api-unique-id='importfrom1688view-ra0ac6646ddd1ceaa-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                <p className="text-xs text-muted-foreground uppercase font-bold mb-1" data-api-unique-id='importfrom1688view-r1325c099ce5bc846-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>队列总数</p>
                                <p className="text-xl font-header font-bold" data-api-unique-id='importfrom1688view-r1fad116c6e123961-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>{state.currentItems.length}</p>
                              </div>
                              <div className="text-center" data-api-unique-id='importfrom1688view-r4bb7e0a90324dfb5-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                <p className="text-xs text-accent uppercase font-bold mb-1" data-api-unique-id='importfrom1688view-r5141eacaf371f0d5-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>待上传</p>
                                <p className="text-xl font-header font-bold text-accent" data-api-unique-id='importfrom1688view-r240f542b4623cced-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>{currentQueueReadyCount}</p>
                              </div>
                              <div className="text-center" data-api-unique-id='importfrom1688view-r18aa9f8d7e1df52d-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                <p className="text-xs text-destructive uppercase font-bold mb-1" data-api-unique-id='importfrom1688view-r1b0956773d04e456-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>待修正</p>
                                <p className="text-xl font-header font-bold text-destructive" data-api-unique-id='importfrom1688view-r536ceef15cb29085-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>{currentQueueFailedCount}</p>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 min-w-[220px]" data-api-unique-id='importfrom1688view-r6bac82a160f33d83-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                              <Button size="sm" className="w-full bg-primary hover:bg-primary text-primary-foreground font-bold" onClick={handlers.handleConfirmImport} disabled={state.isConfirmingImport || state.selectedItemIds.length === 0} data-api-unique-id='importfrom1688view-r000246e306e019eb-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                {state.isConfirmingImport ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" data-api-unique-id='importfrom1688view-r156dd1d49aceb160-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' /> : null}
                                确认并发布上架 ({state.selectedItemIds.length})
                              </Button>
                              {selectedItemsMissingCategoryCount > 0 ? <p className="text-xs text-destructive leading-5" data-api-unique-id='importfrom1688view-r37abf4b459e8329f-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>当前已选商品中有 {selectedItemsMissingCategoryCount} 条未设置目标分类，请先在右侧修正区补齐分类后再发布。</p> : <p className="text-xs text-muted-foreground leading-5" data-api-unique-id='importfrom1688view-r5c879163a9ff63c1-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>解析完成的商品会直接进入待上传区；发布失败的商品也会继续保留在这里，方便补字段后再次发布。</p>}
                              {state.taskId && state.currentTask && ['PENDING', 'RETRY_PENDING', 'RATE_LIMITED'].includes(state.currentTask.task_status) ? <Button variant="outline" size="sm" onClick={() => handlers.handleStartParseTask(state.currentTask!.task_id)} disabled={state.isParsingTask} data-api-unique-id='importfrom1688view-start-parse' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                  {state.isParsingTask ? '解析中…' : '开始解析'}
                                </Button> : null}
                              {state.taskId && state.currentTask && ['FAILED', 'PARTIAL_SUCCESS', 'COMPLETED', 'RATE_LIMITED'].includes(state.currentTask.task_status) ? <Button variant="outline" size="sm" onClick={() => handlers.handleRetryTask(state.currentTask!.task_id)} data-api-unique-id='importfrom1688view-ra64837f195205f17-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                  重试当前任务解析
                                </Button> : null}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <div className="grid grid-cols-12 gap-6 h-[640px]" data-api-unique-id='importfrom1688view-r1c35987c117de935-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                        <Card className="col-span-12 lg:col-span-8 overflow-hidden flex flex-col border-border" data-controller-name="待上传商品列表" data-api-unique-id='importfrom1688view-r535f43014379e123-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                          <ScrollArea className="flex-1" data-api-unique-id='importfrom1688view-r0d79b91667661d59-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                            <Table className="relative" data-api-unique-id='importfrom1688view-r2ea38564b4498309-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                              <TableHeader className="bg-secondary/30 sticky top-0 z-10 backdrop-blur-sm" data-api-unique-id='importfrom1688view-rb0630da3cafa77c8-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                <TableRow className="hover:bg-transparent" data-api-unique-id='importfrom1688view-re0cc475bb2fa248e-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                  <TableHead className="w-[50px]" data-api-unique-id='importfrom1688view-r994bccd0909627b1-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                    <Checkbox checked={state.isAllSelected} onCheckedChange={handlers.handleToggleSelectAll} disabled={state.selectableItems.length === 0} data-api-unique-id='importfrom1688view-r061aa478165f3521-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' />
                                  </TableHead>
                                  <TableHead className="w-[80px]" data-api-unique-id='importfrom1688view-reeb4f77edc2f79af-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>主图</TableHead>
                                  <TableHead className="min-w-[240px]" data-api-unique-id='importfrom1688view-red54b55c3b537d7d-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>商品信息</TableHead>
                                  <TableHead data-api-unique-id='importfrom1688view-ra7eaf43e3f86fea6-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>待上传价格</TableHead>
                                  <TableHead data-api-unique-id='importfrom1688view-rd5302c27fe00ab2a-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>状态</TableHead>
                                  <TableHead className="text-right" data-api-unique-id='importfrom1688view-r014c21c8da4564dc-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>操作</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody data-api-unique-id='importfrom1688view-r636b6f813b14b562-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                {state.currentItems.map((item, index) => {
                              const statusMeta = getPendingStatusMeta(item);
                              return <TableRow key={item.item_id} className={`cursor-pointer transition-colors ${state.activeItemId === item.item_id ? 'bg-primary/5' : ''}`} onClick={() => handlers.setActiveItemId(item.item_id)} data-api-unique-id='importfrom1688view-r4104178816f8a61f-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>
                                      <TableCell onClick={e => e.stopPropagation()} data-api-unique-id='importfrom1688view-rb6d75e3a49c78e93-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>
                                        <Checkbox checked={state.selectedItemIds.includes(item.item_id)} onCheckedChange={c => handlers.handleToggleSelectItem(item.item_id, !!c)} disabled={item.item_fetchStatus !== 'COMPLETED' || item.item_isPublished} data-api-unique-id='importfrom1688view-r6c45bba89806693b-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1' />
                                      </TableCell>
                                      <TableCell data-api-unique-id='importfrom1688view-red1e65eba8152de9-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>
                                        <PreviewableThumb
                                          src={item.item_mainImageUrl || item.item_parsedMainImageUrl || ''}
                                          alt={item.item_productName || item.item_parsedName || ''}
                                          className="block w-12 h-12 rounded border overflow-hidden bg-muted"
                                        >
                                          <EditableImg propKey={`img-${item.item_id}`} keywords={item.item_mainImageUrl || item.item_parsedMainImageUrl || 'placeholder'} className="w-full h-full object-cover" data-api-unique-id='importfrom1688view-rc4e622bc8289d4ab-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1' />
                                        </PreviewableThumb>
                                      </TableCell>
                                      <TableCell className="max-w-[320px]" data-api-unique-id='importfrom1688view-r5d6b8978cffeb701-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>
                                        <div className="flex flex-col gap-1" data-api-unique-id='importfrom1688view-re3ef618b9998a7c4-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>
                                          <p className="text-sm font-semibold line-clamp-1" data-api-unique-id='importfrom1688view-rd556233513788d3b-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>{item.item_productName || item.item_parsedName || '未解析到名称'}</p>
                                          <p className="text-xs text-muted-foreground line-clamp-1" data-api-unique-id='importfrom1688view-r27c90e445aca9380-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>来源任务：{item.item_importTaskId}</p>
                                          <div className="flex flex-wrap gap-1" data-api-unique-id='importfrom1688view-r2af772412a6d8c4e-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>
                                            {item.item_targetCategoryId ? <Badge variant="secondary" className="text-[10px] py-0 px-1 font-normal border-none" data-api-unique-id='importfrom1688view-r2ec3ed7515d4de88-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>已选分类</Badge> : <Badge className="bg-warning/20 text-warning-foreground border-none text-[10px] py-0 px-1" data-api-unique-id='importfrom1688view-r97cd9945dafe9253-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>缺少分类</Badge>}
                                            {item.item_supplierName ? <Badge variant="outline" className="text-[10px] py-0 px-1" data-api-unique-id='importfrom1688view-r31bd341f47939747-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>{item.item_supplierName}</Badge> : null}
                                          </div>
                                        </div>
                                      </TableCell>
                                      <TableCell data-api-unique-id='importfrom1688view-rf7587e5a9974036d-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>
                                        <div className="space-y-1" data-api-unique-id='importfrom1688view-r36452081a2342d34-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>
                                          <span className="font-mono text-sm font-bold text-foreground block" data-api-unique-id='importfrom1688view-r64c1fcbdc9b6decc-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>
                                            ¥{item.item_cnyPriceMin ?? '-'} - {item.item_cnyPriceMax ?? '-'}
                                          </span>
                                          <span className="text-[11px] text-muted-foreground" data-api-unique-id='importfrom1688view-r203fe6547d9f78ae-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>USD {item.item_usdPriceMin ?? '-'} - {item.item_usdPriceMax ?? '-'}</span>
                                        </div>
                                      </TableCell>
                                      <TableCell data-api-unique-id='importfrom1688view-raefffabeea79a02e-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>
                                        <div className="flex flex-col items-start gap-1" data-api-unique-id='importfrom1688view-rda32dee00cccf63f-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>
                                          <Badge className={statusMeta.badgeClass} variant={statusMeta.badgeClass.includes('border-accent') ? 'outline' : undefined} data-api-unique-id='importfrom1688view-r3491e41bff9af9a2-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>{statusMeta.label}</Badge>
                                          <span className="text-[11px] text-muted-foreground leading-4 line-clamp-2" data-api-unique-id='importfrom1688view-r86cc2e482556be93-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>{statusMeta.description}</span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-right" data-api-unique-id='importfrom1688view-r678407e1732b26b8-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>
                                        <Button variant="ghost" size="icon" asChild onClick={e => e.stopPropagation()} data-api-unique-id='importfrom1688view-r604f28519ff72988-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>
                                          <a href={item.item_sourceUrl} target="_blank" rel="noreferrer" data-api-unique-id='importfrom1688view-r413a0f7fefb4b849-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>
                                            <ExternalLink className="w-4 h-4 text-muted-foreground" data-api-unique-id='importfrom1688view-ree2c62f7b0191fcf-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1' />
                                          </a>
                                        </Button>
                                      </TableCell>
                                    </TableRow>;
                            })}
                              </TableBody>
                            </Table>
                          </ScrollArea>
                        </Card>

                        <Card className="col-span-12 lg:col-span-4 border-border overflow-hidden flex flex-col bg-card" data-controller-name="待上传修正面板" data-api-unique-id='importfrom1688view-r63b5cb346ac3d08c-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                          <ScrollArea className="flex-1" data-api-unique-id='importfrom1688view-raffd67c5a6e4f042-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                            <CardHeader className="bg-secondary/30 border-b py-3 px-4" data-api-unique-id='importfrom1688view-r489bfe5bf7d6b06c-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                              <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-tight" data-api-unique-id='importfrom1688view-rcce640c0e0314c70-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                待上传详情与修正
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4" data-api-unique-id='importfrom1688view-rbe6e50eec1c7999b-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                              {!state.activeItemId ? <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3" data-api-unique-id='importfrom1688view-r25f177fb63dc01c1-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                  <Info className="w-8 h-8 opacity-20" data-api-unique-id='importfrom1688view-refdf6f9368b273d3-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' />
                                  <p className="text-sm" data-api-unique-id='importfrom1688view-rc461ea1ccdcf630b-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>点击左侧商品开始修正与发布</p>
                                </div> : state.activeItemDetails ? (() => {
                            const statusMeta = getPendingStatusMeta(state.activeItemDetails);
                            return <div className="space-y-5" data-api-unique-id='importfrom1688view-re7068a421687bc98-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                    <Alert className={state.activeItemDetails.item_publishStatus === 'FAILED' ? 'bg-destructive/10 border-destructive/20 text-destructive border rounded-md' : ''} data-api-unique-id='importfrom1688view-r5df99535715151ab-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                      <AlertCircle className="h-4 w-4" data-api-unique-id='importfrom1688view-rb493db311de1bb53-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' />
                                      <AlertTitle className="font-bold" data-api-unique-id='importfrom1688view-r0d704eaef87912d4-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>{state.activeItemFailureSummary?.title || statusMeta.label}</AlertTitle>
                                      <AlertDescription className="text-xs mt-1 leading-relaxed space-y-2" data-api-unique-id='importfrom1688view-r91f3b9c58b4d349a-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                        <p data-api-unique-id='importfrom1688view-ra6f70798e577ba01-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>{state.activeItemFailureSummary?.description || statusMeta.description}</p>
                                        {state.activeItemDetails.item_failureReason ? <p className="font-medium" data-api-unique-id='importfrom1688view-rc2f549d6806492a7-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>系统原因：{state.activeItemDetails.item_failureReason}</p> : null}
                                      </AlertDescription>
                                    </Alert>

                                    <div className="space-y-1.5" data-api-unique-id='importfrom1688view-r5d65c366ed867631-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                      <label className="text-[11px] font-bold uppercase text-muted-foreground" data-api-unique-id='importfrom1688view-rebfe2d298478cf4f-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>商品图片</label>
                                      <div className="aspect-square w-full rounded-md border overflow-hidden bg-muted group relative" data-api-unique-id='importfrom1688view-r35383eef4e9a4e51-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                        <PreviewableThumb
                                          src={state.editForm.mainImageUrl || ''}
                                          alt={state.editForm.name || '商品主图预览'}
                                          className="block h-full w-full"
                                        >
                                          <EditableImg propKey="detail-preview" keywords={state.editForm.mainImageUrl || 'preview'} className="w-full h-full object-cover" needLargeImage description="商品主图预览" data-api-unique-id='importfrom1688view-rdcf6479ebde87ce6-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' />
                                        </PreviewableThumb>
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        {(state.activeItemDetails.item_galleryUrls || []).map((url, imageIndex) => (
                                          <div key={`${url}-${imageIndex}`} className="relative h-14 w-14 overflow-hidden rounded border bg-muted">
                                            <PreviewableThumb src={url} alt={`${state.editForm.name || '商品图片'} ${imageIndex + 1}`} className="block h-full w-full">
                                              <EditableImg propKey={`edit-gallery-${imageIndex}`} src={url} keywords={url} className="h-full w-full object-cover" />
                                            </PreviewableThumb>
                                            <button
                                              type="button"
                                              className="absolute right-0 top-0 z-10 flex h-4 w-4 items-center justify-center bg-black/70 text-[10px] text-white"
                                              onClick={() => handlers.handleRemovePendingImage(state.activeItemDetails!.item_id, imageIndex)}
                                            >
                                              ×
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                      <label className="inline-flex">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="h-9 border-dashed"
                                          disabled={state.pendingImageUploadingId === state.activeItemDetails.item_id}
                                          onClick={() => document.getElementById(`import1688-upload-${state.activeItemDetails!.item_id}`)?.click()}
                                        >
                                          <ImagePlus className="mr-1.5 h-3.5 w-3.5" />
                                          {state.pendingImageUploadingId === state.activeItemDetails.item_id ? '上传中...' : '上传/编辑图片'}
                                        </Button>
                                        <input
                                          id={`import1688-upload-${state.activeItemDetails.item_id}`}
                                          type="file"
                                          accept="image/*"
                                          multiple
                                          className="hidden"
                                          onChange={e => handlers.handleUploadPendingImages(state.activeItemDetails!.item_id, e)}
                                        />
                                      </label>
                                      <p className="text-[11px] text-muted-foreground">支持一次选择多张；缩略图右上角 × 可删除单张。</p>
                                    </div>

                                    <div className="space-y-1.5" data-api-unique-id='importfrom1688view-r8414079f4c7d7655-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                      <label className="text-[11px] font-bold uppercase text-muted-foreground" data-api-unique-id='importfrom1688view-raf07691c2d5f6c64-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>商品名称</label>
                                      <Input className="h-10 text-sm" value={state.editForm.name} onChange={e => handlers.handleEditFormChange('name', e.target.value)} data-api-unique-id='importfrom1688view-r46eac6dd92c86aa1-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' />
                                    </div>

                                    <div className="space-y-1.5" data-api-unique-id='importfrom1688view-r83cc2261ee0bf3af-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                      <label className="text-[11px] font-bold uppercase text-muted-foreground" data-api-unique-id='importfrom1688view-r8a34f854fe90c0ab-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>目标分类</label>
                                      <CategoryCascadeSelect
                                        options={state.categoryOptions}
                                        value={state.editForm.categoryId}
                                        onValueChange={val => handlers.handleEditFormChange('categoryId', val)}
                                        placeholder="选择待上传分类"
                                        triggerClassName="h-10 text-xs"
                                      />
                                    </div>

                                    <div className="space-y-2" data-api-unique-id='importfrom1688view-rautocategoryhits-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                      <label className="text-[11px] font-bold uppercase text-muted-foreground" data-api-unique-id='importfrom1688view-rautocategoryhitslabel-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>自动命中类目</label>
                                      {state.activeItemDetails.item_matchedCategoryNames.length > 0 ? (
                                        <>
                                          <div className="flex flex-wrap gap-2" data-api-unique-id='importfrom1688view-rautocategoryhitsbadges-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                            {state.activeItemDetails.item_matchedCategoryNames.map((name, index) => <Badge key={`${name}-${index}`} variant="outline" className="border-primary/30 bg-primary/5 text-primary" data-api-unique-id='importfrom1688view-rautocategoryhitbadge-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>{name}</Badge>)}
                                          </div>
                                          <p className="text-xs text-muted-foreground leading-5" data-api-unique-id='importfrom1688view-rautocategoryhitshint-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>选择细分品类，系统将自动归属到对应一级大类。发布前仍会按标题自动识别二级类目。</p>
                                        </>
                                      ) : <p className="text-xs text-muted-foreground leading-5" data-api-unique-id='importfrom1688view-rautocategoryhitsempty-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>当前标题暂未命中自动类目；发布前仍会按最新标题再自动重试一次。</p>}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3" data-api-unique-id='importfrom1688view-rbceddc892aee7fae-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                      <div className="space-y-1.5" data-api-unique-id='importfrom1688view-r57535fab6d186473-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                        <label className="text-[11px] font-bold uppercase text-muted-foreground" data-api-unique-id='importfrom1688view-re48656ccc1ec2a3a-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>人民币最低价</label>
                                        <Input type="number" className="h-10 text-sm font-mono" value={state.editForm.priceMin} onChange={e => handlers.handleEditFormChange('priceMin', e.target.value === '' ? '' : Number(e.target.value))} data-api-unique-id='importfrom1688view-r9e02d8ad4d90746d-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' />
                                      </div>
                                      <div className="space-y-1.5" data-api-unique-id='importfrom1688view-rbc60417e42072602-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                        <label className="text-[11px] font-bold uppercase text-muted-foreground" data-api-unique-id='importfrom1688view-r92b9bca37646d6fe-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>人民币最高价</label>
                                        <Input type="number" className="h-10 text-sm font-mono" value={state.editForm.priceMax} onChange={e => handlers.handleEditFormChange('priceMax', e.target.value === '' ? '' : Number(e.target.value))} data-api-unique-id='importfrom1688view-r18128c9df9b0173c-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' />
                                      </div>
                                    </div>

                                    <div className="space-y-1.5" data-api-unique-id='importfrom1688view-rf22851c88419d66e-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                      <label className="text-[11px] font-bold uppercase text-muted-foreground" data-api-unique-id='importfrom1688view-r9be0d4fe9169e24e-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>主图 URL</label>
                                      <Input className="h-10 text-sm" value={state.editForm.mainImageUrl} onChange={e => handlers.handleEditFormChange('mainImageUrl', e.target.value)} data-api-unique-id='importfrom1688view-r4a2c7c27c60ae6b6-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3" data-api-unique-id='importfrom1688view-r55e89e86a7f643d0-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                      <div className="space-y-1.5" data-api-unique-id='importfrom1688view-r81f78cbd190c04ef-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                        <label className="text-[11px] font-bold uppercase text-muted-foreground" data-api-unique-id='importfrom1688view-r53c2fb1b2a2aeac0-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>供应商</label>
                                        <Input className="h-10 text-sm" value={state.editForm.supplierName} onChange={e => handlers.handleEditFormChange('supplierName', e.target.value)} data-api-unique-id='importfrom1688view-ra2a1703624d90819-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' />
                                      </div>
                                      <div className="space-y-1.5" data-api-unique-id='importfrom1688view-r8f1dc39c36a52932-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                        <label className="text-[11px] font-bold uppercase text-muted-foreground" data-api-unique-id='importfrom1688view-rc89e8162c85ec065-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>来源分类</label>
                                        <Input className="h-10 text-sm" value={state.editForm.sourceCategoryName} onChange={e => handlers.handleEditFormChange('sourceCategoryName', e.target.value)} data-api-unique-id='importfrom1688view-rf3849560c1327fdd-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' />
                                      </div>
                                    </div>

                                    <div className="space-y-1.5" data-api-unique-id='importfrom1688view-rdf810643bce8821f-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                      <label className="text-[11px] font-bold uppercase text-muted-foreground" data-api-unique-id='importfrom1688view-r8a9388776c72f9f9-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>价格系数</label>
                                      <Input type="number" className="h-10 text-sm font-mono" value={state.editForm.coefficient} disabled data-api-unique-id='importfrom1688view-rc5c73c9e948e52c4-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' />
                                      <p className="text-[11px] text-muted-foreground">系统会按目标分类自动带出系数。</p>
                                    </div>

                                    <div className="space-y-1.5" data-api-unique-id='importfrom1688view-r5972ea40c20a75fa-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                      <label className="text-[11px] font-bold uppercase text-muted-foreground" data-api-unique-id='importfrom1688view-r195752b4dbfbbf76-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>商品详情</label>
                                      <Textarea className="min-h-[96px] text-sm resize-none" value={state.editForm.productDetail} onChange={e => handlers.handleEditFormChange('productDetail', e.target.value)} data-api-unique-id='importfrom1688view-r37be5ebde345da55-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' />
                                    </div>

                                    <div className="space-y-1.5" data-api-unique-id='importfrom1688view-r66cd6f882abf15a7-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                      <label className="text-[11px] font-bold uppercase text-muted-foreground" data-api-unique-id='importfrom1688view-rfad933c03f3f924d-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>SKU 摘要</label>
                                      <Textarea className="min-h-[72px] text-sm resize-none" value={state.editForm.skuSummaryText} onChange={e => handlers.handleEditFormChange('skuSummaryText', e.target.value)} data-api-unique-id='importfrom1688view-rbee49af66498bf71-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' />
                                    </div>

                                    <Separator data-api-unique-id='importfrom1688view-r3380f4e55d57c13a-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' />

                                    <Button className="w-full bg-accent hover:bg-accent text-accent-foreground font-bold h-11" onClick={handlers.handleSaveCorrection} disabled={state.isSavingCorrection || !!state.activeItemDetails.item_isPublished} data-api-unique-id='importfrom1688view-rd57187cfc4be7d4c-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                      <Save className="w-4 h-4 mr-2" data-api-unique-id='importfrom1688view-ra7b1e37c4d5bde0c-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' />
                                      保存待上传修正
                                    </Button>
                                  </div>;
                          })() : null}
                            </CardContent>
                          </ScrollArea>
                        </Card>
                      </div>
                    </>}
                </TabsContent>

                <TabsContent value="history" className="space-y-6 mt-0" data-api-unique-id='importfrom1688view-r1a24a6b405ddae47-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                  <Card className="border-border shadow-sm" data-api-unique-id='importfrom1688view-r6c6444813581671f-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                    <CardContent className="p-0" data-api-unique-id='importfrom1688view-r4e0e2e43c9752e5a-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                      <div className="p-4 border-b bg-secondary/10 flex flex-wrap gap-4 items-center" data-api-unique-id='importfrom1688view-r88951c6f34201ad6-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                        <div className="flex items-center gap-2" data-api-unique-id='importfrom1688view-r6054777b4ba4f120-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                          <span className="text-sm font-medium text-muted-foreground" data-api-unique-id='importfrom1688view-re20a1d334b74160d-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>任务状态筛选:</span>
                          <Select value={state.historyStatusFilter} onValueChange={val => handlers.setHistoryStatusFilter(val as ImportTaskStatusType | 'ALL')} data-api-unique-id='importfrom1688view-rbeab4f3e165ff490-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                            <SelectTrigger className="w-[180px] h-9" data-api-unique-id='importfrom1688view-rdeac4039d7244620-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                              <SelectValue placeholder="全部状态" data-api-unique-id='importfrom1688view-r1ad15f910c4b2f86-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' />
                            </SelectTrigger>
                            <SelectContent data-api-unique-id='importfrom1688view-r51b9bd9ce39ed2a4-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                              <SelectItem value="ALL" className="rounded-none" data-api-unique-id='importfrom1688view-r06b22be10057141c-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>全部状态</SelectItem>
                              {Object.entries(TASK_STATUS_LABELS).map(([val, label], index) => <SelectItem key={val} value={val} className="rounded-none" data-api-unique-id='importfrom1688view-r8324ef83414652a3-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>{label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="relative overflow-x-auto" data-api-unique-id='importfrom1688view-r9279f5e6ef721798-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                        <Table data-api-unique-id='importfrom1688view-r39c9985a9aafc864-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                          <TableHeader data-api-unique-id='importfrom1688view-r5c837a10cfb11642-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                            <TableRow className="bg-secondary/20 hover:bg-secondary/20 border-b" data-api-unique-id='importfrom1688view-r3889d50ec994f414-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                              <TableHead className="w-[180px] font-bold text-foreground" data-api-unique-id='importfrom1688view-r05ef0ae05b10271d-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>任务 ID</TableHead>
                              <TableHead className="font-bold text-foreground" data-api-unique-id='importfrom1688view-rcbfb2f05e3734cef-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>创建时间</TableHead>
                              <TableHead className="font-bold text-foreground" data-api-unique-id='importfrom1688view-rfe45e4cc787ea76c-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>状态与进度</TableHead>
                              <TableHead className="font-bold text-foreground" data-api-unique-id='importfrom1688view-rf1f15fb6d7494a3d-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>统计 (总/成/败)</TableHead>
                              <TableHead className="text-right font-bold text-foreground" data-api-unique-id='importfrom1688view-r1a05320405854f49-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>操作</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody data-api-unique-id='importfrom1688view-rac51a194179e2f2c-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                            {state.isLoadingHistory ? <TableRow data-api-unique-id='importfrom1688view-r4e938858b6ac4c04-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                <TableCell colSpan={5} className="h-60 text-center" data-api-unique-id='importfrom1688view-r3734d510cbf08bd7-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary mb-2" data-api-unique-id='importfrom1688view-re3bdb3db6cfe1415-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' />
                                  <span className="text-muted-foreground" data-api-unique-id='importfrom1688view-rfeccfad588548cec-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>历史加载中...</span>
                                </TableCell>
                              </TableRow> : state.historyList.length === 0 ? <TableRow data-api-unique-id='importfrom1688view-r1f92c2fa9b33b209-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                <TableCell colSpan={5} className="h-60 text-center text-muted-foreground" data-api-unique-id='importfrom1688view-rafb9dae42f5d54a5-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                                  暂无历史任务记录
                                </TableCell>
                              </TableRow> : state.historyList.map((task, index) => <TableRow key={task.task_id} className="hover:bg-muted/30" data-api-unique-id='importfrom1688view-rc841d9c11fb884ac-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>
                                  <TableCell className="font-mono text-xs font-bold" data-api-unique-id='importfrom1688view-rd5fefcece7f42c58-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>{task.task_id}</TableCell>
                                  <TableCell className="text-sm" data-api-unique-id='importfrom1688view-r87747835a62c0f0a-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>
                                    {new Date(task.task_createdAt).toLocaleString('zh-CN')}
                                  </TableCell>
                                  <TableCell data-api-unique-id='importfrom1688view-rd3a165372ef24f07-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>
                                    <div className="flex flex-col gap-2 min-w-[150px]" data-api-unique-id='importfrom1688view-r409294f72a63c5f4-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>
                                      <div className="flex items-center gap-2" data-api-unique-id='importfrom1688view-r4ac0800bdfad8d18-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>
                                        <Badge className={`${STATUS_COLOR_MAP[task.task_status]} shadow-none`} data-api-unique-id='importfrom1688view-r5ed426061a6ed00c-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>
                                          {TASK_STATUS_LABELS[task.task_status]}
                                        </Badge>
                                        <span className="text-xs font-mono font-bold text-primary" data-api-unique-id='importfrom1688view-re3a1a382a17d3ebe-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>{task.task_progressPercent}%</span>
                                      </div>
                                      <Progress value={task.task_progressPercent} className="h-1" data-api-unique-id='importfrom1688view-rac76904c271b1089-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1' />
                                    </div>
                                  </TableCell>
                                  <TableCell data-api-unique-id='importfrom1688view-r41174606938c0d5f-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>
                                    <div className="flex items-center gap-3" data-api-unique-id='importfrom1688view-r44fff27394c04122-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>
                                      <div className="text-xs font-bold flex flex-col" data-api-unique-id='importfrom1688view-r286c907bc03cc3d7-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>
                                        <span className="text-muted-foreground" data-api-unique-id='importfrom1688view-r62933e635b86995b-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>TOTAL: {task.task_sourceLinkCount}</span>
                                        <div className="flex gap-2" data-api-unique-id='importfrom1688view-rf2813d2f28863560-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>
                                          <span className="text-accent" data-api-unique-id='importfrom1688view-r2f276fc33b27d1eb-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>S: {task.task_successCount}</span>
                                          <span className="text-destructive" data-api-unique-id='importfrom1688view-r29d48ebd79d16ee7-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>F: {task.task_failureCount}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right" data-api-unique-id='importfrom1688view-ref731cbb269b5966-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>
                                    <div className="flex justify-end gap-2" data-api-unique-id='importfrom1688view-r8df9579f882167f1-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>
                                      <Button variant="outline" size="sm" className="h-8 text-xs font-bold" onClick={() => {}} data-api-unique-id='importfrom1688view-r54a035edae2c2b66-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>
                                        查看工作台
                                      </Button>
                                      {(task.task_status === 'COMPLETED' || task.task_status === 'FAILED') && <Button variant="destructive" size="sm" className="h-8 px-2" onClick={() => handlers.handleDeleteTask(task.task_id)} data-api-unique-id='importfrom1688view-ree9236585b6a88bc-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1'>
                                          <Trash2 className="w-4 h-4" data-api-unique-id='importfrom1688view-rcb3509db359146be-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' data-api-in-loop='1' />
                                        </Button>}
                                    </div>
                                  </TableCell>
                                </TableRow>)}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="p-4 border-t flex items-center justify-between bg-secondary/5" data-api-unique-id='importfrom1688view-rc8bd782b79590e54-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                        <p className="text-xs text-muted-foreground font-medium" data-api-unique-id='importfrom1688view-r88cfbc38016a7558-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                          显示第 <span className="text-foreground" data-api-unique-id='importfrom1688view-rce881c5cec0596e2-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>{(state.historyPage - 1) * 10 + 1}</span> 至 <span className="text-foreground" data-api-unique-id='importfrom1688view-r8456500aea7254b2-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>{Math.min(state.historyPage * 10, state.historyTotal)}</span> 条，共 <span className="text-foreground" data-api-unique-id='importfrom1688view-r154e024042b5b5c8-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>{state.historyTotal}</span> 条记录
                        </p>
                        <div className="flex items-center gap-2" data-api-unique-id='importfrom1688view-rd649af4b13de96d8-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                          <Button variant="outline" size="icon" className="w-8 h-8" disabled={state.historyPage <= 1} onClick={() => handlers.setHistoryPage(p => Math.max(1, p - 1))} data-api-unique-id='importfrom1688view-rb36eca8e78ab21d5-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                            <ChevronLeft className="w-4 h-4" data-api-unique-id='importfrom1688view-rb5ef769d540891af-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' />
                          </Button>
                          <div className="flex items-center gap-1.5 px-2" data-api-unique-id='importfrom1688view-r29c2e82857d44714-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                            <span className="text-sm font-bold" data-api-unique-id='importfrom1688view-r944079da0cb3c71b-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>{state.historyPage}</span>
                            <span className="text-xs text-muted-foreground" data-api-unique-id='importfrom1688view-r4ffdcab1c9d5d224-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>/</span>
                            <span className="text-xs text-muted-foreground" data-api-unique-id='importfrom1688view-r9f7b5e9b3a8732f7-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>{state.totalPages}</span>
                          </div>
                          <Button variant="outline" size="icon" className="w-8 h-8" disabled={state.historyPage >= state.totalPages} onClick={() => handlers.setHistoryPage(p => Math.min(state.totalPages, p + 1))} data-api-unique-id='importfrom1688view-r3d5669944a005483-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View'>
                            <ChevronRight className="w-4 h-4" data-api-unique-id='importfrom1688view-rccc08019450af0e6-s2347312783' data-api-unique-page-name='src/backend/components/ImportFrom1688View' />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </section>

      <AlertDialog open={state.feedbackDialog.open} onOpenChange={open => {
      if (!open) handlers.dismissFeedbackDialog();
    }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className={state.feedbackDialog.variant === 'error' ? 'text-destructive' : state.feedbackDialog.variant === 'success' ? 'text-accent-foreground' : ''}>
              {state.feedbackDialog.title}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>{state.feedbackDialog.description}</p>
                {state.feedbackDialog.details.length > 0 ? <ul className="list-disc space-y-1 pl-5 text-left">
                    {state.feedbackDialog.details.map((detail, index) => <li key={`${detail}-${index}`}>{detail}</li>)}
                  </ul> : null}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {state.feedbackDialog.variant === 'success' && state.feedbackDialog.title.includes('发布成功') ? (
              <AlertDialogAction asChild>
                <Link href={ProductManagement.path}>前往商品管理</Link>
              </AlertDialogAction>
            ) : null}
            <AlertDialogCancel onClick={handlers.dismissFeedbackDialog}>我知道了</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};
export default ImportFrom1688View;