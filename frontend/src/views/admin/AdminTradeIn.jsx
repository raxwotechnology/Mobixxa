'use client';

import { useState, useEffect } from 'react';
import { Smartphone, DollarSign, Package, CheckCircle, RefreshCw, Eye, Tag, Plus, Download } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { getTradeIns, convertToRefurbishedStock } from '../../services/api';
import useCurrencyStore from '../../store/currencyStore';
import { toast } from 'react-toastify';
import { adminNavGroups } from './adminNavItems';
import { managerNavGroups } from '../storeOwner/managerNavItems';
import useAuthStore from '../../store/authStore';

const AdminTradeIn = () => {
  const { user } = useAuthStore();
  const { currency } = useCurrencyStore();
  const [tradeIns, setTradeIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTradeIn, setSelectedTradeIn] = useState(null);
  const [sellingPriceInput, setSellingPriceInput] = useState('');
  const [converting, setConverting] = useState(false);

  const isManager = user?.role === 'manager';
  const navItems = isManager ? managerNavGroups : adminNavGroups;

  useEffect(() => {
    fetchTradeIns();
  }, []);

  const fetchTradeIns = async () => {
    try {
      setLoading(true);
      const res = await getTradeIns();
      setTradeIns(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load trade-in records:', err);
      setTradeIns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToRefurbished = async (tradeIn) => {
    setSelectedTradeIn(tradeIn);
    setSellingPriceInput(Math.round(tradeIn.finalValuationPrice * 1.2).toString());
  };

  const confirmConvertToStock = async () => {
    if (!selectedTradeIn) return;
    try {
      setConverting(true);
      await convertToRefurbishedStock(selectedTradeIn._id, {
        sellingPrice: Number(sellingPriceInput),
      });
      toast.success('Device added to Refurbished shop inventory!');
      setSelectedTradeIn(null);
      fetchTradeIns();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to convert to refurbished stock');
    } finally {
      setConverting(false);
    }
  };

  const filtered = tradeIns.filter((t) => {
    const term = search.toLowerCase();
    return (
      t.brand?.toLowerCase().includes(term) ||
      t.modelName?.toLowerCase().includes(term) ||
      t.customerName?.toLowerCase().includes(term) ||
      t.imeiNumber?.toLowerCase().includes(term)
    );
  });

  const totalAcquiredValue = tradeIns.reduce((sum, t) => sum + (t.finalValuationPrice || 0), 0);
  const totalRefurbishedStock = tradeIns.filter((t) => t.status === 'added_to_refurbished_stock').length;

  return (
    <DashboardLayout navGroups={navItems} activePath="/admin/trade-in">
      <div className="ds-page">
        <div className="ds-page-header">
          <div className="ds-page-header-left">
            <span className="ds-page-header-badge">Operations</span>
            <h1 style={{ margin: '8px 0 0 0' }}>Trade-In Management</h1>
            <p style={{ margin: '8px 0 0 0', color: 'var(--ds-text-muted)' }}>
              View customer trade-in records & convert pre-owned devices into certified shop inventory
            </p>
          </div>
        </div>

        <div className="ds-stats">
          <div className="ds-stat">
            <div className="ds-stat-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
              <Smartphone size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <p className="ds-stat-label">Total Trade-Ins</p>
              <p className="ds-stat-value">{tradeIns.length}</p>
            </div>
          </div>
          <div className="ds-stat">
            <div className="ds-stat-icon" style={{ backgroundColor: '#d1fae5', color: '#059669' }}>
              <DollarSign size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <p className="ds-stat-label">Acquired Value</p>
              <p className="ds-stat-value" style={{ color: '#059669' }}>{currency} {totalAcquiredValue.toLocaleString()}</p>
            </div>
          </div>
          <div className="ds-stat">
            <div className="ds-stat-icon" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
              <Package size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <p className="ds-stat-label">In Refurbished Stock</p>
              <p className="ds-stat-value" style={{ color: '#d97706' }}>{totalRefurbishedStock} Units</p>
            </div>
          </div>
        </div>

        <div className="ds-card">
          <div className="ds-filter-bar" style={{ padding: '16px' }}>
             <div className="ds-search" style={{ flex: 1 }}>
               <input
                 type="text"
                 placeholder="Search by brand, model, IMEI, or customer name..."
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="ds-input"
               />
             </div>
          </div>
        </div>

        <div className="ds-card">
          <div className="ds-card-body" style={{ padding: 0 }}>
            <div className="ds-table-wrap">
              <table className="ds-table">
                <thead>
                  <tr>
                    <th>Device Model</th>
                    <th>Customer</th>
                    <th>Grade & Condition</th>
                    <th>Valuation Offered</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="ds-loading"><div className="ds-spinner" /></div>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="ds-empty">No trade-in records found.</div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item) => (
                      <tr key={item._id}>
                        <td>
                          <div style={{ fontWeight: 'bold' }}>{item.brand} {item.modelName}</div>
                          <div style={{ fontSize: '0.85em', color: 'var(--ds-text-muted)', fontFamily: 'monospace' }}>IMEI: {item.imeiNumber || 'N/A'}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 'bold' }}>{item.customerName || 'Walk-in'}</div>
                          <div style={{ fontSize: '0.85em', color: 'var(--ds-text-muted)' }}>{item.customerPhone || '-'}</div>
                        </td>
                        <td>
                          <span className="ds-badge ds-badge-slate">{item.grade}</span>
                        </td>
                        <td style={{ fontWeight: 'bold', color: '#059669' }}>
                          {currency} {(item.finalValuationPrice || 0).toLocaleString()}
                        </td>
                        <td>
                          <span className={`ds-badge ${
                            item.status === 'added_to_refurbished_stock' ? 'ds-badge-green' :
                            item.status === 'applied_to_pos' ? 'ds-badge-blue' :
                            'ds-badge-amber'
                          }`}>
                            {item.status?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {item.status !== 'added_to_refurbished_stock' ? (
                            <button
                              onClick={() => handleConvertToRefurbished(item)}
                              className="ds-btn ds-btn-sm ds-btn-primary"
                              style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b' }}
                            >
                              + Add to Stock
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.85em', fontWeight: 'bold', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                              <CheckCircle size={14} /> In Stock
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {selectedTradeIn && (
        <div className="ds-modal-overlay">
          <div className="ds-modal" style={{ maxWidth: '400px' }}>
            <div className="ds-modal-header">
              <h3 className="ds-modal-title">Add Pre-Owned Phone to Refurbished Inventory</h3>
            </div>
            <div className="ds-modal-body">
              <p style={{ margin: '0 0 16px 0', fontSize: '0.9em', color: 'var(--ds-text-muted)' }}>
                Set selling price for <strong>{selectedTradeIn.brand} {selectedTradeIn.modelName}</strong>. Device cost is LKR {selectedTradeIn.finalValuationPrice.toLocaleString()}.
              </p>
              <div className="ds-form-group" style={{ marginBottom: 0 }}>
                <label className="ds-label">Retail Resell Selling Price (LKR)</label>
                <input
                  type="number"
                  value={sellingPriceInput}
                  onChange={(e) => setSellingPriceInput(e.target.value)}
                  className="ds-input"
                  style={{ fontWeight: 'bold', color: '#059669' }}
                />
              </div>
            </div>
            <div className="ds-modal-footer">
              <button onClick={() => setSelectedTradeIn(null)} className="ds-btn ds-btn-secondary">
                Cancel
              </button>
              <button
                onClick={confirmConvertToStock}
                disabled={converting}
                className="ds-btn ds-btn-primary"
                style={{ backgroundColor: '#059669', borderColor: '#059669' }}
              >
                {converting ? 'Saving...' : 'Add to Shop Inventory'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminTradeIn;
