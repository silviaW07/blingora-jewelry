'use client';

import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Info, Plus, Search, Package, Layers, Edit3, Trash2, AlertTriangle, ArrowRight, ImageIcon, GalleryHorizontal, ChevronRight } from 'lucide-react';
import EditableImg from '@/@base/EditableImg';
import { type CategoryManagementState, type CategoryManagementHandlers, useCategoryManagement, LEVEL_LABELS } from '@/backend/hooks/useCategoryManagement';
const STATUS_LABELS: Record<string, string> = {
  ACTIVE: '激活',
  INACTIVE: '停用',
  ALL: '全部'
};
interface Props {
  state: CategoryManagementState;
  handlers: CategoryManagementHandlers;
}
export const CategoryManagementView = ({
  state,
  handlers
}: Props) => {
  return <div className="min-h-screen bg-background font-body">
      <section className="w-full bg-card border-b" data-controller-name="分类管理头部">
        <div className="container mx-auto px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold font-header tracking-tight text-foreground flex items-center gap-2">
                <Layers className="w-6 h-6 text-primary" />
                分类管理
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                维护一级与二级目录结构、首页海报映射与前台类目展示顺序。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" onClick={() => handlers.openCreateDrawer(2)} className="border-slate-200 hover:bg-slate-50 font-medium">
                <Plus className="w-4 h-4 mr-2" />
                新增二级分类
              </Button>
              <Button onClick={() => handlers.openCreateDrawer(1)} className="bg-primary text-primary-foreground hover:bg-primary font-medium">
                <Plus className="w-4 h-4 mr-2" />
                新增一级分类
              </Button>
            </div>
          </div>

          <Alert className="mt-6 border-blue-100 bg-blue-50/50">
            <Info className="h-4 w-4 text-primary" />
            <AlertTitle className="text-primary font-bold">同步说明</AlertTitle>
            <AlertDescription className="text-secondary-foreground text-sm space-y-2">
              <div>前台仅展示状态为 <Badge variant="outline" className="bg-accent text-accent-foreground border-none px-1 h-5">{STATUS_LABELS.ACTIVE}</Badge> 的分类及其商品。</div>
              <div>一级分类可维护目录海报，二级分类需绑定到一级分类后才会在前台目录中展开显示。</div>
            </AlertDescription>
          </Alert>

          <Card className="mt-4 border-slate-200 shadow-sm" data-controller-name="子类快捷创建区">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-900">
                  <Plus className="w-4 h-4 text-primary" />
                  <p className="text-sm font-semibold">多子类快捷创建</p>
                </div>
                <p className="text-sm text-muted-foreground">需要连续补充多个子类时，可先选择一级分类，再反复使用同一入口快速新增，创建完成后会立即出现在下方目录预览。</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {state.parentOptions.length > 0 ? state.parentOptions.slice(0, 4).map(parent => <Button key={parent.category_id} variant="outline" onClick={() => handlers.openCreateDrawer(2, parent.category_id)} className="border-slate-200 hover:bg-slate-50">
                    <Plus className="w-4 h-4 mr-2" />
                    新增 {parent.category_name} 子类
                  </Button>) : <div className="text-sm text-muted-foreground">请先创建一级分类后再批量补充子类。</div>}
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="w-full bg-background" data-controller-name="筛选控制台">
        <div className="container mx-auto px-8 py-4 space-y-4">
          <Card className="p-2 border-slate-200 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Tabs value={state.status || 'ALL'} onValueChange={handlers.handleTabChange} className="w-auto">
                <TabsList className="bg-secondary h-10 p-1">
                  <TabsTrigger value="ALL" className="px-6 h-8 data-[state=active]:bg-card">全部</TabsTrigger>
                  <TabsTrigger value="ACTIVE" className="px-6 h-8 data-[state=active]:bg-card">{STATUS_LABELS.ACTIVE}</TabsTrigger>
                  <TabsTrigger value="INACTIVE" className="px-6 h-8 data-[state=active]:bg-card">{STATUS_LABELS.INACTIVE}</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center gap-2 flex-grow max-w-md">
                <div className="relative flex-grow">
                  <Input placeholder="搜索分类名称或标识..." className="h-10 pl-4 pr-10 border-slate-200 focus-visible:ring-primary" value={state.searchInput} onChange={e => handlers.setSearchInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handlers.handleSearch()} />
                </div>
                <Button onClick={handlers.handleSearch} variant="secondary" className="h-10 bg-secondary text-secondary-foreground hover:bg-muted border border-slate-200 px-6">
                  <Search className="w-4 h-4 mr-2" />
                  查询
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-slate-200 shadow-sm" data-controller-name="层级筛选区">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">目录层级</p>
                <p className="text-xs text-muted-foreground mt-1">在一级与二级分类之间快速切换，核对父子目录结构。</p>
              </div>
              <Tabs value={state.selectedLevelTab} onValueChange={value => handlers.handleLevelChange(value as 'ALL' | '1' | '2')} className="w-auto">
                <TabsList className="bg-secondary h-10 p-1">
                  <TabsTrigger value="ALL" className="px-5 h-8 data-[state=active]:bg-card">全部层级</TabsTrigger>
                  <TabsTrigger value="1" className="px-5 h-8 data-[state=active]:bg-card">一级分类</TabsTrigger>
                  <TabsTrigger value="2" className="px-5 h-8 data-[state=active]:bg-card">二级分类</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </Card>
        </div>
      </section>

      <section className="w-full bg-background" data-controller-name="分类数据表格">
        <div className="container mx-auto px-8 py-0">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="hover:bg-transparent border-slate-200">
                  <TableHead className="w-[120px] font-bold text-slate-700 h-12">分类主图</TableHead>
                  <TableHead className="font-bold text-slate-700 h-12">分类名称与标识</TableHead>
                  <TableHead className="w-[180px] font-bold text-slate-700 h-12">上级分类</TableHead>
                  <TableHead className="w-[120px] font-bold text-slate-700 h-12">层级</TableHead>
                  <TableHead className="w-[140px] font-bold text-slate-700 h-12">Banner 图</TableHead>
                  <TableHead className="font-bold text-slate-700 h-12">关联商品 / 子类</TableHead>
                  <TableHead className="w-[140px] font-bold text-slate-700 h-12">排序权重</TableHead>
                  <TableHead className="w-[160px] font-bold text-slate-700 h-12">当前状态</TableHead>
                  <TableHead className="w-[240px] text-right font-bold text-slate-700 h-12">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.isLoading ? <TableRow>
                    <TableCell colSpan={9} className="h-64 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        数据载入中...
                      </div>
                    </TableCell>
                  </TableRow> : state.list.length === 0 ? <TableRow>
                    <TableCell colSpan={9} className="h-64 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Package className="w-12 h-12 opacity-20" />
                        暂无符合条件的分类数据
                      </div>
                    </TableCell>
                  </TableRow> : state.list.map((item, index) => <TableRow key={item.category_id} className="hover:bg-slate-50/50 transition-colors border-slate-100">
                      <TableCell>
                        <div className="w-16 h-16 rounded-md overflow-hidden border border-slate-200 bg-slate-50">
                          <EditableImg propKey={`cat-img-${item.category_id}`} keywords={item.image_url || item.category_name} className="w-full h-full object-cover" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 leading-tight">{item.category_name}</span>
                            {item.level === 2 ? <ChevronRight className="w-3.5 h-3.5 text-slate-400" /> : null}
                          </div>
                          <code className="text-[11px] font-mono text-muted-foreground bg-slate-100 px-1.5 py-0.5 rounded w-fit uppercase">
                            {item.category_slug}
                          </code>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.parent_name ? <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-slate-800">{item.parent_name}</span>
                            <span className="text-[11px] text-muted-foreground">所属一级目录</span>
                          </div> : <span className="text-sm text-muted-foreground">— 顶级目录 —</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                          {LEVEL_LABELS[item.level]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.banner_image_url ? <div className="w-20 h-12 rounded-md overflow-hidden border border-slate-200 bg-slate-50">
                            <EditableImg propKey={`cat-banner-${item.category_id}`} keywords={item.banner_image_url} className="w-full h-full object-cover" />
                          </div> : <div className="w-20 h-12 rounded-md border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-[10px] text-muted-foreground">
                            未配置
                          </div>}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm text-slate-700">
                          <span><span className="font-semibold">{item.product_count}</span> 个商品</span>
                          <span className="text-xs text-muted-foreground">{item.child_count} 个子类</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input type="number" className="h-9 w-24 text-center border-slate-200 focus:border-primary" value={state.weightInputs[item.category_id] ?? item.sort_weight} onChange={e => handlers.handleInlineWeightChange(item.category_id, e.target.value)} onBlur={() => handlers.handleInlineWeightBlur(item)} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Switch checked={item.status === 'ACTIVE'} onCheckedChange={checked => handlers.handleInlineStatusChange(item, checked)} className="data-[state=checked]:bg-accent" />
                          <Badge variant={item.status === 'ACTIVE' ? 'default' : 'secondary'} className={`${item.status === 'ACTIVE' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'} border-none rounded-sm px-2 py-0 h-6 text-[11px] font-bold`}>
                            {STATUS_LABELS[item.status]}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end flex-wrap gap-2">
                          {item.level === 1 ? <Button variant="ghost" size="sm" className="h-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={() => handlers.openPosterDrawer(item)}>
                              <GalleryHorizontal className="w-3.5 h-3.5 mr-1" />
                              海报配置
                            </Button> : null}
                          {item.level === 1 ? <Button variant="ghost" size="sm" className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => handlers.openCreateDrawer(2, item.category_id)}>
                              <Plus className="w-3.5 h-3.5 mr-1" />
                              新增子类
                            </Button> : null}
                          <Button variant="ghost" size="sm" className="h-8 text-primary hover:text-primary hover:bg-primary/10" onClick={() => handlers.navigateToDetail(item.category_id)}>
                            <Edit3 className="w-3.5 h-3.5 mr-1" />
                            编辑
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handlers.setDeleteItem(item)}>
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            删除
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>)}
              </TableBody>
            </Table>
          </Card>
        </div>
      </section>

      <Sheet open={state.isDrawerOpen} onOpenChange={open => !open && handlers.closeDrawer()}>
        <SheetContent className="sm:max-w-[620px] p-0 flex flex-col gap-0 border-l border-slate-200 shadow-2xl overflow-hidden">
          <SheetHeader className="px-8 py-6 border-b bg-slate-50/50">
            <SheetTitle className="text-xl font-header font-bold flex items-center gap-2">
              {state.editingId ? <Edit3 className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
              {state.editingId ? '编辑分类详情' : '创建新分类'}
            </SheetTitle>
          </SheetHeader>

          <form onSubmit={e => {
          e.preventDefault();
          handlers.submitForm();
        }} className="flex-grow overflow-auto pb-24">
            <fieldset disabled={state.isSubmitting} className="p-8 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-l-4 border-primary pl-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">基础配置</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">分类名称</label>
                    <Input placeholder="例如：电子产品" className="h-10 border-slate-200 focus-visible:ring-primary" value={state.formData.category_name} onChange={e => handlers.handleFormChange('category_name', e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">唯一标识 (Slug)</label>
                    <Input placeholder="electronics-gadgets" className="h-10 border-slate-200 font-mono text-sm focus-visible:ring-primary uppercase" value={state.formData.category_slug} onChange={e => handlers.handleFormChange('category_slug', e.target.value)} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">分类层级</label>
                    <Select value={String(state.formData.level)} onValueChange={value => handlers.handleFormChange('level', Number(value) as 1 | 2)}>
                      <SelectTrigger className="h-10 border-slate-200 focus:ring-primary">
                        <SelectValue placeholder="请选择分类层级" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">一级分类</SelectItem>
                        <SelectItem value="2">二级分类</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">上级分类</label>
                    <Select value={state.formData.parent_id || 'none'} onValueChange={value => handlers.handleFormChange('parent_id', value === 'none' ? null : value)} disabled={state.formData.level !== 2}>
                      <SelectTrigger className="h-10 border-slate-200 focus:ring-primary">
                        <SelectValue placeholder={state.formData.level === 2 ? '请选择一级分类' : '一级分类无需选择上级'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">无上级分类</SelectItem>
                        {state.parentOptions.map((option, index) => <SelectItem key={option.category_id} value={option.category_id}>{option.category_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 border-l-4 border-primary pl-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">视觉媒体</h3>
                </div>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">分类主图 URL</label>
                    <Input placeholder="https://..." className="h-10 border-slate-200 focus-visible:ring-primary" value={state.formData.image_url} onChange={e => handlers.handleFormChange('image_url', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Banner 图 URL</label>
                    <Input placeholder="https://..." className="h-10 border-slate-200 focus-visible:ring-primary" value={state.formData.banner_image_url} onChange={e => handlers.handleFormChange('banner_image_url', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative aspect-video rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                      {state.formData.image_url ? <EditableImg propKey="category-drawer-preview" keywords={state.formData.image_url} className="w-full h-full object-contain" needLargeImage description={state.formData.category_name} /> : <div className="flex flex-col items-center gap-2 text-muted-foreground opacity-50">
                          <Layers className="w-10 h-10" />
                          <span className="text-sm">主图预览</span>
                        </div>}
                    </div>
                    <div className="relative aspect-video rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                      {state.formData.banner_image_url ? <EditableImg propKey="category-banner-preview" keywords={state.formData.banner_image_url} className="w-full h-full object-contain" needLargeImage description={`${state.formData.category_name} banner`} /> : <div className="flex flex-col items-center gap-2 text-muted-foreground opacity-50">
                          <ImageIcon className="w-10 h-10" />
                          <span className="text-sm">Banner 预览</span>
                        </div>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 border-l-4 border-primary pl-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">业务属性</h3>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">分类详细说明</label>
                    <Textarea placeholder="描述该分类包含的主要商品类型及前台展示逻辑..." className="min-h-[100px] border-slate-200 focus-visible:ring-primary resize-none" value={state.formData.description} onChange={e => handlers.handleFormChange('description', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-8 items-end">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">排序权重</label>
                      <Input type="number" className="h-10 border-slate-200 focus-visible:ring-primary" value={state.formData.sort_weight} onChange={e => handlers.handleFormChange('sort_weight', parseInt(e.target.value, 10) || 0)} required />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-500 uppercase">当前状态</span>
                        <span className="text-[10px] text-muted-foreground">控制前台可见性</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={state.formData.status === 'ACTIVE'} onCheckedChange={checked => handlers.handleFormChange('status', checked ? 'ACTIVE' : 'INACTIVE')} className="data-[state=checked]:bg-accent" />
                        <span className={`text-xs font-bold ${state.formData.status === 'ACTIVE' ? 'text-accent' : 'text-slate-400'}`}>
                          {STATUS_LABELS[state.formData.status]}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </fieldset>

            <SheetFooter className="absolute bottom-0 left-0 right-0 p-6 border-t bg-card flex flex-row items-center justify-end gap-3 z-10">
              <Button type="button" variant="outline" onClick={handlers.closeDrawer} disabled={state.isSubmitting} className="px-8 border-slate-200 hover:bg-slate-50">
                取消操作
              </Button>
              <Button type="submit" disabled={state.isSubmitting} className="px-8 bg-primary text-primary-foreground hover:bg-primary">
                {state.isSubmitting ? '正在同步...' : '保存并同步'}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={state.isPosterDrawerOpen} onOpenChange={open => !open && handlers.closePosterDrawer()}>
        <SheetContent className="sm:max-w-[720px] p-0 flex flex-col gap-0 border-l border-slate-200 shadow-2xl overflow-hidden">
          <SheetHeader className="px-8 py-6 border-b bg-slate-50/60">
            <SheetTitle className="text-xl font-header font-bold flex items-center gap-2">
              <GalleryHorizontal className="w-5 h-5 text-primary" />
              {state.posterForm ? `${state.posterForm.category_name} · 目录海报配置` : '目录海报配置'}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-auto p-8 space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">海报列表</p>
                <p className="text-xs text-muted-foreground mt-1">维护首页目录轮播图，系统会将当前配置写入对应目录的海报映射。</p>
              </div>
              <Button type="button" variant="outline" className="border-slate-200 hover:bg-slate-50" onClick={handlers.addPosterItem}>
                <Plus className="w-4 h-4 mr-2" />
                新增海报项
              </Button>
            </div>

            <div className="space-y-4">
              {state.posterForm?.items.map((item, index) => <Card key={item.id} className="border-slate-200 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="text-sm font-bold text-slate-900">海报项 #{index + 1}</p>
                      <p className="text-xs text-muted-foreground mt-1">支持标题、图片链接、跳转地址与排序控制。</p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handlers.removePosterItem(item.id)}>
                      <Trash2 className="w-4 h-4 mr-1" />
                      删除
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">海报标题</label>
                      <Input value={item.title} onChange={e => handlers.updatePosterItem(item.id, 'title', e.target.value)} placeholder="例如：夏日新品首发" className="h-10 border-slate-200 focus-visible:ring-primary" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">跳转链接</label>
                      <Input value={item.link || ''} onChange={e => handlers.updatePosterItem(item.id, 'link', e.target.value)} placeholder="/category/xxx 或活动链接" className="h-10 border-slate-200 focus-visible:ring-primary" />
                    </div>
                  </div>
                  <div className="grid grid-cols-[1fr_220px] gap-4 mt-4 items-start">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">海报图片 URL</label>
                        <Input value={item.image_url} onChange={e => handlers.updatePosterItem(item.id, 'image_url', e.target.value)} placeholder="https://..." className="h-10 border-slate-200 focus-visible:ring-primary" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase">排序权重</label>
                          <Input type="number" value={item.sort_weight} onChange={e => handlers.updatePosterItem(item.id, 'sort_weight', parseInt(e.target.value, 10) || 0)} className="h-10 border-slate-200 focus-visible:ring-primary" />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 mt-6">
                          <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">启用状态</p>
                            <p className="text-[10px] text-muted-foreground">控制前台轮播是否展示</p>
                          </div>
                          <Switch checked={item.is_active} onCheckedChange={checked => handlers.updatePosterItem(item.id, 'is_active', checked)} className="data-[state=checked]:bg-accent" />
                        </div>
                      </div>
                    </div>
                    <div className="aspect-[4/3] rounded-xl border border-dashed border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                      {item.image_url ? <EditableImg propKey={`poster-drawer-${item.id}`} keywords={item.image_url} className="w-full h-full object-cover" needLargeImage description={item.title || 'category poster'} /> : <div className="flex flex-col items-center gap-2 text-muted-foreground opacity-50">
                          <ImageIcon className="w-8 h-8" />
                          <span className="text-xs">海报预览</span>
                        </div>}
                    </div>
                  </div>
                </Card>)}
            </div>
          </div>
          <SheetFooter className="p-6 border-t bg-card flex flex-row items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={handlers.closePosterDrawer} disabled={state.isSavingPoster} className="px-8 border-slate-200 hover:bg-slate-50">
              取消
            </Button>
            <Button type="button" onClick={handlers.savePosterConfig} disabled={state.isSavingPoster} className="px-8 bg-primary text-primary-foreground hover:bg-primary">
              {state.isSavingPoster ? '正在保存...' : '保存海报配置'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!state.deleteItem} onOpenChange={open => !open && handlers.setDeleteItem(null)}>
        <AlertDialogContent className="max-w-[420px] border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-destructive/10 p-6 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-destructive flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-destructive-foreground" />
            </div>
            <AlertDialogTitle className="text-lg font-bold text-destructive">
              删除操作确认
            </AlertDialogTitle>
          </div>

          <div className="p-6">
            <AlertDialogDescription className="text-center text-slate-600 leading-relaxed">
              {state.deleteItem && (state.deleteItem.product_count > 0 || state.deleteItem.child_count > 0) ? <div className="space-y-4">
                  <p className="font-medium text-slate-900">
                    无法删除分类: <span className="underline decoration-destructive decoration-2">{state.deleteItem.category_name}</span>
                  </p>
                  <Alert variant="destructive" className="text-left py-2 px-3 border-none bg-destructive/10">
                    <Info className="w-4 h-4 text-destructive" />
                    <AlertDescription className="text-xs font-bold space-y-1">
                      {state.deleteItem.child_count > 0 ? <div>该分类下仍存在 <span className="text-base mx-1">{state.deleteItem.child_count}</span> 个子分类，请先迁移或删除子分类。</div> : null}
                      {state.deleteItem.product_count > 0 ? <div>该分类下关联了 <span className="text-base mx-1">{state.deleteItem.product_count}</span> 个商品，请先将商品改绑至其他分类。</div> : null}
                    </AlertDescription>
                  </Alert>
                </div> : <>
                  确定要彻底删除分类 <span className="font-bold text-slate-900">"{state.deleteItem?.category_name}"</span> 吗？此操作会导致该类目信息永久消失，无法撤销。
                </>}
            </AlertDialogDescription>
          </div>

          <AlertDialogFooter className="p-6 pt-0 flex sm:justify-center gap-3">
            <AlertDialogCancel disabled={state.isDeleting} className="flex-grow border-slate-200 hover:bg-slate-50 m-0">
              放弃
            </AlertDialogCancel>
            <AlertDialogAction onClick={e => {
            e.preventDefault();
            handlers.confirmDelete();
          }} disabled={state.isDeleting || (state.deleteItem?.product_count ?? 0) > 0 || (state.deleteItem?.child_count ?? 0) > 0} className="flex-grow bg-destructive text-destructive-foreground hover:bg-destructive m-0">
              {state.isDeleting ? '处理中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};
export default function CategoryManagementPage() {
  const {
    state,
    handlers
  } = useCategoryManagement();
  return <CategoryManagementView state={state} handlers={handlers} />;
}
