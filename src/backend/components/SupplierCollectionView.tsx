'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  listSupplierCollections,
  createSupplierCollection,
  updateSupplierCollection,
  deleteSupplierCollection,
} from '@/backend/actions/SupplierCollection'
import type { SupplierCollectionItem } from '@/backend/actions/SupplierCollection'
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
import { Link2, Plus, RefreshCcw, Pencil, Trash2, Check, X, Loader2, ExternalLink } from 'lucide-react'

type Draft = {
  supplierName: string
  albumUrl: string
  secret: string
  note: string
}

const emptyDraft = (): Draft => ({
  supplierName: '',
  albumUrl: '',
  secret: '',
  note: '',
})

export default function SupplierCollectionView() {
  const [items, setItems] = useState<SupplierCollectionItem[]>([])
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Draft>(emptyDraft)
  const [deleteTarget, setDeleteTarget] = useState<SupplierCollectionItem | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listSupplierCollections()
      setItems(Array.isArray(data) ? data : [])
    } catch (error: any) {
      toast.error(error?.message || '加载供应商收录失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const handleCreate = useCallback(async () => {
    const supplierName = draft.supplierName.trim()
    const albumUrl = draft.albumUrl.trim()
    if (!supplierName) {
      toast.error('请填写供应商名称')
      return
    }
    if (!albumUrl) {
      toast.error('请填写相册链接')
      return
    }
    setBusy(true)
    try {
      await createSupplierCollection({
        supplierName,
        albumUrl,
        secret: draft.secret.trim(),
        note: draft.note.trim(),
      })
      toast.success('已新增供应商相册')
      setDraft(emptyDraft())
      await refresh()
    } catch (error: any) {
      toast.error(error?.message || '新增失败')
    } finally {
      setBusy(false)
    }
  }, [draft, refresh])

  const startEdit = useCallback((item: SupplierCollectionItem) => {
    setEditingId(item.id)
    setEditDraft({
      supplierName: item.supplierName,
      albumUrl: item.albumUrl,
      secret: item.secret,
      note: item.note,
    })
  }, [])

  const cancelEdit = useCallback(() => {
    setEditingId(null)
    setEditDraft(emptyDraft())
  }, [])

  const handleUpdate = useCallback(async () => {
    if (!editingId) return
    const supplierName = editDraft.supplierName.trim()
    const albumUrl = editDraft.albumUrl.trim()
    if (!supplierName || !albumUrl) {
      toast.error('供应商名称和相册链接不能为空')
      return
    }
    setBusy(true)
    try {
      await updateSupplierCollection({
        id: editingId,
        supplierName,
        albumUrl,
        secret: editDraft.secret.trim(),
        note: editDraft.note.trim(),
      })
      toast.success('已保存修改')
      cancelEdit()
      await refresh()
    } catch (error: any) {
      toast.error(error?.message || '保存失败')
    } finally {
      setBusy(false)
    }
  }, [editingId, editDraft, cancelEdit, refresh])

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    setBusy(true)
    try {
      await deleteSupplierCollection({ id: deleteTarget.id })
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
          <Link2 className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-xl font-semibold">供应商收录</h1>
            <p className="text-sm text-muted-foreground">
              手动收录供应商相册链接；「秘密」填写相册访问密码或口令，方便采购对照打开。
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
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">供应商名称</label>
              <Input
                value={draft.supplierName}
                placeholder="如：广州某档口"
                onChange={(e) => setDraft((prev) => ({ ...prev, supplierName: e.target.value }))}
                disabled={busy}
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">相册链接</label>
              <Input
                value={draft.albumUrl}
                placeholder="粘贴相册 / 网盘分享链接"
                onChange={(e) => setDraft((prev) => ({ ...prev, albumUrl: e.target.value }))}
                disabled={busy}
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">秘密</label>
              <Input
                value={draft.secret}
                placeholder="相册密码 / 口令"
                onChange={(e) => setDraft((prev) => ({ ...prev, secret: e.target.value }))}
                disabled={busy}
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">备注</label>
              <Input
                value={draft.note}
                placeholder="选填，如主营品类"
                onChange={(e) => setDraft((prev) => ({ ...prev, note: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && void handleCreate()}
                disabled={busy}
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Button onClick={() => void handleCreate()} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              <span className="ml-1">新增收录</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[140px]">供应商</TableHead>
                <TableHead className="min-w-[220px]">相册链接</TableHead>
                <TableHead className="min-w-[120px]">秘密</TableHead>
                <TableHead className="min-w-[140px]">备注</TableHead>
                <TableHead className="text-right min-w-[120px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                    <Loader2 className="h-5 w-5 animate-spin inline-block" />
                    <span className="ml-2">加载中…</span>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                    暂无供应商收录，请在上方手动添加相册链接与秘密。
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
                            value={editDraft.supplierName}
                            onChange={(e) => setEditDraft((prev) => ({ ...prev, supplierName: e.target.value }))}
                            disabled={busy}
                          />
                        ) : (
                          <span className="font-medium">{item.supplierName}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editDraft.albumUrl}
                            onChange={(e) => setEditDraft((prev) => ({ ...prev, albumUrl: e.target.value }))}
                            disabled={busy}
                          />
                        ) : item.albumUrl ? (
                          <a
                            href={item.albumUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex max-w-[360px] items-center gap-1 break-all text-primary hover:underline"
                          >
                            <span className="truncate">{item.albumUrl}</span>
                            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editDraft.secret}
                            onChange={(e) => setEditDraft((prev) => ({ ...prev, secret: e.target.value }))}
                            disabled={busy}
                          />
                        ) : (
                          <span className="font-mono text-sm">{item.secret || '—'}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editDraft.note}
                            onChange={(e) => setEditDraft((prev) => ({ ...prev, note: e.target.value }))}
                            disabled={busy}
                          />
                        ) : (
                          <span className="text-sm text-muted-foreground">{item.note || '—'}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <div className="inline-flex items-center gap-1">
                            <Button size="sm" variant="ghost" onClick={() => void handleUpdate()} disabled={busy}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={cancelEdit} disabled={busy}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <Button size="sm" variant="ghost" onClick={() => startEdit(item)} disabled={busy}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteTarget(item)} disabled={busy}>
                              <Trash2 className="h-4 w-4" />
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

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除供应商收录？</AlertDialogTitle>
            <AlertDialogDescription>
              将删除「{deleteTarget?.supplierName || ''}」及其相册链接，删除后不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDelete()} disabled={busy}>
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
