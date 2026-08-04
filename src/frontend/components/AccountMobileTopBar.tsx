'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, Settings } from 'lucide-react'
import { useUserSession } from '@/tools/FrontendSession'
import { AccountProfile } from '@/frontend/route-params'
import { cn } from '@/lib/utils'

/**
 * Mobile-only Account page top bar:
 * back · title/logo · avatar/settings — no search / cart / login capsules.
 */
export function AccountMobileTopBar({
  title = '个人中心',
  className,
}: {
  title?: string
  className?: string
}) {
  const router = useRouter()
  const session = useUserSession()
  const initial =
    (session.username || session.email || 'U').trim().charAt(0).toUpperCase() || 'U'

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }
    router.push('/')
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b border-[#f0dede] bg-white md:hidden',
        className,
      )}
      data-controller-name="个人中心移动端顶栏"
    >
      <div className="flex h-12 items-center gap-2 px-3">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[#1f1a14] transition hover:bg-[#f6f2ea]"
          aria-label="返回"
        >
          <ChevronLeft className="size-5" strokeWidth={2.2} />
        </button>

        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-[15px] font-semibold tracking-tight text-[#1f1a14]">
            {title}
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push(AccountProfile.path)}
          className="relative inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-[#e7e1d5] bg-[#f7f4ee] text-xs font-bold text-[#1f1a14] transition hover:border-[#111111]"
          aria-label="个人设置"
        >
          <span aria-hidden>{initial}</span>
          <Settings
            className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full bg-white p-0.5 text-[#6f6558]"
            strokeWidth={2.4}
          />
        </button>
      </div>
    </header>
  )
}

export default AccountMobileTopBar
