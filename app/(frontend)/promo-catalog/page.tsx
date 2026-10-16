// {"router": "/promo-catalog", "id": "f16", "en_name": "PromoCatalog"}
import { Suspense } from 'react'
import PromoCatalogView from '@/frontend/components/PromoCatalogView'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function PromoCatalogPage() {
  return (
    <Suspense fallback={<div className="px-4 py-16 text-center text-sm text-[#7a7468]">Loading…</div>}>
      <PromoCatalogView />
    </Suspense>
  )
}
