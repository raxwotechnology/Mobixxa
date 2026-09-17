'use client';

import { useState, useEffect } from 'react';
import { Brain, TrendingUp, TrendingDown, Minus, DollarSign, ShoppingCart, BarChart3, ArrowUp, ArrowDown, Calendar } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { adminNavGroups as navItems } from './adminNavItems';
import { getSalesPredictions } from '../../services/api';
import { toast } from 'react-toastify';

const PERIOD_OPTIONS = [
  { key: 'daily', label: 'Daily', icon: '📅' },
  { key: 'weekly', label: 'Weekly', icon: '📆' },
  { key: 'monthly', label: 'Monthly', icon: '🗓️' },
];

const AdminPredictions = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('monthly');

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await getSalesPredictions({ months: 12, period });
        setData(res.data);
      } catch (err) {
        toast.error('Failed to load predictions');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [period]);

  if (loading) {
    return (
      <DashboardLayout navItems={navItems} title="AI Predictions">
        <div className="flex items-center justify-center min-h-[400px] text-slate-400">
          <div className="text-center">
            <Brain size={48} className="text-brand-fuchsia mb-4 mx-auto animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-wider text-brand-indigo">Analyzing {period} sales data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout navItems={navItems} title="AI Predictions">
        <div className="text-center p-12 text-[10px] font-black uppercase tracking-wider text-slate-400">Failed to load prediction data</div>
      </DashboardLayout>
    );
  }

  const TrendIcon = data.trend === 'up' ? TrendingUp : data.trend === 'down' ? TrendingDown : Minus;
  const trendColorClass = data.trend === 'up' ? 'text-brand-fuchsia' : data.trend === 'down' ? 'text-rose-600' : 'text-slate-500';
  const trendBgClass = data.trend === 'up' ? 'bg-teal-50 border-teal-100/60' : data.trend === 'down' ? 'bg-rose-50 border-rose-100/60' : 'bg-slate-50';
  const trendLabel = data.trend === 'up' ? 'Growing' : data.trend === 'down' ? 'Declining' : 'Stable';
  const periodLabel = period === 'daily' ? 'Next Day' : period === 'weekly' ? 'Next Week' : 'Next Month';

  const allData = [...data.historical, ...data.predictions];
  const maxRevenue = Math.max(...allData.map((d) => d.revenue), 1);

  return (
    <DashboardLayout navItems={navItems} title="AI Predictions">
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white/40 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-brand-indigo/10 to-brand-fuchsia/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-brand-fuchsia/10 flex items-center justify-center text-brand-fuchsia">
                <Brain size={20} strokeWidth={2.5} />
              </div>
              <h1 className="text-2xl font-semibold text-slate-900 m-0">AI Sales Predictions</h1>
            </div>
            <p className="text-[10px] font-normal uppercase tracking-wider text-slate-500 mt-2 m-0">Statistical forecasting — {period} view</p>
          </div>

          {/* Period Selector */}
          <div className="flex gap-2 bg-white/40 p-2 rounded-2xl backdrop-blur-sm border border-white/40 shadow-sm w-fit">
            {PERIOD_OPTIONS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                  period === p.key ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-white hover:text-slate-900'
                }`}
              >
                <span>{p.icon}</span> {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: `${periodLabel} Forecast`, value: `Rs. ${data.summary.nextMonthPrediction.toLocaleString()}`, icon: DollarSign, colorClass: 'text-brand-fuchsia', bgClass: 'bg-teal-50/50 border border-teal-100/60' },
            { label: `Avg ${period === 'daily' ? 'Daily' : period === 'weekly' ? 'Weekly' : 'Monthly'}`, value: `Rs. ${data.summary.avgMonthlyRevenue.toLocaleString()}`, icon: BarChart3, colorClass: 'text-brand-indigo', bgClass: 'bg-slate-50/60 border border-slate-200/60' },
            { label: 'Growth Rate', value: `${data.growthRate > 0 ? '+' : ''}${data.growthRate}%`, icon: TrendIcon, colorClass: trendColorClass, bgClass: trendBgClass },
            { label: 'Forecast Status', value: trendLabel, icon: Brain, colorClass: trendColorClass, bgClass: trendBgClass },
          ].map((c, i) => (
            <div key={i} className="glass-card rounded-2xl p-6 relative overflow-hidden group">
              <div className="flex items-center gap-3 mb-3 relative">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.bgClass} ${c.colorClass}`}>
                  <c.icon size={18} strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{c.label}</span>
              </div>
              <p className={`text-2xl font-black ${c.colorClass} relative m-0`}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Revenue Chart */}
        <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/40 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Revenue — Actual vs Predicted ({period})</h3>
            <div className="flex gap-4 text-[10px] font-black uppercase tracking-wider text-slate-500">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-brand-indigo"></span> Actual
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-orange-400"></span> Predicted
              </span>
            </div>
          </div>
          <div className="flex items-end gap-1 h-52 overflow-x-auto pb-8 pt-4 relative">
            {allData.slice(-30).map((d, i) => (
              <div key={i} className="flex flex-col items-center flex-1 min-w-[28px] group relative">
                <div
                  className={`w-full max-w-[28px] rounded-t-md transition-all duration-300 ${
                    d.isPrediction
                      ? 'bg-gradient-to-t from-orange-400 to-orange-300 opacity-90'
                      : 'bg-gradient-to-t from-brand-indigo to-indigo-400'
                  } hover:opacity-100 hover:shadow-lg`}
                  style={{ height: `${Math.max(4, (d.revenue / maxRevenue) * 160)}px` }}
                >
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded-lg pointer-events-none whitespace-nowrap transition-opacity z-10">
                    Rs. {d.revenue.toLocaleString()}
                  </div>
                </div>
                <span className="text-[9px] font-black text-slate-400 mt-2 -rotate-45 origin-top-left absolute -bottom-6 whitespace-nowrap">
                  {d.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Forecast Breakdown */}
        <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/40 p-6 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-6">
            {period === 'daily' ? '7-Day' : period === 'weekly' ? '4-Week' : '3-Month'} Forecast Breakdown
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.predictions.map((p, i) => (
              <div key={i} className="bg-orange-50/50 backdrop-blur-sm rounded-2xl p-5 border border-orange-100 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-orange-400"></div>
                <p className="text-[10px] font-black uppercase tracking-wider text-orange-600 mb-2">{p.label}</p>
                <p className="text-lg font-black text-slate-900 mb-2">Rs. {p.revenue.toLocaleString()}</p>
                <div className="flex justify-center gap-3 text-[9px] font-black uppercase tracking-wider mt-3">
                  <span className="text-red-600">Exp: {p.expenses.toLocaleString()}</span>
                  <span className={p.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                    {p.profit >= 0 ? '+' : ''}{p.profit.toLocaleString()}
                  </span>
                </div>
                <p className="mt-2 text-[9px] font-black uppercase tracking-wider text-slate-400">~{p.orders} orders</p>
              </div>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-800 m-0">
              {period === 'daily' ? 'Daily' : period === 'weekly' ? 'Weekly' : 'Monthly'} Data Log
            </h3>
          </div>
          <div className="overflow-x-auto max-h-[400px]">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-100">
                <tr>
                  {['Period', 'Revenue', 'Expenses', 'Profit', 'Orders', 'Type'].map((h) => (
                    <th key={h} className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allData.slice(-30).map((d, i) => (
                  <tr key={i} className={`hover:bg-slate-50/50 transition-colors ${d.isPrediction ? 'bg-orange-50/30' : ''}`}>
                    <td className="px-6 py-4 font-bold text-slate-800">{d.label}</td>
                    <td className="px-6 py-4 font-bold text-brand-indigo">Rs. {d.revenue.toLocaleString()}</td>
                    <td className="px-6 py-4 font-bold text-red-600">Rs. {d.expenses.toLocaleString()}</td>
                    <td className={`px-6 py-4 font-bold ${d.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      Rs. {d.profit.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-mono text-xs">{d.orders || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        d.isPrediction ? 'bg-orange-100/50 text-orange-700' : 'bg-emerald-100/50 text-emerald-700'
                      }`}>
                        {d.isPrediction ? 'PREDICTED' : 'ACTUAL'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminPredictions;
