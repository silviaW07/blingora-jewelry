'use client'

import React from 'react'
import type { ImportFrom1688State, ImportFrom1688Handlers } from '@/backend/hooks/useImportFrom1688'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { 
  RefreshCw, 
  PlusCircle, 
  History, 
  LayoutGrid, 
  ExternalLink, 
  AlertCircle, 
  Save, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Info,
  CheckCircle2
} from 'lucide-react'
import type { ProductStatusType, ImportTaskStatusType } from '@/backend/actions/ImportFrom1688'
import EditableImg from '@/@base/EditableImg'

const PRODUCT_STATUS_LABELS: Record<ProductStatusType, string> = {
  DRAFT: '草稿',
  ACTIVE: '上架',
  INACTIVE: '下架'
}

const TASK_STATUS_LABELS: Record<ImportTaskStatusType, string> = {
  PENDING: '待处理',
  RUNNING: '解析中',
  COMPLETED: '已完成',
  FAILED: '失败'
}

const STATUS_COLOR_MAP: Record<ImportTaskStatusType, string> = {
  PENDING: 'bg-muted text-muted-foreground',
  RUNNING: 'bg-primary text-primary-foreground',
  COMPLETED: 'bg-accent text-accent-foreground',
  FAILED: 'bg-destructive text-destructive-foreground'
}

interface Props {
  state: ImportFrom1688State
  handlers: ImportFrom1688Handlers
}

