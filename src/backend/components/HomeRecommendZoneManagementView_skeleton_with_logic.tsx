'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { HomeRecommendZoneManagement } from '@/backend/route-params';
import { getRecommendZoneList, getRecommendZoneDetail, createRecommendZone, updateRecommendZone, deleteRecommendZone, updateRecommendZoneStatus, batchUpdateZoneSortWeight, getSelectableProducts, getSelectableCategories } from '@/backend/actions/HomeRecommendZoneManagement';
import type { RecommendZoneItem, ZoneType, EntityStatus, RecommendZoneDetail, ZoneDetailContentItem, SelectableProductItem, SelectableCategoryItem } from '@/backend/actions/HomeRecommendZoneManagement';
import { toast } from 'sonner';

// shadcn UI placeholder imports (assuming standard exports)
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

// ===== 枚举映射 =====
const ZONE_TYPE_LABELS: Record<ZoneType, string> = {
  PRODUCT: '商品专区',
  CATEGORY: '类目专区'
};

// ============================================================================
// 子组件: 删除确认弹窗
// ============================================================================
interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading: boolean;
}
function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  loading
}: DeleteConfirmDialogProps) {
  return <Dialog open={open} onOpenChange={onOpenChange} data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r38e84e97f849178f-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
      <DialogContent data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r2779979fa170b8aa-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
        <DialogHeader data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r62118b8a92cd8cdd-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
          <DialogTitle data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r8d66f0f485e1d0c5-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>删除确认</DialogTitle>
          <DialogDescription data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r4b4b205cfb6fdaf9-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
            确定要删除该推荐专区吗？删除后首页对应的展示区块将被移除，此操作不可恢复。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r4b2f5d21a7f9a642-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading} data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r106ab33060dbf8b0-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
            取消
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading} data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r47ca146cd0662b2c-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
            确认删除
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
}

