// {"router": "/dashboard", "id": "b03", "en_name": "Dashboard"}
'use client';

import { useDashboard } from '@/backend/hooks/useDashboard';
import DashboardView from '@/backend/components/DashboardView';
export default function DashboardPage() {
  const {
    state,
    handlers
  } = useDashboard();
  return <DashboardView state={state} handlers={handlers} />;
}
