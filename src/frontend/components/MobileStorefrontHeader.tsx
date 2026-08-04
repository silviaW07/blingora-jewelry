'use client'

/**
 * Unified mobile storefront header (show with md:hidden / or only inside mobile pages).
 * Row1: WhatsApp · Logo · Categories
 * Row2: Globe · narrow Search · Account
 * Not used on Cart / Account pages.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Camera, Globe, LayoutGrid, Loader2, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { StorefrontBrandMark } from '@/frontend/components/StorefrontBrandMark'
import { CustomerAccountMenu } from '@/frontend/components/CustomerAccountMenu'
import { StorefrontStickyHeader } from '@/frontend/components/StorefrontStickyHeader'
import { ProductCategory } from '@/frontend/route-params'
import { APP_LOCALES, normalizeLocale } from '@/frontend/i18n'
import { useSwitchAppLocale } from '@/frontend/i18n/I18nProvider'
import { useUserSession } from '@/tools/FrontendSession'
import {
  buildWhatsAppUrl,
  DEFAULT_CUSTOMER_SERVICE_CONFIG,
  readCustomerServiceLocal,
} from '@/frontend/decorate/customerService'
import { getCustomerServiceConfig } from '@/frontend/actions/CustomerService'
import { useTranslation } from 'react-i18next'

const WhatsAppGlyph = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
)

const FALLBACK_WA_NUMBER = '8618966047623'

type Props = {
  className?: string
  initialKeyword?: string
}

export function MobileStorefrontHeader({ className, initialKeyword = '' }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const { t, i18n } = useTranslation()
  const switchLocale = useSwitchAppLocale()
  const { preferredLocale } = useUserSession()

  const [searchKeyword, setSearchKeyword] = useState(initialKeyword)
  const [isSearchLoading, setIsSearchLoading] = useState(false)
  const [isLocaleMenuOpen, setIsLocaleMenuOpen] = useState(false)
  const [waNumber, setWaNumber] = useState(
    () =>
      readCustomerServiceLocal()?.whatsappNumber ||
      DEFAULT_CUSTOMER_SERVICE_CONFIG.whatsappNumber ||
      FALLBACK_WA_NUMBER,
  )

  const localeMenuRef = useRef<HTMLDivElement | null>(null)
  const cameraInputRef = useRef<HTMLInputElement | null>(null)

  const currentLocale = normalizeLocale(i18n.language || preferredLocale || 'en')

  const waHref = useMemo(() => {
    return (
      buildWhatsAppUrl(waNumber) ||
      buildWhatsAppUrl(FALLBACK_WA_NUMBER) ||
      `https://wa.me/${FALLBACK_WA_NUMBER}`
    )
  }, [waNumber])

  useEffect(() => {
    let cancelled = false
    getCustomerServiceConfig()
      .then((res: any) => {
        if (cancelled) return
        const n = String(
          res?.config?.whatsappNumber || res?.whatsappNumber || '',
        ).replace(/\D/g, '')
        if (n) setWaNumber(n)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!localeMenuRef.current?.contains(event.target as Node)) {
        setIsLocaleMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setIsSearchLoading(false)
  }, [pathname])

  /* Keep search box in sync with URL/query (same as desktop sticky header) */
  useEffect(() => {
    setSearchKeyword(initialKeyword || '')
  }, [initialKeyword])

  useEffect(() => {
    if (!isSearchLoading) return
    const timer = window.setTimeout(() => setIsSearchLoading(false), 8000)
    return () => window.clearTimeout(timer)
  }, [isSearchLoading])

  const handleSearchSubmit = useCallback(() => {
    if (isSearchLoading) return
    setIsSearchLoading(true)
    const keyword = searchKeyword.trim()
    const params = new URLSearchParams()
    if (keyword) params.set('search', keyword)
    /* ProductCategory.path === '/' — identical routing to desktop */
    router.push(
      params.toString()
        ? `${ProductCategory.path}?${params.toString()}`
        : ProductCategory.path,
    )
  }, [isSearchLoading, router, searchKeyword])

  const handleCameraFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const stem = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim()
    const keyword = stem || t('mobile.cameraSearchHint', { defaultValue: 'image' })
    setSearchKeyword(keyword)
    setIsSearchLoading(true)
    const params = new URLSearchParams()
    params.set('search', keyword)
    router.push(`${ProductCategory.path}?${params.toString()}`)
  }

  return (
    <header
      className={cn(
        'mobile-sf-header sticky top-0 z-40 border-b border-[#ece6dc] bg-[#f7f4f0]/96 backdrop-blur-md',
        className,
      )}
      data-controller-name="移动端统一顶栏"
    >
      <div className="flex h-11 items-center justify-between gap-2 px-3">
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-sm active:scale-95"
          aria-label="WhatsApp"
          title="WhatsApp"
        >
          <WhatsAppGlyph className="size-5" />
        </a>

        <div className="flex min-w-0 flex-1 justify-center scale-[0.8]">
          <StorefrontBrandMark useNextLink compact ariaLabel={t('common.backToHome')} />
        </div>

        <Link
          href="/categories/"
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-[#1a1a1a] active:bg-black/5"
          aria-label={t('nav.categories', { defaultValue: 'Categories' })}
        >
          <LayoutGrid className="size-5" strokeWidth={2} />
        </Link>
      </div>

      <div className="mobile-sf-header__search-row flex items-center justify-center gap-2.5 px-3 pb-2.5 pt-0.5">
        <div className="relative shrink-0" ref={localeMenuRef}>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full border border-[#d8d4ca] bg-white text-[#111] shadow-sm active:bg-[#f7f4ee]"
            aria-label={t('common.language')}
            aria-expanded={isLocaleMenuOpen}
            onClick={() => setIsLocaleMenuOpen((prev) => !prev)}
          >
            <Globe className="size-5" strokeWidth={2} />
          </button>
          {isLocaleMenuOpen ? (
            <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-[168px] rounded-2xl border border-[#e7e1d5] bg-white p-1.5 shadow-[0_16px_40px_-18px_rgba(17,17,17,0.4)]">
              <div className="px-2.5 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a8073]">
                {t('common.language')}
              </div>
              {APP_LOCALES.map((option) => (
                <button
                  key={option.code}
                  type="button"
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[0.875rem] font-medium transition',
                    currentLocale === option.code
                      ? 'bg-[#111111] text-white'
                      : 'text-[#232323] active:bg-[#f6f2ea]',
                  )}
                  onClick={() => {
                    void switchLocale(option.code)
                    setIsLocaleMenuOpen(false)
                  }}
                >
                  <span>{option.label}</span>
                  <span className="text-[10px] font-bold opacity-70">
                    {option.code === 'zh' ? '中' : option.code.toUpperCase()}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mobile-sf-header__search flex h-10 items-center gap-1.5 rounded-full border border-[#1f1f1f]/90 bg-white px-2.5 shadow-[0_8px_24px_-18px_rgba(0,0,0,0.45)]">
          <button
            type="button"
            className="shrink-0 text-[#555]"
            aria-label={t('common.search')}
            onClick={handleSearchSubmit}
            disabled={isSearchLoading}
          >
            {isSearchLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" strokeWidth={2.2} />
            )}
          </button>
          <Input
            placeholder={t('common.pleaseInput')}
            className="h-9 min-w-0 flex-1 border-0 bg-transparent px-0 text-[0.875rem] shadow-none focus-visible:ring-0"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSearchSubmit()
              }
            }}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleCameraFile}
          />
          <button
            type="button"
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-[#333] active:bg-black/5"
            aria-label={t('mobile.cameraSearch', { defaultValue: 'Photo search' })}
            onClick={() => cameraInputRef.current?.click()}
          >
            <Camera className="size-4" strokeWidth={2} />
          </button>
        </div>

        <CustomerAccountMenu variant="icon" trigger="click" className="shrink-0" />
      </div>
    </header>
  )
}

/** Mobile unified header + desktop sticky (not for cart/account) */
export function StorefrontResponsiveHeader({ isHome }: { isHome?: boolean }) {
  return (
    <>
      {/* Phones / small tablets: SOURCING JEWELRY mobile chrome (matches home) */}
      <div className="md:hidden" data-storefront-chrome="mobile">
        <MobileStorefrontHeader />
      </div>
      {/* Desktop only — also force-hidden by CSS .storefront-desktop-chrome ≤767 */}
      <div className="hidden md:block" data-storefront-chrome="desktop">
        <StorefrontStickyHeader isHome={isHome} />
      </div>
    </>
  )
}

export default MobileStorefrontHeader
