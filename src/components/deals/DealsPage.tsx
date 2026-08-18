'use client';

import { useState, useEffect, useRef } from 'react';
import { Clock, ShoppingBag, Heart, Star, Zap, Tag } from 'lucide-react';

// ── Countdown Timer Hook ──────────────────────────────────────────────────────

function useCountdown(initialSeconds: number) {
  const [seconds, setSeconds] = useState(initialSeconds);
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return { h: pad(h), m: pad(m), s: pad(s), expired: seconds === 0 };
}

// ── Data ──────────────────────────────────────────────────────────────────────

interface Deal {
  id: string;
  name: string;
  brand: string;
  emoji: string;
  discount: number;
  price: number;
  originalPrice: number;
  rating: number;
  reviews: number;
  tag: string;
  tagColor: string;
  accentColor: string;
  bgFrom: string;
  bgTo: string;
  expiresLabel: string;
}

const deals: Deal[] = [
  {
    id: 'deal-marshall-monitor',
    name: 'Marshall Monitor III',
    brand: 'Marshall',
    emoji: '🎧',
    discount: 20,
    price: 63920,
    originalPrice: 79900,
    rating: 4.8,
    reviews: 1203,
    tag: 'AUDIO DEAL',
    tagColor: 'bg-amber-500',
    accentColor: '#F59E0B',
    bgFrom: 'from-amber-950',
    bgTo: 'to-yellow-900',
    expiresLabel: 'Ends in 09h 28m',
  },
  {
    id: 'deal-marshall-emberton',
    name: 'Marshall Emberton III',
    brand: 'Marshall',
    emoji: '🔊',
    discount: 16,
    price: 37716,
    originalPrice: 44900,
    rating: 4.7,
    reviews: 875,
    tag: 'SPEAKER DEAL',
    tagColor: 'bg-orange-500',
    accentColor: '#F97316',
    bgFrom: 'from-orange-950',
    bgTo: 'to-red-900',
    expiresLabel: 'Ends in 09h 28m',
  },
  {
    id: 'deal-ps5-pro',
    name: 'PlayStation 5 Pro',
    brand: 'Sony',
    emoji: '🎮',
    discount: 10,
    price: 179910,
    originalPrice: 199900,
    rating: 4.9,
    reviews: 4200,
    tag: 'GAMING DEAL',
    tagColor: 'bg-blue-600',
    accentColor: '#0062FF',
    bgFrom: 'from-blue-950',
    bgTo: 'to-indigo-900',
    expiresLabel: 'Ends in 09h 28m',
  },
  {
    id: 'deal-pixel-10-pro',
    name: 'Google Pixel 10 Pro',
    brand: 'Google',
    emoji: '📱',
    discount: 10,
    price: 359910,
    originalPrice: 399900,
    rating: 4.9,
    reviews: 2841,
    tag: 'PHONE DEAL',
    tagColor: 'bg-emerald-600',
    accentColor: '#10B981',
    bgFrom: 'from-emerald-950',
    bgTo: 'to-teal-900',
    expiresLabel: 'Ends in 09h 28m',
  },
];

// ── Deal Card ─────────────────────────────────────────────────────────────────

