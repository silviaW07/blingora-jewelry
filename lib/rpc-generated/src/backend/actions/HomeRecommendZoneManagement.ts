/* Auto-generated */
import { rpcCall } from '@/tools/rpc-client';
type Actions = typeof import('../../../../../src/backend/actions/HomeRecommendZoneManagement');

export const getRecommendZoneList = (...args: Parameters<Actions["getRecommendZoneList"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getRecommendZoneList"]>>>("src.backend.actions.HomeRecommendZoneManagement.getRecommendZoneList", ...args);
export const getRecommendZoneDetail = (...args: Parameters<Actions["getRecommendZoneDetail"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getRecommendZoneDetail"]>>>("src.backend.actions.HomeRecommendZoneManagement.getRecommendZoneDetail", ...args);
export const createRecommendZone = (...args: Parameters<Actions["createRecommendZone"]>) => 
  rpcCall<Awaited<ReturnType<Actions["createRecommendZone"]>>>("src.backend.actions.HomeRecommendZoneManagement.createRecommendZone", ...args);
export const updateRecommendZone = (...args: Parameters<Actions["updateRecommendZone"]>) => 
  rpcCall<Awaited<ReturnType<Actions["updateRecommendZone"]>>>("src.backend.actions.HomeRecommendZoneManagement.updateRecommendZone", ...args);
export const duplicateRecommendZone = (...args: Parameters<Actions["duplicateRecommendZone"]>) => 
  rpcCall<Awaited<ReturnType<Actions["duplicateRecommendZone"]>>>("src.backend.actions.HomeRecommendZoneManagement.duplicateRecommendZone", ...args);
export const deleteRecommendZone = (...args: Parameters<Actions["deleteRecommendZone"]>) => 
  rpcCall<Awaited<ReturnType<Actions["deleteRecommendZone"]>>>("src.backend.actions.HomeRecommendZoneManagement.deleteRecommendZone", ...args);
export const updateRecommendZoneStatus = (...args: Parameters<Actions["updateRecommendZoneStatus"]>) => 
  rpcCall<Awaited<ReturnType<Actions["updateRecommendZoneStatus"]>>>("src.backend.actions.HomeRecommendZoneManagement.updateRecommendZoneStatus", ...args);
export const batchUpdateZoneSortWeight = (...args: Parameters<Actions["batchUpdateZoneSortWeight"]>) => 
  rpcCall<Awaited<ReturnType<Actions["batchUpdateZoneSortWeight"]>>>("src.backend.actions.HomeRecommendZoneManagement.batchUpdateZoneSortWeight", ...args);
export const batchUpdateZoneItemSortWeight = (...args: Parameters<Actions["batchUpdateZoneItemSortWeight"]>) => 
  rpcCall<Awaited<ReturnType<Actions["batchUpdateZoneItemSortWeight"]>>>("src.backend.actions.HomeRecommendZoneManagement.batchUpdateZoneItemSortWeight", ...args);
export const getSelectableProducts = (...args: Parameters<Actions["getSelectableProducts"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getSelectableProducts"]>>>("src.backend.actions.HomeRecommendZoneManagement.getSelectableProducts", ...args);
export const getSelectableCategories = (...args: Parameters<Actions["getSelectableCategories"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getSelectableCategories"]>>>("src.backend.actions.HomeRecommendZoneManagement.getSelectableCategories", ...args);
export const createDraftDisplayProducts = (...args: Parameters<Actions["createDraftDisplayProducts"]>) => 
  rpcCall<Awaited<ReturnType<Actions["createDraftDisplayProducts"]>>>("src.backend.actions.HomeRecommendZoneManagement.createDraftDisplayProducts", ...args);
export const deleteDraftDisplayProducts = (...args: Parameters<Actions["deleteDraftDisplayProducts"]>) => 
  rpcCall<Awaited<ReturnType<Actions["deleteDraftDisplayProducts"]>>>("src.backend.actions.HomeRecommendZoneManagement.deleteDraftDisplayProducts", ...args);
