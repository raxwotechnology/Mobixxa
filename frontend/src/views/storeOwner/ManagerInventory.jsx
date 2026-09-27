'use client';

import { useState, useEffect } from 'react';
import { Package, AlertTriangle, Search, DollarSign, Building2 } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { toast } from 'react-toastify';
import { exportToCSV, exportToExcel } from '../../utils/exportUtils';
import { managerNavGroups as navItems } from './managerNavItems';
import { getMyStoreProducts } from '../../services/api';
import API from '../../services/api';

const ManagerInventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [sortBy, setSortBy] = useState('stock-asc');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          getMyStoreProducts(),
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
      const matchCat = catFilter === 'all' || p.category === catFilter || p.categoryId === catFilter;
      const matchStock = stockFilter === 'all'
        || (stockFilter === 'low' && p.stock > 0 && p.stock <= 10)
        || (stockFilter === 'out' && p.stock <= 0)
        || (stockFilter === 'ok' && p.stock > 10);
      return matchSearch && matchCat && matchStock;
    })
    .sort((a, b) => {
      if (sortBy === 'stock-asc') return (a.stock || 0) - (b.stock || 0);
      if (sortBy === 'stock-desc') return (b.stock || 0) - (a.stock || 0);
      if (sortBy === 'name') return a.name?.localeCompare(b.name);
      if (sortBy === 'price') return (b.price || 0) - (a.price || 0);
      return 0;
    });

  const totalProducts = products.length;
  const outOfStock = products.filter(p => p.stock <= 0).length;
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 10).length;
  const totalStockValue = products.reduce((s, p) => s + (p.price || 0) * (p.stock || 0), 0);

  const exportCols = [
    { label: 'Name', accessor: 'name' },
    { label: 'SKU', accessor: (r) => r.sku || r.barcode || 'N/A' },
    { label: 'Price (Rs.)', accessor: (r) => r.price?.toFixed(2) },
    { label: 'Stock', accessor: (r) => r.stock?.toString() },
    { label: 'Status', accessor: (r) => r.stock <= 0 ? 'Out of Stock' : r.stock <= 10 ? 'Low Stock' : 'In Stock' },
    { label: 'Value (Rs.)', accessor: (r) => ((r.price || 0) * (r.stock || 0)).toFixed(2) },
  ];

  if (loading) {
    return (
      <DashboardLayout navItems={navItems} title="Manager Dashboard">
        <div className="ds-loading"><div className="ds-spinner" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} title="Manager Dashboard">
      <div className="ds-page">

        {/* Page Header */}
        <div className="ds-page-header">
          <div className="ds-page-header-left">
            <span className="ds-page-header-badge">Store Inventory</span>
            <h1>Store Inventory</h1>
            <p>Stock levels and product tracking</p>
          </div>
          <div className="ds-page-header-right">
            <button onClick={() => exportToCSV(filtered, exportCols, 'store-inventory')} className="ds-btn ds-btn-secondary ds-btn-sm">
              CSV
            </button>
            <button onClick={() => exportToExcel(filtered, exportCols, 'store-inventory')} className="ds-btn ds-btn-primary ds-btn-sm">
              Excel
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="ds-stats ds-stats-4">
          <div className="ds-stat">
            <div className="ds-stat-top">
              <div className="ds-stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                <Package size={18} />
              </div>
              <span className="ds-stat-change pos">Total SKUs</span>
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
              <p className="ds-stat-label">Categories</p>
              <p className="ds-stat-value">{categories.length}</p>
              <p className="ds-stat-sub">Catalog product groups</p>
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
              <p className="ds-stat-sub" style={{ color: '#d97706' }}>
                {outOfStock} out of stock · {lowStock} low
              </p>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="ds-card" style={{ padding: '0.75rem 1rem' }}>
          <div className="ds-filter-bar">
            <div className="ds-search">
              <Search size={16} />
              <input
                placeholder="Search by name or barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select className="ds-select" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <select className="ds-select" value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
              <option value="all">All Stock</option>
              <option value="ok">In Stock (&gt;10)</option>
              <option value="low">Low Stock (1-10)</option>
              <option value="out">Out of Stock</option>
            </select>
            <select className="ds-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="stock-asc">Stock: Low → High</option>
              <option value="stock-desc">Stock: High → Low</option>
              <option value="name">Name A-Z</option>
              <option value="price">Price: High → Low</option>
            </select>
          </div>
        </div>

        {/* Products Table */}
        <div className="ds-card" style={{ overflow: 'hidden' }}>
          <div className="ds-table-wrap">
            {filtered.length === 0 ? (
              <div className="ds-empty">
                <Package size={36} className="ds-empty-icon" />
                <p className="ds-empty-title">No products found</p>
              </div>
            ) : (
              <table className="ds-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU / Barcode</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => {
                    const stockStatus = p.stock <= 0 ? 'out' : p.stock <= 10 ? 'low' : 'ok';
                    const badgeClass =
                      stockStatus === 'out' ? 'ds-badge ds-badge-red' :
                      stockStatus === 'low' ? 'ds-badge ds-badge-amber' :
                                             'ds-badge ds-badge-green';
                    const badgeLabel =
                      stockStatus === 'out' ? 'Out of Stock' :
                      stockStatus === 'low' ? 'Low Stock' : 'In Stock';
                    const stockColor =
                      stockStatus === 'out' ? '#dc2626' :
                      stockStatus === 'low' ? '#d97706' : '#059669';

                    return (
                      <tr key={p._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {p.images?.[0] ? (
                              <img src={p.images[0]} alt="" style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--ds-r-sm)', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--ds-r-sm)', background: 'var(--ds-border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Package size={14} style={{ color: 'var(--ds-text-faint)' }} />
                              </div>
                            )}
                            <span style={{ fontWeight: 600, color: 'var(--ds-text-head)' }}>{p.name}</span>
                          </div>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-muted)' }}>{p.sku || p.barcode || '—'}</td>
                        <td style={{ fontWeight: 600 }}>Rs. {p.price?.toLocaleString()}</td>
                        <td>
                          <span style={{ fontSize: 'var(--ds-text-md)', fontWeight: 700, color: stockColor }}>{p.stock}</span>
                          <span style={{ fontSize: 'var(--ds-text-2xs)', color: 'var(--ds-text-muted)', marginLeft: '0.25rem' }}>/{p.unit || 'pcs'}</span>
                        </td>
                        <td><span className={badgeClass}>{badgeLabel}</span></td>
                        <td style={{ fontWeight: 600, color: 'var(--ds-text-muted)' }}>Rs. {((p.price || 0) * (p.stock || 0)).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default ManagerInventory;
