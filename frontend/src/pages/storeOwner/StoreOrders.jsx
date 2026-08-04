import { useState, useEffect, Fragment } from 'react';
import { CheckCircle, XCircle, ChevronDown, ChevronUp, ShoppingBag } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { getStoreOrders, updateOrderStatus, assignDeliveryGuy, getAvailableDeliveryGuys } from '../../services/api';
import useCurrencyStore from '../../store/currencyStore';
import { toast } from 'react-toastify';
import { managerNavGroups as navItems } from './managerNavItems';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  assigned_delivery: 'bg-purple-100 text-purple-700',
  packed: 'bg-indigo-100 text-indigo-700',
  shipped: 'bg-cyan-100 text-cyan-700',
  out_for_delivery: 'bg-teal-100 text-teal-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
};

const paymentColors = {
  pending: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
};

const statusFlow = ['pending', 'confirmed', 'assigned_delivery', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'completed', 'cancelled'];

const StoreOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [expandedId, setExpandedId] = useState(null);
  const [deliveryGuys, setDeliveryGuys] = useState([]);
  const { convertPrice, formatPrice } = useCurrencyStore();

  const fetchOrders = async () => {
    try {
      const { data } = await getStoreOrders();
      setOrders(data);
      if (data?.[0]?.storeId?._id) {
        const { data: guys } = await getAvailableDeliveryGuys({ storeId: data[0].storeId._id });
        setDeliveryGuys(guys || []);
      } else {
        const { data: guys } = await getAvailableDeliveryGuys();
        setDeliveryGuys(guys || []);
      }
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, { orderStatus: newStatus });
      toast.success(`Order status updated to ${newStatus.replace(/_/g, ' ')}`);
      fetchOrders();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleAssignDelivery = async (orderId, deliveryGuyId) => {
    if (!deliveryGuyId) return;
    try {
      await assignDeliveryGuy(orderId, { deliveryGuyId });
      toast.success('Delivery person assigned');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign delivery');
    }
  };

  const handleCancel = async (orderId, e) => {
    e.stopPropagation();
    try {
      await updateOrderStatus(orderId, { orderStatus: 'cancelled', paymentStatus: 'failed' });
      toast.success('Order cancelled');
      fetchOrders();
    } catch (err) {
      toast.error('Failed to cancel order');
    }
  };

  const filtered = (filter === 'all' ? orders : orders.filter((o) => o.orderStatus === filter))
    .sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'amount_high') return (b.totalAmount || 0) - (a.totalAmount || 0);
      if (sortBy === 'amount_low') return (a.totalAmount || 0) - (b.totalAmount || 0);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  if (loading) {
    return (
      <DashboardLayout navItems={navItems} title="Manager Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-primary-blue border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} title="Manager Dashboard">
      <div className="animate-fade-in space-y-6">
        {/* Operations Control Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white/40 shadow-sm relative overflow-hidden mb-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-indigo/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-brand-indigo/10 flex items-center justify-center text-brand-indigo">
                <ShoppingBag size={20} strokeWidth={2.5} />
              </div>
              <h1 className="text-2xl font-black text-slate-900 m-0">Customer Orders</h1>
            </div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-2 m-0">Manage statuses, payments, and delivery assignments</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-400 font-bold hidden sm:block">
              <span className="font-black text-slate-700">{orders.length}</span> total orders
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-bold text-slate-700 outline-none cursor-pointer focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo shadow-sm"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="amount_high">Amount high to low</option>
              <option value="amount_low">Amount low to high</option>
            </select>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2.5 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {['all', ...statusFlow].map((status) => {
            const count = status === 'all' ? orders.length : orders.filter((o) => o.orderStatus === status).length;
            const isActive = filter === status;
            return (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer border ${
                  isActive
                    ? 'bg-brand-indigo text-white border-brand-indigo/20 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-750'
                }`}
              >
                {status === 'all' ? 'All' : status.replace(/_/g, ' ')}
                <span className={`ml-2 inline-flex items-center justify-center min-w-[20px] h-[16px] px-1 rounded-md text-[9px] font-black ${
                  isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-6 py-4 text-[10px] uppercase font-black tracking-wider text-slate-505">Order</th>
                  <th className="text-left px-6 py-4 text-[10px] uppercase font-black tracking-wider text-slate-505">Customer</th>
                  <th className="text-left px-6 py-4 text-[10px] uppercase font-black tracking-wider text-slate-505">Total</th>
                  <th className="text-left px-6 py-4 text-[10px] uppercase font-black tracking-wider text-slate-505">Payment</th>
                  <th className="text-left px-6 py-4 text-[10px] uppercase font-black tracking-wider text-slate-505">Status</th>
                  <th className="text-left px-6 py-4 text-[10px] uppercase font-black tracking-wider text-slate-505">Delivery</th>
                  <th className="text-left px-6 py-4 text-[10px] uppercase font-black tracking-wider text-slate-550">Date</th>
                  <th className="text-right px-6 py-4 text-[10px] uppercase font-black tracking-wider text-slate-505">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((order) => (
                  <Fragment key={order._id}>
                    <tr
                      className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${order.orderStatus === 'cancelled' ? 'opacity-50' : ''}`}
                      onClick={() => setExpandedId(expandedId === order._id ? null : order._id)}
                    >
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-700">#{order._id.slice(-8).toUpperCase()}</span>
                          {expandedId === order._id ? <ChevronUp size={14} className="text-slate-800" /> : <ChevronDown size={14} className="text-slate-400" />}
                        </div>
                      </td>
                      <td className="px-6 py-4.5">
                        <p className="font-black text-slate-800 text-xs m-0">{order.userId?.name || 'N/A'}</p>
                        <p className="text-[10px] text-slate-400 font-extrabold uppercase m-0 mt-0.5">{order.userId?.email}</p>
                      </td>
                      <td className="px-6 py-4.5 font-black text-xs text-slate-800">{formatPrice(convertPrice(order.totalAmount || 0))}</td>
                      <td className="px-6 py-4.5">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                          order.paymentStatus === 'completed' ? 'bg-teal-50 text-teal-700 border-teal-100/60' :
                          order.paymentStatus === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100/60' :
                          'bg-red-50 text-red-705 border-red-105'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4.5">
                        <select
                          value={order.orderStatus}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                          className={`text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-indigo/10 ${statusColors[order.orderStatus] || 'bg-slate-100 text-slate-600'}`}
                        >
                          {statusFlow.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                        </select>
                      </td>
                      <td className="px-6 py-4.5">
                        <select
                          value={order.deliveryGuyId?._id || ''}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleAssignDelivery(order._id, e.target.value)}
                          className="bg-white border border-slate-200 rounded-xl py-1.5 px-2.5 text-[10px] font-bold text-slate-700 outline-none cursor-pointer focus:ring-2 focus:ring-brand-indigo/20 focus:border-transparent"
                        >
                          <option value="">Assign delivery</option>
                          {deliveryGuys.map((g) => (
                            <option key={g._id} value={g._id}>{g.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4.5 text-slate-450 font-bold text-xs">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {order.orderStatus === 'pending' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleStatusUpdate(order._id, 'confirmed'); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-100/60 text-teal-700 hover:bg-teal-100 text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                            >
                              <CheckCircle size={13} /> Approve
                            </button>
                          )}
                          {!['delivered', 'completed', 'cancelled'].includes(order.orderStatus) && (
                            <button
                              onClick={(e) => handleCancel(order._id, e)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-100/60 text-rose-600 hover:bg-rose-100 text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                            >
                              <XCircle size={13} /> Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedId === order._id && (
                      <tr>
                        <td colSpan={8} className="px-6 py-4 bg-gray-50">
                          <div className="space-y-2 text-sm">
                            <p><strong>Assigned Delivery:</strong> {order.deliveryGuyId?.name || 'Not assigned'}</p>
                            <p><strong>Delivery Address:</strong> {order.deliveryAddress ? `${order.deliveryAddress.street}, ${order.deliveryAddress.city}, ${order.deliveryAddress.state} ${order.deliveryAddress.zipCode}` : 'N/A'}</p>
                            <div>
                              <strong>Items:</strong>
                              <ul className="list-disc pl-6">
                                {order.items?.map((item, i) => (
                                  <li key={i}>{item.name} x {item.quantity} - Rs. {(item.price * item.quantity).toFixed(2)}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-text text-sm">No orders found</div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StoreOrders;