function DealCard({ deal, countdown }: { deal: Deal; countdown: { h: string; m: string; s: string } }) {
  const [liked, setLiked] = useState(false);
  const formatPrice = (n: number) => `Rs ${n.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

  return (
    <div
      id={deal.id}
      className={`group relative rounded-3xl overflow-hidden bg-gradient-to-br ${deal.bgFrom} ${deal.bgTo} border border-white/5 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300`}
    >
      {/* Discount badge */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-white text-xs font-black">
        <Tag size={11} />
        -{deal.discount}%
      </div>

      {/* Wishlist */}
      <button
        onClick={() => setLiked((l) => !l)}
        className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm transition-all duration-200"
        aria-label="Add to wishlist"
      >
        <Heart
          size={14}
          className={liked ? 'text-rose-400 fill-rose-400' : 'text-white/70'}
          fill={liked ? '#FB7185' : 'none'}
        />
      </button>

      {/* Product visual */}
      <div className="relative h-52 flex items-center justify-center overflow-hidden">
        {/* Glow */}
        <div
          className="absolute inset-0 flex items-center justify-center opacity-20 blur-3xl"
          style={{ backgroundColor: deal.accentColor }}
        />
        <span className="relative z-10 text-8xl select-none transition-transform duration-300 group-hover:scale-110 drop-shadow-2xl">
          {deal.emoji}
        </span>

        {/* Countdown pill overlay */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-md text-white text-xs font-mono font-bold whitespace-nowrap">
          <Clock size={11} className="text-white/60" />
          {countdown.h}h {countdown.m}m {countdown.s}s
        </div>
      </div>

      {/* Info */}
      <div className="p-5">
        {/* Tag */}
        <div className="flex items-center justify-between mb-2">
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-white text-[10px] font-black ${deal.tagColor}`}>
            <Zap size={9} fill="white" />
            {deal.tag}
          </span>
          <span className="text-white/50 text-xs font-medium">{deal.brand}</span>
        </div>

        <h3 className="text-white font-extrabold text-lg mb-1 leading-snug">{deal.name}</h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={11} fill={i < Math.floor(deal.rating) ? '#FBBF24' : 'none'} className={i < Math.floor(deal.rating) ? 'text-amber-400' : 'text-white/20'} />
          ))}
          <span className="text-white/50 text-xs ml-1">({deal.reviews.toLocaleString()})</span>
        </div>

        {/* Price + CTA */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-white/40 text-xs line-through">{formatPrice(deal.originalPrice)}</p>
            <p className="text-white font-extrabold text-xl">{formatPrice(deal.price)}</p>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold text-white transition-all duration-200 hover:scale-105 active:scale-95"
            style={{ backgroundColor: deal.accentColor }}
            aria-label={`Add ${deal.name} to bag`}
          >
            <ShoppingBag size={15} />
            Add to Bag
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function DealsPage() {
  // Initial countdown: 9h 28m 5s = 34085 seconds
  const countdown = useCountdown(34085);

  return (
    <div className="w-full min-h-screen bg-white">
      {/* ── Page Hero Header ── */}
      <div className="relative w-full bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 pt-14 pb-12 overflow-hidden">
        {/* Subtle shine */}
        <div className="absolute top-[-60px] left-[-60px] w-80 h-80 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute bottom-[-40px] right-[10%] w-64 h-64 bg-white/5 rounded-full pointer-events-none" />
        <div className="relative w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full bg-white/15 border border-white/25 text-white text-xs font-bold tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Exclusive Promotions
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-2">
                Mega Deals &amp; Offers
              </h1>
              <p className="text-blue-100 text-base max-w-lg">
                Limited-time offers on premium tech — grab them before they expire.
              </p>
            </div>

            {/* Live countdown pill */}
            <div className="flex items-center gap-3 shrink-0 px-5 py-3 rounded-2xl bg-white/15 border border-white/20 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 text-yellow-300">
                <Clock size={15} className="animate-pulse" />
                <span className="text-xs font-bold tracking-widest uppercase text-yellow-300">Offers Expire In</span>
              </div>
              <div className="flex items-center gap-1 font-mono">
                {[countdown.h, countdown.m, countdown.s].map((unit, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <span className="inline-flex items-center justify-center w-10 h-9 bg-white/20 rounded-xl text-white font-black text-lg">
                      {unit}
                    </span>
                    {i < 2 && <span className="text-white/60 font-black text-lg">:</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Deals Grid ── */}
      <div className="w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8 w-full">
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} countdown={countdown} />
          ))}
        </div>

        {/* Bottom banner */}
        <div className="mt-10 rounded-3xl bg-gradient-to-r from-blue-600 to-blue-700 p-8 flex flex-col sm:flex-row items-center justify-between gap-5 overflow-hidden relative">
          <div className="absolute right-0 top-0 w-64 h-full bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <p className="text-blue-200 text-xs font-bold tracking-widest uppercase mb-1">Subscribe &amp; Save More</p>
            <h3 className="text-white text-2xl font-extrabold mb-1">Get exclusive deal alerts</h3>
            <p className="text-blue-200 text-sm">Be the first to know about flash sales and new arrivals.</p>
          </div>
          <div className="relative flex gap-2 w-full sm:w-auto">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 sm:w-64 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-300 text-sm outline-none focus:bg-white/15 transition-colors duration-200"
            />
            <button className="px-5 py-3 bg-white text-blue-600 font-bold text-sm rounded-xl hover:bg-blue-50 transition-colors duration-200 shrink-0">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
