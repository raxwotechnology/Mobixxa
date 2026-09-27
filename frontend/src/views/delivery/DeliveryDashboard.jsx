'use client';

import { useState, useEffect } from 'react';
import {
  Truck, Clock, DollarSign, CheckCircle, MapPin, Phone, Package, ArrowRight, Download,
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import {
  getDeliveryOrders, getDeliveryHistory, getDeliveryEarnings,
  markDeliveryPaymentSuccess, updateDeliveryStatus,
} from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/authStore';
import { getEmployeeNavGroups } from '../employee/employeeNav';
import { EmployeeStatCard, EmployeeLoading } from '../employee/EmployeePageHeader';

const statusFlow = ['assigned_delivery', 'out_for_delivery', 'delivered'];
const statusColors = {
  assigned_delivery: 'ds-badge-blue',
  out_for_delivery: 'ds-badge-amber',
  delivered: 'ds-badge-green',
  completed: 'ds-badge-green',
  cancelled: 'ds-badge-red',
};

const DeliveryDashboard = () => {
  const { user } = useAuthStore();
  const navItems = getEmployeeNavGroups(user?.role);
  const [orders, setOrders] = useState([]);
  const [history, setHistory] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, historyRes, earningsRes] = await Promise.all([
        getDeliveryOrders(),
        getDeliveryHistory(),
        getDeliveryEarnings(),
      ]);
      setOrders(ordersRes.data);
      setHistory(historyRes.data);
      setEarnings(earningsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await updateDeliveryStatus(orderId, { status: newStatus });
      toast.success(`Status updated to ${newStatus.replace(/_/g, ' ')}`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  const handlePaymentSuccess = async (orderId) => {
    try {
      await markDeliveryPaymentSuccess(orderId);
      toast.success('COD payment marked successful. Order completed.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark payment successful');
    }
  };

  const getNextStatus = (s) => {
    const i = statusFlow.indexOf(s);
    return i >= 0 && i < statusFlow.length - 1 ? statusFlow[i + 1] : null;
  };

  const weeklyData = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayDeliveries = history.filter(
      (o) =>
        o.orderStatus === 'delivered' &&
        new Date(o.updatedAt || o.createdAt).toDateString() === d.toDateString()
    );
    weeklyData.push({
      day: d.toLocaleDateString('en', { weekday: 'short' }),
      deliveries: dayDeliveries.length,
      earnings: dayDeliveries.length * 150,
    });
  }

  const exportCSV = () => {
    const rows = [
      ['Order ID', 'Customer', 'Amount', 'Status', 'Date'].join(','),
      ...history.map((o) =>
        [
          o._id.slice(-8),
          o.userId?.name || 'N/A',
          o.totalAmount?.toFixed(2),
          o.orderStatus,
          new Date(o.createdAt).toLocaleDateString(),
        ].join(',')
      ),
    ].join('\n');
    const blob = new Blob([rows], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'delivery_history.csv';
    a.click();
    toast.success('Report downloaded');
  };

  if (loading) {
    return (
      <DashboardLayout title="Delivery Dashboard">
        <EmployeeLoading />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Delivery Dashboard">
      <div className="ds-page">
        <div className="ds-page-header">
          <div className="ds-page-header-left">
            <span className="ds-page-header-badge">
              <Truck size={11} /> Delivery
            </span>
            <h1>Delivery Dashboard</h1>
            <p>{orders.length} active · {earnings?.totalDeliveries || 0} completed</p>
          </div>
          <div className="ds-page-header-right">
            {history.length > 0 && (
              <button
                onClick={exportCSV}
                className="ds-btn ds-btn-secondary"
              >
                <Download size={14} /> Export CSV
              </button>
            )}
          </div>
        </div>

        {earnings && (
          <div className="ds-stats grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <EmployeeStatCard
              label="Active Deliveries"
              value={orders.length}
              icon={Truck}
              iconBg="bg-indigo-50 border-indigo-100/60"
              iconColor="text-brand-indigo"
            />
            <EmployeeStatCard
              label="Completed Total"
              value={earnings.totalDeliveries}
              color="text-emerald-600"
              icon={CheckCircle}
              iconBg="bg-emerald-50 border-emerald-100/60"
              iconColor="text-emerald-600"
            />
            <EmployeeStatCard
              label={`This Month (${earnings.thisMonth.deliveries} trips)`}
              value={`Rs. ${earnings.thisMonth.earnings.toLocaleString()}`}
              color="text-amber-600"
              icon={DollarSign}
              iconBg="bg-amber-50 border-amber-100/60"
              iconColor="text-amber-600"
            />
            <EmployeeStatCard
              label="All-Time Earnings"
              value={`Rs. ${earnings.totalEarnings.toLocaleString()}`}
              color="text-purple-600"
              icon={DollarSign}
              iconBg="bg-purple-50 border-purple-100/60"
              iconColor="text-purple-600"
            />
          </div>
        )}

        <div className="flex gap-2 flex-wrap mb-4">
          {[
            { key: 'active', label: `Active (${orders.length})` },
            { key: 'earnings', label: 'Earnings' },
            { key: 'history', label: 'History' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all border-0 cursor-pointer ${
                tab === t.key
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white/80 text-slate-500 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'active' && (
          <div className="ds-card">
            <div className="ds-card-header">
              <h2 className="ds-card-title">Active Deliveries</h2>
            </div>
            {orders.length === 0 ? (
              <div className="ds-empty">
                <Truck size={40} className="mx-auto mb-3 text-slate-200" />
                <p>No active deliveries right now</p>
              </div>
            ) : (
              <div className="ds-table-wrap">
                <table className="ds-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer & Address</th>
                      <th>Items & Total</th>
                      <th>Status & Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const next = getNextStatus(order.orderStatus);
                      return (
                        <tr key={order._id}>
                          <td className="font-mono text-xs font-bold text-slate-600">
                            #{order._id.slice(-8).toUpperCase()}
                          </td>
                          <td>
                            {order.userId && (
                              <p className="font-bold text-slate-900 m-0">
                                {order.userId.name} {order.userId.phone && `· ${order.userId.phone}`}
                              </p>
                            )}
                            {order.deliveryAddress && (
                              <p className="text-xs text-slate-500 mt-1 m-0">
                                {order.deliveryAddress.street}, {order.deliveryAddress.city}
                              </p>
                            )}
                          </td>
                          <td>
                            <p className="text-sm font-bold text-slate-900 m-0">
                              {order.items?.length} items
                            </p>
                            <p className="text-xs font-bold text-slate-500 mt-0.5 m-0">
                              Rs. {order.totalAmount?.toFixed(2)}
                            </p>
                          </td>
                          <td>
                            <div className="flex flex-col gap-2">
                              <span className={`ds-badge w-fit ${statusColors[order.orderStatus] || 'ds-badge-slate'}`}>
                                {order.orderStatus?.replace(/_/g, ' ')}
                              </span>
                              <div className="flex gap-2 flex-wrap mt-1">
                                {next && (
                                  <button
                                    onClick={() => handleStatusUpdate(order._id, next)}
                                    className="ds-btn ds-btn-sm ds-btn-primary"
                                  >
                                    {next === 'delivered' ? 'Mark Delivered' : next.replace(/_/g, ' ')}
                                  </button>
                                )}
                                {order.paymentMethod === 'cod' &&
                                  order.orderStatus === 'delivered' &&
                                  order.paymentStatus !== 'completed' && (
                                    <button
                                      onClick={() => handlePaymentSuccess(order._id)}
                                      className="ds-btn ds-btn-sm ds-btn-primary bg-emerald-600"
                                    >
                                      Mark Payment Done
                                    </button>
                                  )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'earnings' && (
          <div className="space-y-6">
            <div className="ds-card p-6">
              <h2 className="ds-card-title mb-6">Weekly Earnings (Rs. 150/delivery)</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v, name) => (name === 'earnings' ? `Rs. ${v}` : v)}
                    contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }} iconType="circle" />
                  <Bar dataKey="deliveries" fill="#6366f1" name="Deliveries" radius={[6, 6, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="earnings" fill="#10b981" name="Earnings (Rs.)" radius={[6, 6, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="ds-stats grid sm:grid-cols-3 gap-4">
              <EmployeeStatCard
                label={`Today (${weeklyData[weeklyData.length - 1]?.deliveries || 0} deliveries)`}
                value={`Rs. ${(weeklyData[weeklyData.length - 1]?.earnings || 0).toLocaleString()}`}
              />
              <EmployeeStatCard
                label={`This Week (${weeklyData.reduce((s, d) => s + d.deliveries, 0)} deliveries)`}
                value={`Rs. ${weeklyData.reduce((s, d) => s + d.earnings, 0).toLocaleString()}`}
              />
              <EmployeeStatCard label="Rate per delivery" value="Rs. 150" color="text-emerald-600" />
            </div>
          </div>
        )}

        {tab === 'history' && (
          <div className="ds-card">
            <div className="ds-card-header flex justify-between items-center">
              <h2 className="ds-card-title m-0">Delivery History ({history.length})</h2>
              {history.length > 0 && (
                <button
                  onClick={exportCSV}
                  className="ds-btn ds-btn-sm ds-btn-secondary"
                >
                  <Download size={14} /> CSV
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <div className="ds-empty">
                <Clock size={40} className="mx-auto mb-3 text-slate-200" />
                <p>No delivery history</p>
              </div>
            ) : (
              <div className="ds-table-wrap">
                <table className="ds-table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Order ID & Customer</th>
                      <th>Date</th>
                      <th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((order) => (
                      <tr key={order._id}>
                        <td>
                          <span className={`ds-badge ${order.orderStatus === 'delivered' ? 'ds-badge-green' : 'ds-badge-red'}`}>
                            {order.orderStatus === 'delivered' ? 'Delivered' : 'Failed'}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-400">
                              #{order._id.slice(-8).toUpperCase()}
                            </span>
                            <span className="text-sm font-bold text-slate-900">{order.userId?.name}</span>
                          </div>
                        </td>
                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="text-right">
                          <p className="text-sm font-bold text-slate-900 m-0">Rs. {order.totalAmount?.toFixed(2)}</p>
                          {order.orderStatus === 'delivered' && (
                            <p className="text-xs font-bold text-emerald-600 m-0">+Rs. 150</p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DeliveryDashboard;
