'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CategoryManagement } from '@/backend/route-params';
import { toast } from 'sonner';
import { upload_image_file } from '@/tools/tools';
import type { BannerFilterStatus, BannerItem, CreateBannerInput, UpdateBannerInput } from '@/backend/actions/BannerManagement';
import { getBannerList, createBanner, updateBanner, deleteBanner, batchDeleteBanners, batchUpdateBannerStatus, updateBannerSortWeight, updateBannerStatus } from '@/backend/actions/BannerManagement';

// ===== 枚举映射 =====
const STATUS_LABELS: Record<BannerFilterStatus, string> = {
  ALL: '全部状态',
  ENABLED: '已启用',
  DISABLED: '已禁用'
};

// ===== 类型定义 =====
type FormMode = 'CREATE' | 'EDIT' | null;
export default function BannerManagementPage() {
  const router = useRouter();

  // ===== 状态管理 =====
  // 列表数据
  const [loading, setLoading] = useState<boolean>(true);
  const [list, setList] = useState<BannerItem[]>([]);
  const [total, setTotal] = useState<number>(0);

  // 筛选项与分页 (实际生效的查询条件)
  const [filterKeyword, setFilterKeyword] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<BannerFilterStatus>('ALL');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // 工具栏交互状态
  const [inputKeyword, setInputKeyword] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 行内编辑权重状态字典
  const [editingWeights, setEditingWeights] = useState<Record<string, number>>({});

  // 弹窗表单状态
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [formData, setFormData] = useState<CreateBannerInput | UpdateBannerInput | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // ===== 数据获取 =====
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getBannerList({
        search_keyword: filterKeyword,
        filter_status: filterStatus,
        page,
        page_size: pageSize
      });
      setList(data.list);
      setTotal(data.total);
      setSelectedIds([]);
      setEditingWeights({});
    } catch (error: any) {
      toast.error(error.message || '获取列表失败');
    } finally {
      setLoading(false);
    }
  }, [filterKeyword, filterStatus, page, pageSize]);
  useEffect(() => {
    loadData();
  }, [loadData]);

  // ===== 列表与工具栏交互 =====
  const handleSearch = () => {
    setFilterKeyword(inputKeyword);
    setPage(1);
  };
  const handleReset = () => {
    setInputKeyword('');
    setFilterKeyword('');
    setFilterStatus('ALL');
    setPage(1);
  };
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(list.map((item, index) => item.banner_id));
    } else {
      setSelectedIds([]);
    }
  };
  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return toast.warning('请先选择要删除的项');
    if (!window.confirm(`确定要删除选中的 ${selectedIds.length} 项吗？`)) return;
    try {
      await batchDeleteBanners({
        banner_ids: selectedIds
      });
      toast.success('批量删除成功');
      loadData();
    } catch (error: any) {
      toast.error(error.message || '批量删除失败');
    }
  };
  const handleBatchUpdateStatus = async (targetStatus: boolean) => {
    if (selectedIds.length === 0) return toast.warning('请先选择要操作的项');
    try {
      await batchUpdateBannerStatus({
        banner_ids: selectedIds,
        banner_isEnabled: targetStatus
      });
      toast.success(`批量${targetStatus ? '启用' : '禁用'}成功`);
      loadData();
    } catch (error: any) {
      toast.error(error.message || '批量更新状态失败');
    }
  };
  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除此项吗？')) return;
    try {
      await deleteBanner({
        banner_id: id
      });
      toast.success('删除成功');
      loadData();
    } catch (error: any) {
      toast.error(error.message || '删除失败');
    }
  };
  const handleQuickUpdateStatus = async (id: string, newStatus: boolean) => {
    try {
      await updateBannerStatus({
        banner_id: id,
        banner_isEnabled: newStatus
      });
      toast.success('状态更新成功');
      loadData();
    } catch (error: any) {
      toast.error(error.message || '状态更新失败');
    }
  };
  const handleQuickUpdateSortWeight = async (id: string, originalWeight: number) => {
    const newWeight = editingWeights[id];
    if (newWeight === undefined || newWeight === originalWeight) return; // 未改变或未编辑

    try {
      await updateBannerSortWeight({
        banner_id: id,
        banner_sortWeight: newWeight
      });
      toast.success('排序更新成功');
      loadData();
    } catch (error: any) {
      toast.error(error.message || '排序更新失败');
    }
  };
  const handleCopyLink = (link: string) => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    toast.success('链接已复制');
  };

  // ===== 表单与弹窗 =====
  const openCreateModal = () => {
    setFormMode('CREATE');
    setFormData({
      banner_title: '',
      banner_imageUrl: '',
      banner_linkUrl: '',
      banner_sortWeight: 0,
      banner_isEnabled: true
    });
  };
  const openEditModal = (item: BannerItem) => {
    setFormMode('EDIT');
    setFormData({
      banner_id: item.banner_id,
      banner_title: item.banner_title || '',
      banner_imageUrl: item.banner_imageUrl,
      banner_linkUrl: item.banner_linkUrl,
      banner_sortWeight: item.banner_sortWeight,
      banner_isEnabled: item.banner_isEnabled
    });
  };
  const closeFormModal = () => {
    setFormMode(null);
    setFormData(null);
  };
  const handleFormFieldChange = <K extends keyof (CreateBannerInput & UpdateBannerInput),>(field: K, value: any) => {
    setFormData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [field]: value
      } as any;
    });
  };
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const url = await upload_image_file(file);
      handleFormFieldChange('banner_imageUrl', url);
    } catch (error: any) {
      toast.error(error.message || '上传图片失败');
    } finally {
      setUploading(false);
      // 清空 input file 的 value，允许重复选择同一文件
      if (e.target) e.target.value = '';
    }
  };
  const handleFormSubmit = async () => {
    if (!formData) return;
    if (!formData.banner_imageUrl) return toast.error('请上传封面图');
    try {
      setSubmitting(true);
      if (formMode === 'CREATE') {
        await createBanner(formData as CreateBannerInput);
        toast.success('新增成功');
      } else if (formMode === 'EDIT') {
        await updateBanner(formData as UpdateBannerInput);
        toast.success('编辑成功');
      }
      closeFormModal();
      loadData();
    } catch (error: any) {
      toast.error(error.message || '保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  // ===== 渲染逻辑 =====
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const isAllSelected = list.length > 0 && selectedIds.length === list.length;
  return <div data-api-unique-id='bannermanagementview-skeleton-with-logic-r25ae34656e1c8bb0-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>
      {/* 快捷跳转区 */}
      <div data-api-unique-id='bannermanagementview-skeleton-with-logic-rc36a100f4bcd26fa-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>
        <button onClick={() => CategoryManagement.navigateToAll(router)} data-api-unique-id='bannermanagementview-skeleton-with-logic-rc67f56755fd83d04-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>
          前往相关页面：分类管理
        </button>
      </div>

      {/* 筛选与操作工具栏 */}
      <section data-api-unique-id='bannermanagementview-skeleton-with-logic-rfa17936991051a45-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>
        <div data-api-unique-id='bannermanagementview-skeleton-with-logic-r73189db4a9e4c509-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>
          <input type="text" placeholder="搜索 Banner 标题" value={inputKeyword} onChange={e => setInputKeyword(e.target.value)} data-api-unique-id='bannermanagementview-skeleton-with-logic-r7725404754727519-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic' />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as BannerFilterStatus)} data-api-unique-id='bannermanagementview-skeleton-with-logic-rd37b58b2dfdaac00-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>
            {Object.entries(STATUS_LABELS).map(([val, label], index) => <option key={val} value={val} data-api-unique-id='bannermanagementview-skeleton-with-logic-r9ce71593290189c8-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic' data-api-in-loop='1'>{label}</option>)}
          </select>
          <button onClick={handleSearch} data-api-unique-id='bannermanagementview-skeleton-with-logic-r0f68b00c6ff75231-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>查询</button>
          <button onClick={handleReset} data-api-unique-id='bannermanagementview-skeleton-with-logic-rdc6d51fac4e4e020-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>重置</button>
        </div>

        <div data-api-unique-id='bannermanagementview-skeleton-with-logic-r4b3676a2c90d1884-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>
          <button onClick={handleBatchDelete} disabled={selectedIds.length === 0} data-api-unique-id='bannermanagementview-skeleton-with-logic-rc6de7f0dc5327472-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>
            批量删除
          </button>
          <button onClick={() => handleBatchUpdateStatus(true)} disabled={selectedIds.length === 0} data-api-unique-id='bannermanagementview-skeleton-with-logic-re214f09bb582506c-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>
            批量启用
          </button>
          <button onClick={() => handleBatchUpdateStatus(false)} disabled={selectedIds.length === 0} data-api-unique-id='bannermanagementview-skeleton-with-logic-r717b483588aca00f-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>
            批量禁用
          </button>
          <button onClick={openCreateModal} data-api-unique-id='bannermanagementview-skeleton-with-logic-r150db5524cf1c365-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>新增 Banner</button>
        </div>
      </section>

      {/* 数据列表区 */}
      <section data-api-unique-id='bannermanagementview-skeleton-with-logic-r40a901dd3403a0e4-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>
        {loading ? <div data-api-unique-id='bannermanagementview-skeleton-with-logic-r98d26b0d9fef6e37-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>加载中...</div> : list.length === 0 ? <div data-api-unique-id='bannermanagementview-skeleton-with-logic-r17aeef2febaededf-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>暂无数据</div> : <table data-api-unique-id='bannermanagementview-skeleton-with-logic-r380667810435fb44-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>
            <thead data-api-unique-id='bannermanagementview-skeleton-with-logic-rb884e36a07629ddd-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>
              <tr data-api-unique-id='bannermanagementview-skeleton-with-logic-re20d0746fd03fea3-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>
                <th data-api-unique-id='bannermanagementview-skeleton-with-logic-r7ff92288a9bbb645-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>
                  <input type="checkbox" checked={isAllSelected} onChange={e => handleSelectAll(e.target.checked)} data-api-unique-id='bannermanagementview-skeleton-with-logic-rb73baa82e26b467d-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic' />
                </th>
                <th data-api-unique-id='bannermanagementview-skeleton-with-logic-r4ce78a885744db39-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>封面图</th>
                <th data-api-unique-id='bannermanagementview-skeleton-with-logic-rc1d6abfa7706083e-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>标题</th>
                <th data-api-unique-id='bannermanagementview-skeleton-with-logic-red7c672763362018-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>跳转链接</th>
                <th data-api-unique-id='bannermanagementview-skeleton-with-logic-rcf1bf80af9cfe39d-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>排序权重</th>
                <th data-api-unique-id='bannermanagementview-skeleton-with-logic-rd5380b345553d5dc-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>状态</th>
                <th data-api-unique-id='bannermanagementview-skeleton-with-logic-recc542268c215e07-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>更新时间</th>
                <th data-api-unique-id='bannermanagementview-skeleton-with-logic-r8d3a7d5f1f6bc457-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>操作</th>
              </tr>
            </thead>
            <tbody data-api-unique-id='bannermanagementview-skeleton-with-logic-rf763964beb2c3c68-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>
              {list.map((item, index) => <tr key={item.banner_id} data-api-unique-id='bannermanagementview-skeleton-with-logic-r1159145568f84ce4-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic' data-api-in-loop='1'>
                  <td data-api-unique-id='bannermanagementview-skeleton-with-logic-rb6bb01a1c4e09f97-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic' data-api-in-loop='1'>
                    <input type="checkbox" checked={selectedIds.includes(item.banner_id)} onChange={e => handleSelectRow(item.banner_id, e.target.checked)} data-api-unique-id='bannermanagementview-skeleton-with-logic-r8a4f8af630ae4cac-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic' data-api-in-loop='1' />
                  </td>
                  <td data-api-unique-id='bannermanagementview-skeleton-with-logic-rc8126aa60361478e-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic' data-api-in-loop='1'>
                    {item.banner_imageUrl ? <img src={item.banner_imageUrl} alt={item.banner_title || 'Banner图'} data-api-unique-id='bannermanagementview-skeleton-with-logic-r896c8610b2a597c0-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic' data-api-in-loop='1' /> : <span data-api-unique-id='bannermanagementview-skeleton-with-logic-r29dd8fc95695ba31-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic' data-api-in-loop='1'>暂无图片</span>}
                  </td>
                  <td data-api-unique-id='bannermanagementview-skeleton-with-logic-ra7ff146ebbbd5311-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic' data-api-in-loop='1'>{item.banner_title || '-'}</td>
                  <td data-api-unique-id='bannermanagementview-skeleton-with-logic-rb5378c7afec6398a-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic' data-api-in-loop='1'>
                    {item.banner_linkUrl ? <div data-api-unique-id='bannermanagementview-skeleton-with-logic-ra33429a182b7d736-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic' data-api-in-loop='1'>
                        <span data-api-unique-id='bannermanagementview-skeleton-with-logic-r02091a0cc1298026-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`list-${index}-banner_linkUrl`} data-api-map-var-name='item'>{item.banner_linkUrl}</span>
                        <button onClick={() => handleCopyLink(item.banner_linkUrl)} data-api-unique-id='bannermanagementview-skeleton-with-logic-rb11cdbdcfc17baeb-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic' data-api-in-loop='1'>复制</button>
                        <a href={item.banner_linkUrl} target="_blank" rel="noreferrer" data-api-unique-id='bannermanagementview-skeleton-with-logic-rc03d26cd90072ff3-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic' data-api-in-loop='1'>跳转</a>
                      </div> : '-'}
                  </td>
                  <td data-api-unique-id='bannermanagementview-skeleton-with-logic-r815ca6baaf2dea9b-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic' data-api-in-loop='1'>
                    <input type="number" value={editingWeights[item.banner_id] ?? item.banner_sortWeight} onChange={e => setEditingWeights(prev => ({
                ...prev,
                [item.banner_id]: Number(e.target.value)
              }))} onBlur={() => handleQuickUpdateSortWeight(item.banner_id, item.banner_sortWeight)} data-api-unique-id='bannermanagementview-skeleton-with-logic-rdb0277a9e640469c-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic' data-api-in-loop='1' />
                  </td>
                  <td data-api-unique-id='bannermanagementview-skeleton-with-logic-ra75b1349d108a3f7-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic' data-api-in-loop='1'>
                    <input type="checkbox" checked={item.banner_isEnabled} onChange={e => handleQuickUpdateStatus(item.banner_id, e.target.checked)} data-api-unique-id='bannermanagementview-skeleton-with-logic-rc2d6c79cac67daec-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic' data-api-in-loop='1' />
                    <span data-api-unique-id='bannermanagementview-skeleton-with-logic-rd9940fe773af606a-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic' data-api-in-loop='1'>{item.banner_isEnabled ? '已启用' : '已禁用'}</span>
                  </td>
                  <td data-api-unique-id='bannermanagementview-skeleton-with-logic-r93d58a23fab437c6-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic' data-api-in-loop='1'>
                    {new Date(item.banner_updatedAt).toLocaleString()}
                  </td>
                  <td data-api-unique-id='bannermanagementview-skeleton-with-logic-rb738bc38c061f6e6-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic' data-api-in-loop='1'>
                    <button onClick={() => openEditModal(item)} data-api-unique-id='bannermanagementview-skeleton-with-logic-r6f3ae7b8803eac45-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic' data-api-in-loop='1'>编辑</button>
                    <button onClick={() => handleDelete(item.banner_id)} data-api-unique-id='bannermanagementview-skeleton-with-logic-r522ce18c0815746e-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic' data-api-in-loop='1'>删除</button>
                  </td>
                </tr>)}
            </tbody>
          </table>}

        {/* 分页器 */}
        <div data-api-unique-id='bannermanagementview-skeleton-with-logic-rd9c83c91fffe36ab-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>
          <span data-api-unique-id='bannermanagementview-skeleton-with-logic-r95a5e3a412a7f8c2-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>共 {total} 条</span>
          <select value={pageSize} onChange={e => {
          setPageSize(Number(e.target.value));
          setPage(1);
        }} data-api-unique-id='bannermanagementview-skeleton-with-logic-rbecfd659b79f9c8f-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>
            <option value={10} data-api-unique-id='bannermanagementview-skeleton-with-logic-r2467964046f3841e-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>10 条/页</option>
            <option value={20} data-api-unique-id='bannermanagementview-skeleton-with-logic-re7116e2fba55de7b-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>20 条/页</option>
            <option value={50} data-api-unique-id='bannermanagementview-skeleton-with-logic-r5d87f83f64e6190c-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>50 条/页</option>
          </select>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} data-api-unique-id='bannermanagementview-skeleton-with-logic-r5b032995ce13c4d9-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>
            上一页
          </button>
          <span data-api-unique-id='bannermanagementview-skeleton-with-logic-r2479dbce30372485-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>
            {page} / {totalPages}
          </span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} data-api-unique-id='bannermanagementview-skeleton-with-logic-re76b8de67a2a6ab1-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>
            下一页
          </button>
        </div>
      </section>

      {/* 弹窗：新增/编辑 */}
      {formMode && formData && <dialog open data-api-unique-id='bannermanagementview-skeleton-with-logic-r8e1fe4a8572fbff8-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>
          <div data-api-unique-id='bannermanagementview-skeleton-with-logic-rf3d50380ea6dbe4b-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>
            <h3 data-api-unique-id='bannermanagementview-skeleton-with-logic-rdf71b27085afb5e5-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>{formMode === 'CREATE' ? '新增 Banner' : '编辑 Banner'}</h3>
            <button onClick={closeFormModal} data-api-unique-id='bannermanagementview-skeleton-with-logic-ra5b15ed00080373a-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>关闭</button>
            
            <div data-api-unique-id='bannermanagementview-skeleton-with-logic-rf35d48be5280b94d-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>
              <label data-api-unique-id='bannermanagementview-skeleton-with-logic-r7b8b247a71acad16-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>标题</label>
              <input type="text" placeholder="选填" value={formData.banner_title || ''} onChange={e => handleFormFieldChange('banner_title', e.target.value)} data-api-unique-id='bannermanagementview-skeleton-with-logic-ra03e35847cf58bf5-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic' />
            </div>

            <div data-api-unique-id='bannermanagementview-skeleton-with-logic-re62b45bc3d65b047-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>
              <label data-api-unique-id='bannermanagementview-skeleton-with-logic-rc9f67cc45288c5d4-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>图片上传 (必填)</label>
              <div data-api-unique-id='bannermanagementview-skeleton-with-logic-r5682ee771e4b68e6-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>
                {formData.banner_imageUrl ? <div data-api-unique-id='bannermanagementview-skeleton-with-logic-ra97b06540e21c6de-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>
                    <img src={formData.banner_imageUrl} alt="预览图" data-api-unique-id='bannermanagementview-skeleton-with-logic-r210fa92c84bffeab-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic' />
                    <button onClick={() => handleFormFieldChange('banner_imageUrl', '')} data-api-unique-id='bannermanagementview-skeleton-with-logic-re36b68cef3a9eb32-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>
                      删除图片
                    </button>
                  </div> : <div data-api-unique-id='bannermanagementview-skeleton-with-logic-r17a1c865b5b0256f-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>
                    <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} data-api-unique-id='bannermanagementview-skeleton-with-logic-r5a4ac9fab01a0747-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic' />
                    {uploading && <span data-api-unique-id='bannermanagementview-skeleton-with-logic-r1888666951855476-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>上传中...</span>}
                  </div>}
              </div>
            </div>

            <div data-api-unique-id='bannermanagementview-skeleton-with-logic-r92f8943f20314594-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>
              <label data-api-unique-id='bannermanagementview-skeleton-with-logic-rab4693bfae3ce906-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>跳转链接</label>
              <input type="url" placeholder="输入以 http/https 开头的链接" value={formData.banner_linkUrl} onChange={e => handleFormFieldChange('banner_linkUrl', e.target.value)} data-api-unique-id='bannermanagementview-skeleton-with-logic-r6adcaebe947561da-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic' />
            </div>

            <div data-api-unique-id='bannermanagementview-skeleton-with-logic-r19e8289a3081afca-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>
              <label data-api-unique-id='bannermanagementview-skeleton-with-logic-rd04cd2e2753bca1b-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>排序权重</label>
              <input type="number" value={formData.banner_sortWeight} onChange={e => handleFormFieldChange('banner_sortWeight', Number(e.target.value))} data-api-unique-id='bannermanagementview-skeleton-with-logic-r6e79f0f7c9585bcd-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic' />
            </div>

            <div data-api-unique-id='bannermanagementview-skeleton-with-logic-r1b02245483479965-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>
              <label data-api-unique-id='bannermanagementview-skeleton-with-logic-raab661f257e39566-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>启用状态</label>
              <input type="checkbox" checked={formData.banner_isEnabled} onChange={e => handleFormFieldChange('banner_isEnabled', e.target.checked)} data-api-unique-id='bannermanagementview-skeleton-with-logic-r9eea3ce7c040056b-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic' />
              <span data-api-unique-id='bannermanagementview-skeleton-with-logic-r18a2b5cad9f7f5e2-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>{formData.banner_isEnabled ? '启用' : '禁用'}</span>
            </div>

            <div data-api-unique-id='bannermanagementview-skeleton-with-logic-r8cd9763a4b6d5a03-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>
              <button onClick={closeFormModal} disabled={submitting} data-api-unique-id='bannermanagementview-skeleton-with-logic-rcf1f0b0d516842c8-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>取消</button>
              <button onClick={handleFormSubmit} disabled={submitting} data-api-unique-id='bannermanagementview-skeleton-with-logic-ra81a88a8e07fa748-s1823438417' data-api-unique-page-name='src/backend/components/BannerManagementView_skeleton_with_logic'>
                {submitting ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </dialog>}
    </div>;
}