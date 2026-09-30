'use client';

import { useState, useEffect } from 'react';
import { useParams, Link } from '../utils/navigation';
import { Star, ShoppingCart, Heart, Share2, Minus, Plus, Store, MapPin, ShieldCheck, Cpu, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { getProductById, getProducts } from '../services/api';
import { products as mockProductsList } from '../data/mockProducts';
import { deals as mockDealsList } from '../data/mockDeals';
import ProductCard from '../components/ProductCard';
import ReviewSection from '../components/ReviewSection';
import useCartStore from '../store/cartStore';
import useWishlistStore from '../store/wishlistStore';
import useAuthStore from '../store/authStore';
import useCurrencyStore from '../store/currencyStore';
import { toast } from 'react-toastify';
import { getImageUrl, handleImageError } from '../utils/imageHelper';
import DeviceIllustration from '../components/common/DeviceIllustration';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSwatchIndex, setSelectedSwatchIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');

  const { addItem } = useCartStore();
  const { addProduct, removeProduct, isInWishlist } = useWishlistStore();
  const { user } = useAuthStore();
  const { getProductPrice, convertPrice, formatPrice, exchangeRate, currency } = useCurrencyStore();

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await getProductById(id);
        if (res.data) {
          const rawName = res.data.name?.toLowerCase() || '';
          const deviceType = res.data.deviceType || (
            rawName.includes('emberton') ? 'marshall-emberton' :
            rawName.includes('monitor') ? 'marshall-monitor' :
            rawName.includes('ps5') ? 'ps5-pro' :
            rawName.includes('pixel 10 pro') ? 'pixel-10-pro' :
            rawName.includes('pixel') ? 'pixel' :
            null
          );
          setProduct({ ...res.data, deviceType });
          setSelectedImage(0);
          setSelectedSwatchIndex(0);
          setQuantity(1);
          if (res.data.categoryId?._id) {
            const relRes = await getProducts({ category: res.data.categoryId._id, limit: 4 });
            setRelated(relRes.data.products.filter((p) => p._id !== id));
          }
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Backend API getProductById failed, checking local catalog:', err.message);
      }

      // Fallback lookup from mock products and deals catalog
      const fallback =
        mockProductsList.find((p) => p.id === id || p._id === id || p.deviceType === id) ||
        mockDealsList.find((d) => d.id === id || d._id === id || d.deviceType === id);

      if (fallback) {
        const numPrice = typeof fallback.price === 'string'
          ? parseFloat(fallback.price.replace(/,/g, ''))
          : fallback.price;

        const resolvedDeviceType = fallback.deviceType || (
          fallback.id?.includes('marshall-emberton') ? 'marshall-emberton' :
          fallback.id?.includes('marshall-monitor') ? 'marshall-monitor' :
          fallback.id?.includes('ps5') ? 'ps5-pro' :
          fallback.id?.includes('pixel') ? 'pixel-10-pro' :
          fallback.id
        );

        setProduct({
          _id: fallback.id || fallback._id || id,
          name: fallback.name,
          price: numPrice,
          originalPrice: fallback.originalPrice ? parseFloat(String(fallback.originalPrice).replace(/,/g, '')) : undefined,
          discount: fallback.discount ? parseInt(String(fallback.discount).replace(/[^0-9]/g, '')) : 0,
          description: fallback.description || `${fallback.name} - official Sri Lanka warranty, authentic build quality with fast door-to-door delivery.`,
          images: fallback.images && fallback.images.length > 0 ? fallback.images : (fallback.image ? [fallback.image] : []),
          productLink: fallback.image || fallback.productLink,
          deviceType: resolvedDeviceType,
          stock: 15,
          brand: fallback.brand || fallback.category || 'Mobixa',
          category: fallback.category,
          specs: fallback.specs || {
            'Audio / Display': 'Premium Hi-Fi Output',
            'Connectivity': 'Bluetooth 5.3 / Type-C',
            'Warranty': '1 Year Mobixa Official Warranty',
          },
          swatches: fallback.swatches || [],
          storages: fallback.storages || [],
        });
        setSelectedSwatchIndex(0);
      } else {
        setProduct(null);
      }

      setLoading(false);
    };
    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  const inStock = product?.stock > 0;

  const handleAddToCart = async () => {
    if (!inStock) {
      toast.error('Product is out of stock');
      return;
    }
    try {
      await addItem(product, quantity);
      toast.success(`${product.name} added to cart!`);
    } catch (err) {
      toast.error('Failed to add to cart');
    }
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      toast.info('Sign in to use wishlist');
      return;
    }
    try {
      if (isInWishlist(product._id)) {
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

  const handleReviewsChanged = (stats) => {
    if (!stats || !product) return;
    setProduct((prev) => prev ? {
      ...prev,
      averageRating: stats.averageRating ?? prev.averageRating,
      totalReviews: stats.totalReviews ?? prev.totalReviews,
    } : prev);
  };

  if (loading) {
    return (
      <div className="base-container py-12">
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="aspect-square bg-slate-100 rounded-[2rem]" />
          <div className="space-y-4">
            <div className="h-3 bg-slate-200 rounded w-1/4" />
            <div className="h-8 bg-slate-200 rounded w-3/4" />
            <div className="h-3 bg-slate-200 rounded w-1/5" />
            <div className="h-10 bg-slate-200 rounded w-1/3" />
            <div className="h-24 bg-slate-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="base-container py-24 text-center">
        
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Device Not Found</h2>
        <Link to="/shop" className="text-brand-indigo font-bold hover:underline">Back to Shop Catalog</Link>
      </div>
    );
  }

  const wishlisted = user && isInWishlist(product._id);
  const activeSwatch = (product.swatches && product.swatches[selectedSwatchIndex]) || product.swatches?.[0] || { color: '#1c1c1e' };
  const activeColor = activeSwatch.color;

  const rawImage = product.productLink || product.images?.[selectedImage];
  const hasRealImage = Boolean(rawImage && !rawImage.includes('photo-1511707171634') && !rawImage.includes('unsplash.com'));

  return (
    <div className="base-container py-10 bg-slate-50/30 min-h-screen">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-400 mb-8 flex-wrap font-bold uppercase tracking-wider">
        <Link to="/" className="hover:text-brand-indigo">Home</Link><span>/</span>
        <Link to="/shop" className="hover:text-brand-indigo">Devices</Link><span>/</span>
        {product.categoryId && (
          <><Link to={`/shop?category=${product.categoryId._id}`} className="hover:text-brand-indigo">{product.categoryId.name}</Link><span>/</span></>
        )}
        <span className="text-slate-700 truncate max-w-[200px] normal-case tracking-normal">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-16">
        {/* Gallery */}
        <motion.div className="lg:col-span-2" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <div className="bg-white border border-slate-200/60 rounded-[2rem] overflow-hidden mb-4 p-8 flex items-center justify-center shadow-sm relative aspect-square">
            {hasRealImage ? (
              <img 
                src={getImageUrl(rawImage)} 
                alt={product.name} 
                className="w-full h-full object-contain transition-transform duration-300 hover:scale-105" 
                onError={(e) => handleImageError(e, product.name || 'Product')}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-4">
                <DeviceIllustration 
                  deviceType={product.deviceType || product.category || product.name} 
                  color={activeColor} 
                  className="transform hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
            {product.discount > 0 && (
              <span className="absolute top-4 left-4 bg-rose-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-md uppercase tracking-wider">
                -{product.discount}% OFF
              </span>
            )}
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImage(i)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all p-2 bg-white flex-shrink-0 cursor-pointer ${selectedImage === i ? 'border-brand-indigo shadow-md ring-2 ring-brand-indigo/15' : 'border-slate-250 hover:border-brand-indigo/60'}`}>
                  <img 
                    src={getImageUrl(img)} 
                    alt="" 
                    className="w-full h-full object-contain" 
                    onError={(e) => handleImageError(e, 'Product')}
                  />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Product Info */}
        <motion.div className="lg:col-span-3" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200/60 shadow-sm h-full flex flex-col">
            <div className="mb-4">
              <span className="text-xs font-bold text-brand-indigo uppercase tracking-wider bg-brand-indigo/5 border border-brand-indigo/10 px-3.5 py-1.5 rounded-xl">{product.categoryId?.name || product.category || 'Device'}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mt-0 mb-3 tracking-tight">{product.name}</h1>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                <Star size={14} className="fill-amber-500 text-amber-500" />
                <span className="text-xs font-bold text-amber-700">{product.averageRating || '4.8'}</span>
              </div>
              <span className="text-xs font-bold text-slate-400 underline hover:text-brand-indigo cursor-pointer transition-colors">({product.totalReviews || 48} verified reviews)</span>
            </div>

            {/* Price & Koko Installments */}
            <div className="mb-6 pb-6 border-b border-slate-100">
              <div className="flex items-end gap-3.5">
                <span className="text-3xl font-bold text-slate-900 tracking-tight">{getProductPrice(product)}</span>
                {product.mrp > product.price && (
                  <div className="flex flex-col">
                    <span className="text-sm text-slate-400 line-through font-medium">
                      {currency === 'USD' ? `$${(product.mrp / exchangeRate).toFixed(2)}` : `Rs. ${product.mrp.toFixed(2)}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Koko Banner */}
              {product.price > 0 && (
                <div className="mt-3.5 p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="px-2.5 py-1 rounded-lg bg-[#0052FF] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                      koko
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 m-0">
                        Or 3 interest-free payments of <span className="font-bold text-blue-600">
                          {currency === 'USD' ? `$${(Math.ceil(product.price / 3) / exchangeRate).toFixed(2)}` : `Rs. ${Math.ceil(product.price / 3).toLocaleString()}`}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500 m-0 font-medium">No hidden fees • Instant approval at checkout</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-blue-700 bg-blue-100/90 px-3 py-1 rounded-full uppercase tracking-wider">3x Pay</span>
                </div>
              )}

              <div className="mt-3.5 flex items-center gap-2">
                {inStock ? (
                  <span className="text-emerald-700 flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl text-xs font-bold"><CheckCircle size={14} /> In Stock ({product.stock} units available)</span>
                ) : (
                  <span className="text-rose-600 flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-3 py-1 rounded-xl text-xs font-bold"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Out of Stock</span>
                )}
              </div>
            </div>

            {/* Swatches Selection if available */}
            {product.swatches && product.swatches.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2.5">
                  Color: <span className="text-slate-800 font-semibold">{activeSwatch.name || 'Selected'}</span>
                </p>
                <div className="flex items-center gap-2.5">
                  {product.swatches.map((swatch, idx) => {
                    const isSelected = selectedSwatchIndex === idx;
                    return (
                      <button
                        key={swatch.name || idx}
                        type="button"
                        onClick={() => setSelectedSwatchIndex(idx)}
                        title={swatch.name}
                        className={`w-7 h-7 rounded-full transition-all duration-150 relative flex items-center justify-center cursor-pointer ${
                          isSelected
                            ? 'ring-2 ring-blue-600 ring-offset-2 scale-110 shadow-sm'
                            : 'hover:scale-110 border border-slate-300'
                        }`}
                        style={{ backgroundColor: swatch.color }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Key Specs */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200/60 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0"><ShieldCheck size={18} /></div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider m-0">Warranty</p>
                  <p className="text-sm font-bold text-slate-800 m-0">1 Year Official</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200/60 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0"><Cpu size={18} /></div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider m-0">Condition</p>
                  <p className="text-sm font-bold text-slate-800 m-0">Brand New Sealed</p>
                </div>
              </div>
            </div>

            <div className="mt-auto">
              {/* Quantity */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Quantity</span>
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                  <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-11 h-11 flex items-center justify-center hover:bg-slate-200 transition-colors text-slate-600 cursor-pointer border-0 bg-transparent"><Minus size={16} /></button>
                  <span className="w-11 h-11 flex items-center justify-center font-bold text-slate-900 text-sm border-x border-slate-200">{quantity}</span>
                  <button onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))} disabled={!inStock} className="w-11 h-11 flex items-center justify-center hover:bg-slate-200 transition-colors text-slate-600 disabled:opacity-50 cursor-pointer border-0 bg-transparent"><Plus size={16} /></button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3.5 mb-6">
                <button onClick={handleAddToCart} disabled={!inStock} className={`flex-1 font-bold py-4 px-8 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2.5 text-base cursor-pointer ${inStock ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-[0_4px_16px_rgba(37,99,235,0.35)] hover:shadow-[0_6px_22px_rgba(37,99,235,0.45)] hover:-translate-y-0.5 border-0' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none border-0'}`}>
                  <ShoppingCart size={20} /> Add to Cart
                </button>
                <div className="flex gap-3">
                  <button onClick={handleToggleWishlist}
                    className={`w-14 h-14 border rounded-2xl flex items-center justify-center transition-all cursor-pointer ${wishlisted ? 'bg-rose-50 border-rose-200 text-rose-500' : 'border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-900 bg-white'}`}>
                    <Heart size={20} className={wishlisted ? 'fill-rose-500' : ''} />
                  </button>
                  <button className="w-14 h-14 border border-slate-200 rounded-2xl flex items-center justify-center hover:bg-slate-50 text-slate-500 hover:text-slate-900 transition-all cursor-pointer bg-white">
                    <Share2 size={20} />
                  </button>
                </div>
              </div>

              {/* Store Info */}
              {product.storeId && (
                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200/40 flex items-center justify-center"><Store size={18} className="text-blue-600" /></div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider m-0 mb-0.5">Sold by</p>
                    <Link to={`/store/${product.storeId._id}`} className="font-bold text-slate-800 hover:text-blue-600 transition-colors text-sm block no-underline">{product.storeId.name}</Link>
                  </div>
                  {product.storeId.city && <div className="text-right"><p className="text-xs font-bold uppercase tracking-wide text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5"><MapPin size={11} className="text-blue-600"/> {product.storeId.city}</p></div>}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="mb-16">
        <div className="flex overflow-x-auto border-b border-slate-200 mb-8 gap-8 px-4 scrollbar-hide">
          {['description', 'specifications', 'reviews'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`py-4 text-sm font-bold capitalize transition-all border-b-2 whitespace-nowrap cursor-pointer border-x-0 border-t-0 bg-transparent ${activeTab === tab ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
              {tab === 'reviews' ? `Customer Reviews (${product.totalReviews})` : tab}
            </button>
          ))}
        </div>
        <div className="bg-white border border-slate-200/60 rounded-[2rem] p-8 lg:p-10 shadow-sm min-h-[300px]">
          {activeTab === 'description' && (
            <div className="prose prose-slate max-w-none">
              <h3 className="text-lg font-bold text-slate-850 mb-4 mt-0 border-b border-slate-100 pb-2">Product Overview</h3>
              <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-line">{product.description}</p>
            </div>
          )}
          {activeTab === 'reviews' && <ReviewSection productId={product._id} onReviewsChanged={handleReviewsChanged} />}
          {activeTab === 'specifications' && (
            <div>
              <h3 className="text-lg font-bold text-slate-850 mb-6 mt-0 border-b border-slate-100 pb-2">Technical Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                {[
                  { label: 'Brand/Model', value: product.name },
                  { label: 'Category', value: product.categoryId?.name || 'Smart Device' },
                  { label: 'SKU / Barcode', value: product.barcode || product.sku || 'N/A' },
                  { label: 'Unit Type', value: product.unit },
                  { label: 'Stock Status', value: inStock ? 'Available' : 'Out of Stock' },
                  { label: 'Seller', value: product.storeId?.name || 'Mobixa Direct' },
                ].map((d) => (
                  <div key={d.label} className="flex py-3.5 border-b border-slate-100 last:border-0 text-sm">
                    <span className="w-1/3 text-slate-400 font-semibold">{d.label}</span>
                    <span className="w-2/3 font-bold text-slate-700">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="pt-10 border-t border-slate-200/60">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight m-0">You Might Also Like</h2>
            <Link to="/shop" className="text-sm font-bold text-brand-indigo hover:underline">View All Devices</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {related.slice(0, 4).map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetail;
