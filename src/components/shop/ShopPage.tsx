'use client';

import { useState } from 'react';
import {
  SlidersHorizontal,
  Search,
  ChevronDown,
  ShoppingBag,
  Heart,
  Star,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// ── Data ──────────────────────────────────────────────────────────────────────

const categories = [
  'ALL PRODUCTS',
  'SMART PHONE',
  'TABLETS',
  'SMART WATCHES',
  'ACCESSORIES',
  'CHARGERS',
  'EARBUDS',
  'PHONE CASES',
  'LAPTOPS',
];

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  colors: string[];
  emoji: string;
  emojiAlt: string;
  badge?: string;
  badgeColor?: string;
  images: number; // number of carousel dots
}

const products: Product[] = [
  {
    id: 'pixel-10a',
    name: 'Pixel 10A',
    brand: 'Google',
    category: 'SMART PHONE',
    price: 189900,
    originalPrice: 219900,
    rating: 4.8,
    reviews: 1240,
    colors: ['#111827', '#6B7280', '#3B82F6', '#10B981'],
    emoji: '📱',
    emojiAlt: '📲',
    badge: 'Best Seller',
    badgeColor: 'bg-blue-600',
    images: 4,
  },
  {
    id: 'pixel-10',
    name: 'Pixel 10',
    brand: 'Google',
    category: 'SMART PHONE',
    price: 279900,
    originalPrice: 319900,
    rating: 4.9,
    reviews: 2350,
    colors: ['#0F172A', '#F8FAFC', '#9333EA', '#EC4899'],
    emoji: '📱',
    emojiAlt: '📱',
    badge: 'New Arrival',
    badgeColor: 'bg-violet-600',
    images: 3,
  },
  {
    id: 'fitbit-air',
    name: 'Fitbit Air',
    brand: 'Google',
    category: 'SMART WATCHES',
    price: 49900,
    originalPrice: 62900,
    rating: 4.6,
    reviews: 875,
    colors: ['#111827', '#F59E0B', '#10B981', '#EF4444'],
    emoji: '⌚',
    emojiAlt: '⌚',
    badge: 'Hot Deal',
    badgeColor: 'bg-rose-500',
    images: 2,
  },
  {
    id: 'infinix-note-60',
    name: 'Infinix Note 60 Ultra',
    brand: 'Infinix',
    category: 'SMART PHONE',
    price: 119900,
    originalPrice: 139900,
    rating: 4.5,
    reviews: 620,
    colors: ['#0F172A', '#0EA5E9', '#F97316'],
    emoji: '📱',
    emojiAlt: '📳',
    badge: 'Value Pick',
    badgeColor: 'bg-amber-500',
    images: 3,
  },
  {
    id: 'samsung-tab-s10',
    name: 'Galaxy Tab S10',
    brand: 'Samsung',
    category: 'TABLETS',
    price: 349900,
    rating: 4.7,
    reviews: 980,
    colors: ['#111827', '#C0C0C0', '#EAB308'],
    emoji: '📟',
    emojiAlt: '📋',
    images: 3,
  },
  {
    id: 'airpods-pro-4',
    name: 'AirPods Pro 4',
    brand: 'Apple',
    category: 'EARBUDS',
    price: 89900,
    originalPrice: 109900,
    rating: 4.9,
    reviews: 3200,
    colors: ['#F8FAFC', '#111827'],
    emoji: '🎧',
    emojiAlt: '🎵',
    badge: 'Top Rated',
    badgeColor: 'bg-emerald-600',
    images: 2,
  },
  {
    id: 'macbook-air-m4',
    name: 'MacBook Air M4',
    brand: 'Apple',
    category: 'LAPTOPS',
    price: 649900,
    originalPrice: 729900,
    rating: 4.9,
    reviews: 1870,
    colors: ['#C0C0C0', '#111827', '#F5CBA7'],
    emoji: '💻',
    emojiAlt: '🖥️',
    badge: "Editor's Pick",
    badgeColor: 'bg-blue-700',
    images: 4,
  },
  {
    id: 'anker-charger-65w',
    name: 'Anker Nano 65W',
    brand: 'Anker',
    category: 'CHARGERS',
    price: 9900,
    originalPrice: 13900,
    rating: 4.7,
    reviews: 4500,
    colors: ['#111827', '#F8FAFC'],
    emoji: '🔌',
    emojiAlt: '⚡',
    badge: 'Popular',
    badgeColor: 'bg-orange-500',
    images: 2,
  },
];

