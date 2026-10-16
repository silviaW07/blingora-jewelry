/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path')
const repoRoot = path.resolve(__dirname, '..')
process.chdir(repoRoot)
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs', moduleResolution: 'node' },
})
require('tsconfig-paths/register')

const ALBUM = '_ZkMkBU6U1CY5Mg4oJ2jCT3C5btuTpMXw'
const GOODS = [
  '_drlkBB_NY6AI1koJeo1TMt-NpB7W-P31cmhVMxA',
  '_drhkBSazSdCcZECR6T1VhuRdDo8YwTtplESLKUg',
  '_dv6kBb6pmI0sziR5UsaZu1ACbHYprpRTz757JtQ',
  '_d98kBKm6yJNJtgxwAmv854xIxjOP7-NRCn14Erw',
  '_d_mkBc-7WaxDK4qQlSfCnJAXy9DUegGPTwu8qIw',
]

function roundCurrency(value) {
  return Number(Number(value || 0).toFixed(2))
}

function buildColorSpecSkuTable(params) {
  const colors = params.colorGroups.length
    ? params.colorGroups
    : [{ label: '默认颜色', imageUrl: params.mainImageUrl || '' }]
  const specs = (params.specLabels || []).filter(Boolean)
  const skuTable = []
  const sizesByColor = {}
  let index = 0
  for (const group of colors) {
    const color = group.label || '默认颜色'
    const variants = specs.length ? specs : [null]
    if (specs.length) sizesByColor[color] = [...specs]
    for (const spec of variants) {
      index += 1
      skuTable.push({
        skuKey: `sku-${index}`,
        spec: spec ? `${color} / ${spec}` : color,
        costPrice: params.costMin,
        price: params.finalPriceMin,
        stock: params.stock,
        weightGrams: params.weightGrams,
        imageUrl: group.imageUrl,
        attributes: [
          { name: '颜色', value: color },
          ...(spec ? [{ name: '规格', value: spec }] : []),
        ],
      })
    }
  }
  return {
    skuTable,
    colorLabels: colors.map((group) => group.label || '默认颜色'),
    specLabels: specs,
    sizesByColor,
  }
}

async function persistOne(prisma, item, fetched, helpers) {
  const {
    parseWeishangAlbumRef,
    composeFullImportTitle,
    extractSpecLabelsFromCopy,
    importRemoteImageUrls,
    dropIconLikeProductImages,
    analyzeYupooAlbumImages,
    resolveProductWeightGrams,
    resolveInitialStock,
  } = helpers

  const sourceUrl = item.sourceUrl || ''
  const ref = parseWeishangAlbumRef(sourceUrl)
  const itemId = fetched.itemId || ref.itemId || item.id.slice(0, 6)
  const shopId = fetched.shopId || ref.shopId
  const albumId = fetched.albumId || ref.albumId
  const productName = composeFullImportTitle(fetched.name || fetched.productDetail || '') || `微商 ${itemId}`
  const productDetail =
    fetched.productDetail ||
    [productName, fetched.supplierName ? `微购 ${fetched.supplierName}` : '微购相册', sourceUrl]
      .filter(Boolean)
      .join('\n')

  const remoteImages = Array.from(
    new Set(
      [...(fetched.mainImageUrl ? [fetched.mainImageUrl] : []), ...(fetched.detailImages || [])]
        .map((url) => String(url || '').trim())
        .filter(Boolean),
    ),
  ).slice(0, 40)
  const hosted = remoteImages.length ? await importRemoteImageUrls(remoteImages) : { urls: [], failed: [] }
  const hostedWithoutIcons = hosted.urls.length ? await dropIconLikeProductImages(hosted.urls) : []
  const detailImages = hostedWithoutIcons.length ? hostedWithoutIcons : hosted.urls
  const mainImageUrl = detailImages[0] || null
  if (!mainImageUrl) {
    throw new Error(hosted.failed[0]?.reason || '微商相册图片转存失败')
  }

  const albumAnalysis = await analyzeYupooAlbumImages(detailImages, {
    albumTitle: [productName, productDetail].filter(Boolean).join(' '),
  })
  const persistMainImageUrl = albumAnalysis.mainImageUrl || mainImageUrl
  const specLabels = extractSpecLabelsFromCopy(productName, productDetail)
  const costMin = Math.max(0, roundCurrency(fetched.priceMin ?? Number(item.costPrice || 0) ?? 0))
  const coefficient = Number(item.coefficient || 1) || 1
  const finalPriceMin = roundCurrency(costMin * coefficient)
  const stock = resolveInitialStock(item.availableStock)
  const weightGrams = resolveProductWeightGrams({
    text: [productName, productDetail].filter(Boolean).join(' '),
    categoryNames: [],
  })
  const builtSkus = buildColorSpecSkuTable({
    colorGroups: albumAnalysis.groups.length
      ? albumAnalysis.groups
      : [{ label: '默认颜色', imageUrl: persistMainImageUrl }],
    specLabels,
    costMin,
    finalPriceMin,
    stock,
    weightGrams,
    mainImageUrl: persistMainImageUrl,
  })

  const previous = item.previewDataJson && typeof item.previewDataJson === 'object' ? item.previewDataJson : {}
  const previewData = {
    ...previous,
    name: productName,
    price: finalPriceMin,
    mainImageUrl: persistMainImageUrl,
    detailImages,
    shortDescription: productDetail,
    featureAttributes: builtSkus.specLabels.map((value) => ({ key: '尺寸', value })),
    colors: builtSkus.colorLabels.map((label) => {
      const row = builtSkus.skuTable.find((sku) =>
        sku.attributes?.some((attr) => attr.name === '颜色' && attr.value === label),
      )
      return { label, imageUrl: row?.imageUrl || persistMainImageUrl || null }
    }),
    sizesByColor: builtSkus.sizesByColor,
    inboundIdentity: {
      mode: 'LINK_WEISHANG_INDEPENDENT',
      itemId,
      albumId,
      shopId,
      shopName: fetched.supplierName || shopId,
      sourceUrl,
    },
    skuTable: builtSkus.skuTable,
  }

  await prisma.importtaskitem.update({
    where: { id: item.id },
    data: {
      parsedName: productName,
      supplierName: fetched.supplierName || shopId || null,
      mainImageUrl: persistMainImageUrl,
      parsedMainImageUrl: persistMainImageUrl,
      costPrice: costMin,
      weightGrams,
      productDetail,
      skuSummaryText: [
        builtSkus.colorLabels.join(' / ') || '默认颜色',
        builtSkus.specLabels.join(' / '),
      ]
        .filter(Boolean)
        .join(' · '),
      cnyPriceMin: finalPriceMin,
      cnyPriceMax: finalPriceMin,
      parsedPriceMin: fetched.priceMin,
      parsedPriceMax: fetched.priceMin,
      specSummaryJson: [
        { name: '颜色', values: builtSkus.colorLabels },
        ...(builtSkus.specLabels.length ? [{ name: '规格', values: builtSkus.specLabels }] : []),
      ],
      previewDataJson: previewData,
      fetchStatus: 'COMPLETED',
      failureReason: null,
      fetchFinishedAt: new Date(),
    },
  })

  return {
    productName,
    images: detailImages.length,
    colors: builtSkus.colorLabels,
    specs: builtSkus.specLabels,
  }
}

