// {"router": "/checkout", "id": "f04b", "en_name": "Checkout"}
'use client'

import { useCart } from '@/frontend/hooks/useCart'
import CheckoutView from '@/frontend/components/CheckoutView'

export default function CheckoutPage() {
  const { state, handlers } = useCart()
  return <CheckoutView state={state} handlers={handlers} />
}
