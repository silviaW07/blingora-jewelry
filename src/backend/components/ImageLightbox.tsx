'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { toProxiedImageUrl } from '@/frontend/utils/toProxiedImageUrl'

type ImageLightboxProps = {
  src: string
  alt?: string
  open: boolean
  onClose: () => void
}

/** Full-screen image preview: click backdrop or press Esc to close. */
export function ImageLightbox({ src, alt = '', open, onClose }: ImageLightboxProps) {
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

  const previewSrc = toProxiedImageUrl(src, { width: 1600, quality: 90 }) || src

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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={previewSrc}
        alt={alt || '预览大图'}
        className="max-h-[90vh] max-w-[min(96vw,1200px)] object-contain shadow-2xl"
        onClick={event => event.stopPropagation()}
        draggable={false}
      />
    </div>,
    document.body,
  )
}

type PreviewableThumbProps = {
  src: string
  alt?: string
  className?: string
  title?: string
  children: React.ReactNode
  /** Called after opening is prevented (e.g. stop row expand). */
  onPreviewOpen?: () => void
}

/** Wrap a thumbnail: click opens ImageLightbox. */
export function PreviewableThumb({
  src,
  alt = '',
  className,
  title = '点击查看大图',
  children,
  onPreviewOpen,
}: PreviewableThumbProps) {
  const [open, setOpen] = useState(false)
  const safeSrc = String(src || '').trim()

  if (!safeSrc) {
    return <div className={className}>{children}</div>
  }

  return (
    <>
      <button
        type="button"
        className={className || 'block h-full w-full'}
        title={title}
        onClick={event => {
          event.stopPropagation()
          event.preventDefault()
          setOpen(true)
          onPreviewOpen?.()
        }}
      >
        {children}
      </button>
      <ImageLightbox
        src={safeSrc}
        alt={alt}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  )
}
