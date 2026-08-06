import { useState, useEffect } from 'react';
import { DollarSign, Plus, Search, Trash2, Calendar, User, FileText, CheckCircle } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { getSalaryAdvances, recordSalaryAdvance, deleteSalaryAdvance, getAdminUsers } from '../../services/api';
import { adminNavGroups as navItems } from './adminNavItems';
import { toast } from 'react-toastify';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';

const now = new Date();

const AdminSalaryAdvances = () => {
  const [advances, setAdvances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [search, setSearch] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [empSearch, setEmpSearch] = useState('');
  const [form, setForm] = useState({ employeeId: '', amount: '', reason: '', date: new Date().toISOString().split('T')[0] });
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    fetchData();
  }, [month, year]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [advRes, empRes] = await Promise.all([
        getSalaryAdvances({ month, year }),
        getAdminUsers({ limit: 100 }),
      ]);
      setAdvances(advRes.data || []);
      const allUsers = empRes.data?.users || empRes.data || [];
      setEmployees(allUsers.filter(u => u.role !== 'customer'));
    } catch (err) {
      toast.error('Failed to load salary advances');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await recordSalaryAdvance(form);
      toast.success('Salary advance recorded');
      setShowModal(false);
      setForm({ employeeId: '', amount: '', reason: '', date: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record advance');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteSalaryAdvance(itemToDelete._id);
      toast.success('Salary advance removed');
      setDeleteModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to delete advance');
    }
  };

  const totalMonthAdvances = advances.reduce((sum, a) => sum + (a.amount || 0), 0);

  const filteredAdvances = advances.filter(a =>
    a.employeeId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.reason?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout navItems={navItems} title="Mobile Hub Admin Panel">
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2 m-0">
              <DollarSign size={24} className="text-emerald-600" /> Salary Advances Management
            </h1>
            <p className="text-xs font-semibold text-slate-500 mt-1 m-0">
              Record and track monthly salary advances taken by employees (automatically deducted in monthly payroll)
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider px-5 py-3 rounded-2xl shadow-md transition-all cursor-pointer border-0"
          >
            <Plus size={16} /> Record New Advance
          </button>
        </div>

        {/* Filters & Total Metric Card */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-3xl shadow-md">
            <span className="text-[10px] font-black uppercase tracking-wider opacity-80">Total Advances ({month}/{year})</span>
            <h2 className="text-2xl font-black mt-1 m-0">Rs. {totalMonthAdvances.toLocaleString()}</h2>
            <p className="text-[10px] opacity-90 mt-1 m-0">{advances.length} advance record(s)</p>
          </div>

          <div className="md:col-span-3 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by employee name or reason..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={month}
                onChange={e => setMonth(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 cursor-pointer"
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString('en', { month: 'long' })}
                  </option>
                ))}
              </select>
              <select
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 cursor-pointer"
              >
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Advances Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredAdvances.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-bold text-xs uppercase tracking-wider">
              No salary advances recorded for {month}/{year}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-black uppercase tracking-wider">
                    <th className="px-5 py-4">Employee</th>
                    <th className="px-5 py-4">Request Date</th>
                    <th className="px-5 py-4">Advance Amount</th>
                    <th className="px-5 py-4">Reason / Notes</th>
                    <th className="px-5 py-4">Approved By</th>
                    <th className="px-5 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {filteredAdvances.map(adv => (
                    <tr key={adv._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black">
                            {adv.employeeId?.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 m-0">{adv.employeeId?.name || 'Unknown'}</p>
                            <p className="text-[10px] text-slate-400 m-0">{adv.employeeId?.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-700">
                        {new Date(adv.requestDate).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-black text-emerald-600 text-sm">
                          Rs. {Number(adv.amount || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600 italic">
                        "{adv.reason || 'General advance'}"
                      </td>
                      <td className="px-5 py-4 text-slate-700 font-bold">
                        {adv.approvedBy?.name || 'Admin'}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => { setItemToDelete(adv); setDeleteModalOpen(true); }}
                          className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all cursor-pointer border-0"
                          title="Delete Advance Record"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Record Advance Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-lg font-black text-slate-900 m-0">Record Salary Advance</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Search & Select Employee *</label>
                <input
                  type="text"
                  placeholder="🔍 Type employee name..."
                  value={empSearch}
                  onChange={e => setEmpSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs mb-2 font-semibold text-slate-800"
                />
                <select
                  required
                  value={form.employeeId}
                  onChange={e => setForm({ ...form, employeeId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800"
                >
                  <option value="">Select Employee ({employees.length} available)</option>
                  {employees
                    .filter(e => e.name?.toLowerCase().includes(empSearch.toLowerCase()))
                    .map(e => (
                      <option key={e._id} value={e._id}>{e.name} ({e.role})</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Advance Amount (LKR) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  placeholder="e.g. 15000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Date Issued</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Reason / Note</label>
                <input
                  type="text"
                  value={form.reason}
                  onChange={e => setForm({ ...form, reason: e.target.value })}
                  placeholder="e.g. Personal emergency advance"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-800"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer border-0 shadow-md"
                >
                  Record Advance
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs uppercase tracking-wider cursor-pointer border-0"
                >
                  Cancel
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
        itemName={itemToDelete ? `Advance of Rs. ${itemToDelete.amount} for ${itemToDelete.employeeId?.name}` : ''}
      />
    </DashboardLayout>
  );
};

export default AdminSalaryAdvances;
