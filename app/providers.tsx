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

  useLayoutEffect(() => {
    const apply = () => {
      syncNarrowHtmlClass()
    }
    apply()
    window.addEventListener('resize', apply)
    return () => {
      window.removeEventListener('resize', apply)
    }
  }, [])

  return <>{children}</>
}
