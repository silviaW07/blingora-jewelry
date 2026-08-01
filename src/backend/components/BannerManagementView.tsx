'use client';

import React from 'react';
import type { BannerManagementState, BannerManagementHandlers } from '@/backend/hooks/useBannerManagement';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, RotateCcw, Trash2, Eye, Copy, ExternalLink, Edit2, ChevronLeft, ChevronRight, UploadCloud, X, ChevronRightIcon } from 'lucide-react';
import EditableImg from '@/@base/EditableImg';
interface Props {
  state: BannerManagementState;
  handlers: BannerManagementHandlers;
}
export const BannerManagementView = ({
  state,
  handlers
}: Props) => {
  return <div className="min-h-screen bg-background font-body text-foreground" data-api-unique-id="bannermanagementview-ra1357a77166c2a79-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
      {/* 页面头部 */}
      <section className="bg-white border-b border-border" data-controller-name="页面头部与面包屑" data-api-unique-id="bannermanagementview-refd0d593a26dc417-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
        <div className="container mx-auto px-8 py-4" data-api-unique-id="bannermanagementview-r6fa39ac26e40a308-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
          <div className="flex flex-col gap-2" data-api-unique-id="bannermanagementview-rbac80139982f2fbd-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
            <nav className="flex items-center text-sm text-muted-foreground font-medium" data-api-unique-id="bannermanagementview-r13527b343205f9ef-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
              <span data-api-unique-id="bannermanagementview-r29bb3948f4f54c9e-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">首页</span>
              <ChevronRightIcon className="w-4 h-4 mx-1" data-api-unique-id="bannermanagementview-r72e66ebf5ea2ec0a-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" />
              <span data-api-unique-id="bannermanagementview-r333990dee4142dc8-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">站点设置</span>
              <ChevronRightIcon className="w-4 h-4 mx-1" data-api-unique-id="bannermanagementview-r4b57682f7c5fdf70-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" />
              <span className="text-foreground" data-api-unique-id="bannermanagementview-r3b86b354168b50d7-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">Banner 轮播图管理</span>
            </nav>
            <div className="flex items-center justify-between" data-api-unique-id="bannermanagementview-r655f51b24bf75085-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
              <h1 className="text-2xl font-bold font-header tracking-tight" data-api-unique-id="bannermanagementview-r7ca871fb4e1ad3b6-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">Banner 轮播图管理</h1>
              <div className="flex items-center gap-3" data-api-unique-id="bannermanagementview-r65dd9dae3914ce97-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                <Button variant="outline" size="sm" onClick={handlers.navigateToCategoryManagement} className="bg-secondary text-secondary-foreground hover:bg-muted" data-api-unique-id="bannermanagementview-r620217a4a102e8e3-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                  分类管理
                </Button>
                <Button size="sm" onClick={handlers.openCreateModal} className="bg-primary text-primary-foreground hover:bg-primary/90" data-api-unique-id="bannermanagementview-rcb98caffde50f627-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                  <Plus className="w-4 h-4 mr-2" data-api-unique-id="bannermanagementview-r674afc69fb0126ac-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" />
                  新增 Banner
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 筛选与批量操作 */}
      <section className="bg-background" data-controller-name="搜索与操作工具栏" data-api-unique-id="bannermanagementview-rb29bfb5b99628f93-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
        <div className="container mx-auto px-8 py-6 flex flex-col gap-4" data-api-unique-id="bannermanagementview-rb8369f8dc21d9113-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
          <Card className="shadow-xs border-border" data-api-unique-id="bannermanagementview-r8a9e64acbdb9f883-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
            <CardContent className="p-4" data-api-unique-id="bannermanagementview-rfcae0c1b85753363-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
              <div className="flex flex-wrap items-center gap-4" data-api-unique-id="bannermanagementview-rd17fe228755facd6-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                <div className="flex-shrink-0 w-64" data-api-unique-id="bannermanagementview-r9e9c71c0d7521eae-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                  <Input placeholder="搜索 Banner 标题" value={state.inputKeyword} onChange={e => handlers.setInputKeyword(e.target.value)} className="h-9" data-api-unique-id="bannermanagementview-r6c0b27d67b016f48-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" />
                </div>
                <div className="flex-shrink-0 w-40" data-api-unique-id="bannermanagementview-rc091c9b5422aa7ed-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                  <Select value={state.filterStatus} onValueChange={val => handlers.setFilterStatus(val as any)} data-api-unique-id="bannermanagementview-r96db05b23720b651-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                    <SelectTrigger className="h-9" data-api-unique-id="bannermanagementview-r41e8b5aa4a0547eb-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                      <SelectValue placeholder="选择状态" data-api-unique-id="bannermanagementview-rdb3b0b2fc7ac0c33-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" />
                    </SelectTrigger>
                    <SelectContent data-api-unique-id="bannermanagementview-r0b678a736a9e39ae-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                      {Object.entries(state.STATUS_LABELS).map(([val, label], index) => <SelectItem key={val} value={val} data-api-unique-id="bannermanagementview-r220cb5a1790c21ee-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" data-api-in-loop="1">{label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2" data-api-unique-id="bannermanagementview-re58c965c31d14dcd-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                  <Button size="sm" onClick={handlers.handleSearch} className="bg-primary text-primary-foreground" data-api-unique-id="bannermanagementview-r841e2bee951b1a59-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                    <Search className="w-4 h-4 mr-2" data-api-unique-id="bannermanagementview-r109d538c70a8748d-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" />
                    查询
                  </Button>
                  <Button size="sm" variant="outline" onClick={handlers.handleReset} className="bg-white border-border" data-api-unique-id="bannermanagementview-r7f24744c493243ff-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                    <RotateCcw className="w-4 h-4 mr-2" data-api-unique-id="bannermanagementview-r6a24781aa8157cd1-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" />
                    重置
                  </Button>
                </div>
                
                <div className="ml-auto flex items-center gap-2 border-l pl-4 border-border" data-api-unique-id="bannermanagementview-r2d651bc2737fce5b-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                  <Button size="sm" variant="destructive" disabled={state.selectedIds.length === 0} onClick={handlers.handleBatchDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-api-unique-id="bannermanagementview-r09078cfb74d80b99-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                    <Trash2 className="w-4 h-4 mr-2" data-api-unique-id="bannermanagementview-rda3cc6444bc38e02-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" />
                    批量删除
                  </Button>
                  <Button size="sm" variant="outline" disabled={state.selectedIds.length === 0} onClick={() => handlers.handleBatchUpdateStatus(true)} data-api-unique-id="bannermanagementview-rf8d6cd94c31cf9da-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                    批量启用
                  </Button>
                  <Button size="sm" variant="outline" disabled={state.selectedIds.length === 0} onClick={() => handlers.handleBatchUpdateStatus(false)} data-api-unique-id="bannermanagementview-r250f52989c8ddbc8-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                    批量禁用
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 数据列表区 */}
      <section className="bg-background pb-12" data-controller-name="Banner数据列表" data-api-unique-id="bannermanagementview-r6a7d3e16891b1b79-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
        <div className="container mx-auto px-8" data-api-unique-id="bannermanagementview-r4344eb54e0f98ab1-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
          <Card className="shadow-sm border-border overflow-hidden" data-api-unique-id="bannermanagementview-rae5a3966cbff408b-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
            <div className="overflow-x-auto" data-api-unique-id="bannermanagementview-r3d1aea66869d9748-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
              <Table data-api-unique-id="bannermanagementview-r68c4676b8701f391-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                <TableHeader className="bg-secondary/50" data-api-unique-id="bannermanagementview-r47b6d0b433868fed-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                  <TableRow data-api-unique-id="bannermanagementview-r494bb5aa5e0ed50f-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                    <TableHead className="w-[50px]" data-api-unique-id="bannermanagementview-r90fe024664c5d44b-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                      <Checkbox checked={state.isAllSelected} onCheckedChange={checked => handlers.handleSelectAll(!!checked)} data-api-unique-id="bannermanagementview-r1da1d728d19de42a-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" />
                    </TableHead>
                    <TableHead className="w-[120px]" data-api-unique-id="bannermanagementview-r8f55ffed18f0666b-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">封面图</TableHead>
                    <TableHead className="min-w-[200px]" data-api-unique-id="bannermanagementview-rfb6c3f348cf7a3c4-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">标题</TableHead>
                    <TableHead className="min-w-[240px]" data-api-unique-id="bannermanagementview-r9c66c663614ade39-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">跳转链接</TableHead>
                    <TableHead className="w-[120px]" data-api-unique-id="bannermanagementview-rfc4c3c5e8540b51c-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">排序权重</TableHead>
                    <TableHead className="w-[120px]" data-api-unique-id="bannermanagementview-rda5c2e13fbb7a47f-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">状态</TableHead>
                    <TableHead className="w-[180px]" data-api-unique-id="bannermanagementview-r3624ed98fcb769e8-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">更新时间</TableHead>
                    <TableHead className="w-[120px] text-right" data-api-unique-id="bannermanagementview-r6a1eecbedf02a1b0-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody data-api-unique-id="bannermanagementview-r0b83dda7766ecbb8-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                  {state.loading ? <TableRow data-api-unique-id="bannermanagementview-r530026f4994ed842-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                      <TableCell colSpan={8} className="h-64 text-center text-muted-foreground" data-api-unique-id="bannermanagementview-rc7910ae048b9f998-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                        加载数据中...
                      </TableCell>
                    </TableRow> : state.list.length === 0 ? <TableRow data-api-unique-id="bannermanagementview-r45013fe0e4b91c19-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                      <TableCell colSpan={8} className="h-64 text-center text-muted-foreground" data-api-unique-id="bannermanagementview-rc4f83ebe15deac42-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                        暂无 Banner 数据
                      </TableCell>
                    </TableRow> : state.list.map((item, index) => <TableRow key={item.banner_id} className="hover:bg-muted/30 transition-colors" data-api-unique-id="bannermanagementview-r87e63f8831b91702-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" data-api-in-loop="1">
                        <TableCell data-api-unique-id="bannermanagementview-r610798d026c94e07-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" data-api-in-loop="1">
                          <Checkbox checked={state.selectedIds.includes(item.banner_id)} onCheckedChange={checked => handlers.handleSelectRow(item.banner_id, !!checked)} data-api-unique-id="bannermanagementview-rbe8f32a467d5389d-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" data-api-in-loop="1" />
                        </TableCell>
                        <TableCell data-api-unique-id="bannermanagementview-r7d4d34ba4ac41251-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" data-api-in-loop="1">
                          <div className="w-20 h-12 rounded bg-muted overflow-hidden border border-border" data-api-unique-id="bannermanagementview-r3e1003dcf3275674-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" data-api-in-loop="1">
                            <EditableImg propKey={`banner_img_${item.banner_id}`} keywords={item.banner_imageUrl || item.banner_title} className="w-full h-full object-cover" data-api-unique-id="bannermanagementview-r79e3efd8c3a927da-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" data-api-in-loop="1" />
                          </div>
                        </TableCell>
                        <TableCell data-api-unique-id="bannermanagementview-rfc0756813bd7bcd4-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" data-api-in-loop="1">
                          <div className="font-medium text-foreground line-clamp-1 max-w-[200px]" data-api-unique-id="bannermanagementview-re02944662f8b470a-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" data-api-in-loop="1">
                            {item.banner_title || '-'}
                          </div>
                        </TableCell>
                        <TableCell data-api-unique-id="bannermanagementview-r684583ff94ceae98-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" data-api-in-loop="1">
                          {item.banner_linkUrl ? <div className="flex items-center gap-2 group max-w-[240px]" data-api-unique-id="bannermanagementview-r1743117aa8903613-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" data-api-in-loop="1">
                              <span className="text-sm text-muted-foreground truncate flex-1" data-api-unique-id="bannermanagementview-r42aab98681c01f2d-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" data-api-in-loop="1">
                                {item.banner_linkUrl}
                              </span>
                              <div className="flex items-center gap-1" data-api-unique-id="bannermanagementview-r735836f96061ee15-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" data-api-in-loop="1">
                                <Button variant="ghost" size="icon" className="w-6 h-6 h-6 hover:bg-secondary" onClick={() => handlers.handleCopyLink(item.banner_linkUrl)} data-api-unique-id="bannermanagementview-rdf80133551914ec4-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" data-api-in-loop="1">
                                  <Copy className="w-3 h-3 text-primary" data-api-unique-id="bannermanagementview-r850343f42244836e-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" data-api-in-loop="1" />
                                </Button>
                                <a href={item.banner_linkUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center w-6 h-6 hover:bg-secondary rounded" data-api-unique-id="bannermanagementview-r5c30a89bf9bbfbf0-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" data-api-in-loop="1">
                                  <ExternalLink className="w-3 h-3 text-primary" data-api-unique-id="bannermanagementview-rea2fbe4eff70b55c-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" data-api-in-loop="1" />
                                </a>
                              </div>
                            </div> : '-'}
                        </TableCell>
                        <TableCell data-api-unique-id="bannermanagementview-ra4433cd74d51341a-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" data-api-in-loop="1">
                          <Input type="number" className="w-20 h-8 text-center" value={state.editingWeights[item.banner_id] ?? item.banner_sortWeight} onChange={e => handlers.setEditingWeights(prev => ({
                      ...prev,
                      [item.banner_id]: Number(e.target.value)
                    }))} onBlur={() => handlers.handleQuickUpdateSortWeight(item.banner_id, item.banner_sortWeight)} data-api-unique-id="bannermanagementview-re7c8ea8ca4451c95-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" data-api-in-loop="1" />
                        </TableCell>
                        <TableCell data-api-unique-id="bannermanagementview-r1cf7e620ca97a7ef-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" data-api-in-loop="1">
                          <div className="flex items-center gap-2" data-api-unique-id="bannermanagementview-ra5188dcb5a3c37b9-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" data-api-in-loop="1">
                            <Switch checked={item.banner_isEnabled} onCheckedChange={checked => handlers.handleQuickUpdateStatus(item.banner_id, checked)} data-api-unique-id="bannermanagementview-r71d512f92adc2a6d-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" data-api-in-loop="1" />
                            <Badge variant={item.banner_isEnabled ? "default" : "secondary"} className={item.banner_isEnabled ? "bg-accent text-accent-foreground" : ""} data-api-unique-id="bannermanagementview-r552a6572d0b5caa0-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" data-api-in-loop="1">
                              {item.banner_isEnabled ? '启用' : '禁用'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground" data-api-unique-id="bannermanagementview-rfe5a9c1d6b983a07-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" data-api-in-loop="1">
                          {new Date(item.banner_updatedAt).toLocaleString('zh-CN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                        </TableCell>
                        <TableCell className="text-right" data-api-unique-id="bannermanagementview-r854106641eff9213-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" data-api-in-loop="1">
                          <div className="flex items-center justify-end gap-1" data-api-unique-id="bannermanagementview-rdde66cff70ecbd35-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" data-api-in-loop="1">
                            <Button variant="ghost" size="icon" onClick={() => handlers.openEditModal(item)} className="text-primary hover:bg-primary hover:text-primary-foreground" data-api-unique-id="bannermanagementview-r6d69ef1b3a8873e9-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" data-api-in-loop="1">
                              <Edit2 className="w-4 h-4" data-api-unique-id="bannermanagementview-r2e12d282bf9dd77d-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" data-api-in-loop="1" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handlers.handleDelete(item.banner_id)} className="text-destructive hover:bg-destructive hover:text-destructive-foreground" data-api-unique-id="bannermanagementview-rd54470126403a97f-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" data-api-in-loop="1">
                              <Trash2 className="w-4 h-4" data-api-unique-id="bannermanagementview-r2f4eb5319ff204e2-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" data-api-in-loop="1" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>)}
                </TableBody>
              </Table>
            </div>
            {/* 分页器 */}
            <div className="flex items-center justify-between px-6 py-4 bg-secondary/30 border-t border-border" data-api-unique-id="bannermanagementview-re3000d891fe95e69-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
              <div className="text-sm text-muted-foreground" data-api-unique-id="bannermanagementview-r684e0b3efeb783b5-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                共 <span className="font-semibold text-foreground" data-api-unique-id="bannermanagementview-rf085318750ab8f18-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">{state.total}</span> 条数据
              </div>
              <div className="flex items-center gap-6" data-api-unique-id="bannermanagementview-r53c0c7992f479b2c-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                <div className="flex items-center gap-2" data-api-unique-id="bannermanagementview-red1e7fc67bcc9664-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                  <span className="text-sm text-muted-foreground" data-api-unique-id="bannermanagementview-r8bb7f05f7cf2b83d-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">每页条数:</span>
                  <Select value={state.pageSize.toString()} onValueChange={val => handlers.handlePageSizeChange(Number(val))} data-api-unique-id="bannermanagementview-rbda1368204286ed5-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                  <SelectTrigger className="h-8 w-[110px]" data-api-unique-id="bannermanagementview-r986c3855d5fa6ee1-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                      <SelectValue data-api-unique-id="bannermanagementview-r10352ea0f490ebea-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" />
                    </SelectTrigger>
                    <SelectContent data-api-unique-id="bannermanagementview-r1cdfc54e89b9da5d-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                      <SelectItem value="50" data-api-unique-id="bannermanagementview-r13d04192758a5d67-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">50条/页</SelectItem>
                      <SelectItem value="100" data-api-unique-id="bannermanagementview-r184a43712d8a73b1-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">100条/页</SelectItem>
                      <SelectItem value="200" data-api-unique-id="bannermanagementview-rbb8407bc35f24d84-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">200条/页</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2" data-api-unique-id="bannermanagementview-rf862b8acdc774c87-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handlers.setPage(p => Math.max(1, p - 1))} disabled={state.page <= 1} data-api-unique-id="bannermanagementview-r5a7b1447c6ab7e31-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                    <ChevronLeft className="w-4 h-4" data-api-unique-id="bannermanagementview-r83165c3092dbd46f-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" />
                  </Button>
                  <div className="text-sm font-medium" data-api-unique-id="bannermanagementview-r83e87cfef90f4c58-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                    {state.page} / {state.totalPages}
                  </div>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handlers.setPage(p => Math.min(state.totalPages, p + 1))} disabled={state.page >= state.totalPages} data-api-unique-id="bannermanagementview-ra5198302f2b6f314-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                    <ChevronRight className="w-4 h-4" data-api-unique-id="bannermanagementview-r9f10083a6d3d86f4-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* 弹窗：新增/编辑 */}
      <Dialog open={!!(state.formMode && state.formData)} onOpenChange={handlers.closeFormModal} data-api-unique-id="bannermanagementview-rcca600616f4384c0-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
        <DialogContent className="max-w-xl max-h-[90vh] overflow-auto p-0 border-none rounded-lg" data-api-unique-id="bannermanagementview-rbf4cf8ad3d9bdf83-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
          <DialogHeader className="px-6 py-4 border-b border-border bg-secondary/30" data-api-unique-id="bannermanagementview-r549f1c18cad42267-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
            <DialogTitle className="text-xl font-bold font-header" data-api-unique-id="bannermanagementview-r71a461c199811527-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
              {state.formMode === 'CREATE' ? '新增 Banner' : '编辑 Banner'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="px-6 py-6 space-y-6" data-api-unique-id="bannermanagementview-rcf6ee6f137ed471a-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
            {/* 标题 */}
            <div className="space-y-2" data-api-unique-id="bannermanagementview-r487c2d1e90f91c59-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
              <label className="text-sm font-semibold flex items-center gap-1" data-api-unique-id="bannermanagementview-raf5c5d09b05e8bb5-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                Banner 标题 <span className="text-muted-foreground font-normal" data-api-unique-id="bannermanagementview-re301e723e61e82ef-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">(选填)</span>
              </label>
              <Input placeholder="请输入 Banner 标题" value={state.formData?.banner_title || ''} onChange={e => handlers.handleFormFieldChange('banner_title', e.target.value)} data-api-unique-id="bannermanagementview-r98ea94dfb20f46d9-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" />
            </div>

            {/* 图片上传 */}
            <div className="space-y-2" data-api-unique-id="bannermanagementview-rba63c7ef29188869-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
              <label className="text-sm font-semibold flex items-center gap-1" data-api-unique-id="bannermanagementview-rc52b77913342ea1e-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                轮播图片 <span className="text-destructive" data-api-unique-id="bannermanagementview-rfc26b4509ea663b9-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">*</span>
              </label>
              <div className="relative" data-api-unique-id="bannermanagementview-red0ba65b7c60b6ea-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                {state.formData?.banner_imageUrl ? <div className="group relative rounded-lg border border-border overflow-hidden aspect-[21/9] bg-muted" data-api-unique-id="bannermanagementview-r6b532ec497e711f0-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                    <EditableImg propKey="formData_banner_image" keywords={state.formData.banner_imageUrl} needLargeImage description={state.formData.banner_title} className="w-full h-full object-cover" data-api-unique-id="bannermanagementview-r0dcd59c3cfac5501-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" data-api-unique-id="bannermanagementview-rb56c579d073620a5-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                      <Button variant="destructive" size="sm" onClick={() => handlers.handleFormFieldChange('banner_imageUrl', '')} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-api-unique-id="bannermanagementview-r39867a5482589ce6-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                        <Trash2 className="w-4 h-4 mr-2" data-api-unique-id="bannermanagementview-r677aea7eb68c12bc-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" />
                        移除图片
                      </Button>
                    </div>
                  </div> : <div className="relative group border-2 border-dashed border-muted-foreground/25 hover:border-primary transition-colors rounded-lg bg-muted/30 aspect-[21/9] flex flex-col items-center justify-center gap-2 cursor-pointer overflow-hidden" data-api-unique-id="bannermanagementview-rc4e26b2a68ba50b0-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" accept="image/*" onChange={handlers.handleImageUpload} disabled={state.uploading} data-api-unique-id="bannermanagementview-rf742d114c09585d3-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" />
                    <div className="flex flex-col items-center gap-2 pointer-events-none" data-api-unique-id="bannermanagementview-r66e6ccbbedf64b93-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                      <div className="p-3 rounded-full bg-white shadow-sm border border-border" data-api-unique-id="bannermanagementview-rbf62824558efd27b-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                        <UploadCloud className="w-6 h-6 text-primary" data-api-unique-id="bannermanagementview-r379b26fccbb9cd20-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" />
                      </div>
                      <div className="text-center" data-api-unique-id="bannermanagementview-r333acdcefd3b03a0-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                        <p className="text-sm font-medium text-foreground" data-api-unique-id="bannermanagementview-r6fc1688e8ac5f87d-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">点击或拖拽上传图片</p>
                        <p className="text-xs text-muted-foreground mt-1" data-api-unique-id="bannermanagementview-r9631a64f24eff2ca-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">推荐比例 21:9，支持 JPG, PNG, WEBP</p>
                      </div>
                    </div>
                    {state.uploading && <div className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center" data-api-unique-id="bannermanagementview-rc88c9b35f0e741ea-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" data-api-unique-id="bannermanagementview-rd47c9e99483ea2fe-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView"></div>
                        <span className="mt-2 text-sm font-medium text-primary" data-api-unique-id="bannermanagementview-rc6b87ffa7bcb9fd8-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">上传中...</span>
                      </div>}
                  </div>}
              </div>
            </div>

            {/* 跳转链接 */}
            <div className="space-y-2" data-api-unique-id="bannermanagementview-raee5df442c5b136f-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
              <label className="text-sm font-semibold" data-api-unique-id="bannermanagementview-r851fc6b081395417-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">跳转链接</label>
              <Input type="url" placeholder="https://example.com/target" value={state.formData?.banner_linkUrl || ''} onChange={e => handlers.handleFormFieldChange('banner_linkUrl', e.target.value)} data-api-unique-id="bannermanagementview-r0d945242178805aa-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" />
            </div>

            <div className="grid grid-cols-2 gap-6" data-api-unique-id="bannermanagementview-r73228701a8fb9276-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
              {/* 排序权重 */}
              <div className="space-y-2" data-api-unique-id="bannermanagementview-rf9a1fa4e4284cfa8-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                <label className="text-sm font-semibold" data-api-unique-id="bannermanagementview-r9bfd6730b7919324-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">排序权重</label>
                <Input type="number" value={state.formData?.banner_sortWeight || 0} onChange={e => handlers.handleFormFieldChange('banner_sortWeight', Number(e.target.value))} data-api-unique-id="bannermanagementview-r0014242d106265c6-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" />
                <p className="text-[10px] text-muted-foreground italic" data-api-unique-id="bannermanagementview-rba62556a7d76c84d-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">数值越大越靠前</p>
              </div>

              {/* 状态 */}
              <div className="space-y-2" data-api-unique-id="bannermanagementview-rc5f6aec37607ee91-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                <label className="text-sm font-semibold" data-api-unique-id="bannermanagementview-r60e9ba0636cd2d16-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">发布状态</label>
                <div className="flex items-center gap-3 h-10 px-3 rounded-md border border-input bg-background" data-api-unique-id="bannermanagementview-r5dd3c7a30050a53c-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                  <Switch checked={state.formData?.banner_isEnabled || false} onCheckedChange={checked => handlers.handleFormFieldChange('banner_isEnabled', checked)} data-api-unique-id="bannermanagementview-re0f2417b0321b4f8-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" />
                  <span className="text-sm font-medium" data-api-unique-id="bannermanagementview-rcf6940e8330b18aa-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
                    {state.formData?.banner_isEnabled ? '已启用' : '已禁用'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-border bg-secondary/10 gap-3" data-api-unique-id="bannermanagementview-rd71d026b21b1b326-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
            <Button variant="outline" onClick={handlers.closeFormModal} disabled={state.submitting} className="px-6" data-api-unique-id="bannermanagementview-r9ad4b3c17730d09f-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
              取消
            </Button>
            <Button onClick={handlers.handleFormSubmit} disabled={state.submitting} className="px-8 bg-primary text-primary-foreground hover:bg-primary/90" data-api-unique-id="bannermanagementview-r5af632f4fcd6dcb0-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView">
              {state.submitting ? <>
                  <RotateCcw className="w-4 h-4 mr-2 animate-spin" data-api-unique-id="bannermanagementview-r7b16b3f87ffd5c9c-s2171226352" data-api-unique-page-name="src/backend/components/BannerManagementView" />
                  保存中
                </> : '保存 Banner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
};
export default BannerManagementView;