'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function CartDrawer() {
  const {
    cartItems,
    cartCount,
    cartTotal,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isCartOpen) {
        closeCart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, closeCart]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  const formatPrice = (amount) => {
    return 'Rs. ' + amount.toLocaleString('en-LK');
  };

  return (
    <div className='fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200' suppressHydrationWarning>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity'
        onClick={closeCart}
        aria-hidden='true'
      />

      {/* Slide-out Drawer Panel */}
      <div className='fixed inset-y-0 right-0 max-w-full flex pl-10'>
        <div className='w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-300'>
          
          {/* 1. Header */}
          <div className='px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-white'>
            <div className='flex items-center gap-2.5'>
              <div className='p-2 rounded-xl bg-blue-50 text-blue-600'>
                <ShoppingBag className='w-5 h-5' />
              </div>
              <div>
                <h2 className='text-base font-bold text-slate-900 leading-tight'>
                  Shopping Bag
                </h2>
                <p className='text-xs text-slate-500 font-medium'>
                  {cartCount} {cartCount === 1 ? 'item' : 'items'} selected
                </p>
              </div>
            </div>

            <div className='flex items-center gap-2'>
              {cartItems.length > 0 && (
                <button
                  type='button'
                  onClick={clearCart}
                  className='text-[11px] font-semibold text-slate-400 hover:text-red-600 transition-colors px-2 py-1'
                >
                  Clear All
                </button>
              )}
              <button
                type='button'
                onClick={closeCart}
                className='p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors'
                aria-label='Close Shopping Bag'
              >
                <X className='w-5 h-5' />
              </button>
            </div>
          </div>

          {/* 2. Body / Item List */}
          <div className='flex-1 overflow-y-auto px-6 py-4 space-y-4'>
            {cartItems.length > 0 ? (
              <div className='divide-y divide-slate-100 space-y-3'>
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className='pt-3 first:pt-0 flex items-center gap-4 group'
                  >
                    {/* Thumbnail */}
                    <div className='relative w-18 h-18 sm:w-20 sm:h-20 rounded-xl bg-slate-50 border border-slate-100 p-2 flex-shrink-0 flex items-center justify-center overflow-hidden'>
                      <Image
                        src={item.thumbnail}
                        alt={item.name}
                        fill
                        sizes='80px'
                        className='object-contain p-1'
                      />
                    </div>

                    {/* Details */}
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-start justify-between gap-2'>
                        <div>
                          <span className='text-[10px] font-bold uppercase tracking-wider text-blue-600'>
                            {item.brand}
                          </span>
                          <h3 className='text-xs font-semibold text-slate-900 truncate leading-snug'>
                            {item.name}
                          </h3>
                        </div>
                        <button
                          type='button'
                          onClick={() => removeFromCart(item.id)}
                          className='text-slate-400 hover:text-red-500 transition-colors p-1'
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 className='w-4 h-4' />
                        </button>
                      </div>

                      {item.warranty && (
                        <p className='text-[10px] text-slate-400 mt-0.5 flex items-center gap-1'>
                          <ShieldCheck className='w-3 h-3 text-emerald-500' />
                          <span className='truncate'>{item.warranty}</span>
                        </p>
                      )}

                      {/* Quantity & Price */}
                      <div className='flex items-center justify-between mt-2 pt-1'>
                        <div className='flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50'>
                          <button
                            type='button'
                            onClick={() => updateQuantity(item.id, -1)}
                            className='p-1 hover:bg-slate-200 text-slate-600 transition-colors'
                            aria-label='Decrease quantity'
                          >
                            <Minus className='w-3 h-3' />
                          </button>
                          <span className='px-2.5 text-xs font-bold text-slate-800 select-none'>
                            {item.quantity}
                          </span>
                          <button
                            type='button'
                            onClick={() => updateQuantity(item.id, 1)}
                            className='p-1 hover:bg-slate-200 text-slate-600 transition-colors'
                            aria-label='Increase quantity'
                          >
                            <Plus className='w-3 h-3' />
                          </button>
                        </div>

                        <div className='text-right'>
                          <span className='text-xs font-bold text-slate-900'>
                            {formatPrice(item.price * item.quantity)}
                          </span>
                          {item.quantity > 1 && (
                            <span className='block text-[10px] text-slate-400'>
                              {formatPrice(item.price)} each
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Empty Bag State */
              <div className='h-full flex flex-col items-center justify-center text-center p-6 space-y-4'>
                <div className='w-20 h-20 rounded-3xl bg-blue-50 text-blue-500 flex items-center justify-center shadow-inner'>
                  <ShoppingBag className='w-10 h-10' />
                </div>
                <div className='space-y-1.5'>
                  <h3 className='text-base font-bold text-slate-900'>
                    Your Bag is Empty
                  </h3>
                  <p className='text-xs text-slate-500 max-w-xs'>
                    Explore the latest smartphones, fast chargers, and smart accessories to start adding items.
                  </p>
                </div>
                <button
                  type='button'
                  onClick={closeCart}
                  className='mt-2 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all'
                >
                  <span>Start Shopping</span>
                  <ArrowRight className='w-3.5 h-3.5' />
                </button>
              </div>
            )}
          </div>

          {/* 3. Footer / Checkout Area */}
          {cartItems.length > 0 && (
            <div className='p-6 border-t border-slate-100 bg-slate-50/70 space-y-4'>
              {/* Delivery notice */}
              <div className='flex items-center justify-between text-xs py-2 px-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200/60 font-medium'>
                <span className='flex items-center gap-1.5'>
                  <Truck className='w-4 h-4 text-emerald-600' /> Express Islandwide Delivery
                </span>
                <span className='font-bold uppercase text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded'>
                  Free
                </span>
              </div>

              {/* Subtotal & Total */}
              <div className='space-y-1.5'>
                <div className='flex items-center justify-between text-xs text-slate-500'>
                  <span>Subtotal</span>
                  <span className='font-semibold text-slate-700'>{formatPrice(cartTotal)}</span>
                </div>
                <div className='flex items-center justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200/60'>
                  <span>Estimated Total</span>
                  <span className='text-base text-blue-600 font-extrabold'>
                    {formatPrice(cartTotal)}
                  </span>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                type='button'
                onClick={() => {
                  alert(`Proceeding to checkout with ${cartCount} items totaling ${formatPrice(cartTotal)}.`);
                }}
                className='w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold py-3.5 rounded-2xl text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2'
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className='w-4 h-4' />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
