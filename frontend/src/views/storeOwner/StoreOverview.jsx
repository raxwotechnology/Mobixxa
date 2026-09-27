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
        <div className="ds-loading">
          <div className="ds-spinner" />
        </div>
      </DashboardLayout>
    );
  }

  const statCards = [
    { label: 'Total Products', value: stats?.totalProducts || 0, icon: Package, color: '#1d4ed8', bg: '#eff6ff', change: 'Catalog', badgeType: 'blue' },
    { label: 'Total Orders', value: stats?.totalOrders || 0, icon: ShoppingBag, color: '#7c3aed', bg: '#f5f3ff', change: '+12.4%', badgeType: 'neu' },
    { label: 'Total Revenue', value: `Rs. ${(stats?.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: '#15803d', bg: '#f0fdf4', change: '+8.2%', badgeType: 'up' },
    { label: 'Pending Orders', value: stats?.pendingOrders || 0, icon: Clock, color: '#be123c', bg: '#fff1f2', change: 'Pending', badgeType: 'down' },
  ];

  const statusColors = {
    pending: 'ds-badge ds-badge-amber',
    confirmed: 'ds-badge ds-badge-blue',
    packed: 'ds-badge ds-badge-blue',
    shipped: 'ds-badge ds-badge-blue',
    out_for_delivery: 'ds-badge ds-badge-blue',
    delivered: 'ds-badge ds-badge-green',
    cancelled: 'ds-badge ds-badge-red',
  };

  return (
    <DashboardLayout navItems={navItems} title="Store Operations">
      <div className="ds-page">
        {/* Operations Control Banner */}
        <div className="ds-page-header">
          <div className="ds-page-header-left">
            <span className="ds-page-header-badge">Store Manager Hub</span>
            <h1>Store Operations</h1>
            <p>
              Monitor live inventory stock levels, store order fulfillments, staff targets, and returns.
            </p>
          </div>
          <div className="ds-page-header-right">
            <span className="ds-badge ds-badge-green">
              Operations Online
            </span>
          </div>
        </div>

        {/* Stats Cards matching reference layout */}
        <div className="ds-stats">
          {statCards.map((card) => (
            <div key={card.label} className="ds-stat">
              <div className="ds-stat-top">
                <div className="ds-stat-icon" style={{ background: card.bg, color: card.color }}>
                  <card.icon size={18} />
                </div>
                <span className={`ds-stat-change ${card.badgeType}`}>{card.change}</span>
              </div>
              <div className="ds-stat-bottom">
                <p className="ds-stat-label">{card.label}</p>
                <p className="ds-stat-value">{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Operations Console */}
        <div className="ds-card">
          <div className="ds-card-header">
            <div className="ds-card-title">Quick Access</div>
          </div>
          <div className="ds-card-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: 'Store Inventory Stock', desc: 'Manage products & quantities', path: '/manager/inventory', icon: Package, bg: '#059669', badge: 'Stock' },
                { title: 'Store Orders', desc: 'View customer sales & invoices', path: '/manager/orders', icon: ShoppingBag, bg: '#7c3aed', badge: 'Orders' },
                { title: 'Barcode Label Generator', desc: 'Generate & print product barcodes', path: '/barcode-generator', icon: Barcode, bg: '#ea580c', badge: 'Labels' },
                { title: 'My Attendance & Team', desc: 'Clock in, break & employee logs', path: '/manager/attendance', icon: Clock, bg: '#2563eb', badge: 'Attendance' },
                { title: 'Store Staff & Roles', desc: 'Manage employee team roster', path: '/manager/employees', icon: Users, bg: '#db2777', badge: 'Staff' },
                { title: 'Customer Repair Jobs', desc: 'Track device repairs & costs', path: '/manager/repairs', icon: Wrench, bg: '#d97706', badge: 'Repairs' },
              ].map((q) => (
                <Link
                  key={q.title}
                  to={q.path}
                  className="ds-action-card"
                >
                  <div className="ds-action-card-icon" style={{ backgroundColor: q.bg, color: '#fff' }}>
                    <q.icon size={20} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="ds-action-card-label">{q.title}</div>
                    <div className="ds-action-card-sub">{q.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="ds-card">
          <div className="ds-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="ds-card-title">Recent Store Orders</div>
            <Link to="/manager/orders" className="ds-btn ds-btn-primary ds-btn-sm">
              View Orders
            </Link>
          </div>

          <div className="ds-card-body">
            {recentOrders.length === 0 ? (
              <div className="ds-empty">
                No orders found yet
              </div>
            ) : (
              <div className="ds-table-wrap">
                <table className="ds-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Total Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order._id}>
                        <td>#{order._id.slice(-8).toUpperCase()}</td>
                        <td>
                          <div>{order.userId?.name || 'Walk-in Customer'}</div>
                          {order.userId?.email && <div style={{ fontSize: '0.85em', color: 'var(--ds-text-muted)' }}>{order.userId.email}</div>}
                        </td>
                        <td>Rs. {(order.totalAmount || 0).toLocaleString()}</td>
                        <td>
                          <span className={statusColors[order.orderStatus] || 'ds-badge ds-badge-slate'}>
                            {order.orderStatus?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StoreOverview;
