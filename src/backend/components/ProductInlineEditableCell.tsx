'use client'

import React from 'react'
import { Badge, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '@/backend/components/ui'
import type { ProductManagementHandlers, ProductManagementState } from '@/backend/hooks/useProductManagement'
import type { ProductInlineField } from '@/backend/types/ProductManagement'
import { ClickOpenOrEditCell } from '@/backend/components/ClickOpenOrEditCell'

export const PRODUCT_GOODS_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: '已上架' },
  { value: 'INACTIVE', label: '已下架' }
]

export const PRODUCT_GOODS_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  ACTIVE: {
    label: '已上架',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-100'
  },
  INACTIVE: {
    label: '已下架',
    className: 'bg-amber-50 text-amber-700 border-amber-100'
  },
  DRAFT: {
    label: '待上传',
    className: 'bg-sky-50 text-sky-700 border-sky-100'
  },
  DELETED: {
    label: '已删除',
    className: 'bg-rose-50 text-rose-700 border-rose-100'
  }
}

const numericFields = new Set<ProductInlineField>(['weight_gram', 'cost_price', 'price_coefficient', 'min_order_qty'])

interface ProductInlineEditableCellProps {
  productId: string
  field: ProductInlineField
  value: string | number | null | undefined
  state: ProductManagementState
  handlers: ProductManagementHandlers
  className?: string
  inputClassName?: string
  placeholder?: string
  selectOptions?: Array<{ value: string; label: string }>
  useCategoryTree?: boolean
  href?: string | null
  multiline?: boolean
  renderDisplay?: (rawValue: string | number | null | undefined) => React.ReactNode
}

export function ProductInlineEditableCell({
  productId,
  field,
  value,
  state,
  handlers,
  className = '',
  inputClassName = '',
  placeholder = '',
  selectOptions,
  useCategoryTree = false,
  href,
  multiline = false,
  renderDisplay,
}: ProductInlineEditableCellProps) {
  const isEditing =
    state.inlineEditingCell?.productId === productId &&
    state.inlineEditingCell?.field === field

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
        onDoubleClick={() => handlers.openProductCategoryPicker(productId, value ? String(value) : '')}
      >
        {display}
      </button>
    )
  }

  if (isEditing && selectOptions) {
    return (
      <Select
        value={state.inlineEditingValue || String(value || '')}
        onValueChange={next => {
          handlers.changeInlineEditingValue(next)
          void handlers.submitInlineEdit()
        }}
        onOpenChange={open => {
          if (!open) void handlers.submitInlineEdit()
        }}
        defaultOpen
      >
        <SelectTrigger
          className={`h-8 ${inputClassName}`}
          onKeyDown={e => {
            if (e.key === 'Enter') void handlers.submitInlineEdit()
            if (e.key === 'Escape') handlers.cancelInlineEdit()
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
        className={`min-h-[120px] resize-y whitespace-pre-wrap break-words text-sm leading-5 ${inputClassName}`}
        value={state.inlineEditingValue}
        autoFocus
        disabled={state.inlineSaving}
        placeholder={placeholder}
        onChange={e => handlers.changeInlineEditingValue(e.target.value)}
        onBlur={() => void handlers.submitInlineEdit()}
        onKeyDown={e => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault()
            void handlers.submitInlineEdit()
          }
          if (e.key === 'Escape') handlers.cancelInlineEdit()
        }}
      />
    )
  }

  if (isEditing) {
    return (
      <Input
        type={numericFields.has(field) ? 'number' : 'text'}
        className={`h-8 ${inputClassName}`}
        value={state.inlineEditingValue}
        autoFocus
        disabled={state.inlineSaving}
        placeholder={placeholder}
        onChange={e => handlers.changeInlineEditingValue(e.target.value)}
        onBlur={() => void handlers.submitInlineEdit()}
        onKeyDown={e => {
          if (e.key === 'Enter') void handlers.submitInlineEdit()
          if (e.key === 'Escape') handlers.cancelInlineEdit()
        }}
      />
    )
  }

  return (
    <ClickOpenOrEditCell
      href={href}
      className={className}
      onEdit={() => handlers.startInlineEdit(productId, field, value ?? '')}
    >
      {display}
    </ClickOpenOrEditCell>
  )
}

export function ProductGoodsStatusBadge({ value }: { value?: string | null }) {
  const cfg = PRODUCT_GOODS_STATUS_CONFIG[String(value || 'ACTIVE')] || PRODUCT_GOODS_STATUS_CONFIG.ACTIVE
  return <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>
}
