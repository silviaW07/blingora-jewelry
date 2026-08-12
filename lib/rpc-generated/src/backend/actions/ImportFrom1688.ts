/* Auto-generated */
import { rpcCall } from '@/tools/rpc-client';
type Actions = typeof import('../../../../../src/backend/actions/ImportFrom1688');

export const loadAutoMatchSecondaryCategories = (...args: Parameters<Actions["loadAutoMatchSecondaryCategories"]>) => 
  rpcCall<Awaited<ReturnType<Actions["loadAutoMatchSecondaryCategories"]>>>("src.backend.actions.ImportFrom1688.loadAutoMatchSecondaryCategories", ...args);
export const pickBestBrandCategoryFromTitle = (...args: Parameters<Actions["pickBestBrandCategoryFromTitle"]>) => 
  rpcCall<Awaited<ReturnType<Actions["pickBestBrandCategoryFromTitle"]>>>("src.backend.actions.ImportFrom1688.pickBestBrandCategoryFromTitle", ...args);
export const pruneNoBrandCatchAllLinks = (...args: Parameters<Actions["pruneNoBrandCatchAllLinks"]>) => 
  rpcCall<Awaited<ReturnType<Actions["pruneNoBrandCatchAllLinks"]>>>("src.backend.actions.ImportFrom1688.pruneNoBrandCatchAllLinks", ...args);
export const matchSecondaryCategoriesByTitle = (...args: Parameters<Actions["matchSecondaryCategoriesByTitle"]>) => 
  rpcCall<Awaited<ReturnType<Actions["matchSecondaryCategoriesByTitle"]>>>("src.backend.actions.ImportFrom1688.matchSecondaryCategoriesByTitle", ...args);
export const pickImportPricingTargetCategory = (...args: Parameters<Actions["pickImportPricingTargetCategory"]>) => 
  rpcCall<Awaited<ReturnType<Actions["pickImportPricingTargetCategory"]>>>("src.backend.actions.ImportFrom1688.pickImportPricingTargetCategory", ...args);
export const resolveTableImportCategoryPath = (...args: Parameters<Actions["resolveTableImportCategoryPath"]>) => 
  rpcCall<Awaited<ReturnType<Actions["resolveTableImportCategoryPath"]>>>("src.backend.actions.ImportFrom1688.resolveTableImportCategoryPath", ...args);
export const resolveImportCategoryOwnership = (...args: Parameters<Actions["resolveImportCategoryOwnership"]>) => 
  rpcCall<Awaited<ReturnType<Actions["resolveImportCategoryOwnership"]>>>("src.backend.actions.ImportFrom1688.resolveImportCategoryOwnership", ...args);
export const expandLinkedCategoryIdsWithParents = (...args: Parameters<Actions["expandLinkedCategoryIdsWithParents"]>) => 
  rpcCall<Awaited<ReturnType<Actions["expandLinkedCategoryIdsWithParents"]>>>("src.backend.actions.ImportFrom1688.expandLinkedCategoryIdsWithParents", ...args);
export const check1688OfferLiveStatus = (...args: Parameters<Actions["check1688OfferLiveStatus"]>) => 
  rpcCall<Awaited<ReturnType<Actions["check1688OfferLiveStatus"]>>>("src.backend.actions.ImportFrom1688.check1688OfferLiveStatus", ...args);
export const normalizeCategoryMatchText = (...args: Parameters<Actions["normalizeCategoryMatchText"]>) => 
  rpcCall<Awaited<ReturnType<Actions["normalizeCategoryMatchText"]>>>("src.backend.actions.ImportFrom1688.normalizeCategoryMatchText", ...args);
export const isNoBrandCatchAllCategoryName = (...args: Parameters<Actions["isNoBrandCatchAllCategoryName"]>) => 
  rpcCall<Awaited<ReturnType<Actions["isNoBrandCatchAllCategoryName"]>>>("src.backend.actions.ImportFrom1688.isNoBrandCatchAllCategoryName", ...args);
export const containsCategoryMatchToken = (...args: Parameters<Actions["containsCategoryMatchToken"]>) => 
  rpcCall<Awaited<ReturnType<Actions["containsCategoryMatchToken"]>>>("src.backend.actions.ImportFrom1688.containsCategoryMatchToken", ...args);
export const buildCategoryMatchCorpus = (...args: Parameters<Actions["buildCategoryMatchCorpus"]>) => 
  rpcCall<Awaited<ReturnType<Actions["buildCategoryMatchCorpus"]>>>("src.backend.actions.ImportFrom1688.buildCategoryMatchCorpus", ...args);
export const splitTableCategoryPathTokens = (...args: Parameters<Actions["splitTableCategoryPathTokens"]>) => 
  rpcCall<Awaited<ReturnType<Actions["splitTableCategoryPathTokens"]>>>("src.backend.actions.ImportFrom1688.splitTableCategoryPathTokens", ...args);
