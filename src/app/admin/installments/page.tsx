import type { Metadata } from 'next';
import InstallmentsPage from '@/components/admin/InstallmentsPage';

export const metadata: Metadata = {
  title: 'Hire Purchase & Installment Registry | Mobixa Admin',
  description:
    'Manage Hire Purchase credit sales, customer installment schedules, overdue collections, and active agreement metrics at Mobixa.',
};

export default function Page() {
  return <InstallmentsPage />;
}
