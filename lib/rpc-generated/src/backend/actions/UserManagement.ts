/* Auto-generated */
import { rpcCall } from '@/tools/rpc-client';
type Actions = typeof import('../../../../../src/backend/actions/UserManagement');

export const getUserList = (...args: Parameters<Actions["getUserList"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getUserList"]>>>("src.backend.actions.UserManagement.getUserList", ...args);
export const getUserDetail = (...args: Parameters<Actions["getUserDetail"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getUserDetail"]>>>("src.backend.actions.UserManagement.getUserDetail", ...args);
export const updateUserAdminNote = (...args: Parameters<Actions["updateUserAdminNote"]>) => 
  rpcCall<Awaited<ReturnType<Actions["updateUserAdminNote"]>>>("src.backend.actions.UserManagement.updateUserAdminNote", ...args);
export const updateUserCustomerTag = (...args: Parameters<Actions["updateUserCustomerTag"]>) => 
  rpcCall<Awaited<ReturnType<Actions["updateUserCustomerTag"]>>>("src.backend.actions.UserManagement.updateUserCustomerTag", ...args);
export const impersonateCustomer = (...args: Parameters<Actions["impersonateCustomer"]>) => 
  rpcCall<Awaited<ReturnType<Actions["impersonateCustomer"]>>>("src.backend.actions.UserManagement.impersonateCustomer", ...args);
export const updateUserStatus = (...args: Parameters<Actions["updateUserStatus"]>) => 
  rpcCall<Awaited<ReturnType<Actions["updateUserStatus"]>>>("src.backend.actions.UserManagement.updateUserStatus", ...args);
export const deleteUser = (...args: Parameters<Actions["deleteUser"]>) => 
  rpcCall<Awaited<ReturnType<Actions["deleteUser"]>>>("src.backend.actions.UserManagement.deleteUser", ...args);
