'use client';

import { useState, useEffect } from 'react';
import { Link } from '../utils/navigation';
import { Package, ChevronRight, ShoppingBag, XCircle, Download, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { createCustomerReturn, getMyOrders, cancelMyOrder } from '../services/api';
import useAuthStore from '../store/authStore';
import useCurrencyStore from '../store/currencyStore';
import { toast } from 'react-toastify';
import { getImageUrl, handleImageError } from '../utils/imageHelper';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestingFor, setRequestingFor] = useState(null);
  const [returnForm, setReturnForm] = useState({
    productId: '',
    qty: 1,
    condition: 'good',
    reason: 'damaged_item',
    note: '',
  });
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState(null);
  const { user } = useAuthStore();
  const { convertPrice, formatPrice } = useCurrencyStore();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data } = await getMyOrders();
      setOrders(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const statusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'confirmed': return 'bg-blue-100 text-blue-700';
      case 'packed': return 'bg-indigo-100 text-indigo-700';
      case 'shipped': return 'bg-purple-100 text-purple-700';
      case 'out_for_delivery': return 'bg-orange-100 text-orange-700';
      case 'delivered': return 'bg-emerald-100 text-emerald-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const isCancellable = (order) => {
    if (['cancelled', 'shipped', 'out_for_delivery', 'delivered', 'completed'].includes(order.orderStatus)) return false;
    const hours = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60);
    return hours <= 1;
  };

  const getCancelTimeLeft = (order) => {
    const elapsed = Date.now() - new Date(order.createdAt).getTime();
    const remaining = (60 * 60 * 1000) - elapsed;
    if (remaining <= 0) return null;
    const mins = Math.floor(remaining / 60000);
    return `${mins}m left`;
  };

  const confirmCancelOrder = async () => {
    if (!cancelOrderId) return;
    try {
      await cancelMyOrder(cancelOrderId, { reason: 'Cancelled by customer' });
      toast.success('Your order has been cancelled successfully!');
      setCancelOrderId(null);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    }
  };

  const downloadBill = (order) => {
    const lines = [
      '═══════════════════════════════════════',
      '         SR MOBILE MOBIXXA',
      '          PURCHASE RECEIPT',
      '═══════════════════════════════════════',
      '',
      `Order ID: #${order._id.slice(-8).toUpperCase()}`,
      `Date: ${new Date(order.createdAt).toLocaleString()}`,
      `Status: ${order.orderStatus.toUpperCase()}`,
      `Payment: ${order.paymentMethod?.toUpperCase() || 'N/A'}`,
      '',
      '───────────────────────────────────────',
      'ITEMS:',
      '───────────────────────────────────────',
    ];
    (order.items || []).forEach((item, i) => {
      lines.push(`${i + 1}. ${item.name}`);
      lines.push(`   Qty: ${item.quantity} × Rs. ${item.price?.toLocaleString()} = Rs. ${(item.price * item.quantity).toLocaleString()}`);
    });
    lines.push('───────────────────────────────────────');
    if (order.deliveryFee) lines.push(`Delivery Fee:    Rs. ${order.deliveryFee.toLocaleString()}`);
    if (order.tax) lines.push(`Tax:             Rs. ${order.tax.toLocaleString()}`);
    if (order.discountAmount) lines.push(`Discount:       -Rs. ${order.discountAmount.toLocaleString()}`);
    lines.push(`TOTAL:           Rs. ${order.totalAmount?.toLocaleString()}`);
    lines.push('');
    if (order.deliveryAddress) {
      lines.push(`Delivery: ${order.deliveryAddress.street}, ${order.deliveryAddress.city}`);
    }
    lines.push('');
    lines.push('═══════════════════════════════════════');
    lines.push('     Thank you for shopping with us!');
    lines.push('═══════════════════════════════════════');
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Mobixa_Receipt_${order._id.slice(-8).toUpperCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isReturnEligible = (order) => {
    if (!['delivered', 'completed'].includes(order.orderStatus)) return false;
    const deliveredAt = order.deliveredAt || order.completedAt || order.updatedAt || order.createdAt;
    const days = (Date.now() - new Date(deliveredAt).getTime()) / (1000 * 60 * 60 * 24);
    return days <= 7;
  };

  const openReturnModal = (order) => {
    const firstItem = order.items?.[0];
    if (!firstItem) return;
    setRequestingFor(order);
    setReturnForm({
      productId: firstItem.productId,
      qty: 1,
      condition: 'good',
      reason: 'damaged_item',
      note: '',
    });
  };

  const submitReturnRequest = async (e) => {
    e.preventDefault();
    if (!requestingFor) return;
    const selected = requestingFor.items.find((i) => String(i.productId) === String(returnForm.productId));
    if (!selected) {
      toast.error('Select a valid product');
      return;
    }
    const qty = Number(returnForm.qty || 0);
    if (qty <= 0 || qty > Number(selected.quantity || 0)) {
      toast.error('Invalid return quantity');
      return;
    }
    setSubmittingReturn(true);
    try {
      await createCustomerReturn({
        orderId: requestingFor._id,
        items: [{
          productId: selected.productId,
          qty,
          condition: returnForm.condition,
          reason: returnForm.reason,
        }],
        notes: returnForm.note,
      });
      toast.success('Return request submitted');
      setRequestingFor(null);
      const { data } = await getMyOrders();
      setOrders(data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit return request');
    } finally {
      setSubmittingReturn(false);
    }
  };

  if (!user) {
    return (
      <div className="base-container py-20 text-center">
        <Package size={48} className="text-slate-350 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2 mt-0">Sign In to View Orders</h2>
        <Link to="/login" className="text-brand-indigo font-bold hover:underline">Sign In</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="base-container py-10">
        <h1 className="text-2xl font-bold text-slate-800 mt-0 mb-8 border-b border-slate-100 pb-4">My Orders</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-slate-200/60 rounded-[2rem] p-6 animate-pulse">
              <div className="flex justify-between mb-4">
                <div className="h-5 bg-slate-100 rounded w-1/4" />
                <div className="h-5 bg-slate-100 rounded w-1/6" />
              </div>
              <div className="h-4 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="base-container py-20 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-[2rem] p-12 max-w-md mx-auto border border-slate-200/50 shadow-sm"
        >
          <div className="w-20 h-20 bg-brand-indigo/5 border border-brand-indigo/10 rounded-full mx-auto mb-6 flex items-center justify-center">
            <ShoppingBag size={32} className="text-brand-indigo" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2 mt-0">No Orders Yet</h2>
          <p className="text-slate-400 text-sm mb-6 font-medium">Looks like you haven't placed any orders.</p>
          <Link to="/shop" className="bg-gradient-to-r from-brand-indigo to-brand-violet hover:opacity-95 text-white text-xs font-bold py-3.5 px-8 rounded-xl transition-all shadow-[0_4px_12px_rgba(99,102,241,0.2)] inline-block cursor-pointer">
            Start Shopping
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="base-container py-10" style={{ maxWidth: '1000px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: 'var(--ds-text-xl)', fontWeight: 700, color: 'var(--ds-text-head)', margin: 0 }}>My Orders</h1>
          <p style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-muted)', margin: '0.25rem 0 0' }}>Track, download receipts, and manage your purchases</p>
        </div>
        <span className="ds-badge ds-badge-slate">{orders.length} orders</span>
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {orders.map((order, i) => (
          <motion.div
            key={order._id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          >
            <div className="ds-card" style={{ padding: '1.25rem' }}>
              <Link to={`/order-confirmation/${order._id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <div style={{
                      width: '2.5rem', height: '2.5rem', borderRadius: 'var(--ds-r-md)',
                      background: 'linear-gradient(135deg, var(--ds-primary) 0%, #7c3aed 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0
                    }}>
                      <Package size={18} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, color: 'var(--ds-text-head)', margin: 0, fontSize: 'var(--ds-text-sm)' }}>
                        Order #{order._id.slice(-8).toUpperCase()}
                      </p>
                      <p style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-muted)', margin: '0.15rem 0 0' }}>
                        {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        {' · '}{order.items.length} item{order.items.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {order.paymentMethod === 'koko' && (
                      <span className="ds-badge ds-badge-violet">
                        koko 3x Pay
                      </span>
                    )}
                    <span className={`ds-badge ${
                      ['delivered', 'completed'].includes(order.orderStatus) ? 'ds-badge-green' :
                      ['cancelled', 'rejected'].includes(order.orderStatus) ? 'ds-badge-red' :
                      ['shipped', 'out_for_delivery', 'packed'].includes(order.orderStatus) ? 'ds-badge-blue' :
                      'ds-badge-amber'
                    }`}>
                      {order.orderStatus.replace('_', ' ')}
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--ds-text-head)', fontSize: 'var(--ds-text-sm)' }}>
                      {formatPrice(convertPrice(order.totalAmount))}
                    </span>
                    <ChevronRight size={16} style={{ color: 'var(--ds-text-faint)' }} />
                  </div>
                </div>
              </Link>

              {/* Item previews */}
              <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0.75rem 0', margin: '0.75rem 0 0.5rem', borderTop: '1px solid var(--ds-border-soft)' }}>
                {order.items.slice(0, 5).map((item, j) => (
                  <img 
                    key={j} 
                    src={getImageUrl(item.image) || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop&q=60'} 
                    alt="" 
                    style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--ds-r-sm)', objectFit: 'cover', border: '1px solid var(--ds-border-soft)' }}
                    onError={(e) => handleImageError(e, 'Product')}
                  />
                ))}
                {order.items.length > 5 && (
                  <div style={{
                    width: '2.5rem', height: '2.5rem', borderRadius: 'var(--ds-r-sm)',
                    background: 'var(--ds-border-soft)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-muted)', fontWeight: 600
                  }}>
                    +{order.items.length - 5}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', borderTop: '1px solid var(--ds-border-soft)', paddingTop: '0.75rem' }}>
                {isCancellable(order) && (
                  <button
                    type="button"
                    onClick={() => setCancelOrderId(order._id)}
                    className="ds-btn ds-btn-danger ds-btn-sm"
                  >
                    <XCircle size={13} /> Cancel Order ({getCancelTimeLeft(order)})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => downloadBill(order)}
                  className="ds-btn ds-btn-secondary ds-btn-sm"
                >
                  <Download size={13} /> Download Receipt
                </button>
                <button
                  type="button"
                  onClick={() => { if (isReturnEligible(order)) openReturnModal(order); }}
                  disabled={!isReturnEligible(order)}
                  className={`ds-btn ds-btn-sm ${isReturnEligible(order) ? 'ds-btn-secondary' : 'ds-btn-ghost'}`}
                  style={{ opacity: isReturnEligible(order) ? 1 : 0.5 }}
                >
                  Request Return
                </button>
                {order.returnStatus && order.returnStatus !== 'none' && (
                  <span className="ds-badge ds-badge-slate">
                    Return: {order.returnStatus.replaceAll('_', ' ')}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      {requestingFor && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl relative border border-slate-200/60 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800 m-0">Request Product Return</h3>
            </div>
            <form onSubmit={submitReturnRequest} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Select Item</label>
                <select
                  value={returnForm.productId}
                  onChange={(e) => setReturnForm((p) => ({ ...p, productId: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white font-semibold text-slate-700 focus:ring-2 focus:ring-brand-indigo/25 focus:border-brand-indigo cursor-pointer"
                >
                  {(requestingFor.items || []).map((item, idx) => (
                    <option key={idx} value={item.productId}>{item.name} (sold: {item.quantity})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Quantity</label>
                  <input type="number" min="1" value={returnForm.qty} onChange={(e) => setReturnForm((p) => ({ ...p, qty: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-brand-indigo/25 focus:border-brand-indigo" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Condition</label>
                  <select value={returnForm.condition} onChange={(e) => setReturnForm((p) => ({ ...p, condition: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white font-semibold text-slate-700 focus:ring-2 focus:ring-brand-indigo/25 focus:border-brand-indigo cursor-pointer">
                    <option value="good">Brand New Sealed</option>
                    <option value="damaged">Damaged / Open Box</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Reason for Return</label>
                <select value={returnForm.reason} onChange={(e) => setReturnForm((p) => ({ ...p, reason: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white font-semibold text-slate-700 focus:ring-2 focus:ring-brand-indigo/25 focus:border-brand-indigo cursor-pointer">
                  <option value="damaged_item">Damaged Item / Faulty Hardware</option>
                  <option value="wrong_item">Received Wrong Model / Color</option>
                  <option value="quality_issue">Quality / Performance Issue</option>
                  <option value="other">Other Reason</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Note Details</label>
                <input value={returnForm.note} onChange={(e) => setReturnForm((p) => ({ ...p, note: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-brand-indigo/25 focus:border-brand-indigo" placeholder="Explain the problem..." />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setRequestingFor(null)} className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700 cursor-pointer">Cancel</button>
                <button type="submit" disabled={submittingReturn} className="bg-gradient-to-r from-brand-indigo to-brand-violet hover:opacity-95 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-[0_4px_12px_rgba(99,102,241,0.2)] disabled:opacity-50 cursor-pointer">
                  {submittingReturn ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Custom Cancel Order Confirmation Modal */}
      {cancelOrderId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4" onClick={() => setCancelOrderId(null)}>
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4 animate-fade-in text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
              <XCircle size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800 m-0">Confirm Cancellation</h3>
              <p className="text-xs text-slate-500 m-0 font-medium">Are you sure you want to cancel this order? This action cannot be undone.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCancelOrderId(null)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer border-0"
              >
                No, Keep Order
              </button>
              <button
                onClick={confirmCancelOrder}
                className="flex-1 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer border-0"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
