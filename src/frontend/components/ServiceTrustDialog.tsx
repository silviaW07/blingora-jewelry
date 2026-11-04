'use client'

import React from 'react'
import { X } from 'lucide-react'
import { youtubeEmbedUrl, type ServiceTrustTemplate } from '@/frontend/decorate/serviceTrustTemplate'

export function ServiceTrustDialog({
  template,
  onClose,
}: {
  template: ServiceTrustTemplate
  onClose: () => void
}) {
  const embed = youtubeEmbedUrl(template.videoUrl)
  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-3 sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[min(88vh,760px)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={template.headline || 'How to place an order'}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">
            {template.headline || 'How to place an order'}
          </h2>
          <button
            type="button"
            className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>
        {template.address ? (
          <div className="mb-4 rounded-xl bg-[#f7f4ee] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Company address
            </p>
            <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-800">{template.address}</p>
          </div>
        ) : null}
        {template.note ? (
          <p className="mb-4 whitespace-pre-line text-sm leading-6 text-slate-700">{template.note}</p>
        ) : null}
        {template.images.length > 0 ? (
          <div className="mb-4 grid grid-cols-2 gap-2">
            {template.images.map((src) => (
              <img
                key={src}
                src={src}
                alt=""
                className="h-36 w-full rounded-lg object-cover"
              />
            ))}
          </div>
        ) : null}
        {template.videoUrl ? (
          embed ? (
            <iframe
              src={embed}
              title="Workshop video"
              className="aspect-video w-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video src={template.videoUrl} controls className="w-full rounded-lg" />
          )
        ) : null}
      </div>
    </div>
  )
}
