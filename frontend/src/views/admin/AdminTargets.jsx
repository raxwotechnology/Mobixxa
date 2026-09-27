'use client';

import { useState, useEffect } from 'react';
import { Plus, Target, Award, X, CheckCircle, Trash2 } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import EmployeeSelector from '../../components/EmployeeSelector';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import { getTargets, getEmployees, createTarget, updateTargetProgress, payTargetBonus, deleteTarget } from '../../services/api';
import { toast } from 'react-toastify';
import { adminNavGroups as navItems } from './adminNavItems';

const TARGET_TYPES = [
  { value: 'sales', label: 'Sales (Rs.)' },
  { value: 'deliveries', label: 'Deliveries' },
  { value: 'items_sold', label: 'Items Sold' },
  { value: 'attendance', label: 'Attendance (days)' },
];

const AdminTargets = () => {
  const [targets, setTargets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [form, setForm] = useState({
    employeeId: '', targetType: 'sales', targetValue: '', bonusAmount: '', notes: '',
  });

  const fetchData = async () => {
    try {
      const [tRes, eRes] = await Promise.all([
        getTargets({ month: filterMonth, year: filterYear }),
        getEmployees(),
      ]);
      const sortedTargets = tRes.data.sort((a, b) => {
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (a.status !== 'active' && b.status === 'active') return 1;
        return 0;
      });
      setTargets(sortedTargets);
      setEmployees(eRes.data);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filterMonth, filterYear]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.employeeId) return toast.error('Select an employee');
    try {
      await createTarget({
        ...form,
        targetValue: Number(form.targetValue),
        bonusAmount: Number(form.bonusAmount) || 0,
        month: filterMonth,
        year: filterYear,
      });
      toast.success('Target created');
      setShowModal(false);
      setForm({ employeeId: '', targetType: 'sales', targetValue: '', bonusAmount: '', notes: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    }
  };

  const handleUpdateProgress = async (id, currentValue) => {
    const newVal = prompt('Enter new achieved value:', currentValue);
    if (newVal === null) return;
    try {
      await updateTargetProgress(id, { achievedValue: Number(newVal) });
      toast.success('Progress updated');
      fetchData();
    } catch (err) { toast.error('Failed to update'); }
  };

  const handlePayBonus = async (id) => {
    if (!window.confirm('Mark bonus as paid?')) return;
    try {
      await payTargetBonus(id);
      toast.success('Bonus marked as paid');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDeleteClick = (target) => {
    setItemToDelete(target);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteTarget(itemToDelete._id);
      toast.success('Target deleted');
      setDeleteModalOpen(false);
      setItemToDelete(null);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete target'); }
  };

  if (loading) {
    return (
      <DashboardLayout navItems={navItems} title="Targets">
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-primary-blue border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const completedCount = targets.filter(t => t.status === 'completed').length;
  const totalBonus = targets.filter(t => t.status === 'completed').reduce((s, t) => s + (t.bonusAmount || 0), 0);

  return (
    <DashboardLayout navItems={navItems} title="Targets">
      <div className="ds-page">
        <div className="ds-page-header">
          <div className="ds-page-header-left">
            <div className="ds-page-header-icon">
              <Target size={20} strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="ds-page-title">Employee Targets</h1>
              <p className="ds-page-subtitle">Monthly sales and operational performance milestones</p>
            </div>
          </div>
          
          <div className="ds-page-header-right flex flex-wrap gap-2 items-center">
            <select 
              value={filterMonth} 
              onChange={(e) => setFilterMonth(Number(e.target.value))}
              className="ds-input py-2 px-3 text-xs w-auto cursor-pointer"
            >
              {Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', {month: 'long'})}</option>)}
            </select>
            <select 
              value={filterYear} 
              onChange={(e) => setFilterYear(Number(e.target.value))}
              className="ds-input py-2 px-3 text-xs w-auto cursor-pointer"
            >
              {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button 
              onClick={() => setShowModal(true)} 
              className="ds-btn ds-btn-primary"
            >
              <Plus size={15} /> Assign Target
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="ds-stat">
            <span className="ds-stat-label">Assigned Targets</span>
            <div className="ds-stat-value text-slate-900">{targets.length}</div>
            <p className="ds-stat-sub">For selected month</p>
          </div>
          <div className="ds-stat">
            <span className="ds-stat-label text-emerald-600">Completed Targets</span>
            <div className="ds-stat-value text-emerald-600">{completedCount}</div>
            <p className="ds-stat-sub">Milestones achieved</p>
          </div>
          <div className="ds-stat">
            <span className="ds-stat-label text-amber-600">Total Incentive Bonus</span>
            <div className="ds-stat-value text-amber-600">Rs. {totalBonus.toLocaleString()}</div>
            <p className="ds-stat-sub">Performance bonuses</p>
          </div>
        </div>

        {/* Targets Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {targets.map(t => {
            const progress = t.targetValue > 0 ? Math.min(100, Math.round((t.achievedValue / t.targetValue) * 100)) : 0;
            const isCompleted = t.status === 'completed';
            return (
              <div key={t._id} className="ds-card p-5 flex flex-col justify-between group relative">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs">
                        {t.employeeId?.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-xs m-0 leading-tight">{t.employeeId?.name || 'Employee'}</p>
                        <p className="text-[0.65rem] uppercase font-bold text-slate-400 m-0 mt-0.5">{t.employeeId?.role}</p>
                      </div>
                    </div>
                    
                    <button onClick={() => handleDeleteClick(t)} className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors border-0 bg-transparent cursor-pointer opacity-0 group-hover:opacity-100">
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-100 mb-4">
                    <p className="text-[0.65rem] uppercase font-bold text-slate-400 mb-1">{t.targetType.replace('_', ' ')} Target</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-bold text-slate-900">{t.achievedValue}</span>
                      <span className="text-xs font-semibold text-slate-400">/ {t.targetValue}</span>
                    </div>
                    {t.notes && <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-200/60 m-0">{t.notes}</p>}
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[0.65rem] uppercase font-bold text-slate-400">Progress</span>
                      <span className={`text-xs font-bold ${isCompleted ? 'text-emerald-600' : 'text-slate-900'}`}>{progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-600' : 'bg-slate-900'}`} style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-auto">
                  <span className={`ds-badge ${
                    isCompleted ? 'ds-badge-green' : 
                    t.status === 'missed' ? 'ds-badge-red' : 
                    'ds-badge-amber'
                  }`}>
                    {isCompleted ? 'Done' : t.status === 'missed' ? 'Missed' : 'Active'}
                  </span>
                  
                  <div className="flex gap-2">
                    {!isCompleted && t.targetType === 'sales' && (
                      <span className="text-[0.65rem] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                        Live POS sales
                      </span>
                    )}
                    {!isCompleted && t.targetType !== 'sales' && (
                      <button onClick={() => handleUpdateProgress(t._id, t.achievedValue)} className="text-xs uppercase font-bold tracking-wider bg-slate-100 text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-200 transition-colors">
                        Update
                      </button>
                    )}
                    {isCompleted && t.bonusAmount > 0 && !t.bonusPaid && (
                      <button onClick={() => handlePayBonus(t._id)} className="text-xs uppercase font-bold tracking-wider bg-amber-50 text-amber-600 px-4 py-2 rounded-xl hover:bg-amber-100 transition-colors flex items-center gap-1.5 border border-amber-200">
                        <Award size={12} /> Pay Bonus
                      </button>
                    )}
                    {t.bonusPaid && (
                      <span className="text-xs uppercase font-bold tracking-wider text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl flex items-center gap-1.5 border border-emerald-100">
                        <CheckCircle size={12} /> Paid
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {targets.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center shadow-sm flex flex-col items-center justify-center mt-6">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
              <Target size={32} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">No Targets Found</h3>
            <p className="text-sm font-bold text-slate-400">There are no targets for this period.</p>
          </div>
        )}
      </div>

      {/* Create Target Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col border border-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-slate-100 flex flex-col items-center justify-center text-center bg-white/80 backdrop-blur-md relative">
              <button onClick={() => setShowModal(false)} className="absolute right-4 top-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
                <X size={16} />
              </button>
              <div className="w-12 h-12 bg-brand-indigo/10 text-brand-indigo rounded-full flex items-center justify-center mb-3 border border-brand-indigo/20 shadow-sm">
                <Target size={24} />
              </div>
              <h3 className="font-bold text-slate-900 text-xl">Assign Target</h3>
              <p className="text-xs font-bold text-slate-500 mt-1">Set a new goal for an employee</p>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 bg-slate-50/50 space-y-4">
              <div>
                <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2">Employee *</label>
                <EmployeeSelector
                  multiple={false}
                  employees={employees}
                  value={form.employeeId ? [form.employeeId] : []}
                  onChange={([id]) => setForm({ ...form, employeeId: id || '' })}
                  placeholder="Search and select employee..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2">Target Type *</label>
                  <select value={form.targetType} onChange={(e) => setForm({...form, targetType: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm cursor-pointer">
                    {TARGET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2">Target Value *</label>
                  <input type="number" required min="1" value={form.targetValue} onChange={(e) => setForm({...form, targetValue: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2">Bonus Amount (Rs.)</label>
                <input type="number" min="0" value={form.bonusAmount} onChange={(e) => setForm({...form, bonusAmount: e.target.value})}
                  placeholder="0" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm" />
              </div>
              <div>
                <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2">Notes (optional)</label>
                <textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})}
                  placeholder="Additional details..." className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm resize-none" rows="2" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl bg-slate-100 text-xs uppercase tracking-wider font-bold hover:bg-slate-200 text-slate-700 transition-all">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-brand-indigo hover:bg-indigo-700 text-white text-xs uppercase tracking-wider font-bold shadow-lg shadow-brand-indigo/20 transition-all">
                  Assign Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setItemToDelete(null); }}
        onConfirm={handleDeleteConfirm}
        itemName="this target"
      />
    </DashboardLayout>
  );
};

export default AdminTargets;

