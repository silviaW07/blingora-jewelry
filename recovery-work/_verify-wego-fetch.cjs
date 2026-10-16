require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs', moduleResolution: 'node' },
})
const { fetchWeishangAlbumPreview } = require('/home/admin/my-website/blingora-jewelry/src/backend/parsers/WeishangParser.ts')
const url =
  'https://www.szwego.com/static/index.html?#/theme_detail/_dtlkBINfachMLNgKF1ROtZXn0b4T-25ROEqTGVA/_dsqkBzBvgk-TSsW3fSBO7ixBd5DiR4eY5xJgy2g?needback=0'
fetchWeishangAlbumPreview(url).then((result) => {
  console.log(
    JSON.stringify(
      {
        outcome: result.outcome,
        failureReason: result.failureReason,
        name: result.preview.name,
        priceMin: result.preview.priceMin,
        images: result.preview.detailImages.length,
        supplierName: result.preview.supplierName,
        firstImage: result.preview.detailImages[0] || null,
      },
      null,
      2,
    ),
  )
}).catch((err) => {
  console.error(err)
  process.exit(1)
})
