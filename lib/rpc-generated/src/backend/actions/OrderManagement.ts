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
export const updateOrderInbound = (...args: Parameters<Actions["updateOrderInbound"]>) => 
  rpcCall<Awaited<ReturnType<Actions["updateOrderInbound"]>>>("src.backend.actions.OrderManagement.updateOrderInbound", ...args);
export const appendOrderGoods = (...args: Parameters<Actions["appendOrderGoods"]>) => 
  rpcCall<Awaited<ReturnType<Actions["appendOrderGoods"]>>>("src.backend.actions.OrderManagement.appendOrderGoods", ...args);
export const appendManualOrderLine = (...args: Parameters<Actions["appendManualOrderLine"]>) => 
  rpcCall<Awaited<ReturnType<Actions["appendManualOrderLine"]>>>("src.backend.actions.OrderManagement.appendManualOrderLine", ...args);
export const importInboundSheet = (...args: Parameters<Actions["importInboundSheet"]>) => 
  rpcCall<Awaited<ReturnType<Actions["importInboundSheet"]>>>("src.backend.actions.OrderManagement.importInboundSheet", ...args);
export const importCustomerOrder = (...args: Parameters<Actions["importCustomerOrder"]>) => 
  rpcCall<Awaited<ReturnType<Actions["importCustomerOrder"]>>>("src.backend.actions.OrderManagement.importCustomerOrder", ...args);
export const listInboundShipments = (...args: Parameters<Actions["listInboundShipments"]>) => 
  rpcCall<Awaited<ReturnType<Actions["listInboundShipments"]>>>("src.backend.actions.OrderManagement.listInboundShipments", ...args);
export const saveInboundShipment = (...args: Parameters<Actions["saveInboundShipment"]>) => 
  rpcCall<Awaited<ReturnType<Actions["saveInboundShipment"]>>>("src.backend.actions.OrderManagement.saveInboundShipment", ...args);
export const updateInboundShipment = (...args: Parameters<Actions["updateInboundShipment"]>) => 
  rpcCall<Awaited<ReturnType<Actions["updateInboundShipment"]>>>("src.backend.actions.OrderManagement.updateInboundShipment", ...args);
export const updateManualOrderLine = (...args: Parameters<Actions["updateManualOrderLine"]>) => 
  rpcCall<Awaited<ReturnType<Actions["updateManualOrderLine"]>>>("src.backend.actions.OrderManagement.updateManualOrderLine", ...args);
export const deleteInboundLines = (...args: Parameters<Actions["deleteInboundLines"]>) => 
  rpcCall<Awaited<ReturnType<Actions["deleteInboundLines"]>>>("src.backend.actions.OrderManagement.deleteInboundLines", ...args);
export const updateOrderDiscount = (...args: Parameters<Actions["updateOrderDiscount"]>) => 
  rpcCall<Awaited<ReturnType<Actions["updateOrderDiscount"]>>>("src.backend.actions.OrderManagement.updateOrderDiscount", ...args);
export const updateOrderRemark = (...args: Parameters<Actions["updateOrderRemark"]>) => 
  rpcCall<Awaited<ReturnType<Actions["updateOrderRemark"]>>>("src.backend.actions.OrderManagement.updateOrderRemark", ...args);
export const exportInboundSheet = (...args: Parameters<Actions["exportInboundSheet"]>) => 
  rpcCall<Awaited<ReturnType<Actions["exportInboundSheet"]>>>("src.backend.actions.OrderManagement.exportInboundSheet", ...args);
export const exportOrdersExcel = (...args: Parameters<Actions["exportOrdersExcel"]>) => 
  rpcCall<Awaited<ReturnType<Actions["exportOrdersExcel"]>>>("src.backend.actions.OrderManagement.exportOrdersExcel", ...args);
