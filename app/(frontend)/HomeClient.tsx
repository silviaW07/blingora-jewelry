'use client'

import { useHome } from '@/frontend/hooks/useHome'
import HomeStorefrontView from '@/frontend/components/HomeStorefrontView'
import type { StorefrontBootstrap } from '@/frontend/types/storefrontBootstrap'

/** Client shell for the storefront homepage. */
export default function HomeClient({ bootstrap }: { bootstrap?: StorefrontBootstrap | null }) {
  const { state, handlers } = useHome(bootstrap)
  return <HomeStorefrontView state={state} handlers={handlers} />
}
