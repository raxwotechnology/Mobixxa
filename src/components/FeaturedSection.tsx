'use client';

import { ArrowRight, Star, ShoppingCart, Heart } from 'lucide-react';

// ── Category data ──────────────────────────────────────────────────────────────

const categories = [
  { emoji: '📱', name: 'Smartphones', count: '240+ models', bg: 'bg-blue-50',   border: 'border-blue-100',   hover: 'hover:border-blue-300' },
  { emoji: '💻', name: 'Laptops',     count: '120+ models', bg: 'bg-violet-50', border: 'border-violet-100', hover: 'hover:border-violet-300' },
  { emoji: '🎧', name: 'Audio',       count: '85+ models',  bg: 'bg-cyan-50',   border: 'border-cyan-100',   hover: 'hover:border-cyan-300' },
  { emoji: '⌚', name: 'Wearables',   count: '60+ models',  bg: 'bg-rose-50',   border: 'border-rose-100',   hover: 'hover:border-rose-300' },
  { emoji: '🔌', name: 'Accessories', count: '300+ items',  bg: 'bg-amber-50',  border: 'border-amber-100',  hover: 'hover:border-amber-300' },
  { emoji: '🖥️', name: 'Displays',    count: '40+ models',  bg: 'bg-emerald-50',border: 'border-emerald-100',hover: 'hover:border-emerald-300' },
];

// ── Featured products ──────────────────────────────────────────────────────────

const featuredProducts = [
  {
    id: 'fp-1',
    tag: 'Best Seller',
    tagColor: 'bg-blue-600',
    name: 'UltraPhone Pro Max',
    category: 'Smartphones',
    price: 'LKR 289,999',
    originalPrice: 'LKR 349,999',
    rating: 4.9,
    reviews: 2841,
    discount: '17% OFF',
    emoji: '📱',
  },
  {
    id: 'fp-2',
    tag: 'New Arrival',
    tagColor: 'bg-violet-600',
    name: 'AirBuds Studio Pro',
    category: 'Audio',
    price: 'LKR 89,999',
    originalPrice: 'LKR 109,999',
    rating: 4.8,
    reviews: 1203,
    discount: '18% OFF',
    emoji: '🎧',
  },
  {
    id: 'fp-3',
    tag: 'Hot Deal',
    tagColor: 'bg-rose-500',
    name: 'SmartWatch Series X',
    category: 'Wearables',
    price: 'LKR 129,500',
    originalPrice: 'LKR 169,999',
    rating: 4.7,
    reviews: 987,
    discount: '24% OFF',
    emoji: '⌚',
  },
  {
    id: 'fp-4',
    tag: "Editor's Pick",
    tagColor: 'bg-emerald-600',
    name: 'UltraBook Slim 15',
    category: 'Laptops',
    price: 'LKR 549,000',
    originalPrice: 'LKR 649,000',
    rating: 4.9,
    reviews: 652,
    discount: '15% OFF',
    emoji: '💻',
  },
];

// ── Product Card ───────────────────────────────────────────────────────────────

function ProductCard({ product }: { product: typeof featuredProducts[0] }) {
  return (
    <div
      id={product.id}
      className="group relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-slate-200/60 hover:border-blue-100 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden flex flex-col"
    >
      {/* Discount badge */}
      <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-blue-600 text-white text-[10px] font-bold">
        {product.discount}
      </div>

      {/* Wishlist */}
      <button className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-100 shadow-sm hover:bg-rose-50 hover:border-rose-200 text-slate-400 hover:text-rose-500 transition-all duration-200">
        <Heart size={14} />
      </button>

      {/* Product image */}
      <div className="relative h-44 bg-slate-50 flex items-center justify-center overflow-hidden">
        <span className="text-6xl select-none transition-transform duration-300 group-hover:scale-110">
          {product.emoji}
        </span>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className={`inline-block px-2 py-0.5 rounded-full text-white text-[10px] font-bold ${product.tagColor}`}>
            {product.tag}
          </span>
          <span className="text-slate-400 text-[11px]">{product.category}</span>
        </div>

        <h3 className="font-bold text-slate-900 text-sm mb-2 leading-snug">{product.name}</h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i} size={11}
              fill={i < Math.floor(product.rating) ? '#F59E0B' : 'none'}
              className={i < Math.floor(product.rating) ? 'text-amber-400' : 'text-slate-200'}
            />
          ))}
          <span className="text-[11px] font-semibold text-slate-600 ml-0.5">{product.rating}</span>
          <span className="text-[11px] text-slate-400">({product.reviews.toLocaleString()})</span>
        </div>

        {/* Price + Cart */}
        <div className="flex items-end justify-between mt-auto">
          <div>
            <p className="text-[11px] text-slate-400 line-through">{product.originalPrice}</p>
            <p className="text-base font-extrabold text-slate-900">{product.price}</p>
          </div>
          <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm hover:shadow-blue-300/60">
            <ShoppingCart size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function FeaturedSection() {
  return (
    <>
      {/* ── Explore Categories ── */}
      <section className="w-full bg-slate-50 py-12 lg:py-16">
        <div className="w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32">
          <div className="flex items-center justify-between mb-7">
            <div>
              <p className="text-xs font-bold tracking-widest text-blue-600 uppercase mb-1">Shop by Type</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Explore Categories</h2>
            </div>
            <a href="/shop" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-200">
              All Categories <ArrowRight size={15} />
            </a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 w-full">
            {categories.map(({ emoji, name, count, bg, border, hover }) => (
              <a
                key={name}
                href="/shop"
                className={`flex flex-col items-center gap-3 p-5 rounded-2xl ${bg} border ${border} ${hover} hover:scale-[1.04] hover:shadow-md transition-all duration-200 cursor-pointer group`}
              >
                <span className="text-4xl group-hover:scale-110 transition-transform duration-200 select-none">{emoji}</span>
                <div className="text-center">
                  <p className="font-bold text-slate-800 text-base">{name}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{count}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Products ── */}
      <section className="w-full bg-white py-12 lg:py-16">
        <div className="w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32">
          <div className="flex items-center justify-between mb-7">
            <div>
              <p className="text-xs font-bold tracking-widest text-blue-600 uppercase mb-1">Handpicked for You</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Featured Products</h2>
            </div>
            <a href="/shop" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-200">
              View All <ArrowRight size={15} />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8 w-full">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
