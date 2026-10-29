/** Storefront shelf that collects products without a real brand. */
const NO_BRAND_CATEGORY_MATCH = {
  OR: [
    { slug: 'no-brand' },
    { name: 'No Brand' },
    { name: 'NoBrand' },
    { name: '无品牌' },
  ],
}

export function isNoBrandCategoryName(name?: string | null) {
  const normalized = String(name || '').replace(/[\s_-]+/g, '').toLowerCase()
  return normalized === 'nobrand' || normalized === 'nobrands' || normalized === '无品牌'
}

/** Hide No Brand shelf products from every list except the No Brand category itself. */
export function excludeNoBrandShelfWhere() {
  return {
    NOT: {
      OR: [
        { category: NO_BRAND_CATEGORY_MATCH },
        { brandCategory: NO_BRAND_CATEGORY_MATCH },
        { relationCategories: { some: { category: NO_BRAND_CATEGORY_MATCH } } },
      ],
    },
  }
}
