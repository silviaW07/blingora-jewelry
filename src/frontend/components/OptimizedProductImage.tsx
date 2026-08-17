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
}: Props) {
  const primary = toProxiedImageUrl(src, { width: imageWidth })
  const raw = String(src || '').trim()
  const [attempt, setAttempt] = useState(0)
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setAttempt(0)
    setFailed(false)
    setLoaded(false)
  }, [src, imageWidth])

  const displaySrc =
    attempt === 0 ? primary : attempt === 1 ? toProxiedImageUrl(src, { width: 0 }) || raw : raw

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

  const imgClass = fill
    ? cn(
        'absolute inset-0 h-full w-full object-cover transition-opacity duration-200',
        loaded ? 'opacity-100' : 'opacity-0',
        className,
      )
    : cn('object-cover', loaded ? 'opacity-100' : 'opacity-0', className)

  return (
    <>
      {fill && !loaded ? <div className="absolute inset-0 bg-[#f0ebe3]" aria-hidden /> : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={`${attempt}-${displaySrc}`}
        src={displaySrc}
        alt={alt}
        width={fill ? undefined : width || imageWidth}
        height={fill ? undefined : height || imageWidth}
        className={imgClass}
        loading={priority ? 'eager' : 'eager'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        onError={handleError}
      />
    </>
  )
}
