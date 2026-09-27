'use client';

import { useState, useEffect } from 'react';
import { Package, AlertTriangle, Search, FileText, DollarSign, Building2 } from 'lucide-react';
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

  const uniqueBrands = ['all', ...new Set(products.map(p => p.brand).filter(Boolean))];
  const totalProducts = products.length;
  const outOfStock = products.filter(p => p.stock <= 0).length;
  const lowStock = products.filter(p => {
    const safetyLimit = p.lowStockLimit !== undefined && p.lowStockLimit !== null ? p.lowStockLimit : 10;
    return p.stock > 0 && p.stock <= safetyLimit;
  }).length;
  const totalStockValue = products.reduce((s, p) => s + (p.price || 0) * (p.stock || 0), 0);
  const totalWarehouses = new Set(products.map(p => p.storeId?._id || p.storeId).filter(Boolean)).size || 2;

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
        <div className="ds-loading"><div className="ds-spinner" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={activeNavItems} title="Inventory">
      <div className="ds-page">

        {/* ── Page Header ── */}
        <div className="ds-page-header">
          <div className="ds-page-header-left">
            <div className="ds-page-header-icon">
              <Package size={20} strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="ds-page-title">Inventory Valuation &amp; Stock</h1>
              <p className="ds-page-subtitle">Track stock counts, safety levels &amp; valuation across all products</p>
            </div>
          </div>
          <div className="ds-page-header-right">
            <button onClick={() => exportToCSV(filtered, exportCols, 'inventory')} className="ds-btn ds-btn-secondary ds-btn-sm">CSV</button>
            <button onClick={() => exportToExcel(filtered, exportCols, 'inventory')} className="ds-btn ds-btn-sm" style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>Excel</button>
            <button onClick={() => exportToPDF(filtered, exportCols, 'Inventory Valuation Report')} className="ds-btn ds-btn-sm" style={{ background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3' }}>
              <FileText size={13} /> PDF
            </button>
          </div>
        </div>

        {/* ── Stat Cards matching user reference design ── */}
        <div className="ds-stats ds-stats-4">
          <div className="ds-stat">
            <div className="ds-stat-top">
              <div className="ds-stat-icon" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                <Package size={18} />
              </div>
              <span className="ds-stat-change blue">Total SKUs</span>
            </div>
            <div className="ds-stat-bottom">
              <p className="ds-stat-label">Total Items</p>
              <p className="ds-stat-value">{totalProducts}</p>
              <p className="ds-stat-sub">Active catalog inventory</p>
            </div>
          </div>

          <div className="ds-stat">
            <div className="ds-stat-top">
              <div className="ds-stat-icon" style={{ background: '#f0fdf4', color: '#15803d' }}>
                <DollarSign size={18} />
              </div>
              <span className="ds-stat-change up">Valuation</span>
            </div>
            <div className="ds-stat-bottom">
              <p className="ds-stat-label">Page Value</p>
              <p className="ds-stat-value text-emerald-600">
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>LKR </span>
                {totalStockValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="ds-stat-sub">Total retail stock worth</p>
            </div>
          </div>

          <div className="ds-stat">
            <div className="ds-stat-top">
              <div className="ds-stat-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                <Building2 size={18} />
              </div>
              <span className="ds-stat-change neu">Active</span>
            </div>
            <div className="ds-stat-bottom">
              <p className="ds-stat-label">Warehouses</p>
              <p className="ds-stat-value">{totalWarehouses}</p>
              <p className="ds-stat-sub">Showrooms &amp; branches</p>
            </div>
          </div>

          <div className="ds-stat" style={{ borderColor: (outOfStock + lowStock) > 0 ? '#fde68a' : undefined }}>
            <div className="ds-stat-top">
              <div className="ds-stat-icon" style={{ background: '#fffbeb', color: '#b45309' }}>
                <AlertTriangle size={18} />
              </div>
              <button
                type="button"
                onClick={() => setStockFilter(stockFilter === 'low' || stockFilter === 'out' ? 'all' : 'low')}
                className="ds-stat-change amber"
                style={{ cursor: 'pointer', border: '1px solid #fde68a' }}
              >
                {stockFilter === 'low' || stockFilter === 'out' ? 'Showing' : 'View'}
              </button>
            </div>
            <div className="ds-stat-bottom">
              <p className="ds-stat-label" style={{ color: '#b45309', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <AlertTriangle size={12} /> Low / Critical
              </p>
              <p className="ds-stat-value" style={{ color: '#b45309' }}>
                {outOfStock + lowStock}
              </p>
              <p className="ds-stat-sub">
                {outOfStock > 0 ? `${outOfStock} out of stock` : 'Safety limits alert'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Main Card: Filters + Table ── */}
        <div className="ds-card">
          <div className="ds-filter-bar">
            <div className="ds-search">
              <Search size={14} />
              <input placeholder="Search by name or barcode…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="ds-select" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <select className="ds-select" value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}>
              <option value="all">All Brands</option>
              {uniqueBrands.slice(1).map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <select className="ds-select" value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="ok">In Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
            <select className="ds-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="stock-asc">Stock: Low → High</option>
              <option value="stock-desc">Stock: High → Low</option>
              <option value="name">Name A–Z</option>
              <option value="price">Price: High → Low</option>
            </select>
          </div>

          <div className="ds-card-header">
            <h3 className="ds-card-title"><Package size={15} /> Detailed Inventory Preview</h3>
            <span className="ds-badge ds-badge-slate">{filtered.length} items</span>
          </div>

          <div className="ds-table-wrap">
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU / Barcode</th>
                  <th>Brand</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const safetyLimit = p.lowStockLimit !== undefined && p.lowStockLimit !== null ? p.lowStockLimit : 10;
                  const isOut = p.stock <= 0;
                  const isLow = p.stock > 0 && p.stock <= safetyLimit;
                  return (
                    <tr key={p._id} style={{ background: isOut ? '#fff5f5' : isLow ? '#fffdf0' : undefined }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {p.images?.[0]
                            ? <img src={p.images[0]} alt="" style={{ width: 40, height: 40, borderRadius: 'var(--ds-r-sm)', objectFit: 'cover', border: '1px solid var(--ds-border)' }} />
                            : <div style={{ width: 40, height: 40, borderRadius: 'var(--ds-r-sm)', background: 'var(--ds-border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={16} style={{ color: 'var(--ds-text-faint)' }} /></div>
                          }
                          <div>
                            <span style={{ fontWeight: 600, color: 'var(--ds-text-head)', display: 'block', fontSize: 'var(--ds-text-sm)' }}>{p.name}</span>
                            <span style={{ fontSize: 'var(--ds-text-2xs)', color: 'var(--ds-text-faint)', fontWeight: 500 }}>Safety: {safetyLimit} pcs</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 'var(--ds-text-xs)', fontWeight: 600, color: 'var(--ds-text-muted)' }}>{p.sku || p.barcode || '—'}</td>
                      <td><span className="ds-badge ds-badge-slate">{p.brand || 'No Brand'}</span></td>
                      <td style={{ fontWeight: 600, color: 'var(--ds-text-head)' }}>Rs. {p.price?.toLocaleString()}</td>
                      <td>
                        <span style={{ fontWeight: 700, fontSize: 'var(--ds-text-sm)', color: isOut ? '#be123c' : isLow ? '#b45309' : '#15803d' }}>{p.stock}</span>
                        <span style={{ fontSize: 'var(--ds-text-2xs)', color: 'var(--ds-text-faint)', marginLeft: 3 }}>/{p.unit || 'pcs'}</span>
                      </td>
                      <td>
                        {isOut
                          ? <span className="ds-badge ds-badge-red">Out of Stock</span>
                          : isLow
                          ? <span className="ds-badge ds-badge-amber">Low Stock</span>
                          : <span className="ds-badge ds-badge-green">In Stock</span>}
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--ds-primary)' }}>Rs. {((p.price || 0) * (p.stock || 0)).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="ds-empty">
                <Package className="ds-empty-icon" />
                <p className="ds-empty-title">No products found</p>
                <p className="ds-empty-desc">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default AdminInventory;
