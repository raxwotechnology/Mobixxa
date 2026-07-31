import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { managerNavGroups as navItems } from './managerNavItems';
import { toast } from 'react-toastify';
import { createCustomerReturn, getCustomerReturns, getReturnOrder, managerApproveCustomerReturn, managerRejectCustomerReturn } from '../../services/api';

const ManagerReturns = () => {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [returns, setReturns] = useState([]);
  const [savingId, setSavingId] = useState(null);
  const [activeStatus, setActiveStatus] = useState('all');

  const fetchReturns = async () => {
    try {
      const { data } = await getCustomerReturns({});
      setReturns(data || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchReturns();
    const id = setInterval(fetchReturns, 15000);
    return () => clearInterval(id);
  }, []);

  const visibleReturns = activeStatus === 'all'
    ? returns
    : returns.filter((r) => r.status === activeStatus);

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

  const submitReturn = async (e) => {
    e.preventDefault();
    if (!order?._id) {
      toast.error('Lookup an order first');
      return;
    }
    const payloadItems = items
      .filter((i) => Number(i.qty) > 0)
      .map((i) => ({ productId: i.productId, qty: Number(i.qty), condition: i.condition, reason: i.reason }));
    if (payloadItems.length === 0) {
      toast.error('Select at least one item to return');
      return;
    }
    setSubmitting(true);
    try {
      await createCustomerReturn({ orderId: order._id, items: payloadItems, notes });
      toast.success('Return request submitted');
      setOrderId('');
      setOrder(null);
      setItems([]);
      setNotes('');
      fetchReturns();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit return');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout navItems={navItems} title="Manager Dashboard">
      <div className="animate-fade-in space-y-6">
        {/* Operations Control Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white/40 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-indigo/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-brand-indigo/10 flex items-center justify-center text-brand-indigo">
                <RotateCcw size={20} strokeWidth={2.5} />
              </div>
              <h1 className="text-2xl font-black text-slate-900 m-0">Customer Returns</h1>
            </div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-2 m-0">Create return requests and track their status</p>
          </div>
        </div>

        {/* Lookup Card */}
        <div className="glass-card rounded-[2rem] p-6">
          <h2 className="text-sm font-black text-slate-800 mb-4 uppercase tracking-wider">Search Order</h2>
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Order ID *</label>
              <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="Enter order ID..." className="w-full border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-transparent transition-all" />
            </div>
            <button onClick={lookupOrder} disabled={loadingOrder} className="bg-slate-900 hover:bg-slate-800 text-white font-black px-6 py-2.5 rounded-xl text-[10px] uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50 cursor-pointer">
              {loadingOrder ? 'Loading...' : 'Lookup'}
            </button>
          </div>

          {order && (
            <form onSubmit={submitReturn} className="mt-6 pt-6 border-t border-slate-100 space-y-4">
              <div className="text-xs text-slate-400 font-extrabold uppercase tracking-wider">
                <span className="text-slate-800">Order</span> #{String(order._id).slice(-8).toUpperCase()} • {new Date(order.createdAt).toLocaleString()}
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-5 py-3 text-[10px] uppercase font-black tracking-wider text-slate-500">Item</th>
                      <th className="text-left px-5 py-3 text-[10px] uppercase font-black tracking-wider text-slate-500">Sold</th>
                      <th className="text-left px-5 py-3 text-[10px] uppercase font-black tracking-wider text-slate-500">Return Qty</th>
                      <th className="text-left px-5 py-3 text-[10px] uppercase font-black tracking-wider text-slate-500">Condition</th>
                      <th className="text-left px-5 py-3 text-[10px] uppercase font-black tracking-wider text-slate-500">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((i, idx) => (
                      <tr key={String(i.productId)} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-slate-800">{i.name}</td>
                        <td className="px-5 py-3.5 text-slate-400 font-extrabold">{i.soldQty}</td>
                        <td className="px-5 py-3.5">
                          <input
                            type="number"
                            min="0"
                            max={i.soldQty}
                            value={i.qty}
                            onChange={(e) => {
                              const v = Math.min(Number(e.target.value || 0), i.soldQty);
                              setItems((prev) => prev.map((p, j) => (j === idx ? { ...p, qty: v } : p)));
                            }}
                            className="w-24 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-transparent transition-all"
                          />
                        </td>
                        <td className="px-5 py-3.5">
                          <select value={i.condition} onChange={(e) => setItems((prev) => prev.map((p, j) => (j === idx ? { ...p, condition: e.target.value } : p)))} className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-transparent transition-all cursor-pointer">
                            <option value="good">Not damaged</option>
                            <option value="damaged">Damaged</option>
                          </select>
                        </td>
                        <td className="px-5 py-3.5">
                          <input value={i.reason} placeholder="Reason..." onChange={(e) => setItems((prev) => prev.map((p, j) => (j === idx ? { ...p, reason: e.target.value } : p)))} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-transparent transition-all" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Notes (optional)</label>
                <input value={notes} placeholder="Additional details..." onChange={(e) => setNotes(e.target.value)} className="w-full border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-transparent transition-all" />
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={submitting} className="bg-brand-indigo hover:bg-brand-violet text-white font-black px-6 py-3 rounded-xl text-[10px] uppercase tracking-wider transition-all shadow-md disabled:opacity-50 cursor-pointer">
                  {submitting ? 'Submitting...' : 'Submit Return Request'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Requests Table */}
        <div className="glass-card rounded-[2rem] p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
            <h2 className="text-sm font-black text-slate-800 m-0 uppercase tracking-wider">Return Requests</h2>
            <div className="flex items-center gap-2 flex-wrap">
              {['all', 'requested', 'approved', 'on_hold', 'rejected', 'resolved'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setActiveStatus(s)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    activeStatus === s
                      ? 'bg-brand-indigo text-white shadow-sm'
                      : 'bg-slate-100 text-slate-550 hover:bg-slate-200'
                  }`}
                >
                  {s.replaceAll('_', ' ')}
                </button>
              ))}
              <button
                type="button"
                onClick={fetchReturns}
                className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-150 text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                Refresh
              </button>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-5 py-3 text-[10px] uppercase font-black tracking-wider text-slate-500">RMA</th>
                    <th className="text-left px-5 py-3 text-[10px] uppercase font-black tracking-wider text-slate-500">Order</th>
                    <th className="text-left px-5 py-3 text-[10px] uppercase font-black tracking-wider text-slate-500">Customer</th>
                    <th className="text-left px-5 py-3 text-[10px] uppercase font-black tracking-wider text-slate-500">Status</th>
                    <th className="text-left px-5 py-3 text-[10px] uppercase font-black tracking-wider text-slate-500">Date</th>
                    <th className="text-right px-5 py-3 text-[10px] uppercase font-black tracking-wider text-slate-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleReturns.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-700">{r.holdBillNo}</td>
                      <td className="px-5 py-3.5 font-mono text-slate-500 font-bold">#{String(r.orderId?._id || r.orderId).slice(-8).toUpperCase()}</td>
                      <td className="px-5 py-3.5 text-slate-800 font-black">{r.customerId?.name || '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                          r.status === 'approved' || r.status === 'resolved' ? 'bg-teal-50 text-teal-700 border-teal-100/60' :
                          r.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-100/60' :
                          r.status === 'on_hold' ? 'bg-amber-50 text-amber-700 border-amber-100/60' :
                          'bg-blue-50 text-blue-700 border-blue-100/60'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-450 font-bold">{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-3.5 text-right">
                        {r.status === 'requested' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={async () => {
                                setSavingId(r._id);
                                try {
                                  await managerApproveCustomerReturn(r._id, {});
                                  toast.success('Return approved');
                                  fetchReturns();
                                } catch (err) {
                                  toast.error(err.response?.data?.message || 'Failed to approve');
                                } finally {
                                  setSavingId(null);
                                }
                              }}
                              disabled={savingId === r._id}
                              className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-teal-50 border border-teal-100/60 text-teal-750 hover:bg-teal-100 disabled:opacity-50 cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={async () => {
                                const reason = prompt('Rejection reason:');
                                if (!reason) return;
                                setSavingId(r._id);
                                try {
                                  await managerRejectCustomerReturn(r._id, { reason });
                                  toast.success('Return rejected');
                                  fetchReturns();
                                } catch (err) {
                                  toast.error(err.response?.data?.message || 'Failed to reject');
                                } finally {
                                  setSavingId(null);
                                }
                              }}
                              disabled={savingId === r._id}
                              className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-rose-50 border border-rose-100/60 text-rose-600 hover:bg-rose-100 disabled:opacity-50 cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-bold">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {visibleReturns.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                        <RotateCcw size={32} className="mx-auto mb-2 text-slate-300 animate-pulse" />
                        <p className="text-xs font-black uppercase tracking-wider">No returns yet</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ManagerReturns;
