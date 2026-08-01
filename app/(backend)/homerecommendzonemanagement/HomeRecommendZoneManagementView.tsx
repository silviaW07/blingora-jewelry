'use client'

import React, { useRef } from 'react'
import { 
  GripVertical, 
  Plus, 
  Edit2, 
  Copy, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle,
  Package,
  Layers,
  Settings2,
  Monitor,
  Smartphone,
  Search
} from 'lucide-react'
import type { HomeRecommendZoneManagementState, HomeRecommendZoneManagementHandlers } from '@/backend/hooks/useHomeRecommendZoneManagement'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import EditableImg from '@/@base/EditableImg'
import type { ZoneType } from '@/backend/actions/HomeRecommendZoneManagement'

interface Props {
  state: HomeRecommendZoneManagementState
  handlers: HomeRecommendZoneManagementHandlers
}

const ZONE_TYPE_LABELS: Record<ZoneType, string> = {
  PRODUCT: '商品专区',
  CATEGORY: '类目专区',
}

export const HomeRecommendZoneManagementView = ({ state, handlers }: Props) => {
  const isComposingRef = useRef(false)
  const totalPages = Math.ceil(state.total / state.pageSize)
  const modalTotalPages = Math.ceil(state.modalTotal / 10)

  // 计算选择器当前页全选状态
  const modalPageItems = state.drawerFormData.zoneType === 'PRODUCT' ? state.modalProducts : state.modalCategories
  const existingIdsInDrawer = state.drawerItems.map(i => i.entityId)
  const selectablePageItems = modalPageItems.filter(item => !existingIdsInDrawer.includes(item.id))
  const isAllModalSelected = selectablePageItems.length > 0 && selectablePageItems.every(item => state.modalSelectedItems.some(si => si.id === item.id))

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      {/* 顶栏控制区 */}
      <section className="w-full border-b bg-card" data-controller-name="页面标题与全局操作">
        <div className="container mx-auto px-8 py-6 flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-header font-bold tracking-tight">首页推荐专区管理</h1>
            <p className="text-sm text-muted-foreground font-body">编排商城首页的商品与类目推荐区块，支持动态布局与权重排序。</p>
          </div>
          <Button 
            onClick={() => handlers.onOpenDrawer(null)} 
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" /> 新增推荐专区
          </Button>
        </div>
      </section>

      {/* 核心数据网格 */}
      <section className="w-full" data-controller-name="推荐专区列表视图">
        <div className="container mx-auto px-8 py-8 space-y-6">
          <Card className="border-border shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-secondary/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[50px] text-center"></TableHead>
                    <TableHead className="font-header text-xs uppercase tracking-wider">专区标题</TableHead>
                    <TableHead className="font-header text-xs uppercase tracking-wider">展示类型</TableHead>
                    <TableHead className="font-header text-xs uppercase tracking-wider">终端布局</TableHead>
                    <TableHead className="font-header text-xs uppercase tracking-wider">数据绑定</TableHead>
                    <TableHead className="font-header text-xs uppercase tracking-wider w-[120px]">权重</TableHead>
                    <TableHead className="font-header text-xs uppercase tracking-wider w-[100px]">状态</TableHead>
                    <TableHead className="text-right font-header text-xs uppercase tracking-wider">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.loading && state.list.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">数据加载中...</TableCell>
                    </TableRow>
                  ) : state.list.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">暂无推荐专区数据</TableCell>
                    </TableRow>
                  ) : (
                    state.list.map((row, index) => (
                      <TableRow 
                        key={row.id}
                        draggable
                        onDragStart={() => handlers.onListDragStart(index)}
                        onDragEnter={() => handlers.onListDragEnter(index)}
                        onDragEnd={() => handlers.onListDragEnd()}
                        onDragOver={(e) => e.preventDefault()}
                        className="group transition-colors duration-200"
                      >
                        <TableCell className="text-center">
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-move opacity-0 group-hover:opacity-100 transition-opacity" />
                        </TableCell>
                        <TableCell className="font-medium text-foreground">{row.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal border-border bg-background text-secondary-foreground">
                            {row.zoneType === 'PRODUCT' ? <Package className="mr-1 h-3 w-3" /> : <Layers className="mr-1 h-3 w-3" />}
                            {ZONE_TYPE_LABELS[row.zoneType]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Monitor className="h-3 w-3" /> {row.pcCols}</span>
                            <span className="text-border">|</span>
                            <span className="flex items-center gap-1"><Smartphone className="h-3 w-3" /> {row.mobileCols}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs ${row.isBoundCollection ? 'text-accent font-medium' : 'text-muted-foreground'}`}>
                            {row.isBoundCollection ? '永久集合' : '自定义列表'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            defaultValue={row.sortWeight} 
                            onBlur={(e) => handlers.onWeightBlur(row.id, Number(e.target.value))}
                            className="h-8 text-xs px-3 focus-visible:ring-primary border-border"
                          />
                        </TableCell>
                        <TableCell>
                          <Switch 
                            checked={row.isActive} 
                            onCheckedChange={() => handlers.onToggleStatus(row.id, row.isActive)}
                            className="data-[state=checked]:bg-accent"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handlers.onOpenDrawer(row.id)} title="编辑">
                              <Edit2 className="h-4 w-4 text-secondary-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handlers.onOpenDrawer(row.id, true)} title="复制">
                              <Copy className="h-4 w-4 text-secondary-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handlers.onDeleteClick(row.id)} className="hover:bg-destructive/10 hover:text-destructive text-secondary-foreground" title="删除">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* 列表分页器 */}
          {state.total > 0 && (
            <div className="flex items-center justify-between px-2 py-4">
              <p className="text-sm text-muted-foreground">
                共 <span className="font-medium text-foreground">{state.total}</span> 条数据
              </p>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={state.page <= 1} 
                  onClick={() => handlers.onPageChange(state.page - 1)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1 text-sm font-medium">
                  <span className="text-primary">{state.page}</span>
                  <span className="text-muted-foreground">/</span>
                  <span>{totalPages}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={state.page >= totalPages} 
                  onClick={() => handlers.onPageChange(state.page + 1)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 专区配置抽屉 */}
      <Sheet open={state.drawerOpen} onOpenChange={handlers.onCloseDrawer}>
        <SheetContent className="sm:max-w-xl w-[90vw] flex flex-col p-0 border-l border-border bg-card">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle className="text-lg font-header font-bold">
              {state.editingId ? '编辑推荐专区' : '新增推荐专区'}
            </SheetTitle>
          </SheetHeader>
          
          <ScrollArea className="flex-1 px-6 py-6">
            {state.drawerLoading ? (
              <div className="space-y-4 py-8 text-center text-muted-foreground">加载中...</div>
            ) : (
              <div className="space-y-8 pb-12">
                {/* 基础信息 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground border-l-4 border-primary pl-2">
                    <Settings2 className="h-4 w-4 text-primary" /> 基础配置
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">专区标题</Label>
                      <Input 
                        value={state.drawerFormData.title} 
                        onChange={e => handlers.onDrawerFieldChange('title', e.target.value)} 
                        placeholder="例如：本周热门商品"
                        className="px-3"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">展示类型</Label>
                      <RadioGroup 
                        value={state.drawerFormData.zoneType} 
                        onValueChange={(val) => handlers.onDrawerFieldChange('zoneType', val as ZoneType)}
                        className="flex gap-4 pt-1"
                      >
                        <div className="flex items-center space-x-2 border rounded-md px-4 py-2 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-all">
                          <RadioGroupItem value="PRODUCT" id="t-prod" className="text-primary border-primary" />
                          <Label htmlFor="t-prod" className="cursor-pointer font-medium">商品专区</Label>
                        </div>
                        <div className="flex items-center space-x-2 border rounded-md px-4 py-2 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-all">
                          <RadioGroupItem value="CATEGORY" id="t-cat" className="text-primary border-primary" />
                          <Label htmlFor="t-cat" className="cursor-pointer font-medium">类目专区</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1">
                        <Monitor className="h-3 w-3" /> PC端列数
                      </Label>
                      <Input 
                        type="number" 
                        value={state.drawerFormData.pcCols} 
                        onChange={e => handlers.onDrawerFieldChange('pcCols', Number(e.target.value))} 
                        className="px-3"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1">
                        <Smartphone className="h-3 w-3" /> 手机端列数
                      </Label>
                      <Input 
                        type="number" 
                        value={state.drawerFormData.mobileCols} 
                        onChange={e => handlers.onDrawerFieldChange('mobileCols', Number(e.target.value))} 
                        className="px-3"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 items-end">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">排序权重</Label>
                      <Input 
                        type="number" 
                        value={state.drawerFormData.sortWeight} 
                        onChange={e => handlers.onDrawerFieldChange('sortWeight', Number(e.target.value))} 
                        className="px-3"
                      />
                    </div>
                    <div className="flex items-center gap-3 border rounded-md px-3 h-10 bg-secondary/20">
                      <Switch 
                        checked={state.drawerFormData.isActive} 
                        onCheckedChange={val => handlers.onDrawerFieldChange('isActive', val)} 
                        id="drawer-status"
                      />
                      <Label htmlFor="drawer-status" className="text-sm font-medium cursor-pointer">启用当前专区</Label>
                    </div>
                  </div>
                </div>

                {/* 集合绑定 */}
                {state.drawerFormData.zoneType === 'PRODUCT' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground border-l-4 border-accent pl-2">
                      <Package className="h-4 w-4 text-accent" /> 数据绑定（可选）
                    </div>
                    <div className="space-y-3 bg-accent/5 p-4 rounded-lg border border-accent/20">
                      <Label className="text-xs font-bold uppercase text-accent tracking-wider">集合名称</Label>
                      <Input 
                        value={state.drawerFormData.collectionName} 
                        onChange={e => handlers.onDrawerFieldChange('collectionName', e.target.value)}
                        placeholder="输入永久集合名称" 
                        className="bg-background px-3 border-accent/30 focus-visible:ring-accent"
                      />
                      <p className="text-[11px] text-accent/80 leading-relaxed italic">
                        提示：填写名称后，保存时将自动创建永久商品集合并绑定；留空则仅作为首页临时自定义列表。
                      </p>
                    </div>
                  </div>
                )}

                {/* 内容明细 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                      内容明细 <Badge variant="secondary" className="rounded-full px-2 py-0 h-5 min-w-[20px] justify-center">{state.drawerItems.length}</Badge>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handlers.onOpenSelector} 
                      className="h-8 text-xs border-dashed border-primary text-primary hover:bg-primary/5 hover:text-primary-foreground"
                    >
                      <Plus className="mr-1 h-3 w-3" /> 
                      {state.drawerFormData.zoneType === 'PRODUCT' ? '添加商品' : '添加类目'}
                    </Button>
                  </div>

                  {state.drawerItems.length === 0 ? (
                    <div className="h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 bg-secondary/20 border-muted">
                      <p className="text-sm text-muted-foreground">暂无内容，请点击上方按钮添加</p>
                    </div>
                  ) : (
                    <div className="border rounded-md overflow-hidden bg-background">
                      <Table>
                        <TableHeader className="bg-secondary/30">
                          <TableRow className="h-9">
                            <TableHead className="w-[60px]"></TableHead>
                            <TableHead className="text-[11px] uppercase tracking-wider font-header">预览</TableHead>
                            <TableHead className="text-[11px] uppercase tracking-wider font-header">名称/编码</TableHead>
                            <TableHead className="text-right text-[11px] uppercase tracking-wider font-header">操作</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {state.drawerItems.map((item, index) => (
                            <TableRow 
                              key={`${item.entityId}-${index}`}
                              draggable
                              onDragStart={() => handlers.onDrawerItemDragStart(index)}
                              onDragEnter={() => handlers.onDrawerItemDragEnter(index)}
                              onDragEnd={() => handlers.onDrawerItemDragEnd()}
                              onDragOver={(e) => e.preventDefault()}
                              className="group h-12"
                            >
                              <TableCell className="w-[40px] text-center">
                                <GripVertical className="h-3 w-3 text-muted-foreground/50 cursor-move group-hover:text-primary transition-colors" />
                              </TableCell>
                              <TableCell className="w-[60px] py-2">
                                <div className="w-10 h-10 rounded border overflow-hidden bg-muted flex items-center justify-center">
                                  <EditableImg 
                                    propKey={`drawer-item-${item.entityId}`}
                                    keywords={item.imageUrl}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </TableCell>
                              <TableCell className="py-2">
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium line-clamp-1">{item.name}</span>
                                  <span className="text-[10px] text-muted-foreground uppercase">{item.codeOrSku}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right py-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handlers.onDrawerItemRemove(index)}
                                  className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </ScrollArea>

          <SheetFooter className="p-6 border-t bg-card mt-auto flex-row items-center gap-3 justify-end sm:justify-end">
            <Button variant="outline" onClick={() => handlers.onCloseDrawer(false)} disabled={state.drawerSaving} className="px-6 border-border">取消</Button>
            <Button onClick={handlers.onDrawerSave} disabled={state.drawerSaving || state.drawerLoading} className="px-6 bg-primary text-primary-foreground hover:bg-primary/90 min-w-[120px]">
              {state.drawerSaving ? '保存中...' : '保存配置'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* 删除确认弹窗 */}
      <Dialog open={state.deleteOpen} onOpenChange={handlers.onCancelDelete}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-border bg-card">
          <div className="p-6 pt-8 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold font-header text-foreground">确认删除专区？</h3>
              <p className="text-sm text-muted-foreground leading-relaxed px-4">
                确定要删除该推荐专区吗？删除后首页对应的展示区块将被移除，此操作不可恢复。
              </p>
            </div>
          </div>
          <DialogFooter className="flex flex-row p-4 bg-secondary/20 border-t gap-3 sm:justify-center">
            <Button variant="outline" onClick={() => handlers.onCancelDelete(false)} disabled={state.deleteLoading} className="flex-1 bg-card border-border">
              取消
            </Button>
            <Button variant="destructive" onClick={handlers.onConfirmDelete} disabled={state.deleteLoading} className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {state.deleteLoading ? '正在删除...' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 选择器弹窗 */}
      <Dialog open={state.selectorOpen} onOpenChange={handlers.onCloseSelector}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 border-border bg-card overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="text-lg font-header font-bold flex items-center gap-2">
              {state.drawerFormData.zoneType === 'PRODUCT' ? <Package className="h-5 w-5" /> : <Layers className="h-5 w-5" />}
              {state.drawerFormData.zoneType === 'PRODUCT' ? '选择推荐商品' : '选择推荐类目'}
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-4 bg-secondary/20 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索名称、编码或SKU..."
                value={state.modalKeyword}
                onChange={(e) => handlers.onModalKeywordChange(e.target.value)}
                onCompositionStart={() => (isComposingRef.current = true)}
                onCompositionEnd={() => { isComposingRef.current = false }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isComposingRef.current) {
                    handlers.onModalSearch()
                  }
                }}
                className="pl-9 h-10 border-border focus-visible:ring-primary bg-background"
              />
            </div>
            
            {state.drawerFormData.zoneType === 'PRODUCT' && (
              <Select value={state.modalCategoryIdFilter} onValueChange={handlers.onModalCategoryFilterChange}>
                <SelectTrigger className="w-[220px] h-10 bg-background border-border">
                  <SelectValue placeholder="全部分类" />
                </SelectTrigger>
                <SelectContent className="rounded-md">
                  <SelectItem value="all">全部分类</SelectItem>
                  {state.modalFilterCategories.map(c => (
                    <SelectItem key={c.id} value={c.id} className="rounded-sm">
                      {c.parentName ? `${c.parentName} > ` : ''}{c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <Button onClick={handlers.onModalSearch} disabled={state.modalLoading} className="h-10 px-6">
              搜索
            </Button>
          </div>

          <div className="flex-1 overflow-auto px-6 py-2">
            {state.modalLoading ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">数据加载中...</div>
            ) : selectablePageItems.length === 0 && existingIdsInDrawer.length >= modalPageItems.length && modalPageItems.length > 0 ? (
               <div className="h-64 flex items-center justify-center flex-col gap-2">
                 <AlertCircle className="h-8 w-8 text-muted-foreground/30" />
                 <p className="text-sm text-muted-foreground">该页数据均已在已选列表中</p>
               </div>
            ) : modalPageItems.length === 0 ? (
               <div className="h-64 flex items-center justify-center text-muted-foreground">未检索到相关结果</div>
            ) : (
              <Table className="relative">
                <TableHeader className="bg-background sticky top-0 z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.1)]">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={isAllModalSelected}
                        onCheckedChange={(checked) => handlers.onModalToggleAll(!!checked)}
                        className="data-[state=checked]:bg-primary"
                      />
                    </TableHead>
                    <TableHead className="w-[80px] text-[11px] uppercase tracking-wider font-header">预览图</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider font-header">基本资料</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider font-header">识别编码</TableHead>
                    <TableHead className="w-[100px] text-right text-[11px] uppercase tracking-wider font-header">状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modalPageItems.map(item => {
                    const isExisting = existingIdsInDrawer.includes(item.id)
                    const isSelected = state.modalSelectedItems.some(si => si.id === item.id)
                    const imageUrl = state.drawerFormData.zoneType === 'PRODUCT' ? (item as any).mainImageUrl : (item as any).imageUrl
                    const codeOrLevel = state.drawerFormData.zoneType === 'PRODUCT' ? (item as any).productCode : `LV-${(item as any).level}`
                    
                    return (
                      <TableRow key={item.id} className={isExisting ? 'bg-secondary/10 opacity-60' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={isExisting || isSelected}
                            disabled={isExisting}
                            onCheckedChange={(checked) => handlers.onModalToggleSelect(item as any, !!checked)}
                            className="data-[state=checked]:bg-primary"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="w-12 h-12 rounded border overflow-hidden bg-muted flex items-center justify-center">
                            <EditableImg 
                              propKey={`selector-item-${item.id}`}
                              keywords={imageUrl}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium line-clamp-1">{item.name}</span>
                            <span className="text-[10px] text-muted-foreground uppercase">{state.drawerFormData.zoneType === 'PRODUCT' ? 'Product Item' : 'Category Node'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-secondary-foreground">{codeOrLevel}</TableCell>
                        <TableCell className="text-right">
                          {isExisting ? (
                            <Badge variant="secondary" className="text-[10px] font-normal py-0">已在专区</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] font-normal py-0 text-accent border-accent/30 bg-accent/5">可选</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="px-6 py-4 border-t bg-secondary/5 flex justify-between items-center">
            <div className="flex items-center gap-4">
              {state.modalTotal > 0 && (
                <div className="flex items-center gap-1.5">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    disabled={state.modalPage <= 1} 
                    onClick={() => handlers.onModalPageChange(state.modalPage - 1)}
                    className="h-8 w-8 p-0 border-border"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm tabular-nums">
                    <span className="font-bold text-primary">{state.modalPage}</span> / {modalTotalPages}
                  </span>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    disabled={state.modalPage >= modalTotalPages} 
                    onClick={() => handlers.onModalPageChange(state.modalPage + 1)}
                    className="h-8 w-8 p-0 border-border"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <span className="text-xs text-muted-foreground border-l pl-4 border-border">
                已选中 <span className="font-bold text-foreground">{state.modalSelectedItems.length}</span> 项
              </span>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => handlers.onCloseSelector(false)} className="h-9 px-6 border-border">
                取消
              </Button>
              <Button onClick={handlers.onModalConfirm} disabled={state.modalSelectedItems.length === 0} className="h-9 px-6 bg-primary text-primary-foreground hover:bg-primary/90">
                确认添加所选
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
