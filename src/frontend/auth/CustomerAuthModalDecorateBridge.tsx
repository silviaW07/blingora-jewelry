'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCustomerAuthModal, type CustomerAuthModalTab } from '@/frontend/auth/CustomerAuthModalContext';

const isAuthDecorateTab = (value: string | null): value is CustomerAuthModalTab =>
  value === 'login' || value === 'register';

/** 装修模式下根据 URL 参数自动打开登录/注册弹窗 */
export function CustomerAuthModalDecorateBridge() {
  const searchParams = useSearchParams();
  const { openAuthModal } = useCustomerAuthModal();

  useEffect(() => {
    const authDecorate = searchParams.get('authDecorate');
    if (isAuthDecorateTab(authDecorate)) {
      openAuthModal(authDecorate);
    }
  }, [openAuthModal, searchParams]);

  return null;
}
