'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from '../utils/navigation';
import { SlidersHorizontal, X, ChevronDown, Search, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getProducts, getCategories } from '../services/api';
import ProductCard from '../components/ProductCard';

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = (searchParams.get('q') || '').trim();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [searchVal, setSearchVal] = useState(q);

  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [ratingFilter, setRatingFilter] = useState(searchParams.get('rating') || '');
  const [onlyFeatured, setOnlyFeatured] = useState(searchParams.get('featured') === 'true');
  const [onlyDeals, setOnlyDeals] = useState(searchParams.get('onSale') === 'true');

  useEffect(() => {
    setSearchVal(q);
  }, [q]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await getCategories();
        setCategories(res.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = { page, limit: 16, sort: sortBy };
        if (selectedCategory) params.category = selectedCategory;
        if (minPrice) params.minPrice = minPrice;
        if (maxPrice) params.maxPrice = maxPrice;
        if (ratingFilter) params.rating = ratingFilter;
        if (onlyFeatured) params.featured = 'true';
        if (onlyDeals) params.onSale = 'true';
        if (q) params.search = q;

        const res = await getProducts(params);
        setProducts(res.data.products || []);
        setTotalPages(res.data.pages || 1);
        setTotal(res.data.total || 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [q, page, selectedCategory, sortBy, minPrice, maxPrice, ratingFilter, onlyFeatured, onlyDeals]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const val = searchVal.trim();
    const nextParams = {};
    if (val) nextParams.q = val;
    if (selectedCategory) nextParams.category = selectedCategory;
    if (sortBy) nextParams.sort = sortBy;
    setSearchParams(nextParams);
    setPage(1);
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSortBy('newest');
    setMinPrice('');
    setMaxPrice('');
    setRatingFilter('');
    setOnlyFeatured(false);
    setOnlyDeals(false);
    setSearchVal('');
    setPage(1);
    setSearchParams({});
  };

  return (
    <div className="bg-slate-50/50 min-h-screen">
      {/* ===== HERO BANNER (MATCHES SCREENSHOT 1) ===== */}
      <section className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 py-12 px-4 sm:px-6 lg:px-12 text-white relative overflow-hidden mb-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)] pointer-events-none" />
        <div className="base-container relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-900/40 border border-white/20 text-white text-[10px] font-extrabold uppercase tracking-widest mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-300" />
            Official Hardware Catalog
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white m-0 tracking-tight">
            Explore All Products
          </h1>
          <p className="text-blue-100 text-xs sm:text-sm m-0 mt-1 max-w-xl">
            Browse our complete range of premium smartphones, wearables, accessories &amp; more.
          </p>
        </div>
      </section>

      <div className="base-container px-4 sm:px-6 pb-20">
        {/* ===== CATEGORY PILLS (MATCHES SCREENSHOT 1) ===== */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-4 mb-6">
          <button
            onClick={() => { setSelectedCategory(''); setPage(1); setSearchParams({}); }}
            className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all flex-shrink-0 cursor-pointer ${
              selectedCategory === ''
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-slate-50'
            }`}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => {
                setSelectedCategory(cat._id);
                setPage(1);
                setSearchParams({ category: cat._id });
              }}
              className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all flex-shrink-0 cursor-pointer ${
                selectedCategory === cat._id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-slate-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* ===== TOOLBAR (MATCHES SCREENSHOT 1) ===== */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-4 mb-8 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-slate-700 transition-all"
            >
              <SlidersHorizontal size={14} className="text-blue-600" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>

            {/* Live Counter */}
            <span className="text-xs text-slate-500 font-bold">
              {total} products found
            </span>
          </div>

          {/* Search & Sort */}
          <div className="flex items-center gap-3 flex-1 sm:justify-end">
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search products or brands..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
              />
            </form>

            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500 cursor-pointer uppercase"
            >
              <option value="newest">Newest</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>

        {/* Collapsible Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white border border-slate-200/80 rounded-2xl p-5 mb-8 overflow-hidden shadow-sm"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Price Range */}
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-800 mb-2">Price Range (Rs.)</h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                    />
                    <span className="text-slate-400">—</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-800 mb-2">Minimum Rating</h4>
                  <div className="flex gap-2">
                    {[4, 3, 2].map((r) => (
                      <button
                        key={r}
                        onClick={() => setRatingFilter(ratingFilter === String(r) ? '' : String(r))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          ratingFilter === String(r) ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {r}★ &amp; Up
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-end gap-3">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===== PRODUCTS GRID (MATCHES SCREENSHOT 1) ===== */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 animate-pulse">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-slate-200 rounded-3xl h-96" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 max-w-md mx-auto">
            <span className="text-4xl">🔍</span>
            <h3 className="font-bold text-lg text-slate-800 mt-2">No products found</h3>
            <p className="text-xs text-slate-500 mb-4">Try clearing filters or search with a different keyword.</p>
            <button onClick={clearFilters} className="bg-blue-600 text-white font-bold text-xs px-5 py-2 rounded-xl">
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-12">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-9 h-9 rounded-xl font-bold text-xs transition-all ${
                  page === i + 1
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;
