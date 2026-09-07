import './globals.css';
import { CartProvider } from '@/context/CartContext';

export const metadata = {
  title: 'Mobixa Store | Smart Storefront for Mobiles & Accessories',
  description: 'Shop official smartphones, fast chargers, wireless earbuds, and genuine accessories in Sri Lanka with 100% warranty.',
};

export default function RootLayout({ children }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className='bg-slate-50 text-slate-900 antialiased' suppressHydrationWarning>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
