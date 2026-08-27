'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getListingStatsDetail, getCategoryBrandShelfTree } from '@/backend/actions/Dashboard';
import type { ListingStatsDetail_Output, CategoryBrandShelfTree_Output } from '@/backend/types/Dashboard';
import { Dashboard } from '@/backend/route-params';

export function useListingStats() {
  const router = useRouter();
  const [detail, setDetail] = useState<ListingStatsDetail_Output | null>(null);
  const [shelfTree, setShelfTree] = useState<CategoryBrandShelfTree_Output | null>(null);
  const [loading, setLoading] = useState(true);
  const [gapsOnly, setGapsOnly] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.allSettled([getListingStatsDetail(), getCategoryBrandShelfTree()]).then((results) => {
      if (cancelled) return;
      if (results[0].status === 'fulfilled') setDetail(results[0].value);
      else toast.error('上架统计加载失败');
      if (results[1].status === 'fulfilled') setShelfTree(results[1].value);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    state: { detail, shelfTree, loading, gapsOnly },
    handlers: {
      handleBack: () => Dashboard.navigateTo(router),
      handleToggleGapsOnly: setGapsOnly,
    },
  };
}
