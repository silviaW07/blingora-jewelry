'use client'

import { useEffect } from 'react'
import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { OptimizedProductImage } from '@/frontend/components/OptimizedProductImage'
import { translateColorName } from '@/frontend/i18n/catalogLabels'
import type { AddedCartLine } from '@/frontend/hooks/useProductDetail'

export function AddedToCartPanel({
  lines,
  onClose,
}: {
  lines: AddedCartLine[] | null
  onClose: () => void
}) {
  const { t } = useTranslation()
  const visible = Boolean(lines && lines.length > 0)

  useEffect(() => {
    if (!visible) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visible, onClose])

  if (!lines || lines.length === 0) return null

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div
        role="dialog"
        aria-label={t('product.addedToCartTitle', { defaultValue: 'Added to your cart' })}
        className="absolute right-3 top-16 w-[min(420px,calc(100vw-24px))] overflow-hidden rounded-[2px] border border-[#ececec] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.16)] sm:right-6 sm:top-[4.75rem]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-[#eee] px-4 py-3.5">
          <Check className="size-5 shrink-0 text-[#16a34a]" strokeWidth={2.5} />
          <p className="text-[15px] font-semibold text-[#111]">
            {t('product.addedToCartTitle', { defaultValue: 'Added to your cart' })}
          </p>
        </div>
        <ul className="max-h-[min(60vh,420px)] overflow-y-auto">
          {lines.map((line) => {
            const color = translateColorName(t, line.color) || line.color
            return (
              <li key={line.skuId} className="flex gap-3 border-b border-[#eee] px-4 py-3 last:border-b-0">
                <div className="relative size-[72px] shrink-0 overflow-hidden bg-[#f3f3f3]">
                  {line.imageUrl ? (
                    <OptimizedProductImage
                      src={line.imageUrl}
                      alt={color || t('common.cart')}
                      className="size-full object-cover"
                      sizes="72px"
                      imageWidth={200}
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1 pt-1 text-sm text-[#222]">
                  {color ? (
                    <p>
                      {t('common.color', { defaultValue: 'Color' })}: {color}
                    </p>
                  ) : null}
                  <p className={color ? 'mt-2' : ''}>
                    {t('product.addedQuantity', { defaultValue: 'Quantity' })}: {line.quantity}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
        <div className="p-3">
          <a
            href="/cart"
            className="flex h-12 w-full items-center justify-center bg-[#111] text-sm font-semibold text-white"
            onClick={onClose}
          >
            {t('product.viewCart', { defaultValue: 'View cart' })}
          </a>
        </div>
      </div>
    </div>
  )
}