// ============================================================================
// 子组件: 商品/类目选择器弹窗
// ============================================================================
interface ItemSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: ZoneType;
  existingIds: string[];
  onConfirm: (items: ZoneDetailContentItem[]) => void;
}
function ItemSelectionModal({
  open,
  onOpenChange,
  type,
  existingIds,
  onConfirm
}: ItemSelectionModalProps) {
  const [keyword, setKeyword] = useState('');
  const [searchTrigger, setSearchTrigger] = useState(0); // 用于触发请求
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [products, setProducts] = useState<SelectableProductItem[]>([]);
  const [categories, setCategories] = useState<SelectableCategoryItem[]>([]);

  // 仅供商品选择时使用的类目过滤
  const [categoryIdFilter, setCategoryIdFilter] = useState<string>('all');
  const [filterCategories, setFilterCategories] = useState<SelectableCategoryItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<ZoneDetailContentItem[]>([]);
  const isComposingRef = useRef(false);

  // 拉取过滤用的类目树(扁平)
  const fetchFilterCategories = useCallback(async () => {
    if (type !== 'PRODUCT') return;
    try {
      const data = await getSelectableCategories({
        page: 1,
        pageSize: 100
      });
      setFilterCategories(data.list);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '获取类目失败');
    }
  }, [type]);
  useEffect(() => {
    if (open && type === 'PRODUCT') {
      fetchFilterCategories();
    }
  }, [open, type, fetchFilterCategories]);

  // 拉取主列表数据
  const fetchData = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      if (type === 'PRODUCT') {
        const data = await getSelectableProducts({
          keyword,
          categoryId: categoryIdFilter === 'all' ? undefined : categoryIdFilter,
          page,
          pageSize
        });
        setProducts(data.list);
        setTotal(data.total);
      } else {
        const data = await getSelectableCategories({
          keyword,
          page,
          pageSize
        });
        setCategories(data.list);
        setTotal(data.total);
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '获取数据失败');
    } finally {
      setLoading(false);
    }
  }, [open, type, keyword, categoryIdFilter, page, pageSize, searchTrigger]);
  useEffect(() => {
    if (open) {
      fetchData();
    } else {
      // 关闭时清理
      setKeyword('');
      setPage(1);
      setProducts([]);
      setCategories([]);
      setSelectedItems([]);
      setCategoryIdFilter('all');
    }
  }, [open, page, categoryIdFilter, searchTrigger, type]); // 故意不将 keyword 作为依赖，靠 trigger 触发

  const handleSearch = () => {
    setPage(1);
    setSearchTrigger(prev => prev + 1);
  };
  const handleToggleSelect = (item: SelectableProductItem | SelectableCategoryItem, checked: boolean) => {
    if (checked) {
      // 组装成 ZoneDetailContentItem
      let newItem: ZoneDetailContentItem;
      if (type === 'PRODUCT') {
        const p = item as SelectableProductItem;
        newItem = {
          id: p.id,
          entityId: p.id,
          name: p.name,
          codeOrSku: p.productCode,
          imageUrl: p.mainImageUrl,
          status: 'ACTIVE',
          sortWeight: 0
        };
      } else {
        const c = item as SelectableCategoryItem;
        newItem = {
          id: c.id,
          entityId: c.id,
          name: c.name,
          codeOrSku: '-',
          // 类目没有直观编码，展示占位
          imageUrl: c.imageUrl,
          status: 'ACTIVE',
          sortWeight: 0
        };
      }
      setSelectedItems(prev => [...prev, newItem]);
    } else {
      setSelectedItems(prev => prev.filter(i => i.id !== item.id));
    }
  };
  const handleToggleAll = (checked: boolean) => {
    if (type === 'PRODUCT') {
      const pageValidItems = products.filter(p => !existingIds.includes(p.id));
      if (checked) {
        const toAdd = pageValidItems.filter(p => !selectedItems.some(si => si.id === p.id)).map((p, index) => ({
          id: p.id,
          entityId: p.id,
          name: p.name,
          codeOrSku: p.productCode,
          imageUrl: p.mainImageUrl,
          status: 'ACTIVE',
          sortWeight: 0
        }));
        setSelectedItems(prev => [...prev, ...toAdd]);
      } else {
        const pageIds = pageValidItems.map((p, index) => p.id);
        setSelectedItems(prev => prev.filter(i => !pageIds.includes(i.id)));
      }
    } else {
      const pageValidItems = categories.filter(c => !existingIds.includes(c.id));
      if (checked) {
        const toAdd = pageValidItems.filter(c => !selectedItems.some(si => si.id === c.id)).map((c, index) => ({
          id: c.id,
          entityId: c.id,
          name: c.name,
          codeOrSku: '-',
          imageUrl: c.imageUrl,
          status: 'ACTIVE',
          sortWeight: 0
        }));
        setSelectedItems(prev => [...prev, ...toAdd]);
      } else {
        const pageIds = pageValidItems.map((c, index) => c.id);
        setSelectedItems(prev => prev.filter(i => !pageIds.includes(i.id)));
      }
    }
  };
  const handleConfirm = () => {
    onConfirm(selectedItems);
    onOpenChange(false);
  };

  // 计算当前页全选状态
  const pageItems = type === 'PRODUCT' ? products : categories;
  const selectablePageItems = pageItems.filter(item => !existingIds.includes(item.id));
  const isAllSelected = selectablePageItems.length > 0 && selectablePageItems.every(item => selectedItems.some(si => si.id === item.id));
  const totalPages = Math.ceil(total / pageSize);
  return <Dialog open={open} onOpenChange={onOpenChange} data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r46360c0b68137874-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
      <DialogContent data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r02bc2e1d34eb7064-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
        <DialogHeader data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r582424a1491ff130-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
          <DialogTitle data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r0e584dea9bb71b15-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>{type === 'PRODUCT' ? '选择推荐商品' : '选择推荐类目'}</DialogTitle>
        </DialogHeader>

        {/* 顶部搜索条 */}
        <div data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-rcd5437b0e70d953b-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
          <div data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r92029e8c4e82d8c6-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
            <Input placeholder="关键字搜索" value={keyword} onChange={e => setKeyword(e.target.value)} onCompositionStart={() => isComposingRef.current = true} onCompositionEnd={() => {
            isComposingRef.current = false;
          }} onKeyDown={e => {
            if (e.key === 'Enter' && !isComposingRef.current) {
              handleSearch();
            }
          }} data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-rdf37c7596ac1de9e-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' />
            <Button onClick={handleSearch} disabled={loading} data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r21158226a192dcc3-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>搜索</Button>
          </div>
          {type === 'PRODUCT' && <div data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r538b31882bd49850-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
              <Select value={categoryIdFilter} onValueChange={val => {
            setCategoryIdFilter(val);
            setPage(1);
          }} data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r07c2ef1db7413924-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
                <SelectTrigger data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r2dbfc13d9bfefc68-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
                  <SelectValue placeholder="全部分类" data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r3f2ac09cf3c20298-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' />
                </SelectTrigger>
                <SelectContent data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r030985ee1fdfb30c-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
                  <SelectItem value="all" data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r56cc5a81117474bf-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>全部分类</SelectItem>
                  {filterCategories.map((c, index) => <SelectItem key={c.id} value={c.id} data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r5df1c9ae019b8c2a-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`filterCategories-${index}-name`} data-api-map-var-name='c'>
                      {c.parentName ? `${c.parentName} - ` : ''}{c.name}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>}
        </div>

        {/* 数据网格 */}
        <div data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-rf54aeff8dd94dde9-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
          {loading ? <p data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r890d3bb32ed984ef-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>数据加载中...</p> : selectablePageItems.length === 0 && existingIds.length >= pageItems.length ? <p data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r952c2aff729f4fac-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>暂无可选数据或均已添加</p> : <Table data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r23cee6acd2e1373c-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
              <TableHeader data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r2b5dc5d51080043b-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
                <TableRow data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r6fbd3efef73978b6-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
                  <TableHead data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r2777ca33ec989f08-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
                    <Checkbox checked={isAllSelected} onCheckedChange={checked => handleToggleAll(!!checked)} data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r48c066f7d553e1cc-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' />
                  </TableHead>
                  <TableHead data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r64b0b653a41842f6-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>缩略图</TableHead>
                  <TableHead data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r78e395697dbeaae5-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>名称</TableHead>
                  <TableHead data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r1b5eb5a41457a0fa-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>{type === 'PRODUCT' ? '编码' : '层级'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-rec715be2604941eb-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
                {pageItems.map((item, index) => {
              const isExisting = existingIds.includes(item.id);
              const isSelected = selectedItems.some(si => si.id === item.id);
              const imageUrl = type === 'PRODUCT' ? (item as SelectableProductItem).mainImageUrl : (item as SelectableCategoryItem).imageUrl;
              const codeOrLevel = type === 'PRODUCT' ? (item as SelectableProductItem).productCode : `层级 ${(item as SelectableCategoryItem).level}`;
              return <TableRow key={item.id} data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-re447db12b08ba6eb-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' data-api-in-loop='1'>
                      <TableCell data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-rfa07ff781bd4c25c-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' data-api-in-loop='1'>
                        <Checkbox checked={isExisting || isSelected} disabled={isExisting} onCheckedChange={checked => handleToggleSelect(item, !!checked)} data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r276789cd6c6f13c7-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' data-api-in-loop='1' />
                      </TableCell>
                      <TableCell data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r73b62e549e6b64ee-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' data-api-in-loop='1'>
                        {imageUrl ? <img src={imageUrl} alt={item.name} data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r997a2e35e6111dcc-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' data-api-in-loop='1' /> : <span data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-rac6cb6397373d0cc-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' data-api-in-loop='1'>暂无图片</span>}
                      </TableCell>
                      <TableCell data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-ra4a4b0c467fdaa17-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`pageItems-${index}-name`} data-api-map-var-name='item'>{item.name}</TableCell>
                      <TableCell data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r3d0d47f2f035fd07-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' data-api-in-loop='1'>{codeOrLevel}</TableCell>
                    </TableRow>;
            })}
              </TableBody>
            </Table>}
        </div>

        {/* 分页 */}
        {total > 0 && <div data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r40f8954f4bbe3530-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
            <Button disabled={page <= 1} onClick={() => setPage(p => p - 1)} data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-rcaf228043b91c181-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>上一页</Button>
            <span data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r5dfb0d9b2078ad97-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>{page} / {totalPages}</span>
            <Button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r4deddcbc9d509c97-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>下一页</Button>
          </div>}

        <DialogFooter data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r299729b0749080bb-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
          <div data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r301b85a16a7f8181-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
            <span data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r67ef4801ac161e72-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>已选择 {selectedItems.length} 项</span>
            <Button variant="outline" onClick={() => onOpenChange(false)} data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-rc6c516edef3b9879-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>取消</Button>
            <Button onClick={handleConfirm} disabled={selectedItems.length === 0} data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r00e6cbaaff513620-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>确认添加</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
}

