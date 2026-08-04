/* Auto-generated */
import { rpcCall } from '@/tools/rpc-client';
type Actions = typeof import('../../../../../src/frontend/actions/Home');

export const getHomeRecommendZones = (...args: Parameters<Actions["getHomeRecommendZones"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getHomeRecommendZones"]>>>("src.frontend.actions.Home.getHomeRecommendZones", ...args);
export const getHomeFeaturedProducts = (...args: Parameters<Actions["getHomeFeaturedProducts"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getHomeFeaturedProducts"]>>>("src.frontend.actions.Home.getHomeFeaturedProducts", ...args);
export const getBrandShelf = (...args: Parameters<Actions["getBrandShelf"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getBrandShelf"]>>>("src.frontend.actions.Home.getBrandShelf", ...args);
export const getHomeReviewSection = (...args: Parameters<Actions["getHomeReviewSection"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getHomeReviewSection"]>>>("src.frontend.actions.Home.getHomeReviewSection", ...args);
export const getHomeSceneKeywordGroups = (...args: Parameters<Actions["getHomeSceneKeywordGroups"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getHomeSceneKeywordGroups"]>>>("src.frontend.actions.Home.getHomeSceneKeywordGroups", ...args);
export const addCartItem = (...args: Parameters<Actions["addCartItem"]>) => 
  rpcCall<Awaited<ReturnType<Actions["addCartItem"]>>>("src.frontend.actions.Home.addCartItem", ...args);
export const getDailyNewArrivalCalendar = (...args: Parameters<Actions["getDailyNewArrivalCalendar"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getDailyNewArrivalCalendar"]>>>("src.frontend.actions.Home.getDailyNewArrivalCalendar", ...args);
export const getDailyNewArrivalProducts = (...args: Parameters<Actions["getDailyNewArrivalProducts"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getDailyNewArrivalProducts"]>>>("src.frontend.actions.Home.getDailyNewArrivalProducts", ...args);
export const getHomeCategoryGuide = (...args: Parameters<Actions["getHomeCategoryGuide"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getHomeCategoryGuide"]>>>("src.frontend.actions.Home.getHomeCategoryGuide", ...args);
