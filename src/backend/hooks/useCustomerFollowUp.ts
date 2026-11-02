
'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  addFollowPhones,
  updateFollowPhone,
  getWeeklyHotWhatsappMessage,
  getCustomerFollowLogs,
  getFollowUpBoard,
  setFollowStatus,
  updateTagFollowIntervals,
  type FollowLog,
  type FollowStatus,
  type FollowTagInterval,
  type RegisteredFollowCustomer,
} from '@/backend/actions/CustomerFollowUp'

export function useCustomerFollowUp() {
  const [tags, setTags] = useState<FollowTagInterval[]>([])
  const [due, setDue] = useState<RegisteredFollowCustomer[]>([])
  const [all, setAll] = useState<RegisteredFollowCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [active, setActive] = useState<RegisteredFollowCustomer | null>(null)
  const [followedAt, setFollowedAt] = useState<string | null>(null)
  const [logs, setLogs] = useState<FollowLog[]>([])

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getFollowUpBoard()
      if (!res) return
      setTags(res.tags)
      setDue(res.due)
      setAll(res.all)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '客户列表加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const changeStatus = useCallback(async (customer: RegisteredFollowCustomer, status: FollowStatus) => {
    const res = await setFollowStatus({ id: customer.id, kind: customer.kind, status })
    if (!res) return
    const nextRow: RegisteredFollowCustomer = {
      ...customer,
      followStatus: res.followStatus,
      lastFollowedAt: status === 'FOLLOWED' ? res.followedAt : customer.lastFollowedAt,
      nextFollowAt: res.nextFollowAt,
    }
    const same = (row: RegisteredFollowCustomer) => row.id === customer.id && row.kind === customer.kind
    setAll((rows) => rows.map((row) => (same(row) ? nextRow : row)))
    setDue((rows) => {
      const rest = rows.filter((row) => !same(row))
      return status === 'DUE' ? [nextRow, ...rest] : rest
    })
    if (status === 'FOLLOWED') {
      setFollowedAt(res.followedAt)
      setActive(nextRow)
    }
  }, [])

  const openNext = useCallback(async () => {
    const next = due[0]
    if (!next) {
      toast.message('今天没有待跟进客户')
      return
    }
    await changeStatus(next, 'FOLLOWED')
  }, [due, changeStatus])

  const saveIntervals = useCallback(async (input: FollowTagInterval[]) => {
    setSaving(true)
    const res = await updateTagFollowIntervals(input.map((item) => ({ code: item.code, intervalDays: item.intervalDays })))
    setSaving(false)
    if (!res) return
    setTags(res)
    toast.success('已按客户类型保存跟进频次')
    await reload()
  }, [reload])

  const showLogs = useCallback(async (customer: RegisteredFollowCustomer) => {
    setActive(customer)
    setFollowedAt(customer.lastFollowedAt)
    const res = await getCustomerFollowLogs({ id: customer.id, kind: customer.kind })
    setLogs(res || [])
  }, [])

  const addPhones = useCallback(async (raw: string) => {
    setSaving(true)
    try {
      const res = await addFollowPhones(raw)
      if (!res) return
      toast.success(`已添加 ${res.added} 个，跳过 ${res.skipped} 个重复号码`)
      await reload()
    } finally {
      setSaving(false)
    }
  }, [reload])

  const savePhone = useCallback(async (customer: RegisteredFollowCustomer, phone: string) => {
    const res = await updateFollowPhone({ id: customer.id, kind: customer.kind, phone })
    if (!res) return
    const nextRow = { ...customer, phone: res.phone }
    const same = (row: RegisteredFollowCustomer) => row.id === customer.id && row.kind === customer.kind
    setAll((rows) => rows.map((row) => (same(row) ? { ...row, phone: res.phone } : row)))
    setDue((rows) => rows.map((row) => (same(row) ? { ...row, phone: res.phone } : row)))
    setActive((row) => (row && same(row) ? { ...row, phone: res.phone } : row))
    toast.success(res.phone ? "已保存手机号" : "已清空手机号")
    return nextRow
  }, [])

  const sendWeeklyPicks = useCallback(async (customer: RegisteredFollowCustomer) => {
    let digits = String(customer.phone || "").replace(/\D/g, "")
    if (digits.length < 6) {
      toast.error("这个客户没有手机号")
      return
    }
    if (!digits.startsWith("1")) digits = `1${digits}`
    const draft = await getWeeklyHotWhatsappMessage()
    if (!draft?.count) {
      toast.error("还没有可发送的推荐")
      return
    }
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(draft.text)}`, "_blank", "noopener,noreferrer")
    toast.success(`已打开 WhatsApp，本周推荐 ${draft.count} 个类目热销`)
    await changeStatus(customer, "FOLLOWED")
  }, [changeStatus])

  return { tags, due, all, loading, saving, active, followedAt, logs, reload, changeStatus, openNext, saveIntervals, showLogs, addPhones, savePhone, sendWeeklyPicks }
}
