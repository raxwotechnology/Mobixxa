'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getDeals, getCategories } from '../services/api';
import ProductCard from '../components/ProductCard';
import useThemeStore, { THEME_ACCENTS } from '../store/themeStore';

const Deals = () => {
  const [deals, setDeals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  const { accent, customColor } = useThemeStore();
  const themeConfig = THEME_ACCENTS[accent] || THEME_ACCENTS.sapphire;
  const primaryColor = accent === 'custom' && customColor ? customColor : (themeConfig.primary || '#2563eb');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dealsRes, catsRes] = await Promise.all([getDeals(), getCategories()]);
        setDeals(dealsRes.data);
        setCategories(catsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Midnight flash sale countdown
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      const difference = +midnight - +now;
      
      let time = { hours: 0, minutes: 0, seconds: 0 };
      if (difference > 0) {
        time = {
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          timeMinutes: Math.floor((difference / 1000 / 60) % 60),
          timeSeconds: Math.floor((difference / 1000) % 60)
        };
        time.minutes = time.timeMinutes;
        time.seconds = time.timeSeconds;
      }
      return time;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const filteredDeals = selectedCategory
    ? deals.filter((product) => {
        const catId = typeof product.category === 'object' ? product.category?._id : product.category;
        return catId === selectedCategory;
      })
    : deals;

  return (
    <div className="bg-slate-50/50 min-h-screen">
      {/* Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-fuchsia py-12 shadow-inner">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)] pointer-events-none" />
        <div className="base-container text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white border border-white/20 mb-2.5 animate-pulse">
              ⚡ Exclusive Promotions ⚡
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mt-0 mb-3">Mega Deals & Offers</h1>
            <p className="text-xs md:text-sm text-white/90 font-normal m-0 mt-1 max-w-xl mx-auto">
              Grab these authentic tech products at unbeatable promotional prices before they run out!
            </p>

            {/* Countdown timer wrapper */}
            <div className="flex justify-center items-center gap-3 mt-6">
              <span className="text-white/75 text-[10px] font-black uppercase tracking-wider mr-1">OFFERS EXPIRE IN:</span>
              <div className="flex gap-2">
                <div className="bg-white/15 backdrop-blur-md px-3 py-2 rounded-xl text-white font-extrabold text-xs md:text-sm border border-white/20 shadow-sm min-w-[44px]">
                  {String(timeLeft.hours).padStart(2, '0')}h
                </div>
                <div className="bg-white/15 backdrop-blur-md px-3 py-2 rounded-xl text-white font-extrabold text-xs md:text-sm border border-white/20 shadow-sm min-w-[44px]">
                  {String(timeLeft.minutes || 0).padStart(2, '0')}m
                </div>
                <div className="bg-white/15 backdrop-blur-md px-3 py-2 rounded-xl text-white font-extrabold text-xs md:text-sm border border-white/20 shadow-sm min-w-[44px]">
                  {String(timeLeft.seconds || 0).padStart(2, '0')}s
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Container */}
      <div className="base-container py-10">


        {/* Listings */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 animate-pulse">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm h-80" />
            ))}
          </div>
        ) : deals.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {deals.map((product, i) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.4 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-[2rem] p-16 text-center border border-slate-200/60 max-w-lg mx-auto shadow-sm">
            <span className="text-5xl block mb-4">✨</span>
            <h3 className="text-lg font-black text-slate-800 mb-2 mt-0">No Active Deals</h3>
            <p className="text-slate-450 text-sm m-0 font-semibold">
              There are no current active deals under this category. Check back soon for new flash sales!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Deals;
