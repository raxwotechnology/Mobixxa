import type { Metadata } from 'next';
import PosPage from '@/components/pos/PosPage';

export const metadata: Metadata = {
  title: 'POS Terminal Fast-Billing | Mobixa',
  description:
    'Mobixa Fast-Billing POS Terminal for high-speed retail checkout, Hire Purchase installment management, and automated receipt generation.',
};

export default function Page() {
  return <PosPage />;
}