export const ImportFrom1688View = ({ state, handlers }: Props) => {
  return (
    <div className="flex flex-col min-h-screen bg-background font-body">
      {/* 顶部标题栏 */}
      <section className="border-b bg-card w-full" data-controller-name="页面标题与全局操作">
        <div className="container mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg">
              <LayoutGrid className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-header font-bold tracking-tight text-foreground">1688商品导入工作台</h1>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlers.handleGlobalRefresh} 
            disabled={state.isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${state.isRefreshing ? 'animate-spin' : ''}`} />
            手动刷新状态
          </Button>
        </div>
      </section>

      {/* 主内容区 */}
      <section className="flex-1 w-full" data-controller-name="导入任务工作台">
        <div className="container mx-auto px-8 py-8 grid grid-cols-12 gap-8 items-start">
          
          {/* 左侧：新建导入任务表单 */}
          <Card className="col-span-12 lg:col-span-3 shadow-sm border-border overflow-hidden h-fit">
            <CardHeader className="bg-secondary/50 border-b py-4">
              <CardTitle className="text-base font-header flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-primary" />
                新建导入任务
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-1">
                  1688 商品源链接
                  <Info className="w-3 h-3 text-muted-foreground" />
                </label>
                <Textarea
                  value={state.createForm.urls}
                  onChange={(e) => handlers.handleCreateFormChange('urls', e.target.value)}
                  placeholder="请输入 URL，支持多行批量粘贴"
                  className="min-h-[120px] resize-none focus-visible:ring-primary"
                />
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">默认分类</label>
                  <Select 
                    value={state.createForm.defaultCategoryId} 
                    onValueChange={(val) => handlers.handleCreateFormChange('defaultCategoryId', val)}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="选择导入分类" />
                    </SelectTrigger>
                    <SelectContent>
                      {state.categoryOptions.map(cat => (
                        <SelectItem key={cat.category_id} value={cat.category_id} className="rounded-none">
                          {cat.category_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">价格加价比例 (%)</label>
                  <Input
                    type="number"
                    value={state.createForm.markupRate}
                    onChange={(e) => handlers.handleCreateFormChange('markupRate', e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="20"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">默认导入状态</label>
                  <Select
                    value={state.createForm.defaultStatus}
                    onValueChange={(val) => handlers.handleCreateFormChange('defaultStatus', val as ProductStatusType)}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="选择状态" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRODUCT_STATUS_LABELS).map(([val, label]) => (
                        <SelectItem key={val} value={val} className="rounded-none">{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">默认库存数量</label>
                  <Input
                    type="number"
                    value={state.createForm.stockStrategyStock}
                    onChange={(e) => handlers.handleCreateFormChange('stockStrategyStock', e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="留空即不限库存"
                    className="h-10"
                  />
                </div>
              </div>

              <Button 
                className="w-full h-11 bg-primary hover:bg-primary text-primary-foreground font-semibold"
                onClick={handlers.handleCreateTask} 
                disabled={state.isSubmitting || !state.createForm.urls.trim()}
              >
                {state.isSubmitting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
                开始解析导入
              </Button>
            </CardContent>
          </Card>

          {/* 右侧：任务管控工作台 */}
          <div className="col-span-12 lg:col-span-9 space-y-6">
            <Tabs value={state.activeTab} onValueChange={handlers.setActiveTab} className="w-full">
              <div className="flex items-center justify-between mb-4 border-b pb-1">
                <TabsList className="bg-transparent h-auto p-0 gap-8">
                  <TabsTrigger 
                    value="current" 
                    className="px-0 py-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none text-base font-semibold"
                  >
                    当前任务处理
                  </TabsTrigger>
                  <TabsTrigger 
                    value="history" 
                    className="px-0 py-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none text-base font-semibold"
                  >
                    历史任务记录
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* 页签 A: 当前任务处理 */}
              <TabsContent value="current" className="space-y-6 mt-0">
                {!state.taskId || !state.currentTask ? (
                  <Card className="flex flex-col items-center justify-center py-20 text-center border-dashed border-2">
                    <div className="bg-muted p-4 rounded-full mb-4">
                      <LayoutGrid className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-lg">暂无活跃任务</CardTitle>
                    <CardDescription className="max-w-xs mx-auto mt-2">
                      请从左侧创建新任务，或者在“历史任务”中选择一个任务继续处理。
                    </CardDescription>
                  </Card>
                ) : state.isLoadingDetail ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <RefreshCw className="w-8 h-8 animate-spin text-primary mb-2" />
                    <p className="text-muted-foreground font-medium">深度解析详情中...</p>
                  </div>
                ) : (
                  <>
                    {/* 任务状态卡片 */}
                    <Card className="border-border shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center gap-6">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono font-bold px-2 py-0.5 bg-secondary text-secondary-foreground rounded uppercase tracking-wider">
                                ID: {state.currentTask.task_id}
                              </span>
                              <Badge className={`${STATUS_COLOR_MAP[state.currentTask.task_status]} shadow-none`}>
                                {TASK_STATUS_LABELS[state.currentTask.task_status]}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                创建于 {new Date(state.currentTask.task_createdAt).toLocaleString('zh-CN')}
                              </span>
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium">任务总体进度</span>
                                <span className="text-primary font-bold">{state.currentTask.task_progressPercent}%</span>
                              </div>
                              <Progress value={state.currentTask.task_progressPercent} className="h-2" />
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-8 border-l pl-8">
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground uppercase font-bold mb-1">总链接</p>
                              <p className="text-xl font-header font-bold">{state.currentTask.task_sourceLinkCount}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-accent uppercase font-bold mb-1">解析成功</p>
                              <p className="text-xl font-header font-bold text-accent">{state.currentTask.task_successCount}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-destructive uppercase font-bold mb-1">解析失败</p>
                              <p className="text-xl font-header font-bold text-destructive">{state.currentTask.task_failureCount}</p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 min-w-[160px]">
                            <Button 
                              size="sm"
                              className="w-full bg-primary hover:bg-primary text-primary-foreground font-bold"
                              onClick={handlers.handleConfirmImport} 
                              disabled={state.isConfirmingImport || state.selectedItemIds.length === 0 || state.currentTask.task_status !== 'COMPLETED'}
                            >
                              确认并导入 ({state.selectedItemIds.length})
                            </Button>
                            {state.currentTask.task_status === 'FAILED' && (
                              <Button variant="outline" size="sm" onClick={() => handlers.handleRetryTask(state.currentTask!.task_id)}>
                                重试全部任务
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 主从工作区 */}
                    <div className="grid grid-cols-12 gap-6 h-[600px]">
                      {/* 左侧列表 */}
                      <Card className="col-span-12 lg:col-span-8 overflow-hidden flex flex-col border-border">
                        <ScrollArea className="flex-1">
                          <Table className="relative">
                            <TableHeader className="bg-secondary/30 sticky top-0 z-10 backdrop-blur-sm">
                              <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[50px]">
                                  <Checkbox 
                                    checked={state.isAllSelected} 
                                    onCheckedChange={handlers.handleToggleSelectAll} 
                                    disabled={state.selectableItems.length === 0}
                                  />
                                </TableHead>
                                <TableHead className="w-[80px]">主图</TableHead>
                                <TableHead className="min-w-[200px]">商品信息</TableHead>
                                <TableHead>解析价格</TableHead>
                                <TableHead>状态</TableHead>
                                <TableHead className="text-right">操作</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {state.currentItems.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                                    暂无解析明细数据
                                  </TableCell>
                                </TableRow>
                              ) : (
                                state.currentItems.map(item => (
                                  <TableRow 
                                    key={item.item_id} 
                                    className={`cursor-pointer transition-colors ${state.activeItemId === item.item_id ? 'bg-primary/5' : ''}`}
                                    onClick={() => handlers.setActiveItemId(item.item_id)}
                                  >
                                    <TableCell onClick={e => e.stopPropagation()}>
                                      <Checkbox
                                        checked={state.selectedItemIds.includes(item.item_id)}
                                        onCheckedChange={(c) => handlers.handleToggleSelectItem(item.item_id, !!c)}
                                        disabled={!!item.item_failureReason || !!item.item_importedProductId}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <div className="w-12 h-12 rounded border overflow-hidden bg-muted">
                                        <EditableImg 
                                          propKey={`img-${item.item_id}`}
                                          keywords={item.item_parsedMainImageUrl || 'placeholder'}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    </TableCell>
                                    <TableCell className="max-w-[300px]">
                                      <div className="flex flex-col gap-1">
                                        <p className="text-sm font-semibold line-clamp-1">{item.item_parsedName || '未解析到名称'}</p>
                                        <div className="flex flex-wrap gap-1">
                                          {item.item_specSummaryJson?.slice(0, 2).map((s, idx) => (
                                            <Badge key={idx} variant="secondary" className="text-[10px] py-0 px-1 font-normal border-none">
                                              {s.name}: {s.values?.[0]}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <span className="font-mono text-sm font-bold text-foreground">
                                        ¥{item.item_parsedPriceMin} - {item.item_parsedPriceMax}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      {item.item_importedProductId ? (
                                        <Badge className="bg-accent text-accent-foreground border-none">已导入</Badge>
                                      ) : item.item_failureReason ? (
                                        <Badge className="bg-destructive text-destructive-foreground border-none">失败</Badge>
                                      ) : (
                                        <Badge variant="outline" className="text-accent border-accent">解析成功</Badge>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button variant="ghost" size="icon" asChild onClick={e => e.stopPropagation()}>
                                        <a href={item.item_sourceUrl} target="_blank" rel="noreferrer">
                                          <ExternalLink className="w-4 h-4 text-muted-foreground" />
                                        </a>
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      </Card>

                      {/* 右侧详情面板 */}
                      <Card className="col-span-12 lg:col-span-4 border-border overflow-hidden flex flex-col bg-card">
                        <ScrollArea className="flex-1">
                          <CardHeader className="bg-secondary/30 border-b py-3 px-4">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-tight">
                              详情与修正控制
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4">
                            {!state.activeItemId ? (
                              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                                <Info className="w-8 h-8 opacity-20" />
                                <p className="text-sm">点击左侧行开始操作</p>
                              </div>
                            ) : state.activeItemDetails ? (
                              state.activeItemDetails.item_failureReason ? (
                                <div className="space-y-6">
                                  <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive border rounded-md">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle className="font-bold">解析任务失败</AlertTitle>
                                    <AlertDescription className="text-xs mt-1 leading-relaxed">
                                      {state.activeItemDetails.item_failureReason}
                                    </AlertDescription>
                                  </Alert>
                                  <div className="space-y-4">
                                    <div className="p-3 bg-muted rounded border text-xs break-all font-mono">
                                      <p className="font-bold mb-1 uppercase opacity-50">Source URL:</p>
                                      {state.activeItemDetails.item_sourceUrl}
                                    </div>
                                    <Button 
                                      className="w-full bg-primary hover:bg-primary text-primary-foreground h-10"
                                      onClick={() => handlers.handleRetryTask(state.activeItemDetails!.item_importTaskId)}
                                    >
                                      <RefreshCw className="w-4 h-4 mr-2" />
                                      重试抓取此项
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-5">
                                  <div className="grid gap-4">
                                    <div className="space-y-1.5">
                                      <label className="text-[11px] font-bold uppercase text-muted-foreground">商品主图预览</label>
                                      <div className="aspect-square w-full rounded-md border overflow-hidden bg-muted group relative">
                                        <EditableImg 
                                          propKey="detail-preview"
                                          keywords={state.editForm.mainImageUrl || 'preview'}
                                          className="w-full h-full object-cover"
                                          needLargeImage
                                          description="商品主图预览"
                                        />
                                      </div>
                                    </div>
                                    
                                    <div className="space-y-1.5">
                                      <label className="text-[11px] font-bold uppercase text-muted-foreground">商品名称</label>
                                      <Input 
                                        className="h-10 text-sm"
                                        value={state.editForm.name} 
                                        onChange={(e) => handlers.handleEditFormChange('name', e.target.value)} 
                                      />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold uppercase text-muted-foreground">所属分类</label>
                                        <Select 
                                          value={state.editForm.categoryId} 
                                          onValueChange={(val) => handlers.handleEditFormChange('categoryId', val)}
                                        >
                                          <SelectTrigger className="h-10 text-xs">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {state.categoryOptions.map(cat => (
                                              <SelectItem key={cat.category_id} value={cat.category_id} className="rounded-none">
                                                {cat.category_name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold uppercase text-muted-foreground">建议售价</label>
                                        <Input 
                                          type="number" 
                                          className="h-10 text-sm font-mono"
                                          value={state.editForm.price} 
                                          onChange={(e) => handlers.handleEditFormChange('price', e.target.value === '' ? '' : Number(e.target.value))} 
                                        />
                                      </div>
                                    </div>

                                    <div className="space-y-1.5">
                                      <label className="text-[11px] font-bold uppercase text-muted-foreground">简要描述</label>
                                      <Textarea 
                                        className="min-h-[80px] text-sm resize-none"
                                        value={state.editForm.shortDescription} 
                                        onChange={(e) => handlers.handleEditFormChange('shortDescription', e.target.value)} 
                                      />
                                    </div>
                                  </div>

                                  <Separator />
                                  
                                  <Button 
                                    className="w-full bg-accent hover:bg-accent text-accent-foreground font-bold h-11"
                                    onClick={handlers.handleSaveCorrection} 
                                    disabled={state.isSavingCorrection || !!state.activeItemDetails.item_importedProductId}
                                  >
                                    <Save className="w-4 h-4 mr-2" />
                                    保存并应用修正
                                  </Button>
                                </div>
                              )
                            ) : null}
                          </CardContent>
                        </ScrollArea>
                      </Card>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* 页签 B: 历史任务记录 */}
              <TabsContent value="history" className="space-y-6 mt-0">
                <Card className="border-border shadow-sm">
                  <CardContent className="p-0">
                    <div className="p-4 border-b bg-secondary/10 flex flex-wrap gap-4 items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">任务状态筛选:</span>
                        <Select 
                          value={state.historyStatusFilter} 
                          onValueChange={(val) => handlers.setHistoryStatusFilter(val as ImportTaskStatusType | 'ALL')}
                        >
                          <SelectTrigger className="w-[180px] h-9">
                            <SelectValue placeholder="全部状态" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ALL" className="rounded-none">全部状态</SelectItem>
                            {Object.entries(TASK_STATUS_LABELS).map(([val, label]) => (
                              <SelectItem key={val} value={val} className="rounded-none">{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="relative overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-secondary/20 hover:bg-secondary/20 border-b">
                            <TableHead className="w-[180px] font-bold text-foreground">任务 ID</TableHead>
                            <TableHead className="font-bold text-foreground">创建时间</TableHead>
                            <TableHead className="font-bold text-foreground">状态与进度</TableHead>
                            <TableHead className="font-bold text-foreground">统计 (总/成/败)</TableHead>
                            <TableHead className="text-right font-bold text-foreground">操作</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {state.isLoadingHistory ? (
                            <TableRow>
                              <TableCell colSpan={5} className="h-60 text-center">
                                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
                                <span className="text-muted-foreground">历史加载中...</span>
                              </TableCell>
                            </TableRow>
                          ) : state.historyList.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="h-60 text-center text-muted-foreground">
                                暂无历史任务记录
                              </TableCell>
                            </TableRow>
                          ) : (
                            state.historyList.map(task => (
                              <TableRow key={task.task_id} className="hover:bg-muted/30">
                                <TableCell className="font-mono text-xs font-bold">{task.task_id}</TableCell>
                                <TableCell className="text-sm">
                                  {new Date(task.task_createdAt).toLocaleString('zh-CN')}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col gap-2 min-w-[150px]">
                                    <div className="flex items-center gap-2">
                                      <Badge className={`${STATUS_COLOR_MAP[task.task_status]} shadow-none`}>
                                        {TASK_STATUS_LABELS[task.task_status]}
                                      </Badge>
                                      <span className="text-xs font-mono font-bold text-primary">{task.task_progressPercent}%</span>
                                    </div>
                                    <Progress value={task.task_progressPercent} className="h-1" />
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div className="text-xs font-bold flex flex-col">
                                      <span className="text-muted-foreground">TOTAL: {task.task_sourceLinkCount}</span>
                                      <div className="flex gap-2">
                                        <span className="text-accent">S: {task.task_successCount}</span>
                                        <span className="text-destructive">F: {task.task_failureCount}</span>
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-8 text-xs font-bold"
                                      onClick={() => {}} 
                                    >
                                      查看工作台
                                    </Button>
                                    {(task.task_status === 'COMPLETED' || task.task_status === 'FAILED') && (
                                      <Button 
                                        variant="destructive" 
                                        size="sm" 
                                        className="h-8 px-2"
                                        onClick={() => handlers.handleDeleteTask(task.task_id)}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="p-4 border-t flex items-center justify-between bg-secondary/5">
                      <p className="text-xs text-muted-foreground font-medium">
                        显示第 <span className="text-foreground">{(state.historyPage - 1) * 10 + 1}</span> 至 <span className="text-foreground">{Math.min(state.historyPage * 10, state.historyTotal)}</span> 条，共 <span className="text-foreground">{state.historyTotal}</span> 条记录
                      </p>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="w-8 h-8"
                          disabled={state.historyPage <= 1} 
                          onClick={() => handlers.setHistoryPage(p => Math.max(1, p - 1))}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center gap-1.5 px-2">
                          <span className="text-sm font-bold">{state.historyPage}</span>
                          <span className="text-xs text-muted-foreground">/</span>
                          <span className="text-xs text-muted-foreground">{state.totalPages}</span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="w-8 h-8"
                          disabled={state.historyPage >= state.totalPages} 
                          onClick={() => handlers.setHistoryPage(p => Math.min(state.totalPages, p + 1))}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>
    </div>
  )
}
