/* Auto-generated */
import { rpcCall } from '@/tools/rpc-client';
type Actions = typeof import('../../../../../src/backend/actions/ProductMinOrder');

export const batchUpdateMinOrderQty = (...args: Parameters<Actions["batchUpdateMinOrderQty"]>) => 
  rpcCall<Awaited<ReturnType<Actions["batchUpdateMinOrderQty"]>>>("src.backend.actions.ProductMinOrder.batchUpdateMinOrderQty", ...args);
