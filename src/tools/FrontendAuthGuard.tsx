'use client';

import { useLayoutEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useUserSession } from '@/tools/FrontendSession';

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
  const path = String(pathname || '/');
  const [blocked, setBlocked] = useState(false);

  useLayoutEffect(() => {
    const guest = !String(token || '').trim();
    if (!needsAuth(path) || !guest) {
      setBlocked(false);
      return;
    }
    setBlocked(true);
    const returnTo = encodeURIComponent(path.endsWith('/') ? path : `${path}/`);
    window.location.replace(`/customerlogin/?returnTo=${returnTo}`);
  }, [path, token]);

  if (blocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFF5F5] px-4 text-sm text-[#64748B]">
        Loading…
      </div>
    );
  }

  return children;
}
