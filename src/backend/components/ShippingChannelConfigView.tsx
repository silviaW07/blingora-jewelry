'use client'

import React from 'react'
import type {
  ShippingChannelConfigHandlers,
  ShippingChannelConfigState,
} from '@/backend/hooks/useShippingChannelConfig'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Search, RotateCcw, Trash2, Edit2, ChevronRight } from 'lucide-react'
import {
  SHIPPING_BILLING_MODE_LABELS,
  summarizeCountryRule,
  type ShippingBillingMode,
} from '@/shared/shippingFeeCalc'

interface Props {
  state: ShippingChannelConfigState
  handlers: ShippingChannelConfigHandlers
}

export function ShippingChannelConfigView({ state, handlers }: Props) {
  const billingMode = state.formData?.channel_billingMode || 'EXPRESS_TIER'

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <section className="border-b border-border bg-white">
        <div className="container mx-auto px-8 py-4">
          <nav className="mb-2 flex items-center text-sm font-medium text-muted-foreground">
            <span>首页</span>
            <ChevronRight className="mx-1 h-4 w-4" />
            <span>站点设置</span>
            <ChevronRight className="mx-1 h-4 w-4" />
            <span className="text-foreground">物流渠道配置</span>
          </nav>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="font-header text-2xl font-bold tracking-tight">物流渠道配置</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                配置快递阶梯价、海运阶梯价或海运按公斤（人民币 ¥），支持渠道系数。前台结账按购物车重量自动计费。
              </p>
            </div>
            <Button size="sm" onClick={handlers.openCreateModal}>
              <Plus className="mr-2 h-4 w-4" />
              新增物流渠道
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-background">
        <div className="container mx-auto px-8 py-6">
          <Card className="border-border shadow-xs">
            <CardContent className="flex flex-wrap items-center gap-4 p-4">
              <Input
                className="h-9 w-64"
                placeholder="搜索渠道名称"
                value={state.inputKeyword}
                onChange={(e) => handlers.setInputKeyword(e.target.value)}
              />
              <Select
                value={state.filterStatus}
                onValueChange={(val) => handlers.setFilterStatus(val as typeof state.filterStatus)}
              >
                <SelectTrigger className="h-9 w-40">
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(state.STATUS_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={handlers.handleSearch}>
                <Search className="mr-2 h-4 w-4" />
                查询
              </Button>
              <Button size="sm" variant="outline" onClick={handlers.handleReset}>
                <RotateCcw className="mr-2 h-4 w-4" />
                重置
              </Button>
              <span className="ml-auto text-sm text-muted-foreground">共 {state.total} 条</span>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="bg-background pb-12">
        <div className="container mx-auto px-8">
          <Card className="overflow-hidden border-border shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-secondary/50">
                  <TableRow>
                    <TableHead className="min-w-[140px]">渠道名称</TableHead>
                    <TableHead className="min-w-[120px]">计费模式</TableHead>
                    <TableHead className="min-w-[140px]">预计时间</TableHead>
                    <TableHead className="w-[90px]">系数</TableHead>
                    <TableHead className="min-w-[320px]">国家运费（¥）</TableHead>
                    <TableHead className="w-[100px]">排序</TableHead>
                    <TableHead className="w-[120px]">启用</TableHead>
                    <TableHead className="w-[160px]">更新时间</TableHead>
                    <TableHead className="w-[140px] text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-48 text-center text-muted-foreground">
                        加载中...
                      </TableCell>
                    </TableRow>
                  ) : state.list.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-48 text-center text-muted-foreground">
                        暂无物流渠道，请先新增
                      </TableCell>
                    </TableRow>
                  ) : (
                    state.list.map((item) => {
                      const feeEntries = Object.entries(item.channel_countryFees)
                        .map(([country, rule]) => ({
                          country,
                          summary: summarizeCountryRule(item.channel_billingMode, rule),
                        }))
                        .filter((row) => row.summary)
                      return (
                        <TableRow key={item.channel_id}>
                          <TableCell className="font-medium">{item.channel_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {SHIPPING_BILLING_MODE_LABELS[item.channel_billingMode] || item.channel_billingMode}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.channel_estimatedTime}</TableCell>
                          <TableCell>{item.channel_coefficient.toFixed(2)}</TableCell>
                          <TableCell>
                            <div className="flex max-w-[420px] flex-wrap gap-1.5">
                              {feeEntries.length === 0 ? (
                                <span className="text-sm text-muted-foreground">未配置运费</span>
                              ) : (
                                feeEntries.slice(0, 4).map(({ country, summary }) => (
                                  <Badge key={country} variant="secondary" className="font-normal">
                                    {country}: {summary}
                                  </Badge>
                                ))
                              )}
                              {feeEntries.length > 4 ? (
                                <Badge variant="outline">+{feeEntries.length - 4}</Badge>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>{item.channel_sortWeight}</TableCell>
                          <TableCell>
                            <Switch
                              checked={item.channel_isEnabled}
                              onCheckedChange={(checked) =>
                                handlers.handleQuickUpdateStatus(item.channel_id, !!checked)
                              }
                            />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(item.channel_updatedAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handlers.openEditModal(item)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handlers.handleDelete(item.channel_id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
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
          </Card>
        </div>
      </section>

      <Dialog open={!!state.formMode} onOpenChange={(open) => !open && handlers.closeFormModal()}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{state.formMode === 'EDIT' ? '编辑物流渠道' : '新增物流渠道'}</DialogTitle>
          </DialogHeader>

          {state.formData ? (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">渠道名称</label>
                  <Input
                    value={state.formData.channel_name}
                    placeholder="如 USPS / UPS / 海运专线"
                    onChange={(e) => handlers.setFormField('channel_name', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">预计时间</label>
                  <Input
                    value={state.formData.channel_estimatedTime}
                    placeholder="如 3-5 business days"
                    onChange={(e) => handlers.setFormField('channel_estimatedTime', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">计费模式</label>
                  <Select
                    value={billingMode}
                    onValueChange={(val) => handlers.setBillingMode(val as ShippingBillingMode)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EXPRESS_TIER">快递阶梯价</SelectItem>
                      <SelectItem value="SEA_TIER">海运阶梯价</SelectItem>
                      <SelectItem value="SEA_PER_KG">海运按公斤</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">渠道系数</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={state.formData.channel_coefficient}
                    onChange={(e) =>
                      handlers.setFormField('channel_coefficient', Number(e.target.value) || 1)
                    }
                  />
                  <p className="text-xs text-muted-foreground">最终运费 = 基础运费 × 渠道系数（默认 1.00）</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">排序权重</label>
                  <Input
                    type="number"
                    value={state.formData.channel_sortWeight}
                    onChange={(e) =>
                      handlers.setFormField('channel_sortWeight', Number(e.target.value) || 0)
                    }
                  />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch
                    checked={state.formData.channel_isEnabled}
                    onCheckedChange={(checked) =>
                      handlers.setFormField('channel_isEnabled', !!checked)
                    }
                  />
                  <span className="text-sm font-medium">启用该渠道</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">按国家设置运费（单位：人民币 ¥）</label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {billingMode === 'EXPRESS_TIER'
                      ? '快递阶梯价：按重量匹配下一档（≤maxKg），取对应固定运费。关闭开关表示该国家不可用。'
                      : billingMode === 'SEA_TIER'
                        ? '海运阶梯价：按重量落入的档位收取固定运费（例如 ≤12kg / ≤21kg / ≤30kg）。关闭开关表示该国家不可用。'
                        : '海运按公斤：重量 ≤ 起重重量取起重运费；超出部分按续重单价加收。关闭开关表示该国家不可用。'}
                  </p>
                </div>

                <div className="space-y-3">
                  {state.countries.map((country) => {
                    const rule = state.formData?.channel_countryFees?.[country] ?? null
                    const enabled = rule != null
                    return (
                      <div
                        key={country}
                        className="rounded-lg border border-border bg-secondary/20 p-3"
                      >
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="text-sm font-medium">{country}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {enabled ? '已启用' : '不可用'}
                            </span>
                            <Switch
                              checked={enabled}
                              onCheckedChange={(checked) =>
                                handlers.setCountryEnabled(country, !!checked)
                              }
                            />
                          </div>
                        </div>

                        {!enabled ? (
                          <p className="text-xs text-muted-foreground">该国家暂不提供此渠道</p>
                        ) : (billingMode === 'EXPRESS_TIER' || billingMode === 'SEA_TIER') && rule && 'tiers' in rule ? (
                          <div className="space-y-2">
                            {rule.tiers.map((tier, index) => (
                              <div
                                key={`${country}-tier-${index}`}
                                className="flex flex-wrap items-center gap-2"
                              >
                                <span className="text-xs text-muted-foreground">≤</span>
                                <Input
                                  className="h-8 w-24"
                                  type="number"
                                  step="0.001"
                                  min="0"
                                  value={String(tier.maxKg)}
                                  onChange={(e) =>
                                    handlers.updateExpressTier(
                                      country,
                                      index,
                                      'maxKg',
                                      e.target.value,
                                    )
                                  }
                                />
                                <span className="text-xs text-muted-foreground">kg</span>
                                <Input
                                  className="h-8 w-28"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={String(tier.fee)}
                                  onChange={(e) =>
                                    handlers.updateExpressTier(country, index, 'fee', e.target.value)
                                  }
                                />
                                <span className="text-xs text-muted-foreground">¥</span>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  disabled={rule.tiers.length <= 1}
                                  onClick={() => handlers.removeExpressTier(country, index)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handlers.addExpressTier(country)}
                            >
                              <Plus className="mr-1 h-3.5 w-3.5" />
                              添加阶梯
                            </Button>
                          </div>
                        ) : billingMode === 'SEA_PER_KG' && rule && 'baseFee' in rule ? (
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">起重重量 (kg)</label>
                              <Input
                                className="h-8"
                                type="number"
                                step="0.001"
                                min="0"
                                value={String(rule.baseKg)}
                                onChange={(e) =>
                                  handlers.updateSeaField(country, 'baseKg', e.target.value)
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">起重运费 (¥)</label>
                              <Input
                                className="h-8"
                                type="number"
                                step="0.01"
                                min="0"
                                value={String(rule.baseFee)}
                                onChange={(e) =>
                                  handlers.updateSeaField(country, 'baseFee', e.target.value)
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">续重单价 (¥/kg)</label>
                              <Input
                                className="h-8"
                                type="number"
                                step="0.01"
                                min="0"
                                value={String(rule.perKgFee)}
                                onChange={(e) =>
                                  handlers.updateSeaField(country, 'perKgFee', e.target.value)
                                }
                              />
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={handlers.closeFormModal} disabled={state.submitting}>
              取消
            </Button>
            <Button onClick={handlers.handleSubmit} disabled={state.submitting}>
              {state.submitting ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ShippingChannelConfigView
