'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Check, ChevronsUpDown, Pencil, Plus, Settings2, TextCursorInput, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/backend/components/ui'
import { cn } from '@/lib/utils'
import {
  createSuffixConfig,
  deleteSuffixConfig,
  listSuffixConfigs,
  updateSuffixConfig,
  type SuffixConfigItem,
} from '@/backend/actions/SuffixConfig'

/**
 * Fallback presets, only used before the API responds / when the request fails.
 * The live data source is the `suffix_config` table via {@link listSuffixConfigs}.
 */
export const SUFFIX_OPTIONS = ['[13USD]', '[3USD]', '[清仓]', '[特价]', '[新品]'] as const

export interface BatchAppendTitleSuffixControlProps {
  /** Disable when nothing selected / parent busy */
  disabled?: boolean
  loading?: boolean
  selectedCount: number
  /** Confirm with concatenated suffix; parent runs API (server skips if title already ends with it) */
  onConfirm: (suffix: string) => Promise<void> | void
}

/**
 * Shared “批量加后缀” button + modal for 商品列表 / 待上传区.
 * 后缀选项来源于后端 suffix_config 表，支持“管理后缀”内联 CRUD。
 */
export function BatchAppendTitleSuffixControl({
  disabled = false,
  loading = false,
  selectedCount,
  onConfirm,
}: BatchAppendTitleSuffixControlProps) {
  const [open, setOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  /** Selected suffixes in click order — concatenation follows this order. */
  const [selectedSuffixes, setSelectedSuffixes] = useState<string[]>([])
  const [suffixDraft, setSuffixDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // ---- 后缀选项数据源（后端接口） ----
  const [options, setOptions] = useState<SuffixConfigItem[]>([])
  const [optionsLoading, setOptionsLoading] = useState(false)

  // ---- 管理后缀弹窗 ----
  const [manageOpen, setManageOpen] = useState(false)
  const [newSuffix, setNewSuffix] = useState('')
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [rowBusyId, setRowBusyId] = useState<string | null>(null)

  const loadOptions = useCallback(async () => {
    setOptionsLoading(true)
    try {
      const data = await listSuffixConfigs()
      setOptions(Array.isArray(data) ? data : [])
    } catch (err: any) {
      toast.error(err?.message || '获取后缀列表失败')
    } finally {
      setOptionsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) void loadOptions()
  }, [open, loadOptions])

  const close = () => {
    if (submitting) return
    setOpen(false)
    setPickerOpen(false)
    setSelectedSuffixes([])
    setSuffixDraft('')
  }

  const toggleSuffix = (value: string) => {
    setSelectedSuffixes((prev) => {
      if (prev.includes(value)) {
        setSuffixDraft((draft) => draft.replace(value, ''))
        return prev.filter((item) => item !== value)
      }
      setSuffixDraft((draft) => `${draft}${value}`)
      return [...prev, value]
    })
  }

  const removeSuffix = (value: string) => {
    setSelectedSuffixes((prev) => prev.filter((item) => item !== value))
    setSuffixDraft((draft) => draft.replace(value, ''))
  }

  const handleConfirm = async () => {
    const next = suffixDraft.trim()
    if (!next) return
    setSubmitting(true)
    try {
      // Parent/API uses appendTitleSuffixIfMissing: skip when title already ends with this full string.
      await onConfirm(next)
      setOpen(false)
      setPickerOpen(false)
      setSelectedSuffixes([])
      setSuffixDraft('')
    } finally {
      setSubmitting(false)
    }
  }

  // ---- 管理后缀：CRUD ----
  const openManage = () => {
    setPickerOpen(false)
    setNewSuffix('')
    setEditingId(null)
    setEditingValue('')
    setManageOpen(true)
    void loadOptions()
  }

  const handleCreate = async () => {
    const name = newSuffix.trim()
    if (!name) {
      toast.error('请输入后缀内容')
      return
    }
    setCreating(true)
    try {
      await createSuffixConfig({ suffix_name: name })
      toast.success('已新增后缀')
      setNewSuffix('')
      await loadOptions()
    } catch (err: any) {
      toast.error(err?.message || '新增失败')
    } finally {
      setCreating(false)
    }
  }

  const startEdit = (item: SuffixConfigItem) => {
    setEditingId(item.id)
    setEditingValue(item.suffix_name)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingValue('')
  }

  const handleUpdate = async (item: SuffixConfigItem) => {
    const name = editingValue.trim()
    if (!name) {
      toast.error('后缀内容不能为空')
      return
    }
    if (name === item.suffix_name) {
      cancelEdit()
      return
    }
    setRowBusyId(item.id)
    try {
      await updateSuffixConfig({ id: item.id, suffix_name: name })
      toast.success('已更新后缀')
      cancelEdit()
      await loadOptions()
      // Keep any in-progress selection text in sync with the rename.
      setSelectedSuffixes((prev) => prev.map((v) => (v === item.suffix_name ? name : v)))
      setSuffixDraft((draft) => draft.split(item.suffix_name).join(name))
    } catch (err: any) {
      toast.error(err?.message || '更新失败')
    } finally {
      setRowBusyId(null)
    }
  }

  const handleDelete = async (item: SuffixConfigItem) => {
    setRowBusyId(item.id)
    try {
      await deleteSuffixConfig({ id: item.id })
      toast.success('已删除后缀')
      if (editingId === item.id) cancelEdit()
      await loadOptions()
      // Drop the removed suffix from any pending selection.
      setSelectedSuffixes((prev) => prev.filter((v) => v !== item.suffix_name))
      setSuffixDraft((draft) => draft.split(item.suffix_name).join(''))
    } catch (err: any) {
      toast.error(err?.message || '删除失败')
    } finally {
      setRowBusyId(null)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-9 border-slate-200"
        disabled={disabled || loading || selectedCount <= 0}
        onClick={() => setOpen(true)}
      >
        <TextCursorInput className="w-4 h-4 mr-2 text-slate-600" />
        批量加后缀
      </Button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) close()
          else setOpen(true)
        }}
      >
        <DialogContent className="max-w-[460px] p-0 overflow-hidden border-none shadow-2xl">
          <div className="h-2 w-full bg-primary" />
          <div className="p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-lg font-bold text-slate-900">批量加后缀</DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                将为已勾选的 {selectedCount} 项标题末尾追加所选后缀（按选择顺序拼接）。若标题末尾已包含整段拼接结果则跳过。
              </DialogDescription>
            </DialogHeader>
            <div className="mb-6 space-y-2">
              <label className="text-sm font-bold text-slate-700 block">后缀内容</label>
              <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={pickerOpen}
                    disabled={submitting}
                    className={cn(
                      'h-auto min-h-11 w-full justify-between px-3 py-2 font-normal',
                      selectedSuffixes.length === 0 && 'text-muted-foreground',
                    )}
                  >
                    <div className="flex flex-1 flex-wrap items-center gap-1.5 text-left">
                      {selectedSuffixes.length === 0 ? (
                        <span>请选择一个或多个后缀</span>
                      ) : (
                        selectedSuffixes.map((value) => (
                          <Badge
                            key={value}
                            variant="secondary"
                            className="gap-1 rounded-md px-2 py-0.5 text-xs font-medium"
                            onClick={(event) => {
                              event.preventDefault()
                              event.stopPropagation()
                              if (!submitting) removeSuffix(value)
                            }}
                          >
                            {value}
                            <X className="h-3 w-3 opacity-60" />
                          </Badge>
                        ))
                      )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1" align="start">
                  <ul className="max-h-56 overflow-y-auto">
                    {optionsLoading ? (
                      <li className="px-2 py-3 text-center text-sm text-slate-400">加载中…</li>
                    ) : options.length === 0 ? (
                      <li className="px-2 py-3 text-center text-sm text-slate-400">暂无后缀，请在“管理后缀”中新增</li>
                    ) : (
                      options.map((option) => {
                        const checked = selectedSuffixes.includes(option.suffix_name)
                        return (
                          <li key={option.id}>
                            <button
                              type="button"
                              disabled={submitting}
                              className={cn(
                                'flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-slate-100',
                                checked && 'bg-slate-50',
                              )}
                              onClick={() => toggleSuffix(option.suffix_name)}
                            >
                              <Checkbox
                                checked={checked}
                                className="pointer-events-none"
                                tabIndex={-1}
                                aria-hidden
                              />
                              <span className="flex-1 text-left font-medium text-slate-800">{option.suffix_name}</span>
                              {checked ? <Check className="h-4 w-4 text-primary" /> : null}
                            </button>
                          </li>
                        )
                      })
                    )}
                  </ul>
                  <div className="mt-1 border-t border-slate-100 pt-1">
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-primary hover:bg-primary/5"
                      onClick={openManage}
                    >
                      <Settings2 className="h-4 w-4" />
                      管理后缀
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-medium text-slate-600 block">
                  最终后缀（可直接编辑）
                </label>
                <Input
                  value={suffixDraft}
                  disabled={submitting}
                  placeholder="可选择上方预设，也可直接输入自定义后缀"
                  onChange={(event) => {
                    const value = event.target.value
                    setSuffixDraft(value)
                    setSelectedSuffixes((prev) =>
                      prev.filter((option) => value.includes(option)),
                    )
                  }}
                />
              </div>
              {suffixDraft.trim() ? (
                <p className="text-xs text-slate-500">
                  将追加：<span className="font-semibold text-slate-700">{suffixDraft.trim()}</span>
                </p>
              ) : (
                <p className="text-xs text-slate-400">不会改动类目；仅修改标题文本。</p>
              )}
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="ghost"
                className="flex-1 h-11 font-medium hover:bg-slate-100"
                onClick={close}
                disabled={submitting}
              >
                取消
              </Button>
              <Button
                className="flex-1 h-11 font-bold bg-primary text-primary-foreground"
                onClick={() => void handleConfirm()}
                disabled={submitting || !suffixDraft.trim()}
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  '确认追加'
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* 管理后缀弹窗：新增 / 编辑 / 删除 */}
      <Dialog
        open={manageOpen}
        onOpenChange={(nextOpen) => {
          if (rowBusyId || creating) return
          setManageOpen(nextOpen)
          if (!nextOpen) cancelEdit()
        }}
      >
        <DialogContent className="max-w-[520px] p-0 overflow-hidden border-none shadow-2xl">
          <div className="h-2 w-full bg-primary" />
          <div className="p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-lg font-bold text-slate-900">管理后缀</DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                新增、编辑或删除“批量加后缀”下拉框中的后缀选项。
              </DialogDescription>
            </DialogHeader>

            {/* 顶部新增 */}
            <div className="flex items-center gap-2 mb-4">
              <Input
                value={newSuffix}
                disabled={creating}
                placeholder="输入新的后缀，如 [热卖]"
                onChange={(event) => setNewSuffix(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    void handleCreate()
                  }
                }}
              />
              <Button
                className="h-10 shrink-0 bg-primary text-primary-foreground font-bold"
                onClick={() => void handleCreate()}
                disabled={creating || !newSuffix.trim()}
              >
                {creating ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-1" />
                    新增
                  </>
                )}
              </Button>
            </div>

            {/* 列表 */}
            <ul className="max-h-[320px] overflow-y-auto rounded-lg border border-slate-100 divide-y divide-slate-100">
              {optionsLoading ? (
                <li className="px-3 py-6 text-center text-sm text-slate-400">加载中…</li>
              ) : options.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-slate-400">暂无后缀，请在上方新增</li>
              ) : (
                options.map((item) => {
                  const isEditing = editingId === item.id
                  const busy = rowBusyId === item.id
                  return (
                    <li key={item.id} className="flex items-center gap-2 px-3 py-2">
                      {isEditing ? (
                        <Input
                          value={editingValue}
                          autoFocus
                          disabled={busy}
                          className="h-9 flex-1"
                          onChange={(event) => setEditingValue(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault()
                              void handleUpdate(item)
                            }
                            if (event.key === 'Escape') {
                              event.preventDefault()
                              cancelEdit()
                            }
                          }}
                        />
                      ) : (
                        <span className="flex-1 font-medium text-slate-800">{item.suffix_name}</span>
                      )}

                      {isEditing ? (
                        <>
                          <Button
                            size="sm"
                            className="h-9 bg-primary text-primary-foreground font-medium"
                            onClick={() => void handleUpdate(item)}
                            disabled={busy || !editingValue.trim()}
                          >
                            {busy ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              '保存'
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-9"
                            onClick={cancelEdit}
                            disabled={busy}
                          >
                            取消
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 text-slate-500 hover:text-primary"
                            title="编辑"
                            onClick={() => startEdit(item)}
                            disabled={busy}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 text-slate-500 hover:text-destructive"
                            title="删除"
                            onClick={() => void handleDelete(item)}
                            disabled={busy}
                          >
                            {busy ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </>
                      )}
                    </li>
                  )
                })
              )}
            </ul>

            <DialogFooter className="mt-6">
              <Button
                variant="ghost"
                className="h-10 font-medium hover:bg-slate-100"
                onClick={() => {
                  if (rowBusyId || creating) return
                  setManageOpen(false)
                  cancelEdit()
                }}
                disabled={!!rowBusyId || creating}
              >
                关闭
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
