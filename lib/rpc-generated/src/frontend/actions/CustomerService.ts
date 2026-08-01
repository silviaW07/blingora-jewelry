/* Auto-generated */
import { rpcCall } from '@/tools/rpc-client';
type Actions = typeof import('../../../../../src/frontend/actions/CustomerService');

export const getCustomerServiceConfig = (...args: Parameters<Actions["getCustomerServiceConfig"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getCustomerServiceConfig"]>>>("src.frontend.actions.CustomerService.getCustomerServiceConfig", ...args);
export const saveCustomerServiceConfig = (...args: Parameters<Actions["saveCustomerServiceConfig"]>) => 
  rpcCall<Awaited<ReturnType<Actions["saveCustomerServiceConfig"]>>>("src.frontend.actions.CustomerService.saveCustomerServiceConfig", ...args);
