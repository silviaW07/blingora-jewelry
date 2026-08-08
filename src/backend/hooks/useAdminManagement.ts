'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  listAdminAccounts,
  createAdminAccount,
  updateAdminRole,
  updateAdminStatus,
  resetAdminPassword,
  deleteAdminAccount,
} from '@/backend/actions/AdminManagement'
import type {
  AdminAccountItem,
  AdminRole,
} from '@/backend/actions/AdminManagement'

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  ADMIN: '主管理员',
  SUB_ADMIN: '子管理员',
}

export const ADMIN_STATUS_LABELS = {
  ACTIVE: '已启用',
  DISABLED: '已禁用',
} as const

interface CreateForm {
  account: string
  username: string
  email: string
  password: string
  role: AdminRole
}

const EMPTY_CREATE_FORM: CreateForm = {
  account: '',
  username: '',
  email: '',
  password: '',
  role: 'SUB_ADMIN',
}

export interface AdminManagementState {
  loading: boolean
  list: AdminAccountItem[]
  actionLoadingId: string | null
  createOpen: boolean
  createForm: CreateForm
  createSubmitting: boolean
  resetTarget: AdminAccountItem | null
  resetPasswordValue: string
  resetSubmitting: boolean
  deleteTarget: AdminAccountItem | null
  deleteSubmitting: boolean
  ADMIN_ROLE_LABELS: Record<AdminRole, string>
  ADMIN_STATUS_LABELS: typeof ADMIN_STATUS_LABELS
}

export interface AdminManagementHandlers {
  refresh: () => void
  setCreateOpen: (open: boolean) => void
  setCreateField: <K extends keyof CreateForm>(field: K, value: CreateForm[K]) => void
  submitCreate: () => Promise<void>
  toggleStatus: (item: AdminAccountItem) => Promise<void>
  changeRole: (item: AdminAccountItem, role: AdminRole) => Promise<void>
  openReset: (item: AdminAccountItem) => void
  closeReset: () => void
  setResetPasswordValue: (value: string) => void
  submitReset: () => Promise<void>
  openDelete: (item: AdminAccountItem) => void
  closeDelete: () => void
  confirmDelete: () => Promise<void>
}

export function useAdminManagement(): {
  state: AdminManagementState
  handlers: AdminManagementHandlers
} {
  const [loading, setLoading] = useState(true)
  const [list, setList] = useState<AdminAccountItem[]>([])
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_CREATE_FORM)
  const [createSubmitting, setCreateSubmitting] = useState(false)

  const [resetTarget, setResetTarget] = useState<AdminAccountItem | null>(null)
  const [resetPasswordValue, setResetPasswordValue] = useState('')
  const [resetSubmitting, setResetSubmitting] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<AdminAccountItem | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await listAdminAccounts()
      setList(rows)
    } catch (error: any) {
      toast.error(error?.message || '加载管理员列表失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const setCreateField = useCallback(
    <K extends keyof CreateForm>(field: K, value: CreateForm[K]) => {
      setCreateForm(prev => ({ ...prev, [field]: value }))
    },
    [],
  )

  const submitCreate = useCallback(async () => {
    if (!createForm.account.trim()) {
      toast.error('请填写账号')
      return
    }
    if (!createForm.email.trim()) {
      toast.error('请填写邮箱')
      return
    }
    if (createForm.password.length < 8) {
      toast.error('密码至少 8 位，且需包含字母和数字')
      return
    }
    setCreateSubmitting(true)
    try {
      const created = await createAdminAccount({
        account: createForm.account.trim(),
        username: createForm.username.trim() || undefined,
        email: createForm.email.trim(),
        password: createForm.password,
        role: createForm.role,
      })
      setList(prev => [...prev, created])
      toast.success('管理员账号已创建')
      setCreateForm(EMPTY_CREATE_FORM)
      setCreateOpen(false)
    } catch (error: any) {
      toast.error(error?.message || '创建失败')
    } finally {
      setCreateSubmitting(false)
    }
  }, [createForm])

  const toggleStatus = useCallback(async (item: AdminAccountItem) => {
    const nextStatus = item.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
    setActionLoadingId(item.id)
    try {
      const updated = await updateAdminStatus({ id: item.id, status: nextStatus })
      setList(prev => prev.map(row => (row.id === updated.id ? updated : row)))
      toast.success(nextStatus === 'ACTIVE' ? '已启用' : '已禁用')
    } catch (error: any) {
      toast.error(error?.message || '操作失败')
    } finally {
      setActionLoadingId(null)
    }
  }, [])

  const changeRole = useCallback(async (item: AdminAccountItem, role: AdminRole) => {
    if (role === item.role) return
    setActionLoadingId(item.id)
    try {
      const updated = await updateAdminRole({ id: item.id, role })
      setList(prev => prev.map(row => (row.id === updated.id ? updated : row)))
      toast.success('角色已更新')
    } catch (error: any) {
      toast.error(error?.message || '角色更新失败')
    } finally {
      setActionLoadingId(null)
    }
  }, [])

  const openReset = useCallback((item: AdminAccountItem) => {
    setResetTarget(item)
    setResetPasswordValue('')
  }, [])

  const closeReset = useCallback(() => {
    setResetTarget(null)
    setResetPasswordValue('')
  }, [])

  const submitReset = useCallback(async () => {
    if (!resetTarget) return
    if (resetPasswordValue.length < 8) {
      toast.error('新密码至少 8 位，且需包含字母和数字')
      return
    }
    setResetSubmitting(true)
    try {
      await resetAdminPassword({ id: resetTarget.id, password: resetPasswordValue })
      toast.success('密码已重置')
      setResetTarget(null)
      setResetPasswordValue('')
    } catch (error: any) {
      toast.error(error?.message || '重置密码失败')
    } finally {
      setResetSubmitting(false)
    }
  }, [resetTarget, resetPasswordValue])

  const openDelete = useCallback((item: AdminAccountItem) => {
    setDeleteTarget(item)
  }, [])

  const closeDelete = useCallback(() => {
    setDeleteTarget(null)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return
    setDeleteSubmitting(true)
    try {
      await deleteAdminAccount({ id: deleteTarget.id })
      setList(prev => prev.filter(row => row.id !== deleteTarget.id))
      toast.success('账号已删除')
      setDeleteTarget(null)
    } catch (error: any) {
      toast.error(error?.message || '删除失败')
    } finally {
      setDeleteSubmitting(false)
    }
  }, [deleteTarget])

  return {
    state: {
      loading,
      list,
      actionLoadingId,
      createOpen,
      createForm,
      createSubmitting,
      resetTarget,
      resetPasswordValue,
      resetSubmitting,
      deleteTarget,
      deleteSubmitting,
      ADMIN_ROLE_LABELS,
      ADMIN_STATUS_LABELS,
    },
    handlers: {
      refresh: () => void refresh(),
      setCreateOpen,
      setCreateField,
      submitCreate,
      toggleStatus,
      changeRole,
      openReset,
      closeReset,
      setResetPasswordValue,
      submitReset,
      openDelete,
      closeDelete,
      confirmDelete,
    },
  }
}
