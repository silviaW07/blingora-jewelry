/* Auto-generated */
import { rpcCall } from '@/tools/rpc-client';
type Actions = typeof import('../../../../../src/frontend/actions/ProductCategory');

export const getCategoryList = (...args: Parameters<Actions["getCategoryList"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getCategoryList"]>>>("src.frontend.actions.ProductCategory.getCategoryList", ...args);
export const getCategoryDetail = (...args: Parameters<Actions["getCategoryDetail"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getCategoryDetail"]>>>("src.frontend.actions.ProductCategory.getCategoryDetail", ...args);
export const getCategoryPosterList = (...args: Parameters<Actions["getCategoryPosterList"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getCategoryPosterList"]>>>("src.frontend.actions.ProductCategory.getCategoryPosterList", ...args);
export const getCategoryTopPromotion = (...args: Parameters<Actions["getCategoryTopPromotion"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getCategoryTopPromotion"]>>>("src.frontend.actions.ProductCategory.getCategoryTopPromotion", ...args);
export const getKeywordGroupList = (...args: Parameters<Actions["getKeywordGroupList"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getKeywordGroupList"]>>>("src.frontend.actions.ProductCategory.getKeywordGroupList", ...args);
export const getKeywordList = (...args: Parameters<Actions["getKeywordList"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getKeywordList"]>>>("src.frontend.actions.ProductCategory.getKeywordList", ...args);
export const getCategorySideNavZones = (...args: Parameters<Actions["getCategorySideNavZones"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getCategorySideNavZones"]>>>("src.frontend.actions.ProductCategory.getCategorySideNavZones", ...args);
export const getProductList = (...args: Parameters<Actions["getProductList"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getProductList"]>>>("src.frontend.actions.ProductCategory.getProductList", ...args);
export const addToCart = (...args: Parameters<Actions["addToCart"]>) => 
  rpcCall<Awaited<ReturnType<Actions["addToCart"]>>>("src.frontend.actions.ProductCategory.addToCart", ...args);
