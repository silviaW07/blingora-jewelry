'use client'

import React from 'react'
import type {
  ImportFromPinduoduoHandlers,
  ImportFromPinduoduoState,
} from '@/backend/hooks/useImportFromPinduoduo'
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
  state: ImportFromPinduoduoState
  handlers: ImportFromPinduoduoHandlers
}

export function ImportFromPinduoduoLinkImportPanel({ state, handlers }: Props) {
  return (
    <Card className="shadow-sm border-border overflow-hidden">
      <CardHeader className="bg-secondary/50 border-b py-4">
        <CardTitle className="text-base font-header flex items-center gap-2">
          <Link2 className="w-4 h-4 text-primary" />
          拼多多链接导入任务
        </CardTitle>
        <CardDescription>
          独立于 1688 采集：粘贴拼多多商品链接后解析进入待上传区，互不抢占同一解析队列状态。
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-1">
            拼多多商品源链接
            <Info className="w-3 h-3 text-muted-foreground" />
          </label>
          <Textarea
            value={state.createForm.urls}
            onChange={(e) => handlers.handleCreateFormChange('urls', e.target.value)}
            placeholder="请输入 URL，支持多行批量粘贴（需含 goods_id）"
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
              建议必选。未设置时仍可解析，但发布可能因缺少目标分类失败。
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">加价百分比 (%)</label>
            <Input
              type="number"
              value={state.createForm.markupRate}
              onChange={(e) =>
                handlers.handleCreateFormChange(
                  'markupRate',
                  e.target.value === '' ? '' : Number(e.target.value),
                )
              }
              placeholder="20"
              className="h-10"
            />
            <p className="text-xs text-muted-foreground">
              售价 = 拼多多采集价 × (1 + 加价%)，例如 20 表示加价 20%。
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
              支持 mobile.yangkeduo.com / pinduoduo.com 商品详情页，链接中需包含 goods_id。与 1688
              采集任务相互独立，可并行使用。
            </AlertDescription>
          </Alert>
        )}

        {state.isSubmitting || state.isParsingTask ? (
          <Alert>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <AlertTitle>正在抓取解析</AlertTitle>
            <AlertDescription>
              系统正在解析拼多多链接，请稍候。解析成功后商品会自动出现在【待上传区】。
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

export default ImportFromPinduoduoLinkImportPanel
