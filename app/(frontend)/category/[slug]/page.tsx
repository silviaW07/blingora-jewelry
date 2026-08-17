// {"router": "/category/[slug]", "id": "f02b", "en_name": "CategoryBySlug"}
import CategoryBySlugClient from './CategoryBySlugClient'
import { loadStorefrontBootstrap } from '@/frontend/lib/loadStorefrontBootstrap'
import {
  loadStorefrontProducts,
  resolveCategoryIdFromTree,
  shelfCardsToProductItems,
} from '@/frontend/lib/loadStorefrontProducts'
import { buildCategoryPreviewProducts } from '@/frontend/utils/categoryPreviewProducts'

/**
 * Pre-render every active category slug at build time (SSG + ISR).
 * HTML includes product cards so Chrome mobile does not wait on client RPC.
 */
export const dynamic = 'force-static'
export const dynamicParams = true
export const revalidate = 300

export async function generateStaticParams() {
  try {
    const prisma = (await import('@/tools/prisma')).default
    const rows = await prisma.category.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, slug: true },
    })
    const params = rows
      .map((row) => {
        const slug = String(row.slug || '').trim() || row.id
        return { slug }
      })
      .filter((item) => Boolean(item.slug))

    return params.length > 0 ? params : [{ slug: '_' }]
  } catch {
    return [{ slug: '_' }]
  }
}

export default async function CategoryBySlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug: rawSlug } = await params
  const slug = decodeURIComponent(String(rawSlug || '').trim())
  const bootstrap = await loadStorefrontBootstrap()
  const categoryId = resolveCategoryIdFromTree(bootstrap.categories, slug)
  const loaded = await loadStorefrontProducts({
    slug,
    categoryId,
    categoryTree: bootstrap.categories,
    pageSize: 24,
  })
  let list = loaded.list
  if (list.length === 0 && (loaded.categoryId || categoryId)) {
    const preview = buildCategoryPreviewProducts(bootstrap.categories, bootstrap.recommendZones)
    list = preview[loaded.categoryId || categoryId] || []
  }

  return (
    <CategoryBySlugClient
      bootstrap={bootstrap}
      initialCategoryId={loaded.categoryId || categoryId}
      initialProducts={shelfCardsToProductItems(list)}
    />
  )
}
