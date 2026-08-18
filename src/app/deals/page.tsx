import type { Metadata } from 'next';
import DealsPage from '@/components/deals/DealsPage';

export const metadata: Metadata = {
  title: 'Mega Deals & Offers | Mobixa',
  description:
    'Exclusive promotions on premium tech at Mobixa. Limited-time discounts on Marshall, PlayStation, Google Pixel, and more. Shop before the countdown expires!',
};

export default function Page() {
  return <DealsPage />;
}
