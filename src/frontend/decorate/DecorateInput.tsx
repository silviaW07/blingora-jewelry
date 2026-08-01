'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { DecorateFrame } from './DecorateFrame'
import { useDecorateMode } from './DecorateContext'

type DecorateInputProps = Omit<React.ComponentProps<typeof Input>, 'placeholder'> & {
  propKey: string
  /** 默认占位文案，可被装修 patch.text 覆盖 */
  placeholder?: string
}

/**
 * 可装修的输入框：用 getPatch(propKey).text 覆盖 placeholder。
 * 装修模式下用 DecorateFrame 包裹，便于在工具栏编辑占位文案。
 */
export function DecorateInput({
  propKey,
  placeholder: defaultPlaceholder = '',
  className,
  style,
  ...inputProps
}: DecorateInputProps) {
  const { isDecorateMode, getPatch } = useDecorateMode()
  const patch = getPatch(propKey)
  const isHidden = patch?.hidden === true
  const placeholder =
    typeof patch?.text === 'string' && patch.text.length > 0
      ? patch.text
      : defaultPlaceholder

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
  }

  if (!isDecorateMode) {
    if (isHidden) {
      return null
    }

    return (
      <Input
        {...inputProps}
        placeholder={placeholder}
        className={className}
        style={Object.keys(mergedStyle).length ? mergedStyle : style}
      />
    )
  }

  return (
    <DecorateFrame
      propKey={propKey}
      kind="text"
      className="!block w-full"
      style={style}
    >
      {/* 供装修工具栏从 textContent 种子化默认占位文案 */}
      <span className="sr-only">{placeholder}</span>
      <Input {...inputProps} placeholder={placeholder} className={className} />
    </DecorateFrame>
  )
}
