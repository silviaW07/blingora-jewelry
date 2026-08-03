'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { toProxiedImageUrl } from '@/frontend/utils/toProxiedImageUrl'

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
}: Props) {
  const proxied = toProxiedImageUrl(src)
  const [failed, setFailed] = useState(false)

  if (!proxied || failed) {
    return <div className={cn('bg-[#f0ebe3]', className)} aria-hidden />
  }

  // Local /img-proxy and absolute same-origin — use unoptimized only if needed
  const isLocalProxy = proxied.startsWith('/img-proxy/')

  if (fill) {
    return (
      <Image
        src={proxied}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn('object-cover', className)}
        referrerPolicy="no-referrer"
        unoptimized={isLocalProxy}
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <Image
      src={proxied}
      alt={alt}
      width={width || 400}
      height={height || 400}
      sizes={sizes}
      priority={priority}
      className={cn('object-cover', className)}
      referrerPolicy="no-referrer"
      unoptimized={isLocalProxy}
      onError={() => setFailed(true)}
    />
  )
}
