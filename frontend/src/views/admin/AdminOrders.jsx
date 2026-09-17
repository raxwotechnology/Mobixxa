'use client';

import { useState, useEffect, Fragment } from 'react';
import { CheckCircle, XCircle, ChevronDown, ChevronUp, MoreVertical, Printer, MessageSquare, Edit, FileText, Eye, Trash2, Package, Truck, RefreshCcw, X, Download, ShieldCheck, Lock } from 'lucide-react';
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
  deleteAdminOrder,
  getHPRecords
} from '../../services/api';
import useCurrencyStore from '../../store/currencyStore';
import { toast } from 'react-toastify';
import { adminNavGroups as defaultNavItems } from './adminNavItems';
import useAdminStoreStore from '../../store/adminStoreStore';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import { sendWhatsAppInvoice } from '../../utils/whatsappHelper';
import jsPDF from 'jspdf';

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

const AdminOrders = ({ navItems: propNavItems }) => {
  const navItems = propNavItems || defaultNavItems;
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

  // Modals state
  const [showEditModal, setShowEditModal] = useState(false);
  const [viewDetailsOrder, setViewDetailsOrder] = useState(null);
  const [viewBillOrder, setViewBillOrder] = useState(null);
  const [cancelOrderId, setCancelOrderId] = useState(null);

  // Passcode Protection state for Deletion
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [passcode, setPasscode] = useState('');

  const [linkedHPRecord, setLinkedHPRecord] = useState(null);
  const [loadingHP, setLoadingHP] = useState(false);

  useEffect(() => {
    if (viewDetailsOrder && viewDetailsOrder.paymentMethod === 'hire_purchase') {
      const fetchLinkedHP = async () => {
        try {
          setLoadingHP(true);
          const { data } = await getHPRecords({ orderId: viewDetailsOrder._id });
          if (data && data.length > 0) {
            setLinkedHPRecord(data[0]);
          } else {
            setLinkedHPRecord(null);
          }
        } catch (err) {
          console.error('Failed to load linked HP record', err);
          setLinkedHPRecord(null);
        } finally {
          setLoadingHP(false);
        }
      };
      fetchLinkedHP();
    } else {
      setLinkedHPRecord(null);
    }
  }, [viewDetailsOrder]);

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

  const confirmCancelOrder = async () => {
    if (!cancelOrderId) return;
    try {
      await cancelOrder(cancelOrderId, { cancellationReason: 'Cancelled by Admin' });
      toast.success('Order has been cancelled successfully! 🛑');
      setCancelOrderId(null);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    }
  };

  const handleDeleteClick = (order, e) => {
    if (e) e.stopPropagation();
    setItemToDelete(order);
    setPasscode('');
    setDeleteModalOpen(true);
    setActionMenuId(null);
  };

  const handleDeleteConfirm = async () => {
    if (passcode !== '1234' && passcode !== '8888' && passcode !== '0000') {
      toast.error('Invalid Security Passcode! Action denied.');
      return;
    }
    try {
      await deleteAdminOrder(itemToDelete._id);
      toast.success('Order deleted successfully');
      setDeleteModalOpen(false);
      setItemToDelete(null);
      setPasscode('');
      if (expandedId === itemToDelete._id) setExpandedId(null);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete order');
    }
  };

  const openLiveEdit = (order) => {
    setEditForm({
      id: order._id,
      invoiceNumber: order.invoiceNumber || `INV-${order._id.slice(-8).toUpperCase()}`,
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
        invoiceNumber: editForm.invoiceNumber,
        customerName: editForm.customerName,
        customerPhone: editForm.customerPhone,
        orderStatus: editForm.orderStatus,
        paymentStatus: editForm.paymentStatus
      });
      toast.success('Order & Invoice details updated successfully');
      setShowEditModal(false);
      fetchOrders();
    } catch (err) {
      toast.error('Failed to save order details');
    }
  };

  const downloadInvoicePDF = (order) => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const shopName = order.storeId?.name || 'Mobixa';
      const invNo = order.invoiceNumber || `INV-${order._id.slice(-8).toUpperCase()}`;

      // Header Banner
      doc.setFillColor(15, 23, 42); // Slate-900
      doc.rect(0, 0, 210, 30, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text(shopName.toUpperCase(), 15, 15);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(203, 213, 225);
      doc.text('Official Sales Invoice & Warranty Guarantee', 15, 22);

      // Ref & Date
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Invoice: ${invNo}`, 15, 40);
      doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 195, 40, { align: 'right' });

      // Customer Details
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`Customer: ${order.customerName || order.userId?.name || 'Walk-in'}`, 15, 50);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(`Phone: ${order.customerPhone || order.userId?.phone || 'N/A'}`, 15, 56);
      doc.text(`Payment: ${order.paymentMethod?.toUpperCase()} (${order.paymentStatus?.toUpperCase()})`, 15, 62);

      // Table Header
      let y = 74;
      doc.setFillColor(241, 245, 249);
      doc.rect(15, y, 180, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text('ITEM DESCRIPTION', 18, y + 5.5);
      doc.text('QTY', 130, y + 5.5);
      doc.text('UNIT PRICE', 155, y + 5.5);
      doc.text('TOTAL', 192, y + 5.5, { align: 'right' });

      y += 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);

      order.items?.forEach((it) => {
        doc.text(`${it.name}`, 18, y);
        doc.text(`${it.quantity}`, 132, y);
        doc.text(`Rs. ${Number(it.price || 0).toLocaleString()}`, 155, y);
        doc.text(`Rs. ${Number((it.price || 0) * (it.quantity || 1)).toLocaleString()}`, 192, y, { align: 'right' });
        y += 7;
      });

      // Total Line
      doc.setDrawColor(226, 232, 240);
      doc.line(15, y, 195, y);
      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('NET TOTAL PAYABLE:', 120, y);
      doc.text(`LKR ${Number(order.totalAmount || 0).toLocaleString()}`, 192, y, { align: 'right' });

      doc.save(`Invoice_${invNo}.pdf`);
      toast.success('Invoice PDF downloaded');
    } catch {
      toast.error('Failed to generate PDF');
    }
  };

  const sortedOrders = [...orders].sort((a, b) => {
    if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortBy === 'amount_high') return (b.totalAmount || 0) - (a.totalAmount || 0);
    if (sortBy === 'amount_low') return (a.totalAmount || 0) - (b.totalAmount || 0);
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const filteredOrders = sortedOrders;

  const orderColumns = [
    { label: 'Invoice No', accessor: (row) => row.invoiceNumber || row._id.slice(-6).toUpperCase() },
    { label: 'Customer Name', accessor: (row) => row.customerName || row.userId?.name || 'Walk-in' },
    { label: 'Phone', accessor: (row) => row.customerPhone || row.userId?.phone || 'N/A' },
    { label: 'Payment Method', accessor: 'paymentMethod' },
    { label: 'Payment Status', accessor: 'paymentStatus' },
    { label: 'Order Status', accessor: 'orderStatus' },
    { label: 'Total Amount', accessor: (row) => `Rs. ${row.totalAmount?.toLocaleString()}` },
    { label: 'Date', accessor: (row) => new Date(row.createdAt).toLocaleDateString() }
  ];

  const pendingCount = orders.filter((o) => o.orderStatus === 'pending').length;
  const totalRevenue = orders.filter((o) => ['delivered', 'completed'].includes(o.orderStatus)).reduce((s, o) => s + o.totalAmount, 0);

  return (
    <DashboardLayout navItems={navItems} title="Mobixa Admin Panel">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2 m-0">
              <Package size={24} className="text-brand-indigo" /> Order & Billing Management
            </h1>
            <p className="text-xs font-normal text-slate-500 mt-1 m-0">
              Track customer orders, live bill preview & print, WhatsApp digital receipts, and delivery dispatch
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportToExcel(filteredOrders, orderColumns, 'Orders_Report')}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition-all border-0 cursor-pointer flex items-center gap-1.5"
            >
              <Download size={14} /> Excel Export
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Total Orders</span>
            <h2 className="text-2xl font-black text-slate-900 m-0">{orders.length}</h2>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 block mb-1">Pending Approval</span>
            <h2 className="text-2xl font-black text-amber-600 m-0">{pendingCount}</h2>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block mb-1">Delivered Revenue</span>
            <h2 className="text-2xl font-black text-emerald-700 m-0">{formatPrice(convertPrice(totalRevenue))}</h2>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              {statusFlow.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, ' ').toUpperCase()}</option>
              ))}
            </select>

            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 cursor-pointer"
            >
              <option value="all">All Brands</option>
              {BRANDS.filter(b => b !== 'all').map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 cursor-pointer"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="amount_high">Sort: Amount (High to Low)</option>
            <option value="amount_low">Sort: Amount (Low to High)</option>
          </select>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-separate border-spacing-0">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-black uppercase tracking-wider text-[11px]">
                  <th className="px-6 py-4 border-b-2 border-slate-200">Invoice / ID</th>
                  <th className="px-6 py-4 border-b-2 border-slate-200">Customer</th>
                  <th className="px-6 py-4 border-b-2 border-slate-200">Total Amount</th>
                  <th className="px-6 py-4 border-b-2 border-slate-200">Order Status</th>
                  <th className="px-6 py-4 border-b-2 border-slate-200">Date</th>
                  <th className="px-6 py-4 border-b-2 border-slate-200 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="font-semibold text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">Loading orders...</td>
                  </tr>
                ) : filteredOrders.map((order, idx) => {
                  const isExpanded = expandedId === order._id;
                  return (
                  <Fragment key={order._id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : order._id)}
                      className={`${isExpanded ? 'bg-indigo-50/70' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'} hover:bg-indigo-50/60 transition-colors cursor-pointer ${isExpanded ? '' : 'border-b border-slate-100'}`}
                    >
                      <td className="px-6 py-5 font-mono font-bold text-brand-indigo whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          {order.invoiceNumber || order._id.slice(-8).toUpperCase()}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-bold text-slate-900 text-sm m-0">{order.customerName || order.userId?.name || 'Walk-in'}</p>
                        <p className="text-xs text-slate-400 m-0 mt-0.5">{order.customerPhone || order.userId?.phone || 'No phone'}</p>
                      </td>
                      <td className="px-6 py-5 font-extrabold text-slate-900 whitespace-nowrap">
                        {formatPrice(convertPrice(order.totalAmount))}
                      </td>
                      <td className="px-6 py-5">
                        <select
                          value={order.orderStatus}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                          className={`text-[11px] uppercase tracking-wider font-black px-3 py-1.5 rounded-lg border-0 appearance-none cursor-pointer ${statusColors[order.orderStatus]}`}
                        >
                          {statusFlow.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                        </select>
                      </td>
                      <td className="px-6 py-5 text-slate-500 font-medium text-xs whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4 text-right relative" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => sendWhatsAppInvoice(order)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white text-[10px] font-black uppercase tracking-wider transition-all border-0 cursor-pointer flex items-center gap-1"
                            title="Send WhatsApp Invoice"
                          >
                            <span>💬</span> WhatsApp
                          </button>

                          <button
                            onClick={() => setViewDetailsOrder(order)}
                            className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-800 hover:text-white transition-all border-0 cursor-pointer"
                            title="View Full Details"
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            onClick={() => setViewBillOrder(order)}
                            className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all border-0 cursor-pointer"
                            title="View / Print Bill"
                          >
                            <Printer size={14} />
                          </button>

                          <button
                            onClick={() => setActionMenuId(actionMenuId === order._id ? null : order._id)}
                            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 transition-all border-0 cursor-pointer"
                          >
                            <MoreVertical size={16} />
                          </button>
                        </div>

                        {actionMenuId === order._id && (
                          <div className="absolute right-6 top-10 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 py-2 text-left text-xs text-slate-800 animate-fade-in">
                            <button
                              onClick={() => { setViewDetailsOrder(order); setActionMenuId(null); }}
                              className="w-full px-4 py-2 hover:bg-slate-50 flex items-center gap-2 font-bold border-0 bg-transparent text-left cursor-pointer"
                            >
                              <Eye size={14} className="text-slate-500" />
                              View Full Details
                            </button>
                            
                            <button
                              onClick={() => { setViewBillOrder(order); setActionMenuId(null); }}
                              className="w-full px-4 py-2 hover:bg-slate-50 flex items-center gap-2 font-bold border-0 bg-transparent text-left cursor-pointer"
                            >
                              <Printer size={14} className="text-blue-500" />
                              View / Print Bill
                            </button>

                            <button
                              onClick={() => openLiveEdit(order)}
                              className="w-full px-4 py-2 hover:bg-slate-50 flex items-center gap-2 font-bold border-0 bg-transparent text-left cursor-pointer"
                            >
                              <Edit size={14} className="text-emerald-500" />
                              Live Edit Order
                            </button>

                            <button
                              onClick={() => { sendWhatsAppInvoice(order); setActionMenuId(null); }}
                              className="w-full px-4 py-2 hover:bg-emerald-50 text-emerald-700 font-extrabold flex items-center gap-2 border-0 bg-transparent text-left cursor-pointer"
                            >
                              <span>💬</span> WhatsApp Invoice
                            </button>

                            {order.orderStatus === 'pending' && (
                              <button
                                onClick={() => { handleApprove(order._id); setActionMenuId(null); }}
                                className="w-full px-4 py-2 hover:bg-slate-50 flex items-center gap-2 font-bold text-emerald-600 border-0 bg-transparent text-left cursor-pointer"
                              >
                                <CheckCircle size={14} /> Approve
                              </button>
                            )}

                            {!['delivered', 'completed', 'cancelled'].includes(order.orderStatus) && (
                              <button
                                onClick={() => { setCancelOrderId(order._id); setActionMenuId(null); }}
                                className="w-full px-4 py-2 hover:bg-slate-50 flex items-center gap-2 font-bold text-amber-600 border-0 bg-transparent text-left cursor-pointer"
                              >
                                <XCircle size={14} /> Cancel Order
                              </button>
                            )}

                            <button
                              onClick={(e) => handleDeleteClick(order, e)}
                              className="w-full px-4 py-2 hover:bg-rose-50 flex items-center gap-2 font-bold text-rose-600 border-0 bg-transparent text-left cursor-pointer border-t border-slate-100"
                            >
                              <Trash2 size={14} /> Delete Order
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-indigo-50/70 border-b border-slate-100">
                        <td colSpan={6} className="px-6 pb-6 pt-1">
                          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Items ({order.items?.length || 0})</span>
                              <div className="space-y-1.5">
                                {order.items?.map((it, i) => (
                                  <div key={i} className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-slate-700">{it.quantity} × {it.name}</span>
                                    <span className="font-extrabold text-slate-900">Rs. {Number((it.price || 0) * (it.quantity || 1)).toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Payment</span>
                              <p className="text-xs font-bold text-slate-700 uppercase m-0 mb-2">{order.paymentMethod || 'N/A'}</p>
                              <span className={`text-[11px] uppercase tracking-wider font-black px-2.5 py-1 rounded-lg inline-block ${paymentColors[order.paymentStatus] || 'bg-slate-100 text-slate-600'}`}>
                                {order.paymentStatus}
                              </span>
                            </div>

                            <div onClick={(e) => e.stopPropagation()}>
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Assigned Delivery</span>
                              <select
                                value={order.deliveryGuyId?._id || ''}
                                onChange={(e) => handleAssignDelivery(order._id, e.target.value)}
                                className="w-full border border-slate-200 bg-slate-50 rounded-xl py-2 px-3 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none"
                              >
                                <option value="">Assign delivery</option>
                                {deliveryGuys.map((g) => (
                                  <option key={g._id} value={g._id}>{g.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 👁️ View Full Order Details Modal */}
      {viewDetailsOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setViewDetailsOrder(null)}>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-2xl overflow-hidden p-6 max-h-[90vh] overflow-y-auto text-left" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="font-black text-slate-900 text-lg m-0">Order #{viewDetailsOrder.invoiceNumber || viewDetailsOrder._id.slice(-8).toUpperCase()}</h3>
                <p className="text-[10px] text-slate-400 font-semibold m-0">Placed on {new Date(viewDetailsOrder.createdAt).toLocaleString()}</p>
              </div>
              <button onClick={() => setViewDetailsOrder(null)} className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full border-0 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Customer Details</span>
                  <p className="font-extrabold text-slate-900 text-sm m-0 mt-0.5">{viewDetailsOrder.customerName || viewDetailsOrder.userId?.name || 'Walk-in'}</p>
                  <p className="text-slate-600 m-0">{viewDetailsOrder.customerPhone || viewDetailsOrder.userId?.phone || 'No phone'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Store & Payment</span>
                  <p className="font-extrabold text-slate-900 text-sm m-0 mt-0.5">{viewDetailsOrder.storeId?.name || 'Main Branch'}</p>
                  <p className="text-slate-600 uppercase font-bold m-0">{viewDetailsOrder.paymentMethod} ({viewDetailsOrder.paymentStatus})</p>
                </div>
              </div>

              <div>
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider block mb-2">Purchased Items ({viewDetailsOrder.items?.length})</span>
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Product</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Price</th>
                        <th className="p-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                      {viewDetailsOrder.items?.map((it, idx) => (
                        <tr key={idx}>
                          <td className="p-3 font-bold">{it.name}</td>
                          <td className="p-3 text-center font-extrabold">{it.quantity}</td>
                          <td className="p-3 text-right">Rs. {Number(it.price || 0).toLocaleString()}</td>
                          <td className="p-3 text-right font-black text-brand-indigo">Rs. {Number((it.price || 0) * (it.quantity || 1)).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {viewDetailsOrder.paymentMethod === 'koko' && (
                <div className="bg-gradient-to-br from-brand-indigo/5 via-sky-50/50 to-slate-50 border border-brand-indigo/20 p-5 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-brand-indigo/15 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-brand-indigo text-white font-black text-xs flex items-center justify-center shadow-xs">
                        koko
                      </div>
                      <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Koko Payment Breakdown (3x Installments)</span>
                    </div>
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      1/3 Paid (Active)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Koko Txn ID</span>
                      <span className="font-mono font-bold text-slate-800 text-xs">{viewDetailsOrder.kokoDetails?.transactionId || `KOKO-${viewDetailsOrder._id.slice(-6).toUpperCase()}`}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">1st Installment (Paid)</span>
                      <span className="font-bold text-emerald-600">Rs. {Math.ceil(viewDetailsOrder.totalAmount / 3).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">2nd Due (+30 Days)</span>
                      <span className="font-bold text-slate-700">Rs. {Math.ceil(viewDetailsOrder.totalAmount / 3).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">3rd Due (+60 Days)</span>
                      <span className="font-bold text-slate-700">Rs. {Math.max(0, viewDetailsOrder.totalAmount - (Math.ceil(viewDetailsOrder.totalAmount / 3) * 2)).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {viewDetailsOrder.paymentMethod === 'hire_purchase' && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider bg-amber-200/60 px-2 py-0.5 rounded">Hire Purchase / Credit Agreement</span>
                    {linkedHPRecord && (
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        linkedHPRecord.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        linkedHPRecord.status === 'arrears' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        Status: {linkedHPRecord.status}
                      </span>
                    )}
                  </div>
                  {loadingHP ? (
                    <p className="text-xs text-amber-600 animate-pulse m-0">Fetching linked credit details...</p>
                  ) : linkedHPRecord ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Customer NIC</span>
                        <span className="font-bold text-slate-700">{linkedHPRecord.customer?.nic || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Down Payment</span>
                        <span className="font-bold text-emerald-600">Rs. {linkedHPRecord.downPayment?.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Outstanding Balance</span>
                        <span className="font-extrabold text-rose-600">Rs. {linkedHPRecord.balanceAmount?.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Installment Plan</span>
                        <span className="font-bold text-slate-700">Rs. {linkedHPRecord.installmentAmount?.toLocaleString()}/mo ({linkedHPRecord.numberOfInstallments}x)</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Paid Amount</span>
                        <span className="font-bold text-emerald-600">Rs. {linkedHPRecord.totalPaid?.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Next Due Date</span>
                        <span className="font-bold text-slate-700">{linkedHPRecord.nextDueDate ? new Date(linkedHPRecord.nextDueDate).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-amber-600 italic m-0">No active Hire Purchase details found for this order.</p>
                  )}
                </div>
              )}

              <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Net Total Amount</span>
                  <h3 className="text-xl font-black m-0 mt-0.5">LKR {Number(viewDetailsOrder.totalAmount || 0).toLocaleString()}</h3>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => sendWhatsAppInvoice(viewDetailsOrder)}
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer border-0 flex items-center gap-1.5"
                  >
                    <span>💬</span> WhatsApp Invoice
                  </button>
                  <button
                    onClick={() => { setViewBillOrder(viewDetailsOrder); setViewDetailsOrder(null); }}
                    className="px-4 py-2.5 bg-brand-indigo hover:bg-brand-violet text-white font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer border-0 flex items-center gap-1.5"
                  >
                    <Printer size={14} /> View Bill
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🖨️ View / Print Live Bill Modal */}
      {viewBillOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setViewBillOrder(null)}>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-xl p-8 max-h-[90vh] overflow-y-auto text-left relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewBillOrder(null)} className="no-print absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full border-0 cursor-pointer">
              <X size={16} />
            </button>

            {/* Printable content: id="pos-receipt-content" is the same
                convention InvoiceModal/ManagerRepairs use — index.css/
                globals.css hide the rest of the page and pin this to the
                page via position:fixed for print, independent of this
                modal's own overflow-y-auto/max-height. */}
            <div id="pos-receipt-content">
              {/* Bill Header */}
              <div className="border-b-2 border-slate-900 pb-4 mb-4 flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-wider m-0">{viewBillOrder.storeId?.name || 'Mobixa'}</h2>
                  <p className="text-[10px] text-slate-500 font-semibold m-0">Official Sales Receipt & Warranty</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-black text-brand-indigo bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                    #{viewBillOrder.invoiceNumber || viewBillOrder._id.slice(-8).toUpperCase()}
                  </span>
                  <p className="text-[10px] text-slate-400 font-bold m-0 mt-1">{new Date(viewBillOrder.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="text-xs space-y-1 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <p className="m-0"><strong>Customer:</strong> {viewBillOrder.customerName || viewBillOrder.userId?.name || 'Walk-in'}</p>
                <p className="m-0"><strong>Phone:</strong> {viewBillOrder.customerPhone || viewBillOrder.userId?.phone || 'N/A'}</p>
                <p className="m-0 uppercase"><strong>Payment Method:</strong> {viewBillOrder.paymentMethod} ({viewBillOrder.paymentStatus})</p>
              </div>

              {/* Items Breakdown Table */}
              <table className="w-full text-xs text-left mb-4">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-black uppercase text-[10px]">
                    <th className="py-2">Item</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Price</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                  {viewBillOrder.items?.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2">{it.name}</td>
                      <td className="py-2 text-center">{it.quantity}</td>
                      <td className="py-2 text-right">Rs. {Number(it.price || 0).toLocaleString()}</td>
                      <td className="py-2 text-right font-black">Rs. {Number((it.price || 0) * (it.quantity || 1)).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total Footer */}
              <div className="border-t-2 border-slate-900 pt-3 flex justify-between items-center mb-6">
                <span className="font-black text-sm uppercase text-slate-900">Total Net Amount</span>
                <span className="font-black text-xl text-brand-indigo">LKR {Number(viewBillOrder.totalAmount || 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Print & Download Actions */}
            <div className="no-print flex gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer border-0 flex items-center justify-center gap-2"
              >
                <Printer size={15} /> Print Bill Receipt
              </button>
              <button
                onClick={() => downloadInvoicePDF(viewBillOrder)}
                className="bg-brand-indigo hover:bg-brand-violet text-white font-black px-5 py-3 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer border-0 flex items-center justify-center gap-2"
              >
                <Download size={15} /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2 m-0"><Edit size={18} className="text-brand-indigo" /> Live Edit Order</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full border-0 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveLiveEdit} className="space-y-4 text-xs">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Invoice Number (#)</label>
                <input
                  type="text"
                  value={editForm.invoiceNumber || ''}
                  onChange={(e) => setEditForm({ ...editForm, invoiceNumber: e.target.value })}
                  placeholder="e.g. INV-10025"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Customer Name</label>
                <input
                  type="text"
                  value={editForm.customerName}
                  onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-700"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Customer Phone</label>
                <input
                  type="text"
                  value={editForm.customerPhone}
                  onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-700"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Order Status</label>
                <select
                  value={editForm.orderStatus}
                  onChange={(e) => setEditForm({ ...editForm, orderStatus: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  {statusFlow.map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, ' ').toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Payment Status</label>
                <select
                  value={editForm.paymentStatus}
                  onChange={(e) => setEditForm({ ...editForm, paymentStatus: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  <option value="pending">PENDING</option>
                  <option value="completed">COMPLETED</option>
                  <option value="failed">FAILED</option>
                  <option value="refunded">REFUNDED</option>
                </select>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold text-xs uppercase tracking-wider border-0 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-brand-indigo hover:bg-brand-violet text-white py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all border-0 cursor-pointer shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Passcode Protected Order Deletion Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setDeleteModalOpen(false)}>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md p-6 text-left" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2 m-0 text-rose-600">
                <Lock size={18} /> Confirm Order Deletion
              </h3>
              <button onClick={() => setDeleteModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full border-0 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <p className="text-xs font-semibold text-slate-600 mb-3 m-0">
              Are you sure you want to delete <strong>order #{itemToDelete?.invoiceNumber || itemToDelete?._id?.slice(-8).toUpperCase()}</strong>? This action cannot be undone.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Enter Security Passcode (PIN) *</label>
                <input
                  type="password"
                  value={passcode}
                  onChange={e => setPasscode(e.target.value)}
                  placeholder="Enter passcode (e.g. 1234 or 8888)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-mono font-bold text-slate-800"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider border-0 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all border-0 cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  <Trash2 size={15} /> Confirm & Delete Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Custom Cancel Order Confirmation Modal */}
      {cancelOrderId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-[1000] flex items-center justify-center p-4" onClick={() => setCancelOrderId(null)}>
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4 animate-fade-in text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
              <XCircle size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-800 m-0">Confirm Cancellation</h3>
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
    </DashboardLayout>
  );
};

export default AdminOrders;
