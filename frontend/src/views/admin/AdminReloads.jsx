'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, Search, Filter, Download, Calendar, ArrowUpRight, Phone, User as UserIcon, Plus, CheckCircle2, Layers, DollarSign, Calculator, RefreshCw } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { getReloads, getReloadStocks, addReloadStock, closeReloadStock } from '../../services/api';
import { adminNavGroups } from './adminNavItems';
import { managerNavGroups } from '../storeOwner/managerNavItems';
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
      ? managerNavGroups
      : adminNavGroups
  );
  const [activeTab, setActiveTab] = useState('stocks'); // 'stocks' or 'history'
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
    cardValue: 1, // 1 for total currency value, or 50, 100, 500 for card denomination
    openingStock: 0,
    addedStock: 0,
    notes: ''
  });

  const [closingStockInput, setClosingStockInput] = useState(0);

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
      toast.error('Failed to load reloads');
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
    } else {
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
      setAddStockForm({ operator: 'Dialog', cardValue: 1, openingStock: 0, addedStock: 0, notes: '' });
      fetchStocks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save reload stock');
    }
  };

  const handleCloseStock = async (e) => {
    e.preventDefault();
    if (!selectedStockItem) return;
    try {
      await closeReloadStock({
        stockId: selectedStockItem._id,
        closingStock: Number(closingStockInput)
      });
      toast.success('Evening shop balance updated & Sell-Out calculated! ✅');
      setIsCloseStockOpen(false);
      setSelectedStockItem(null);
      fetchStocks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update evening balance');
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
    <DashboardLayout navItems={navItems} title="Reloads">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-dark-navy flex items-center gap-2">
              📱 Reloads & Daily Sell-Out Tracker
            </h1>
            <p className="text-muted-text text-sm">Manage reload cards stock, daily entries & automatic evening sell-out calculations</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === 'stocks' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`}
              onClick={() => setActiveTab('stocks')}
            >
              📊 Daily Stock & Sell-Out
            </button>
            <button 
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`}
              onClick={() => setActiveTab('history')}
            >
              📑 Reload Transactions
            </button>
          </div>
        </div>

        {activeTab === 'stocks' && (
          <>
            {/* Top Toolbar for Stock View */}
            <div className="bg-white p-4 rounded-2xl border border-card-border shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar size={18} className="text-indigo-600" /> Select Date:
                </span>
                <input 
                  type="date"
                  className="px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                <button
                  onClick={() => setIsAddStockOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-sm transition-all"
                >
                  <Plus size={18} /> Add Stock
                </button>
              </div>
            </div>

            {/* Daily Sell-Out Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white p-5 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-indigo-100 uppercase tracking-wider">Total Available Stock</span>
                  <div className="p-2 bg-white/20 rounded-lg"><Layers size={18} /></div>
                </div>
                <h3 className="text-2xl font-black">{totalAvailableStock.toLocaleString()}</h3>
                <p className="text-xs text-indigo-100 mt-1">Opening + Added Stock</p>
              </div>

              <div className="bg-gradient-to-br from-emerald-500 to-teal-700 text-white p-5 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">Daily Sell-Out Volume</span>
                  <div className="p-2 bg-white/20 rounded-lg"><DollarSign size={18} /></div>
                </div>
                <h3 className="text-2xl font-black">Rs. {totalStockSellOutValue.toLocaleString()}</h3>
                <p className="text-xs text-emerald-100 mt-1">Auto-calculated daily reload sales</p>
              </div>

              <div className="bg-gradient-to-br from-slate-700 to-slate-900 text-white p-5 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Remaining Evening Balance</span>
                  <div className="p-2 bg-white/20 rounded-lg"><Calculator size={18} /></div>
                </div>
                <h3 className="text-2xl font-black">{totalRemainingStock.toLocaleString()}</h3>
                <p className="text-xs text-slate-300 mt-1">Total physical stock in shop</p>
              </div>
            </div>

            {/* Reload Stock Table */}
            <div className="bg-white rounded-2xl border border-card-border shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-card-border flex items-center justify-between bg-slate-50">
                <h3 className="text-base font-bold text-dark-navy flex items-center gap-2">
                  📋 Operator Reload Cards & Stock Sheet ({selectedDate})
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-card-border">
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-600 uppercase">Operator</th>
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-600 uppercase">Card Denomination / Type</th>
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-600 uppercase text-center">Opening Stock</th>
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-600 uppercase text-center">+ Added Stock</th>
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-600 uppercase text-center">Total Available</th>
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-600 uppercase text-center">Evening Shop Balance</th>
                      <th className="px-6 py-3.5 text-xs font-bold text-emerald-700 uppercase text-right">Daily Sell-Out</th>
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-600 uppercase text-center">Actions</th>
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
                            <p className="font-semibold text-slate-600">No reload stock recorded for {selectedDate}</p>
                            <button
                              onClick={() => setIsAddStockOpen(true)}
                              className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-all"
                            >
                              + Add Initial Stock for Today
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      stocks.map((item) => (
                        <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 font-bold">
                            <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${getOperatorColor(item.operator)}`}>
                              {item.operator}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-700 font-semibold">
                            {item.cardValue === 1 ? 'Total Reload Balance' : `Rs. ${item.cardValue} Cards`}
                          </td>
                          <td className="px-6 py-4 text-center font-semibold text-slate-600">{item.openingStock}</td>
                          <td className="px-6 py-4 text-center font-bold text-indigo-600">+{item.addedStock}</td>
                          <td className="px-6 py-4 text-center font-bold text-slate-800 bg-slate-50">{item.totalStock}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg font-extrabold text-sm">
                              {item.closingStock}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right bg-emerald-50/50">
                            <div className="text-emerald-700 font-black text-base">
                              Rs. {(item.sellOutValue || 0).toLocaleString()}
                            </div>
                            <div className="text-[11px] text-emerald-600 font-semibold">
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
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                            >
                              ⚙️ Enter Evening Balance
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

        {activeTab === 'history' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-card-border shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Smartphone size={20} /></div>
                </div>
                <h3 className="text-2xl font-bold text-dark-navy">{stats.total}</h3>
                <p className="text-xs text-muted-text">Total Reloads</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-card-border shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><ArrowUpRight size={20} /></div>
                </div>
                <h3 className="text-2xl font-bold text-dark-navy">Rs. {stats.amount.toLocaleString()}</h3>
                <p className="text-xs text-muted-text">Total Volume</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-card-border shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Calendar size={20} /></div>
                </div>
                <h3 className="text-2xl font-bold text-dark-navy">{stats.today}</h3>
                <p className="text-xs text-muted-text">Today's Transactions</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-card-border shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-lg"><ArrowUpRight size={20} /></div>
                </div>
                <h3 className="text-2xl font-bold text-dark-navy">Rs. {stats.todayAmount.toLocaleString()}</h3>
                <p className="text-xs text-muted-text">Today's Volume</p>
              </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-2xl border border-card-border shadow-sm flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search number, operator, or cashier..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-slate-400" />
                  <select 
                    className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
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
                    className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    value={filter.startDate}
                    onChange={(e) => setFilter({...filter, startDate: e.target.value})}
                  />
                  <span className="text-slate-400">to</span>
                  <input 
                    type="date" 
                    className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    value={filter.endDate}
                    onChange={(e) => setFilter({...filter, endDate: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-card-border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-card-border">
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date & Time</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mobile Number</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Operator</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cashier</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amount</th>
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
                            <p>No reload transactions found</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredReloads.map((reload) => (
                        <tr key={reload._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-dark-navy font-medium">{new Date(reload.createdAt).toLocaleDateString()}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase">{new Date(reload.createdAt).toLocaleTimeString()}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500"><Phone size={14} /></div>
                              <span className="font-bold text-slate-700">{reload.mobileNumber}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${getOperatorColor(reload.operator)}`}>
                              {reload.operator}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-slate-600 font-medium">{reload.type}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-slate-600">
                              <UserIcon size={14} className="text-slate-400" />
                              <span>{reload.createdBy?.name || 'Unknown'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="text-indigo-600 font-bold text-base">Rs. {reload.amount.toLocaleString()}</div>
                            <div className="text-[10px] text-slate-400">{reload.paymentMethod}</div>
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

        {/* Modal: Add Stock (තොග එකතු කරන්න) */}
        {isAddStockOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
              <h3 className="text-lg font-bold text-dark-navy">📦 Reload Stock Addition</h3>

              <form onSubmit={handleSaveStock} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Operator *</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
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
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Card Denomination / Type</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={addStockForm.cardValue}
                    onChange={(e) => setAddStockForm({ ...addStockForm, cardValue: Number(e.target.value) })}
                  >
                    <option value={1}>Total Reload Balance (Currency Value)</option>
                    <option value={50}>Rs. 50 Cards</option>
                    <option value={100}>Rs. 100 Cards</option>
                    <option value={200}>Rs. 200 Cards</option>
                    <option value={500}>Rs. 500 Cards</option>
                    <option value={1000}>Rs. 1000 Cards</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Opening Stock</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                      value={addStockForm.openingStock}
                      onChange={(e) => setAddStockForm({ ...addStockForm, openingStock: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">+ Added Stock</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                      value={addStockForm.addedStock}
                      onChange={(e) => setAddStockForm({ ...addStockForm, addedStock: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Morning reload machine deposit"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                    value={addStockForm.notes}
                    onChange={(e) => setAddStockForm({ ...addStockForm, notes: e.target.value })}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddStockOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-md"
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
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
              <h3 className="text-lg font-bold text-dark-navy">⚙️ Enter Evening Physical Shop Balance</h3>
              <p className="text-xs text-slate-500">
                Operator: <strong className="text-indigo-600">{selectedStockItem.operator}</strong> | Total Available: <strong>{selectedStockItem.totalStock}</strong>
              </p>

              <form onSubmit={handleCloseStock} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Remaining Physical Shop Balance *</label>
                  <input
                    type="number"
                    min="0"
                    max={selectedStockItem.totalStock}
                    required
                    className="w-full px-3 py-2 border border-amber-300 focus:ring-2 focus:ring-amber-500 rounded-xl text-lg font-black text-amber-800 outline-none"
                    value={closingStockInput}
                    onChange={(e) => setClosingStockInput(e.target.value)}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Enter physical cards count or remaining balance in shop at shift close.</p>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between font-bold text-emerald-800">
                    <span>Calculated Sell-Out Quantity:</span>
                    <span>{Math.max(0, selectedStockItem.totalStock - Number(closingStockInput))}</span>
                  </div>
                  <div className="flex justify-between font-black text-emerald-900 text-sm">
                    <span>Total Calculated Sales Revenue:</span>
                    <span>Rs. {(Math.max(0, selectedStockItem.totalStock - Number(closingStockInput)) * selectedStockItem.cardValue).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCloseStockOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-all shadow-md"
                  >
                    Calculate & Submit Sell-Out
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
