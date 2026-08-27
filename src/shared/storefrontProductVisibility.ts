/** Storefront: only ACTIVE listings that were not soft-deleted / drafted / taken off. */
export const HIDDEN_STOREFRONT_GOODS_STATUSES = ['DELETED', 'DRAFT', 'INACTIVE'] as const

export function isHiddenStorefrontGoodsStatus(goodsStatus?: string | null): boolean {
  const value = String(goodsStatus || '').trim().toUpperCase()
  if (!value) return false
  return (HIDDEN_STOREFRONT_GOODS_STATUSES as readonly string[]).includes(value)
}

export function isStorefrontVisibleProduct(input?: {
  status?: string | null
  goodsStatus?: string | null
} | null): boolean {
  if (!input) return false
  if (String(input.status || '').trim().toUpperCase() !== 'ACTIVE') return false
  return !isHiddenStorefrontGoodsStatus(input.goodsStatus)
}

/** Prisma where fragment: listed on the public site. */
export function storefrontVisibilityWhere() {
  return {
    status: 'ACTIVE' as const,
    AND: [
      {
        OR: [
          { goodsStatus: null },
          { goodsStatus: { notIn: [...HIDDEN_STOREFRONT_GOODS_STATUSES] } },
        ],
      },
    ],
  }
}
