'use client';

import React from 'react';
import { Search, RotateCcw, Plus, Trash2, Package, ArrowUpCircle, ArrowDownCircle, Info, Layers, Image as ImageIcon, Settings2, AlertCircle, TableProperties, Upload, Building2, FileSpreadsheet, Percent, Coins, FolderTree, DollarSign, Sparkles, Tags } from 'lucide-react';
import { Button, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Checkbox, Sheet, SheetContent, SheetHeader, SheetTitle, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, Textarea, Badge, Card, CardContent, Separator, Alert, AlertTitle, AlertDescription, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/backend/components/ui';
import EditableImg from '@/@base/EditableImg';
import type { ProductManagementState, ProductManagementHandlers } from '@/backend/hooks/useProductManagement';
import type { ProductStatus, ProductSource, GoodsStatus as ManagementGoodsStatus } from '@/backend/types/ProductManagement';
const STATUS_CONFIG: Record<ProductStatus, {
  label: string;
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
  color: string;
}> = {
  DRAFT: {
    label: '草稿',
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
  IN_STOCK: {
    label: '现货',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-100'
  },
  LOW_STOCK: {
    label: '备货中',
    className: 'bg-amber-50 text-amber-700 border-amber-100'
  }
};
const SOURCE_CONFIG: Record<ProductSource, {
  label: string;
  icon: React.ReactNode;
}> = {
  MANUAL: {
    label: '手动创建',
    icon: <Package className="w-3 h-3 mr-1" />
  },
  IMPORT_1688: {
    label: '1688导入',
    icon: <Layers className="w-3 h-3 mr-1" />
  },
  TABLE_IMPORT: {
    label: '表格导入',
    icon: <TableProperties className="w-3 h-3 mr-1" />
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
  const hasSelected = state.selectedIds.length > 0;
  return <div className="min-h-screen bg-background font-body text-foreground">
      <section className="w-full bg-white border-b" data-controller-name="商品检索与筛选">
        <div className="container mx-auto px-8 py-6">
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(220px,1fr)_220px_180px_180px_150px_160px_auto] gap-4 items-end">
            <div className="min-w-[240px]">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">商品名称 / 关键词</label>
              <Input className="h-10 px-3" placeholder="搜索商品名称、SKU基础编码..." value={state.filterKeyword} onChange={e => handlers.setFilterKeyword(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">类目层级</label>
              <Select value={state.filterCategoryId} onValueChange={handlers.setFilterCategoryId}>
                <SelectTrigger className="h-10"><SelectValue placeholder="全部分类" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">全部分类</SelectItem>
                  {state.categoryOptions.map((c, index) => <SelectItem key={c.category_id} value={c.category_id}>{c.category_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">供应商</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input className="h-10 pl-9" placeholder="按供应商名称筛选" value={state.filterSupplierName} onChange={e => handlers.setFilterSupplierName(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">品牌关键词 / Brand Keyword</label>
              <Input className="h-10 px-3" placeholder="按品牌关键词筛选" value={state.filterBrandKeyword} onChange={e => handlers.setFilterBrandKeyword(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">运营状态</label>
              <Select value={state.filterStatus} onValueChange={handlers.setFilterStatus}>
                <SelectTrigger className="h-10"><SelectValue placeholder="全部状态" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">全部状态</SelectItem>
                  <SelectItem value="DRAFT">草稿</SelectItem>
                  <SelectItem value="ACTIVE">已上架</SelectItem>
                  <SelectItem value="INACTIVE">已下架</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">后台状态筛选</label>
              <Select value={state.filterManagementStatus} onValueChange={handlers.setFilterManagementStatus}>
                <SelectTrigger className="h-10"><SelectValue placeholder="默认展示上架/下架" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">已上架 + 已下架</SelectItem>
                  <SelectItem value="ACTIVE">仅看已上架</SelectItem>
                  <SelectItem value="INACTIVE">仅看已下架</SelectItem>
                  <SelectItem value="DELETED">已删除（回收站）</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 mb-[1px]">
              <Button variant="outline" className="h-10 px-4 border-slate-200 hover:bg-secondary hover:text-secondary-foreground" onClick={handlers.handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />重置
              </Button>
              <Button className="h-10 px-6 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handlers.handleSearch}>
                <Search className="w-4 h-4 mr-2" />查询
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full" data-controller-name="商品批量管控">
        <div className="container mx-auto px-8 py-6">
          <Card className="mb-6 border-primary/15 shadow-sm" data-controller-name="首页推荐关键词维护">
          </Card>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" className="h-9 border-slate-200" disabled={!hasSelected} onClick={() => handlers.openConfirmDialog('ACTIVE', state.selectedIds)}>
                <ArrowUpCircle className="w-4 h-4 mr-2 text-emerald-600" />批量上架
              </Button>
              <Button variant="outline" size="sm" className="h-9 border-slate-200" disabled={!hasSelected} onClick={() => handlers.openConfirmDialog('INACTIVE', state.selectedIds)}>
                <ArrowDownCircle className="w-4 h-4 mr-2 text-amber-600" />批量下架
              </Button>
              <Button variant="outline" size="sm" className="h-9 border-slate-200" disabled={!hasSelected} onClick={() => handlers.openConfirmDialog('PRICE_COEFFICIENT', state.selectedIds)}>
                <Percent className="w-4 h-4 mr-2 text-primary" />批量调价
              </Button>
              <Button variant="outline" size="sm" className="h-9 border-slate-200" disabled={!hasSelected} onClick={() => handlers.openConfirmDialog('CATEGORY', state.selectedIds)}>
                <FolderTree className="w-4 h-4 mr-2 text-primary" />批量修改分类
              </Button>
              <Button variant="outline" size="sm" className="h-9 border-slate-200" disabled={!hasSelected} onClick={() => handlers.openConfirmDialog('MANAGEMENT_STATUS', state.selectedIds)}>
                <Tags className="w-4 h-4 mr-2 text-amber-600" />批量修改状态
              </Button>
              <Button variant="outline" size="sm" className="h-9 border-slate-200" disabled={!hasSelected} onClick={() => handlers.openConfirmDialog('WEIGHT_PRICE', state.selectedIds)}>
                <DollarSign className="w-4 h-4 mr-2 text-sky-600" />批量修改价格重量
              </Button>
              <Button variant="outline" size="sm" className="h-9 border-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground" disabled={!hasSelected} onClick={() => handlers.openConfirmDialog('DELETE', state.selectedIds)}>
                <Trash2 className="w-4 h-4 mr-2" />批量删除
              </Button>
              {hasSelected && <span className="ml-2 text-sm text-muted-foreground font-medium animate-in fade-in slide-in-from-left-2">已选择 <span className="text-primary">{state.selectedIds.length}</span> 项</span>}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="h-10 border-dashed border-slate-300 bg-slate-50/70" onClick={() => handlers.setBatchImportOpen(true)}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />上传 Excel/CSV 导入草稿
              </Button>
              <Button className="h-10 bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all" onClick={handlers.handleOpenCreate}>
                <Plus className="w-4 h-4 mr-2" />新增跨境商品
              </Button>
            </div>
          </div>

          <Card className="border-none shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[50px] pl-6"><Checkbox checked={state.list.length > 0 && state.selectedIds.length === state.list.length} onCheckedChange={checked => handlers.handleSelectAll(!!checked)} /></TableHead>
                  <TableHead className="font-header font-bold text-slate-700 min-w-[260px]">商品详情 / SKU</TableHead>
                  <TableHead className="font-header font-bold text-slate-700">来源</TableHead>
                  <TableHead className="font-header font-bold text-slate-700">供应商</TableHead>
                  <TableHead className="font-header font-bold text-slate-700 min-w-[180px]">主类目 / 系数</TableHead>
                  <TableHead className="font-header font-bold text-slate-700">货物状态</TableHead>
                  <TableHead className="font-header font-bold text-slate-700 text-right">重量(g)</TableHead>
                  <TableHead className="font-header font-bold text-slate-700 text-right">成本价(￥)</TableHead>
                  <TableHead className="font-header font-bold text-slate-700 text-right">当前系数</TableHead>
                  <TableHead className="font-header font-bold text-slate-700 text-right">人民币售价区间</TableHead>
                  <TableHead className="font-header font-bold text-slate-700 text-right">美元预估区间</TableHead>
                  <TableHead className="font-header font-bold text-slate-700 text-right">起订量</TableHead>
                  <TableHead className="font-header font-bold text-slate-700 text-right">可用库存</TableHead>
                  <TableHead className="font-header font-bold text-slate-700 text-center">状态</TableHead>
                  <TableHead className="font-header font-bold text-slate-700">创建时间</TableHead>
                  <TableHead className="font-header font-bold text-slate-700 text-right pr-6">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.loading ? <TableRow><TableCell colSpan={16} className="h-64 text-center"><div className="flex flex-col items-center justify-center space-y-3"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div><p className="text-sm text-muted-foreground">正在同步云端商品数据...</p></div></TableCell></TableRow> : state.list.length === 0 ? <TableRow><TableCell colSpan={16} className="h-64 text-center"><div className="flex flex-col items-center justify-center py-12"><Package className="w-12 h-12 text-slate-200 mb-4" /><p className="text-slate-500 font-medium">未查询到符合条件的商品</p><Button variant="link" onClick={handlers.handleReset}>重置搜索条件</Button></div></TableCell></TableRow> : state.list.map((item, index) => {
                const minOrderQty = (item as any).trade_info_json?.minOrderQty;
                const supplierName = (item as any).supplier_name;
                const goodsStatusConfig = item.goods_status ? GOODS_STATUS_CONFIG[item.goods_status as keyof typeof GOODS_STATUS_CONFIG] : undefined;
                return <TableRow key={item.product_id} className="group border-b border-slate-100 last:border-0">
                    <TableCell className="pl-6"><Checkbox checked={state.selectedIds.includes(item.product_id)} onCheckedChange={(checked: boolean) => handlers.handleSelectRow(item.product_id, checked)} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded border border-slate-100 overflow-hidden flex-shrink-0 bg-slate-50">
                          <EditableImg propKey={`prod-${item.product_id}`} keywords={item.sku_code_base || 'industrial product'} description={item.product_name} />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          {state.inlineEditingCell?.productId === item.product_id && state.inlineEditingCell?.field === 'product_name' ? <Input className="h-8 max-w-[220px]" value={state.inlineEditingValue} autoFocus disabled={state.inlineSaving} onChange={e => handlers.changeInlineEditingValue(e.target.value)} onBlur={handlers.submitInlineEdit} onKeyDown={e => {
                          if (e.key === 'Enter') handlers.submitInlineEdit();
                          if (e.key === 'Escape') handlers.cancelInlineEdit();
                        }} /> : <button type="button" className="font-semibold text-slate-900 truncate max-w-[220px] text-left hover:text-primary transition-colors" title={item.product_name} onClick={() => handlers.startInlineEdit(item.product_id, 'product_name', item.product_name)}>{item.product_name}</button>}
                          <span className="text-xs text-muted-foreground font-mono">SKU: {item.sku_code_base || '--'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><div className="flex items-center text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-sm w-fit">{SOURCE_CONFIG[item.source].icon}{SOURCE_CONFIG[item.source].label}</div></TableCell>
                    <TableCell>
                      {supplierName ? <div className="flex flex-col"><span className="text-sm font-medium text-slate-800 truncate max-w-[140px]">{supplierName}</span><span className="text-[11px] text-slate-400">供应商</span></div> : <span className="text-xs text-slate-400">未录入</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-sm font-medium text-slate-800"><FolderTree className="w-3.5 h-3.5 text-primary" />{(item as any).category_name || '--'}</div>
                        <div className="text-[11px] text-slate-500">类目系数 {(item as any).price_coefficient ? (item as any).price_coefficient.toFixed(2) : '--'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {goodsStatusConfig ? <Badge variant="outline" className={goodsStatusConfig.className}>{goodsStatusConfig.label}</Badge> : <span className="text-xs text-slate-400">--</span>}
                    </TableCell>
                    <TableCell className="text-right font-header font-medium text-slate-900">{state.inlineEditingCell?.productId === item.product_id && state.inlineEditingCell?.field === 'weight_gram' ? <Input type="number" className="ml-auto h-8 w-28 text-right" value={state.inlineEditingValue} autoFocus disabled={state.inlineSaving} onChange={e => handlers.changeInlineEditingValue(e.target.value)} onBlur={handlers.submitInlineEdit} onKeyDown={e => {
                      if (e.key === 'Enter') handlers.submitInlineEdit();
                      if (e.key === 'Escape') handlers.cancelInlineEdit();
                    }} /> : <button type="button" className="ml-auto inline-flex text-right hover:text-primary transition-colors" onClick={() => handlers.startInlineEdit(item.product_id, 'weight_gram', item.weight_gram)}>{item.weight_gram ? item.weight_gram.toLocaleString() : '--'}</button>}</TableCell>
                    <TableCell className="text-right font-header font-medium text-slate-900">{(item as any).cost_price !== null && (item as any).cost_price !== undefined ? `￥${(item as any).cost_price.toFixed(2)}` : '--'}</TableCell>
                    <TableCell className="text-right font-header font-medium text-slate-900">{(item as any).price_coefficient ? (item as any).price_coefficient.toFixed(2) : '--'}</TableCell>
                    <TableCell className="text-right font-header font-medium text-slate-900">￥{item.price_min.toLocaleString()} ~ {item.price_max.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-header font-medium text-slate-900">${(item as any).usd_display_price_min?.toFixed(2) || '0.00'} ~ ${(item as any).usd_display_price_max?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell className="text-right font-header font-medium text-slate-900">{minOrderQty ? `${minOrderQty.toLocaleString()} 件` : '--'}</TableCell>
                    <TableCell className="text-right font-header font-medium text-slate-900">{item.total_stock.toLocaleString()}</TableCell>
                    <TableCell className="text-center"><Badge variant={STATUS_CONFIG[item.status].variant} className="rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider">{STATUS_CONFIG[item.status].label}</Badge></TableCell>
                    <TableCell className="text-xs text-slate-500 whitespace-nowrap">{new Date(item.created_at).toLocaleDateString()}<br />{new Date(item.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</TableCell>
                    <TableCell className="text-right pr-6"><div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handlers.handleOpenEdit(item.product_id)}><Settings2 className="w-4 h-4" /></Button>{item.status === 'ACTIVE' ? <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600" onClick={() => handlers.openConfirmDialog('INACTIVE', [item.product_id])}><ArrowDownCircle className="w-4 h-4" /></Button> : <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" onClick={() => handlers.openConfirmDialog('ACTIVE', [item.product_id])}><ArrowUpCircle className="w-4 h-4" /></Button>}<Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handlers.openConfirmDialog('DELETE', [item.product_id])}><Trash2 className="w-4 h-4" /></Button></div></TableCell>
                  </TableRow>;
              })}
              </TableBody>
            </Table>
          </Card>

          <div className="flex items-center justify-between mt-6 px-2">
            <div className="text-sm text-slate-500">显示第 <span className="font-bold text-slate-700">{state.total === 0 ? 0 : (state.currentPage - 1) * state.pageSize + 1}</span> 到 <span className="font-bold text-slate-700"> {Math.min(state.currentPage * state.pageSize, state.total)}</span> 条，共 <span className="font-bold text-slate-700">{state.total}</span> 条商品记录</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-9 px-4" disabled={state.currentPage <= 1 || state.loading} onClick={() => handlers.setCurrentPage(state.currentPage - 1)}>上一页</Button>
              <div className="flex items-center justify-center min-w-[40px] h-9 bg-primary/5 text-primary font-bold rounded-md border border-primary/10">{state.currentPage}</div>
              <Button variant="outline" size="sm" className="h-9 px-4" disabled={state.currentPage * state.pageSize >= state.total || state.loading} onClick={() => handlers.setCurrentPage(state.currentPage + 1)}>下一页</Button>
            </div>
          </div>
        </div>
      </section>

      <Sheet open={state.drawerOpen} onOpenChange={handlers.setDrawerOpen}>
        <SheetContent className="sm:max-w-[90vw] md:max-w-[76vw] lg:max-w-[1100px] p-0 flex flex-col h-full bg-slate-50">
          <SheetHeader className="px-8 py-6 bg-white border-b sticky top-0 z-10 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-2xl font-header font-bold text-slate-900">{state.drawerMode === 'create' ? '新增跨境出口商品' : `编辑商品: ${state.formData.name}`}</SheetTitle>
                <div className="flex items-center gap-2 mt-1"><Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tight">人民币主展示</Badge>{state.drawerMode === 'edit' && <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100">支持单商品调价重算</Badge>}</div>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 pb-32">
            {state.drawerLoading ? <div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div> : <div className="max-w-5xl mx-auto space-y-8">
                <Card className="border-slate-200">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-6 border-l-4 border-primary pl-3"><Info className="w-5 h-5 text-primary" /><h3 className="text-lg font-bold text-slate-900">基础属性</h3></div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="col-span-2"><label className="text-sm font-bold text-slate-700 mb-2 block">商品展示全称 <span className="text-destructive">*</span></label><Input className="h-11" value={state.formData.name} onChange={e => handlers.handleFormFieldChange('name', e.target.value)} placeholder="例如: 2024夏季新款高强度工业级不锈钢连接器" /></div>
                      <div><label className="text-sm font-bold text-slate-700 mb-2 block">行业分类挂载 <span className="text-destructive">*</span></label><Select value={state.formData.category_id} onValueChange={v => handlers.handleFormFieldChange('category_id', v)}><SelectTrigger className="h-11"><SelectValue placeholder="请选择对应类目" /></SelectTrigger><SelectContent>{state.categoryOptions.map((c, index) => <SelectItem key={c.category_id} value={c.category_id}>{c.category_name}</SelectItem>)}</SelectContent></Select></div>
                      <div><label className="text-sm font-bold text-slate-700 mb-2 block">货物状态 <span className="text-destructive">*</span></label><Select value={state.formData.goods_status || 'IN_STOCK'} onValueChange={v => handlers.handleFormFieldChange('goods_status', v as ManagementGoodsStatus)}><SelectTrigger className="h-11"><SelectValue placeholder="请选择货物状态" /></SelectTrigger><SelectContent><SelectItem value="ACTIVE">已上架</SelectItem><SelectItem value="INACTIVE">已下架</SelectItem><SelectItem value="DELETED">已删除</SelectItem></SelectContent></Select></div>
                      <div className="col-span-2 rounded-xl border border-primary/10 bg-primary/5 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-bold text-slate-900">主类目售价策略</p><p className="text-xs text-slate-500 mt-1">默认优先使用主类目售价系数；商品自身系数字段继续保留，可做单商品调价。</p></div><div className="flex flex-wrap gap-2">{state.formData.main_category_name ? <Badge variant="outline" className="bg-white text-slate-700 border-slate-200"><FolderTree className="w-3 h-3 mr-1" />{state.formData.main_category_name}</Badge> : <Badge variant="outline">未选择主类目</Badge>}<Badge className="bg-white text-primary border border-primary/20"><Percent className="w-3 h-3 mr-1" />类目系数 {state.formData.main_category_price_coefficient ? state.formData.main_category_price_coefficient.toFixed(2) : '--'}</Badge><Badge className="bg-white text-slate-700 border border-slate-200"><Coins className="w-3 h-3 mr-1" />当前生效系数 {state.formData.effective_price_coefficient ? state.formData.effective_price_coefficient.toFixed(2) : '--'}</Badge></div></div></div>
                      <div><label className="text-sm font-bold text-slate-700 mb-2 block">供应商名称</label><Input className="h-11" value={state.formData.supplier_name || ''} onChange={e => handlers.handleFormFieldChange('supplier_name', e.target.value)} placeholder="例如：深圳华峰供应链" /></div>
                      <div><label className="text-sm font-bold text-slate-700 mb-2 block">品牌关键词 / Brand Keyword</label><Input className="h-11" value={state.formData.brand_keyword || ''} onChange={e => handlers.handleFormFieldChange('brand_keyword', e.target.value)} placeholder="例如：Acme / ODM / 自有品牌" /></div>
                      <div><label className="text-sm font-bold text-slate-700 mb-2 block">商品重量(g) <span className="text-destructive">*</span></label><Input type="number" className="h-11" value={state.formData.weight_gram ?? ''} onChange={e => handlers.handleFormFieldChange('weight_gram', e.target.value ? Number(e.target.value) : null)} placeholder="例如 500" /></div>
                      <div><label className="text-sm font-bold text-slate-700 mb-2 block">成本价(￥) <span className="text-destructive">*</span></label><Input type="number" step="0.01" className="h-11" value={state.formData.cost_price ?? ''} onChange={e => handlers.handleFormFieldChange('cost_price', e.target.value ? Number(e.target.value) : null)} placeholder="例如 120" /></div>
                      <div><label className="text-sm font-bold text-slate-700 mb-2 block">商品系数 <span className="text-destructive">*</span></label><div className="space-y-2"><Input type="number" step="0.01" className="h-11" value={state.formData.price_coefficient ?? ''} onChange={e => handlers.handleFormFieldChange('price_coefficient', e.target.value ? Number(e.target.value) : null)} placeholder="例如 1.2" /><div className="flex flex-wrap items-center gap-2 text-xs"><Badge variant="outline" className="bg-white">字段保留值 {state.formData.price_coefficient ? state.formData.price_coefficient.toFixed(2) : '--'}</Badge><Button type="button" variant="outline" size="sm" className="h-8 border-dashed" onClick={handlers.handleApplyCategoryCoefficientToForm}>按主类目系数重算保存</Button></div></div></div>
                      <div><label className="text-sm font-bold text-slate-700 mb-2 block">批量起订量</label><Input type="number" min="1" className="h-11" value={state.formData.trade_info_json?.minOrderQty ?? 1} onChange={e => handlers.handleTradeInfoChange('minOrderQty', e.target.value ? Math.max(1, Number(e.target.value)) : 1)} placeholder="例如 10" /></div>
                      <div className="col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-bold text-slate-900">交易信息预览</p><p className="text-xs text-slate-500 mt-1">当前商品将按该起订量参与询盘与下单展示。</p></div><Badge variant="outline" className="bg-white text-slate-700 border-slate-200">起订量 {state.formData.trade_info_json?.minOrderQty ?? 1} 件</Badge></div></div>
                      <div className="col-span-2"><label className="text-sm font-bold text-slate-700 mb-2 block">核心营销摘要 / 卖点</label><Textarea className="min-h-[88px] resize-none" placeholder="描述商品的核心竞争优势，将展示在商品详情页顶部..." value={state.formData.short_description || ''} onChange={e => handlers.handleFormFieldChange('short_description', e.target.value)} /></div>
                      <div className="col-span-2"><label className="text-sm font-bold text-slate-700 mb-2 block">详情文本 <span className="text-destructive">*</span></label><Textarea className="min-h-[140px] resize-none" placeholder="支持粘贴图文详情中的纯文本内容，将同步写入详情内容区。" value={state.formData.detail_text || ''} onChange={e => handlers.handleFormFieldChange('detail_text', e.target.value)} /></div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200" data-controller-name="商品媒体与详情录入">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-6 border-l-4 border-primary pl-3"><ImageIcon className="w-5 h-5 text-primary" /><h3 className="text-lg font-bold text-slate-900">媒体资产库</h3></div>
                    <div className="space-y-6">
                      <div>
                        <label className="text-sm font-bold text-slate-700 mb-2 block">主图录入 (mainImageUrl)</label>
                        <div className="mb-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-start gap-2"><Upload className="w-4 h-4 mt-0.5" /><div><div className="font-semibold">推荐优先直接上传主图</div><div className="text-xs text-emerald-600 mt-1">仍保留链接输入能力，上传成功后会自动回填链接地址。</div></div></div>
                        <div className="flex gap-4">
                          <div className="w-32 h-32 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 flex-shrink-0 flex items-center justify-center overflow-hidden">{state.formData.main_image_url ? <EditableImg propKey="drawer-main-img" keywords={state.formData.main_image_url} description="preview" /> : <ImageIcon className="w-8 h-8 text-slate-300" />}</div>
                          <div className="flex-1 space-y-3">
                            <Input className="font-mono text-xs" value={state.formData.main_image_url} onChange={e => handlers.handleFormFieldChange('main_image_url', e.target.value)} placeholder="https://example.com/image.jpg" />
                            <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" className="h-9 border-dashed border-slate-300" disabled={state.mainImageUploading}><label className="cursor-pointer flex items-center"><Upload className="w-4 h-4 mr-2" />{state.mainImageUploading ? '上传中...' : '本地上传主图'}<input type="file" accept="image/*" className="hidden" onChange={handlers.handleUploadMainImage} /></label></Button><span className="text-xs text-slate-500 flex items-center">支持手动链接或本地图片上传，上传成功后自动回填主图地址。</span></div>
                            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-500"><div className="font-semibold text-slate-700 mb-1">录入说明</div><p>主图支持粘贴链接或本地上传到项目存储；保存时仍复用现有主图与图库字段，不改变商品创建和编辑流程。</p></div>
                          </div>
                        </div>
                      </div>
                      <Separator className="bg-slate-100" />
                      <div>
                        <div className="flex items-center justify-between mb-4"><div><label className="text-sm font-bold text-slate-700 block">详情图库 (galleryJson)</label><p className="text-xs text-slate-500 mt-1">可直接本地上传详情图，也可继续手动填写图片链接。</p></div><Button variant="outline" className="h-9 border-dashed bg-slate-50" onClick={handlers.addGalleryItem}><Upload className="w-4 h-4 mr-2" />新增详情图</Button></div>
                        <div className="grid grid-cols-1 gap-3">{state.formData.gallery_json?.map((img, index) => <div key={index} className="flex gap-3 items-center group"><div className="w-12 h-12 rounded border bg-slate-50 flex-shrink-0 overflow-hidden">{img.url ? <EditableImg propKey={`gal-${index}`} keywords={img.url} /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-4 h-4 text-slate-300" /></div>}</div><Input className="h-10 font-mono text-xs flex-1" value={img.url} onChange={e => handlers.updateGalleryItem(index, e.target.value)} placeholder="详情图 URL" /><Button type="button" variant="outline" className="h-9 border-dashed border-slate-300" disabled={state.galleryUploadingIndex === index}><label className="cursor-pointer flex items-center px-1"><Upload className="w-4 h-4 mr-2" />{state.galleryUploadingIndex === index ? '上传中...' : '本地上传'}<input type="file" accept="image/*" className="hidden" onChange={e => handlers.handleUploadGalleryImage(index, e)} /></label></Button><Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-destructive" onClick={() => handlers.removeGalleryItem(index)}><Trash2 className="w-4 h-4" /></Button></div>)}</div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between mb-3"><div><h4 className="text-sm font-bold text-slate-900">详情内容预览 (detailContentJson)</h4><p className="text-xs text-slate-500 mt-1">详情文本与详情图会在保存时自动汇总为详情内容。</p></div></div>
                        <div className="space-y-2">{(((state.formData.detail_content_json || []).length > 0 ? state.formData.detail_content_json || [] : [{
                        type: 'text',
                        content: state.formData.detail_text || ''
                      }]) as Array<{
                        type: 'text' | 'image';
                        content: string;
                      }>).map((block, index) => <div key={index} className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{block.type === 'image' ? `图片：${block.content}` : block.content || '详情文本将在此生成预览'}</div>)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6 border-l-4 border-primary pl-3"><div className="flex items-center gap-2"><Layers className="w-5 h-5 text-primary" /><h3 className="text-lg font-bold text-slate-900">规格矩阵配置</h3></div><TooltipProvider><Tooltip><TooltipTrigger asChild><div className="flex items-center text-xs text-slate-400 cursor-help">自动笛卡尔积算法 <Info className="w-3 h-3 ml-1" /></div></TooltipTrigger><TooltipContent>根据定义的属性维度，自动生成所有可能的SKU组合</TooltipContent></Tooltip></TooltipProvider></div>
                    <div className="space-y-4">{state.specDimensions.map((dim, index) => <div key={index} className="bg-slate-50/50 p-4 rounded-lg border border-slate-100 flex items-start gap-4"><div className="flex-1"><label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block">规格维度</label><Input className="h-10 bg-white" placeholder="属性名称" value={dim.name} onChange={e => handlers.updateSpecDimension(index, 'name', e.target.value)} /></div><div className="flex-[2]"><label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block">属性选项 (逗号分隔)</label><Input className="h-10 bg-white" placeholder="例如: 红色,蓝色,黑色" value={dim.values} onChange={e => handlers.updateSpecDimension(index, 'values', e.target.value)} /></div><Button variant="ghost" size="icon" className="h-10 w-10 mt-6 text-slate-400 hover:text-destructive" onClick={() => handlers.removeSpecDimension(index)}><Trash2 className="w-4 h-4" /></Button></div>)}<div className="flex gap-3 pt-2"><Button variant="outline" className="flex-1 h-11" onClick={handlers.addSpecDimension}><Plus className="w-4 h-4 mr-2" />新增规格维度</Button><Button className="flex-1 h-11 bg-slate-800 text-white hover:bg-slate-700" onClick={handlers.generateSkus}><RotateCcw className="w-4 h-4 mr-2" />重新生成 SKU 列表</Button></div>
                      {state.formData.skus.length > 0 && <div className="mt-8 rounded-lg border border-slate-200 overflow-hidden"><Table><TableHeader className="bg-slate-100/50"><TableRow><TableHead className="text-[11px] font-bold uppercase">规格组合项</TableHead><TableHead className="text-[11px] font-bold uppercase w-[140px]">销售价格 (￥)</TableHead><TableHead className="text-[11px] font-bold uppercase w-[140px]">原价预估 (￥)</TableHead><TableHead className="text-[11px] font-bold uppercase w-[160px]">美元预览 ($)</TableHead><TableHead className="text-[11px] font-bold uppercase w-[150px]">实时库存</TableHead></TableRow></TableHeader>
                      <TableBody>{state.formData.skus.map((sku, index) => <TableRow key={index} className="bg-white"><TableCell className="font-medium text-slate-700"><div className="flex gap-1 flex-wrap">{sku.attribute_json?.length ? sku.attribute_json?.map((a, index1) => <Badge key={index1} variant="secondary" className="rounded-sm font-normal text-[10px]">{a.value}</Badge>) : <span className="text-xs text-slate-400">默认 SKU</span>}</div></TableCell><TableCell><Input type="number" className="h-9 font-header" value={sku.price} onChange={e => handlers.updateSkuRow(index, 'price', Number(e.target.value))} /></TableCell><TableCell><Input type="number" className="h-9 font-header" value={sku.original_price ?? ''} onChange={e => handlers.updateSkuRow(index, 'original_price', e.target.value ? Number(e.target.value) : null)} /></TableCell><TableCell><div className="text-xs text-slate-700 font-medium flex flex-col"><span>${(sku as any).usd_display_price?.toFixed(2) || '--'}</span><span className="text-slate-400">原价 ${(sku as any).usd_display_original_price?.toFixed(2) || '--'}</span></div></TableCell><TableCell><Input type="number" className="h-9 font-header" value={sku.stock} onChange={e => handlers.updateSkuRow(index, 'stock', Number(e.target.value))} /></TableCell></TableRow>)}</TableBody>
                    </Table></div>}
                    </div>
                  </CardContent>
                </Card>
              </div>}
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-white border-t p-6 shadow-2xl flex items-center justify-between z-20">
            <div className="flex items-center gap-2 text-slate-400 text-xs"><AlertCircle className="w-4 h-4" />保存时将按成本价与当前生效系数重算 SKU 人民币售价，并同步生成美元预览。</div>
            <div className="flex gap-3"><Button variant="outline" className="h-11 px-8 border-slate-200" disabled={state.saving} onClick={() => handlers.handleSubmitForm('DRAFT')}>保存为草稿</Button><Button className="h-11 px-10 bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all" disabled={state.saving} onClick={() => handlers.handleSubmitForm('ACTIVE')}>{state.saving ? <span className="flex items-center"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>同步中...</span> : state.drawerMode === 'create' ? '立即同步并上架' : '更新同步信息'}</Button></div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={state.batchImportOpen} onOpenChange={handlers.setBatchImportOpen}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="h-2 w-full bg-primary" />
          <div className="p-8" data-controller-name="商品表格导入">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-xl font-header font-bold text-slate-900">上传 Excel 批量导入商品草稿</DialogTitle>
              <DialogDescription className="text-slate-500 pt-2 leading-relaxed">支持上传 xlsx 文件自动解析，字段顺序：产品名称、重量、成本价、图片、详情、产品分类、供应商、品牌关键词、价格系数。导入生成草稿时来源固定为表格导入。</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-[1.1fr_1.4fr] gap-6">
              <Card className="border-slate-200"><CardContent className="p-5 space-y-4"><div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><label className="text-sm font-bold text-slate-700 mb-1 block">上传导入文件</label><p className="text-xs text-slate-500">仅支持 .xlsx，首行可包含表头。{state.batchImportFileName ? `当前文件：${state.batchImportFileName}` : '上传后将自动生成预览行。'}</p></div><Button type="button" variant="outline" className="h-10 border-dashed border-primary/40 bg-white" disabled={state.batchImportParsing}><label className="cursor-pointer flex items-center"><FileSpreadsheet className="w-4 h-4 mr-2" />{state.batchImportParsing ? '解析中...' : '上传并解析文件'}<input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={handlers.handleUploadBatchImportFile} /></label></Button></div></div><div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600"><div className="font-semibold text-slate-900 mb-2">导入说明</div><p className="text-xs leading-relaxed">批量导入仅接受 Excel 文件。导入生成的是商品草稿，不影响现有上下架与批量操作逻辑。产品分类列仅用于录入备注，实际入库分类仍以当前编辑表单已选择的默认分类为准。</p></div><div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={handlers.addBatchImportRow}>新增一行</Button></div><Alert className="bg-slate-50 border-slate-200"><Info className="h-4 w-4" /><AlertTitle className="text-xs font-bold uppercase tracking-wider mb-1">品牌关键词说明</AlertTitle><AlertDescription className="text-xs">品牌信息仅作为品牌关键词使用，不参与类目语义或一级分类归属。</AlertDescription></Alert></CardContent></Card>
              <Card className="border-slate-200"><CardContent className="p-5"><div className="mb-3 flex items-center justify-between"><div className="text-sm font-bold text-slate-700">导入结果预览</div><Badge variant="outline">{state.batchImportRows.length} 行</Badge></div><div className="max-h-[420px] overflow-auto rounded-lg border border-slate-200"><Table><TableHeader className="bg-slate-50"><TableRow><TableHead>名称</TableHead><TableHead>重量</TableHead><TableHead>成本价</TableHead><TableHead>图片</TableHead><TableHead>详情</TableHead><TableHead>产品分类</TableHead><TableHead>供应商</TableHead><TableHead>品牌关键词 / Brand Keyword</TableHead><TableHead>价格系数</TableHead><TableHead className="w-[50px]">操作</TableHead></TableRow></TableHeader><TableBody>{state.batchImportRows.map((row, index) => <TableRow key={index}><TableCell><Input className="h-8" value={row.name} onChange={e => handlers.updateBatchImportRow(index, 'name', e.target.value)} /></TableCell><TableCell><Input className="h-8" value={row.weight_gram} onChange={e => handlers.updateBatchImportRow(index, 'weight_gram', e.target.value)} /></TableCell><TableCell><Input className="h-8" value={row.cost_price} onChange={e => handlers.updateBatchImportRow(index, 'cost_price', e.target.value)} /></TableCell><TableCell><Input className="h-8" value={row.main_image_url} onChange={e => handlers.updateBatchImportRow(index, 'main_image_url', e.target.value)} /></TableCell><TableCell><Input className="h-8" value={row.detail_text} onChange={e => handlers.updateBatchImportRow(index, 'detail_text', e.target.value)} /></TableCell><TableCell><Input className="h-8" value={row.category_name} onChange={e => handlers.updateBatchImportRow(index, 'category_name', e.target.value)} /></TableCell><TableCell><Input className="h-8" value={row.supplier_name} onChange={e => handlers.updateBatchImportRow(index, 'supplier_name', e.target.value)} /></TableCell><TableCell><Input className="h-8" value={row.brand_keyword} onChange={e => handlers.updateBatchImportRow(index, 'brand_keyword', e.target.value)} /></TableCell><TableCell><Input className="h-8" value={row.price_coefficient} onChange={e => handlers.updateBatchImportRow(index, 'price_coefficient', e.target.value)} /></TableCell><TableCell><Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-destructive" onClick={() => handlers.removeBatchImportRow(index)}><Trash2 className="w-4 h-4" /></Button></TableCell></TableRow>)}</TableBody></Table></div></CardContent></Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={state.confirmDialogOpen} onOpenChange={handlers.setConfirmDialogOpen}>
        <DialogContent className="max-w-[460px] p-0 overflow-hidden border-none shadow-2xl">
          <div className={`h-2 w-full ${state.confirmAction === 'DELETE' ? 'bg-destructive' : 'bg-primary'}`} />
          <div className="p-8">
            <DialogHeader className="mb-6"><div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${state.confirmAction === 'DELETE' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>{state.confirmAction === 'DELETE' ? <Trash2 className="w-6 h-6" /> : state.confirmAction === 'PRICE_COEFFICIENT' ? <Percent className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}</div><DialogTitle className="text-xl font-header font-bold text-slate-900">{state.confirmAction === 'ACTIVE' && '确认上架操作'}{state.confirmAction === 'INACTIVE' && '确认下架操作'}{state.confirmAction === 'DELETE' && '确认永久删除'}{state.confirmAction === 'PRICE_COEFFICIENT' && '批量设置价格策略'}</DialogTitle><DialogDescription className="text-slate-500 pt-2 leading-relaxed">{state.confirmAction === 'ACTIVE' && '此操作将使商品在前端门户立即可见并支持下单，请确保价格信息准确无误。'}{state.confirmAction === 'INACTIVE' && '下架后，用户将无法在搜索结果中找到此商品，且无法将其加入购物车。'}{state.confirmAction === 'DELETE' && '警告：此操作不可逆，将从数据库中永久移除该商品及其关联的所有SKU镜像信息。'}{state.confirmAction === 'PRICE_COEFFICIENT' && '支持统一写入商品系数，或直接按主类目系数重算所选商品的 SKU 售价与原价。'}</DialogDescription></DialogHeader>
            <Alert variant={state.confirmAction === 'DELETE' ? 'destructive' : 'default'} className="mb-6 bg-slate-50 border-slate-100"><Info className="h-4 w-4" /><AlertTitle className="text-xs font-bold uppercase tracking-wider mb-1">系统提示</AlertTitle><AlertDescription className="text-xs">涉及商品 ID: {state.selectedIds.length > 0 ? `${state.selectedIds.slice(0, 3).join(', ')}${state.selectedIds.length > 3 ? '...' : ''}` : '--'}</AlertDescription></Alert>
            {state.confirmAction === 'PRICE_COEFFICIENT' && <div className="mb-6 space-y-4"><div><label className="text-sm font-bold text-slate-700 mb-2 block">调价方式</label><Select value={state.batchPriceAdjustMode} onValueChange={value => handlers.setBatchPriceAdjustMode(value as any)}><SelectTrigger className="h-11"><SelectValue placeholder="请选择调价方式" /></SelectTrigger><SelectContent><SelectItem value="PRODUCT_COEFFICIENT">统一设置商品系数</SelectItem><SelectItem value="CATEGORY_COEFFICIENT">按主类目系数重算售价</SelectItem></SelectContent></Select></div>{state.batchPriceAdjustMode === 'PRODUCT_COEFFICIENT' ? <div><label className="text-sm font-bold text-slate-700 mb-2 block">统一价格系数</label><Input type="number" step="0.01" className="h-11" value={state.batchPriceCoefficientValue} onChange={e => handlers.setBatchPriceCoefficientValue(e.target.value)} placeholder="例如 1.15" /></div> : <div className="rounded-lg border border-dashed border-primary/20 bg-primary/5 p-4 text-sm text-slate-600"><div className="flex items-center gap-2 font-semibold text-slate-900"><FolderTree className="w-4 h-4 text-primary" />按主类目系数应用</div><p className="text-xs text-slate-500 mt-2">确认后，将以每个商品所属主类目的系数作为默认值，重算所选商品的 SKU 人民币售价与原价，并同步美元预览。</p></div>}</div>}
            {state.confirmAction === 'CATEGORY' && <div className="mb-6"><label className="text-sm font-bold text-slate-700 mb-2 block">目标分类</label><Select value={state.batchCategoryId} onValueChange={handlers.setBatchCategoryId}><SelectTrigger className="h-11"><SelectValue placeholder="请选择目标分类" /></SelectTrigger><SelectContent>{state.categoryOptions.map((c, index) => <SelectItem key={c.category_id} value={c.category_id}>{c.category_name}</SelectItem>)}</SelectContent></Select></div>}
            {state.confirmAction === 'MANAGEMENT_STATUS' && <div className="mb-6"><label className="text-sm font-bold text-slate-700 mb-2 block">目标状态</label><Select value={state.batchManagementStatus} onValueChange={value => handlers.setBatchManagementStatus(value as any)}><SelectTrigger className="h-11"><SelectValue placeholder="请选择目标状态" /></SelectTrigger><SelectContent><SelectItem value="ACTIVE">已上架</SelectItem><SelectItem value="INACTIVE">已下架</SelectItem><SelectItem value="DELETED">已删除</SelectItem></SelectContent></Select></div>}
            {state.confirmAction === 'WEIGHT_PRICE' && <div className="mb-6 space-y-4"><div><label className="text-sm font-bold text-slate-700 mb-2 block">修改字段</label><Select value={state.batchWeightPriceMode} onValueChange={value => handlers.setBatchWeightPriceMode(value as any)}><SelectTrigger className="h-11"><SelectValue placeholder="请选择修改字段" /></SelectTrigger><SelectContent><SelectItem value="price_coefficient">价格系数</SelectItem><SelectItem value="weight_gram">重量(g)</SelectItem></SelectContent></Select></div><div><label className="text-sm font-bold text-slate-700 mb-2 block">统一值</label><Input type="number" step="0.01" className="h-11" value={state.batchWeightPriceValue} onChange={e => handlers.setBatchWeightPriceValue(e.target.value)} placeholder={state.batchWeightPriceMode === 'weight_gram' ? '例如 500' : '例如 1.20'} /></div></div>}
            <DialogFooter className="flex-col sm:flex-row gap-2 mt-4"><Button variant="ghost" className="flex-1 h-11 font-medium hover:bg-slate-100" onClick={() => handlers.setConfirmDialogOpen(false)}>取消</Button><Button variant={state.confirmAction === 'DELETE' ? 'destructive' : 'default'} className={`flex-1 h-11 font-bold ${state.confirmAction !== 'DELETE' ? 'bg-primary text-primary-foreground' : ''}`} onClick={handlers.handleConfirmAction} disabled={state.confirmLoading}>{state.confirmLoading ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : '确认执行'}</Button></DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};
export default ProductManagementView;