// ============================================================================
// 子组件: 抽屉 - 专区配置面板
// ============================================================================
interface ZoneConfigurationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingId: string | null;
  onSaved: () => void;
}
type FormFields = {
  title: string;
  zoneType: ZoneType;
  pcCols: number;
  mobileCols: number;
  sortWeight: number;
  isActive: boolean;
  collectionName: string;
};
function ZoneConfigurationDrawer({
  open,
  onOpenChange,
  editingId,
  onSaved
}: ZoneConfigurationDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormFields>({
    title: '',
    zoneType: 'PRODUCT',
    pcCols: 4,
    mobileCols: 2,
    sortWeight: 0,
    isActive: true,
    collectionName: ''
  });
  const [items, setItems] = useState<ZoneDetailContentItem[]>([]);
  const [selectorOpen, setSelectorOpen] = useState(false);

  // H5 拖拽 state
  const dragItemIndex = useRef<number | null>(null);
  const dragOverItemIndex = useRef<number | null>(null);
  const handleFormFieldChange = <K extends keyof FormFields,>(field: K, value: FormFields[K]) => {
    // 切换类型时清空明细和集合名
    if (field === 'zoneType' && value !== formData.zoneType) {
      setItems([]);
      setFormData(prev => ({
        ...prev,
        [field]: value,
        collectionName: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // 加载详情
  const fetchDetail = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const data = await getRecommendZoneDetail(id);
      setFormData({
        title: data.title,
        zoneType: data.zoneType,
        pcCols: data.pcCols,
        mobileCols: data.mobileCols,
        sortWeight: data.sortWeight,
        isActive: data.isActive,
        collectionName: data.collectionName
      });
      setItems(data.items);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '获取详情失败');
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }, [onOpenChange]);
  useEffect(() => {
    if (open) {
      if (editingId) {
        fetchDetail(editingId);
      } else {
        // 重置
        setFormData({
          title: '',
          zoneType: 'PRODUCT',
          pcCols: 4,
          mobileCols: 2,
          sortWeight: 0,
          isActive: true,
          collectionName: ''
        });
        setItems([]);
      }
    }
  }, [open, editingId, fetchDetail]);

  // 明细拖拽排序
  const handleDragStart = (index: number) => {
    dragItemIndex.current = index;
  };
  const handleDragEnter = (index: number) => {
    dragOverItemIndex.current = index;
  };
  const handleDragEnd = () => {
    if (dragItemIndex.current !== null && dragOverItemIndex.current !== null) {
      const newItems = [...items];
      const draggedItem = newItems.splice(dragItemIndex.current, 1)[0];
      newItems.splice(dragOverItemIndex.current, 0, draggedItem);
      setItems(newItems);
    }
    dragItemIndex.current = null;
    dragOverItemIndex.current = null;
  };
  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };
  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('专区标题不能为空');
      return;
    }
    setSaving(true);
    try {
      // 构造成 Action 期待的 input
      // 根据界面上展现的顺序重新赋予 sortWeight，让第一个元素的权重最大
      const baseSortWeight = items.length * 10;
      const formattedItems = items.map((item, index) => ({
        entityId: item.entityId,
        sortWeight: baseSortWeight - index * 10
      }));
      if (editingId) {
        await updateRecommendZone({
          id: editingId,
          title: formData.title,
          zoneType: formData.zoneType,
          pcCols: formData.pcCols,
          mobileCols: formData.mobileCols,
          sortWeight: formData.sortWeight,
          isActive: formData.isActive,
          collectionName: formData.collectionName,
          items: formattedItems
        });
        toast.success('编辑成功');
      } else {
        await createRecommendZone({
          title: formData.title,
          zoneType: formData.zoneType,
          pcCols: formData.pcCols,
          mobileCols: formData.mobileCols,
          sortWeight: formData.sortWeight,
          isActive: formData.isActive,
          collectionName: formData.collectionName,
          items: formattedItems
        });
        toast.success('新增成功');
      }
      onSaved();
      onOpenChange(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };
  return <>
      <Sheet open={open} onOpenChange={onOpenChange} data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r59c8057e12e936b7-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
        <SheetContent data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r0e28b5f9e8f53769-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
          <SheetHeader data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r8837914b1604b2f3-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
            <SheetTitle data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-rb588f8e1313bd4db-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>{editingId ? '编辑推荐专区' : '新增推荐专区'}</SheetTitle>
          </SheetHeader>
          
          {loading ? <p data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r83ae93ffd5ff7c2a-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>加载中...</p> : <div data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r96a5a1ca9cb24b0f-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
              {/* 基础设置区 */}
              <div data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r834c0202dd414def-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
                <div data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r2e0b7f97fd424313-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
                  <Label data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r07372698cfe232a3-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>专区标题</Label>
                  <Input value={formData.title} onChange={e => handleFormFieldChange('title', e.target.value)} placeholder="输入专区标题" data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-ra3590e1f1735d643-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' />
                </div>
                <div data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-rb89579e3ff242922-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
                  <Label data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-rf52d2118d7e1e4af-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>展示类型</Label>
                  <RadioGroup value={formData.zoneType} onValueChange={val => handleFormFieldChange('zoneType', val as ZoneType)} data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r9823f785c0c7549f-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
                    <div data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r8c46a8c6eeefdab2-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
                      <RadioGroupItem value="PRODUCT" id="t-prod" data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r56b1a8f811f885a0-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' />
                      <Label htmlFor="t-prod" data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-rc1e5483714cf6808-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>商品</Label>
                    </div>
                    <div data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-rc6b2f24a4d8d30d8-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
                      <RadioGroupItem value="CATEGORY" id="t-cat" data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r6a102dbb5dbb5aa6-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' />
                      <Label htmlFor="t-cat" data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r28e3d64d1d8fa31b-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>类目</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r01392d090fffa025-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
                  <Label data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r08758d61bf416a44-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>PC端列数</Label>
                  <Input type="number" value={formData.pcCols} onChange={e => handleFormFieldChange('pcCols', Number(e.target.value))} data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-re9bd7fd98fad0d50-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' />
                </div>
                <div data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r9a2d7a46e2bd75b9-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
                  <Label data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r9ec32015a0996e06-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>手机端列数</Label>
                  <Input type="number" value={formData.mobileCols} onChange={e => handleFormFieldChange('mobileCols', Number(e.target.value))} data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r5919487f0b1dce43-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' />
                </div>
                <div data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r34dd8f326b9a9622-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
                  <Label data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r8e5331e68fee6412-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>排序权重 (数值越大越靠前)</Label>
                  <Input type="number" value={formData.sortWeight} onChange={e => handleFormFieldChange('sortWeight', Number(e.target.value))} data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r98ac270c68b3f65e-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' />
                </div>
                <div data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-rf90c34edb6e52f88-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
                  <Label data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-rce41f79330df85a5-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>状态</Label>
                  <Switch checked={formData.isActive} onCheckedChange={val => handleFormFieldChange('isActive', val)} data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r51eb9a079d690b6a-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' />
                </div>
              </div>

              {/* 集合绑定区 - 仅 PRODUCT 显示 */}
              {formData.zoneType === 'PRODUCT' && <div data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r44faa79328726f55-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
                  <Label data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r409bdfef5c0c35db-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>集合名称</Label>
                  <Input value={formData.collectionName} onChange={e => handleFormFieldChange('collectionName', e.target.value)} placeholder="选填，保存时将创建集合" data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r56dc33c505d42e66-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' />
                  <p data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r5f17f41fdf679000-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>填写名称后，保存时将自动创建永久商品集合并绑定；留空则仅作为首页临时自定义列表。</p>
                </div>}

              {/* 明细管理区 */}
              <div data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r26c3a22c338a1d59-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
                <div data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-rd60ef6d91704669a-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
                  <Label data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r75921bbf201eff75-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>内容明细 ({items.length})</Label>
                  <Button onClick={() => setSelectorOpen(true)} data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r922fbc4272ab2bb6-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
                    + {formData.zoneType === 'PRODUCT' ? '选择商品' : '选择类目'}
                  </Button>
                </div>

                {items.length === 0 ? <p data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r90880c37b1cd1fe2-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>暂无内容，请点击添加</p> : <Table data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r65fa42aa0ab62f27-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
                    <TableHeader data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-rc0ab16d387cfa169-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
                      <TableRow data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-rd270f615817ff8d7-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
                        <TableHead data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-re899b8743a3d4039-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>图片</TableHead>
                        <TableHead data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r8ad0afccedbd9c3a-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>名称</TableHead>
                        <TableHead data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-rbf056532d3b65294-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>信息</TableHead>
                        <TableHead data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r6a54ff36033fb8e6-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r5004b4f09ffb0165-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
                      {items.map((item, index) => <TableRow key={`${item.entityId}-${index}`} draggable onDragStart={() => handleDragStart(index)} onDragEnter={() => handleDragEnter(index)} onDragEnd={handleDragEnd} onDragOver={e => e.preventDefault()} data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r7ad416ff0a85e2bb-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' data-api-in-loop='1'>
                          <TableCell data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r57a5083fcc8f6d99-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' data-api-in-loop='1'>
                            {item.imageUrl ? <img src={item.imageUrl} alt={item.name} data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-rddcadcf1253a7a2b-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' data-api-in-loop='1' /> : '无图'}
                          </TableCell>
                          <TableCell data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r60bcf6b9e81558a6-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`items-${index}-name`} data-api-map-var-name='item'>{item.name}</TableCell>
                          <TableCell data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r3392f5215ad46050-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`items-${index}-codeOrSku`} data-api-map-var-name='item'>{item.codeOrSku}</TableCell>
                          <TableCell data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r4b81d1a906948419-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' data-api-in-loop='1'>
                            <Button variant="ghost" onClick={() => handleRemoveItem(index)} data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r47a8bc8d338b73d8-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' data-api-in-loop='1'>移除</Button>
                          </TableCell>
                        </TableRow>)}
                    </TableBody>
                  </Table>}
              </div>
            </div>}

          <SheetFooter data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r42c059c3bdaef63d-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving} data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r140614f21cac3e14-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>取消</Button>
            <Button onClick={handleSave} disabled={saving || loading} data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r0797a8851c4bfd20-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>保存配置</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* 选择器弹窗 */}
      <ItemSelectionModal open={selectorOpen} onOpenChange={setSelectorOpen} type={formData.zoneType} existingIds={items.map((i, index) => i.entityId)} onConfirm={newItems => setItems(prev => [...prev, ...newItems])} data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-rbc3b6ec6f9255728-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' />
    </>;
}

