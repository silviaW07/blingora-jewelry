'use client'

import React from 'react'
import {
  ShieldCheck,
  Globe,
  Truck,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  ArrowRight,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DecorateText } from '@/frontend/decorate/DecorateText'
import { useDecorateMode } from '@/frontend/decorate/DecorateContext'

const TEXT_PRIMARY = 'text-[#333333]'
const TEXT_SECONDARY = 'text-[#555555]'
const TEXT_MUTED = 'text-[#777777]'
const BORDER = 'border-[#e8e8e8]'
const ICON_SOFT =
  'size-9 rounded flex items-center justify-center transition-colors border border-[#ececec] bg-[#f7f7f7] text-[#555555] hover:bg-[#ffc0cb] hover:text-[#111111] hover:border-[#ffc0cb]'

export default function Footer() {
  const { t } = useTranslation()
  const { getPatch } = useDecorateMode()
  const year = new Date().getFullYear()
  const emailPlaceholder =
    getPatch('footer_email_placeholder')?.text?.trim() || t('footer.emailPlaceholder')

  return (
    <footer
      className={`mt-auto w-full relative overflow-hidden border-t bg-white ${BORDER} ${TEXT_PRIMARY}`}
      style={{ background: '#ffffff' }}
      data-controller-name="全站页脚"
    >
      <div className="storefront-container py-12 md:py-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded flex items-center justify-center font-bold border border-transparent bg-primary text-primary-foreground text-lg">
                  <DecorateText propKey="footer_logo_mark" as="span">
                    G
                  </DecorateText>
                </div>
                <DecorateText
                  propKey="footer_brand_name"
                  as="span"
                  className={`font-bold tracking-tight text-xl ${TEXT_PRIMARY}`}
                >
                  {t('footer.brandName')}
                </DecorateText>
              </div>
              <DecorateText
                propKey="footer_brand_desc"
                as="p"
                className={`leading-relaxed max-w-md text-sm ${TEXT_SECONDARY}`}
              >
                {t('footer.brandDesc')}
              </DecorateText>
            </div>

            <div className="border-l-4 pl-4 py-1 rounded-r max-w-md border-primary bg-[#f8f8f8]">
              <DecorateText
                propKey="footer_promise_title"
                as="p"
                className={`font-semibold uppercase tracking-wider text-xs ${TEXT_PRIMARY}`}
              >
                {t('footer.promiseTitle')}
              </DecorateText>
              <DecorateText
                propKey="footer_promise_desc"
                as="p"
                className={`mt-1 text-xs ${TEXT_SECONDARY}`}
              >
                {t('footer.promiseDesc')}
              </DecorateText>
            </div>

            <div className="flex items-center gap-3">
              <DecorateText
                propKey="footer_social_facebook"
                href="https://www.facebook.com/yourglobaltrade"
                className={ICON_SOFT}
              >
                <Facebook className="size-4" />
              </DecorateText>
              <DecorateText
                propKey="footer_social_twitter"
                href="https://twitter.com/yourglobaltrade"
                className={ICON_SOFT}
              >
                <Twitter className="size-4" />
              </DecorateText>
              <DecorateText
                propKey="footer_social_instagram"
                href="https://www.instagram.com/yourglobaltrade"
                className={ICON_SOFT}
              >
                <Instagram className="size-4" />
              </DecorateText>
            </div>
          </div>

          <div className="lg:col-span-3 flex flex-col gap-4">
            <DecorateText
              propKey="footer_quick_links_title"
              as="h3"
              className={`font-bold tracking-wider uppercase border-b pb-2 text-sm ${TEXT_PRIMARY} ${BORDER}`}
            >
              {t('footer.quickLinks')}
            </DecorateText>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary" />
                <DecorateText
                  propKey="footer_link_home"
                  href="/"
                  className={`${TEXT_SECONDARY} hover:text-[#111111] hover:underline transition-colors`}
                >
                  {t('footer.linkHome')}
                </DecorateText>
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary" />
                <DecorateText
                  propKey="footer_link_catalog"
                  href="/"
                  className={`${TEXT_SECONDARY} hover:text-[#111111] hover:underline transition-colors`}
                >
                  {t('footer.linkCatalog')}
                </DecorateText>
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary" />
                <DecorateText
                  propKey="footer_link_logistics"
                  className={`${TEXT_SECONDARY} hover:text-[#111111] hover:underline transition-colors`}
                >
                  {t('footer.linkLogistics')}
                </DecorateText>
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary" />
                <DecorateText
                  propKey="footer_link_payments"
                  className={`${TEXT_SECONDARY} hover:text-[#111111] hover:underline transition-colors`}
                >
                  {t('footer.linkPayments')}
                </DecorateText>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-4">
            <DecorateText
              propKey="footer_consult_title"
              as="h3"
              className={`font-bold tracking-wider uppercase border-b pb-2 text-sm ${TEXT_PRIMARY} ${BORDER}`}
            >
              {t('footer.consultTitle')}
            </DecorateText>
            <div className={`flex flex-col gap-3 text-sm ${TEXT_SECONDARY}`}>
              <div className="flex items-start gap-2.5">
                <MapPin className="size-4 shrink-0 mt-0.5 text-primary" />
                <DecorateText propKey="footer_address" as="span">
                  {t('footer.address')}
                </DecorateText>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="size-4 shrink-0 text-primary" />
                <DecorateText
                  propKey="footer_email"
                  href="mailto:support@yourglobaltrade.com"
                  className="hover:text-[#111111] hover:underline transition-colors"
                >
                  support@yourglobaltrade.com
                </DecorateText>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="size-4 shrink-0 text-primary" />
                <DecorateText
                  propKey="footer_phone"
                  href="tel:+8618966047623"
                  className="hover:text-[#111111] hover:underline transition-colors"
                >
                  +86 18966047623
                </DecorateText>
              </div>
            </div>

            <div className="pt-2">
              <DecorateText
                propKey="footer_subscribe_hint"
                as="p"
                className={`mb-2 text-xs ${TEXT_SECONDARY}`}
              >
                {t('footer.subscribeHint')}
              </DecorateText>
              <form className="flex gap-2" onSubmit={(event) => event.preventDefault()}>
                <span className="sr-only">
                  <DecorateText propKey="footer_email_placeholder" as="span">
                    {t('footer.emailPlaceholder')}
                  </DecorateText>
                </span>
                <input
                  type="email"
                  required
                  placeholder={emailPlaceholder}
                  className={`flex-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 bg-white ${BORDER} ${TEXT_PRIMARY} placeholder:text-[#999999] focus:ring-primary text-xs`}
                />
                <button
                  type="button"
                  className="px-3 py-2 rounded font-semibold flex items-center gap-1 shrink-0 border border-transparent bg-primary hover:bg-primary/90 text-primary-foreground text-xs transition-colors"
                >
                  <DecorateText propKey="footer_subscribe_btn" as="span">
                    {t('footer.subscribe')}
                  </DecorateText>
                  <ArrowRight className="size-3" />
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-3 gap-6 py-8 my-8 border-y ${BORDER}`}>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded flex items-center justify-center shrink-0 border border-transparent bg-primary/15 text-primary">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <DecorateText
                propKey="footer_feature_secure_title"
                as="h4"
                className={`font-semibold text-sm ${TEXT_PRIMARY}`}
              >
                {t('footer.featureSecureTitle')}
              </DecorateText>
              <DecorateText
                propKey="footer_feature_secure_desc"
                as="p"
                className={`text-xs ${TEXT_SECONDARY}`}
              >
                {t('footer.featureSecureDesc')}
              </DecorateText>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded flex items-center justify-center shrink-0 border border-transparent bg-primary/15 text-primary">
              <Globe className="size-5" />
            </div>
            <div>
              <DecorateText
                propKey="footer_feature_global_title"
                as="h4"
                className={`font-semibold text-sm ${TEXT_PRIMARY}`}
              >
                {t('footer.featureGlobalTitle')}
              </DecorateText>
              <DecorateText
                propKey="footer_feature_global_desc"
                as="p"
                className={`text-xs ${TEXT_SECONDARY}`}
              >
                {t('footer.featureGlobalDesc')}
              </DecorateText>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded flex items-center justify-center shrink-0 border border-transparent bg-primary/15 text-primary">
              <Truck className="size-5" />
            </div>
            <div>
              <DecorateText
                propKey="footer_feature_supply_title"
                as="h4"
                className={`font-semibold text-sm ${TEXT_PRIMARY}`}
              >
                {t('footer.featureSupplyTitle')}
              </DecorateText>
              <DecorateText
                propKey="footer_feature_supply_desc"
                as="p"
                className={`text-xs ${TEXT_SECONDARY}`}
              >
                {t('footer.featureSupplyDesc')}
              </DecorateText>
            </div>
          </div>
        </div>

        <div className={`flex flex-col md:flex-row justify-between items-center gap-4 text-xs ${TEXT_MUTED}`}>
          <div className="flex flex-col gap-1 text-center md:text-left">
            <DecorateText propKey="footer_copyright" as="p">
              {t('footer.copyright', { year })}
            </DecorateText>
            <DecorateText propKey="footer_icp" as="p" className="text-[10px] text-[#999999]">
              {t('footer.icp')}
            </DecorateText>
          </div>
          <div className="flex items-center gap-4">
            <DecorateText
              propKey="footer_secure_pay"
              as="span"
              className={`hidden sm:inline text-[11px] ${TEXT_MUTED}`}
            >
              {t('footer.securePay')}
            </DecorateText>
            <DecorateText
              propKey="footer_pay_icons_label"
              as="div"
              className={`h-7 w-24 border rounded flex items-center justify-center ${BORDER} bg-[#f7f7f7] text-[10px] ${TEXT_MUTED}`}
            >
              Pay Icons
            </DecorateText>
          </div>
        </div>
      </div>
    </footer>
  )
}
