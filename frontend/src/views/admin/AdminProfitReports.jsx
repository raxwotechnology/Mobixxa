'use client';

import { useState, useEffect, useMemo } from 'react';
import { DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, RefreshCw, FileText, Search, Calendar, Landmark, Tag, Package, Download } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { getProfitReport, getCategories } from '../../services/api';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from 'react-toastify';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { adminNavGroups } from './adminNavItems';
import { getFilteredManagerNavGroups } from '../storeOwner/managerNavItems';
import useAuthStore from '../../store/authStore';
import useAdminStoreStore from '../../store/adminStoreStore';

const BRANDS_LIST = ['all', 'Apple', 'Samsung', 'Xiaomi', 'Oppo', 'Vivo', 'Realme', 'Huawei', 'OnePlus', 'Anker', 'JBL', 'Baseus'];

const AdminProfitReports = ({ navItems: propNavItems }) => {
  const { user } = useAuthStore();
  const navItems = propNavItems || (
    user?.role === 'manager'
      ? getFilteredManagerNavGroups(user)
      : adminNavGroups
  );
  const { selectedStoreId } = useAdminStoreStore();

  // Filters
  const [category, setCategory] = useState('all');
  const [brand, setBrand] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Categories list
  const [categories, setCategories] = useState([]);

  // Data states
  const [profitData, setProfitData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Table pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Load category list for filter
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const { data } = await getCategories();
        setCategories(data || []);
      } catch (err) {
        console.error('Failed to fetch categories', err);
      }
    };
    fetchCats();
  }, []);

  // Fetch profit data from backend
  const fetchProfitData = async () => {
    try {
      setLoading(true);
      const params = {
        category,
        brand,
        startDate,
        endDate,
        ...(selectedStoreId !== 'all' ? { storeId: selectedStoreId } : {})
      };
      const { data } = await getProfitReport(params);
      setProfitData(data);
      setCurrentPage(1); // Reset to page 1 on search
    } catch (err) {
      toast.error('Failed to load profit analysis reports');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch when parameters or store selection changes
  useEffect(() => {
    fetchProfitData();
  }, [category, brand, startDate, endDate, selectedStoreId]);

  // Quick Date Select
  const handleQuickDate = (rangeType) => {
    const today = new Date();
    let start = '';
    let end = today.toISOString().split('T')[0];

    switch (rangeType) {
      case 'today':
        start = end;
        break;
      case 'week': {

        const prevWeek = new Date(today);
        prevWeek.setDate(today.getDate() - 7);
        start = prevWeek.toISOString().split('T')[0];
        break;
      }
      case 'month': {

        const prevMonth = new Date(today);
        prevMonth.setMonth(today.getMonth() - 1);
        start = prevMonth.toISOString().split('T')[0];
        break;
      }

      case 'year':
        start = `${today.getFullYear()}-01-01`;
        break;
      default:
        start = '';
        end = '';
    }

    setStartDate(start);
    setEndDate(end);
  };

  // Process item details for inline search and pagination
  const filteredItems = useMemo(() => {
    if (!profitData?.items) return [];
    if (!searchQuery.trim()) return profitData.items;

    const query = searchQuery.toLowerCase();
    return profitData.items.filter(item => 
      (item.name && item.name.toLowerCase().includes(query)) ||
      (item.invoiceNumber && item.invoiceNumber.toLowerCase().includes(query)) ||
      (item.brand && item.brand.toLowerCase().includes(query)) ||
      (item.category && item.category.toLowerCase().includes(query))
    );
  }, [profitData, searchQuery]);

  // Paginated items
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredItems, currentPage]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  // Chronological daily profit trend processed client-side for Recharts
  const dailyTrendData = useMemo(() => {
    if (!profitData?.items) return [];

    const dailyMap = {};
    profitData.items.forEach(item => {
      const dateStr = new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = { date: dateStr, revenue: 0, cost: 0, profit: 0, rawDate: new Date(item.date) };
      }
      dailyMap[dateStr].revenue += item.totalRevenue || (item.sellingPrice * item.quantity);
      dailyMap[dateStr].cost += item.totalCost || (item.costPrice * item.quantity);
      dailyMap[dateStr].profit += item.profit;
    });

    // Sort chronologically
    return Object.values(dailyMap).sort((a, b) => a.rawDate - b.rawDate);
  }, [profitData]);

  // Export functions
  const handleExport = (type) => {
    if (!profitData?.items?.length) {
      toast.warn('No data available to export');
      return;
    }

    const profitCols = [
      { label: 'Date', accessor: (r) => new Date(r.date).toLocaleDateString() },
      { label: 'Invoice No', accessor: 'invoiceNumber' },
      { label: 'Item Name', accessor: 'name' },
      { label: 'Category', accessor: 'category' },
      { label: 'Brand', accessor: 'brand' },
      { label: 'Cost Price', accessor: (r) => `Rs. ${r.costPrice?.toLocaleString()}` },
      { label: 'Selling Price', accessor: (r) => `Rs. ${r.sellingPrice?.toLocaleString()}` },
      { label: 'Qty', accessor: 'quantity' },
      { label: 'Total Revenue', accessor: (r) => `Rs. ${(r.sellingPrice * r.quantity)?.toLocaleString()}` },
      { label: 'Total Cost', accessor: (r) => `Rs. ${(r.costPrice * r.quantity)?.toLocaleString()}` },
      { label: 'Total Profit', accessor: (r) => `Rs. ${r.profit?.toLocaleString()}` },
      { label: 'Margin', accessor: (r) => `${r.margin}%` }
    ];

    const title = 'Detailed Profit Analysis Report';
    if (type === 'pdf') {
      exportToPDF(profitData.items, profitCols, title);
    } else if (type === 'excel') {
      exportToExcel(profitData.items, profitCols, title.toLowerCase().replace(/\s+/g, '-'));
    }
  };

  const s = profitData?.summary || { totalRevenue: 0, totalCost: 0, totalProfit: 0, profitMargin: 0 };
  const profitPositive = s.totalProfit >= 0;

  return (
    <DashboardLayout navItems={navItems} title="Profit Reports">
      <div className="space-y-6">
        
        {/* Title and Top Level Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2 m-0">
              📈 Standalone Profit Analysis
            </h1>
            <p className="text-slate-500 text-xs font-normal mt-1.5 m-0">
              Analyze margins and gross product profitability by categories, brands, and timelines.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={() => handleExport('excel')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/10 cursor-pointer"
            >
              <Download size={13} /> Excel Export
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-rose-600/10 cursor-pointer"
            >
              <FileText size={13} /> PDF Export
            </button>
            <button
              onClick={fetchProfitData}
              disabled={loading}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold p-2.5 rounded-xl transition-all flex items-center justify-center shadow-xs cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              🔍 Report Filters
            </span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => handleQuickDate('today')} className="text-[9px] font-black uppercase tracking-wider bg-slate-100 hover:bg-slate-200/80 text-slate-600 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer">Today</button>
              <button onClick={() => handleQuickDate('week')} className="text-[9px] font-black uppercase tracking-wider bg-slate-100 hover:bg-slate-200/80 text-slate-600 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer">Last 7 Days</button>
              <button onClick={() => handleQuickDate('month')} className="text-[9px] font-black uppercase tracking-wider bg-slate-100 hover:bg-slate-200/80 text-slate-600 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer">Last 30 Days</button>
              <button onClick={() => handleQuickDate('year')} className="text-[9px] font-black uppercase tracking-wider bg-slate-100 hover:bg-slate-200/80 text-slate-600 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer">This Year</button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-1.5">Category Type</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-slate-200 rounded-xl py-2.5 px-4 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-indigo/15 focus:border-brand-indigo text-slate-700 font-extrabold cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="mobiles">Mobiles (Phones/Tablets)</option>
                <option value="accessories">Accessories</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-1.5">Brand Filter</label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full border border-slate-200 rounded-xl py-2.5 px-4 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-indigo/15 focus:border-brand-indigo text-slate-700 font-extrabold cursor-pointer"
              >
                <option value="all">All Brands</option>
                {BRANDS_LIST.slice(1).map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-1.5">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl py-2 px-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-indigo/15 focus:border-brand-indigo text-slate-700 font-bold"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-1.5">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl py-2 px-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-indigo/15 focus:border-brand-indigo text-slate-700 font-bold"
              />
            </div>
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 m-0 mb-1">Gross Revenue</p>
              <p className="text-xl font-black text-slate-900 m-0">Rs. {s.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-teal-50/50 flex items-center justify-center text-brand-fuchsia">
              <ArrowUpRight size={20} />
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 m-0 mb-1">Cost of Goods Sold (COGS)</p>
              <p className="text-xl font-black text-slate-900 m-0">Rs. {s.totalCost.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500">
              <Package size={20} />
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-brand-fuchsia" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 m-0 mb-1">Total Gross Profit</p>
              <p className={`text-xl font-black m-0 ${profitPositive ? 'text-brand-fuchsia' : 'text-rose-600'}`}>
                Rs. {s.totalProfit.toLocaleString()}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${profitPositive ? 'bg-teal-50/50 text-brand-fuchsia' : 'bg-rose-50 text-rose-600'}`}>
              {profitPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 m-0 mb-1">Profit Margin</p>
              <p className="text-xl font-black text-brand-indigo m-0">{s.profitMargin}%</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-brand-indigo">
              <DollarSign size={20} />
            </div>
          </div>
        </div>

        {/* Visual Analytics Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Gross Profit by Category */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-black text-slate-800 mb-6 text-xs uppercase tracking-wider flex items-center gap-1.5 m-0">
              <Tag size={14} className="text-brand-fuchsia" /> Gross Profit by Category
            </h3>
            {profitData?.byCategory?.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={profitData.byCategory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} />
                  <Tooltip formatter={(v) => `Rs. ${v.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#334155" name="Revenue" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" fill="#0d9488" name="Gross Profit" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-xs text-slate-400 font-bold border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                No category data matches current filters
              </div>
            )}
          </div>

          {/* Gross Profit by Brand */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-black text-slate-800 mb-6 text-xs uppercase tracking-wider flex items-center gap-1.5 m-0">
              <Landmark size={14} className="text-brand-fuchsia" /> Gross Profit by Brand
            </h3>
            {profitData?.byBrand?.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={profitData.byBrand}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} />
                  <Tooltip formatter={(v) => `Rs. ${v.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#475569" name="Revenue" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" fill="#0d9488" name="Gross Profit" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-xs text-slate-400 font-bold border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                No brand data matches current filters
              </div>
            )}
          </div>
        </div>

        {/* Time Series Profit Trend Chart */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-black text-slate-800 mb-6 text-xs uppercase tracking-wider flex items-center gap-1.5 m-0">
            <Calendar size={14} className="text-brand-fuchsia" /> Chronological Daily Profit Trend
          </h3>
          {dailyTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={dailyTrendData}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#334155" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#334155" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} />
                <Tooltip formatter={(v) => `Rs. ${v.toLocaleString()}`} />
                <Legend />
                <Area type="monotone" dataKey="revenue" stroke="#334155" fillOpacity={1} fill="url(#colorRevenue)" name="Gross Revenue" strokeWidth={2} />
                <Area type="monotone" dataKey="profit" stroke="#0d9488" fillOpacity={1} fill="url(#colorProfit)" name="Gross Profit" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-xs text-slate-400 font-bold border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              No historical timeline data matches filters
            </div>
          )}
        </div>

        {/* Detailed Items Table */}
        <div className="bg-white rounded-2xl border border-card-border p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-dark-navy text-base">📖 Detailed Items Profit Ledger</h2>
              <p className="text-muted-text text-xs mt-0.5">Individual product sales details and margins.</p>
            </div>
            
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 text-muted-text" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by product, invoice..."
                className="w-full pl-9 pr-4 py-2 border border-card-border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary-blue bg-gray-50/40 text-dark-navy font-medium"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-card-border text-muted-text text-[10px] uppercase text-left font-bold tracking-wider">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Invoice</th>
                  <th className="py-3 px-3">Product Name</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Brand</th>
                  <th className="py-3 px-3 text-right">Cost (Rs.)</th>
                  <th className="py-3 px-3 text-right">Selling (Rs.)</th>
                  <th className="py-3 px-3 text-center">Qty</th>
                  <th className="py-3 px-3 text-right">Gross Profit</th>
                  <th className="py-3 px-3 text-right">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan="10" className="py-8 text-center text-xs text-muted-text">Loading profit records...</td>
                  </tr>
                ) : !filteredItems.length ? (
                  <tr>
                    <td colSpan="10" className="py-8 text-center text-xs text-muted-text">No profit records matched criteria</td>
                  </tr>
                ) : (
                  paginatedItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-3 text-xs text-slate-500">{new Date(item.date).toLocaleDateString()}</td>
                      <td className="py-3 px-3 text-xs font-mono font-medium text-slate-700">#{item.invoiceNumber}</td>
                      <td className="py-3 px-3 text-xs font-semibold text-dark-navy">{item.name}</td>
                      <td className="py-3 px-3 text-xs text-muted-text">{item.category}</td>
                      <td className="py-3 px-3 text-xs text-muted-text">{item.brand}</td>
                      <td className="py-3 px-3 text-right text-xs text-slate-600">Rs. {item.costPrice.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right text-xs text-slate-600">Rs. {item.sellingPrice.toLocaleString()}</td>
                      <td className="py-3 px-3 text-center text-xs font-bold text-dark-navy">{item.quantity}</td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-600 text-xs">Rs. {item.profit.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-bold text-primary-blue text-xs">{item.margin}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-xs">
              <span className="text-muted-text">
                Showing {Math.min(filteredItems.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(filteredItems.length, currentPage * itemsPerPage)} of {filteredItems.length} records
              </span>
              <div className="flex gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 border border-card-border rounded-xl text-dark-navy font-semibold hover:bg-gray-50 disabled:opacity-40"
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 rounded-xl font-bold ${currentPage === page ? 'bg-primary-blue text-white' : 'border border-card-border text-dark-navy hover:bg-gray-50'}`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 border border-card-border rounded-xl text-dark-navy font-semibold hover:bg-gray-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
};

export default AdminProfitReports;
