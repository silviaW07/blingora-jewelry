/* Auto-generated */
import { rpcCall } from '@/tools/rpc-client';
type Actions = typeof import('../../../../../src/backend/actions/OrderManagement');

export const getOrderDashboardStats = (...args: Parameters<Actions["getOrderDashboardStats"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getOrderDashboardStats"]>>>("src.backend.actions.OrderManagement.getOrderDashboardStats", ...args);
export const getOrderList = (...args: Parameters<Actions["getOrderList"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getOrderList"]>>>("src.backend.actions.OrderManagement.getOrderList", ...args);
export const getOrderDetail = (...args: Parameters<Actions["getOrderDetail"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getOrderDetail"]>>>("src.backend.actions.OrderManagement.getOrderDetail", ...args);
export const shipOrder = (...args: Parameters<Actions["shipOrder"]>) => 
  rpcCall<Awaited<ReturnType<Actions["shipOrder"]>>>("src.backend.actions.OrderManagement.shipOrder", ...args);
export const addLogisticsSegment = (...args: Parameters<Actions["addLogisticsSegment"]>) => 
  rpcCall<Awaited<ReturnType<Actions["addLogisticsSegment"]>>>("src.backend.actions.OrderManagement.addLogisticsSegment", ...args);
export const updateOrderStatus = (...args: Parameters<Actions["updateOrderStatus"]>) => 
  rpcCall<Awaited<ReturnType<Actions["updateOrderStatus"]>>>("src.backend.actions.OrderManagement.updateOrderStatus", ...args);
export const updateOrderRemark = (...args: Parameters<Actions["updateOrderRemark"]>) => 
  rpcCall<Awaited<ReturnType<Actions["updateOrderRemark"]>>>("src.backend.actions.OrderManagement.updateOrderRemark", ...args);
export const exportOrdersExcel = (...args: Parameters<Actions["exportOrdersExcel"]>) => 
  rpcCall<Awaited<ReturnType<Actions["exportOrdersExcel"]>>>("src.backend.actions.OrderManagement.exportOrdersExcel", ...args);
