require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { PrismaClient } = require(require('path').join(__dirname, '..', 'prisma-generated/client'))
const p = new PrismaClient()

const WALLET = 'a27293fa-68c5-4557-a5d2-8a5da86747be'

;(async () => {
  const handbag = await p.category.findFirst({
    where: { OR: [{ name: 'Handbag' }, { slug: 'handbag' }, { name: { contains: 'Handbag' } }] },
    select: { id: true, name: true, slug: true },
  })

  const inWallet = {
    status: 'ACTIVE',
    OR: [
      { categoryId: WALLET },
      { brandCategoryId: WALLET },
      { relationCategories: { some: { categoryId: WALLET } } },
    ],
  }

  const total = await p.product.count({ where: inWallet })
  const primaryWallet = await p.product.count({ where: { status: 'ACTIVE', categoryId: WALLET } })
  const primaryHandbagRelWallet = await p.product.count({
    where: {
      status: 'ACTIVE',
      categoryId: handbag ? handbag.id : '__none__',
      relationCategories: { some: { categoryId: WALLET } },
    },
  })
  const handCodeInWallet = await p.product.count({
    where: { ...inWallet, productCode: { startsWith: 'HAND' } },
  })
  const wallCodeInWallet = await p.product.count({
    where: { ...inWallet, productCode: { startsWith: 'WALL' } },
  })

  const newest = await p.product.findMany({
    where: inWallet,
    select: {
      productCode: true,
      name: true,
      createdAt: true,
      category: { select: { name: true } },
      relationCategories: { select: { category: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 15,
  })

  const diane = await p.product.findMany({
    where: {
      status: 'ACTIVE',
      OR: [
        { name: { contains: 'Diane' } },
        { name: { contains: 'Swinger' } },
        { name: { contains: 'Ball Grain' } },
        { name: { contains: 'Cowhide Double' } },
        { name: { contains: 'Hot Seller Cross' } },
      ],
    },
    select: {
      productCode: true,
      name: true,
      category: { select: { id: true, name: true } },
      relationCategories: { select: { category: { select: { id: true, name: true } } } },
    },
    take: 20,
  })

  console.log(
    JSON.stringify(
      {
        handbag,
        total,
        primaryWallet,
        primaryHandbagRelWallet,
        handCodeInWallet,
        wallCodeInWallet,
        newest: newest.map((r) => ({
          code: r.productCode,
          created: r.createdAt,
          primary: r.category && r.category.name,
          rels: r.relationCategories.map((x) => x.category && x.category.name),
          name: String(r.name).slice(0, 55),
        })),
        shot: diane.map((r) => ({
          code: r.productCode,
          primary: r.category && r.category.name,
          rels: r.relationCategories.map((x) => x.category && x.category.name),
          name: String(r.name).slice(0, 55),
          walletRel: r.relationCategories.some((x) => x.category && x.category.id === WALLET),
          walletPrimary: r.category && r.category.id === WALLET,
        })),
      },
      null,
      2,
    ),
  )
  await p.$disconnect()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
