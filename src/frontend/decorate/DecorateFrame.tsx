'use client'

import React from 'react'
import { Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDecorateMode } from './DecorateContext'
import type { DecorateKind } from './types'

type DecorateFrameProps = {
  propKey: string
  kind?: DecorateKind
  className?: string
  children: React.ReactNode
  style?: React.CSSProperties
}

/**
 * 装修模式下为可编辑区域加上浅蓝虚线框与铅笔图标。
 * 非装修模式透传，仍应用已发布的样式覆盖（含区块背景色）。
 * 已删除（hidden）的区块在预览与发布态均不渲染，由下方内容自动补位。
 */
export function DecorateFrame({
  propKey,
  kind = 'text',
  className,
  children,
  style,
}: DecorateFrameProps) {
  const { isDecorateMode, selectedKey, select, getPatch } = useDecorateMode()
  const patch = getPatch(propKey)
  const selected = selectedKey === propKey
  const isHidden = patch?.hidden === true
  const isBlock = kind === 'block'

  // 删除后彻底从预览移除，不保留「已隐藏」占位框
  if (isHidden) {
    return null
  }

  const mergedStyle: React.CSSProperties = {
    ...style,
    ...(!isBlock && patch?.fontSize ? { fontSize: `${patch.fontSize}px` } : null),
    ...(!isBlock && patch?.color ? { color: patch.color } : null),
    ...(patch?.backgroundColor ? { backgroundColor: patch.backgroundColor } : null),
    ...(typeof patch?.padding === 'number' ? { padding: `${patch.padding}px` } : null),
    ...(typeof patch?.marginTop === 'number' ? { marginTop: `${patch.marginTop}px` } : null),
    ...(typeof patch?.marginBottom === 'number' ? { marginBottom: `${patch.marginBottom}px` } : null),
    ...(typeof patch?.marginLeft === 'number' ? { marginLeft: `${patch.marginLeft}px` } : null),
    ...(typeof patch?.marginRight === 'number' ? { marginRight: `${patch.marginRight}px` } : null),
    ...(typeof patch?.fontWeight === 'number' ? { fontWeight: patch.fontWeight } : null),
    ...(typeof patch?.borderWidth === 'number' && patch.borderWidth > 0
      ? {
          borderWidth: `${patch.borderWidth}px`,
          borderStyle: 'solid' as const,
          borderColor: patch.borderColor || '#f254a6',
        }
      : null),
    ...(typeof patch?.borderRadius === 'number' ? { borderRadius: `${patch.borderRadius}px` } : null),
  }

  if (!isDecorateMode) {
    const hasOverride =
      Boolean(patch?.backgroundColor) ||
      (!isBlock && Boolean(patch?.fontSize || patch?.color)) ||
      typeof patch?.padding === 'number' ||
      typeof patch?.marginTop === 'number' ||
      typeof patch?.marginBottom === 'number' ||
      typeof patch?.marginLeft === 'number' ||
      typeof patch?.marginRight === 'number' ||
      typeof patch?.fontWeight === 'number' ||
      (typeof patch?.borderWidth === 'number' && patch.borderWidth > 0) ||
      typeof patch?.borderRadius === 'number'

    if (isBlock) {
      return (
        <div className={className} style={mergedStyle} data-decorate-key={propKey}>
          {children}
        </div>
      )
    }

    if (!hasOverride) {
      return <>{children}</>
    }
    return (
      <div className={className} style={mergedStyle} data-decorate-key={propKey}>
        {children}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative',
        isBlock || kind === 'image' ? 'block w-full' : 'inline-block max-w-full align-top',
        className,
        selected
          ? 'outline outline-2 outline-[#60A5FA] outline-offset-2'
          : 'outline outline-1 outline-dashed outline-[#93C5FD] outline-offset-2',
      )}
      style={mergedStyle}
      data-decorate-key={propKey}
      data-decorate-kind={kind}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        select(propKey)
      }}
    >
      <span
        className="pointer-events-none absolute -right-2 -top-2 z-[60] flex size-6 items-center justify-center rounded-full border border-[#93C5FD] bg-[#DBEAFE] text-[#1D4ED8] shadow-sm"
        title="点击编辑"
      >
        <Pencil className="size-3.5" />
      </span>
      {/* 默认禁止内部交互；嵌套的可装修节点重新开启点击，便于卡片内标题/图标独立选中 */}
      <div className="pointer-events-none h-full w-full [&_[data-decorate-key]]:pointer-events-auto">
        {children}
      </div>
    </div>
  )
}
