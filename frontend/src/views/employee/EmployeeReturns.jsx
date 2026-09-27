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
      <div className="ds-page">
        {/* Header Block */}
        <div className="ds-page-header">
          <div>
            <h1 className="ds-page-title">Customer Returns</h1>
            <p className="ds-page-subtitle">Initiate and document return claims for client purchases</p>
          </div>
        </div>

        {/* Lookup Card */}
        <div className="ds-card">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Search Order By ID *</label>
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="ds-input pl-9 text-xs"
                  placeholder="Paste order id here..."
                />
              </div>
            </div>
            <button
              onClick={lookupOrder}
              disabled={loadingOrder}
              className="ds-btn ds-btn-primary text-xs uppercase py-2.5 px-6 whitespace-nowrap cursor-pointer disabled:opacity-50 shrink-0"
            >
              {loadingOrder ? 'Searching...' : 'Lookup Order'}
            </button>
          </div>

          {order && (
            <form onSubmit={submitReturn} className="mt-6 space-y-5 pt-5 border-t border-slate-100">
              <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                 Order: <span className="text-slate-900 font-mono font-bold">#{String(order._id).toUpperCase()}</span> • {new Date(order.createdAt).toLocaleString()}
              </div>

              <div className="ds-table-wrap">
                <table className="ds-table">
                  <thead>
                    <tr>
                      <th className="text-left">Item</th>
                      <th className="text-left">Sold</th>
                      <th className="text-left">Return Qty</th>
                      <th className="text-left">Condition</th>
                      <th className="text-left">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((i, idx) => (
                      <tr key={String(i.productId)}>
                        <td className="font-semibold text-slate-900">{i.name}</td>
                        <td className="text-slate-500 font-medium">{i.soldQty}</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max={i.soldQty}
                            value={i.qty}
                            onChange={(e) => {
                              const v = Math.min(Number(e.target.value || 0), i.soldQty);
                              setItems((prev) => prev.map((p, j) => (j === idx ? { ...p, qty: v } : p)));
                            }}
                            className="ds-input w-24 py-1.5 px-2 text-xs"
                          />
                        </td>
                        <td>
                          <select
                            value={i.condition}
                            onChange={(e) => setItems((prev) => prev.map((p, j) => (j === idx ? { ...p, condition: e.target.value } : p)))}
                            className="ds-input py-1.5 px-2 text-xs cursor-pointer"
                          >
                            <option value="good">Not damaged</option>
                            <option value="damaged">Damaged</option>
                          </select>
                        </td>
                        <td>
                          <input
                            value={i.reason}
                            onChange={(e) => setItems((prev) => prev.map((p, j) => (j === idx ? { ...p, reason: e.target.value } : p)))}
                            className="ds-input py-1.5 px-3 text-xs"
                            placeholder="e.g. expired / wrong item"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="ds-form-group">
                <label className="ds-label">Notes (optional)</label>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="ds-input text-xs"
                  placeholder="Add additional return notes..."
                />
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={submitting || !canSubmit}
                  className="ds-btn ds-btn-primary text-xs uppercase py-2.5 px-6 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Return Request'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* History */}
        <div className="ds-card">
          <h2 className="text-sm font-semibold text-slate-900 m-0 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <ClipboardList size={16} className="text-blue-600" /> Recent Return Requests
          </h2>
          <div className="space-y-2.5">
            {history.slice(0, 10).map((r) => (
              <div key={r._id} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50">
                <div>
                  <div className="font-semibold text-slate-900 text-xs">{r.holdBillNo || `RET-${String(r._id).toUpperCase()}`}</div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">Order #{String(r.orderId?._id || r.orderId).toUpperCase()} • {new Date(r.createdAt).toLocaleDateString()}</div>
                </div>
                <span className="ds-badge-amber text-xs">{r.status}</span>
              </div>
            ))}
            {history.length === 0 && <div className="text-center py-6 text-slate-400 font-medium text-xs">No recent return requests</div>}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeReturns;
