/* Auto-generated */
import { rpcCall } from '@/tools/rpc-client';
type Actions = typeof import('../../../../../src/backend/actions/homeRecommendZoneCache');

export const readHomeRecommendZonesWithCache = (...args: Parameters<Actions["readHomeRecommendZonesWithCache"]>) => 
  rpcCall<Awaited<ReturnType<Actions["readHomeRecommendZonesWithCache"]>>>("src.backend.actions.homeRecommendZoneCache.readHomeRecommendZonesWithCache", ...args);
export const invalidateHomeRecommendZoneCache = (...args: Parameters<Actions["invalidateHomeRecommendZoneCache"]>) => 
  rpcCall<Awaited<ReturnType<Actions["invalidateHomeRecommendZoneCache"]>>>("src.backend.actions.homeRecommendZoneCache.invalidateHomeRecommendZoneCache", ...args);
