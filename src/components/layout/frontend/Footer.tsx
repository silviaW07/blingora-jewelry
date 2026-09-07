'use client'

import React from 'react'
import { useTranslation } from 'react-i18next'
import { DecorateText } from '@/frontend/decorate/DecorateText'
import { StorefrontBrandMark } from '@/frontend/components/StorefrontBrandMark'
import { AccountCenter, BuyerShowInfo } from '@/frontend/route-params'
import { hardNavProps } from '@/frontend/utils/hardNavigate'

const TEXT_PRIMARY = 'text-[#333333]'
const TEXT_SECONDARY = 'text-[#555555]'
const TEXT_MUTED = 'text-[#777777]'
const BORDER = 'border-[#e8e8e8]'

export default function Footer() {
  const { t } = useTranslation()
  const year = new Date().getFullYear()

  return (
    <footer
      className={`site-footer mt-auto w-full relative overflow-hidden border-t bg-white ${BORDER} ${TEXT_PRIMARY}`}
      style={{ background: '#ffffff' }}
      data-controller-name="全站页脚"
    >
      <div className="storefront-container py-10 lg:py-14 relative z-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-6 flex flex-col gap-4">
            <StorefrontBrandMark compact />
            <DecorateText
              propKey="sj_footer_brand_desc"
              as="p"
              className={`leading-relaxed max-w-md text-sm ${TEXT_SECONDARY}`}
            >
              {t('footer.brandDesc')}
            </DecorateText>
          </div>

          <div className="md:col-span-3 flex flex-col gap-4">
            <DecorateText
              propKey="sj_footer_quick_links_title"
              as="h3"
              className={`font-bold tracking-wider uppercase border-b pb-2 text-sm ${TEXT_PRIMARY} ${BORDER}`}
            >
              {t('footer.quickLinks')}
            </DecorateText>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li>
                <a {...hardNavProps('/')} className={`${TEXT_SECONDARY} hover:text-[#111111] hover:underline`}>
                  {t('footer.linkHome')}
                </a>
              </li>
              <li>
                <a {...hardNavProps('/')} className={`${TEXT_SECONDARY} hover:text-[#111111] hover:underline`}>
                  {t('footer.linkCatalog')}
                </a>
              </li>
              <li>
                <a
                  {...hardNavProps(BuyerShowInfo.path)}
                  className={`${TEXT_SECONDARY} hover:text-[#111111] hover:underline`}
                >
                  {t('footer.linkBuyerShow')}
                </a>
              </li>
              <li>
                <a
                  {...hardNavProps(AccountCenter.path)}
                  className={`${TEXT_SECONDARY} hover:text-[#111111] hover:underline`}
                >
                  {t('footer.linkAccount')}
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3 flex flex-col gap-4">
            <DecorateText
              propKey="sj_footer_consult_title"
              as="h3"
              className={`font-bold tracking-wider uppercase border-b pb-2 text-sm ${TEXT_PRIMARY} ${BORDER}`}
            >
              {t('footer.consultTitle')}
            </DecorateText>
            <p className={`text-sm ${TEXT_SECONDARY}`}>{t('footer.address')}</p>
          </div>
        </div>

        <div className={`mt-10 flex flex-col items-center justify-between gap-3 border-t pt-6 text-xs ${BORDER} ${TEXT_MUTED} md:flex-row`}>
          <DecorateText propKey="sj_footer_copyright" as="p">
            {t('footer.copyright', { year })}
          </DecorateText>
        </div>
      </div>
    </footer>
  )
}
