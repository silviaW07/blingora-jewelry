'use client'

import { useHome } from '@/frontend/hooks/useHome'
import HomeStorefrontView from '@/frontend/components/HomeStorefrontView'

/** Client shell for the storefront homepage (data via RPC). */
export default function HomeClient() {
  const { state, handlers } = useHome()
  return <HomeStorefrontView state={state} handlers={handlers} />
}