// ── Product Card ──────────────────────────────────────────────────────────────

function ProductCard({ product }: { product: Product }) {
  const [dot, setDot] = useState(0);
  const [liked, setLiked] = useState(false);
  const [selectedColor, setSelectedColor] = useState(0);

  const formatPrice = (n: number) =>
    `Rs ${n.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;

  return (
    <div className="group relative bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col">
      {/* Badge */}
      {product.badge && (
        <div className={`absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-white text-[10px] font-bold ${product.badgeColor}`}>
          {product.badge}
        </div>
      )}

      {/* Wishlist */}
      <button
        onClick={() => setLiked((l) => !l)}
        className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 shadow-sm hover:bg-rose-50 transition-all duration-200"
        aria-label="Add to wishlist"
      >
        <Heart
          size={15}
          className={liked ? 'text-rose-500 fill-rose-500' : 'text-slate-400'}
          fill={liked ? '#F43F5E' : 'none'}
        />
      </button>

      {/* Image area */}
      <div className="relative h-48 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center overflow-hidden">
        <span className="text-7xl select-none transition-transform duration-300 group-hover:scale-110">
          {dot % 2 === 0 ? product.emoji : product.emojiAlt}
        </span>

        {/* Carousel arrows */}
        {product.images > 1 && (
          <>
            <button
              onClick={() => setDot((d) => (d - 1 + product.images) % product.images)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-white/80 shadow opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setDot((d) => (d + 1) % product.images)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-white/80 shadow opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white"
            >
              <ChevronRight size={14} />
            </button>
          </>
        )}

        {/* Carousel dots */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          {Array.from({ length: product.images }).map((_, i) => (
            <button
              key={i}
              onClick={() => setDot(i)}
              className={`rounded-full transition-all duration-200 ${i === dot ? 'w-4 h-1.5 bg-blue-600' : 'w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400'}`}
            />
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs text-slate-400 font-semibold mb-0.5">{product.brand}</p>
        <h3 className="font-bold text-[#0F172A] text-sm mb-2 leading-snug line-clamp-2">{product.name}</h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={11}
              fill={i < Math.floor(product.rating) ? '#F59E0B' : 'none'}
              className={i < Math.floor(product.rating) ? 'text-amber-400' : 'text-slate-200'}
            />
          ))}
          <span className="text-[11px] text-slate-500 ml-1">({product.reviews.toLocaleString()})</span>
        </div>

        {/* Color swatches */}
        <div className="flex items-center gap-1.5 mb-3">
          {product.colors.map((color, i) => (
            <button
              key={i}
              onClick={() => setSelectedColor(i)}
              style={{ backgroundColor: color }}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${selectedColor === i ? 'border-blue-500 scale-125' : 'border-white shadow-sm'}`}
              aria-label={`Color option ${i + 1}`}
            />
          ))}
        </div>

        {/* Price */}
        <div className="flex items-end justify-between mt-auto">
          <div>
            {product.originalPrice && (
              <p className="text-[10px] text-slate-400 line-through">
                {formatPrice(product.originalPrice)}
              </p>
            )}
            <div className="flex items-baseline gap-1.5">
              <p className="text-base font-extrabold text-[#0F172A]">{formatPrice(product.price)}</p>
              {discount && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                  -{discount}%
                </span>
              )}
            </div>
          </div>
          <button
            className="flex items-center gap-1.5 px-3 py-2 bg-[#0F172A] hover:bg-blue-600 text-white text-xs font-bold rounded-full transition-all duration-200 hover:shadow-md hover:shadow-blue-500/30 active:scale-95"
            aria-label={`Add ${product.name} to bag`}
          >
            <ShoppingBag size={13} />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState('ALL PRODUCTS');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [sort, setSort] = useState('NEWEST');

  const sortOptions = ['NEWEST', 'PRICE: LOW TO HIGH', 'PRICE: HIGH TO LOW', 'TOP RATED', 'MOST POPULAR'];

  const filtered = products.filter((p) => {
    const matchCat = activeCategory === 'ALL PRODUCTS' || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="w-full min-h-screen bg-white">
      {/* ── Page Hero Header ── */}
      <div className="w-full bg-gradient-to-br from-blue-600 via-blue-600 to-blue-500 py-14">
        <div className="w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full bg-white/15 border border-white/30 text-white text-xs font-bold tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Official Hardware Catalog
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-3">
            Explore All Products
          </h1>
          <p className="text-blue-100 text-base max-w-lg">
            Browse our complete range of premium smartphones, wearables, accessories & more.
          </p>
        </div>
      </div>

      <div className="w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32 py-8">

        {/* ── Category Filter Pills ── */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold tracking-wider transition-all duration-200
                ${activeCategory === cat
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div className="flex flex-wrap items-center gap-3 mb-8 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
          {/* Show Filters */}
          <button
            id="show-filters-btn"
            onClick={() => setShowFilters((f) => !f)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold tracking-widest transition-all duration-200 border
              ${showFilters
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300 hover:text-blue-600'
              }`}
          >
            <SlidersHorizontal size={14} />
            SHOW FILTERS
          </button>

          {/* Search */}
          <div className="flex-1 min-w-48 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus-within:border-blue-400 focus-within:bg-white transition-all duration-200">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              id="shop-search"
              type="text"
              placeholder="Search products or brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none"
            />
          </div>

          {/* Sort */}
          <div className="relative">
            <button
              id="sort-dropdown-btn"
              onClick={() => setSortOpen((o) => !o)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:border-blue-300 text-xs font-bold tracking-widest text-slate-700 transition-all duration-200"
            >
              {sort}
              <ChevronDown size={14} className={`transition-transform duration-200 ${sortOpen ? 'rotate-180' : ''}`} />
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-30">
                {sortOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setSort(opt); setSortOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors duration-150
                      ${sort === opt ? 'text-blue-600 bg-blue-50' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Result count */}
          <p className="ml-auto text-xs text-slate-400 font-medium hidden sm:block">
            {filtered.length} product{filtered.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* ── Filter Panel (collapsible) ── */}
        {showFilters && (
          <div className="mb-6 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm grid sm:grid-cols-3 gap-5">
            {/* Price Range */}
            <div>
              <p className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-3">Price Range</p>
              <div className="flex gap-2">
                <input placeholder="Min" className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-200 outline-none focus:border-blue-400 transition-colors" />
                <input placeholder="Max" className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-200 outline-none focus:border-blue-400 transition-colors" />
              </div>
            </div>
            {/* Brand */}
            <div>
              <p className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-3">Brand</p>
              <div className="flex flex-wrap gap-2">
                {['Google', 'Samsung', 'Apple', 'Infinix', 'Anker'].map((b) => (
                  <button key={b} className="px-3 py-1.5 text-xs font-semibold rounded-full border border-slate-200 hover:border-blue-400 hover:text-blue-600 transition-all duration-150">
                    {b}
                  </button>
                ))}
              </div>
            </div>
            {/* Rating */}
            <div>
              <p className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-3">Min Rating</p>
              <div className="flex gap-2">
                {[4, 4.5, 4.8].map((r) => (
                  <button key={r} className="px-3 py-1.5 text-xs font-semibold rounded-full border border-slate-200 hover:border-blue-400 hover:text-blue-600 transition-all duration-150 flex items-center gap-1">
                    {r} <Star size={10} fill="#F59E0B" className="text-amber-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Product Grid ── */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8 w-full">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <span className="text-6xl mb-4">🔍</span>
            <p className="text-lg font-bold text-slate-600 mb-1">No products found</p>
            <p className="text-sm">Try adjusting your search or filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
