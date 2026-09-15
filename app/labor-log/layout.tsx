import { redirect } from 'next/navigation';
import { LABOR_LOG_ENABLED } from '@/lib/featureFlags';

export default function LaborLogLayout({ children }: { children: React.ReactNode }) {
  if (!LABOR_LOG_ENABLED) redirect('/');
  return <>{children}</>;
}
