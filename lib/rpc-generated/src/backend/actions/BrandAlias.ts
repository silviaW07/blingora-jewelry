/* Auto-generated */
import { rpcCall } from '@/tools/rpc-client';
type Actions = typeof import('../../../../../src/backend/actions/BrandAlias');

export const listBrandAliases = (...args: Parameters<Actions["listBrandAliases"]>) => 
  rpcCall<Awaited<ReturnType<Actions["listBrandAliases"]>>>("src.backend.actions.BrandAlias.listBrandAliases", ...args);
export const createBrandAlias = (...args: Parameters<Actions["createBrandAlias"]>) => 
  rpcCall<Awaited<ReturnType<Actions["createBrandAlias"]>>>("src.backend.actions.BrandAlias.createBrandAlias", ...args);
export const updateBrandAlias = (...args: Parameters<Actions["updateBrandAlias"]>) => 
  rpcCall<Awaited<ReturnType<Actions["updateBrandAlias"]>>>("src.backend.actions.BrandAlias.updateBrandAlias", ...args);
export const deleteBrandAlias = (...args: Parameters<Actions["deleteBrandAlias"]>) => 
  rpcCall<Awaited<ReturnType<Actions["deleteBrandAlias"]>>>("src.backend.actions.BrandAlias.deleteBrandAlias", ...args);