export const getCategoryOptions = (...args: Parameters<Actions["getCategoryOptions"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getCategoryOptions"]>>>("src.backend.actions.ImportFrom1688.getCategoryOptions", ...args);
export const getImportTaskList = (...args: Parameters<Actions["getImportTaskList"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getImportTaskList"]>>>("src.backend.actions.ImportFrom1688.getImportTaskList", ...args);
export const getImportTaskDetail = (...args: Parameters<Actions["getImportTaskDetail"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getImportTaskDetail"]>>>("src.backend.actions.ImportFrom1688.getImportTaskDetail", ...args);
export const getParseJobRuntimeStatus = (...args: Parameters<Actions["getParseJobRuntimeStatus"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getParseJobRuntimeStatus"]>>>("src.backend.actions.ImportFrom1688.getParseJobRuntimeStatus", ...args);
export const cancelPendingImportParseJob = (...args: Parameters<Actions["cancelPendingImportParseJob"]>) => 
  rpcCall<Awaited<ReturnType<Actions["cancelPendingImportParseJob"]>>>("src.backend.actions.ImportFrom1688.cancelPendingImportParseJob", ...args);
export const getPendingImportQueue = (...args: Parameters<Actions["getPendingImportQueue"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getPendingImportQueue"]>>>("src.backend.actions.ImportFrom1688.getPendingImportQueue", ...args);
export const parseTableImportContent = (...args: Parameters<Actions["parseTableImportContent"]>) => 
  rpcCall<Awaited<ReturnType<Actions["parseTableImportContent"]>>>("src.backend.actions.ImportFrom1688.parseTableImportContent", ...args);
export const createProductsFromTable = (...args: Parameters<Actions["createProductsFromTable"]>) => 
  rpcCall<Awaited<ReturnType<Actions["createProductsFromTable"]>>>("src.backend.actions.ImportFrom1688.createProductsFromTable", ...args);
export const createImportTask = (...args: Parameters<Actions["createImportTask"]>) => 
  rpcCall<Awaited<ReturnType<Actions["createImportTask"]>>>("src.backend.actions.ImportFrom1688.createImportTask", ...args);
export const createPinduoduoImportTask = (...args: Parameters<Actions["createPinduoduoImportTask"]>) => 
  rpcCall<Awaited<ReturnType<Actions["createPinduoduoImportTask"]>>>("src.backend.actions.ImportFrom1688.createPinduoduoImportTask", ...args);
export const startParseTask = (...args: Parameters<Actions["startParseTask"]>) => 
  rpcCall<Awaited<ReturnType<Actions["startParseTask"]>>>("src.backend.actions.ImportFrom1688.startParseTask", ...args);
export const updateTaskItemPreview = (...args: Parameters<Actions["updateTaskItemPreview"]>) => 
  rpcCall<Awaited<ReturnType<Actions["updateTaskItemPreview"]>>>("src.backend.actions.ImportFrom1688.updateTaskItemPreview", ...args);
export const updatePendingImportGallery = (...args: Parameters<Actions["updatePendingImportGallery"]>) => 
  rpcCall<Awaited<ReturnType<Actions["updatePendingImportGallery"]>>>("src.backend.actions.ImportFrom1688.updatePendingImportGallery", ...args);
export const inlineUpdatePendingImportItemField = (...args: Parameters<Actions["inlineUpdatePendingImportItemField"]>) => 
  rpcCall<Awaited<ReturnType<Actions["inlineUpdatePendingImportItemField"]>>>("src.backend.actions.ImportFrom1688.inlineUpdatePendingImportItemField", ...args);
export const batchUpdatePendingImportItemField = (...args: Parameters<Actions["batchUpdatePendingImportItemField"]>) => 
  rpcCall<Awaited<ReturnType<Actions["batchUpdatePendingImportItemField"]>>>("src.backend.actions.ImportFrom1688.batchUpdatePendingImportItemField", ...args);
export const inlineUpdatePendingImportSkuField = (...args: Parameters<Actions["inlineUpdatePendingImportSkuField"]>) => 
  rpcCall<Awaited<ReturnType<Actions["inlineUpdatePendingImportSkuField"]>>>("src.backend.actions.ImportFrom1688.inlineUpdatePendingImportSkuField", ...args);
export const publishPendingImportItems = (...args: Parameters<Actions["publishPendingImportItems"]>) => 
  rpcCall<Awaited<ReturnType<Actions["publishPendingImportItems"]>>>("src.backend.actions.ImportFrom1688.publishPendingImportItems", ...args);
export const reparsePendingImportItems = (...args: Parameters<Actions["reparsePendingImportItems"]>) => 
  rpcCall<Awaited<ReturnType<Actions["reparsePendingImportItems"]>>>("src.backend.actions.ImportFrom1688.reparsePendingImportItems", ...args);
export const confirmImportProducts = (...args: Parameters<Actions["confirmImportProducts"]>) => 
  rpcCall<Awaited<ReturnType<Actions["confirmImportProducts"]>>>("src.backend.actions.ImportFrom1688.confirmImportProducts", ...args);
export const retryImportTask = (...args: Parameters<Actions["retryImportTask"]>) => 
  rpcCall<Awaited<ReturnType<Actions["retryImportTask"]>>>("src.backend.actions.ImportFrom1688.retryImportTask", ...args);
export const deleteImportTask = (...args: Parameters<Actions["deleteImportTask"]>) => 
  rpcCall<Awaited<ReturnType<Actions["deleteImportTask"]>>>("src.backend.actions.ImportFrom1688.deleteImportTask", ...args);
