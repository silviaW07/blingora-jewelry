/* Auto-generated */
import { rpcCall } from '@/tools/rpc-client';
type Actions = typeof import('../../../../../src/backend/actions/ProductManagement');

export const getProductBindingMeta = (...args: Parameters<Actions["getProductBindingMeta"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getProductBindingMeta"]>>>("src.backend.actions.ProductManagement.getProductBindingMeta", ...args);
export const getCategoryOptions = (...args: Parameters<Actions["getCategoryOptions"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getCategoryOptions"]>>>("src.backend.actions.ProductManagement.getCategoryOptions", ...args);
export const getProductList = (...args: Parameters<Actions["getProductList"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getProductList"]>>>("src.backend.actions.ProductManagement.getProductList", ...args);
export const getProductDetail = (...args: Parameters<Actions["getProductDetail"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getProductDetail"]>>>("src.backend.actions.ProductManagement.getProductDetail", ...args);
export const createProduct = (...args: Parameters<Actions["createProduct"]>) => 
  rpcCall<Awaited<ReturnType<Actions["createProduct"]>>>("src.backend.actions.ProductManagement.createProduct", ...args);
export const batchImportProducts = (...args: Parameters<Actions["batchImportProducts"]>) => 
  rpcCall<Awaited<ReturnType<Actions["batchImportProducts"]>>>("src.backend.actions.ProductManagement.batchImportProducts", ...args);
export const updateProduct = (...args: Parameters<Actions["updateProduct"]>) => 
  rpcCall<Awaited<ReturnType<Actions["updateProduct"]>>>("src.backend.actions.ProductManagement.updateProduct", ...args);
export const updateProductStatus = (...args: Parameters<Actions["updateProductStatus"]>) => 
  rpcCall<Awaited<ReturnType<Actions["updateProductStatus"]>>>("src.backend.actions.ProductManagement.updateProductStatus", ...args);
export const batchUpdateProductStatus = (...args: Parameters<Actions["batchUpdateProductStatus"]>) => 
  rpcCall<Awaited<ReturnType<Actions["batchUpdateProductStatus"]>>>("src.backend.actions.ProductManagement.batchUpdateProductStatus", ...args);
export const batchUpdatePriceCoefficient = (...args: Parameters<Actions["batchUpdatePriceCoefficient"]>) => 
  rpcCall<Awaited<ReturnType<Actions["batchUpdatePriceCoefficient"]>>>("src.backend.actions.ProductManagement.batchUpdatePriceCoefficient", ...args);
export const inlineUpdateProductField = (...args: Parameters<Actions["inlineUpdateProductField"]>) => 
  rpcCall<Awaited<ReturnType<Actions["inlineUpdateProductField"]>>>("src.backend.actions.ProductManagement.inlineUpdateProductField", ...args);
export const inlineUpdateProductSkuField = (...args: Parameters<Actions["inlineUpdateProductSkuField"]>) => 
  rpcCall<Awaited<ReturnType<Actions["inlineUpdateProductSkuField"]>>>("src.backend.actions.ProductManagement.inlineUpdateProductSkuField", ...args);
export const batchUpdateProductCategory = (...args: Parameters<Actions["batchUpdateProductCategory"]>) => 
  rpcCall<Awaited<ReturnType<Actions["batchUpdateProductCategory"]>>>("src.backend.actions.ProductManagement.batchUpdateProductCategory", ...args);
export const batchBindProductCategories = (...args: Parameters<Actions["batchBindProductCategories"]>) => 
  rpcCall<Awaited<ReturnType<Actions["batchBindProductCategories"]>>>("src.backend.actions.ProductManagement.batchBindProductCategories", ...args);
export const batchUnbindProductCategories = (...args: Parameters<Actions["batchUnbindProductCategories"]>) => 
  rpcCall<Awaited<ReturnType<Actions["batchUnbindProductCategories"]>>>("src.backend.actions.ProductManagement.batchUnbindProductCategories", ...args);
export const getCategoryProductPreview = (...args: Parameters<Actions["getCategoryProductPreview"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getCategoryProductPreview"]>>>("src.backend.actions.ProductManagement.getCategoryProductPreview", ...args);
export const unbindProductCategory = (...args: Parameters<Actions["unbindProductCategory"]>) => 
  rpcCall<Awaited<ReturnType<Actions["unbindProductCategory"]>>>("src.backend.actions.ProductManagement.unbindProductCategory", ...args);
export const batchBindProductKeywords = (...args: Parameters<Actions["batchBindProductKeywords"]>) => 
  rpcCall<Awaited<ReturnType<Actions["batchBindProductKeywords"]>>>("src.backend.actions.ProductManagement.batchBindProductKeywords", ...args);
export const batchUpdateManagementStatus = (...args: Parameters<Actions["batchUpdateManagementStatus"]>) => 
  rpcCall<Awaited<ReturnType<Actions["batchUpdateManagementStatus"]>>>("src.backend.actions.ProductManagement.batchUpdateManagementStatus", ...args);
export const batchUpdateProductWeightPrice = (...args: Parameters<Actions["batchUpdateProductWeightPrice"]>) => 
  rpcCall<Awaited<ReturnType<Actions["batchUpdateProductWeightPrice"]>>>("src.backend.actions.ProductManagement.batchUpdateProductWeightPrice", ...args);
export const batchUpdateMinOrderQty = (...args: Parameters<Actions["batchUpdateMinOrderQty"]>) => 
  rpcCall<Awaited<ReturnType<Actions["batchUpdateMinOrderQty"]>>>("src.backend.actions.ProductManagement.batchUpdateMinOrderQty", ...args);
export const createPendingImportTaskForProductManagement = (...args: Parameters<Actions["createPendingImportTaskForProductManagement"]>) => 
  rpcCall<Awaited<ReturnType<Actions["createPendingImportTaskForProductManagement"]>>>("src.backend.actions.ProductManagement.createPendingImportTaskForProductManagement", ...args);
export const startPendingImportTaskForProductManagement = (...args: Parameters<Actions["startPendingImportTaskForProductManagement"]>) => 
  rpcCall<Awaited<ReturnType<Actions["startPendingImportTaskForProductManagement"]>>>("src.backend.actions.ProductManagement.startPendingImportTaskForProductManagement", ...args);
export const retryPendingImportTaskForProductManagement = (...args: Parameters<Actions["retryPendingImportTaskForProductManagement"]>) => 
  rpcCall<Awaited<ReturnType<Actions["retryPendingImportTaskForProductManagement"]>>>("src.backend.actions.ProductManagement.retryPendingImportTaskForProductManagement", ...args);
export const getPendingImportQueue = (...args: Parameters<Actions["getPendingImportQueue"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getPendingImportQueue"]>>>("src.backend.actions.ProductManagement.getPendingImportQueue", ...args);
export const inlineUpdatePendingImportItemField = (...args: Parameters<Actions["inlineUpdatePendingImportItemField"]>) => 
  rpcCall<Awaited<ReturnType<Actions["inlineUpdatePendingImportItemField"]>>>("src.backend.actions.ProductManagement.inlineUpdatePendingImportItemField", ...args);
export const batchUpdatePendingImportItemField = (...args: Parameters<Actions["batchUpdatePendingImportItemField"]>) => 
  rpcCall<Awaited<ReturnType<Actions["batchUpdatePendingImportItemField"]>>>("src.backend.actions.ProductManagement.batchUpdatePendingImportItemField", ...args);
export const inlineUpdatePendingImportSkuField = (...args: Parameters<Actions["inlineUpdatePendingImportSkuField"]>) => 
  rpcCall<Awaited<ReturnType<Actions["inlineUpdatePendingImportSkuField"]>>>("src.backend.actions.ProductManagement.inlineUpdatePendingImportSkuField", ...args);
export const updatePendingImportGallery = (...args: Parameters<Actions["updatePendingImportGallery"]>) => 
  rpcCall<Awaited<ReturnType<Actions["updatePendingImportGallery"]>>>("src.backend.actions.ProductManagement.updatePendingImportGallery", ...args);
export const publishPendingImportItems = (...args: Parameters<Actions["publishPendingImportItems"]>) => 
  rpcCall<Awaited<ReturnType<Actions["publishPendingImportItems"]>>>("src.backend.actions.ProductManagement.publishPendingImportItems", ...args);
export const reparsePendingImportItems = (...args: Parameters<Actions["reparsePendingImportItems"]>) => 
  rpcCall<Awaited<ReturnType<Actions["reparsePendingImportItems"]>>>("src.backend.actions.ProductManagement.reparsePendingImportItems", ...args);
export const cancelPendingImportParseJob = (...args: Parameters<Actions["cancelPendingImportParseJob"]>) => 
  rpcCall<Awaited<ReturnType<Actions["cancelPendingImportParseJob"]>>>("src.backend.actions.ProductManagement.cancelPendingImportParseJob", ...args);
export const batchDeletePendingImportItems = (...args: Parameters<Actions["batchDeletePendingImportItems"]>) => 
  rpcCall<Awaited<ReturnType<Actions["batchDeletePendingImportItems"]>>>("src.backend.actions.ProductManagement.batchDeletePendingImportItems", ...args);
export const returnProductsToPendingUpload = (...args: Parameters<Actions["returnProductsToPendingUpload"]>) => 
  rpcCall<Awaited<ReturnType<Actions["returnProductsToPendingUpload"]>>>("src.backend.actions.ProductManagement.returnProductsToPendingUpload", ...args);
export const deleteProduct = (...args: Parameters<Actions["deleteProduct"]>) => 
  rpcCall<Awaited<ReturnType<Actions["deleteProduct"]>>>("src.backend.actions.ProductManagement.deleteProduct", ...args);
export const batchDeleteProduct = (...args: Parameters<Actions["batchDeleteProduct"]>) => 
  rpcCall<Awaited<ReturnType<Actions["batchDeleteProduct"]>>>("src.backend.actions.ProductManagement.batchDeleteProduct", ...args);
export const sync1688ProductStatus = (...args: Parameters<Actions["sync1688ProductStatus"]>) => 
  rpcCall<Awaited<ReturnType<Actions["sync1688ProductStatus"]>>>("src.backend.actions.ProductManagement.sync1688ProductStatus", ...args);
export const batchAppendProductAdminNotes = (...args: Parameters<Actions["batchAppendProductAdminNotes"]>) => 
  rpcCall<Awaited<ReturnType<Actions["batchAppendProductAdminNotes"]>>>("src.backend.actions.ProductManagement.batchAppendProductAdminNotes", ...args);
export const batchAppendProductTitleSuffix = (...args: Parameters<Actions["batchAppendProductTitleSuffix"]>) => 
  rpcCall<Awaited<ReturnType<Actions["batchAppendProductTitleSuffix"]>>>("src.backend.actions.ProductManagement.batchAppendProductTitleSuffix", ...args);
export const batchAppendPendingImportTitleSuffix = (...args: Parameters<Actions["batchAppendPendingImportTitleSuffix"]>) => 
  rpcCall<Awaited<ReturnType<Actions["batchAppendPendingImportTitleSuffix"]>>>("src.backend.actions.ProductManagement.batchAppendPendingImportTitleSuffix", ...args);
export const updateProductStock = (...args: Parameters<Actions["updateProductStock"]>) => 
  rpcCall<Awaited<ReturnType<Actions["updateProductStock"]>>>("src.backend.actions.ProductManagement.updateProductStock", ...args);
export const reclassifyPublishedProductsBySecondaryMatch = (...args: Parameters<Actions["reclassifyPublishedProductsBySecondaryMatch"]>) => 
  rpcCall<Awaited<ReturnType<Actions["reclassifyPublishedProductsBySecondaryMatch"]>>>("src.backend.actions.ProductManagement.reclassifyPublishedProductsBySecondaryMatch", ...args);
export const calibratePendingImportItems = (...args: Parameters<Actions["calibratePendingImportItems"]>) => 
  rpcCall<Awaited<ReturnType<Actions["calibratePendingImportItems"]>>>("src.backend.actions.ProductManagement.calibratePendingImportItems", ...args);
export const applyCalibrateCategoryEdits = (...args: Parameters<Actions["applyCalibrateCategoryEdits"]>) => 
  rpcCall<Awaited<ReturnType<Actions["applyCalibrateCategoryEdits"]>>>("src.backend.actions.ProductManagement.applyCalibrateCategoryEdits", ...args);
export const autoClassifyPriceThresholdProducts = (...args: Parameters<Actions["autoClassifyPriceThresholdProducts"]>) => 
  rpcCall<Awaited<ReturnType<Actions["autoClassifyPriceThresholdProducts"]>>>("src.backend.actions.ProductManagement.autoClassifyPriceThresholdProducts", ...args);
export const backfillAllTitleFilterCategories = (...args: Parameters<Actions["backfillAllTitleFilterCategories"]>) => 
  rpcCall<Awaited<ReturnType<Actions["backfillAllTitleFilterCategories"]>>>("src.backend.actions.ProductManagement.backfillAllTitleFilterCategories", ...args);
export const batchTranslateProductTitlesToSpanish = (...args: Parameters<Actions["batchTranslateProductTitlesToSpanish"]>) => 
  rpcCall<Awaited<ReturnType<Actions["batchTranslateProductTitlesToSpanish"]>>>("src.backend.actions.ProductManagement.batchTranslateProductTitlesToSpanish", ...args);
export const getHomeFeaturedKeywords = (...args: Parameters<Actions["getHomeFeaturedKeywords"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getHomeFeaturedKeywords"]>>>("src.backend.actions.ProductManagement.getHomeFeaturedKeywords", ...args);
export const saveHomeFeaturedKeywords = (...args: Parameters<Actions["saveHomeFeaturedKeywords"]>) => 
  rpcCall<Awaited<ReturnType<Actions["saveHomeFeaturedKeywords"]>>>("src.backend.actions.ProductManagement.saveHomeFeaturedKeywords", ...args);
