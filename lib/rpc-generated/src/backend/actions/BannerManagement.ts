/* Auto-generated */
import { rpcCall } from '@/tools/rpc-client';
type Actions = typeof import('../../../../../src/backend/actions/BannerManagement');

export const getBannerList = (...args: Parameters<Actions["getBannerList"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getBannerList"]>>>("src.backend.actions.BannerManagement.getBannerList", ...args);
export const createBanner = (...args: Parameters<Actions["createBanner"]>) => 
  rpcCall<Awaited<ReturnType<Actions["createBanner"]>>>("src.backend.actions.BannerManagement.createBanner", ...args);
export const updateBanner = (...args: Parameters<Actions["updateBanner"]>) => 
  rpcCall<Awaited<ReturnType<Actions["updateBanner"]>>>("src.backend.actions.BannerManagement.updateBanner", ...args);
export const deleteBanner = (...args: Parameters<Actions["deleteBanner"]>) => 
  rpcCall<Awaited<ReturnType<Actions["deleteBanner"]>>>("src.backend.actions.BannerManagement.deleteBanner", ...args);
export const batchDeleteBanners = (...args: Parameters<Actions["batchDeleteBanners"]>) => 
  rpcCall<Awaited<ReturnType<Actions["batchDeleteBanners"]>>>("src.backend.actions.BannerManagement.batchDeleteBanners", ...args);
export const batchUpdateBannerStatus = (...args: Parameters<Actions["batchUpdateBannerStatus"]>) => 
  rpcCall<Awaited<ReturnType<Actions["batchUpdateBannerStatus"]>>>("src.backend.actions.BannerManagement.batchUpdateBannerStatus", ...args);
export const updateBannerSortWeight = (...args: Parameters<Actions["updateBannerSortWeight"]>) => 
  rpcCall<Awaited<ReturnType<Actions["updateBannerSortWeight"]>>>("src.backend.actions.BannerManagement.updateBannerSortWeight", ...args);
export const updateBannerStatus = (...args: Parameters<Actions["updateBannerStatus"]>) => 
  rpcCall<Awaited<ReturnType<Actions["updateBannerStatus"]>>>("src.backend.actions.BannerManagement.updateBannerStatus", ...args);
