'use client';

import React, { useState, useMemo } from 'react';
import CustomerLayout from '@/components/layout/CustomerLayout';
import ProductCard from '@/components/ui/ProductCard';
import { mockCategories, mockProducts } from '@/data/mockCustomerData';
import {
  SlidersHorizontal,
  Search,
  ChevronDown,
  Sparkles,
  Grid,
  Check,
} from 'lucide-react';

export default function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState('ALL PRODUCT');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('NEWEST');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [priceRange, setPriceRange] = useState(500000);

  const brands = useMemo(() => {
    const unique = Array.from(new Set(mockProducts.map((p) => p.brand)));
    return ['ALL', ...unique];
  }, []);

  const filteredProducts = useMemo(() => {
    return mockProducts
      .filter((p) => {
        const matchCategory =
          selectedCategory === 'ALL PRODUCT' || p.category === selectedCategory;
        const matchSearch =
          !searchQuery.trim() ||
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.brand.toLowerCase().includes(searchQuery.toLowerCase());
        const matchBrand = selectedBrand === 'ALL' || p.brand === selectedBrand;
        const matchPrice = p.price <= priceRange;
        return matchCategory && matchSearch && matchBrand && matchPrice;
      })
      .sort((a, b) => {
        if (sortBy === 'PRICE_LOW') return a.price - b.price;
        if (sortBy === 'PRICE_HIGH') return b.price - a.price;
        if (sortBy === 'RATING') return b.rating - a.rating;
        return 0; // Default NEWEST
      });
  }, [selectedCategory, searchQuery, sortBy, selectedBrand, priceRange]);

  return (
    <CustomerLayout
      selectedCategory={selectedCategory}
      onSelectCategory={setSelectedCategory}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
    >
      <div className='max-w-[1440px] w-full mx-auto px-4 md:px-8 py-6 space-y-8'>
        
        {/* ======================================================== */}
        {/* 1. HEADER BANNER (Figma Desktop - 2)                     */}
        {/* ======================================================== */}
        <section className='relative overflow-hidden rounded-[32px] bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white p-8 md:p-12 shadow-xl shadow-blue-500/15'>
          <div className='absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none' />
          
          <div className='relative z-10 max-w-3xl space-y-3'>
            <div className='inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold text-blue-50'>
              <Sparkles className='w-3.5 h-3.5' />
              <span>Official Hardware Catalog</span>
            </div>
            
            <h1 className='text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight'>
              Explore All Products
            </h1>
            
            <p className='text-blue-100 text-xs sm:text-sm md:text-base leading-relaxed max-w-2xl'>
              Find genuine smartphones, laptops, audio gear, and authentic mobile accessories with official islandwide warranty.
            </p>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 2. CATEGORY PILLS ROW                                    */}
        {/* ======================================================== */}
        <div className='flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none'>
          {mockCategories.map((cat) => {
            const isActive = selectedCategory === cat.name;
            return (
              <button
                key={cat.id}
                type='button'
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-4 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all uppercase tracking-wider ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50'
                }`}
              >
                <span>{cat.name}</span>
                <span className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-500'
                }`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ======================================================== */}
        {/* 3. FILTER & SEARCH CONTROL BAR                           */}
        {/* ======================================================== */}
        <div className='bg-white rounded-2xl border border-slate-200/80 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm'>
          {/* Show Filters Button */}
          <button
            type='button'
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              showFiltersPanel
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <SlidersHorizontal className='w-4 h-4' />
            <span>SHOW FILTERS</span>
          </button>

          {/* Search Input & Sort Dropdown */}
          <div className='flex flex-1 max-w-xl items-center gap-3 w-full sm:w-auto'>
            {/* Search Input */}
            <div className='relative flex-1'>
              <input
                type='text'
                placeholder='Search Products in Catalog...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='w-full bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 py-2.5 pl-9 pr-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white transition-all'
              />
              <Search className='w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none' />
            </div>

            {/* Sort Dropdown */}
            <div className='relative flex-shrink-0'>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className='appearance-none bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 py-2.5 pl-3 pr-8 rounded-xl border border-slate-200 cursor-pointer focus:outline-none'
              >
                <option value='NEWEST'>NEWEST</option>
                <option value='PRICE_LOW'>PRICE: LOW TO HIGH</option>
                <option value='PRICE_HIGH'>PRICE: HIGH TO LOW</option>
                <option value='RATING'>HIGHEST RATED</option>
              </select>
              <ChevronDown className='w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none' />
            </div>
          </div>
        </div>

        {/* Collapsible Filter Panel */}
        {showFiltersPanel && (
          <div className='bg-white rounded-2xl border border-slate-200 p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-top-2'>
            {/* Brand Filter */}
            <div className='space-y-2'>
              <label className='text-xs font-bold text-slate-900 uppercase tracking-wider block'>
                Filter by Brand
              </label>
              <div className='flex flex-wrap gap-2'>
                {brands.map((brand) => (
                  <button
                    key={brand}
                    type='button'
                    onClick={() => setSelectedBrand(brand)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedBrand === brand
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter Slider */}
            <div className='space-y-2'>
              <div className='flex items-center justify-between text-xs font-bold text-slate-900'>
                <span className='uppercase tracking-wider'>Max Price:</span>
                <span className='text-blue-600'>Rs {priceRange.toLocaleString('en-LK')}.00</span>
              </div>
              <input
                type='range'
                min='15000'
                max='500000'
                step='5000'
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className='w-full accent-blue-600 cursor-pointer'
              />
              <div className='flex justify-between text-[10px] text-slate-400'>
                <span>Rs 15,000</span>
                <span>Rs 500,000</span>
              </div>
            </div>

            {/* Reset Filters */}
            <div className='flex items-end'>
              <button
                type='button'
                onClick={() => {
                  setSelectedCategory('ALL PRODUCT');
                  setSelectedBrand('ALL');
                  setPriceRange(500000);
                  setSearchQuery('');
                }}
                className='px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors'
              >
                Reset All Filters
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 4. PRODUCT CATALOG GRID (Desktop - 2)                    */}
        {/* ======================================================== */}
        <section className='space-y-6'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-semibold text-slate-500'>
              Showing <strong>{filteredProducts.length}</strong> items in catalog
            </span>
          </div>

          {filteredProducts.length > 0 ? (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className='bg-white rounded-3xl border border-slate-200 p-16 text-center max-w-md mx-auto space-y-3'>
              <div className='w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400'>
                <Grid className='w-6 h-6' />
              </div>
              <h3 className='text-base font-bold text-slate-900'>No Products Found</h3>
              <p className='text-xs text-slate-500 leading-relaxed'>
                We could not find any devices matching your exact filter criteria.
              </p>
              <button
                type='button'
                onClick={() => {
                  setSelectedCategory('ALL PRODUCT');
                  setSelectedBrand('ALL');
                  setPriceRange(500000);
                  setSearchQuery('');
                }}
                className='px-5 py-2.5 rounded-full bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors'
              >
                Reset Catalog
              </button>
            </div>
          )}
        </section>

      </div>
    </CustomerLayout>
  );
}
