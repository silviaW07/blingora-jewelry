'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Import Types
import type { 
  AdminProfile_Output, 
  KpiStats_Output, 
  ImportTaskOverview_Output, 
  StockAlert_Output, 
  RecentProduct_Output, 
  RecentUser_Output,
  ImportTaskStatus,
  ProductStatus
} from '@/backend/types/Dashboard';

// Import Actions
import { 
  getAdminProfile, 
  getKpiStats, 
  getImportTasksOverview, 
  retryImportTask, 
  getStockAlerts, 
  getRecentProducts, 
  getRecentUsers 
} from '@/backend/actions/Dashboard';

// Import Route Params
import { Dashboard as DashboardRoute, ProductManagement, ImportFrom1688 } from '@/backend/route-params';

/**
 * 接口定义位置红线：必须在本 Hook 文件中直接定义并 export
 */
export interface UseDashboardState {
  /**
   * @State: adminProfile
   * @Description: 当前登录管理员的个人资料信息
   * @Initial: null
   */
  adminProfile: AdminProfile_Output | null;

  /**
   * @State: kpiStats
   * @Description: 仪表盘顶部 KPI 汇总卡片数据
   * @Initial: null
   */
  kpiStats: KpiStats_Output | null;

  /**
   * @State: importTasks
   * @Description: 1688 导入任务监控列表
   * @Initial: []
   */
  importTasks: ImportTaskOverview_Output[];

  /**
   * @State: stockAlerts
   * @Description: 供应链库存预警列表
   * @Initial: []
   */
  stockAlerts: StockAlert_Output[];

  /**
   * @State: recentProducts
   * @Description: 最近上架商品明细表格数据
   * @Initial: []
   */
  recentProducts: RecentProduct_Output[];

  /**
   * @State: recentUsers
   * @Description: 最新注册的买家流水列表
   * @Initial: []
   */
  recentUsers: RecentUser_Output[];

  /**
   * @State: isInitializing
   * @Description: 页面首次加载的骨架屏状态标记
   * @Initial: true
   */
  isInitializing: boolean;

  /**
   * @State: isRetryingTaskId
   * @Description: 当前正在请求重试的导入任务ID，用于按钮加载态禁用
   * @Initial: null
   */
  isRetryingTaskId: string | null;
}

export interface UseDashboardHandlers {
  /**
   * @Method: handleInit
   * @Description: 页面初始化总控
   */
  handleInit: () => () => void;

  /**
   * @Method: handleRetryTask
   * @Description: 触发任务重新尝试并立刻刷新任务列表
   */
  handleRetryTask: (taskId: string) => Promise<void>;

  /**
   * @Method: handleExportReport
   * @Description: 导出运营报表（占位操作）
   */
  handleExportReport: () => void;

  /**
   * @Method: handleNavigateToCreateImportTask
   * @Description: 跳转至 1688 导入页面
   */
  handleNavigateToCreateImportTask: () => void;

  /**
   * @Method: handleNavigateToAllProducts
   * @Description: 跳转至全部商品管理页面
   */
  handleNavigateToAllProducts: () => void;

  /**
   * @Method: handleNavigateToProductEdit
   * @Description: 跳转至特定商品编辑页或商品管理带筛选项
   */
  handleNavigateToProductEdit: (productName: string) => void;

  /**
   * @Method: handleReplenishStock
   * @Description: 一键补货（占位操作）
   */
  handleReplenishStock: (skuCode: string) => void;
}

/**
 * useDashboard Hook 实现
 */
