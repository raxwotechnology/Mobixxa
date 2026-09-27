'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { adminNavGroups as navItems } from './adminNavItems';
import { toast } from 'react-toastify';
import { approveCustomerReturn, createCustomerReturn, deleteCustomerReturn, exportCustomerReturnsReport, getCustomerReturns, getReturnOrder, rejectCustomerReturn, getAccounts } from '../../services/api';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import useAuthStore from '../../store/authStore';
import { managerNavGroups } from '../storeOwner/managerNavItems';
import { RotateCcw, Search, AlertTriangle, CheckCircle, Package, XCircle } from 'lucide-react';

const statusColors = {
  requested: 'ds-badge-amber',
  on_hold: 'ds-badge-blue',
  approved: 'ds-badge-green',
  resolved: 'ds-badge-green',
  rejected: 'ds-badge-red',
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
  const [accounts, setAccounts] = useState([]);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundMethod, setRefundMethod] = useState('Cash');
  const [refundAccountId, setRefundAccountId] = useState('');

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
  useEffect(() => { getAccounts().then(res => setAccounts(res.data || [])).catch(() => setAccounts([])); }, []);

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
    const totalReturnValue = (ret.items || []).reduce((sum, it) => sum + (it.unitPrice * it.qty), 0);
    setRefundAmount(totalReturnValue ? String(totalReturnValue) : '');
    setRefundMethod('Cash');
    setRefundAccountId('');
  };

  const openRejectModal = (ret) => {
    setActiveReturn(ret);
    setModalType('reject');
    setRejectReason('Rejected by admin');
  };

  const submitApprove = async () => {
    if (!activeReturn) return;
    if (resolution === 'refund' && (!refundAmount || Number(refundAmount) <= 0 || !refundAccountId)) {
      toast.error('Enter a refund amount and select which account it comes from');
      return;
    }
    setSubmitting(true);
    try {
      await approveCustomerReturn(activeReturn._id, {
        resolution,
        markResolved: true,
        ...(resolution === 'refund' ? {
          refundAmount: Number(refundAmount),
          refundMethod,
          refundAccountId,
        } : {}),
      });
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

  // Compute stats
  const totalReturns = returns.length;
  const pendingReturns = returns.filter(r => r.status === 'requested').length;
  const approvedReturns = returns.filter(r => r.status === 'approved' || r.status === 'resolved').length;
  const rejectedReturns = returns.filter(r => r.status === 'rejected').length;

  return (
    <DashboardLayout navItems={navItemsToUse} title="Returns">
      <div className="ds-page">
        <div className="ds-page-header">
          <div className="ds-page-header-left">
            <div className="ds-page-header-icon">
              <RotateCcw size={20} strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="ds-page-title">Returns &amp; Refunds</h1>
              <p className="ds-page-subtitle">Pending / Approved / Rejected return requests</p>
            </div>
          </div>
          <div className="ds-page-header-right flex gap-2 items-center flex-wrap">
             <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="ds-input py-1.5 px-3 text-xs w-auto" />
             <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="ds-input py-1.5 px-3 text-xs w-auto" />
             <button onClick={handleExport} className="ds-btn ds-btn-secondary">Export PDF</button>
          </div>
        </div>

        <div className="ds-stats ds-stats-4">
          <div className="ds-stat">
            <div className="ds-stat-top">
              <div className="ds-stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                <Package size={18} />
              </div>
              <span className="ds-stat-change pos">Tickets</span>
            </div>
            <div className="ds-stat-bottom">
              <p className="ds-stat-label">Total Returns</p>
              <p className="ds-stat-value">{totalReturns}</p>
              <p className="ds-stat-sub">All RMA cases</p>
            </div>
          </div>

          <div className="ds-stat" style={{ borderColor: pendingReturns > 0 ? '#fde68a' : undefined }}>
            <div className="ds-stat-top">
              <div className="ds-stat-icon" style={{ background: '#fffbeb', color: '#b45309' }}>
                <AlertTriangle size={18} />
              </div>
              <span className="ds-stat-change amber">Review</span>
            </div>
            <div className="ds-stat-bottom">
              <p className="ds-stat-label" style={{ color: '#b45309' }}>Pending Approval</p>
              <p className="ds-stat-value" style={{ color: '#b45309' }}>{pendingReturns}</p>
              <p className="ds-stat-sub" style={{ color: '#d97706' }}>Awaiting inspection</p>
            </div>
          </div>

          <div className="ds-stat">
            <div className="ds-stat-top">
              <div className="ds-stat-icon" style={{ background: '#f0fdf4', color: '#15803d' }}>
                <CheckCircle size={18} />
              </div>
              <span className="ds-stat-change up">Settled</span>
            </div>
            <div className="ds-stat-bottom">
              <p className="ds-stat-label">Approved &amp; Resolved</p>
              <p className="ds-stat-value text-emerald-600">{approvedReturns}</p>
              <p className="ds-stat-sub">Restocked or refunded</p>
            </div>
          </div>

          <div className="ds-stat">
            <div className="ds-stat-top">
              <div className="ds-stat-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
                <XCircle size={18} />
              </div>
              <span className="ds-stat-change neg">Declined</span>
            </div>
            <div className="ds-stat-bottom">
              <p className="ds-stat-label">Rejected</p>
              <p className="ds-stat-value text-rose-600">{rejectedReturns}</p>
              <p className="ds-stat-sub">Disallowed claims</p>
            </div>
          </div>
        </div>

        <div className="ds-card">
          <div className="ds-card-header">
            <h2 className="ds-card-title">Search Order & Create Return Request</h2>
          </div>
          <div className="ds-card-body">
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '16px' }}>
              <div className="ds-form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="ds-label">Order ID / Invoice Number *</label>
                <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="Enter Order ID or Invoice No..." className="ds-input" />
              </div>
              <button onClick={lookupOrder} disabled={loadingOrder} className="ds-btn ds-btn-primary">
                {loadingOrder ? 'Searching...' : 'Lookup Order'}
              </button>
            </div>

            {order && (
              <form onSubmit={submitReturn} style={{ borderTop: '1px solid var(--ds-border-soft)', paddingTop: '16px' }}>
                <div style={{ padding: '12px', backgroundColor: 'var(--ds-border-soft)', borderRadius: 'var(--ds-r-md)', marginBottom: '16px' }}>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>Order Summary: #{String(order._id).slice(-8).toUpperCase()}</p>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--ds-text-muted)' }}>Customer: {order.customerName || order.userId?.name || 'Walk-in'}</p>
                </div>

                <div className="ds-form-group">
                  <label className="ds-label">Select Items to Return</label>
                  {items.map((it, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ flex: 1, fontWeight: 'bold' }}>{it.name} <span style={{ color: 'var(--ds-text-muted)' }}>(Sold: {it.soldQty})</span></div>
                      <input type="number" min="0" max={it.soldQty} value={it.qty} onChange={(e) => { const next = [...items]; next[idx].qty = e.target.value; setItems(next); }} className="ds-input" placeholder="Qty" style={{ width: '80px' }} />
                      <select value={it.condition} onChange={(e) => { const next = [...items]; next[idx].condition = e.target.value; setItems(next); }} className="ds-select" style={{ width: 'auto' }}>
                        <option value="good">Good Condition</option>
                        <option value="damaged">Damaged</option>
                        <option value="defective">Defective</option>
                      </select>
                      <input type="text" value={it.reason} onChange={(e) => { const next = [...items]; next[idx].reason = e.target.value; setItems(next); }} placeholder="Reason..." className="ds-input" style={{ flex: 1 }} />
                    </div>
                  ))}
                </div>

                <div className="ds-form-group">
                  <label className="ds-label">Additional Notes</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add any extra details..." className="ds-input" rows={2} style={{ resize: 'none' }} />
                </div>

                <button type="submit" disabled={createSubmitting} className="ds-btn ds-btn-primary" style={{ backgroundColor: '#059669', borderColor: '#059669' }}>
                  {createSubmitting ? 'Submitting...' : 'Submit Return Request'}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="ds-card">
          <div className="ds-filter-bar" style={{ padding: '16px' }}>
             <select className="ds-select" style={{ width: 'auto' }} value={filter} onChange={(e) => setFilter(e.target.value)}>
                {['all', 'requested', 'approved', 'rejected', 'on_hold', 'resolved'].map((s) => (
                  <option key={s} value={s}>{s.replaceAll('_', ' ').toUpperCase()}</option>
                ))}
             </select>
          </div>
        </div>

        {loading ? (
          <div className="ds-loading"><div className="ds-spinner" /></div>
        ) : (
          <div className="ds-card">
            <div className="ds-card-body" style={{ padding: 0 }}>
              <div className="ds-table-wrap">
                <table className="ds-table">
                  <thead>
                    <tr>
                      <th>RMA</th>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Order Details</th>
                      <th>Return Reason</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7}>
                          <div className="ds-empty">No returns found</div>
                        </td>
                      </tr>
                    ) : (
                      filtered.map((r) => (
                        <tr key={r._id}>
                          <td style={{ fontWeight: 'bold' }}>{r.holdBillNo}</td>
                          <td style={{ fontFamily: 'monospace' }}>#{String(r.orderId?._id || r.orderId).slice(-8).toUpperCase()}</td>
                          <td>{r.customerId?.name || '—'}</td>
                          <td>{(r.items || []).map((it) => `${it.orderItemName} x${it.qty}`).join(', ') || '—'}</td>
                          <td>{(r.items || []).map((it) => it.reason).filter(Boolean).join(', ') || r.notes || '—'}</td>
                          <td>
                            <span className={`ds-badge ${statusColors[r.status] || 'ds-badge-slate'}`}>
                              {r.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {['requested', 'approved', 'on_hold'].includes(r.status) && (
                                <>
                                  <button type="button" onClick={() => openApproveModal(r)} className="ds-btn ds-btn-sm" style={{ backgroundColor: '#ecfdf5', color: '#059669', border: 'none' }}>
                                    Approve
                                  </button>
                                  <button type="button" onClick={() => openRejectModal(r)} className="ds-btn ds-btn-sm" style={{ backgroundColor: '#fff1f2', color: '#e11d48', border: 'none' }}>
                                    Reject
                                  </button>
                                </>
                              )}
                              <button type="button" onClick={() => openDeleteModal(r)} className="ds-btn ds-btn-danger ds-btn-sm">
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Approve Resolution Modal */}
      {modalType === 'approve' && activeReturn && (
        <div className="ds-modal-overlay" onClick={() => { setActiveReturn(null); setModalType(''); }}>
          <div className="ds-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ds-modal-header" style={{ flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <CheckCircle color="#10b981" />
              </div>
              <h3 className="ds-modal-title">Approve Return Request</h3>
              <p style={{ margin: '8px 0 0 0', color: 'var(--ds-text-muted)', fontSize: '0.85em', textTransform: 'uppercase' }}>
                Resolution for <span style={{ color: 'var(--ds-text-head)' }}>{activeReturn.holdBillNo}</span> ({activeReturn.customerId?.name || 'Customer'})
              </p>
            </div>

            <div className="ds-modal-body">
              <div className="ds-form-group">
                <label className="ds-label">Resolution Method</label>
                <select value={resolution} onChange={(e) => setResolution(e.target.value)} className="ds-select">
                  <option value="exchange">Exchange Product (Default)</option>
                  <option value="store_credit">Store Credit</option>
                  <option value="upgrade">Upgrade Product</option>
                  <option value="refund">Refund Money Back</option>
                </select>
              </div>

              {resolution === 'refund' && (
                <div style={{ padding: '16px', border: '1px solid var(--ds-border)', borderRadius: 'var(--ds-r-md)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="ds-form-group" style={{ marginBottom: 0 }}>
                    <label className="ds-label">Refund Amount (Rs.)</label>
                    <input type="number" min="0" step="0.01" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} className="ds-input" />
                  </div>
                  <div className="ds-form-group" style={{ marginBottom: 0 }}>
                    <label className="ds-label">Refund Method</label>
                    <select value={refundMethod} onChange={(e) => setRefundMethod(e.target.value)} className="ds-select">
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Card">Card</option>
                    </select>
                  </div>
                  <div className="ds-form-group" style={{ marginBottom: 0 }}>
                    <label className="ds-label">Refund From Account</label>
                    <select value={refundAccountId} onChange={(e) => setRefundAccountId(e.target.value)} className="ds-select">
                      <option value="">Select account...</option>
                      {accounts.map(a => <option key={a._id} value={a._id}>{a.name} ({a.type})</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="ds-modal-footer">
              <button type="button" disabled={submitting} onClick={() => { setActiveReturn(null); setModalType(''); }} className="ds-btn ds-btn-secondary">
                Cancel
              </button>
              <button type="button" disabled={submitting} onClick={submitApprove} className="ds-btn ds-btn-primary">
                {submitting ? 'Approving...' : 'Approve Return'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {modalType === 'reject' && activeReturn && (
        <div className="ds-modal-overlay" onClick={() => { setActiveReturn(null); setModalType(''); }}>
          <div className="ds-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ds-modal-header" style={{ flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                 <AlertTriangle color="#e11d48" />
              </div>
              <h3 className="ds-modal-title">Reject Return Request</h3>
              <p style={{ margin: '8px 0 0 0', color: 'var(--ds-text-muted)', fontSize: '0.85em', textTransform: 'uppercase' }}>
                Reason for rejecting <span style={{ color: 'var(--ds-text-head)' }}>{activeReturn.holdBillNo}</span>
              </p>
            </div>

            <div className="ds-modal-body">
              <div className="ds-form-group">
                <label className="ds-label">Rejection Reason</label>
                <textarea required rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Provide a clear reason..." className="ds-input" style={{ resize: 'none' }} />
              </div>
            </div>

            <div className="ds-modal-footer">
              <button type="button" disabled={submitting} onClick={() => { setActiveReturn(null); setModalType(''); }} className="ds-btn ds-btn-secondary">
                Cancel
              </button>
              <button type="button" disabled={submitting} onClick={submitReject} className="ds-btn ds-btn-danger">
                {submitting ? 'Rejecting...' : 'Confirm Reject'}
              </button>
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
