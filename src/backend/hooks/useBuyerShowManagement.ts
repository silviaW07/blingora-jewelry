'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { upload_media_file } from '@/tools/upload-image'
import type {
  BuyerShowCommentItem,
  BuyerShowCommentStatus,
  BuyerShowMediaItem,
} from '@/backend/actions/BuyerShowManagement'
import {
  createBuyerShowMedia,
  deleteBuyerShowComment,
  deleteBuyerShowMedia,
  listBuyerShowCommentsAdmin,
  listBuyerShowMediaAdmin,
  reviewBuyerShowComment,
  updateBuyerShowMedia,
} from '@/backend/actions/BuyerShowManagement'

export function useBuyerShowManagement() {
  const [media, setMedia] = useState<BuyerShowMediaItem[]>([])
  const [comments, setComments] = useState<BuyerShowCommentItem[]>([])
  const [commentFilter, setCommentFilter] = useState<BuyerShowCommentStatus | 'ALL'>('PENDING')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')

  const reloadMedia = useCallback(async () => {
    const result = await listBuyerShowMediaAdmin()
    setMedia(result.list)
  }, [])

  const reloadComments = useCallback(async (status: BuyerShowCommentStatus | 'ALL' = commentFilter) => {
    const result = await listBuyerShowCommentsAdmin({ status })
    setComments(result.list)
  }, [commentFilter])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([listBuyerShowMediaAdmin(), listBuyerShowCommentsAdmin({ status: 'PENDING' })])
      .then(([mediaResult, commentResult]) => {
        if (cancelled) return
        setMedia(mediaResult.list)
        setComments(commentResult.list)
      })
      .catch((error) => {
        if (!cancelled) toast.error(error instanceof Error ? error.message : '加载失败')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const ingestFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((file) => {
        const type = (file.type || '').toLowerCase()
        const name = (file.name || '').toLowerCase()
        return (
          type.startsWith('image/') ||
          type.startsWith('video/') ||
          /\.(png|jpe?g|webp|gif|bmp|avif|mp4|webm|mov|m4v)$/i.test(name)
        )
      })
      if (!list.length) {
        toast.error('请选择图片或视频')
        return
      }
      setUploading(true)
      try {
        for (const file of list) {
          const mediaUrl = await upload_media_file(file)
          const mediaType =
            file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(file.name) ? 'VIDEO' : 'IMAGE'
          await createBuyerShowMedia({
            mediaType,
            mediaUrl,
            title: titleDraft.trim() || null,
            isEnabled: true,
          })
        }
        setTitleDraft('')
        await reloadMedia()
        toast.success(`已上传 ${list.length} 个文件`)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '上传失败')
      } finally {
        setUploading(false)
      }
    },
    [reloadMedia, titleDraft],
  )

  return {
    state: { media, comments, commentFilter, loading, uploading, dragOver, titleDraft },
    handlers: {
      setTitleDraft,
      setDragOver,
      ingestFiles,
      setCommentFilter: async (status: BuyerShowCommentStatus | 'ALL') => {
        setCommentFilter(status)
        try {
          await reloadComments(status)
        } catch (error) {
          toast.error(error instanceof Error ? error.message : '加载失败')
        }
      },
      saveTitle: async (id: string, title: string) => {
        try {
          await updateBuyerShowMedia({ id, title })
          await reloadMedia()
        } catch (error) {
          toast.error(error instanceof Error ? error.message : '保存失败')
        }
      },
      toggleEnabled: async (id: string, isEnabled: boolean) => {
        try {
          await updateBuyerShowMedia({ id, isEnabled })
          await reloadMedia()
        } catch (error) {
          toast.error(error instanceof Error ? error.message : '保存失败')
        }
      },
      removeMedia: async (id: string) => {
        try {
          await deleteBuyerShowMedia({ id })
          await reloadMedia()
          toast.success('已删除')
        } catch (error) {
          toast.error(error instanceof Error ? error.message : '删除失败')
        }
      },
      reviewComment: async (id: string, status: 'APPROVED' | 'REJECTED') => {
        try {
          await reviewBuyerShowComment({ id, status })
          await reloadComments()
          toast.success(status === 'APPROVED' ? '已通过' : '已拒绝')
        } catch (error) {
          toast.error(error instanceof Error ? error.message : '操作失败')
        }
      },
      removeComment: async (id: string) => {
        try {
          await deleteBuyerShowComment({ id })
          await reloadComments()
          toast.success('已删除留言')
        } catch (error) {
          toast.error(error instanceof Error ? error.message : '删除失败')
        }
      },
    },
  }
}
