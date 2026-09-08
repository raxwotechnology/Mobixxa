'use client';

import { useState, useEffect } from 'react';
import { Link } from '../utils/navigation';
import { Star, ShoppingBag, Heart, Sparkles, Clock, ArrowRight } from 'lucide-react';
import { getDeals, getCategories } from '../services/api';
import useCartStore from '../store/cartStore';
import useWishlistStore from '../store/wishlistStore';
import useAuthStore from '../store/authStore';
import useCurrencyStore from '../store/currencyStore';
import { getImageUrl, handleImageError } from '../utils/imageHelper';
import { toast } from 'react-toastify';

const CARD_THEMES = [
  { bg: 'from-[#3a2012] via-[#2a170c] to-[#170c07]', accent: 'bg-amber-500 hover:bg-amber-600 text-white', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30', btn: 'bg-[#ff7a00] hover:bg-[#e06b00]' },
  { bg: 'from-[#4a1218] via-[#330c11] to-[#1a0608]', accent: 'bg-rose-500 hover:bg-rose-600 text-white', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30', btn: 'bg-[#e11d48] hover:bg-[#be123c]' },
  { bg: 'from-[#141e46] via-[#0e1532] to-[#070b1a]', accent: 'bg-blue-500 hover:bg-blue-600 text-white', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30', btn: 'bg-[#2563eb] hover:bg-[#1d4ed8]' },
  { bg: 'from-[#0b3323] via-[#072418] to-[#03130d]', accent: 'bg-emerald-500 hover:bg-emerald-600 text-white', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', btn: 'bg-[#10b981] hover:bg-[#059669]' },
];

const Deals = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emailSub, setEmailSub] = useState('');
  const [timeLeft, setTimeLeft] = useState({ hours: 9, minutes: 28, seconds: 2 });

  const { addItem } = useCartStore();
  const { addProduct, removeProduct, isInWishlist } = useWishlistStore();
  const { user } = useAuthStore();
  const { getProductPrice, exchangeRate, currency } = useCurrencyStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dealsRes = await getDeals();
        setDeals(dealsRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAddToCart = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await addItem(product, 1);
      toast.success(`${product.name} added to cart!`);
    } catch (err) {
      toast.error('Failed to add to cart');
    }
  };

  const handleToggleWishlist = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.info('Sign in to use wishlist');
      return;
    }
    const wishlisted = isInWishlist(product._id);
    if (wishlisted) {
      await removeProduct(product._id);
      toast.info('Removed from wishlist');
    } else {
      await addProduct(product._id);
      toast.success('Added to wishlist!');
    }
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (emailSub) {
      toast.success('Thank you for subscribing to Mobixa deal alerts!');
      setEmailSub('');
    }
  };

  return (
    <div className="bg-slate-50/50 min-h-screen">
      {/* ===== HERO BANNER (MATCHES SCREENSHOT 2) ===== */}
      <section className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 py-12 px-4 sm:px-6 lg:px-12 text-white relative overflow-hidden mb-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)] pointer-events-none" />
        <div className="base-container flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-900/40 border border-white/20 text-white text-[10px] font-extrabold uppercase tracking-widest mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping" />
              Exclusive Promotions
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white m-0 tracking-tight">
              Mega Deals &amp; Offers
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm m-0 mt-1 max-w-lg">
              Limited-time offers on premium tech — grab them before they expire.
            </p>
          </div>

          {/* Countdown Clock Box */}
          <div className="flex items-center gap-2 bg-blue-800/60 border border-white/20 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-lg">
            <Clock size={16} className="text-amber-300" />
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-200">Offers Expire In</span>
            <span className="font-mono font-black text-sm text-white bg-blue-950/60 px-2 py-0.5 rounded-md">
              {String(timeLeft.hours).padStart(2, '0')} : {String(timeLeft.minutes).padStart(2, '0')} : {String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </div>
        </div>
      </section>

      {/* ===== DEALS GRID (MATCHES SCREENSHOT 2) ===== */}
      <section className="base-container px-4 sm:px-6 mb-16">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-slate-200 rounded-3xl h-96" />
            ))}
          </div>
        ) : deals.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 max-w-md mx-auto">
            <span className="text-4xl">⚡</span>
            <h3 className="font-bold text-lg text-slate-800 mt-2">No active mega deals right now</h3>
            <p className="text-xs text-slate-500 mb-4">Check back soon for limited-time flash sales!</p>
            <Link to="/shop" className="inline-block bg-blue-600 text-white font-bold text-xs px-6 py-2.5 rounded-xl">
              Browse All Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {deals.map((product, index) => {
              const theme = CARD_THEMES[index % CARD_THEMES.length];
              const discount = product.discount || Math.round(Math.random() * 15 + 10);
              const wishlisted = user && isInWishlist(product._id);
              const imageUrl = getImageUrl(product.productLink || product.images?.[0]) || '/hero-products.jpg';

              return (
                <Link
                  key={product._id}
                  to={`/product/${product._id}`}
                  className="block group"
                >
                  <div className={`bg-gradient-to-b ${theme.bg} rounded-3xl p-5 text-white shadow-xl hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 border border-white/10 flex flex-col justify-between h-full`}>
                    {/* Card Top: Discount & Wishlist */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="bg-black/40 text-white text-[11px] font-black px-2.5 py-1 rounded-full border border-white/15">
                          -{discount}%
                        </span>
                        <button
                          onClick={(e) => handleToggleWishlist(e, product)}
                          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center transition-all"
                        >
                          <Heart size={14} className={wishlisted ? 'fill-rose-500 text-rose-500' : 'text-white'} />
                        </button>
                      </div>

                      {/* Product Image */}
                      <div className="w-full h-44 flex flex-col items-center justify-center mb-4 relative">
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="max-h-36 max-w-full object-contain drop-shadow-2xl group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => handleImageError(e, 'Product')}
                        />
                        <div className="mt-2 bg-black/40 border border-white/10 px-2.5 py-0.5 rounded-full text-[9px] font-mono text-white/80">
                          ⏱ {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m {String(timeLeft.seconds).padStart(2, '0')}s
                        </div>
                      </div>

                      {/* Tag / Category Badge */}
                      <div className="mb-2">
                        <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${theme.badge}`}>
                          {product.category?.name || 'DEAL'} • {product.brand || 'MOBIXA'}
                        </span>
                      </div>

                      {/* Product Title */}
                      <h3 className="font-extrabold text-sm sm:text-base leading-snug line-clamp-1 mb-1 text-white group-hover:text-amber-300 transition-colors">
                        {product.name}
                      </h3>

                      {/* Rating Stars */}
                      <div className="flex items-center gap-1 mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={11} className="fill-amber-400 text-amber-400" />
                        ))}
                        <span className="text-[10px] text-slate-300 ml-1">({product.numReviews || '1,200+'})</span>
                      </div>
                    </div>

                    {/* Bottom: Pricing & Add to Bag */}
                    <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                      <div>
                        {product.mrp && product.mrp > product.price && (
                          <p className="text-[11px] text-slate-400 line-through m-0">
                            {currency === 'USD' ? `$${(product.mrp / exchangeRate).toFixed(2)}` : `Rs. ${product.mrp.toLocaleString()}`}
                          </p>
                        )}
                        <p className="text-base font-black text-white m-0">
                          {getProductPrice(product)}
                        </p>
                      </div>

                      <button
                        onClick={(e) => handleAddToCart(e, product)}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-md transition-all ${theme.btn} active:scale-95 flex items-center gap-1.5`}
                      >
                        <ShoppingBag size={13} />
                        Add to Bag
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ===== SUBSCRIBE BANNER (MATCHES SCREENSHOT 2) ===== */}
      <section className="base-container px-4 sm:px-6 pb-20">
        <div className="w-full bg-blue-600 rounded-3xl p-6 sm:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-200">Subscribe &amp; Save More</span>
            <h3 className="text-2xl font-black text-white mt-1 mb-1">Get exclusive deal alerts</h3>
            <p className="text-blue-100 text-xs sm:text-sm m-0">Be the first to know about flash sales and new arrivals.</p>
          </div>

          <form onSubmit={handleSubscribe} className="flex w-full md:w-auto gap-2">
            <input
              type="email"
              required
              value={emailSub}
              onChange={(e) => setEmailSub(e.target.value)}
              placeholder="your@email.com"
              className="bg-blue-700/80 border border-blue-400/40 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-blue-200 focus:outline-none focus:ring-2 focus:ring-white w-full md:w-64"
            />
            <button
              type="submit"
              className="bg-white text-blue-700 font-extrabold text-xs px-5 py-2.5 rounded-xl hover:bg-blue-50 transition-all flex-shrink-0"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Deals;
