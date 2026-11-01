
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { FollowCustomer } from '@/backend/actions/CustomerFollowUp'
import type { useCustomerFollowUp } from '@/backend/hooks/useCustomerFollowUp'

function formatWhen(iso: string | null) {
  if (!iso) return '还没有跟进'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '还没有跟进'
  return date.toLocaleString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' })
}

function CustomerForm({
  initial,
  saving,
  submitLabel,
  onSubmit,
}: {
  initial?: Partial<FollowCustomer>
  saving: boolean
  submitLabel: string
  onSubmit: (input: { name: string; whatsapp: string; note: string; intervalDays: number }) => Promise<void>
}) {
  const [name, setName] = useState(initial?.name || '')
  const [whatsapp, setWhatsapp] = useState(initial?.whatsapp || '')
  const [note, setNote] = useState(initial?.note || '')
  const [intervalDays, setIntervalDays] = useState(String(initial?.intervalDays || 7))
  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        void onSubmit({ name, whatsapp, note, intervalDays: Number(intervalDays) || 7 })
      }}
    >
      <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="客户名称" aria-label="客户名称" />
      <Input value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} placeholder="WhatsApp" aria-label="WhatsApp" />
      <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="客户信息，例如要看的新品、上次说的价" rows={3} />
      <label className="flex items-center gap-2 text-sm text-slate-600">
        跟进间隔
        <Input className="h-9 w-20" type="number" min={1} max={365} value={intervalDays} onChange={(event) => setIntervalDays(event.target.value)} aria-label="跟进间隔天数" />
        天
      </label>
      <Button type="submit" disabled={saving}>{submitLabel}</Button>
    </form>
  )
}

export default function CustomerFollowUpView({
  state,
  handlers,
}: ReturnType<typeof useCustomerFollowUp>) {
  const [editing, setEditing] = useState<FollowCustomer | null>(null)
  return (
    <div className="mx-auto grid max-w-6xl gap-6 p-4 lg:grid-cols-[320px_1fr] lg:p-6">
      <section className="space-y-4">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm font-semibold text-slate-900">添加客户</div>
          <div className="mt-3">
            <CustomerForm saving={state.saving} submitLabel="添加" onSubmit={handlers.addCustomer} />
          </div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-semibold text-slate-900">今日待跟进 {state.due.length}</div>
            <Button type="button" size="sm" onClick={() => void handlers.openNext()} disabled={state.saving || state.due.length === 0}>下一位</Button>
          </div>
          <div className="mt-3 space-y-2">
            {state.loading ? <div className="text-sm text-slate-500">加载中...</div> : null}
            {!state.loading && state.due.length === 0 ? <div className="text-sm text-slate-500">今天没有待跟进</div> : null}
            {state.due.map((row) => (
              <button key={row.id} type="button" className="w-full rounded-lg border px-3 py-2 text-left hover:bg-slate-50" onClick={() => void handlers.openCustomer(row.id)}>
                <div className="text-sm font-medium text-slate-900">{row.name}</div>
                <div className="text-xs text-slate-500">{row.whatsapp || '无号码'} · 每 {row.intervalDays} 天</div>
              </button>
            ))}
          </div>
        </div>
      </section>
      <section className="space-y-4">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-slate-500">本次跟进时间</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">{formatWhen(state.followedAt)}</div>
          {state.active ? (
            <div className="mt-3 text-sm text-slate-700">
              <div>{state.active.name}{state.active.whatsapp ? ` · ${state.active.whatsapp}` : ''}</div>
              <div className="mt-1 text-slate-500">下次跟进 {formatWhen(state.active.nextFollowAt)} · 间隔 {state.active.intervalDays} 天</div>
              {state.active.note ? <div className="mt-2 whitespace-pre-wrap">{state.active.note}</div> : null}
            </div>
          ) : <div className="mt-2 text-sm text-slate-500">从今日待跟进里点一位客户，会自动记下现在的时间。</div>}
          {state.logs.length > 0 ? (
            <div className="mt-4 space-y-1 border-t pt-3 text-sm text-slate-600">
              {state.logs.map((log) => <div key={log.id}>{formatWhen(log.followedAt)}</div>)}
            </div>
          ) : null}
        </div>
        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="border-b px-4 py-3 text-sm font-semibold">全部客户</div>
          <div className="divide-y">
            {state.all.map((row) => (
              <div key={row.id} className="grid gap-2 px-4 py-3 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <div className="text-sm font-medium">{row.name}</div>
                  <div className="text-xs text-slate-500">{row.whatsapp || '无号码'} · 上次 {formatWhen(row.lastFollowedAt)} · 下次 {formatWhen(row.nextFollowAt)}</div>
                </div>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => void handlers.showLogs(row.id)}>记录</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setEditing(row)}>编辑</Button>
                  <Button type="button" size="sm" onClick={() => void handlers.openCustomer(row.id)}>跟进</Button>
                </div>
              </div>
            ))}
            {!state.loading && state.all.length === 0 ? <div className="px-4 py-8 text-sm text-slate-500">还没有客户，先在左边添加。</div> : null}
          </div>
        </div>
        {editing ? (
          <div className="rounded-xl border bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold">编辑 {editing.name}</div>
              <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(null)}>关闭</Button>
            </div>
            <CustomerForm
              key={editing.id}
              initial={editing}
              saving={state.saving}
              submitLabel="保存"
              onSubmit={async (input) => {
                await handlers.saveCustomer({ id: editing.id, ...input })
                setEditing(null)
              }}
            />
          </div>
        ) : null}
      </section>
    </div>
  )
}
