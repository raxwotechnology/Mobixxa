'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  MapPin,
  Phone,
  Clock,
} from 'lucide-react';
import { mockStoreInfo } from '@/data/mockCustomerData';

export default function CustomerFooter() {
  return (
    <footer className='bg-navy-950 text-slate-300 pt-12 pb-8 border-t border-slate-800' suppressHydrationWarning>
      <div className='max-w-[1440px] w-full mx-auto px-4 md:px-8'>
        {/* Service Badges / Value Propositions */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-12 border-b border-slate-800/80'>
          <div className='flex items-start gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800'>
            <div className='p-2.5 rounded-lg bg-brand-600/20 text-brand-400 flex-shrink-0'>
              <ShieldCheck className='w-6 h-6' />
            </div>
            <div>
              <h4 className='text-sm font-semibold text-white'>100% Genuine Warranty</h4>
              <p className='text-xs text-slate-400 mt-1'>Direct brand warranty & official Mobixa guarantee.</p>
            </div>
          </div>

          <div className='flex items-start gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800'>
            <div className='p-2.5 rounded-lg bg-emerald-600/20 text-emerald-400 flex-shrink-0'>
              <Truck className='w-6 h-6' />
            </div>
            <div>
              <h4 className='text-sm font-semibold text-white'>Express Islandwide Delivery</h4>
              <p className='text-xs text-slate-400 mt-1'>Safe doorstep delivery across all provinces.</p>
            </div>
          </div>

          <div className='flex items-start gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800'>
            <div className='p-2.5 rounded-lg bg-amber-600/20 text-amber-400 flex-shrink-0'>
              <RotateCcw className='w-6 h-6' />
            </div>
            <div>
              <h4 className='text-sm font-semibold text-white'>7 Days Easy Replacement</h4>
              <p className='text-xs text-slate-400 mt-1'>Hassle-free replacement for any manufacturer defect.</p>
            </div>
          </div>

          <div className='flex items-start gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800'>
            <div className='p-2.5 rounded-lg bg-purple-600/20 text-purple-400 flex-shrink-0'>
              <Headphones className='w-6 h-6' />
            </div>
            <div>
              <h4 className='text-sm font-semibold text-white'>Dedicated Tech Support</h4>
              <p className='text-xs text-slate-400 mt-1'>Expert guidance for device setup & repair queries.</p>
            </div>
          </div>
        </div>

        {/* Links & Information Columns */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 py-10'>
          {/* Brand & About Column */}
          <div className='lg:col-span-2 space-y-4'>
            <div className='flex items-center gap-2'>
              <div className='w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-base'>
                M
              </div>
              <span className='text-lg font-bold text-white tracking-tight'>
                MOBI<span className='text-brand-400'>XA</span>
              </span>
            </div>
            <p className='text-xs text-slate-400 leading-relaxed max-w-sm'>
              Mobixa is Sri Lanka's leading smartphone, tech accessories, and repair service retailer. Committed to offering 100% genuine products at competitive market rates.
            </p>
            <div className='pt-2 flex flex-col gap-2 text-xs text-slate-400'>
              <div className='flex items-center gap-2'>
                <MapPin className='w-4 h-4 text-brand-400 flex-shrink-0' />
                <span>{mockStoreInfo.address}</span>
              </div>
              <div className='flex items-center gap-2'>
                <Phone className='w-4 h-4 text-brand-400 flex-shrink-0' />
                <span>Hotline: {mockStoreInfo.hotline} / {mockStoreInfo.phone}</span>
              </div>
              <div className='flex items-center gap-2'>
                <Clock className='w-4 h-4 text-brand-400 flex-shrink-0' />
                <span>{mockStoreInfo.hours}</span>
              </div>
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <h5 className='text-sm font-semibold text-white uppercase tracking-wider mb-4'>Categories</h5>
            <ul className='space-y-2 text-xs text-slate-400'>
              <li><Link href='#smartphones' className='hover:text-brand-400 transition-colors'>Smartphones</Link></li>
              <li><Link href='#chargers' className='hover:text-brand-400 transition-colors'>GaN & Fast Chargers</Link></li>
              <li><Link href='#audio' className='hover:text-brand-400 transition-colors'>AirPods & Earbuds</Link></li>
              <li><Link href='#smartwatches' className='hover:text-brand-400 transition-colors'>Smartwatches & Bands</Link></li>
              <li><Link href='#cases' className='hover:text-brand-400 transition-colors'>Cases & Protectors</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h5 className='text-sm font-semibold text-white uppercase tracking-wider mb-4'>Customer Care</h5>
            <ul className='space-y-2 text-xs text-slate-400'>
              <li><Link href='#track' className='hover:text-brand-400 transition-colors'>Track Order</Link></li>
              <li><Link href='#warranty' className='hover:text-brand-400 transition-colors'>Warranty Policy</Link></li>
              <li><Link href='#repairs' className='hover:text-brand-400 transition-colors'>Repair Status Inquiry</Link></li>
              <li><Link href='#terms' className='hover:text-brand-400 transition-colors'>Terms & Conditions</Link></li>
              <li><Link href='#faq' className='hover:text-brand-400 transition-colors'>Frequently Asked Questions</Link></li>
            </ul>
          </div>

          {/* Newsletter / Stay Connected */}
          <div>
            <h5 className='text-sm font-semibold text-white uppercase tracking-wider mb-4'>Get Weekly Deals</h5>
            <p className='text-xs text-slate-400 mb-3'>
              Subscribe to get notified about flash sales and price drops.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className='flex flex-col gap-2'>
              <input
                type='email'
                placeholder='Enter your email...'
                suppressHydrationWarning
                className='bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500'
              />
              <button
                type='submit'
                suppressHydrationWarning
                className='w-full bg-brand-600 hover:bg-brand-500 text-white font-medium py-2 rounded-lg text-xs transition-colors'
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Copyright & Payment Info */}
        <div className='border-t border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500'>
          <p suppressHydrationWarning>© 2026 Mobixa Store. All rights reserved.</p>
          <div className='flex items-center gap-3'>
            <span className='text-[11px] text-slate-400'>Secure Payments:</span>
            <span className='px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-medium'>Visa / Mastercard</span>
            <span className='px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-medium'>Koko Pay</span>
            <span className='px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-medium'>Bank Transfer</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
