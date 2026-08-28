'use client'

import React from 'react'
import { DecorateFrame } from './DecorateFrame'
import { useDecorateMode } from './DecorateContext'
import { containsChinese } from '@/shared/productKeywordDictionary'
import type { DecoratePatch } from './types'

type DecorateTextProps = {
  propKey: string
  className?: string
  style?: React.CSSProperties
  as?: keyof React.JSX.IntrinsicElements
  /** 默认超链接，可被后台装修配置中的 href 覆盖 */
  href?: string
  children: React.ReactNode
}

export function decorateBoxStyle(patch?: DecoratePatch | null): React.CSSProperties {
  const width = typeof patch?.borderWidth === 'number' ? patch.borderWidth : undefined
  return {
    ...(typeof patch?.fontWeight === 'number' ? { fontWeight: patch.fontWeight } : null),
    ...(width && width > 0
      ? {
          borderWidth: `${width}px`,
          borderStyle: 'solid' as const,
          borderColor: patch?.borderColor || '#f254a6',
        }
      : null),
    ...(typeof patch?.borderRadius === 'number' ? { borderRadius: `${patch.borderRadius}px` } : null),
  }
}

/** Newlines + *bold* / **bold** for decorate copy. */
export function renderDecorateRichText(text: string): React.ReactNode {
  const lines = String(text || '').split('\n')
  return lines.map((line, lineIndex) => (
    <React.Fragment key={lineIndex}>
      {lineIndex > 0 ? <br /> : null}
      {renderDecorateInline(line)}
    </React.Fragment>
  ))
}

function renderDecorateInline(line: string): React.ReactNode {
  if (!line) return null
  const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return parts.map((part, index) => {
    const bold = part.match(/^\*\*([^*]+)\*\*$/) || part.match(/^\*([^*]+)\*$/)
    if (bold) {
      return (
        <strong key={index} className="font-semibold">
          {bold[1]}
        </strong>
      )
    }
    return part
  })
}

function normalizeHref(href?: string) {
  const value = (href || '').trim()
  return value.length > 0 ? value : undefined
}

/**
 * 店面仅 en/es：装修里若写了中文文案，正式态忽略，回退到 children（i18n/接口英文），
 * 避免出现「View All」是英文、专区标题却是「流行饰品」。
 * 装修编辑态仍显示原文，方便改回英文。
 */
function resolveDisplayText(
  patchText: string | undefined,
  children: React.ReactNode,
  isDecorateMode: boolean,
): React.ReactNode {
  const hasPatch = typeof patchText === 'string' && patchText.length > 0
  if (!hasPatch) {
    return typeof children === 'string' || typeof children === 'number' ? String(children) : children
  }
  if (!isDecorateMode && containsChinese(patchText)) {
    return typeof children === 'string' || typeof children === 'number' ? String(children) : children
  }
  return patchText
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
  const text = resolveDisplayText(
    typeof patch?.text === 'string' ? patch.text : undefined,
    children,
    isDecorateMode,
  )
  const content = typeof text === 'string' ? renderDecorateRichText(text) : text

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
    ...decorateBoxStyle(patch),
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
          {content}
        </a>
      )
    }

    return (
      <Tag className={className} style={Object.keys(mergedStyle).length ? mergedStyle : style}>
        {content}
      </Tag>
    )
  }

  return (
    <DecorateFrame propKey={propKey} kind="text" className={className} style={style}>
      <Tag style={decorateBoxStyle(patch)}>{content}</Tag>
    </DecorateFrame>
  )
}
