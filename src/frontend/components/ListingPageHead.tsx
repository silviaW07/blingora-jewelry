'use client'

import type { MouseEvent, ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

type ListingPageHeadProps = {
  title: string
  countText: string
  onBack?: (event: MouseEvent<HTMLButtonElement>) => void
  backLabel?: string
  note?: ReactNode
  className?: string
}

/** Compact listing header: `< Home  belts  (24 products)` on one row. */
export function ListingPageHead({
  title,
  countText,
  onBack,
  backLabel,
  note,
  className,
}: ListingPageHeadProps) {
  return (
    <div className={cn('listing-page-head', className)}>
      <div className="listing-page-head__row">
        {onBack ? (
          <button
            type="button"
            className="storefront-home-back-link listing-page-head__back"
            data-controller-name="返回首页入口"
            onClick={onBack}
          >
            <ArrowLeft className="size-3.5 shrink-0" />
            <span>{backLabel}</span>
          </button>
        ) : null}
        <h2 className="listing-page-head__title">{title}</h2>
        {countText ? <span className="listing-page-head__count">{countText}</span> : null}
      </div>
      {note ? <p className="listing-page-head__note">{note}</p> : null}
    </div>
  )
}

export default ListingPageHead
