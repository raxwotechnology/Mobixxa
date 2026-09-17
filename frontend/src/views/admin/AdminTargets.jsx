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
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-brand-indigo/10 to-brand-violet/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          
          <div className="relative">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Employee Targets</h1>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-sm font-bold text-slate-500">{targets.length} Targets</p>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
              <p className="text-sm font-bold text-emerald-500">{completedCount} Completed</p>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
              <p className="text-sm font-bold text-amber-500">Rs. {totalBonus.toLocaleString()} Bonus</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 items-center relative">
            <select value={filterMonth} onChange={(e) => setFilterMonth(Number(e.target.value))}
              className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-[11px] font-black uppercase tracking-wider text-slate-600 outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all cursor-pointer shadow-sm">
              {Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', {month: 'long'})}</option>)}
            </select>
            <select value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))}
              className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-[11px] font-black uppercase tracking-wider text-slate-600 outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all cursor-pointer shadow-sm">
              {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-brand-indigo hover:bg-indigo-700 text-white px-5 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-lg shadow-brand-indigo/20 hover:shadow-xl hover:shadow-brand-indigo/30 hover:-translate-y-0.5">
              <Plus size={16} strokeWidth={3} /> Assign Target
            </button>
          </div>
        </div>

        {/* Targets Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {targets.map(t => {
            const progress = t.targetValue > 0 ? Math.min(100, Math.round((t.achievedValue / t.targetValue) * 100)) : 0;
            const isCompleted = t.status === 'completed';
            return (
              <div key={t._id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col justify-between">
                {isCompleted && (
                  <div className="absolute top-0 right-0 bg-emerald-50 text-emerald-600 border-b border-l border-emerald-100 text-[9px] font-black px-3 py-1.5 rounded-bl-xl uppercase tracking-wider shadow-sm z-10">
                    Completed
                  </div>
                )}
                <div className={`absolute top-0 left-0 w-1.5 h-full ${
                  isCompleted ? 'bg-emerald-400' : t.status === 'missed' ? 'bg-rose-400' : 'bg-brand-indigo'
                }`}></div>
                
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-indigo/10 to-brand-violet/10 flex items-center justify-center text-brand-indigo font-black text-sm border border-brand-indigo/10">
                        {t.employeeId?.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-base leading-tight">{t.employeeId?.name || 'Employee'}</p>
                        <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">{t.employeeId?.role}</p>
                      </div>
                    </div>
                    
                    <button onClick={() => handleDeleteClick(t)} className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 mb-4">
                    <p className="text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">{t.targetType.replace('_', ' ')} Target</p>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-black text-slate-900 leading-none">{t.achievedValue}</span>
                      <span className="text-sm font-bold text-slate-400 mb-0.5">/ {t.targetValue}</span>
                    </div>
                    {t.notes && <p className="text-[11px] font-bold text-slate-500 mt-3 pt-3 border-t border-slate-200">{t.notes}</p>}
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] uppercase font-black tracking-wider text-slate-500">Progress</span>
                      <span className={`text-[10px] font-black uppercase tracking-wider ${isCompleted ? 'text-emerald-500' : 'text-brand-indigo'}`}>{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-brand-indigo'}`} style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
                  <span className={`text-[10px] uppercase font-black tracking-widest px-3 py-1.5 rounded-lg border ${
                    isCompleted ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 
                    t.status === 'missed' ? 'bg-rose-50 text-rose-600 border-rose-200' : 
                    'bg-indigo-50 text-brand-indigo border-indigo-200'
                  }`}>
                    {isCompleted ? 'Done' : t.status === 'missed' ? 'Missed' : 'Active'}
                  </span>
                  
                  <div className="flex gap-2">
                    {!isCompleted && t.targetType === 'sales' && (
                      <span className="text-[10px] uppercase font-black tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-2 rounded-xl">
                        Live · from POS sales
                      </span>
                    )}
                    {!isCompleted && t.targetType !== 'sales' && (
                      <button onClick={() => handleUpdateProgress(t._id, t.achievedValue)} className="text-[10px] uppercase font-black tracking-wider bg-slate-100 text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-200 transition-colors">
                        Update
                      </button>
                    )}
                    {isCompleted && t.bonusAmount > 0 && !t.bonusPaid && (
                      <button onClick={() => handlePayBonus(t._id)} className="text-[10px] uppercase font-black tracking-wider bg-amber-50 text-amber-600 px-4 py-2 rounded-xl hover:bg-amber-100 transition-colors flex items-center gap-1.5 border border-amber-200">
                        <Award size={12} /> Pay Bonus
                      </button>
                    )}
                    {t.bonusPaid && (
                      <span className="text-[10px] uppercase font-black tracking-wider text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl flex items-center gap-1.5 border border-emerald-100">
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
            <h3 className="text-lg font-black text-slate-800 mb-1">No Targets Found</h3>
            <p className="text-sm font-bold text-slate-400">There are no targets for this period.</p>
          </div>
        )}
      </div>

      {/* Create Target Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col border border-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-slate-100 flex flex-col items-center justify-center text-center bg-white/80 backdrop-blur-md relative">
              <button onClick={() => setShowModal(false)} className="absolute right-4 top-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
                <X size={16} />
              </button>
              <div className="w-12 h-12 bg-brand-indigo/10 text-brand-indigo rounded-full flex items-center justify-center mb-3 border border-brand-indigo/20 shadow-sm">
                <Target size={24} />
              </div>
              <h3 className="font-black text-slate-900 text-xl">Assign Target</h3>
              <p className="text-xs font-bold text-slate-500 mt-1">Set a new goal for an employee</p>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 bg-slate-50/50 space-y-4">
              <div>
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Employee *</label>
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
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Target Type *</label>
                  <select value={form.targetType} onChange={(e) => setForm({...form, targetType: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm cursor-pointer">
                    {TARGET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Target Value *</label>
                  <input type="number" required min="1" value={form.targetValue} onChange={(e) => setForm({...form, targetValue: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm" />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Bonus Amount (Rs.)</label>
                <input type="number" min="0" value={form.bonusAmount} onChange={(e) => setForm({...form, bonusAmount: e.target.value})}
                  placeholder="0" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Notes (optional)</label>
                <textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})}
                  placeholder="Additional details..." className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm resize-none" rows="2" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl bg-slate-100 text-[11px] uppercase tracking-wider font-black hover:bg-slate-200 text-slate-700 transition-all">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-brand-indigo hover:bg-indigo-700 text-white text-[11px] uppercase tracking-wider font-black shadow-lg shadow-brand-indigo/20 transition-all">
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

