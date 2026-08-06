import { useState, useEffect } from 'react';
import { Users, Search, Plus, Edit2, Trash2, X, Eye, Phone, Mail, Building, CreditCard, Shield, FileText, UserCheck, AlertCircle, DollarSign } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { getAdminUsers, createUser, updateUser, deleteUser, getAdminStores } from '../../services/api';
import { adminNavGroups as defaultNavItems } from './adminNavItems';
import { toast } from 'react-toastify';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';

const emptyForm = {
  name: '',
  email: '',
  password: '',
  phone: '',
  role: 'cashier',
  assignedStore: '',
  department: 'Sales',
  monthlySalary: '',
  bankName: '',
  bankAccount: '',
  bankBranch: '',
  nic: '',
  emergencyName: '',
  emergencyPhone: '',
  emergencyRelation: '',
  agreementUrl: '',
};

const roleColors = {
  admin: 'bg-purple-100 text-purple-700 border-purple-200',
  manager: 'bg-blue-100 text-blue-700 border-blue-200',
  cashier: 'bg-amber-100 text-amber-700 border-amber-200',
  deliveryGuy: 'bg-teal-100 text-teal-700 border-teal-200',
  stockEmployee: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const roleLabels = {
  admin: 'Admin / Director',
  manager: 'Store Manager',
  cashier: 'Cashier / Sales',
  deliveryGuy: 'Delivery Driver',
  stockEmployee: 'Stock / Warehouse',
};

const AdminEmployees = ({ navItems: propNavItems }) => {
  const navItems = propNavItems || defaultNavItems;
  const [employees, setEmployees] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [viewModalEmployee, setViewModalEmployee] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [empRes, storeRes] = await Promise.all([
        getAdminUsers({ limit: 100 }),
        getAdminStores(),
      ]);
      const allUsers = empRes.data?.users || empRes.data || [];
      // Filter out pure customers to list all staff & admins
      const staffMembers = allUsers.filter(u => u.role !== 'customer');
      setEmployees(staffMembers);
      setStores(storeRes.data?.stores || storeRes.data || []);
    } catch (err) {
      toast.error('Failed to load employees data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const handleOpenEdit = (emp) => {
    setEditingId(emp._id);
    setForm({
      name: emp.name || '',
      email: emp.email || '',
      password: '',
      phone: emp.phone || '',
      role: emp.role || 'cashier',
      assignedStore: emp.assignedStore?._id || emp.assignedStore || '',
      department: emp.employeeInfo?.department || 'Sales',
      monthlySalary: emp.employeeInfo?.salary || '',
      bankName: emp.employeeInfo?.bankName || '',
      bankAccount: emp.employeeInfo?.bankAccount || '',
      bankBranch: emp.employeeInfo?.bankBranch || '',
      nic: emp.employeeInfo?.nic || '',
      emergencyName: emp.employeeInfo?.emergencyContact?.name || '',
      emergencyPhone: emp.employeeInfo?.emergencyContact?.phone || '',
      emergencyRelation: emp.employeeInfo?.emergencyContact?.relationship || '',
      agreementUrl: emp.agreements?.[0]?.url || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        role: form.role,
        assignedStore: form.assignedStore || null,
        employeeInfo: {
          department: form.department,
          salary: Number(form.monthlySalary) || 0,
          bankName: form.bankName,
          bankAccount: form.bankAccount,
          bankBranch: form.bankBranch,
          nic: form.nic,
          emergencyContact: {
            name: form.emergencyName,
            phone: form.emergencyPhone,
            relationship: form.emergencyRelation,
          },
        },
      };

      if (form.password) payload.password = form.password;
      if (form.agreementUrl) {
        payload.agreements = [{ name: 'Employment Agreement', url: form.agreementUrl }];
      }

      if (editingId) {
        await updateUser(editingId, payload);
        toast.success('Employee updated successfully');
      } else {
        if (!form.password) return toast.error('Password is required for new employee');
        await createUser(payload);
        toast.success('Employee created successfully');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save employee');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteUser(itemToDelete._id);
      toast.success('Employee removed');
      setDeleteModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete employee');
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name?.toLowerCase().includes(search.toLowerCase()) ||
      emp.email?.toLowerCase().includes(search.toLowerCase()) ||
      emp.phone?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || emp.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <DashboardLayout navItems={navItems} title="Mobile Hub Admin Panel">
      <div className="space-y-6">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2 m-0">
              <Users size={24} className="text-brand-indigo" /> Employee Directory
            </h1>
            <p className="text-xs font-semibold text-slate-500 mt-1 m-0">
              Manage complete staff profiles, salaries, bank details, roles, and emergency contacts
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider px-5 py-3 rounded-2xl shadow-md transition-all cursor-pointer border-0"
          >
            <Plus size={16} /> Add New Employee
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs font-bold text-slate-500 whitespace-nowrap">Filter Role:</label>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 cursor-pointer focus:outline-none"
            >
              <option value="all">All Roles ({employees.length})</option>
              <option value="admin">Admin / Director</option>
              <option value="manager">Store Manager</option>
              <option value="cashier">Cashier</option>
              <option value="deliveryGuy">Delivery Driver</option>
              <option value="stockEmployee">Stock / Warehouse</option>
            </select>
          </div>
        </div>

        {/* Employees Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="w-8 h-8 border-3 border-brand-indigo border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-bold text-xs uppercase tracking-wider">
              No employees found matching filter
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-black uppercase tracking-wider">
                    <th className="px-5 py-4">Employee</th>
                    <th className="px-5 py-4">Role</th>
                    <th className="px-5 py-4">Store & Dept</th>
                    <th className="px-5 py-4">Monthly Salary</th>
                    <th className="px-5 py-4">Bank & Contact</th>
                    <th className="px-5 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {filteredEmployees.map(emp => (
                    <tr key={emp._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-700 text-sm border border-slate-200">
                            {emp.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 m-0">{emp.name}</p>
                            <p className="text-[10px] text-slate-400 font-semibold m-0">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${roleColors[emp.role] || 'bg-slate-100 text-slate-700'}`}>
                          {roleLabels[emp.role] || emp.role}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-800 m-0">{emp.assignedStore?.name || 'All Stores'}</p>
                        <p className="text-[10px] text-slate-450 font-semibold m-0">{emp.employeeInfo?.department || 'General'}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-black text-emerald-600 m-0">
                          Rs. {Number(emp.employeeInfo?.salary || 0).toLocaleString()}
                        </p>
                        <p className="text-[9px] text-slate-400 uppercase font-black m-0">Monthly Base</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-800 m-0">{emp.phone || 'No Phone'}</p>
                        <p className="text-[10px] text-slate-450 truncate max-w-[140px] m-0">
                          {emp.employeeInfo?.bankName ? `${emp.employeeInfo.bankName} - ${emp.employeeInfo.bankAccount}` : 'No Bank Linked'}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setViewModalEmployee(emp)}
                            className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all cursor-pointer border-0"
                            title="View Full Employee Dossier"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(emp)}
                            className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer border-0"
                            title="Edit Employee"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => { setItemToDelete(emp); setDeleteModalOpen(true); }}
                            className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all cursor-pointer border-0"
                            title="Delete Employee"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h2 className="text-lg font-black text-slate-900 m-0">
                {editingId ? 'Edit Employee Profile' : 'Register New Employee'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Kasun Perera"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="kasun@mobilehub.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {editingId ? 'Password (Leave blank to keep unchanged)' : 'Password *'}
                  </label>
                  <input
                    type="password"
                    required={!editingId}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="0771234567"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">System Role *</label>
                  <select
                    value={form.role}
                    onChange={e => setForm({ ...form, role: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 cursor-pointer"
                  >
                    <option value="admin">Admin / Director</option>
                    <option value="manager">Store Manager</option>
                    <option value="cashier">Cashier</option>
                    <option value="deliveryGuy">Delivery Driver</option>
                    <option value="stockEmployee">Stock / Warehouse</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Assigned Store</label>
                  <select
                    value={form.assignedStore}
                    onChange={e => setForm({ ...form, assignedStore: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 cursor-pointer"
                  >
                    <option value="">All Stores (Global)</option>
                    {stores.map(s => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Department</label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={e => setForm({ ...form, department: e.target.value })}
                    placeholder="e.g. Sales, Repair"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>

              {/* Salary & Bank Section */}
              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs font-black uppercase text-brand-indigo tracking-wider mb-2">Compensation & Bank Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Monthly Base Salary (LKR)</label>
                    <input
                      type="number"
                      value={form.monthlySalary}
                      onChange={e => setForm({ ...form, monthlySalary: e.target.value })}
                      placeholder="e.g. 75000"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">NIC Number</label>
                    <input
                      type="text"
                      value={form.nic}
                      onChange={e => setForm({ ...form, nic: e.target.value })}
                      placeholder="e.g. 19951230456V"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={form.bankName}
                      onChange={e => setForm({ ...form, bankName: e.target.value })}
                      placeholder="e.g. Commercial Bank"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Account Number</label>
                    <input
                      type="text"
                      value={form.bankAccount}
                      onChange={e => setForm({ ...form, bankAccount: e.target.value })}
                      placeholder="8001234567"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Branch</label>
                    <input
                      type="text"
                      value={form.bankBranch}
                      onChange={e => setForm({ ...form, bankBranch: e.target.value })}
                      placeholder="e.g. Colombo 03"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact & Agreement */}
              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs font-black uppercase text-brand-indigo tracking-wider mb-2">Emergency Contact & Agreement</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Contact Name</label>
                    <input
                      type="text"
                      value={form.emergencyName}
                      onChange={e => setForm({ ...form, emergencyName: e.target.value })}
                      placeholder="e.g. Sunethra Perera"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Relationship</label>
                    <input
                      type="text"
                      value={form.emergencyRelation}
                      onChange={e => setForm({ ...form, emergencyRelation: e.target.value })}
                      placeholder="e.g. Spouse / Mother"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Contact Phone</label>
                    <input
                      type="text"
                      value={form.emergencyPhone}
                      onChange={e => setForm({ ...form, emergencyPhone: e.target.value })}
                      placeholder="0719876543"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Agreement / Document URL</label>
                  <input
                    type="text"
                    value={form.agreementUrl}
                    onChange={e => setForm({ ...form, agreementUrl: e.target.value })}
                    placeholder="https://drive.google.com/... or document link"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 bg-brand-indigo hover:bg-brand-violet text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer border-0 shadow-md"
                >
                  {editingId ? 'Save Employee Changes' : 'Create Employee Profile'}
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

      {/* View Full Employee Dossier Modal */}
      {viewModalEmployee && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative text-left">
            <button
              onClick={() => setViewModalEmployee(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full cursor-pointer transition-colors"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-4 border-b border-slate-100 pb-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-indigo/10 text-brand-indigo flex items-center justify-center text-xl font-black border border-brand-indigo/20">
                {viewModalEmployee.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 m-0">{viewModalEmployee.name}</h3>
                <p className="text-xs text-slate-500 font-semibold m-0 mt-0.5">{viewModalEmployee.email}</p>
                <span className={`inline-block mt-1 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${roleColors[viewModalEmployee.role] || 'bg-slate-100 text-slate-700'}`}>
                  {roleLabels[viewModalEmployee.role] || viewModalEmployee.role}
                </span>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Monthly Base Salary</span>
                  <span className="font-black text-emerald-600 text-sm">
                    Rs. {Number(viewModalEmployee.employeeInfo?.salary || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Department</span>
                  <span className="font-bold text-slate-800">{viewModalEmployee.employeeInfo?.department || 'Sales'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Phone</span>
                  <span className="font-bold text-slate-800">{viewModalEmployee.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">NIC</span>
                  <span className="font-mono font-bold text-slate-800">{viewModalEmployee.employeeInfo?.nic || 'N/A'}</span>
                </div>
              </div>

              {/* Bank Details */}
              <div className="bg-blue-50/60 p-3.5 rounded-2xl border border-blue-100">
                <p className="font-black uppercase text-[10px] text-blue-700 tracking-wider m-0 mb-1 flex items-center gap-1.5">
                  <CreditCard size={13} /> Bank Account Information
                </p>
                <p className="font-bold text-slate-800 m-0">
                  {viewModalEmployee.employeeInfo?.bankName || 'No Bank Name Specified'}
                </p>
                <p className="font-mono text-slate-700 m-0 mt-0.5">
                  Account No: {viewModalEmployee.employeeInfo?.bankAccount || 'N/A'}
                </p>
                <p className="text-[10px] text-slate-500 m-0 mt-0.5">
                  Branch: {viewModalEmployee.employeeInfo?.bankBranch || 'Main Branch'}
                </p>
              </div>

              {/* Emergency Contact */}
              <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-100">
                <p className="font-black uppercase text-[10px] text-amber-700 tracking-wider m-0 mb-1 flex items-center gap-1.5">
                  <AlertCircle size={13} /> Emergency Contact
                </p>
                <p className="font-bold text-slate-800 m-0">
                  {viewModalEmployee.employeeInfo?.emergencyContact?.name || 'No Emergency Contact Added'}
                </p>
                <p className="text-slate-700 m-0 mt-0.5">
                  Relation: {viewModalEmployee.employeeInfo?.emergencyContact?.relationship || 'N/A'} • Phone: {viewModalEmployee.employeeInfo?.emergencyContact?.phone || 'N/A'}
                </p>
              </div>

              {/* Agreement Document */}
              {viewModalEmployee.agreements?.[0]?.url && (
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <FileText size={14} className="text-brand-indigo" /> Employment Agreement Document
                  </span>
                  <a
                    href={viewModalEmployee.agreements[0].url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-black text-brand-indigo hover:underline"
                  >
                    View Document
                  </a>
                </div>
              )}
            </div>

            <button
              onClick={() => setViewModalEmployee(null)}
              className="w-full mt-5 bg-slate-900 hover:bg-slate-800 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider cursor-pointer border-0"
            >
              Close Dossier
            </button>
          </div>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setItemToDelete(null); }}
        onConfirm={handleDeleteConfirm}
        itemName={itemToDelete?.name}
      />
    </DashboardLayout>
  );
};

export default AdminEmployees;
