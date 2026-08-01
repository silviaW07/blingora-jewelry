/* Auto-generated */
import { rpcCall } from '@/tools/rpc-client';
type Actions = typeof import('../../../../../src/backend/actions/CategoryManagement');

export const getKeywordGroups = (...args: Parameters<Actions["getKeywordGroups"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getKeywordGroups"]>>>("src.backend.actions.CategoryManagement.getKeywordGroups", ...args);
export const searchKeywordGroupProducts = (...args: Parameters<Actions["searchKeywordGroupProducts"]>) => 
  rpcCall<Awaited<ReturnType<Actions["searchKeywordGroupProducts"]>>>("src.backend.actions.CategoryManagement.searchKeywordGroupProducts", ...args);
export const removeKeywordGroupProductLink = (...args: Parameters<Actions["removeKeywordGroupProductLink"]>) => 
  rpcCall<Awaited<ReturnType<Actions["removeKeywordGroupProductLink"]>>>("src.backend.actions.CategoryManagement.removeKeywordGroupProductLink", ...args);
export const batchRemoveKeywordGroupProductLinks = (...args: Parameters<Actions["batchRemoveKeywordGroupProductLinks"]>) => 
  rpcCall<Awaited<ReturnType<Actions["batchRemoveKeywordGroupProductLinks"]>>>("src.backend.actions.CategoryManagement.batchRemoveKeywordGroupProductLinks", ...args);
export const getCategoryList = (...args: Parameters<Actions["getCategoryList"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getCategoryList"]>>>("src.backend.actions.CategoryManagement.getCategoryList", ...args);
export const createCategory = (...args: Parameters<Actions["createCategory"]>) => 
  rpcCall<Awaited<ReturnType<Actions["createCategory"]>>>("src.backend.actions.CategoryManagement.createCategory", ...args);
export const batchCreateSubcategories = (...args: Parameters<Actions["batchCreateSubcategories"]>) => 
  rpcCall<Awaited<ReturnType<Actions["batchCreateSubcategories"]>>>("src.backend.actions.CategoryManagement.batchCreateSubcategories", ...args);
export const updateCategory = (...args: Parameters<Actions["updateCategory"]>) => 
  rpcCall<Awaited<ReturnType<Actions["updateCategory"]>>>("src.backend.actions.CategoryManagement.updateCategory", ...args);
export const updateCategoryStatus = (...args: Parameters<Actions["updateCategoryStatus"]>) => 
  rpcCall<Awaited<ReturnType<Actions["updateCategoryStatus"]>>>("src.backend.actions.CategoryManagement.updateCategoryStatus", ...args);
export const updateCategorySortWeight = (...args: Parameters<Actions["updateCategorySortWeight"]>) => 
  rpcCall<Awaited<ReturnType<Actions["updateCategorySortWeight"]>>>("src.backend.actions.CategoryManagement.updateCategorySortWeight", ...args);
export const updateCategoryPriceCoefficient = (...args: Parameters<Actions["updateCategoryPriceCoefficient"]>) => 
  rpcCall<Awaited<ReturnType<Actions["updateCategoryPriceCoefficient"]>>>("src.backend.actions.CategoryManagement.updateCategoryPriceCoefficient", ...args);
export const batchUpdateCategorySortWeight = (...args: Parameters<Actions["batchUpdateCategorySortWeight"]>) => 
  rpcCall<Awaited<ReturnType<Actions["batchUpdateCategorySortWeight"]>>>("src.backend.actions.CategoryManagement.batchUpdateCategorySortWeight", ...args);
export const saveHomepagePosterConfig = (...args: Parameters<Actions["saveHomepagePosterConfig"]>) => 
  rpcCall<Awaited<ReturnType<Actions["saveHomepagePosterConfig"]>>>("src.backend.actions.CategoryManagement.saveHomepagePosterConfig", ...args);
export const saveCategoryRecommendedKeywords = (...args: Parameters<Actions["saveCategoryRecommendedKeywords"]>) => 
  rpcCall<Awaited<ReturnType<Actions["saveCategoryRecommendedKeywords"]>>>("src.backend.actions.CategoryManagement.saveCategoryRecommendedKeywords", ...args);
export const saveCategoryTopPromotionConfig = (...args: Parameters<Actions["saveCategoryTopPromotionConfig"]>) => 
  rpcCall<Awaited<ReturnType<Actions["saveCategoryTopPromotionConfig"]>>>("src.backend.actions.CategoryManagement.saveCategoryTopPromotionConfig", ...args);
export const deleteCategory = (...args: Parameters<Actions["deleteCategory"]>) => 
  rpcCall<Awaited<ReturnType<Actions["deleteCategory"]>>>("src.backend.actions.CategoryManagement.deleteCategory", ...args);
export const createKeywordGroup = (...args: Parameters<Actions["createKeywordGroup"]>) => 
  rpcCall<Awaited<ReturnType<Actions["createKeywordGroup"]>>>("src.backend.actions.CategoryManagement.createKeywordGroup", ...args);
export const updateKeywordGroup = (...args: Parameters<Actions["updateKeywordGroup"]>) => 
  rpcCall<Awaited<ReturnType<Actions["updateKeywordGroup"]>>>("src.backend.actions.CategoryManagement.updateKeywordGroup", ...args);
export const deleteKeywordGroup = (...args: Parameters<Actions["deleteKeywordGroup"]>) => 
  rpcCall<Awaited<ReturnType<Actions["deleteKeywordGroup"]>>>("src.backend.actions.CategoryManagement.deleteKeywordGroup", ...args);
export const createKeywordItem = (...args: Parameters<Actions["createKeywordItem"]>) => 
  rpcCall<Awaited<ReturnType<Actions["createKeywordItem"]>>>("src.backend.actions.CategoryManagement.createKeywordItem", ...args);
export const updateKeywordItem = (...args: Parameters<Actions["updateKeywordItem"]>) => 
  rpcCall<Awaited<ReturnType<Actions["updateKeywordItem"]>>>("src.backend.actions.CategoryManagement.updateKeywordItem", ...args);
export const deleteKeywordItem = (...args: Parameters<Actions["deleteKeywordItem"]>) => 
  rpcCall<Awaited<ReturnType<Actions["deleteKeywordItem"]>>>("src.backend.actions.CategoryManagement.deleteKeywordItem", ...args);
export const batchUpsertKeywordItems = (...args: Parameters<Actions["batchUpsertKeywordItems"]>) => 
  rpcCall<Awaited<ReturnType<Actions["batchUpsertKeywordItems"]>>>("src.backend.actions.CategoryManagement.batchUpsertKeywordItems", ...args);
export const batchApplyKeywordsToCategories = (...args: Parameters<Actions["batchApplyKeywordsToCategories"]>) => 
  rpcCall<Awaited<ReturnType<Actions["batchApplyKeywordsToCategories"]>>>("src.backend.actions.CategoryManagement.batchApplyKeywordsToCategories", ...args);
export const batchDeleteCategories = (...args: Parameters<Actions["batchDeleteCategories"]>) => 
  rpcCall<Awaited<ReturnType<Actions["batchDeleteCategories"]>>>("src.backend.actions.CategoryManagement.batchDeleteCategories", ...args);
export const batchUpdateCategoryStatus = (...args: Parameters<Actions["batchUpdateCategoryStatus"]>) => 
  rpcCall<Awaited<ReturnType<Actions["batchUpdateCategoryStatus"]>>>("src.backend.actions.CategoryManagement.batchUpdateCategoryStatus", ...args);
export const batchMoveCategoryParent = (...args: Parameters<Actions["batchMoveCategoryParent"]>) => 
  rpcCall<Awaited<ReturnType<Actions["batchMoveCategoryParent"]>>>("src.backend.actions.CategoryManagement.batchMoveCategoryParent", ...args);
export const getKeywordGroupTypeLabels = (...args: Parameters<Actions["getKeywordGroupTypeLabels"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getKeywordGroupTypeLabels"]>>>("src.backend.actions.CategoryManagement.getKeywordGroupTypeLabels", ...args);
