/** Max length for category.slug (schema VarChar(120)); leave room for uniqueness suffixes. */
export const CATEGORY_SLUG_MAX_LEN = 120

export function normalizeOptionalSlug(slug?: string | null) {
  const normalized = slug?.trim() ?? ''
  return normalized.length > 0 ? normalized : null
}

/**
 * Build a URL-safe slug from a category name.
 * - lowercase, strip `&`, collapse non-alphanumeric to `-`, trim hyphens
 * - ASCII names: e.g. `Slippers & Sandals` → `slippers-sandals`
 * - Pure/mostly CJK (no usable ASCII left): `cat-{shortId}` (no pinyin dep in project)
 */
export function slugifyCategoryName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) {
    return `cat-${Date.now().toString(36).slice(-8)}`
  }

  const asciiSlug = trimmed
    .toLowerCase()
    .replace(/&/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, CATEGORY_SLUG_MAX_LEN)

  if (asciiSlug) return asciiSlug

  return `cat-${Date.now().toString(36).slice(-8)}`
}

type SlugUniquenessClient = {
  category: {
    findFirst: (args: {
      where: { slug: string; id?: { not: string } }
      select: { id: true }
    }) => Promise<{ id: string } | null>
  }
}

export async function ensureUniqueCategorySlug(
  client: SlugUniquenessClient,
  baseSlug: string,
  options?: { excludeId?: string; reserved?: Set<string> },
): Promise<string> {
  const reserved = options?.reserved
  const excludeId = options?.excludeId
  const normalizedBase = (baseSlug.trim() || `cat-${Date.now().toString(36).slice(-8)}`)
    .toLowerCase()
    .slice(0, CATEGORY_SLUG_MAX_LEN)

  let candidate = normalizedBase
  let n = 2
  // Cap collision retries; fall back to timestamped slug if exhausted
  while (n < 10_000) {
    const takenInBatch = reserved?.has(candidate) === true
    if (!takenInBatch) {
      const existing = await client.category.findFirst({
        where: {
          slug: candidate,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
        select: { id: true },
      })
      if (!existing) {
        reserved?.add(candidate)
        return candidate
      }
    }
    const suffix = `-${n}`
    candidate = `${normalizedBase.slice(0, CATEGORY_SLUG_MAX_LEN - suffix.length)}${suffix}`
    n += 1
  }

  const fallback = `cat-${Date.now().toString(36)}`.slice(0, CATEGORY_SLUG_MAX_LEN)
  reserved?.add(fallback)
  return fallback
}

/**
 * Prefer a non-empty user-provided slug; otherwise auto-generate from name and ensure uniqueness.
 */
export async function resolveCategorySlug(
  client: SlugUniquenessClient,
  params: {
    providedSlug?: string | null
    categoryName: string
    excludeId?: string
    reserved?: Set<string>
  },
): Promise<string> {
  const provided = normalizeOptionalSlug(params.providedSlug)
  if (provided) {
    return provided.slice(0, CATEGORY_SLUG_MAX_LEN)
  }
  const base = slugifyCategoryName(params.categoryName)
  return ensureUniqueCategorySlug(client, base, {
    excludeId: params.excludeId,
    reserved: params.reserved,
  })
}

/**
 * If category slug is empty/null (or yields no short-code), generate + persist a unique slug.
 * Returns the usable slug string.
 */
export async function ensureCategorySlugPersisted(
  client: SlugUniquenessClient & {
    category: {
      update: (args: {
        where: { id: string }
        data: { slug: string }
        select?: { slug: true }
      }) => Promise<{ slug: string | null } | unknown>
    }
  },
  category: { id: string; name: string; slug: string | null },
): Promise<string> {
  const existing = normalizeOptionalSlug(category.slug)
  if (existing) return existing

  const slug = await resolveCategorySlug(client, {
    categoryName: category.name,
    excludeId: category.id,
  })

  await client.category.update({
    where: { id: category.id },
    data: { slug },
  })

  return slug
}
