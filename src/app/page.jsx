'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import CustomerLayout from '@/components/layout/CustomerLayout';
import ProductCard from '@/components/ui/ProductCard';
import { mockCategories, mockProducts } from '@/data/mockCustomerData';
import {
  ArrowRight,
  Truck,
  Clock,
  ShieldCheck,
  Cpu,
  TrendingUp,
  Smartphone,
  Zap,
  Headphones,
  Watch,
  Grid,
} from 'lucide-react';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState([]);

  const handleAddToCart = (product) => {
    setCartItems((prev) => [...prev, product]);
  };

  const filteredProducts = useMemo(() => {
    return mockProducts.filter((p) => {
      const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const matchSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  const getCategoryIcon = (iconName) => {
    switch (iconName) {
      case 'Smartphone':
        return <Smartphone className='w-4 h-4' />;
      case 'Zap':
        return <Zap className='w-4 h-4' />;
      case 'Headphones':
        return <Headphones className='w-4 h-4' />;
      case 'Watch':
        return <Watch className='w-4 h-4' />;
      default:
        return <Grid className='w-4 h-4' />;
    }
  };

  return (
    <CustomerLayout
      cartCount={cartItems.length}
      onOpenCart={() => alert(`Cart contains ${cartItems.length} item(s)`)}
      selectedCategory={selectedCategory}
      onSelectCategory={setSelectedCategory}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
    >
      <div className='max-w-[1440px] w-full mx-auto px-4 md:px-8 py-6 space-y-10'>
        
        {/* ======================================================== */}
        {/* 1. HERO BANNER: Outer Glow & Vibrant Royal Blue Card     */}
        {/* ======================================================== */}
        <section className='p-2 rounded-[38px] bg-blue-500/15 border border-blue-400/30 backdrop-blur-sm shadow-2xl'>
          <div className='bg-gradient-to-r from-blue-600 via-blue-600 to-[#1d58d8] text-white rounded-[32px] p-8 md:p-14 relative overflow-hidden'>
            {/* Ambient Lighting Gradients */}
            <div className='absolute -top-24 -right-24 w-[450px] h-[450px] bg-white/10 rounded-full blur-3xl pointer-events-none' />
            <div className='absolute -bottom-24 left-1/3 w-[350px] h-[350px] bg-blue-400/20 rounded-full blur-3xl pointer-events-none' />

            <div className='relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center'>
              {/* Left Column: Typography & CTAs */}
              <div className='lg:col-span-7 flex flex-col justify-center'>
                {/* Pill Badge */}
                <div className='px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold tracking-wide text-blue-50 w-fit mb-3'>
                  # Next-Gen Technology
                </div>

                {/* Subtitle */}
                <div className='text-sm font-medium text-blue-100 mb-1 tracking-wide'>
                  Welcome to
                </div>

                {/* Big Bold Heading */}
                <h1 className='text-4xl sm:text-5xl lg:text-[56px] font-black tracking-tight leading-[1.08] text-white'>
                  Mobixa<br />
                  Premium Tech &<br />
                  <span className='text-blue-100'>SmartDevices.</span>
                </h1>

                {/* Description */}
                <p className='text-blue-100/90 text-sm sm:text-base max-w-xl leading-relaxed mt-4 mb-6'>
                  Discover the latest smartphones, powerful laptops, immersive audio, and premium accessories curated for modern lifestyles. Upgrade your tech today.
                </p>

                {/* Action Buttons */}
                <div className='flex flex-wrap items-center gap-3.5'>
                  <a
                    href='#products'
                    className='bg-[#0B0F19] hover:bg-black text-white px-7 py-3 rounded-full text-sm font-semibold inline-flex items-center gap-2 shadow-lg transition-transform hover:scale-105'
                  >
                    <span>Shop Now</span>
                    <ArrowRight className='w-4 h-4' />
                  </a>
                  <a
                    href='#deals'
                    className='bg-white/15 hover:bg-white/25 border border-white/30 text-white px-7 py-3 rounded-full text-sm font-semibold backdrop-blur-md transition-colors'
                  >
                    Tech Deals
                  </a>
                </div>
              </div>

              {/* Right Column: Transparent Tech Devices Graphic (No Box/Dark Container) */}
              <div className='lg:col-span-5 flex items-center justify-center lg:justify-end'>
                <div className='relative w-full h-[340px] sm:h-[400px] md:h-[460px] flex items-center justify-center lg:justify-end'>
                  <Image
                    src='https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=1000&auto=format&fit=crop&q=85'
                    alt='Mobixa Flagship Smart Devices'
                    fill
                    priority
                    sizes='(max-width: 1024px) 100vw, 50vw'
                    className='object-contain drop-shadow-[0_25px_35px_rgba(0,0,0,0.35)] transform hover:scale-105 transition-transform duration-500'
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 2. BOTTOM 4 FEATURE CARDS ROW (Exact Figma Specs)       */}
        {/* ======================================================== */}
        <section className='grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6'>
          {/* Feature 1: Free Shipping */}
          <div className='bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3.5 shadow-sm hover:shadow-md transition-shadow'>
            <div className='w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0'>
              <Truck className='w-5 h-5' />
            </div>
            <div>
              <h3 className='text-sm font-bold text-slate-900'>Free Shipping</h3>
              <p className='text-xs text-slate-500'>On all devices islandwide</p>
            </div>
          </div>

          {/* Feature 2: Fast Dispatch */}
          <div className='bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3.5 shadow-sm hover:shadow-md transition-shadow'>
            <div className='w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0'>
              <Clock className='w-5 h-5' />
            </div>
            <div>
              <h3 className='text-sm font-bold text-slate-900'>Fast Dispatch</h3>
              <p className='text-xs text-slate-500'>Packed in 24 hours</p>
            </div>
          </div>

          {/* Feature 3: Official Warranty */}
          <div className='bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3.5 shadow-sm hover:shadow-md transition-shadow'>
            <div className='w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0'>
              <ShieldCheck className='w-5 h-5' />
            </div>
            <div>
              <h3 className='text-sm font-bold text-slate-900'>Official Warranty</h3>
              <p className='text-xs text-slate-500'>Guaranteed 100% genuine</p>
            </div>
          </div>

          {/* Feature 4: Latest Tech */}
          <div className='bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3.5 shadow-sm hover:shadow-md transition-shadow'>
            <div className='w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0'>
              <Cpu className='w-5 h-5' />
            </div>
            <div>
              <h3 className='text-sm font-bold text-slate-900'>Latest Tech</h3>
              <p className='text-xs text-slate-500'>Curated top-tier brands</p>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 3. CATEGORY FILTER SECTION                               */}
        {/* ======================================================== */}
        <section className='space-y-4 pt-2'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <TrendingUp className='w-5 h-5 text-blue-600' />
              <h2 className='text-lg font-bold text-slate-900'>Browse by Category</h2>
            </div>
            {selectedCategory !== 'all' && (
              <button
                onClick={() => setSelectedCategory('all')}
                className='text-xs font-semibold text-blue-600 hover:underline'
              >
                Reset to All
              </button>
            )}
          </div>

          <div className='flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none'>
            {mockCategories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    isActive
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
                  }`}
                >
                  <span className={isActive ? 'text-blue-400' : 'text-slate-500'}>
                    {getCategoryIcon(cat.icon)}
                  </span>
                  <span>{cat.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ======================================================== */}
        {/* 4. PRODUCT GRID SECTION                                  */}
        {/* ======================================================== */}
        <section id='products' className='space-y-6 pt-2'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-xl font-bold text-slate-900'>Featured Products</h2>
              <p className='text-xs text-slate-500 mt-0.5'>
                Showing {filteredProducts.length} product(s)
                {searchQuery ? ` matching "${searchQuery}"` : ''}
              </p>
            </div>
          </div>

          {filteredProducts.length > 0 ? (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          ) : (
            <div className='bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3'>
              <div className='w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400'>
                <Grid className='w-6 h-6' />
              </div>
              <h3 className='text-base font-bold text-slate-900'>No products found</h3>
              <p className='text-xs text-slate-500'>
                No matching devices or accessories found for your query. Try searching with different keywords.
              </p>
              <button
                type='button'
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className='px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition-colors'
              >
                Clear Filters
              </button>
            </div>
          )}
        </section>
      </div>
    </CustomerLayout>
  );
}
