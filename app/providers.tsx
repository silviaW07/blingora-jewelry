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
  // is-narrow follows max-width: 1023px (same viewport for every browser).
  useLayoutEffect(() => {
    const apply = () => {
      syncNarrowHtmlClass()
    }
    apply()
    const mql = window.matchMedia('(max-width: 1023px)')
    mql.addEventListener('change', apply)
    window.addEventListener('resize', apply)
    window.visualViewport?.addEventListener('resize', apply)
    return () => {
      mql.removeEventListener('change', apply)
      window.removeEventListener('resize', apply)
      window.visualViewport?.removeEventListener('resize', apply)
    }
  }, [])

  return <>{children}</>
}
