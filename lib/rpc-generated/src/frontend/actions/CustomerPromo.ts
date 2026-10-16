/* Auto-generated */
import { rpcCall } from '@/tools/rpc-client';
type Actions = typeof import('../../../../../src/frontend/actions/CustomerPromo');

export const getMyGoodsCoef = (...args: Parameters<Actions["getMyGoodsCoef"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getMyGoodsCoef"]>>>("src.frontend.actions.CustomerPromo.getMyGoodsCoef", ...args);
