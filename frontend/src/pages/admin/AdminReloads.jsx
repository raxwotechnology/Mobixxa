import React, { useState, useEffect } from 'react';
import { Smartphone, Search, Filter, Download, Calendar, ArrowUpRight, Phone, User as UserIcon } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { getReloads } from '../../services/api';
import { adminNavGroups as navItems } from './adminNavItems';
import { toast } from 'react-toastify';
import useAdminStoreStore from '../../store/adminStoreStore';

const AdminReloads = () => {
  const [reloads, setReloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState({
    operator: '',
    startDate: '',
    endDate: ''
  });
  const { selectedStoreId } = useAdminStoreStore();

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

  useEffect(() => {
    fetchReloads();
  }, [filter.operator, filter.startDate, filter.endDate, selectedStoreId]);

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

  const getOperatorColor = (op) => {
    const colors = {
      Dialog: 'bg-rose-100 text-rose-700',
      Mobitel: 'bg-emerald-100 text-emerald-700',
      Hutch: 'bg-amber-100 text-amber-700',
      Airtel: 'bg-red-100 text-red-700',
      SLT: 'bg-sky-100 text-sky-700'
    };
    return colors[op] || 'bg-slate-100 text-slate-700';
  };

  return (
    <DashboardLayout navItems={navItems} title="Reloads">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-dark-navy">📱 Reloads & Bill Payments</h1>
            <p className="text-muted-text text-sm">Track mobile top-ups and service payments</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              className="flex items-center gap-2 px-4 py-2 bg-white border border-card-border rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
              onClick={() => {/* Export logic */}}
            >
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-card-border shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Smartphone size={20} /></div>
              <span className="text-xs font-bold text-emerald-600">+12%</span>
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
      </div>
    </DashboardLayout>
  );
};

export default AdminReloads;
