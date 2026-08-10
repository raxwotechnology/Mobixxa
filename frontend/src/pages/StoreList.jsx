import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Phone, ArrowRight, Search, Building2, Navigation, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { getStores } from '../services/api';
import { getImageUrl } from '../utils/imageHelper';

const StoreList = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await getStores();
        setStores(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStores();
  }, []);

  // Extract unique cities from store list
  const cities = Array.from(new Set(stores.map(s => s.city).filter(Boolean)));

  // Filter stores by search query and selected city
  const filteredStores = stores.filter((store) => {
    const matchesSearch =
      store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (store.city && store.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (store.address && store.address.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCity = selectedCity === '' || store.city === selectedCity;
    return matchesSearch && matchesCity;
  });

  return (
    <div className="bg-slate-50/50 min-h-screen">
      {/* Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-fuchsia py-12 shadow-inner mb-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)] pointer-events-none" />
        <div className="base-container text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white border border-white/20 mb-2.5">
              <Building2 size={12} /> Official Flagship Boutiques
            </span>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white m-0">Our Stores & Showrooms</h1>
            <p className="text-xs md:text-sm text-white/90 font-normal m-0 mt-1 max-w-xl mx-auto">
              Visit our tech showrooms across Sri Lanka to experience hands-on product demos and expert technical service.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="base-container py-10">
        {/* Search & Location Filter Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search stores by city or branch name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold outline-none focus:bg-white focus:border-brand-indigo focus:ring-4 focus:ring-brand-indigo/10 transition-all text-slate-700"
            />
          </div>

          {/* City Filter Pills */}
          {cities.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
              <button
                onClick={() => setSelectedCity('')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex-shrink-0 cursor-pointer ${
                  selectedCity === ''
                    ? 'bg-brand-indigo text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                All Cities ({stores.length})
              </button>
              {cities.map((city) => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex-shrink-0 cursor-pointer ${
                    selectedCity === city
                      ? 'bg-brand-indigo text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading Skeletons */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white border border-slate-200/60 rounded-[2.5rem] overflow-hidden animate-pulse shadow-sm">
                <div className="h-52 bg-slate-100" />
                <div className="p-7 space-y-4">
                  <div className="h-6 bg-slate-100 rounded w-1/2" />
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-4 bg-slate-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredStores.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredStores.map((store, i) => (
              <motion.div
                key={store._id}
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <div className="bg-white border border-slate-200/70 rounded-[2.5rem] overflow-hidden hover:shadow-2xl hover:border-brand-indigo/30 transition-all duration-300 group flex flex-col h-full shadow-sm">
                  {/* Banner & Header Image */}
                  <div className="relative h-56 overflow-hidden bg-slate-900">
                    <img
                      src={getImageUrl(store.bannerImage) || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800'}
                      alt={store.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
                    
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      <span className="bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1.5 border border-white/20">
                        <CheckCircle2 size={12} /> Open Showroom
                      </span>
                    </div>

                    {/* Logo & Store Title */}
                    <div className="absolute bottom-5 left-6 right-6 flex items-end justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className="w-16 h-16 rounded-2xl border-2 border-white overflow-hidden bg-white shadow-xl p-0.5 flex-shrink-0">
                          <img
                            src={getImageUrl(store.logo) || 'https://via.placeholder.com/100'}
                            alt={store.name}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        </div>
                        <div>
                          <h3 className="font-black text-white text-lg sm:text-xl m-0 drop-shadow-md leading-tight">{store.name}</h3>
                          {store.city && (
                            <p className="text-white/85 text-xs font-bold uppercase tracking-wider m-0 flex items-center gap-1 mt-1">
                              <MapPin size={12} className="text-brand-indigo" /> {store.city} Showroom
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-7 flex-1 flex flex-col justify-between space-y-6">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 m-0 line-clamp-2 leading-relaxed">
                        {store.description || 'Visit our showroom to view the full product range, get technical consultation, and enjoy fast local support.'}
                      </p>

                      {store.address && (
                        <div className="mt-4 flex items-start gap-2 text-xs font-bold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <MapPin size={14} className="text-brand-indigo flex-shrink-0 mt-0.5" />
                          <span>{store.address}</span>
                        </div>
                      )}
                    </div>

                    {/* Footer Details & Action Buttons */}
                    <div className="border-t border-slate-100 pt-5 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-450">
                        {store.operatingHours && (
                          <span className="flex items-center gap-1.5 bg-slate-100/70 px-3 py-1.5 rounded-lg text-slate-600">
                            <Clock size={13} className="text-brand-indigo" /> {store.operatingHours.open} - {store.operatingHours.close}
                          </span>
                        )}
                        {store.phone && (
                          <a
                            href={`tel:${store.phone}`}
                            className="flex items-center gap-1.5 bg-slate-100/70 px-3 py-1.5 rounded-lg text-slate-600 hover:text-brand-indigo transition-colors no-underline"
                          >
                            <Phone size={13} className="text-brand-indigo" /> {store.phone}
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-3 pt-1">
                        <Link
                          to={`/store/${store._id}`}
                          className="flex-1 bg-brand-indigo hover:bg-brand-indigo/90 text-white text-xs font-extrabold uppercase tracking-wider py-3.5 px-4 rounded-2xl text-center shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer no-underline"
                        >
                          Explore Branch Catalog <ArrowRight size={14} />
                        </Link>
                        {store.address && (
                          <a
                            href={`https://maps.google.com/?q=${encodeURIComponent(store.name + ' ' + store.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-3 rounded-2xl transition-colors cursor-pointer"
                            title="Get Directions on Google Maps"
                          >
                            <Navigation size={16} className="text-brand-indigo" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-[2.5rem] p-16 text-center border border-slate-200/60 max-w-lg mx-auto shadow-sm">
            <span className="text-5xl block mb-4">📍</span>
            <h3 className="text-lg font-black text-slate-800 mb-2 mt-0">No Stores Found</h3>
            <p className="text-slate-450 text-sm m-0 font-semibold">
              No store location matches "{searchTerm || selectedCity}". Try searching for another city or clear filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreList;
