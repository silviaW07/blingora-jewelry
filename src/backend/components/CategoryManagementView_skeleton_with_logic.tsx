'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CategoryManagement } from '@/backend/route-params';
import type { CategoryItem, CategoryStatus, GetCategoryListInput, CreateCategoryInput, UpdateCategoryInput } from '@/backend/actions/CategoryManagement';
import { getCategoryList, createCategory, updateCategory, updateCategoryStatus, updateCategorySortWeight, deleteCategory } from '@/backend/actions/CategoryManagement';
import { toast } from "sonner";

// ================= UI Components =================
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";

// ================= Constants =================
const STATUS_LABELS: Record<CategoryStatus, string> = {
  ACTIVE: '激活',
  INACTIVE: '停用'
};
interface FormFields {
  category_name: string;
  category_slug: string;
  image_url: string;
  description: string;
  sort_weight: number;
  status: CategoryStatus;
}
const DEFAULT_FORM_DATA: FormFields = {
  category_name: '',
  category_slug: '',
  image_url: '',
  description: '',
  sort_weight: 0,
  status: 'ACTIVE'
};

// ================= Component =================
export default function CategoryManagementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    status,
    categoryId
  } = CategoryManagement.getParams(searchParams);

  // ===== View State =====
  const [list, setList] = useState<CategoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Data Controls
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [searchInput, setSearchInput] = useState('');
  const [activeKeyword, setActiveKeyword] = useState(''); // Only updates on search button click

  // Inline Editing
  const [weightInputs, setWeightInputs] = useState<Record<string, string>>({});

  // Drawer Form
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormFields>(DEFAULT_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Modal
  const [deleteItem, setDeleteItem] = useState<CategoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ===== Computed =====
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  // ===== Data Fetching =====
  const loadData = useCallback(async (targetPage: number, targetKeyword: string, targetStatus: string) => {
    setIsLoading(true);
    try {
      const payload: GetCategoryListInput = {
        page: targetPage,
        page_size: pageSize
      };
      if (targetKeyword) payload.keyword = targetKeyword;
      if (targetStatus && (targetStatus === 'ACTIVE' || targetStatus === 'INACTIVE')) {
        payload.status = targetStatus as CategoryStatus;
      }
      const res = await getCategoryList(payload);
      setList(res.list);
      setTotal(res.total);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  // Initial and dependent fetch
  useEffect(() => {
    loadData(page, activeKeyword, status);
  }, [loadData, page, activeKeyword, status]);

  // Auto-open drawer if categoryId exists in URL
  useEffect(() => {
    if (categoryId && list.length > 0 && !isDrawerOpen) {
      const target = list.find(item => item.category_id === categoryId);
      if (target) {
        setEditingId(target.category_id);
        setFormData({
          category_name: target.category_name,
          category_slug: target.category_slug,
          image_url: target.image_url || '',
          description: target.description || '',
          sort_weight: target.sort_weight,
          status: target.status
        });
        setIsDrawerOpen(true);
      }
    }
  }, [categoryId, list, isDrawerOpen]);

  // ===== Action Handlers =====

  const handleTabChange = (val: string) => {
    setPage(1);
    if (val === 'ALL') {
      CategoryManagement.navigateToAll(router);
    } else {
      CategoryManagement.navigateToFiltered(router, {
        status: val
      });
    }
  };
  const handleSearch = () => {
    setPage(1);
    setActiveKeyword(searchInput);
  };

  // Drawer Toggles
  const openCreateDrawer = () => {
    setEditingId(null);
    setFormData(DEFAULT_FORM_DATA);
    setIsDrawerOpen(true);
  };
  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingId(null);
    setFormData(DEFAULT_FORM_DATA);

    // Clear categoryId from URL if exists to prevent auto-reopen
    if (categoryId) {
      if (status) {
        CategoryManagement.navigateToFiltered(router, {
          status
        });
      } else {
        CategoryManagement.navigateToAll(router);
      }
    }
  };

  // Form Value Change
  const handleFormChange = <K extends keyof FormFields,>(field: K, value: FormFields[K]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const submitForm = async () => {
    setIsSubmitting(true);
    try {
      if (editingId) {
        const payload: UpdateCategoryInput = {
          category_id: editingId,
          ...formData
        };
        await updateCategory(payload);
        toast.success('分类更新成功');
      } else {
        const payload: CreateCategoryInput = {
          ...formData
        };
        await createCategory(payload);
        toast.success('分类创建成功');
      }
      closeDrawer();
      loadData(page, activeKeyword, status);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Inline Edit Handlers
  const handleInlineStatusChange = async (item: CategoryItem, checked: boolean) => {
    const newStatus = checked ? 'ACTIVE' : 'INACTIVE';
    try {
      await updateCategoryStatus({
        category_id: item.category_id,
        status: newStatus
      });
      toast.success('状态切换成功');
      loadData(page, activeKeyword, status);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  };
  const handleInlineWeightChange = (id: string, value: string) => {
    setWeightInputs(prev => ({
      ...prev,
      [id]: value
    }));
  };
  const handleInlineWeightBlur = async (item: CategoryItem) => {
    const inputValue = weightInputs[item.category_id];
    if (inputValue === undefined) return;
    const newWeight = parseInt(inputValue, 10);
    if (isNaN(newWeight) || newWeight === item.sort_weight) return;
    try {
      await updateCategorySortWeight({
        category_id: item.category_id,
        sort_weight: newWeight
      });
      toast.success('排序更新成功');
      loadData(page, activeKeyword, status);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  };

  // Delete Action
  const triggerDelete = (item: CategoryItem) => {
    setDeleteItem(item);
  };
  const confirmDelete = async () => {
    if (!deleteItem) return;
    setIsDeleting(true);
    try {
      await deleteCategory({
        category_id: deleteItem.category_id
      });
      toast.success('分类删除成功');
      setDeleteItem(null);
      loadData(page, activeKeyword, status);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setIsDeleting(false);
    }
  };

  // ===== Render =====
  return <div data-api-unique-id='categorymanagementview-skeleton-with-logic-rb2785c9c27e70ac1-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
      <header data-api-unique-id='categorymanagementview-skeleton-with-logic-r5a370bc325f9d450-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
        <div data-api-unique-id='categorymanagementview-skeleton-with-logic-r9866d631a6b17e94-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
          <h2 data-api-unique-id='categorymanagementview-skeleton-with-logic-rf1c75bd857f3e4b4-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>分类管理</h2>
          <p data-api-unique-id='categorymanagementview-skeleton-with-logic-rdcb0491d9e347728-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
            前台仅展示状态为 <strong data-api-unique-id='categorymanagementview-skeleton-with-logic-r50a03f1b2788524d-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>{STATUS_LABELS.ACTIVE}</strong> 的分类及其商品。禁用分类将导致其下关联商品在前台不可见。
          </p>
        </div>
        <div data-api-unique-id='categorymanagementview-skeleton-with-logic-rabb4bf845b129292-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
          <Button onClick={openCreateDrawer} data-api-unique-id='categorymanagementview-skeleton-with-logic-rfc7755ebe65951a8-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>新增分类</Button>
        </div>
      </header>

      <section data-api-unique-id='categorymanagementview-skeleton-with-logic-r0165c647632d794b-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
        <div data-api-unique-id='categorymanagementview-skeleton-with-logic-r0a90b01c59564106-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
          <Tabs value={status || 'ALL'} onValueChange={handleTabChange} data-api-unique-id='categorymanagementview-skeleton-with-logic-r39c436af300f8b67-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
            <TabsList data-api-unique-id='categorymanagementview-skeleton-with-logic-r682b44e4b9fa3ec1-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
              <TabsTrigger value="ALL" data-api-unique-id='categorymanagementview-skeleton-with-logic-r696db57356dd0035-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>全部</TabsTrigger>
              <TabsTrigger value="ACTIVE" data-api-unique-id='categorymanagementview-skeleton-with-logic-rd16ca31251346f45-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>{STATUS_LABELS.ACTIVE}</TabsTrigger>
              <TabsTrigger value="INACTIVE" data-api-unique-id='categorymanagementview-skeleton-with-logic-rab075da889bbebf0-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>{STATUS_LABELS.INACTIVE}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div data-api-unique-id='categorymanagementview-skeleton-with-logic-ra661c76af1170b5f-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
          <Input placeholder="输入分类名称检索..." value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} data-api-unique-id='categorymanagementview-skeleton-with-logic-r021a5e14d0fb90b9-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic' />
          <Button onClick={handleSearch} data-api-unique-id='categorymanagementview-skeleton-with-logic-r25a63a90cd4445ee-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>检索</Button>
        </div>
      </section>

      <section data-api-unique-id='categorymanagementview-skeleton-with-logic-r7da671b29eda6c09-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
        <Table data-api-unique-id='categorymanagementview-skeleton-with-logic-r89edc6ae00fd08bb-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
          <TableHeader data-api-unique-id='categorymanagementview-skeleton-with-logic-r542d69522bc2e8e3-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
            <TableRow data-api-unique-id='categorymanagementview-skeleton-with-logic-r98a78e60fd30abf1-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
              <TableHead data-api-unique-id='categorymanagementview-skeleton-with-logic-r6b9c576ea6321087-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>分类主图</TableHead>
              <TableHead data-api-unique-id='categorymanagementview-skeleton-with-logic-rb57d00c29d134d31-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>分类名称与标识</TableHead>
              <TableHead data-api-unique-id='categorymanagementview-skeleton-with-logic-r0dd93578f3653924-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>关联商品数</TableHead>
              <TableHead data-api-unique-id='categorymanagementview-skeleton-with-logic-rc0074971463c5522-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>排序权重</TableHead>
              <TableHead data-api-unique-id='categorymanagementview-skeleton-with-logic-rebf6193443a32f2a-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>当前状态</TableHead>
              <TableHead data-api-unique-id='categorymanagementview-skeleton-with-logic-r5d90b93b7a769819-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>平台操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody data-api-unique-id='categorymanagementview-skeleton-with-logic-r3968325da2a6f408-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
            {isLoading ? <TableRow data-api-unique-id='categorymanagementview-skeleton-with-logic-r63e18ce6449954c7-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
                <TableCell colSpan={6} data-api-unique-id='categorymanagementview-skeleton-with-logic-r484d47c67f3f86f1-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>数据加载中...</TableCell>
              </TableRow> : list.length === 0 ? <TableRow data-api-unique-id='categorymanagementview-skeleton-with-logic-r4a13caa1b49a34b0-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
                <TableCell colSpan={6} data-api-unique-id='categorymanagementview-skeleton-with-logic-r17447b9be3361773-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>暂无分类数据</TableCell>
              </TableRow> : list.map((item, index) => <TableRow key={item.category_id} data-api-unique-id='categorymanagementview-skeleton-with-logic-ra812c657309e2e15-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic' data-api-in-loop='1'>
                  <TableCell data-api-unique-id='categorymanagementview-skeleton-with-logic-r5f9246de85b36f95-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic' data-api-in-loop='1'>
                    {item.image_url ? <img src={item.image_url} alt={item.category_name} data-api-unique-id='categorymanagementview-skeleton-with-logic-rb5d5623d7b03823e-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic' data-api-in-loop='1' /> : <span data-api-unique-id='categorymanagementview-skeleton-with-logic-raedf8eb603e87cae-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic' data-api-in-loop='1'>[无图片]</span>}
                  </TableCell>
                  <TableCell data-api-unique-id='categorymanagementview-skeleton-with-logic-rf08e447806f5d3ec-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic' data-api-in-loop='1'>
                    <div data-api-unique-id='categorymanagementview-skeleton-with-logic-rdfbf2bd18ce7d530-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic' data-api-in-loop='1'>
                      <strong data-api-unique-id='categorymanagementview-skeleton-with-logic-r2345ddba863b1ceb-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`list-${index}-category_name`} data-api-map-var-name='item'>{item.category_name}</strong>
                    </div>
                    <div data-api-unique-id='categorymanagementview-skeleton-with-logic-rdf6410b9eae9e4a8-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic' data-api-in-loop='1'>
                      <small data-api-unique-id='categorymanagementview-skeleton-with-logic-r54853dbcf86ffb01-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`list-${index}-category_slug`} data-api-map-var-name='item'>{item.category_slug}</small>
                    </div>
                  </TableCell>
                  <TableCell data-api-unique-id='categorymanagementview-skeleton-with-logic-rfbd0a051b7ba1361-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic' data-api-in-loop='1'>
                    <span data-api-unique-id='categorymanagementview-skeleton-with-logic-r52bc6bb16c23b868-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`list-${index}-product_count`} data-api-map-var-name='item'>{item.product_count}</span>
                  </TableCell>
                  <TableCell data-api-unique-id='categorymanagementview-skeleton-with-logic-rdedb07a93ee5cf07-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic' data-api-in-loop='1'>
                    <Input type="number" value={weightInputs[item.category_id] ?? item.sort_weight} onChange={e => handleInlineWeightChange(item.category_id, e.target.value)} onBlur={() => handleInlineWeightBlur(item)} data-api-unique-id='categorymanagementview-skeleton-with-logic-reecbb72a97f013fb-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic' data-api-in-loop='1' />
                  </TableCell>
                  <TableCell data-api-unique-id='categorymanagementview-skeleton-with-logic-r88b3bc870ad576ab-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic' data-api-in-loop='1'>
                    <Switch checked={item.status === 'ACTIVE'} onCheckedChange={checked => handleInlineStatusChange(item, checked)} data-api-unique-id='categorymanagementview-skeleton-with-logic-r942f956eb55bceb7-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic' data-api-in-loop='1' />
                    <span data-api-unique-id='categorymanagementview-skeleton-with-logic-r90864dd73159caff-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic' data-api-in-loop='1'>{STATUS_LABELS[item.status]}</span>
                  </TableCell>
                  <TableCell data-api-unique-id='categorymanagementview-skeleton-with-logic-r1c9f6611f65119d6-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic' data-api-in-loop='1'>
                    <Button onClick={() => CategoryManagement.navigateToDetail(router, {
                categoryId: item.category_id
              })} data-api-unique-id='categorymanagementview-skeleton-with-logic-raea7a7de3720d954-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic' data-api-in-loop='1'>
                      编辑
                    </Button>
                    <Button onClick={() => triggerDelete(item)} data-api-unique-id='categorymanagementview-skeleton-with-logic-racc91020325a7ed8-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic' data-api-in-loop='1'>
                      删除
                    </Button>
                  </TableCell>
                </TableRow>)}
          </TableBody>
        </Table>
      </section>

      <section data-api-unique-id='categorymanagementview-skeleton-with-logic-r44709e9af999169a-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
        <Pagination data-api-unique-id='categorymanagementview-skeleton-with-logic-r3d0a375e38197798-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
          <PaginationContent data-api-unique-id='categorymanagementview-skeleton-with-logic-rd480b77d8f66f726-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
            <PaginationItem data-api-unique-id='categorymanagementview-skeleton-with-logic-rc9ecab53ca53bb77-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
              <PaginationPrevious onClick={() => setPage(p => Math.max(1, p - 1))} aria-disabled={page === 1} data-api-unique-id='categorymanagementview-skeleton-with-logic-raa958c79465b2774-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic' />
            </PaginationItem>
            <PaginationItem data-api-unique-id='categorymanagementview-skeleton-with-logic-ra57f9119f707a784-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
              <span data-api-unique-id='categorymanagementview-skeleton-with-logic-rc442d0249a3657f1-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>第 {page} 页 / 共 {totalPages} 页 (共 {total} 条记录)</span>
            </PaginationItem>
            <PaginationItem data-api-unique-id='categorymanagementview-skeleton-with-logic-r8932d80caca9fa14-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
              <PaginationNext onClick={() => setPage(p => Math.min(totalPages, p + 1))} aria-disabled={page === totalPages} data-api-unique-id='categorymanagementview-skeleton-with-logic-re16d843b80a6669c-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic' />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </section>

      {/* Drawer Form */}
      <Sheet open={isDrawerOpen} onOpenChange={open => !open && closeDrawer()} data-api-unique-id='categorymanagementview-skeleton-with-logic-rf4a07786e6566e91-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
        <SheetContent data-api-unique-id='categorymanagementview-skeleton-with-logic-rb625320b70e296c8-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
          <SheetHeader data-api-unique-id='categorymanagementview-skeleton-with-logic-ra1bafed08d1ef2ac-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
            <SheetTitle data-api-unique-id='categorymanagementview-skeleton-with-logic-r8f68ddd2cb6ffa22-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>{editingId ? '编辑分类' : '新增分类'}</SheetTitle>
          </SheetHeader>
          
          <form onSubmit={e => {
          e.preventDefault();
          submitForm();
        }} data-api-unique-id='categorymanagementview-skeleton-with-logic-rad015ec6c4d60243-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
            <fieldset disabled={isSubmitting} data-api-unique-id='categorymanagementview-skeleton-with-logic-r3ef1b7b67386c5b0-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
              {/* 基础配置块 */}
              <div data-api-unique-id='categorymanagementview-skeleton-with-logic-r59e0aaea1ce87664-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
                <h3 data-api-unique-id='categorymanagementview-skeleton-with-logic-rb5a26629655d49d2-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>基础配置</h3>
                <label data-api-unique-id='categorymanagementview-skeleton-with-logic-r480a147755701622-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
                  <span data-api-unique-id='categorymanagementview-skeleton-with-logic-r6f9723de650736b7-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>分类名称</span>
                  <Input value={formData.category_name} onChange={e => handleFormChange('category_name', e.target.value)} required data-api-unique-id='categorymanagementview-skeleton-with-logic-rb4d9ef1f40e5cc0c-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic' />
                </label>
                <label data-api-unique-id='categorymanagementview-skeleton-with-logic-r857df44fcc80a8bd-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
                  <span data-api-unique-id='categorymanagementview-skeleton-with-logic-r3c3382fb1bb3accb-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>唯一标识 (Slug)</span>
                  <Input value={formData.category_slug} onChange={e => handleFormChange('category_slug', e.target.value)} required data-api-unique-id='categorymanagementview-skeleton-with-logic-r8519218dde976c59-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic' />
                </label>
              </div>

              {/* 视觉媒体块 */}
              <div data-api-unique-id='categorymanagementview-skeleton-with-logic-r85a122763fe09f6e-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
                <h3 data-api-unique-id='categorymanagementview-skeleton-with-logic-red9c27619867728e-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>视觉媒体</h3>
                <label data-api-unique-id='categorymanagementview-skeleton-with-logic-r5502f656c93cbfc1-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
                  <span data-api-unique-id='categorymanagementview-skeleton-with-logic-r4320ce0673b44b5a-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>图片 URL</span>
                  <Input value={formData.image_url} onChange={e => handleFormChange('image_url', e.target.value)} data-api-unique-id='categorymanagementview-skeleton-with-logic-r3d14c1ba02a19275-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic' />
                </label>
                <div data-api-unique-id='categorymanagementview-skeleton-with-logic-rfd0961c638633f19-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
                  {formData.image_url ? <img src={formData.image_url} alt="分类图片预览" data-api-unique-id='categorymanagementview-skeleton-with-logic-rc8460af04408a069-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic' /> : <div data-api-unique-id='categorymanagementview-skeleton-with-logic-r704a290433bf8ba6-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>[无图片预览]</div>}
                </div>
              </div>

              {/* 业务属性块 */}
              <div data-api-unique-id='categorymanagementview-skeleton-with-logic-r817b3d5f62bf110b-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
                <h3 data-api-unique-id='categorymanagementview-skeleton-with-logic-rfb62f2220a72c33a-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>业务属性</h3>
                <label data-api-unique-id='categorymanagementview-skeleton-with-logic-rf27d7d3bd7570ed1-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
                  <span data-api-unique-id='categorymanagementview-skeleton-with-logic-r0c69f3d3b01774cb-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>分类说明</span>
                  <Textarea value={formData.description} onChange={e => handleFormChange('description', e.target.value)} data-api-unique-id='categorymanagementview-skeleton-with-logic-r00d77dda9212694b-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic' />
                </label>
                <label data-api-unique-id='categorymanagementview-skeleton-with-logic-rc0d23015810846c0-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
                  <span data-api-unique-id='categorymanagementview-skeleton-with-logic-r2650b99b407319e4-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>排序权重</span>
                  <Input type="number" value={formData.sort_weight} onChange={e => handleFormChange('sort_weight', parseInt(e.target.value, 10) || 0)} required data-api-unique-id='categorymanagementview-skeleton-with-logic-rac5ee0f19a1a9903-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic' />
                </label>
                <label data-api-unique-id='categorymanagementview-skeleton-with-logic-r897e4b0eb84617ca-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
                  <span data-api-unique-id='categorymanagementview-skeleton-with-logic-rb13d2f9bcdb6ae09-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>分类状态</span>
                  <Switch checked={formData.status === 'ACTIVE'} onCheckedChange={checked => handleFormChange('status', checked ? 'ACTIVE' : 'INACTIVE')} data-api-unique-id='categorymanagementview-skeleton-with-logic-rac6de2d9baf87443-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic' />
                  <span data-api-unique-id='categorymanagementview-skeleton-with-logic-rce61b367396b684b-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>{STATUS_LABELS[formData.status]}</span>
                </label>
              </div>
            </fieldset>

            <SheetFooter data-api-unique-id='categorymanagementview-skeleton-with-logic-r15526d10965a624b-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
              <Button type="button" onClick={closeDrawer} disabled={isSubmitting} data-api-unique-id='categorymanagementview-skeleton-with-logic-r5819292cf5ddfda6-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>取消</Button>
              <Button type="submit" disabled={isSubmitting} data-api-unique-id='categorymanagementview-skeleton-with-logic-rea35d7baa81b1dfd-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>保存并同步</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={!!deleteItem} onOpenChange={open => !open && setDeleteItem(null)} data-api-unique-id='categorymanagementview-skeleton-with-logic-r746294c951ad03d5-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
        <AlertDialogContent data-api-unique-id='categorymanagementview-skeleton-with-logic-r4b353267837cdc2d-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
          <AlertDialogHeader data-api-unique-id='categorymanagementview-skeleton-with-logic-r06debe83d1ccadd6-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
            <AlertDialogTitle data-api-unique-id='categorymanagementview-skeleton-with-logic-r63fcb8f3439e30a6-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>删除操作确认</AlertDialogTitle>
            <AlertDialogDescription data-api-unique-id='categorymanagementview-skeleton-with-logic-r06842eb1e260f4eb-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
              {deleteItem?.product_count && deleteItem.product_count > 0 ? <>
                  严重警告：分类 <strong data-api-unique-id='categorymanagementview-skeleton-with-logic-r2f5b20a0a8dc5d57-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>{deleteItem.category_name}</strong> 下目前存在 <strong data-api-unique-id='categorymanagementview-skeleton-with-logic-r4cea5f6270e6a3e9-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>{deleteItem.product_count}</strong> 个商品！<br data-api-unique-id='categorymanagementview-skeleton-with-logic-rb0f967b3930bc913-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic' />
                  强制要求先将相关商品转移改绑到其他分类后，才能执行删除操作。当前确认动作已被锁定。
                </> : <>确定要删除分类 <strong data-api-unique-id='categorymanagementview-skeleton-with-logic-rb7f7a254d9a1ba7f-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>{deleteItem?.category_name}</strong> 吗？此操作无法撤销。</>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter data-api-unique-id='categorymanagementview-skeleton-with-logic-r55879666334895d5-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
            <AlertDialogCancel disabled={isDeleting} data-api-unique-id='categorymanagementview-skeleton-with-logic-r24da22e94d37386f-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>取消</AlertDialogCancel>
            <AlertDialogAction onClick={e => {
            e.preventDefault();
            confirmDelete();
          }} disabled={isDeleting || (deleteItem?.product_count ?? 0) > 0} data-api-unique-id='categorymanagementview-skeleton-with-logic-r09cad4effefb4a78-s3880180777' data-api-unique-page-name='src/backend/components/CategoryManagementView_skeleton_with_logic'>
              确认
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
}