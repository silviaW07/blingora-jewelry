/* Auto-generated */
import { rpcCall } from '@/tools/rpc-client';
type Actions = typeof import('../../../../../src/backend/actions/CustomerFollowUp');

export const getFollowUpBoard = (...args: Parameters<Actions["getFollowUpBoard"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getFollowUpBoard"]>>>("src.backend.actions.CustomerFollowUp.getFollowUpBoard", ...args);
export const updateTagFollowIntervals = (...args: Parameters<Actions["updateTagFollowIntervals"]>) => 
  rpcCall<Awaited<ReturnType<Actions["updateTagFollowIntervals"]>>>("src.backend.actions.CustomerFollowUp.updateTagFollowIntervals", ...args);
export const markCustomerFollowed = (...args: Parameters<Actions["markCustomerFollowed"]>) => 
  rpcCall<Awaited<ReturnType<Actions["markCustomerFollowed"]>>>("src.backend.actions.CustomerFollowUp.markCustomerFollowed", ...args);
export const getCustomerFollowLogs = (...args: Parameters<Actions["getCustomerFollowLogs"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getCustomerFollowLogs"]>>>("src.backend.actions.CustomerFollowUp.getCustomerFollowLogs", ...args);
