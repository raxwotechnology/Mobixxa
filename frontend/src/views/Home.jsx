'use client';

import { useState, useEffect } from 'react';
import { Link } from '../utils/navigation';
import { Sparkles, Star, ArrowRight, Truck, ShieldCheck, Clock3, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';
import { getCategories, getFeaturedProducts, getDeals } from '../services/api';
import ProductCard from '../components/ProductCard';
import useSettingsStore from '../store/settingsStore';
import useThemeStore, { THEME_ACCENTS } from '../store/themeStore';
import { getImageUrl } from '../utils/imageHelper';

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const settings = useSettingsStore((s) => s.settings);
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);
  const { accent, customColor } = useThemeStore();

  const themeConfig = THEME_ACCENTS[accent] || THEME_ACCENTS.sapphire;
  const primaryColor = accent === 'custom' && customColor ? customColor : (themeConfig.primary || '#2563eb');
  const brandName = settings?.shopName || 'Mobixa';

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, featRes, dealsRes] = await Promise.allSettled([
          getCategories(),
          getFeaturedProducts(),
          getDeals(),
        ]);
        if (catRes.status === 'fulfilled') setCategories(catRes.value.data || []);
        if (featRes.status === 'fulfilled') setFeatured(featRes.value.data || []);
        if (dealsRes.status === 'fulfilled') setDeals(dealsRes.value.data || []);
      } catch (error) {
        console.error('Error fetching homepage data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fadeUp = {
    hidden: { opacity: 0, y: 25 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="bg-slate-50/50 min-h-screen">
      {/* ===== HERO SECTION (MATCHES SCREENSHOT) ===== */}
      <section className="base-container pt-4 pb-8 px-4 sm:px-6">
        <div className="w-full bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 rounded-3xl overflow-hidden shadow-2xl shadow-blue-500/20 relative p-8 sm:p-12 lg:p-14 text-white">
          {/* Background Ambient Glow Elements */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-28 right-1/4 w-[450px] h-[450px] bg-sky-400/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-14">
            {/* Left Copy */}
            <div className="w-full lg:w-3/5">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-6 rounded-full bg-blue-900/40 border border-white/20 text-white text-xs font-bold tracking-wider uppercase backdrop-blur-md">
                <Sparkles size={14} className="text-amber-300" />
                Next-Gen Technology
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight mb-4">
                Welcome to {brandName}<br />
                <span className="text-white drop-shadow-sm">Premium Tech &amp;</span>{' '}
                <span className="text-amber-300 drop-shadow-sm">Smart Devices.</span>
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base lg:text-lg text-blue-100/90 leading-relaxed mb-8 max-w-xl font-normal">
                Discover the latest smartphones, powerful laptops, immersive audio, and premium accessories curated for modern lifestyles. Upgrade your tech today.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4 mb-10">
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-blue-700 font-extrabold text-sm rounded-full shadow-lg hover:shadow-xl hover:bg-blue-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Shop Now <ArrowRight size={16} />
                </Link>
                <Link
                  to="/deals"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-transparent text-white font-extrabold text-sm rounded-full border-2 border-white/60 hover:border-white hover:bg-white/10 transition-all"
                >
                  Tech Deals
                </Link>
              </div>

              {/* Stat Counters */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/15 max-w-lg">
                <div>
                  <p className="text-xl sm:text-2xl font-black text-white m-0">50K+</p>
                  <p className="text-xs text-blue-200 m-0 mt-0.5">Happy Customers</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-white m-0">2K+</p>
                  <p className="text-xs text-blue-200 m-0 mt-0.5">Genuine Products</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-amber-300 m-0">4.9★</p>
                  <p className="text-xs text-blue-200 m-0 mt-0.5">Customer Rating</p>
                </div>
              </div>
            </div>

            {/* Right Visual Showcase Card */}
            <div className="w-full lg:w-2/5 flex justify-center">
              <div className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl p-4 sm:p-6 shadow-2xl border border-white/30 flex items-center justify-center">
                <img
                  src="/hero-products.jpg"
                  alt="Mobixa Flagship Smart Devices"
                  className="w-full h-auto max-h-[320px] object-contain rounded-2xl"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80';
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURE CARDS ROW (MATCHES SCREENSHOT) ===== */}
      <section className="base-container px-4 sm:px-6 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <Truck size={20} className="text-blue-600" />, title: 'Free Shipping', desc: 'On all devices nationwide', bg: 'bg-blue-50/80 border-blue-100' },
            { icon: <Clock3 size={20} className="text-amber-600" />, title: 'Fast Dispatch', desc: 'Packed in 24 hours', bg: 'bg-amber-50/80 border-amber-100' },
            { icon: <ShieldCheck size={20} className="text-emerald-600" />, title: 'Official Warranty', desc: 'Guaranteed 100% genuine', bg: 'bg-emerald-50/80 border-emerald-100' },
            { icon: <Cpu size={20} className="text-indigo-600" />, title: 'Latest Tech', desc: 'Curated top-tier brands', bg: 'bg-indigo-50/80 border-indigo-100' },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 shadow-xs hover:shadow-md transition-all"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border ${item.bg}`}>
                {item.icon}
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 m-0">{item.title}</h4>
                <p className="text-xs text-slate-500 m-0 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== EXPLORE CATEGORIES (MATCHES SCREENSHOT) ===== */}
      <section className="base-container px-4 sm:px-6 mb-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-600">Shop by Type</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 mb-0 tracking-tight">Explore Categories</h2>
          </div>
          <Link to="/shop" className="text-blue-600 hover:text-blue-700 font-bold text-xs sm:text-sm flex items-center gap-1">
            All Categories <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3.5">
          {categories.slice(0, 8).map((cat) => (
            <Link
              key={cat._id}
              to={`/shop?category=${cat._id}`}
              className="bg-white border border-slate-200/80 hover:border-blue-500/80 rounded-2xl p-4 text-center group shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all"
            >
              <div className="w-12 h-12 bg-slate-50 group-hover:bg-blue-50 rounded-xl mx-auto mb-2.5 flex items-center justify-center text-2xl transition-colors border border-slate-100">
                {cat.icon || '📱'}
              </div>
              <h3 className="font-bold text-xs text-slate-800 m-0 group-hover:text-blue-600 transition-colors truncate">
                {cat.name}
              </h3>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== FEATURED PRODUCTS ===== */}
      {featured.length > 0 && (
        <section className="base-container px-4 sm:px-6 mb-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-600">Handpicked Devices</span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 mb-0 tracking-tight">Featured Products</h2>
            </div>
            <Link to="/shop?featured=true" className="text-blue-600 hover:text-blue-700 font-bold text-xs sm:text-sm flex items-center gap-1">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {featured.slice(0, 8).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* ===== FLASH DEALS ===== */}
      {deals.length > 0 && (
        <section className="bg-gradient-to-b from-blue-50/50 via-slate-50 to-white py-16 border-y border-slate-200/70 mb-16">
          <div className="base-container px-4 sm:px-6">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-600">⚡ Limited Time Offers</span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 mb-0 tracking-tight">Mega Deals &amp; Offers</h2>
              </div>
              <Link to="/deals" className="text-blue-600 hover:text-blue-700 font-bold text-xs sm:text-sm flex items-center gap-1">
                View All Deals <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {deals.slice(0, 4).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== CUSTOMER REVIEWS ===== */}
      <section className="base-container px-4 sm:px-6 pb-20">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-600">Testimonials</span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 mb-2 tracking-tight">What Our Customers Say</h2>
          <p className="text-slate-500 text-xs sm:text-sm m-0">Trusted by tech lovers and enterprise customers across the island</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'Alex M.', text: "Got my new iPhone delivered the same day. Incredible service and the packaging was flawless. Highly recommended!", rating: 5, role: 'Verified Buyer' },
            { name: 'Sarah J.', text: "The range of accessories is unmatched. Found the perfect MagSafe case and wireless charger combo here.", rating: 5, role: 'Tech Enthusiast' },
            { name: 'Kevin D.', text: "Best tech store online. The warranty support is solid and the prices are always competitive.", rating: 5, role: 'Frequent Customer' },
          ].map((item, i) => (
            <div key={i} className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between">
              <div>
                <div className="flex gap-1 mb-3">
                  {[...Array(item.rating)].map((_, j) => (
                    <Star key={j} size={15} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-600 text-xs sm:text-sm italic mb-6 leading-relaxed">"{item.text}"</p>
              </div>
              <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">{item.name}</span>
                <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{item.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
