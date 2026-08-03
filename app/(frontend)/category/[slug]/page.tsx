// {"router": "/category/[slug]", "id": "f02b", "en_name": "CategoryBySlug"}
import CategoryBySlugClient from './CategoryBySlugClient'

/** ISR: regenerate category shell at most every 5 minutes */
export const revalidate = 300

/**
 * Static export (`output: 'export'`) requires generateStaticParams for dynamic segments.
 * Pre-render all active category slugs (fallback to id when slug is empty).
 */
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
