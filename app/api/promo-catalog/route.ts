import { NextResponse, type NextRequest } from 'next/server'

import {
  buildPromoCatalogZip,
  buildPromoCatalogPdf,
  loadPromoCatalogItems,
  loadPagedPromoCatalogItems,
  parsePromoCatalogIds,
  PROMO_CATALOG_MAX_PRODUCTS,
} from '@/lib/promoCatalog'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

function fail(message: string, status: number) {
  return NextResponse.json({ code: status, message, error: message }, { status })
}

export async function GET(request: NextRequest) {
  const ids = parsePromoCatalogIds(request.nextUrl.searchParams.get('ids'))
  const categoryId = String(request.nextUrl.searchParams.get('categoryId') || '').trim()
  const lang = request.nextUrl.searchParams.get('lang') || 'en'
  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page') || 1) || 1)
  const pageSize = Math.min(60, Math.max(1, Number(request.nextUrl.searchParams.get('pageSize') || 40) || 40))
  try {
    if (ids.length) {
      const items = await loadPromoCatalogItems(ids, lang)
      return NextResponse.json({
        code: 200,
        data: {
          items: items.map((item) => ({
            id: item.id,
            name: item.name,
            productCode: item.productCode,
            imageUrl: item.imageUrl,
            extraImageUrls: item.extraImageUrls,
            usdPrice: item.usdPrice,
          })),
          total: items.length,
          page: 1,
          pageSize: items.length || pageSize,
        },
      })
    }
    const paged = await loadPagedPromoCatalogItems({ categoryId, page, pageSize, lang })
    return NextResponse.json({
      code: 200,
      data: {
        items: paged.items.map((item) => ({
          id: item.id,
          name: item.name,
          productCode: item.productCode,
          imageUrl: item.imageUrl,
          extraImageUrls: item.extraImageUrls,
          usdPrice: item.usdPrice,
        })),
        total: paged.total,
        page: paged.page,
        pageSize: paged.pageSize,
      },
    })
  } catch (error) {
    return fail((error as Error).message || '加载图册失败', 500)
  }
}

export async function POST(request: NextRequest) {
  let body: {
    productIds?: string[]
    ids?: string
    withPrice?: boolean
    includeColorImages?: boolean
    priceOverrides?: Record<string, number>
    markupMultiplier?: number
    format?: string
    lang?: string
  }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return fail('请求体无效', 400)
  }

  const ids = parsePromoCatalogIds(body.productIds?.length ? body.productIds : body.ids)
  if (!ids.length) return fail('请先勾选商品', 400)
  if (ids.length > PROMO_CATALOG_MAX_PRODUCTS) {
    return fail(`一次最多 ${PROMO_CATALOG_MAX_PRODUCTS} 件商品`, 400)
  }

  try {
    const stamp = new Date().toISOString().slice(0, 10)
    const asPdf = String(body.format || '').toLowerCase() === 'pdf'
    if (asPdf) {
      const { pdf, fileCount } = await buildPromoCatalogPdf({
        productIds: ids,
        withPrice: Boolean(body.withPrice),
        lang: body.lang || 'en',
        priceOverrides: body.priceOverrides,
        markupMultiplier: body.markupMultiplier,
      })
      const filename = `sourcingjewelry-lookbook-${body.withPrice ? 'priced' : 'noprice'}-${stamp}.pdf`
      return new NextResponse(new Uint8Array(pdf), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'X-Promo-File-Count': String(fileCount),
        },
      })
    }
    const { zip, fileCount } = await buildPromoCatalogZip({
      productIds: ids,
      withPrice: Boolean(body.withPrice),
      includeColorImages: Boolean(body.includeColorImages),
      priceOverrides: body.priceOverrides,
      markupMultiplier: body.markupMultiplier,
    })
    const filename = `sourcingjewelry-promo-${body.withPrice ? 'priced' : 'noprice'}-${stamp}.zip`
    return new NextResponse(new Uint8Array(zip), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Promo-File-Count': String(fileCount),
      },
    })
  } catch (error) {
    return fail((error as Error).message || '打包失败', 500)
  }
}
