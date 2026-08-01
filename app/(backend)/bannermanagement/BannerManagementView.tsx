'use client'

import React from 'react'
import type { BannerManagementState, BannerManagementHandlers } from '@/backend/hooks/useBannerManagement'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Plus, 
  Search, 
  RotateCcw, 
  Trash2, 
  Eye, 
  Copy, 
  ExternalLink, 
  Edit2, 
  ChevronLeft, 
  ChevronRight,
  UploadCloud,
  X,
  ChevronRightIcon
} from 'lucide-react'
import EditableImg from '@/@base/EditableImg'

interface Props {
  state: BannerManagementState
  handlers: BannerManagementHandlers
}

export const BannerManagementView = ({ state, handlers }: Props) => {
  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      {/* 页面头部 */}
      <section className="bg-white border-b border-border" data-controller-name="页面头部与面包屑">
        <div className="container mx-auto px-8 py-4">
          <div className="flex flex-col gap-2">
            <nav className="flex items-center text-sm text-muted-foreground font-medium">
              <span>首页</span>
              <ChevronRightIcon className="w-4 h-4 mx-1" />
              <span>站点设置</span>
              <ChevronRightIcon className="w-4 h-4 mx-1" />
              <span className="text-foreground">Banner 轮播图管理</span>
            </nav>
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold font-header tracking-tight">Banner 轮播图管理</h1>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlers.navigateToCategoryManagement}
                  className="bg-secondary text-secondary-foreground hover:bg-muted"
                >
                  分类管理
                </Button>
                <Button 
                  size="sm" 
                  onClick={handlers.openCreateModal}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  新增 Banner
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 筛选与批量操作 */}
      <section className="bg-background" data-controller-name="搜索与操作工具栏">
        <div className="container mx-auto px-8 py-6 flex flex-col gap-4">
          <Card className="shadow-xs border-border">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-shrink-0 w-64">
                  <Input
                    placeholder="搜索 Banner 标题"
                    value={state.inputKeyword}
                    onChange={e => handlers.setInputKeyword(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="flex-shrink-0 w-40">
                  <Select
                    value={state.filterStatus}
                    onValueChange={(val) => handlers.setFilterStatus(val as any)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="选择状态" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(state.STATUS_LABELS).map(([val, label]) => (
                        <SelectItem key={val} value={val}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={handlers.handleSearch} className="bg-primary text-primary-foreground">
                    <Search className="w-4 h-4 mr-2" />
                    查询
                  </Button>
                  <Button size="sm" variant="outline" onClick={handlers.handleReset} className="bg-white border-border">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    重置
                  </Button>
                </div>
                
                <div className="ml-auto flex items-center gap-2 border-l pl-4 border-border">
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    disabled={state.selectedIds.length === 0}
                    onClick={handlers.handleBatchDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    批量删除
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    disabled={state.selectedIds.length === 0}
                    onClick={() => handlers.handleBatchUpdateStatus(true)}
                  >
                    批量启用
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    disabled={state.selectedIds.length === 0}
                    onClick={() => handlers.handleBatchUpdateStatus(false)}
                  >
                    批量禁用
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 数据列表区 */}
      <section className="bg-background pb-12" data-controller-name="Banner数据列表">
        <div className="container mx-auto px-8">
          <Card className="shadow-sm border-border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-secondary/50">
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={state.isAllSelected}
                        onCheckedChange={(checked) => handlers.handleSelectAll(!!checked)}
                      />
                    </TableHead>
                    <TableHead className="w-[120px]">封面图</TableHead>
                    <TableHead className="min-w-[200px]">标题</TableHead>
                    <TableHead className="min-w-[240px]">跳转链接</TableHead>
                    <TableHead className="w-[120px]">排序权重</TableHead>
                    <TableHead className="w-[120px]">状态</TableHead>
                    <TableHead className="w-[180px]">更新时间</TableHead>
                    <TableHead className="w-[120px] text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-64 text-center text-muted-foreground">
                        加载数据中...
                      </TableCell>
                    </TableRow>
                  ) : state.list.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-64 text-center text-muted-foreground">
                        暂无 Banner 数据
                      </TableCell>
                    </TableRow>
                  ) : (
                    state.list.map((item) => (
                      <TableRow key={item.banner_id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <Checkbox 
                            checked={state.selectedIds.includes(item.banner_id)}
                            onCheckedChange={(checked) => handlers.handleSelectRow(item.banner_id, !!checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="w-20 h-12 rounded bg-muted overflow-hidden border border-border">
                            <EditableImg 
                              propKey={`banner_img_${item.banner_id}`}
                              keywords={item.banner_imageUrl || item.banner_title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-foreground line-clamp-1 max-w-[200px]">
                            {item.banner_title || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.banner_linkUrl ? (
                            <div className="flex items-center gap-2 group max-w-[240px]">
                              <span className="text-sm text-muted-foreground truncate flex-1">
                                {item.banner_linkUrl}
                              </span>
                              <div className="flex items-center gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="w-6 h-6 h-6 hover:bg-secondary"
                                  onClick={() => handlers.handleCopyLink(item.banner_linkUrl)}
                                >
                                  <Copy className="w-3 h-3 text-primary" />
                                </Button>
                                <a 
                                  href={item.banner_linkUrl} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="flex items-center justify-center w-6 h-6 hover:bg-secondary rounded"
                                >
                                  <ExternalLink className="w-3 h-3 text-primary" />
                                </a>
                              </div>
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="w-20 h-8 text-center"
                            value={state.editingWeights[item.banner_id] ?? item.banner_sortWeight}
                            onChange={e => handlers.setEditingWeights(prev => ({
                              ...prev,
                              [item.banner_id]: Number(e.target.value)
                            }))}
                            onBlur={() => handlers.handleQuickUpdateSortWeight(item.banner_id, item.banner_sortWeight)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch 
                              checked={item.banner_isEnabled}
                              onCheckedChange={(checked) => handlers.handleQuickUpdateStatus(item.banner_id, checked)}
                            />
                            <Badge variant={item.banner_isEnabled ? "default" : "secondary"} className={item.banner_isEnabled ? "bg-accent text-accent-foreground" : ""}>
                              {item.banner_isEnabled ? '启用' : '禁用'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(item.banner_updatedAt).toLocaleString('zh-CN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handlers.openEditModal(item)}
                              className="text-primary hover:bg-primary hover:text-primary-foreground"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handlers.handleDelete(item.banner_id)}
                              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {/* 分页器 */}
            <div className="flex items-center justify-between px-6 py-4 bg-secondary/30 border-t border-border">
              <div className="text-sm text-muted-foreground">
                共 <span className="font-semibold text-foreground">{state.total}</span> 条数据
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">每页条数:</span>
                  <Select 
                    value={state.pageSize.toString()} 
                    onValueChange={(val) => handlers.handlePageSizeChange(Number(val))}
                  >
                    <SelectTrigger className="h-8 w-[80px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => handlers.setPage(p => Math.max(1, p - 1))}
                    disabled={state.page <= 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="text-sm font-medium">
                    {state.page} / {state.totalPages}
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => handlers.setPage(p => Math.min(state.totalPages, p + 1))}
                    disabled={state.page >= state.totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* 弹窗：新增/编辑 */}
      <Dialog open={!!(state.formMode && state.formData)} onOpenChange={handlers.closeFormModal}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-auto p-0 border-none rounded-lg">
          <DialogHeader className="px-6 py-4 border-b border-border bg-secondary/30">
            <DialogTitle className="text-xl font-bold font-header">
              {state.formMode === 'CREATE' ? '新增 Banner' : '编辑 Banner'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="px-6 py-6 space-y-6">
            {/* 标题 */}
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-1">
                Banner 标题 <span className="text-muted-foreground font-normal">(选填)</span>
              </label>
              <Input
                placeholder="请输入 Banner 标题"
                value={state.formData?.banner_title || ''}
                onChange={e => handlers.handleFormFieldChange('banner_title', e.target.value)}
              />
            </div>

            {/* 图片上传 */}
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-1">
                轮播图片 <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                {state.formData?.banner_imageUrl ? (
                  <div className="group relative rounded-lg border border-border overflow-hidden aspect-[21/9] bg-muted">
                    <EditableImg 
                      propKey="formData_banner_image"
                      keywords={state.formData.banner_imageUrl}
                      needLargeImage
                      description={state.formData.banner_title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handlers.handleFormFieldChange('banner_imageUrl', '')}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        移除图片
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="relative group border-2 border-dashed border-muted-foreground/25 hover:border-primary transition-colors rounded-lg bg-muted/30 aspect-[21/9] flex flex-col items-center justify-center gap-2 cursor-pointer overflow-hidden">
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      accept="image/*"
                      onChange={handlers.handleImageUpload}
                      disabled={state.uploading}
                    />
                    <div className="flex flex-col items-center gap-2 pointer-events-none">
                      <div className="p-3 rounded-full bg-white shadow-sm border border-border">
                        <UploadCloud className="w-6 h-6 text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">点击或拖拽上传图片</p>
                        <p className="text-xs text-muted-foreground mt-1">推荐比例 21:9，支持 JPG, PNG, WEBP</p>
                      </div>
                    </div>
                    {state.uploading && (
                      <div className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span className="mt-2 text-sm font-medium text-primary">上传中...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 跳转链接 */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">跳转链接</label>
              <Input
                type="url"
                placeholder="https://example.com/target"
                value={state.formData?.banner_linkUrl || ''}
                onChange={e => handlers.handleFormFieldChange('banner_linkUrl', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* 排序权重 */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">排序权重</label>
                <Input
                  type="number"
                  value={state.formData?.banner_sortWeight || 0}
                  onChange={e => handlers.handleFormFieldChange('banner_sortWeight', Number(e.target.value))}
                />
                <p className="text-[10px] text-muted-foreground italic">数值越大越靠前</p>
              </div>

              {/* 状态 */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">发布状态</label>
                <div className="flex items-center gap-3 h-10 px-3 rounded-md border border-input bg-background">
                  <Switch
                    checked={state.formData?.banner_isEnabled || false}
                    onCheckedChange={checked => handlers.handleFormFieldChange('banner_isEnabled', checked)}
                  />
                  <span className="text-sm font-medium">
                    {state.formData?.banner_isEnabled ? '已启用' : '已禁用'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-border bg-secondary/10 gap-3">
            <Button 
              variant="outline" 
              onClick={handlers.closeFormModal} 
              disabled={state.submitting}
              className="px-6"
            >
              取消
            </Button>
            <Button 
              onClick={handlers.handleFormSubmit} 
              disabled={state.submitting}
              className="px-8 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {state.submitting ? (
                <>
                  <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                  保存中
                </>
              ) : '保存 Banner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
