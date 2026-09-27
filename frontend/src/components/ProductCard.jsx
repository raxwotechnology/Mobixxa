'use client';

import { Link } from '../utils/navigation';
import { Star, ShoppingCart, Heart, ShieldCheck, Cpu, Eye } from 'lucide-react';
import useCartStore from '../store/cartStore';
import useWishlistStore from '../store/wishlistStore';
import useAuthStore from '../store/authStore';
import useCurrencyStore from '../store/currencyStore';
import { toast } from 'react-toastify';

import { getImageUrl, handleImageError } from '../utils/imageHelper';

const ProductCard = ({ product }) => {
  const { addItem } = useCartStore();
  const { addProduct, removeProduct, isInWishlist } = useWishlistStore();
  const { user } = useAuthStore();
  const { getProductPrice, getProductPriceRaw, formatPrice, exchangeRate, currency } = useCurrencyStore();

  const imageUrl = getImageUrl(product.productLink || product.images?.[0]) || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop&q=60';
  const secondaryImageUrl = getImageUrl(product.images?.[1] || product.productLink || product.images?.[0]) || imageUrl;
  const storeName = product.storeId?.name || 'Mobixa Boutique';
  const wishlisted = user && isInWishlist(product._id);
  const inStock = product.stock > 0;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock) {
      toast.error('Product is out of stock');
      return;
    }
    try {
      await addItem(product, 1);
      toast.success(`${product.name} added to cart!`);
    } catch (err) {
      toast.error('Failed to add to cart');
    }
  };

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.info('Sign in to use wishlist');
      return;
    }
    try {
      if (wishlisted) {
        await removeProduct(product._id);
        toast.info('Removed from wishlist');
      } else {
        await addProduct(product._id);
        toast.success('Added to wishlist!');
      }
    } catch (err) {
      toast.error('Wishlist error');
    }
  };

  return (
    <Link to={`/product/${product._id}`} className="block group h-full">
      <div className="storefront-card overflow-hidden transition-all duration-300 hover:-translate-y-1 h-full flex flex-col group-hover:border-blue-400/80">
        <div className="relative overflow-hidden bg-slate-50/70 aspect-square flex items-center justify-center p-3 sm:p-6">
          <div className="w-full h-full relative">
            <img 
              src={imageUrl} 
              alt={product.name} 
              className="w-full h-full object-contain absolute inset-0 transition-opacity duration-500 opacity-100 group-hover:opacity-0" 
              loading="lazy" 
              onError={(e) => handleImageError(e, 'Product')}
            />
            <img 
              src={secondaryImageUrl} 
              alt={product.name} 
              className="w-full h-full object-contain absolute inset-0 transition-opacity duration-500 opacity-0 group-hover:opacity-100 scale-105" 
              loading="lazy" 
              onError={(e) => handleImageError(e, 'Product')}
            />
          </div>
          
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1.5 sm:gap-2 z-10">
            {product.discount > 0 && (
              <span className="bg-rose-500 text-white text-xs sm:text-xs uppercase font-bold px-2.5 py-1 rounded-full shadow-xs tracking-wide">
                -{product.discount}% OFF
              </span>
            )}
            {product.isFeatured && (
              <span className="bg-brand-indigo text-white text-xs sm:text-xs uppercase font-bold px-2.5 py-1 rounded-full shadow-xs tracking-wide">
                Featured
              </span>
            )}
          </div>

          <button onClick={handleToggleWishlist}
            className={`absolute top-2 right-2 sm:top-3 sm:right-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all shadow-xs z-10 ${
              wishlisted ? 'bg-rose-50 text-rose-500 border border-rose-200' : 'bg-white/95 text-slate-400 hover:text-rose-500 hover:bg-white border border-slate-200/60 backdrop-blur-md'
            }`}
          >
            <Heart size={15} className={wishlisted ? 'fill-rose-500' : ''} />
          </button>
        </div>
        
        <div className="p-3 sm:p-5 flex flex-col flex-1">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <p className="text-xs sm:text-xs font-semibold text-brand-indigo m-0 uppercase tracking-wider">{product.categoryId?.name || 'Device'}</p>
            <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full">
              <Star size={11} className="fill-amber-400 text-amber-400" />
              <span className="text-xs sm:text-xs font-bold text-amber-700">{product.averageRating || '4.8'}</span>
            </div>
          </div>
          
          <h3 className="font-semibold text-slate-900 text-sm sm:text-base mb-1 mt-0 leading-snug line-clamp-2 min-h-[2.2rem] sm:min-h-[2.5rem] group-hover:text-brand-indigo transition-colors">
            {product.name}
          </h3>
          
          <p className="text-xs sm:text-xs text-slate-500 mb-3 sm:mb-4 line-clamp-2 hidden sm:block font-normal">
            {product.description || 'Premium high-performance device with latest technology features.'}
          </p>

          {/* Quick Specs */}
          <div className="hidden sm:flex items-center gap-2 sm:gap-3 mb-2.5">
            <div className="flex items-center gap-1 bg-slate-50 text-slate-600 text-xs font-medium px-2.5 py-1 rounded-lg border border-slate-200/60">
              <ShieldCheck size={12} className="text-brand-indigo" /> 1Yr Warranty
            </div>
            <div className="flex items-center gap-1 bg-slate-50 text-slate-600 text-xs font-medium px-2.5 py-1 rounded-lg border border-slate-200/60">
              <Cpu size={12} className="text-brand-indigo" /> Genuine
            </div>
          </div>

          {/* Koko Payment Mention Badge */}
          {product.price > 0 && product.allowKokoOnline !== false && (
            <div className="mb-2 sm:mb-3 py-1.5 px-2.5 rounded-xl bg-red-50/80 border border-red-200/70 flex items-center justify-between gap-1.5 text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="px-1.5 py-0.5 rounded-md bg-[#e11d48] text-white font-extrabold text-[11px] uppercase tracking-wider flex items-center justify-center flex-shrink-0 shadow-xs">
                  koko
                </span>
                <span className="text-slate-800 font-medium text-[11px] sm:text-xs leading-snug">
                  Or 3 x <strong className="text-red-600 font-bold">
                    {currency === 'USD' ? `$${(Math.ceil(product.price / 3) / exchangeRate).toFixed(2)}` : `Rs. ${Math.ceil(product.price / 3).toLocaleString()}`}
                  </strong> with Koko
                </span>
              </div>
              <span className="text-[10px] font-bold text-red-600 bg-red-100/80 border border-red-200 px-1.5 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0 whitespace-nowrap">
                3x Pay
              </span>
            </div>
          )}

          <div className="flex items-center justify-between mt-auto pt-2.5 sm:pt-3 border-t border-slate-100 gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-xs font-medium mb-0.5 m-0 flex items-center gap-1">
                {inStock ? (
                  <span className="text-emerald-600 font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> In Stock</span>
                ) : (
                  <span className="text-rose-500 font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Out of Stock</span>
                )}
              </p>
              <div className="flex items-baseline gap-1 sm:gap-2 flex-wrap">
                <span className="text-sm sm:text-lg font-bold text-slate-900 truncate">{getProductPrice(product)}</span>
                {product.mrp > product.price && (
                  <span className="text-xs sm:text-xs font-medium text-slate-400 line-through">
                    {currency === 'USD' ? `$${(product.mrp / exchangeRate).toFixed(2)}` : `Rs. ${product.mrp.toFixed(2)}`}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = `/product/${product._id}`;
                }}
                className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-brand-indigo bg-slate-100 hover:bg-slate-200/80 transition-all flex items-center gap-1 shadow-2xs"
                title="View Product Details"
              >
                <Eye size={14} />
                <span className="hidden xs:inline">View</span>
              </button>
              <button onClick={handleAddToCart}
                disabled={!inStock}
                title={inStock ? "Add to cart" : "Out of stock"}
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex-shrink-0 flex items-center justify-center transition-all ${
                  inStock 
                    ? 'bg-brand-indigo hover:opacity-90 text-white shadow-md shadow-brand-indigo/20 hover:shadow-lg active:scale-95' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <ShoppingCart size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
