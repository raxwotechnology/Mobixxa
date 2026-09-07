'use client';

import React, { useState, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import CustomerLayout from '@/components/layout/CustomerLayout';
import ProductCard from '@/components/ui/ProductCard';
import { mockProducts } from '@/data/mockCustomerData';
import { useCart } from '@/context/CartContext';
import {
  ChevronRight,
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  ShoppingCart,
  Zap,
  Check,
  Minus,
  Plus,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Bookmark,
  Share2,
} from 'lucide-react';

export default function ProductDetailPage({ params }) {
  // Handle async unwrapping of params for Next.js 15
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const product = mockProducts.find((p) => p.id === productId);

  if (!product) {
    return (
      <CustomerLayout>
        <div className='max-w-[1440px] w-full mx-auto px-4 md:px-8 py-20 text-center space-y-4'>
          <div className='w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto'>
            <Zap className='w-8 h-8' />
          </div>
          <h1 className='text-2xl font-bold text-slate-900'>Product Not Found</h1>
          <p className='text-sm text-slate-500 max-w-md mx-auto'>
            The device or accessory you are looking for might have been moved, renamed, or is currently out of catalog.
          </p>
          <Link
            href='/shop'
            className='inline-flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600 text-white font-semibold text-xs shadow-md shadow-blue-500/25 hover:bg-blue-700 transition-all'
          >
            <ArrowLeft className='w-4 h-4' />
            <span>Back to Hardware Catalog</span>
          </Link>
        </div>
      </CustomerLayout>
    );
  }

  const { addToCart } = useCart();
  const galleryImages = product.gallery && product.gallery.length > 0
    ? product.gallery
    : [product.thumbnail];

  const colors = product.colors && product.colors.length > 0
    ? product.colors
    : [{ name: 'Default', hex: '#1e293b' }];

  const storageOptions = product.storageOptions && product.storageOptions.length > 0
    ? product.storageOptions
    : ['Standard Edition'];

  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState(colors[0].name);
  const [selectedStorage, setSelectedStorage] = useState(storageOptions[0]);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleAddToCart = (openDrawer = true) => {
    if (!product.inStock) return;
    setIsAdded(true);
    addToCart(product, quantity, {
      warranty: `${selectedColor} - ${selectedStorage}`,
      openDrawer,
    });
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  const handleBuyNow = () => {
    if (!product.inStock) return;
    addToCart(product, quantity, {
      warranty: `${selectedColor} - ${selectedStorage}`,
      openDrawer: true,
    });
  };

  const formatPrice = (amount) => {
    return 'Rs ' + amount.toLocaleString('en-LK') + '.00';
  };

  // Related products / "You may also like"
  const relatedProducts = mockProducts.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <CustomerLayout>
      <div className='max-w-[1440px] w-full mx-auto px-4 md:px-8 py-6 space-y-12'>
        
        {/* 1. Breadcrumb Bar */}
        <nav className='flex items-center gap-2 text-xs text-slate-500'>
          <Link href='/' className='hover:text-blue-600 transition-colors font-medium'>
            Home
          </Link>
          <ChevronRight className='w-3.5 h-3.5 text-slate-400' />
          <Link href='/shop' className='hover:text-blue-600 transition-colors capitalize font-medium'>
            Shop
          </Link>
          <ChevronRight className='w-3.5 h-3.5 text-slate-400' />
          <span className='text-slate-900 font-bold truncate max-w-xs md:max-w-md'>
            {product.name}
          </span>
        </nav>

        {/* ======================================================== */}
        {/* 2. TOP SECTION: 2 COLUMNS (Figma Desktop - 7)            */}
        {/* ======================================================== */}
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start'>
          
          {/* ================================================= */}
          {/* LEFT: Vertical Thumbnails + Large Active Preview  */}
          {/* ================================================= */}
          <div className='lg:col-span-6 flex flex-col sm:flex-row gap-4'>
            {/* Vertical Thumbnail Strip (Desktop) */}
            {galleryImages.length > 1 && (
              <div className='flex sm:flex-col gap-2.5 order-2 sm:order-1 overflow-x-auto sm:overflow-y-auto max-h-[500px] scrollbar-none'>
                {galleryImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type='button'
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`relative w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-white border p-1.5 flex-shrink-0 transition-all overflow-hidden ${
                      selectedImageIdx === idx
                        ? 'border-blue-600 ring-2 ring-blue-500/25 shadow-md scale-105'
                        : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={imgUrl}
                      alt={`${product.name} view ${idx + 1}`}
                      fill
                      sizes='80px'
                      className='object-contain p-1'
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Large Active Preview Card */}
            <div className='relative flex-1 aspect-square rounded-[32px] bg-white border border-slate-200/80 p-8 shadow-sm flex items-center justify-center overflow-hidden order-1 sm:order-2 group'>
              {/* Deal / Discount Badge */}
              <div className='absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none'>
                {product.dealDiscount && (
                  <span className='inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white shadow-sm'>
                    <Zap className='w-3.5 h-3.5 fill-current' />
                    {product.dealDiscount}
                  </span>
                )}
                {product.inStock ? (
                  <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200'>
                    <span className='w-2 h-2 rounded-full bg-emerald-500 animate-pulse' />
                    In Stock ({product.stockCount} units left)
                  </span>
                ) : (
                  <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200'>
                    Out of Stock
                  </span>
                )}
              </div>

              {/* Top Right Wishlist & Share */}
              <div className='absolute top-4 right-4 z-10 flex items-center gap-2'>
                <button
                  type='button'
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  className={`p-2.5 rounded-full backdrop-blur-md transition-all ${
                    isBookmarked
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                  aria-label='Save to Wishlist'
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Main Image */}
              <div className='relative w-full h-full transform group-hover:scale-105 transition-transform duration-500'>
                <Image
                  src={galleryImages[selectedImageIdx]}
                  alt={product.name}
                  fill
                  priority
                  sizes='(max-width: 1024px) 100vw, 50vw'
                  className='object-contain p-4 drop-shadow-md'
                />
              </div>
            </div>
          </div>

          {/* ================================================= */}
          {/* RIGHT: Brand, Title, Price, Color, Storage, CTAs  */}
          {/* ================================================= */}
          <div className='lg:col-span-6 space-y-6'>
            {/* Brand Logo / Tag & Rating */}
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100'>
                  {product.brand}
                </span>
                <div className='flex items-center gap-1.5 text-xs font-semibold text-slate-700'>
                  <Star className='w-4 h-4 fill-amber-400 text-amber-400' />
                  <span>{product.rating}</span>
                  <span className='text-slate-400 font-normal'>
                    ({product.reviewCount} verified reviews)
                  </span>
                </div>
              </div>

              <h1 className='text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-snug'>
                {product.name}
              </h1>

              {/* Price: "From Rs XXX,XXX.00" */}
              <div className='pt-2 flex items-baseline gap-3'>
                <div className='text-2xl sm:text-3xl font-black text-slate-950 tracking-tight'>
                  From {formatPrice(product.price)}
                </div>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className='text-sm text-slate-400 line-through font-medium'>
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>
            </div>

            {/* Color Selector Swatches (Desktop-7) */}
            {colors && colors.length > 0 && (
              <div className='space-y-2.5 pt-1 border-t border-slate-100'>
                <div className='flex items-center justify-between text-xs'>
                  <span className='font-bold uppercase tracking-wider text-slate-900'>
                    Color: <span className='text-blue-600 font-extrabold'>{selectedColor}</span>
                  </span>
                </div>

                <div className='flex items-center gap-3'>
                  {colors.map((color) => {
                    const isSelected = selectedColor === color.name;
                    return (
                      <button
                        key={color.name}
                        type='button'
                        onClick={() => setSelectedColor(color.name)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 text-slate-900 font-bold shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                        }`}
                      >
                        <span
                          style={{ backgroundColor: color.hex }}
                          className='w-3.5 h-3.5 rounded-full border border-slate-300/80'
                        />
                        <span>{color.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Storage Selection Pills */}
            {storageOptions && storageOptions.length > 0 && (
              <div className='space-y-2.5 pt-1'>
                <span className='text-xs font-bold uppercase tracking-wider text-slate-900 block'>
                  Storage Capacity:
                </span>
                <div className='flex flex-wrap gap-2.5'>
                  {storageOptions.map((opt) => {
                    const isSelected = selectedStorage === opt;
                    return (
                      <button
                        key={opt}
                        type='button'
                        onClick={() => setSelectedStorage(opt)}
                        className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector & Dual CTAs (Add to Cart / Buy it now) */}
            <div className='space-y-4 pt-2 border-t border-slate-100'>
              <div className='flex items-center gap-4'>
                <span className='text-xs font-bold text-slate-900 uppercase tracking-wider'>
                  Quantity:
                </span>
                <div className='flex items-center border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden'>
                  <button
                    type='button'
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || !product.inStock}
                    className='px-3 py-2 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors'
                  >
                    <Minus className='w-3.5 h-3.5' />
                  </button>
                  <span className='px-4 text-xs font-bold text-slate-900 select-none'>
                    {quantity}
                  </span>
                  <button
                    type='button'
                    onClick={() => setQuantity((q) => q + 1)}
                    disabled={!product.inStock}
                    className='px-3 py-2 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors'
                  >
                    <Plus className='w-3.5 h-3.5' />
                  </button>
                </div>
              </div>

              {/* Action Buttons Matching Figma Desktop-7 */}
              <div className='space-y-3 pt-2'>
                <button
                  type='button'
                  onClick={() => handleAddToCart(true)}
                  disabled={!product.inStock}
                  className={`w-full py-4 px-6 rounded-full font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg ${
                    !product.inStock
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : isAdded
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                      : 'bg-[#0B0F19] hover:bg-black text-white active:scale-98 shadow-black/20'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className='w-4 h-4 animate-bounce' />
                      <span>ADDED TO SHOPPING BAG</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className='w-4 h-4' />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>

                <button
                  type='button'
                  onClick={handleBuyNow}
                  disabled={!product.inStock}
                  className={`w-full py-4 px-6 rounded-full font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-2 ${
                    !product.inStock
                      ? 'border-slate-200 text-slate-400 cursor-not-allowed'
                      : 'border-slate-900 text-slate-900 bg-white hover:bg-slate-50 active:scale-98'
                  }`}
                >
                  <span>Buy it now</span>
                  <Zap className='w-4 h-4 text-blue-600' />
                </button>
              </div>
            </div>

            {/* Description & Key Features Bullet List */}
            <div className='pt-4 border-t border-slate-100 space-y-3'>
              <h3 className='text-xs font-bold uppercase tracking-wider text-slate-900'>
                Product Overview
              </h3>
              <p className='text-xs text-slate-600 leading-relaxed'>
                {product.shortDescription}
              </p>

              {product.features && (
                <ul className='space-y-2 pt-2'>
                  {product.features.map((feature, fIdx) => (
                    <li key={fIdx} className='flex items-start gap-2.5 text-xs text-slate-700'>
                      <CheckCircle2 className='w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5' />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. TECHNICAL SPECIFICATIONS TABLE                         */}
        {/* ========================================================= */}
        {product.detailedSpecs && (
          <section className='pt-8 border-t border-slate-200 space-y-6'>
            <div>
              <h2 className='text-xl font-bold text-slate-900'>Technical Specifications</h2>
              <p className='text-xs text-slate-500 mt-0.5'>Detailed hardware specifications and verified capabilities.</p>
            </div>

            <div className='bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm'>
              <div className='divide-y divide-slate-100'>
                {Object.entries(product.detailedSpecs).map(([specKey, specVal], idx) => (
                  <div
                    key={specKey}
                    className={`grid grid-cols-1 sm:grid-cols-12 p-4 text-xs ${
                      idx % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'
                    }`}
                  >
                    <span className='sm:col-span-4 font-bold text-slate-900'>{specKey}</span>
                    <span className='sm:col-span-8 text-slate-600 mt-1 sm:mt-0 leading-relaxed'>
                      {specVal}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* 4. "YOU MAY ALSO LIKE" SECTION (Figma Desktop - 7)        */}
        {/* ========================================================= */}
        <section className='pt-8 border-t border-slate-200 space-y-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-xl font-bold text-slate-900'>You May Also Like</h2>
              <p className='text-xs text-slate-500 mt-0.5'>Explore matching smartphones, audio, and mobile accessories.</p>
            </div>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
            {relatedProducts.map((relProduct) => (
              <ProductCard key={relProduct.id} product={relProduct} />
            ))}
          </div>
        </section>

      </div>
    </CustomerLayout>
  );
}
