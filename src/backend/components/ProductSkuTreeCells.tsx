'use client'

import React from 'react'
import { Input, TableCell, TableRow } from '@/backend/components/ui'

type EditableValue = string | number | null | undefined

interface SkuTreeEditableCellProps {
  editing: boolean
  value: EditableValue
  display: React.ReactNode
  saving?: boolean
  inputType?: 'text' | 'number'
  className?: string
  onStartEdit: () => void
  onChange: (value: string) => void
  onSubmit: () => void
  onCancel: () => void
}

/** 双击进入编辑，失焦/回车自动保存 */
export function SkuTreeEditableCell({
  editing,
  value,
  display,
  saving,
  inputType = 'text',
  className,
  onStartEdit,
  onChange,
  onSubmit,
  onCancel,
}: SkuTreeEditableCellProps) {
  if (editing) {
    return (
      <Input
        type={inputType}
        className={className || 'h-8'}
        value={value === null || value === undefined ? '' : String(value)}
        autoFocus
        disabled={saving}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onSubmit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSubmit()
          if (e.key === 'Escape') onCancel()
        }}
        onClick={(e) => e.stopPropagation()}
      />
    )
  }

  return (
    <button
      type="button"
      className={`w-full text-left hover:text-primary transition-colors ${className || ''}`}
      onDoubleClick={(e) => {
        e.stopPropagation()
        onStartEdit()
      }}
      title="双击编辑"
    >
      {display}
    </button>
  )
}

interface SkuChildRowShellProps {
  children: React.ReactNode
  colSpanBefore?: number
  colSpanAfter?: number
}

export function SkuChildRowShell({ children, colSpanBefore = 1, colSpanAfter = 0 }: SkuChildRowShellProps) {
  return (
    <TableRow className="bg-slate-50/80 border-b border-slate-100">
      {colSpanBefore > 0 ? <TableCell colSpan={colSpanBefore} className="bg-slate-50/80" /> : null}
      {children}
      {colSpanAfter > 0 ? <TableCell colSpan={colSpanAfter} className="bg-slate-50/80" /> : null}
    </TableRow>
  )
}
