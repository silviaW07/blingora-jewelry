'use client'

import React from 'react'
import { Badge, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '@/backend/components/ui'
import type { ProductManagementState, ProductManagementHandlers } from '@/backend/hooks/useProductManagement'
import type { PendingImportEditableField } from '@/backend/types/ProductManagement'

/** 待上传区货物状态展示：草稿 → 待上传 */
export const PENDING_GOODS_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  DRAFT: {
    label: '待上传',
    className: 'bg-slate-100 text-slate-700 border-slate-200'
  },
  ACTIVE: {
    label: '发布并上架',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-100'
  },
  INACTIVE: {
    label: '已下架',
    className: 'bg-amber-50 text-amber-700 border-amber-100'
  }
}

export const PENDING_GOODS_STATUS_OPTIONS = [
  { value: 'DRAFT', label: '待上传' },
  { value: 'ACTIVE', label: '发布并上架' }
]

const isPendingImportNumericField = (field: PendingImportEditableField) =>
  ['coefficient', 'weight_grams', 'cost_price', 'cny_price_min', 'cny_price_max', 'usd_price_min', 'usd_price_max', 'minimum_order_quantity', 'available_stock'].includes(field)

interface PendingImportEditableCellProps {
  itemId: string
  field: PendingImportEditableField
  value: string | number | null | undefined
  state: ProductManagementState
  handlers: ProductManagementHandlers
  className?: string
  inputClassName?: string
  placeholder?: string
  selectOptions?: Array<{ value: string; label: string }>
  multiline?: boolean
  /** 目标分类等：双击打开分类树弹窗，而不是下拉 */
  useCategoryTree?: boolean
  renderDisplay?: (rawValue: string | number | null | undefined) => React.ReactNode
}

/** 待上传列表单元格：双击进入编辑，回车/失焦自动保存 */
export function PendingImportEditableCell({
  itemId,
  field,
  value,
  state,
  handlers,
  className = '',
  inputClassName = '',
  placeholder = '',
  selectOptions,
  multiline = false,
  useCategoryTree = false,
  renderDisplay,
}: PendingImportEditableCellProps) {
  const isEditing =
    state.pendingImportInlineEditingCell?.itemId === itemId &&
    state.pendingImportInlineEditingCell?.field === field

  const display = renderDisplay
    ? renderDisplay(value)
    : value === null || value === undefined || value === ''
      ? '--'
      : String(value)

  if (useCategoryTree) {
    return (
      <button
        type="button"
        className={`transition-colors hover:text-primary ${className}`}
        title="双击选择分类"
        onDoubleClick={() => handlers.openPendingCategoryPicker(itemId, value ? String(value) : '')}
      >
        {display}
      </button>
    )
  }

  if (isEditing && selectOptions) {
    return (
      <Select
        value={state.pendingImportInlineEditingValue || String(value || '')}
        onValueChange={next => {
          handlers.changePendingImportInlineEditingValue(next)
          void handlers.submitPendingImportInlineEdit(next)
        }}
        onOpenChange={open => {
          if (!open) void handlers.submitPendingImportInlineEdit()
        }}
        defaultOpen
      >
        <SelectTrigger
          className={`h-8 ${inputClassName}`}
          onKeyDown={e => {
            if (e.key === 'Enter') void handlers.submitPendingImportInlineEdit()
            if (e.key === 'Escape') handlers.cancelPendingImportInlineEdit()
          }}
        >
          <SelectValue placeholder={placeholder || '请选择'} />
        </SelectTrigger>
        <SelectContent>
          {selectOptions.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  if (isEditing && multiline) {
    return (
      <Textarea
        className={`min-h-[88px] text-sm ${inputClassName}`}
        value={state.pendingImportInlineEditingValue}
        autoFocus
        disabled={state.pendingImportInlineSaving}
        placeholder={placeholder}
        onChange={e => handlers.changePendingImportInlineEditingValue(e.target.value)}
        onBlur={() => void handlers.submitPendingImportInlineEdit()}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            void handlers.submitPendingImportInlineEdit()
          }
          if (e.key === 'Escape') handlers.cancelPendingImportInlineEdit()
        }}
      />
    )
  }

  if (isEditing) {
    return (
      <Input
        type={isPendingImportNumericField(field) ? 'number' : 'text'}
        className={`h-8 ${inputClassName}`}
        value={state.pendingImportInlineEditingValue}
        autoFocus
        disabled={state.pendingImportInlineSaving}
        placeholder={placeholder}
        onChange={e => handlers.changePendingImportInlineEditingValue(e.target.value)}
        onBlur={() => void handlers.submitPendingImportInlineEdit()}
        onKeyDown={e => {
          if (e.key === 'Enter') void handlers.submitPendingImportInlineEdit()
          if (e.key === 'Escape') handlers.cancelPendingImportInlineEdit()
        }}
      />
    )
  }

  return (
    <button
      type="button"
      className={`transition-colors hover:text-primary ${className}`}
      title="双击编辑"
      onDoubleClick={() => handlers.startPendingImportInlineEdit(itemId, field, value ?? '')}
    >
      {display}
    </button>
  )
}

interface PendingImportSkuEditableCellProps {
  itemId: string
  skuKey: string
  field: 'price' | 'cost_price' | 'weight_grams' | 'stock' | 'spec_text'
  value: string | number | null | undefined
  state: ProductManagementState
  handlers: ProductManagementHandlers
  className?: string
  inputClassName?: string
  placeholder?: string
  /** 颜色行统一改价：保存时同步该颜色下全部规格 */
  syncColorGroup?: boolean
  colorValue?: string
  renderDisplay?: (rawValue: string | number | null | undefined) => React.ReactNode
}

/** 待上传 SKU / 颜色行单元格：双击编辑，回车或失焦保存 */
export function PendingImportSkuEditableCell({
  itemId,
  skuKey,
  field,
  value,
  state,
  handlers,
  className = '',
  inputClassName = '',
  placeholder = '',
  syncColorGroup = false,
  colorValue,
  renderDisplay,
}: PendingImportSkuEditableCellProps) {
  const isEditing =
    state.pendingImportSkuEditingCell?.itemId === itemId &&
    state.pendingImportSkuEditingCell?.skuKey === skuKey &&
    state.pendingImportSkuEditingCell?.field === field

  const display = renderDisplay
    ? renderDisplay(value)
    : value === null || value === undefined || value === ''
      ? '--'
      : String(value)

  if (isEditing) {
    return (
      <Input
        type={field === 'spec_text' ? 'text' : 'number'}
        className={`h-8 ${inputClassName}`}
        value={state.pendingImportSkuEditingValue}
        autoFocus
        disabled={state.pendingImportSkuSaving}
        placeholder={placeholder}
        onChange={e => handlers.changePendingImportSkuEditingValue(e.target.value)}
        onBlur={() => {
          if (syncColorGroup && colorValue) {
            void handlers.submitPendingImportColorGroupEdit(colorValue)
          } else {
            void handlers.submitPendingImportSkuInlineEdit()
          }
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault()
            if (syncColorGroup && colorValue) {
              void handlers.submitPendingImportColorGroupEdit(colorValue)
            } else {
              void handlers.submitPendingImportSkuInlineEdit()
            }
          }
          if (e.key === 'Escape') handlers.cancelPendingImportSkuInlineEdit()
        }}
      />
    )
  }

  return (
    <button
      type="button"
      className={`transition-colors hover:text-primary ${className}`}
      title="双击编辑"
      onDoubleClick={() => handlers.startPendingImportSkuInlineEdit(itemId, skuKey, field, value ?? '')}
    >
      {display}
    </button>
  )
}
