'use client'

import React from 'react'
import type {
  AdminManagementState,
  AdminManagementHandlers,
} from '@/backend/hooks/useAdminManagement'
import type { AdminRole } from '@/backend/actions/AdminManagement'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  UserCog,
  UserPlus,
  RefreshCcw,
  KeyRound,
  Trash2,
  ShieldCheck,
  ShieldOff,
  Loader2,
} from 'lucide-react'

interface Props {
  state: AdminManagementState
  handlers: AdminManagementHandlers
}

const formatDateTime = (iso: string | null): string => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString()
}

export default function AdminManagementView({ state, handlers }: Props) {
  const {
    loading,
    list,
    actionLoadingId,
    createOpen,
    createForm,
    createSubmitting,
    resetTarget,
    resetPasswordValue,
    resetSubmitting,
    deleteTarget,
    deleteSubmitting,
    ADMIN_ROLE_LABELS,
    ADMIN_STATUS_LABELS,
  } = state

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <section className="w-full bg-white border-b">
        <div className="w-full max-w-none px-4 xl:px-6 py-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserCog className="size-6" />
            </div>
            <div>
              <h1 className="text-xl font-header font-bold text-slate-900">管理员账号</h1>
              <p className="text-sm text-slate-500">新增、管理子管理员，支持启用/禁用、重置密码、删除与角色权限分配。</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-10 border-slate-200" disabled={loading} onClick={() => handlers.refresh()}>
              <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />刷新
            </Button>
            <Button className="h-10 bg-primary text-primary-foreground" onClick={() => handlers.setCreateOpen(true)}>
              <UserPlus className="w-4 h-4 mr-2" />新增管理员
            </Button>
          </div>
        </div>
      </section>

      <section className="w-full">
        <div className="w-full max-w-none px-4 xl:px-6 py-6">
          <Card className="border-none shadow-sm overflow-hidden w-full">
            <CardContent className="p-0">
              <div className="w-full overflow-x-auto">
                <Table className="w-full min-w-full table-auto">
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-6 font-header font-bold text-slate-700">账号</TableHead>
                      <TableHead className="font-header font-bold text-slate-700">用户名</TableHead>
                      <TableHead className="font-header font-bold text-slate-700">邮箱</TableHead>
                      <TableHead className="font-header font-bold text-slate-700 w-[150px]">角色 / 权限</TableHead>
                      <TableHead className="font-header font-bold text-slate-700 text-center">状态</TableHead>
                      <TableHead className="font-header font-bold text-slate-700">最后登录</TableHead>
                      <TableHead className="font-header font-bold text-slate-700">创建时间</TableHead>
                      <TableHead className="font-header font-bold text-slate-700 text-right pr-6">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="py-16 text-center text-slate-400">
                          <Loader2 className="w-5 h-5 animate-spin inline mr-2" />加载中…
                        </TableCell>
                      </TableRow>
                    ) : list.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="py-16 text-center text-slate-400">
                          暂无管理员账号，点击右上角「新增管理员」创建。
                        </TableCell>
                      </TableRow>
                    ) : (
                      list.map(item => {
                        const busy = actionLoadingId === item.id
                        return (
                          <TableRow key={item.id} className="hover:bg-slate-50/60">
                            <TableCell className="pl-6 font-medium text-slate-900">
                              {item.account}
                              {item.isSelf && <Badge className="ml-2 bg-primary/10 text-primary border-0">我</Badge>}
                            </TableCell>
                            <TableCell className="text-slate-700">{item.username}</TableCell>
                            <TableCell className="text-slate-600">{item.email}</TableCell>
                            <TableCell>
                              <Select
                                value={item.role}
                                onValueChange={value => handlers.changeRole(item, value as AdminRole)}
                                disabled={busy}
                              >
                                <SelectTrigger className="h-9 w-[130px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ADMIN">{ADMIN_ROLE_LABELS.ADMIN}</SelectItem>
                                  <SelectItem value="SUB_ADMIN">{ADMIN_ROLE_LABELS.SUB_ADMIN}</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-center">
                              {item.status === 'ACTIVE' ? (
                                <Badge className="bg-emerald-100 text-emerald-700 border-0">{ADMIN_STATUS_LABELS.ACTIVE}</Badge>
                              ) : (
                                <Badge className="bg-slate-200 text-slate-600 border-0">{ADMIN_STATUS_LABELS.DISABLED}</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-slate-500 text-sm">{formatDateTime(item.lastLoginAt)}</TableCell>
                            <TableCell className="text-slate-500 text-sm">{formatDateTime(item.createdAt)}</TableCell>
                            <TableCell className="pr-6">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-9 border-slate-200"
                                  disabled={busy || item.isSelf}
                                  title={item.isSelf ? '不能禁用自己' : undefined}
                                  onClick={() => handlers.toggleStatus(item)}
                                >
                                  {item.status === 'ACTIVE' ? (
                                    <><ShieldOff className="w-4 h-4 mr-1.5 text-amber-600" />禁用</>
                                  ) : (
                                    <><ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-600" />启用</>
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-9 border-slate-200"
                                  disabled={busy}
                                  onClick={() => handlers.openReset(item)}
                                >
                                  <KeyRound className="w-4 h-4 mr-1.5 text-primary" />重置密码
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-9 border-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                  disabled={busy || item.isSelf}
                                  title={item.isSelf ? '不能删除自己' : undefined}
                                  onClick={() => handlers.openDelete(item)}
                                >
                                  <Trash2 className="w-4 h-4 mr-1.5" />删除
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 新增管理员对话框 */}
      <Dialog open={createOpen} onOpenChange={handlers.setCreateOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>新增管理员账号</DialogTitle>
            <DialogDescription>创建后可用该账号登录后台；默认创建为子管理员。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="admin-account">账号 *</Label>
              <Input
                id="admin-account"
                value={createForm.account}
                placeholder="登录账号（唯一）"
                onChange={e => handlers.setCreateField('account', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-username">用户名</Label>
              <Input
                id="admin-username"
                value={createForm.username}
                placeholder="显示名（留空则同账号）"
                onChange={e => handlers.setCreateField('username', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-email">邮箱 *</Label>
              <Input
                id="admin-email"
                type="email"
                value={createForm.email}
                placeholder="name@example.com"
                onChange={e => handlers.setCreateField('email', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-password">初始密码 *</Label>
              <Input
                id="admin-password"
                type="password"
                value={createForm.password}
                placeholder="至少 8 位，含字母和数字"
                onChange={e => handlers.setCreateField('password', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>角色 / 权限</Label>
              <Select
                value={createForm.role}
                onValueChange={value => handlers.setCreateField('role', value as AdminRole)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUB_ADMIN">{ADMIN_ROLE_LABELS.SUB_ADMIN}</SelectItem>
                  <SelectItem value="ADMIN">{ADMIN_ROLE_LABELS.ADMIN}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={createSubmitting} onClick={() => handlers.setCreateOpen(false)}>取消</Button>
            <Button className="bg-primary text-primary-foreground" disabled={createSubmitting} onClick={() => handlers.submitCreate()}>
              {createSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />创建中…</> : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 重置密码对话框 */}
      <Dialog open={!!resetTarget} onOpenChange={open => { if (!open) handlers.closeReset() }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>重置密码</DialogTitle>
            <DialogDescription>
              为账号 <span className="font-semibold text-slate-900">{resetTarget?.account}</span> 设置新的登录密码。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label htmlFor="reset-password">新密码 *</Label>
            <Input
              id="reset-password"
              type="password"
              value={resetPasswordValue}
              placeholder="至少 8 位，含字母和数字"
              onChange={e => handlers.setResetPasswordValue(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={resetSubmitting} onClick={() => handlers.closeReset()}>取消</Button>
            <Button className="bg-primary text-primary-foreground" disabled={resetSubmitting} onClick={() => handlers.submitReset()}>
              {resetSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />提交中…</> : '确认重置'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) handlers.closeDelete() }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除管理员账号</AlertDialogTitle>
            <AlertDialogDescription>
              确认删除账号 <span className="font-semibold text-slate-900">{deleteTarget?.account}</span>？此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSubmitting}>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteSubmitting}
              onClick={event => { event.preventDefault(); void handlers.confirmDelete() }}
            >
              {deleteSubmitting ? '删除中…' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
