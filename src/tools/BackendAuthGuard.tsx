'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminSession } from '@/tools/BackendSession';

export default function BackendAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useAdminSession();
  const need_auth = [
    '/dashboard',
    '/adminprofile',
    '/productmanagement',
    '/importfrom1688',
    '/categorymanagement',
    '/usermanagement',
    '/ordermanagement',
    '/bannermanagement',
    '/homerecommendzonemanagement',
    '/shippingchannelconfig',
    '/pricingpromotionmanagement',
  ];

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
      if (pathname.includes('/adminlogin')) {
          router.replace(`/adminlogin`);
          return;
      }
      router.replace(`/adminlogin?redirect=${redirect}`);
    }
  }, [pathname, router, session]);

  return children;
}