async function main() {
  const { fetchWeishangAlbumPreview } = require(path.join(repoRoot, 'src/backend/parsers/WeishangParser.ts'))
  const { parseWeishangAlbumRef } = require(path.join(repoRoot, 'src/shared/weishangAlbum.ts'))
  const { composeFullImportTitle, extractSpecLabelsFromCopy } = require(path.join(repoRoot, 'src/shared/importSpecFromCopy.ts'))
  const { importRemoteImageUrls } = require(path.join(repoRoot, 'src/lib/importRemoteImages.ts'))
  const { dropIconLikeProductImages, analyzeYupooAlbumImages } = require(path.join(repoRoot, 'src/backend/lib/clusterYupooColorSkus.ts'))
  const { resolveProductWeightGrams } = require(path.join(repoRoot, 'src/shared/categoryWeight.ts'))
  const { resolveInitialStock } = require(path.join(repoRoot, 'src/shared/resolveInitialStock.ts'))
  const { PrismaClient } = require(path.join(repoRoot, 'prisma-generated/client'))
  const prisma = new PrismaClient()
  const helpers = {
    parseWeishangAlbumRef,
    composeFullImportTitle,
    extractSpecLabelsFromCopy,
    importRemoteImageUrls,
    dropIconLikeProductImages,
    analyzeYupooAlbumImages,
    resolveProductWeightGrams,
    resolveInitialStock,
  }

  const rows = await prisma.importtaskitem.findMany({
    where: {
      isPublished: false,
      importedProductId: null,
      OR: [{ sourceUrl: { contains: ALBUM } }, ...GOODS.map((id) => ({ sourceUrl: { contains: id } }))],
    },
    orderBy: { updatedAt: 'desc' },
    take: 20,
  })
  const targets = rows.filter((row) => {
    const url = String(row.sourceUrl || '')
    return GOODS.some((id) => url.includes(id))
  })
  console.log('targets', targets.length, targets.map((row) => row.id))

  for (const item of targets) {
    const result = await fetchWeishangAlbumPreview(item.sourceUrl)
    if (result.outcome !== 'success' || !result.preview.detailImages.length) {
      await prisma.importtaskitem.update({
        where: { id: item.id },
        data: {
          fetchStatus: 'FAILED',
          failureReason: result.failureReason || '微商相册抓取失败',
          fetchFinishedAt: new Date(),
        },
      })
      console.log('fail', item.id, result.failureReason)
      continue
    }
    try {
      const saved = await persistOne(prisma, item, result.preview, helpers)
      console.log('ok', item.id, JSON.stringify(saved))
    } catch (error) {
      console.log('persist-fail', item.id, error && error.message ? error.message : error)
      await prisma.importtaskitem.update({
        where: { id: item.id },
        data: {
          fetchStatus: 'FAILED',
          failureReason: error instanceof Error ? error.message : '微商相册图片转存失败',
          fetchFinishedAt: new Date(),
        },
      })
    }
  }

  await prisma.$disconnect()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
