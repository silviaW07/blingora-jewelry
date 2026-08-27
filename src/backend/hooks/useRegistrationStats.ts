'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getRegistrationStatsDetail } from '@/backend/actions/Dashboard';
import type { RegistrationStatsDetail_Output } from '@/backend/types/Dashboard';
import { Dashboard } from '@/backend/route-params';

export function useRegistrationStats() {
  const router = useRouter();
  const [detail, setDetail] = useState<RegistrationStatsDetail_Output | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getRegistrationStatsDetail()
      .then((value) => {
        if (!cancelled) setDetail(value);
      })
      .catch(() => {
        if (!cancelled) toast.error('注册统计加载失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    state: { detail, loading },
    handlers: {
      handleBack: () => Dashboard.navigateTo(router),
    },
  };
}
