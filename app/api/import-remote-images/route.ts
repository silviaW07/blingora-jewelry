import { NextResponse, type NextRequest } from 'next/server'

import { importRemoteImageUrls } from '@/lib/importRemoteImages'
import { extractImageUrlsFromText } from '@/shared/weishangAlbum'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function fail(message: string, status: number) {
  return NextResponse.json({ code: status, message, error: message }, { status })
}

export async function POST(request: NextRequest) {
  let body: { text?: string; urls?: string[] }
  try {
    body = (await request.json()) as { text?: string; urls?: string[] }
  } catch {
    return fail('请求不是合法 JSON', 400)
  }

  const fromList = Array.isArray(body.urls) ? body.urls : []
  const fromText = extractImageUrlsFromText(String(body.text || ''))
  const urls = Array.from(new Set([...fromList, ...fromText].map((item) => String(item || '').trim()).filter(Boolean)))
  if (!urls.length) {
    return fail('没有识别到图片地址。请粘贴微商相册里的图片链接（.jpg/.png），不要只贴相册分享页。', 400)
  }

  try {
    const result = await importRemoteImageUrls(urls)
    if (!result.urls.length) {
      const reason = result.failed[0]?.reason || '图片拉取失败'
      return fail(`图链导入失败：${reason}`, 422)
    }
    return NextResponse.json({
      code: 200,
      message: 'ok',
      data: result,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '图链导入失败'
    return fail(message, 500)
  }
}
