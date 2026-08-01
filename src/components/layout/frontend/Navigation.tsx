'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, LogOut, ChevronRight, ChevronDown, ShieldCheck, Search, Heart, ShoppingCart, Gem, Globe, UserCircle2, Package } from 'lucide-react';
import { useUserSession } from '@/tools/FrontendSession';
import { clsx } from 'clsx';
import { Cart, CustomerLogin } from '@/frontend/route-params';
import { useTranslation } from 'react-i18next';
import { APP_LOCALES, getLocaleLabel, normalizeLocale } from '@/frontend/i18n';
import { useSwitchAppLocale } from '@/frontend/i18n/I18nProvider';

interface NavItem {
  labelKey: string;
  path: string;
}
interface LocaleOption {
  code: string;
  label: string;
}
const truncateEmail = (email: string) => {
  if (!email) return '';
  return email.length > 14 ? `${email.slice(0, 11)}...` : email;
};
export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const switchLocale = useSwitchAppLocale();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const {
    token,
    reset,
    role,
    username,
    email,
    preferredLocale,
  } = useUserSession();
  const navItems = useMemo<NavItem[]>(() => [{
    labelKey: 'nav.home',
    path: '/'
  }], []);
  const isHomePage = pathname === '/' || pathname === '/home';
  const isLoggedIn = Boolean(token);
  const displayName = username || t('nav.myAccount');
  const displayEmail = truncateEmail(email || '');
  const avatarText = (displayName || email || 'C').trim().charAt(0).toUpperCase() || 'C';
  const currentLocale = normalizeLocale(i18n.language || preferredLocale || 'en');
  const currentLocaleLabel = getLocaleLabel(currentLocale);
  const localeOptions = APP_LOCALES as unknown as LocaleOption[];
  const isActivePath = (path: string) => pathname === path || path !== '/' && pathname.startsWith(path);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const handleLogout = () => {
    reset();
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    router.push('/');
  };
  const handleMobileMenuClick = () => {
    setIsMobileMenuOpen(false);
  };
  const handleProtectedNavigate = (targetPath: string) => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
    if (role !== 'CUSTOMER') {
      const currentPath = pathname || '/';
      CustomerLogin.navigateToWithReturn(router, {
        returnTo: currentPath
      });
      return;
    }
    router.push(targetPath);
  };
  const handleCartNavigate = () => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
    if (role !== 'CUSTOMER') {
      const currentPath = pathname || '/';
      CustomerLogin.navigateToWithReturn(router, {
        returnTo: currentPath
      });
      return;
    }
    Cart.navigateTo(router);
  };
  const handleLocaleSwitch = (code: string) => {
    void switchLocale(code);
    setIsUserMenuOpen(false);
  };
  const handleNavigateToLogin = () => {
    setIsMobileMenuOpen(false);
    CustomerLogin.navigateToDefault(router);
  };
  const handleNavigateToAccountCenter = () => {
    handleProtectedNavigate('/accountcenter');
  };
  const handleNavigateToOrderCenter = () => {
    handleProtectedNavigate('/ordercenter');
  };
  return <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#07111F] text-white shadow-[0_12px_30px_rgba(2,6,23,0.35)] isolate" data-controller-name="前台全局固定顶栏">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,15,29,0.98),rgba(10,26,53,0.95),rgba(8,15,29,0.98))]" style={{
      backgroundColor: `#cab5d140`
    } as React.CSSProperties} />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="relative container mx-auto flex min-h-[76px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex min-w-0 shrink-0 items-center gap-2.5" onClick={handleMobileMenuClick}>
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/12 bg-white/8 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] transition-all duration-200 group-hover:border-[#60A5FA]/70 group-hover:bg-[#0E203B]">
            <Gem className="size-4" />
          </div>
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-[13px] font-bold tracking-[0.06em] text-white">Global Goods</p>
            <p className="mt-0.5 truncate text-[10px] uppercase tracking-[0.16em] text-slate-400">{t('nav.brandTagline')}</p>
          </div>
        </Link>

        <nav className="hidden flex-1 items-center justify-center lg:flex">
          <div className="flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md">
            {navItems.map((item, index) => {
            const isActive = isActivePath(item.path);
            return <Link key={item.path} href={item.path} className={clsx('rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200', isActive ? 'bg-white text-[#07111F] shadow-sm' : 'text-slate-300 hover:bg-white/8 hover:text-white')}>
                  {t(item.labelKey)}
                </Link>;
          })}
          </div>
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3" data-controller-name="顶栏账户与快捷功能区">
          {!isHomePage ? <div className="hidden items-center gap-2 md:flex">
            <div className="relative" ref={menuRef}>
              <button type="button" className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/8 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:border-white/30 hover:bg-white/12" onClick={() => setIsUserMenuOpen(prev => !prev)}>
                <Globe className="size-4" />
                <span>{currentLocaleLabel}</span>
                <ChevronDown className={clsx('size-4 transition-transform', isUserMenuOpen ? 'rotate-180' : '')} />
              </button>

              {isUserMenuOpen ? <div className="absolute right-0 top-[calc(100%+12px)] z-30 w-[220px] rounded-[24px] border border-white/12 bg-[#081526] p-2 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.55)] backdrop-blur-xl">
                  <div className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{t('common.language')}</div>
                  {localeOptions.map((option) => <button key={option.code} type="button" onClick={() => handleLocaleSwitch(option.code)} className={clsx('flex w-full items-center justify-between rounded-[18px] px-4 py-3 text-left text-sm font-medium transition', currentLocale === option.code ? 'bg-white text-[#07111F]' : 'text-white hover:bg-white/10')}>
                      <span>{option.label}</span>
                      {currentLocale === option.code ? <ShieldCheck className="size-4" /> : null}
                    </button>)}
                </div> : null}
            </div>

            <button type="button" onClick={handleCartNavigate} className="inline-flex size-10 items-center justify-center rounded-full border border-white/14 bg-white/8 text-white transition-all duration-200 hover:border-white/30 hover:bg-white/12" aria-label={t('common.cart')}>
              <ShoppingCart className="size-4" />
            </button>

            {isLoggedIn ? <div className="relative" ref={menuRef}>
                <button type="button" onClick={() => setIsUserMenuOpen(prev => !prev)} className="inline-flex items-center gap-3 rounded-full border border-white/14 bg-white/8 px-3 py-2 text-sm font-semibold text-white transition-all duration-200 hover:border-white/30 hover:bg-white/12">
                  <span className="flex size-9 items-center justify-center rounded-full bg-white text-sm font-bold text-[#07111F]">{avatarText}</span>
                  <span className="max-w-[140px] truncate text-left">
                    <span className="block truncate">{displayName}</span>
                    <span className="block max-w-[120px] truncate text-[11px] font-medium text-slate-300">{displayEmail}</span>
                  </span>
                  <ChevronDown className={clsx('size-4 transition-transform', isUserMenuOpen ? 'rotate-180' : '')} />
                </button>

                {isUserMenuOpen ? <div className="absolute right-0 top-[calc(100%+12px)] z-30 w-[240px] rounded-[24px] border border-white/12 bg-[#081526] p-2 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.55)] backdrop-blur-xl">
                    <div className="px-4 py-3">
                      <p className="truncate text-sm font-semibold text-white">{displayName}</p>
                      <p className="mt-1 truncate text-xs text-slate-400">{displayEmail || email}</p>
                    </div>
                    <button type="button" className="flex w-full items-center gap-3 rounded-[18px] px-4 py-3 text-left text-sm font-medium text-white transition hover:bg-white/10" onClick={handleNavigateToAccountCenter}>
                      <UserCircle2 className="size-4" />
                      {t('nav.accountCenter')}
                    </button>
                    <button type="button" className="flex w-full items-center gap-3 rounded-[18px] px-4 py-3 text-left text-sm font-medium text-white transition hover:bg-white/10" onClick={handleNavigateToOrderCenter}>
                      <Package className="size-4" />
                      {t('nav.myOrders')}
                    </button>
                    <button type="button" className="flex w-full items-center gap-3 rounded-[18px] px-4 py-3 text-left text-sm font-medium text-[#FDE2E2] transition hover:bg-[#2A1420]" onClick={handleLogout}>
                      <LogOut className="size-4" />
                      {t('common.logout')}
                    </button>
                  </div> : null}
              </div> : <button type="button" onClick={handleNavigateToLogin} className="inline-flex items-center rounded-full border border-white/14 bg-transparent px-4 py-2 text-sm font-semibold text-slate-200 transition-all duration-200 hover:border-white/30 hover:bg-white/8 hover:text-white">
                  {t('common.login')}
                </button>}
          </div> : null}

          <button className="inline-flex size-10 items-center justify-center rounded-full border border-white/14 bg-white/8 text-white transition-all duration-200 hover:border-white/30 hover:bg-white/12 lg:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label={t('common.categories')} aria-expanded={isMobileMenuOpen}>
            {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen ? <div className="relative border-t border-white/10 bg-[#07111F]/98 shadow-[0_24px_40px_rgba(2,6,23,0.55)] lg:hidden">
          <div className="container mx-auto px-4 py-4 sm:px-6">
            <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-4 backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <p className="text-sm font-bold text-white">{t('nav.siteNav')}</p>
                  <p className="mt-1 text-xs text-slate-400">{t('nav.siteNavDesc')}</p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/6 text-[#BFDBFE]">
                  <Search className="size-4" />
                </div>
              </div>

              <div className="mt-4 grid gap-2">
                {navItems.map((item, index) => {
              const isActive = isActivePath(item.path);
              return <Link key={item.path} href={item.path} onClick={handleMobileMenuClick} className={clsx('flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition-all duration-200', isActive ? 'border-[#60A5FA]/60 bg-[#0D2242] text-white' : 'border-white/8 bg-white/[0.03] text-slate-200 hover:border-white/16 hover:bg-white/[0.06]')}>
                      <span>{t(item.labelKey)}</span>
                      <ChevronRight className="size-4 text-slate-400" />
                    </Link>;
            })}
              </div>

              <div className="mt-4 rounded-2xl border border-white/8 bg-[#081526] p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-slate-400">
                  <ShieldCheck className="size-4 text-[#60A5FA]" />
                  {t('nav.currentLanguage', { label: currentLocaleLabel })}
                </div>

                <div className="mt-3 grid gap-2">
                  {localeOptions.map((option) => <button key={option.code} type="button" onClick={() => handleLocaleSwitch(option.code)} className={clsx('flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition-all duration-200', currentLocale === option.code ? 'border-[#60A5FA]/60 bg-[#0D2242] text-white' : 'border-white/10 bg-white/6 text-white hover:bg-white/10')}>
                      <span>{option.label}</span>
                      <ChevronRight className="size-4" />
                    </button>)}
                  <button type="button" onClick={() => handleProtectedNavigate('/wishlist')} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/10">
                    <span className="flex items-center gap-2"><Heart className="size-4" /> {t('nav.wishlist')}</span>
                    <ChevronRight className="size-4" />
                  </button>
                  <button type="button" onClick={handleCartNavigate} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/10">
                    <span className="flex items-center gap-2"><ShoppingCart className="size-4" /> {t('common.cart')}</span>
                    <ChevronRight className="size-4" />
                  </button>
                  {!isLoggedIn ? <button type="button" onClick={handleNavigateToLogin} className="flex items-center justify-center rounded-full border border-white/12 bg-white/6 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/10">
                      {t('common.login')}
                    </button> : <>
                      <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-left">
                        <p className="truncate text-sm font-semibold text-white">{displayName}</p>
                        <p className="mt-1 truncate text-xs text-slate-400">{displayEmail || email}</p>
                      </div>
                      <button type="button" onClick={handleNavigateToAccountCenter} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/10">
                        <span className="flex items-center gap-2"><UserCircle2 className="size-4" /> {t('nav.accountCenter')}</span>
                        <ChevronRight className="size-4" />
                      </button>
                      <button type="button" onClick={handleNavigateToOrderCenter} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/10">
                        <span className="flex items-center gap-2"><Package className="size-4" /> {t('nav.myOrders')}</span>
                        <ChevronRight className="size-4" />
                      </button>
                      <button type="button" onClick={handleLogout} className="flex items-center justify-center gap-2 rounded-full border border-white/12 bg-transparent px-4 py-3 text-sm font-semibold text-slate-200 transition-all duration-200 hover:border-[#FCA5A5] hover:bg-[#2A1420] hover:text-[#FDE2E2]">
                        <LogOut className="size-4" />
                        {t('common.logout')}
                      </button>
                    </>}
                </div>
              </div>
            </div>
          </div>
        </div> : null}
    </header>;
}
