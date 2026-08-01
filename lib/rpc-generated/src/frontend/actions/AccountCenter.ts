/* Auto-generated */
import { rpcCall } from '@/tools/rpc-client';
type Actions = typeof import('../../../../../src/frontend/actions/AccountCenter');

export const getCustomerProfile = (...args: Parameters<Actions["getCustomerProfile"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getCustomerProfile"]>>>("src.frontend.actions.AccountCenter.getCustomerProfile", ...args);
export const updateCustomerProfile = (...args: Parameters<Actions["updateCustomerProfile"]>) => 
  rpcCall<Awaited<ReturnType<Actions["updateCustomerProfile"]>>>("src.frontend.actions.AccountCenter.updateCustomerProfile", ...args);
export const listCustomerAddresses = (...args: Parameters<Actions["listCustomerAddresses"]>) => 
  rpcCall<Awaited<ReturnType<Actions["listCustomerAddresses"]>>>("src.frontend.actions.AccountCenter.listCustomerAddresses", ...args);
export const saveCustomerAddress = (...args: Parameters<Actions["saveCustomerAddress"]>) => 
  rpcCall<Awaited<ReturnType<Actions["saveCustomerAddress"]>>>("src.frontend.actions.AccountCenter.saveCustomerAddress", ...args);
export const setDefaultCustomerAddress = (...args: Parameters<Actions["setDefaultCustomerAddress"]>) => 
  rpcCall<Awaited<ReturnType<Actions["setDefaultCustomerAddress"]>>>("src.frontend.actions.AccountCenter.setDefaultCustomerAddress", ...args);
export const deleteCustomerAddress = (...args: Parameters<Actions["deleteCustomerAddress"]>) => 
  rpcCall<Awaited<ReturnType<Actions["deleteCustomerAddress"]>>>("src.frontend.actions.AccountCenter.deleteCustomerAddress", ...args);
export const listCustomerOrders = (...args: Parameters<Actions["listCustomerOrders"]>) => 
  rpcCall<Awaited<ReturnType<Actions["listCustomerOrders"]>>>("src.frontend.actions.AccountCenter.listCustomerOrders", ...args);
export const getCustomerOrderDetail = (...args: Parameters<Actions["getCustomerOrderDetail"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getCustomerOrderDetail"]>>>("src.frontend.actions.AccountCenter.getCustomerOrderDetail", ...args);
export const reorderCustomerOrder = (...args: Parameters<Actions["reorderCustomerOrder"]>) => 
  rpcCall<Awaited<ReturnType<Actions["reorderCustomerOrder"]>>>("src.frontend.actions.AccountCenter.reorderCustomerOrder", ...args);
