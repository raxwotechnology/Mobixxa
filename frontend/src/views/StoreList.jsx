'use client';

import { useState, useEffect } from 'react';
import { Link } from '../utils/navigation';
import { MapPin, Clock, Phone, ArrowRight, Search, Building2, Navigation, CheckCircle2, Wrench, Shield, ShoppingBag, Star, ExternalLink } from 'lucide-react';
import { getStores } from '../services/api';
import { getImageUrl } from '../utils/imageHelper';

const STORE_THEMES = [
  { bannerBg: 'bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600', icon: '🏬', accent: 'bg-blue-600 hover:bg-blue-700' },
  { bannerBg: 'bg-gradient-to-r from-purple-800 via-purple-700 to-indigo-800', icon: '🏛️', accent: 'bg-purple-600 hover:bg-purple-700' },
  { bannerBg: 'bg-gradient-to-r from-emerald-800 via-teal-700 to-slate-900', icon: '🏢', accent: 'bg-emerald-600 hover:bg-emerald-700' },
];

const StoreList = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await getStores();
        setStores(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStores();
  }, []);

  const cities = Array.from(new Set(stores.map((s) => s.city).filter(Boolean)));

  const filteredStores = stores.filter((store) => {
    const matchesSearch =
      store.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (store.city && store.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (store.address && store.address.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCity = selectedCity === '' || store.city === selectedCity;
    return matchesSearch && matchesCity;
  });

  return (
    <div className="public-page min-h-screen">
      {/* ===== HERO BANNER (MATCHES SCREENSHOT 4) ===== */}
      <section className="catalog-hero base-container py-10 sm:py-12 px-6 lg:px-12 text-white mb-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)] pointer-events-none" />
        <div className="base-container relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-900/40 border border-white/20 text-white text-xs font-bold uppercase tracking-widest mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            Official Flagship Boutiques
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white m-0 tracking-tight">
            Our Stores &amp; Showrooms
          </h1>
          <p className="text-blue-100 text-xs sm:text-sm m-0 mt-1 max-w-xl">
            Visit any of our premium Mobixa showrooms to experience the latest tech in person — with expert guidance on hand.
          </p>

          {/* Search & City Filter Bar */}
          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1 max-w-lg">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-200 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by store name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-blue-800/60 border border-white/25 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-blue-200 focus:outline-none focus:ring-2 focus:ring-white"
              />
            </div>

            {/* City Pills */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
              <button
                onClick={() => setSelectedCity('')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  selectedCity === ''
                    ? 'bg-white text-blue-700 shadow-md'
                    : 'bg-blue-800/60 text-white hover:bg-blue-800 border border-white/15'
                }`}
              >
                All Cities ({stores.length})
              </button>
              {cities.map((city) => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    selectedCity === city
                      ? 'bg-white text-blue-700 shadow-md'
                      : 'bg-blue-800/60 text-white hover:bg-blue-800 border border-white/15'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== STORES LIST (MATCHES SCREENSHOT 4) ===== */}
      <section className="base-container px-4 sm:px-6 mb-16">
        <div className="flex items-center gap-2 mb-6 text-slate-500 text-xs font-bold uppercase tracking-wider">
          <span>{filteredStores.length} Showrooms Found</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-slate-200 rounded-3xl h-80" />
            ))}
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 max-w-md mx-auto">
            
            <h3 className="font-bold text-lg text-slate-800 mt-2">No showrooms found</h3>
            <p className="text-xs text-slate-500 mb-4">Try clearing your search or city filters.</p>
            <button
              onClick={() => { setSearchTerm(''); setSelectedCity(''); }}
              className="bg-blue-600 text-white font-bold text-xs px-5 py-2 rounded-xl"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredStores.map((store, index) => {
              const theme = STORE_THEMES[index % STORE_THEMES.length];
              const phone = store.phone || '+94 11 255 5000';
              const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(store.name + ' ' + (store.address || 'Colombo'))}`;
              const googleReviewUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.name + ' ' + (store.address || 'Colombo'))}`;
              const rating = store.rating || 4.9;
              const reviewCount = store.reviewCount || (120 + index * 45);

              return (
                <div
                  key={store._id}
                  className="storefront-card overflow-hidden transition-all duration-300 flex flex-col justify-between hover:shadow-xl hover:border-blue-300"
                >
                  {/* Top Blueprint Banner */}
                  <div className={`${theme.bannerBg} p-6 text-white relative flex items-center justify-between min-h-[180px]`}>
                    {/* Subtle grid texture */}
                    <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
                    {store.bannerImage && (
                      <img
                        src={getImageUrl(store.bannerImage)}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover opacity-65"
                      />
                    )}

                    <div className="relative z-10">
                      <span className="inline-flex items-center gap-1.5 bg-emerald-500/90 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Open Showroom
                      </span>
                      <h3 className="text-xl font-bold text-white mt-3 mb-0">{store.name}</h3>
                      <p className="text-xs text-blue-100 m-0 mt-0.5">{store.address || store.city}</p>
                    </div>

                    <div className="text-4xl opacity-80 z-10">
                      {theme.icon}
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div className="space-y-3 mb-4">
                      {/* Address */}
                      <div className="flex items-start gap-2.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <MapPin size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="block text-slate-900 mb-0.5">Showroom Address:</strong>
                          <span>{store.address || 'Main Street, Colombo, Sri Lanka'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 text-xs text-slate-700">
                        <Clock size={15} className="text-blue-600 flex-shrink-0" />
                        <span>Open daily: <strong className="text-slate-900">09:00 — 20:00</strong></span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-slate-700">
                        <Phone size={15} className="text-blue-600 flex-shrink-0" />
                        <span>{phone}</span>
                      </div>
                    </div>

                    {/* Google Reviews Section */}
                    <div className="bg-amber-50/60 border border-amber-200/70 rounded-xl p-3 mb-4 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={13} className="fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                          <span className="text-xs font-bold text-slate-900">{rating}</span>
                          <span className="text-[11px] text-slate-500 font-medium">({reviewCount} reviews)</span>
                        </div>
                        <a
                          href={googleReviewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          <span>Google Review</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                      <p className="text-[11px] text-slate-600 italic m-0">
                        &ldquo;Fast and professional service. Bought my new device with genuine warranty support!&rdquo;
                      </p>
                    </div>

                    {/* Amenity Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {['Flagship Devices', 'Trade-In Centre', 'Repair Workshop', 'Free Parking'].map((tag, i) => (
                        <span
                          key={i}
                          className="bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-200/60"
                        >
                           {tag}
                        </span>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl text-center shadow-md hover:shadow transition-all flex items-center justify-center gap-1.5"
                      >
                        <Navigation size={13} />
                        Get Directions
                      </a>
                      <a
                        href={`tel:${phone}`}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2.5 rounded-xl text-center transition-all flex items-center justify-center gap-1.5"
                      >
                        <Phone size={13} />
                        Call Now
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ===== BOTTOM BANNER (MATCHES SCREENSHOT 4) ===== */}
      <section className="base-container px-4 sm:px-6 pb-20">
        <div className="w-full bg-blue-600 rounded-3xl p-6 sm:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-blue-200">Can't Visit Us?</span>
            <h3 className="text-2xl font-bold text-white mt-1 mb-1">Shop Online, Delivered to You</h3>
            <p className="text-blue-100 text-xs sm:text-sm m-0">Enjoy the same premium experience from the comfort of your home.</p>
          </div>

          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold text-xs sm:text-sm px-6 py-3 rounded-xl hover:bg-blue-50 shadow-md transition-all flex-shrink-0"
          >
            <ShoppingBag size={15} />
            Shop Online ↗
          </Link>
        </div>
      </section>
    </div>
  );
};

export default StoreList;
