// {"router": "/dashboard/registration", "id": "b03r", "en_name": "RegistrationStats"}
'use client';

import { useRegistrationStats } from '@/backend/hooks/useRegistrationStats';
import RegistrationStatsView from '@/backend/components/RegistrationStatsView';

export default function RegistrationStatsPage() {
  const { state, handlers } = useRegistrationStats();
  return <RegistrationStatsView state={state} handlers={handlers} />;
}
