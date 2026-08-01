/* Auto-generated */
import { rpcCall } from '@/tools/rpc-client';
type Actions = typeof import('../../../../../src/backend/actions/ShippingChannelConfig');

export const getShippingChannelList = (...args: Parameters<Actions["getShippingChannelList"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getShippingChannelList"]>>>("src.backend.actions.ShippingChannelConfig.getShippingChannelList", ...args);
export const saveShippingChannel = (...args: Parameters<Actions["saveShippingChannel"]>) => 
  rpcCall<Awaited<ReturnType<Actions["saveShippingChannel"]>>>("src.backend.actions.ShippingChannelConfig.saveShippingChannel", ...args);
export const deleteShippingChannel = (...args: Parameters<Actions["deleteShippingChannel"]>) => 
  rpcCall<Awaited<ReturnType<Actions["deleteShippingChannel"]>>>("src.backend.actions.ShippingChannelConfig.deleteShippingChannel", ...args);
export const updateShippingChannelStatus = (...args: Parameters<Actions["updateShippingChannelStatus"]>) => 
  rpcCall<Awaited<ReturnType<Actions["updateShippingChannelStatus"]>>>("src.backend.actions.ShippingChannelConfig.updateShippingChannelStatus", ...args);
