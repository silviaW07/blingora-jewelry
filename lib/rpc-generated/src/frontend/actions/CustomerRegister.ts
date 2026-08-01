/* Auto-generated */
import { rpcCall } from '@/tools/rpc-client';
type Actions = typeof import('../../../../../src/frontend/actions/CustomerRegister');

export const checkEmailUnique = (...args: Parameters<Actions["checkEmailUnique"]>) => 
  rpcCall<Awaited<ReturnType<Actions["checkEmailUnique"]>>>("src.frontend.actions.CustomerRegister.checkEmailUnique", ...args);
export const registerCustomer = (...args: Parameters<Actions["registerCustomer"]>) => 
  rpcCall<Awaited<ReturnType<Actions["registerCustomer"]>>>("src.frontend.actions.CustomerRegister.registerCustomer", ...args);
