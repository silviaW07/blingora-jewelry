'use client'

import React from 'react'
import { Coins, DollarSign } from 'lucide-react'
import { Button } from '@/backend/components/ui'
import { BatchAppendTitleSuffixControl } from '@/backend/components/BatchAppendTitleSuffixControl'

export interface SharedProductBatchUtilityButtonsProps {
  /** Current tab selection count (products or pending) — never mix tabs */
  selectedCount: number
  disabled?: boolean
  titleSuffixLoading?: boolean
  onOpenWeightPrice: () => void
  onOpenMinOrderQty: () => void
  onConfirmTitleSuffix: (suffix: string) => Promise<void> | void
}

/**
 * Shared batch utility buttons for 商品列表 + 待上传区.
 * Parent must pass only the current tab's selected ids into the open/confirm handlers.
 */
export function SharedProductBatchUtilityButtons({
  selectedCount,
  disabled = false,
  titleSuffixLoading = false,
  onOpenWeightPrice,
  onOpenMinOrderQty,
  onConfirmTitleSuffix,
}: SharedProductBatchUtilityButtonsProps) {
  const noSelection = selectedCount <= 0 || disabled

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-9 border-slate-200 shrink-0 min-w-[9rem]"
        disabled={noSelection}
        onClick={onOpenWeightPrice}
      >
        <DollarSign className="w-4 h-4 mr-2 shrink-0 text-sky-600" />
        批量修改价格重量
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-9 border-slate-200 shrink-0 min-w-[8.5rem]"
        disabled={noSelection}
        onClick={onOpenMinOrderQty}
      >
        <Coins className="w-4 h-4 mr-2 shrink-0 text-violet-600" />
        批量设置起订量
      </Button>
      <BatchAppendTitleSuffixControl
        disabled={noSelection}
        loading={titleSuffixLoading}
        selectedCount={selectedCount}
        onConfirm={onConfirmTitleSuffix}
      />
    </>
  )
}
