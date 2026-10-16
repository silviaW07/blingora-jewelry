// {"router": "/buyer-show", "id": "f13", "en_name": "BuyerShow"}
import BuyerShowView from '@/frontend/components/BuyerShowView'
import { getBuyerShowPage } from '@/frontend/actions/BuyerShow'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function BuyerShowPage() {
  let media: Awaited<ReturnType<typeof getBuyerShowPage>>['media'] = []
  let proofs: Awaited<ReturnType<typeof getBuyerShowPage>>['proofs'] = []
  try {
    const result = await getBuyerShowPage()
    media = result.media || []
    proofs = result.proofs || []
  } catch {
    media = []
    proofs = []
  }
  return <BuyerShowView initialMedia={media} initialProofs={proofs} />
}
