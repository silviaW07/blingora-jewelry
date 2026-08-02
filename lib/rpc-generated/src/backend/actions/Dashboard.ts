/* Auto-generated */
import { rpcCall } from '@/tools/rpc-client';
type Actions = typeof import('../../../../../src/backend/actions/Dashboard');

export const getAdminProfile = (...args: Parameters<Actions["getAdminProfile"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getAdminProfile"]>>>("src.backend.actions.Dashboard.getAdminProfile", ...args);
export const updateAdminProfile = (...args: Parameters<Actions["updateAdminProfile"]>) => 
  rpcCall<Awaited<ReturnType<Actions["updateAdminProfile"]>>>("src.backend.actions.Dashboard.updateAdminProfile", ...args);
export const getKpiStats = (...args: Parameters<Actions["getKpiStats"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getKpiStats"]>>>("src.backend.actions.Dashboard.getKpiStats", ...args);
export const getImportTasksOverview = (...args: Parameters<Actions["getImportTasksOverview"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getImportTasksOverview"]>>>("src.backend.actions.Dashboard.getImportTasksOverview", ...args);
export const retryImportTask = (...args: Parameters<Actions["retryImportTask"]>) => 
  rpcCall<Awaited<ReturnType<Actions["retryImportTask"]>>>("src.backend.actions.Dashboard.retryImportTask", ...args);
export const getStockAlerts = (...args: Parameters<Actions["getStockAlerts"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getStockAlerts"]>>>("src.backend.actions.Dashboard.getStockAlerts", ...args);
export const getRecentProducts = (...args: Parameters<Actions["getRecentProducts"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getRecentProducts"]>>>("src.backend.actions.Dashboard.getRecentProducts", ...args);
export const getRecentUsers = (...args: Parameters<Actions["getRecentUsers"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getRecentUsers"]>>>("src.backend.actions.Dashboard.getRecentUsers", ...args);
