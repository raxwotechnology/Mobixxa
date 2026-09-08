'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, Search, Filter, Calendar, ArrowUpRight, Phone, User as UserIcon, Plus, CheckCircle2, Layers, DollarSign, Calculator, RefreshCw, Wallet, CreditCard, Building2, FileText, Check } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { getReloads, getReloadStocks, addReloadStock, closeReloadStock, adjustReloadStock, addReloadSupplierPayment } from '../../services/api';
import { adminNavGroups } from './adminNavItems';
import { managerNavGroups, getFilteredManagerNavGroups } from '../storeOwner/managerNavItems';
import { getEmployeeNavGroups } from '../employee/employeeNav';
import { toast } from 'react-toastify';
import useAdminStoreStore from '../../store/adminStoreStore';
import useAuthStore from '../../store/authStore';

const AdminReloads = ({ navItems: propNavItems }) => {
  const { user } = useAuthStore();
  const navItems = propNavItems || (
    user?.role === 'cashier'
      ? getEmployeeNavGroups('cashier')
      : user?.role === 'manager'
      ? getFilteredManagerNavGroups(user)
      : adminNavGroups
  );

  const [activeTab, setActiveTab] = useState('stocks'); // 'stocks', 'supplier', or 'history'
  const [reloads, setReloads] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filter, setFilter] = useState({
    operator: '',
    startDate: '',
    endDate: ''
  });
  const { selectedStoreId } = useAdminStoreStore();

  // Modals
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isCloseStockOpen, setIsCloseStockOpen] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState(null);

  // Forms
  const [addStockForm, setAddStockForm] = useState({
    operator: 'Dialog',
    cardValue: 100, // Denomination e.g. 50, 100, 200, 500, 1000 or 1 for E-Reload Float
    openingStock: 0,
    addedStock: 0,
    notes: ''
  });

  const [closingStockInput, setClosingStockInput] = useState(0);

  // Supplier Float Payment Form
  const [supplierForm, setSupplierForm] = useState({
    supplierName: 'Dialog Distributor',
    operator: 'Dialog',
    amount: '',
    paymentMethod: 'Cash',
    notes: ''
  });
  const [supplierSubmitting, setSupplierSubmitting] = useState(false);

  const fetchReloads = async () => {
    try {
      setLoading(true);
      const params = {
        ...(filter.operator ? { operator: filter.operator } : {}),
        ...(filter.startDate ? { startDate: filter.startDate } : {}),
        ...(filter.endDate ? { endDate: filter.endDate } : {}),
        ...(selectedStoreId !== 'all' ? { storeId: selectedStoreId } : {})
      };
      const { data } = await getReloads(params);
      setReloads(data || []);
    } catch (err) {
      toast.error('Failed to load reload transaction history');
    } finally {
      setLoading(false);
    }
  };

  const fetchStocks = async () => {
    try {
      setLoading(true);
      const params = {
        date: selectedDate,
        ...(selectedStoreId !== 'all' ? { storeId: selectedStoreId } : {})
      };
      const { data } = await getReloadStocks(params);
      setStocks(data || []);
    } catch (err) {
      toast.error('Failed to load reload stocks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchReloads();
    } else if (activeTab === 'stocks') {
      fetchStocks();
    }
  }, [activeTab, selectedDate, filter.operator, filter.startDate, filter.endDate, selectedStoreId]);

  const handleSaveStock = async (e) => {
    e.preventDefault();
    try {
      await addReloadStock({
        ...addStockForm,
        date: selectedDate,
        storeId: selectedStoreId !== 'all' ? selectedStoreId : undefined
      });
      toast.success('Reload stock updated successfully! ✅');
      setIsAddStockOpen(false);
      setAddStockForm({ operator: 'Dialog', cardValue: 100, openingStock: 0, addedStock: 0, notes: '' });
      fetchStocks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save reload stock');
    }
  };

  const handleCloseStock = async (e) => {
    e.preventDefault();
    if (!selectedStockItem) return;
    try {
      // Once a closing is locked, re-entering the evening count for the same
      // item/date now goes through the logged adjust action instead of
      // silently overwriting the earlier close.
      if (selectedStockItem.status === 'closed') {
        await adjustReloadStock({
          stockId: selectedStockItem._id,
          field: 'closingStock',
          newValue: Number(closingStockInput),
          reason: 'Evening count correction via Admin panel',
        });
        toast.success('Evening balance corrected & logged! ✅');
      } else {
        await closeReloadStock({
          stockId: selectedStockItem._id,
          closingStock: Number(closingStockInput)
        });
        toast.success('Evening balance updated & Sales Income posted to accounts! ✅');
      }
      setIsCloseStockOpen(false);
      setSelectedStockItem(null);
      fetchStocks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update evening balance');
    }
  };

  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    if (!supplierForm.amount || Number(supplierForm.amount) <= 0) {
      return toast.error('Please enter a valid payment amount');
    }
    setSupplierSubmitting(true);
    try {
      await addReloadSupplierPayment({
        ...supplierForm,
        storeId: selectedStoreId !== 'all' ? selectedStoreId : undefined
      });
      toast.success('Supplier Float Payment recorded & Expense logged! 💸');
      setSupplierForm({
        supplierName: 'Dialog Distributor',
        operator: 'Dialog',
        amount: '',
        paymentMethod: 'Cash',
        notes: ''
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record supplier payment');
    } finally {
      setSupplierSubmitting(false);
    }
  };

  const filteredReloads = reloads.filter(r => 
    r.mobileNumber?.includes(searchQuery) || 
    r.operator?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.createdBy?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: filteredReloads.length,
    amount: filteredReloads.reduce((sum, r) => sum + r.amount, 0),
    today: filteredReloads.filter(r => new Date(r.createdAt).toDateString() === new Date().toDateString()).length,
    todayAmount: filteredReloads.filter(r => new Date(r.createdAt).toDateString() === new Date().toDateString()).reduce((sum, r) => sum + r.amount, 0)
  };

  const totalStockSellOutValue = stocks.reduce((sum, s) => sum + (s.sellOutValue || 0), 0);
  const totalAvailableStock = stocks.reduce((sum, s) => sum + (s.totalStock || 0), 0);
  const totalRemainingStock = stocks.reduce((sum, s) => sum + (s.closingStock || 0), 0);

  const getOperatorColor = (op) => {
    const colors = {
      Dialog: 'bg-rose-100 text-rose-700 border-rose-200',
      Mobitel: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      Hutch: 'bg-amber-100 text-amber-700 border-amber-200',
      Airtel: 'bg-red-100 text-red-700 border-red-200',
      SLT: 'bg-sky-100 text-sky-700 border-sky-200'
    };
    return colors[op] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <DashboardLayout navItems={navItems} title="Reloads & Card Stock">
      <div className="space-y-6">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              📱 Reloads & Card Stock Management
            </h1>
            <p className="text-slate-500 text-xs font-semibold mt-1">
              Manage physical card stocks, daily e-reload floats, end-of-day balances, and distributor payments.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button 
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${activeTab === 'stocks' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              onClick={() => setActiveTab('stocks')}
            >
              📊 Daily Stock & Sell-Out
            </button>
            <button 
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${activeTab === 'supplier' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              onClick={() => setActiveTab('supplier')}
            >
              💸 Supplier Payments
            </button>
            <button 
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${activeTab === 'history' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              onClick={() => setActiveTab('history')}
            >
              📑 Reload Transactions
            </button>
          </div>
        </div>

        {/* Tab 1: Daily Stock & Sell-Out Tracker */}
        {activeTab === 'stocks' && (
          <>
            {/* Top Date Bar & Add Button */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Calendar size={16} className="text-indigo-600" /> Select Date:
                </span>
                <input 
                  type="date"
                  className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-indigo-600 outline-none transition-all"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                <button
                  onClick={() => setIsAddStockOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <Plus size={16} /> Add Card Stock / Float
                </button>
              </div>
            </div>

            {/* Daily Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white p-5 rounded-2xl shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-indigo-100 uppercase tracking-widest">Total Available Stock</span>
                  <div className="p-2 bg-white/20 rounded-xl"><Layers size={18} /></div>
                </div>
                <h3 className="text-2xl font-black">{totalAvailableStock.toLocaleString()}</h3>
                <p className="text-[11px] text-indigo-100 mt-1 font-medium">Opening Stock + Added Stock</p>
              </div>

              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-2xl shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-emerald-100 uppercase tracking-widest">Daily Sales Income (Sell-Out)</span>
                  <div className="p-2 bg-white/20 rounded-xl"><DollarSign size={18} /></div>
                </div>
                <h3 className="text-2xl font-black">Rs. {totalStockSellOutValue.toLocaleString()}</h3>
                <p className="text-[11px] text-emerald-100 mt-1 font-medium">Auto-posted to shop income ledger</p>
              </div>

              <div className="bg-gradient-to-br from-slate-800 to-slate-950 text-white p-5 rounded-2xl shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Evening In-Hand Balance</span>
                  <div className="p-2 bg-white/20 rounded-xl"><Calculator size={18} /></div>
                </div>
                <h3 className="text-2xl font-black">{totalRemainingStock.toLocaleString()}</h3>
                <p className="text-[11px] text-slate-300 mt-1 font-medium">Physical cards count in shop</p>
              </div>
            </div>

            {/* Reload Stock Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 m-0">
                  📋 Daily Card Stock & E-Reload Sheet ({selectedDate})
                </h3>
                <span className="text-[11px] font-bold text-slate-500 bg-white px-3 py-1 rounded-lg border border-slate-200">
                  Auto Opening Stock from Previous Date
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200">
                      <th className="px-6 py-3.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Operator</th>
                      <th className="px-6 py-3.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Card / Float Type</th>
                      <th className="px-6 py-3.5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Opening Stock</th>
                      <th className="px-6 py-3.5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">+ Added Stock</th>
                      <th className="px-6 py-3.5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Total Available</th>
                      <th className="px-6 py-3.5 text-[10px] font-black text-amber-800 uppercase tracking-widest text-center">Evening In-Hand Count</th>
                      <th className="px-6 py-3.5 text-[10px] font-black text-emerald-700 uppercase tracking-widest text-right">Daily Sell-Out Sales</th>
                      <th className="px-6 py-3.5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      Array(3).fill(0).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan="8" className="px-6 py-4 bg-slate-50/50"></td>
                        </tr>
                      ))
                    ) : stocks.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-12 text-center text-slate-500">
                          <div className="flex flex-col items-center gap-2">
                            <Layers size={44} className="text-slate-300" />
                            <p className="font-bold text-slate-600 text-sm">No stock records found for {selectedDate}</p>
                            <button
                              onClick={() => setIsAddStockOpen(true)}
                              className="mt-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-indigo-700 transition-all shadow-md cursor-pointer"
                            >
                              + Add Initial Card Stock / Float
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      stocks.map((item) => (
                        <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 font-bold">
                            <span className={`px-3 py-1 rounded-full text-xs font-black border ${getOperatorColor(item.operator)}`}>
                              {item.operator}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-800 font-bold text-xs">
                            {item.cardValue === 1 ? (
                              <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-lg">
                                📱 E-Reload Machine Float
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg">
                                🎴 Rs. {item.cardValue} Scratch Cards
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-slate-600">{item.openingStock}</td>
                          <td className="px-6 py-4 text-center font-black text-indigo-600">+{item.addedStock}</td>
                          <td className="px-6 py-4 text-center font-black text-slate-900 bg-slate-50">{item.totalStock}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="px-3.5 py-1.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl font-black text-sm shadow-xs">
                              {item.closingStock}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right bg-emerald-50/60">
                            <div className="text-emerald-800 font-black text-base">
                              Rs. {(item.sellOutValue || 0).toLocaleString()}
                            </div>
                            <div className="text-[11px] text-emerald-600 font-bold">
                              ({item.sellOutAmount} sold)
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => {
                                setSelectedStockItem(item);
                                setClosingStockInput(item.closingStock || 0);
                                setIsCloseStockOpen(true);
                              }}
                              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 mx-auto"
                            >
                              ⚙️ Enter Evening Count
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Tab 2: Supplier / Distributor Float Payments */}
        {activeTab === 'supplier' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Supplier Form */}
            <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Wallet className="text-indigo-600" size={20} />
                <h3 className="text-base font-black text-slate-900 m-0">Reload Supplier Payment</h3>
              </div>
              <p className="text-slate-500 text-xs font-semibold">
                Record payment made to Dialog/Mobitel/Hutch reload distributor for float top-up or physical cards.
              </p>

              <form onSubmit={handleSupplierSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Distributor / Supplier Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dialog Distributor Kandy"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-600 focus:bg-white transition-all"
                    value={supplierForm.supplierName}
                    onChange={(e) => setSupplierForm({ ...supplierForm, supplierName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Operator *</label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-600 focus:bg-white transition-all cursor-pointer"
                    value={supplierForm.operator}
                    onChange={(e) => setSupplierForm({ ...supplierForm, operator: e.target.value })}
                  >
                    <option value="Dialog">Dialog</option>
                    <option value="Mobitel">Mobitel</option>
                    <option value="Hutch">Hutch</option>
                    <option value="Airtel">Airtel</option>
                    <option value="SLT">SLT</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Payment Amount (Rs.) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 50000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition-all"
                    value={supplierForm.amount}
                    onChange={(e) => setSupplierForm({ ...supplierForm, amount: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Payment Method *</label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-600 focus:bg-white transition-all cursor-pointer"
                    value={supplierForm.paymentMethod}
                    onChange={(e) => setSupplierForm({ ...supplierForm, paymentMethod: e.target.value })}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Purchased 500 Dialog Rs. 100 cards"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-indigo-600 focus:bg-white transition-all"
                    value={supplierForm.notes}
                    onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  disabled={supplierSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  {supplierSubmitting ? 'Recording...' : '💸 Record Supplier Payment'}
                </button>
              </form>
            </div>

            {/* Information Banner */}
            <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-8 rounded-2xl shadow-md flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border border-indigo-400/20 mb-4">
                  <Building2 size={14} /> Reload Distributor Accounting Integration
                </div>
                <h2 className="text-xl font-black text-white mb-2">Automated Supplier Expense Logging</h2>
                <p className="text-slate-300 text-xs leading-relaxed font-medium">
                  When you make a payment to a Reload Distributor for physical scratch cards or E-Reload float deposits, entering it here automatically logs an <strong>Expense Transaction</strong> under your shop's Financial Ledger.
                </p>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest m-0">Auto Financial Categorization</p>
                  <p className="text-xs font-bold text-white mt-1 m-0">Categorized as "Reload Supplier Cost"</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest m-0">Ledger Compatibility</p>
                  <p className="text-xs font-bold text-white mt-1 m-0">Appears in Financial Statements & Expenses</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: History */}
        {activeTab === 'history' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Smartphone size={20} /></div>
                </div>
                <h3 className="text-2xl font-black text-slate-900">{stats.total}</h3>
                <p className="text-xs text-slate-500 font-semibold">Total Reload Entries</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><ArrowUpRight size={20} /></div>
                </div>
                <h3 className="text-2xl font-black text-slate-900">Rs. {stats.amount.toLocaleString()}</h3>
                <p className="text-xs text-slate-500 font-semibold">Total Reload Volume</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><Calendar size={20} /></div>
                </div>
                <h3 className="text-2xl font-black text-slate-900">{stats.today}</h3>
                <p className="text-xs text-slate-500 font-semibold">Today's Reload Entries</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-xl"><ArrowUpRight size={20} /></div>
                </div>
                <h3 className="text-2xl font-black text-slate-900">Rs. {stats.todayAmount.toLocaleString()}</h3>
                <p className="text-xs text-slate-500 font-semibold">Today's Volume</p>
              </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search number, operator, or cashier..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 transition-all text-xs font-bold bg-slate-50 focus:bg-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-slate-400" />
                  <select 
                    className="text-xs font-bold border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-600 cursor-pointer bg-slate-50"
                    value={filter.operator}
                    onChange={(e) => setFilter({...filter, operator: e.target.value})}
                  >
                    <option value="">All Operators</option>
                    <option value="Dialog">Dialog</option>
                    <option value="Mobitel">Mobitel</option>
                    <option value="Hutch">Hutch</option>
                    <option value="Airtel">Airtel</option>
                    <option value="SLT">SLT</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="date" 
                    className="text-xs font-bold border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-600 bg-slate-50"
                    value={filter.startDate}
                    onChange={(e) => setFilter({...filter, startDate: e.target.value})}
                  />
                  <span className="text-slate-400 font-bold text-xs">to</span>
                  <input 
                    type="date" 
                    className="text-xs font-bold border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-600 bg-slate-50"
                    value={filter.endDate}
                    onChange={(e) => setFilter({...filter, endDate: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date & Time</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Mobile Number / Title</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Operator</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Type</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Recorded By</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      Array(5).fill(0).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan="6" className="px-6 py-4 bg-slate-50/50"></td>
                        </tr>
                      ))
                    ) : filteredReloads.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                          <div className="flex flex-col items-center gap-2">
                            <Smartphone size={48} className="text-slate-200" />
                            <p className="font-bold text-slate-600 text-sm">No reload transactions found</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredReloads.map((reload) => (
                        <tr key={reload._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-slate-800 font-bold text-xs">{new Date(reload.createdAt).toLocaleDateString()}</div>
                            <div className="text-[10px] text-slate-400 font-black uppercase">{new Date(reload.createdAt).toLocaleTimeString()}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500"><Phone size={14} /></div>
                              <span className="font-bold text-slate-800 text-xs">{reload.mobileNumber}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${getOperatorColor(reload.operator)}`}>
                              {reload.operator}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-slate-700 font-bold text-xs">{reload.type}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold">
                              <UserIcon size={14} className="text-slate-400" />
                              <span>{reload.createdBy?.name || 'Unknown'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="text-indigo-700 font-black text-sm">Rs. {reload.amount.toLocaleString()}</div>
                            <div className="text-[10px] text-slate-400 font-bold">{reload.paymentMethod}</div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Modal: Add Card Stock / Float Deposit */}
        {isAddStockOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4 border border-slate-200">
              <h3 className="text-lg font-black text-slate-900 m-0">📦 Add Card Stock / E-Reload Float</h3>

              <form onSubmit={handleSaveStock} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Operator *</label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-600 cursor-pointer"
                    value={addStockForm.operator}
                    onChange={(e) => setAddStockForm({ ...addStockForm, operator: e.target.value })}
                  >
                    <option value="Dialog">Dialog</option>
                    <option value="Mobitel">Mobitel</option>
                    <option value="Hutch">Hutch</option>
                    <option value="Airtel">Airtel</option>
                    <option value="SLT">SLT</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Card Denomination / Float Value (Rs.) *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">Rs.</span>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="e.g. 100, 199, 350, 500 or 1 for E-Reload Float"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-600 focus:bg-white transition-all"
                      value={addStockForm.cardValue || ''}
                      onChange={(e) => setAddStockForm({ ...addStockForm, cardValue: Number(e.target.value) })}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <button type="button" onClick={() => setAddStockForm({ ...addStockForm, cardValue: 1 })} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${addStockForm.cardValue === 1 ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'}`}>📱 E-Reload Float (1)</button>
                    <button type="button" onClick={() => setAddStockForm({ ...addStockForm, cardValue: 50 })} className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${addStockForm.cardValue === 50 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'}`}>Rs. 50</button>
                    <button type="button" onClick={() => setAddStockForm({ ...addStockForm, cardValue: 100 })} className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${addStockForm.cardValue === 100 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'}`}>Rs. 100</button>
                    <button type="button" onClick={() => setAddStockForm({ ...addStockForm, cardValue: 199 })} className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${addStockForm.cardValue === 199 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'}`}>Rs. 199</button>
                    <button type="button" onClick={() => setAddStockForm({ ...addStockForm, cardValue: 350 })} className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${addStockForm.cardValue === 350 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'}`}>Rs. 350</button>
                    <button type="button" onClick={() => setAddStockForm({ ...addStockForm, cardValue: 500 })} className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${addStockForm.cardValue === 500 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'}`}>Rs. 500</button>
                    <button type="button" onClick={() => setAddStockForm({ ...addStockForm, cardValue: 1000 })} className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${addStockForm.cardValue === 1000 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'}`}>Rs. 1000</button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Opening Stock</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-600"
                      value={addStockForm.openingStock}
                      onChange={(e) => setAddStockForm({ ...addStockForm, openingStock: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">+ Added Stock</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-indigo-600 outline-none focus:border-indigo-600"
                      value={addStockForm.addedStock}
                      onChange={(e) => setAddStockForm({ ...addStockForm, addedStock: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Received new Rs. 100 cards packet"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-indigo-600"
                    value={addStockForm.notes}
                    onChange={(e) => setAddStockForm({ ...addStockForm, notes: e.target.value })}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddStockOpen(false)}
                    className="px-5 py-2.5 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                  >
                    Save Stock
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Evening Closing Shop Balance (හවස Balance එක ඇතුළත් කිරීම) */}
        {isCloseStockOpen && selectedStockItem && (
          <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4 border border-slate-200">
              <h3 className="text-lg font-black text-slate-900 m-0">⚙️ Enter Evening In-Hand Balance</h3>
              <p className="text-xs font-semibold text-slate-500">
                Operator: <strong className="text-indigo-600">{selectedStockItem.operator}</strong> | Total Available: <strong>{selectedStockItem.totalStock}</strong>
              </p>

              <form onSubmit={handleCloseStock} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-amber-800 uppercase tracking-widest mb-1">Remaining In-Hand Stock Count *</label>
                  <input
                    type="number"
                    min="0"
                    max={selectedStockItem.totalStock}
                    required
                    className="w-full px-4 py-3 bg-amber-50 border border-amber-300 focus:ring-2 focus:ring-amber-500 rounded-xl text-xl font-black text-amber-900 outline-none"
                    value={closingStockInput}
                    onChange={(e) => setClosingStockInput(e.target.value)}
                  />
                  <p className="text-[11px] text-slate-400 font-medium mt-1">Enter physical cards remaining in shop at shift close.</p>
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-1.5">
                  <div className="flex justify-between font-bold text-emerald-800">
                    <span>Calculated Sold Quantity:</span>
                    <span>{Math.max(0, selectedStockItem.totalStock - Number(closingStockInput))}</span>
                  </div>
                  <div className="flex justify-between font-black text-emerald-950 text-sm pt-1 border-t border-emerald-200">
                    <span>Total Calculated Sales Revenue:</span>
                    <span>Rs. {(Math.max(0, selectedStockItem.totalStock - Number(closingStockInput)) * selectedStockItem.cardValue).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCloseStockOpen(false)}
                    className="px-5 py-2.5 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    Calculate & Post Sales Income
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminReloads;
