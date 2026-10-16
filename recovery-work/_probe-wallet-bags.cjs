require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { PrismaClient } = require(require('path').join(__dirname, '..', 'prisma-generated/client'))
const p = new PrismaClient()

;(async () => {
  const wallets = await p.category.findMany({
    where: {
      OR: [
        { name: { contains: 'wallet' } },
        { name: { contains: 'Wallet' } },
        { name: { contains: '钱包' } },
        { slug: { contains: 'wallet' } },
      ],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      level: true,
      parentId: true,
      isBrandCategory: true,
      status: true,
      parent: { select: { id: true, name: true, slug: true, level: true } },
      children: { select: { id: true, name: true, slug: true } },
    },
  })

  const out = []
  for (const cat of wallets) {
    const primary = await p.product.count({
      where: { status: 'ACTIVE', categoryId: cat.id },
    })
    const brand = await p.product.count({
      where: { status: 'ACTIVE', brandCategoryId: cat.id },
    })
    const rel = await p.product_category_relations.count({
      where: { categoryId: cat.id, product: { status: 'ACTIVE' } },
    })
    const sample = await p.product.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { categoryId: cat.id },
          { brandCategoryId: cat.id },
          { relationCategories: { some: { categoryId: cat.id } } },
        ],
      },
      select: {
        productCode: true,
        name: true,
        categoryId: true,
        brandCategoryId: true,
        category: { select: { name: true } },
        relationCategories: { select: { category: { select: { name: true } } }, take: 8 },
      },
      orderBy: { createdAt: 'desc' },
      take: 12,
    })
    out.push({
      cat: {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        level: cat.level,
        parent: cat.parent,
        children: cat.children,
      },
      primary,
      brand,
      rel,
      sample: sample.map((r) => ({
        code: r.productCode,
        name: String(r.name).slice(0, 50),
        primary: r.category && r.category.name,
        brandId: r.brandCategoryId,
        rels: r.relationCategories.map((x) => x.category && x.category.name),
      })),
    })
  }
  console.log(JSON.stringify(out, null, 2))
  await p.$disconnect()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
