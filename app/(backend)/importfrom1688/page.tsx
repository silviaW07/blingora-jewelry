// {"router": "/importfrom1688", "id": "b05", "en_name": "ImportFrom1688"}
'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useImportFrom1688 } from '@/backend/hooks/useImportFrom1688'
import ImportFrom1688View from '@/backend/components/ImportFrom1688View'
import { ProductManagement } from '@/backend/route-params'

/**
 * 1688 独立工作台入口已下线：默认跳转商品管理待上传区。
 * 仅保留 ?mode=table，供「上传 Excel/CSV」进入表格导入完整流程。
 */
export default function ImportFrom1688Page() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode')
  const { state, handlers } = useImportFrom1688()

  useEffect(() => {
    if (mode === 'table') {
      handlers.setCreationMode('table')
      return
    }
    ProductManagement.navigateToPendingImports(router)
  }, [mode, router])

  if (mode !== 'table') {
    return null
  }

  return <ImportFrom1688View state={state} handlers={handlers} />
}
