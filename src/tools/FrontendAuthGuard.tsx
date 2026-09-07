'use client';

import { useUserSession } from '@/tools/FrontendSession';
import { usePathname } from 'next/navigation';
import { GuestAuthScreen } from '@/frontend/components/GuestAuthScreen';
import { isStorefrontGuestSession } from '@/frontend/components/GuestPricePlaceholder';

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
  const userId = useUserSession((s) => s.user_id);
  const path = String(pathname || '/');
  const guest = isStorefrontGuestSession({ token, user_id: userId });

  if (needsAuth(path) && guest) {
    return <GuestAuthScreen initialTab="login" />;
  }

  return children;
}
