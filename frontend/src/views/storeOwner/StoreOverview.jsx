'use client';

import { useState, useEffect } from 'react';
import { Package, ShoppingBag, DollarSign, Clock, TrendingUp, AlertCircle, Zap, Barcode, Users, ArrowRight, Wrench } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { getMyStoreProducts, getStoreOrders } from '../../services/api';
import { Link } from '../../utils/navigation';
import { managerNavGroups as navItems } from './managerNavItems';


const StoreOverview = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, ordersRes] = await Promise.all([
          getMyStoreProducts(),
          getStoreOrders(),
        ]);

        const products = productsRes.data.products;
        const orders = ordersRes.data;

        const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        const pendingOrders = orders.filter((o) => o.orderStatus === 'pending').length;
        const deliveredOrders = orders.filter((o) => o.orderStatus === 'delivered').length;

        setStats({
          totalProducts: products.length,
          activeProducts: products.filter((p) => p.status === 'active').length,
          totalOrders: orders.length,
          totalRevenue,
          pendingOrders,
          deliveredOrders,
        });

        setRecentOrders(orders.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout navItems={navItems} title="Manager Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-primary-blue border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const statCards = [
    { label: 'Total Products', value: stats?.totalProducts || 0, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100', change: 'Active' },
    { label: 'Total Orders', value: stats?.totalOrders || 0, icon: ShoppingBag, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100', change: '+12.4%' },
    { label: 'Total Revenue', value: `Rs. ${(stats?.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', change: '+8.2%' },
    { label: 'Pending Orders', value: stats?.pendingOrders || 0, icon: Clock, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100', change: 'Urgent' },
  ];

  const statusColors = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
    packed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    shipped: 'bg-sky-50 text-sky-700 border-sky-200',
    out_for_delivery: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <DashboardLayout navItems={navItems} title="Store Operations">
      <div className="animate-fade-in space-y-6">
        {/* Operations Control Banner */}
        <div className="manager-command-banner rounded-[2rem] p-8 text-white relative overflow-hidden shadow-lg">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.15),transparent_60%)] pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-400/30 px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest mb-3">
                <Package size={12} /> Store Operations Console
              </span>
              <h1 className="text-2xl md:text-4xl font-semibold tracking-tight text-white m-0">Store Manager Hub</h1>
              <p className="text-blue-100 text-xs md:text-sm font-normal m-0 mt-2 max-w-xl">
                Monitor live inventory stock levels, store order fulfillments, staff targets, and returns.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 bg-blue-950/80 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold text-amber-300 border border-blue-800">
                <span className="w-2 h-2 rounded-full bg-amber-400 pulse-live-dot" /> Operations Online
              </span>
            </div>
          </div>
        </div>

        {/* Quick Operations Console */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-black text-slate-900 m-0 tracking-tight flex items-center gap-2">
                <Zap size={16} className="text-amber-500 fill-amber-500" /> Quick Access
              </h3>
              <p className="text-xs font-semibold text-slate-500 m-0 mt-0.5">Instant access to key store management modules</p>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl">
              Manager Shortcuts
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'Store Inventory Stock', desc: 'Manage products & quantities', path: '/manager/inventory', icon: Package, gradient: 'from-emerald-600 to-teal-600', badge: 'Stock' },
              { title: 'Store Orders', desc: 'View customer sales & invoices', path: '/manager/orders', icon: ShoppingBag, gradient: 'from-violet-600 to-purple-600', badge: 'Orders' },
              { title: 'Barcode Label Generator', desc: 'Generate & print product barcodes', path: '/barcode-generator', icon: Barcode, gradient: 'from-amber-500 to-orange-600', badge: 'Labels' },
              { title: 'My Attendance & Team', desc: 'Clock in, break & employee logs', path: '/manager/attendance', icon: Clock, gradient: 'from-sky-500 to-blue-600', badge: 'Attendance' },
              { title: 'Store Staff & Roles', desc: 'Manage employee team roster', path: '/manager/employees', icon: Users, gradient: 'from-fuchsia-600 to-pink-600', badge: 'Staff' },
              { title: 'Customer Repair Jobs', desc: 'Track device repairs & costs', path: '/manager/repairs', icon: Wrench, gradient: 'from-orange-500 to-amber-600', badge: 'Repairs' },
            ].map((q) => (
              <Link
                key={q.title}
                to={q.path}
                className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200/70 hover:border-blue-400 bg-slate-50/50 hover:bg-white transition-all duration-300 no-underline shadow-xs hover:shadow-md hover:-translate-y-0.5 group"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${q.gradient} flex items-center justify-center text-white shadow-md flex-shrink-0 group-hover:scale-105 transition-transform`}>
                  <q.icon size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-extrabold text-sm text-slate-900 truncate group-hover:text-blue-600 transition-colors">{q.title}</span>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700 flex-shrink-0">{q.badge}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-500 truncate m-0 mt-0.5">{q.desc}</p>
                </div>
                <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {statCards.map((card) => (
            <div key={card.label} className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between enterprise-card shadow-xs">
              <div className="flex items-center justify-between">
                <div className={`w-11 h-11 rounded-xl ${card.bg} border flex items-center justify-center shadow-xs`}>
                  <card.icon size={20} className={card.color} />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-0.5 border ${
                  card.change === 'Active' || card.change.startsWith('+') ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                  card.change === 'Urgent' ? 'text-rose-700 bg-rose-50 border-rose-250 animate-pulse' : 'text-slate-600 bg-slate-50 border-slate-200'
                }`}>
                  <TrendingUp size={10} /> {card.change}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 m-0 mb-1">{card.label}</p>
                <p className="text-xl font-black text-slate-900 truncate m-0">{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-black text-slate-900 text-lg m-0">Recent Store Orders</h2>
              <p className="text-[10px] uppercase font-black tracking-wider text-slate-400 m-0 mt-1">Latest purchases placed in your store</p>
            </div>
            <Link to="/manager/orders" className="text-[10px] font-black uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl transition-all">
              View Orders
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <AlertCircle size={32} className="mx-auto mb-2 text-slate-300 animate-pulse" />
              <p className="text-xs uppercase font-black tracking-wider">No orders found yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80">
                    <th className="text-left px-6 py-4 text-[10px] uppercase font-black tracking-wider text-slate-500">Order ID</th>
                    <th className="text-left px-6 py-4 text-[10px] uppercase font-black tracking-wider text-slate-500">Customer</th>
                    <th className="text-left px-6 py-4 text-[10px] uppercase font-black tracking-wider text-slate-500">Total Amount</th>
                    <th className="text-left px-6 py-4 text-[10px] uppercase font-black tracking-wider text-slate-500">Status</th>
                    <th className="text-left px-6 py-4 text-[10px] uppercase font-black tracking-wider text-slate-500">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-slate-700">#{order._id.slice(-8).toUpperCase()}</td>
                      <td className="px-6 py-4">
                        <span className="font-extrabold text-slate-900 block text-xs">{order.userId?.name || 'Walk-in Customer'}</span>
                        {order.userId?.email && <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">{order.userId.email}</span>}
                      </td>
                      <td className="px-6 py-4 font-black text-slate-900">Rs. {(order.totalAmount || 0).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[9px] uppercase tracking-wider font-black px-2.5 py-1 rounded-md border ${statusColors[order.orderStatus] || 'bg-slate-100 text-slate-600'}`}>
                          {order.orderStatus?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[11px] text-slate-400 font-bold">{new Date(order.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StoreOverview;
