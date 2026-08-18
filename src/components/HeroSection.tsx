'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="w-full bg-white py-6 lg:py-8">
      <div className="w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32">

        {/* ── Big Blue Gradient Card ── */}
        <div className="w-full bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 rounded-3xl overflow-hidden shadow-2xl shadow-blue-200/60 relative p-8 sm:p-12 lg:p-16 text-white">

          {/* Background texture circles */}
          <div className="absolute top-[-60px] left-[-60px] w-96 h-96 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute bottom-[-80px] left-[30%] w-[500px] h-[500px] bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute top-[-20px] right-[25%] w-72 h-72 bg-blue-400/20 rounded-full pointer-events-none" />

          <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">

            {/* ── Left: Copy (3/5) ── */}
            <div className="w-full lg:w-3/5 z-10">

              {/* Pill badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-blue-800/60 border border-white/20 text-white/90 text-xs font-bold tracking-widest uppercase">
                <Sparkles size={14} className="text-yellow-300" />
                Next-Gen Technology
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-6">
                Welcome to Mobixa<br />
                <span className="text-white/90">Premium Tech &amp;</span>
                {' '}
                <span className="text-yellow-300">Smart Devices.</span>
              </h1>

              {/* Subtitle / Description */}
              <p className="text-lg lg:text-xl text-blue-100 leading-relaxed mb-8 max-w-2xl">
                Discover the latest smartphones, powerful laptops, immersive audio, and
                premium accessories curated for modern lifestyles. Upgrade your tech today.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 mb-10">
                <Link
                  href="/shop"
                  id="hero-shop-now-btn"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-700 font-extrabold text-base rounded-full shadow-lg hover:shadow-xl hover:bg-blue-50 transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
                >
                  Shop Now
                  <ArrowRight size={18} />
                </Link>
                <Link
                  href="/deals"
                  id="hero-deals-btn"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-transparent text-white font-extrabold text-base rounded-full border-2 border-white/50 hover:border-white hover:bg-white/10 transition-all duration-200"
                >
                  Tech Deals
                </Link>
              </div>

              {/* Stats strip */}
              <div className="flex gap-8 pt-6 border-t border-white/20">
                {[
                  { val: '50K+', label: 'Happy Customers' },
                  { val: '2K+',  label: 'Genuine Products' },
                  { val: '4.9★', label: 'Customer Rating' },
                ].map(({ val, label }) => (
                  <div key={label}>
                    <p className="text-white font-extrabold text-2xl leading-none">{val}</p>
                    <p className="text-blue-200 text-xs sm:text-sm mt-1">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: Product Collage (2/5) ── */}
            <div className="w-full lg:w-2/5 flex justify-center items-center relative">
              {/* Subtle inner glow behind image */}
              <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
              <Image
                src="/hero-products.jpg"
                alt="Premium tech products — smartphone, smartwatch, and earbuds"
                width={540}
                height={480}
                className="relative z-10 w-full max-w-[540px] h-[380px] lg:h-[480px] object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
