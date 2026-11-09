// {"router": "/dashboard/sales", "id": "b03v", "en_name": "SalesStats"}
'use client';

import { useSalesStats } from '@/backend/hooks/useSalesStats';
import SalesStatsView from '@/backend/components/SalesStatsView';

export default function SalesStatsPage() {
  const { state, handlers } = useSalesStats();
  return <SalesStatsView state={state} handlers={handlers} />;
}
