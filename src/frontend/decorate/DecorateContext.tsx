'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { DecoratePatch, DecorateStore } from './types'
import { DECORATE_QUERY } from './types'
import { readDecorateStore, writeDecorateStore } from './storage'
import { DecorateTopBar } from './DecorateTopBar'
import { DecorateToolbar } from './DecorateToolbar'
import { DecorateCustomerServicePanel } from './DecorateCustomerServicePanel'
import {
  DEFAULT_CUSTOMER_SERVICE_CONFIG,
  normalizeCustomerServiceConfig,
  readCustomerServiceLocal,
  writeCustomerServiceLocal,
  type CustomerServiceConfig,
} from './customerService'
import {
  saveCustomerServiceConfig,
} from '@/frontend/actions/CustomerService'
import { loadCustomerServiceConfigCached } from '@/frontend/utils/customerServiceConfigCache'
import {
  getPageDecorateConfig,
  savePageDecorateConfig,
} from '@/frontend/actions/PageDecorate'

type DecorateContextValue = {
  isDecorateMode: boolean
  selectedKey: string | null
  draft: DecorateStore
  customerService: CustomerServiceConfig
  /** 悬浮图标自由拖拽定位模式（仅装修态） */
  isFloatDragMode: boolean
  /** 正在把客服配置写入后台 */
  isSavingCustomerService: boolean
  select: (propKey: string | null) => void
  getPatch: (propKey: string) => DecoratePatch | undefined
  updatePatch: (propKey: string, patch: Partial<DecoratePatch>) => void
  deletePatch: (propKey: string) => void
  restorePatch: (propKey: string) => void
  updateCustomerService: (patch: Partial<CustomerServiceConfig>) => void
  /** 合并补丁后立即写入 localStorage + 后台 sitesetting */
  persistCustomerService: (patch?: Partial<CustomerServiceConfig>) => Promise<CustomerServiceConfig | null>
  setFloatDragMode: (enabled: boolean) => void
  publishAndExit: () => void
  exitWithoutPublish: () => void
}

const DecorateContext = createContext<DecorateContextValue | null>(null)

export function useDecorateMode() {
  const ctx = useContext(DecorateContext)
  return (
    ctx || {
      isDecorateMode: false,
      selectedKey: null,
      draft: {},
      customerService: { ...DEFAULT_CUSTOMER_SERVICE_CONFIG },
      isFloatDragMode: false,
      isSavingCustomerService: false,
      select: () => undefined,
      getPatch: () => undefined,
      updatePatch: () => undefined,
      deletePatch: () => undefined,
      restorePatch: () => undefined,
      updateCustomerService: () => undefined,
      persistCustomerService: async () => null,
      setFloatDragMode: () => undefined,
      publishAndExit: () => undefined,
      exitWithoutPublish: () => undefined,
    }
  )
}

