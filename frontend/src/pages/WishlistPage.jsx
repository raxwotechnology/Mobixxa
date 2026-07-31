import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import useWishlistStore from '../store/wishlistStore';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import useCurrencyStore from '../store/currencyStore';
import { toast } from 'react-toastify';
import { getImageUrl, handleImageError } from '../utils/imageHelper';

const WishlistPage = () => {
  const { products, loading, fetchWishlist, removeProduct } = useWishlistStore();
  const { addItem } = useCartStore();
  const { user } = useAuthStore();
  const { getProductPrice, convertPrice, formatPrice } = useCurrencyStore();

  useEffect(() => {
    if (user) fetchWishlist();
  }, [user]);

  const handleMoveToCart = async (product) => {
    try {
      await addItem(product);
      await removeProduct(product._id);
      toast.success(`${product.name} moved to cart!`);
    } catch (err) {
      toast.error('Failed to add to cart');
    }
  };

  const handleRemove = async (product) => {
    await removeProduct(product._id);
    toast.info(`${product.name} removed from wishlist`);
  };

  if (!user) {
    return (
      <div className="base-container py-20 text-center">
        <Heart size={48} className="text-slate-350 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-slate-800 mb-2 mt-0">Sign In to View Wishlist</h2>
        <Link to="/login" className="text-brand-indigo font-bold hover:underline">Sign In</Link>
      </div>
    );
  }

  if (products.length === 0 && !loading) {
    return (
      <div className="base-container py-20 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-[2rem] p-12 max-w-md mx-auto border border-slate-200/50 shadow-sm"
        >
          <div className="w-20 h-20 bg-rose-50 border border-rose-100 rounded-full mx-auto mb-6 flex items-center justify-center shadow-sm">
            <Heart size={32} className="text-rose-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2 mt-0">Your Wishlist is Empty</h2>
          <p className="text-slate-400 text-sm mb-6 font-medium">Save your favorite items here for later.</p>
          <Link to="/shop" className="bg-gradient-to-r from-brand-indigo to-brand-violet hover:opacity-95 text-white text-xs font-bold py-3.5 px-8 rounded-xl transition-all shadow-[0_4px_12px_rgba(99,102,241,0.2)] inline-block cursor-pointer">
            Browse Products
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="base-container py-10">
      <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight mt-0 mb-8 border-b border-slate-100 pb-4">
        My Wishlist <span className="text-slate-400 font-bold text-base md:text-lg">({products.length} items)</span>
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product, i) => (
          <motion.div
            key={product._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            className="bg-white border border-slate-200/60 rounded-[2rem] overflow-hidden hover:shadow-lg hover:border-brand-indigo/40 transition-all flex flex-col"
          >
            <Link to={`/product/${product._id}`} className="block relative aspect-square overflow-hidden bg-slate-50 border-b border-slate-100">
              <img
                src={getImageUrl(product.productLink || product.images?.[0]) || 'https://via.placeholder.com/400'}
                alt={product.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 p-2 rounded-t-[2rem]"
                loading="lazy"
                onError={(e) => handleImageError(e, 'Product')}
              />
              {product.discount > 0 && (
                <span className="absolute top-4 left-4 bg-rose-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  -{product.discount}% OFF
                </span>
              )}
            </Link>
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <Link to={`/product/${product._id}`}>
                  <h3 className="font-bold text-slate-800 text-sm mb-2 mt-0 hover:text-brand-indigo transition-colors line-clamp-2 leading-snug">
                    {product.name}
                  </h3>
                </Link>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-base font-extrabold text-slate-800">{getProductPrice(product)}</span>
                  {product.mrp > product.price && (
                    <span className="text-xs text-slate-400 line-through font-semibold">{formatPrice(convertPrice(product.mrp))}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleMoveToCart(product)}
                  className="flex-1 bg-gradient-to-r from-brand-indigo to-brand-violet hover:opacity-95 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-[0_4px_12px_rgba(99,102,241,0.15)] flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
                >
                  <ShoppingCart size={13} /> Add to Cart
                </button>
                <button
                  onClick={() => handleRemove(product)}
                  className="w-10 h-10 border border-slate-200 rounded-xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 transition-all cursor-pointer text-slate-400"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default WishlistPage;
