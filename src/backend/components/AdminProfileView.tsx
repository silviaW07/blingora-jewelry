'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { upload_project_file } from '@/tools/tools'
import { useAdminSession } from '@/tools/BackendSession'
import {
  getAdminProfile,
  updateAdminProfile,
} from '@/backend/actions/Dashboard'
import type { AdminProfile_Output } from '@/backend/types/Dashboard'

export default function AdminProfileView() {
  const { set: setSession } = useAdminSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [profile, setProfile] = useState<AdminProfile_Output | null>(null)
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAdminProfile()
      setProfile(res)
      setUsername(res.username)
      setAvatarUrl(res.avatarUrl || '')
      setSession({
        username: res.username,
        avatarUrl: res.avatarUrl || '',
      })
    } catch (error) {
      toast.error((error as Error).message || '加载资料失败')
    } finally {
      setLoading(false)
    }
  }, [setSession])

  useEffect(() => {
    void load()
  }, [load])

  const handleUploadAvatar = async (file: File | null) => {
    if (!file) return
    setUploading(true)
    try {
      const url = await upload_project_file(file)
      const nextUrl = typeof url === 'string' ? url : (url as { file_url?: string })?.file_url || ''
      if (!nextUrl) throw new Error('上传失败，未返回图片地址')
      setAvatarUrl(nextUrl)
      toast.success('头像已上传，请点击保存')
    } catch (error) {
      toast.error((error as Error).message || '头像上传失败')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await updateAdminProfile({
        username,
        avatarUrl,
      })
      setProfile(res)
      setSession({
        username: res.username,
        avatarUrl: res.avatarUrl || '',
      })
      toast.success('个人资料已更新')
    } catch (error) {
      toast.error((error as Error).message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6" data-controller-name="管理员个人设置">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">个人设置</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          上传头像、修改显示名称。保存后侧边栏用户区会同步更新。
        </p>
      </div>

      {loading || !profile ? (
        <div className="flex min-h-[240px] items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          正在读取个人资料...
        </div>
      ) : (
        <div className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex size-20 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-2xl font-semibold text-foreground">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="avatar" className="size-full object-cover" />
              ) : (
                (username || 'A').slice(0, 1).toUpperCase()
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">头像</p>
              <label className="inline-flex cursor-pointer items-center rounded-md border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary">
                {uploading ? '上传中...' : '上传头像'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => void handleUploadAvatar(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">登录账号</label>
              <Input value={profile.account} disabled />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">邮箱</label>
              <Input value={profile.email} disabled />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">显示名称</label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">头像 URL</label>
              <Input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="可粘贴图片地址"
              />
            </div>
          </div>

          <Button type="button" onClick={() => void handleSave()} disabled={saving}>
            {saving ? '保存中...' : '保存资料'}
          </Button>
        </div>
      )}
    </div>
  )
}
