'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { toProxiedImageUrl } from '@/frontend/utils/toProxiedImageUrl'

type ImageLightboxProps = {
  src: string
  alt?: string
  open: boolean
  onClose: () => void
  /** URL already painted in the thumbnail. Shown immediately so the preview is not blank. */
  instantSrc?: string
}

function uniqueUrls(...urls: Array<string | null | undefined>) {
  const list = urls.map((url) => String(url || '').trim()).filter(Boolean)
  return Array.from(new Set(list))
}

const LARGE_WIDTH = 960
const LARGE_QUALITY = 82

/** Screen-sized preview. Separate from the list thumb so a click can warm it early. */
export function adminLargeImageUrl(src: string): string {
  const raw = String(src || '').trim()
  if (!raw) return ''
  return toProxiedImageUrl(raw, { width: LARGE_WIDTH, quality: LARGE_QUALITY }) || raw
}

const warmedLargeUrls = new Set<string>()

/** Start the large file during pointerdown, before the overlay opens. */
export function prefetchAdminLargeImage(src: string) {
  if (typeof window === 'undefined') return
  const url = adminLargeImageUrl(src)
  if (!url || warmedLargeUrls.has(url)) return
  warmedLargeUrls.add(url)
  if (warmedLargeUrls.size > 80) {
    const oldest = warmedLargeUrls.values().next().value
    if (oldest) warmedLargeUrls.delete(oldest)
  }
  const img = new window.Image()
  img.referrerPolicy = 'no-referrer'
  img.decoding = 'async'
  img.src = url
}

/** Full-screen image preview: click backdrop or press Esc to close. */
export function ImageLightbox({ src, alt = '', open, onClose, instantSrc = '' }: ImageLightboxProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!mounted || !open || !src) return null

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt || '图片预览'}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 sm:p-8"
      onClick={onClose}
    >
      <button
        type="button"
        className="absolute right-4 top-4 z-[101] flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
        title="关闭"
        aria-label="关闭"
        onClick={onClose}
      >
        <X className="h-5 w-5" />
      </button>
      <LightboxImage src={src} instantSrc={instantSrc} alt={alt || '预览大图'} />
    </div>,
    document.body,
  )
}

/**
 * Paint the thumbnail that is already on screen, then swap in a screen-sized
 * image when it finishes. The sharp file used to stay opacity-0 until a 960px
 * proxy (or the raw original) loaded, so the overlay sat empty.
 */
