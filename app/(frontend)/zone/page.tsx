import RecommendZonePageView from '@/frontend/components/RecommendZonePageView'

type PageProps = {
  searchParams: Promise<{
    zoneId?: string
  }>
}

export default async function RecommendZonePage({ searchParams }: PageProps) {
  const { zoneId = '' } = await searchParams
  return <RecommendZonePageView zoneId={decodeURIComponent(zoneId)} />
}
