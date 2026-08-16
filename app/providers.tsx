'use client';

import React, { Suspense, useEffect, useLayoutEffect } from 'react';
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

  // Re-apply after hydration: React resets <html className> and drops is-narrow.
  // Homepage used to re-set it; other routes did not, so Chrome ~980px hid mobile pages.
  useLayoutEffect(() => {
    const apply = () => {
      syncNarrowHtmlClass()
    }
    apply()
    const mql = window.matchMedia('(max-width: 767px)')
    mql.addEventListener('change', apply)
    window.addEventListener('resize', apply)
    window.visualViewport?.addEventListener('resize', apply)
    return () => {
      mql.removeEventListener('change', apply)
      window.removeEventListener('resize', apply)
      window.visualViewport?.removeEventListener('resize', apply)
    }
  }, [])

  return (
    <Suspense fallback={null}>
      {children}
    </Suspense>
  )
}