// ============================================================================
// 主页面组件
// ============================================================================
export default function HomeRecommendZoneManagementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // 按照约束要求获取页面参数
  const _params = useMemo(() => HomeRecommendZoneManagement.getParams(searchParams), [searchParams]);
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<RecommendZoneItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Drawer 状态
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Delete Dialog 状态
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // H5 拖拽 state (主列表)
  const dragItemIndex = useRef<number | null>(null);
  const dragOverItemIndex = useRef<number | null>(null);
  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRecommendZoneList({
        page,
        pageSize
      });
      setList(data.list);
      setTotal(data.total);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '获取列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);
  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // 主列表行拖拽逻辑
  const handleDragStart = (index: number) => {
    dragItemIndex.current = index;
  };
  const handleDragEnter = (index: number) => {
    dragOverItemIndex.current = index;
  };
  const handleDragEnd = async () => {
    if (dragItemIndex.current !== null && dragOverItemIndex.current !== null && dragItemIndex.current !== dragOverItemIndex.current) {
      const newList = [...list];
      const draggedItem = newList.splice(dragItemIndex.current, 1)[0];
      newList.splice(dragOverItemIndex.current, 0, draggedItem);

      // 更新本地状态以平滑过渡
      setList(newList);

      // 提取本页原有的排序权重集合并降序排列，然后重新赋给新列表
      const oldWeights = list.map((i, index) => i.sortWeight).sort((a, b) => b - a);
      const updates = newList.map((item, index) => ({
        id: item.id,
        sortWeight: oldWeights[index]
      }));
      try {
        await batchUpdateZoneSortWeight({
          updates
        });
        toast.success('排序保存成功');
        fetchList(); // 刷新拉取最新数据保证一致性
      } catch (e: unknown) {
        toast.error('排序保存失败');
        fetchList(); // 失败则回滚
      }
    }
    dragItemIndex.current = null;
    dragOverItemIndex.current = null;
  };

  // 状态启停快捷切换
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateRecommendZoneStatus(id, !currentStatus);
      toast.success('状态已更新');
      fetchList();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '更新状态失败');
    }
  };

  // 权重内联失焦修改
  const handleWeightBlur = async (id: string, newWeight: number) => {
    try {
      await batchUpdateZoneSortWeight({
        updates: [{
          id,
          sortWeight: newWeight
        }]
      });
      toast.success('权重更新成功');
      fetchList();
    } catch (e: unknown) {
      toast.error('权重更新失败');
    }
  };

  // 打开抽屉
  const handleOpenDrawer = (id: string | null = null, isCopy: boolean = false) => {
    setEditingId(isCopy ? null : id);
    // 如果是复制，我们需要将原数据带出并作为新增。可以通过传入原ID并在Drawer内特别处理，
    // 但鉴于目前实现限制，更稳妥是增加 copyId prop。由于要求单文件且简化状态，
    // 将其视为普通创建并手动在组件外拉取然后传进去比较复杂。
    // 这里简单实现：仅满足基本的编辑和新增。如要实现复制，最好由后端提供 clone 接口或在 Drawer 内基于传入ID拉取并清除自己的ID。
    // 为了满足“可新增、编辑、复制、排序和删除”需求，如果是复制，我们直接弹窗但告诉它是编辑，只是不传 editingId 而由别的方式注水数据。
    // 方案调整：本例不支持完整的深度复制表单联动，只在列表直接展示基础操作。
    // 在此处补全复制的粗糙替代：通过后端 Action `getRecommendZoneDetail` 拉取后去ID作为 `CreateRecommendZoneInput` 保存。
    if (isCopy && id) {
      const performCopy = async () => {
        try {
          const detail = await getRecommendZoneDetail(id);
          await createRecommendZone({
            title: `${detail.title} (副本)`,
            zoneType: detail.zoneType,
            pcCols: detail.pcCols,
            mobileCols: detail.mobileCols,
            sortWeight: detail.sortWeight,
            isActive: detail.isActive,
            // 不复制集合名避免外键/唯一约束冲突
            items: detail.items.map((i, index) => ({
              entityId: i.entityId,
              sortWeight: i.sortWeight
            }))
          });
          toast.success('复制成功');
          fetchList();
        } catch (e: unknown) {
          toast.error('复制失败');
        }
      };
      performCopy();
      return;
    }
    setDrawerOpen(true);
  };

  // 执行删除
  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);
    try {
      await deleteRecommendZone(deletingId);
      toast.success('删除成功');
      setDeleteOpen(false);
      fetchList();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '删除失败');
    } finally {
      setDeleteLoading(false);
    }
  };
  const totalPages = Math.ceil(total / pageSize);
  return <div data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r53f5240e8e3ddb46-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
      {/* 顶栏控制区 */}
      <div data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-rdc6bcf2b14b0cbcc-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
        <h2 data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-rcd26869c6659c969-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>首页推荐专区管理</h2>
        <Button onClick={() => handleOpenDrawer(null)} data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-re8a0722feae25272-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>新增专区</Button>
      </div>

      {/* 核心数据网格 */}
      <div data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r7ec8b0e2708c2acc-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
        {loading && list.length === 0 ? <p data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r7771ac39f7ab1ff8-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>列表加载中...</p> : list.length === 0 ? <p data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-rfc22f1d3a76d5160-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>暂无数据</p> : <Table data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-rc200d03fdbe6f91d-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
            <TableHeader data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-rcfe0db717df16d17-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
              <TableRow data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-rdb7a08fb81392422-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
                <TableHead data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r7ddfdc7000077258-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'></TableHead>
                <TableHead data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-rd1d82d17f88cb00f-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>专区标题</TableHead>
                <TableHead data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-rb11255fac36a0d74-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>展示类型</TableHead>
                <TableHead data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r55a99046e2897ef6-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>终端布局</TableHead>
                <TableHead data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r88c761176d59512a-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>数据绑定</TableHead>
                <TableHead data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-re85c5b84ac356800-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>权重</TableHead>
                <TableHead data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r737dcd7a4f4cc1eb-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>状态</TableHead>
                <TableHead data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-rd4c1de26848591a7-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-ra5562007a5df6396-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
              {list.map((row, index) => <TableRow key={row.id} draggable onDragStart={() => handleDragStart(index)} onDragEnter={() => handleDragEnter(index)} onDragEnd={handleDragEnd} onDragOver={e => e.preventDefault()} data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-rb1e0b4e18d976475-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' data-api-in-loop='1'>
                  <TableCell data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r1a390d54b1fee730-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' data-api-in-loop='1'>
                    <span style={{
                cursor: 'move'
              }} data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r9ac6b20b9cd91952-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' data-api-in-loop='1'>☰</span>
                  </TableCell>
                  <TableCell data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-rbd04a68afcc01f8e-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`list-${index}-title`} data-api-map-var-name='row'>{row.title}</TableCell>
                  <TableCell data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r165926d8a189fe07-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' data-api-in-loop='1'>{ZONE_TYPE_LABELS[row.zoneType]}</TableCell>
                  <TableCell data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-rda3538f88ba7fa0b-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`list-${index}-pcCols`} data-api-map-var-name='row'>
                    PC: {row.pcCols}列 | 移动: {row.mobileCols}列
                  </TableCell>
                  <TableCell data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-re4df0a4c8bd92d81-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' data-api-in-loop='1'>
                    {row.isBoundCollection ? '永久集合' : '自定义列表'}
                  </TableCell>
                  <TableCell data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-rd968a8d0851105f5-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' data-api-in-loop='1'>
                    <Input type="number" defaultValue={row.sortWeight} onBlur={e => handleWeightBlur(row.id, Number(e.target.value))} data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r6bb8079854ab5be2-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' data-api-in-loop='1' />
                  </TableCell>
                  <TableCell data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r1bf1ad6fae69bd7b-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' data-api-in-loop='1'>
                    <Switch checked={row.isActive} onCheckedChange={() => handleToggleStatus(row.id, row.isActive)} data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-re969487c7c0638fa-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' data-api-in-loop='1' />
                  </TableCell>
                  <TableCell data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r8931115141251158-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' data-api-in-loop='1'>
                    <Button variant="ghost" onClick={() => handleOpenDrawer(row.id)} data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r8ea5fb6c8973cd47-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' data-api-in-loop='1'>编辑</Button>
                    <Button variant="ghost" onClick={() => handleOpenDrawer(row.id, true)} data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r8ad390827f16f584-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' data-api-in-loop='1'>复制</Button>
                    <Button variant="destructive" onClick={() => {
                setDeletingId(row.id);
                setDeleteOpen(true);
              }} data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-rd11506b2d32fa101-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' data-api-in-loop='1'>删除</Button>
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>}
      </div>

      {/* 列表分页器 */}
      {total > 0 && <div data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r2ea873995ee27ffb-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>
          <Button disabled={page <= 1} onClick={() => setPage(p => p - 1)} data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r2e945d96be9e4f11-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>上一页</Button>
          <span data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r2ed17a0addb407e1-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>第 {page} 页 / 共 {totalPages} 页 (总 {total} 条)</span>
          <Button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r1b564c39d28fc46f-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic'>下一页</Button>
        </div>}

      {/* 弹窗与抽屉 */}
      <ZoneConfigurationDrawer open={drawerOpen} onOpenChange={setDrawerOpen} editingId={editingId} onSaved={fetchList} data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r70d399ba4d58775d-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' />

      <DeleteConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={handleConfirmDelete} loading={deleteLoading} data-api-unique-id='homerecommendzonemanagementview-skeleton-with-logic-r8a5d576f319e2a4b-s3397686706' data-api-unique-page-name='src/backend/components/HomeRecommendZoneManagementView_skeleton_with_logic' />
    </div>;
}