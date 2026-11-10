'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminSession } from '@/tools/BackendSession';
import { getMyStaffAccess } from '@/backend/actions/AdminManagement';

const NEED_AUTH = [
  '/dashboard',
  '/adminprofile',
  '/productmanagement',
  '/importfrom1688',
  '/categorymanagement',
  '/brandaliasmanagement',
  '/suppliercollection',
  '/usermanagement',
  '/customerfollowup',
  '/ordermanagement',
  '/bannermanagement',
  '/buyershowmanagement',
  '/homerecommendzonemanagement',
  '/shippingchannelconfig',
  '/pricingpromotionmanagement',
  '/adminmanagement',
];

/** 子账号按勾选权限放行；未列出的后台页默认放行给已登录员工。 */
const PATH_PERMISSIONS: Array<{ path: string; permission?: string | 'ADMIN_ONLY' }> = [
  { path: '/dashboard', permission: 'dashboard' },
  { path: '/productmanagement', permission: 'products' },
  { path: '/importfrom1688', permission: 'products' },
  { path: '/categorymanagement', permission: 'categories' },
  { path: '/brandaliasmanagement', permission: 'brandalias' },
  { path: '/suppliercollection', permission: 'suppliercollection' },
  { path: '/usermanagement', permission: 'customers' },
  { path: '/customerfollowup', permission: 'followup' },
  { path: '/ordermanagement', permission: 'orders' },
  { path: '/bannermanagement', permission: 'banners' },
  { path: '/buyershowmanagement', permission: 'buyershow' },
  { path: '/homerecommendzonemanagement', permission: 'recommend' },
  { path: '/shippingchannelconfig', permission: 'shipping' },
  { path: '/pricingpromotionmanagement', permission: 'pricing' },
  { path: '/adminmanagement', permission: 'ADMIN_ONLY' },
];

function pathNeedsAuth(pathname: string | null): boolean {
  if (!pathname) return false;
  return NEED_AUTH.some((p) => pathname.includes(p));
}

function requiredPermissionForPath(pathname: string | null): string | 'ADMIN_ONLY' | null {
  if (!pathname) return null;
  const hit = PATH_PERMISSIONS.find((item) => pathname.includes(item.path));
  return hit?.permission || null;
}

export default function BackendAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useAdminSession();
  const requiresAuth = useMemo(() => pathNeedsAuth(pathname), [pathname]);
  const requiredPermission = useMemo(() => requiredPermissionForPath(pathname), [pathname]);
  const [staffPermissions, setStaffPermissions] = useState<string[] | null>(null);

  useEffect(() => {
    if (!session._hasHydrated || !session?.token || session.role !== 'SUB_ADMIN') {
      setStaffPermissions(null);
      return;
    }
    let cancelled = false;
    getMyStaffAccess()
      .then((access) => {
        if (!cancelled) setStaffPermissions(access.permissions || []);
      })
      .catch(() => {
        if (!cancelled) setStaffPermissions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [session._hasHydrated, session?.token, session.role]);

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

    if (session.role !== 'SUB_ADMIN' || !requiredPermission) return;
    if (requiredPermission === 'ADMIN_ONLY') {
      router.replace('/productmanagement');
      return;
    }
    if (staffPermissions == null) return;
    if (!staffPermissions.includes(requiredPermission)) {
      const fallback = staffPermissions.includes('products')
        ? '/productmanagement'
        : staffPermissions.includes('orders')
          ? '/ordermanagement'
          : '/adminprofile';
      router.replace(fallback);
    }
  }, [pathname, requiredPermission, requiresAuth, router, session, staffPermissions]);

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

  if (
    session.role === 'SUB_ADMIN' &&
    requiredPermission &&
    requiredPermission !== 'ADMIN_ONLY' &&
    staffPermissions == null
  ) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 text-sm text-slate-500">
        正在确认权限...
      </div>
    );
  }

  return children;
}
