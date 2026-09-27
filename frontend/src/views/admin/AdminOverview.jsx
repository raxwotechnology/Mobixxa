'use client';

import { useState, useEffect } from 'react';
import { Link } from '../../utils/navigation';
import { Users, Store as StoreIcon, Tag, ShoppingBag, DollarSign, Package, TrendingUp, ArrowUpRight, ArrowDownRight, Wallet, ShieldCheck, Sparkles, Monitor, CreditCard, Zap, ShoppingCart, Barcode, Clock, BarChart2, ArrowRight } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { getAdminStats, getStores, getFinancialDashboard } from '../../services/api';
import { adminNavGroups as navItems } from './adminNavItems';
import useCurrencyStore from '../../store/currencyStore';
import useAdminStoreStore from '../../store/adminStoreStore';
import useThemeStore, { THEME_ACCENTS } from '../../store/themeStore';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const AdminOverview = () => {
  const [stats, setStats] = useState(null);
  const [financials, setFinancials] = useState(null);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currency } = useCurrencyStore();
  const { selectedStoreId } = useAdminStoreStore();
  const { accent, customColor } = useThemeStore();

  const themeConfig = THEME_ACCENTS[accent] || THEME_ACCENTS.sapphire;
  const primaryColor = accent === 'custom' ? (customColor || '#2563eb') : (themeConfig.primary || '#2563eb');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const storeParam = selectedStoreId !== 'all' ? selectedStoreId : undefined;
        const [statsRes, storesRes, finRes] = await Promise.allSettled([
          getAdminStats(storeParam),
          getStores(),
          getFinancialDashboard({ period: 'monthly', storeId: storeParam })
        ]);

        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
        if (storesRes.status === 'fulfilled') setStores(storesRes.value.data.stores || storesRes.value.data);
        if (finRes.status === 'fulfilled') setFinancials(finRes.value.data);
      } catch (err) {
        console.error('Dashboard Fetch Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [selectedStoreId]);

  const cards = [
    { label: 'Total Revenue', value: `${currency} ${(stats?.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', change: '+14.2%' },
    { label: 'Total Orders', value: stats?.totalOrders || 0, icon: ShoppingBag, color: 'text-slate-800', bg: 'bg-slate-100 border-slate-200', change: '+8.5%' },
    { label: 'Products Listed', value: stats?.products || 0, icon: Package, color: 'text-slate-800', bg: 'bg-slate-100 border-slate-200', change: '+12' },
    { label: 'Active Boutiques', value: stats?.stores || 0, icon: StoreIcon, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100', change: 'Live' },
    { label: 'Total Users', value: stats?.users || 0, icon: Users, color: 'text-slate-800', bg: 'bg-slate-100 border-slate-200', change: '+5' },
  ];

  return (
    <DashboardLayout navItems={navItems} title="Overview">
      <div className="ds-page">
        
        <div className="ds-page-header">
          <div className="ds-page-header-left">
            <div className="ds-page-header-icon">
              <ShieldCheck size={20} strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="ds-page-title">Enterprise Overview</h1>
              <p className="ds-page-subtitle">
                Real-time insights across store network, sales revenues, inventory assets, and group profit performance
              </p>
            </div>
          </div>
          <div className="ds-page-header-right">
            <span className="ds-badge ds-badge-green flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live System Active
            </span>
          </div>
        </div>

        {/* Executive Quick Operations Console */}
        <div className="ds-card">
          <div className="ds-card-header">
            <h3 className="ds-card-title flex items-center gap-2">
              <Zap size={16} className="text-blue-600 fill-blue-600" /> Executive Quick Access
            </h3>
            <span className="ds-badge ds-badge-slate">Admin Shortcuts</span>
          </div>

          <div className="ds-card-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: 'Products & Inventory', desc: 'Manage stock items & categories', path: '/admin/products', icon: Package, gradient: 'linear-gradient(to bottom right, #059669, #0d9488)', badge: 'Inventory' },
                { title: 'All Sales Orders', desc: 'View customer order history', path: '/admin/orders', icon: ShoppingBag, gradient: 'linear-gradient(to bottom right, #7c3aed, #9333ea)', badge: 'Sales' },
                { title: 'Barcode Generator', desc: 'Generate & print product labels', path: '/barcode-generator', icon: Barcode, gradient: 'linear-gradient(to bottom right, #f59e0b, #ea580c)', badge: 'Labels' },
                { title: 'My Attendance & Clocking', desc: 'Clock in, break & daily logs', path: '/admin/attendance', icon: Clock, gradient: 'linear-gradient(to bottom right, #0ea5e9, #2563eb)', badge: 'Attendance' },
                { title: 'Staff & User Access', desc: 'Manage employees & permissions', path: '/admin/users', icon: Users, gradient: 'linear-gradient(to bottom right, #c026d3, #db2777)', badge: 'Users' },
                { title: 'Branch Stores', desc: 'Multi-store setup & managers', path: '/admin/stores', icon: StoreIcon, gradient: 'linear-gradient(to bottom right, #4f46e5, #2563eb)', badge: 'Stores' },
                { title: 'Payroll & Salaries', desc: 'Employee salary calculations', path: '/admin/payroll', icon: DollarSign, gradient: 'linear-gradient(to bottom right, #0d9488, #059669)', badge: 'Payroll' },
                { title: 'Profit & Loss Reports', desc: 'Revenue & margin analytics', path: '/admin/profit-reports', icon: BarChart2, gradient: 'linear-gradient(to bottom right, #e11d48, #db2777)', badge: 'Financials' },
              ].map((q) => (
                <Link
                  key={q.title}
                  to={q.path}
                  className="ds-action-card no-underline"
                >
                  <div className="ds-action-card-icon" style={{ background: q.gradient, color: '#fff' }}>
                    <q.icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="ds-action-card-label">{q.title}</span>
                      <span className="ds-badge ds-badge-slate">{q.badge}</span>
                    </div>
                    <p className="ds-action-card-sub">{q.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="ds-loading">
            <div className="ds-spinner" />
          </div>
        ) : (
          /* Metrics Top 5 Cards */
          <div className="ds-stats">
            {cards.map((card) => (
              <div key={card.label} className="ds-stat">
                <div className="flex items-center justify-between">
                  <div className={`ds-stat-icon ${card.bg}`}>
                    <card.icon size={20} className={card.color} />
                  </div>
                  <span className="ds-stat-change">
                    <ArrowUpRight size={10} /> {card.change}
                  </span>
                </div>
                <div className="mt-4">
                  <p className="ds-stat-label">{card.label}</p>
                  <p className="ds-stat-value">{card.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && financials && (
          <>
            {/* Financial Overview Matrix Cards matching reference layout */}
            <div className="ds-stats">
              <div className="ds-stat">
                <div className="ds-stat-top">
                  <div className="ds-stat-icon" style={{ background: '#f0fdf4', color: '#15803d' }}>
                    <DollarSign size={18} />
                  </div>
                  <span className="ds-stat-change up">Net Revenue</span>
                </div>
                <div className="ds-stat-bottom">
                  <p className="ds-stat-label">Net Revenue</p>
                  <p className="ds-stat-value text-emerald-600">Rs. {(financials.totalRevenue || 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="ds-stat">
                <div className="ds-stat-top">
                  <div className="ds-stat-icon" style={{ background: '#fff1f2', color: '#be123c' }}>
                    <ArrowDownRight size={18} />
                  </div>
                  <span className="ds-stat-change down">Expenses</span>
                </div>
                <div className="ds-stat-bottom">
                  <p className="ds-stat-label">Total Expenses</p>
                  <p className="ds-stat-value text-rose-600">Rs. {(financials.totalExpenses || 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="ds-stat">
                <div className="ds-stat-top">
                  <div className="ds-stat-icon" style={{ background: '#eff6ff', color: '#0284c7' }}>
                    <Wallet size={18} />
                  </div>
                  <span className="ds-stat-change blue">Secondary</span>
                </div>
                <div className="ds-stat-bottom">
                  <p className="ds-stat-label">Other Income</p>
                  <p className="ds-stat-value text-sky-600">Rs. {(financials.totalAdditionalIncome || 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="ds-stat">
                <div className="ds-stat-top">
                  <div className="ds-stat-icon" style={{ background: (financials.netProfit || 0) >= 0 ? '#f0fdf4' : '#fff1f2', color: (financials.netProfit || 0) >= 0 ? '#15803d' : '#be123c' }}>
                    <TrendingUp size={18} />
                  </div>
                  <span className={`ds-stat-change ${(financials.netProfit || 0) >= 0 ? 'up' : 'down'}`}>
                    {(financials.netProfit || 0) >= 0 ? 'Profitable' : 'Deficit'}
                  </span>
                </div>
                <div className="ds-stat-bottom">
                  <p className="ds-stat-label">Net Profit</p>
                  <p className={`ds-stat-value ${(financials.netProfit || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    Rs. {(financials.netProfit || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Recharts Graphical Visualizations */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Bar Chart: Revenue vs Expenses */}
              <div className="ds-card">
                <div className="ds-card-header">
                  <h3 className="ds-card-title">Revenue vs Expenses Breakdown</h3>
                  <span className="ds-badge ds-badge-green">Monthly Comparative</span>
                </div>

                <div className="ds-card-body">
                  {financials && Array.isArray(financials.series || financials.monthlyData) ? (
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={financials.series || financials.monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} />
                        <YAxis tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} />
                        <Tooltip formatter={(v) => `Rs. ${v.toLocaleString()}`} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                        <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 500 }} />
                        <Bar dataKey="revenue" fill="#059669" name="Revenue" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="expenses" fill="#475569" name="Expenses" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="ds-empty">No graphical series data found</div>
                  )}
                </div>
              </div>

              {/* Line Chart: Net Profit Trend */}
              <div className="ds-card">
                <div className="ds-card-header">
                  <h3 className="ds-card-title">Net Profit Trend Line</h3>
                  <span className="ds-badge ds-badge-slate">Trajectory</span>
                </div>

                <div className="ds-card-body">
                  {financials && Array.isArray(financials.series || financials.monthlyData) ? (
                    <ResponsiveContainer width="100%" height={320}>
                      <LineChart data={financials.series || financials.monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} />
                        <YAxis tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} />
                        <Tooltip formatter={(v) => `Rs. ${v.toLocaleString()}`} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                        <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 500 }} />
                        <Line type="monotone" dataKey="profit" stroke="#059669" strokeWidth={3.5} dot={{ r: 5, fill: '#059669' }} name="Net Profit" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="ds-empty">No trend series data found</div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </DashboardLayout>
  );
};

export default AdminOverview;
