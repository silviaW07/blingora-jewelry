// {"router": "/", "id": "f01", "en_name": "Home"}
import HomeClient from './HomeClient'

/**
 * Homepage has no [param] segment — `generateStaticParams` does not apply here.
 * Force static HTML shell at build/ISR time; product data still hydrates via client RPC.
 */
export const dynamic = 'force-static'
export const revalidate = 300

export default function HomePage() {
  return <HomeClient />
}
