/* Auto-generated */
import { rpcCall } from '@/tools/rpc-client';
type Actions = typeof import('../../../../../src/backend/actions/CustomerFollowUp');

export const phoneDigits = (...args: Parameters<Actions["phoneDigits"]>) => 
  rpcCall<Awaited<ReturnType<Actions["phoneDigits"]>>>("src.backend.actions.CustomerFollowUp.phoneDigits", ...args);
export const getFollowUpBoard = (...args: Parameters<Actions["getFollowUpBoard"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getFollowUpBoard"]>>>("src.backend.actions.CustomerFollowUp.getFollowUpBoard", ...args);
export const updateTagFollowIntervals = (...args: Parameters<Actions["updateTagFollowIntervals"]>) => 
  rpcCall<Awaited<ReturnType<Actions["updateTagFollowIntervals"]>>>("src.backend.actions.CustomerFollowUp.updateTagFollowIntervals", ...args);
export const setFollowStatus = (...args: Parameters<Actions["setFollowStatus"]>) => 
  rpcCall<Awaited<ReturnType<Actions["setFollowStatus"]>>>("src.backend.actions.CustomerFollowUp.setFollowStatus", ...args);
export const markCustomerFollowed = (...args: Parameters<Actions["markCustomerFollowed"]>) => 
  rpcCall<Awaited<ReturnType<Actions["markCustomerFollowed"]>>>("src.backend.actions.CustomerFollowUp.markCustomerFollowed", ...args);
export const getCustomerFollowLogs = (...args: Parameters<Actions["getCustomerFollowLogs"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getCustomerFollowLogs"]>>>("src.backend.actions.CustomerFollowUp.getCustomerFollowLogs", ...args);
export const addFollowPhones = (...args: Parameters<Actions["addFollowPhones"]>) => 
  rpcCall<Awaited<ReturnType<Actions["addFollowPhones"]>>>("src.backend.actions.CustomerFollowUp.addFollowPhones", ...args);
export const updateFollowPhone = (...args: Parameters<Actions["updateFollowPhone"]>) => 
  rpcCall<Awaited<ReturnType<Actions["updateFollowPhone"]>>>("src.backend.actions.CustomerFollowUp.updateFollowPhone", ...args);
export const getWeeklyHotWhatsappMessage = (...args: Parameters<Actions["getWeeklyHotWhatsappMessage"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getWeeklyHotWhatsappMessage"]>>>("src.backend.actions.CustomerFollowUp.getWeeklyHotWhatsappMessage", ...args);
