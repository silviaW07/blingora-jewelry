// {"router": "/ordermanagement", "id": "b13", "en_name": "OrderManagement"}
'use client'
import { useOrderManagement } from '@/backend/hooks/useOrderManagement';
import OrderManagementView from '@/backend/components/OrderManagementView';

export default function OrderManagementPage() {
    const { state, handlers } = useOrderManagement();
    return <OrderManagementView state={state} handlers={handlers} />;
}
