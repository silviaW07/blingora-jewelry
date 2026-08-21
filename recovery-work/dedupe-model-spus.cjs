/**
 * Deduplicate products that share the same model number in the title
 * (e.g. 45535 / 45633), and deactivate empty restored stubs (no real image).
 *
 * Keep winner: has real OSS/alicdn image > more SKUs > newer updatedAt.
 * Usage: node dedupe-model-spus.cjs [--dry-run] [--apply]
 */
const { PrismaClient } = require('./prisma-generated/client')

const dryRun = !process.argv.includes('--apply')
const p = new PrismaClient()

function isPlaceholderImage(url) {
  const u = String(url || '').trim()
  if (!u) return true
  return /placeholder|via\.placeholder|no[-_]?image|default[-_]?product|data:image\/svg/i.test(u)
}

function extractModelTokens(name) {
  const text = String(name || '')
  const tokens = new Set()
  // Common title model numbers: 45535, 45633, 2201-1, KC24, etc.
  for (const m of text.matchAll(/\b(\d{4,6})(?:-\d+)?\b/g)) {
    tokens.add(m[1])
  }
  for (const m of text.matchAll(/\b([A-Z]{1,3}\d{2,5})\b/gi)) {
    tokens.add(m[1].toUpperCase())
  }
  return [...tokens]
}

function scoreProduct(row) {
  let score = 0
  if (!isPlaceholderImage(row.mainImageUrl)) score += 1000
  if (row.skuCount > 0) score += Math.min(200, row.skuCount * 10)
  if (row.status === 'ACTIVE') score += 50
  // Prefer ACCE/BAGS with real images over restored BELT stubs without images
  if (/^BELT|^HAND|^EARR|^JS/i.test(row.productCode) && isPlaceholderImage(row.mainImageUrl)) {
    score -= 300
  }
  score += Math.min(40, Math.floor((Date.now() - new Date(row.updatedAt).getTime()) / -86400000))
  return score
}

;(async () => {
  const products = await p.product.findMany({
    select: {
      id: true,
      productCode: true,
      name: true,
      status: true,
      mainImageUrl: true,
      updatedAt: true,
      createdAt: true,
      _count: { select: { skus: true } },
    },
  })

  const enriched = products.map((row) => ({
    id: row.id,
    productCode: row.productCode,
    name: row.name,
    status: row.status,
    mainImageUrl: row.mainImageUrl,
    updatedAt: row.updatedAt,
    createdAt: row.createdAt,
    skuCount: row._count.skus,
    tokens: extractModelTokens(row.name),
    placeholder: isPlaceholderImage(row.mainImageUrl),
  }))

  // 1) Deactivate placeholder / no-image products that look like restored stubs
  //    (no real image AND 0–1 sku OR name from restore)
  const stubCandidates = enriched.filter(
    (row) =>
      row.placeholder &&
      row.status === 'ACTIVE' &&
      (row.skuCount <= 1 || /WITH BOX|normal quialty|placeholder/i.test(row.name)),
  )

  // 2) Group ACTIVE products by model token (only tokens that appear on 2+ products)
  const byToken = new Map()
  for (const row of enriched) {
    if (row.status !== 'ACTIVE') continue
    for (const token of row.tokens) {
      // skip overly generic short years etc.
      if (/^(202[0-9]|19[0-9]{2})$/.test(token)) continue
      const list = byToken.get(token) || []
      list.push(row)
      byToken.set(token, list)
    }
  }

  const deactivateIds = new Set()
  const keepMap = []

  for (const [token, list] of byToken.entries()) {
    if (list.length < 2) continue
    // Only dedupe when at least one has a real image OR all are placeholders
    const ranked = [...list].sort((a, b) => scoreProduct(b) - scoreProduct(a))
    const winner = ranked[0]
    const losers = ranked.slice(1)
    // If winner also has no image and losers don't either, deactivate all but one
    keepMap.push({
      token,
      keep: winner.productCode,
      drop: losers.map((x) => x.productCode),
    })
    for (const loser of losers) deactivateIds.add(loser.id)
  }

  for (const stub of stubCandidates) {
    // If a stub wasn't already covered by model-token dedupe, still deactivate
    deactivateIds.add(stub.id)
  }

  // Never deactivate if it's the sole ACTIVE product for a token that has image
  // (already handled by keep winner)

  const toDeactivate = enriched.filter((row) => deactivateIds.has(row.id) && row.status === 'ACTIVE')

  console.log(
    JSON.stringify(
      {
        dryRun,
        totalProducts: enriched.length,
        stubCandidates: stubCandidates.length,
        duplicateGroups: keepMap.length,
        sampleGroups: keepMap.slice(0, 15),
        deactivateCount: toDeactivate.length,
        deactivateSample: toDeactivate.slice(0, 20).map((r) => ({
          code: r.productCode,
          name: String(r.name).slice(0, 50),
          placeholder: r.placeholder,
          skus: r.skuCount,
        })),
      },
      null,
      2,
    ),
  )

  if (!dryRun && toDeactivate.length) {
    const ids = toDeactivate.map((r) => r.id)
    // batch update
    const chunk = 200
    let updated = 0
    for (let i = 0; i < ids.length; i += chunk) {
      const part = ids.slice(i, i + chunk)
      const res = await p.product.updateMany({
        where: { id: { in: part } },
        data: { status: 'INACTIVE' },
      })
      updated += res.count
    }
    console.log(JSON.stringify({ applied: true, updated }, null, 2))
  } else if (dryRun) {
    console.log(JSON.stringify({ hint: 'Re-run with --apply to deactivate' }, null, 2))
  }

  await p.$disconnect()
})().catch(async (e) => {
  console.error(e)
  await p.$disconnect()
  process.exit(1)
})
