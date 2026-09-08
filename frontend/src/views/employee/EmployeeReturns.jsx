'use client';

import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Package, ArrowLeftRight, CheckCircle, Search, ClipboardList } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { getEmployeeNavGroups } from './employeeNav';
import useAuthStore from '../../store/authStore';
import { toast } from 'react-toastify';
import { createCustomerReturn, getCustomerReturns, getReturnOrder } from '../../services/api';

const EmployeeReturns = () => {
  const { user } = useAuthStore();
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [history, setHistory] = useState([]);

  const fetchHistory = async () => {
    try {
      const { data } = await getCustomerReturns({ status: 'requested' });
      setHistory(data || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const lookupOrder = async () => {
    if (!orderId.trim()) return;
    setLoadingOrder(true);
    try {
      const { data } = await getReturnOrder(orderId.trim());
      setOrder(data);
      const base = (data.items || []).map((i) => ({
        productId: i.productId,
        name: i.name,
        soldQty: i.quantity,
        qty: 0,
        condition: 'good',
        reason: '',
      }));
      setItems(base);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load order');
      setOrder(null);
      setItems([]);
    } finally {
      setLoadingOrder(false);
    }
  };

  const canSubmit = useMemo(() => items.some((i) => Number(i.qty) > 0), [items]);

  const submitReturn = async (e) => {
    e.preventDefault();
    if (!order?._id) {
      toast.error('Lookup an order first');
      return;
    }
    const payloadItems = items
      .filter((i) => Number(i.qty) > 0)
      .map((i) => ({
        productId: i.productId,
        qty: Number(i.qty),
        condition: i.condition,
        reason: i.reason,
      }));
    if (payloadItems.length === 0) {
      toast.error('Select at least one item to return');
      return;
    }
    setSubmitting(true);
    try {
      await createCustomerReturn({ orderId: order._id, items: payloadItems, notes });
      toast.success('Return request submitted (Admin will review)');
      setOrderId('');
      setOrder(null);
      setItems([]);
      setNotes('');
      fetchHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit return');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout navItems={getEmployeeNavGroups(user?.role)} title="Employee Portal">
      <div className="max-w-7xl mx-auto pb-10 space-y-8 animate-fade-in">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white/40 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-indigo/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-brand-indigo/10 flex items-center justify-center text-brand-indigo">
                <ArrowLeftRight size={20} strokeWidth={2.5} />
              </div>
              <h1 className="text-2xl font-black text-slate-900 m-0">Customer Returns</h1>
            </div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-2 m-0">Initiate and document return claims for client purchases</p>
          </div>
        </div>

        {/* Lookup Card */}
        <div className="glass-card rounded-[2rem] p-6 shadow-sm border border-slate-200/60">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 mb-2">Search Order By ID *</label>
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-indigo/35 shadow-xs"
                  placeholder="Paste order id here..."
                />
              </div>
            </div>
            <button
              onClick={lookupOrder}
              disabled={loadingOrder}
              className="bg-gradient-to-r from-brand-indigo to-brand-violet hover:opacity-95 text-white font-black text-[10px] uppercase tracking-wider px-7 py-4 rounded-2xl transition-all shadow-[0_4px_12px_rgba(99,102,241,0.2)] hover:scale-[1.02] active:scale-95 border-0 cursor-pointer disabled:opacity-50 shrink-0"
            >
              {loadingOrder ? 'Searching...' : 'Lookup Order'}
            </button>
          </div>

          {order && (
            <form onSubmit={submitReturn} className="mt-8 space-y-6 pt-6 border-t border-slate-100">
              <div className="text-xs text-slate-500 font-extrabold uppercase tracking-wider">
                📦 Order: <span className="text-slate-900">#{String(order._id).toUpperCase()}</span> • {new Date(order.createdAt).toLocaleString()}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                      <th className="py-3 px-4">Item</th>
                      <th className="py-3 px-4">Sold</th>
                      <th className="py-3 px-4">Return Qty</th>
                      <th className="py-3 px-4">Condition</th>
                      <th className="py-3 px-4">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                    {items.map((i, idx) => (
                      <tr key={String(i.productId)} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-extrabold text-slate-900">{i.name}</td>
                        <td className="py-3.5 px-4 text-slate-500">{i.soldQty}</td>
                        <td className="py-3.5 px-4">
                          <input
                            type="number"
                            min="0"
                            max={i.soldQty}
                            value={i.qty}
                            onChange={(e) => {
                              const v = Math.min(Number(e.target.value || 0), i.soldQty);
                              setItems((prev) => prev.map((p, j) => (j === idx ? { ...p, qty: v } : p)));
                            }}
                            className="w-24 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/35"
                          />
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={i.condition}
                            onChange={(e) => setItems((prev) => prev.map((p, j) => (j === idx ? { ...p, condition: e.target.value } : p)))}
                            className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold bg-white text-slate-700 focus:outline-none cursor-pointer"
                          >
                            <option value="good">Not damaged</option>
                            <option value="damaged">Damaged</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4">
                          <input
                            value={i.reason}
                            onChange={(e) => setItems((prev) => prev.map((p, j) => (j === idx ? { ...p, reason: e.target.value } : p)))}
                            className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/35"
                            placeholder="e.g. expired / wrong item"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Notes (optional)</label>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-slate-200 rounded-2xl py-3.5 px-4 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/35"
                  placeholder="Add additional return notes..."
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={submitting || !canSubmit}
                  className="bg-gradient-to-r from-brand-indigo to-brand-violet hover:opacity-95 text-white font-black text-[10px] uppercase tracking-wider px-7 py-3.5 rounded-2xl transition-all shadow-[0_4px_12px_rgba(99,102,241,0.2)] hover:scale-[1.02] active:scale-95 border-0 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Return Request'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* History */}
        <div className="glass-card rounded-[2rem] p-6 shadow-sm border border-slate-200/60">
          <h2 className="text-base font-black text-slate-900 m-0 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <ClipboardList size={16} /> Recent Return Requests
          </h2>
          <div className="space-y-3">
            {history.slice(0, 10).map((r) => (
              <div key={r._id} className="flex items-center justify-between p-4 rounded-2xl bg-white/40 border border-slate-200/60">
                <div className="text-xs">
                  <div className="font-extrabold text-slate-900">{r.holdBillNo || `RET-${String(r._id).toUpperCase()}`}</div>
                  <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wide">Order #{String(r.orderId?._id || r.orderId).toUpperCase()} • {new Date(r.createdAt).toLocaleDateString()}</div>
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-50 border border-amber-250 text-amber-700">{r.status}</span>
              </div>
            ))}
            {history.length === 0 && <div className="text-center py-8 text-slate-400 font-semibold text-xs">No recent return requests</div>}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeReturns;
