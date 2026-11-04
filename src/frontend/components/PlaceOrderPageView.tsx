'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { StorefrontResponsiveHeader } from '@/frontend/components/MobileStorefrontHeader'
import { useDecorateMode } from '@/frontend/decorate/DecorateContext'
import { writeDecorateStore } from '@/frontend/decorate/storage'
import {
  getServiceBenefitDecorateKeys,
  SERVICE_BENEFIT_CARD_COUNT,
} from '@/frontend/decorate/serviceBenefitKeys'
import {
  DEFAULT_SERVICE_TRUST_TEMPLATE,
  parseServiceTrustTemplate,
  sectionHasContent,
  serializeServiceTrustTemplate,
  youtubeEmbedUrl,
  type ServiceTrustTemplate,
  type TrustSection,
} from '@/frontend/decorate/serviceTrustTemplate'
import { DECORATE_QUERY } from '@/frontend/decorate/types'
import { hardNavProps } from '@/frontend/utils/hardNavigate'
import { savePageDecorateConfig } from '@/frontend/actions/PageDecorate'
import { upload_image_file } from '@/tools/tools'

const SECTION_KEYS = ['company', 'shipping', 'ordering'] as const

export default function PlaceOrderPageView() {
  const params = useParams<{ index: string }>()
  const index = Number(params?.index)
  const { draft, updatePatch, isDecorateMode } = useDecorateMode()
  const valid = Number.isInteger(index) && index >= 0 && index < SERVICE_BENEFIT_CARD_COUNT
  const trustKey = valid ? getServiceBenefitDecorateKeys(index).trust : ''
  const [form, setForm] = useState<ServiceTrustTemplate | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)

  useEffect(() => {
    if (!valid || form) return
    if (Object.keys(draft).length === 0 && !draft[trustKey]) return
    setForm(parseServiceTrustTemplate(draft[trustKey]?.text) || { ...DEFAULT_SERVICE_TRUST_TEMPLATE })
  }, [draft, form, trustKey, valid])

  if (!valid) {
    return (
      <Shell>
        <Empty title="Page not found" body="This guide does not exist." />
      </Shell>
    )
  }

  if (isDecorateMode) {
    const editor = form || DEFAULT_SERVICE_TRUST_TEMPLATE
    const updateSection = (key: (typeof SECTION_KEYS)[number], patch: Partial<TrustSection>) => {
      setForm({ ...editor, [key]: { ...editor[key], ...patch } })
    }
    const uploadTo = async (key: (typeof SECTION_KEYS)[number], file: File, kind: 'image' | 'video') => {
      setUploadingKey(`${key}-${kind}`)
      try {
        const url = await upload_image_file(file)
        if (!url) throw new Error('上传失败')
        const section = editor[key]
        if (kind === 'video') updateSection(key, { videoUrl: url })
        else if (section.images.length < 8) updateSection(key, { images: [...section.images, url] })
      } catch (err: any) {
        toast.error(err?.message || '上传失败')
      } finally {
        setUploadingKey(null)
      }
    }
    const save = async () => {
      setSaving(true)
      try {
        const text = serializeServiceTrustTemplate(editor)
        const nextDraft = { ...draft, [trustKey]: { ...(draft[trustKey] || {}), text } }
        updatePatch(trustKey, { text })
        writeDecorateStore(nextDraft)
        await savePageDecorateConfig(nextDraft)
        toast.success('已保存，顾客打开的就是这一页')
      } catch (err: any) {
        toast.error(err?.message || '保存失败')
      } finally {
        setSaving(false)
      }
    }
    return (
      <Shell backHref={`/?${DECORATE_QUERY}=1`}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a8073]">大页面编辑</p>
              <h1 className="mt-2 text-3xl font-black">下单说明</h1>
            </div>
            <button
              type="button"
              className="rounded-full bg-[#111111] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
              disabled={saving}
              onClick={() => void save()}
            >
              {saving ? '保存中…' : '保存'}
            </button>
          </div>
          {SECTION_KEYS.map((key, order) => (
            <SectionEditor
              key={key}
              order={order + 1}
              section={editor[key]}
              uploading={uploadingKey}
              sectionKey={key}
              onChange={(patch) => updateSection(key, patch)}
              onUpload={(file, kind) => void uploadTo(key, file, kind)}
            />
          ))}
        </div>
      </Shell>
    )
  }

  const keys = getServiceBenefitDecorateKeys(index)
  const published = parseServiceTrustTemplate(draft[trustKey]?.text)
  const sections = published
    ? SECTION_KEYS.map((key) => published[key]).filter(sectionHasContent)
    : []
  const cardTitle = String(draft[keys.title]?.text || '').trim()
  const cardDesc = String(draft[keys.desc]?.text || '').trim()

  return (
    <Shell>
      {sections.length === 0 && !cardTitle && !cardDesc ? (
        <Empty title="This page is not ready yet" body="Company, shipping, and ordering details will appear here." />
      ) : (
        <div className="flex flex-col gap-6">
          {cardTitle || cardDesc ? (
            <section className="rounded-[20px] bg-white px-6 py-8 shadow-sm sm:px-10">
              {cardTitle ? <h1 className="text-[clamp(28px,4vw,44px)] font-black leading-tight">{cardTitle}</h1> : null}
              {cardDesc ? <p className="mt-4 whitespace-pre-line text-base leading-8 text-[#3f3a34]">{cardDesc}</p> : null}
            </section>
          ) : null}
          {sections.map((section) => (
            <SectionView key={section.title} section={section} />
          ))}
        </div>
      )}
    </Shell>
  )
}