export function useDashboard() {
  const router = useRouter();

  // ----- States -----
  const [adminProfile, setAdminProfile] = useState<AdminProfile_Output | null>(null);
  const [kpiStats, setKpiStats] = useState<KpiStats_Output | null>(null);
  const [importTasks, setImportTasks] = useState<ImportTaskOverview_Output[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert_Output[]>([]);
  const [recentProducts, setRecentProducts] = useState<RecentProduct_Output[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser_Output[]>([]);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isRetryingTaskId, setIsRetryingTaskId] = useState<string | null>(null);

  // ----- Inner Functions -----

  /**
   * @Method: fetchAllDashboardData
   * @Steps:
   *   1. [Steps]: 设置 isInitializing = true
   *   2. [Steps]: 并发执行上述 API 请求（Promise.allSettled）
   *   3. [Steps]: 若成功，提取返回值并分别 set 到对应状态变量
   *   4. [Steps]: 若失败，可以通过 toast 提示错误
   *   5. [Steps]: finally 设置 isInitializing = false
   */
  const fetchAllDashboardData = useCallback(async () => {
    // 1. [fetchAllDashboardData]: 设置 isInitializing = true
    setIsInitializing(true);
    try {
      // 2. [fetchAllDashboardData]: 并发执行上述 API 请求（Promise.allSettled）
      const results = await Promise.allSettled([
        getAdminProfile(),
        getKpiStats(),
        getStockAlerts(),
        getRecentProducts(),
        getRecentUsers(),
      ]);

      // 3. [fetchAllDashboardData]: 若成功，提取返回值并分别 set 到对应状态变量
      if (results[0].status === 'fulfilled') setAdminProfile(results[0].value);
      if (results[1].status === 'fulfilled') setKpiStats(results[1].value);
      if (results[2].status === 'fulfilled') setStockAlerts(results[2].value);
      if (results[3].status === 'fulfilled') setRecentProducts(results[3].value);
      if (results[4].status === 'fulfilled') setRecentUsers(results[4].value);

      // 4. [fetchAllDashboardData]: 若失败，可以通过 toast 提示错误
      const hasError = results.some(r => r.status === 'rejected');
      if (hasError) {
        toast.error("部分仪表盘数据加载失败，请刷新重试");
      }
    } catch (error) {
      toast.error("数据加载发生未知错误");
    } finally {
      // 5. [fetchAllDashboardData]: finally 设置 isInitializing = false
      setIsInitializing(false);
    }
  }, []);

  /**
   * @Method: startTasksPolling
   * @Steps:
   *   1. [Steps]: 定义获取逻辑：调用 getImportTasksOverview 并将结果赋给 importTasks
   *   2. [Steps]: 立即执行一次获取逻辑
   *   3. [Steps]: 设定 4000 毫秒(4秒) 的 setInterval 定时器定期执行
   *   4. [Steps]: 返回清理函数（clearInterval）
   */
  const startTasksPolling = useCallback(() => {
    // 1. [startTasksPolling]: 定义获取逻辑：调用 getImportTasksOverview 并将结果赋给 importTasks
    const fetchTasks = async () => {
      try {
        const tasks = await getImportTasksOverview();
        setImportTasks(tasks);
      } catch (error) {
        console.error("Polling tasks overview failed", error);
      }
    };

    // 2. [startTasksPolling]: 立即执行一次获取逻辑
    fetchTasks();

    // 3. [startTasksPolling]: 设定 4000 毫秒(4秒) 的 setInterval 定时器定期执行
    const timerId = setInterval(fetchTasks, 4000);

    // 4. [startTasksPolling]: 返回清理函数（clearInterval）
    return () => clearInterval(timerId);
  }, []);

  // ----- Handlers -----

  /**
   * @Method: handleInit
   * @Steps:
   *   1. [handleInit]: 调用 fetchAllDashboardData()
   *   2. [handleInit]: 调用 startTasksPolling() 并记录其返回的 cleanup 函数
   *   3. [handleInit]: 返回 cleanup 函数，供 React 卸载使用
   */
  const handleInit = useCallback(() => {
    // 1. [handleInit]: 调用 fetchAllDashboardData()
    fetchAllDashboardData();
    // 2. [handleInit]: 调用 startTasksPolling() 并记录其返回的 cleanup 函数
    const cleanupPolling = startTasksPolling();

    // 3. [handleInit]: 返回 cleanup 函数，供 React 卸载使用
    return () => {
      cleanupPolling();
    };
  }, [fetchAllDashboardData, startTasksPolling]);

  /**
   * @Method: handleRetryTask
   * @Steps:
   *   1. [handleRetryTask]: 检查传入的 taskId 是否存在，设置 isRetryingTaskId = taskId
   *   2. [handleRetryTask]: 调用 retryImportTask({ id: taskId })
   *   3. [handleRetryTask]: 成功后，立刻调用 getImportTasksOverview 覆盖更新 importTasks
   *   4. [handleRetryTask]: 若失败，弹出全局 Toast 提示
   *   5. [handleRetryTask]: finally 清空 isRetryingTaskId = null
   */
  const handleRetryTask = useCallback(async (taskId: string) => {
    // 1. [handleRetryTask]: 检查传入的 taskId 是否存在，设置 isRetryingTaskId = taskId
    if (!taskId) return;
    setIsRetryingTaskId(taskId);

    try {
      // 2. [handleRetryTask]: 调用 retryImportTask({ id: taskId })
      await retryImportTask({ id: taskId });
      
      // 3. [handleRetryTask]: 成功后，立刻调用 getImportTasksOverview 覆盖更新 importTasks
      const updatedTasks = await getImportTasksOverview();
      setImportTasks(updatedTasks);
      toast.success("任务已重新排队执行");
    } catch (error) {
      // 4. [handleRetryTask]: 若失败，弹出全局 Toast 提示
      toast.error("重试任务失败，请稍后重试");
    } finally {
      // 5. [handleRetryTask]: finally 清空 isRetryingTaskId = null
      setIsRetryingTaskId(null);
    }
  }, []);

  /**
   * @Method: handleExportReport
   * @Steps:
   *   1. [handleExportReport]: 由于暂无对应 API，弹出 Toast 提示 "报表生成中，请稍候" 即可
   */
  const handleExportReport = useCallback(() => {
    // 1. [handleExportReport]: 由于暂无对应 API，弹出 Toast 提示 "报表生成中，请稍候" 即可
    toast.info("报表生成中，请稍候");
  }, []);

  /**
   * @Method: handleNavigateToCreateImportTask
   * @Steps:
   *   1. [handleNavigateToCreateImportTask]: 使用 ImportFrom1688.navigateToMain(router) 进行页面跳转
   */
  const handleNavigateToCreateImportTask = useCallback(() => {
    // 1. [handleNavigateToCreateImportTask]: 使用 ImportFrom1688.navigateToMain(router) 进行页面跳转
    ImportFrom1688.navigateToMain(router);
  }, [router]);

  /**
   * @Method: handleNavigateToAllProducts
   * @Steps:
   *   1. [handleNavigateToAllProducts]: 使用 ProductManagement.navigateToAll(router) 跳转商品管理模块
   */
  const handleNavigateToAllProducts = useCallback(() => {
    // 1. [handleNavigateToAllProducts]: 使用 ProductManagement.navigateToAll(router) 跳转商品管理模块
    ProductManagement.navigateToAll(router);
  }, [router]);

  /**
   * @Method: handleNavigateToProductEdit
   * @Steps:
   *   1. [handleNavigateToProductEdit]: 使用 ProductManagement.navigateToWithFilters(router, { name: productName, categoryId: '', status: '' }) 携带商品名过滤跳转
   */
  const handleNavigateToProductEdit = useCallback((productName: string) => {
    // 1. [handleNavigateToProductEdit]: 使用 ProductManagement.navigateToWithFilters(router, { name: productName, categoryId: '', status: '' }) 携带商品名过滤跳转
    ProductManagement.navigateToWithFilters(router, { name: productName, categoryId: '', status: '' });
  }, [router]);

  /**
   * @Method: handleReplenishStock
   * @Steps:
   *   1. [handleReplenishStock]: 由于无专门的采购页面，弹出 Toast "已生成缺货工单通知供应商"
   */
  const handleReplenishStock = useCallback((skuCode: string) => {
    // 1. [handleReplenishStock]: 由于无专门的采购页面，弹出 Toast "已生成缺货工单通知供应商"
    toast.success(`SKU: ${skuCode} 已生成缺货工单通知供应商`);
  }, []);

  return {
    state: {
      adminProfile,
      kpiStats,
      importTasks,
      stockAlerts,
      recentProducts,
      recentUsers,
      isInitializing,
      isRetryingTaskId,
    },
    handlers: {
      handleInit,
      handleRetryTask,
      handleExportReport,
      handleNavigateToCreateImportTask,
      handleNavigateToAllProducts,
      handleNavigateToProductEdit,
      handleReplenishStock,
    },
  } satisfies { state: UseDashboardState; handlers: UseDashboardHandlers };
}