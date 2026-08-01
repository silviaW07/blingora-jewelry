'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserManagement } from '@/backend/route-params';
import { getUserList, getUserDetail, updateUserStatus, deleteUser } from '@/backend/actions/UserManagement';
import type { SysUserRole, SysUserStatus, UserListItem, UserDetail } from '@/backend/actions/UserManagement';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';

// ===== 枚举映射 =====
const STATUS_LABELS: Record<SysUserStatus, string> = {
  ACTIVE: '激活',
  DISABLED: '禁用'
};
const ROLE_LABELS: Record<SysUserRole, string> = {
  CUSTOMER: '普通客户',
  ADMIN: '管理员'
};
type FilterFields = {
  account: string;
  email: string;
};
export default function UserManagementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ===== 页面入参 =====
  const urlParams = useMemo(() => UserManagement.getParams(searchParams), [searchParams]);

  // ===== State =====
  const [localFilters, setLocalFilters] = useState({
    account: urlParams.account,
    email: urlParams.email
  });
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<UserListItem[]>([]);
  const [total, setTotal] = useState(0);

  // 抽屉详情状态
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<UserDetail | null>(null);

  // 删除弹窗状态
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserListItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // IME 处理
  const isComposingRef = useRef(false);

  // 同步 URL 参数到本地状态 (应对浏览器前进后退)
  useEffect(() => {
    setLocalFilters({
      account: urlParams.account,
      email: urlParams.email
    });
  }, [urlParams]);

  // ===== 获取列表数据 =====
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getUserList({
        account: urlParams.account,
        email: urlParams.email,
        role: urlParams.role as SysUserRole | '',
        status: urlParams.status as SysUserStatus | '',
        page,
        pageSize
      });
      setList(result.list);
      setTotal(result.total);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [urlParams, page, pageSize]);
  useEffect(() => {
    loadData();
  }, [loadData]);

  // ===== Handlers =====

  // 场景 A: 文本输入，带有副作用 (触发路由更新)
  const handleTextChange = <K extends keyof FilterFields,>(field: K, value: FilterFields[K]) => {
    setLocalFilters(prev => ({
      ...prev,
      [field]: value
    }));
    if (!isComposingRef.current) {
      UserManagement.navigateToWithFilters(router, {
        ...urlParams,
        [field]: value
      });
      setPage(1);
    }
  };
  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };
  const handleCompositionEnd = <K extends keyof FilterFields,>(field: K) => {
    isComposingRef.current = false;
    UserManagement.navigateToWithFilters(router, {
      ...urlParams,
      [field]: localFilters[field]
    });
    setPage(1);
  };

  // 角色/状态筛选 (Select 不涉及 IME)
  const handleSelectChange = (key: 'role' | 'status', val: string) => {
    const finalVal = val === 'ALL' ? '' : val;
    UserManagement.navigateToWithFilters(router, {
      ...urlParams,
      [key]: finalVal
    });
    setPage(1);
  };
  const handleResetFilters = () => {
    setLocalFilters({
      account: '',
      email: ''
    });
    UserManagement.navigateToDefault(router);
    setPage(1);
  };
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > Math.ceil(total / pageSize)) return;
    setPage(newPage);
  };

  // 操作 - 详情
  const handleOpenDetail = async (id: string) => {
    setDetailSheetOpen(true);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const data = await getUserDetail({
        id
      });
      setDetailData(data);
    } catch (e: any) {
      toast.error(e.message);
      setDetailSheetOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // 操作 - 切换状态
  const handleToggleStatus = async (id: string, currentStatus: SysUserStatus, source: 'list' | 'detail') => {
    const targetStatus: SysUserStatus = currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    try {
      await updateUserStatus({
        id,
        status: targetStatus
      });
      toast.success('状态更新成功');
      loadData();
      if (source === 'detail' && detailData?.id === id) {
        setDetailData({
          ...detailData,
          status: targetStatus
        });
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // 操作 - 删除
  const handleRequestDelete = (user: UserListItem) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setActionLoading(true);
    try {
      await deleteUser({
        id: userToDelete.id
      });
      toast.success('用户删除成功');
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      // 若删除后当前页空了且非第一页，则往前一页，否则原地刷新
      if (list.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        loadData();
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  // 格式化时间的 Helper
  const formatDateTime = useCallback((isoString: string | null) => {
    if (!isoString) return '-';
    try {
      return new Date(isoString).toLocaleString();
    } catch {
      return isoString;
    }
  }, []);
  const totalPages = Math.ceil(total / pageSize) || 1;

  // ===== Render =====
  return <div data-api-unique-id='usermanagementview-skeleton-with-logic-r29dd38c4d32c8b48-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>
      <header data-api-unique-id='usermanagementview-skeleton-with-logic-rb6d9cc0813252634-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>
        <h2 data-api-unique-id='usermanagementview-skeleton-with-logic-r461294668d379e49-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>用户管理</h2>
        <p data-api-unique-id='usermanagementview-skeleton-with-logic-r2222cb466841ad57-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>当前系统共检索到 {total} 名用户</p>
      </header>

      <section data-api-unique-id='usermanagementview-skeleton-with-logic-r4a197f935643a65f-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>
        <div data-api-unique-id='usermanagementview-skeleton-with-logic-raf9a785014a5e00a-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>
          <Input placeholder="账户名搜索..." value={localFilters.account} onChange={e => handleTextChange('account', e.target.value)} onCompositionStart={handleCompositionStart} onCompositionEnd={() => handleCompositionEnd('account')} data-api-unique-id='usermanagementview-skeleton-with-logic-r395eb58ec786826a-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic' />
          <Input placeholder="邮箱地址搜索..." value={localFilters.email} onChange={e => handleTextChange('email', e.target.value)} onCompositionStart={handleCompositionStart} onCompositionEnd={() => handleCompositionEnd('email')} data-api-unique-id='usermanagementview-skeleton-with-logic-r8356ef9703cc270d-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic' />
          <Select value={urlParams.role || 'ALL'} onValueChange={val => handleSelectChange('role', val)} data-api-unique-id='usermanagementview-skeleton-with-logic-r75eb027f47c49763-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>
            <SelectTrigger data-api-unique-id='usermanagementview-skeleton-with-logic-r426cd26e2e9fac50-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>
              <SelectValue placeholder="所有角色" data-api-unique-id='usermanagementview-skeleton-with-logic-r1295f2c14b26f7ac-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic' />
            </SelectTrigger>
            <SelectContent data-api-unique-id='usermanagementview-skeleton-with-logic-r9577e02153c4cd52-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>
              <SelectItem value="ALL" data-api-unique-id='usermanagementview-skeleton-with-logic-read3ce7b393b09ff-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>全部角色</SelectItem>
              <SelectItem value="CUSTOMER" data-api-unique-id='usermanagementview-skeleton-with-logic-rd3040b342fee1f70-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>{ROLE_LABELS['CUSTOMER']}</SelectItem>
              <SelectItem value="ADMIN" data-api-unique-id='usermanagementview-skeleton-with-logic-r263e9f4f3641ae7f-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>{ROLE_LABELS['ADMIN']}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={urlParams.status || 'ALL'} onValueChange={val => handleSelectChange('status', val)} data-api-unique-id='usermanagementview-skeleton-with-logic-rf9c653989ce2e4da-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>
            <SelectTrigger data-api-unique-id='usermanagementview-skeleton-with-logic-r428cda3fb61b153a-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>
              <SelectValue placeholder="所有状态" data-api-unique-id='usermanagementview-skeleton-with-logic-r05f01f82ae916841-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic' />
            </SelectTrigger>
            <SelectContent data-api-unique-id='usermanagementview-skeleton-with-logic-r4643d078cd273165-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>
              <SelectItem value="ALL" data-api-unique-id='usermanagementview-skeleton-with-logic-rc309cee77939417c-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>全部状态</SelectItem>
              <SelectItem value="ACTIVE" data-api-unique-id='usermanagementview-skeleton-with-logic-r0206c0aa256daf21-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>{STATUS_LABELS['ACTIVE']}</SelectItem>
              <SelectItem value="DISABLED" data-api-unique-id='usermanagementview-skeleton-with-logic-r6e81cdd4f7371641-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>{STATUS_LABELS['DISABLED']}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleResetFilters} data-api-unique-id='usermanagementview-skeleton-with-logic-r7210d5ca8e59f553-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>
            重置条件
          </Button>
        </div>
      </section>

      <section data-api-unique-id='usermanagementview-skeleton-with-logic-r649eeb1ad5835c96-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>
        <Table data-api-unique-id='usermanagementview-skeleton-with-logic-ra0198491728ae425-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>
          <TableHeader data-api-unique-id='usermanagementview-skeleton-with-logic-ra0bce97725044d76-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>
            <TableRow data-api-unique-id='usermanagementview-skeleton-with-logic-r53519bf356267ca7-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>
              <TableHead data-api-unique-id='usermanagementview-skeleton-with-logic-r46a88b237f1aa9f6-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>账户名</TableHead>
              <TableHead data-api-unique-id='usermanagementview-skeleton-with-logic-ree74a9f951aeb346-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>邮箱</TableHead>
              <TableHead data-api-unique-id='usermanagementview-skeleton-with-logic-r6e0b6f472e15f86e-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>角色</TableHead>
              <TableHead data-api-unique-id='usermanagementview-skeleton-with-logic-re503a809fa8cb7b6-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>注册时间</TableHead>
              <TableHead data-api-unique-id='usermanagementview-skeleton-with-logic-r6e796432547d6b35-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>购物车商品数</TableHead>
              <TableHead data-api-unique-id='usermanagementview-skeleton-with-logic-red79268d86014a61-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>状态</TableHead>
              <TableHead data-api-unique-id='usermanagementview-skeleton-with-logic-r50bedf899d6871fa-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody data-api-unique-id='usermanagementview-skeleton-with-logic-r25f7809abbd05f8b-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>
            {loading ? <TableRow data-api-unique-id='usermanagementview-skeleton-with-logic-r81e44a406998e1c8-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>
                <TableCell colSpan={7} data-api-unique-id='usermanagementview-skeleton-with-logic-r2e5d0ca26e3f4798-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>数据加载中...</TableCell>
              </TableRow> : list.length === 0 ? <TableRow data-api-unique-id='usermanagementview-skeleton-with-logic-r35ca33255dd1e8c0-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>
                <TableCell colSpan={7} data-api-unique-id='usermanagementview-skeleton-with-logic-raa845b4773a0e5e0-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>暂无符合条件的用户</TableCell>
              </TableRow> : list.map((user, index) => <TableRow key={user.id} data-api-unique-id='usermanagementview-skeleton-with-logic-r380ae30283b3fe33-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic' data-api-in-loop='1'>
                  <TableCell data-api-unique-id='usermanagementview-skeleton-with-logic-r8e7634ef2493fa08-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`list-${index}-account`} data-api-map-var-name='user'>{user.account}</TableCell>
                  <TableCell data-api-unique-id='usermanagementview-skeleton-with-logic-ra82d3cda42ba0800-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`list-${index}-email`} data-api-map-var-name='user'>{user.email}</TableCell>
                  <TableCell data-api-unique-id='usermanagementview-skeleton-with-logic-ra7c3f55bb95bf57a-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic' data-api-in-loop='1'>{ROLE_LABELS[user.role]}</TableCell>
                  <TableCell data-api-unique-id='usermanagementview-skeleton-with-logic-r4e735ff23d6bbabd-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic' data-api-in-loop='1'>{formatDateTime(user.createdAt)}</TableCell>
                  <TableCell data-api-unique-id='usermanagementview-skeleton-with-logic-r93613a37cfc19f12-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`list-${index}-cartItemCount`} data-api-map-var-name='user'>{user.cartItemCount}</TableCell>
                  <TableCell data-api-unique-id='usermanagementview-skeleton-with-logic-r0585c13610a870e4-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic' data-api-in-loop='1'>
                    {STATUS_LABELS[user.status]}
                  </TableCell>
                  <TableCell data-api-unique-id='usermanagementview-skeleton-with-logic-r3b911e5c106679e8-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic' data-api-in-loop='1'>
                    <Button variant="ghost" onClick={() => handleOpenDetail(user.id)} data-api-unique-id='usermanagementview-skeleton-with-logic-re22e670f4cc1a6aa-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic' data-api-in-loop='1'>详情</Button>
                    <Button variant="ghost" onClick={() => handleToggleStatus(user.id, user.status, 'list')} data-api-unique-id='usermanagementview-skeleton-with-logic-r30d7c6e16cd64469-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic' data-api-in-loop='1'>
                      {user.status === 'ACTIVE' ? '禁用' : '启用'}
                    </Button>
                    <Button variant="destructive" onClick={() => handleRequestDelete(user)} data-api-unique-id='usermanagementview-skeleton-with-logic-rb639b688ec077fce-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic' data-api-in-loop='1'>
                      删除
                    </Button>
                  </TableCell>
                </TableRow>)}
          </TableBody>
        </Table>

        {/* 分页器 */}
        {!loading && total > 0 && <div data-api-unique-id='usermanagementview-skeleton-with-logic-r2b00f768bbe6ba9a-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>
            <span data-api-unique-id='usermanagementview-skeleton-with-logic-r53560b4835d798ba-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>共 {total} 条数据，当前 {page} / {totalPages} 页</span>
            <Button variant="outline" disabled={page <= 1} onClick={() => handlePageChange(page - 1)} data-api-unique-id='usermanagementview-skeleton-with-logic-rbba67eb900c76fae-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>
              上一页
            </Button>
            <Button variant="outline" disabled={page >= totalPages} onClick={() => handlePageChange(page + 1)} data-api-unique-id='usermanagementview-skeleton-with-logic-rab16885bc59633df-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>
              下一页
            </Button>
          </div>}
      </section>

      {/* 详情侧边抽屉 */}
      <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen} data-api-unique-id='usermanagementview-skeleton-with-logic-rb25cf692abec46e8-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>
        <SheetContent data-api-unique-id='usermanagementview-skeleton-with-logic-rea38f33aafaf67ca-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>
          <SheetHeader data-api-unique-id='usermanagementview-skeleton-with-logic-r67f5cc3567d1a76c-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>
            <SheetTitle data-api-unique-id='usermanagementview-skeleton-with-logic-rb8df68bec1d40b12-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>用户详情</SheetTitle>
          </SheetHeader>
          <div data-api-unique-id='usermanagementview-skeleton-with-logic-r388f9610dbbbc401-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>
            {detailLoading ? <p data-api-unique-id='usermanagementview-skeleton-with-logic-ra98b91d83bd0ebdb-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>加载中...</p> : detailData ? <div data-api-unique-id='usermanagementview-skeleton-with-logic-r8f16fd1ce1bff4cc-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>
                <section data-api-unique-id='usermanagementview-skeleton-with-logic-rb6f2c0f6c2d2c15d-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>
                  <h3 data-api-unique-id='usermanagementview-skeleton-with-logic-r3f309e9268ac0002-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>基础信息</h3>
                  <p data-api-unique-id='usermanagementview-skeleton-with-logic-r121b94b877d1fb92-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>用户 ID: {detailData.id}</p>
                  <p data-api-unique-id='usermanagementview-skeleton-with-logic-r40dec36f11a1fb9c-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>账户名: {detailData.account}</p>
                  <p data-api-unique-id='usermanagementview-skeleton-with-logic-rb9ff3d2f661d437e-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>邮箱: {detailData.email}</p>
                  <p data-api-unique-id='usermanagementview-skeleton-with-logic-r8e001c5b4728a2e6-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>角色: {ROLE_LABELS[detailData.role]}</p>
                  <p data-api-unique-id='usermanagementview-skeleton-with-logic-r24aca0b9ad4e3681-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>注册时间: {formatDateTime(detailData.createdAt)}</p>
                </section>
                <section data-api-unique-id='usermanagementview-skeleton-with-logic-r9b63b6d3a488b221-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>
                  <h3 data-api-unique-id='usermanagementview-skeleton-with-logic-r76a87b9c303d0528-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>安全与活动</h3>
                  <p data-api-unique-id='usermanagementview-skeleton-with-logic-r83a47a19c0f7e1d7-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>最近登录时间: {formatDateTime(detailData.lastLoginAt)}</p>
                </section>
                <section data-api-unique-id='usermanagementview-skeleton-with-logic-r4f32da3679a3f097-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>
                  <h3 data-api-unique-id='usermanagementview-skeleton-with-logic-r4a7afbed951c99b5-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>业务摘要</h3>
                  <p data-api-unique-id='usermanagementview-skeleton-with-logic-r99dcb6ac95f8d32c-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>购物车 ID: {detailData.cartId || '暂无'}</p>
                  <p data-api-unique-id='usermanagementview-skeleton-with-logic-r3441de9a0968abc3-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>购物车商品总数: {detailData.cartItemCount}</p>
                </section>
                <section data-api-unique-id='usermanagementview-skeleton-with-logic-rba89be263580ba8c-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>
                  <h3 data-api-unique-id='usermanagementview-skeleton-with-logic-rc637a6755633e837-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>状态管理</h3>
                  <p data-api-unique-id='usermanagementview-skeleton-with-logic-rcdcb876917265cde-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>当前状态: {STATUS_LABELS[detailData.status]}</p>
                  <div data-api-unique-id='usermanagementview-skeleton-with-logic-r423cfe3a2a8bbd0e-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>
                    <label data-api-unique-id='usermanagementview-skeleton-with-logic-r957d47da9b25cf4a-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>切换状态 (禁用后对登录及购物车使用产生影响)</label>
                    <Switch checked={detailData.status === 'ACTIVE'} onCheckedChange={() => handleToggleStatus(detailData.id, detailData.status, 'detail')} data-api-unique-id='usermanagementview-skeleton-with-logic-r7e4e40d2063d1666-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic' />
                  </div>
                </section>
              </div> : <p data-api-unique-id='usermanagementview-skeleton-with-logic-rf2c92639491279e0-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>未找到数据</p>}
          </div>
        </SheetContent>
      </Sheet>

      {/* 风险操作确认弹窗 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} data-api-unique-id='usermanagementview-skeleton-with-logic-rf84d2ed47e3b25f1-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>
        <AlertDialogContent data-api-unique-id='usermanagementview-skeleton-with-logic-r642a35c8619441b6-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>
          <AlertDialogHeader data-api-unique-id='usermanagementview-skeleton-with-logic-r2b3e39bfc8c1fc36-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>
            <AlertDialogTitle data-api-unique-id='usermanagementview-skeleton-with-logic-r1175019213c99eea-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>确认删除用户</AlertDialogTitle>
            <AlertDialogDescription data-api-unique-id='usermanagementview-skeleton-with-logic-ra86b945510b60827-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>
              警告：确定要删除账户 [{userToDelete?.account}] ({userToDelete?.email}) 吗？
              这将清空该用户购物车数据并永久移除账号记录。该操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter data-api-unique-id='usermanagementview-skeleton-with-logic-r2f39c76c5faa624b-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>
            <AlertDialogCancel disabled={actionLoading} data-api-unique-id='usermanagementview-skeleton-with-logic-r21bc207ab59c6662-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>取消</AlertDialogCancel>
            <AlertDialogAction disabled={actionLoading} onClick={handleConfirmDelete} data-api-unique-id='usermanagementview-skeleton-with-logic-reb87603a79af099a-s2429533738' data-api-unique-page-name='src/backend/components/UserManagementView_skeleton_with_logic'>
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
}