'use client';

import { useUserSession } from '@/tools/FrontendSession';
import { usePathname } from 'next/navigation';
import { GuestAuthScreen } from '@/frontend/components/GuestAuthScreen';

const NEED_AUTH = ['/cart', '/account', '/accountcenter', '/ordercenter'];

function isAuthRoute(path: string) {
  const p = path.toLowerCase();
  return p.includes('/customerlogin') || p.includes('/customerregister');
}

function needsAuth(path: string) {
  if (isAuthRoute(path)) return false;
  return NEED_AUTH.some((prefix) => path.includes(prefix));
}

export default function FrontendAuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const token = useUserSession((s) => s.token);
  const hydrated = useUserSession((s) => (s as { _hasHydrated?: boolean })._hasHydrated);
  const path = String(pathname || '/');
  const guest = !String(token || '').trim();

  if (needsAuth(path) && guest) {
    if (!hydrated) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#FFF5F5] px-4 text-sm text-[#64748B]">
          Loading…
        </div>
      );
    }
    return <GuestAuthScreen initialTab="register" />;
  }

  return children;
}
