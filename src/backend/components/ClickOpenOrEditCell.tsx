'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface ClickOpenOrEditCellProps {
  href?: string | null
  onEdit: () => void
  className?: string
  children: React.ReactNode
  editTitle?: string
  openTitle?: string
}

/** Single click opens the supplier URL; double-click edits the cell. */
export function ClickOpenOrEditCell({
  href,
  onEdit,
  className = '',
  children,
  editTitle = '点击编辑',
  openTitle = '单击打开供应商链接，双击编辑名称',
}: ClickOpenOrEditCellProps) {
  if (!href) {
    return (
      <button
        type="button"
        className={cn('transition-colors hover:text-primary', className)}
        title={editTitle}
        onClick={onEdit}
      >
        {children}
      </button>
    )
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn('transition-colors hover:underline inline-block text-primary', className, 'text-primary')}
      title={openTitle}
      onDoubleClick={event => {
        event.preventDefault()
        onEdit()
      }}
    >
      {children}
    </a>
  )
}
