'use client';

import { useState, useEffect } from 'react';
import { Package, AlertTriangle, Search, FileText } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { toast } from 'react-toastify';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { adminNavGroups as navItems } from './adminNavItems';
import API from '../../services/api';

const AdminInventory = ({ navItems: customNavItems }) => {
  const activeNavItems = customNavItems || navItems;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [sortBy, setSortBy] = useState('stock-asc');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          API.get('/products'),
          API.get('/categories'),
        ]);
        setProducts(prodRes.data?.products || prodRes.data || []);
        setCategories(catRes.data || []);
      } catch (err) {
        toast.error('Failed to load inventory');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = products
    .filter(p => {
      const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search);
      const matchCat = catFilter === 'all' || p.category === catFilter || p.categoryId === catFilter || p.categoryId?._id === catFilter;
      const matchBrand = brandFilter === 'all' || p.brand === brandFilter;
      
      const safetyLimit = p.lowStockLimit !== undefined && p.lowStockLimit !== null ? p.lowStockLimit : 10;
      const matchStock = stockFilter === 'all'
        || (stockFilter === 'low' && p.stock > 0 && p.stock <= safetyLimit)
        || (stockFilter === 'out' && p.stock <= 0)
        || (stockFilter === 'ok' && p.stock > safetyLimit);
      
      return matchSearch && matchCat && matchBrand && matchStock;
    })
    .sort((a, b) => {
      if (sortBy === 'stock-asc') return (a.stock || 0) - (b.stock || 0);
      if (sortBy === 'stock-desc') return (b.stock || 0) - (a.stock || 0);
      if (sortBy === 'name') return a.name?.localeCompare(b.name);
      if (sortBy === 'price') return (b.price || 0) - (a.price || 0);
      return 0;
    });

  // Extract unique brands dynamically
  const uniqueBrands = ['all', ...new Set(products.map(p => p.brand).filter(Boolean))];

  const totalProducts = products.length;
  const outOfStock = products.filter(p => p.stock <= 0).length;
  const lowStock = products.filter(p => {
    const safetyLimit = p.lowStockLimit !== undefined && p.lowStockLimit !== null ? p.lowStockLimit : 10;
    return p.stock > 0 && p.stock <= safetyLimit;
  }).length;
  const totalStockValue = products.reduce((s, p) => s + (p.price || 0) * (p.stock || 0), 0);

  const exportCols = [
    { label: 'Name', accessor: 'name' },
    { label: 'Brand', accessor: (r) => r.brand || 'N/A' },
    { label: 'SKU', accessor: (r) => r.sku || r.barcode || 'N/A' },
    { label: 'Price (Rs.)', accessor: (r) => r.price?.toLocaleString() },
    { label: 'Stock', accessor: (r) => r.stock?.toString() },
    { label: 'Safety Limit', accessor: (r) => (r.lowStockLimit !== undefined ? r.lowStockLimit.toString() : '10') },
    { label: 'Status', accessor: (r) => {
        const limit = r.lowStockLimit !== undefined ? r.lowStockLimit : 10;
        return r.stock <= 0 ? 'Out of Stock' : r.stock <= limit ? 'Low Stock' : 'In Stock';
      }
    },
    { label: 'Value (Rs.)', accessor: (r) => ((r.price || 0) * (r.stock || 0)).toLocaleString() },
  ];

  if (loading) {
    return (
      <DashboardLayout navItems={activeNavItems} title="Inventory">
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-brand-indigo border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={activeNavItems} title="Inventory">
      <div className="animate-fade-in space-y-6">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white/40 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-indigo/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-brand-indigo/10 flex items-center justify-center text-brand-indigo">
                <Package size={20} strokeWidth={2.5} />
              </div>
              <h1 className="text-2xl font-semibold text-slate-900 m-0">Inventory Valuation & Stock</h1>
            </div>
            <p className="text-[10px] font-normal uppercase tracking-wider text-slate-500 mt-2 m-0">Track stock counts, safety levels, and valuation reports</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => exportToCSV(filtered, exportCols, 'inventory')}
              className="bg-white/80 backdrop-blur-sm border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-brand-indigo text-[10px] uppercase tracking-wider font-black px-4 py-2.5 rounded-xl transition-all shadow-sm">📄 CSV</button>
            <button onClick={() => exportToExcel(filtered, exportCols, 'inventory')}
              className="bg-emerald-50/80 backdrop-blur-sm border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-[10px] uppercase tracking-wider font-black px-4 py-2.5 rounded-xl transition-all shadow-sm">📊 Excel</button>
            <button onClick={() => exportToPDF(filtered, exportCols, 'Inventory Valuation Report')}
              className="bg-rose-50/80 backdrop-blur-sm border border-rose-200 text-rose-700 hover:bg-rose-100 text-[10px] uppercase tracking-wider font-black px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm">
              <FileText size={14} strokeWidth={2.5} /> PDF
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/40 p-6 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Package size={80} className="text-brand-indigo" /></div>
            <div className="w-10 h-10 rounded-xl bg-brand-indigo/10 flex items-center justify-center mb-3">
              <Package size={18} className="text-brand-indigo" strokeWidth={2.5} />
            </div>
            <p className="text-3xl font-black text-slate-800">{totalProducts}</p>
            <p className="text-[10px] uppercase font-black tracking-wider text-slate-500 mt-1">Total Products</p>
          </div>
          <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/40 p-6 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><AlertTriangle size={80} className="text-rose-500" /></div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center mb-3">
              <AlertTriangle size={18} className="text-rose-600" strokeWidth={2.5} />
            </div>
            <p className="text-3xl font-black text-rose-600">{outOfStock}</p>
            <p className="text-[10px] uppercase font-black tracking-wider text-slate-500 mt-1">Out of Stock</p>
          </div>
          <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/40 p-6 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><AlertTriangle size={80} className="text-amber-500" /></div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
              <AlertTriangle size={18} className="text-amber-600" strokeWidth={2.5} />
            </div>
            <p className="text-3xl font-black text-amber-600">{lowStock}</p>
            <p className="text-[10px] uppercase font-black tracking-wider text-slate-500 mt-1">Low Stock (≤ Limit)</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl border border-emerald-400/50 p-6 shadow-lg shadow-emerald-500/20 relative overflow-hidden hover:shadow-xl transition-all">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
            <p className="text-[10px] uppercase font-black tracking-wider text-emerald-100 mb-2 relative z-10">Total Stock Value</p>
            <p className="text-3xl font-black text-white mt-1 relative z-10">Rs. {totalStockValue.toLocaleString()}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/40 backdrop-blur-sm p-4 rounded-3xl border border-white/40 shadow-sm flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input placeholder="Search by name or barcode..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/80 border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm" />
          </div>
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
            className="bg-white/80 border border-slate-200 rounded-2xl py-3 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm cursor-pointer min-w-[150px]">
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}
            className="bg-white/80 border border-slate-200 rounded-2xl py-3 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm cursor-pointer min-w-[150px]">
            <option value="all">All Brands</option>
            {uniqueBrands.slice(1).map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}
            className="bg-white/80 border border-slate-200 rounded-2xl py-3 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm cursor-pointer min-w-[150px]">
            <option value="all">All Stock Statuses</option>
            <option value="ok">In Stock (&gt; Limit)</option>
            <option value="low">Low Stock (≤ Limit)</option>
            <option value="out">Out of Stock</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            className="bg-white/80 border border-slate-200 rounded-2xl py-3 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm cursor-pointer min-w-[150px]">
            <option value="stock-asc">Stock: Low → High</option>
            <option value="stock-desc">Stock: High → Low</option>
            <option value="name">Name A-Z</option>
            <option value="price">Price: High → Low</option>
          </select>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-800 m-0">Detailed Inventory Preview</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] uppercase font-black tracking-wider text-slate-500 text-left">Product</th>
                  <th className="px-6 py-4 text-[10px] uppercase font-black tracking-wider text-slate-500 text-left">SKU/Barcode</th>
                  <th className="px-6 py-4 text-[10px] uppercase font-black tracking-wider text-slate-500 text-left">Brand</th>
                  <th className="px-6 py-4 text-[10px] uppercase font-black tracking-wider text-slate-500 text-left">Price</th>
                  <th className="px-6 py-4 text-[10px] uppercase font-black tracking-wider text-slate-500 text-left">Stock</th>
                  <th className="px-6 py-4 text-[10px] uppercase font-black tracking-wider text-slate-500 text-left">Status</th>
                  <th className="px-6 py-4 text-[10px] uppercase font-black tracking-wider text-slate-500 text-left">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(p => {
                  const safetyLimit = p.lowStockLimit !== undefined && p.lowStockLimit !== null ? p.lowStockLimit : 10;
                  const isOut = p.stock <= 0;
                  const isLow = p.stock > 0 && p.stock <= safetyLimit;
                  
                  return (
                    <tr key={p._id} className={`hover:bg-slate-50/50 transition-colors ${isOut ? 'bg-rose-50/30' : isLow ? 'bg-amber-50/30' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          {p.images?.[0] ? (
                            <img src={p.images[0]} alt="" className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-sm" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm"><Package size={20} className="text-slate-400" /></div>
                          )}
                          <div>
                            <span className="font-black text-slate-800 block text-sm">{p.name}</span>
                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Safety Limit: {safetyLimit} pcs</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">{p.sku || p.barcode || '—'}</td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-[9px] uppercase font-black tracking-wider">{p.brand || 'No Brand'}</span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">Rs. {p.price?.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-black ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {p.stock}
                        </span>
                        <span className="text-[9px] uppercase tracking-wider font-black text-slate-400 ml-1">/{p.unit || 'pcs'}</span>
                      </td>
                      <td className="px-6 py-4">
                        {isOut ? (
                          <span className="text-[9px] uppercase tracking-wider font-black px-2.5 py-1 rounded-full bg-rose-100/50 text-rose-700">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="text-[9px] uppercase tracking-wider font-black px-2.5 py-1 rounded-full bg-amber-100/50 text-amber-700 animate-pulse">
                            ⚠️ Low Stock
                          </span>
                        ) : (
                          <span className="text-[9px] uppercase tracking-wider font-black px-2.5 py-1 rounded-full bg-emerald-100/50 text-emerald-700">
                            In Stock
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-black text-brand-indigo">Rs. {((p.price || 0) * (p.stock || 0)).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="text-center py-12 font-black text-[11px] uppercase tracking-wider text-slate-400">No products found matching filters</div>}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminInventory;