function LightboxImage({
  src,
  instantSrc,
  alt,
}: {
  src: string
  instantSrc: string
  alt: string
}) {
  const instant =
    String(instantSrc || '').trim() ||
    toProxiedImageUrl(src, { width: 256, quality: 70 }) ||
    src
  const upgrades = useMemo(
    () =>
      uniqueUrls(
        adminLargeImageUrl(src),
        toProxiedImageUrl(src, { width: 720, quality: 80 }),
      ).filter((url) => url && url !== instant),
    [instant, src],
  )
  const [upgradeIndex, setUpgradeIndex] = useState(0)
  const [upgradeReady, setUpgradeReady] = useState(false)
  const [instantBroken, setInstantBroken] = useState(false)

  useEffect(() => {
    setUpgradeIndex(0)
    setUpgradeReady(false)
    setInstantBroken(false)
  }, [instant, src])

  const upgrade = upgrades[upgradeIndex] || ''
  const upgradeGaveUp = !upgrade
  const showInstant = !upgradeReady && !instantBroken
  const showFailure = upgradeGaveUp && instantBroken

  if (showFailure) {
    return (
      <div
        className="flex max-h-[90vh] max-w-[min(96vw,1200px)] flex-col items-center justify-center gap-2 rounded-lg bg-black/40 px-8 py-12 text-sm text-white/80"
        onClick={(event) => event.stopPropagation()}
      >
        <span>图片加载失败</span>
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-white/60 underline hover:text-white"
        >
          在新标签页打开原图
        </a>
      </div>
    )
  }

  return (
    <div
      className="relative flex h-[min(90vh,1200px)] w-[min(96vw,1200px)] items-center justify-center"
      onClick={(event) => event.stopPropagation()}
    >
      {showInstant ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={instant}
          alt={alt}
          referrerPolicy="no-referrer"
          decoding="sync"
          fetchPriority="high"
          className="relative z-[1] h-full w-full object-contain shadow-2xl"
          draggable={false}
          onError={() => setInstantBroken(true)}
        />
      ) : null}
      {upgrade ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={upgrade}
          src={upgrade}
          alt={alt}
          referrerPolicy="no-referrer"
          decoding="async"
          fetchPriority="high"
          className={
            upgradeReady
              ? 'relative z-[1] h-full w-full object-contain shadow-2xl'
              : 'pointer-events-none absolute inset-0 z-0 h-full w-full object-contain opacity-0'
          }
          onLoad={(event) => {
            // Some CDN size suffixes 200 a tiny error gif. Keep the thumb instead of swapping to it.
            if (event.currentTarget.naturalWidth < 48) {
              setUpgradeReady(false)
              setUpgradeIndex((prev) => prev + 1)
              return
            }
            setUpgradeReady(true)
          }}
          onError={() => {
            setUpgradeReady(false)
            setUpgradeIndex((prev) => prev + 1)
          }}
          draggable={false}
        />
      ) : null}
    </div>
  )
}

type PreviewableThumbProps = {
  src: string
  alt?: string
  className?: string
  title?: string
  overlayClassName?: string
  children: React.ReactNode
  onPreviewOpen?: () => void
}

function readPaintedThumb(root: HTMLElement | null): string {
  const img = root?.querySelector('img')
  return img?.currentSrc || img?.getAttribute('src') || ''
}

/** Wrap a thumbnail: click opens ImageLightbox. Overlay is a div so parent `draggable` can reorder. */
export function PreviewableThumb({
  src,
  alt = '',
  className,
  title = '点击查看大图',
  overlayClassName,
  children,
  onPreviewOpen,
}: PreviewableThumbProps) {
  const [open, setOpen] = useState(false)
  const [instantSrc, setInstantSrc] = useState('')
  const dragMovedRef = React.useRef(false)
  const pointerRef = React.useRef<{ x: number; y: number } | null>(null)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const safeSrc = String(src || '').trim()

  const openPreview = () => {
    setInstantSrc(readPaintedThumb(rootRef.current))
    setOpen(true)
    onPreviewOpen?.()
  }

  if (!safeSrc) {
    return <div className={className}>{children}</div>
  }

  return (
    <>
      <div ref={rootRef} className={`relative ${className || 'block h-full w-full'}`}>
        <div className="pointer-events-none h-full w-full [&>*]:h-full [&>*]:w-full [&>img]:[-webkit-user-drag:none]">
          {children}
        </div>
        <div
          role="button"
          tabIndex={0}
          className={`absolute inset-0 z-[1] bg-transparent ${overlayClassName || 'cursor-zoom-in'}`}
          title={title}
          aria-label={title}
          onPointerDown={(event) => {
            dragMovedRef.current = false
            pointerRef.current = { x: event.clientX, y: event.clientY }
            prefetchAdminLargeImage(safeSrc)
          }}
          onPointerMove={(event) => {
            const start = pointerRef.current
            if (!start) return
            if (Math.abs(event.clientX - start.x) > 6 || Math.abs(event.clientY - start.y) > 6) {
              dragMovedRef.current = true
            }
          }}
          onClick={(event) => {
            event.stopPropagation()
            if (dragMovedRef.current) return
            openPreview()
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              openPreview()
            }
          }}
        />
      </div>
      <ImageLightbox
        src={safeSrc}
        instantSrc={instantSrc}
        alt={alt}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  )
}
