'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
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
  /** Longest edge requested from alicdn (1200 covers retina list cards; swatches pass 240) */
  imageWidth?: number
}

/**
 * Product image: same-origin proxy + sized alicdn thumbs.
 * Proxy/upload URLs use native <img> (no Next optimizer queue) so gallery +
 * color swatches can paint in parallel. Soft-retry before locking beige tile.
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
  imageWidth = 1200,
}: Props) {
  const primary = toProxiedImageUrl(src, { width: imageWidth })
  const [attempt, setAttempt] = useState(0)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setAttempt(0)
    setFailed(false)
  }, [src, imageWidth])

  const raw = String(src || '').trim()
  // attempt 0: resized proxy; 1: proxy without size; 2: original raw URL
  const displaySrc =
    attempt === 0 ? primary : attempt === 1 ? toProxiedImageUrl(src, { width: 0 }) || primary : raw

  if (!primary && !raw) {
    return <div className={cn('bg-[#f0ebe3]', className)} aria-hidden />
  }

  if (failed || !displaySrc) {
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

  // Same-origin proxy / uploads: native img avoids /_next/image contention
  // when a PDP paints hero + 6 gallery + 8 color swatches at once.
  if (skipOptimizer) {
    if (fill) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={attempt}
          src={displaySrc}
          alt={alt}
          className={cn('absolute inset-0 h-full w-full object-cover', className)}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          referrerPolicy="no-referrer"
          onError={handleError}
        />
      )
    }

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        key={attempt}
        src={displaySrc}
        alt={alt}
        width={width || imageWidth}
        height={height || imageWidth}
        className={cn('object-cover', className)}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        referrerPolicy="no-referrer"
        onError={handleError}
      />
    )
  }

  if (fill) {
    return (
      <Image
        key={attempt}
        src={displaySrc}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn('object-cover', className)}
        referrerPolicy="no-referrer"
        onError={handleError}
      />
    )
  }

  return (
    <Image
      key={attempt}
      src={displaySrc}
      alt={alt}
      width={width || imageWidth}
      height={height || imageWidth}
      sizes={sizes}
      priority={priority}
      className={cn('object-cover', className)}
      referrerPolicy="no-referrer"
      onError={handleError}
    />
  )
}
