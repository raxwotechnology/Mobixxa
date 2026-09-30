'use client';

import { useEffect } from 'react';
import { Link } from '../utils/navigation';
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
          <h2 className="text-2xl font-bold text-slate-800 mb-2 mt-0">Your Cart is Empty</h2>
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
    <div className="ds-page">
      <div className="ds-page-header">
        <div>
          <h1 className="ds-page-title">Shopping Cart</h1>
          <p className="ds-page-subtitle">Review items, adjust quantities, and proceed to checkout ({items.length} items)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Cart Items */}
        <div className="lg:col-span-8 space-y-4">
          <div className="ds-card p-0 overflow-hidden divide-y divide-slate-100">
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
                    className="flex flex-wrap sm:flex-nowrap items-center gap-4 p-4 sm:p-5"
                  >
                    {/* Product Image */}
                    <Link to={`/product/${productId}`} className="flex-shrink-0">
                      <img
                        src={getImageUrl(image) || `https://placehold.co/100x100/f8fafc/64748b?text=${encodeURIComponent(name || 'Device')}`}
                        alt={name}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-contain border border-slate-200/80 p-1 bg-white"
                        onError={(e) => handleImageError(e, name || 'Device')}
                      />
                    </Link>

                    {/* Details */}
                    <div className="flex-1 min-w-[150px]">
                      <Link to={`/product/${productId}`} className="font-semibold text-slate-800 hover:text-blue-600 transition-colors text-sm sm:text-base block line-clamp-2 leading-snug">
                        {name}
                      </Link>
                      {unit && <p className="text-xs font-medium text-slate-400 m-0 mt-1 uppercase tracking-wide">per {unit}</p>}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="font-bold text-slate-900 text-sm">{formatPrice(convertPrice(price))}</span>
                        {mrp > price && (
                          <span className="text-xs text-slate-400 line-through font-medium">{formatPrice(convertPrice(mrp))}</span>
                        )}
                      </div>
                    </div>

                    {/* Quantity & Actions wrapper */}
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 mt-2 sm:mt-0">
                      {/* Quantity */}
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                        <button
                          onClick={() => handleQuantityChange(productId, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer text-slate-600"
                          disabled={item.quantity <= 1}
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-10 h-8 flex items-center justify-center border-x border-slate-200 text-xs font-bold text-slate-800 font-mono">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(productId, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer text-slate-600"
                          disabled={item.quantity >= stock}
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      {/* Line Total */}
                      <div className="text-right min-w-[90px]">
                        <span className="font-bold text-blue-600 text-base sm:text-lg tabular-nums">{formatPrice(convertPrice(price * item.quantity))}</span>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => handleRemove(productId, name)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-2 rounded-lg hover:bg-rose-50 cursor-pointer border-0 bg-transparent"
                        title="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-4 w-full">
          <motion.div
            className="ds-card sticky top-24"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <h3 className="font-semibold text-slate-900 text-base mt-0 mb-4 border-b border-slate-100 pb-3">Order Summary</h3>

            <div className="space-y-3 mb-5">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <span>Subtotal</span>
                <span className="text-slate-900 font-bold text-sm tabular-nums">{formatPrice(convertPrice(subtotal))}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <span>Delivery Fee</span>
                <span className="text-slate-900 font-bold text-sm tabular-nums">
                  {deliveryFee === 0 ? (
                    <span className="ds-badge-green font-bold text-xs">FREE</span>
                  ) : (
                    formatPrice(convertPrice(deliveryFee))
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <span>Tax (8%)</span>
                <span className="text-slate-900 font-bold text-sm tabular-nums">{formatPrice(convertPrice(tax))}</span>
              </div>
              {subtotal < 50 && (
                <div className="text-xs text-blue-700 bg-blue-50 border border-blue-200/80 rounded-lg p-3 font-medium">
                  Add {formatPrice(convertPrice(50 - subtotal))} more for free delivery!
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-4 mb-5">
              <div className="flex justify-between items-baseline">
                <span className="font-semibold text-slate-900 text-sm">Total</span>
                <span className="font-bold text-blue-600 text-xl tracking-tight tabular-nums">{formatPrice(convertPrice(total))}</span>
              </div>
            </div>

            {user ? (
              <Link
                to="/checkout"
                className="ds-btn ds-btn-primary w-full justify-center text-sm py-3 cursor-pointer no-underline"
              >
                Proceed to Checkout <ArrowRight size={15} />
              </Link>
            ) : (
              <Link
                to="/login"
                className="ds-btn ds-btn-primary w-full justify-center text-sm py-3 text-center cursor-pointer no-underline"
              >
                Sign In to Checkout
              </Link>
            )}

            <Link
              to="/shop"
              className="block text-center text-xs font-semibold text-slate-500 hover:text-blue-600 mt-4 tracking-wide no-underline transition-colors"
            >
              ← Continue Shopping
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
