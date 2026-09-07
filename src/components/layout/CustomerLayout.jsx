'use client';

import React from 'react';
import CustomerNavbar from './CustomerNavbar';
import CustomerFooter from './CustomerFooter';
import CartDrawer from '@/components/cart/CartDrawer';
import { useCart } from '@/context/CartContext';

export default function CustomerLayout({
  children,
  selectedCategory = 'all',
  onSelectCategory,
  searchQuery = '',
  onSearchChange,
}) {
  const { cartCount, openCart } = useCart();

  return (
    <div className='min-h-screen flex flex-col bg-slate-50 text-navy-900 font-sans selection:bg-brand-500 selection:text-white'>
      <CustomerNavbar
        cartCount={cartCount}
        onOpenCart={openCart}
        selectedCategory={selectedCategory}
        onSelectCategory={onSelectCategory}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
      />
      <main className='flex-1 w-full'>
        {children}
      </main>
      <CustomerFooter />
      {/* Global Slide-out Shopping Bag Drawer */}
      <CartDrawer />
    </div>
  );
}
