const { createRequire } = require("module");
const require2 = createRequire(__filename);
const { PrismaClient } = require2("./prisma-generated/client");
const prisma = new PrismaClient({ datasources: { db: { url: "mysql://root:LocalDev123!@localhost:3306/PROJ_fcb9e6ee_snap_20260726_092922_893?charset=utf8mb4" } } });
(async () => {
  const keys = Object.keys(prisma).filter(k => !k.startsWith("_") && !k.startsWith("$"));
  console.log("MODELS:", keys.join(", "));
  const miumiuId = "9afdf283-34c0-4bd8-800a-33576eacd8cb";
  const slippersId = "9ff24e7e-2024-44f0-a55c-3df733733a11";

  // Find SIDE_NAV related tables
  for (const key of keys) {
    if (/home|recommend|zone|sidenav|nav/i.test(key)) {
      try {
        const count = await prisma[key].count();
        console.log(key, "count=", count);
      } catch (e) {
        console.log(key, "error", e.message);
      }
    }
  }

  // List all L1
  const l1 = await prisma.category.findMany({
    where: { level: 1 },
    select: { id: true, name: true, status: true, isBrandCategory: true, sortWeight: true, parentId: true },
    orderBy: { sortWeight: "desc" },
  });
  console.log("L1:", JSON.stringify(l1, null, 2));

  // Orphan L2s
  const orphans = await prisma.category.findMany({
    where: { level: 2, parentId: null },
    select: { id: true, name: true, status: true, isBrandCategory: true, sortWeight: true, slug: true },
  });
  console.log("ORPHANS:", JSON.stringify(orphans, null, 2));

  // Children of each L1 named Brand-like or all brand cats
  const brandCats = await prisma.category.findMany({
    where: { isBrandCategory: true },
    select: { id: true, name: true, level: true, parentId: true, status: true },
  });
  console.log("isBrandCategory=true:", JSON.stringify(brandCats, null, 2));

  await prisma.$disconnect();
})().catch(async e => { console.error(e); await prisma.$disconnect(); process.exit(1); });
