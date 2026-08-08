/* Auto-generated */
import { rpcCall } from '@/tools/rpc-client';
type Actions = typeof import('../../../../../src/backend/actions/AdminManagement');

export const listAdminAccounts = (...args: Parameters<Actions["listAdminAccounts"]>) => 
  rpcCall<Awaited<ReturnType<Actions["listAdminAccounts"]>>>("src.backend.actions.AdminManagement.listAdminAccounts", ...args);
export const createAdminAccount = (...args: Parameters<Actions["createAdminAccount"]>) => 
  rpcCall<Awaited<ReturnType<Actions["createAdminAccount"]>>>("src.backend.actions.AdminManagement.createAdminAccount", ...args);
export const updateAdminRole = (...args: Parameters<Actions["updateAdminRole"]>) => 
  rpcCall<Awaited<ReturnType<Actions["updateAdminRole"]>>>("src.backend.actions.AdminManagement.updateAdminRole", ...args);
export const updateAdminStatus = (...args: Parameters<Actions["updateAdminStatus"]>) => 
  rpcCall<Awaited<ReturnType<Actions["updateAdminStatus"]>>>("src.backend.actions.AdminManagement.updateAdminStatus", ...args);
export const resetAdminPassword = (...args: Parameters<Actions["resetAdminPassword"]>) => 
  rpcCall<Awaited<ReturnType<Actions["resetAdminPassword"]>>>("src.backend.actions.AdminManagement.resetAdminPassword", ...args);
export const deleteAdminAccount = (...args: Parameters<Actions["deleteAdminAccount"]>) => 
  rpcCall<Awaited<ReturnType<Actions["deleteAdminAccount"]>>>("src.backend.actions.AdminManagement.deleteAdminAccount", ...args);