function Shell({ children, backHref = '/' }: { children: React.ReactNode; backHref?: string }) {
  return (
    <div className="min-h-screen bg-[#f7f4ee] text-[#111111]">
      <StorefrontResponsiveHeader />
      <main className="storefront-container py-6 sm:py-10">
        <div className="mx-auto flex w-full max-w-[960px] flex-col gap-6">
          <a
            className="inline-flex w-fit items-center rounded-full border border-[#d8d4ca] bg-white px-4 py-2 text-sm font-semibold"
            {...hardNavProps(backHref)}
          >
            <ArrowLeft className="mr-2 size-4" />
            Back
          </a>
          {children}
        </div>
      </main>
    </div>
  )
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-[20px] bg-white px-6 py-16 text-center shadow-sm">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-3 text-sm text-[#6f6a62]">{body}</p>
    </section>
  )
}

function SectionView({ section }: { section: TrustSection }) {
  const embed = youtubeEmbedUrl(section.videoUrl)
  return (
    <section className="rounded-[20px] bg-white px-6 py-8 shadow-sm sm:px-10">
      <h2 className="text-[clamp(24px,3vw,36px)] font-black leading-tight">{section.title}</h2>
      {section.body ? (
        <p className="mt-4 whitespace-pre-line text-base leading-8 text-[#3f3a34]">{section.body}</p>
      ) : null}
      {section.images.length > 0 ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {section.images.map((src) => (
            <img key={src} src={src} alt="" className="h-72 w-full rounded-2xl object-cover" />
          ))}
        </div>
      ) : null}
      {section.videoUrl ? (
        <div className="mt-6 overflow-hidden rounded-2xl bg-black">
          {embed ? (
            <iframe src={embed} title={section.title} className="aspect-video w-full" allowFullScreen />
          ) : (
            <video src={section.videoUrl} controls className="aspect-video w-full" />
          )}
        </div>
      ) : null}
    </section>
  )
}

function SectionEditor({
  order,
  section,
  sectionKey,
  uploading,
  onChange,
  onUpload,
}: {
  order: number
  section: TrustSection
  sectionKey: string
  uploading: string | null
  onChange: (patch: Partial<TrustSection>) => void
  onUpload: (file: File, kind: 'image' | 'video') => void
}) {
  const busyImage = uploading === `${sectionKey}-image`
  const busyVideo = uploading === `${sectionKey}-video`
  return (
    <section className="rounded-[20px] bg-white px-6 py-8 shadow-sm sm:px-10">
      <p className="text-sm font-semibold text-[#8a8073]">第 {order} 板块</p>
      <input
        value={section.title}
        className="mt-2 w-full border-0 bg-transparent text-3xl font-black outline-none"
        onChange={(event) => onChange({ title: event.target.value })}
      />
      <textarea
        value={section.body}
        placeholder="在这里写这一板块的内容"
        className="mt-4 min-h-40 w-full rounded-xl border border-[#e7e1d8] bg-[#faf8f4] px-4 py-3 text-base leading-7 outline-none"
        onChange={(event) => onChange({ body: event.target.value })}
      />
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        {section.images.map((src, imageIndex) => (
          <button
            key={`${src}-${imageIndex}`}
            type="button"
            className="relative"
            title="移除"
            onClick={() => onChange({ images: section.images.filter((_, i) => i !== imageIndex) })}
          >
            <img src={src} alt="" className="h-36 w-full rounded-xl object-cover" />
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#d8d4ca] px-4 py-2 text-sm font-semibold">
          {busyImage ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          上传图片
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={busyImage || section.images.length >= 8}
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (file) onUpload(file, 'image')
            }}
          />
        </label>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#d8d4ca] px-4 py-2 text-sm font-semibold">
          {busyVideo ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          上传视频
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="hidden"
            disabled={busyVideo}
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (file) onUpload(file, 'video')
            }}
          />
        </label>
      </div>
      <input
        value={section.videoUrl}
        placeholder="或粘贴视频 / YouTube 链接"
        className="mt-3 h-11 w-full rounded-xl border border-[#e7e1d8] px-4 text-sm outline-none"
        onChange={(event) => onChange({ videoUrl: event.target.value })}
      />
    </section>
  )
}
