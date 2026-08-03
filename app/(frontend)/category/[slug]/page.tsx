// {"router": "/category/[slug]", "id": "f02b", "en_name": "CategoryBySlug"}
import CategoryBySlugClient from './CategoryBySlugClient'

/**
 * Pre-render every active category slug at build time (SSG + ISR).
 * `dynamicParams = true` still allows new slugs after deploy without rebuild.
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

    // Ensure the segment always has at least one path so the route compiles.
    return params.length > 0 ? params : [{ slug: '_' }]
  } catch {
    return [{ slug: '_' }]
  }
}

export default function CategoryBySlugPage() {
  return <CategoryBySlugClient />
}
