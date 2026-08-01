'use client'

import React from 'react'
import { DecorateFrame } from './DecorateFrame'
import { useDecorateMode } from './DecorateContext'

type DecorateTextProps = {
  propKey: string
  className?: string
  style?: React.CSSProperties
  as?: keyof React.JSX.IntrinsicElements
  /** 默认超链接，可被后台装修配置中的 href 覆盖 */
  href?: string
  children: React.ReactNode
}

function normalizeHref(href?: string) {
  const value = (href || '').trim()
  return value.length > 0 ? value : undefined
}

/** 静态文案可装修包装：装修模式可改字、样式与超链接，发布后本地持久化 */
export function DecorateText({
  propKey,
  className,
  style,
  as = 'span',
  href: defaultHref,
  children,
}: DecorateTextProps) {
  const { isDecorateMode, getPatch } = useDecorateMode()
  const patch = getPatch(propKey)
  const isHidden = patch?.hidden === true
  const href = normalizeHref(patch?.href) || normalizeHref(defaultHref)
  const text =
    typeof patch?.text === 'string' && patch.text.length > 0
      ? patch.text
      : typeof children === 'string' || typeof children === 'number'
        ? String(children)
        : children

  const Tag = as as React.ElementType
  const mergedStyle: React.CSSProperties = {
    ...style,
    ...(patch?.fontSize ? { fontSize: `${patch.fontSize}px` } : null),
    ...(patch?.color ? { color: patch.color } : null),
    ...(patch?.backgroundColor ? { backgroundColor: patch.backgroundColor } : null),
    ...(typeof patch?.padding === 'number' ? { padding: `${patch.padding}px` } : null),
    ...(typeof patch?.marginTop === 'number' ? { marginTop: `${patch.marginTop}px` } : null),
    ...(typeof patch?.marginBottom === 'number' ? { marginBottom: `${patch.marginBottom}px` } : null),
    ...(typeof patch?.marginLeft === 'number' ? { marginLeft: `${patch.marginLeft}px` } : null),
    ...(typeof patch?.marginRight === 'number' ? { marginRight: `${patch.marginRight}px` } : null),
    ...(href && !isDecorateMode ? { cursor: 'pointer' } : null),
  }

  if (!isDecorateMode) {
    if (isHidden) {
      return null
    }

    if (href) {
      const isExternal =
        /^https?:\/\//i.test(href) || href.startsWith('mailto:') || href.startsWith('tel:')

      return (
        <a
          href={href}
          className={className}
          style={Object.keys(mergedStyle).length ? mergedStyle : style}
          {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : null)}
        >
          {text}
        </a>
      )
    }

    return (
      <Tag className={className} style={Object.keys(mergedStyle).length ? mergedStyle : style}>
        {text}
      </Tag>
    )
  }

  return (
    <DecorateFrame propKey={propKey} kind="text" className={className} style={style}>
      <Tag>{text}</Tag>
    </DecorateFrame>
  )
}
