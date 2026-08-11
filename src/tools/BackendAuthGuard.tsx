'use client';

import { useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminSession } from '@/tools/BackendSession';

const NEED_AUTH = [
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
  '/adminmanagement',
];

const ADMIN_ONLY_PATHS = [
  '/dashboard',
  '/categorymanagement',
  '/usermanagement',
  '/bannermanagement',
  '/homerecommendzonemanagement',
  '/shippingchannelconfig',
  '/pricingpromotionmanagement',
  '/adminmanagement',
];

function pathNeedsAuth(pathname: string | null): boolean {
  if (!pathname) return false;
  return NEED_AUTH.some((p) => pathname.includes(p));
}

export default function BackendAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useAdminSession();
  const requiresAuth = useMemo(() => pathNeedsAuth(pathname), [pathname]);

  useEffect(() => {
    if (!session._hasHydrated) return;
    if (!session?.token) {
      if (!requiresAuth) return;
      const redirect = encodeURIComponent(pathname || '/');
      if (pathname.includes('/adminlogin')) {
        router.replace(`/adminlogin`);
        return;
      }
      router.replace(`/adminlogin?redirect=${redirect}`);
      return;
    }
    if (
      session.role === 'SUB_ADMIN' &&
      ADMIN_ONLY_PATHS.some((path) => pathname.includes(path))
    ) {
      router.replace('/productmanagement');
    }
  }, [pathname, requiresAuth, router, session]);

  // Avoid mounting heavy admin pages (and firing RPCs) before session hydrate / login.
  // Without this, productmanagement/?tab=pending_imports shows a stuck spinner then a blank redirect.
  if (!session._hasHydrated) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 text-sm text-slate-500">
        正在恢复登录状态...
      </div>
    );
  }

  if (requiresAuth && !session.token) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 text-sm text-slate-500">
        正在跳转登录...
      </div>
    );
  }

  return children;
}