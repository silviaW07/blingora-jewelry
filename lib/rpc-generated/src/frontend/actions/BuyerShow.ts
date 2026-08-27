/* Auto-generated */
import { rpcCall } from '@/tools/rpc-client';
type Actions = typeof import('../../../../../src/frontend/actions/BuyerShow');

export const getBuyerShowPage = (...args: Parameters<Actions["getBuyerShowPage"]>) =>
  rpcCall<Awaited<ReturnType<Actions["getBuyerShowPage"]>>>("src.frontend.actions.BuyerShow.getBuyerShowPage", ...args);
