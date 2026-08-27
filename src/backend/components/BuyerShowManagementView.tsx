'use client'

import React, { useEffect, useRef } from 'react'
import { ImageIcon, Upload } from 'lucide-react'
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
            上传图片或视频（自动压缩）。标题可不填。前台买家秀页按网格展示已启用的图和视频。
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

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {state.loading ? (
            <p className="col-span-full text-xs text-[#94A3B8]">加载中...</p>
          ) : state.media.length === 0 ? (
            <p className="col-span-full text-xs text-[#94A3B8]">还没有媒体，先上传一张图或一段视频。</p>
          ) : (
            state.media.map((item) => (
              <div key={item.id} className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
                {item.mediaType === 'VIDEO' ? (
                  <video src={item.mediaUrl} className="h-36 w-full bg-black object-cover" controls />
                ) : (
                  <img src={item.mediaUrl} alt={item.title || ''} className="h-36 w-full object-cover" />
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
