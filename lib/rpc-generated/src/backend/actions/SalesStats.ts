/* Auto-generated */
import { rpcCall } from '@/tools/rpc-client';
type Actions = typeof import('../../../../../src/backend/actions/SalesStats');

export const getSalesStatsDetail = (...args: Parameters<Actions["getSalesStatsDetail"]>) => 
  rpcCall<Awaited<ReturnType<Actions["getSalesStatsDetail"]>>>("src.backend.actions.SalesStats.getSalesStatsDetail", ...args);
export const importSalesStatsSheet = (...args: Parameters<Actions["importSalesStatsSheet"]>) => 
  rpcCall<Awaited<ReturnType<Actions["importSalesStatsSheet"]>>>("src.backend.actions.SalesStats.importSalesStatsSheet", ...args);
export const importSalesStatsImage = (...args: Parameters<Actions["importSalesStatsImage"]>) => 
  rpcCall<Awaited<ReturnType<Actions["importSalesStatsImage"]>>>("src.backend.actions.SalesStats.importSalesStatsImage", ...args);
export const clearSalesStatsLedger = (...args: Parameters<Actions["clearSalesStatsLedger"]>) => 
  rpcCall<Awaited<ReturnType<Actions["clearSalesStatsLedger"]>>>("src.backend.actions.SalesStats.clearSalesStatsLedger", ...args);
