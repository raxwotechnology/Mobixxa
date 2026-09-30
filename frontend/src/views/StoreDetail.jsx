'use client';

import { useState, useEffect } from 'react';
import { useParams, Link } from '../utils/navigation';
import { MapPin, Clock, Phone, Mail, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { getStoreById, getProducts } from '../services/api';
import ProductCard from '../components/ProductCard';
import { getImageUrl } from '../utils/imageHelper';

const StoreDetail = () => {
  const { id } = useParams();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [storeRes, prodRes] = await Promise.all([
          getStoreById(id),
          getProducts({ store: id, limit: 20 }),
        ]);
        setStore(storeRes.data);
        setProducts(prodRes.data.products);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-64 bg-slate-100" />
        <div className="base-container py-10 space-y-4">
          <div className="h-8 bg-slate-100 rounded w-1/3" />
          <div className="h-4 bg-slate-100 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="base-container py-20 text-center">
        <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Store Not Found</h2>
        <Link to="/stores" className="text-brand-indigo font-bold hover:underline">Back to Stores</Link>
      </div>
    );
  }

  return (
    <div>
      {/* Store Banner */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img
          src={getImageUrl(store.bannerImage) || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200'}
          alt={store.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0">
          <div className="base-container py-6 flex items-end gap-5">
            <div className="w-20 h-20 rounded-[1.25rem] border-2 border-white/95 overflow-hidden bg-white shadow-xl flex-shrink-0 p-0.5">
              <img src={getImageUrl(store.logo) || `https://placehold.co/200x200/f8fafc/64748b?text=${encodeURIComponent(store.name || 'Store')}`} alt={store.name} className="w-full h-full object-contain rounded-xl p-1" onError={(e) => handleImageError(e, store.name || 'Store')} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mt-0 mb-1 drop-shadow-md">{store.name}</h1>
              <div className="flex items-center gap-4 text-white/80 text-xs font-bold uppercase tracking-wider flex-wrap">
                {store.city && (
                  <span className="flex items-center gap-1"><MapPin size={13} className="text-brand-indigo" /> {store.city}</span>
                )}
                {store.operatingHours && (
                  <span className="flex items-center gap-1"><Clock size={13} className="text-brand-indigo" /> {store.operatingHours.open} - {store.operatingHours.close}</span>
                )}
                {store.isActive && (
                  <span className="bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-xl">Open Now</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="base-container py-10">
        {/* Store Info Card */}
        <motion.div
          className="bg-white border border-slate-200/60 rounded-[2rem] p-6 lg:p-8 mb-10 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider mt-0 mb-3 border-b border-slate-100 pb-2">About the Showroom</h3>
              <p className="text-xs font-semibold text-slate-400 leading-relaxed m-0">{store.description}</p>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider mt-0 mb-3 border-b border-slate-100 pb-2">Contact Details</h3>
              <div className="space-y-3">
                {store.phone && (
                  <p className="text-xs font-bold text-slate-650 m-0 flex items-center gap-2">
                    <Phone size={14} className="text-brand-indigo" /> {store.phone}
                  </p>
                )}
                {store.email && (
                  <p className="text-xs font-bold text-slate-700 m-0 flex items-center gap-2">
                    <Mail size={14} className="text-brand-indigo" /> {store.email}
                  </p>
                )}
                {store.address && (
                  <p className="text-xs font-bold text-slate-700 m-0 flex items-center gap-2">
                    <MapPin size={14} className="text-brand-indigo" /> {store.address}
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Store Products */}
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-850 mb-6 mt-0">Products from {store.name}</h2>
          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product, i) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200/60 rounded-[2rem] p-12 text-center shadow-sm">
              <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                
              </div>
              <h3 className="text-lg font-bold text-slate-800 m-0">No Products Yet</h3>
              <p className="text-slate-400 text-sm font-semibold mt-1 mb-0">This store hasn't added any products.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreDetail;
