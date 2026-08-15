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
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <Smartphone className="text-sky-600" /> Phone Trade-In & Refurbish Management
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-1">
              View customer trade-in records & convert pre-owned devices into certified shop inventory
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3.5 bg-sky-50 text-sky-600 rounded-xl">
              <Smartphone size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">Total Trade-Ins</p>
              <h3 className="text-2xl font-black text-slate-800">{tradeIns.length}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">Acquired Value</p>
              <h3 className="text-2xl font-black text-emerald-600">{currency} {totalAcquiredValue.toLocaleString()}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl">
              <Package size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">In Refurbished Stock</p>
              <h3 className="text-2xl font-black text-amber-600">{totalRefurbishedStock} Units</h3>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <input
            type="text"
            placeholder="Search by brand, model, IMEI, or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Device Model</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Grade & Condition</th>
                  <th className="px-6 py-4">Valuation Offered</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400 font-semibold">
                      Loading trade-in records...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400 font-semibold">
                      No trade-in records found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-extrabold text-slate-800 m-0">{item.brand} {item.modelName}</p>
                        <p className="text-xs text-slate-400 font-mono m-0 mt-0.5">IMEI: {item.imeiNumber || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-700 m-0">{item.customerName || 'Walk-in'}</p>
                        <p className="text-xs text-slate-400 m-0">{item.customerPhone || '-'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                          {item.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-black text-emerald-600">
                        {currency} {(item.finalValuationPrice || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                          item.status === 'added_to_refurbished_stock' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          item.status === 'applied_to_pos' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {item.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {item.status !== 'added_to_refurbished_stock' ? (
                          <button
                            onClick={() => handleConvertToRefurbished(item)}
                            className="px-3 py-1.5 rounded-lg bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition-colors cursor-pointer"
                          >
                            + Add to Stock
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-emerald-600 flex items-center justify-end gap-1">
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

      {/* Convert to Stock Modal */}
      {selectedTradeIn && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-slate-800">Add Pre-Owned Phone to Refurbished Inventory</h3>
            <p className="text-xs text-slate-500">
              Set selling price for <strong>{selectedTradeIn.brand} {selectedTradeIn.modelName}</strong>. Device cost is LKR {selectedTradeIn.finalValuationPrice.toLocaleString()}.
            </p>
            <div>
              <label className="text-xs font-bold text-slate-600">Retail Resell Selling Price (LKR)</label>
              <input
                type="number"
                value={sellingPriceInput}
                onChange={(e) => setSellingPriceInput(e.target.value)}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 font-extrabold text-emerald-600"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedTradeIn(null)}
                className="px-4 py-2 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmConvertToStock}
                disabled={converting}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700"
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
