'use client'

import React from 'react';
import type { UserManagementState, UserManagementHandlers } from '@/backend/hooks/useUserManagement';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Search, 
  User, 
  Mail, 
  Shield, 
  Calendar, 
  ShoppingCart, 
  Activity, 
  Trash2, 
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  Info
} from 'lucide-react';

interface Props {
  state: UserManagementState;
  handlers: UserManagementHandlers;
}

export const UserManagementView = ({ state, handlers }: Props) => {
  return (
    <div className="min-h-screen bg-background font-body">
      {/* 页面头部区 */}
      <section className="border-b bg-card w-full" data-controller-name="页面主视图容器">
        <div className="container mx-auto px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-header font-bold tracking-tight text-foreground flex items-center gap-2">
                <User className="w-6 h-6 text-primary" />
                用户管理
              </h1>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                当前系统共检索到 <span className="font-semibold text-foreground">{state.total}</span> 名用户
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 检索与控制台面板 */}
      <section className="w-full bg-background border-b" data-controller-name="检索过滤面板">
        <div className="container mx-auto px-8 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[240px] max-w-sm">
              <Input
                className="h-9 px-3"
                placeholder="搜索账户名..."
                value={state.localFilters.account}
                onChange={(e) => handlers.handleTextChange('account', e.target.value)}
                onCompositionStart={handlers.handleCompositionStart}
                onCompositionEnd={() => handlers.handleCompositionEnd('account')}
              />
            </div>
            <div className="flex-1 min-w-[240px] max-w-sm">
              <Input
                className="h-9 px-3"
                placeholder="搜索邮箱地址..."
                value={state.localFilters.email}
                onChange={(e) => handlers.handleTextChange('email', e.target.value)}
                onCompositionStart={handlers.handleCompositionStart}
                onCompositionEnd={() => handlers.handleCompositionEnd('email')}
              />
            </div>
            <div className="w-[160px] flex-shrink-0">
              <Select value={state.urlParams.role || 'ALL'} onValueChange={(val) => handlers.handleSelectChange('role', val)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="所有角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">全部角色</SelectItem>
                  <SelectItem value="CUSTOMER">{state.ROLE_LABELS['CUSTOMER']}</SelectItem>
                  <SelectItem value="ADMIN">{state.ROLE_LABELS['ADMIN']}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[160px] flex-shrink-0">
              <Select value={state.urlParams.status || 'ALL'} onValueChange={(val) => handlers.handleSelectChange('status', val)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="所有状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">全部状态</SelectItem>
                  <SelectItem value="ACTIVE">{state.STATUS_LABELS['ACTIVE']}</SelectItem>
                  <SelectItem value="DISABLED">{state.STATUS_LABELS['DISABLED']}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="h-9 px-4 gap-2 hover:bg-secondary hover:text-secondary-foreground"
              onClick={handlers.handleResetFilters}
            >
              <RefreshCcw className="w-4 h-4" />
              重置条件
            </Button>
          </div>
        </div>
      </section>

      {/* 数据网格区 */}
      <section className="w-full" data-controller-name="数据网格容器">
        <div className="container mx-auto px-8 py-8">
          <Card className="border-none shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-secondary/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[200px] font-semibold text-xs uppercase tracking-wider">账户名</TableHead>
                    <TableHead className="w-[250px] font-semibold text-xs uppercase tracking-wider">邮箱</TableHead>
                    <TableHead className="w-[120px] font-semibold text-xs uppercase tracking-wider">角色</TableHead>
                    <TableHead className="w-[180px] font-semibold text-xs uppercase tracking-wider">注册时间</TableHead>
                    <TableHead className="w-[120px] font-semibold text-xs uppercase tracking-wider text-center">购物车项</TableHead>
                    <TableHead className="w-[120px] font-semibold text-xs uppercase tracking-wider">状态</TableHead>
                    <TableHead className="w-[200px] font-semibold text-xs uppercase tracking-wider text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <RefreshCcw className="w-6 h-6 animate-spin text-primary" />
                          <span>数据加载中...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : state.list.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Search className="w-6 h-6 opacity-20" />
                          <span>暂无符合条件的用户</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    state.list.map((user) => (
                      <TableRow key={user.id} className="group hover:bg-secondary/30 transition-colors">
                        <TableCell className="font-medium">{user.account}</TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'} className="font-normal">
                            {state.ROLE_LABELS[user.role]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm tabular-nums whitespace-nowrap">
                          {handlers.formatDateTime(user.createdAt)}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center bg-muted w-8 h-8 rounded-full text-xs font-semibold">
                            {user.cartItemCount}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${user.status === 'ACTIVE' ? 'bg-accent' : 'bg-muted-foreground/30'}`} />
                            <span className={user.status === 'ACTIVE' ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                              {state.STATUS_LABELS[user.status]}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 hover:bg-primary hover:text-primary-foreground"
                              onClick={() => handlers.handleOpenDetail(user.id)}
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              详情
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 hover:bg-secondary hover:text-secondary-foreground"
                              onClick={() => handlers.handleToggleStatus(user.id, user.status, 'list')}
                            >
                              {user.status === 'ACTIVE' ? '禁用' : '启用'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => handlers.handleRequestDelete(user)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* 分页控制台 */}
            {!state.loading && state.total > 0 && (
              <div className="px-6 py-4 border-t bg-secondary/10 flex items-center justify-between" data-controller-name="分页控制台">
                <div className="text-sm text-muted-foreground">
                  共 <span className="text-foreground font-medium">{state.total}</span> 条数据
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    第 <span className="text-foreground font-medium">{state.page}</span> / {state.totalPages} 页
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={state.page <= 1}
                      onClick={() => handlers.handlePageChange(state.page - 1)}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={state.page >= state.totalPages}
                      onClick={() => handlers.handlePageChange(state.page + 1)}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </section>

      {/* 用户详情侧边抽屉 */}
      <Sheet open={state.detailSheetOpen} onOpenChange={handlers.setDetailSheetOpen}>
        <SheetContent className="w-full sm:max-w-md md:max-w-lg overflow-y-auto border-l shadow-2xl">
          <SheetHeader className="pb-6 border-b">
            <SheetTitle className="text-xl font-header font-bold flex items-center gap-3">
              <User className="w-5 h-5 text-primary" />
              用户详情
              {state.detailData && (
                <Badge variant={state.detailData.status === 'ACTIVE' ? 'default' : 'outline'} className="ml-2 font-normal">
                   {state.STATUS_LABELS[state.detailData.status]}
                </Badge>
              )}
            </SheetTitle>
          </SheetHeader>

          {state.detailLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <RefreshCcw className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">正在获取用户数据...</p>
            </div>
          ) : state.detailData ? (
            <div className="space-y-8 py-6">
              {/* 基础信息 */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Info className="w-3.5 h-3.5" />
                  基础信息
                </h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-2 bg-secondary/20 p-4 rounded-lg border border-border/50">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">用户 ID</p>
                    <p className="text-sm font-medium tabular-nums truncate">{state.detailData.id}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">账户名</p>
                    <p className="text-sm font-medium">{state.detailData.account}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">邮箱地址</p>
                    <p className="text-sm font-medium truncate">{state.detailData.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">用户角色</p>
                    <p className="text-sm font-medium">{state.ROLE_LABELS[state.detailData.role]}</p>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <p className="text-xs text-muted-foreground">注册时间</p>
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      {handlers.formatDateTime(state.detailData.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* 安全与活动 */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5" />
                  安全与活动
                </h3>
                <div className="bg-secondary/20 p-4 rounded-lg border border-border/50">
                   <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">最近登录时间</p>
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                      {handlers.formatDateTime(state.detailData.lastLoginAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* 业务摘要 */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <ShoppingCart className="w-3.5 h-3.5" />
                  业务摘要
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-secondary/20 p-4 rounded-lg border border-border/50">
                   <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">购物车 ID</p>
                    <p className="text-sm font-medium truncate">{state.detailData.cartId || '暂无数据'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">商品总数</p>
                    <div className="flex items-center gap-2">
                       <span className="text-lg font-bold text-primary">{state.detailData.cartItemCount}</span>
                       <span className="text-xs text-muted-foreground">Items</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 状态管理 */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">账户状态管理</h3>
                <Card className="border-destructive/20 bg-destructive/5">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-foreground">
                        {state.detailData.status === 'ACTIVE' ? '当前账户已启用' : '当前账户已禁用'}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed pr-8">
                        禁用后用户将无法登录系统，且购物车功能将被锁定。
                      </p>
                    </div>
                    <Switch
                      className="data-[state=checked]:bg-accent"
                      checked={state.detailData.status === 'ACTIVE'}
                      onCheckedChange={() => handlers.handleToggleStatus(state.detailData!.id, state.detailData!.status, 'detail')}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
               <Info className="w-10 h-10 mb-2 opacity-20" />
               <p>未找到用户详细数据</p>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* 风险操作确认弹窗 */}
      <AlertDialog open={state.deleteDialogOpen} onOpenChange={handlers.setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[440px]">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl font-bold">确认删除用户？</AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed space-y-3">
              <p>
                正在执行永久删除操作。目标账户：
                <span className="block mt-1 font-semibold text-foreground bg-secondary px-2 py-1 rounded">
                  {state.userToDelete?.account} ({state.userToDelete?.email})
                </span>
              </p>
              <div className="bg-destructive/5 border border-destructive/20 p-3 rounded-md text-destructive flex gap-2">
                <Info className="w-4 h-4 shrink-0" />
                <p className="text-xs font-medium">
                  警告：此操作将永久移除该账户及其关联的所有购物车数据，且不可撤销。请确保您已核实该操作的必要性。
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel disabled={state.actionLoading} className="h-10">
              取消
            </AlertDialogCancel>
            <AlertDialogAction 
              disabled={state.actionLoading} 
              onClick={handlers.handleConfirmDelete}
              className="h-10 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {state.actionLoading ? '正在删除...' : '确认永久删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
