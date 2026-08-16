'use client';

import React, { useRef, useState } from 'react';
import { GripVertical, Plus, Edit2, Copy, Trash2, ChevronLeft, ChevronRight, AlertCircle, Package, Layers, Settings2, Monitor, Smartphone, Search, Upload, ImagePlus, X } from 'lucide-react';
import type { HomeRecommendZoneManagementState, HomeRecommendZoneManagementHandlers } from '@/backend/hooks/useHomeRecommendZoneManagement';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import EditableImg from '@/@base/EditableImg';
import type { ZoneType } from '@/backend/actions/HomeRecommendZoneManagement';
import { cn } from '@/lib/utils';
import { buildCategoryCascadeTree, type CategoryCascadeOption } from '@/backend/components/CategoryCascadeSelect';
interface Props {
  state: HomeRecommendZoneManagementState;
  handlers: HomeRecommendZoneManagementHandlers;
}
const ZONE_TYPE_LABELS: Record<ZoneType, string> = {
  PRODUCT: '商品专区',
  CATEGORY: '类目专区',
  SIDE_NAV: '侧边导航专区'
};

/** 快速发图：点击选择 + 拖拽文件夹图片到此区域 */
const DisplayImageUploadZone = ({
  loading,
  onUpload,
  compact = false,
}: {
  loading: boolean
  onUpload: (files: FileList) => void
  compact?: boolean
}) => {
  const [dragOver, setDragOver] = useState(false)

  const handleFiles = (files: FileList | null | undefined) => {
    if (files?.length) onUpload(files)
  }

  return (
    <label
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 transition',
        compact ? 'py-4' : 'py-6',
        loading
          ? 'pointer-events-none border-muted bg-muted/30 opacity-70'
          : dragOver
            ? 'border-primary bg-primary/15 ring-2 ring-primary/30'
            : 'border-primary/30 bg-primary/5 hover:border-primary hover:bg-primary/10',
      )}
      onDragEnter={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (!loading) setDragOver(true)
      }}
      onDragOver={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (!loading) setDragOver(true)
      }}
      onDragLeave={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragOver(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragOver(false)
        handleFiles(e.dataTransfer.files)
      }}
    >
      <input
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        disabled={loading}
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        {loading ? (
          <Upload className="h-4 w-4 animate-pulse" />
        ) : (
          <ImagePlus className="h-4 w-4 text-primary" />
        )}
        {loading
          ? '正在上传并创建草稿展示商品...'
          : dragOver
            ? '松开鼠标即可上传'
            : '拖拽图片到此处，或点击选择'}
      </div>
      <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
        支持从文件夹拖入多张图片；将自动创建草稿展示商品，商品名称设为当天日期（YYYY-MM-DD）。
      </p>
    </label>
  )
}

