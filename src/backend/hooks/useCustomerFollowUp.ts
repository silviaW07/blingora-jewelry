
'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  createFollowCustomer,
  getCustomerFollowLogs,
  getFollowUpBoard,
  markCustomerFollowed,
  updateFollowCustomer,
  type FollowCustomer,
  type FollowLog,
} from '@/backend/actions/CustomerFollowUp'

export function useCustomerFollowUp() {
  const [due, setDue] = useState<FollowCustomer[]>([])
  const [all, setAll] = useState<FollowCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [followedAt, setFollowedAt] = useState<string | null>(null)
  const [logs, setLogs] = useState<FollowLog[]>([])
  const [saving, setSaving] = useState(false)

  const reload = useCallback(async () => {
    const board = await getFollowUpBoard()
    setDue(board.due)
    setAll(board.all)
  }, [])

  useEffect(() => {
    reload().catch((error: Error) => toast.error(error.message || '加载失败')).finally(() => setLoading(false))
  }, [reload])

  const openCustomer = async (id: string) => {
    setSaving(true)
    try {
      const result = await markCustomerFollowed({ id })
      setActiveId(id)
      setFollowedAt(result.followedAt)
      setLogs(result.logs)
      await reload()
    } catch (error: any) {
      toast.error(error.message || '记录跟进失败')
    } finally {
      setSaving(false)
    }
  }

  const openNext = async () => {
    const next = due[0]
    if (!next) {
      toast.message('今天没有待跟进客户')
      return
    }
    await openCustomer(next.id)
  }

  const addCustomer = async (input: { name: string; whatsapp: string; note: string; intervalDays: number }) => {
    setSaving(true)
    try {
      await createFollowCustomer(input)
      toast.success('已添加，今天即可跟进')
      await reload()
    } catch (error: any) {
      toast.error(error.message || '添加失败')
    } finally {
      setSaving(false)
    }
  }

  const saveCustomer = async (input: { id: string; name: string; whatsapp: string; note: string; intervalDays: number }) => {
    setSaving(true)
    try {
      await updateFollowCustomer(input)
      toast.success('客户信息已保存')
      await reload()
    } catch (error: any) {
      toast.error(error.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const showLogs = async (id: string) => {
    setActiveId(id)
    setFollowedAt(null)
    try {
      setLogs(await getCustomerFollowLogs(id))
    } catch (error: any) {
      toast.error(error.message || '读取记录失败')
    }
  }

  const active = all.find((row) => row.id === activeId) || null

  return {
    state: { due, all, loading, active, followedAt, logs, saving },
    handlers: { reload, openCustomer, openNext, addCustomer, saveCustomer, showLogs },
  }
}
