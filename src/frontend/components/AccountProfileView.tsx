'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AccountShell } from '@/frontend/components/AccountShell'
import { useUserSession } from '@/tools/FrontendSession'
import { upload_project_file } from '@/tools/tools'
import {
  getCustomerProfile,
  updateCustomerProfile,
  type CustomerProfile,
} from '@/frontend/actions/AccountCenter'
import { cn } from '@/lib/utils'

/** Long readonly / input values scroll horizontally instead of overflowing the viewport */
function ScrollField({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mobile-account-scroll-field w-full min-w-0 overflow-x-auto', className)}>
      {children}
    </div>
  )
}

export default function AccountProfileView() {
  const session = useUserSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [preferredLocale, setPreferredLocale] = useState('en')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getCustomerProfile()
      setProfile(res)
      setUsername(res.username)
      setPhone(res.phone)
      setAvatarUrl(res.avatarUrl)
      setPreferredLocale(res.preferredLocale || 'en')
    } catch (error) {
      toast.error((error as Error).message || '加载资料失败')
    } finally {
      setLoading(false)
    }
  }, [])

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
      toast.success('头像已上传，请点击保存资料')
    } catch (error) {
      toast.error((error as Error).message || '头像上传失败')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await updateCustomerProfile({
        username,
        phone,
        avatarUrl,
        preferredLocale,
      })
      setProfile(res)
      session.set({
        username: res.username,
        preferredLocale: res.preferredLocale,
      })
      toast.success('个人资料已更新')
    } catch (error) {
      toast.error((error as Error).message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const fieldInputClass =
    'h-10 min-w-0 w-full max-w-none text-[0.875rem] whitespace-nowrap'

  return (
    <AccountShell title="个人信息修改" description="修改头像、姓名与绑定手机号。">
      {loading || !profile ? (
        <div className="flex min-h-[160px] items-center justify-center gap-2 text-sm text-[#7a756c] md:min-h-[240px]">
          <Loader2 className="size-4 animate-spin" />
          正在读取个人资料...
        </div>
      ) : (
        <div className="mx-auto w-full max-w-2xl space-y-4 md:space-y-6">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#e8e2d8] bg-[#f6f2ea] text-xl font-semibold text-[#1f1a14] md:size-20 md:text-2xl">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="avatar" className="size-full object-cover" />
              ) : (
                username.slice(0, 1).toUpperCase() || 'U'
              )}
            </div>
            <div className="min-w-0 space-y-1.5">
              <p className="text-sm font-medium text-[#1f1a14]">头像</p>
              <label className="inline-flex cursor-pointer items-center rounded-full border border-[#d8d4ca] bg-white px-3 py-1.5 text-xs font-semibold text-[#1f1a14] hover:bg-[#f7f4ee] md:px-4 md:py-2">
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

          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            <div className="min-w-0 space-y-1 sm:col-span-2">
              <label className="text-xs font-medium text-[#8a8073]">登录账号</label>
              <ScrollField>
                <Input value={profile.account} disabled className={fieldInputClass} />
              </ScrollField>
            </div>
            <div className="min-w-0 space-y-1 sm:col-span-2">
              <label className="text-xs font-medium text-[#8a8073]">邮箱</label>
              <ScrollField>
                <Input value={profile.email} disabled className={fieldInputClass} />
              </ScrollField>
            </div>
            <div className="min-w-0 space-y-1">
              <label className="text-xs font-medium text-[#8a8073]">姓名</label>
              <ScrollField>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={fieldInputClass}
                />
              </ScrollField>
            </div>
            <div className="min-w-0 space-y-1">
              <label className="text-xs font-medium text-[#8a8073]">绑定手机号</label>
              <ScrollField>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="可选"
                  className={fieldInputClass}
                />
              </ScrollField>
            </div>
            <div className="min-w-0 space-y-1 sm:col-span-2">
              <label className="text-xs font-medium text-[#8a8073]">头像 URL</label>
              <ScrollField>
                <Input
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="可粘贴图片地址"
                  className={fieldInputClass}
                />
              </ScrollField>
            </div>
            <div className="min-w-0 space-y-1">
              <label className="text-xs font-medium text-[#8a8073]">偏好语言</label>
              <ScrollField>
                <Input
                  value={preferredLocale}
                  onChange={(e) => setPreferredLocale(e.target.value)}
                  className={fieldInputClass}
                />
              </ScrollField>
            </div>
          </div>

          <Button
            type="button"
            className="h-10 w-full rounded-full bg-[#111111] px-6 text-sm text-white hover:bg-[#222] sm:w-auto"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '保存中...' : '保存资料'}
          </Button>
        </div>
      )}
    </AccountShell>
  )
}
