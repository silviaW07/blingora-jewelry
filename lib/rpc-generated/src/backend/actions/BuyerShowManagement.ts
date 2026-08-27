/* Auto-generated */
import { rpcCall } from '@/tools/rpc-client';
type Actions = typeof import('../../../../../src/backend/actions/BuyerShowManagement');

export const listBuyerShowMediaAdmin = (...args: Parameters<Actions["listBuyerShowMediaAdmin"]>) => 
  rpcCall<Awaited<ReturnType<Actions["listBuyerShowMediaAdmin"]>>>("src.backend.actions.BuyerShowManagement.listBuyerShowMediaAdmin", ...args);
export const createBuyerShowMedia = (...args: Parameters<Actions["createBuyerShowMedia"]>) => 
  rpcCall<Awaited<ReturnType<Actions["createBuyerShowMedia"]>>>("src.backend.actions.BuyerShowManagement.createBuyerShowMedia", ...args);
export const updateBuyerShowMedia = (...args: Parameters<Actions["updateBuyerShowMedia"]>) => 
  rpcCall<Awaited<ReturnType<Actions["updateBuyerShowMedia"]>>>("src.backend.actions.BuyerShowManagement.updateBuyerShowMedia", ...args);
export const deleteBuyerShowMedia = (...args: Parameters<Actions["deleteBuyerShowMedia"]>) => 
  rpcCall<Awaited<ReturnType<Actions["deleteBuyerShowMedia"]>>>("src.backend.actions.BuyerShowManagement.deleteBuyerShowMedia", ...args);
export const listBuyerShowCommentsAdmin = (...args: Parameters<Actions["listBuyerShowCommentsAdmin"]>) => 
  rpcCall<Awaited<ReturnType<Actions["listBuyerShowCommentsAdmin"]>>>("src.backend.actions.BuyerShowManagement.listBuyerShowCommentsAdmin", ...args);
export const reviewBuyerShowComment = (...args: Parameters<Actions["reviewBuyerShowComment"]>) => 
  rpcCall<Awaited<ReturnType<Actions["reviewBuyerShowComment"]>>>("src.backend.actions.BuyerShowManagement.reviewBuyerShowComment", ...args);
export const deleteBuyerShowComment = (...args: Parameters<Actions["deleteBuyerShowComment"]>) => 
  rpcCall<Awaited<ReturnType<Actions["deleteBuyerShowComment"]>>>("src.backend.actions.BuyerShowManagement.deleteBuyerShowComment", ...args);
