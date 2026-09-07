'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { toProxiedImageUrl } from '@/frontend/utils/toProxiedImageUrl'

export { toProxiedImageUrl }

type Props = {
  src?: string | null
  alt: string
  className?: string
  fill?: boolean
  width?: number
  height?: number
  sizes?: string
  priority?: boolean
  imageWidth?: number
  quality?: number
  fallbackSrc?: string | null
  /** 主图超过该毫秒仍未完成加载时切到 fallbackSrc */
  slowFallbackMs?: number
}

/**
 * Native <img> with CDN/OSS thumbs. Always attach src immediately —
 * delaying the tag until a slot/IO fired left empty beige boxes on mobile.
 */
export function OptimizedProductImage({
  src,
  alt,
  className,
  fill = true,
  width,
  height,
  priority = false,
  imageWidth = 400,
  quality = 85,
  fallbackSrc = null,
  slowFallbackMs = 0,
}: Props) {
  const primary = toProxiedImageUrl(src, { width: imageWidth, quality })
  const raw = String(src || '').trim()
  const fallback = String(fallbackSrc || '').trim()
  const [attempt, setAttempt] = useState(0)
  const [useFallback, setUseFallback] = useState(false)
  const loadedRef = useRef(false)
  const hasSrc = Boolean(primary || raw)

  useEffect(() => {
    loadedRef.current = false
    setAttempt(0)
    setUseFallback(false)
  }, [src, imageWidth, quality, fallback])

  useEffect(() => {
    if (!(slowFallbackMs > 0) || !fallback || !hasSrc || fallback === raw) return
    const timer = window.setTimeout(() => {
      if (!loadedRef.current) setUseFallback(true)
    }, slowFallbackMs)
    return () => window.clearTimeout(timer)
  }, [src, fallback, slowFallbackMs, hasSrc, raw])
  const displaySrc =
    !hasSrc || useFallback
      ? fallback
      : attempt === 0
        ? primary
        : attempt === 1
          ? toProxiedImageUrl(src, { width: Math.max(240, imageWidth), quality: 80 }) || raw || primary
          : toProxiedImageUrl(src, { width: 0 }) || raw || primary

  const shellClass = fill ? 'absolute inset-0 bg-[#f0ebe3]' : 'bg-[#f0ebe3]'

  if (!displaySrc) {
    return <div className={cn(shellClass, className)} aria-hidden />
  }

  const imgClass = fill
    ? cn('absolute inset-0 z-[1] h-full w-full max-w-full object-cover', className)
    : cn('relative z-[1] max-w-full object-cover', className)

  return (
    <div className={fill ? 'absolute inset-0' : 'relative'}>
      <div className={cn(shellClass)} aria-hidden />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={`${attempt}-${displaySrc}`}
        src={displaySrc}
        alt={alt}
        width={fill ? imageWidth : width || imageWidth}
        height={fill ? imageWidth : height || imageWidth}
        className={imgClass}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
        fetchPriority={priority ? 'high' : 'auto'}
        referrerPolicy="no-referrer"
        onContextMenu={(event) => event.preventDefault()}
        onLoad={() => {
          loadedRef.current = true
        }}
        onError={() => {
          if (!useFallback && attempt < 2 && hasSrc) {
            setAttempt((n) => n + 1)
            return
          }
          if (fallback && displaySrc !== fallback) {
            setUseFallback(true)
            return
          }
        }}
      />
    </div>
  )
}
