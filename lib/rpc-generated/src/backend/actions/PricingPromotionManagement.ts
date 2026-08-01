/* Auto-generated */
import { rpcCall } from '@/tools/rpc-client';
type Actions = typeof import('../../../../../src/backend/actions/PricingPromotionManagement');

export const getPricingPromotionConfig = (...args: Parameters<Actions["getPricingPromotionConfig"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getPricingPromotionConfig"]>>>("src.backend.actions.PricingPromotionManagement.getPricingPromotionConfig", ...args);
export const savePricingPromotionConfigAdmin = (...args: Parameters<Actions["savePricingPromotionConfigAdmin"]>) => 
  rpcCall<Awaited<ReturnType<Actions["savePricingPromotionConfigAdmin"]>>>("src.backend.actions.PricingPromotionManagement.savePricingPromotionConfigAdmin", ...args);
