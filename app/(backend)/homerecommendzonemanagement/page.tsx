// {"router": "/homerecommendzonemanagement", "id": "b15", "en_name": "HomeRecommendZoneManagement"}
'use client'
import { useHomeRecommendZoneManagement } from '@/backend/hooks/useHomeRecommendZoneManagement';
import { HomeRecommendZoneManagementView } from '@/backend/components/HomeRecommendZoneManagementView';

export default function HomeRecommendZoneManagementPage() {
    const { state, handlers } = useHomeRecommendZoneManagement();
    return <HomeRecommendZoneManagementView state={state} handlers={handlers} />;
}
