'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  clearSalesStatsLedger,
  getSalesStatsDetail,
  importSalesStatsImage,
  importSalesStatsSheet,
  type SalesStatsDetail,
} from '@/backend/actions/SalesStats'
import { Dashboard } from '@/backend/route-params'

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

export function useSalesStats() {
  const router = useRouter()
  const [detail, setDetail] = useState<SalesStatsDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)

  const reload = async () => {
    setLoading(true)
    try {
      const next = await getSalesStatsDetail()
      setDetail(next)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '销售额统计加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  const importSheet = async (file: File) => {
    setImporting(true)
    try {
      const fileBase64 = await fileToBase64(file)
      const next = await importSalesStatsSheet({ fileBase64, fileName: file.name, mode: 'replace' })
      setDetail(next)
      toast.success(`已导入 ${next.orders.length} 笔销售记录`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '表格导入失败')
    } finally {
      setImporting(false)
    }
  }

  const importImage = async (file: File) => {
    setImporting(true)
    try {
      const fileBase64 = await fileToBase64(file)
      const next = await importSalesStatsImage({ fileBase64, fileName: file.name, mode: 'replace' })
      setDetail(next)
      toast.success(`已识别 ${next.orders.length} 笔销售记录`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '图片识别失败')
    } finally {
      setImporting(false)
    }
  }

  const clearLedger = async () => {
    if (!window.confirm('确认清空当前销售额统计数据？')) return
    setImporting(true)
    try {
      const next = await clearSalesStatsLedger()
      setDetail(next)
      toast.success('已清空')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '清空失败')
    } finally {
      setImporting(false)
    }
  }

  return {
    state: { detail, loading, importing },
    handlers: {
      handleBack: () => Dashboard.navigateTo(router),
      importSheet,
      importImage,
      clearLedger,
      reload,
    },
  }
}
