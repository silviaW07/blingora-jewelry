'use client';

import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Info, Plus, Search, Package, Layers, Edit3, Trash2, ImageIcon, GalleryHorizontal, ChevronRight, ListTree, ChevronDown, Tags, Sparkles, Link2, FolderSync, ArrowRightLeft, FolderTree, CheckSquare, Megaphone, Flame, GripVertical, Minus } from 'lucide-react';
import EditableImg from '@/@base/EditableImg';
import { type CategoryManagementState, type CategoryManagementHandlers, useCategoryManagement, LEVEL_LABELS, GROUP_TYPE_LABELS } from '@/backend/hooks/useCategoryManagement';
import { canEditCategoryPriceCoefficient } from '@/shared/categoryPricing';
const STATUS_LABELS: Record<string, string> = {
  ACTIVE: '激活',
  INACTIVE: '停用',
  ALL: '全部'
};
interface Props {
  state: CategoryManagementState;
  handlers: CategoryManagementHandlers;
}
const renderKeywordTree = (nodes: CategoryManagementState['keywordGroups'][number]['keywords'], groupId: string, state: CategoryManagementState, handlers: CategoryManagementHandlers, depth = 0) => {
  return nodes.map((node, index) => {
    const expanded = !!state.expandedKeywordParents[node.keyword_item_id];
    const hasChildren = node.children.length > 0;
    return <div key={node.keyword_item_id} className="space-y-2" data-api-unique-id='categorymanagementview-r4b45ebc621587b67-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
        <div className={`rounded-xl border border-slate-200 bg-white px-4 py-3 ${depth > 0 ? 'ml-6' : ''}`} data-api-unique-id='categorymanagementview-r7ce12f06be628007-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3" data-api-unique-id='categorymanagementview-rb839774a0f3ba09e-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
            <div className="space-y-2" data-api-unique-id='categorymanagementview-r139bb41ce2f563ee-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
              <div className="flex flex-wrap items-center gap-2" data-api-unique-id='categorymanagementview-r8de942f2a2fb89a4-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700" data-api-unique-id='categorymanagementview-rdfea9590170083b4-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>{depth === 0 ? '一级关键词' : '二级关键词'}</Badge>
                <span className="font-semibold text-slate-900" data-api-unique-id='categorymanagementview-r951f8c35ae9397b3-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1' data-api-bind-info={`nodes-${index}-keyword`} data-api-map-var-name='node'>{node.keyword}</span>
                {!node.is_active ? <Badge variant="secondary" data-api-unique-id='categorymanagementview-rd709bd8f3f5541ba-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>停用</Badge> : null}
                <span className="text-xs text-muted-foreground" data-api-unique-id='categorymanagementview-r3aa6e79698fda1ce-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1' data-api-bind-info={`nodes-${index}-sort_weight`} data-api-map-var-name='node'>排序 {node.sort_weight}</span>
              </div>
              <div className="text-xs text-muted-foreground" data-api-unique-id='categorymanagementview-rcf7c16d4b80106bb-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                归一化标识：{node.normalized_keyword || '未生成'}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-end" data-api-unique-id='categorymanagementview-rb37710ec0bdc8dcc-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
              {depth === 0 ? <Button variant="outline" size="sm" className="border-slate-200" onClick={() => handlers.openCreateKeywordItemDialog(groupId, node.keyword_item_id)} data-api-unique-id='categorymanagementview-rebd4dee0bac4a36f-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                  <Plus className="w-3.5 h-3.5 mr-1" data-api-unique-id='categorymanagementview-rd3df980df1a8f453-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1' />
                  新增二级关键词
                </Button> : null}
              <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10" onClick={() => handlers.openEditKeywordItemDialog(groupId, node)} data-api-unique-id='categorymanagementview-rc66489ca1892fbe7-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                <Edit3 className="w-3.5 h-3.5 mr-1" data-api-unique-id='categorymanagementview-r160d89878278107c-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1' />
                编辑
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handlers.handleDeleteKeywordItem(node.keyword_item_id)} disabled={state.deletingKeywordItemId === node.keyword_item_id} data-api-unique-id='categorymanagementview-r786e810986aae487-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                <Trash2 className="w-3.5 h-3.5 mr-1" data-api-unique-id='categorymanagementview-r4207d43a5ac9ee1b-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1' />
                {state.deletingKeywordItemId === node.keyword_item_id ? '删除中...' : '删除'}
              </Button>
              {hasChildren ? <Button variant="ghost" size="sm" onClick={() => handlers.toggleKeywordParentExpanded(node.keyword_item_id)} data-api-unique-id='categorymanagementview-r2370c38b2df2acad-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                  {expanded ? <ChevronDown className="w-4 h-4 mr-1" data-api-unique-id='categorymanagementview-r10f095c46b5f0b1c-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1' /> : <ChevronRight className="w-4 h-4 mr-1" data-api-unique-id='categorymanagementview-ra45282b0e3e5c0f6-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1' />}
                  {expanded ? '收起二级词' : `查看二级词 (${node.child_count})`}
                </Button> : null}
            </div>
          </div>
        </div>
        {hasChildren && expanded ? <div className="space-y-2" data-api-unique-id='categorymanagementview-rfe1942aa8f76b316-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
            {renderKeywordTree(node.children, groupId, state, handlers, depth + 1)}
          </div> : null}
      </div>;
  });
};
export const CategoryManagementView = ({
  state,
  handlers
}: Props) => {
  const categoryDisplayRows = state.categoryDisplayRows;
  const isNameFiltering = Boolean(state.nameFilterInput.trim());
  const tableColSpan = 12;
  const allCurrentPageSelected = categoryDisplayRows.length > 0 && categoryDisplayRows.every(row => state.selectedCategoryIds.includes(row.item.category_id));
  /* Extracted array: _items */
  const _items = [50, 100, 200];
  return <div className="min-h-screen bg-background font-body" data-api-unique-id='categorymanagementview-rd7999e89a992169f-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
      <section className="w-full bg-card border-b" data-controller-name="分类管理头部" data-api-unique-id='categorymanagementview-rda00c96bb26d964b-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
        <div className="container mx-auto px-8 py-6" data-api-unique-id='categorymanagementview-rda232d5e383e5a4e-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" data-api-unique-id='categorymanagementview-r2c30d6123a46844c-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
            <div data-api-unique-id='categorymanagementview-r4ed3b080933fdd3c-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
              <h1 className="text-2xl font-bold font-header tracking-tight text-foreground flex items-center gap-2" data-api-unique-id='categorymanagementview-raf68ac42127af3e5-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                <Layers className="w-6 h-6 text-primary" data-api-unique-id='categorymanagementview-r8952b95b283a0265-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                分类管理
              </h1>
              <p className="text-muted-foreground mt-1 text-sm" data-api-unique-id='categorymanagementview-r18a08e53d7347948-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                维护分类树、关键词运营映射与前台目录展示顺序。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3" data-api-unique-id='categorymanagementview-r10b1e29f97c51c56-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
              <Button variant="outline" onClick={() => handlers.openCreateDrawer(2)} className="border-slate-200 hover:bg-slate-50 font-medium" data-api-unique-id='categorymanagementview-r3f43b4aa2664773a-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                <Plus className="w-4 h-4 mr-2" data-api-unique-id='categorymanagementview-r52c509aec6464584-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                新增二级分类
              </Button>
              <Button onClick={() => handlers.openCreateDrawer(1)} className="bg-primary text-primary-foreground hover:bg-primary font-medium" data-api-unique-id='categorymanagementview-rf70a54ffb3198837-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                <Plus className="w-4 h-4 mr-2" data-api-unique-id='categorymanagementview-r3b3a7bfb74bae6b2-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                新增一级分类
              </Button>
            </div>
          </div>

          <Alert className="mt-6 border-blue-100 bg-blue-50/50" data-api-unique-id='categorymanagementview-r64a0624811b27094-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
            <Info className="h-4 w-4 text-primary" data-api-unique-id='categorymanagementview-r1da1f94c1df2efdf-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
            <AlertTitle className="text-primary font-bold" data-api-unique-id='categorymanagementview-r21f6aea35ef8eb20-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>同步说明</AlertTitle>
            <AlertDescription className="text-secondary-foreground text-sm space-y-2" data-api-unique-id='categorymanagementview-r39ff854e9dd7f437-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
              <div data-api-unique-id='categorymanagementview-rb2f6f510bd2b4086-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>前台仅展示状态为 <Badge variant="outline" className="bg-accent text-accent-foreground border-none px-1 h-5" data-api-unique-id='categorymanagementview-r9be4c349d99bc081-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>{STATUS_LABELS.ACTIVE}</Badge> 的分类及其商品。</div>
              <div data-api-unique-id='categorymanagementview-r1737ba8fcf380147-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>关键词运营区支持品牌类、当日上新类、促销类、通用类分组，并可批量同步到首页推荐来源。</div>
            </AlertDescription>
          </Alert>

          <Card className="mt-4 border-slate-200 shadow-sm" data-controller-name="多子类快捷创建区" data-api-unique-id='categorymanagementview-r2fd4cf5885d29083-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
            <div className="p-5 space-y-4" data-api-unique-id='categorymanagementview-rd8f533809fccfe93-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4" data-api-unique-id='categorymanagementview-r0c8d6a491a3d138b-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                <div className="space-y-2" data-api-unique-id='categorymanagementview-re80cf477d6e9fd57-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                  <div className="flex items-center gap-2 text-slate-900" data-api-unique-id='categorymanagementview-rb40be13f4e731266-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                    <ListTree className="w-4 h-4 text-primary" data-api-unique-id='categorymanagementview-rda1b695616e21aa1-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                    <p className="text-sm font-semibold" data-api-unique-id='categorymanagementview-rdabcc96ad09b700a-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>多子类快捷创建</p>
                  </div>
                  <p className="text-sm text-muted-foreground" data-api-unique-id='categorymanagementview-r887a509cda2bc87f-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>选择一级分类后，可一次录入多行子类名称并批量创建；每行一个名称，创建完成后会同步刷新分类列表。</p>
                </div>
                <div className="flex flex-wrap gap-2" data-api-unique-id='categorymanagementview-rca712771aa62abf0-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                  {state.parentOptions.length > 0 ? state.parentOptions.slice(0, 4).map((parent, index) => <Button key={parent.category_id} variant="outline" onClick={() => handlers.openCreateDrawer(2, parent.category_id)} className="border-slate-200 hover:bg-slate-50" data-api-unique-id='categorymanagementview-r4c4ad3cd957a23e0-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                      <Plus className="w-4 h-4 mr-2" data-api-unique-id='categorymanagementview-r98c6c4eab21587d7-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1' />
                      新增 {parent.category_name} 子类
                    </Button>) : <div className="text-sm text-muted-foreground" data-api-unique-id='categorymanagementview-rb4ebfccbd06df194-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>请先创建一级分类后再批量补充子类。</div>}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[220px_1fr_auto] items-start" data-api-unique-id='categorymanagementview-re410129a5fe36ebe-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                <div className="space-y-2" data-api-unique-id='categorymanagementview-r32cfbdeca08feb45-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                  <label className="text-xs font-bold text-slate-500 uppercase" data-api-unique-id='categorymanagementview-ra4b7247a8b3b7319-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>目标一级分类</label>
                  <Select value={state.quickCreateParentId || undefined} onValueChange={value => handlers.setQuickCreateParentId(value)} data-api-unique-id='categorymanagementview-r09c34ff1f2b797c7-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                    <SelectTrigger className="h-10 border-slate-200 focus:ring-primary" data-api-unique-id='categorymanagementview-r3b1b56cdc2e49807-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                      <SelectValue placeholder="请选择一级分类" data-api-unique-id='categorymanagementview-re3c89310f07914b1-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                    </SelectTrigger>
                    <SelectContent data-api-unique-id='categorymanagementview-refc4fb4ffd4e59f3-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                      {state.parentOptions.map((option, index) => <SelectItem key={option.category_id} value={option.category_id} data-api-unique-id='categorymanagementview-r6ec7a9481e8b4395-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>{option.category_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2" data-api-unique-id='categorymanagementview-r85047601e751a5c5-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                  <label className="text-xs font-bold text-slate-500 uppercase" data-api-unique-id='categorymanagementview-r22ba00b1aae2b286-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>子类名称（每行一个）</label>
                  <Textarea placeholder={'例如：\n蓝牙耳机\n智能手表\n平板电脑'} className="min-h-[108px] border-slate-200 focus-visible:ring-primary resize-none" value={state.quickCreateNames} onChange={e => handlers.setQuickCreateNames(e.target.value)} data-api-unique-id='categorymanagementview-r1a46e7124f39a76c-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                </div>
                <div className="pt-7" data-api-unique-id='categorymanagementview-rc80be84137a3d74b-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                  <Button onClick={handlers.submitQuickCreate} disabled={state.isQuickCreating || state.parentOptions.length === 0} className="bg-primary text-primary-foreground hover:bg-primary min-w-[128px]" data-api-unique-id='categorymanagementview-rdc5842d73006a718-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                    <Plus className="w-4 h-4 mr-2" data-api-unique-id='categorymanagementview-r3941fcf1a4d2e3d7-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                    {state.isQuickCreating ? '创建中...' : '批量创建'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="w-full bg-background" data-controller-name="筛选控制台" data-api-unique-id='categorymanagementview-r5a59f238c7725b43-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
        <div className="container mx-auto px-8 py-4 space-y-4" data-api-unique-id='categorymanagementview-r5a5f36d2d59c9cac-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
          <Card className="p-2 border-slate-200 shadow-sm" data-api-unique-id='categorymanagementview-r4d36e846c228764b-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
            <div className="flex flex-wrap items-center justify-between gap-4" data-api-unique-id='categorymanagementview-rd0b54f1b3b472869-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
              <Tabs value={state.status || 'ALL'} onValueChange={handlers.handleTabChange} className="w-auto" data-api-unique-id='categorymanagementview-r1c538c24e4e2f99e-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                <TabsList className="bg-secondary h-10 p-1" data-api-unique-id='categorymanagementview-rc3fbe4f5a96490c4-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                  <TabsTrigger value="ALL" className="px-6 h-8 data-[state=active]:bg-card" data-api-unique-id='categorymanagementview-r726f08ea87c48863-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>全部</TabsTrigger>
                  <TabsTrigger value="ACTIVE" className="px-6 h-8 data-[state=active]:bg-card" data-api-unique-id='categorymanagementview-r24b9b398b769d440-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>{STATUS_LABELS.ACTIVE}</TabsTrigger>
                  <TabsTrigger value="INACTIVE" className="px-6 h-8 data-[state=active]:bg-card" data-api-unique-id='categorymanagementview-rbede00cd5e37c3e5-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>{STATUS_LABELS.INACTIVE}</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center gap-2 flex-grow max-w-md" data-api-unique-id='categorymanagementview-r67cbe73b59fce7fd-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                <div className="relative flex-grow" data-api-unique-id='categorymanagementview-r273ba9a535cd0d79-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                  <Input placeholder="搜索分类名称或标识..." className="h-10 pl-4 pr-10 border-slate-200 focus-visible:ring-primary" value={state.searchInput} onChange={e => handlers.setSearchInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handlers.handleSearch()} data-api-unique-id='categorymanagementview-r73d4e719269cd1ad-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                </div>
                <Button onClick={handlers.handleSearch} variant="secondary" className="h-10 bg-secondary text-secondary-foreground hover:bg-muted border border-slate-200 px-6" data-api-unique-id='categorymanagementview-rfa622b84212fe5e0-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                  <Search className="w-4 h-4 mr-2" data-api-unique-id='categorymanagementview-r8b3910665aeec733-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                  查询
                </Button>
              </div>
            </div>
          </Card>

          <Card className="border-slate-200 shadow-sm" data-controller-name="分类批量管理工具栏" data-api-unique-id='categorymanagementview-r1888055e2a3aa366-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
            <div className="p-5 space-y-4" data-api-unique-id='categorymanagementview-r93ce9f141efcdd97-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4" data-api-unique-id='categorymanagementview-r9eaa56b7f7670740-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                <div data-api-unique-id='categorymanagementview-r79d17faa01698223-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                  <div className="flex items-center gap-2 text-slate-900" data-api-unique-id='categorymanagementview-rd8e62ca6726260af-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                    <CheckSquare className="w-4 h-4 text-primary" data-api-unique-id='categorymanagementview-r1c20721af1aa96ef-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                    <p className="text-sm font-semibold" data-api-unique-id='categorymanagementview-rc44792544ebd2c47-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>分类层级批量管理</p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1" data-api-unique-id='categorymanagementview-raa3905b68bdcd928-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>支持多选后统一删除、启用、停用与移动父分类；批量移动仅对二级分类生效。</p>
                </div>
                <div className="flex flex-wrap gap-2" data-api-unique-id='categorymanagementview-r8c5bf84323f6078f-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                  <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700" data-api-unique-id='categorymanagementview-r9b0cd21752a660ed-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>已选 {state.selectedCategoryIds.length} 项</Badge>
                  {state.batchFeedback ? <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700" data-api-unique-id='categorymanagementview-r41a70ac66b5d48ad-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>最近操作：成功 {state.batchFeedback.success_count} / 失败 {state.batchFeedback.failed_count}</Badge> : null}
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto_auto] items-end" data-api-unique-id='categorymanagementview-rbf48a1ea0ea36afc-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                <div className="space-y-2" data-api-unique-id='categorymanagementview-r9bc55fbee25b018b-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                  <label className="text-xs font-bold text-slate-500 uppercase" data-api-unique-id='categorymanagementview-r3a7f5202b2053274-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>批量移动目标父分类</label>
                  <Select value={state.batchTargetParentId || 'none'} onValueChange={value => handlers.setBatchTargetParentId(value === 'none' ? null : value)} data-api-unique-id='categorymanagementview-r5fa6e706e3f1697c-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                    <SelectTrigger className="h-10 border-slate-200 focus:ring-primary" data-api-unique-id='categorymanagementview-r80c16aa3e105f2fa-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                      <SelectValue placeholder="保留当前父分类" data-api-unique-id='categorymanagementview-r30b91b65ae275dc9-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                    </SelectTrigger>
                    <SelectContent data-api-unique-id='categorymanagementview-rd8e74d3729a6f1bb-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                      <SelectItem value="none" data-api-unique-id='categorymanagementview-r6368637f69f39877-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>移动到顶层 / 清空父分类</SelectItem>
                      {state.parentOptions.map((option, index) => <SelectItem key={option.category_id} value={option.category_id} data-api-unique-id='categorymanagementview-r57c556f22875ec9e-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>{option.category_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" className="border-slate-200" disabled={state.isBatchProcessing} onClick={() => handlers.handleBatchStatus('ACTIVE')} data-api-unique-id='categorymanagementview-r352aa71671e4a4a0-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                  批量启用
                </Button>
                <Button variant="outline" className="border-slate-200" disabled={state.isBatchProcessing} onClick={() => handlers.handleBatchStatus('INACTIVE')} data-api-unique-id='categorymanagementview-r485168ecfe19d2ec-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                  批量停用
                </Button>
                <Button variant="outline" className="border-slate-200" disabled={state.isBatchProcessing} onClick={handlers.handleBatchMoveParent} data-api-unique-id='categorymanagementview-ra50f78565aa68935-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                  <ArrowRightLeft className="w-4 h-4 mr-2" data-api-unique-id='categorymanagementview-r0d9fc1e82777c161-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                  移动父分类
                </Button>
                <Button variant="destructive" disabled={state.isBatchProcessing} onClick={handlers.handleBatchDelete} data-api-unique-id='categorymanagementview-r481f9a56a47c00f6-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                  <Trash2 className="w-4 h-4 mr-2" data-api-unique-id='categorymanagementview-r4aa9202adbfb6697-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                  批量删除
                </Button>
              </div>

              {state.batchFeedback?.failed_messages?.length ? <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" data-api-unique-id='categorymanagementview-r97ea4a1ef4ff0695-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                  <div className="font-medium mb-2" data-api-unique-id='categorymanagementview-r1d328a357de00299-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>部分记录未处理：</div>
                  <ul className="space-y-1 list-disc list-inside" data-api-unique-id='categorymanagementview-rae905a145c1da524-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                    {state.batchFeedback.failed_messages.map((message, index) => <li key={message} data-api-unique-id='categorymanagementview-r34ae79ff32664a94-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>{message}</li>)}
                  </ul>
                </div> : null}
            </div>
          </Card>
        </div>
      </section>

      <section className="w-full bg-background" data-controller-name="分类数据表格" data-api-unique-id='categorymanagementview-rb247ccb9f726dc3a-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
        <div className="container mx-auto px-8 py-0 space-y-4" data-api-unique-id='categorymanagementview-r962ab9befabe7a84-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
          <Card className="p-4 border-slate-200 shadow-sm" data-controller-name="层级筛选区">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">层级筛选</p>
                <p className="text-xs text-muted-foreground mt-1">选择层级或输入名称/slug 模糊搜索，下方表格实时过滤（仅当前页）。</p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-[280px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={state.nameFilterInput}
                    onChange={e => handlers.setNameFilterInput(e.target.value)}
                    placeholder="输入分类名称模糊搜索..."
                    className="h-10 border-slate-200 bg-white pl-9 focus-visible:ring-primary"
                  />
                </div>
                <div className="w-full sm:w-[160px]">
                  <Select
                    value={state.levelFilter}
                    onValueChange={value => handlers.handleLevelChange(value as 'ALL' | '1' | '2')}
                  >
                    <SelectTrigger className="h-10 border-slate-200 bg-white focus:ring-primary">
                      <SelectValue placeholder="选择层级" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">全部</SelectItem>
                      <SelectItem value="1">一级分类</SelectItem>
                      <SelectItem value="2">二级分类</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-slate-200 shadow-sm overflow-hidden" data-api-unique-id='categorymanagementview-r7753a42d7464c0c9-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
            <Table data-api-unique-id='categorymanagementview-rdc4a23b084c1f0ab-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
              <TableHeader className="bg-slate-50" data-api-unique-id='categorymanagementview-ra4460994da9b43b8-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                <TableRow className="hover:bg-transparent border-slate-200" data-api-unique-id='categorymanagementview-r0d16ac1ee4bc87c5-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                  <TableHead className={`${state.useCategoryTreeView ? 'w-[88px]' : 'w-[58px]'} font-bold text-slate-700 h-12 pl-4`} data-api-unique-id='categorymanagementview-r6231c74e6987f21e-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                    <Checkbox checked={allCurrentPageSelected} onCheckedChange={checked => handlers.toggleSelectAllCurrentPage(Boolean(checked))} data-api-unique-id='categorymanagementview-r46242f4d72332105-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                  </TableHead>
                  <TableHead className="w-9 px-0 font-bold text-slate-700 h-12" title="一级分类拖拽排序" />
                  <TableHead className="w-[120px] font-bold text-slate-700 h-12" data-api-unique-id='categorymanagementview-rde6692fea6d561e5-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>分类主图</TableHead>
                  <TableHead className="font-bold text-slate-700 h-12" data-api-unique-id='categorymanagementview-r3128a56013b2c504-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>分类名称与标识</TableHead>
                  <TableHead className="w-[180px] font-bold text-slate-700 h-12" data-api-unique-id='categorymanagementview-re5ac5124e00f2dac-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>上级分类</TableHead>
                  <TableHead className="w-[120px] font-bold text-slate-700 h-12">系数</TableHead>
                  <TableHead className="w-[120px] font-bold text-slate-700 h-12" data-api-unique-id='categorymanagementview-r4e7cc6cd3315d951-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>层级</TableHead>
                  <TableHead className="w-[140px] font-bold text-slate-700 h-12" data-api-unique-id='categorymanagementview-r57adb2a3f007f034-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>Banner 图</TableHead>
                  <TableHead className="font-bold text-slate-700 h-12" data-api-unique-id='categorymanagementview-rbc65890f12054450-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>关联商品 / 子类 / 关键词</TableHead>
                  <TableHead className="w-[140px] font-bold text-slate-700 h-12" data-api-unique-id='categorymanagementview-r4914f3c4d078def6-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>排序权重</TableHead>
                  <TableHead className="w-[160px] font-bold text-slate-700 h-12" data-api-unique-id='categorymanagementview-r3b2c157b7308a786-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>当前状态</TableHead>
                  <TableHead className="w-[240px] text-right font-bold text-slate-700 h-12" data-api-unique-id='categorymanagementview-r68b6911a27ecfc34-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody data-api-unique-id='categorymanagementview-rf147fe052568b7fc-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                {state.isLoading ? <TableRow data-api-unique-id='categorymanagementview-ra266efe56f24d0a2-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                    <TableCell colSpan={12} className="h-64 text-center text-muted-foreground" data-api-unique-id='categorymanagementview-rf431594342e9e952-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                      <div className="flex flex-col items-center justify-center gap-2" data-api-unique-id='categorymanagementview-r6186f4ce0673eb3b-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" data-api-unique-id='categorymanagementview-r0bd068f878899bc0-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                        数据载入中...
                      </div>
                    </TableCell>
                  </TableRow> : categoryDisplayRows.length === 0 ? <TableRow data-api-unique-id='categorymanagementview-rd1efcfc116a3b6f9-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                    <TableCell colSpan={12} className="h-64 text-center text-muted-foreground" data-api-unique-id='categorymanagementview-rf7a21656813795e3-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                      <div className="flex flex-col items-center justify-center gap-2" data-api-unique-id='categorymanagementview-r42cb93047700b134-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                        <Package className="w-12 h-12 opacity-20" data-api-unique-id='categorymanagementview-r40c81e09773c2a30-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                        {isNameFiltering && state.list.length > 0
                          ? '无匹配分类，请调整搜索词'
                          : '暂无符合条件的分类数据'}
                      </div>
                    </TableCell>
                  </TableRow> : categoryDisplayRows.map(row => {
                    const { item, rowKind } = row;
                    const isLevel1 = rowKind === 'level1';
                    const isChildRow = rowKind === 'level2-child';
                    const isExpanded = state.expandedCategoryIds.includes(item.category_id);
                    const canExpand = state.useCategoryTreeView && isLevel1 && item.child_count > 0;
                    const canDrag = isLevel1 && !isNameFiltering;

                    return <TableRow
                    key={isChildRow ? `${row.parentCategoryId}-${item.category_id}` : item.category_id}
                    draggable={canDrag}
                    onDragStart={() => handlers.onLevel1DragStart(item.category_id)}
                    onDragEnter={() => handlers.onLevel1DragEnter(item.category_id)}
                    onDragEnd={() => { void handlers.onLevel1DragEnd(); }}
                    onDragOver={e => {
                      if (canDrag) e.preventDefault();
                    }}
                    className={`hover:bg-slate-50/50 transition-colors border-slate-100 ${canDrag ? 'cursor-grab active:cursor-grabbing' : ''} ${isChildRow ? 'bg-slate-50/80' : ''}`}
                    data-api-unique-id='categorymanagementview-r81787edcfc26e030-s2437821645'
                    data-api-unique-page-name='src/backend/components/CategoryManagementView'
                    data-api-in-loop='1'
                  >
                      <TableCell className="pl-4" data-api-unique-id='categorymanagementview-r2deed9701c82c412-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                        <div className="flex items-center gap-1">
                          {canExpand ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0 text-slate-600"
                              onClick={() => handlers.toggleCategoryExpanded(item.category_id)}
                              title={isExpanded ? '折叠子分类' : '展开子分类'}
                            >
                              {isExpanded ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            </Button>
                          ) : isChildRow ? (
                            <span className="inline-block h-7 w-7 shrink-0" />
                          ) : null}
                          <Checkbox checked={state.selectedCategoryIds.includes(item.category_id)} onCheckedChange={checked => handlers.toggleCategorySelection(item.category_id, Boolean(checked))} data-api-unique-id='categorymanagementview-rd9325ea7b4037a28-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1' />
                        </div>
                      </TableCell>
                      <TableCell className="w-9 px-1">
                        {canDrag ? (
                          <div
                            className="mx-auto flex h-8 w-8 items-center justify-center rounded-md border border-pink-300 bg-pink-50 text-pink-600 shadow-sm"
                            title="拖拽调整一级分类顺序"
                            onMouseDown={e => e.stopPropagation()}
                          >
                            <GripVertical className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="mx-auto h-8 w-8" />
                        )}
                      </TableCell>
                      <TableCell data-api-unique-id='categorymanagementview-r7932a0fb94e889d2-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                        <div
                          className="relative w-16 h-16 rounded-md overflow-hidden border border-slate-200 bg-slate-50"
                          data-api-unique-id='categorymanagementview-ra6bb3b37ecb48281-s2437821645'
                          data-api-unique-page-name='src/backend/components/CategoryManagementView'
                          data-api-in-loop='1'
                          onDragOver={e => {
                            const hasFiles = e.dataTransfer?.files && e.dataTransfer.files.length > 0;
                            if (!hasFiles) return;
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onDrop={e => {
                            const file = e.dataTransfer?.files?.[0];
                            if (!file) return;
                            e.preventDefault();
                            e.stopPropagation();
                            void handlers.uploadCategoryMainImageFile(item, file);
                          }}
                        >
                          <EditableImg
                            propKey={`cat-img-${item.category_id}`}
                            keywords={item.image_url || item.category_name}
                            className="w-full h-full object-cover"
                            data-api-unique-id='categorymanagementview-re1c77af1ae64e29a-s2437821645'
                            data-api-unique-page-name='src/backend/components/CategoryManagementView'
                            data-api-in-loop='1'
                          />

                          {/* 本地上传：点击/选择文件 */}
                          <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            data-api-unique-id='categorymanagementview-cat-main-image-upload-input'
                            data-api-unique-page-name='src/backend/components/CategoryManagementView'
                            data-api-in-loop='1'
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              void handlers.uploadCategoryMainImageFile(item, file);
                              e.currentTarget.value = '';
                            }}
                          />

                          {state.uploadingMainImageCategoryId === item.category_id ? (
                            <div className="absolute inset-0 bg-black/40 z-10 flex items-center justify-center">
                              <span className="text-sm font-medium text-white">上传中...</span>
                            </div>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell data-api-unique-id='categorymanagementview-r241e5afd5c55efc1-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                        <div className={`flex flex-col gap-1 ${isChildRow ? 'pl-6 border-l-2 border-slate-200' : ''}`} data-api-unique-id='categorymanagementview-r3a4bc8fe1a89be5e-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                          <div className="flex items-center gap-2 flex-wrap" data-api-unique-id='categorymanagementview-r0d4d2d04e2cde9a4-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                            {state.inlineNameEditingId === item.category_id ? (
                              <Input
                                autoFocus
                                className="h-9 min-w-[180px] max-w-[260px]"
                                value={state.inlineNameValue}
                                disabled={state.isInlineNameSaving}
                                onChange={e => handlers.changeInlineNameValue(e.target.value)}
                                onBlur={() => void handlers.submitInlineNameEdit(item)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    void handlers.submitInlineNameEdit(item);
                                  }
                                  if (e.key === 'Escape') {
                                    e.preventDefault();
                                    handlers.cancelInlineNameEdit();
                                  }
                                }}
                                data-api-unique-id='categorymanagementview-rinlineeditname-s2437821645'
                                data-api-unique-page-name='src/backend/components/CategoryManagementView'
                                data-api-in-loop='1'
                              />
                            ) : (
                              <span
                                className="font-semibold text-slate-900 leading-tight cursor-text"
                                onDoubleClick={() => handlers.startInlineNameEdit(item)}
                                title="双击修改名称"
                                data-api-unique-id='categorymanagementview-r8c5fabe8f9899c3d-s2437821645'
                                data-api-unique-page-name='src/backend/components/CategoryManagementView'
                                data-api-in-loop='1'
                              >
                                {item.category_name}
                              </span>
                            )}
                            {item.level === 2 ? <ChevronRight className="w-3.5 h-3.5 text-slate-400" data-api-unique-id='categorymanagementview-r8be3e533520daa86-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1' /> : null}
                            {item.category_kind === 'BRAND' ? <Badge className="bg-purple-100 text-purple-700 border-none" data-api-unique-id='categorymanagementview-r566355b851acef40-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>品牌目录</Badge> : null}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap" data-api-unique-id='categorymanagementview-r09c0a21a1a7aa9a8-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                            <code className="text-[11px] font-mono text-muted-foreground bg-slate-100 px-1.5 py-0.5 rounded w-fit" data-api-unique-id='categorymanagementview-r3710e0aafd603c08-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                              {item.category_slug || '未填写 slug'}
                            </code>
                            {!item.category_slug ? <span className="text-[11px] text-muted-foreground" data-api-unique-id='categorymanagementview-ra85cc5c8fd22655d-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>保存时将按名称自动生成</span> : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell data-api-unique-id='categorymanagementview-rf07f1415dc22d7bc-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                        {item.parent_name ? <div className="flex flex-col gap-1" data-api-unique-id='categorymanagementview-r8c049b40188de085-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                            <span className="text-sm font-medium text-slate-800" data-api-unique-id='categorymanagementview-r2628df825b54d0f6-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>{item.parent_name}</span>
                            <span className="text-[11px] text-muted-foreground" data-api-unique-id='categorymanagementview-r5b947b86b8eea209-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>所属一级目录</span>
                          </div> : <span className="text-sm text-muted-foreground" data-api-unique-id='categorymanagementview-r3490dae0fc039438-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>— 顶级目录 —</span>}
                      </TableCell>
                      <TableCell>
                        {canEditCategoryPriceCoefficient({ level: item.level, parentId: item.parent_id, name: item.category_name }) ? (
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            className="h-9 w-24 text-center border-slate-200 focus:border-primary"
                            value={state.coefficientInputs[item.category_id] ?? (item.price_coefficient ?? '')}
                            onChange={e => handlers.handleInlineCoefficientChange(item.category_id, e.target.value)}
                            onBlur={() => handlers.handleInlineCoefficientBlur(item)}
                            placeholder={
                              item.level === 1
                                ? '1'
                                : item.parent_price_coefficient != null && item.parent_price_coefficient > 0
                                  ? `继承 ${Number(item.parent_price_coefficient).toFixed(2)}`
                                  : '继承上级'
                            }
                          />
                        ) : (
                          <span className="text-sm text-muted-foreground opacity-60">--</span>
                        )}
                      </TableCell>
                      <TableCell data-api-unique-id='categorymanagementview-r036b89fd6f3fc413-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700" data-api-unique-id='categorymanagementview-r9740e404aefbde4e-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                          {LEVEL_LABELS[item.level]}
                        </Badge>
                      </TableCell>
                      <TableCell data-api-unique-id='categorymanagementview-r35273de0ed44ca3c-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                        {item.banner_image_url ? <div className="w-20 h-12 rounded-md overflow-hidden border border-slate-200 bg-slate-50" data-api-unique-id='categorymanagementview-r334529a857362463-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                            <EditableImg propKey={`cat-banner-${item.category_id}`} keywords={item.banner_image_url} className="w-full h-full object-cover" data-api-unique-id='categorymanagementview-r7dac5602200d9846-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1' />
                          </div> : <div className="w-20 h-12 rounded-md border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-[10px] text-muted-foreground" data-api-unique-id='categorymanagementview-r489463b355106711-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                            未配置
                          </div>}
                      </TableCell>
                      <TableCell data-api-unique-id='categorymanagementview-r192bbd8cb28ae909-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                        <div className="flex flex-col gap-1 text-sm text-slate-700" data-api-unique-id='categorymanagementview-r0e47c06463e089dd-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                          <span data-api-unique-id='categorymanagementview-r5fd1eb521ae50d52-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'><span className="font-semibold" data-api-unique-id='categorymanagementview-r932f5edcee15c0e7-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>{item.product_count}</span> 个商品</span>
                          <span className="text-xs text-muted-foreground" data-api-unique-id='categorymanagementview-r87244664f5eabc21-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>{item.child_count} 个子类</span>
                          <span className="text-xs text-muted-foreground" data-api-unique-id='categorymanagementview-rdd8e123615ca48fb-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>{item.keyword_link_count} 个关键词映射 / 其中 {item.homepage_keyword_link_count} 个已同步首页</span>
                        </div>
                      </TableCell>
                      <TableCell data-api-unique-id='categorymanagementview-r7497139a0b9ec073-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                        <Input type="number" className="h-9 w-24 text-center border-slate-200 focus:border-primary" value={state.weightInputs[item.category_id] ?? item.sort_weight} onChange={e => handlers.handleInlineWeightChange(item.category_id, e.target.value)} onBlur={() => handlers.handleInlineWeightBlur(item)} data-api-unique-id='categorymanagementview-rd51101ca4b5b909e-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1' />
                      </TableCell>
                      <TableCell data-api-unique-id='categorymanagementview-r05998f2e2b96a742-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                        <div className="flex items-center gap-3" data-api-unique-id='categorymanagementview-r0b509998bdd02b1c-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                          <Switch checked={item.status === 'ACTIVE'} onCheckedChange={checked => handlers.handleInlineStatusChange(item, checked)} className="data-[state=checked]:bg-accent" data-api-unique-id='categorymanagementview-r8270e90361820861-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1' />
                          <Badge variant={item.status === 'ACTIVE' ? 'default' : 'secondary'} className={`${item.status === 'ACTIVE' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'} border-none rounded-sm px-2 py-0 h-6 text-[11px] font-bold`} data-api-unique-id='categorymanagementview-r76ff2cf7ac2dfbf0-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                            {STATUS_LABELS[item.status]}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right" data-api-unique-id='categorymanagementview-r823f5c26b7ea092d-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                        <div className="flex justify-end flex-wrap gap-2" data-api-unique-id='categorymanagementview-rd72cbc2231355588-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                          {item.can_configure_poster ? <Button variant="ghost" size="sm" className="h-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={() => handlers.openPosterDrawer(item)} data-api-unique-id='categorymanagementview-r3ef40af9468711d3-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                              <GalleryHorizontal className="w-3.5 h-3.5 mr-1" data-api-unique-id='categorymanagementview-r56404b01bc29d771-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1' />
                              海报配置
                            </Button> : null}
                          {item.level === 1 && item.category_kind === 'MAIN' ? <Button variant="ghost" size="sm" className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => handlers.openCreateDrawer(2, item.category_id)} data-api-unique-id='categorymanagementview-r8208af5abe118eb9-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                              <Plus className="w-3.5 h-3.5 mr-1" data-api-unique-id='categorymanagementview-rd3fcb7e7df04f2cf-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1' />
                              新增子类
                            </Button> : null}
                          <Button variant="ghost" size="sm" className="h-8 text-primary hover:text-primary hover:bg-primary/10" onClick={() => handlers.navigateToDetail(item.category_id)} data-api-unique-id='categorymanagementview-rb23e2099d3139b6d-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                            <Edit3 className="w-3.5 h-3.5 mr-1" data-api-unique-id='categorymanagementview-ra70f3f1d410a360b-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1' />
                            编辑
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handlers.setDeleteItem(item)} data-api-unique-id='categorymanagementview-r1713d777299b0a17-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                            <Trash2 className="w-3.5 h-3.5 mr-1" data-api-unique-id='categorymanagementview-r7b25ea913953a253-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1' />
                            删除
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>;
                  })}
              </TableBody>
            </Table>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white px-4 py-3" data-controller-name="分页导航">
            <p className="text-sm text-slate-500">
              共 <span className="font-medium text-slate-900">{state.total}</span> 条分类记录 · 每页{' '}
              <span className="font-medium text-slate-900">{state.pageSize}</span> 条
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>每页</span>
                <Select value={String(state.pageSize)} onValueChange={(val) => handlers.handlePageSizeChange(Number(val))}>
                  <SelectTrigger className="h-9 w-[120px] border-slate-200 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50条/页</SelectItem>
                    <SelectItem value="100">100条/页</SelectItem>
                    <SelectItem value="200">200条/页</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Pagination>
                <PaginationContent className="gap-2">
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlers.setPage(p => Math.max(1, p - 1))}
                    className={`h-10 cursor-pointer ${state.page === 1 ? 'pointer-events-none opacity-50' : ''}`}
                  />
                </PaginationItem>
                <div className="flex items-center px-3 text-sm font-medium text-slate-500">
                  第 <span className="mx-1 text-slate-900">{state.page}</span> / {state.totalPages} 页
                </div>
                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlers.setPage(p => Math.min(state.totalPages, p + 1))}
                    className={`h-10 cursor-pointer ${state.page === state.totalPages ? 'pointer-events-none opacity-50' : ''}`}
                  />
                </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-background mt-6" data-controller-name="关键词运营区" data-api-unique-id='categorymanagementview-r274401cd846c6833-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
        <div className="container mx-auto px-8 py-0" data-api-unique-id='categorymanagementview-rf07289b6711cf72d-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
        </div>
      </section>

      <Sheet open={state.isDrawerOpen} onOpenChange={open => !open && handlers.closeDrawer()} data-api-unique-id='categorymanagementview-reb87b02b312f1dc3-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
        <SheetContent className="sm:max-w-[620px] p-0 flex flex-col gap-0 border-l border-slate-200 shadow-2xl overflow-hidden" data-api-unique-id='categorymanagementview-r1a19cabddb754c7e-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
          <SheetHeader className="px-8 py-6 border-b bg-slate-50/50" data-api-unique-id='categorymanagementview-r617b0b9b9198f724-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
            <SheetTitle className="text-xl font-header font-bold flex items-center gap-2" data-api-unique-id='categorymanagementview-r98f4ffbf57023948-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
              {state.editingId ? <Edit3 className="w-5 h-5 text-primary" data-api-unique-id='categorymanagementview-rff6ab678bb35af5f-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' /> : <Plus className="w-5 h-5 text-primary" data-api-unique-id='categorymanagementview-r1bf4c7e928de04a3-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />}
              {state.editingId ? '编辑分类详情' : '创建新分类'}
            </SheetTitle>
          </SheetHeader>

          <form onSubmit={e => {
          e.preventDefault();
          handlers.submitForm();
        }} className="flex-grow overflow-auto pb-24" data-api-unique-id='categorymanagementview-r8328097ba2df8435-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
            <fieldset disabled={state.isSubmitting} className="p-8 space-y-8" data-api-unique-id='categorymanagementview-rebc2689a8bed97a5-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
              <div className="space-y-4" data-api-unique-id='categorymanagementview-rd185369c535c050c-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                <div className="flex items-center gap-2 border-l-4 border-primary pl-3" data-api-unique-id='categorymanagementview-r44cf4bebb5a977f7-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900" data-api-unique-id='categorymanagementview-r8c8d61e1df36ec4b-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>基础配置</h3>
                </div>
                <div className="grid grid-cols-2 gap-4" data-api-unique-id='categorymanagementview-rf5197a15039a8ee1-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                  <div className="space-y-2" data-api-unique-id='categorymanagementview-rc62c9c4308f464df-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                    <label className="text-xs font-bold text-slate-500 uppercase" data-api-unique-id='categorymanagementview-r61eb60029137ec25-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>分类名称</label>
                    <Input placeholder="例如：电子产品" className="h-10 border-slate-200 focus-visible:ring-primary" value={state.formData.category_name} onChange={e => handlers.handleFormChange('category_name', e.target.value)} required data-api-unique-id='categorymanagementview-r9120d05ef91a0287-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                  </div>
                  <div className="space-y-2" data-api-unique-id='categorymanagementview-r8fade958fca08502-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                    <label className="text-xs font-bold text-slate-500 uppercase" data-api-unique-id='categorymanagementview-r6d4c632087ad9c57-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>标识 (Slug)</label>
                    <Input placeholder="可留空，保存时按名称自动生成" className="h-10 border-slate-200 font-mono text-sm focus-visible:ring-primary" value={state.formData.category_slug} onChange={e => handlers.handleFormChange('category_slug', e.target.value)} data-api-unique-id='categorymanagementview-r38403e4384a65262-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                    <p className="text-[11px] text-muted-foreground" data-api-unique-id='categorymanagementview-r63f6c7139ef9fcf6-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>该字段允许为空，也不要求唯一。</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4" data-api-unique-id='categorymanagementview-r3dbc6cde0bb32b80-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                  <div className="space-y-2" data-api-unique-id='categorymanagementview-rbc7966b959d11ffa-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                    <label className="text-xs font-bold text-slate-500 uppercase" data-api-unique-id='categorymanagementview-rca2a0b1d3743d1c8-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>分类层级</label>
                    <Select value={String(state.formData.level)} onValueChange={value => handlers.handleFormChange('level', Number(value) as 1 | 2)} data-api-unique-id='categorymanagementview-r75a98bce19d28c7d-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                      <SelectTrigger className="h-10 border-slate-200 focus:ring-primary" data-api-unique-id='categorymanagementview-rf19c4d1fab60e7e0-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                        <SelectValue placeholder="请选择分类层级" data-api-unique-id='categorymanagementview-ra30bdee9a429dbf5-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                      </SelectTrigger>
                      <SelectContent data-api-unique-id='categorymanagementview-r33ab4a9a6109e5cc-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                        <SelectItem value="1" data-api-unique-id='categorymanagementview-r532e12f74616978a-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>一级分类</SelectItem>
                        <SelectItem value="2" data-api-unique-id='categorymanagementview-r60197087dbbfc5ce-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>二级分类</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2" data-api-unique-id='categorymanagementview-r8ab6d523e31d82fa-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                    <label className="text-xs font-bold text-slate-500 uppercase" data-api-unique-id='categorymanagementview-r9730fb569c7b7bc9-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>分类类型</label>
                    <Select value={state.formData.category_kind} onValueChange={value => handlers.handleFormChange('category_kind', value as 'MAIN' | 'BRAND')} disabled={state.formData.level === 2} data-api-unique-id='categorymanagementview-r56dd8c6c891c24d0-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                      <SelectTrigger className="h-10 border-slate-200 focus:ring-primary" data-api-unique-id='categorymanagementview-rd0241fb61e639b05-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                        <SelectValue placeholder="请选择分类类型" data-api-unique-id='categorymanagementview-r76bd664b7684d7fb-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                      </SelectTrigger>
                      <SelectContent data-api-unique-id='categorymanagementview-rf5919d3fd5c75960-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                        <SelectItem value="MAIN" data-api-unique-id='categorymanagementview-r3be8a9f4a2edf167-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>主类目</SelectItem>
                        <SelectItem value="BRAND" data-api-unique-id='categorymanagementview-rdf0197a96ef26f36-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>品牌类目</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2" data-api-unique-id='categorymanagementview-r93d67025ca7fd8e9-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                    <label className="text-xs font-bold text-slate-500 uppercase" data-api-unique-id='categorymanagementview-r664a0e76150378b4-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>上级分类（可选）</label>
                    <Select value={state.formData.parent_id || 'none'} onValueChange={value => handlers.handleFormChange('parent_id', value === 'none' ? null : value)} data-api-unique-id='categorymanagementview-r0d4c0578494e6d8a-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                      <SelectTrigger className="h-10 border-slate-200 focus:ring-primary" data-api-unique-id='categorymanagementview-rd20adfbcfb0dfbbb-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                        <SelectValue placeholder={state.formData.level === 2 ? '可选：选择一级分类，留空则独立' : '可选：一级分类通常无需选择上级'} data-api-unique-id='categorymanagementview-r6f9ca4265fbdb17a-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                      </SelectTrigger>
                      <SelectContent data-api-unique-id='categorymanagementview-re16b682303c9dd96-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                        <SelectItem value="none" data-api-unique-id='categorymanagementview-r3a50e54248bbc0aa-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>无上级分类</SelectItem>
                        {state.parentOptions.map((option, index) => <SelectItem key={option.category_id} value={option.category_id} data-api-unique-id='categorymanagementview-rd5f3bccaab3d3197-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>{option.category_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4" data-api-unique-id='categorymanagementview-r558cc689d9631c80-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                <div className="flex items-center gap-2 border-l-4 border-primary pl-3" data-api-unique-id='categorymanagementview-r71799ae4248b4863-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900" data-api-unique-id='categorymanagementview-r609a00ef497b0b9d-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>视觉媒体</h3>
                </div>
                <div className="space-y-3" data-api-unique-id='categorymanagementview-r5324b09aa767ddbf-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                  <div className="space-y-2" data-api-unique-id='categorymanagementview-raf480e614cf8be57-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                    <label className="text-xs font-bold text-slate-500 uppercase" data-api-unique-id='categorymanagementview-rab34f96c46ea7458-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>分类主图 URL</label>
                    <Input placeholder="https://..." className="h-10 border-slate-200 focus-visible:ring-primary" value={state.formData.image_url} onChange={e => handlers.handleFormChange('image_url', e.target.value)} data-api-unique-id='categorymanagementview-rd3d206cc04aa4c87-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                  </div>
                  <div className="space-y-2" data-api-unique-id='categorymanagementview-rb12704a2689d4dbd-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                    <label className="text-xs font-bold text-slate-500 uppercase" data-api-unique-id='categorymanagementview-r804b32faf106abe7-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>Banner 图 URL</label>
                    <Input placeholder="https://..." className="h-10 border-slate-200 focus-visible:ring-primary" value={state.formData.banner_image_url} onChange={e => handlers.handleFormChange('banner_image_url', e.target.value)} disabled={state.formData.category_kind === 'BRAND'} data-api-unique-id='categorymanagementview-rbff358576e826b0f-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                    {state.formData.category_kind === 'BRAND' ? <p className="text-[11px] text-muted-foreground" data-api-unique-id='categorymanagementview-rf7cee372e50a141d-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>品牌类目不启用目录 Banner 图配置。</p> : null}
                  </div>
                  <div className="grid grid-cols-2 gap-4" data-api-unique-id='categorymanagementview-r9edcb41a27f97e47-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                    <div
                      className="relative aspect-video rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center"
                      data-api-unique-id='categorymanagementview-r4ac860b9b965bb48-s2437821645'
                      data-api-unique-page-name='src/backend/components/CategoryManagementView'
                      onDragOver={e => {
                        const hasFiles = e.dataTransfer?.files && e.dataTransfer.files.length > 0;
                        if (!hasFiles) return;
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={e => {
                        const file = e.dataTransfer?.files?.[0];
                        if (!file) return;
                        e.preventDefault();
                        e.stopPropagation();
                        void handlers.uploadFormMainImageFile(file);
                      }}
                    >
                      {state.formData.image_url ? <EditableImg propKey="category-drawer-preview" keywords={state.formData.image_url} className="w-full h-full object-contain" needLargeImage description={state.formData.category_name} data-api-unique-id='categorymanagementview-r22acb7a7809a8b70-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' /> : <div className="flex flex-col items-center gap-2 text-muted-foreground opacity-50" data-api-unique-id='categorymanagementview-rb3e51ab889593a60-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                          <Layers className="w-10 h-10" data-api-unique-id='categorymanagementview-r2eb814c28da7afbb-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                          <span className="text-sm" data-api-unique-id='categorymanagementview-r09e2e244c2d3e4ea-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>主图预览</span>
                        </div>}

                      {/* 本地上传：点击/选择文件 */}
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        data-api-unique-id='categorymanagementview-cat-main-image-upload-input'
                        data-api-unique-page-name='src/backend/components/CategoryManagementView'
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          void handlers.uploadFormMainImageFile(file);
                          e.currentTarget.value = '';
                        }}
                      />

                      {state.isUploadingFormMainImage ? (
                        <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">上传中...</span>
                        </div>
                      ) : null}
                    </div>
                    <div className="relative aspect-video rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center" data-api-unique-id='categorymanagementview-rb68fe752bec57332-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                      {state.formData.banner_image_url ? <EditableImg propKey="category-banner-preview" keywords={state.formData.banner_image_url} className="w-full h-full object-contain" needLargeImage description={`${state.formData.category_name} banner`} data-api-unique-id='categorymanagementview-r4f02d51f77c9ebe5-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' /> : <div className="flex flex-col items-center gap-2 text-muted-foreground opacity-50" data-api-unique-id='categorymanagementview-r623abff70090ee27-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                          <ImageIcon className="w-10 h-10" data-api-unique-id='categorymanagementview-r575b027a01b87a46-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                          <span className="text-sm" data-api-unique-id='categorymanagementview-r0b7fa2d706f4e9fc-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>Banner 预览</span>
                        </div>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4" data-api-unique-id='categorymanagementview-r1f07db091b6743fa-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                <div className="flex items-center gap-2 border-l-4 border-primary pl-3" data-api-unique-id='categorymanagementview-rf9536677f2b738e3-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900" data-api-unique-id='categorymanagementview-rec6a0ff5fbd42301-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>业务属性</h3>
                </div>
                <div className="space-y-4" data-api-unique-id='categorymanagementview-r16d09c71fae74ea5-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                  <div className="space-y-2" data-api-unique-id='categorymanagementview-rf57b9bc0ab61a3df-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                    <label className="text-xs font-bold text-slate-500 uppercase" data-api-unique-id='categorymanagementview-r2f0b42d539d5c597-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>分类详细说明</label>
                    <Textarea placeholder="描述该分类包含的主要商品类型及前台展示逻辑..." className="min-h-[100px] border-slate-200 focus-visible:ring-primary resize-none" value={state.formData.description} onChange={e => handlers.handleFormChange('description', e.target.value)} data-api-unique-id='categorymanagementview-r2dc239c2267fdea1-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                  </div>
                  <div className="space-y-2" data-api-unique-id='categorymanagementview-r824d33262a360d9c-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                    <label className="text-xs font-bold text-slate-500 uppercase" data-api-unique-id='categorymanagementview-rb6e79e76b0b03977-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>品牌关键词（每行一个，可选）</label>
                    <Textarea placeholder={'例如：\nCartier\nTiffany\nVan Cleef\nmiu家'} className="min-h-[90px] border-slate-200 focus-visible:ring-primary resize-none" value={state.formData.brand_keywords_text} onChange={e => handlers.handleFormChange('brand_keywords_text', e.target.value)} data-api-unique-id='categorymanagementview-rb353dce1812e09e6-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                    <p className="text-[11px] text-muted-foreground leading-5">1688 导入自动归类会匹配「二级类目名 + 这里的关键词」（忽略大小写）。标题是缩写时请单独配置，例如 Miumiu 可加 miu家。</p>
                  </div>
                  <div className="grid grid-cols-2 gap-8 items-end" data-api-unique-id='categorymanagementview-r658fb061b8443730-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                    <div className="space-y-2" data-api-unique-id='categorymanagementview-r8f8f713840bbb1ae-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                      <label className="text-xs font-bold text-slate-500 uppercase" data-api-unique-id='categorymanagementview-r12ecf01a145f0d24-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>排序权重</label>
                      <Input type="number" className="h-10 border-slate-200 focus-visible:ring-primary" value={state.formData.sort_weight} onChange={e => handlers.handleFormChange('sort_weight', parseInt(e.target.value, 10) || 0)} required data-api-unique-id='categorymanagementview-r454a7c350b45b6f4-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                    </div>
                    <div className="space-y-2" data-api-unique-id='categorymanagementview-r0f3a24e7046fed29-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                      <label className="text-xs font-bold text-slate-500 uppercase" data-api-unique-id='categorymanagementview-r3acf7688b40bd738-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>售价系数</label>
                      <Input
                        type="number"
                        step="0.01"
                        className="h-10 border-slate-200 focus-visible:ring-primary"
                        value={state.formData.price_coefficient ?? ''}
                        disabled={!canEditCategoryPriceCoefficient({ level: state.formData.level, parentId: state.formData.parent_id, name: state.formData.category_name })}
                        onChange={e => {
                          const raw = e.target.value
                          handlers.handleFormChange(
                            'price_coefficient',
                            raw === '' ? null : (parseFloat(raw) || null),
                          )
                        }}
                        placeholder={
                          canEditCategoryPriceCoefficient({ level: state.formData.level, parentId: state.formData.parent_id, name: state.formData.category_name })
                            ? (state.formData.level === 1 ? '默认 1' : '留空则继承上级')
                            : '--'
                        }
                        data-api-unique-id='categorymanagementview-r89b47e4381345584-s2437821645'
                        data-api-unique-page-name='src/backend/components/CategoryManagementView'
                      />
                      {!canEditCategoryPriceCoefficient({ level: state.formData.level, parentId: state.formData.parent_id, name: state.formData.category_name }) ? (
                        <p className="text-xs text-muted-foreground">功能/聚合类目不参与售价系数计算。</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4" data-api-unique-id='categorymanagementview-r25369ff5e0003bd5-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100" data-api-unique-id='categorymanagementview-r44f65f22610ae2b8-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                      <div className="flex flex-col" data-api-unique-id='categorymanagementview-rb901f4ad60595867-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                        <span className="text-xs font-bold text-slate-500 uppercase" data-api-unique-id='categorymanagementview-r8a40c8426bdc03d7-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>默认展开子类</span>
                        <span className="text-[11px] text-muted-foreground" data-api-unique-id='categorymanagementview-r4d360a774a00cf73-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>前台类目页默认展开子分类结构</span>
                      </div>
                      <Switch checked={state.formData.category_display_config.showChildrenByDefault} onCheckedChange={checked => handlers.handleFormChange('category_display_config', {
                      ...state.formData.category_display_config,
                      showChildrenByDefault: checked
                    })} data-api-unique-id='categorymanagementview-r8007c4627448df30-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100" data-api-unique-id='categorymanagementview-r1e5b0d5c26fb0856-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                      <div className="flex flex-col" data-api-unique-id='categorymanagementview-rcddcb440f1e51631-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                        <span className="text-xs font-bold text-slate-500 uppercase" data-api-unique-id='categorymanagementview-rbc10ace6861a73fa-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>允许折叠子类</span>
                        <span className="text-[11px] text-muted-foreground" data-api-unique-id='categorymanagementview-r64041be74c876286-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>前台是否允许折叠二级分类面板</span>
                      </div>
                      <Switch checked={state.formData.category_display_config.allowChildrenCollapse} onCheckedChange={checked => handlers.handleFormChange('category_display_config', {
                      ...state.formData.category_display_config,
                      allowChildrenCollapse: checked
                    })} data-api-unique-id='categorymanagementview-rdfc656638ceadbe7-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100" data-api-unique-id='categorymanagementview-r5aa2ce292a00b7ca-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                      <div className="flex flex-col" data-api-unique-id='categorymanagementview-r5eb5077054946e80-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                        <span className="text-xs font-bold text-slate-500 uppercase" data-api-unique-id='categorymanagementview-r73ea94fead333942-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>启用品牌筛选</span>
                        <span className="text-[11px] text-muted-foreground" data-api-unique-id='categorymanagementview-rf0de94710016c2b7-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>前台筛选器显示品牌聚合入口</span>
                      </div>
                      <Switch checked={state.formData.category_display_config.showBrandFilter} onCheckedChange={checked => handlers.handleFormChange('category_display_config', {
                      ...state.formData.category_display_config,
                      showBrandFilter: checked
                    })} data-api-unique-id='categorymanagementview-rc8e1f27fd76151b9-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                    </div>
                    <div className="space-y-2" data-api-unique-id='categorymanagementview-r8c82eebbc8ee1011-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                      <label className="text-xs font-bold text-slate-500 uppercase" data-api-unique-id='categorymanagementview-rb74e79dd4b4e3cbf-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>品牌筛选折叠行数</label>
                      <Input type="number" className="h-10 border-slate-200 focus-visible:ring-primary" value={state.formData.category_display_config.brandFilterCollapsedRows} onChange={e => handlers.handleFormChange('category_display_config', {
                      ...state.formData.category_display_config,
                      brandFilterCollapsedRows: parseInt(e.target.value, 10) || 3
                    })} data-api-unique-id='categorymanagementview-r2ffff0ab63e283b9-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100" data-api-unique-id='categorymanagementview-r6bd5f65e1f80c869-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                    <div className="flex flex-col" data-api-unique-id='categorymanagementview-r47fa6e2b73339558-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                      <span className="text-xs font-bold text-slate-500 uppercase" data-api-unique-id='categorymanagementview-rfd624bfbeed3f204-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>当前状态</span>
                      <span className="text-[11px] text-muted-foreground" data-api-unique-id='categorymanagementview-radd29815ac5bdb92-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>停用后前台不再展示该分类及筛选入口</span>
                    </div>
                    <Switch checked={state.formData.status === 'ACTIVE'} onCheckedChange={checked => handlers.handleFormChange('status', checked ? 'ACTIVE' : 'INACTIVE')} data-api-unique-id='categorymanagementview-rd6e4e70cde317dde-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                  </div>
                </div>
              </div>
            </fieldset>

            <SheetFooter className="px-8 py-5 border-t bg-white absolute bottom-0 left-0 right-0" data-api-unique-id='categorymanagementview-r2a1c378e1d8ebcb9-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
              <div className="flex items-center justify-end gap-3 w-full" data-api-unique-id='categorymanagementview-r2f30a5de3ff127c9-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                <Button type="button" variant="outline" onClick={handlers.closeDrawer} data-api-unique-id='categorymanagementview-r738fdad0e1554406-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>取消</Button>
                <Button type="submit" disabled={state.isSubmitting} data-api-unique-id='categorymanagementview-r22be53706cbfafd7-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                  {state.isSubmitting ? '提交中...' : state.editingId ? '保存分类' : '创建分类'}
                </Button>
              </div>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={state.isPosterDrawerOpen} onOpenChange={open => !open && handlers.closePosterDrawer()} data-api-unique-id='categorymanagementview-rac57bed046b175bf-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
        <SheetContent className="sm:max-w-[720px] p-0 flex flex-col gap-0 border-l border-slate-200 shadow-2xl overflow-hidden" data-api-unique-id='categorymanagementview-r44804796a37218bf-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
          <SheetHeader className="px-8 py-6 border-b bg-slate-50/50" data-api-unique-id='categorymanagementview-r444e136cb67f12ac-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
            <SheetTitle className="text-xl font-header font-bold flex items-center gap-2" data-api-unique-id='categorymanagementview-r111b330b4af93c63-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
              <GalleryHorizontal className="w-5 h-5 text-primary" data-api-unique-id='categorymanagementview-r2c07b859aca3dc82-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
              目录海报配置
            </SheetTitle>
          </SheetHeader>
          <div className="flex-grow overflow-auto p-8 space-y-5 pb-24" data-api-unique-id='categorymanagementview-r38d7d7f071c868de-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
            <div className="flex justify-between items-center" data-api-unique-id='categorymanagementview-ra199fb3e1a32aae9-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
              <div data-api-unique-id='categorymanagementview-r45a8f57adf720dcb-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                <p className="text-sm font-semibold text-slate-900" data-api-unique-id='categorymanagementview-rcedca7d0f43e9a21-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>分类海报列表</p>
                <p className="text-xs text-muted-foreground mt-1" data-api-unique-id='categorymanagementview-r2380ca4a9c354427-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>可维护海报标题、链接、排序、启用状态与展示比例预设；跨境电商海报推荐使用更强视觉宽幅版式。</p>
              </div>
              <Button variant="outline" className="border-slate-200" onClick={handlers.addPosterItem} data-api-unique-id='categorymanagementview-r40713e2047d2ab7c-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                <Plus className="w-4 h-4 mr-2" data-api-unique-id='categorymanagementview-r37c3f357e14a60d1-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                新增海报
              </Button>
            </div>

            {state.posterForm.items.length === 0 ? <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-muted-foreground" data-api-unique-id='categorymanagementview-r7a872106fda96e7e-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                当前分类尚未配置海报，请新增后再保存。
              </div> : <div className="space-y-4" data-api-unique-id='categorymanagementview-r5b28c0511d9d1b2a-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                {state.posterForm.items.map((item, index) => <Card key={item.id} className="border-slate-200 shadow-sm p-4 space-y-4" data-api-unique-id='categorymanagementview-r62885040d45b2b86-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                    <div className="flex items-center justify-between gap-3" data-api-unique-id='categorymanagementview-rc10b535f7f70284c-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                      <div className="flex items-center gap-2" data-api-unique-id='categorymanagementview-rdc80cbc686308846-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700" data-api-unique-id='categorymanagementview-r91796718f836d527-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>排序 {item.sort_weight}</Badge>
                        {!item.is_active ? <Badge variant="secondary" data-api-unique-id='categorymanagementview-re7c63922c68eff70-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>未启用</Badge> : null}
                      </div>
                      <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handlers.removePosterItem(item.id)} data-api-unique-id='categorymanagementview-r343153515f2e2a2f-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                        <Trash2 className="w-4 h-4 mr-1" data-api-unique-id='categorymanagementview-ra30e53bdd29e9211-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1' />
                        删除
                      </Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2" data-api-unique-id='categorymanagementview-re30174136918b54e-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                      <div className="space-y-2" data-api-unique-id='categorymanagementview-r21a59db0957b36f3-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                        <label className="text-xs font-bold text-slate-500 uppercase" data-api-unique-id='categorymanagementview-r54f8c93a52f0a03a-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>海报标题</label>
                        <Input value={item.title} onChange={e => handlers.updatePosterItem(item.id, 'title', e.target.value)} className="border-slate-200 focus-visible:ring-primary" data-api-unique-id='categorymanagementview-ra1624b66fb4b8321-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1' />
                      </div>
                      <div className="space-y-2" data-api-unique-id='categorymanagementview-r4147d70ac76c35f7-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                        <label className="text-xs font-bold text-slate-500 uppercase" data-api-unique-id='categorymanagementview-re5b35d67fedbbfb6-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>跳转链接</label>
                        <Input placeholder="/category/jewelry 或 https://..." value={item.link || ''} onChange={e => handlers.updatePosterItem(item.id, 'link', e.target.value)} className="border-slate-200 focus-visible:ring-primary" data-api-unique-id='categorymanagementview-r2cd61f349bc8155a-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1' />
                      </div>
                    </div>
                    <div className="space-y-2" data-api-unique-id='categorymanagementview-re1f6dca7c6ed33b3-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                      <label className="text-xs font-bold text-slate-500 uppercase" data-api-unique-id='categorymanagementview-r8fe25d777edcf95a-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>海报图片 URL</label>
                      <Input value={item.image_url} onChange={e => handlers.updatePosterItem(item.id, 'image_url', e.target.value)} className="border-slate-200 focus-visible:ring-primary" data-api-unique-id='categorymanagementview-r6d9b001988110a6b-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1' />
                    </div>
                    <div className="grid gap-4 md:grid-cols-[140px_220px_1fr] items-center" data-api-unique-id='categorymanagementview-r83600e188bd5b9d4-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                      <div className="space-y-2" data-api-unique-id='categorymanagementview-re1a5209e0d0b0519-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                        <label className="text-xs font-bold text-slate-500 uppercase" data-api-unique-id='categorymanagementview-race9cee9d48cbfda-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>排序权重</label>
                        <Input type="number" value={item.sort_weight} onChange={e => handlers.updatePosterItem(item.id, 'sort_weight', parseInt(e.target.value, 10) || 0)} className="border-slate-200 focus-visible:ring-primary" data-api-unique-id='categorymanagementview-rb61476ac21cf9cb9-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1' />
                      </div>
                      <div className="space-y-2" data-api-unique-id='categorymanagementview-radab3b134b10797b-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                        <label className="text-xs font-bold text-slate-500 uppercase" data-api-unique-id='categorymanagementview-rd70cd12534ae9943-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>展示比例预设</label>
                        <Select value={item.aspect_preset} onValueChange={value => handlers.updatePosterItem(item.id, 'aspect_preset', value)} data-api-unique-id='categorymanagementview-rbf531c9e3251a1f3-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                          <SelectTrigger className="border-slate-200 focus:ring-primary" data-api-unique-id='categorymanagementview-ra41b968891bddbc4-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                            <SelectValue placeholder="选择比例预设" data-api-unique-id='categorymanagementview-r1a10bd528278c5ae-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1' />
                          </SelectTrigger>
                          <SelectContent data-api-unique-id='categorymanagementview-r058e303f33ef2605-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                            <SelectItem value="CROSS_BORDER_HERO" data-api-unique-id='categorymanagementview-r7d6c8137d82d9bb5-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>跨境电商海报</SelectItem>
                            <SelectItem value="WIDE_BANNER" data-api-unique-id='categorymanagementview-rcdab5587b998903b-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>宽幅横版</SelectItem>
                            <SelectItem value="SQUARE" data-api-unique-id='categorymanagementview-r0fe8a6a08066f4ff-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>方形方图</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-[11px] text-muted-foreground" data-api-unique-id='categorymanagementview-rd0ad2ac216f0958d-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>跨境电商海报：适合首页大图、活动促销与强视觉承接。</p>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100" data-api-unique-id='categorymanagementview-r80ecbd45cbf5db7f-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                        <div className="flex flex-col" data-api-unique-id='categorymanagementview-r553bb8dc49b2da06-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                          <span className="text-xs font-bold text-slate-500 uppercase" data-api-unique-id='categorymanagementview-r5170b0731a1fa2c3-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>启用状态</span>
                          <span className="text-[11px] text-muted-foreground" data-api-unique-id='categorymanagementview-re7f84a8d09b41cd7-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>关闭后前台不展示该海报</span>
                        </div>
                        <Switch checked={item.is_active} onCheckedChange={checked => handlers.updatePosterItem(item.id, 'is_active', checked)} data-api-unique-id='categorymanagementview-r75f4939c002b6faf-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1' />
                      </div>
                    </div>
                  </Card>)}
              </div>}
          </div>
          <SheetFooter className="px-8 py-5 border-t bg-white" data-api-unique-id='categorymanagementview-r86d4a92e133c3bc0-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
            <div className="flex items-center justify-end gap-3 w-full" data-api-unique-id='categorymanagementview-ra57367790f2d2db4-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
              <Button type="button" variant="outline" onClick={handlers.closePosterDrawer} data-api-unique-id='categorymanagementview-r6906558e108f8f28-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>取消</Button>
              <Button onClick={handlers.savePosterConfig} disabled={state.isSavingPoster} data-api-unique-id='categorymanagementview-rad662860c5a46613-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                {state.isSavingPoster ? '保存中...' : '保存海报配置'}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={state.isKeywordGroupDialogOpen} onOpenChange={open => !open && handlers.closeKeywordGroupDialog()} data-api-unique-id='categorymanagementview-rcebd02b7ad81fd25-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
        <DialogContent className="sm:max-w-[1120px] max-h-[90vh] overflow-hidden flex flex-col" data-api-unique-id='categorymanagementview-r6c934a095d9704af-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
          <DialogHeader data-api-unique-id='categorymanagementview-r231e366b0f7896f6-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
            <DialogTitle data-api-unique-id='categorymanagementview-r693df6111ce9a8fd-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>{state.keywordGroupForm.keyword_group_id ? '编辑关键词分组' : '新增关键词分组'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4" data-api-unique-id='categorymanagementview-r96d4abe057e2fca0-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
            <div className="grid grid-cols-2 gap-4" data-api-unique-id='categorymanagementview-r68d026b7fcb090a2-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
              <div className="space-y-2" data-api-unique-id='categorymanagementview-r10dd190e7923e324-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                <label className="text-xs font-bold text-slate-500 uppercase" data-api-unique-id='categorymanagementview-r06bae4a60dc0fefb-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>分组名称</label>
                <Input value={state.keywordGroupForm.name} onChange={e => handlers.handleKeywordGroupFormChange('name', e.target.value)} className="border-slate-200 focus-visible:ring-primary" data-api-unique-id='categorymanagementview-r76234f511c4bbffa-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
              </div>
              <div className="space-y-2" data-api-unique-id='categorymanagementview-rcce8f37998be461e-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                <label className="text-xs font-bold text-slate-500 uppercase" data-api-unique-id='categorymanagementview-r1c09a0b8a4159b2b-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>标识</label>
                <Input value={state.keywordGroupForm.slug} onChange={e => handlers.handleKeywordGroupFormChange('slug', e.target.value)} className="border-slate-200 focus-visible:ring-primary" data-api-unique-id='categorymanagementview-ra644bc9e9f558551-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4" data-api-unique-id='categorymanagementview-r36ccf3cbd8cf9330-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
              <div className="space-y-2" data-api-unique-id='categorymanagementview-r4c6b920acb9f0708-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                <label className="text-xs font-bold text-slate-500 uppercase" data-api-unique-id='categorymanagementview-raa26188fd39bc8d4-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>分组类型</label>
                <Select value={state.keywordGroupForm.group_type} onValueChange={value => handlers.handleKeywordGroupFormChange('group_type', value as keyof typeof GROUP_TYPE_LABELS)} data-api-unique-id='categorymanagementview-rf7deff94a3bbb8af-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                  <SelectTrigger className="border-slate-200 focus:ring-primary" data-api-unique-id='categorymanagementview-rec7937ed61173af7-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                    <SelectValue placeholder="请选择分组类型" data-api-unique-id='categorymanagementview-rc60cf710c5dca538-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                  </SelectTrigger>
                  <SelectContent data-api-unique-id='categorymanagementview-r45e985e9a893d944-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                    {Object.entries(GROUP_TYPE_LABELS).map(([value, label], index) => <SelectItem key={value} value={value} data-api-unique-id='categorymanagementview-r2e1e10bebc2cdd9f-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>{label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2" data-api-unique-id='categorymanagementview-rc13b2c663eac5d8a-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                <label className="text-xs font-bold text-slate-500 uppercase" data-api-unique-id='categorymanagementview-r691aef16b11a82da-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>排序权重</label>
                <Input type="number" value={state.keywordGroupForm.sort_weight} onChange={e => handlers.handleKeywordGroupFormChange('sort_weight', parseInt(e.target.value, 10) || 0)} className="border-slate-200 focus-visible:ring-primary" data-api-unique-id='categorymanagementview-rd259cf74029e961b-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4" data-api-unique-id='categorymanagementview-r3a21ef90544d35f3-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
              <div className="space-y-2" data-api-unique-id='categorymanagementview-r770fc8196a5fca32-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                <label className="text-xs font-bold text-slate-500 uppercase" data-api-unique-id='categorymanagementview-r0279b1822919e871-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>sceneKey</label>
                <Input value={state.keywordGroupForm.scene_key} onChange={e => handlers.handleKeywordGroupFormChange('scene_key', e.target.value)} placeholder="如：homepage_recommend / category_sidebar" className="border-slate-200 focus-visible:ring-primary" data-api-unique-id='categorymanagementview-r78f4a884f9c78eee-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
              </div>
              <div className="space-y-2" data-api-unique-id='categorymanagementview-r795d4d0b20a33494-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                <label className="text-xs font-bold text-slate-500 uppercase" data-api-unique-id='categorymanagementview-r5c9fc37c567e8015-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>sceneType</label>
                <Input value={state.keywordGroupForm.scene_type} onChange={e => handlers.handleKeywordGroupFormChange('scene_type', e.target.value)} placeholder="如：homepage / category / campaign" className="border-slate-200 focus-visible:ring-primary" data-api-unique-id='categorymanagementview-r1ed0a8324ac6dda4-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
              </div>
            </div>
            <div className="space-y-2" data-api-unique-id='categorymanagementview-r415644153a46ec61-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
              <label className="text-xs font-bold text-slate-500 uppercase" data-api-unique-id='categorymanagementview-r1cad40da2a02cbe7-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>运营说明</label>
              <Textarea value={state.keywordGroupForm.description} onChange={e => handlers.handleKeywordGroupFormChange('description', e.target.value)} className="border-slate-200 focus-visible:ring-primary resize-none min-h-[96px]" data-api-unique-id='categorymanagementview-rfbc64c12c5e93ffe-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-4" data-api-unique-id='categorymanagementview-ra96db03294b0881f-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
              <div data-api-unique-id='categorymanagementview-rbd3b59e2e6b1fdec-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                <p className="text-sm font-semibold text-slate-900" data-api-unique-id='categorymanagementview-r1073717790fce3bc-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>首页关键词楼层</p>
                <p className="text-xs text-muted-foreground mt-1" data-api-unique-id='categorymanagementview-r4fadfb5f0f90087e-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>维护首页展示开关、楼层标题、图标、跳转链接与首页排序，不影响原有分类关键词映射能力。</p>
              </div>
              <div className="grid grid-cols-2 gap-4" data-api-unique-id='categorymanagementview-r180e5025c7651fbb-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                <div className="space-y-2" data-api-unique-id='categorymanagementview-rc1a0ce15e54824a2-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                  <label className="text-xs font-bold text-slate-500 uppercase" data-api-unique-id='categorymanagementview-rd94e8917130fd4ff-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>首页楼层标题</label>
                  <Input value={state.keywordGroupForm.floor_title} onChange={e => handlers.handleKeywordGroupFormChange('floor_title', e.target.value)} placeholder="如：今日热搜 / 品牌精选" className="border-slate-200 focus-visible:ring-primary" data-api-unique-id='categorymanagementview-rca7905ff31dd573d-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                </div>
                <div className="space-y-2" data-api-unique-id='categorymanagementview-r459e7f4dab1c3c07-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                  <label className="text-xs font-bold text-slate-500 uppercase" data-api-unique-id='categorymanagementview-r5bc54e7be4320efd-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>首页楼层图标</label>
                  <Input value={state.keywordGroupForm.floor_icon} onChange={e => handlers.handleKeywordGroupFormChange('floor_icon', e.target.value)} placeholder="可填写图标名称或图标 URL" className="border-slate-200 focus-visible:ring-primary" data-api-unique-id='categorymanagementview-r366a744399e53c86-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4" data-api-unique-id='categorymanagementview-r2cd8c78909a585db-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                <div className="space-y-2" data-api-unique-id='categorymanagementview-ra72ccc444a128b25-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                  <label className="text-xs font-bold text-slate-500 uppercase" data-api-unique-id='categorymanagementview-r300b32aa81b6a09f-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>首页跳转链接</label>
                  <Input value={state.keywordGroupForm.floor_link} onChange={e => handlers.handleKeywordGroupFormChange('floor_link', e.target.value)} placeholder="如：/search/hot / category landing" className="border-slate-200 focus-visible:ring-primary" data-api-unique-id='categorymanagementview-r38f90d0e06308f87-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                </div>
                <div className="space-y-2" data-api-unique-id='categorymanagementview-rc5899f02341c89ea-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                  <label className="text-xs font-bold text-slate-500 uppercase" data-api-unique-id='categorymanagementview-rf7e26ebf97591ed6-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>首页楼层排序</label>
                  <Input type="number" value={state.keywordGroupForm.homepage_sort_weight} onChange={e => handlers.handleKeywordGroupFormChange('homepage_sort_weight', parseInt(e.target.value, 10) || 0)} className="border-slate-200 focus-visible:ring-primary" data-api-unique-id='categorymanagementview-ra03fd121fbd916e7-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3" data-api-unique-id='categorymanagementview-rb41b61b6f37b0778-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                <div data-api-unique-id='categorymanagementview-ra04eb1c5a994ac73-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                  <p className="text-sm font-medium text-slate-900" data-api-unique-id='categorymanagementview-r9ee44f5896858f5a-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>首页展示</p>
                  <p className="text-xs text-muted-foreground" data-api-unique-id='categorymanagementview-r69d587b4084ba51c-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>开启后，该关键词分组可作为首页推荐关键词楼层展示。</p>
                </div>
                <Switch checked={state.keywordGroupForm.show_on_homepage} onCheckedChange={checked => handlers.handleKeywordGroupFormChange('show_on_homepage', checked)} data-api-unique-id='categorymanagementview-re9803df408e7d772-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3" data-api-unique-id='categorymanagementview-r63e5df8bcfac1282-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
              <div data-api-unique-id='categorymanagementview-r8747a4c9dfc51ead-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                <p className="text-sm font-medium text-slate-900" data-api-unique-id='categorymanagementview-r922a0b044ca6523e-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>启用分组</p>
                <p className="text-xs text-muted-foreground" data-api-unique-id='categorymanagementview-r2076366ab48e8e0d-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>关闭后仅停止新映射，不影响已落地历史数据。</p>
              </div>
              <Switch checked={state.keywordGroupForm.is_active} onCheckedChange={checked => handlers.handleKeywordGroupFormChange('is_active', checked)} data-api-unique-id='categorymanagementview-r8105867103c1e48a-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
            </div>
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden" data-controller-name="关键词与产品工作区" data-api-unique-id='categorymanagementview-r15ccd1dc0d91112d-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
              <div className="border-b border-slate-200 bg-white px-5 py-4" data-api-unique-id='categorymanagementview-r27da3ed372e022e5-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between" data-api-unique-id='categorymanagementview-ra1f08eb398a36c20-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                  <div className="space-y-3" data-api-unique-id='categorymanagementview-r4412c497623ecc09-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                    <div data-api-unique-id='categorymanagementview-rb1974e9bdd29a315-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                      <p className="text-lg font-semibold text-slate-900" data-api-unique-id='categorymanagementview-r6bb2c7f4fe29f1d5-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>关键词与产品</p>
                      <p className="mt-1 text-sm text-muted-foreground" data-api-unique-id='categorymanagementview-r9062ae3c80e158c1-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>在当前关键词分组上下文中查看已关联商品、筛选可解绑商品，并支持批量取消关联。</p>
                    </div>
                    <Tabs value={state.keywordProductRelationScope} onValueChange={value => handlers.setKeywordProductRelationScope(value as 'LINKED' | 'UNLINKED')} data-api-unique-id='categorymanagementview-rf3425ceeaf7604fd-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                      <TabsList className="bg-slate-100 p-1" data-api-unique-id='categorymanagementview-r0bd96691c79c18d3-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                        <TabsTrigger value="LINKED" data-api-unique-id='categorymanagementview-r8ff711192dd8e79c-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>已关联</TabsTrigger>
                        <TabsTrigger value="UNLINKED" data-api-unique-id='categorymanagementview-rf120ccb46f7bbdc2-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>未关联</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>
              </div>

              <div className="border-b border-slate-200 bg-slate-50/60 px-5 py-4" data-api-unique-id='categorymanagementview-r973d52de3e18e5c4-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between" data-api-unique-id='categorymanagementview-rc8aaaec2430f63e8-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                  <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-4" data-api-unique-id='categorymanagementview-raa1c5959fe046346-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                    <Input value={state.keywordProductFilters.keyword} onChange={e => handlers.handleKeywordProductFilterChange('keyword', e.target.value)} placeholder="商品名称" className="border-slate-200 bg-white" data-api-unique-id='categorymanagementview-rd94efc53f33b948e-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                    <Input value={state.keywordProductFilters.spu} onChange={e => handlers.handleKeywordProductFilterChange('spu', e.target.value)} placeholder="spu" className="border-slate-200 bg-white" data-api-unique-id='categorymanagementview-r9abbfa19ce49d10c-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                    <Input type="number" value={state.keywordProductFilters.min_price} onChange={e => handlers.handleKeywordProductFilterChange('min_price', e.target.value)} placeholder="开始价格" className="border-slate-200 bg-white" data-api-unique-id='categorymanagementview-r65b21ea8c8fd89d9-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                    <Input type="number" value={state.keywordProductFilters.max_price} onChange={e => handlers.handleKeywordProductFilterChange('max_price', e.target.value)} placeholder="结束价格" className="border-slate-200 bg-white" data-api-unique-id='categorymanagementview-r903d0128c9256893-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 xl:justify-end" data-api-unique-id='categorymanagementview-r6d7b73bc44759778-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                    <Button type="button" onClick={() => handlers.searchGroupProducts(1)} disabled={state.isProductSearchLoading} className="bg-primary text-primary-foreground hover:bg-primary/90" data-api-unique-id='categorymanagementview-rf2a0ea304ec1ec57-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                      {state.isProductSearchLoading ? '查询中...' : '查询'}
                    </Button>
                    <Button type="button" variant="outline" className="border-slate-200" onClick={handlers.handleBatchRemoveKeywordGroupProducts} disabled={state.selectedKeywordProductIds.length === 0 || state.keywordProductRelationScope !== 'LINKED'} data-api-unique-id='categorymanagementview-rd5cef54bb91b61e0-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                      取消关联
                    </Button>
                    <label className="flex items-center gap-2 text-sm text-slate-700" data-api-unique-id='categorymanagementview-rcde9d5af1c73cc4a-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                      <Checkbox checked={state.productSearchState.list.length > 0 && state.productSearchState.list.every(item => state.selectedKeywordProductIds.includes(item.product_id))} onCheckedChange={checked => handlers.toggleSelectAllKeywordProducts(Boolean(checked))} data-api-unique-id='categorymanagementview-rdc4a238b289b30d6-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                      全选
                    </label>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 space-y-4" data-api-unique-id='categorymanagementview-r4f66afbd8e7d7054-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                <div className="rounded-xl border border-slate-200 overflow-hidden" data-api-unique-id='categorymanagementview-rc6e2a90573a406d5-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                  <Table data-api-unique-id='categorymanagementview-r72aa17784b195a56-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                    <TableHeader className="bg-slate-50/80" data-api-unique-id='categorymanagementview-rb45df0672e3c4462-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                      <TableRow className="border-slate-200 hover:bg-transparent" data-api-unique-id='categorymanagementview-r1a0c6bdc7be60ce9-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                        <TableHead className="w-12" data-api-unique-id='categorymanagementview-r8add656909369188-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                          <Checkbox checked={state.productSearchState.list.length > 0 && state.productSearchState.list.every(item => state.selectedKeywordProductIds.includes(item.product_id))} onCheckedChange={checked => handlers.toggleSelectAllKeywordProducts(Boolean(checked))} data-api-unique-id='categorymanagementview-r489458eb39f84c40-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                        </TableHead>
                        <TableHead data-api-unique-id='categorymanagementview-r2d1eead1f491ae41-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>ID</TableHead>
                        <TableHead data-api-unique-id='categorymanagementview-r0464590ad4a6c762-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>名称</TableHead>
                        <TableHead data-api-unique-id='categorymanagementview-r4051df97aebbfd7a-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>spu</TableHead>
                        <TableHead data-api-unique-id='categorymanagementview-r468eb5aae17e5e83-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>价格</TableHead>
                        <TableHead data-api-unique-id='categorymanagementview-r940286c7572547ee-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>图片</TableHead>
                        <TableHead data-api-unique-id='categorymanagementview-rad85cb46b01743e3-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>创建时间</TableHead>
                        <TableHead className="text-right" data-api-unique-id='categorymanagementview-r98c0d2088fa72b19-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody data-api-unique-id='categorymanagementview-rdf25d609a872a33f-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                      {state.productSearchState.list.length === 0 ? <TableRow data-api-unique-id='categorymanagementview-rfab838164af2db07-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                          <TableCell colSpan={8} className="h-28 text-center text-sm text-muted-foreground" data-api-unique-id='categorymanagementview-r4f3ca6e0ed8dd5ee-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                            当前条件下暂无商品数据。
                          </TableCell>
                        </TableRow> : state.productSearchState.list.map((product, index) => <TableRow key={product.product_id} className="border-slate-200/80" data-api-unique-id='categorymanagementview-r85ed5a03346bda71-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                          <TableCell data-api-unique-id='categorymanagementview-r0465d8d79dae5f19-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                            <Checkbox checked={state.selectedKeywordProductIds.includes(product.product_id)} onCheckedChange={checked => handlers.toggleKeywordProductSelection(product.product_id, Boolean(checked))} data-api-unique-id='categorymanagementview-r25c4bf9e4990554b-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1' />
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-500" data-api-unique-id='categorymanagementview-rfe2bf0bb776dfd77-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>{product.product_id.slice(0, 8)}</TableCell>
                          <TableCell data-api-unique-id='categorymanagementview-rb55b2984cc40597d-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                            <div className="min-w-0" data-api-unique-id='categorymanagementview-r2e8b8ac4416271fa-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                              <div className="font-medium text-slate-900 truncate" data-api-unique-id='categorymanagementview-r7232cf98ef583009-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>{product.product_name}</div>
                              <div className="text-xs text-muted-foreground truncate" data-api-unique-id='categorymanagementview-recc8416488477af4-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>{product.product_slug || '未配置商品标识'}</div>
                            </div>
                          </TableCell>
                          <TableCell data-api-unique-id='categorymanagementview-r1c7c4a2e5085dfe8-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>{product.sku_code || '--'}</TableCell>
                          <TableCell data-api-unique-id='categorymanagementview-r489dabf44b3275d2-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>{product.price == null ? '--' : `¥${product.price.toFixed(2)}`}</TableCell>
                          <TableCell data-api-unique-id='categorymanagementview-r410ac991c3c959b5-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                            <div className="h-12 w-12 overflow-hidden rounded-lg border border-slate-200 bg-slate-100" data-api-unique-id='categorymanagementview-r77a259dfed5f04e0-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                              {product.image_url ? <img src={product.image_url} alt={product.product_name} className="h-full w-full object-cover" data-api-unique-id='categorymanagementview-rd5f78ab9973a05c8-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1' /> : <div className="flex h-full w-full items-center justify-center text-slate-400" data-api-unique-id='categorymanagementview-r90911f83cb0345fd-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'><ImageIcon className="h-4 w-4" data-api-unique-id='categorymanagementview-r6f101797825b1ce1-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1' /></div>}
                            </div>
                          </TableCell>
                          <TableCell data-api-unique-id='categorymanagementview-r2fbf1340071d1930-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>{new Date(product.created_at).toLocaleDateString('zh-CN')}</TableCell>
                          <TableCell className="text-right" data-api-unique-id='categorymanagementview-r3bd73bb85d818420-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                            <Button type="button" variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" disabled={state.keywordProductRelationScope !== 'LINKED'} onClick={() => handlers.handleRemoveKeywordGroupProduct(product.product_id)} data-api-unique-id='categorymanagementview-r7e398069def9e0c4-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                              取消关联
                            </Button>
                          </TableCell>
                        </TableRow>)}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 md:flex-row md:items-center md:justify-between" data-api-unique-id='categorymanagementview-rd4296560e15655ce-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground" data-api-unique-id='categorymanagementview-r33e838ffb88fa29c-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                    <span data-api-unique-id='categorymanagementview-r79edfa61f4dfe6fb-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>共 {state.productSearchState.total} 条</span>
                    <div className="flex items-center gap-2" data-api-unique-id='categorymanagementview-r940f98d1782ae3f6-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                      <span data-api-unique-id='categorymanagementview-raec771672d4c7a37-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>每页</span>
                      <Select value={String(state.productSearchState.page_size)} onValueChange={handlers.setKeywordProductPageSize} data-api-unique-id='categorymanagementview-r19b8c08e19319668-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                        <SelectTrigger className="h-9 w-[88px] border-slate-200 bg-white" data-api-unique-id='categorymanagementview-r555d4f3f6454fcdc-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                          <SelectValue data-api-unique-id='categorymanagementview-re9c88a43ae99a233-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                        </SelectTrigger>
                        <SelectContent data-api-unique-id='categorymanagementview-r0426741da8dbe95c-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                          {_items.map((size, index) => <SelectItem key={size} value={String(size)} data-api-unique-id='categorymanagementview-r36db714ba53f7201-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1' data-api-bind-info={`_items-${index}-$item`} data-api-map-var-name='size'>{size} 条</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Pagination data-api-unique-id='categorymanagementview-rc3aca9fb906a07b3-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                    <PaginationContent className="gap-2" data-api-unique-id='categorymanagementview-r825a78441851bea2-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                      <PaginationItem data-api-unique-id='categorymanagementview-r99099c3b05f94b46-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                        <PaginationPrevious onClick={() => handlers.searchGroupProducts(Math.max(1, state.productSearchState.page - 1))} className={`h-9 cursor-pointer ${state.productSearchState.page === 1 ? 'pointer-events-none opacity-50' : ''}`} data-api-unique-id='categorymanagementview-r3e5a3bd46ed7724f-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                      </PaginationItem>
                      {Array.from({
                      length: Math.max(1, Math.min(5, Math.ceil(state.productSearchState.total / state.productSearchState.page_size)))
                    }, (_, index) => {
                      const totalPages = Math.max(1, Math.ceil(state.productSearchState.total / state.productSearchState.page_size));
                      const currentPage = state.productSearchState.page;
                      const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                      const pageNumber = Math.min(totalPages, startPage + index);
                      return <PaginationItem key={pageNumber} data-api-unique-id='categorymanagementview-rc0b6e4e8a8bf2e2c-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                            <Button type="button" variant={pageNumber === currentPage ? 'default' : 'outline'} size="sm" className={pageNumber === currentPage ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'border-slate-200'} onClick={() => handlers.searchGroupProducts(pageNumber)} data-api-unique-id='categorymanagementview-r5fe1d80f43e2c398-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                              {pageNumber}
                            </Button>
                          </PaginationItem>;
                    })}
                      <PaginationItem data-api-unique-id='categorymanagementview-r33cefbb185f7d409-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                        <PaginationNext onClick={() => handlers.searchGroupProducts(Math.min(Math.max(1, Math.ceil(state.productSearchState.total / state.productSearchState.page_size)), state.productSearchState.page + 1))} className={`h-9 cursor-pointer ${state.productSearchState.page >= Math.max(1, Math.ceil(state.productSearchState.total / state.productSearchState.page_size)) ? 'pointer-events-none opacity-50' : ''}`} data-api-unique-id='categorymanagementview-r634cee07c5748adb-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </div>
            </section>
          </div>
          <DialogFooter data-api-unique-id='categorymanagementview-rc90a62c45b79d95f-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
            <Button variant="outline" onClick={handlers.closeKeywordGroupDialog} data-api-unique-id='categorymanagementview-r5f868a98fd5ecbda-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>取消</Button>
            <Button onClick={handlers.submitKeywordGroupForm} disabled={state.isSavingKeywordGroup} data-api-unique-id='categorymanagementview-rcb084ab1458d11e5-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>{state.isSavingKeywordGroup ? '保存中...' : '保存分组'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={state.isKeywordItemDialogOpen} onOpenChange={open => !open && handlers.closeKeywordItemDialog()} data-api-unique-id='categorymanagementview-rc2ddbeea1ebb9416-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
        <DialogContent className="sm:max-w-[520px]" data-api-unique-id='categorymanagementview-r7c0c2cb29f56ab12-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
          <DialogHeader data-api-unique-id='categorymanagementview-ree4a2b14dfbad0b1-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
            <DialogTitle data-api-unique-id='categorymanagementview-r11c35813e5232191-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>{state.keywordItemForm.keyword_item_id ? '编辑关键词' : state.keywordItemForm.parent_keyword_id ? '新增二级关键词' : '新增一级关键词'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4" data-api-unique-id='categorymanagementview-rb0ff862cb55174ec-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
            <div className="space-y-2" data-api-unique-id='categorymanagementview-r9a7a4d4fc4175ba9-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
              <label className="text-xs font-bold text-slate-500 uppercase" data-api-unique-id='categorymanagementview-rf54aceec1f35635e-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>关键词内容</label>
              <Input value={state.keywordItemForm.keyword} onChange={e => handlers.handleKeywordItemFormChange('keyword', e.target.value)} className="border-slate-200 focus-visible:ring-primary" data-api-unique-id='categorymanagementview-r8a008f6128c5d330-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
            </div>
            <div className="grid grid-cols-2 gap-4" data-api-unique-id='categorymanagementview-racc402e178004b2d-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
              <div className="space-y-2" data-api-unique-id='categorymanagementview-r127b3eacd061f958-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                <label className="text-xs font-bold text-slate-500 uppercase" data-api-unique-id='categorymanagementview-rda2e3ed6eef6d095-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>排序权重</label>
                <Input type="number" value={state.keywordItemForm.sort_weight} onChange={e => handlers.handleKeywordItemFormChange('sort_weight', parseInt(e.target.value, 10) || 0)} className="border-slate-200 focus-visible:ring-primary" data-api-unique-id='categorymanagementview-r722dffeb67e45998-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 mt-6" data-api-unique-id='categorymanagementview-r8625b25cc40725dd-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                <span className="text-sm font-medium text-slate-900" data-api-unique-id='categorymanagementview-rbd95bbd42eed065e-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>启用关键词</span>
                <Switch checked={state.keywordItemForm.is_active} onCheckedChange={checked => handlers.handleKeywordItemFormChange('is_active', checked)} data-api-unique-id='categorymanagementview-rdbc4ecfaee033da6-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
              </div>
            </div>
            {!state.keywordItemForm.keyword_item_id && !state.keywordItemForm.parent_keyword_id ? <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-muted-foreground" data-api-unique-id='categorymanagementview-r87de79361d4ebb53-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                如需同组内批量录入或批量调整一级词，请使用“批量编辑一级词”；如需批量维护二级词，请在目标一级关键词下使用“批量维护二级词”。
              </div> : null}
            {state.keywordItemForm.parent_keyword_id ? <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-muted-foreground" data-api-unique-id='categorymanagementview-rf73f97ad765ba9b1-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                当前正在创建二级关键词，将归属于选定的一级关键词。
              </div> : null}
          </div>
          <DialogFooter data-api-unique-id='categorymanagementview-r8db34600417636e7-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
            <Button variant="outline" onClick={handlers.closeKeywordItemDialog} data-api-unique-id='categorymanagementview-rd68f0806a940c6fe-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>取消</Button>
            <Button onClick={handlers.submitKeywordItemForm} disabled={state.isSavingKeywordItem} data-api-unique-id='categorymanagementview-r14ea6e76673b56a1-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>{state.isSavingKeywordItem ? '保存中...' : '保存关键词'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={state.isBatchKeywordDialogOpen} onOpenChange={open => !open && handlers.closeBatchKeywordDialog()} data-api-unique-id='categorymanagementview-rd43f3fa0bfe59f5f-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
        <DialogContent className="sm:max-w-[760px]" data-api-unique-id='categorymanagementview-r18b6d44bdabef00e-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
          <DialogHeader data-api-unique-id='categorymanagementview-rb25395a4babdb506-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
            <DialogTitle data-api-unique-id='categorymanagementview-r99c1d10bf7835fc0-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>批量创建关联词并应用到分类</DialogTitle>
          </DialogHeader>
          <div className="space-y-5" data-api-unique-id='categorymanagementview-r2de10a2101775676-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
            <div className="space-y-2" data-api-unique-id='categorymanagementview-r1f07579105010b70-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
              <label className="text-xs font-bold text-slate-500 uppercase" data-api-unique-id='categorymanagementview-r32da35a7982dcb0b-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>关键词分组</label>
              <Select value={state.batchKeywordApplyForm.keyword_group_id} onValueChange={value => handlers.handleBatchKeywordFormChange('keyword_group_id', value)} data-api-unique-id='categorymanagementview-r6826e397af483c3f-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                <SelectTrigger className="border-slate-200 focus:ring-primary" data-api-unique-id='categorymanagementview-r0de6881e1e723d22-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                  <SelectValue placeholder="请选择关键词分组" data-api-unique-id='categorymanagementview-r94e2474130639061-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                </SelectTrigger>
                <SelectContent data-api-unique-id='categorymanagementview-rc4937b05b2bba432-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                  {state.keywordGroups.map((group, index) => <SelectItem key={group.keyword_group_id} value={group.keyword_group_id} data-api-unique-id='categorymanagementview-r59791111e0ae052e-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>{group.name} · {GROUP_TYPE_LABELS[group.group_type]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-5 lg:grid-cols-2" data-api-unique-id='categorymanagementview-r39b460817dfc0802-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
              <div className="space-y-3" data-api-unique-id='categorymanagementview-r6c841ed7598b15ae-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                <div className="text-sm font-semibold text-slate-900" data-api-unique-id='categorymanagementview-r2a7a80dbff065596-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>选择一级词 / 二级词</div>
                <div className="max-h-[280px] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2" data-api-unique-id='categorymanagementview-r7c815cd4fd684c92-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                  {state.keywordGroups.find(group => group.keyword_group_id === state.batchKeywordApplyForm.keyword_group_id)?.keywords?.length ? flattenKeywordNodesForDialog(state.keywordGroups.find(group => group.keyword_group_id === state.batchKeywordApplyForm.keyword_group_id)!.keywords).map((item, index) => <label key={item.keyword_item_id} className="flex items-center justify-between gap-3 rounded-lg bg-white border border-slate-100 px-3 py-2 text-sm text-slate-800" data-api-unique-id='categorymanagementview-r05086268bfee4ffa-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                        <div data-api-unique-id='categorymanagementview-r2f2508371d0e8f0b-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                          <div className="font-medium" data-api-unique-id='categorymanagementview-r0ab29db6d2c02c9d-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1' data-api-bind-info={`list-${index}-keyword`} data-api-map-var-name='item'>{item.keyword}</div>
                          <div className="text-[11px] text-muted-foreground" data-api-unique-id='categorymanagementview-r411d0dd59ed60768-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>{item.parent_keyword_id ? '二级关键词' : '一级关键词'}</div>
                        </div>
                        <Checkbox checked={state.batchKeywordApplyForm.keyword_item_ids.includes(item.keyword_item_id)} onCheckedChange={checked => handlers.toggleBatchKeywordItem(item.keyword_item_id, Boolean(checked))} data-api-unique-id='categorymanagementview-rc3979c27fd431982-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1' />
                      </label>) : <div className="text-sm text-muted-foreground text-center py-8" data-api-unique-id='categorymanagementview-re5733fb49ef10038-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>当前分组暂无关键词；不勾选任何关键词时，将按分组级别创建分类映射。</div>}
                </div>
              </div>

              <div className="space-y-3" data-api-unique-id='categorymanagementview-r0be352936affbbd3-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                <div className="text-sm font-semibold text-slate-900" data-api-unique-id='categorymanagementview-r685e5acf540f324a-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>应用到前台分类</div>
                <div className="max-h-[280px] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2" data-api-unique-id='categorymanagementview-rcff05d299f633bff-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                  {state.keywordCategoryOptions.map((option, index) => <label key={option.category_id} className="flex items-center justify-between gap-3 rounded-lg bg-white border border-slate-100 px-3 py-2 text-sm text-slate-800" data-api-unique-id='categorymanagementview-r508efe505d081649-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                      <div data-api-unique-id='categorymanagementview-r8afccb7347f7dec0-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                        <div className="font-medium" data-api-unique-id='categorymanagementview-r0a0755cc0998f9d3-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>{option.category_name}</div>
                        <div className="text-[11px] text-muted-foreground" data-api-unique-id='categorymanagementview-r43c58280fb69bc8d-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>{option.category_kind === 'BRAND' ? '品牌类目' : '前台主类目'}</div>
                      </div>
                      <Checkbox checked={state.batchKeywordApplyForm.category_ids.includes(option.category_id)} onCheckedChange={checked => handlers.toggleBatchKeywordCategory(option.category_id, Boolean(checked))} data-api-unique-id='categorymanagementview-recaea76ff2b4fceb-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1' />
                    </label>)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3" data-api-unique-id='categorymanagementview-rfdf265b87a4951f8-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
              <div data-api-unique-id='categorymanagementview-r4a19af0f6dc1d4db-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                <p className="text-sm font-medium text-slate-900" data-api-unique-id='categorymanagementview-r89bb694f838b237f-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>同步到首页推荐来源</p>
                <p className="text-xs text-muted-foreground" data-api-unique-id='categorymanagementview-r97d09455ce6c4460-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>勾选后会将本次关联同时标记为首页推荐关键词来源。</p>
              </div>
              <Switch checked={state.batchKeywordApplyForm.apply_to_homepage} onCheckedChange={checked => handlers.handleBatchKeywordFormChange('apply_to_homepage', checked)} data-api-unique-id='categorymanagementview-r2bd3b81bfa122793-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
            </div>
          </div>
          <DialogFooter data-api-unique-id='categorymanagementview-r2429e2a4ef012bc9-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
            <Button variant="outline" onClick={handlers.closeBatchKeywordDialog} data-api-unique-id='categorymanagementview-r45de102166ce93f9-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>取消</Button>
            <Button onClick={handlers.submitBatchKeywordApply} disabled={state.isApplyingKeywords} data-api-unique-id='categorymanagementview-r8e21b7b4dc66fb34-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>{state.isApplyingKeywords ? '应用中...' : '确认应用'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={state.isBatchKeywordItemDialogOpen} onOpenChange={open => !open && handlers.closeBatchKeywordItemDialog()} data-api-unique-id='categorymanagementview-r1a6509cae97aba18-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
        <DialogContent className="sm:max-w-[860px]" data-api-unique-id='categorymanagementview-r372656841c7ef27f-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
          <DialogHeader data-api-unique-id='categorymanagementview-r52671dd16f5be4a5-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
            <DialogTitle data-api-unique-id='categorymanagementview-rae2a8285b370901c-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>{state.batchKeywordItemParentId ? '批量维护二级关键词' : '批量维护一级关键词'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4" data-api-unique-id='categorymanagementview-rd8742eb445c22ee2-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3" data-api-unique-id='categorymanagementview-ra78b47270045b350-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
              <div data-api-unique-id='categorymanagementview-r97f0cd7bbde5e3c2-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                <p className="text-sm font-medium text-slate-900" data-api-unique-id='categorymanagementview-rc9b59c34b8689180-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>批量录入 / 编辑</p>
                <p className="text-xs text-muted-foreground" data-api-unique-id='categorymanagementview-r5b9daa4977258261-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>支持同组内批量新增、批量修改排序、启用态与父级。空白行不会提交。</p>
              </div>
              <Button variant="outline" className="border-slate-200" onClick={handlers.addBatchKeywordItemDraft} data-api-unique-id='categorymanagementview-rd708415fe3e5a82f-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                <Plus className="w-4 h-4 mr-2" data-api-unique-id='categorymanagementview-rdab24394f74525cb-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />
                新增一行
              </Button>
            </div>
            <div className="max-h-[420px] overflow-auto rounded-xl border border-slate-200" data-api-unique-id='categorymanagementview-rb5be5a1f040efbd9-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
              <div className="grid grid-cols-[minmax(0,1.4fr)_180px_140px_120px_64px] gap-3 border-b bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500" data-api-unique-id='categorymanagementview-r09ca1669bb66d145-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                <div data-api-unique-id='categorymanagementview-r8cd43b944b0966f6-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>关键词</div>
                <div data-api-unique-id='categorymanagementview-ra7f95cddf2eb1335-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>父级</div>
                <div data-api-unique-id='categorymanagementview-r3d081bf8d80c744b-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>排序权重</div>
                <div data-api-unique-id='categorymanagementview-ra540547da0c54bf5-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>启用态</div>
                <div data-api-unique-id='categorymanagementview-rc138f5759e149b94-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'></div>
              </div>
              <div className="space-y-3 p-4" data-api-unique-id='categorymanagementview-re308bbcf739f6add-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
                {state.batchKeywordItemDrafts.map((draft, index) => <div key={draft.temp_id} className="grid grid-cols-[minmax(0,1.4fr)_180px_140px_120px_64px] gap-3 items-center rounded-xl border border-slate-100 bg-white p-3" data-api-unique-id='categorymanagementview-r6badc9daadd87246-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                    <Input value={draft.keyword} onChange={e => handlers.updateBatchKeywordItemDraft(draft.temp_id, 'keyword', e.target.value)} placeholder={state.batchKeywordItemParentId ? '输入二级关键词' : '输入一级关键词'} className="border-slate-200 focus-visible:ring-primary" data-api-unique-id='categorymanagementview-r0de484578779094b-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1' />
                    <Select value={draft.parent_keyword_id || 'none'} onValueChange={value => handlers.updateBatchKeywordItemDraft(draft.temp_id, 'parent_keyword_id', value === 'none' ? null : value)} data-api-unique-id='categorymanagementview-re8817ec0b124e459-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                      <SelectTrigger className="border-slate-200 focus:ring-primary" data-api-unique-id='categorymanagementview-r651dac192e4b8793-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                        <SelectValue placeholder="选择父级" data-api-unique-id='categorymanagementview-rb179ddf794cdb001-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1' />
                      </SelectTrigger>
                      <SelectContent data-api-unique-id='categorymanagementview-rf17618a0e8add3ed-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                        <SelectItem value="none" data-api-unique-id='categorymanagementview-r10bbf40f964ad12b-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>无父级</SelectItem>
                        {state.keywordGroups.find(group => group.keyword_group_id === state.batchKeywordItemGroupId)?.keywords.map((item, index1) => <SelectItem key={item.keyword_item_id} value={item.keyword_item_id} data-api-unique-id='categorymanagementview-rc0024886efd38eb5-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>{item.keyword}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input type="number" value={draft.sort_weight} onChange={e => handlers.updateBatchKeywordItemDraft(draft.temp_id, 'sort_weight', parseInt(e.target.value, 10) || 0)} className="border-slate-200 focus-visible:ring-primary" data-api-unique-id='categorymanagementview-re7d3759b0b66a3c1-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1' />
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2" data-api-unique-id='categorymanagementview-r6f04e2efc9d5eddf-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                      <span className="text-xs text-slate-600" data-api-unique-id='categorymanagementview-rb15980c1071655ff-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>启用</span>
                      <Switch checked={draft.is_active} onCheckedChange={checked => handlers.updateBatchKeywordItemDraft(draft.temp_id, 'is_active', checked)} data-api-unique-id='categorymanagementview-r649b1618b4fc60b2-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1' />
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handlers.removeBatchKeywordItemDraft(draft.temp_id)} data-api-unique-id='categorymanagementview-rca6af42f484c2f86-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1'>
                      <Trash2 className="w-4 h-4" data-api-unique-id='categorymanagementview-r69378860a82653b2-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' data-api-in-loop='1' />
                    </Button>
                  </div>)}
              </div>
            </div>
          </div>
          <DialogFooter data-api-unique-id='categorymanagementview-r6b1780fefdcde33e-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
            <Button variant="outline" onClick={handlers.closeBatchKeywordItemDialog} data-api-unique-id='categorymanagementview-re8cef51eadf53e6f-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>取消</Button>
            <Button onClick={handlers.submitBatchKeywordItems} disabled={state.isSavingBatchKeywordItems} data-api-unique-id='categorymanagementview-ra8aa5a71a656656b-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>{state.isSavingBatchKeywordItems ? '保存中...' : '保存批量内容'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!state.deleteItem} onOpenChange={open => !open && handlers.setDeleteItem(null)} data-api-unique-id='categorymanagementview-r5e04b5595748c699-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
        <AlertDialogContent data-api-unique-id='categorymanagementview-rb999a416bf9b4f40-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
          <AlertDialogHeader data-api-unique-id='categorymanagementview-rd25e52fe47b1585f-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
            <AlertDialogTitle data-api-unique-id='categorymanagementview-rad426b752694bba5-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>确认删除分类？</AlertDialogTitle>
            <AlertDialogDescription data-api-unique-id='categorymanagementview-rd08169bf9bd15295-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
              删除后将解除该分类与商品的绑定关系；商品本身会保留在商品管理列表中，商品状态不变。若仍有子分类，需先处理子分类后再删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter data-api-unique-id='categorymanagementview-r2f558033eb24c998-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
            <AlertDialogCancel onClick={() => handlers.setDeleteItem(null)} data-api-unique-id='categorymanagementview-r9c780a4c619098c7-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handlers.confirmDelete} disabled={state.isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-api-unique-id='categorymanagementview-r50a1bdf18492e435-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView'>
              {state.isDeleting ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};
function flattenKeywordNodesForDialog(nodes: CategoryManagementState['keywordGroups'][number]['keywords']) {
  const result: CategoryManagementState['keywordGroups'][number]['keywords'][number][] = [];
  const walk = (items: CategoryManagementState['keywordGroups'][number]['keywords']) => {
    items.forEach(item => {
      result.push(item);
      if (item.children.length > 0) {
        walk(item.children);
      }
    });
  };
  walk(nodes);
  return result;
}
export default function CategoryManagementPage() {
  const {
    state,
    handlers
  } = useCategoryManagement();
  return <CategoryManagementView state={state} handlers={handlers} data-api-unique-id='categorymanagementview-radaf068ecf896ca0-s2437821645' data-api-unique-page-name='src/backend/components/CategoryManagementView' />;
}