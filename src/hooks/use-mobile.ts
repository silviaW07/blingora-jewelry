import * as React from 'react'
import { isNarrowViewport } from '@/frontend/utils/isNarrowViewport'

/** Same phone rule as the storefront — do not use innerWidth (Chrome Android is often ~980). */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const apply = () => setIsMobile(isNarrowViewport())
    apply()
    window.addEventListener('resize', apply)
    return () => window.removeEventListener('resize', apply)
  }, [])

  return isMobile
}
