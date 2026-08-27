'use client'

import { useEffect, useState } from 'react'
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
}: Props) {
  const primary = toProxiedImageUrl(src, { width: imageWidth, quality })
  const raw = String(src || '').trim()
  const [attempt, setAttempt] = useState(0)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setAttempt(0)
    setFailed(false)
  }, [src, imageWidth, quality])

  const displaySrc =
    attempt === 0
      ? primary
      : toProxiedImageUrl(src, { width: imageWidth, quality: Math.min(90, quality + 5) }) || raw || primary

  const shellClass = fill ? 'absolute inset-0 bg-[#f0ebe3]' : 'bg-[#f0ebe3]'

  if ((!primary && !raw) || failed || !displaySrc) {
    return <div className={cn(shellClass, className)} aria-hidden />
  }

  const imgClass = fill
    ? cn('absolute inset-0 h-full w-full max-w-full object-cover', className)
    : cn('max-w-full object-cover', className)

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
        onError={() => {
          if (attempt < 1) setAttempt(1)
          else setFailed(true)
        }}
      />
    </div>
  )
}
