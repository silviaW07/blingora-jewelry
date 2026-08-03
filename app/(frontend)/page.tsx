// {"router": "/", "id": "f01", "en_name": "Home"}
import HomeClient from './HomeClient'

/** ISR: regenerate homepage shell at most every 5 minutes */
export const revalidate = 300

/**
 * Static shell for `/` — client data still loads via RPC after hydrate.
 * Category routes use generateStaticParams in category/[slug]/page.tsx.
 */
export default function HomePage() {
  return <HomeClient />
}
