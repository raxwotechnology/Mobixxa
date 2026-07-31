import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Store as StoreIcon, Tag, ShoppingBag, DollarSign, Package, TrendingUp, ArrowUpRight, ArrowDownRight, Wallet, ShieldCheck, Sparkles, Monitor, CreditCard } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { getAdminStats, getStores, getFinancialDashboard } from '../../services/api';
import { adminNavGroups as navItems } from './adminNavItems';
import useCurrencyStore from '../../store/currencyStore';
import useAdminStoreStore from '../../store/adminStoreStore';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const AdminOverview = () => {
  const [stats, setStats] = useState(null);
  const [financials, setFinancials] = useState(null);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currency } = useCurrencyStore();
  const { selectedStoreId } = useAdminStoreStore();

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const storeParam = selectedStoreId !== 'all' ? selectedStoreId : undefined;
        const [statsRes, storesRes, finRes] = await Promise.all([
          getAdminStats(storeParam),
          getStores(),
          getFinancialDashboard({ period: 'monthly', storeId: storeParam })
        ]);

        setStats(statsRes.data);
        setStores(storesRes.data.stores || storesRes.data);
        setFinancials(finRes.data);
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
      <div className="max-w-7xl mx-auto pb-10 space-y-8">
        
        {/* Executive Command Banner */}
        <div className="admin-command-banner rounded-[2rem] p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_60%)] pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest mb-3">
                <ShieldCheck size={12} /> Executive Command Center
              </span>
              <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white m-0">Enterprise Overview</h1>
              <p className="text-slate-300 text-xs md:text-sm font-semibold m-0 mt-2 max-w-xl">
                Real-time insights across store network, sales revenues, inventory assets, and group profit performance.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold text-slate-200 border border-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-live-dot" /> Live System Active
              </span>
            </div>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : (
          /* Metrics Top 5 Cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {cards.map((card) => (
              <div
                key={card.label}
                className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between enterprise-card shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className={`w-11 h-11 rounded-xl ${card.bg} border flex items-center justify-center shadow-xs`}>
                    <card.icon size={20} className={card.color} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-0.5 border border-emerald-200">
                    <ArrowUpRight size={10} /> {card.change}
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 m-0 mb-1">{card.label}</p>
                  <p className="text-xl font-black text-slate-900 truncate m-0">{card.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && financials && (
          <>
            {/* Financial Overview Matrix Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 relative overflow-hidden enterprise-card shadow-xs">
                <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 m-0 mb-1">Net Revenue</p>
                <p className="text-2xl font-black text-emerald-600 m-0">Rs. {(financials.totalRevenue || 0).toLocaleString()}</p>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 relative overflow-hidden enterprise-card shadow-xs">
                <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/5 rounded-bl-full pointer-events-none" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 m-0 mb-1">Total Expenses</p>
                <p className="text-2xl font-black text-rose-600 m-0">Rs. {(financials.totalExpenses || 0).toLocaleString()}</p>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 relative overflow-hidden enterprise-card shadow-xs">
                <div className="absolute top-0 right-0 w-20 h-20 bg-sky-500/5 rounded-bl-full pointer-events-none" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 m-0 mb-1">Other Income</p>
                <p className="text-2xl font-black text-sky-600 m-0">Rs. {(financials.totalAdditionalIncome || 0).toLocaleString()}</p>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 relative overflow-hidden enterprise-card shadow-xs">
                <div className="absolute top-0 right-0 w-20 h-20 bg-slate-900/5 rounded-bl-full pointer-events-none" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 m-0 mb-1">Net Profit</p>
                <p className={`text-2xl font-black m-0 ${(financials.netProfit || 0) >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                  Rs. {(financials.netProfit || 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Recharts Graphical Visualizations */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Bar Chart: Revenue vs Expenses */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black text-slate-900 text-base m-0">Revenue vs Expenses Breakdown</h3>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">Monthly Comparative</span>
                </div>

                {financials && Array.isArray(financials.series || financials.monthlyData) ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={financials.series || financials.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} />
                      <Tooltip formatter={(v) => `Rs. ${v.toLocaleString()}`} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                      <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 700 }} />
                      <Bar dataKey="revenue" fill="#059669" name="Revenue" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="expenses" fill="#475569" name="Expenses" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[320px] text-slate-400 font-semibold text-xs">No graphical series data found</div>
                )}
              </div>

              {/* Line Chart: Net Profit Trend */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black text-slate-900 text-base m-0">Net Profit Trend Line</h3>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">Trajectory</span>
                </div>

                {financials && Array.isArray(financials.series || financials.monthlyData) ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={financials.series || financials.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} />
                      <Tooltip formatter={(v) => `Rs. ${v.toLocaleString()}`} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                      <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 700 }} />
                      <Line type="monotone" dataKey="profit" stroke="#059669" strokeWidth={3.5} dot={{ r: 5, fill: '#059669' }} name="Net Profit" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[320px] text-slate-400 font-semibold text-xs">No trend series data found</div>
                )}
              </div>
            </div>
          </>
        )}

      </div>
    </DashboardLayout>
  );
};

export default AdminOverview;
