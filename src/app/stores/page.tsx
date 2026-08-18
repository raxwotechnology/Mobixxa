import type { Metadata } from 'next';
import StoresPage from '@/components/stores/StoresPage';

export const metadata: Metadata = {
  title: 'Stores & Showrooms | Mobixa',
  description:
    'Find your nearest Mobixa flagship boutique in Sri Lanka. Visit our showrooms in Colombo for expert advice, live demos, and exclusive in-store offers.',
};

export default function Page() {
  return <StoresPage />;
}
