// {"router": "/bannermanagement", "id": "b14", "en_name": "BannerManagement"}
'use client'
import { useBannerManagement } from '@/backend/hooks/useBannerManagement';
import BannerManagementView from '@/backend/components/BannerManagementView';

export default function BannerManagementPage() {
    const { state, handlers } = useBannerManagement();
    return <BannerManagementView state={state} handlers={handlers} />;
}
