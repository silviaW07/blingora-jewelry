'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  listBrandAliases,
  createBrandAlias,
  updateBrandAlias,
  deleteBrandAlias,
} from '@/backend/actions/BrandAlias'
import type { BrandAliasItem } from '@/backend/actions/BrandAlias'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Tag, Plus, RefreshCcw, Pencil, Trash2, Check, X, Loader2, ArrowRight } from 'lucide-react'

export default function BrandAliasManagementView() {
  const [items, setItems] = useState<BrandAliasItem[]>([])
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)

  const [newAlias, setNewAlias] = useState('')
  const [newStandard, setNewStandard] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAlias, setEditAlias] = useState('')
  const [editStandard, setEditStandard] = useState('')

  const [deleteTarget, setDeleteTarget] = useState<BrandAliasItem | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listBrandAliases()
      setItems(Array.isArray(data) ? data : [])
    } catch (error: any) {
      toast.error(error?.message || '加载品牌别名失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const handleCreate = useCallback(async () => {
    const alias = newAlias.trim()
    const standard = newStandard.trim()
    if (!alias) {
      toast.error('请填写原始别名（如：蔻C）')
      return
    }
    if (!standard) {
      toast.error('请填写目标品牌名（如：Coach）')
      return
    }
    setBusy(true)
    try {
      await createBrandAlias({ alias, standard_name: standard })
      toast.success('已新增品牌别名')
      setNewAlias('')
      setNewStandard('')
      await refresh()
    } catch (error: any) {
      toast.error(error?.message || '新增失败')
    } finally {
      setBusy(false)
    }
  }, [newAlias, newStandard, refresh])

  const startEdit = useCallback((item: BrandAliasItem) => {
    setEditingId(item.id)
    setEditAlias(item.alias)
    setEditStandard(item.standard_name)
  }, [])

  const cancelEdit = useCallback(() => {
    setEditingId(null)
    setEditAlias('')
    setEditStandard('')
  }, [])

  const handleUpdate = useCallback(async () => {
    if (!editingId) return
    const alias = editAlias.trim()
    const standard = editStandard.trim()
    if (!alias || !standard) {
      toast.error('别名与目标品牌名都不能为空')
      return
    }
    setBusy(true)
    try {
      await updateBrandAlias({ id: editingId, alias, standard_name: standard })
      toast.success('已保存修改')
      cancelEdit()
      await refresh()
    } catch (error: any) {
      toast.error(error?.message || '保存失败')
    } finally {
      setBusy(false)
    }
  }, [editingId, editAlias, editStandard, cancelEdit, refresh])

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    setBusy(true)
    try {
      await deleteBrandAlias({ id: deleteTarget.id })
      toast.success('已删除')
      setDeleteTarget(null)
      await refresh()
    } catch (error: any) {
      toast.error(error?.message || '删除失败')
    } finally {
      setBusy(false)
    }
  }, [deleteTarget, refresh])

  return (
    <div className="w-full max-w-none px-4 xl:px-6 py-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-xl font-semibold">品牌别名管理</h1>
            <p className="text-sm text-muted-foreground">
              采集 / 上架前把卖家暗语替换成标准品牌名（如 蔻C → Coach）。修改后对新发布商品即时生效。
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={loading || busy}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          <span className="ml-1">刷新</span>
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs text-muted-foreground mb-1">原始别名 / 暗语</label>
              <Input
                value={newAlias}
                placeholder="如：蔻C、蔻家、古驰、LV"
                onChange={(e) => setNewAlias(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                disabled={busy}
              />
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground mb-2.5 hidden sm:block" />
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs text-muted-foreground mb-1">目标标准品牌名</label>
              <Input
                value={newStandard}
                placeholder="如：Coach、Gucci、Louis Vuitton"
                onChange={(e) => setNewStandard(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                disabled={busy}
              />
            </div>
            <Button onClick={() => void handleCreate()} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              <span className="ml-1">新增</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">原始别名 / 暗语</TableHead>
                <TableHead className="w-[40%]">目标品牌名</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-10">
                    <Loader2 className="h-5 w-5 animate-spin inline-block" />
                    <span className="ml-2">加载中…</span>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-10">
                    暂无品牌别名，请在上方新增。
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const isEditing = editingId === item.id
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editAlias}
                            onChange={(e) => setEditAlias(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                            disabled={busy}
                          />
                        ) : (
                          <span className="font-medium">{item.alias}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editStandard}
                            onChange={(e) => setEditStandard(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                            disabled={busy}
                          />
                        ) : (
                          <span>{item.standard_name}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <div className="inline-flex gap-1">
                            <Button size="sm" onClick={() => void handleUpdate()} disabled={busy}>
                              <Check className="h-4 w-4" />
                              <span className="ml-1">保存</span>
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit} disabled={busy}>
                              <X className="h-4 w-4" />
                              <span className="ml-1">取消</span>
                            </Button>
                          </div>
                        ) : (
                          <div className="inline-flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => startEdit(item)} disabled={busy}>
                              <Pencil className="h-4 w-4" />
                              <span className="ml-1">编辑</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setDeleteTarget(item)}
                              disabled={busy}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="ml-1">删除</span>
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除品牌别名</AlertDialogTitle>
            <AlertDialogDescription>
              确定删除「{deleteTarget?.alias} → {deleteTarget?.standard_name}」吗？删除后该暗语将不再被自动替换。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDelete()} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
