// {"router": "/dashboard/stats", "id": "b03s", "en_name": "ListingStats"}
'use client';

import { useListingStats } from '@/backend/hooks/useListingStats';
import ListingStatsView from '@/backend/components/ListingStatsView';

export default function ListingStatsPage() {
  const { state, handlers } = useListingStats();
  return <ListingStatsView state={state} handlers={handlers} />;
}
