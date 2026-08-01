// {"router": "/", "id": "f01", "en_name": "Home"}
'use client';

import { useHome } from '@/frontend/hooks/useHome';
import HomeStorefrontView from '@/frontend/components/HomeStorefrontView';
/** Legacy HomeView kept at `@/frontend/components/HomeView` for reference; storefront is the active homepage. */
export default function HomePage() {
  const {
    state,
    handlers
  } = useHome();
  return <HomeStorefrontView state={state} handlers={handlers} />;
}
