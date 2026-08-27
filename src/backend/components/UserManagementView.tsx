'use client'

import React from 'react'
import type { UserManagementState, UserManagementHandlers } from '@/backend/hooks/useUserManagement'
import type { UserListSortField } from '@/backend/actions/UserManagement'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Search,
  User,
  RefreshCcw,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  LogIn,
  Copy,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react'

interface Props {
  state: UserManagementState
  handlers: UserManagementHandlers
}

function SortIcon({
  active,
  order,
}: {
  active: boolean
  order: 'asc' | 'desc'
}) {
  if (!active) return <ArrowUpDown className="ml-1 inline h-3.5 w-3.5 opacity-40" />
  return order === 'asc'
    ? <ArrowUp className="ml-1 inline h-3.5 w-3.5 text-primary" />
    : <ArrowDown className="ml-1 inline h-3.5 w-3.5 text-primary" />
}

export default function UserManagementView({ state, handlers }: Props) {
  if (state.isDetailMode) {
    return <CustomerDetailPanel state={state} handlers={handlers} />
  }

  const SortHead = ({
    field,
    label,
    className = '',
  }: {
    field: UserListSortField
    label: string
    className?: string
  }) => (
    <TableHead className={`font-semibold text-xs uppercase tracking-wider ${className}`}>
      <button
        type="button"
        className="inline-flex items-center hover:text-primary"
        onClick={() => handlers.handleSort(field)}
      >
        {label}
        <SortIcon active={state.sortBy === field} order={state.sortOrder} />
      </button>
    </TableHead>
  )

  return (
    <div className="min-h-screen bg-background font-body">
      <section className="w-full border-b bg-card">
        <div className="w-full max-w-none px-4 xl:px-6 py-6">
          <h1 className="flex items-center gap-2 text-2xl font-header font-bold tracking-tight text-foreground">
            <User className="h-6 w-6 text-primary" />
            客户管理
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            共检索到 <span className="font-semibold text-foreground">{state.total}</span> 名客户/用户
            {state.urlParams.customerType
              ? `（类型：${state.CUSTOMER_TYPE_OPTIONS.find(o => o.value === state.urlParams.customerType)?.label || state.urlParams.customerType}）`
              : ''}
          </p>
        </div>
      </section>

      <section className="w-full border-b bg-background">
        <div className="w-full max-w-none flex flex-wrap items-center gap-3 px-4 xl:px-6 py-4">
          <div className="min-w-[220px] max-w-sm flex-1">
            <Input
              className="h-9"
              placeholder="搜索账户名..."
              value={state.localFilters.account}
              onChange={e => handlers.handleTextChange('account', e.target.value)}
              onCompositionStart={handlers.handleCompositionStart}
              onCompositionEnd={() => handlers.handleCompositionEnd('account')}
            />
          </div>
          <div className="min-w-[220px] max-w-sm flex-1">
            <Input
              className="h-9"
              placeholder="搜索邮箱..."
              value={state.localFilters.email}
              onChange={e => handlers.handleTextChange('email', e.target.value)}
              onCompositionStart={handlers.handleCompositionStart}
              onCompositionEnd={() => handlers.handleCompositionEnd('email')}
            />
          </div>
          <div className="w-[150px]">
            <Select
              value={state.urlParams.role || 'CUSTOMER'}
              onValueChange={val => handlers.handleSelectChange('role', val)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="角色" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部角色</SelectItem>
                <SelectItem value="CUSTOMER">{state.ROLE_LABELS.CUSTOMER}</SelectItem>
                <SelectItem value="ADMIN">{state.ROLE_LABELS.ADMIN}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-[160px]">
            <Select
              value={state.urlParams.customerType || 'ALL'}
              onValueChange={val => handlers.handleSelectChange('customerType', val)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="客户类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部类型</SelectItem>
                {state.CUSTOMER_TYPE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-[150px]">
            <Select
              value={state.urlParams.status || 'ALL'}
              onValueChange={val => handlers.handleSelectChange('status', val)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部状态</SelectItem>
                <SelectItem value="ACTIVE">{state.STATUS_LABELS.ACTIVE}</SelectItem>
                <SelectItem value="DISABLED">{state.STATUS_LABELS.DISABLED}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" className="h-9 gap-2" onClick={handlers.handleResetFilters}>
            <RefreshCcw className="h-4 w-4" />
            重置
          </Button>
        </div>
      </section>

      <section className="w-full">
        <div className="w-full max-w-none px-4 xl:px-6 py-8">
          <Card className="overflow-hidden border-none shadow-sm">
            <div className="w-full overflow-x-auto">
              <Table className="w-full min-w-full table-auto">
                <TableHeader className="bg-secondary/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold text-xs uppercase">姓名</TableHead>
                    <TableHead className="font-semibold text-xs uppercase">WhatsApp号</TableHead>
                    <TableHead className="font-semibold text-xs uppercase">邮箱</TableHead>
                    <TableHead className="font-semibold text-xs uppercase">密码</TableHead>
                    <SortHead field="createdAt" label="注册时间" />
                    <SortHead field="lastLoginAt" label="最近登录时间" />
                    <SortHead field="cartUsdTotal" label="购物车金额(美金)" />
                    <TableHead className="font-semibold text-xs uppercase">备注</TableHead>
                    <TableHead className="font-semibold text-xs uppercase">客户类型</TableHead>
                    <TableHead className="font-semibold text-xs uppercase">状态</TableHead>
                    <TableHead className="text-right font-semibold text-xs uppercase">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.loading ? (
                    <TableRow>
                      <TableCell colSpan={11} className="h-40 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <RefreshCcw className="h-6 w-6 animate-spin text-primary" />
                          数据加载中...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : state.list.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="h-40 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Search className="h-6 w-6 opacity-20" />
                          暂无符合条件的客户
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    state.list.map(user => (
                      <TableRow key={user.id} className="group hover:bg-secondary/30">
                        <TableCell>
                          <button
                            type="button"
                            className="font-medium text-primary hover:underline"
                            onClick={() => handlers.handleOpenDetail(user.id)}
                          >
                            {user.username || user.account}
                          </button>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{user.whatsapp || '--'}</TableCell>
                        <TableCell className="text-muted-foreground" scrollX scrollXClassName="max-w-[260px]">
                          {user.email}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {user.passwordPlain || '--'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm tabular-nums">
                          {handlers.formatDateTime(user.createdAt)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm tabular-nums">
                          {handlers.formatDateTime(user.lastLoginAt)}
                        </TableCell>
                        <TableCell className="font-semibold tabular-nums">
                          {handlers.formatUsd(user.cartUsdTotal)}
                        </TableCell>
                        <TableCell
                          className="max-w-[200px]"
                          onDoubleClick={() => handlers.startNoteEdit(user.id, user.adminNote)}
                          title="双击编辑备注"
                        >
                          {state.noteEditingId === user.id ? (
                            <Input
                              autoFocus
                              className="h-8"
                              value={state.noteEditingValue}
                              disabled={state.noteSaving}
                              onChange={e => handlers.changeNoteEditingValue(e.target.value)}
                              onBlur={() => handlers.saveNoteEdit()}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handlers.saveNoteEdit()
                                if (e.key === 'Escape') handlers.cancelNoteEdit()
                              }}
                            />
                          ) : (
                            <span className="block cursor-text truncate text-sm text-muted-foreground">
                              {user.adminNote || '双击添加备注'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell onClick={e => e.stopPropagation()}>
                          <Select
                            value={user.customerType || 'NEW'}
                            disabled={state.customerTypeSavingId === user.id}
                            onValueChange={(val) => handlers.handleCustomerTypeChange(user.id, val)}
                          >
                            <SelectTrigger className="h-8 w-[112px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {state.CUSTOMER_TYPE_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <span className={user.status === 'ACTIVE' ? 'font-medium' : 'text-muted-foreground'}>
                            {state.STATUS_LABELS[user.status]}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8"
                              onClick={() => handlers.handleOpenDetail(user.id)}
                            >
                              <Eye className="mr-1 h-3.5 w-3.5" />
                              查看详情
                            </Button>
                            {user.role === 'CUSTOMER' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8"
                                disabled={state.impersonatingId === user.id || user.status !== 'ACTIVE'}
                                onClick={() => handlers.handleImpersonate(user.id)}
                              >
                                <LogIn className="mr-1 h-3.5 w-3.5" />
                                {state.impersonatingId === user.id ? '登入中...' : '以客户身份登入'}
                              </Button>
                            ) : null}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8"
                              onClick={() => handlers.handleToggleStatus(user.id, user.status)}
                            >
                              {user.status === 'ACTIVE' ? '禁用' : '启用'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => handlers.handleRequestDelete(user)}
                            >
                              <Trash2 className="mr-1 h-3.5 w-3.5" />
                              删除
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {!state.loading && state.total > 0 ? (
              <div className="flex items-center justify-between border-t bg-secondary/10 px-6 py-4">
                <div className="text-sm text-muted-foreground">
                  共 <span className="font-medium text-foreground">{state.total}</span> 条
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">每页</span>
                    <Select
                      value={String(state.pageSize)}
                      onValueChange={(val) => handlers.handlePageSizeChange(Number(val))}
                    >
                      <SelectTrigger className="h-8 w-[110px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="50">50条/页</SelectItem>
                        <SelectItem value="100">100条/页</SelectItem>
                        <SelectItem value="200">200条/页</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={state.page <= 1}
                    onClick={() => handlers.handlePageChange(state.page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    {state.page} / {state.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={state.page >= state.totalPages}
                    onClick={() => handlers.handlePageChange(state.page + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </Card>
        </div>
      </section>

      <DeleteDialog state={state} handlers={handlers} />
    </div>
  )
}

function CustomerDetailPanel({ state, handlers }: Props) {
  const detail = state.detailData

  return (
    <div className="min-h-screen bg-background font-body">
      <section className="w-full border-b bg-card">
        <div className="container mx-auto px-8 py-6">
          <Button variant="ghost" className="mb-3 -ml-2 h-8 px-2" onClick={handlers.handleBackToList}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            返回客户列表
          </Button>
          <h1 className="text-2xl font-header font-bold tracking-tight">客户详情</h1>
          <p className="mt-1 text-sm text-muted-foreground">查看客户资料与未付款订单</p>
        </div>
      </section>

      <section className="container mx-auto space-y-6 px-8 py-8">
        {state.detailLoading ? (
          <Card className="border-none p-10 text-center shadow-sm">
            <RefreshCcw className="mx-auto mb-2 h-6 w-6 animate-spin text-primary" />
            加载中...
          </Card>
        ) : !detail ? (
          <Card className="border-none p-10 text-center shadow-sm text-muted-foreground">
            未找到该客户
          </Card>
        ) : (
          <>
            <Card className="border-none shadow-sm">
              <CardContent className="grid gap-4 p-6 md:grid-cols-3">
                <InfoItem label="姓名" value={detail.username} />
                <InfoItem label="WhatsApp号" value={detail.whatsapp || '--'} />
                <InfoItem label="邮箱" value={detail.email} />
                <InfoItem label="密码" value={detail.passwordPlain || '--'} />
                <InfoItem label="注册时间" value={handlers.formatDateTime(detail.createdAt)} />
                <InfoItem label="最近登录" value={handlers.formatDateTime(detail.lastLoginAt)} />
                <InfoItem label="购物车金额(美金)" value={handlers.formatUsd(detail.cartUsdTotal)} />
                <InfoItem label="状态" value={state.STATUS_LABELS[detail.status]} />
                <div className="md:col-span-3">
                  <div className="mb-1 text-xs text-muted-foreground">备注</div>
                  <div
                    className="rounded border border-dashed px-3 py-2 text-sm"
                    onDoubleClick={() => handlers.startNoteEdit(detail.id, detail.adminNote)}
                    title="双击编辑备注"
                  >
                    {state.noteEditingId === detail.id ? (
                      <Input
                        autoFocus
                        value={state.noteEditingValue}
                        disabled={state.noteSaving}
                        onChange={e => handlers.changeNoteEditingValue(e.target.value)}
                        onBlur={() => handlers.saveNoteEdit()}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handlers.saveNoteEdit()
                          if (e.key === 'Escape') handlers.cancelNoteEdit()
                        }}
                      />
                    ) : (
                      detail.adminNote || '双击添加备注'
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 md:col-span-3">
                  {detail.role === 'CUSTOMER' ? (
                    <Button
                      onClick={() => handlers.handleImpersonate(detail.id)}
                      disabled={state.impersonatingId === detail.id || detail.status !== 'ACTIVE'}
                    >
                      <LogIn className="mr-2 h-4 w-4" />
                      以客户身份登入
                    </Button>
                  ) : null}
                  <Button variant="outline" onClick={() => handlers.handleToggleStatus(detail.id, detail.status)}>
                    {detail.status === 'ACTIVE' ? '禁用客户' : '启用客户'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">未付款订单</h2>
                  <Badge variant="secondary">{detail.unpaidOrders.length} 笔待支付</Badge>
                </div>

                {detail.unpaidOrders.length === 0 ? (
                  <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
                    当前没有未付款订单
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>订单号</TableHead>
                          <TableHead>下单时间</TableHead>
                          <TableHead>商品快照</TableHead>
                          <TableHead>订单总额(美金)</TableHead>
                          <TableHead>付款状态</TableHead>
                          <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detail.unpaidOrders.map(order => (
                          <TableRow key={order.id}>
                            <TableCell className="font-mono text-sm" scrollX scrollXClassName="max-w-[220px]">
                              {order.orderNo}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm">
                              {handlers.formatDateTime(order.createdAt)}
                            </TableCell>
                            <TableCell className="max-w-[320px]">
                              <div className="truncate text-sm" title={order.productSnapshot}>
                                {order.productSnapshot}
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                {order.items.length} 个商品行
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold">
                              {handlers.formatUsd(order.totalAmountUsd)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{order.paymentStatusLabel}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8"
                                  onClick={() => handlers.handleCopyOrderNo(order.orderNo)}
                                >
                                  <Copy className="mr-1 h-3.5 w-3.5" />
                                  复制单号
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8"
                                  onClick={() => handlers.handleOpenOrder(order.id)}
                                >
                                  <ExternalLink className="mr-1 h-3.5 w-3.5" />
                                  查看/处理订单
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </section>

      <DeleteDialog state={state} handlers={handlers} />
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-1 text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium text-foreground">{value}</div>
    </div>
  )
}

function DeleteDialog({ state, handlers }: Props) {
  return (
    <AlertDialog open={state.deleteDialogOpen} onOpenChange={handlers.setDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除客户？</AlertDialogTitle>
          <AlertDialogDescription>
            将删除 {state.userToDelete?.username || state.userToDelete?.account}，此操作不可恢复。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={state.actionLoading}>取消</AlertDialogCancel>
          <AlertDialogAction disabled={state.actionLoading} onClick={handlers.handleConfirmDelete}>
            {state.actionLoading ? '删除中...' : '确认删除'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
