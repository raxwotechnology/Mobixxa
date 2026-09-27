'use client';

import { useState, useEffect } from 'react';
import { Brain, TrendingUp, TrendingDown, Minus, DollarSign, ShoppingCart, BarChart3, ArrowUp, ArrowDown, Calendar } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { adminNavGroups as navItems } from './adminNavItems';
import { getSalesPredictions } from '../../services/api';
import { toast } from 'react-toastify';

const PERIOD_OPTIONS = [
  { key: 'daily', label: 'Daily', icon: '' },
  { key: 'weekly', label: 'Weekly', icon: '' },
  { key: 'monthly', label: 'Monthly', icon: '' },
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
            <p className="text-xs font-bold uppercase tracking-wider text-brand-indigo">Analyzing {period} sales data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout navItems={navItems} title="AI Predictions">
        <div className="text-center p-12 text-xs font-bold uppercase tracking-wider text-slate-400">Failed to load prediction data</div>
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
      <div className="ds-page">
        <div className="ds-page-header">
          <div className="ds-page-header-left">
            <div className="ds-page-header-icon">
              <Brain size={20} strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="ds-page-title">AI Sales Predictions</h1>
              <p className="ds-page-subtitle">Statistical forecasting &amp; trend analysis — {period} view</p>
            </div>
          </div>

          {/* Period Selector */}
          <div className="ds-page-header-right">
            <div className="ds-tab-bar">
              {PERIOD_OPTIONS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPeriod(p.key)}
                  className={`ds-tab-btn ${period === p.key ? 'active' : ''}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="ds-stat">
            <span className="ds-stat-label">{periodLabel} Forecast</span>
            <div className="ds-stat-value text-slate-900">Rs. {data.summary.nextMonthPrediction.toLocaleString()}</div>
            <p className="ds-stat-sub">Projected gross revenue</p>
          </div>
          <div className="ds-stat">
            <span className="ds-stat-label">Avg {period === 'daily' ? 'Daily' : period === 'weekly' ? 'Weekly' : 'Monthly'}</span>
            <div className="ds-stat-value text-slate-900">Rs. {data.summary.avgMonthlyRevenue.toLocaleString()}</div>
            <p className="ds-stat-sub">Historical run rate</p>
          </div>
          <div className="ds-stat">
            <span className={`ds-stat-label ${data.growthRate >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>Growth Rate</span>
            <div className={`ds-stat-value ${data.growthRate >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {data.growthRate > 0 ? '+' : ''}{data.growthRate}%
            </div>
            <p className="ds-stat-sub">Compared to previous period</p>
          </div>
          <div className="ds-stat">
            <span className="ds-stat-label">Forecast Status</span>
            <div className="ds-stat-value text-slate-900 flex items-center gap-1.5">
              <TrendIcon size={18} className={trendColorClass} />
              <span>{trendLabel}</span>
            </div>
            <p className="ds-stat-sub">Trend trajectory</p>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="ds-card">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 pb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider m-0">Revenue — Actual vs Predicted ({period})</h3>
            <div className="flex gap-4 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-900"></span> Actual
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span> Predicted
              </span>
            </div>
          </div>
          <div className="flex items-end gap-1 h-52 overflow-x-auto pb-8 pt-4 relative">
            {allData.slice(-30).map((d, i) => (
              <div key={i} className="flex flex-col items-center flex-1 min-w-[28px] group relative">
                <div
                  className={`w-full max-w-[28px] rounded-t transition-all ${
                    d.isPrediction
                      ? 'bg-amber-400 hover:bg-amber-500'
                      : 'bg-slate-900 hover:bg-slate-800'
                  }`}
                  style={{ height: `${Math.max(4, (d.revenue / maxRevenue) * 160)}px` }}
                >
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[0.65rem] font-bold px-2 py-1 rounded pointer-events-none whitespace-nowrap transition-opacity z-10">
                    Rs. {d.revenue.toLocaleString()}
                  </div>
                </div>
                <span className="text-[0.65rem] text-slate-400 mt-2 -rotate-45 origin-top-left absolute -bottom-6 whitespace-nowrap font-medium">
                  {d.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Forecast Breakdown */}
        <div className="ds-card">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 m-0">
            {period === 'daily' ? '7-Day' : period === 'weekly' ? '4-Week' : '3-Month'} Forecast Breakdown
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {data.predictions.map((p, i) => (
              <div key={i} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-center">
                <p className="text-[0.7rem] font-bold uppercase tracking-wider text-slate-500 mb-1">{p.label}</p>
                <p className="text-sm font-bold text-slate-900 mb-1.5">Rs. {p.revenue.toLocaleString()}</p>
                <div className="flex justify-center gap-2 text-[0.7rem] font-semibold text-slate-500">
                  <span>Exp: Rs. {p.expenses.toLocaleString()}</span>
                  <span className={p.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                    ({p.profit >= 0 ? '+' : ''}{p.profit.toLocaleString()})
                  </span>
                </div>
                <p className="mt-1 text-[0.65rem] text-slate-400 font-medium">~{p.orders} orders</p>
              </div>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <div className="ds-table-wrap">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 m-0">
              {period === 'daily' ? 'Daily' : period === 'weekly' ? 'Weekly' : 'Monthly'} Data Log
            </h3>
          </div>
          <div className="overflow-x-auto max-h-[400px]">
            <table className="ds-table">
              <thead>
                <tr>
                  {['Period', 'Revenue', 'Expenses', 'Profit', 'Orders', 'Type'].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allData.slice(-30).map((d, i) => (
                  <tr key={i} className={d.isPrediction ? 'bg-amber-50/20' : ''}>
                    <td className="font-semibold text-xs text-slate-900">{d.label}</td>
                    <td className="text-xs font-medium text-slate-800">Rs. {d.revenue.toLocaleString()}</td>
                    <td className="text-xs font-medium text-rose-600">Rs. {d.expenses.toLocaleString()}</td>
                    <td className={`text-xs font-bold ${d.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      Rs. {d.profit.toLocaleString()}
                    </td>
                    <td className="text-slate-500 text-xs font-mono">{d.orders || '—'}</td>
                    <td>
                      <span className={`ds-badge ${
                        d.isPrediction ? 'ds-badge-amber' : 'ds-badge-green'
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
