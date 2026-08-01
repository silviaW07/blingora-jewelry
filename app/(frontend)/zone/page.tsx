import RecommendZonePageView from '@/frontend/components/RecommendZonePageView'

/**
 * 静态导出（output: 'export'）下禁止使用 searchParams 等动态 API。
 * zoneId 改由客户端 useSearchParams 读取，避免 build 时报
 * Route /zone with dynamic = "error" couldn't be rendered statically。
 */
export const dynamic = 'force-static'

export default function RecommendZonePage() {
  return <RecommendZonePageView />
}
