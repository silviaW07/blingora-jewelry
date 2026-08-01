'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProductManagement } from '@/backend/route-params';
import type { ProductStatus, ProductSource, StockStatus, ProductListItem, CategoryOption, CreateProductInput, SkuItem, GalleryItem, DetailContentItem, ParameterGroup, FaqItem, TradeInfo, SkuAttribute } from '@/backend/actions/ProductManagement';
import { getProductList, getCategoryOptions, getProductDetail, createProduct, updateProduct, updateProductStatus, batchUpdateProductStatus, deleteProduct, batchDeleteProduct } from '@/backend/actions/ProductManagement';
import { toast } from "sonner";
import { Button, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Checkbox, Sheet, SheetContent, SheetHeader, SheetTitle, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, Textarea } from '@/backend/components/ui';

// ===== 枚举映射 =====
const STATUS_LABELS: Record<ProductStatus, string> = {
  DRAFT: '草稿',
  ACTIVE: '已上架',
  INACTIVE: '已下架'
};
const SOURCE_LABELS: Record<ProductSource, string> = {
  MANUAL: '手动创建',
  IMPORT_1688: '1688导入'
};
const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  IN_STOCK: '有货',
  LOW_STOCK: '库存不足',
  OUT_OF_STOCK: '缺货'
};

// ===== 辅助类型 =====
type DrawerMode = 'create' | 'edit';
type BatchActionType = 'ACTIVE' | 'INACTIVE' | 'DELETE' | null;
interface SpecDimension {
  name: string;
  values: string; // 逗号分隔的字符串，便于用户快速录入
}

