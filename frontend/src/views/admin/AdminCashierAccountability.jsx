'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, TrendingDown, TrendingUp, Wallet, ArrowRightLeft, X } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import EmployeeSelector from '../../components/EmployeeSelector';
import {
  getCashierShortageSummary,
  getCashierShortageLedger,
  getCashierRecoveries,
  reassignCashierShortage,
  recordCashierDeduction,
  getAccountabilityCashiersList,
} from '../../services/api';
import { toast } from 'react-toastify';
import { adminNavGroups } from './adminNavItems';
import { getFilteredManagerNavGroups } from '../storeOwner/managerNavItems';
import useAuthStore from '../../store/authStore';
import useAdminStoreStore from '../../store/adminStoreStore';

const AdminCashierAccountability = ({ navItems: propNavItems }) => {
  const { user } = useAuthStore();
  const navItems = propNavItems || (
    user?.role === 'manager'
      ? getFilteredManagerNavGroups(user)
      : adminNavGroups
  );
  const { selectedStoreId } = useAdminStoreStore();

  const [tab, setTab] = useState('summary'); // summary | sheet | history
  const [summary, setSummary] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [recoveries, setRecoveries] = useState([]);
  const [cashiers, setCashiers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [cashierFilter, setCashierFilter] = useState('');

  const [deductionModal, setDeductionModal] = useState(null); // { cashierId, name, outstanding }
  const now = new Date();
  const [deductionForm, setDeductionForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], note: '', payrollMonth: now.getMonth() + 1, payrollYear: now.getFullYear(), overrideReason: '' });

  const [reassignModal, setReassignModal] = useState(null); // shortage row
  const [reassignForm, setReassignForm] = useState({ toCashierId: '', reason: '' });

  const buildParams = () => ({
    ...(dateRange.startDate ? { startDate: dateRange.startDate } : {}),
    ...(dateRange.endDate ? { endDate: dateRange.endDate } : {}),
    ...(selectedStoreId !== 'all' ? { storeId: selectedStoreId } : {}),
    ...(cashierFilter ? { cashierId: cashierFilter } : {}),
  });

  const fetchAll = async () => {
    try {
      setLoading(true);
      const params = buildParams();
      const [sumRes, ledgerRes, recRes] = await Promise.all([
        getCashierShortageSummary(params),
        getCashierShortageLedger(params),
        getCashierRecoveries(params),
      ]);
      setSummary(sumRes.data || []);
      setLedger(ledgerRes.data || []);
      setRecoveries(recRes.data || []);
    } catch (err) {
      toast.error('Failed to load cashier accountability data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCashiers = async () => {
    try {
      const params = selectedStoreId !== 'all' ? { storeId: selectedStoreId } : {};
      const { data } = await getAccountabilityCashiersList(params);
      setCashiers(data || []);
    } catch (err) { /* ignore */ }
  };

  useEffect(() => { fetchCashiers(); }, [selectedStoreId]);
  useEffect(() => { fetchAll(); }, [dateRange.startDate, dateRange.endDate, selectedStoreId, cashierFilter]);

  const openDeductionModal = (row) => {
    setDeductionModal(row);
    setDeductionForm({ amount: '', date: new Date().toISOString().split('T')[0], note: '', payrollMonth: now.getMonth() + 1, payrollYear: now.getFullYear(), overrideReason: '' });
  };

  const submitDeduction = async (e) => {
    e.preventDefault();
    if (!deductionForm.amount || Number(deductionForm.amount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    try {
      await recordCashierDeduction({
        cashierId: deductionModal.cashierId,
        amount: Number(deductionForm.amount),
        date: deductionForm.date,
        note: deductionForm.note,
        payrollPeriod: { month: Number(deductionForm.payrollMonth), year: Number(deductionForm.payrollYear) },
        overrideReason: deductionForm.overrideReason || undefined,
      });
      toast.success('Deduction recorded');
      setDeductionModal(null);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record deduction');
    }
  };

  const openReassignModal = (row) => {
    setReassignModal(row);
    setReassignForm({ toCashierId: '', reason: '' });
  };

  const submitReassign = async (e) => {
    e.preventDefault();
    if (!reassignForm.toCashierId || !reassignForm.reason.trim()) {
      toast.error('Select a cashier and enter a reason');
      return;
    }
    try {
      await reassignCashierShortage(reassignModal._id, reassignForm);
      toast.success('Reassigned');
      setReassignModal(null);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reassign');
    }
  };

  const totalOutstanding = summary.reduce((s, r) => s + r.outstanding, 0);
  const totalShortage = summary.reduce((s, r) => s + r.totalShortage, 0);
  const totalRecovered = summary.reduce((s, r) => s + r.totalRecovered, 0);

  if (loading && summary.length === 0) {
    return (
      <DashboardLayout navItems={navItems} title="Cashier Cash Accountability">
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-primary-blue border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} title="Cashier Cash Accountability">
      <div className="ds-page">
        {/* Header */}
        <div className="ds-page-header">
          <div className="ds-page-header-left">
            <div className="ds-page-header-icon">
              <ShieldAlert size={20} strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="ds-page-title">Cashier Cash Accountability</h1>
              <p className="ds-page-subtitle">Per-cashier cash shortages, recoveries, and outstanding balances</p>
            </div>
          </div>
          <div className="ds-page-header-right flex gap-2 flex-wrap items-center">
            <div className="w-48">
              <EmployeeSelector
                multiple={false}
                employees={cashiers}
                value={cashierFilter ? [cashierFilter] : []}
                onChange={([id]) => setCashierFilter(id || '')}
                triggerLabel="All Cashiers"
              />
            </div>
            <input type="date" value={dateRange.startDate} onChange={(e) => setDateRange((r) => ({ ...r, startDate: e.target.value }))} className="ds-input py-2 px-3 text-xs w-auto" />
            <input type="date" value={dateRange.endDate} onChange={(e) => setDateRange((r) => ({ ...r, endDate: e.target.value }))} className="ds-input py-2 px-3 text-xs w-auto" />
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="ds-stat">
            <div className="ds-stat-label text-rose-600">Total Shortage Accumulated</div>
            <div className="ds-stat-value text-rose-600">Rs. {totalShortage.toLocaleString()}</div>
            <p className="ds-stat-sub">Cumulative deficits</p>
          </div>
          <div className="ds-stat">
            <div className="ds-stat-label text-emerald-600">Total Recovered</div>
            <div className="ds-stat-value text-emerald-600">Rs. {totalRecovered.toLocaleString()}</div>
            <p className="ds-stat-sub">Recovered to date</p>
          </div>
          <div className="ds-stat">
            <div className="ds-stat-label text-amber-600">Outstanding (All Cashiers)</div>
            <div className="ds-stat-value text-amber-600">Rs. {totalOutstanding.toLocaleString()}</div>
            <p className="ds-stat-sub">Pending recovery</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="ds-tab-bar">
          {[
            { key: 'summary', label: 'Per-Cashier Summary' },
            { key: 'sheet', label: 'Detail Sheet' },
            { key: 'history', label: 'Recovery History' },
          ].map((t) => (
            <button 
              key={t.key} 
              onClick={() => setTab(t.key)}
              className={`ds-tab-btn ${tab === t.key ? 'active' : ''}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Per-Cashier Summary */}
        {tab === 'summary' && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary.map((row) => (
              <div key={row.cashierId} className="ds-card p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs">
                    {row.cashier?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-xs text-slate-900 m-0">{row.cashier?.name || 'Unknown'}</p>
                    <p className="text-[0.7rem] text-slate-400 m-0">{row.cashier?.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs mb-4 p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-500 block">Shortage</span>
                    <span className="font-bold text-rose-600 text-xs">Rs. {row.totalShortage.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-500 block">Recovered</span>
                    <span className="font-bold text-emerald-600 text-xs">Rs. {row.totalRecovered.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-500 block">Over (sep)</span>
                    <span className="font-semibold text-slate-700 text-xs">Rs. {row.totalOver.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-500 block">Outstanding</span>
                    <span className="font-bold text-amber-600 text-xs">Rs. {row.outstanding.toLocaleString()}</span>
                  </div>
                </div>
                <button
                  disabled={row.outstanding <= 0}
                  onClick={() => openDeductionModal(row)}
                  className="ds-btn ds-btn-primary w-full justify-center text-xs"
                >
                  Record Deduction
                </button>
              </div>
            ))}
            {summary.length === 0 && (
              <div className="col-span-full py-16 text-center text-xs text-slate-400">No cashiers found</div>
            )}
          </div>
        )}

        {/* Detail Sheet */}
        {tab === 'sheet' && (
          <div className="ds-table-wrap">
            <div className="overflow-x-auto">
              <table className="ds-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Cashier</th>
                    <th className="text-right">Expected</th>
                    <th className="text-right">Counted</th>
                    <th className="text-right">Variance</th>
                    <th className="text-center">Status</th>
                    <th>Note</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((row) => (
                    <tr key={row._id}>
                      <td className="text-xs text-slate-500">{new Date(row.date).toLocaleDateString()}</td>
                      <td className="font-semibold text-xs text-slate-900">{row.cashierId?.name || 'Unknown'}</td>
                      <td className="text-right text-xs text-slate-600">Rs. {row.expectedCash.toLocaleString()}</td>
                      <td className="text-right text-xs text-slate-600">Rs. {row.countedCash.toLocaleString()}</td>
                      <td className={`text-right text-xs font-bold ${row.type === 'short' ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {row.type === 'short' ? '-' : '+'}Rs. {Math.abs(row.variance).toLocaleString()}
                      </td>
                      <td className="text-center">
                        <span className={`ds-badge ${row.type === 'short' ? 'ds-badge-red' : 'ds-badge-green'}`}>
                          {row.type === 'short' ? 'Cash Short' : 'Cash Over'}
                        </span>
                      </td>
                      <td className="text-xs text-slate-500 max-w-[160px] truncate">{row.varianceNote || '—'}</td>
                      <td className="text-right">
                        <button onClick={() => openReassignModal(row)} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 border-0 bg-transparent cursor-pointer">
                          <ArrowRightLeft size={12} /> Reassign
                        </button>
                      </td>
                    </tr>
                  ))}
                  {ledger.length === 0 && (
                    <tr><td colSpan={8} className="py-16 text-center text-xs text-slate-400">No shortage/over events found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recovery History */}
        {tab === 'history' && (
          <div className="ds-table-wrap">
            <div className="overflow-x-auto">
              <table className="ds-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Cashier</th>
                    <th className="text-right">Amount Recovered</th>
                    <th>Note</th>
                    <th>Payroll Period</th>
                    <th>Recorded By</th>
                  </tr>
                </thead>
                <tbody>
                  {recoveries.map((row) => (
                    <tr key={row._id}>
                      <td className="text-xs text-slate-500">{new Date(row.date).toLocaleDateString()}</td>
                      <td className="font-semibold text-xs text-slate-900">{row.cashierId?.name || 'Unknown'}</td>
                      <td className="text-right text-xs font-bold text-emerald-600">Rs. {row.amount.toLocaleString()}</td>
                      <td className="text-xs text-slate-500 max-w-[180px] truncate">{row.note || '—'}</td>
                      <td className="text-xs text-slate-500">{row.payrollPeriod?.month ? `${row.payrollPeriod.month}/${row.payrollPeriod.year}` : '—'}</td>
                      <td className="text-xs text-slate-500">{row.recordedBy?.name || 'System'}</td>
                    </tr>
                  ))}
                  {recoveries.length === 0 && (
                    <tr><td colSpan={6} className="py-16 text-center text-xs text-slate-400">No recoveries recorded yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Record Deduction Modal */}
      {deductionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4" onClick={() => setDeductionModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Record Deduction — {deductionModal.cashier?.name}</h2>
              <button onClick={() => setDeductionModal(null)} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={20} /></button>
            </div>
            <form onSubmit={submitDeduction} className="p-6 space-y-4">
              <div className="bg-amber-50 rounded-xl p-3 text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Outstanding Balance</p>
                <p className="text-xl font-bold text-amber-700">Rs. {deductionModal.outstanding.toLocaleString()}</p>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Amount Recovered (Rs.) *</label>
                <input type="number" min="0.01" step="0.01" required value={deductionForm.amount} onChange={(e) => setDeductionForm({ ...deductionForm, amount: e.target.value })} placeholder="e.g. 4000" className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Date *</label>
                <input type="date" required value={deductionForm.date} onChange={(e) => setDeductionForm({ ...deductionForm, date: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Note</label>
                <input value={deductionForm.note} onChange={(e) => setDeductionForm({ ...deductionForm, note: e.target.value })} placeholder="e.g. Deducted from September salary" className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Payroll Period *</label>
                <div className="grid grid-cols-2 gap-3">
                  <select value={deductionForm.payrollMonth} onChange={(e) => setDeductionForm({ ...deductionForm, payrollMonth: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 cursor-pointer">
                    {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}
                  </select>
                  <select value={deductionForm.payrollYear} onChange={(e) => setDeductionForm({ ...deductionForm, payrollYear: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 cursor-pointer">
                    {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              {Number(deductionForm.amount || 0) > deductionModal.outstanding && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-rose-500 block mb-2">This exceeds the outstanding balance — reason required to proceed *</label>
                  <input value={deductionForm.overrideReason} onChange={(e) => setDeductionForm({ ...deductionForm, overrideReason: e.target.value })} placeholder="Explain why this exceeds the balance" className="w-full bg-white border border-rose-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700" />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-slate-900 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-800">Record</button>
                <button type="button" onClick={() => setDeductionModal(null)} className="flex-1 border border-slate-200 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-500 hover:bg-slate-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reassign Modal */}
      {reassignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4" onClick={() => setReassignModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Reassign Shortage</h2>
              <button onClick={() => setReassignModal(null)} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={20} /></button>
            </div>
            <form onSubmit={submitReassign} className="p-6 space-y-4">
              <p className="text-xs text-slate-500">
                Currently attributed to <span className="font-bold text-slate-800">{reassignModal.cashierId?.name || 'Unknown'}</span> — Rs. {Math.abs(reassignModal.variance).toLocaleString()} on {new Date(reassignModal.date).toLocaleDateString()}
              </p>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Reassign To *</label>
                <EmployeeSelector
                  multiple={false}
                  employees={cashiers.filter((c) => c._id !== reassignModal.cashierId?._id)}
                  value={reassignForm.toCashierId ? [reassignForm.toCashierId] : []}
                  onChange={([id]) => setReassignForm({ ...reassignForm, toCashierId: id || '' })}
                  placeholder="Search and select cashier..."
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Reason *</label>
                <input required value={reassignForm.reason} onChange={(e) => setReassignForm({ ...reassignForm, reason: e.target.value })} placeholder="e.g. B was actually on till, A only closed it" className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-slate-900 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-800">Reassign</button>
                <button type="button" onClick={() => setReassignModal(null)} className="flex-1 border border-slate-200 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-500 hover:bg-slate-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminCashierAccountability;
