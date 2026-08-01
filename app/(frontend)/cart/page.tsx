// {"router": "/cart", "id": "f04", "en_name": "Cart"}
'use client';

import { useCart } from '@/frontend/hooks/useCart';
import CartView from '@/frontend/components/CartView';
export default function CartPage() {
  const {
    state,
    handlers
  } = useCart();
  return <CartView state={state} handlers={handlers} />;
}
