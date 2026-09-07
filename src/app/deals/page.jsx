'use client';

import React, { useState, useEffect } from 'react';
import CustomerLayout from '@/components/layout/CustomerLayout';
import ProductCard from '@/components/ui/ProductCard';
import { mockProducts } from '@/data/mockCustomerData';
import {
  Flame,
  Clock,
  Zap,
  Tag,
  ShieldCheck,
  Truck,
} from 'lucide-react';

export default function DealsPage() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 9,
    minutes: 28,
    seconds: 5,
  });

  // Live ticking countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const dealProducts = mockProducts.filter((p) => p.isDeal || p.discountPercent >= 10);

  const formatDigits = (n) => String(n).padStart(2, '0');

  return (
    <CustomerLayout>
      <div className='max-w-[1440px] w-full mx-auto px-4 md:px-8 py-6 space-y-10'>
        
        {/* ======================================================== */}
        {/* 1. HEADER BANNER (Figma Desktop - 3)                     */}
        {/* ======================================================== */}
        <section className='relative overflow-hidden rounded-[32px] bg-gradient-to-r from-red-600 via-rose-600 to-indigo-800 text-white p-8 sm:p-10 md:p-14 shadow-xl shadow-red-500/15'>
          <div className='absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none' />
          
          <div className='relative z-10 max-w-3xl space-y-4'>
            {/* Pill Badge */}
            <div className='inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold text-white'>
              <Flame className='w-4 h-4 text-amber-300 fill-amber-300' />
              <span>Exclusive Promotions</span>
            </div>
            
            {/* Title */}
            <h1 className='text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight'>
              Mega Deals & Offers
            </h1>
            
            {/* Subtitle */}
            <p className='text-rose-100 text-xs sm:text-sm md:text-base leading-relaxed max-w-xl'>
              Grab these authentic tech products at unbeatable promotional prices before they run out!
            </p>

            {/* Real-time Countdown Timer Pills */}
            <div className='pt-3 flex flex-wrap items-center gap-3'>
              <span className='text-xs font-bold uppercase tracking-wider text-rose-100 flex items-center gap-1.5'>
                <Clock className='w-4 h-4 text-amber-300' /> Offers Expire In:
              </span>
              
              <div className='flex items-center gap-2 font-mono font-black text-sm text-white'>
                <div className='px-3 py-1.5 rounded-xl bg-black/40 border border-white/20 backdrop-blur-md flex items-center gap-1'>
                  <span className='text-base'>{formatDigits(timeLeft.hours)}</span>
                  <span className='text-[10px] text-rose-200 font-sans font-medium'>h</span>
                </div>
                <span>:</span>
                <div className='px-3 py-1.5 rounded-xl bg-black/40 border border-white/20 backdrop-blur-md flex items-center gap-1'>
                  <span className='text-base'>{formatDigits(timeLeft.minutes)}</span>
                  <span className='text-[10px] text-rose-200 font-sans font-medium'>m</span>
                </div>
                <span>:</span>
                <div className='px-3 py-1.5 rounded-xl bg-black/40 border border-white/20 backdrop-blur-md flex items-center gap-1'>
                  <span className='text-base text-amber-300'>{formatDigits(timeLeft.seconds)}</span>
                  <span className='text-[10px] text-rose-200 font-sans font-medium'>s</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 2. DEALS HIGHLIGHT VALUE ROW                             */}
        {/* ======================================================== */}
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
          <div className='p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-3.5'>
            <div className='w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0'>
              <Tag className='w-5 h-5' />
            </div>
            <div>
              <h3 className='text-xs font-bold text-slate-900'>Limited Stock Flash Deals</h3>
              <p className='text-[11px] text-slate-500'>Up to 20% off on flagship hardware</p>
            </div>
          </div>

          <div className='p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-3.5'>
            <div className='w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0'>
              <ShieldCheck className='w-5 h-5' />
            </div>
            <div>
              <h3 className='text-xs font-bold text-slate-900'>100% Genuine Warranty</h3>
              <p className='text-[11px] text-slate-500'>Direct company backed warranty included</p>
            </div>
          </div>

          <div className='p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-3.5'>
            <div className='w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0'>
              <Truck className='w-5 h-5' />
            </div>
            <div>
              <h3 className='text-xs font-bold text-slate-900'>Priority Islandwide Shipping</h3>
              <p className='text-[11px] text-slate-500'>Express 24-48 hour delivery</p>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. DEALS PRODUCT GRID (Desktop - 3)                      */}
        {/* ======================================================== */}
        <section className='space-y-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Zap className='w-5 h-5 text-red-600' />
              <h2 className='text-xl font-bold text-slate-900'>Featured Promotional Deals</h2>
            </div>
            <span className='text-xs text-slate-500 font-medium'>
              Showing {dealProducts.length} discounted offers
            </span>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
            {dealProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

      </div>
    </CustomerLayout>
  );
}
