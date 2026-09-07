'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import CustomerLayout from '@/components/layout/CustomerLayout';
import { mockStores } from '@/data/mockCustomerData';
import {
  MapPin,
  Clock,
  Phone,
  Search,
  Building2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export default function StoresPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('ALL CITIES');

  const filteredStores = mockStores.filter((store) => {
    const matchSearch =
      !searchQuery.trim() ||
      store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });

  return (
    <CustomerLayout>
      <div className='max-w-[1440px] w-full mx-auto px-4 md:px-8 py-6 space-y-10'>
        
        {/* ======================================================== */}
        {/* 1. HEADER BANNER (Figma Desktop - 4)                     */}
        {/* ======================================================== */}
        <section className='relative overflow-hidden rounded-[32px] bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-800 text-white p-8 sm:p-10 md:p-14 shadow-xl shadow-blue-500/15'>
          <div className='absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none' />
          
          <div className='relative z-10 max-w-3xl space-y-3'>
            {/* Pill Badge */}
            <div className='inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold text-blue-50'>
              <Building2 className='w-3.5 h-3.5' />
              <span>Official Flagship Boutiques</span>
            </div>
            
            {/* Title */}
            <h1 className='text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight'>
              Our Stores & Showrooms
            </h1>
            
            {/* Subtitle */}
            <p className='text-blue-100 text-xs sm:text-sm md:text-base leading-relaxed max-w-xl'>
              Visit our tech showrooms across Sri Lanka to experience hands-on product demos and expert technical service.
            </p>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 2. SEARCH & CITY FILTER BAR                              */}
        {/* ======================================================== */}
        <div className='flex flex-col sm:flex-row items-center gap-3 bg-white rounded-2xl border border-slate-200/80 p-3 shadow-sm'>
          {/* Search Input */}
          <div className='relative flex-1 w-full'>
            <input
              type='text'
              placeholder='Search Stores By City Or Branch Name...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 py-3 pl-10 pr-4 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white transition-all'
            />
            <Search className='w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none' />
          </div>

          {/* Action Pills */}
          <div className='flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0'>
            <button
              type='button'
              onClick={() => {
                setSelectedCity('ALL CITIES');
                setSearchQuery('');
              }}
              className='px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold whitespace-nowrap shadow-sm'
            >
              ALL CITIES ({mockStores.length})
            </button>
            <Link
              href='/deals'
              className='px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5'
            >
              <Sparkles className='w-3.5 h-3.5' />
              <span>Tech Deals</span>
            </Link>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. SHOWROOM CARDS GRID (2 Columns Matching Desktop-4)    */}
        {/* ======================================================== */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {filteredStores.map((store) => (
            <div
              key={store.id}
              className='bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-card-hover hover:border-blue-200 transition-all flex flex-col justify-between group'
            >
              {/* Showroom Photo Container */}
              <div className='relative w-full h-64 sm:h-72 overflow-hidden bg-slate-100'>
                <Image
                  src={store.image}
                  alt={store.name}
                  fill
                  sizes='(max-width: 1024px) 100vw, 50vw'
                  className='object-cover transform group-hover:scale-105 transition-transform duration-700'
                />
                
                {/* Gradient overlay for readability */}
                <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent' />

                {/* Top Status Badge */}
                <div className='absolute top-4 left-4 z-10'>
                  <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-md'>
                    <span className='w-2 h-2 rounded-full bg-white animate-pulse' />
                    {store.status}
                  </span>
                </div>

                {/* Bottom Overlay Title */}
                <div className='absolute bottom-4 left-4 right-4 z-10 text-white'>
                  <h2 className='text-2xl font-black tracking-tight'>{store.name}</h2>
                  <p className='text-xs text-slate-200 mt-0.5'>{store.city} Flagship Boutique</p>
                </div>
              </div>

              {/* Showroom Information */}
              <div className='p-6 space-y-4 flex-1 flex flex-col justify-between'>
                <div className='space-y-3'>
                  {/* Address Row */}
                  <div className='flex items-start gap-3 text-xs text-slate-700'>
                    <div className='p-2 rounded-xl bg-blue-50 text-blue-600 flex-shrink-0 mt-0.5'>
                      <MapPin className='w-4 h-4' />
                    </div>
                    <div>
                      <span className='font-bold block text-slate-900'>Location / Address</span>
                      <span className='text-slate-500 mt-0.5 block'>{store.address}</span>
                    </div>
                  </div>

                  {/* Timings & Phone Row */}
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1'>
                    <div className='flex items-center gap-2.5 text-xs text-slate-700'>
                      <Clock className='w-4 h-4 text-blue-600 flex-shrink-0' />
                      <span className='text-slate-600 font-medium'>{store.hours}</span>
                    </div>
                    <div className='flex items-center gap-2.5 text-xs text-slate-700'>
                      <Phone className='w-4 h-4 text-blue-600 flex-shrink-0' />
                      <a href={`tel:${store.phone}`} className='text-blue-600 font-bold hover:underline'>
                        {store.phone}
                      </a>
                    </div>
                  </div>

                  {/* Highlights / Features */}
                  {store.features && (
                    <div className='pt-2 border-t border-slate-100 flex flex-wrap gap-2'>
                      {store.features.map((feat, fIdx) => (
                        <span
                          key={fIdx}
                          className='inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 text-[11px] font-medium text-slate-600'
                        >
                          <CheckCircle2 className='w-3 h-3 text-emerald-500' />
                          <span>{feat}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Explore Branch CTA */}
                <div className='pt-4 border-t border-slate-100'>
                  <Link
                    href='/shop'
                    className='w-full py-3.5 px-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all hover:gap-3'
                  >
                    <span>EXPLORE BRANCH CATALOG</span>
                    <ArrowRight className='w-4 h-4' />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </CustomerLayout>
  );
}
