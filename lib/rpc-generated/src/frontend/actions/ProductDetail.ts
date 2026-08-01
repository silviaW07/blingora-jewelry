/* Auto-generated */
import { rpcCall } from '@/tools/rpc-client';
type Actions = typeof import('../../../../../src/frontend/actions/ProductDetail');

export const getProductDetail = (...args: Parameters<Actions["getProductDetail"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getProductDetail"]>>>("src.frontend.actions.ProductDetail.getProductDetail", ...args);
export const getDecoratePreviewProduct = (...args: Parameters<Actions["getDecoratePreviewProduct"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getDecoratePreviewProduct"]>>>("src.frontend.actions.ProductDetail.getDecoratePreviewProduct", ...args);
export const getRelatedProducts = (...args: Parameters<Actions["getRelatedProducts"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getRelatedProducts"]>>>("src.frontend.actions.ProductDetail.getRelatedProducts", ...args);
export const addToCart = (...args: Parameters<Actions["addToCart"]>) => 
  rpcCall<Awaited<ReturnType<Actions["addToCart"]>>>("src.frontend.actions.ProductDetail.addToCart", ...args);
export const setCartSkuQuantity = (...args: Parameters<Actions["setCartSkuQuantity"]>) => 
  rpcCall<Awaited<ReturnType<Actions["setCartSkuQuantity"]>>>("src.frontend.actions.ProductDetail.setCartSkuQuantity", ...args);
