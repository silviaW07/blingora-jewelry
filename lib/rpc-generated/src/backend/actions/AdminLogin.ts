/* Auto-generated */
import { rpcCall } from '@/tools/rpc-client';
type Actions = typeof import('../../../../../src/backend/actions/AdminLogin');

export const adminLogin = (...args: Parameters<Actions["adminLogin"]>) => 
  rpcCall<Awaited<ReturnType<Actions["adminLogin"]>>>("src.backend.actions.AdminLogin.adminLogin", ...args);
