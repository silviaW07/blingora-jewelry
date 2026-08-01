/* Auto-generated */
import { rpcCall } from '@/tools/rpc-client';
type Actions = typeof import('../../../../../src/frontend/actions/Cart');

export const getCartData = (...args: Parameters<Actions["getCartData"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getCartData"]>>>("src.frontend.actions.Cart.getCartData", ...args);
export const updateCartItemQuantity = (...args: Parameters<Actions["updateCartItemQuantity"]>) => 
  rpcCall<Awaited<ReturnType<Actions["updateCartItemQuantity"]>>>("src.frontend.actions.Cart.updateCartItemQuantity", ...args);
export const removeCartItem = (...args: Parameters<Actions["removeCartItem"]>) => 
  rpcCall<Awaited<ReturnType<Actions["removeCartItem"]>>>("src.frontend.actions.Cart.removeCartItem", ...args);
export const clearCart = (...args: Parameters<Actions["clearCart"]>) => 
  rpcCall<Awaited<ReturnType<Actions["clearCart"]>>>("src.frontend.actions.Cart.clearCart", ...args);
export const removeInvalidCartItems = (...args: Parameters<Actions["removeInvalidCartItems"]>) => 
  rpcCall<Awaited<ReturnType<Actions["removeInvalidCartItems"]>>>("src.frontend.actions.Cart.removeInvalidCartItems", ...args);
export const getRecommendedProducts = (...args: Parameters<Actions["getRecommendedProducts"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getRecommendedProducts"]>>>("src.frontend.actions.Cart.getRecommendedProducts", ...args);
