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
import EmployeePageHeader, { EmployeeStatCard, EmployeeLoading } from '../employee/EmployeePageHeader';

const statusFlow = ['assigned_delivery', 'out_for_delivery', 'delivered'];
const statusColors = {
  assigned_delivery: 'bg-purple-100 text-purple-700',
  out_for_delivery: 'bg-amber-100 text-amber-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
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
      <DashboardLayout navItems={navItems} title="Employee Portal">
        <EmployeeLoading />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} title="Employee Portal">
      <div className="animate-fade-in space-y-6">
        <EmployeePageHeader
          badge="DELIVERY OPERATIONS"
          title="Delivery Dashboard"
          subtitle={`${orders.length} active · ${earnings?.totalDeliveries || 0} completed`}
          icon={Truck}
          actions={
            history.length > 0 ? (
              <button
                onClick={exportCSV}
                className="bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-[10px] uppercase tracking-wider font-black px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Download size={14} /> Export CSV
              </button>
            ) : null
          }
        />

        {earnings && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'active', label: `Active (${orders.length})` },
            { key: 'earnings', label: 'Earnings' },
            { key: 'history', label: 'History' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all border-0 cursor-pointer ${
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
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-black text-slate-900 text-sm m-0 uppercase tracking-wider">Active Deliveries</h2>
            </div>
            {orders.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Truck size={40} className="mx-auto mb-3 text-slate-200" />
                <p className="text-[11px] font-black uppercase tracking-wider m-0">No active deliveries right now</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {orders.map((order) => {
                  const next = getNextStatus(order.orderStatus);
                  return (
                    <div key={order._id} className="p-5 hover:bg-slate-50/50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="font-mono text-[10px] font-black bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
                              #{order._id.slice(-8).toUpperCase()}
                            </span>
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${statusColors[order.orderStatus]}`}>
                              {order.orderStatus?.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <p className="text-sm font-black text-slate-900 m-0">
                            {order.items?.length} items · Rs. {order.totalAmount?.toFixed(2)}
                          </p>
                          {order.userId && (
                            <p className="text-xs text-slate-500 mt-1.5 m-0 flex items-center gap-1.5 font-semibold">
                              <Package size={12} /> {order.userId.name}
                              {order.userId.phone && (
                                <>
                                  <Phone size={12} className="ml-2" /> {order.userId.phone}
                                </>
                              )}
                            </p>
                          )}
                          {order.deliveryAddress && (
                            <p className="text-xs text-slate-500 mt-1 m-0 flex items-center gap-1.5 font-semibold">
                              <MapPin size={12} /> {order.deliveryAddress.street}, {order.deliveryAddress.city}
                            </p>
                          )}
                          <div className="flex items-center gap-1 mt-3">
                            {statusFlow.map((s, i) => (
                              <div key={s} className="flex items-center">
                                <div
                                  className={`w-2.5 h-2.5 rounded-full ${
                                    statusFlow.indexOf(order.orderStatus) >= i ? 'bg-brand-indigo' : 'bg-slate-200'
                                  }`}
                                />
                                {i < statusFlow.length - 1 && (
                                  <div
                                    className={`w-6 h-0.5 ${
                                      statusFlow.indexOf(order.orderStatus) > i ? 'bg-brand-indigo' : 'bg-slate-200'
                                    }`}
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {next && (
                            <button
                              onClick={() => handleStatusUpdate(order._id, next)}
                              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-md border-0 cursor-pointer"
                            >
                              {next === 'delivered' ? 'Mark Delivered' : next.replace(/_/g, ' ')}
                              <ArrowRight size={14} />
                            </button>
                          )}
                          {order.paymentMethod === 'cod' &&
                            order.orderStatus === 'delivered' &&
                            order.paymentStatus !== 'completed' && (
                              <button
                                onClick={() => handlePaymentSuccess(order._id)}
                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-md border-0 cursor-pointer"
                              >
                                Mark Payment Done
                              </button>
                            )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'earnings' && (
          <div className="space-y-6">
            <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/40 p-6 shadow-sm">
              <h2 className="font-black text-slate-900 text-lg mb-6 m-0">Weekly Earnings (Rs. 150/delivery)</h2>
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

            <div className="grid sm:grid-cols-3 gap-4">
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
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-black text-slate-900 text-sm m-0 uppercase tracking-wider">
                Delivery History ({history.length})
              </h2>
              {history.length > 0 && (
                <button
                  onClick={exportCSV}
                  className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded-xl border-0 cursor-pointer"
                >
                  <Download size={14} /> CSV
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Clock size={40} className="mx-auto mb-3 text-slate-200" />
                <p className="text-[11px] font-black uppercase tracking-wider m-0">No delivery history</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {history.map((order) => (
                  <div key={order._id} className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          order.orderStatus === 'delivered' ? 'bg-emerald-100' : 'bg-rose-100'
                        }`}
                      >
                        {order.orderStatus === 'delivered' ? (
                          <CheckCircle size={14} className="text-emerald-600" />
                        ) : (
                          <span className="text-rose-500 text-xs font-black">X</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-black text-slate-400">
                            #{order._id.slice(-8).toUpperCase()}
                          </span>
                          <span className="text-sm font-black text-slate-900">{order.userId?.name}</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 m-0 mt-0.5 uppercase tracking-wide">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900 m-0">Rs. {order.totalAmount?.toFixed(2)}</p>
                      {order.orderStatus === 'delivered' && (
                        <p className="text-[10px] font-black text-emerald-600 m-0">+Rs. 150</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DeliveryDashboard;
