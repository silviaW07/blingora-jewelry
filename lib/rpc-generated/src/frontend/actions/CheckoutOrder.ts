/* Auto-generated */
import { rpcCall } from '@/tools/rpc-client';
type Actions = typeof import('../../../../../src/frontend/actions/CheckoutOrder');

export const getLatestShippingAddress = (...args: Parameters<Actions["getLatestShippingAddress"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getLatestShippingAddress"]>>>("src.frontend.actions.CheckoutOrder.getLatestShippingAddress", ...args);
export const saveCheckoutAddress = (...args: Parameters<Actions["saveCheckoutAddress"]>) => 
  rpcCall<Awaited<ReturnType<Actions["saveCheckoutAddress"]>>>("src.frontend.actions.CheckoutOrder.saveCheckoutAddress", ...args);
export const placeCheckoutOrder = (...args: Parameters<Actions["placeCheckoutOrder"]>) => 
  rpcCall<Awaited<ReturnType<Actions["placeCheckoutOrder"]>>>("src.frontend.actions.CheckoutOrder.placeCheckoutOrder", ...args);
