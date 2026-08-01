'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserManagement } from '@/backend/route-params';
import {
  getUserList,
  getUserDetail,
  updateUserStatus,
  deleteUser
} from '@/backend/actions/UserManagement';
import type {
  SysUserRole,
  SysUserStatus,
  UserListItem,
  UserDetail
} from '@/backend/actions/UserManagement';
import { toast } from 'sonner';

// 内部类型定义
type FilterFields = {
  account: string;
  email: string;
};

// ===== 枚举映射 =====
const STATUS_LABELS: Record<SysUserStatus, string> = {
  ACTIVE: '激活',
  DISABLED: '禁用',
};

const ROLE_LABELS: Record<SysUserRole, string> = {
  CUSTOMER: '普通客户',
  ADMIN: '管理员',
};

export interface UserManagementState {
  /** URL 解析出的参数 */
  urlParams: ReturnType<typeof UserManagement.getParams>;
  /** 本地筛选表单状态（处理输入延迟/IME） */
  localFilters: FilterFields;
  /** 当前页码 */
  page: number;
  /** 每页条数 */
  pageSize: number;
  /** 总页数 */
  totalPages: number;
  /** 列表加载状态 */
  loading: boolean;
  /** 用户列表数据 */
  list: UserListItem[];
  /** 数据总数 */
  total: number;
  /** 详情抽屉是否开启 */
  detailSheetOpen: boolean;
  /** 详情加载状态 */
  detailLoading: boolean;
  /** 用户详情数据 */
  detailData: UserDetail | null;
  /** 删除确认对话框是否开启 */
  deleteDialogOpen: boolean;
  /** 待删除的用户对象 */
  userToDelete: UserListItem | null;
  /** 异步操作加载状态（如删除中） */
  actionLoading: boolean;
  /** 状态枚举文案映射 */
  STATUS_LABELS: Record<SysUserStatus, string>;
  /** 角色枚举文案映射 */
  ROLE_LABELS: Record<SysUserRole, string>;
}

export interface UserManagementHandlers {
  /** 处理文本输入框变更 */
  handleTextChange: <K extends keyof FilterFields>(field: K, value: FilterFields[K]) => void;
  /** 处理 IME 输入法开始 */
  handleCompositionStart: () => void;
  /** 处理 IME 输入法结束 */
  handleCompositionEnd: <K extends keyof FilterFields>(field: K) => void;
  /** 处理角色或状态下拉选择变更 */
  handleSelectChange: (key: 'role' | 'status', val: string) => void;
  /** 重置所有筛选条件 */
  handleResetFilters: () => void;
  /** 处理页码变更 */
  handlePageChange: (newPage: number) => void;
  /** 打开详情抽屉 */
  handleOpenDetail: (id: string) => Promise<void>;
  /** 切换用户激活/禁用状态 */
  handleToggleStatus: (id: string, currentStatus: SysUserStatus, source: 'list' | 'detail') => Promise<void>;
  /** 发起删除请求（打开确认框） */
  handleRequestDelete: (user: UserListItem) => void;
  /** 确认执行删除操作 */
  handleConfirmDelete: () => Promise<void>;
  /** 设置详情抽屉开关状态 */
  setDetailSheetOpen: (open: boolean) => void;
  /** 设置删除确认框开关状态 */
  setDeleteDialogOpen: (open: boolean) => void;
  /** 格式化日期时间字符串 */
  formatDateTime: (isoString: string | null) => string;
}

export function useUserManagement(): {
  state: UserManagementState;
  handlers: UserManagementHandlers;
} {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ===== 页面入参 =====
  const urlParams = useMemo(() => UserManagement.getParams(searchParams), [searchParams]);

  // ===== State =====
  const [localFilters, setLocalFilters] = useState({
    account: urlParams.account,
    email: urlParams.email,
  });
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<UserListItem[]>([]);
  const [total, setTotal] = useState(0);

  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<UserDetail | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserListItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const isComposingRef = useRef(false);

  // 同步 URL 参数到本地状态
  useEffect(() => {
    setLocalFilters({
      account: urlParams.account,
      email: urlParams.email,
    });
  }, [urlParams]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getUserList({
        account: urlParams.account,
        email: urlParams.email,
        role: urlParams.role as SysUserRole | '',
        status: urlParams.status as SysUserStatus | '',
        page,
        pageSize,
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

  const handleTextChange = <K extends keyof FilterFields>(field: K, value: FilterFields[K]) => {
    setLocalFilters(prev => ({ ...prev, [field]: value }));
    if (!isComposingRef.current) {
      UserManagement.navigateToWithFilters(router, { ...urlParams, [field]: value });
      setPage(1);
    }
  };

  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleCompositionEnd = <K extends keyof FilterFields>(field: K) => {
    isComposingRef.current = false;
    UserManagement.navigateToWithFilters(router, { ...urlParams, [field]: localFilters[field] });
    setPage(1);
  };

  const handleSelectChange = (key: 'role' | 'status', val: string) => {
    const finalVal = val === 'ALL' ? '' : val;
    UserManagement.navigateToWithFilters(router, { ...urlParams, [key]: finalVal });
    setPage(1);
  };

  const handleResetFilters = () => {
    setLocalFilters({ account: '', email: '' });
    UserManagement.navigateToDefault(router);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    const totalPages = Math.ceil(total / pageSize) || 1;
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  const handleOpenDetail = async (id: string) => {
    setDetailSheetOpen(true);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const data = await getUserDetail({ id });
      setDetailData(data);
    } catch (e: any) {
      toast.error(e.message);
      setDetailSheetOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: SysUserStatus, source: 'list' | 'detail') => {
    const targetStatus: SysUserStatus = currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    try {
      await updateUserStatus({ id, status: targetStatus });
      toast.success('状态更新成功');
      loadData();
      if (source === 'detail' && detailData?.id === id) {
        setDetailData({ ...detailData, status: targetStatus });
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleRequestDelete = (user: UserListItem) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setActionLoading(true);
    try {
      await deleteUser({ id: userToDelete.id });
      toast.success('用户删除成功');
      setDeleteDialogOpen(false);
      setUserToDelete(null);
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

  const formatDateTime = useCallback((isoString: string | null) => {
    if (!isoString) return '-';
    try {
      return new Date(isoString).toLocaleString();
    } catch {
      return isoString;
    }
  }, []);

  const totalPages = Math.ceil(total / pageSize) || 1;

  return {
    state: {
      urlParams,
      localFilters,
      page,
      pageSize,
      totalPages,
      loading,
      list,
      total,
      detailSheetOpen,
      detailLoading,
      detailData,
      deleteDialogOpen,
      userToDelete,
      actionLoading,
      STATUS_LABELS,
      ROLE_LABELS,
    },
    handlers: {
      handleTextChange,
      handleCompositionStart,
      handleCompositionEnd,
      handleSelectChange,
      handleResetFilters,
      handlePageChange,
      handleOpenDetail,
      handleToggleStatus,
      handleRequestDelete,
      handleConfirmDelete,
      setDetailSheetOpen,
      setDeleteDialogOpen,
      formatDateTime,
    },
  };
}
