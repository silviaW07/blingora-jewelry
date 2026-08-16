'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useUserSession } from '@/tools/FrontendSession';

export default function FrontendAuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const session = useUserSession();
  const need_auth = ['/cart', '/account', '/accountcenter', '/ordercenter'];

  useEffect(() => {
    if (!session._hasHydrated) return;
    if (session?.token) return;
    const path = String(pathname || '/');
    const needsAuth = need_auth.some((need_auth_path) => path.includes(need_auth_path));
    if (!needsAuth) return;
    if (path.includes('/customerlogin')) return;
    const redirect = encodeURIComponent(path);
    window.location.replace(`/customerlogin/?redirect=${redirect}`);
  }, [pathname, session]);

  return children;
}
