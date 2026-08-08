/* Auto-generated */
import { rpcCall } from '@/tools/rpc-client';
type Actions = typeof import('../../../../../src/backend/actions/SuffixConfig');

export const listSuffixConfigs = (...args: Parameters<Actions["listSuffixConfigs"]>) => 
  rpcCall<Awaited<ReturnType<Actions["listSuffixConfigs"]>>>("src.backend.actions.SuffixConfig.listSuffixConfigs", ...args);
export const createSuffixConfig = (...args: Parameters<Actions["createSuffixConfig"]>) => 
  rpcCall<Awaited<ReturnType<Actions["createSuffixConfig"]>>>("src.backend.actions.SuffixConfig.createSuffixConfig", ...args);
export const updateSuffixConfig = (...args: Parameters<Actions["updateSuffixConfig"]>) => 
  rpcCall<Awaited<ReturnType<Actions["updateSuffixConfig"]>>>("src.backend.actions.SuffixConfig.updateSuffixConfig", ...args);
export const deleteSuffixConfig = (...args: Parameters<Actions["deleteSuffixConfig"]>) => 
  rpcCall<Awaited<ReturnType<Actions["deleteSuffixConfig"]>>>("src.backend.actions.SuffixConfig.deleteSuffixConfig", ...args);
