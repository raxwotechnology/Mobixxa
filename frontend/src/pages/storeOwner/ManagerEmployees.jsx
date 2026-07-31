import { useState, useEffect } from 'react';
import { Users, Search, Edit3, Save, X, UserPlus, Clock, Calendar, CheckCircle, Trash2 } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { getEmployees, addEmployee, updateEmployee, deleteEmployee } from '../../services/api';
import { toast } from 'react-toastify';
import { managerNavGroups } from './managerNavItems';
import useAuthStore from '../../store/authStore';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';

const roleColors = {
  cashier: 'bg-teal-100 text-teal-700',
  deliveryGuy: 'bg-blue-100 text-blue-700',
  stockEmployee: 'bg-purple-100 text-purple-700',
  manager: 'bg-amber-100 text-amber-700',
};

const emptyNewForm = {
  name: '', email: '', password: '', phone: '', role: 'cashier',
  salary: '', department: '', bankAccount: '', bankName: '', bankBranch: '', epfNo: '', etfNo: '',
};

const ManagerEmployees = ({ navItems = managerNavGroups, title = 'Manager Dashboard' }) => {
  const user = useAuthStore((s) => s.user);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newForm, setNewForm] = useState(emptyNewForm);
  const [editingId, setEditingId] = useState(null);
  const [adding, setAdding] = useState(false);

  // Deletion Password Confirmation States
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    try {
      const { data } = await getEmployees({ includeManagers: true });
      setEmployees(data);
    } catch (err) {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setNewForm(emptyNewForm);
    setShowAddModal(true);
  };

  const openEdit = (emp) => {
    setEditingId(emp._id);
    setNewForm({
      name: emp.name || '',
      email: emp.email || '',
      password: '', // Blank by default when editing
      phone: emp.phone || '',
      role: emp.role || 'cashier',
      salary: emp.employeeInfo?.salary || '',
      department: emp.employeeInfo?.department || '',
      bankAccount: emp.employeeInfo?.bankAccount || '',
      bankName: emp.employeeInfo?.bankName || '',
      bankBranch: emp.employeeInfo?.bankBranch || '',
      epfNo: emp.employeeInfo?.epfNo || '',
      etfNo: emp.employeeInfo?.etfNo || '',
    });
    setShowAddModal(true);
  };

  const handleDeleteClick = (emp) => {
    setItemToDelete({ id: emp._id, name: emp.name });
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      await deleteEmployee(itemToDelete.id);
      toast.success('Employee deleted successfully');
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete employee');
    }
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    if (!newForm.name || !newForm.email || (!editingId && !newForm.password)) {
      toast.error('Name, email and password are required');
      return;
    }
    setAdding(true);
    try {
      const payload = {
        ...newForm,
        salary: Number(newForm.salary) || 0,
      };

      if (editingId) {
        if (!payload.password) {
          delete payload.password; // Do not overwrite with blank password
        }
        await updateEmployee(editingId, payload);
        toast.success('Employee updated successfully!');
      } else {
        await addEmployee(payload);
        toast.success('Employee registered successfully!');
      }

      setShowAddModal(false);
      setNewForm(emptyNewForm);
      setEditingId(null);
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save employee');
    } finally {
      setAdding(false);
    }
  };

  const filtered = employees.filter(
    (e) => e.name?.toLowerCase().includes(search.toLowerCase()) || e.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout navItems={navItems} title={title}>
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-primary-blue border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} title={title}>
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white/40 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-indigo/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="inline-flex items-center gap-1.5 bg-brand-indigo/10 text-brand-indigo text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border border-brand-indigo/15">
                Staff & Roles
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 m-0">Employees Registry</h1>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-2 m-0">{employees.length} registered staff members</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={openCreate}
              className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] uppercase tracking-wider font-black px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2">
              <UserPlus size={14} /> Add Employee
            </button>
          </div>
        </div>

        <div className="relative mb-6">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-96 bg-white/80 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm"
          />
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <Users size={48} className="mx-auto text-slate-300 mb-3" />
            <h3 className="font-black text-slate-700 text-sm uppercase tracking-wider">No employees found</h3>
            <p className="text-slate-400 text-xs mt-1">Click "Add Employee" to register your first staff member</p>
          </div>
        )}

        <div className="grid gap-4">
          {filtered.map((emp) => (
            <div key={emp._id} className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/40 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-indigo to-brand-violet flex items-center justify-center text-white font-black text-lg shadow-sm">
                    {emp.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-sm m-0">{emp.name}</h3>
                    <p className="text-xs text-slate-400 font-bold m-0 mt-0.5">{emp.email}</p>
                    {emp.phone && <p className="text-[11px] text-slate-500 font-semibold m-0 mt-1 flex items-center gap-1">📞 {emp.phone}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border ${roleColors[emp.role] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    {emp.role === 'deliveryGuy' ? 'Delivery Rider' : emp.role === 'stockEmployee' ? 'Stock Employee' : emp.role === 'cashier' ? 'Cashier' : emp.role}
                  </span>
                  {emp.assignedStore?.name && (
                    <span className="text-[10px] uppercase font-black tracking-wider bg-slate-50 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg">🏪 {emp.assignedStore.name}</span>
                  )}
                  <div className="flex gap-1.5 border-l border-slate-150 pl-3">
                    <button onClick={() => openEdit(emp)} className="p-2 rounded-xl bg-slate-50 border border-slate-200/60 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors" title="Edit">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => handleDeleteClick(emp)} className="p-2 rounded-xl bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-500 hover:text-rose-700 transition-colors" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] text-slate-500 font-bold border-t border-slate-100/60 pt-4">
                <span className="flex items-center gap-1 text-slate-600">💰 Rs. {(emp.employeeInfo?.salary || 0).toLocaleString()}</span>
                <span className="flex items-center gap-1">🏢 {emp.employeeInfo?.department || '—'}</span>
                <span className="flex items-center gap-1">🏦 {emp.employeeInfo?.bankName || '—'} {emp.employeeInfo?.bankBranch ? `(${emp.employeeInfo.bankBranch})` : ''}</span>
                <span className="flex items-center gap-1">📋 EPF: {emp.employeeInfo?.epfNo || '—'}</span>
              </div>
            </div>
          ))}
        </div>

        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-card-border">
                <h2 className="text-lg font-bold text-dark-navy flex items-center gap-2">
                  <UserPlus size={20} className="text-primary-blue" /> {editingId ? 'Edit Employee Info' : 'Register New Employee'}
                </h2>
                <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={18} /></button>
              </div>

              <form onSubmit={handleSaveEmployee} className="p-5 space-y-4">
                {/* Basic Info */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-dark-navy mb-2">👤 Basic Information</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-xs text-muted-text block mb-1">Full Name *</label>
                      <input required value={newForm.name} onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                        className="w-full border border-card-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue" placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-text block mb-1">Email *</label>
                      <input required type="email" value={newForm.email} onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
                        className="w-full border border-card-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue" placeholder="john@example.com" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-text block mb-1">Password {editingId ? '(Leave blank to keep same)' : '*'}</label>
                      <input required={!editingId} type="password" value={newForm.password} onChange={(e) => setNewForm({ ...newForm, password: e.target.value })}
                        className="w-full border border-card-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue" placeholder={editingId ? '••••••••' : 'Min 6 characters'} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-text block mb-1">Phone</label>
                      <input value={newForm.phone} onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })}
                        className="w-full border border-card-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue" placeholder="+94 7X XXX XXXX" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-text block mb-1">Role *</label>
                      <select value={newForm.role} onChange={(e) => setNewForm({ ...newForm, role: e.target.value })}
                        className="w-full border border-card-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue bg-white">
                        <option value="cashier">Cashier</option>
                        <option value="deliveryGuy">Delivery Rider</option>
                        <option value="stockEmployee">Stock Employee</option>
                        {user?.role === 'admin' && <option value="manager">Manager</option>}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Employment Info */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-dark-navy mb-2">💼 Employment Details</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-text block mb-1">Monthly Salary (LKR)</label>
                      <input type="number" value={newForm.salary} onChange={(e) => setNewForm({ ...newForm, salary: e.target.value })}
                        className="w-full border border-card-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue" placeholder="45000" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-text block mb-1">Department</label>
                      <input value={newForm.department} onChange={(e) => setNewForm({ ...newForm, department: e.target.value })}
                        className="w-full border border-card-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue" placeholder="Sales / Logistics" />
                    </div>
                  </div>
                </div>

                {/* Bank & EPF/ETF */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-dark-navy mb-2">🏦 Bank & Statutory Details</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-text block mb-1">Bank Name</label>
                      <input value={newForm.bankName} onChange={(e) => setNewForm({ ...newForm, bankName: e.target.value })}
                        className="w-full border border-card-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue" placeholder="Bank of Ceylon" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-text block mb-1">Bank Branch</label>
                      <input value={newForm.bankBranch} onChange={(e) => setNewForm({ ...newForm, bankBranch: e.target.value })}
                        className="w-full border border-card-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue" placeholder="Colombo Main" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-text block mb-1">Account Number</label>
                      <input value={newForm.bankAccount} onChange={(e) => setNewForm({ ...newForm, bankAccount: e.target.value })}
                        className="w-full border border-card-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue" placeholder="XXXX XXXX XXXX" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-text block mb-1">EPF Number</label>
                      <input value={newForm.epfNo} onChange={(e) => setNewForm({ ...newForm, epfNo: e.target.value })}
                        className="w-full border border-card-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue" placeholder="EPF-XXXXX" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-muted-text block mb-1">ETF Number</label>
                      <input value={newForm.etfNo} onChange={(e) => setNewForm({ ...newForm, etfNo: e.target.value })}
                        className="w-full border border-card-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue" placeholder="ETF-XXXXX" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowAddModal(false)}
                    className="px-5 py-2.5 text-sm font-medium text-muted-text hover:text-dark-navy transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={adding}
                    className="flex items-center gap-2 bg-primary-blue hover:bg-emerald-600 text-white font-medium px-6 py-2.5 rounded-xl transition-colors shadow-md disabled:opacity-50">
                    <UserPlus size={16} /> {adding ? 'Saving...' : editingId ? 'Update Employee' : 'Register Employee'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setItemToDelete(null); }}
        onConfirm={handleDeleteConfirm}
        itemName={itemToDelete?.name}
      />
    </DashboardLayout>
  );
};

export default ManagerEmployees;

