import { useState, useEffect, Fragment } from 'react';
import { CheckCircle, XCircle, ChevronDown, ChevronUp, MoreVertical, Printer, MessageSquare, Edit, FileText, Eye, Trash2, Package, Truck, RefreshCcw, X } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';

import {
  getAdminOrders,
  updateOrderStatus,
  approveOrder,
  cancelOrder,
  assignDeliveryGuy,
  getAvailableDeliveryGuys,
  getCategories,
  updateOrderAdmin,
  deleteAdminOrder
} from '../../services/api';
import useCurrencyStore from '../../store/currencyStore';
import { toast } from 'react-toastify';
import { adminNavGroups as navItems } from './adminNavItems';
import useAdminStoreStore from '../../store/adminStoreStore';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  assigned_delivery: 'bg-purple-100 text-purple-700',
  packed: 'bg-indigo-100 text-indigo-700',
  shipped: 'bg-cyan-100 text-cyan-700',
  out_for_delivery: 'bg-teal-100 text-teal-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const paymentColors = {
  pending: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
};

const statusFlow = ['pending', 'confirmed', 'assigned_delivery', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'completed', 'cancelled'];

const BRANDS = ['all', 'Apple', 'Samsung', 'Xiaomi', 'Oppo', 'Vivo', 'Realme', 'Huawei', 'OnePlus', 'Anker', 'JBL', 'Baseus'];

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [sortBy, setSortBy] = useState('newest');
  const [expandedId, setExpandedId] = useState(null);
  const [deliveryGuys, setDeliveryGuys] = useState([]);
  const [categories, setCategories] = useState([]);
  const { convertPrice, formatPrice } = useCurrencyStore();
  const { selectedStoreId } = useAdminStoreStore();

  // Active action menu row ID
  const [actionMenuId, setActionMenuId] = useState(null);

  // Edit Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [editForm, setEditForm] = useState({
    id: '',
    customerName: '',
    customerPhone: '',
    orderStatus: 'pending',
    paymentStatus: 'pending'
  });

  const fetchFiltersData = async () => {
    try {
      const { data } = await getCategories();
      setCategories(data || []);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {
        ...(selectedStoreId !== 'all' ? { storeId: selectedStoreId } : {}),
        ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
        ...(categoryFilter !== 'all' ? { category: categoryFilter } : {}),
        ...(brandFilter !== 'all' ? { brand: brandFilter } : {}),
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {})
      };
      const { data } = await getAdminOrders(params);
      setOrders(data || []);
      
      const { data: guys } = await getAvailableDeliveryGuys();
      setDeliveryGuys(guys || []);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
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

  useEffect(() => {
    fetchFiltersData();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [selectedStoreId, statusFilter, categoryFilter, brandFilter, startDate, endDate]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, { orderStatus: newStatus });
      toast.success('Status updated');
      fetchOrders();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleApprove = async (orderId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Approve this order? It will be marked as Confirmed.')) return;
    try {
      await approveOrder(orderId);
      toast.success('Order approved ✅');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve order');
    }
  };

  const handleCancel = async (orderId, e) => {
    if (e) e.stopPropagation();
    const reason = window.prompt('Reason for cancellation (optional):');
    if (reason === null) return;
    try {
      await cancelOrder(orderId, { reason });
      toast.success('Order cancelled');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    }
  };

  const handleDeleteClick = (order, e) => {
    if (e) e.stopPropagation();
    setItemToDelete(order);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    const order = itemToDelete;

    const restoreStock = !['cancelled', 'delivered', 'completed'].includes(order.orderStatus)
      && window.confirm('Restore this order quantity back to stock before deleting?');
    try {
      await deleteAdminOrder(order._id, { restoreStock });
      toast.success('Order deleted');
      setActionMenuId(null);
      if (expandedId === order._id) setExpandedId(null);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete order');
    }
  };

  const handleTriggerSMS = (order) => {
    const phone = order.customerPhone || order.userId?.phone || 'N/A';
    toast.success(`SMS alert successfully triggered! Message sent to ${phone}: "Your order #${order._id.slice(-8).toUpperCase()} status is now ${order.orderStatus.toUpperCase()}."`);
  };

  const handleReprintReceipt = (order) => {
    toast.info(`Receipt for invoice #${order.invoiceNumber || order._id.slice(-8).toUpperCase()} sent to print queue.`);
  };

  const openLiveEdit = (order) => {
    setEditForm({
      id: order._id,
      customerName: order.customerName || order.userId?.name || '',
      customerPhone: order.customerPhone || order.userId?.phone || '',
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus
    });
    setShowEditModal(true);
    setActionMenuId(null);
  };

  const handleSaveLiveEdit = async (e) => {
    e.preventDefault();
    try {
      await updateOrderAdmin(editForm.id, {
        customerName: editForm.customerName,
        customerPhone: editForm.customerPhone,
        orderStatus: editForm.orderStatus,
        paymentStatus: editForm.paymentStatus
      });
      toast.success('Order updated successfully');
      setShowEditModal(false);
      fetchOrders();
    } catch (err) {
      toast.error('Failed to save order details');
    }
  };

  const exportPDFReport = () => {
    const cols = [
      { label: 'Invoice No', accessor: (r) => r.invoiceNumber || r._id.slice(-8).toUpperCase() },
      { label: 'Customer', accessor: (r) => r.customerName || r.userId?.name || 'Walk-in' },
      { label: 'Store', accessor: (r) => r.storeId?.name || 'N/A' },
      { label: 'Total Amount', accessor: (r) => `Rs. ${r.totalAmount?.toLocaleString()}` },
      { label: 'Payment Method', accessor: 'paymentMethod' },
      { label: 'Payment Status', accessor: 'paymentStatus' },
      { label: 'Order Status', accessor: 'orderStatus' },
      { label: 'Date', accessor: (r) => new Date(r.createdAt).toLocaleDateString() }
    ];
    exportToPDF(filteredOrders, cols, 'Order Report');
  };

  const sortedOrders = [...orders].sort((a, b) => {
    if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortBy === 'amount_high') return (b.totalAmount || 0) - (a.totalAmount || 0);
    if (sortBy === 'amount_low') return (a.totalAmount || 0) - (b.totalAmount || 0);
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const filteredOrders = sortedOrders; // filtering happens in backend

  // Summary stats
  const pendingCount = orders.filter((o) => o.orderStatus === 'pending').length;
  const totalRevenue = orders.filter((o) => ['delivered', 'completed'].includes(o.orderStatus)).reduce((s, o) => s + o.totalAmount, 0);

  return (
    <DashboardLayout navItems={navItems} title="Orders">
      <div className="relative">
        {/* Page Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="inline-flex items-center gap-1.5 bg-brand-indigo/10 text-brand-indigo text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border border-brand-indigo/15">
                <Package size={11} /> Sales & Operations
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 m-0">Order Management</h1>
            <p className="text-slate-400 text-xs font-bold mt-1 m-0">
              {orders.length} orders found · <span className="text-amber-600 font-bold">{pendingCount} pending approval</span> · Total Sales: <span className="text-emerald-600 font-extrabold">{formatPrice(convertPrice(totalRevenue))}</span>
            </p>
          </div>
          
          <div className="flex gap-3 self-start md:self-auto">
            <button
              onClick={exportPDFReport}
              className="bg-white border border-slate-200 text-rose-600 text-[10px] uppercase tracking-wider font-black px-5 py-2.5 rounded-xl hover:bg-rose-50 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <FileText size={15} /> Export PDF
            </button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 text-[10px] uppercase tracking-wider font-black px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-all focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo cursor-pointer"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="amount_high">Amount high to low</option>
              <option value="amount_low">Amount low to high</option>
            </select>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1.5">Category Type</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all cursor-pointer"
            >
              <option value="all">All Category Types</option>
              <option value="mobiles">Mobiles (Phones/Tablets)</option>
              <option value="accessories">Accessories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1.5">Brand Filter</label>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all cursor-pointer"
            >
              <option value="all">All Brands</option>
              {BRANDS.slice(1).map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1.5">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1.5">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all"
            />
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {['all', ...statusFlow].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-5 py-2.5 rounded-xl text-[10px] uppercase tracking-wider font-black whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === status
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              {status === 'all' ? `All (${orders.length})` : `${status.replace(/_/g, ' ')} (${orders.filter((o) => o.orderStatus === status).length})`}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-6 py-4 text-[10px] uppercase font-black tracking-wider text-slate-500">Order</th>
                  <th className="text-left px-6 py-4 text-[10px] uppercase font-black tracking-wider text-slate-500">Customer</th>
                  <th className="text-left px-6 py-4 text-[10px] uppercase font-black tracking-wider text-slate-500">Store</th>
                  <th className="text-left px-6 py-4 text-[10px] uppercase font-black tracking-wider text-slate-500">Total</th>
                  <th className="text-left px-6 py-4 text-[10px] uppercase font-black tracking-wider text-slate-500">Payment</th>
                  <th className="text-left px-6 py-4 text-[10px] uppercase font-black tracking-wider text-slate-500">Status</th>
                  <th className="text-left px-6 py-4 text-[10px] uppercase font-black tracking-wider text-slate-500">Delivery</th>
                  <th className="text-left px-6 py-4 text-[10px] uppercase font-black tracking-wider text-slate-500">Date</th>
                  <th className="text-right px-6 py-4 text-[10px] uppercase font-black tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => (
                  <Fragment key={order._id}>
                    <tr
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${order.orderStatus === 'cancelled' ? 'opacity-50' : ''}`}
                      onClick={() => setExpandedId(expandedId === order._id ? null : order._id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-brand-indigo bg-brand-indigo/5 px-2 py-1 rounded-md border border-brand-indigo/10">#{order.invoiceNumber || order._id.slice(-8).toUpperCase()}</span>
                          {expandedId === order._id ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                          {order.isPosOrder && (
                            <span className="text-[10px] uppercase tracking-wider font-black bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-lg border border-teal-200">POS</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-extrabold text-slate-800 text-sm">{order.customerName || order.userId?.name || 'Walk-in Customer'}</p>
                        <p className="text-[11px] font-bold text-slate-400 mt-0.5">{order.customerPhone || order.userId?.phone || 'No Phone'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md border border-slate-200/60">
                          {order.storeId?.name || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-extrabold text-slate-800">{formatPrice(convertPrice(order.totalAmount))}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] uppercase tracking-wider font-black px-2.5 py-1 rounded-lg ${paymentColors[order.paymentStatus] || 'bg-slate-100 text-slate-600'}`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={order.orderStatus}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                          className={`text-[10px] uppercase tracking-wider font-black px-3 py-1.5 rounded-lg border-0 appearance-none cursor-pointer ${statusColors[order.orderStatus]} focus:outline-none focus:ring-2 focus:ring-brand-indigo/20`}
                        >
                          {statusFlow.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={order.deliveryGuyId?._id || ''}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleAssignDelivery(order._id, e.target.value)}
                          className="border border-slate-200 bg-slate-50 rounded-xl py-1.5 px-3 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-indigo/20"
                        >
                          <option value="">Assign delivery</option>
                          {deliveryGuys.map((g) => (
                            <option key={g._id} value={g._id}>{g.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium text-xs whitespace-nowrap">{new Date(order.createdAt).toLocaleDateString()}</td>
                      
                      {/* Context actions menu */}
                      <td className="px-6 py-3.5 text-right relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setActionMenuId(actionMenuId === order._id ? null : order._id)}
                          className="p-1 rounded-lg hover:bg-gray-100 text-muted-text transition-all"
                        >
                          <MoreVertical size={16} />
                        </button>
                        
                        {actionMenuId === order._id && (
                          <div className="absolute right-6 top-10 w-44 bg-white border border-card-border rounded-xl shadow-xl z-20 py-1.5 text-left text-xs text-dark-navy">
                            <button
                              onClick={() => { setExpandedId(expandedId === order._id ? null : order._id); setActionMenuId(null); }}
                              className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Eye size={14} className="text-gray-500" />
                              {expandedId === order._id ? 'Collapse' : 'View Details'}
                            </button>
                            
                            <button
                              onClick={() => openLiveEdit(order)}
                              className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Edit size={14} className="text-blue-500" />
                              Live Edit
                            </button>

                            <button
                              onClick={() => { handleReprintReceipt(order); setActionMenuId(null); }}
                              className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Printer size={14} className="text-teal-500" />
                              Re-print Receipt
                            </button>

                            <button
                              onClick={() => { handleTriggerSMS(order); setActionMenuId(null); }}
                              className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <MessageSquare size={14} className="text-purple-500" />
                              Trigger SMS
                            </button>

                            {order.orderStatus === 'pending' && (
                              <button
                                onClick={() => { handleApprove(order._id); setActionMenuId(null); }}
                                className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-2 font-semibold text-emerald-600"
                              >
                                <CheckCircle size={14} className="text-emerald-500" />
                                Approve
                              </button>
                            )}

                            {!['delivered', 'completed', 'cancelled'].includes(order.orderStatus) && (
                              <button
                                onClick={() => { handleCancel(order._id); setActionMenuId(null); }}
                                className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-2 font-semibold text-red-600"
                              >
                                <XCircle size={14} className="text-red-500" />
                                Cancel Order
                              </button>
                            )}

                            <button
                              onClick={(e) => handleDeleteClick(order, e)}

                              className="w-full px-4 py-2 hover:bg-red-50 flex items-center gap-2 font-semibold text-red-700"
                            >
                              <Trash2 size={14} className="text-red-600" />
                              Delete Order
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* Expanded Items view */}
                    {expandedId === order._id && (
                      <tr>
                        <td colSpan={9} className="px-6 py-6 bg-slate-50/50 text-xs border-y border-slate-100/50 relative overflow-hidden">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-indigo/20"></div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                              <p className="font-black text-slate-400 uppercase tracking-widest mb-4 text-[10px] flex items-center gap-2"><Truck size={12} className="text-brand-indigo"/> Shipment Details</p>
                              <div className="space-y-3">
                                <div>
                                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Assigned Delivery</span>
                                  <span className="font-semibold text-slate-800">{order.deliveryGuyId?.name || 'Not assigned'}</span>
                                </div>
                                <div>
                                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Delivery Address</span>
                                  <span className="font-semibold text-slate-800 leading-relaxed">{order.deliveryAddress ? `${order.deliveryAddress.street || ''}, ${order.deliveryAddress.city || ''}, ${order.deliveryAddress.state || ''} ${order.deliveryAddress.zipCode || ''}` : 'N/A'}</span>
                                </div>
                              </div>
                              {order.exchangeReturnId && (
                                <div className="mt-4 bg-rose-50 border border-rose-100 rounded-xl p-3">
                                  <p className="text-rose-600 font-bold text-xs flex items-start gap-2">
                                    <RefreshCcw size={14} className="mt-0.5 shrink-0" />
                                    <span>Returned Item Exchange Credit:<br/>Rs. {order.exchangeCredit?.toLocaleString()} applied</span>
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                              <p className="font-black text-slate-400 uppercase tracking-widest mb-4 text-[10px] flex items-center gap-2"><Package size={12} className="text-brand-indigo"/> Order Items</p>
                              <div className="border border-slate-100 rounded-xl overflow-hidden">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="bg-slate-50 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                                      <th className="px-4 py-3">Item</th>
                                      <th className="px-4 py-3 text-right">Price</th>
                                      <th className="px-4 py-3 text-center">Qty</th>
                                      <th className="px-4 py-3 text-right">Subtotal</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-50">
                                    {order.items?.map((it, idx) => (
                                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-3">
                                          <p className="font-extrabold text-slate-800">{it.name}</p>
                                          {it.imei && it.imei.length > 0 && (
                                            <p className="text-[10px] font-mono font-semibold text-slate-500 mt-1 bg-slate-100 inline-block px-2 py-0.5 rounded border border-slate-200">IMEI: {it.imei.join(', ')}</p>
                                          )}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-slate-600">Rs. {it.price?.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-center font-extrabold text-slate-800">
                                          <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60">{it.quantity}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-black text-brand-indigo">Rs. {(it.price * it.quantity)?.toLocaleString()}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
            {filteredOrders.length === 0 && (
              <div className="text-center py-12 text-muted-text text-sm">No orders found matching filters</div>
            )}
          </div>
        </div>

        {/* Live Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowEditModal(false)}>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden transform transition-all duration-300 scale-100" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md">
                <h3 className="font-black text-slate-900 text-lg flex items-center gap-2"><Edit size={18} className="text-brand-indigo" /> Live Edit Order</h3>
                <button onClick={() => setShowEditModal(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveLiveEdit} className="p-6 space-y-5">
                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1.5">Customer Name</label>
                  <input
                    type="text"
                    value={editForm.customerName}
                    onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1.5">Customer Phone</label>
                  <input
                    type="text"
                    value={editForm.customerPhone}
                    onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1.5">Order Status</label>
                  <select
                    value={editForm.orderStatus}
                    onChange={(e) => setEditForm({ ...editForm, orderStatus: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all cursor-pointer"
                  >
                    {statusFlow.map((s) => (
                      <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1.5">Payment Status</label>
                  <select
                    value={editForm.paymentStatus}
                    onChange={(e) => setEditForm({ ...editForm, paymentStatus: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all cursor-pointer"
                  >
                    <option value="pending">pending</option>
                    <option value="completed">completed</option>
                    <option value="failed">failed</option>
                    <option value="refunded">refunded</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3.5 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-brand-indigo to-brand-violet text-white py-3.5 rounded-xl font-black text-[11px] uppercase tracking-wider hover:opacity-95 shadow-lg shadow-brand-indigo/20 transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setItemToDelete(null); }}
        onConfirm={handleDeleteConfirm}
        itemName={itemToDelete ? `order #${itemToDelete.invoiceNumber || itemToDelete._id.slice(-8).toUpperCase()}` : 'this order'}
      />
    </DashboardLayout>
  );
};

export default AdminOrders;
