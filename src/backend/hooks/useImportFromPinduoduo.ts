'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { CategoryOption, ProductStatusType } from '@/backend/actions/ImportFrom1688'
import {
  createPinduoduoImportTask,
  getCategoryOptions,
  startParseTask,
} from '@/backend/actions/ImportFrom1688'

interface CreateFormFields {
  urls: string
  defaultCategoryId: string
  markupRate: number | ''
  defaultStatus: ProductStatusType
  stockStrategyStock: number | ''
}

export interface ImportFromPinduoduoState {
  categoryOptions: CategoryOption[]
  createForm: CreateFormFields
  isSubmitting: boolean
  isParsingTask: boolean
  createFormCategoryWarning: string | null
}

export interface ImportFromPinduoduoHandlers {
  handleCreateFormChange: <K extends keyof CreateFormFields>(field: K, value: CreateFormFields[K]) => void
  handleCreateTask: () => Promise<void>
}

type Options = {
  onTaskCreated?: (taskId: string) => void
}

const defaultForm: CreateFormFields = {
  urls: '',
  defaultCategoryId: '',
  markupRate: 20,
  defaultStatus: 'DRAFT',
  stockStrategyStock: 100,
}

export function useImportFromPinduoduo(options: Options = {}) {
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([])
  const [createForm, setCreateForm] = useState<CreateFormFields>(defaultForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isParsingTask, setIsParsingTask] = useState(false)
  const [createFormCategoryWarning, setCreateFormCategoryWarning] = useState<string | null>(null)

  useEffect(() => {
    void getCategoryOptions()
      .then((res) => {
        const list = Array.isArray(res)
          ? res
          : Array.isArray((res as { list?: CategoryOption[] })?.list)
            ? (res as { list: CategoryOption[] }).list
            : []
        setCategoryOptions(list)
      })
      .catch(() => setCategoryOptions([]))
  }, [])

  const handleCreateFormChange = useCallback(
    <K extends keyof CreateFormFields>(field: K, value: CreateFormFields[K]) => {
      setCreateForm(prev => ({ ...prev, [field]: value }))
      if (field === 'defaultCategoryId') {
        setCreateFormCategoryWarning(null)
      }
    },
    [],
  )

  const handleCreateTask = useCallback(async () => {
    if (!createForm.urls.trim()) {
      toast.error('请先粘贴拼多多商品链接')
      return
    }
    if (!createForm.defaultCategoryId) {
      setCreateFormCategoryWarning('建议先选择默认分类，发布时需要目标分类。')
    }

    setIsSubmitting(true)
    try {
      const created = await createPinduoduoImportTask({
        urls: createForm.urls,
        defaultCategoryId: createForm.defaultCategoryId || undefined,
        markupRate: createForm.markupRate === '' ? 0 : Number(createForm.markupRate),
        defaultStatus: createForm.defaultStatus,
        stockStrategyStock:
          createForm.stockStrategyStock === '' ? undefined : Number(createForm.stockStrategyStock),
      })

      setIsSubmitting(false)
      setIsParsingTask(true)
      try {
        await startParseTask({ taskId: created.taskId })
        const createdCount = Number(created.createdCount ?? 0)
        const skippedDuplicateCount = Number(created.skippedDuplicateCount ?? 0)
        if (skippedDuplicateCount > 0) {
          toast.success(
            `拼多多已解析 ${createdCount} 条；跳过 ${skippedDuplicateCount} 条重复链接，请到待上传区核对`,
          )
        } else {
          toast.success('拼多多解析完成，请到待上传区核对')
        }
        setCreateForm(defaultForm)
        options.onTaskCreated?.(created.taskId)
      } catch (error: any) {
        toast.error(error?.message || '拼多多解析失败，请稍后重试')
      } finally {
        setIsParsingTask(false)
      }
    } catch (error: any) {
      toast.error(error?.message || '创建拼多多导入任务失败')
      setIsSubmitting(false)
    }
  }, [createForm, options])

  return {
    state: {
      categoryOptions,
      createForm,
      isSubmitting,
      isParsingTask,
      createFormCategoryWarning,
    } satisfies ImportFromPinduoduoState,
    handlers: {
      handleCreateFormChange,
      handleCreateTask,
    } satisfies ImportFromPinduoduoHandlers,
  }
}
