'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { toProxiedImageUrl } from '@/frontend/utils/toProxiedImageUrl'
import { shouldBypassImageOptimizer } from '@/shared/imageUrl'

export { toProxiedImageUrl }

type Props = {
  src?: string | null
  alt: string
  className?: string
  /** fill parent (parent must be position:relative + sized) */
  fill?: boolean
  width?: number
  height?: number
  sizes?: string
  priority?: boolean
}

/**
 * Product image: next/image (WebP) + same-origin proxy for alicdn + no-referrer fallback.
 * On error: once retry without size suffix / original src before locking the beige tile.
 */
export function OptimizedProductImage({
  src,
  alt,
  className,
  fill = true,
  width,
  height,
  sizes = '(max-width: 640px) 50vw, 25vw',
  priority = false,
  /** Longest edge requested from alicdn (default 400 for cards) */
  imageWidth = 400,
}: Props & { imageWidth?: number }) {
  const primary = toProxiedImageUrl(src, { width: imageWidth })
  const [attempt, setAttempt] = useState(0)
  const [failed, setFailed] = useState(false)

  const raw = String(src || '').trim()
  // attempt 0: resized proxy; 1: proxy without size; 2: original raw URL
  const displaySrc =
    attempt === 0 ? primary : attempt === 1 ? toProxiedImageUrl(src, { width: 0 }) || primary : raw

  if (!primary || failed || !displaySrc) {
    return <div className={cn('bg-[#f0ebe3]', className)} aria-hidden />
  }

  const skipOptimizer = shouldBypassImageOptimizer(displaySrc) || attempt > 0

  const handleError = () => {
    if (attempt < 2) {
      setAttempt((n) => n + 1)
      return
    }
    setFailed(true)
  }

  if (fill) {
    return (
      <Image
        key={`${displaySrc}-${attempt}`}
        src={displaySrc}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn('object-cover', className)}
        referrerPolicy="no-referrer"
        unoptimized={skipOptimizer}
        onError={handleError}
      />
    )
  }

  return (
    <Image
      key={`${displaySrc}-${attempt}`}
      src={displaySrc}
      alt={alt}
      width={width || imageWidth}
      height={height || imageWidth}
      sizes={sizes}
      priority={priority}
      className={cn('object-cover', className)}
      referrerPolicy="no-referrer"
      unoptimized={skipOptimizer}
      onError={handleError}
    />
  )
}
