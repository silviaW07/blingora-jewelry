'use client'

import React, { useEffect, useRef, useState } from 'react'
import { ImageIcon, ShieldCheck, Upload } from 'lucide-react'
import type { useBuyerShowManagement } from '@/backend/hooks/useBuyerShowManagement'

type HookReturn = ReturnType<typeof useBuyerShowManagement>

export default function BuyerShowManagementView({
  state,
  handlers,
}: {
  state: HookReturn['state']
  handlers: HookReturn['handlers']
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const proofInputRef = useRef<HTMLInputElement | null>(null)
  const [proofTitle, setProofTitle] = useState('')
  const [proofBody, setProofBody] = useState('')
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState('')

  const chooseProofFile = (file: File | null) => {
    setProofFile(file)
    setProofPreview((current) => {
      if (current) URL.revokeObjectURL(current)
      return file ? URL.createObjectURL(file) : ''
    })
  }

  useEffect(() => {
    const preventNavigate = (event: DragEvent) => {
      event.preventDefault()
    }
    window.addEventListener('dragover', preventNavigate)
    window.addEventListener('drop', preventNavigate)
    return () => {
      window.removeEventListener('dragover', preventNavigate)
      window.removeEventListener('drop', preventNavigate)
    }
  }, [])

  return (
    <section className="min-h-screen bg-[#F8FAFC] p-6">
      <div className="container mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-[#1E293B]">买家秀管理</h1>
          <p className="mt-1 text-xs text-[#64748B]">
            上方照片墙继续放买家实拍。下面的真实性证明需要一张图和一段说明，发布后显示在照片墙上方。
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              value={state.titleDraft}
              onChange={(event) => handlers.setTitleDraft(event.target.value)}
              placeholder="可选名称 / Optional title"
              className="h-9 flex-1 rounded-md border border-[#E2E8F0] bg-white px-3 text-sm"
            />
            <button
              type="button"
              disabled={state.uploading}
              onClick={() => inputRef.current?.click()}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[#0052D9] px-4 text-xs font-semibold text-white disabled:opacity-60"
            >
              <Upload className="size-3.5" />
              {state.uploading ? '上传中...' : '本地导入'}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={(event) => {
                if (event.target.files) void handlers.ingestFiles(event.target.files)
                event.target.value = ''
              }}
            />
          </div>
          <div
            className={`flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
              state.dragOver ? 'border-[#0052D9] bg-[#EFF6FF]' : 'border-[#CBD5E1] bg-white hover:border-[#94A3B8]'
            }`}
            onClick={() => inputRef.current?.click()}
            onDragEnter={(event) => {
              event.preventDefault()
              event.stopPropagation()
              handlers.setDragOver(true)
            }}
            onDragOver={(event) => {
              event.preventDefault()
              event.stopPropagation()
              event.dataTransfer.dropEffect = 'copy'
              handlers.setDragOver(true)
            }}
            onDragLeave={(event) => {
              event.preventDefault()
              event.stopPropagation()
              const next = event.relatedTarget as Node | null
              if (next && event.currentTarget.contains(next)) return
              handlers.setDragOver(false)
            }}
            onDrop={(event) => {
              event.preventDefault()
              event.stopPropagation()
              handlers.setDragOver(false)
              const files = event.dataTransfer.files
              if (files?.length) void handlers.ingestFiles(files)
            }}
          >
            <Upload className={`mb-3 size-8 ${state.dragOver ? 'text-[#0052D9]' : 'text-[#94A3B8]'}`} />
            <p className="text-sm font-semibold text-[#1E293B]">
              {state.dragOver ? '松开鼠标即可上传' : '把图片或视频拖到这里'}
            </p>
            <p className="mt-1 text-xs text-[#94A3B8]">也可点击此区域选择本地文件，支持多选</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {state.loading ? (
            <p className="col-span-full text-xs text-[#94A3B8]">加载中...</p>
          ) : state.media.length === 0 ? (
            <p className="col-span-full text-xs text-[#94A3B8]">还没有媒体，先上传一张图或一段视频。</p>
          ) : (
            state.media.map((item) => (
              <div key={item.id} className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
                {item.mediaType === 'VIDEO' ? (
                  <video src={item.mediaUrl} className="aspect-[3/4] w-full bg-black object-cover" controls />
                ) : (
                  <img src={item.mediaUrl} alt={item.title || ''} className="aspect-[3/4] w-full object-cover" />
                )}
                <div className="space-y-2 p-2">
                  <input
                    defaultValue={item.title || ''}
                    placeholder="未命名"
                    className="h-8 w-full rounded border border-[#E2E8F0] px-2 text-xs"
                    onBlur={(event) => {
                      if ((event.target.value || '') !== (item.title || '')) {
                        void handlers.saveTitle(item.id, event.target.value)
                      }
                    }}
                  />
                  <div className="flex items-center justify-between text-[11px]">
                    <button
                      type="button"
                      className="text-[#0052D9]"
                      onClick={() => void handlers.toggleEnabled(item.id, !item.isEnabled)}
                    >
                      {item.isEnabled ? '前台显示' : '已隐藏'}
                    </button>
                    <button type="button" className="text-[#D9001B]" onClick={() => void handlers.removeMedia(item.id)}>
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
          <div className="mb-1 flex items-center gap-2">
            <ShieldCheck className="size-4 text-[#0052D9]" />
            <h2 className="text-sm font-bold text-[#1E293B]">真实性证明</h2>
          </div>
          <p className="mb-4 text-xs leading-5 text-[#64748B]">
            每条记录是一张实拍加一段说明，用来展示仓库、打包、发货或客户实收。前台没有记录时，这个分区不会出现。
          </p>
          <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
            <button
              type="button"
              className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#64748B]"
              onClick={() => proofInputRef.current?.click()}
            >
              {proofPreview ? (
                <img src={proofPreview} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <span>选择图片</span>
              )}
            </button>
            <div className="space-y-2">
              <input
                value={proofTitle}
                onChange={(event) => setProofTitle(event.target.value)}
                placeholder="标题，例如：仓库实拍 / 打包发货"
                maxLength={160}
                className="h-9 w-full rounded-md border border-[#E2E8F0] px-3 text-sm"
              />
              <textarea
                value={proofBody}
                onChange={(event) => setProofBody(event.target.value)}
                placeholder="写清楚这张图能说明什么。可以换行。"
                maxLength={2000}
                rows={4}
                className="w-full resize-y rounded-md border border-[#E2E8F0] px-3 py-2 text-sm leading-6"
              />
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] text-[#94A3B8]">图片、标题、说明都要填写后才能发布。</p>
                <button
                  type="button"
                  disabled={state.proofSaving}
                  className="inline-flex h-9 items-center rounded-md bg-[#0052D9] px-4 text-xs font-semibold text-white disabled:opacity-60"
                  onClick={() => {
                    void handlers.publishProof(proofFile, proofTitle, proofBody).then((ok) => {
                      if (!ok) return
                      setProofTitle('')
                      setProofBody('')
                      chooseProofFile(null)
                    })
                  }}
                >
                  {state.proofSaving ? '发布中...' : '发布到前台'}
                </button>
              </div>
            </div>
          </div>
          <input
            ref={proofInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0] || null
              if (file && !file.type.startsWith('image/') && !/\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(file.name)) {
                event.target.value = ''
                return
              }
              chooseProofFile(file)
              event.target.value = ''
            }}
          />
          <div className="mt-4 space-y-3">
            {state.proofs.length === 0 ? (
              <p className="text-xs text-[#94A3B8]">还没有证明。发布后会出现在买家秀照片墙上方。</p>
            ) : (
              state.proofs.map((item) => (
                <div key={item.id} className="grid gap-3 rounded-xl border border-[#F1F5F9] p-3 md:grid-cols-[140px_minmax(0,1fr)]">
                  <img src={item.imageUrl} alt="" className="aspect-[4/3] w-full rounded-lg object-cover" />
                  <div className="space-y-2">
                    <input
                      defaultValue={item.title}
                      className="h-8 w-full rounded border border-[#E2E8F0] px-2 text-sm"
                      onBlur={(event) => {
                        if (event.target.value.trim() !== item.title) {
                          void handlers.saveProofText(item.id, { title: event.target.value })
                        }
                      }}
                    />
                    <textarea
                      defaultValue={item.body}
                      rows={3}
                      className="w-full resize-y rounded border border-[#E2E8F0] px-2 py-1.5 text-xs leading-5"
                      onBlur={(event) => {
                        if (event.target.value.trim() !== item.body) {
                          void handlers.saveProofText(item.id, { body: event.target.value })
                        }
                      }}
                    />
                    <div className="flex items-center justify-between text-[11px]">
                      <button
                        type="button"
                        className="text-[#0052D9]"
                        onClick={() => void handlers.toggleProof(item.id, !item.isEnabled)}
                      >
                        {item.isEnabled ? '前台显示' : '已隐藏'}
                      </button>
                      <button type="button" className="text-[#D9001B]" onClick={() => void handlers.removeProof(item.id)}>
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-bold text-[#1E293B]">
              <ImageIcon className="size-4" />
              客户留言 / 评价
            </h2>
            <select
              value={state.commentFilter}
              onChange={(event) => void handlers.setCommentFilter(event.target.value as typeof state.commentFilter)}
              className="h-8 rounded-md border border-[#E2E8F0] px-2 text-xs"
            >
              <option value="PENDING">待审核</option>
              <option value="APPROVED">已通过</option>
              <option value="REJECTED">已拒绝</option>
              <option value="ALL">全部</option>
            </select>
          </div>
          <div className="space-y-2">
            {state.comments.length === 0 ? (
              <p className="text-xs text-[#94A3B8]">暂无记录</p>
            ) : (
              state.comments.map((item) => (
                <div key={item.id} className="rounded-lg border border-[#F1F5F9] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-[#1E293B]">
                        {item.authorName}
                        {item.rating ? ` · ${item.rating} 分` : ''}
                        <span className="ml-2 font-normal text-[#94A3B8]">{item.status}</span>
                      </p>
                      <p className="mt-1 text-xs text-[#475569]">{item.content}</p>
                    </div>
                    <div className="flex shrink-0 gap-2 text-[11px]">
                      {item.status !== 'APPROVED' ? (
                        <button
                          type="button"
                          className="text-[#2BA471]"
                          onClick={() => void handlers.reviewComment(item.id, 'APPROVED')}
                        >
                          通过
                        </button>
                      ) : null}
                      {item.status !== 'REJECTED' ? (
                        <button
                          type="button"
                          className="text-[#FF6A00]"
                          onClick={() => void handlers.reviewComment(item.id, 'REJECTED')}
                        >
                          拒绝
                        </button>
                      ) : null}
                      <button type="button" className="text-[#D9001B]" onClick={() => void handlers.removeComment(item.id)}>
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
