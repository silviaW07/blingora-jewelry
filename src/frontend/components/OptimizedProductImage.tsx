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
  /** JPG quality for alicdn/OSS resize (default 90). Use 75–80 for list thumbs. */
  quality?: number
}

/**
 * Native <img> only — Next/Image + loading=lazy blank on Chrome Android.
 * Same-origin /img-proxy + eager decode so list cards paint.
 */
export function OptimizedProductImage({
  src,
  alt,
  className,
  fill = true,
  width,
  height,
  priority = false,
  imageWidth = 1200,
  quality = 90,
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
      : attempt === 1
        ? toProxiedImageUrl(src, { width: 0, quality }) || raw
        : raw

  if ((!primary && !raw) || failed || !displaySrc) {
    return <div className={cn('bg-[#f0ebe3]', className)} aria-hidden />
  }

  const handleError = () => {
    if (attempt < 2) {
      setAttempt((n) => n + 1)
      return
    }
    setFailed(true)
  }

  // Visible immediately — Chrome mobile often never fires React onLoad, so opacity-0 stayed blank.
  const imgClass = fill
    ? cn('absolute inset-0 h-full w-full max-w-full object-cover', className)
    : cn('max-w-full object-cover', className)

  return (
    <>
      {fill ? <div className="absolute inset-0 bg-[#f0ebe3]" aria-hidden /> : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={`${attempt}-${displaySrc}`}
        src={displaySrc}
        alt={alt}
        width={fill ? undefined : width || imageWidth}
        height={fill ? undefined : height || imageWidth}
        className={imgClass}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        draggable={false}
        fetchPriority={priority ? 'high' : 'low'}
        referrerPolicy="no-referrer"
        onContextMenu={(event) => event.preventDefault()}
        onError={handleError}
      />
    </>
  )
}
