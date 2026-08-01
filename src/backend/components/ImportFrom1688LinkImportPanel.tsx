'use client'

import React from 'react'
import type { ImportFrom1688State, ImportFrom1688Handlers } from '@/backend/hooks/useImportFrom1688'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Info, Link2, RefreshCw } from 'lucide-react'
import type { ProductStatusType } from '@/backend/actions/ImportFrom1688'
import { CategoryCascadeSelect } from '@/backend/components/CategoryCascadeSelect'

const PRODUCT_STATUS_LABELS: Record<ProductStatusType, string> = {
  DRAFT: '待上传',
  ACTIVE: '上架',
  INACTIVE: '下架',
}

interface Props {
  state: ImportFrom1688State
  handlers: ImportFrom1688Handlers
}

/**
 * 1688 链接导入核心表单（从 ImportFrom1688 工作台原样抽出，供独立页与商品管理弹窗复用）
 */
export function ImportFrom1688LinkImportPanel({ state, handlers }: Props) {
  return (
    <Card className="shadow-sm border-border overflow-hidden" data-controller-name="1688链接导入任务表单">
      <CardHeader className="bg-secondary/50 border-b py-4">
        <CardTitle className="text-base font-header flex items-center gap-2">
          <Link2 className="w-4 h-4 text-primary" />
          1688 链接导入任务
        </CardTitle>
        <CardDescription>保留原有解析任务、失败重试、字段修正与确认导入能力。</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-1">
            1688 商品源链接
            <Info className="w-3 h-3 text-muted-foreground" />
          </label>
          <Textarea
            value={state.createForm.urls}
            onChange={(e) => handlers.handleCreateFormChange('urls', e.target.value)}
            placeholder="请输入 URL，支持多行批量粘贴"
            className="min-h-[120px] resize-none focus-visible:ring-primary"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">默认分类</label>
            <CategoryCascadeSelect
              options={state.categoryOptions}
              value={state.createForm.defaultCategoryId}
              onValueChange={(val) => handlers.handleCreateFormChange('defaultCategoryId', val)}
              placeholder="选择导入分类"
            />
            <p className="text-xs text-muted-foreground">
              建议必选。选择细分品类，系统将自动归属到对应一级大类。未设置时链接仍可解析，但发布会因缺少目标分类失败。
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">成本减法 (USD)</label>
            <Input
              type="number"
              value={state.createForm.costDeductionUsd}
              onChange={(e) =>
                handlers.handleCreateFormChange('costDeductionUsd', e.target.value === '' ? '' : Number(e.target.value))
              }
              placeholder="0"
              className="h-10"
            />
            <p className="text-xs text-muted-foreground">
              导入时会先从抓取原价中扣减这里的金额，再按目标分类系数自动生成售价。
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">默认导入状态</label>
            <Select
              value={state.createForm.defaultStatus}
              onValueChange={(val) => handlers.handleCreateFormChange('defaultStatus', val as ProductStatusType)}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRODUCT_STATUS_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val} className="rounded-none">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">默认库存数量</label>
            <Input
              type="number"
              value={state.createForm.stockStrategyStock}
              onChange={(e) =>
                handlers.handleCreateFormChange(
                  'stockStrategyStock',
                  e.target.value === '' ? '' : Number(e.target.value),
                )
              }
              placeholder="留空即不限库存"
              className="h-10"
            />
          </div>
        </div>

        {state.createFormCategoryWarning ? (
          <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>请先补充默认分类</AlertTitle>
            <AlertDescription>{state.createFormCategoryWarning}</AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <Info className="w-4 h-4" />
            <AlertTitle>链接格式说明</AlertTitle>
            <AlertDescription>
              像 https://detail.1688.com/offer/...html 这样的完整商品详情页链接可以继续使用。当前导入任务只校验链接以
              http 或 https 开头，不会因为是 detail.1688.com/offer 格式而被拦截。
            </AlertDescription>
          </Alert>
        )}

        {state.isSubmitting || state.isParsingTask ? (
          <Alert>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <AlertTitle>正在抓取解析</AlertTitle>
            <AlertDescription>
              系统正在解析 1688 链接，请稍候。解析成功后商品会自动出现在【待上传区】，状态为「草稿」。
            </AlertDescription>
          </Alert>
        ) : null}

        <Button
          className="w-full md:w-auto h-11 bg-primary hover:bg-primary text-primary-foreground font-semibold"
          onClick={handlers.handleCreateTask}
          disabled={state.isSubmitting || state.isParsingTask || !state.createForm.urls.trim()}
        >
          {state.isSubmitting || state.isParsingTask ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
          {state.isParsingTask ? '解析中…' : state.isSubmitting ? '创建任务中…' : '开始解析导入'}
        </Button>
      </CardContent>
    </Card>
  )
}

export default ImportFrom1688LinkImportPanel
