import type { Metadata } from 'next';
import './globals.css';
import NotificationBar from '@/components/NotificationBar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Mobixa — Next-Gen Technology & Accessories Store',
  description:
    "Discover premium smartphones, laptops, wearables, and tech accessories at Mobixa. Sri Lanka's leading next-gen technology retailer with 12+ boutique stores.",
  keywords: 'smartphones, laptops, accessories, tech store, Sri Lanka, Mobixa',
  openGraph: {
    title: 'Mobixa — Next-Gen Technology & Accessories Store',
    description: 'Premium tech, curated for those who demand the best.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="w-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="w-full min-h-screen flex flex-col overflow-x-hidden antialiased bg-white text-slate-900">
        <NotificationBar />
        <Navbar />
        <main className="flex-1 w-full">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
