'use client';

import React, { useEffect, useLayoutEffect } from 'react';
import { toast } from 'sonner';
import { syncNarrowHtmlClass } from '@/frontend/utils/isNarrowViewport';

export function Providers({
  children
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    window.alert = toast.info;
  }, []);

  // Re-apply after hydration: React resets <html className>.
  // Also re-lock viewport — Chrome phones often keep a ~980 desktop layout width.
  useLayoutEffect(() => {
    const apply = () => {
      syncNarrowHtmlClass()
    }
    apply()
    const mql = window.matchMedia('(max-width: 1023px)')
    mql.addEventListener('change', apply)
    window.addEventListener('resize', apply)
    window.visualViewport?.addEventListener('resize', apply)
    const t0 = window.setTimeout(apply, 0)
    const t1 = window.setTimeout(apply, 50)
    const t2 = window.setTimeout(apply, 200)
    return () => {
      mql.removeEventListener('change', apply)
      window.removeEventListener('resize', apply)
      window.visualViewport?.removeEventListener('resize', apply)
      window.clearTimeout(t0)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [])

  return <>{children}</>
}
