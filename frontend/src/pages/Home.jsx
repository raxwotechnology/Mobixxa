import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Star, ArrowRight, Truck, ShieldCheck, Clock3, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';
import { getCategories, getFeaturedProducts, getDeals } from '../services/api';
import ProductCard from '../components/ProductCard';
import useSettingsStore from '../store/settingsStore';
import { getImageUrl } from '../utils/imageHelper';

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const settings = useSettingsStore((s) => s.settings);
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);
  const heroProducts = settings?.heroProducts || [
    { name: 'iPhone 15 Pro Max', price: 450000, emoji: '📱' },
    { name: 'AirPods Pro', price: 85000, emoji: '🎧' },
  ];

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, featRes, dealsRes] = await Promise.all([
          getCategories(),
          getFeaturedProducts(),
          getDeals(),
        ]);
        setCategories(catRes.data);
        setFeatured(featRes.data);
        setDeals(dealsRes.data);
      } catch (error) {
        console.error('Error fetching homepage data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div>
      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white border-b border-slate-800/40">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-10 w-80 h-80 bg-brand-indigo/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-brand-violet/10 rounded-full blur-[130px]"></div>
        </div>
        <div className="base-container py-20 md:py-28 flex flex-col md:flex-row items-center justify-between relative z-10">
          <motion.div
            className="md:w-1/2 mb-12 md:mb-0"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-flex items-center gap-2 bg-brand-indigo/15 text-brand-indigo text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-wider border border-brand-indigo/25">
              <Sparkles size={13} className="text-brand-indigo" /> Next-Gen Technology
            </span>
            {/* Brand Name - editable from admin settings */}
            <div className="mb-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Welcome to</p>
              <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-fuchsia bg-clip-text text-transparent leading-tight">
                {settings?.shopName || 'Mobile Hub'}
              </h2>
            </div>
            <h1 className="text-4xl md:text-6xl font-semibold leading-tight mb-6 mt-0 tracking-tight">
              Premium Tech &
              <br />
              <span className="bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-cyan bg-clip-text text-transparent">
                Smart Devices.
              </span>
            </h1>
            <p className="text-slate-400 text-lg mb-8 max-w-lg leading-relaxed font-medium">
              Discover the latest smartphones, powerful laptops, immersive audio, and premium accessories curated for modern lifestyles. Upgrade your tech today.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/shop"
                className="bg-gradient-to-r from-brand-indigo to-brand-violet hover:opacity-95 text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-[0_6px_20px_rgba(99,102,241,0.35)] inline-flex items-center gap-2"
              >
                Shop Now <ArrowRight size={18} />
              </Link>
              <Link
                to="/deals"
                className="border border-slate-700 bg-slate-800/30 hover:bg-slate-800/60 text-white font-bold py-4 px-8 rounded-2xl transition-all inline-flex items-center gap-2 backdrop-blur-sm"
              >
                Tech Deals
              </Link>
            </div>
          </motion.div>

          <motion.div
            className="md:w-1/2 flex justify-center"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="relative">
              <div className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full overflow-hidden shadow-[0_15px_45px_rgba(99,102,241,0.25)] border-4 border-brand-indigo/35 bg-white/5 p-1 backdrop-blur-sm flex items-center justify-center mx-auto">
                <img
                  src={getImageUrl(settings?.logoUrl) || '/logo.png'}
                  alt={settings?.shopName || 'Shop Logo'}
                  className="w-full h-full object-cover rounded-full transition-transform duration-500 hover:scale-105"
                  onError={(e) => { e.target.onerror = null; e.target.src = '/logo.png'; }}
                />
              </div>
              {/* Floating badges */}
              {heroProducts[0] && (
                <motion.div
                  className="absolute -top-4 right-0 bg-slate-900/90 border border-slate-800 backdrop-blur-md rounded-2xl shadow-xl p-3.5 flex items-center gap-3"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <span className="text-2xl">{heroProducts[0].emoji || '📱'}</span>
                  <div>
                    <p className="text-xs font-bold text-white m-0 leading-tight">{heroProducts[0].name}</p>
                    <p className="text-xs text-brand-indigo m-0 font-bold mt-1">LKR {Number(heroProducts[0].price).toLocaleString()}</p>
                  </div>
                </motion.div>
              )}
              {heroProducts[1] && (
                <motion.div
                  className="absolute bottom-4 -left-4 bg-slate-900/90 border border-slate-800 backdrop-blur-md rounded-2xl shadow-xl p-3.5 flex items-center gap-3"
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <span className="text-2xl">{heroProducts[1].emoji || '💻'}</span>
                  <div>
                    <p className="text-xs font-bold text-white m-0 leading-tight">{heroProducts[1].name}</p>
                    <p className="text-xs text-brand-indigo m-0 font-bold mt-1">LKR {Number(heroProducts[1].price).toLocaleString()}</p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== VALUE PROPS ===== */}
      <section className="bg-slate-50/50 border-y border-slate-200/50 backdrop-blur-sm">
        <div className="base-container py-10 px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: <Truck size={22} />, title: 'Free Shipping', desc: 'On all devices islandwide' },
              { icon: <Clock3 size={22} />, title: 'Fast Dispatch', desc: 'Packed in 24 hours' },
              { icon: <ShieldCheck size={22} />, title: 'Official Warranty', desc: 'Guaranteed 100% genuine' },
              { icon: <Cpu size={22} />, title: 'Latest Tech', desc: 'Curated top-tier brands' },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-3.5"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <div className="w-12 h-12 bg-brand-indigo/10 rounded-xl flex items-center justify-center text-brand-indigo flex-shrink-0 shadow-sm">
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800 m-0">{item.title}</h4>
                  <p className="text-xs text-slate-400 m-0 mt-0.5 font-medium">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section className="base-container py-16 px-4">
        <motion.div
          className="flex items-end justify-between mb-10"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp} transition={{ duration: 0.5 }}
        >
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mt-0 mb-1.5 tracking-tight">Explore Categories</h2>
            <p className="text-slate-500 m-0 text-sm font-medium">Discover curated smart devices and premium accessories</p>
          </div>
          <Link to="/shop" className="text-brand-indigo hover:text-brand-violet transition-colors font-bold text-sm flex items-center gap-1">
            View All <ArrowRight size={15} />
          </Link>
        </motion.div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {categories.map((cat, i) => (
            <motion.div
              key={cat._id}
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} transition={{ delay: i * 0.05, duration: 0.4 }}
            >
              <Link
                to={`/shop?category=${cat._id}`}
                className="glass-card rounded-2xl p-5 text-center cursor-pointer group block"
              >
                <div className="w-14 h-14 bg-slate-50 group-hover:bg-brand-indigo/10 rounded-2xl mx-auto mb-3.5 flex items-center justify-center text-2xl transition-all shadow-inner">
                  {cat.icon}
                </div>
                <h3 className="font-bold text-xs text-slate-700 mt-0 mb-0 group-hover:text-brand-indigo transition-colors truncate">
                  {cat.name}
                </h3>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== DEALS OF THE DAY ===== */}
      {deals.length > 0 && (
        <section className="bg-gradient-to-b from-slate-50 to-white py-16 border-y border-slate-100">
          <div className="base-container px-4">
            <motion.div
              className="flex items-end justify-between mb-10"
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} transition={{ duration: 0.5 }}
            >
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-2xl">⚡</span>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 mt-0 mb-0 tracking-tight">Flash Deals</h2>
                </div>
                <p className="text-slate-500 m-0 text-sm font-medium">Grab these tech picks before they are gone</p>
              </div>
              <Link to="/deals" className="text-brand-indigo hover:text-brand-violet transition-colors font-bold text-sm flex items-center gap-1">
                View All <ArrowRight size={15} />
              </Link>
            </motion.div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {deals.slice(0, 8).map((product, i) => (
                <motion.div
                  key={product._id}
                  initial="hidden" whileInView="visible" viewport={{ once: true }}
                  variants={fadeUp} transition={{ delay: i * 0.1, duration: 0.5 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== FEATURED PRODUCTS ===== */}
      {featured.length > 0 && (
        <section className="base-container py-16 px-4">
          <motion.div
            className="flex items-end justify-between mb-10"
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} transition={{ duration: 0.5 }}
          >
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 mt-0 mb-1.5 tracking-tight">Featured Devices</h2>
              <p className="text-slate-500 m-0 text-sm font-medium">Handpicked favorites by our tech experts</p>
            </div>
            <Link to="/shop?featured=true" className="text-brand-indigo hover:text-brand-violet transition-colors font-bold text-sm flex items-center gap-1">
              View All <ArrowRight size={15} />
            </Link>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {featured.slice(0, 8).map((product, i) => (
              <motion.div
                key={product._id}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} transition={{ delay: i * 0.08, duration: 0.5 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ===== TESTIMONIALS ===== */}
      <section className="base-container py-16 px-4">
        <motion.div
          className="text-center mb-12"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp} transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 mt-0 mb-1.5 tracking-tight">What Our Customers Say</h2>
          <p className="text-slate-500 m-0 text-sm font-medium">Trusted by tech enthusiasts everywhere</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { name: 'Alex M.', text: "Got my new iPhone delivered the same day. Incredible service and the packaging was flawless. Highly recommended!", avatar: '👨‍💻', rating: 5 },
            { name: 'Sarah J.', text: "The range of accessories is unmatched. Found the perfect MagSafe case and wireless charger combo here.", avatar: '👩‍💼', rating: 5 },
            { name: 'Kevin D.', text: "Best tech store online. The warranty support is solid and the prices are always competitive.", avatar: '👨', rating: 4 },
            { name: 'Maria L.', text: "Fast shipping and excellent customer service. Will definitely be shopping here again!", avatar: '👩', rating: 5 },
          ].map((testimonial, i) => (
            <motion.div
              key={i}
              className="glass-card rounded-3xl p-6 shadow-sm flex flex-col justify-between"
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} transition={{ delay: i * 0.15, duration: 0.5 }}
            >
              <div>
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} size={15} className="fill-brand-violet text-brand-violet" />
                  ))}
                </div>
                <p className="text-slate-600 text-sm italic mb-6 leading-relaxed">"{testimonial.text}"</p>
              </div>
              <div className="flex items-center gap-3 border-t border-slate-100/50 pt-4">
                <span className="text-2xl">{testimonial.avatar}</span>
                <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">{testimonial.name}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
