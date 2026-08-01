'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUserSession } from '@/tools/FrontendSession';

export default function FrontendAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useUserSession();
  const need_auth = ['/cart', '/account', '/accountcenter', '/ordercenter'];

  useEffect(() => {
    if (!session._hasHydrated) return;
    if (!session?.token) {
      let has_need_auth = false;
      for (const need_auth_path of need_auth) {
        if (pathname.includes(need_auth_path)) {
          has_need_auth = true;
          break;
        }
      }
      if(!has_need_auth) return;
      const redirect = encodeURIComponent(pathname || '/');
      if (pathname.includes('/customerlogin')) {
          router.replace(`/customerlogin`);
          return;
      }
      router.replace(`/customerlogin?redirect=${redirect}`);
    }
  }, [pathname, router, session]);

  return children;
}