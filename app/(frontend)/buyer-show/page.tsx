// {"router": "/buyer-show", "id": "f13", "en_name": "BuyerShow"}
import BuyerShowView from '@/frontend/components/BuyerShowView'
import { getBuyerShowPage } from '@/frontend/actions/BuyerShow'

export const revalidate = 60

export default async function BuyerShowPage() {
  let media: Awaited<ReturnType<typeof getBuyerShowPage>>['media'] = []
  try {
    const result = await getBuyerShowPage()
    media = result.media || []
  } catch {
    media = []
  }
  return <BuyerShowView initialMedia={media} />
}
