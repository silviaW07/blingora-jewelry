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

const PARSE_READY_STATUSES = new Set(['PENDING', 'RETRY_PENDING', 'RATE_LIMITED'])

interface Props {
  state: ImportFrom1688State
  handlers: ImportFrom1688Handlers
}

/**
 * 1688 链接导入核心表单（从 ImportFrom1688 工作台原样抽出，供独立页与商品管理弹窗复用）
 */
export function ImportFrom1688LinkImportPanel({ state, handlers }: Props) {
  const parseTargetId =
    state.pendingParseTaskId ||
    (state.currentTask && PARSE_READY_STATUSES.has(state.currentTask.task_status)
      ? state.currentTask.task_id
      : null)
  const canStartParse = Boolean(parseTargetId) && !state.isSubmitting && !state.isParsingTask

  return (
    <Card className="shadow-sm border-border overflow-hidden" data-controller-name="1688链接导入任务表单">
      <CardHeader className="bg-secondary/50 border-b py-4">
        <CardTitle className="text-base font-header flex items-center gap-2">
          <Link2 className="w-4 h-4 text-primary" />
          1688 链接导入任务
        </CardTitle>
        <CardDescription>
          粘贴 1688 / 拼多多 / Yupoo / 微购相册链接后先点提交，确认无误后再点开始解析。Yupoo 成本认页上 P 价，或标题货号前两位（如 131000920 → 成本 13）。加密店铺先填店铺密码。一款多色是一色一条 SKU，同色多图不另开。没标题时按分类词/主图补品牌和品类；蒂芙尼蓝/卡地亚红等看盒子色。微购列表会拆成多条动态。
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-1">
            商品 / 分类 / Yupoo / 微购相册链接
            <Info className="w-3 h-3 text-muted-foreground" />
          </label>
          <Textarea
            value={state.createForm.urls}
            onChange={(e) => handlers.handleCreateFormChange('urls', e.target.value)}
            placeholder={
              '商品详情：https://detail.1688.com/offer/数字.html\n' +
              '店铺分类/分页：https://shopXXXX.1688.com/page/offerlist.htm?beginPage=2\n' +
              'Yupoo 相册：https://店铺.x.yupoo.com/albums/数字\n' +
              'Yupoo 分类：https://店铺.x.yupoo.com/categories/数字\n' +
              '微购相册：https://www.szwego.com/static/index.html#/shop_detail/店铺ID\n' +
              '支持多行批量粘贴；分类、分页和微购店铺列表可直接解析'
            }
            className="min-h-[120px] resize-none focus-visible:ring-primary"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">微购 Cookie（解析相册时用，第一次必填）</label>
          <Textarea
            value={state.createForm.weishangCookie}
            onChange={(e) => handlers.handleCreateFormChange('weishangCookie', e.target.value)}
            placeholder="在电脑打开 www.szwego.com 扫码登录后，按 F12 → Network → 任意请求 → 复制 Cookie"
            className="min-h-[72px] resize-none focus-visible:ring-primary"
          />
          <p className="text-xs text-muted-foreground">
            只在导入微购/微商相册时需要。填一次会保存在服务器，之后同一台机可直接粘贴链接。
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Yupoo 店铺密码（加密主页必填）</label>
          <Input
            type="password"
            value={state.createForm.yupooPassword}
            onChange={(e) => handlers.handleCreateFormChange('yupooPassword', e.target.value)}
            placeholder="加密店铺的访问密码，填一次会保存在服务器"
            className="h-10"
          />
          <p className="text-xs text-muted-foreground">
            tyjp 这类加了主页密码的相册，服务器没有密码就只能停在加密页。填一次后同一台机可直接粘贴链接解析。
          </p>
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
              建议必选。选择细分品类，系统将自动归属到对应一级大类。未设置时链接仍可提交，但发布会因缺少目标分类失败。
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">供应商</label>
            <Input
              value={state.createForm.supplierName}
              onChange={(e) => handlers.handleCreateFormChange('supplierName', e.target.value)}
              placeholder="选填，填了则本批链接都用这个供应商"
              className="h-10"
            />
            <p className="text-xs text-muted-foreground">
              非必填。填写后本次提交的全部链接解析入库都会用这个供应商名称。
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
            <AlertTitle>推荐流程：粘贴链接 → 提交 → 开始解析</AlertTitle>
            <AlertDescription className="space-y-1">
              <p>
                商品详情、店铺分类页、Yupoo 相册、微购相册都可以直接粘贴。提交只创建任务，不会立刻抓取；确认后再点「开始解析」。
              </p>
              <p className="text-muted-foreground">
                若分类页抽不出商品，请更新 secrets/1688-cookie.txt 后重启 rpc。微购相册需登录：把 www.szwego.com 的 Cookie 保存到 secrets/szwego-cookie.txt 后重启 rpc。解析失败可点「重新解析」。
              </p>
            </AlertDescription>
          </Alert>
        )}

        {state.isSubmitting ? (
          <Alert>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <AlertTitle>正在提交链接</AlertTitle>
            <AlertDescription>正在创建导入任务，请稍候…</AlertDescription>
          </Alert>
        ) : null}

        {state.isParsingTask ? (
          <Alert>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <AlertTitle>正在解析</AlertTitle>
            <AlertDescription>
              系统正在抓取并解析商品（分类/分页会先抽成详情链接）。完成后会出现在【待上传区】。
            </AlertDescription>
          </Alert>
        ) : null}

        {state.pendingParseTaskId && !state.isParsingTask ? (
          <Alert>
            <Info className="w-4 h-4" />
            <AlertTitle>链接已提交，可开始解析</AlertTitle>
            <AlertDescription>
              任务 {state.pendingParseTaskId.slice(0, 8)}… 已创建。点「开始解析」即可，分类/分页会自动抽商品。
            </AlertDescription>
          </Alert>
        ) : null}

        {state.createTaskError ? (
          <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>提交失败</AlertTitle>
            <AlertDescription>{state.createTaskError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="button"
            className="h-11 bg-primary hover:bg-primary text-primary-foreground font-semibold"
            onClick={() => void handlers.handleCreateTask()}
            disabled={state.isSubmitting || !state.createForm.urls.trim()}
          >
            {state.isSubmitting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
            {state.isSubmitting ? '提交中…' : '提交链接'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 font-semibold"
            onClick={() => handlers.handleStartParseTask(parseTargetId || undefined)}
            disabled={!canStartParse}
          >
            {state.isParsingTask ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
            {state.isParsingTask ? '解析中…' : '开始解析'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default ImportFrom1688LinkImportPanel
