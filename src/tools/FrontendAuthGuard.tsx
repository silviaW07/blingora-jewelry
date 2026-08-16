'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useUserSession } from '@/tools/FrontendSession';

export default function FrontendAuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const session = useUserSession();
  const need_auth = ['/cart', '/account', '/accountcenter', '/ordercenter'];
  const redirected = useRef(false);

  useEffect(() => {
    if (session?.token) {
      redirected.current = false
      return
    }
    const path = String(pathname || '/');
    const needsAuth = need_auth.some((need_auth_path) => path.includes(need_auth_path));
    if (!needsAuth) return;
    if (path.includes('/customerlogin')) return;

    const goLogin = () => {
      if (redirected.current) return
      redirected.current = true
      const returnTo = encodeURIComponent(path.endsWith('/') ? path : `${path}/`);
      window.location.replace(`/customerlogin/?returnTo=${returnTo}`);
    }

    if (session._hasHydrated) {
      goLogin()
      return
    }
    const timer = window.setTimeout(goLogin, 1200)
    return () => window.clearTimeout(timer)
  }, [pathname, session]);

  return children;
}
