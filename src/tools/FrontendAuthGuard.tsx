'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUserSession } from '@/tools/FrontendSession';
import { useCustomerAuthModalStore } from '@/frontend/auth/CustomerAuthModalContext';

const ACCOUNT_AUTH_PATHS = ['/account', '/accountcenter', '/ordercenter'] as const;
const LOGIN_PAGE_PATHS = ['/cart'] as const;

function pathNeedsAuth(pathname: string, prefixes: readonly string[]) {
  return prefixes.some((prefix) => pathname.includes(prefix));
}

/**
 * Protects storefront routes that require a customer session.
 * Account paths: open shared login/register modal via zustand (no Context required),
 * then leave the protected route.
 */
export default function FrontendAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useUserSession();
  const openAuthModal = useCustomerAuthModalStore((s) => s.openAuthModal);
  const accountRedirectLock = useRef(false);

  useEffect(() => {
    if (!session._hasHydrated) return;

    const token = session.token?.trim();
    if (token) {
      accountRedirectLock.current = false;
      return;
    }

    const currentPath = pathname || '/';
    const isAccountPath = pathNeedsAuth(currentPath, ACCOUNT_AUTH_PATHS);

    if (!isAccountPath) {
      accountRedirectLock.current = false;
    }

    if (isAccountPath) {
      if (accountRedirectLock.current) return;
      accountRedirectLock.current = true;
      openAuthModal('login');
      router.replace('/');
      return;
    }

    if (pathNeedsAuth(currentPath, LOGIN_PAGE_PATHS)) {
      const redirect = encodeURIComponent(currentPath);
      if (currentPath.includes('/customerlogin')) {
        router.replace(`/customerlogin`);
        return;
      }
      router.replace(`/customerlogin?redirect=${redirect}`);
    }
  }, [pathname, router, session._hasHydrated, session.token, openAuthModal]);

  return children;
}