// ===== 默认空表单结构 =====
const defaultFormData: CreateProductInput = {
  name: '',
  category_id: '',
  main_image_url: '',
  short_description: '',
  gallery_json: [],
  detail_content_json: [],
  parameter_json: [{
    group: '基本参数',
    items: []
  }],
  trade_info_json: {
    shipFrom: '',
    deliveryDays: 0,
    minOrderQty: 1,
    supportedRegions: [],
    shippingNote: '',
    tradeNotice: ''
  },
  faq_json: [],
  skus: [],
  submit_action: 'DRAFT'
};
export default function ProductManagementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useMemo(() => ProductManagement.getParams(searchParams), [searchParams]);

  // ===== Filter State =====
  const [filterKeyword, setFilterKeyword] = useState(params.name || '');
  const [filterCategoryId, setFilterCategoryId] = useState(params.categoryId || 'ALL');
  const [filterStatus, setFilterStatus] = useState(params.status || 'ALL');

  // ===== Data State =====
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<ProductListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // ===== Drawer State =====
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('create');
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentEditId, setCurrentEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateProductInput>(defaultFormData);

  // SKU 维度构建器临时状态
  const [specDimensions, setSpecDimensions] = useState<SpecDimension[]>([]);

  // ===== Confirm Dialog State =====
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<BatchActionType>(null);
  const [confirmTargetIds, setConfirmTargetIds] = useState<string[]>([]);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // ===== Effects =====
  useEffect(() => {
    fetchCategoryOptions();
  }, []);
  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getProductList({
        keyword: params.name || undefined,
        category_id: params.categoryId || undefined,
        status: params.status ? params.status as ProductStatus : undefined,
        page: currentPage,
        page_size: pageSize
      });
      setList(result.list);
      setTotal(result.total);
      setSelectedIds([]);
    } catch (err: any) {
      toast.error(err.message || '获取商品列表失败');
    } finally {
      setLoading(false);
    }
  }, [params.name, params.categoryId, params.status, currentPage]);
  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // ===== Methods: Fetch =====
  const fetchCategoryOptions = async () => {
    try {
      const data = await getCategoryOptions();
      setCategoryOptions(data);
    } catch (err: any) {
      toast.error(err.message || '获取分类选项失败');
    }
  };

  // ===== Handlers: Top Toolbar =====
  const handleSearch = () => {
    setCurrentPage(1);
    ProductManagement.navigateToWithFilters(router, {
      name: filterKeyword,
      categoryId: filterCategoryId === 'ALL' ? '' : filterCategoryId,
      status: filterStatus === 'ALL' ? '' : filterStatus
    });
  };
  const handleReset = () => {
    setFilterKeyword('');
    setFilterCategoryId('ALL');
    setFilterStatus('ALL');
    setCurrentPage(1);
    ProductManagement.navigateToAll(router);
  };

  // ===== Handlers: Selection =====
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(list.map((item, index) => item.product_id));
    } else {
      setSelectedIds([]);
    }
  };
  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  // ===== Handlers: Drawer form =====
  const handleOpenCreate = () => {
    setDrawerMode('create');
    setCurrentEditId(null);
    setFormData(defaultFormData);
    setSpecDimensions([]);
    setDrawerOpen(true);
  };
  const handleOpenEdit = async (id: string) => {
    setDrawerMode('edit');
    setCurrentEditId(id);
    setDrawerLoading(true);
    setDrawerOpen(true);
    setSpecDimensions([]);
    try {
      const detail = await getProductDetail(id);
      setFormData({
        name: detail.name,
        category_id: detail.category_id,
        main_image_url: detail.main_image_url,
        short_description: detail.short_description || '',
        gallery_json: detail.gallery_json || [],
        detail_content_json: detail.detail_content_json || [],
        parameter_json: detail.parameter_json || [{
          group: '基本参数',
          items: []
        }],
        trade_info_json: detail.trade_info_json || defaultFormData.trade_info_json,
        faq_json: detail.faq_json || [],
        skus: detail.skus.map((sku, index) => ({
          sku_id: sku.sku_id,
          sku_code: sku.sku_code,
          image_url: sku.image_url || '',
          price: sku.price,
          original_price: sku.original_price || null,
          stock: sku.stock,
          attribute_json: sku.attribute_json || [],
          delivery_days: sku.delivery_days || null,
          weight_kg: sku.weight_kg || null,
          volume_m3: sku.volume_m3 || null
        })),
        submit_action: 'DRAFT'
      });

      // 尝试反推 specDimensions (简单处理，只取第一个 sku 的 key)
      if (detail.skus.length > 0 && detail.skus[0].attribute_json) {
        const firstSkuAttrs = detail.skus[0].attribute_json;
        if (firstSkuAttrs.length > 0) {
          // 这里为了简化前端矩阵重构复杂度，如果是已有商品编辑，不强行反推完整矩阵填入 specDimensions
          // 留空代表目前采用已有 sku 编辑模式。如需生成新的则重新配置 specDimensions。
        }
      }
    } catch (err: any) {
      toast.error(err.message || '获取商品详情失败');
      setDrawerOpen(false);
    } finally {
      setDrawerLoading(false);
    }
  };
  const handleFormFieldChange = <K extends keyof CreateProductInput,>(field: K, value: CreateProductInput[K]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // ----- Complex Form Handlers -----
  const handleTradeInfoChange = <K extends keyof TradeInfo,>(field: K, value: TradeInfo[K]) => {
    setFormData(prev => ({
      ...prev,
      trade_info_json: {
        ...(prev.trade_info_json as TradeInfo),
        [field]: value
      }
    }));
  };
  const addGalleryItem = () => {
    setFormData(prev => ({
      ...prev,
      gallery_json: [...(prev.gallery_json || []), {
        url: '',
        sort: (prev.gallery_json?.length || 0) + 1
      }]
    }));
  };
  const updateGalleryItem = (index: number, url: string) => {
    setFormData(prev => {
      const newArr = [...(prev.gallery_json || [])];
      newArr[index] = {
        ...newArr[index],
        url
      };
      return {
        ...prev,
        gallery_json: newArr
      };
    });
  };
  const removeGalleryItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      gallery_json: (prev.gallery_json || []).filter((_, i) => i !== index)
    }));
  };
  const addDetailBlock = (type: 'text' | 'image') => {
    setFormData(prev => ({
      ...prev,
      detail_content_json: [...(prev.detail_content_json || []), {
        type,
        content: ''
      }]
    }));
  };
  const updateDetailBlock = (index: number, content: string) => {
    setFormData(prev => {
      const newArr = [...(prev.detail_content_json || [])];
      newArr[index] = {
        ...newArr[index],
        content
      };
      return {
        ...prev,
        detail_content_json: newArr
      };
    });
  };
  const removeDetailBlock = (index: number) => {
    setFormData(prev => ({
      ...prev,
      detail_content_json: (prev.detail_content_json || []).filter((_, i) => i !== index)
    }));
  };
  const addParameter = () => {
    setFormData(prev => {
      const currentParams = prev.parameter_json || [{
        group: '基本参数',
        items: []
      }];
      if (currentParams.length === 0) currentParams.push({
        group: '基本参数',
        items: []
      });
      const newParams = [...currentParams];
      newParams[0].items.push({
        key: '',
        value: ''
      });
      return {
        ...prev,
        parameter_json: newParams
      };
    });
  };
  const updateParameter = (index: number, field: 'key' | 'value', val: string) => {
    setFormData(prev => {
      const currentParams = prev.parameter_json || [{
        group: '基本参数',
        items: []
      }];
      const newParams = [...currentParams];
      newParams[0].items[index] = {
        ...newParams[0].items[index],
        [field]: val
      };
      return {
        ...prev,
        parameter_json: newParams
      };
    });
  };
  const removeParameter = (index: number) => {
    setFormData(prev => {
      const currentParams = prev.parameter_json || [{
        group: '基本参数',
        items: []
      }];
      const newParams = [...currentParams];
      newParams[0].items = newParams[0].items.filter((_, i) => i !== index);
      return {
        ...prev,
        parameter_json: newParams
      };
    });
  };

  // ----- SKU Matrix Generators -----
  const addSpecDimension = () => {
    setSpecDimensions(prev => [...prev, {
      name: '',
      values: ''
    }]);
  };
  const updateSpecDimension = (index: number, field: keyof SpecDimension, val: string) => {
    setSpecDimensions(prev => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: val
      };
      return next;
    });
  };
  const removeSpecDimension = (index: number) => {
    setSpecDimensions(prev => prev.filter((_, i) => i !== index));
  };
  const generateSkus = () => {
    const validDimensions = specDimensions.filter(d => d.name.trim() !== '' && d.values.trim() !== '');
    if (validDimensions.length === 0) {
      toast.error('请配置至少一个有效的规格维度和值');
      return;
    }

    // 解析出二维数组：[[{name:'Color', value:'Red'}, {name:'Color', value:'Blue'}], [...]]
    const parsedGroups = validDimensions.map((d, index) => {
      const vals = d.values.split(',').map((v, index1) => v.trim()).filter(v => v !== '');
      return vals.map((v, index1) => ({
        name: d.name.trim(),
        value: v
      }));
    });

    // 笛卡尔积计算
    const cartesianProduct = parsedGroups.reduce<SkuAttribute[][]>((acc, curr) => {
      if (acc.length === 0) return curr.map((item, index) => [item]);
      const next: SkuAttribute[][] = [];
      acc.forEach(existing => {
        curr.forEach(item => {
          next.push([...existing, item]);
        });
      });
      return next;
    }, []);

    // 与现有的 formData.skus 合并（如果属性一致，保留原有 ID, 价格, 库存等）
    const newSkus: SkuItem[] = cartesianProduct.map((attrs, index) => {
      const matchExisting = formData.skus.find(oldSku => {
        if (!oldSku.attribute_json || oldSku.attribute_json.length !== attrs.length) return false;
        // 简单比对序列化结果或逐项对比
        return JSON.stringify(oldSku.attribute_json) === JSON.stringify(attrs);
      });
      if (matchExisting) return matchExisting;
      return {
        sku_code: '',
        // 将在提交或后补时生成
        price: 0,
        stock: 0,
        attribute_json: attrs,
        image_url: ''
      };
    });
    setFormData(prev => ({
      ...prev,
      skus: newSkus
    }));
    toast.success(`成功生成 ${newSkus.length} 个 SKU`);
  };
  const updateSkuRow = (index: number, field: keyof SkuItem, val: any) => {
    setFormData(prev => {
      const next = [...prev.skus];
      next[index] = {
        ...next[index],
        [field]: val
      };
      return {
        ...prev,
        skus: next
      };
    });
  };

  // ----- Submit Form -----
  const handleSubmitForm = async (action: 'DRAFT' | 'ACTIVE' | 'INACTIVE') => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        submit_action: action as 'DRAFT' | 'ACTIVE'
      };
      if (drawerMode === 'create') {
        await createProduct(payload);
        toast.success(`新增商品成功，状态已置为 ${STATUS_LABELS[action]}`);
      } else {
        if (!currentEditId) throw new Error('缺失编辑ID');
        await updateProduct({
          ...payload,
          product_id: currentEditId
        });
        toast.success(`更新商品成功`);
      }
      setDrawerOpen(false);
      fetchList();
    } catch (err: any) {
      toast.error(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  // ===== Handlers: Batch & Delete Actions =====
  const openConfirmDialog = (action: BatchActionType, ids: string[]) => {
    if (ids.length === 0) {
      toast.error('请先选择操作对象');
      return;
    }
    setConfirmAction(action);
    setConfirmTargetIds(ids);
    setConfirmDialogOpen(true);
  };
  const handleConfirmAction = async () => {
    setConfirmLoading(true);
    try {
      if (confirmAction === 'ACTIVE' || confirmAction === 'INACTIVE') {
        const res = await batchUpdateProductStatus(confirmTargetIds, confirmAction);
        toast.success(`批量操作完成，成功: ${res.success_count}，失败: ${res.fail_count}`);
      } else if (confirmAction === 'DELETE') {
        const res = await batchDeleteProduct(confirmTargetIds);
        toast.success(`批量删除完成，成功: ${res.success_count}，失败: ${res.fail_count}`);
      }
      setConfirmDialogOpen(false);
      setSelectedIds([]);
      fetchList();
    } catch (err: any) {
      toast.error(err.message || '操作失败');
    } finally {
      setConfirmLoading(false);
    }
  };

  // ===== Render Helpers =====
  const hasSelected = selectedIds.length > 0;
  return <div data-api-unique-id='productmanagementview-skeleton-with-logic-rc4a00600ecaa5ae8-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
      {/* 头部工具栏 */}
      <section data-api-unique-id='productmanagementview-skeleton-with-logic-rb3c891fb46d17c68-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
        <div data-api-unique-id='productmanagementview-skeleton-with-logic-r26dfd361723aecda-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
          <Input placeholder="搜索商品名称..." value={filterKeyword} onChange={e => setFilterKeyword(e.target.value)} data-api-unique-id='productmanagementview-skeleton-with-logic-r622fb0e6b27bb130-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' />
        </div>
        <div data-api-unique-id='productmanagementview-skeleton-with-logic-r848c688f3a6ce3c9-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
          <Select value={filterCategoryId} onValueChange={setFilterCategoryId} data-api-unique-id='productmanagementview-skeleton-with-logic-r9407f1e908677cf0-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
            <SelectTrigger data-api-unique-id='productmanagementview-skeleton-with-logic-r9122b7aa542c17b9-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
              <SelectValue placeholder="全部分类" data-api-unique-id='productmanagementview-skeleton-with-logic-r4154a193960f0774-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' />
            </SelectTrigger>
            <SelectContent data-api-unique-id='productmanagementview-skeleton-with-logic-rab1a54f1db32f270-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
              <SelectItem value="ALL" data-api-unique-id='productmanagementview-skeleton-with-logic-rafbf1be3e44b1e28-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>全部分类</SelectItem>
              {categoryOptions.map((c, index) => <SelectItem key={c.category_id} value={c.category_id} data-api-unique-id='productmanagementview-skeleton-with-logic-r3d91a1dd50173cde-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`categoryOptions-${index}-category_name`} data-api-map-var-name='c'>{c.category_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div data-api-unique-id='productmanagementview-skeleton-with-logic-rb65fed5d23a3a803-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
          <Select value={filterStatus} onValueChange={setFilterStatus} data-api-unique-id='productmanagementview-skeleton-with-logic-rf62cbe0657264d16-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
            <SelectTrigger data-api-unique-id='productmanagementview-skeleton-with-logic-r28c0a652e3342e18-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
              <SelectValue placeholder="全部状态" data-api-unique-id='productmanagementview-skeleton-with-logic-rde462b552af714a9-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' />
            </SelectTrigger>
            <SelectContent data-api-unique-id='productmanagementview-skeleton-with-logic-ra140ebdc8b23e6a2-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
              <SelectItem value="ALL" data-api-unique-id='productmanagementview-skeleton-with-logic-r654e89e2773277fc-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>全部状态</SelectItem>
              <SelectItem value="DRAFT" data-api-unique-id='productmanagementview-skeleton-with-logic-rb489bbe2d136db3d-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>草稿</SelectItem>
              <SelectItem value="ACTIVE" data-api-unique-id='productmanagementview-skeleton-with-logic-r26cb1e5439954628-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>已上架</SelectItem>
              <SelectItem value="INACTIVE" data-api-unique-id='productmanagementview-skeleton-with-logic-rc7428fd017300365-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>已下架</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div data-api-unique-id='productmanagementview-skeleton-with-logic-r80537d374f1870fd-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
          <Button variant="secondary" onClick={handleReset} data-api-unique-id='productmanagementview-skeleton-with-logic-r0465475729ada882-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>重置</Button>
          <Button onClick={handleSearch} data-api-unique-id='productmanagementview-skeleton-with-logic-r5c987dac065b6a14-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>查询</Button>
        </div>
        <div data-api-unique-id='productmanagementview-skeleton-with-logic-r0c5281a1164a052c-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
          <Button onClick={handleOpenCreate} data-api-unique-id='productmanagementview-skeleton-with-logic-re605fe70c34cac2c-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>新增商品</Button>
        </div>
      </section>

      <hr data-api-unique-id='productmanagementview-skeleton-with-logic-rd1903137501f6eaa-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' />

      {/* 批量操作区 */}
      <section data-api-unique-id='productmanagementview-skeleton-with-logic-r02812966ef5d1be3-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
        <Button disabled={!hasSelected} onClick={() => openConfirmDialog('ACTIVE', selectedIds)} data-api-unique-id='productmanagementview-skeleton-with-logic-rb32ecd9c677acedf-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
          批量上架
        </Button>
        <Button disabled={!hasSelected} onClick={() => openConfirmDialog('INACTIVE', selectedIds)} data-api-unique-id='productmanagementview-skeleton-with-logic-rf3e97f0a437db7f7-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
          批量下架
        </Button>
        <Button variant="destructive" disabled={!hasSelected} onClick={() => openConfirmDialog('DELETE', selectedIds)} data-api-unique-id='productmanagementview-skeleton-with-logic-r0de749fc5d4ae027-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
          批量删除
        </Button>
      </section>

      <hr data-api-unique-id='productmanagementview-skeleton-with-logic-r5d30ec7c25a3d103-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' />

      {/* 数据表格区 */}
      <section data-api-unique-id='productmanagementview-skeleton-with-logic-r8bd741f7033fcf36-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
        <Table data-api-unique-id='productmanagementview-skeleton-with-logic-r7667809c6c25a062-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
          <TableHeader data-api-unique-id='productmanagementview-skeleton-with-logic-r5820481448539584-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
            <TableRow data-api-unique-id='productmanagementview-skeleton-with-logic-r85102b4855c6e440-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
              <TableHead data-api-unique-id='productmanagementview-skeleton-with-logic-r233ea14dd13f5559-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
                <Checkbox checked={list.length > 0 && selectedIds.length === list.length} onCheckedChange={handleSelectAll} data-api-unique-id='productmanagementview-skeleton-with-logic-r6f26164a406dff3f-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' />
              </TableHead>
              <TableHead data-api-unique-id='productmanagementview-skeleton-with-logic-r4098dae908611318-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>商品名称/SKU基础编码</TableHead>
              <TableHead data-api-unique-id='productmanagementview-skeleton-with-logic-rab250e4aacb9d29a-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>来源</TableHead>
              <TableHead data-api-unique-id='productmanagementview-skeleton-with-logic-r37dedb346a635228-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>分类</TableHead>
              <TableHead data-api-unique-id='productmanagementview-skeleton-with-logic-r01525dfdf68164d5-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>价格区间</TableHead>
              <TableHead data-api-unique-id='productmanagementview-skeleton-with-logic-rba22180339b200dd-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>总库存</TableHead>
              <TableHead data-api-unique-id='productmanagementview-skeleton-with-logic-r5646846a6bbe0478-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>状态</TableHead>
              <TableHead data-api-unique-id='productmanagementview-skeleton-with-logic-r984f3440e4048eb0-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>创建时间</TableHead>
              <TableHead data-api-unique-id='productmanagementview-skeleton-with-logic-r880edae5d0b08f1d-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody data-api-unique-id='productmanagementview-skeleton-with-logic-r7a01b9769d692ce1-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
            {loading ? <TableRow data-api-unique-id='productmanagementview-skeleton-with-logic-r424167ce54b6328e-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
                <TableCell data-api-unique-id='productmanagementview-skeleton-with-logic-r18efe2c3c1de2b52-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>数据加载中...</TableCell>
              </TableRow> : list.length === 0 ? <TableRow data-api-unique-id='productmanagementview-skeleton-with-logic-rd9c245111c5f3c83-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
                <TableCell data-api-unique-id='productmanagementview-skeleton-with-logic-r5ba2941b4e93407d-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>暂无数据</TableCell>
              </TableRow> : list.map((item, index) => <TableRow key={item.product_id} data-api-unique-id='productmanagementview-skeleton-with-logic-r926228e1f9994ddd-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' data-api-in-loop='1'>
                  <TableCell data-api-unique-id='productmanagementview-skeleton-with-logic-re8ffa19cb73347a8-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' data-api-in-loop='1'>
                    <Checkbox checked={selectedIds.includes(item.product_id)} onCheckedChange={(checked: boolean) => handleSelectRow(item.product_id, checked)} data-api-unique-id='productmanagementview-skeleton-with-logic-r7240f5d6a63a4a08-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' data-api-in-loop='1' />
                  </TableCell>
                  <TableCell data-api-unique-id='productmanagementview-skeleton-with-logic-r4be040054d7a28d2-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' data-api-in-loop='1'>
                    <div data-api-unique-id='productmanagementview-skeleton-with-logic-rde2fb0a333bb300a-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`list-${index}-product_name`} data-api-map-var-name='item'>{item.product_name}</div>
                    <div data-api-unique-id='productmanagementview-skeleton-with-logic-r0d78f6ddaae304b4-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`list-${index}-sku_code_base`} data-api-map-var-name='item'>{item.sku_code_base}</div>
                  </TableCell>
                  <TableCell data-api-unique-id='productmanagementview-skeleton-with-logic-r6a782da43de2bb14-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' data-api-in-loop='1'>{SOURCE_LABELS[item.source]}</TableCell>
                  <TableCell data-api-unique-id='productmanagementview-skeleton-with-logic-ra571f1c6bc991f5a-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`list-${index}-category_name`} data-api-map-var-name='item'>{item.category_name}</TableCell>
                  <TableCell data-api-unique-id='productmanagementview-skeleton-with-logic-rd769c70cf29549de-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`list-${index}-price_min`} data-api-map-var-name='item'>{item.price_min} - {item.price_max}</TableCell>
                  <TableCell data-api-unique-id='productmanagementview-skeleton-with-logic-rdb74395a9874f765-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`list-${index}-total_stock`} data-api-map-var-name='item'>{item.total_stock}</TableCell>
                  <TableCell data-api-unique-id='productmanagementview-skeleton-with-logic-ra8a3a722a43887d1-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' data-api-in-loop='1'>{STATUS_LABELS[item.status]}</TableCell>
                  <TableCell data-api-unique-id='productmanagementview-skeleton-with-logic-rad056248deec8a5b-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' data-api-in-loop='1'>{new Date(item.created_at).toLocaleString()}</TableCell>
                  <TableCell data-api-unique-id='productmanagementview-skeleton-with-logic-r5961999409cd804f-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' data-api-in-loop='1'>
                    <Button variant="outline" size="sm" onClick={() => handleOpenEdit(item.product_id)} data-api-unique-id='productmanagementview-skeleton-with-logic-r8251945ab4b1a28b-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' data-api-in-loop='1'>编辑</Button>
                    {item.status === 'ACTIVE' ? <Button variant="outline" size="sm" onClick={() => openConfirmDialog('INACTIVE', [item.product_id])} data-api-unique-id='productmanagementview-skeleton-with-logic-r4ea8c20e4c1dc0bc-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' data-api-in-loop='1'>下架</Button> : <Button variant="outline" size="sm" onClick={() => openConfirmDialog('ACTIVE', [item.product_id])} data-api-unique-id='productmanagementview-skeleton-with-logic-r90e5cf7a018b8059-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' data-api-in-loop='1'>上架</Button>}
                    <Button variant="destructive" size="sm" onClick={() => openConfirmDialog('DELETE', [item.product_id])} data-api-unique-id='productmanagementview-skeleton-with-logic-rb18fa4571c5e8f64-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' data-api-in-loop='1'>删除</Button>
                  </TableCell>
                </TableRow>)}
          </TableBody>
        </Table>

        {/* 简易分页器 */}
        <div data-api-unique-id='productmanagementview-skeleton-with-logic-r604b54f925f7f7b5-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
          <span data-api-unique-id='productmanagementview-skeleton-with-logic-r735022ad96058fa4-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>共 {total} 条</span>
          <Button disabled={currentPage <= 1 || loading} onClick={() => setCurrentPage(p => p - 1)} data-api-unique-id='productmanagementview-skeleton-with-logic-r35596a80940c2593-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
            上一页
          </Button>
          <span data-api-unique-id='productmanagementview-skeleton-with-logic-rf2112a777ac76bc6-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>第 {currentPage} 页</span>
          <Button disabled={currentPage * pageSize >= total || loading} onClick={() => setCurrentPage(p => p + 1)} data-api-unique-id='productmanagementview-skeleton-with-logic-rf007311fc2c4dfbd-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
            下一页
          </Button>
        </div>
      </section>

      {/* 侧边抽屉表单 (商品编辑器) */}
      <Sheet open={drawerOpen} onOpenChange={open => !open && setDrawerOpen(false)} data-api-unique-id='productmanagementview-skeleton-with-logic-ra7e1166bea527c24-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
        <SheetContent data-api-unique-id='productmanagementview-skeleton-with-logic-r1371fa6195079356-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
          <SheetHeader data-api-unique-id='productmanagementview-skeleton-with-logic-rf57d9116e8035340-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
            <SheetTitle data-api-unique-id='productmanagementview-skeleton-with-logic-rda6b8f0a4b9d8721-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
              {drawerMode === 'create' ? '新增商品' : '编辑商品'} 
              {drawerMode === 'edit' && formData.submit_action && ` (${STATUS_LABELS[formData.submit_action]})`}
            </SheetTitle>
          </SheetHeader>

          {drawerLoading ? <div data-api-unique-id='productmanagementview-skeleton-with-logic-r3669ce47cffb9a77-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>加载表单数据中...</div> : <div data-api-unique-id='productmanagementview-skeleton-with-logic-r2a4d99a67a79d4fe-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
              {/* 区块 A: 基础信息 */}
              <fieldset data-api-unique-id='productmanagementview-skeleton-with-logic-r912d49f7cc67807d-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
                <legend data-api-unique-id='productmanagementview-skeleton-with-logic-r249308d49fe7140a-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>基础信息</legend>
                <div data-api-unique-id='productmanagementview-skeleton-with-logic-r540d8c29145eab36-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
                  <label data-api-unique-id='productmanagementview-skeleton-with-logic-r7421f7c5c8b3afab-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>商品名称</label>
                  <Input value={formData.name} onChange={e => handleFormFieldChange('name', e.target.value)} placeholder="必填" data-api-unique-id='productmanagementview-skeleton-with-logic-rc8658d19df2d0ffa-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' />
                </div>
                <div data-api-unique-id='productmanagementview-skeleton-with-logic-rffa6e3384a4def81-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
                  <label data-api-unique-id='productmanagementview-skeleton-with-logic-rf3230f671851b333-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>所属分类</label>
                  <Select value={formData.category_id} onValueChange={v => handleFormFieldChange('category_id', v)} data-api-unique-id='productmanagementview-skeleton-with-logic-rd12c2cffd32f7b6e-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
                    <SelectTrigger data-api-unique-id='productmanagementview-skeleton-with-logic-r25e6f8906f1025eb-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'><SelectValue placeholder="请选择分类" data-api-unique-id='productmanagementview-skeleton-with-logic-ra9bdaf4c650cbbe1-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' /></SelectTrigger>
                    <SelectContent data-api-unique-id='productmanagementview-skeleton-with-logic-r882a9226572dd655-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
                      {categoryOptions.map((c, index) => <SelectItem key={c.category_id} value={c.category_id} data-api-unique-id='productmanagementview-skeleton-with-logic-r7df1713255db1475-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`categoryOptions-${index}-category_name`} data-api-map-var-name='c'>{c.category_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div data-api-unique-id='productmanagementview-skeleton-with-logic-r517d3c5040adc90e-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
                  <label data-api-unique-id='productmanagementview-skeleton-with-logic-rcdfceb02eefbd779-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>摘要卖点</label>
                  <Textarea value={formData.short_description || ''} onChange={e => handleFormFieldChange('short_description', e.target.value)} data-api-unique-id='productmanagementview-skeleton-with-logic-r12b9c3d7cb373e3f-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' />
                </div>
              </fieldset>

              <hr data-api-unique-id='productmanagementview-skeleton-with-logic-r4c60f14cb94b074b-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' />

              {/* 区块 B: 媒体资源 */}
              <fieldset data-api-unique-id='productmanagementview-skeleton-with-logic-r9ebf55d07f87da71-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
                <legend data-api-unique-id='productmanagementview-skeleton-with-logic-rf42680a4cad24bb8-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>媒体资源</legend>
                <div data-api-unique-id='productmanagementview-skeleton-with-logic-rd98015e6ac70189c-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
                  <label data-api-unique-id='productmanagementview-skeleton-with-logic-rae252d083b139d4b-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>主图 URL</label>
                  <Input value={formData.main_image_url} onChange={e => handleFormFieldChange('main_image_url', e.target.value)} placeholder="必填，URL 格式" data-api-unique-id='productmanagementview-skeleton-with-logic-r4e9cb8bf159b5331-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' />
                </div>
                <div data-api-unique-id='productmanagementview-skeleton-with-logic-r0c11147c01364602-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
                  <label data-api-unique-id='productmanagementview-skeleton-with-logic-rb00b4941eeaec385-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>相册列表</label>
                  {formData.gallery_json?.map((img, index) => <div key={index} data-api-unique-id='productmanagementview-skeleton-with-logic-r23c633844978cc13-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' data-api-in-loop='1'>
                      <Input value={img.url} onChange={e => updateGalleryItem(index, e.target.value)} placeholder="图片 URL" data-api-unique-id='productmanagementview-skeleton-with-logic-r25417fc0c7e6ed29-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' data-api-in-loop='1' />
                      <Button variant="destructive" onClick={() => removeGalleryItem(index)} data-api-unique-id='productmanagementview-skeleton-with-logic-r1f33532d9d8bfcd6-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' data-api-in-loop='1'>移除</Button>
                    </div>)}
                  <Button variant="outline" onClick={addGalleryItem} data-api-unique-id='productmanagementview-skeleton-with-logic-rd2170f3c88c4805a-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>添加相册图片</Button>
                </div>
              </fieldset>

              <hr data-api-unique-id='productmanagementview-skeleton-with-logic-r9dd614faa82b97d9-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' />

              {/* 区块 C: SKU 矩阵 */}
              <fieldset data-api-unique-id='productmanagementview-skeleton-with-logic-rf315d9f9281e442d-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
                <legend data-api-unique-id='productmanagementview-skeleton-with-logic-rb0af8932991454f5-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>SKU 规格与变体配置</legend>
                <div data-api-unique-id='productmanagementview-skeleton-with-logic-rdb1357991a5ef8a2-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
                  <label data-api-unique-id='productmanagementview-skeleton-with-logic-rdf2a8c124098986f-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>动态规格生成器 (输入多个值请用英文逗号分隔)</label>
                  {specDimensions.map((dim, index) => <div key={index} data-api-unique-id='productmanagementview-skeleton-with-logic-rfb4ecb59fbf0d48e-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' data-api-in-loop='1'>
                      <Input placeholder="维度名称 (如: 颜色)" value={dim.name} onChange={e => updateSpecDimension(index, 'name', e.target.value)} data-api-unique-id='productmanagementview-skeleton-with-logic-re16215d866ab885f-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' data-api-in-loop='1' />
                      <Input placeholder="维度值 (如: 红色,蓝色,黑色)" value={dim.values} onChange={e => updateSpecDimension(index, 'values', e.target.value)} data-api-unique-id='productmanagementview-skeleton-with-logic-r1b4ea85696c77e01-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' data-api-in-loop='1' />
                      <Button variant="destructive" onClick={() => removeSpecDimension(index)} data-api-unique-id='productmanagementview-skeleton-with-logic-r4152a985bca1c5a1-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' data-api-in-loop='1'>移除该维度</Button>
                    </div>)}
                  <div data-api-unique-id='productmanagementview-skeleton-with-logic-r3c34e6c3fd66ac15-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
                    <Button variant="outline" onClick={addSpecDimension} data-api-unique-id='productmanagementview-skeleton-with-logic-r0bb25b034c6e85e9-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>添加新规格维度</Button>
                    <Button onClick={generateSkus} data-api-unique-id='productmanagementview-skeleton-with-logic-rd9ed8a2e6b72138b-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>重新生成 SKU 组合矩阵</Button>
                  </div>
                </div>

                <div data-api-unique-id='productmanagementview-skeleton-with-logic-r3142f8cc90662eb0-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
                  <label data-api-unique-id='productmanagementview-skeleton-with-logic-r9e50fa171736fbbc-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>当前 SKU 数据表</label>
                  {formData.skus.length === 0 ? <div data-api-unique-id='productmanagementview-skeleton-with-logic-rfdf09a929bebde69-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>暂无 SKU，请生成或补充</div> : <Table data-api-unique-id='productmanagementview-skeleton-with-logic-r473f2696ecf8af02-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
                      <TableHeader data-api-unique-id='productmanagementview-skeleton-with-logic-r346a7a58dc454f94-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
                        <TableRow data-api-unique-id='productmanagementview-skeleton-with-logic-r98477ba72f021e40-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
                          <TableHead data-api-unique-id='productmanagementview-skeleton-with-logic-r3ae36dba211e4bad-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>规格组合</TableHead>
                          <TableHead data-api-unique-id='productmanagementview-skeleton-with-logic-r44952f714969d039-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>SKU 编码 (可选)</TableHead>
                          <TableHead data-api-unique-id='productmanagementview-skeleton-with-logic-r78eab14f0ea04f63-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>售价</TableHead>
                          <TableHead data-api-unique-id='productmanagementview-skeleton-with-logic-r772d663e25f4aab7-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>库存</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody data-api-unique-id='productmanagementview-skeleton-with-logic-rf469a0ef560ada1e-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
                        {formData.skus.map((sku, index) => <TableRow key={index} data-api-unique-id='productmanagementview-skeleton-with-logic-r9f5e3a5321c76936-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' data-api-in-loop='1'>
                            <TableCell data-api-unique-id='productmanagementview-skeleton-with-logic-rb5d8e7f93d671ce4-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' data-api-in-loop='1'>
                              {sku.attribute_json?.map((attr, index1) => `${attr.name}:${attr.value}`).join(' | ') || '默认规格'}
                            </TableCell>
                            <TableCell data-api-unique-id='productmanagementview-skeleton-with-logic-r17743d7c3fda0777-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' data-api-in-loop='1'>
                              <Input value={sku.sku_code || ''} onChange={e => updateSkuRow(index, 'sku_code', e.target.value)} placeholder="系统自动生成" data-api-unique-id='productmanagementview-skeleton-with-logic-re927555329042d98-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' data-api-in-loop='1' />
                            </TableCell>
                            <TableCell data-api-unique-id='productmanagementview-skeleton-with-logic-rd34f9a080314f5bc-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' data-api-in-loop='1'>
                              <Input type="number" value={sku.price} onChange={e => updateSkuRow(index, 'price', Number(e.target.value))} data-api-unique-id='productmanagementview-skeleton-with-logic-r5f1377be13755fae-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' data-api-in-loop='1' />
                            </TableCell>
                            <TableCell data-api-unique-id='productmanagementview-skeleton-with-logic-r53999d36752f4045-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' data-api-in-loop='1'>
                              <Input type="number" value={sku.stock} onChange={e => updateSkuRow(index, 'stock', Number(e.target.value))} data-api-unique-id='productmanagementview-skeleton-with-logic-r834147078571e77a-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' data-api-in-loop='1' />
                            </TableCell>
                          </TableRow>)}
                      </TableBody>
                    </Table>}
                </div>
              </fieldset>

              <hr data-api-unique-id='productmanagementview-skeleton-with-logic-r87008a85db2efdc0-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' />

              {/* 区块 D: 详情与参数 */}
              <fieldset data-api-unique-id='productmanagementview-skeleton-with-logic-ra49801c2954f5320-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
                <legend data-api-unique-id='productmanagementview-skeleton-with-logic-r172a388a9dc81062-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>详情与参数 (基础展示版)</legend>
                <div data-api-unique-id='productmanagementview-skeleton-with-logic-r1ce6ef841049b930-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
                  <label data-api-unique-id='productmanagementview-skeleton-with-logic-r590c0cb96baff1ae-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>图文详情块 (按顺序前台渲染)</label>
                  {formData.detail_content_json?.map((block, index) => <div key={index} data-api-unique-id='productmanagementview-skeleton-with-logic-r3657dbadedcae967-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' data-api-in-loop='1'>
                      <span data-api-unique-id='productmanagementview-skeleton-with-logic-rf4bab9ff8f352397-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' data-api-in-loop='1'>{block.type === 'text' ? '文本内容:' : '图片URL:'}</span>
                      {block.type === 'text' ? <Textarea value={block.content} onChange={e => updateDetailBlock(index, e.target.value)} data-api-unique-id='productmanagementview-skeleton-with-logic-r6f23a6c00db0a756-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' data-api-in-loop='1' /> : <Input value={block.content} onChange={e => updateDetailBlock(index, e.target.value)} data-api-unique-id='productmanagementview-skeleton-with-logic-r2d2e7f755fbd44f3-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' data-api-in-loop='1' />}
                      <Button variant="destructive" onClick={() => removeDetailBlock(index)} data-api-unique-id='productmanagementview-skeleton-with-logic-r83be7944802f4bd6-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' data-api-in-loop='1'>移除</Button>
                    </div>)}
                  <div data-api-unique-id='productmanagementview-skeleton-with-logic-rf8d493ea3e65d6f2-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
                    <Button variant="outline" onClick={() => addDetailBlock('text')} data-api-unique-id='productmanagementview-skeleton-with-logic-rd392a00719509f7b-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>添加文本段落</Button>
                    <Button variant="outline" onClick={() => addDetailBlock('image')} data-api-unique-id='productmanagementview-skeleton-with-logic-rcad7487cd89f0ba9-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>添加图片展示</Button>
                  </div>
                </div>

                <div data-api-unique-id='productmanagementview-skeleton-with-logic-r0efe19b5f1035562-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
                  <label data-api-unique-id='productmanagementview-skeleton-with-logic-r775b038c90b6403c-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>基础参数配置表</label>
                  {formData.parameter_json?.[0]?.items?.map((item, index) => <div key={index} data-api-unique-id='productmanagementview-skeleton-with-logic-r19b85c3fcf6a92a0-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' data-api-in-loop='1'>
                      <Input placeholder="参数名 (如: 材质)" value={item.key} onChange={e => updateParameter(index, 'key', e.target.value)} data-api-unique-id='productmanagementview-skeleton-with-logic-rc86397c877683a3b-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' data-api-in-loop='1' />
                      <Input placeholder="参数值 (如: 不锈钢)" value={item.value} onChange={e => updateParameter(index, 'value', e.target.value)} data-api-unique-id='productmanagementview-skeleton-with-logic-rdce3c10176ced4cb-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' data-api-in-loop='1' />
                      <Button variant="destructive" onClick={() => removeParameter(index)} data-api-unique-id='productmanagementview-skeleton-with-logic-r6af7742a8ba963bd-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' data-api-in-loop='1'>移除</Button>
                    </div>)}
                  <Button variant="outline" onClick={addParameter} data-api-unique-id='productmanagementview-skeleton-with-logic-r1e573dc9185f2ad4-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>添加参数项</Button>
                </div>
              </fieldset>

              <hr data-api-unique-id='productmanagementview-skeleton-with-logic-r49a3c4d9323fd2f8-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' />

              {/* 区块 E: 物流交期 */}
              <fieldset data-api-unique-id='productmanagementview-skeleton-with-logic-r470ae2cf62b071aa-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
                <legend data-api-unique-id='productmanagementview-skeleton-with-logic-rff31be9aa0574ec0-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>物流与交期说明</legend>
                <div data-api-unique-id='productmanagementview-skeleton-with-logic-rf5f38c4b953cb263-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
                  <label data-api-unique-id='productmanagementview-skeleton-with-logic-r40b45e1c4f357acf-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>发货地</label>
                  <Input value={formData.trade_info_json?.shipFrom || ''} onChange={e => handleTradeInfoChange('shipFrom', e.target.value)} data-api-unique-id='productmanagementview-skeleton-with-logic-r05570fcc0fc522ee-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' />
                </div>
                <div data-api-unique-id='productmanagementview-skeleton-with-logic-r7142aa4601d1a86b-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
                  <label data-api-unique-id='productmanagementview-skeleton-with-logic-rf21a804c8e5cdd16-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>预计交期(天)</label>
                  <Input type="number" value={formData.trade_info_json?.deliveryDays || 0} onChange={e => handleTradeInfoChange('deliveryDays', Number(e.target.value))} data-api-unique-id='productmanagementview-skeleton-with-logic-rf097b4b0acd5163f-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' />
                </div>
                <div data-api-unique-id='productmanagementview-skeleton-with-logic-rac36c56b13627622-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
                  <label data-api-unique-id='productmanagementview-skeleton-with-logic-r5f1346f3e2876265-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>最小起订量</label>
                  <Input type="number" value={formData.trade_info_json?.minOrderQty || 1} onChange={e => handleTradeInfoChange('minOrderQty', Number(e.target.value))} data-api-unique-id='productmanagementview-skeleton-with-logic-rd66e3d0fd5eb5489-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic' />
                </div>
              </fieldset>

              {/* 抽屉底部操作基座 */}
              <div data-api-unique-id='productmanagementview-skeleton-with-logic-r9f52d0243a5f02a2-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
                {drawerMode === 'edit' && <Button variant="destructive" disabled={saving} onClick={() => {
              setDrawerOpen(false);
              openConfirmDialog('DELETE', [currentEditId!]);
            }} data-api-unique-id='productmanagementview-skeleton-with-logic-r89ddf12e8f92be23-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
                    删除当前商品
                  </Button>}
                
                <Button variant="outline" disabled={saving} onClick={() => handleSubmitForm('DRAFT')} data-api-unique-id='productmanagementview-skeleton-with-logic-rc0d60b5330f18171-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
                  保存为草稿
                </Button>
                
                {drawerMode === 'edit' && formData.submit_action === 'ACTIVE' && <Button variant="outline" disabled={saving} onClick={() => handleSubmitForm('INACTIVE')} data-api-unique-id='productmanagementview-skeleton-with-logic-r91620a5c7d8ff8d9-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
                    下架处理
                  </Button>}

                <Button disabled={saving} onClick={() => handleSubmitForm('ACTIVE')} data-api-unique-id='productmanagementview-skeleton-with-logic-r58de22053b6f6296-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
                  {drawerMode === 'create' ? '提交并上架' : '立即上架'}
                </Button>
              </div>

            </div>}
        </SheetContent>
      </Sheet>

      {/* 二次确认弹窗 */}
      <Dialog open={confirmDialogOpen} onOpenChange={open => !open && setConfirmDialogOpen(false)} data-api-unique-id='productmanagementview-skeleton-with-logic-r88f93765e1f74da2-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
        <DialogContent data-api-unique-id='productmanagementview-skeleton-with-logic-r09bac2a7ba7a6c7f-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
          <DialogHeader data-api-unique-id='productmanagementview-skeleton-with-logic-r50cc4d273ba63613-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
            <DialogTitle data-api-unique-id='productmanagementview-skeleton-with-logic-rf1dcce2cf15f578d-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
              确认执行该操作吗？
            </DialogTitle>
            <DialogDescription data-api-unique-id='productmanagementview-skeleton-with-logic-r8fbf5bfcf2c0aa5c-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
              {confirmAction === 'ACTIVE' && '该操作将尝试上架选定的商品，需要满足上架的数据校验条件。'}
              {confirmAction === 'INACTIVE' && '下架后商品将立刻从前台隐藏，且购物车内的相关商品将失效。'}
              {confirmAction === 'DELETE' && '确认删除该商品？相关购物车商品会被标记为失效且前台不可见。该操作不可撤销。'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter data-api-unique-id='productmanagementview-skeleton-with-logic-rffa4c312b2e3e117-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)} disabled={confirmLoading} data-api-unique-id='productmanagementview-skeleton-with-logic-rab83b3022733bd7d-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
              取消
            </Button>
            <Button variant={confirmAction === 'DELETE' ? 'destructive' : 'default'} onClick={handleConfirmAction} disabled={confirmLoading} data-api-unique-id='productmanagementview-skeleton-with-logic-r1cc3b17d53d19784-s1457401938' data-api-unique-page-name='src/backend/components/ProductManagementView_skeleton_with_logic'>
              {confirmLoading ? '执行中...' : '确认执行'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
}