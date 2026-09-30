'use client';

import { useEffect } from 'react';
import { Link } from '../utils/navigation';
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
        <h2 className="text-2xl font-bold text-slate-800 mb-2 mt-0">Sign In to View Wishlist</h2>
        <Link to="/login" className="text-brand-indigo font-bold hover:underline">Sign In</Link>
      </div>
    );
  }

  if (products.length === 0 && !loading) {
    return (
      <div className="base-container py-20 text-center" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="ds-empty">
          <Heart size={44} className="ds-empty-icon" style={{ color: '#f43f5e' }} />
          <p className="ds-empty-title">Your Wishlist is Empty</p>
          <p className="ds-empty-desc">Save your favorite devices and accessories here for later.</p>
          <div style={{ marginTop: '1.25rem' }}>
            <Link to="/shop" className="ds-btn ds-btn-primary">
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="base-container py-10" style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: 'var(--ds-text-xl)', fontWeight: 700, color: 'var(--ds-text-head)', margin: 0 }}>My Wishlist</h1>
          <p style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-muted)', margin: '0.25rem 0 0' }}>Items saved for future purchase</p>
        </div>
        <span className="ds-badge ds-badge-slate">{products.length} items</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
        {products.map((product, i) => (
          <motion.div
            key={product._id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
            className="ds-card"
            style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
          >
            <Link to={`/product/${product._id}`} style={{ position: 'relative', display: 'block', aspectRatio: '1', background: '#fafbfc', borderBottom: '1px solid var(--ds-border-soft)' }}>
              <img
                src={getImageUrl(product.productLink || product.images?.[0]) || `https://placehold.co/400x400/f8fafc/64748b?text=${encodeURIComponent(product.name || 'Device')}`}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '1rem', transition: 'transform 0.3s' }}
                loading="lazy"
                onError={(e) => handleImageError(e, product.name || 'Device')}
              />
              {product.discount > 0 && (
                <span className="ds-badge ds-badge-red" style={{ position: 'absolute', top: '0.75rem', left: '0.75rem' }}>
                  -{product.discount}% OFF
                </span>
              )}
            </Link>

            <div style={{ padding: '1rem 1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <Link to={`/product/${product._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <h3 style={{ fontSize: 'var(--ds-text-sm)', fontWeight: 600, color: 'var(--ds-text-head)', margin: '0 0 0.5rem', lineHeight: 1.4 }} className="line-clamp-2">
                    {product.name}
                  </h3>
                </Link>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: 'var(--ds-text-md)', fontWeight: 700, color: 'var(--ds-text-head)' }}>{getProductPrice(product)}</span>
                  {product.mrp > product.price && (
                    <span style={{ fontSize: 'var(--ds-text-2xs)', color: 'var(--ds-text-muted)', textDecoration: 'line-through' }}>
                      {formatPrice(convertPrice(product.mrp))}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleMoveToCart(product)}
                  className="ds-btn ds-btn-primary ds-btn-sm"
                  style={{ flex: 1 }}
                >
                  <ShoppingCart size={13} /> Add to Cart
                </button>
                <button
                  onClick={() => handleRemove(product)}
                  className="ds-btn ds-btn-ghost ds-btn-icon ds-btn-sm"
                  style={{ color: '#be123c' }}
                  title="Remove from wishlist"
                >
                  <Trash2 size={14} />
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
