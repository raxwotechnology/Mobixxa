'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { adminNavGroups as navItems } from './adminNavItems';
import { toast } from 'react-toastify';
import { approveCustomerReturn, createCustomerReturn, deleteCustomerReturn, exportCustomerReturnsReport, getCustomerReturns, getReturnOrder, rejectCustomerReturn } from '../../services/api';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import useAuthStore from '../../store/authStore';
import { managerNavGroups } from '../storeOwner/managerNavItems';
import { RotateCcw, Search } from 'lucide-react';

const statusColors = {
  requested: 'bg-amber-100 text-amber-700',
  on_hold: 'bg-blue-100 text-blue-700',
  approved: 'bg-emerald-100 text-emerald-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
};

const AdminReturns = () => {
  const { user } = useAuthStore();
  const navItemsToUse = user?.role === 'manager' ? managerNavGroups : navItems;

  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Return Creation States
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState('');

  // Custom Modal States
  const [activeReturn, setActiveReturn] = useState(null);
  const [modalType, setModalType] = useState(''); // 'approve' or 'reject'
  const [resolution, setResolution] = useState('exchange');
  const [rejectReason, setRejectReason] = useState('Rejected by admin');
  const [submitting, setSubmitting] = useState(false);

  // Delete States
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [returnToDelete, setReturnToDelete] = useState(null);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const { data } = await getCustomerReturns({});
      setReturns(data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load returns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReturns(); }, []);

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
    setCreateSubmitting(true);
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
      setCreateSubmitting(false);
    }
  };

  const filtered = useMemo(
    () => (filter === 'all' ? returns : returns.filter((r) => r.status === filter)),
    [returns, filter]
  );

  const openApproveModal = (ret) => {
    setActiveReturn(ret);
    setModalType('approve');
    setResolution('exchange');
  };

  const openRejectModal = (ret) => {
    setActiveReturn(ret);
    setModalType('reject');
    setRejectReason('Rejected by admin');
  };

  const submitApprove = async () => {
    if (!activeReturn) return;
    setSubmitting(true);
    try {
      await approveCustomerReturn(activeReturn._id, { resolution, markResolved: true });
      toast.success('Return approved by admin');
      setActiveReturn(null);
      setModalType('');
      fetchReturns();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve return');
    } finally {
      setSubmitting(false);
    }
  };

  const submitReject = async () => {
    if (!activeReturn) return;
    if (!rejectReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }
    setSubmitting(true);
    try {
      await rejectCustomerReturn(activeReturn._id, { reason: rejectReason.trim() });
      toast.success('Return rejected by admin');
      setActiveReturn(null);
      setModalType('');
      fetchReturns();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject return');
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (ret) => {
    setReturnToDelete(ret);
    setShowDeleteConfirm(true);
  };

  const submitDelete = async () => {
    if (!returnToDelete) return;
    setSubmitting(true);
    try {
      await deleteCustomerReturn(returnToDelete._id);
      toast.success('Return request deleted');
      setReturnToDelete(null);
      setShowDeleteConfirm(false);
      fetchReturns();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete return request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = async () => {
    try {
      const { data } = await exportCustomerReturnsReport({ startDate, endDate, status: filter !== 'all' ? filter : undefined });
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'customer-returns-report.pdf';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Return report exported');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to export return report');
    }
  };

  return (
    <DashboardLayout navItems={navItemsToUse} title="Returns">
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white/40 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-indigo/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="inline-flex items-center gap-1.5 bg-brand-indigo/10 text-brand-indigo text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border border-brand-indigo/15">
                Sales & Operations
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-slate-900 m-0">Customer Returns</h1>
            <p className="text-[10px] font-normal uppercase tracking-wider text-slate-500 mt-2 m-0">Pending / Approved / Rejected return requests</p>
          </div>
          <div className="flex items-center gap-3 bg-white/40 backdrop-blur-sm border border-white/40 p-2 rounded-2xl shadow-sm">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-white/80 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm" />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-white/80 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm" />
            <button onClick={handleExport} className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[10px] uppercase tracking-wider font-black transition-all shadow-md">Export PDF</button>
          </div>
        </div>

        {/* Order Search & Return Request Creation */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <h2 className="text-sm font-black text-slate-800 mb-4 uppercase tracking-wider">Search Order & Create Return Request</h2>
          <div className="flex flex-col sm:flex-row gap-3 items-end mb-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Order ID / Invoice Number *</label>
              <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="Enter Order ID or Invoice No..." className="w-full border border-slate-200 rounded-2xl py-3 px-4 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-transparent transition-all" />
            </div>
            <button onClick={lookupOrder} disabled={loadingOrder} className="bg-brand-indigo hover:bg-brand-violet text-white font-extrabold px-6 py-3 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md shadow-brand-indigo/20 disabled:opacity-50 cursor-pointer">
              {loadingOrder ? 'Searching...' : 'Lookup Order'}
            </button>
          </div>

          {order && (
            <form onSubmit={submitReturn} className="space-y-4 pt-4 border-t border-slate-100">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs font-medium text-slate-700">
                <p className="font-extrabold text-slate-900 m-0">Order Summary: #{String(order._id).slice(-8).toUpperCase()}</p>
                <p className="m-0 text-slate-500 mt-1">Customer: {order.customerName || order.userId?.name || 'Walk-in'}</p>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Select Items to Return</label>
                {items.map((it, idx) => (
                  <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between text-xs">
                    <div className="font-bold text-slate-800 flex-1">{it.name} <span className="text-slate-400 font-medium">(Sold: {it.soldQty})</span></div>
                    <div className="flex gap-2 items-center w-full md:w-auto">
                      <input type="number" min="0" max={it.soldQty} value={it.qty} onChange={(e) => { const next = [...items]; next[idx].qty = e.target.value; setItems(next); }} className="w-20 border border-slate-200 rounded-xl p-2 font-bold text-center" placeholder="Qty" />
                      <select value={it.condition} onChange={(e) => { const next = [...items]; next[idx].condition = e.target.value; setItems(next); }} className="border border-slate-200 rounded-xl p-2 font-bold">
                        <option value="good">Good Condition</option>
                        <option value="damaged">Damaged</option>
                        <option value="defective">Defective</option>
                      </select>
                      <input type="text" value={it.reason} onChange={(e) => { const next = [...items]; next[idx].reason = e.target.value; setItems(next); }} placeholder="Reason..." className="border border-slate-200 rounded-xl p-2 flex-1 md:w-48 font-medium" />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Additional Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add any extra details..." className="w-full border border-slate-200 rounded-2xl p-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-indigo" rows={2} />
              </div>

              <button type="submit" disabled={createSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-3 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer">
                {createSubmitting ? 'Submitting...' : 'Submit Return Request'}
              </button>
            </form>
          )}
        </div>

        <div className="flex gap-2 flex-wrap mb-6 bg-white/40 backdrop-blur-sm p-2 rounded-2xl border border-white/40 shadow-sm w-fit">
          {['all', 'requested', 'approved', 'rejected', 'on_hold', 'resolved'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2.5 text-[10px] uppercase font-black tracking-wider rounded-xl transition-all ${
                filter === s ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-white hover:text-slate-900'
              }`}
            >
              {s.replaceAll('_', ' ')}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-brand-indigo border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-6 py-4 text-[10px] uppercase font-black tracking-wider text-slate-500">RMA</th>
                    <th className="text-left px-6 py-4 text-[10px] uppercase font-black tracking-wider text-slate-500">Order</th>
                    <th className="text-left px-6 py-4 text-[10px] uppercase font-black tracking-wider text-slate-500">Customer</th>
                    <th className="text-left px-6 py-4 text-[10px] uppercase font-black tracking-wider text-slate-500">Order Details</th>
                    <th className="text-left px-6 py-4 text-[10px] uppercase font-black tracking-wider text-slate-500">Return Reason</th>
                    <th className="text-left px-6 py-4 text-[10px] uppercase font-black tracking-wider text-slate-500">Status</th>
                    <th className="text-left px-6 py-4 text-[10px] uppercase font-black tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-black text-slate-800">{r.holdBillNo}</td>
                      <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">#{String(r.orderId?._id || r.orderId).slice(-8).toUpperCase()}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">{r.customerId?.name || '—'}</td>
                      <td className="px-6 py-4 font-bold text-slate-600">
                        {(r.items || []).map((it) => `${it.orderItemName} x${it.qty}`).join(', ') || '—'}
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {(r.items || []).map((it) => it.reason).filter(Boolean).join(', ') || r.notes || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[9px] uppercase tracking-wider font-black px-2.5 py-1 rounded-full ${statusColors[r.status] || 'bg-slate-100 text-slate-600'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {['requested', 'approved', 'on_hold'].includes(r.status) && (
                            <>
                              <button
                                type="button"
                                onClick={() => openApproveModal(r)}
                                className="px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wider font-black bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => openRejectModal(r)}
                                className="px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wider font-black bg-rose-50 text-rose-700 hover:bg-rose-100 transition-all"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => openDeleteModal(r)}
                            className="px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wider font-black bg-slate-100 text-rose-600 hover:bg-rose-50 transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center font-black text-[11px] uppercase tracking-wider text-slate-400">No returns found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Approve Resolution Modal */}
      {modalType === 'approve' && activeReturn && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => { setActiveReturn(null); setModalType(''); }}>
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col border border-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-6 border-b border-slate-100 flex flex-col items-center justify-center text-center bg-white/80 backdrop-blur-md">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4 text-xl border border-emerald-100 shadow-sm">
                ✓
              </div>
              <h3 className="font-black text-slate-900 text-xl">Approve Return Request</h3>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-2">
                Resolution for <span className="text-slate-800">{activeReturn.holdBillNo}</span> ({activeReturn.customerId?.name || 'Customer'})
              </p>
            </div>

            <div className="p-6 bg-slate-50/50">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">
                    Resolution Method
                  </label>
                  <select
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo font-bold text-slate-800 transition-all shadow-sm cursor-pointer"
                  >
                    <option value="exchange">Exchange Product (Default)</option>
                    <option value="store_credit">Store Credit</option>
                    <option value="upgrade">Upgrade Product</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-center pt-8">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => { setActiveReturn(null); setModalType(''); }}
                  className="flex-1 py-3 rounded-xl bg-slate-100 text-[10px] uppercase tracking-wider font-black hover:bg-slate-200 text-slate-700 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={submitApprove}
                  className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[10px] uppercase tracking-wider font-black shadow-lg shadow-slate-900/20 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Approving...' : 'Approve Return'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {modalType === 'reject' && activeReturn && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => { setActiveReturn(null); setModalType(''); }}>
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col border border-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-6 border-b border-slate-100 flex flex-col items-center justify-center text-center bg-white/80 backdrop-blur-md">
              <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-4 text-xl border border-rose-100 shadow-sm">
                ✕
              </div>
              <h3 className="font-black text-slate-900 text-xl">Reject Return Request</h3>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-2">
                Reason for rejecting <span className="text-slate-800">{activeReturn.holdBillNo}</span>
              </p>
            </div>

            <div className="p-6 bg-slate-50/50">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">
                    Rejection Reason
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Provide a clear reason..."
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-bold text-slate-800 transition-all shadow-sm resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-center pt-8">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => { setActiveReturn(null); setModalType(''); }}
                  className="flex-1 py-3 rounded-xl bg-slate-100 text-[10px] uppercase tracking-wider font-black hover:bg-slate-200 text-slate-700 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={submitReject}
                  className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[10px] uppercase tracking-wider font-black shadow-lg shadow-rose-500/20 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Rejecting...' : 'Confirm Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setReturnToDelete(null); }}
        onConfirm={submitDelete}
        itemName={returnToDelete?.holdBillNo}
      />
    </DashboardLayout>
  );
};

export default AdminReturns;

