import type { Metadata } from 'next';
import ShopPage from '@/components/shop/ShopPage';

export const metadata: Metadata = {
  title: 'Shop — Official Hardware Catalog | Mobixa',
  description:
    'Browse Mobixa\'s complete range of premium smartphones, laptops, tablets, wearables, earbuds, and accessories. Filter by category, brand, and price.',
};

export default function Page() {
  return <ShopPage />;
}
