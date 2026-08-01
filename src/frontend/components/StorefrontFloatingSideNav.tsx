'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { StorefrontBrandNavList } from '@/frontend/components/StorefrontBrandNavList'
import type { BrandNavListItem } from '@/frontend/utils/brandSideNav'

export type StorefrontFloatingSideNavItem = BrandNavListItem

interface Props {
  open: boolean
  items: StorefrontFloatingSideNavItem[]
  activeId?: string | null
  onSelect: (id: string) => void
  className?: string
}

/**
 * Non-home CATEGORIES flyout: opens directly under the pink button.
 * Reuses StorefrontBrandNavList (same items/style as home left rail).
 */
export const StorefrontFloatingSideNav = ({
  open,
  items,
  activeId,
  onSelect,
  className,
}: Props) => {
  if (items.length === 0) return null

  return (
    <aside
      id="storefront-floating-brand-nav"
      className={cn('floating-side-nav', open && 'is-open', className)}
      aria-hidden={!open}
    >
      <div className="floating-side-nav-panel">
        <StorefrontBrandNavList
          variant="flyout"
          items={items}
          activeId={activeId}
          onSelect={onSelect}
        />
      </div>
    </aside>
  )
}

export default StorefrontFloatingSideNav
