'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, RefreshCw, FileText, Plus, Search, Package, Clock, Monitor, ShoppingBag, Wallet } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import {
  getFinancialDashboard,
  getBalanceReport,
  getTransactions,
  getPettyCashLog,
  createPettyCashEntry,
  getTaxPayments,
  createTaxPayment,
  getAccounts,
  getProfitReport,
  getCategories
} from '../../services/api';

import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from 'react-toastify';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { adminNavGroups } from './adminNavItems';
import { getFilteredManagerNavGroups } from '../storeOwner/managerNavItems';
import useAuthStore from '../../store/authStore';
import useAdminStoreStore from '../../store/adminStoreStore';

const PIE_COLORS = ['#d946a0', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16', '#a855f7', '#64748b', '#e11d48', '#0ea5e9', '#d946ef'];
const BRANDS_LIST = ['all', 'Apple', 'Samsung', 'Xiaomi', 'Oppo', 'Vivo', 'Realme', 'Huawei', 'OnePlus', 'Anker', 'JBL', 'Baseus'];

const AdminFinancials = ({ navItems: propNavItems }) => {
  const { user } = useAuthStore();
  const navItems = propNavItems || (
    user?.role === 'manager'
      ? getFilteredManagerNavGroups(user)
      : adminNavGroups
  );
  const [activeTab, setActiveTab] = useState('overview'); // overview | petty-cash | tax | profit
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('monthly'); // daily | monthly | yearly
  const [range, setRange] = useState({ startDate: '', endDate: '' });
  const { selectedStoreId } = useAdminStoreStore();
  const [transactions, setTransactions] = useState([]);

  // Accounts list (for petty cash bank transfer option)
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);

  // Petty Cash states
  const [pettyCashLogs, setPettyCashLogs] = useState([]);
  const [pettyLoading, setPettyLoading] = useState(false);
  const [pettyForm, setPettyForm] = useState({
    type: 'out', // in | out
    amount: '',
    description: '',
    referenceNo: '',
    accountId: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Income Tax states
  const [taxPayments, setTaxPayments] = useState([]);
  const [taxLoading, setTaxLoading] = useState(false);
  const [taxForm, setTaxForm] = useState({
    year: new Date().getFullYear(),
    period: 'Yearly',
    amount: '',
    referenceNo: '',
    notes: '',
    paymentDate: new Date().toISOString().split('T')[0]
  });

  // Profit Analysis states
  const [profitData, setProfitData] = useState(null);
  const [profitLoading, setProfitLoading] = useState(false);
  const [profitCategory, setProfitCategory] = useState('all');
  const [profitBrand, setProfitBrand] = useState('all');
  const [profitStartDate, setProfitStartDate] = useState('');
  const [profitEndDate, setProfitEndDate] = useState('');

  // Balance Report states
  const [balanceDate, setBalanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [balanceData, setBalanceData] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const fetchBalanceReport = async () => {
    try {
      setBalanceLoading(true);
      const params = {
        date: balanceDate,
        ...(selectedStoreId !== 'all' ? { storeId: selectedStoreId } : {})
      };
      const { data } = await getBalanceReport(params);
      setBalanceData(data);
    } catch (err) {
      toast.error('Failed to load balance report');
    } finally {
      setBalanceLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {
        period,
        ...(range.startDate ? { startDate: range.startDate } : {}),
        ...(range.endDate ? { endDate: range.endDate } : {}),
        ...(selectedStoreId !== 'all' ? { storeId: selectedStoreId } : {})
      };
      const { data } = await getFinancialDashboard(params);
      setDashboard(data);
      const { data: txData } = await getTransactions(params);
      setTransactions(txData?.transactions || []);
    } catch (err) {
      toast.error('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const { data } = await getCategories();
      setCategories(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAccounts = async () => {
    try {
      const storeParam = selectedStoreId !== 'all' ? selectedStoreId : undefined;
      const { data } = await getAccounts(storeParam ? { storeId: storeParam } : {});
      setAccounts(data || []);
    } catch (err) {
      console.error('Failed to fetch accounts', err);
    }
  };

  const fetchPettyCash = async () => {
    try {
      setPettyLoading(true);
      const params = {
        ...(selectedStoreId !== 'all' ? { storeId: selectedStoreId } : {})
      };
      const { data } = await getPettyCashLog(params);
      setPettyCashLogs(data || []);
    } catch (err) {
      toast.error('Failed to load petty cash logs');
    } finally {
      setPettyLoading(false);
    }
  };

  const fetchTaxPayments = async () => {
    try {
      setTaxLoading(true);
      const params = {
        ...(selectedStoreId !== 'all' ? { storeId: selectedStoreId } : {})
      };
      const { data } = await getTaxPayments(params);
      setTaxPayments(data || []);
    } catch (err) {
      toast.error('Failed to load tax payments');
    } finally {
      setTaxLoading(false);
    }
  };

  const fetchProfitReportData = async () => {
    try {
      setProfitLoading(true);
      const params = {
        category: profitCategory,
        brand: profitBrand,
        startDate: profitStartDate,
        endDate: profitEndDate,
        ...(selectedStoreId !== 'all' ? { storeId: selectedStoreId } : {})
      };
      const { data } = await getProfitReport(params);
      setProfitData(data);
    } catch (err) {
      toast.error('Failed to load profit analysis');
    } finally {
      setProfitLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchData();
    } else if (activeTab === 'petty-cash') {
      fetchPettyCash();
      fetchAccounts();
    } else if (activeTab === 'tax') {
      fetchTaxPayments();
    } else if (activeTab === 'profit') {
      fetchProfitReportData();
    } else if (activeTab === 'balance-report') {
      fetchBalanceReport();
    }
  }, [
    period,
    range.startDate,
    range.endDate,
    selectedStoreId,
    activeTab,
    profitCategory,
    profitBrand,
    profitStartDate,
    profitEndDate,
    balanceDate
  ]);

  const handlePettySubmit = async (e) => {
    e.preventDefault();
    if (!pettyForm.amount || Number(pettyForm.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!pettyForm.description) {
      toast.error('Description is required');
      return;
    }
    if (pettyForm.type === 'in' && !pettyForm.accountId) {
      toast.error('Please select a source bank account for transfer');
      return;
    }

    try {
      const payload = {
        ...pettyForm,
        amount: Number(pettyForm.amount),
        storeId: selectedStoreId !== 'all' ? selectedStoreId : undefined
      };
      await createPettyCashEntry(payload);
      toast.success('Petty cash logged successfully');
      setPettyForm({
        type: 'out',
        amount: '',
        description: '',
        referenceNo: '',
        accountId: '',
        date: new Date().toISOString().split('T')[0]
      });
      fetchPettyCash();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record petty cash entry');
    }
  };

  const handleTaxSubmit = async (e) => {
    e.preventDefault();
    if (!taxForm.amount || Number(taxForm.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!taxForm.year || !taxForm.period) {
      toast.error('Year and period are required');
      return;
    }

    try {
      const payload = {
        ...taxForm,
        amount: Number(taxForm.amount),
        year: Number(taxForm.year),
        storeId: selectedStoreId !== 'all' ? selectedStoreId : undefined
      };
      await createTaxPayment(payload);
      toast.success('Tax payment recorded successfully');
      setTaxForm({
        year: new Date().getFullYear(),
        period: 'Yearly',
        amount: '',
        referenceNo: '',
        notes: '',
        paymentDate: new Date().toISOString().split('T')[0]
      });
      fetchTaxPayments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record tax payment');
    }
  };

  if (loading && activeTab === 'overview') {
    return (
      <DashboardLayout navItems={navItems} title="Financials">
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-primary-blue border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const d = dashboard || {};
  const profitPositive = (d.netProfit || 0) >= 0;

  // Segment Profitability Data
  const segmentChartData = [
    {
      name: 'Mobiles',
      Revenue: d.profitSegments?.mobiles?.revenue || 0,
      Profit: d.profitSegments?.mobiles?.profit || 0
    },
    {
      name: 'Accessories',
      Revenue: d.profitSegments?.accessories?.revenue || 0,
      Profit: d.profitSegments?.accessories?.profit || 0
    },
    {
      name: 'Repairs',
      Revenue: d.profitSegments?.repairs?.revenue || 0,
      Profit: d.profitSegments?.repairs?.profit || 0
    },
    {
      name: 'Reloads',
      Revenue: d.profitSegments?.reloads?.revenue || 0,
      Profit: d.profitSegments?.reloads?.profit || 0
    }
  ];

  // Prepare pie chart data from expense categories
  const pieData = d.expenseByCategory
    ? Object.entries(d.expenseByCategory).map(([name, value], i) => ({ name, value, fill: PIE_COLORS[i % PIE_COLORS.length] }))
    : [];

  return (
    <DashboardLayout navItems={navItems} title="Financials">
      <div className="ds-page">
        {/* Header */}
        <div className="ds-page-header">
          <div>
            <h1 className="ds-page-title">Store Financials & Accounts</h1>
            <p className="ds-page-subtitle">Manage overview analytics, petty cash flow, and tax reports</p>
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            {activeTab === 'overview' && (
              <div className="flex gap-2 flex-wrap items-center">
                <select value={period} onChange={(e) => setPeriod(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold uppercase tracking-wider text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 shadow-sm cursor-pointer">
                  <option value="daily">Daily</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
                <input type="date" value={range.startDate} onChange={(e) => setRange((r) => ({ ...r, startDate: e.target.value }))} className="bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 shadow-sm" />
                <input type="date" value={range.endDate} onChange={(e) => setRange((r) => ({ ...r, endDate: e.target.value }))} className="bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 shadow-sm" />
                <button onClick={() => {
                  const monthlyExportCols = [
                    { label: 'Month', accessor: 'month' },
                    { label: 'Revenue (Rs.)', accessor: (r) => r.revenue?.toLocaleString() },
                    { label: 'Expenses (Rs.)', accessor: (r) => r.expenses?.toLocaleString() },
                    { label: 'Profit (Rs.)', accessor: (r) => r.profit?.toLocaleString() },
                  ];
                  exportToPDF(d.series || d.monthlyData || [], monthlyExportCols, 'Financial Report');
                }} className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider px-4 py-3 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-slate-900/10">
                  <FileText size={14} strokeWidth={2.5} /> PDF
                </button>
              </div>
            )}

            {activeTab === 'petty-cash' && (
              <div className="flex gap-2">
                <button onClick={() => {
                  const pettyCols = [
                    { label: 'Date', accessor: (r) => new Date(r.date).toLocaleDateString() },
                    { label: 'Type', accessor: (r) => r.type === 'in' ? 'Cash In (Bank Transfer)' : 'Cash Out (Expense)' },
                    { label: 'Amount (Rs.)', accessor: (r) => r.amount?.toLocaleString() },
                    { label: 'Description', accessor: 'description' },
                    { label: 'Ref No', accessor: (r) => r.referenceNo || '-' },

                    { label: 'Linked Account', accessor: (r) => r.accountId?.name || '-' },
                    { label: 'Logged By', accessor: (r) => r.loggedBy?.name || 'System' }
                  ];
                  exportToPDF(pettyCashLogs, pettyCols, 'Petty Cash Log');
                }} className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider px-4 py-3 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-slate-900/10">
                  <FileText size={14} strokeWidth={2.5} /> PDF
                </button>
              </div>
            )}

            {activeTab === 'tax' && (
              <div className="flex gap-2">
                <button onClick={() => {
                  const taxCols = [
                    { label: 'Date', accessor: (r) => new Date(r.paymentDate).toLocaleDateString() },
                    { label: 'Year', accessor: 'year' },
                    { label: 'Period', accessor: 'period' },
                    { label: 'Amount (Rs.)', accessor: (r) => r.amount?.toLocaleString() },
                    { label: 'Ref No', accessor: (r) => r.referenceNo || '-' },
                    { label: 'Notes', accessor: (r) => r.notes || '-' }

                  ];
                  exportToPDF(taxPayments, taxCols, 'Income Tax Payments');
                }} className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider px-4 py-3 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-slate-900/10">
                  <FileText size={14} strokeWidth={2.5} /> PDF
                </button>
              </div>
            )}

            {activeTab === 'balance-report' && (
              <div className="flex gap-2">
                <button onClick={() => {
                  if (!balanceData) return;
                  const rows = [
                    { category: 'Mobile Income', amount: `Rs. ${Number(balanceData.mobileIncome || 0).toFixed(2)}` },
                    { category: 'Accessories Income', amount: `Rs. ${Number(balanceData.accessoriesIncome || 0).toFixed(2)}` },
                    { category: 'Wholesale Income', amount: `Rs. ${Number(balanceData.wholesaleIncome || 0).toFixed(2)}` },
                    { category: 'Advance Income', amount: `Rs. ${Number(balanceData.advanceIncome || 0).toFixed(2)}` },
                    { category: 'Repairing Income (Normal)', amount: `Rs. ${Number(balanceData.repairingIncomeNormal || 0).toFixed(2)}` },
                    { category: 'Repairing Income (Company)', amount: `Rs. ${Number(balanceData.repairingIncomeCompany || 0).toFixed(2)}` },
                    { category: 'Phone/SIM Card Income', amount: `Rs. ${Number(balanceData.simCardIncome || 0).toFixed(2)}` },
                    { category: 'Reload Income', amount: `Rs. ${Number(balanceData.reloadIncome || 0).toFixed(2)}` },
                    { category: 'Service Cost', amount: `Rs. ${Number(balanceData.serviceCost || 0).toFixed(2)}` },
                    { category: 'Supplier Cost', amount: `Rs. ${Number(balanceData.supplierCost || 0).toFixed(2)}` },
                    { category: 'Total Income', amount: `Rs. ${Number(balanceData.totalIncome || 0).toFixed(2)}` },
                    { category: 'Total Cost', amount: `Rs. ${Number(balanceData.totalCost || 0).toFixed(2)}` },
                    { category: 'Balance Amount', amount: `Rs. ${Number(balanceData.balanceAmount || 0).toFixed(2)}` },
                  ];
                  const cols = [
                    { label: 'Category / Metric', accessor: 'category' },
                    { label: 'Amount', accessor: 'amount' },
                  ];
                  exportToPDF(rows, cols, `Balance Report - ${balanceDate}`);
                }} className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider px-4 py-3 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-slate-900/10">
                  <FileText size={14} strokeWidth={2.5} /> PDF Export
                </button>
              </div>
            )}

            {activeTab === 'profit' && (
              <div className="flex gap-2">
                <button onClick={() => {
                  const profitCols = [
                    { label: 'Date', accessor: (r) => new Date(r.date).toLocaleDateString() },
                    { label: 'Invoice No', accessor: 'invoiceNumber' },
                    { label: 'Item Name', accessor: 'name' },
                    { label: 'Category', accessor: 'category' },
                    { label: 'Brand', accessor: 'brand' },
                    { label: 'Cost Price', accessor: (r) => `Rs. ${r.costPrice?.toLocaleString()}` },
                    { label: 'Selling Price', accessor: (r) => `Rs. ${r.sellingPrice?.toLocaleString()}` },
                    { label: 'Qty', accessor: 'quantity' },
                    { label: 'Total Profit', accessor: (r) => `Rs. ${r.profit?.toLocaleString()}` },
                    { label: 'Margin', accessor: (r) => `${r.margin}%` }
                  ];
                  exportToPDF(profitData?.items || [], profitCols, 'Detailed Profit Report');
                }} className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider px-4 py-3 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-slate-900/10">
                  <FileText size={14} strokeWidth={2.5} /> PDF
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Selector */}
        <div className="ds-tab-bar mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`ds-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          >
            Financial Overview
          </button>
          <button
            onClick={() => setActiveTab('balance-report')}
            className={`ds-tab-btn ${activeTab === 'balance-report' ? 'active' : ''}`}
          >
            Balance Report
          </button>
          <button
            onClick={() => setActiveTab('profit')}
            className={`ds-tab-btn ${activeTab === 'profit' ? 'active' : ''}`}
          >
            Profit Reports
          </button>
          <button
            onClick={() => setActiveTab('petty-cash')}
            className={`ds-tab-btn ${activeTab === 'petty-cash' ? 'active' : ''}`}
          >
            Petty Cash Log
          </button>
          <button
            onClick={() => setActiveTab('tax')}
            className={`ds-tab-btn ${activeTab === 'tax' ? 'active' : ''}`}
          >
            Income Tax Management
          </button>
        </div>

        {/* TAB 1: FINANCIAL OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            {/* KPI Cards */}
            {/* KPI Cards matching enterprise reference layout */}
            <div className="ds-stats mb-6">
              <div className="ds-stat">
                <div className="ds-stat-top">
                  <div className="ds-stat-icon" style={{ background: '#f0fdf4', color: '#15803d' }}>
                    <DollarSign size={18} />
                  </div>
                  <span className="ds-stat-change up">Gross</span>
                </div>
                <div className="ds-stat-bottom">
                  <p className="ds-stat-label">Total Revenue</p>
                  <p className="ds-stat-value text-emerald-600">Rs. {(d.totalRevenue || 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="ds-stat">
                <div className="ds-stat-top">
                  <div className="ds-stat-icon" style={{ background: '#fff1f2', color: '#be123c' }}>
                    <TrendingDown size={18} />
                  </div>
                  <span className="ds-stat-change down">Expenses</span>
                </div>
                <div className="ds-stat-bottom">
                  <p className="ds-stat-label">Total Expenses</p>
                  <p className="ds-stat-value text-rose-600">Rs. {(d.totalExpenses || 0).toLocaleString()}</p>
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
                  <p className="ds-stat-value text-sky-600">Rs. {(d.totalAdditionalIncome || 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="ds-stat">
                <div className="ds-stat-top">
                  <div className="ds-stat-icon" style={{ background: profitPositive ? '#f0fdf4' : '#fff1f2', color: profitPositive ? '#15803d' : '#be123c' }}>
                    <TrendingUp size={18} />
                  </div>
                  <span className={`ds-stat-change ${profitPositive ? 'up' : 'down'}`}>
                    {profitPositive ? 'Profitable' : 'Deficit'}
                  </span>
                </div>
                <div className="ds-stat-bottom">
                  <p className="ds-stat-label">Net {profitPositive ? 'Profit' : 'Loss'}</p>
                  <p className={`ds-stat-value ${profitPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                    Rs. {Math.abs(d.netProfit || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="ds-stat">
                <div className="ds-stat-top">
                  <div className="ds-stat-icon" style={{ background: '#fffbeb', color: '#b45309' }}>
                    <Clock size={18} />
                  </div>
                  <span className="ds-stat-change amber">Payable</span>
                </div>
                <div className="ds-stat-bottom">
                  <p className="ds-stat-label">Pending Bills</p>
                  <p className="ds-stat-value text-amber-600">Rs. {(d.pendingExpenses || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="ds-stats mb-6">
              <div className="ds-stat">
                <div className="ds-stat-top">
                  <div className="ds-stat-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                    <Package size={18} />
                  </div>
                  <span className="ds-stat-change neu">Invoiced</span>
                </div>
                <div className="ds-stat-bottom">
                  <p className="ds-stat-label">Items Sold</p>
                  <p className="ds-stat-value">{(d.totalItemsSold || 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="ds-stat">
                <div className="ds-stat-top">
                  <div className="ds-stat-icon" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                    <Monitor size={18} />
                  </div>
                  <span className="ds-stat-change blue">Walk-In</span>
                </div>
                <div className="ds-stat-bottom">
                  <p className="ds-stat-label">POS Counter Sales</p>
                  <p className="ds-stat-value text-blue-600">Rs. {(d.posRevenue || 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="ds-stat">
                <div className="ds-stat-top">
                  <div className="ds-stat-icon" style={{ background: '#f0fdf4', color: '#15803d' }}>
                    <ShoppingBag size={18} />
                  </div>
                  <span className="ds-stat-change up">Online</span>
                </div>
                <div className="ds-stat-bottom">
                  <p className="ds-stat-label">Online Store Sales</p>
                  <p className="ds-stat-value text-emerald-600">Rs. {(d.onlineRevenue || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Segment Margin Comparison Charts */}
            <div className="grid lg:grid-cols-3 gap-6 mb-8">
              {/* Product Segments Chart */}
              <div className="glass-card rounded-2xl p-6 lg:col-span-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-fuchsia/5 rounded-bl-[100px] pointer-events-none -z-10"></div>
                <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2"> Mobiles vs Accessories gross margins</h2>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6">Gross margins for product departments</p>
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={segmentChartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} dx={-10} tickFormatter={(v) => `Rs.${v/1000}k`} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', padding: '16px', fontWeight: 'bold', fontSize: '12px' }}
                        cursor={{fill: '#f8fafc'}}
                        formatter={(v) => `Rs. ${v.toLocaleString()}`} 
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 'bold', color: '#64748b' }} />
                      <Bar dataKey="Revenue" fill="#0d9488" radius={[6, 6, 0, 0]} maxBarSize={40} />
                      <Bar dataKey="Profit" fill="#334155" radius={[6, 6, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
                  {/* Segment margin list */}
              <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-fuchsia/5 rounded-bl-[100px] pointer-events-none -z-10"></div>
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"> Department Stream Gross Margins</h2>
                <div className="space-y-3">
                  {['mobiles', 'accessories', 'repairs', 'reloads'].map((seg) => {
                    const rev = d.profitSegments?.[seg]?.revenue || 0;
                    const prof = d.profitSegments?.[seg]?.profit || 0;
                    const marginPct = rev > 0 ? ((prof / rev) * 100).toFixed(1) : '0.0';
                    return (
                      <div key={seg} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                        <h3 className="capitalize font-bold text-xs text-slate-900 mb-2">{seg}</h3>
                        <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Revenue</span>
                            <span className="font-bold text-slate-700">Rs. {rev.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-brand-fuchsia block">Profit</span>
                            <span className="font-bold text-brand-fuchsia">Rs. {prof.toLocaleString()}</span>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1 font-bold">
                            <span className="text-slate-500">Margin</span>
                            <span className="text-brand-fuchsia">{marginPct}%</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-brand-fuchsia h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(marginPct, 100)}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Original Charts Row */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {/* Monthly Trend */}
              <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-fuchsia/5 rounded-bl-[100px] pointer-events-none -z-10"></div>
                <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2"> Monthly Trend</h2>
                {(d.series || d.monthlyData) && (
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={d.series || d.monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
                        <YAxis tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} dx={-10} tickFormatter={(v) => `Rs.${v/1000}k`} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', padding: '16px', fontWeight: 'bold', fontSize: '12px' }}
                          cursor={{fill: '#f8fafc'}}
                          formatter={(v) => `Rs. ${v.toLocaleString()}`} 
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 'bold', color: '#64748b' }} />
                        <Bar dataKey="revenue" fill="#334155" name="Revenue" radius={[6, 6, 0, 0]} maxBarSize={30} />
                        <Bar dataKey="expenses" fill="#f43f5e" name="Expenses" radius={[6, 6, 0, 0]} maxBarSize={30} />
                        <Bar dataKey="profit" fill="#0d9488" name="Profit" radius={[6, 6, 0, 0]} maxBarSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Expense Breakdown */}
              <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-fuchsia/5 rounded-bl-[100px] pointer-events-none -z-10"></div>
                <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2"> Expense Breakdown</h2>
                {pieData.length > 0 ? (
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={2} dataKey="value" stroke="none"
                          labelLine={false} label={({ name, percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : null}>
                          {pieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', padding: '16px', fontWeight: 'bold', fontSize: '12px' }}
                          formatter={(v) => `Rs. ${v.toLocaleString()}`} 
                        />
                        <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[280px] text-xs font-bold uppercase tracking-wider text-slate-400">No expense data</div>
                )}
              </div>
            </div>

            {/* Profit/Loss Trend Line */}
            {(d.series || d.monthlyData) && (
              <div className="glass-card rounded-2xl p-6 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-bl-[100px] pointer-events-none -z-10"></div>
                <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2"> Profit Trend</h2>
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={d.series || d.monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} dx={-10} tickFormatter={(v) => `Rs.${v/1000}k`} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', padding: '16px', fontWeight: 'bold', fontSize: '12px' }}
                        formatter={(v) => `Rs. ${v.toLocaleString()}`} 
                      />
                      <Line type="monotone" dataKey="profit" stroke="#0d9488" strokeWidth={4} dot={{ r: 6, strokeWidth: 2, fill: '#fff', stroke: '#0d9488' }} activeDot={{ r: 8, strokeWidth: 0, fill: '#0d9488' }} name="Net Profit" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DETAILED PROFIT REPORTS */}
        {activeTab === 'profit' && (
          <div>
            {/* Filter Section */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 mb-6 shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2">Category Type</label>
                  <div className="relative">
                    <select
                      value={profitCategory}
                      onChange={(e) => setProfitCategory(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 appearance-none shadow-sm cursor-pointer"
                    >
                      <option value="all">All Category Types</option>
                      <option value="mobiles">Mobiles (Phones/Tablets)</option>
                      <option value="accessories">Accessories</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2">Brand Filter</label>
                  <div className="relative">
                    <select
                      value={profitBrand}
                      onChange={(e) => setProfitBrand(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 appearance-none shadow-sm cursor-pointer"
                    >
                      <option value="all">All Brands</option>
                      {BRANDS_LIST.slice(1).map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2">From Date</label>
                  <input
                    type="date"
                    value={profitStartDate}
                    onChange={(e) => setProfitStartDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 shadow-sm"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2">To Date</label>
                  <input
                    type="date"
                    value={profitEndDate}
                    onChange={(e) => setProfitEndDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Profit KPI Summary Cards */}
            {profitData?.summary && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[100px] pointer-events-none -z-10 group-hover:scale-110 transition-transform"></div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">Rs. {profitData.summary.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[100px] pointer-events-none -z-10 group-hover:scale-110 transition-transform"></div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Cost of Goods Sold</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">Rs. {profitData.summary.totalCost.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-3xl border border-emerald-100 p-6 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-[100px] pointer-events-none -z-10 group-hover:scale-110 transition-transform"></div>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">Total Gross Profit</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-2 tracking-tight">Rs. {profitData.summary.totalProfit.toLocaleString()}</p>
                </div>
                <div className="bg-brand-indigo/5 rounded-3xl border border-brand-indigo/10 p-6 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-indigo/10 rounded-bl-[100px] pointer-events-none -z-10 group-hover:scale-110 transition-transform"></div>
                  <p className="text-xs font-bold uppercase tracking-wider text-brand-indigo mb-1">Gross profit margin</p>
                  <p className="text-2xl font-bold text-brand-indigo mt-2 tracking-tight">{profitData.summary.profitMargin}%</p>
                </div>
              </div>
            )}

            {/* Grouped charts */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {/* Category Profit Chart */}
              <div className="bg-white rounded-2xl border border-card-border p-5 shadow-sm">
                <h3 className="font-semibold text-dark-navy mb-3 text-xs uppercase tracking-wider">Gross Profit by Category</h3>
                {profitData?.byCategory?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={profitData.byCategory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(v) => `Rs. ${v.toLocaleString()}`} />
                      <Legend />
                      <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="profit" fill="#10b981" name="Gross Profit" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-40 flex items-center justify-center text-xs text-muted-text">No category data</div>
                )}
              </div>

              {/* Brand Profit Chart */}
              <div className="bg-white rounded-2xl border border-card-border p-5 shadow-sm">
                <h3 className="font-semibold text-dark-navy mb-3 text-xs uppercase tracking-wider">Gross Profit by Brand</h3>
                {profitData?.byBrand?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={profitData.byBrand}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(v) => `Rs. ${v.toLocaleString()}`} />
                      <Legend />
                      <Bar dataKey="revenue" fill="#8b5cf6" name="Revenue" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="profit" fill="#10b981" name="Gross Profit" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-40 flex items-center justify-center text-xs text-muted-text">No brand data</div>
                )}
              </div>
            </div>

            {/* Profit breakdown list */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm overflow-hidden">
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center justify-between">
                <span className="flex items-center gap-2"> Detailed Items Profit breakdown</span>
                {profitLoading && <span className="text-xs font-bold uppercase tracking-wider text-brand-indigo animate-pulse">Refreshing...</span>}
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-xs uppercase font-bold tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-5">Date</th>
                      <th className="px-4 py-5">Invoice</th>
                      <th className="px-4 py-5">Product Name</th>
                      <th className="px-4 py-5">Category</th>
                      <th className="px-4 py-5">Brand</th>
                      <th className="px-4 py-5 text-right">Cost (Rs.)</th>
                      <th className="px-4 py-5 text-right">Selling (Rs.)</th>
                      <th className="px-4 py-5 text-center">Qty</th>
                      <th className="px-4 py-5 text-right">Gross Profit</th>
                      <th className="px-6 py-5 text-right">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {profitLoading ? (
                      <tr>
                        <td colSpan="10" className="py-20 text-center text-xs font-bold uppercase tracking-wider text-slate-400">Loading profit records...</td>
                      </tr>
                    ) : !profitData?.items?.length ? (
                      <tr>
                        <td colSpan="10" className="py-20 text-center text-xs font-bold uppercase tracking-wider text-slate-400">No profit records matched selected criteria</td>
                      </tr>
                    ) : (
                      profitData.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 text-xs font-bold text-slate-600">{new Date(item.date).toLocaleDateString()}</td>
                          <td className="px-4 py-4 text-xs font-bold text-brand-indigo">#{item.invoiceNumber}</td>
                          <td className="px-4 py-4 text-xs font-bold text-slate-800">{item.name}</td>
                          <td className="px-4 py-4 text-xs font-bold text-slate-500">{item.category}</td>
                          <td className="px-4 py-4 text-xs font-bold text-slate-500">{item.brand}</td>
                          <td className="px-4 py-4 text-right text-xs font-bold text-slate-600">Rs. {item.costPrice.toLocaleString()}</td>
                          <td className="px-4 py-4 text-right text-xs font-bold text-slate-900">Rs. {item.sellingPrice.toLocaleString()}</td>
                          <td className="px-4 py-4 text-center text-xs font-bold text-slate-900 bg-slate-50/50">{item.quantity}</td>
                          <td className="px-4 py-4 text-right font-bold text-emerald-600 text-sm tracking-tight">Rs. {item.profit.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right font-bold text-brand-indigo text-xs">
                            <span className="bg-brand-indigo/10 text-brand-indigo px-2 py-1 rounded-md">{item.margin}%</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PETTY CASH LOG */}
        {activeTab === 'petty-cash' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Petty Cash Form */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm h-fit relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-indigo/5 rounded-bl-[100px] pointer-events-none -z-10"></div>
              <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-indigo/10 flex items-center justify-center text-brand-indigo">
                  <Plus size={18} strokeWidth={2.5} />
                </div>
                Log Petty Cash
              </h2>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6">Record standard cash expenses or cash draws from bank accounts</p>

              <form onSubmit={handlePettySubmit} className="space-y-5">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Transaction Type</label>
                  <select
                    value={pettyForm.type}
                    onChange={(e) => setPettyForm({ ...pettyForm, type: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 shadow-sm cursor-pointer"
                  >
                    <option value="out">Cash Out (Expense/Drawdown)</option>
                    <option value="in">Cash In (Bank Transfer / Double Entry)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Amount (Rs.)</label>
                  <input
                    type="number"
                    value={pettyForm.amount}
                    onChange={(e) => setPettyForm({ ...pettyForm, amount: e.target.value })}
                    placeholder="e.g. 1500"
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 shadow-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Description / Purpose</label>
                  <input
                    type="text"
                    value={pettyForm.description}
                    onChange={(e) => setPettyForm({ ...pettyForm, description: e.target.value })}
                    placeholder="e.g. Tea & Refreshments, Office Staples"
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 shadow-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Reference / Bill No</label>
                  <input
                    type="text"
                    value={pettyForm.referenceNo}
                    onChange={(e) => setPettyForm({ ...pettyForm, referenceNo: e.target.value })}
                    placeholder="e.g. REF-48192"
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 shadow-sm"
                  />
                </div>

                {pettyForm.type === 'in' && (
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Source Bank Account</label>
                    <select
                      value={pettyForm.accountId}
                      onChange={(e) => setPettyForm({ ...pettyForm, accountId: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 shadow-sm cursor-pointer mb-2"
                    >
                      <option value="">-- Choose Account --</option>
                      {accounts.map((acc) => (
                        <option key={acc._id} value={acc._id}>{acc.name} (Type: {acc.type})</option>
                      ))}
                    </select>
                    <p className="text-xs font-bold text-brand-indigo bg-brand-indigo/5 p-2 rounded-lg border border-brand-indigo/10">This will automatically transfer funds from selected ledger bank account to the Cash account.</p>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Date</label>
                  <input
                    type="date"
                    value={pettyForm.date}
                    onChange={(e) => setPettyForm({ ...pettyForm, date: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 shadow-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider py-3.5 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl mt-4"
                >
                  Log Transaction
                </button>
              </form>
            </div>

            {/* Petty Cash Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm lg:col-span-2 overflow-hidden flex flex-col h-full">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                   Petty Cash Ledger Logs
                </h2>
                {pettyLoading && <span className="text-xs font-bold uppercase tracking-wider text-brand-indigo animate-pulse">Refreshing...</span>}
              </div>

              <div className="overflow-x-auto flex-1 p-0">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-xs uppercase font-bold tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-5">Date</th>
                      <th className="px-4 py-5">Type</th>
                      <th className="px-4 py-5">Ref</th>
                      <th className="px-4 py-5">Description</th>
                      <th className="px-4 py-5">Linked Account</th>
                      <th className="px-4 py-5">Logged By</th>
                      <th className="px-6 py-5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pettyLoading ? (
                      <tr>
                        <td colSpan="7" className="py-20 text-center text-xs font-bold uppercase tracking-wider text-slate-400">Loading petty cash logs...</td>
                      </tr>
                    ) : pettyCashLogs.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-20 text-center text-xs font-bold uppercase tracking-wider text-slate-400">No petty cash records registered</td>
                      </tr>
                    ) : (
                      pettyCashLogs.map((log) => (
                        <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 text-xs font-bold text-slate-600">{new Date(log.date || log.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${log.type === 'in' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                              {log.type === 'in' ? 'Cash In' : 'Cash Out'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-xs font-bold text-slate-500">{log.referenceNo || '-'}</td>
                          <td className="px-4 py-4 text-xs font-bold text-slate-800">{log.description}</td>
                          <td className="px-4 py-4 text-xs font-bold text-slate-500">{log.accountId?.name || 'Cash Account'}</td>
                          <td className="px-4 py-4 text-xs font-bold text-slate-600">{log.loggedBy?.name || 'System'}</td>
                          <td className={`px-6 py-4 text-right font-bold tracking-tight text-sm ${log.type === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {log.type === 'in' ? '+' : '-'} Rs. {log.amount.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: INCOME TAX MANAGEMENT */}
        {activeTab === 'tax' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Tax Payment Form */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm h-fit relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-indigo/5 rounded-bl-[100px] pointer-events-none -z-10"></div>
              <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-indigo/10 flex items-center justify-center text-brand-indigo">
                  <Plus size={18} strokeWidth={2.5} />
                </div>
                Log Tax Payment
              </h2>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6">Record state tax payouts and periodic government settlements</p>

              <form onSubmit={handleTaxSubmit} className="space-y-5">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Tax Year</label>
                  <input
                    type="number"
                    value={taxForm.year}
                    onChange={(e) => setTaxForm({ ...taxForm, year: e.target.value })}
                    placeholder="e.g. 2026"
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 shadow-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Period</label>
                  <select
                    value={taxForm.period}
                    onChange={(e) => setTaxForm({ ...taxForm, period: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 shadow-sm cursor-pointer"
                  >
                    <option value="Yearly">Yearly (Full Year)</option>
                    <option value="Q1">Q1 (Jan - Mar)</option>
                    <option value="Q2">Q2 (Apr - Jun)</option>
                    <option value="Q3">Q3 (Jul - Sep)</option>
                    <option value="Q4">Q4 (Oct - Dec)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Amount paid (Rs.)</label>
                  <input
                    type="number"
                    value={taxForm.amount}
                    onChange={(e) => setTaxForm({ ...taxForm, amount: e.target.value })}
                    placeholder="e.g. 250000"
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 shadow-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Challan / Receipt Reference No</label>
                  <input
                    type="text"
                    value={taxForm.referenceNo}
                    onChange={(e) => setTaxForm({ ...taxForm, referenceNo: e.target.value })}
                    placeholder="e.g. TAX-2026-CHAL92"
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 shadow-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Notes / Internal Comments</label>
                  <input
                    type="text"
                    value={taxForm.notes}
                    onChange={(e) => setTaxForm({ ...taxForm, notes: e.target.value })}
                    placeholder="e.g. Settlement of corporate income tax"
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 shadow-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Payment Date</label>
                  <input
                    type="date"
                    value={taxForm.paymentDate}
                    onChange={(e) => setTaxForm({ ...taxForm, paymentDate: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 shadow-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider py-3.5 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl mt-4"
                >
                  Save Tax Record
                </button>
              </form>
            </div>

            {/* Tax Payments Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm lg:col-span-2 overflow-hidden flex flex-col h-full">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                   Income Tax Payments Ledger
                </h2>
                {taxLoading && <span className="text-xs font-bold uppercase tracking-wider text-brand-indigo animate-pulse">Refreshing...</span>}
              </div>

              <div className="overflow-x-auto flex-1 p-0">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-xs uppercase font-bold tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-5">Payment Date</th>
                      <th className="px-4 py-5">Year</th>
                      <th className="px-4 py-5">Period</th>
                      <th className="px-4 py-5">Receipt Ref</th>
                      <th className="px-4 py-5">Logged By</th>
                      <th className="px-4 py-5">Notes</th>
                      <th className="px-6 py-5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {taxLoading ? (
                      <tr>
                        <td colSpan="7" className="py-20 text-center text-xs font-bold uppercase tracking-wider text-slate-400">Loading tax payments...</td>
                      </tr>
                    ) : taxPayments.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-20 text-center text-xs font-bold uppercase tracking-wider text-slate-400">No corporate tax records filed</td>
                      </tr>
                    ) : (
                      taxPayments.map((tp) => (
                        <tr key={tp._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 text-xs font-bold text-slate-600">{new Date(tp.paymentDate).toLocaleDateString()}</td>
                          <td className="px-4 py-4 text-xs font-bold text-slate-900">{tp.year}</td>
                          <td className="px-4 py-4">
                            <span className="bg-brand-indigo/10 text-brand-indigo border border-brand-indigo/20 px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                              {tp.period}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-xs font-bold text-slate-500">{tp.referenceNo || '-'}</td>
                          <td className="px-4 py-4 text-xs font-bold text-slate-600">{tp.createdBy?.name || 'System'}</td>
                          <td className="px-4 py-4 text-xs text-slate-500 truncate max-w-[150px]">{tp.notes || '-'}</td>
                          <td className="px-6 py-4 text-right font-bold text-rose-600 text-sm tracking-tight">
                            Rs. {tp.amount.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* BALANCE REPORT TAB */}
        {activeTab === 'balance-report' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 text-slate-900 border border-slate-100 shadow-sm space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-fuchsia/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

            {/* Header & Date Picker */}
            <div className="border-b border-slate-100 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-brand-fuchsia/10 flex items-center justify-center text-brand-fuchsia">
                    <span className="text-lg"></span>
                  </div>
                  BALANCE REPORT
                </h2>
                <p className="text-xs font-bold text-slate-500 mt-1">Real-time Daily Income, Costs, and Net Balance Summary</p>
              </div>

              {/* Date Filter, Search & PDF Export */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200/80 shadow-sm">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-2">DATE</span>
                  <input
                    type="date"
                    value={balanceDate}
                    onChange={(e) => setBalanceDate(e.target.value)}
                    className="bg-white text-slate-800 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 cursor-pointer shadow-sm"
                  />
                  <button
                    onClick={fetchBalanceReport}
                    className="bg-brand-indigo hover:bg-brand-indigo/90 text-white p-2 rounded-xl transition-all shadow-sm flex items-center justify-center font-bold"
                    title="Search Balance Report"
                  >
                    <Search size={16} strokeWidth={2.5} />
                  </button>
                </div>

                <button
                  onClick={() => {
                    if (!balanceData) return;
                    const rows = [
                      { category: 'Mobile Income', amount: `Rs. ${Number(balanceData.mobileIncome || 0).toFixed(2)}` },
                      { category: 'Accessories Income', amount: `Rs. ${Number(balanceData.accessoriesIncome || 0).toFixed(2)}` },
                      { category: 'Wholesale Income', amount: `Rs. ${Number(balanceData.wholesaleIncome || 0).toFixed(2)}` },
                      { category: 'Advance Income', amount: `Rs. ${Number(balanceData.advanceIncome || 0).toFixed(2)}` },
                      { category: 'Repairing Income (Normal)', amount: `Rs. ${Number(balanceData.repairingIncomeNormal || 0).toFixed(2)}` },
                      { category: 'Repairing Income (Company)', amount: `Rs. ${Number(balanceData.repairingIncomeCompany || 0).toFixed(2)}` },
                      { category: 'Phone/SIM Card Income', amount: `Rs. ${Number(balanceData.simCardIncome || 0).toFixed(2)}` },
                      { category: 'Reload Income', amount: `Rs. ${Number(balanceData.reloadIncome || 0).toFixed(2)}` },
                      { category: 'Service Cost', amount: `Rs. ${Number(balanceData.serviceCost || 0).toFixed(2)}` },
                      { category: 'Supplier Cost', amount: `Rs. ${Number(balanceData.supplierCost || 0).toFixed(2)}` },
                      { category: 'Total Income', amount: `Rs. ${Number(balanceData.totalIncome || 0).toFixed(2)}` },
                      { category: 'Total Cost', amount: `Rs. ${Number(balanceData.totalCost || 0).toFixed(2)}` },
                      { category: 'Balance Amount', amount: `Rs. ${Number(balanceData.balanceAmount || 0).toFixed(2)}` },
                    ];
                    const cols = [
                      { label: 'Category / Metric', accessor: 'category' },
                      { label: 'Amount', accessor: 'amount' },
                    ];
                    exportToPDF(rows, cols, `Balance Report - ${balanceDate}`);
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider px-4 py-3 rounded-xl transition-all flex items-center gap-2 shadow-sm"
                >
                  <FileText size={14} strokeWidth={2.5} /> Export PDF
                </button>
              </div>
            </div>

            {balanceLoading ? (
              <div className="py-20 text-center text-slate-400 font-bold text-sm animate-pulse">
                Fetching Balance Report Data...
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6 pt-2 font-mono">
                {/* Left Column: Income Categories */}
                <div className="space-y-4">
                  {/* MOBILE INCOME */}
                  <div className="bg-slate-50/80 p-4.5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
                    <div className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-1.5">MOBILE INCOME</div>
                    <div className="text-lg font-bold text-emerald-600">
                      Rs. {Number(balanceData?.mobileIncome || 0).toFixed(2)}
                    </div>
                  </div>

                  {/* ACCESSORIES INCOME */}
                  <div className="bg-slate-50/80 p-4.5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
                    <div className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-1.5">ACCESSORIES INCOME</div>
                    <div className="text-lg font-bold text-emerald-600">
                      Rs. {Number(balanceData?.accessoriesIncome || 0).toFixed(2)}
                    </div>
                  </div>

                  {/* WHOLESALE | ADVANCE INCOME */}
                  <div className="bg-slate-50/80 p-4.5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
                    <div className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-1.5">WHOLESALE | ADVANCE INCOME</div>
                    <div className="text-lg font-bold text-emerald-600 flex items-center gap-4 flex-wrap">
                      <span>Rs. {Number(balanceData?.wholesaleIncome || 0).toFixed(2)}</span>
                      <span className="text-slate-300">|</span>
                      <span>Rs. {Number(balanceData?.advanceIncome || 0).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* REPAIRING INCOME (Normal | Company) */}
                  <div className="bg-slate-50/80 p-4.5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
                    <div className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-1.5">REPAIRING INCOME (Normal | Company)</div>
                    <div className="text-lg font-bold text-emerald-600 flex items-center gap-4 flex-wrap">
                      <span>Rs. {Number(balanceData?.repairingIncomeNormal || 0).toFixed(2)}</span>
                      <span className="text-slate-300">|</span>
                      <span>Rs. {Number(balanceData?.repairingIncomeCompany || 0).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* PHONE CARD | SIM CARD INCOME */}
                  <div className="bg-slate-50/80 p-4.5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
                    <div className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-1.5">PHONE CARD | SIM CARD INCOME</div>
                    <div className="text-lg font-bold text-emerald-600 flex items-center gap-4 flex-wrap">
                      <span>Rs. {Number(balanceData?.simCardIncome || 0).toFixed(2)}</span>
                      <span className="text-slate-300">|</span>
                      <span>Rs. 00.00</span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Costs & Totals */}
                <div className="space-y-4">
                  {/* RELOAD INCOME */}
                  <div className="bg-slate-50/80 p-4.5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
                    <div className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-1.5">RELOAD INCOME</div>
                    <div className="text-lg font-bold text-emerald-600">
                      Rs. {Number(balanceData?.reloadIncome || 0).toFixed(2)}
                    </div>
                  </div>

                  {/* SERVICE COST */}
                  <div className="bg-slate-50/80 p-4.5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
                    <div className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-1.5">SERVICE COST</div>
                    <div className="text-lg font-bold text-rose-600">
                      Rs. {Number(balanceData?.serviceCost || 0).toFixed(2)}
                    </div>
                  </div>

                  {/* SUPPLIER COST */}
                  <div className="bg-slate-50/80 p-4.5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
                    <div className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-1.5">SUPPLIER COST</div>
                    <div className="text-lg font-bold text-rose-600">
                      Rs. {Number(balanceData?.supplierCost || 0).toFixed(2)}
                    </div>
                  </div>

                  {/* TOTAL INCOME */}
                  <div className="bg-emerald-50/60 p-4.5 rounded-2xl border border-emerald-200/80 shadow-sm">
                    <div className="text-xs font-bold uppercase text-emerald-700 tracking-wider mb-1.5">TOTAL INCOME</div>
                    <div className="text-xl font-bold text-emerald-700">
                      Rs. {Number(balanceData?.totalIncome || 0).toFixed(2)}
                    </div>
                  </div>

                  {/* TOTAL COST */}
                  <div className="bg-rose-50/60 p-4.5 rounded-2xl border border-rose-200/80 shadow-sm">
                    <div className="text-xs font-bold uppercase text-rose-700 tracking-wider mb-1.5">TOTAL COST</div>
                    <div className="text-xl font-bold text-rose-700">
                      Rs. {Number(balanceData?.totalCost || 0).toFixed(2)}
                    </div>
                  </div>

                  {/* BALANCE AMOUNT */}
                  <div className="bg-brand-indigo/5 p-5 rounded-2xl border-2 border-brand-indigo/30 shadow-sm">
                    <div className="text-xs font-bold uppercase text-brand-indigo tracking-wider mb-1.5">BALANCE AMOUNT</div>
                    <div className="text-2xl font-bold text-brand-indigo">
                      Rs. {Number(balanceData?.balanceAmount || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminFinancials;
