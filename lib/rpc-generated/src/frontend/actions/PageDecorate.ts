/* Auto-generated */
import { rpcCall } from '@/tools/rpc-client';
type Actions = typeof import('../../../../../src/frontend/actions/PageDecorate');

export const getPageDecorateConfig = (...args: Parameters<Actions["getPageDecorateConfig"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getPageDecorateConfig"]>>>("src.frontend.actions.PageDecorate.getPageDecorateConfig", ...args);
export const savePageDecorateConfig = (...args: Parameters<Actions["savePageDecorateConfig"]>) => 
  rpcCall<Awaited<ReturnType<Actions["savePageDecorateConfig"]>>>("src.frontend.actions.PageDecorate.savePageDecorateConfig", ...args);
