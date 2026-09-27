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
      <div className="ds-page">
        
        {/* Title and Top Level Controls */}
        <div className="ds-page-header">
          <div className="ds-page-header-left">
            <div className="ds-page-header-badge">
              Reports
            </div>
            <div>
              <h1 className="m-0">Profit & Loss Reports</h1>
              <p className="m-0 mt-1.5">
                Analyze margins and gross product profitability by categories, brands, and timelines.
              </p>
            </div>
          </div>
          
          <div className="ds-page-header-right">
            <button
              onClick={() => handleExport('excel')}
              className="ds-btn ds-btn-sm ds-btn-success"
            >
              <Download size={13} /> Excel Export
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="ds-btn ds-btn-sm ds-btn-danger"
            >
              <FileText size={13} /> PDF Export
            </button>
            <button
              onClick={fetchProfitData}
              disabled={loading}
              className="ds-btn ds-btn-sm ds-btn-secondary"
              title="Refresh Data"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="ds-card">
          <div className="ds-card-header flex items-center justify-between">
            <span className="ds-card-title flex items-center gap-1">
               Report Filters
            </span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => handleQuickDate('today')} className="ds-btn ds-btn-sm ds-btn-ghost">Today</button>
              <button onClick={() => handleQuickDate('week')} className="ds-btn ds-btn-sm ds-btn-ghost">Last 7 Days</button>
              <button onClick={() => handleQuickDate('month')} className="ds-btn ds-btn-sm ds-btn-ghost">Last 30 Days</button>
              <button onClick={() => handleQuickDate('year')} className="ds-btn ds-btn-sm ds-btn-ghost">This Year</button>
            </div>
          </div>
          
          <div className="ds-card-body">
            <div className="ds-filter-bar grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full">
              <div className="ds-form-group">
                <label className="ds-label">Category Type</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="ds-select w-full"
                >
                  <option value="all">All Categories</option>
                  <option value="mobiles">Mobiles (Phones/Tablets)</option>
                  <option value="accessories">Accessories</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="ds-form-group">
                <label className="ds-label">Brand Filter</label>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="ds-select w-full"
                >
                  <option value="all">All Brands</option>
                  {BRANDS_LIST.slice(1).map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="ds-form-group">
                <label className="ds-label">From Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="ds-input w-full"
                />
              </div>

              <div className="ds-form-group">
                <label className="ds-label">To Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="ds-input w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="ds-stats">
          <div className="ds-stat">
            <p className="ds-stat-label">Gross Revenue</p>
            <p className="ds-stat-value">Rs. {s.totalRevenue.toLocaleString()}</p>
          </div>

          <div className="ds-stat">
            <p className="ds-stat-label">Cost of Goods Sold (COGS)</p>
            <p className="ds-stat-value">Rs. {s.totalCost.toLocaleString()}</p>
          </div>

          <div className="ds-stat">
            <p className="ds-stat-label">Total Gross Profit</p>
            <p className={`ds-stat-value ${profitPositive ? 'text-brand-fuchsia' : 'text-rose-600'}`}>
              Rs. {s.totalProfit.toLocaleString()}
            </p>
          </div>

          <div className="ds-stat">
            <p className="ds-stat-label">Profit Margin</p>
            <p className="ds-stat-value text-brand-indigo">{s.profitMargin}%</p>
          </div>
        </div>

        {/* Visual Analytics Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Gross Profit by Category */}
          <div className="ds-card">
            <div className="ds-card-header">
              <h3 className="ds-card-title flex items-center gap-1.5 m-0">
                <Tag size={14} className="text-brand-fuchsia" /> Gross Profit by Category
              </h3>
            </div>
            <div className="ds-card-body">
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
          </div>

          {/* Gross Profit by Brand */}
          <div className="ds-card">
            <div className="ds-card-header">
              <h3 className="ds-card-title flex items-center gap-1.5 m-0">
                <Landmark size={14} className="text-brand-fuchsia" /> Gross Profit by Brand
              </h3>
            </div>
            <div className="ds-card-body">
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
        </div>

        {/* Time Series Profit Trend Chart */}
        <div className="ds-card">
          <div className="ds-card-header">
            <h3 className="ds-card-title flex items-center gap-1.5 m-0">
              <Calendar size={14} className="text-brand-fuchsia" /> Chronological Daily Profit Trend
            </h3>
          </div>
          <div className="ds-card-body">
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
        </div>

        {/* Detailed Items Table */}
        <div className="ds-card">
          <div className="ds-card-header flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="ds-card-title"> Detailed Items Profit Ledger</h2>
              <p className="text-slate-500 text-xs mt-0.5">Individual product sales details and margins.</p>
            </div>
            
            <div className="ds-search">
              <Search size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by product, invoice..."
              />
            </div>
          </div>

          <div className="ds-card-body p-0">
            <div className="ds-table-wrap">
              <table className="ds-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Invoice</th>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Brand</th>
                    <th className="text-right">Cost (Rs.)</th>
                    <th className="text-right">Selling (Rs.)</th>
                    <th className="text-center">Qty</th>
                    <th className="text-right">Gross Profit</th>
                    <th className="text-right">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="10">
                        <div className="ds-loading"><div className="ds-spinner"></div></div>
                      </td>
                    </tr>
                  ) : !filteredItems.length ? (
                    <tr>
                      <td colSpan="10">
                        <div className="ds-empty">
                          <p className="ds-empty-title">No profit records matched criteria</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedItems.map((item, idx) => (
                      <tr key={idx}>
                        <td>{new Date(item.date).toLocaleDateString()}</td>
                        <td className="font-mono font-medium">#{item.invoiceNumber}</td>
                        <td className="font-semibold">{item.name}</td>
                        <td>{item.category}</td>
                        <td>{item.brand}</td>
                        <td className="text-right">Rs. {item.costPrice.toLocaleString()}</td>
                        <td className="text-right">Rs. {item.sellingPrice.toLocaleString()}</td>
                        <td className="text-center font-bold">{item.quantity}</td>
                        <td className="text-right font-bold text-emerald-600">Rs. {item.profit.toLocaleString()}</td>
                        <td className="text-right font-bold text-brand-indigo">{item.margin}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="ds-card-footer flex items-center justify-between">
              <span className="text-slate-500 text-xs">
                Showing {Math.min(filteredItems.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(filteredItems.length, currentPage * itemsPerPage)} of {filteredItems.length} records
              </span>
              <div className="flex gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="ds-btn ds-btn-sm ds-btn-secondary"
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`ds-btn ds-btn-sm ${currentPage === page ? 'ds-btn-primary' : 'ds-btn-ghost'}`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="ds-btn ds-btn-sm ds-btn-secondary"
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
