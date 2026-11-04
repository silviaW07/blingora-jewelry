import PlaceOrderPageView from '@/frontend/components/PlaceOrderPageView'

export function generateStaticParams() {
  return [{ index: '0' }, { index: '1' }, { index: '2' }, { index: '3' }]
}

export default function PlaceOrderPage() {
  return <PlaceOrderPageView />
}
