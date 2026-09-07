'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Bookmark, Check, Star, Zap } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function ProductCard({ product, showSwatches = true, onAddToCart }) {
  const [isAdded, setIsAdded] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const { addToCart } = useCart();

  const {
    id,
    name,
    brand,
    price,
    originalPrice,
    discountPercent,
    dealDiscount,
    isDeal,
    rating = 4.8,
    reviewCount = 0,
    inStock = true,
    thumbnail,
    gallery = [],
    colors = [],
    storageOptions = [],
  } = product;

  const displayImages = gallery && gallery.length > 0 ? gallery : [thumbnail];

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock) return;
    
    setIsAdded(true);
    addToCart(product, 1, { openDrawer: true });

    if (onAddToCart) {
      onAddToCart(product);
    }
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  const handleBookmark = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
  };

  const formatPrice = (amount) => {
    return 'Rs ' + amount.toLocaleString('en-LK') + '.00';
  };

  return (
    <div className='group relative flex flex-col justify-between bg-white rounded-2xl border border-slate-200/80 hover:border-blue-300 hover:shadow-card-hover transition-all duration-300 overflow-hidden'>
      {/* Top Action Icons & Badges */}
      <div className='absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none'>
        {/* Deal / Discount Badge */}
        {dealDiscount || discountPercent > 0 ? (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-sm pointer-events-auto ${
            isDeal ? 'bg-red-600' : 'bg-amber-500'
          }`}>
            <Zap className='w-3 h-3 fill-current' />
            {dealDiscount || `-${discountPercent}% OFF`}
          </span>
        ) : <div />}

        {/* Action icons (Bookmark & Shopping Bag) */}
        <div className='flex items-center gap-1.5 pointer-events-auto'>
          <button
            type='button'
            onClick={handleBookmark}
            className={`p-2 rounded-full backdrop-blur-md transition-all ${
              isBookmarked
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white/80 text-slate-600 hover:bg-white hover:text-blue-600 shadow-sm'
            }`}
            aria-label='Save to Wishlist'
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>

          <button
            type='button'
            onClick={handleAdd}
            disabled={!inStock}
            className={`p-2 rounded-full backdrop-blur-md transition-all ${
              !inStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : isAdded
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white/80 text-slate-700 hover:bg-blue-600 hover:text-white shadow-sm'
            }`}
            aria-label='Add to Bag'
          >
            {isAdded ? (
              <Check className='w-4 h-4 animate-bounce' />
            ) : (
              <ShoppingBag className='w-4 h-4' />
            )}
          </button>
        </div>
      </div>

      {/* Product Image & Carousel Preview */}
      <Link
        href={`/product/${id}`}
        className='relative w-full aspect-[4/3] bg-gradient-to-b from-slate-50 to-slate-100/50 flex flex-col items-center justify-center p-6 overflow-hidden'
      >
        <div className='relative w-full h-full transform transition-transform duration-500 group-hover:scale-105'>
          <Image
            src={displayImages[activeImgIdx] || thumbnail}
            alt={name}
            fill
            sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw'
            className='object-contain p-2 drop-shadow-sm'
            loading='lazy'
          />
        </div>

        {/* Carousel Dots Preview */}
        {displayImages.length > 1 && (
          <div className='absolute bottom-2 flex items-center gap-1.5 z-10'>
            {displayImages.slice(0, 4).map((_, idx) => (
              <span
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  activeImgIdx === idx ? 'w-4 bg-blue-600' : 'bg-slate-300'
                }`}
              />
            ))}
          </div>
        )}
      </Link>

      {/* Card Details */}
      <div className='flex flex-col flex-1 p-4.5'>
        {/* Brand & Stock */}
        <div className='flex items-center justify-between gap-2 mb-1.5'>
          <span className='text-[10px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded'>
            {brand}
          </span>
          <div className='flex items-center gap-1 text-xs font-semibold text-slate-700'>
            <Star className='w-3.5 h-3.5 fill-amber-400 text-amber-400' />
            <span>{rating}</span>
            {reviewCount > 0 && (
              <span className='text-slate-400 text-[10px] font-normal'>({reviewCount})</span>
            )}
          </div>
        </div>

        {/* Product Title */}
        <Link href={`/product/${id}`}>
          <h3 className='font-bold text-slate-900 text-sm line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors mb-2'>
            {name}
          </h3>
        </Link>

        {/* Price Row: "From Rs XXX,XXX.00" */}
        <div className='mt-auto pt-2 border-t border-slate-100 flex items-baseline justify-between'>
          <div>
            <span className='text-[11px] text-slate-400 block font-medium'>From</span>
            <div className='text-base font-extrabold text-slate-950 tracking-tight'>
              {formatPrice(price)}
            </div>
          </div>
          {originalPrice && originalPrice > price && (
            <div className='text-xs text-slate-400 line-through font-medium'>
              {formatPrice(originalPrice)}
            </div>
          )}
        </div>

        {/* Color Swatches */}
        {showSwatches && colors && colors.length > 0 && (
          <div className='flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-50'>
            {colors.map((color, cIdx) => (
              <span
                key={cIdx}
                title={color.name}
                style={{ backgroundColor: color.hex }}
                className='w-3.5 h-3.5 rounded-full border border-slate-300/80 shadow-inner'
              />
            ))}
            <span className='text-[10px] text-slate-400 font-medium ml-1'>
              {colors.length} {colors.length === 1 ? 'color' : 'colors'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