export function DecorateModeProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isDecorateMode, setIsDecorateMode] = useState(false)

  const [draft, setDraft] = useState<DecorateStore>({})
  const [customerService, setCustomerService] = useState<CustomerServiceConfig>(() =>
    readCustomerServiceLocal(),
  )
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [isFloatDragMode, setIsFloatDragMode] = useState(false)
  const [isSavingCustomerService, setIsSavingCustomerService] = useState(false)
  const customerServiceRef = React.useRef(customerService)
  customerServiceRef.current = customerService

  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsDecorateMode(new URLSearchParams(window.location.search).get(DECORATE_QUERY) === '1')
  }, [pathname])

  useEffect(() => {
    setDraft(readDecorateStore())
    setCustomerService(readCustomerServiceLocal())
    setHydrated(true)

    getPageDecorateConfig()
      .then((res) => {
        if (!res.persisted) return
        setDraft(res.store)
        writeDecorateStore(res.store)
      })
      .catch(() => undefined)

    loadCustomerServiceConfigCached()
      .then((res) => {
        if (!res.persisted) return
        setCustomerService(res.config)
        writeCustomerServiceLocal(res.config)
      })
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    if (!isDecorateMode) {
      setSelectedKey(null)
      setIsFloatDragMode(false)
      return
    }
    setDraft(readDecorateStore())
    getPageDecorateConfig()
      .then((res) => {
        if (!res.persisted) return
        setDraft(res.store)
        writeDecorateStore(res.store)
      })
      .catch(() => undefined)
    loadCustomerServiceConfigCached({ force: true })
      .then((res) => {
        if (res.persisted) {
          setCustomerService(res.config)
          writeCustomerServiceLocal(res.config)
        } else {
          setCustomerService(readCustomerServiceLocal())
        }
      })
      .catch(() => setCustomerService(readCustomerServiceLocal()))
  }, [isDecorateMode])

  const select = useCallback((propKey: string | null) => {
    setSelectedKey(propKey)
  }, [])

  const getPatch = useCallback(
    (propKey: string) => {
      if (!hydrated) return undefined
      return draft[propKey]
    },
    [draft, hydrated],
  )

  const updatePatch = useCallback((propKey: string, patch: Partial<DecoratePatch>) => {
    setDraft((prev) => ({
      ...prev,
      [propKey]: { ...(prev[propKey] || {}), ...patch },
    }))
  }, [])

  const deletePatch = useCallback((propKey: string) => {
    setDraft((prev) => ({
      ...prev,
      [propKey]: { ...(prev[propKey] || {}), hidden: true },
    }))
    setSelectedKey((current) => (current === propKey ? null : current))
  }, [])

  const restorePatch = useCallback((propKey: string) => {
    setDraft((prev) => ({
      ...prev,
      [propKey]: { ...(prev[propKey] || {}), hidden: false },
    }))
  }, [])

  const updateCustomerService = useCallback((patch: Partial<CustomerServiceConfig>) => {
    setCustomerService((prev) => normalizeCustomerServiceConfig({ ...prev, ...patch }))
  }, [])

  const persistCustomerService = useCallback(async (patch?: Partial<CustomerServiceConfig>) => {
    const normalized = normalizeCustomerServiceConfig({
      ...customerServiceRef.current,
      ...(patch || {}),
    })
    setCustomerService(normalized)
    writeCustomerServiceLocal(normalized)
    setIsSavingCustomerService(true)
    try {
      const saved = await saveCustomerServiceConfig(normalized)
      const next = normalizeCustomerServiceConfig(saved)
      setCustomerService(next)
      writeCustomerServiceLocal(next)
      return next
    } catch (err: any) {
      toast.error(err?.message || '客服位置保存失败，请确认后端服务已重启')
      return null
    } finally {
      setIsSavingCustomerService(false)
    }
  }, [])

  const setFloatDragMode = useCallback((enabled: boolean) => {
    setIsFloatDragMode(Boolean(enabled))
    if (enabled) {
      setCustomerService((prev) =>
        normalizeCustomerServiceConfig({ ...prev, floatEnabled: true }),
      )
      toast.message('拖拽模式已开启', {
        description: '按住悬浮图标拖到任意位置后松开，坐标会自动保存。',
      })
    }
  }, [])

  const clearDecorateQuery = useCallback(() => {
    const params = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search)
    params.delete(DECORATE_QUERY)
    const qs = params.toString()
    const next = qs ? `${pathname}?${qs}` : pathname
    if (typeof window !== 'undefined') {
      window.location.assign(next)
      return
    }
    router.replace(next)
  }, [pathname, router])

  const publishAndExit = useCallback(async () => {
    const normalized = normalizeCustomerServiceConfig(customerServiceRef.current)
    writeDecorateStore(draft)
    writeCustomerServiceLocal(normalized)
    try {
      const [savedStore] = await Promise.all([
        savePageDecorateConfig(draft),
        saveCustomerServiceConfig(normalized),
      ])
      writeDecorateStore(savedStore)
      setDraft(savedStore)
      toast.success('装修与客服配置已发布')
    } catch (err: any) {
      toast.error(err?.message || '配置保存失败（页面装修已写入本地缓存）')
    }
    setSelectedKey(null)
    setIsFloatDragMode(false)
    clearDecorateQuery()
  }, [clearDecorateQuery, draft])

  const exitWithoutPublish = useCallback(() => {
    // 取消时重新对齐后台已发布配置；无后台记录则回退本地
    getPageDecorateConfig()
      .then((res) => {
        if (res.persisted) {
          setDraft(res.store)
          writeDecorateStore(res.store)
          return
        }
        setDraft(readDecorateStore())
      })
      .catch(() => setDraft(readDecorateStore()))
    // 拖拽已即时入库，退出时仍以本地（含已保存坐标）为准，再尝试与服务器对齐
    const local = readCustomerServiceLocal()
    setCustomerService(local)
    loadCustomerServiceConfigCached({ force: true })
      .then((res) => {
        if (!res.persisted) return
        setCustomerService(res.config)
        writeCustomerServiceLocal(res.config)
      })
      .catch(() => undefined)
    setSelectedKey(null)
    setIsFloatDragMode(false)
    clearDecorateQuery()
  }, [clearDecorateQuery])

  const value = useMemo<DecorateContextValue>(
    () => ({
      isDecorateMode,
      selectedKey,
      draft,
      customerService,
      isFloatDragMode,
      isSavingCustomerService,
      select,
      getPatch,
      updatePatch,
      deletePatch,
      restorePatch,
      updateCustomerService,
      persistCustomerService,
      setFloatDragMode,
      publishAndExit,
      exitWithoutPublish,
    }),
    [
      isDecorateMode,
      selectedKey,
      draft,
      customerService,
      isFloatDragMode,
      isSavingCustomerService,
      select,
      getPatch,
      updatePatch,
      deletePatch,
      restorePatch,
      updateCustomerService,
      persistCustomerService,
      setFloatDragMode,
      publishAndExit,
      exitWithoutPublish,
    ],
  )

  return (
    <DecorateContext.Provider value={value}>
      {isDecorateMode ? <div className="h-14" aria-hidden /> : null}
      {children}
      {isDecorateMode ? (
        <>
          <DecorateTopBar />
          <DecorateToolbar />
          <DecorateCustomerServicePanel />
        </>
      ) : null}
    </DecorateContext.Provider>
  )
}
