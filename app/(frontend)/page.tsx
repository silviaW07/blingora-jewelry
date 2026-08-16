// {"router": "/", "id": "f01", "en_name": "Home"}
import HomeClient from './HomeClient'
import { loadStorefrontBootstrap } from '@/frontend/lib/loadStorefrontBootstrap'

/**
 * Homepage has no [param] segment — `generateStaticParams` does not apply here.
 * ISR HTML includes category/banner/zone payload so Chrome does not wait on RPC.
 */
export const dynamic = 'force-static'
export const revalidate = 300

export default async function HomePage() {
  const bootstrap = await loadStorefrontBootstrap()
  return <HomeClient bootstrap={bootstrap} />
}
