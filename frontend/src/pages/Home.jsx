import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
      <section 
        className="relative overflow-hidden text-white border-b border-slate-800/40 py-20 md:py-28 transition-all duration-300"
        style={{
          background: `linear-gradient(135deg, #020617 0%, #0f172a 45%, ${primaryColor} 100%)`
        }}
      >
        {/* Animated Background Orbs */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-35"
          style={{ background: `radial-gradient(circle at top right, ${primaryColor}, transparent 65%)` }}
        />

        <div className="base-container flex flex-col md:flex-row items-center justify-between relative z-10">
          <motion.div
            className="md:w-1/2 mb-12 md:mb-0"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.span
              className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-wider border shadow-xs"
              style={{ backgroundColor: `${primaryColor}25`, color: '#ffffff', borderColor: `${primaryColor}60` }}
              whileHover={{ scale: 1.05 }}
            >
              <Sparkles size={14} className="text-white animate-pulse" /> Next-Gen Technology
            </motion.span>

            {/* Brand Name */}
            <div className="mb-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Welcome to</p>
              <motion.h2
                className="text-3xl md:text-5xl font-extrabold text-white leading-tight m-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
              >
                {settings?.shopName || 'Mobile Hub'}
              </motion.h2>
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6 mt-0 tracking-tight text-white">
              Premium Tech &
              <br />
              <span className="text-white opacity-95 drop-shadow-sm">
                Smart Devices.
              </span>
            </h1>

            <p className="text-slate-300 text-base md:text-lg mb-8 max-w-lg leading-relaxed font-normal">
              Discover the latest smartphones, powerful laptops, immersive audio, and premium accessories curated for modern lifestyles. Upgrade your tech today.
            </p>

            <div className="flex flex-wrap gap-4">
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Link
                  to="/shop"
                  style={{ backgroundColor: primaryColor, boxShadow: `0 8px 25px -4px ${primaryColor}60` }}
                  className="hover:opacity-95 text-white font-bold py-4 px-8 rounded-2xl transition-all inline-flex items-center gap-2 shadow-lg"
                >
                  Shop Now <ArrowRight size={18} />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Link
                  to="/deals"
                  className="border border-slate-700/80 bg-slate-900/60 hover:bg-slate-800 text-white font-bold py-4 px-8 rounded-2xl transition-all inline-flex items-center gap-2 backdrop-blur-md shadow-sm"
                >
                  Tech Deals
                </Link>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            className="md:w-1/2 flex justify-center"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="relative group">
              {/* Rotating Outer Glow Ring */}
              <motion.div
                className="absolute -inset-3 rounded-full bg-gradient-to-r from-blue-500 via-sky-400 to-cyan-500 opacity-40 blur-xl group-hover:opacity-70 transition-opacity duration-500"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              />

              <motion.div
                className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full overflow-hidden shadow-[0_20px_50px_rgba(37,99,235,0.3)] border-4 border-blue-500/40 bg-white/5 p-1 backdrop-blur-md flex items-center justify-center mx-auto"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <img
                  src={getImageUrl(settings?.logoUrl) || '/logo.png'}
                  alt={settings?.shopName || 'Shop Logo'}
                  className="w-full h-full object-cover rounded-full transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => { e.target.onerror = null; e.target.src = '/logo.png'; }}
                />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== VALUE PROPS ===== */}
      <section className="bg-white/80 border-y border-slate-200/80 backdrop-blur-md shadow-xs">
        <div className="base-container py-8 px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: <Truck size={22} />, title: 'Free Shipping', desc: 'On all devices islandwide' },
              { icon: <Clock3 size={22} />, title: 'Fast Dispatch', desc: 'Packed in 24 hours' },
              { icon: <ShieldCheck size={22} />, title: 'Official Warranty', desc: 'Guaranteed 100% genuine' },
              { icon: <Cpu size={22} />, title: 'Latest Tech', desc: 'Curated top-tier brands' },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-blue-50/50 transition-all cursor-default"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -3, scale: 1.02 }}
              >
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 flex-shrink-0 shadow-xs border border-blue-100">
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 m-0">{item.title}</h4>
                  <p className="text-xs text-slate-500 m-0 mt-0.5 font-normal">{item.desc}</p>
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
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mt-0 mb-1.5 tracking-tight">Explore Categories</h2>
            <p className="text-slate-500 m-0 text-sm font-normal">Discover curated smart devices and premium accessories</p>
          </div>
          <Link to="/shop" className="text-blue-600 hover:text-blue-700 transition-colors font-semibold text-sm flex items-center gap-1">
            View All <ArrowRight size={15} />
          </Link>
        </motion.div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {categories.map((cat, i) => (
            <motion.div
              key={cat._id}
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} transition={{ delay: i * 0.05, duration: 0.4 }}
              whileHover={{ y: -8, scale: 1.04 }}
            >
              <Link
                to={`/shop?category=${cat._id}`}
                className="bg-white border border-slate-200/80 hover:border-blue-400/80 rounded-2xl p-4 text-center cursor-pointer group block shadow-xs hover:shadow-[0_12px_25px_rgba(37,99,235,0.12)] transition-all duration-300"
              >
                <div className="w-14 h-14 bg-slate-50 group-hover:bg-blue-50/80 rounded-2xl mx-auto mb-3 flex items-center justify-center text-2xl transition-colors shadow-inner border border-slate-100">
                  {cat.icon}
                </div>
                <h3 className="font-semibold text-xs text-slate-800 mt-0 mb-0 group-hover:text-blue-600 transition-colors truncate">
                  {cat.name}
                </h3>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== DEALS OF THE DAY ===== */}
      {deals.length > 0 && (
        <section className="bg-gradient-to-b from-slate-50 via-blue-50/20 to-white py-16 border-y border-slate-200/60">
          <div className="base-container px-4">
            <motion.div
              className="flex items-end justify-between mb-10"
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} transition={{ duration: 0.5 }}
            >
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <motion.span
                    className="text-2xl inline-block"
                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    ⚡
                  </motion.span>
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mt-0 mb-0 tracking-tight">Flash Deals</h2>
                </div>
                <p className="text-slate-500 m-0 text-sm font-normal">Grab these tech picks before they are gone</p>
              </div>
              <Link to="/deals" className="text-blue-600 hover:text-blue-700 transition-colors font-semibold text-sm flex items-center gap-1">
                View All <ArrowRight size={15} />
              </Link>
            </motion.div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {deals.slice(0, 8).map((product, i) => (
                <motion.div
                  key={product._id}
                  initial="hidden" whileInView="visible" viewport={{ once: true }}
                  variants={fadeUp} transition={{ delay: i * 0.08, duration: 0.5 }}
                  whileHover={{ y: -4 }}
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
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mt-0 mb-1.5 tracking-tight">Featured Devices</h2>
              <p className="text-slate-500 m-0 text-sm font-normal">Handpicked favorites by our tech experts</p>
            </div>
            <Link to="/shop?featured=true" className="text-blue-600 hover:text-blue-700 transition-colors font-semibold text-sm flex items-center gap-1">
              View All <ArrowRight size={15} />
            </Link>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {featured.slice(0, 8).map((product, i) => (
              <motion.div
                key={product._id}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} transition={{ delay: i * 0.08, duration: 0.5 }}
                whileHover={{ y: -4 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ===== TESTIMONIALS ===== */}
      <section className="bg-slate-50/70 border-t border-slate-200/80 py-16">
        <div className="base-container px-4">
          <motion.div
            className="text-center mb-12"
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mt-0 mb-1.5 tracking-tight">What Our Customers Say</h2>
            <p className="text-slate-500 m-0 text-sm font-normal">Trusted by tech enthusiasts everywhere</p>
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
                className="bg-white border border-slate-200/80 hover:border-blue-300 rounded-3xl p-6 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} transition={{ delay: i * 0.12, duration: 0.5 }}
                whileHover={{ y: -6, scale: 1.02 }}
              >
                <div>
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, j) => (
                      <Star key={j} size={15} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-600 text-sm italic mb-6 leading-relaxed">"{testimonial.text}"</p>
                </div>
                <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
                  <span className="text-2xl">{testimonial.avatar}</span>
                  <span className="font-semibold text-xs text-slate-800 uppercase tracking-wider">{testimonial.name}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
