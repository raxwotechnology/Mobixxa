import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, ChevronDown, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getProducts, getCategories, searchProducts } from '../services/api';
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
  const [showFilters, setShowFilters] = useState(false); // Mobile drawer
  const [showSidebar, setShowSidebar] = useState(false); // Desktop sidebar
  const [searchVal, setSearchVal] = useState(q);

  // Temporary Draft states (used before clicking "Apply Filters")
  const [tempCategory, setTempCategory] = useState(searchParams.get('category') || '');
  const [tempMinPrice, setTempMinPrice] = useState(searchParams.get('minPrice') || '');
  const [tempMaxPrice, setTempMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [tempRatingFilter, setTempRatingFilter] = useState(searchParams.get('rating') || '');
  const [tempOnlyFeatured, setTempOnlyFeatured] = useState(searchParams.get('featured') === 'true');
  const [tempOnlyDeals, setTempOnlyDeals] = useState(searchParams.get('onSale') === 'true');

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [ratingFilter, setRatingFilter] = useState(searchParams.get('rating') || '');
  const [onlyFeatured, setOnlyFeatured] = useState(searchParams.get('featured') === 'true');
  const [onlyDeals, setOnlyDeals] = useState(searchParams.get('onSale') === 'true');

  useEffect(() => {
    setTempCategory(selectedCategory);
    setTempMinPrice(minPrice);
    setTempMaxPrice(maxPrice);
    setTempRatingFilter(ratingFilter);
    setTempOnlyFeatured(onlyFeatured);
    setTempOnlyDeals(onlyDeals);
  }, [selectedCategory, minPrice, maxPrice, ratingFilter, onlyFeatured, onlyDeals]);

  const applyFilters = () => {
    setSelectedCategory(tempCategory);
    setMinPrice(tempMinPrice);
    setMaxPrice(tempMaxPrice);
    setRatingFilter(tempRatingFilter);
    setOnlyFeatured(tempOnlyFeatured);
    setOnlyDeals(tempOnlyDeals);
    setPage(1);
    setShowFilters(false);
  };

  useEffect(() => {
    setSearchVal(q);
  }, [q]);

  // Live debounced search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const currentQ = (searchParams.get('q') || '').trim();
      const val = searchVal.trim();
      if (val !== currentQ) {
        const nextParams = {};
        if (val) nextParams.q = val;
        if (selectedCategory) nextParams.category = selectedCategory;
        if (sortBy) nextParams.sort = sortBy;
        setSearchParams(nextParams);
        setPage(1);
      }
    }, 350); // 350ms debounce
    return () => clearTimeout(delayDebounceFn);
  }, [searchVal, selectedCategory, sortBy]);

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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await getCategories();
        setCategories(res.data);
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
        if (q) {
          const res = await searchProducts(q);
          const list = res.data?.products || [];
          setProducts(list);
          setTotalPages(1);
          setTotal(list.length);
          return;
        }

        const params = { page, limit: 12, sort: sortBy };
        if (selectedCategory) params.category = selectedCategory;
        if (minPrice) params.minPrice = minPrice;
        if (maxPrice) params.maxPrice = maxPrice;
        if (ratingFilter) params.rating = ratingFilter;
        if (onlyFeatured) params.featured = 'true';
        if (onlyDeals) params.onSale = 'true';

        const res = await getProducts(params);
        setProducts(res.data.products);
        setTotalPages(res.data.pages);
        setTotal(res.data.total);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [q, page, selectedCategory, sortBy, minPrice, maxPrice, ratingFilter, onlyFeatured, onlyDeals]);

  const clearFilters = () => {
    setSelectedCategory('');
    setSortBy('newest');
    setMinPrice('');
    setMaxPrice('');
    setRatingFilter('');
    setOnlyFeatured(false);
    setOnlyDeals(false);
    setTempCategory('');
    setTempMinPrice('');
    setTempMaxPrice('');
    setTempRatingFilter('');
    setTempOnlyFeatured(false);
    setTempOnlyDeals(false);
    setSearchVal('');
    setPage(1);
    setSearchParams({});
  };

  const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'popular', label: 'Most Popular' },
  ];

  const activeFilters = [];
  if (selectedCategory) {
    const cat = categories.find((c) => c._id === selectedCategory);
    if (cat) {
      activeFilters.push({
        id: 'category',
        label: `${cat.icon} ${cat.name}`,
        clear: () => { setSelectedCategory(''); setPage(1); }
      });
    }
  }
  if (minPrice) {
    activeFilters.push({
      id: 'minPrice',
      label: `Min: Rs.${Number(minPrice).toLocaleString()}`,
      clear: () => { setMinPrice(''); setPage(1); }
    });
  }
  if (maxPrice) {
    activeFilters.push({
      id: 'maxPrice',
      label: `Max: Rs.${Number(maxPrice).toLocaleString()}`,
      clear: () => { setMaxPrice(''); setPage(1); }
    });
  }
  if (ratingFilter) {
    activeFilters.push({
      id: 'rating',
      label: `${ratingFilter}★ & Up`,
      clear: () => { setRatingFilter(''); setPage(1); }
    });
  }
  if (onlyFeatured) {
    activeFilters.push({
      id: 'featured',
      label: '⭐ Featured',
      clear: () => { setOnlyFeatured(false); setPage(1); }
    });
  }
  if (onlyDeals) {
    activeFilters.push({
      id: 'deals',
      label: '🏷️ On Sale',
      clear: () => { setOnlyDeals(false); setPage(1); }
    });
  }

  const renderFiltersContent = () => (
    <div className="space-y-6">
      {/* Categories Accordion */}
      <div>
        <h4 className="font-extrabold text-[10px] uppercase tracking-wider text-slate-400 mb-3 mt-0">Category</h4>
        <div className="space-y-1.5">
          <button
            onClick={() => { setTempCategory(''); }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              tempCategory === ''
                ? 'bg-brand-indigo/10 border-brand-indigo/25 text-brand-indigo shadow-sm'
                : 'bg-white border-slate-150 hover:border-slate-300 text-slate-650'
            }`}
          >
            <span className="flex items-center gap-2">
              <span>📦</span>
              <span>All Products</span>
            </span>
            {tempCategory === '' && <span className="w-1.5 h-1.5 rounded-full bg-brand-indigo" />}
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => { setTempCategory(cat._id); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                tempCategory === cat._id
                  ? 'bg-brand-indigo/10 border-brand-indigo/25 text-brand-indigo shadow-sm'
                  : 'bg-white border-slate-150 hover:border-slate-300 text-slate-650'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </span>
              {tempCategory === cat._id && <span className="w-1.5 h-1.5 rounded-full bg-brand-indigo" />}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range Accordion */}
      <div>
        <h4 className="font-extrabold text-[10px] uppercase tracking-wider text-slate-400 mb-3 mt-0">Price Range</h4>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-slate-400">MIN</span>
            <input
              type="number"
              placeholder="0"
              value={tempMinPrice}
              onChange={(e) => { setTempMinPrice(e.target.value); }}
              className="w-full border border-slate-200 rounded-xl pl-9 pr-2 py-2 text-xs font-bold text-slate-700 outline-none focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/10"
            />
          </div>
          <span className="text-slate-300 font-bold">-</span>
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-slate-400">MAX</span>
            <input
              type="number"
              placeholder="Any"
              value={tempMaxPrice}
              onChange={(e) => { setTempMaxPrice(e.target.value); }}
              className="w-full border border-slate-200 rounded-xl pl-9 pr-2 py-2 text-xs font-bold text-slate-700 outline-none focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/10"
            />
          </div>
        </div>
      </div>

      {/* Minimum Rating Accordion */}
      <div>
        <h4 className="font-extrabold text-[10px] uppercase tracking-wider text-slate-400 mb-3 mt-0">Rating</h4>
        <div className="space-y-1.5">
          {[4, 3, 2].map((r) => (
            <button
              key={r}
              onClick={() => { setTempRatingFilter(String(r)); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                tempRatingFilter === String(r)
                  ? 'bg-brand-indigo/10 border-brand-indigo/25 text-brand-indigo shadow-sm'
                  : 'bg-white border-slate-150 hover:border-slate-300 text-slate-650'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <div className="flex items-center gap-0.5 text-amber-500">
                  {[...Array(5)].map((_, idx) => (
                    <span key={idx} className={idx < r ? 'text-amber-500' : 'text-slate-200'}>★</span>
                  ))}
                </div>
                <span>& Up</span>
              </span>
              {tempRatingFilter === String(r) && <span className="w-1.5 h-1.5 rounded-full bg-brand-indigo" />}
            </button>
          ))}
          <button
            onClick={() => { setTempRatingFilter(''); }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              tempRatingFilter === ''
                ? 'bg-brand-indigo/10 border-brand-indigo/25 text-brand-indigo shadow-sm'
                : 'bg-white border-slate-150 hover:border-slate-300 text-slate-650'
            }`}
          >
            <span>Any Rating</span>
            {tempRatingFilter === '' && <span className="w-1.5 h-1.5 rounded-full bg-brand-indigo" />}
          </button>
        </div>
      </div>

      {/* Quick Options Accordion */}
      <div>
        <h4 className="font-extrabold text-[10px] uppercase tracking-wider text-slate-400 mb-3 mt-0">Quick Filters</h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setTempOnlyFeatured(!tempOnlyFeatured); }}
            className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              tempOnlyFeatured
                ? 'bg-brand-indigo border-brand-indigo text-white shadow-sm'
                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-650'
            }`}
          >
            ⭐ Featured Only
          </button>
          <button
            onClick={() => { setTempOnlyDeals(!tempOnlyDeals); }}
            className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              tempOnlyDeals
                ? 'bg-brand-indigo border-brand-indigo text-white shadow-sm'
                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-650'
            }`}
          >
            🏷️ On Sale Only
          </button>
        </div>
      </div>

      {/* Explicit Apply Filters Button */}
      <div className="pt-2">
        <button
          onClick={applyFilters}
          className="w-full bg-gradient-to-r from-brand-indigo to-brand-violet hover:opacity-95 text-white text-xs font-extrabold uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(99,102,241,0.2)] hover:shadow-[0_6px_16px_rgba(99,102,241,0.3)] cursor-pointer text-center"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-slate-50/50 min-h-screen">
      {/* Brand Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-fuchsia py-12 shadow-inner mb-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)] pointer-events-none" />
        <div className="base-container text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white border border-white/20 mb-2.5">
              📱 Official Hardware Catalog
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mt-0 mb-2">
              {q ? `Search results for "${q}"` : 'Explore Product Catalog'}
            </h1>
            <p className="text-white/85 m-0 text-xs md:text-sm font-semibold max-w-xl mx-auto">
              Discover {total > 0 ? total : 'our'} authentic smartphones, laptops, accessories & smart devices with official warranty.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="base-container pb-12">
        {/* Category Quick Select Pills Row */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-4 border-b border-slate-200/70 mb-6 w-full">
            <button
              onClick={() => { setSelectedCategory(''); setTempCategory(''); setSearchParams({}); setPage(1); }}
              className={`px-4 py-2 rounded-xl border text-xs font-extrabold uppercase tracking-wider transition-all flex-shrink-0 cursor-pointer shadow-sm ${
                selectedCategory === ''
                  ? 'bg-brand-indigo border-brand-indigo text-white shadow-md'
                  : 'bg-white border-slate-200 text-slate-650 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              All Products
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => {
                  setSelectedCategory(cat._id);
                  setTempCategory(cat._id);
                  const nextParams = {};
                  nextParams.category = cat._id;
                  if (q) nextParams.q = q;
                  if (sortBy) nextParams.sort = sortBy;
                  setSearchParams(nextParams);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-xl border text-xs font-extrabold uppercase tracking-wider transition-all flex-shrink-0 cursor-pointer shadow-sm ${
                  selectedCategory === cat._id
                    ? 'bg-brand-indigo border-brand-indigo text-white shadow-md'
                    : 'bg-white border-slate-200 text-slate-650 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span>{cat.icon} {cat.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Control Toolbar Panel */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-8">
          <div className="flex items-center gap-3">
            {/* Desktop Filter Toggle Button */}
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="hidden md:flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-slate-700 cursor-pointer transition-all hover:bg-slate-50 shadow-sm"
            >
              <SlidersHorizontal size={14} className="text-brand-indigo" />
              <span>{showSidebar ? 'Hide Filters' : 'Show Filters'}</span>
            </button>

            {/* Mobile Filter Drawer Button */}
            <button
              onClick={() => setShowFilters(true)}
              className="md:hidden flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-slate-700 cursor-pointer transition-all hover:bg-slate-50 shadow-sm"
            >
              <SlidersHorizontal size={14} className="text-brand-indigo" />
              <span>Filters</span>
            </button>
          </div>

          {/* Search Input Bar & Sort Selector */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 sm:justify-end">
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Search products in catalog..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl pl-10 pr-10 py-3 text-xs font-bold outline-none hover:bg-slate-100/60 hover:border-slate-350 focus:bg-white focus:border-brand-indigo focus:ring-4 focus:ring-brand-indigo/10 transition-all text-slate-700 shadow-sm"
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-colors">
                <Search size={14} className="text-slate-450" />
              </span>
              {searchVal && (
                <button
                  type="button"
                  onClick={() => { setSearchVal(''); setSearchParams({}); }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 p-1 cursor-pointer rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X size={13} />
                </button>
              )}
            </form>

            <div className="relative flex-shrink-0">
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                disabled={!!q}
                className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-xs font-extrabold uppercase tracking-wider text-slate-700 focus:ring-2 focus:ring-brand-indigo/25 focus:border-brand-indigo outline-none cursor-pointer transition-all shadow-sm"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-8 bg-slate-50 border border-slate-150 p-3 rounded-2xl">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-2">Active Filters:</span>
          {activeFilters.map((filter) => (
            <span key={filter.id} className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-750 shadow-sm">
              {filter.label}
              <button onClick={filter.clear} className="text-slate-400 hover:text-rose-500 cursor-pointer p-0.5 rounded-lg hover:bg-rose-50">
                <X size={12} />
              </button>
            </span>
          ))}
          <button onClick={clearFilters} className="text-[10px] font-black uppercase tracking-wider text-brand-indigo hover:underline cursor-pointer ml-auto mr-1">
            Reset Filters
          </button>
        </div>
      )}

      {/* Catalog Split Layout */}
      <div className="flex gap-8 items-start">
        {/* Desktop Sidebar Filters */}
        <aside className={`hidden md:block transition-all duration-300 ${showSidebar ? 'w-64 opacity-100' : 'w-0 opacity-0 overflow-hidden'} flex-shrink-0 sticky top-24`}>
          <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-2">
            <h3 className="font-black text-slate-800 text-base m-0">Catalog Filters</h3>
            <button onClick={clearFilters} className="text-xs text-brand-indigo font-bold hover:underline cursor-pointer">Clear All</button>
          </div>
          {renderFiltersContent()}
        </aside>

        {/* Mobile Slide-in Drawer Filters */}
        <AnimatePresence>
          {showFilters && (
            <>
              {/* Overlay Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowFilters(false)}
                className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 md:hidden"
              />
              {/* Drawer Container */}
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white z-50 p-6 overflow-y-auto flex flex-col shadow-2xl md:hidden"
              >
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-150">
                  <h3 className="font-black text-slate-850 text-base m-0">Filter Products</h3>
                  <div className="flex items-center gap-3">
                    <button onClick={clearFilters} className="text-xs text-brand-indigo font-bold hover:underline cursor-pointer">Clear</button>
                    <button onClick={() => setShowFilters(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer p-1.5 rounded-xl hover:bg-slate-50">
                      <X size={18} />
                    </button>
                  </div>
                </div>
                {renderFiltersContent()}
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Product Grid */}
        <div className="flex-1 min-w-0 w-full">
          {loading ? (
            <div className={`grid gap-4 md:gap-6 animate-pulse transition-all duration-300 ${showSidebar ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'}`}>
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                  <div className="aspect-square bg-slate-100" />
                  <div className="p-5 space-y-3">
                    <div className="h-2 bg-slate-100 rounded w-1/3" />
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                    <div className="h-2 bg-slate-100 rounded w-1/4" />
                    <div className="flex justify-between items-center pt-2">
                      <div className="h-4 bg-slate-100 rounded w-1/3" />
                      <div className="h-8 w-8 bg-slate-100 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="glass-card rounded-[2rem] p-16 text-center border border-slate-200/50 shadow-sm max-w-lg mx-auto">
              <span className="text-5xl block mb-4">🔍</span>
              <h3 className="text-lg font-black text-slate-800 mb-2 mt-0">No Products Found</h3>
              <p className="text-slate-400 text-sm mb-5 font-semibold">Try adjusting your filters or search terms.</p>
              <button
                onClick={clearFilters}
                className="bg-gradient-to-r from-brand-indigo to-brand-violet hover:opacity-95 text-white text-xs font-bold px-6 py-3 rounded-xl transition-all shadow-[0_4px_12px_rgba(99,102,241,0.2)] cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              <div className={`grid gap-4 md:gap-6 transition-all duration-300 ${showSidebar ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'}`}>
                {products.map((product, i) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.4 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12 border-t border-slate-100 pt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-650 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setPage(i + 1)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        page === i + 1
                          ? 'bg-gradient-to-r from-brand-indigo to-brand-violet text-white shadow-[0_4px_12px_rgba(99,102,241,0.2)]'
                          : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-650 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  </div>
);
};

export default Shop;
