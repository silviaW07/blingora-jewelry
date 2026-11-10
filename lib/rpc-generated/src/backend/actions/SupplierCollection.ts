/* Auto-generated */
import { rpcCall } from '@/tools/rpc-client';
type Actions = typeof import('../../../../../src/backend/actions/SupplierCollection');

export const listSupplierCollections = (...args: Parameters<Actions["listSupplierCollections"]>) => 
  rpcCall<Awaited<ReturnType<Actions["listSupplierCollections"]>>>("src.backend.actions.SupplierCollection.listSupplierCollections", ...args);
export const createSupplierCollection = (...args: Parameters<Actions["createSupplierCollection"]>) => 
  rpcCall<Awaited<ReturnType<Actions["createSupplierCollection"]>>>("src.backend.actions.SupplierCollection.createSupplierCollection", ...args);
export const updateSupplierCollection = (...args: Parameters<Actions["updateSupplierCollection"]>) => 
  rpcCall<Awaited<ReturnType<Actions["updateSupplierCollection"]>>>("src.backend.actions.SupplierCollection.updateSupplierCollection", ...args);
export const deleteSupplierCollection = (...args: Parameters<Actions["deleteSupplierCollection"]>) => 
  rpcCall<Awaited<ReturnType<Actions["deleteSupplierCollection"]>>>("src.backend.actions.SupplierCollection.deleteSupplierCollection", ...args);
