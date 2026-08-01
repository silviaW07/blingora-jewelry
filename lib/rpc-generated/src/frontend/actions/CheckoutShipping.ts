/* Auto-generated */
import { rpcCall } from '@/tools/rpc-client';
type Actions = typeof import('../../../../../src/frontend/actions/CheckoutShipping');

export const getCheckoutCountries = (...args: Parameters<Actions["getCheckoutCountries"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getCheckoutCountries"]>>>("src.frontend.actions.CheckoutShipping.getCheckoutCountries", ...args);
export const getCheckoutShippingOptions = (...args: Parameters<Actions["getCheckoutShippingOptions"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getCheckoutShippingOptions"]>>>("src.frontend.actions.CheckoutShipping.getCheckoutShippingOptions", ...args);