function ProductZoneCategoryTreeSelect({
  categories,
  keyword,
  existingIds,
  selectedIds,
  onToggle,
}: {
  categories: Array<{ id: string; name: string; level: number; parentId?: string | null; parentName?: string | null; imageUrl?: string | null }>
  keyword: string
  existingIds: string[]
  selectedIds: string[]
  onToggle: (item: { id: string; name: string; level: number; imageUrl: string | null; parentName: string | null }, checked: boolean) => void
}) {
  const query = keyword.trim().toLowerCase()
  const tree = React.useMemo(() => {
    const options: CategoryCascadeOption[] = categories.map((item) => ({
      category_id: item.id,
      category_name: item.name,
      parent_id: item.parentId,
      level: item.level,
      parent_name: item.parentName,
    }))
    return buildCategoryCascadeTree(options, { forImportL1: false })
  }, [categories])

  const visibleTree = React.useMemo(() => {
    if (!query) return tree
    return tree.flatMap((node) => {
      const l1Hit = node.category_name.toLowerCase().includes(query)
      const children = node.children.filter((child) => child.category_name.toLowerCase().includes(query))
      if (l1Hit) return [node]
      if (children.length > 0) return [{ ...node, children }]
      return []
    })
  }, [tree, query])

  if (visibleTree.length === 0) {
    return <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">未检索到相关类目</div>
  }

  return (
    <div className="max-h-[420px] overflow-auto rounded-md border">
      {visibleTree.map((node) => {
        const l1Existing = existingIds.includes(node.category_id)
        const l1Selected = selectedIds.includes(node.category_id)
        return (
          <div key={node.category_id} className="border-b last:border-b-0">
            <label className={cn('flex items-center gap-2 px-3 py-2 text-sm', l1Existing && 'opacity-60')}>
              <Checkbox
                checked={l1Existing || l1Selected}
                disabled={l1Existing}
                onCheckedChange={(checked) =>
                  onToggle(
                    {
                      id: node.category_id,
                      name: node.category_name,
                      level: node.level || 1,
                      imageUrl: null,
                      parentName: null,
                    },
                    !!checked,
                  )
                }
              />
              <span className="font-medium">{node.category_name}</span>
              <span className="text-[10px] text-muted-foreground">一级</span>
            </label>
            {node.children.map((child) => {
              const existing = existingIds.includes(child.category_id)
              const selected = selectedIds.includes(child.category_id)
              return (
                <label
                  key={child.category_id}
                  className={cn('flex items-center gap-2 py-1.5 pl-10 pr-3 text-sm', existing && 'opacity-60')}
                >
                  <Checkbox
                    checked={existing || selected}
                    disabled={existing}
                    onCheckedChange={(checked) =>
                      onToggle(
                        {
                          id: child.category_id,
                          name: child.category_name,
                          level: child.level || 2,
                          imageUrl: null,
                          parentName: node.category_name,
                        },
                        !!checked,
                      )
                    }
                  />
                  <span>{child.category_name}</span>
                  <span className="text-[10px] text-muted-foreground">二级</span>
                </label>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

export const HomeRecommendZoneManagementView = ({
  state,
  handlers
}: Props) => {
  const isComposingRef = useRef(false);
  const totalPages = Math.ceil(state.total / state.pageSize);
  const modalTotalPages = Math.ceil(state.modalTotal / 10);

  // 计算选择器当前页全选状态
  const isProductZone = state.drawerFormData.zoneType === 'PRODUCT';
  const productZoneCategoryItems = isProductZone
    ? state.drawerItems.filter((item) => item.itemKind !== 'PRODUCT' && item.status !== 'DRAFT')
    : [];
  const productZoneDraftItems = isProductZone
    ? state.drawerItems.filter((item) => item.itemKind === 'PRODUCT' || item.status === 'DRAFT')
    : [];
  const modalPageItems = state.modalCategories;
  const existingIdsInDrawer = state.drawerItems.map((i) => i.entityId);
  const selectablePageItems = modalPageItems.filter(item => !existingIdsInDrawer.includes(item.id));
  const isAllModalSelected = selectablePageItems.length > 0 && selectablePageItems.every(item => state.modalSelectedItems.some(si => si.id === item.id));
  return <div className="min-h-screen bg-background font-body text-foreground" data-api-unique-id="homerecommendzonemanagementview-r32790c31de4dc1cf-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
      {/* 顶栏控制区 */}
      <section className="w-full border-b bg-card" data-controller-name="页面标题与全局操作" data-api-unique-id="homerecommendzonemanagementview-rc760eabd9184933c-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
        <div className="container mx-auto px-8 py-6 flex items-center justify-between" data-api-unique-id="homerecommendzonemanagementview-ra3689803963622ba-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
          <div className="space-y-1" data-api-unique-id="homerecommendzonemanagementview-rdaba76b9effdd65d-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
            <h1 className="text-2xl font-header font-bold tracking-tight" data-api-unique-id="homerecommendzonemanagementview-re869064e34dee5ae-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">首页推荐专区管理</h1>
            <p className="text-sm text-muted-foreground font-body" data-api-unique-id="homerecommendzonemanagementview-r877f6fda4a596ccb-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">编排商城首页的商品与类目推荐区块，支持动态布局与权重排序。</p>
          </div>
          <div className="flex items-center gap-3" data-api-unique-id='homerecommendzonemanagementview-r6c0bb23ce38ae25e-s2152852823' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView'>
            <div className="relative w-[280px]" data-api-unique-id='homerecommendzonemanagementview-r43eeac9442990c6b-s2152852823' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView'>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" data-api-unique-id='homerecommendzonemanagementview-rf1c3d50f1eda6220-s2152852823' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView' />
              <Input value={state.keyword} onChange={e => handlers.onKeywordChange(e.target.value)} onKeyDown={e => {
              if (e.key === 'Enter' && !isComposingRef.current) {
                handlers.onSearch();
              }
            }} placeholder="搜索专区标题" className="pl-9 bg-background" data-api-unique-id='homerecommendzonemanagementview-r0dbc684a9936e949-s2152852823' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView' />
            </div>
            <Button variant="outline" onClick={handlers.onSearch} data-api-unique-id='homerecommendzonemanagementview-re2784356a515d976-s2152852823' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView'>搜索</Button>
            <Button onClick={() => handlers.onOpenDrawer(null)} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm" data-api-unique-id='homerecommendzonemanagementview-r9a0bfbe292a00f2c-s2152852823' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView'>
              <Plus className="mr-2 h-4 w-4" data-api-unique-id='homerecommendzonemanagementview-r121a32e1639f9388-s2152852823' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView' /> 新增推荐专区
            </Button>
          </div>
        </div>
      </section>

      {/* 核心数据网格 */}
      <section className="w-full" data-controller-name="推荐专区列表视图" data-api-unique-id="homerecommendzonemanagementview-rf9779dcafd9962fb-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
        <div className="container mx-auto px-8 py-8 space-y-6" data-api-unique-id="homerecommendzonemanagementview-re89e8449c04a79fa-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
          <Card className="border-border shadow-sm overflow-hidden" data-api-unique-id="homerecommendzonemanagementview-r3b04835e697d3c54-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
            <CardContent className="p-0" data-api-unique-id="homerecommendzonemanagementview-r03f14aa0b6ce64cf-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
              <Table data-api-unique-id="homerecommendzonemanagementview-rf840bb19fb9c9033-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                <TableHeader className="bg-secondary/50" data-api-unique-id="homerecommendzonemanagementview-r9e3c466f81193aae-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                  <TableRow className="hover:bg-transparent" data-api-unique-id="homerecommendzonemanagementview-rcd371a66dd7b41de-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                    <TableHead className="w-[50px] text-center" data-api-unique-id="homerecommendzonemanagementview-r7e39686d2dbbb1b7-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView"></TableHead>
                    <TableHead className="font-header text-xs uppercase tracking-wider" data-api-unique-id="homerecommendzonemanagementview-r1977eacf136be111-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">专区标题</TableHead>
                    <TableHead className="font-header text-xs uppercase tracking-wider" data-api-unique-id="homerecommendzonemanagementview-r8a64edc92b000817-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">展示类型</TableHead>
                    <TableHead className="font-header text-xs uppercase tracking-wider" data-api-unique-id="homerecommendzonemanagementview-rbe1e5a3c0a52ff08-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">终端布局</TableHead>
                    <TableHead className="font-header text-xs uppercase tracking-wider" data-api-unique-id="homerecommendzonemanagementview-r9e73688ea6b8ec2e-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">数据绑定</TableHead>
                    <TableHead className="font-header text-xs uppercase tracking-wider w-[120px]" data-api-unique-id="homerecommendzonemanagementview-r49c1e7b913178392-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">权重</TableHead>
                    <TableHead className="font-header text-xs uppercase tracking-wider w-[100px]" data-api-unique-id="homerecommendzonemanagementview-r45e9c2c4ba6a66d8-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">状态</TableHead>
                    <TableHead className="text-right font-header text-xs uppercase tracking-wider" data-api-unique-id="homerecommendzonemanagementview-rf9acee3998f26c3b-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody data-api-unique-id="homerecommendzonemanagementview-rfd279d21e5544e57-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                  {state.loading && state.list.length === 0 ? <TableRow data-api-unique-id="homerecommendzonemanagementview-rd74e0e629f801489-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                      <TableCell colSpan={8} className="h-32 text-center text-muted-foreground" data-api-unique-id="homerecommendzonemanagementview-rb3a5b45c206f574d-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">数据加载中...</TableCell>
                    </TableRow> : state.list.length === 0 ? <TableRow data-api-unique-id="homerecommendzonemanagementview-r3fa8fa923bd941bc-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                      <TableCell colSpan={8} className="h-32 text-center text-muted-foreground" data-api-unique-id="homerecommendzonemanagementview-r4775de9a3703fd56-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">暂无推荐专区数据</TableCell>
                    </TableRow> : state.list.map((row, index) => <TableRow key={row.id} draggable onDragStart={() => handlers.onListDragStart(index)} onDragEnter={() => handlers.onListDragEnter(index)} onDragEnd={() => handlers.onListDragEnd()} onDragOver={e => e.preventDefault()} className="group transition-colors duration-200" data-api-unique-id="homerecommendzonemanagementview-rbe568c7193bb0dfe-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1">
                        <TableCell className="text-center" data-api-unique-id="homerecommendzonemanagementview-rac4a15e60089c6b6-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1">
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-move opacity-0 group-hover:opacity-100 transition-opacity" data-api-unique-id="homerecommendzonemanagementview-rfc4a2312bcdb3a9a-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1" />
                        </TableCell>
                        <TableCell className="font-medium text-foreground" data-api-unique-id="homerecommendzonemanagementview-rffea73e6ccb5391b-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1">{row.title}</TableCell>
                        <TableCell data-api-unique-id="homerecommendzonemanagementview-rf26cb7edf9fa6532-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1">
                          <Badge variant="outline" className="font-normal border-border bg-background text-secondary-foreground" data-api-unique-id="homerecommendzonemanagementview-r22e0c03df732a57b-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1">
                            {row.zoneType === 'PRODUCT' ? <Package className="mr-1 h-3 w-3" data-api-unique-id="homerecommendzonemanagementview-rc2562260e4694c0f-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1" /> : <Layers className="mr-1 h-3 w-3" data-api-unique-id="homerecommendzonemanagementview-raaa27c08466dc8e8-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1" />}
                            {ZONE_TYPE_LABELS[row.zoneType]}
                          </Badge>
                        </TableCell>
                        <TableCell data-api-unique-id="homerecommendzonemanagementview-r4b15c8218c4d312e-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground" data-api-unique-id="homerecommendzonemanagementview-ra371af8feb5fc3de-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1">
                            <span className="flex items-center gap-1" data-api-unique-id="homerecommendzonemanagementview-r2087816ffb2d5e0c-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1"><Monitor className="h-3 w-3" data-api-unique-id="homerecommendzonemanagementview-r93e8f937ac687dc4-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1" /> {row.pcCols}</span>
                            <span className="text-border" data-api-unique-id="homerecommendzonemanagementview-r6ce3804fd54541d8-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1">|</span>
                            <span className="flex items-center gap-1" data-api-unique-id="homerecommendzonemanagementview-rfdce35e61f7e9ebc-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1"><Smartphone className="h-3 w-3" data-api-unique-id="homerecommendzonemanagementview-rf15051875b5ecf0a-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1" /> {row.mobileCols}</span>
                          </div>
                        </TableCell>
                        <TableCell data-api-unique-id="homerecommendzonemanagementview-r458e26fbbd6c7d66-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1">
                          <span className={`text-xs ${row.isBoundCollection ? 'text-accent font-medium' : 'text-muted-foreground'}`} data-api-unique-id="homerecommendzonemanagementview-rd8a7f5bdca96daa4-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1">
                            {row.isBoundCollection ? '永久集合' : '自定义列表'}
                          </span>
                          <p className="mt-1 text-[11px] text-muted-foreground" data-api-unique-id='homerecommendzonemanagementview-rd89f9a4f0f935490-s2152852823' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView' data-api-in-loop='1'>已选 {row.itemCount} 项</p>
                        </TableCell>
                        <TableCell data-api-unique-id="homerecommendzonemanagementview-rb14946226e1bb1ab-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1">
                          <Input type="number" defaultValue={row.sortWeight} onBlur={e => handlers.onWeightBlur(row.id, Number(e.target.value))} className="h-8 text-xs px-3 focus-visible:ring-primary border-border" data-api-unique-id="homerecommendzonemanagementview-r403fc9cade7bc88c-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1" />
                        </TableCell>
                        <TableCell data-api-unique-id="homerecommendzonemanagementview-rea22c46b459e5316-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1">
                          <Switch checked={row.isActive} onCheckedChange={() => handlers.onToggleStatus(row.id, row.isActive)} className="data-[state=checked]:bg-accent" data-api-unique-id="homerecommendzonemanagementview-r44f38d065cbddb6e-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1" />
                        </TableCell>
                        <TableCell className="text-right" data-api-unique-id="homerecommendzonemanagementview-r5ce0d93bb1616b6d-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1">
                          <div className="flex justify-end gap-1" data-api-unique-id="homerecommendzonemanagementview-r1feb20823d5501a1-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1">
                            <Button variant="ghost" size="icon" onClick={() => handlers.onOpenDrawer(row.id)} title="编辑" data-api-unique-id="homerecommendzonemanagementview-r5e064cbd7771c05e-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1">
                              <Edit2 className="h-4 w-4 text-secondary-foreground" data-api-unique-id="homerecommendzonemanagementview-r0f9b42ea1e9adb58-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handlers.onOpenDrawer(row.id, true)} title="复制" data-api-unique-id="homerecommendzonemanagementview-r45f6aa03bf6f5439-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1">
                              <Copy className="h-4 w-4 text-secondary-foreground" data-api-unique-id="homerecommendzonemanagementview-r067616c01ea7f184-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handlers.onDeleteClick(row.id)} className="hover:bg-destructive/10 hover:text-destructive text-secondary-foreground" title="删除" data-api-unique-id="homerecommendzonemanagementview-rba982d5f7a208fa8-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1">
                              <Trash2 className="h-4 w-4" data-api-unique-id="homerecommendzonemanagementview-r10de73a7f53acd7e-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* 列表分页器 */}
          {state.total > 0 && <div className="flex items-center justify-between px-2 py-4" data-api-unique-id="homerecommendzonemanagementview-re8bf668fe3b24deb-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
              <p className="text-sm text-muted-foreground" data-api-unique-id="homerecommendzonemanagementview-r469d963e01b92378-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                共 <span className="font-medium text-foreground" data-api-unique-id="homerecommendzonemanagementview-r9d8c3f0ef2cd98fe-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">{state.total}</span> 条数据
              </p>
              <div className="flex items-center space-x-2" data-api-unique-id="homerecommendzonemanagementview-r51334b27e5aa77c5-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                <Button variant="outline" size="sm" disabled={state.page <= 1} onClick={() => handlers.onPageChange(state.page - 1)} className="h-8 w-8 p-0" data-api-unique-id="homerecommendzonemanagementview-r4d4d897713480aaa-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                  <ChevronLeft className="h-4 w-4" data-api-unique-id="homerecommendzonemanagementview-rb6a4fe962b58a47f-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" />
                </Button>
                <div className="flex items-center gap-1 text-sm font-medium" data-api-unique-id="homerecommendzonemanagementview-r88f710a9a82cee27-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                  <span className="text-primary" data-api-unique-id="homerecommendzonemanagementview-r32daedb3b4c6afc4-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">{state.page}</span>
                  <span className="text-muted-foreground" data-api-unique-id="homerecommendzonemanagementview-rc408500483c68833-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">/</span>
                  <span data-api-unique-id="homerecommendzonemanagementview-r9f49ea3ad4d82d7c-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">{totalPages}</span>
                </div>
                <Button variant="outline" size="sm" disabled={state.page >= totalPages} onClick={() => handlers.onPageChange(state.page + 1)} className="h-8 w-8 p-0" data-api-unique-id="homerecommendzonemanagementview-rda43dc85a74f80a8-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                  <ChevronRight className="h-4 w-4" data-api-unique-id="homerecommendzonemanagementview-r236d43e373f8c278-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" />
                </Button>
              </div>
            </div>}
        </div>
      </section>

      {/* 专区配置抽屉 */}
      <Sheet open={state.drawerOpen} onOpenChange={handlers.onCloseDrawer} data-api-unique-id="homerecommendzonemanagementview-rd5a84ce4681e3654-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
        <SheetContent className="sm:max-w-xl w-[90vw] flex flex-col p-0 border-l border-border bg-card" data-api-unique-id="homerecommendzonemanagementview-rdc74818d17e6a14f-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
          <SheetHeader className="px-6 py-4 border-b" data-api-unique-id="homerecommendzonemanagementview-r90a647b13e885d8f-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
            <SheetTitle className="text-lg font-header font-bold" data-api-unique-id="homerecommendzonemanagementview-r58deccc250e532f9-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
              {state.editingId ? '编辑推荐专区' : '新增推荐专区'}
            </SheetTitle>
          </SheetHeader>
          
          <ScrollArea className="flex-1 px-6 py-6" data-api-unique-id="homerecommendzonemanagementview-rcca5759669bdf6cb-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
            {state.drawerLoading ? <div className="space-y-4 py-8 text-center text-muted-foreground" data-api-unique-id="homerecommendzonemanagementview-r9725d86960fbac94-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">加载中...</div> : <div className="space-y-8 pb-12" data-api-unique-id="homerecommendzonemanagementview-r2ee6e027f75d2d78-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                {/* 基础信息 */}
                <div className="space-y-4" data-api-unique-id="homerecommendzonemanagementview-r9047be592ef6086f-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground border-l-4 border-primary pl-2" data-api-unique-id="homerecommendzonemanagementview-r729fc965385265e5-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                    <Settings2 className="h-4 w-4 text-primary" data-api-unique-id="homerecommendzonemanagementview-r478e9538ef0b825a-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" /> 基础配置
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4" data-api-unique-id="homerecommendzonemanagementview-ra6f66ebe266097db-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                    <div className="space-y-2" data-api-unique-id="homerecommendzonemanagementview-r1ea40682325d9a47-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                      <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider" data-api-unique-id="homerecommendzonemanagementview-r72321e3bc6ab982e-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">专区标题</Label>
                      <Input value={state.drawerFormData.title} onChange={e => handlers.onDrawerFieldChange('title', e.target.value)} placeholder="例如：本周热门商品" className="px-3" data-api-unique-id="homerecommendzonemanagementview-r02102169342aed67-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" />
                    </div>

                    <div className="space-y-2" data-api-unique-id="homerecommendzonemanagementview-rbffc7baf517a0625-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                      <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider" data-api-unique-id="homerecommendzonemanagementview-r5fa84459ca915f82-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">展示类型</Label>
                      <RadioGroup value={state.drawerFormData.zoneType} onValueChange={val => handlers.onDrawerFieldChange('zoneType', val as ZoneType)} className="flex gap-4 pt-1" data-api-unique-id="homerecommendzonemanagementview-r1aece57788f0a7df-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                        <div className="flex items-center space-x-2 border rounded-md px-4 py-2 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-all" data-api-unique-id="homerecommendzonemanagementview-r0135ba228689cc95-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                          <RadioGroupItem value="PRODUCT" id="t-prod" className="text-primary border-primary" data-api-unique-id="homerecommendzonemanagementview-r369693e8fd1e12fc-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" />
                          <Label htmlFor="t-prod" className="cursor-pointer font-medium" data-api-unique-id="homerecommendzonemanagementview-rb7d0ea0273211f89-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">商品专区</Label>
                        </div>
                        <div className="flex items-center space-x-2 border rounded-md px-4 py-2 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-all" data-api-unique-id="homerecommendzonemanagementview-r2496927049962bc3-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                          <RadioGroupItem value="CATEGORY" id="t-cat" className="text-primary border-primary" data-api-unique-id="homerecommendzonemanagementview-r92ee73c34de66375-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" />
                          <Label htmlFor="t-cat" className="cursor-pointer font-medium" data-api-unique-id="homerecommendzonemanagementview-r4af93a32eda16f06-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">类目专区</Label>
                        </div>
                        <div className="flex items-center space-x-2 border rounded-md px-4 py-2 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-all" data-api-unique-id='homerecommendzonemanagementview-r04c1781ebf1d5538-s2152852823' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView'>
                          <RadioGroupItem value="SIDE_NAV" id="t-side-nav" className="text-primary border-primary" data-api-unique-id='homerecommendzonemanagementview-r83957596cc630aaf-s2152852823' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView' />
                          <Label htmlFor="t-side-nav" className="cursor-pointer font-medium" data-api-unique-id='homerecommendzonemanagementview-r3c456162f390fc53-s2152852823' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView'>侧边导航专区</Label>
                        </div>
                      </RadioGroup>
                      {state.drawerFormData.zoneType === 'SIDE_NAV' ? <p className="text-xs leading-relaxed text-muted-foreground" data-api-unique-id='homerecommendzonemanagementview-re43922810a9a18a0-s2152852823' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView'>侧边导航专区仅保存已选类目顺序，用于首页左侧“分类浏览”纵向导航展示，不会创建永久集合。</p> : null}
                    </div>
                  </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3" data-api-unique-id='homerecommendzonemanagementview-r8d4ce75ce4ff9f69-s2152852823' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView'>
                    <div className="space-y-2" data-api-unique-id="homerecommendzonemanagementview-r3338e28381072501-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                      <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1" data-api-unique-id="homerecommendzonemanagementview-r921f954f2d22a765-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                        <Monitor className="h-3 w-3" data-api-unique-id="homerecommendzonemanagementview-r232c914e71a30b27-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" /> PC端列数
                      </Label>
                      <Select value={String(state.drawerFormData.pcCols)} onValueChange={value => handlers.onDrawerFieldChange('pcCols', Number(value))} data-api-unique-id='homerecommendzonemanagementview-r122dd738566566d0-s2152852823' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView'>
                        <SelectTrigger className="px-3" data-api-unique-id='homerecommendzonemanagementview-rb176d57ada438271-s2152852823' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView'>
                          <SelectValue placeholder="选择PC端列数" data-api-unique-id='homerecommendzonemanagementview-r225139e7d38312b7-s2152852823' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView' />
                        </SelectTrigger>
                        <SelectContent data-api-unique-id='homerecommendzonemanagementview-rd2566c1ff12aadca-s2152852823' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView'>
                          <SelectItem value="3" data-api-unique-id='homerecommendzonemanagementview-r168d67569a6ac557-s2152852823' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView'>3 列</SelectItem>
                          <SelectItem value="4" data-api-unique-id='homerecommendzonemanagementview-r9ab403f8e14ddd2c-s2152852823' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView'>4 列</SelectItem>
                          <SelectItem value="5" data-api-unique-id='homerecommendzonemanagementview-red49310e702364b2-s2152852823' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView'>5 列</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2" data-api-unique-id="homerecommendzonemanagementview-rec65a787153e0d67-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                      <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1" data-api-unique-id="homerecommendzonemanagementview-r52fc6cae049eecdf-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                        <Smartphone className="h-3 w-3" data-api-unique-id="homerecommendzonemanagementview-rf261e86673025c26-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" /> 手机端列数
                      </Label>
                      <Select value={String(state.drawerFormData.mobileCols)} onValueChange={value => handlers.onDrawerFieldChange('mobileCols', Number(value))} data-api-unique-id='homerecommendzonemanagementview-r09a1f71d916cb6cf-s2152852823' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView'>
                        <SelectTrigger className="px-3" data-api-unique-id='homerecommendzonemanagementview-rbb6671f6dfc546d6-s2152852823' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView'>
                          <SelectValue placeholder="选择手机端列数" data-api-unique-id='homerecommendzonemanagementview-rc112f9b66cb9b381-s2152852823' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView' />
                        </SelectTrigger>
                        <SelectContent data-api-unique-id='homerecommendzonemanagementview-rb99637fdca8a8c89-s2152852823' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView'>
                          <SelectItem value="1" data-api-unique-id='homerecommendzonemanagementview-r726bdd76c221c66d-s2152852823' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView'>1 列</SelectItem>
                          <SelectItem value="2" data-api-unique-id='homerecommendzonemanagementview-r779efa3e19e989e2-s2152852823' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView'>2 列</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2" data-controller-name="推荐专区行数设置">
                      <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                        行数设置
                      </Label>
                      <Select
                        value={String(state.drawerFormData.pcRows || 2)}
                        onValueChange={value => handlers.onDrawerFieldChange('pcRows', Number(value))}
                      >
                        <SelectTrigger className="px-3">
                          <SelectValue placeholder="选择展示行数" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((rows) => (
                            <SelectItem key={rows} value={String(rows)}>
                              {rows} 行（最多展示 {state.drawerFormData.pcCols * rows} 个）
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        前台按「PC列数 × 行数」限制展示数量
                      </p>
                    </div>
                  </div>

                <div className="grid grid-cols-2 gap-4 items-end" data-api-unique-id='homerecommendzonemanagementview-rd568df5f165904e8-s2152852823' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView'>
                  <div className="space-y-2" data-api-unique-id='homerecommendzonemanagementview-ra0a0f74084122b68-s2152852823' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView'>
                    <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider" data-api-unique-id='homerecommendzonemanagementview-r84d8097bb6206ba3-s2152852823' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView'>排序权重</Label>
                    <Input type="number" value={state.drawerFormData.sortWeight} onChange={e => handlers.onDrawerFieldChange('sortWeight', Number(e.target.value))} className="px-3" data-api-unique-id='homerecommendzonemanagementview-rc79ec6c31f703e08-s2152852823' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView' />
                  </div>
                  <div className="flex items-center gap-3 border rounded-md px-3 h-10 bg-secondary/20" data-api-unique-id='homerecommendzonemanagementview-r5f71a41bd757e2f6-s2152852823' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView'>
                    <Switch checked={state.drawerFormData.isActive} onCheckedChange={val => handlers.onDrawerFieldChange('isActive', val)} id="drawer-status" data-api-unique-id='homerecommendzonemanagementview-r08752fb17a8ed8ec-s2152852823' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView' />
                    <Label htmlFor="drawer-status" className="text-sm font-medium cursor-pointer" data-api-unique-id='homerecommendzonemanagementview-r3f3f97cabe8ccfa4-s2152852823' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView'>启用当前专区</Label>
                  </div>
                </div>
              </div>

                {/* 内容明细 */}
                <div className="space-y-4" data-api-unique-id="homerecommendzonemanagementview-r4d08411dddb68364-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                  <div className="flex items-center justify-between border-b pb-2" data-api-unique-id="homerecommendzonemanagementview-r093d2c1ffe4737c4-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground" data-api-unique-id="homerecommendzonemanagementview-r914a39c5c37bc006-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                      内容明细 <Badge variant="secondary" className="rounded-full px-2 py-0 h-5 min-w-[20px] justify-center" data-api-unique-id="homerecommendzonemanagementview-raeee06c5b2a53935-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">{isProductZone ? productZoneCategoryItems.length : state.drawerItems.length}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {state.drawerFormData.zoneType === 'PRODUCT' && state.selectedDraftIds.length > 0 ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
                          onClick={() => { void handlers.onBatchDeleteDrafts() }}
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          批量删除草稿 ({state.selectedDraftIds.length})
                        </Button>
                      ) : null}
                      <Button size="sm" variant="outline" onClick={handlers.onOpenSelector} className="h-8 text-xs border-dashed border-primary text-primary hover:bg-primary/5 hover:text-primary-foreground" data-api-unique-id="homerecommendzonemanagementview-r19daad9cda353c3c-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                        <Plus className="mr-1 h-3 w-3" data-api-unique-id="homerecommendzonemanagementview-r2912b354637b4f98-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" /> 
                        {state.drawerFormData.zoneType === 'PRODUCT' ? '添加类目' : state.drawerFormData.zoneType === 'SIDE_NAV' ? '添加导航类目' : '添加类目'}
                      </Button>
                    </div>
                  </div>
                  {state.drawerFormData.zoneType === 'SIDE_NAV' ? <Alert className="border-primary/20 bg-primary/5" data-api-unique-id='homerecommendzonemanagementview-r5a6616925437d080-s2152852823' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView'>
                      <Layers className="h-4 w-4 text-primary" data-api-unique-id='homerecommendzonemanagementview-r8d8616e49e61dc12-s2152852823' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView' />
                      <AlertTitle data-api-unique-id='homerecommendzonemanagementview-r2f78b9bb1a21f8c4-s2152852823' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView'>侧边导航专区说明</AlertTitle>
                      <AlertDescription data-api-unique-id='homerecommendzonemanagementview-r74e2b08944088e14-s2152852823' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView'>
                        请选择需要展示在首页左侧分类浏览中的一级或二级启用类目。保存后仅记录类目 ID 与排序，不会生成永久商品集合。
                      </AlertDescription>
                    </Alert> : null}

                  {state.drawerFormData.zoneType === 'PRODUCT' ? (
                    <div className="space-y-3">
                      {productZoneCategoryItems.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {productZoneCategoryItems.map((item) => {
                            const index = state.drawerItems.findIndex((row) => row.entityId === item.entityId)
                            return (
                              <span
                                key={item.entityId}
                                className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 py-1 pl-3 pr-1 text-sm"
                              >
                                <span className="max-w-[220px] truncate">{item.name}</span>
                                <button
                                  type="button"
                                  className="rounded-full p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                  onClick={() => handlers.onDrawerItemRemove(index)}
                                  aria-label={`移除 ${item.name}`}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </span>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">尚未选择类目。点击「添加类目」后，前台将展示这些类目下全部已上架商品。</p>
                      )}
                      <DisplayImageUploadZone
                        compact
                        loading={state.draftUploadLoading}
                        onUpload={(files) => { void handlers.onUploadDisplayImages(files) }}
                      />
                    </div>
                  ) : null}

                  {(isProductZone ? productZoneCategoryItems.length + productZoneDraftItems.length === 0 : state.drawerItems.length === 0) ? <div className="h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 bg-secondary/20 border-muted" data-api-unique-id="homerecommendzonemanagementview-r5eaebfc3261f9e8d-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                      <p className="text-sm text-muted-foreground" data-api-unique-id="homerecommendzonemanagementview-rf931a82f0d8f4336-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">暂无内容，请点击上方按钮添加，或拖拽图片到上传区</p>
                    </div> : isProductZone && productZoneDraftItems.length === 0 ? null : <div className="border rounded-md overflow-hidden bg-background" data-api-unique-id="homerecommendzonemanagementview-r7aa8e807b6faf5dc-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                      <Table data-api-unique-id="homerecommendzonemanagementview-r0f2c6dae745f034e-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                        <TableHeader className="bg-secondary/30" data-api-unique-id="homerecommendzonemanagementview-r80587fbfefcad104-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                          <TableRow className="h-9" data-api-unique-id="homerecommendzonemanagementview-ref33f0320fa3b465-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                            {state.drawerFormData.zoneType === 'PRODUCT' ? (
                              <TableHead className="w-[40px]">
                                <Checkbox
                                  checked={
                                    state.drawerItems.some((item) => item.status === 'DRAFT') &&
                                    state.drawerItems.filter((item) => item.status === 'DRAFT').every((item) => state.selectedDraftIds.includes(item.entityId))
                                  }
                                  onCheckedChange={(checked) => handlers.onToggleAllDraftSelect(!!checked)}
                                />
                              </TableHead>
                            ) : null}
                            <TableHead className="w-[60px]" data-api-unique-id="homerecommendzonemanagementview-r7d7cf60775c2b559-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView"></TableHead>
                            <TableHead className="text-[11px] uppercase tracking-wider font-header" data-api-unique-id="homerecommendzonemanagementview-ra99c22d0ec8676e2-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">预览</TableHead>
                            <TableHead className="text-[11px] uppercase tracking-wider font-header" data-api-unique-id="homerecommendzonemanagementview-r1880985ce562c80f-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">名称/编码</TableHead>
                            <TableHead className="text-[11px] uppercase tracking-wider font-header">状态 / 上新</TableHead>
                            <TableHead className="text-right text-[11px] uppercase tracking-wider font-header" data-api-unique-id="homerecommendzonemanagementview-r483f7f57a4bacf7a-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">操作</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody data-api-unique-id="homerecommendzonemanagementview-r971356630b494bfd-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                          {(isProductZone ? productZoneDraftItems : state.drawerItems).map((item) => {
                            const index = state.drawerItems.findIndex((row) => row.entityId === item.entityId)
                            return <TableRow key={item.entityId} draggable onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; handlers.onDrawerItemDragStart(index) }} onDragEnter={() => handlers.onDrawerItemDragEnter(index)} onDragEnd={() => { void handlers.onDrawerItemDragEnd(); }} onDragOver={e => e.preventDefault()} className="group h-12 cursor-grab active:cursor-grabbing" data-api-unique-id="homerecommendzonemanagementview-r287fd8a1a11e0b6c-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1">
                              {state.drawerFormData.zoneType === 'PRODUCT' ? (
                                <TableCell className="w-[40px]">
                                  {item.status === 'DRAFT' ? (
                                    <Checkbox
                                      checked={state.selectedDraftIds.includes(item.entityId)}
                                      onCheckedChange={(checked) => handlers.onToggleDraftSelect(item.entityId, !!checked)}
                                    />
                                  ) : null}
                                </TableCell>
                              ) : null}
                              <TableCell className="w-[40px] text-center" data-api-unique-id="homerecommendzonemanagementview-rc107ec7605c2ce3d-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1">
                                <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-md border border-pink-300 bg-pink-50 text-pink-600 shadow-sm" title="拖拽调整明细顺序">
                                  <GripVertical className="h-4 w-4" data-api-unique-id="homerecommendzonemanagementview-rf3f8e032f33e5a00-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1" />
                                </div>
                              </TableCell>
                              <TableCell className="w-[60px] py-2" data-api-unique-id="homerecommendzonemanagementview-r835fc7bae204320a-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1">
                                <div className="w-10 h-10 rounded border overflow-hidden bg-muted flex items-center justify-center" data-api-unique-id="homerecommendzonemanagementview-rc22b8237d094de08-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1">
                                  <EditableImg propKey={`drawer-item-${item.entityId}`} keywords={item.imageUrl} className="w-full h-full object-cover" data-api-unique-id="homerecommendzonemanagementview-r656bbddf1744cfbe-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1" />
                                </div>
                              </TableCell>
                              <TableCell className="py-2" data-api-unique-id="homerecommendzonemanagementview-r30e268bd5eec9426-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1">
                                <div className="flex flex-col" data-api-unique-id="homerecommendzonemanagementview-r0b5ae1c3a2a77081-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1">
                                  <span className="text-sm font-medium line-clamp-1" data-api-unique-id="homerecommendzonemanagementview-recbdc881bb883247-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1">{item.name}</span>
                                  <span className="text-[10px] text-muted-foreground uppercase" data-api-unique-id="homerecommendzonemanagementview-r64ba0e7602a8b517-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1">{item.codeOrSku}</span>
                                </div>
                              </TableCell>
                              <TableCell className="py-2">
                                <div className="flex flex-col gap-0.5">
                                  <Badge variant={item.status === 'DRAFT' ? 'secondary' : 'outline'} className="w-fit text-[10px]">
                                    {item.status === 'DRAFT' ? '草稿' : item.status === 'ACTIVE' ? '上架' : item.status}
                                  </Badge>
                                  {item.createdAt ? (
                                    <span className="text-[10px] text-muted-foreground">
                                      上新 {new Date(item.createdAt).toLocaleString('zh-CN', { hour12: false })}
                                    </span>
                                  ) : null}
                                </div>
                              </TableCell>
                              <TableCell className="text-right py-2" data-api-unique-id="homerecommendzonemanagementview-red6ad32738487026-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1">
                                <Button variant="ghost" size="icon" onClick={() => handlers.onDrawerItemRemove(index)} className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" data-api-unique-id="homerecommendzonemanagementview-rb19c017249359552-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1">
                                  <Trash2 className="h-3.5 w-3.5" data-api-unique-id="homerecommendzonemanagementview-r5b548fc4926f7304-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          })}
                        </TableBody>
                      </Table>
                    </div>}
                </div>
              </div>}
          </ScrollArea>

          <SheetFooter className="p-6 border-t bg-card mt-auto flex-row items-center gap-3 justify-end sm:justify-end" data-api-unique-id="homerecommendzonemanagementview-rc4981b195bca43e0-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
            <Button variant="outline" onClick={() => handlers.onCloseDrawer(false)} disabled={state.drawerSaving} className="px-6 border-border" data-api-unique-id="homerecommendzonemanagementview-rd75302b1d8432736-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">取消</Button>
            <Button onClick={handlers.onDrawerSave} disabled={state.drawerSaving || state.drawerLoading} className="px-6 bg-primary text-primary-foreground hover:bg-primary/90 min-w-[120px]" data-api-unique-id="homerecommendzonemanagementview-rcfaa45291185cb6d-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
              {state.drawerSaving ? '保存中...' : '保存配置'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* 删除确认弹窗 */}
      <Dialog open={state.deleteOpen} onOpenChange={handlers.onCancelDelete} data-api-unique-id="homerecommendzonemanagementview-r9871f900c1d9b963-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
        <DialogContent className="max-w-md p-0 overflow-hidden border-border bg-card" data-api-unique-id="homerecommendzonemanagementview-rf180f868fb318358-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
          <div className="p-6 pt-8 text-center space-y-4" data-api-unique-id="homerecommendzonemanagementview-r379cbfc828b0d4d9-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center" data-api-unique-id="homerecommendzonemanagementview-r6f4edce5deae4ba8-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
              <AlertCircle className="h-6 w-6 text-destructive" data-api-unique-id="homerecommendzonemanagementview-rcff367250be8720f-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" />
            </div>
            <div className="space-y-2" data-api-unique-id="homerecommendzonemanagementview-re807cbea048b5ed6-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
              <h3 className="text-lg font-bold font-header text-foreground" data-api-unique-id="homerecommendzonemanagementview-r1673279755813e88-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">确认删除专区？</h3>
              <p className="text-sm text-muted-foreground leading-relaxed px-4" data-api-unique-id="homerecommendzonemanagementview-rf9690ec575bc7483-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                确定要删除该推荐专区吗？删除后首页对应的展示区块将被移除，此操作不可恢复。
              </p>
            </div>
          </div>
          <DialogFooter className="flex flex-row p-4 bg-secondary/20 border-t gap-3 sm:justify-center" data-api-unique-id="homerecommendzonemanagementview-r03fabd6d80637d53-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
            <Button variant="outline" onClick={() => handlers.onCancelDelete(false)} disabled={state.deleteLoading} className="flex-1 bg-card border-border" data-api-unique-id="homerecommendzonemanagementview-re2274be9ee88a3b9-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
              取消
            </Button>
            <Button variant="destructive" onClick={handlers.onConfirmDelete} disabled={state.deleteLoading} className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90" data-api-unique-id="homerecommendzonemanagementview-r9cd0348152006029-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
              {state.deleteLoading ? '正在删除...' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 选择器弹窗 */}
      <Dialog open={state.selectorOpen} onOpenChange={handlers.onCloseSelector} data-api-unique-id="homerecommendzonemanagementview-ra248410b039139cf-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 border-border bg-card overflow-hidden" data-api-unique-id="homerecommendzonemanagementview-raa0bcb97edf1ea3d-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
          <DialogHeader className="px-6 py-4 border-b" data-api-unique-id="homerecommendzonemanagementview-r496fe75bb9e34088-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
            <DialogTitle className="text-lg font-header font-bold flex items-center gap-2" data-api-unique-id="homerecommendzonemanagementview-rdee4958e7657a0b6-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
              {state.drawerFormData.zoneType === 'PRODUCT' ? <Package className="h-5 w-5" data-api-unique-id="homerecommendzonemanagementview-r3ef95d5fd6ea2a36-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" /> : <Layers className="h-5 w-5" data-api-unique-id="homerecommendzonemanagementview-rb08949ceef8f5a46-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" />}
              {state.drawerFormData.zoneType === 'PRODUCT' ? '选择展示类目' : state.drawerFormData.zoneType === 'SIDE_NAV' ? '选择侧边导航类目' : '选择推荐类目'}
            </DialogTitle>
          </DialogHeader>

          {state.drawerFormData.zoneType === 'PRODUCT' ? (
            <p className="border-b px-6 py-3 text-xs text-muted-foreground">
              可勾选一级或二级类目，支持多选。保存后前台按这些类目动态拉取已上架商品。
            </p>
          ) : null}

          <div className="px-6 py-4 bg-secondary/20 flex items-center gap-3" data-api-unique-id="homerecommendzonemanagementview-ra3fb634d97f2f3f0-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
            <div className="relative flex-1" data-api-unique-id="homerecommendzonemanagementview-rdfdb4541f7961af1-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" data-api-unique-id="homerecommendzonemanagementview-r00939ff619e25db2-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" />
              <Input placeholder={state.drawerFormData.zoneType === 'SIDE_NAV' ? '搜索一级或二级类目名称...' : '搜索类目名称...'} value={state.modalKeyword} onChange={e => handlers.onModalKeywordChange(e.target.value)} onCompositionStart={() => isComposingRef.current = true} onCompositionEnd={() => {
              isComposingRef.current = false;
            }} onKeyDown={e => {
              if (e.key === 'Enter' && !isComposingRef.current) {
                handlers.onModalSearch();
              }
            }} className="pl-9 h-10 border-border focus-visible:ring-primary bg-background" data-api-unique-id="homerecommendzonemanagementview-ra09d6762e2b55557-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" />
            </div>
            <Button onClick={handlers.onModalSearch} disabled={state.modalLoading} className="h-10 px-6" data-api-unique-id="homerecommendzonemanagementview-r3d08c2542f8a1bd8-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
              搜索
            </Button>
          </div>

          <div className="flex-1 overflow-auto px-6 py-2" data-api-unique-id="homerecommendzonemanagementview-rf458047ad5c2022b-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
            {state.modalLoading ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">数据加载中...</div>
            ) : isProductZone ? (
              <ProductZoneCategoryTreeSelect
                categories={state.modalCategories}
                keyword={state.modalKeyword}
                existingIds={existingIdsInDrawer}
                selectedIds={state.modalSelectedItems.map((item) => item.id)}
                onToggle={(item, checked) => handlers.onModalToggleSelect(item as any, checked)}
              />
            ) : selectablePageItems.length === 0 && existingIdsInDrawer.length >= modalPageItems.length && modalPageItems.length > 0 ? (
              <div className="h-64 flex items-center justify-center flex-col gap-2">
                 <AlertCircle className="h-8 w-8 text-muted-foreground/30" data-api-unique-id="homerecommendzonemanagementview-r846eb25335793f7d-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" />
                 <p className="text-sm text-muted-foreground" data-api-unique-id="homerecommendzonemanagementview-r95d47660171edcc6-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">该页数据均已在已选列表中</p>
              </div>
            ) : modalPageItems.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground" data-api-unique-id="homerecommendzonemanagementview-rec3a54162843a35c-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">未检索到相关结果</div>
            ) : (
              <Table className="relative" data-api-unique-id="homerecommendzonemanagementview-rbd2ef0bb2d98ab21-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                <TableHeader className="bg-background sticky top-0 z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.1)]" data-api-unique-id="homerecommendzonemanagementview-r9c5b111037896d3b-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                  <TableRow className="hover:bg-transparent" data-api-unique-id="homerecommendzonemanagementview-r8935ad4dc1d809d7-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                    <TableHead className="w-[50px]" data-api-unique-id="homerecommendzonemanagementview-rfa85972209070b3a-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                      <Checkbox checked={isAllModalSelected} onCheckedChange={checked => handlers.onModalToggleAll(!!checked)} className="data-[state=checked]:bg-primary" data-api-unique-id="homerecommendzonemanagementview-rde988361b63abe05-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" />
                    </TableHead>
                    <TableHead className="w-[80px] text-[11px] uppercase tracking-wider font-header" data-api-unique-id="homerecommendzonemanagementview-r529b175d09b43c69-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">预览图</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider font-header" data-api-unique-id="homerecommendzonemanagementview-r5366e8724dd6e35f-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">基本资料</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider font-header" data-api-unique-id="homerecommendzonemanagementview-r2e5f888017859ed9-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">识别编码</TableHead>
                    <TableHead className="w-[100px] text-right text-[11px] uppercase tracking-wider font-header" data-api-unique-id="homerecommendzonemanagementview-rc2c5795c2a3af322-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody data-api-unique-id="homerecommendzonemanagementview-r054ddef0ed0ade13-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                  {modalPageItems.map((item, index) => {
                const isExisting = existingIdsInDrawer.includes(item.id);
                const isSelected = state.modalSelectedItems.some(si => si.id === item.id);
                const imageUrl = state.drawerFormData.zoneType === 'PRODUCT' ? (item as any).mainImageUrl : (item as any).imageUrl;
                const codeOrLevel = state.drawerFormData.zoneType === 'PRODUCT' ? (item as any).productCode : `LV-${(item as any).level}`;
                const categoryMeta = (item as any).parentName ? `${(item as any).parentName} / ${(item as any).level}级` : `${(item as any).level}级类目`;
                return <TableRow key={item.id} className={isExisting ? 'bg-secondary/10 opacity-60' : ''} data-api-unique-id="homerecommendzonemanagementview-r60a888affb2f947b-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1">
                        <TableCell data-api-unique-id="homerecommendzonemanagementview-r76d3bf5fe31b4d91-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1">
                          <Checkbox checked={isExisting || isSelected} disabled={isExisting} onCheckedChange={checked => handlers.onModalToggleSelect(item as any, !!checked)} className="data-[state=checked]:bg-primary" data-api-unique-id="homerecommendzonemanagementview-r9965be4c3cd49df8-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1" />
                        </TableCell>
                        <TableCell data-api-unique-id="homerecommendzonemanagementview-r783732ea53645e49-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1">
                          <div className="w-12 h-12 rounded border overflow-hidden bg-muted flex items-center justify-center" data-api-unique-id="homerecommendzonemanagementview-r02e4dcac869b5c9a-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1">
                            <EditableImg propKey={`selector-item-${item.id}`} keywords={imageUrl} className="w-full h-full object-cover" data-api-unique-id="homerecommendzonemanagementview-reddcf85ea753d9d5-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1" />
                          </div>
                        </TableCell>
                        <TableCell data-api-unique-id="homerecommendzonemanagementview-r765b1758dc826a24-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1">
                          <div className="flex flex-col gap-0.5" data-api-unique-id="homerecommendzonemanagementview-r83945364e4c28499-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1">
                            <span className="text-sm font-medium line-clamp-1" data-api-unique-id='homerecommendzonemanagementview-r7b6fda2ffe028379-s2152852823' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView' data-api-in-loop='1' data-api-bind-info={`modalPageItems-${index}-name`} data-api-map-var-name='item'>{item.name}</span>
                            <span className="text-[10px] text-muted-foreground uppercase" data-api-unique-id='homerecommendzonemanagementview-rabccb4dbb5bc2ed7-s2152852823' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView' data-api-in-loop='1'>{state.drawerFormData.zoneType === 'PRODUCT' ? (item as any).categoryName || 'ACTIVE PRODUCT' : state.drawerFormData.zoneType === 'SIDE_NAV' ? `侧边导航 · ${categoryMeta}` : categoryMeta}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-secondary-foreground" data-api-unique-id="homerecommendzonemanagementview-r79a66821890408c4-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1">{codeOrLevel}</TableCell>
                        <TableCell className="text-right" data-api-unique-id="homerecommendzonemanagementview-r44b5528bcdb0cbea-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1">
                          {isExisting ? <Badge variant="secondary" className="text-[10px] font-normal py-0" data-api-unique-id="homerecommendzonemanagementview-rb6c0d1c3d4eb1f53-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1">已在专区</Badge> : <Badge variant="outline" className="text-[10px] font-normal py-0 text-accent border-accent/30 bg-accent/5" data-api-unique-id="homerecommendzonemanagementview-rd8249d536ae3955f-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" data-api-in-loop="1">可选</Badge>}
                        </TableCell>
                      </TableRow>;
              })}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="px-6 py-4 border-t bg-secondary/5 flex justify-between items-center" data-api-unique-id="homerecommendzonemanagementview-r4f3f5de59b131432-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
            <div className="flex items-center gap-4" data-api-unique-id="homerecommendzonemanagementview-rcfcbef9f8c2fb25a-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
              {state.modalTotal > 0 && !isProductZone && <div className="flex items-center gap-1.5" data-api-unique-id="homerecommendzonemanagementview-r9b15b66903d9bb31-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                  <Button variant="outline" size="icon" disabled={state.modalPage <= 1} onClick={() => handlers.onModalPageChange(state.modalPage - 1)} className="h-8 w-8 p-0 border-border" data-api-unique-id="homerecommendzonemanagementview-rb90a4faefdf85ed5-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                    <ChevronLeft className="h-4 w-4" data-api-unique-id="homerecommendzonemanagementview-r9d797997a3a0fad5-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" />
                  </Button>
                  <span className="text-sm tabular-nums" data-api-unique-id="homerecommendzonemanagementview-r475e0c6c4d1d79c5-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                    <span className="font-bold text-primary" data-api-unique-id="homerecommendzonemanagementview-r8bfeb197bb4a0933-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">{state.modalPage}</span> / {modalTotalPages}
                  </span>
                  <Button variant="outline" size="icon" disabled={state.modalPage >= modalTotalPages} onClick={() => handlers.onModalPageChange(state.modalPage + 1)} className="h-8 w-8 p-0 border-border" data-api-unique-id="homerecommendzonemanagementview-r8e709585d9c4c7b4-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                    <ChevronRight className="h-4 w-4" data-api-unique-id="homerecommendzonemanagementview-r4bcc67856d854cb1-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView" />
                  </Button>
                </div>}
              <span className="text-xs text-muted-foreground border-l pl-4 border-border" data-api-unique-id="homerecommendzonemanagementview-ref02c60e1264f249-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                已选中 <span className="font-bold text-foreground" data-api-unique-id="homerecommendzonemanagementview-r7d8622620c023920-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">{state.modalSelectedItems.length}</span> 项
              </span>
            </div>
            
            <div className="flex gap-3" data-api-unique-id="homerecommendzonemanagementview-rd869e0a645c0a129-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
              <Button variant="outline" onClick={() => handlers.onCloseSelector(false)} className="h-9 px-6 border-border" data-api-unique-id="homerecommendzonemanagementview-r960c957b19b18ce0-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                取消
              </Button>
              <Button onClick={handlers.onModalConfirm} disabled={state.modalSelectedItems.length === 0} className="h-9 px-6 bg-primary text-primary-foreground hover:bg-primary/90" data-api-unique-id="homerecommendzonemanagementview-r4530e7eb966ea8c0-s2152852823" data-api-unique-page-name="src/backend/components/HomeRecommendZoneManagementView">
                确认添加所选
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};