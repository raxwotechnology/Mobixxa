import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import useCurrencyStore from '../store/currencyStore';
import { toast } from 'react-toastify';
import { getImageUrl, handleImageError } from '../utils/imageHelper';

const CartPage = () => {
  const { items, loading, fetchCart, updateQuantity, removeItem } = useCartStore();
  const { user } = useAuthStore();
  const { convertPrice, formatPrice } = useCurrencyStore();
  const subtotal = useCartStore((s) => s.getSubtotal());
  const deliveryFee = subtotal > 50 ? 0 : 4.99;
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const total = subtotal + deliveryFee + tax;

  useEffect(() => {
    if (user) {
      fetchCart();
    }
  }, [user]);

  const handleQuantityChange = (productId, newQty) => {
    if (newQty < 1) return;
    updateQuantity(productId, newQty);
  };

  const handleRemove = (productId, name) => {
    removeItem(productId);
    toast.info(`${name} removed from cart`);
  };

  if (items.length === 0 && !loading) {
    return (
      <div className="base-container py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-card rounded-[2rem] p-12 max-w-md mx-auto border border-slate-200/50 shadow-sm"
        >
          <div className="w-20 h-20 bg-brand-indigo/5 border border-brand-indigo/10 rounded-full mx-auto mb-6 flex items-center justify-center">
            <ShoppingBag size={32} className="text-brand-indigo" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2 mt-0">Your Cart is Empty</h2>
          <p className="text-slate-400 text-sm mb-6 font-medium">Looks like you haven't added anything to your cart yet.</p>
          <Link
            to="/shop"
            className="bg-gradient-to-r from-brand-indigo to-brand-violet hover:opacity-95 text-white text-xs font-bold py-3.5 px-8 rounded-xl transition-all inline-flex items-center gap-2 shadow-[0_4px_12px_rgba(99,102,241,0.2)] cursor-pointer"
          >
            Start Shopping <ArrowRight size={14} />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="base-container py-10">
      <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight mt-0 mb-8 border-b border-slate-100 pb-4">
        Shopping Cart <span className="text-slate-400 font-bold text-base md:text-lg">({items.length} items)</span>
      </h1>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Cart Items */}
        <div className="flex-1 w-full">
          <div className="bg-white border border-slate-200/60 rounded-[2rem] overflow-hidden shadow-sm">
            <AnimatePresence>
              {items.map((item, i) => {
                const product = item.productId || {};
                const productId = product._id || item.productId;
                const name = product.name || item.name;
                const price = product.price || item.price;
                const mrp = product.mrp || price;
                const image = getImageUrl(product.productLink || product.images?.[0]) || item.image || '';
                const unit = product.unit || '';
                const stock = product.stock || 99;

                return (
                  <motion.div
                    key={productId}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    className="flex flex-wrap sm:flex-nowrap items-center gap-4 p-5 border-b border-slate-100 last:border-b-0 relative"
                  >
                    {/* Product Image */}
                    <Link to={`/product/${productId}`} className="flex-shrink-0">
                      <img
                        src={getImageUrl(image) || 'https://via.placeholder.com/100'}
                        alt={name}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-100 p-1"
                        onError={(e) => handleImageError(e, 'Product')}
                      />
                    </Link>

                    {/* Details */}
                    <div className="flex-1 min-w-[140px]">
                      <Link to={`/product/${productId}`} className="font-bold text-slate-800 hover:text-brand-indigo transition-colors text-sm sm:text-base block line-clamp-2 leading-snug">
                        {name}
                      </Link>
                      {unit && <p className="text-[10px] font-bold text-slate-400 m-0 mt-1 uppercase tracking-wide">per {unit}</p>}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="font-extrabold text-slate-800 text-sm">{formatPrice(convertPrice(price))}</span>
                        {mrp > price && (
                          <span className="text-xs text-slate-400 line-through font-semibold">{formatPrice(convertPrice(mrp))}</span>
                        )}
                      </div>
                    </div>

                    {/* Quantity & Actions wrapper */}
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 mt-2 sm:mt-0">
                      {/* Quantity */}
                      <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                        <button
                          onClick={() => handleQuantityChange(productId, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-slate-205 transition-colors cursor-pointer text-slate-500"
                          disabled={item.quantity <= 1}
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-10 h-8 flex items-center justify-center border-x border-slate-200 text-xs font-bold text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(productId, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-slate-205 transition-colors cursor-pointer text-slate-500"
                          disabled={item.quantity >= stock}
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      {/* Line Total */}
                      <div className="text-right min-w-[80px]">
                        <span className="font-extrabold text-brand-indigo text-sm sm:text-base">{formatPrice(convertPrice(price * item.quantity))}</span>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => handleRemove(productId, name)}
                        className="text-slate-400 hover:text-rose-500 transition-colors p-2 rounded-xl hover:bg-rose-50 cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:w-96 w-full">
          <motion.div
            className="bg-white border border-slate-200/60 rounded-[2rem] p-6 lg:p-8 sticky top-24 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <h3 className="font-black text-slate-800 text-lg mt-0 mb-5 border-b border-slate-100 pb-2">Order Summary</h3>

            <div className="space-y-4.5 mb-5">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                <span>Subtotal</span>
                <span className="text-slate-700 font-extrabold">{formatPrice(convertPrice(subtotal))}</span>
              </div>
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                <span>Delivery Fee</span>
                <span className="text-slate-700 font-extrabold">
                  {deliveryFee === 0 ? (
                    <span className="text-emerald-600">FREE</span>
                  ) : (
                    formatPrice(convertPrice(deliveryFee))
                  )}
                </span>
              </div>
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                <span>Tax (8%)</span>
                <span className="text-slate-700 font-extrabold">{formatPrice(convertPrice(tax))}</span>
              </div>
              {subtotal < 50 && (
                <p className="text-xs text-orange-600 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 m-0 font-medium">
                  Add {formatPrice(convertPrice(50 - subtotal))} more for free delivery!
                </p>
              )}
            </div>

            <div className="border-t border-slate-100 pt-5 mb-6">
              <div className="flex justify-between items-baseline">
                <span className="font-black text-slate-800 text-lg">Total</span>
                <span className="font-black text-brand-indigo text-xl tracking-tight">{formatPrice(convertPrice(total))}</span>
              </div>
            </div>

            {user ? (
              <Link
                to="/checkout"
                className="w-full bg-gradient-to-r from-brand-indigo to-brand-violet hover:opacity-95 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(99,102,241,0.25)] flex items-center justify-center gap-2 cursor-pointer"
              >
                Proceed to Checkout <ArrowRight size={15} />
              </Link>
            ) : (
              <Link
                to="/login"
                className="w-full bg-gradient-to-r from-brand-indigo to-brand-violet hover:opacity-95 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(99,102,241,0.25)] flex items-center justify-center gap-2 text-center cursor-pointer"
              >
                Sign In to Checkout
              </Link>
            )}

            <Link
              to="/shop"
              className="block text-center text-xs font-bold text-brand-indigo hover:underline mt-5 uppercase tracking-wider"
            >
              Continue Shopping
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
