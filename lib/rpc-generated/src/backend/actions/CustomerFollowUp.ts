/* Auto-generated */
import { rpcCall } from '@/tools/rpc-client';
type Actions = typeof import('../../../../../src/backend/actions/CustomerFollowUp');

export const getFollowUpBoard = (...args: Parameters<Actions["getFollowUpBoard"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getFollowUpBoard"]>>>("src.backend.actions.CustomerFollowUp.getFollowUpBoard", ...args);
export const createFollowCustomer = (...args: Parameters<Actions["createFollowCustomer"]>) => 
  rpcCall<Awaited<ReturnType<Actions["createFollowCustomer"]>>>("src.backend.actions.CustomerFollowUp.createFollowCustomer", ...args);
export const updateFollowCustomer = (...args: Parameters<Actions["updateFollowCustomer"]>) => 
  rpcCall<Awaited<ReturnType<Actions["updateFollowCustomer"]>>>("src.backend.actions.CustomerFollowUp.updateFollowCustomer", ...args);
export const markCustomerFollowed = (...args: Parameters<Actions["markCustomerFollowed"]>) => 
  rpcCall<Awaited<ReturnType<Actions["markCustomerFollowed"]>>>("src.backend.actions.CustomerFollowUp.markCustomerFollowed", ...args);
export const getCustomerFollowLogs = (...args: Parameters<Actions["getCustomerFollowLogs"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getCustomerFollowLogs"]>>>("src.backend.actions.CustomerFollowUp.getCustomerFollowLogs", ...args);
