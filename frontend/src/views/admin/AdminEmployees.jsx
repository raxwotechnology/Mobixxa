'use client';

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
  admin: 'ds-badge-violet',
  manager: 'ds-badge-blue',
  cashier: 'ds-badge-amber',
  deliveryGuy: 'ds-badge-sky',
  stockEmployee: 'ds-badge-green',
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
    <DashboardLayout navItems={navItems} title="Mobixa Admin Panel">
      <div className="ds-page">
        {/* Header Block */}
        <div className="ds-page-header">
          <div className="ds-page-header-left">
            <div className="ds-page-header-badge">
              <Users size={24} />
            </div>
            <div>
              <h1>Employee Directory</h1>
              <p>Manage complete staff profiles, salaries, bank details, roles, and emergency contacts</p>
            </div>
          </div>
          <div className="ds-page-header-right">
            <button
              onClick={handleOpenCreate}
              className="ds-btn ds-btn-primary"
            >
              <Plus size={16} /> Add New Employee
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="ds-card">
          <div className="ds-filter-bar">
            <div className="ds-search">
              <Search size={16} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, email, or phone..."
              />
            </div>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="ds-select w-full sm:w-auto"
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
        <div className="ds-table-wrap">
          {loading ? (
            <div className="ds-loading">
              <div className="ds-spinner" />
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="ds-empty">
              <div className="ds-empty-title">No employees found matching filter</div>
            </div>
          ) : (
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Role</th>
                  <th>Store & Dept</th>
                  <th>Monthly Salary</th>
                  <th>Bank & Contact</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map(emp => (
                  <tr key={emp._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-sm border border-slate-200">
                          {emp.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 m-0">{emp.name}</p>
                          <p className="text-xs text-slate-400 font-semibold m-0">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`ds-badge ${roleColors[emp.role] || 'ds-badge-slate'}`}>
                        {roleLabels[emp.role] || emp.role}
                      </span>
                    </td>
                    <td>
                      <p className="font-bold text-slate-800 m-0">{emp.assignedStore?.name || 'All Stores'}</p>
                      <p className="text-xs text-slate-450 font-semibold m-0">{emp.employeeInfo?.department || 'General'}</p>
                    </td>
                    <td>
                      <p className="font-bold text-emerald-600 m-0">
                        Rs. {Number(emp.employeeInfo?.salary || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-400 uppercase font-bold m-0">Monthly Base</p>
                    </td>
                    <td>
                      <p className="font-bold text-slate-800 m-0">{emp.phone || 'No Phone'}</p>
                      <p className="text-xs text-slate-450 truncate max-w-[140px] m-0">
                        {emp.employeeInfo?.bankName ? `${emp.employeeInfo.bankName} - ${emp.employeeInfo.bankAccount}` : 'No Bank Linked'}
                      </p>
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setViewModalEmployee(emp)}
                          className="ds-btn ds-btn-ghost ds-btn-icon ds-btn-sm text-blue-600 hover:text-blue-700"
                          title="View Full Employee Dossier"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          className="ds-btn ds-btn-ghost ds-btn-icon ds-btn-sm text-slate-600 hover:text-slate-800"
                          title="Edit Employee"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => { setItemToDelete(emp); setDeleteModalOpen(true); }}
                          className="ds-btn ds-btn-danger ds-btn-icon ds-btn-sm"
                          title="Delete Employee"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add / Edit Employee Modal */}
      {showModal && (
        <div className="ds-modal-overlay">
          <div className="ds-modal ds-modal-lg">
            <div className="ds-modal-header">
              <h2 className="ds-modal-title">
                {editingId ? 'Edit Employee Profile' : 'Register New Employee'}
              </h2>
              <button onClick={() => setShowModal(false)} className="ds-btn ds-btn-ghost ds-btn-icon ds-btn-sm">
                <X size={16} />
              </button>
            </div>

            <div className="ds-modal-body">
              <form id="employee-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="ds-form-group">
                    <label className="ds-label">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Kasun Perera"
                      className="ds-input"
                    />
                  </div>
                  <div className="ds-form-group">
                    <label className="ds-label">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="kasun@mobilehub.com"
                      className="ds-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="ds-form-group">
                    <label className="ds-label">
                      {editingId ? 'Password (Leave blank to keep unchanged)' : 'Password *'}
                    </label>
                    <input
                      type="password"
                      required={!editingId}
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      placeholder="••••••••"
                      className="ds-input"
                    />
                  </div>
                  <div className="ds-form-group">
                    <label className="ds-label">Phone Number</label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      placeholder="0771234567"
                      className="ds-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="ds-form-group">
                    <label className="ds-label">System Role *</label>
                    <select
                      value={form.role}
                      onChange={e => setForm({ ...form, role: e.target.value })}
                      className="ds-select"
                    >
                      <option value="admin">Admin / Director</option>
                      <option value="manager">Store Manager</option>
                      <option value="cashier">Cashier</option>
                      <option value="deliveryGuy">Delivery Driver</option>
                      <option value="stockEmployee">Stock / Warehouse</option>
                    </select>
                  </div>
                  <div className="ds-form-group">
                    <label className="ds-label">Assigned Store</label>
                    <select
                      value={form.assignedStore}
                      onChange={e => setForm({ ...form, assignedStore: e.target.value })}
                      className="ds-select"
                    >
                      <option value="">All Stores (Global)</option>
                      {stores.map(s => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="ds-form-group">
                    <label className="ds-label">Department</label>
                    <input
                      type="text"
                      value={form.department}
                      onChange={e => setForm({ ...form, department: e.target.value })}
                      placeholder="e.g. Sales, Repair"
                      className="ds-input"
                    />
                  </div>
                </div>

                {/* Salary & Bank Section */}
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs font-bold uppercase text-brand-indigo tracking-wider mb-2">Compensation & Bank Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="ds-form-group">
                      <label className="ds-label">Monthly Base Salary (LKR)</label>
                      <input
                        type="number"
                        value={form.monthlySalary}
                        onChange={e => setForm({ ...form, monthlySalary: e.target.value })}
                        placeholder="e.g. 75000"
                        className="ds-input"
                      />
                    </div>
                    <div className="ds-form-group">
                      <label className="ds-label">NIC Number</label>
                      <input
                        type="text"
                        value={form.nic}
                        onChange={e => setForm({ ...form, nic: e.target.value })}
                        placeholder="e.g. 19951230456V"
                        className="ds-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                    <div className="ds-form-group">
                      <label className="ds-label">Bank Name</label>
                      <input
                        type="text"
                        value={form.bankName}
                        onChange={e => setForm({ ...form, bankName: e.target.value })}
                        placeholder="e.g. Commercial Bank"
                        className="ds-input"
                      />
                    </div>
                    <div className="ds-form-group">
                      <label className="ds-label">Account Number</label>
                      <input
                        type="text"
                        value={form.bankAccount}
                        onChange={e => setForm({ ...form, bankAccount: e.target.value })}
                        placeholder="8001234567"
                        className="ds-input"
                      />
                    </div>
                    <div className="ds-form-group">
                      <label className="ds-label">Branch</label>
                      <input
                        type="text"
                        value={form.bankBranch}
                        onChange={e => setForm({ ...form, bankBranch: e.target.value })}
                        placeholder="e.g. Colombo 03"
                        className="ds-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Emergency Contact & Agreement */}
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs font-bold uppercase text-brand-indigo tracking-wider mb-2">Emergency Contact & Agreement</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="ds-form-group">
                      <label className="ds-label">Contact Name</label>
                      <input
                        type="text"
                        value={form.emergencyName}
                        onChange={e => setForm({ ...form, emergencyName: e.target.value })}
                        placeholder="e.g. Sunethra Perera"
                        className="ds-input"
                      />
                    </div>
                    <div className="ds-form-group">
                      <label className="ds-label">Relationship</label>
                      <input
                        type="text"
                        value={form.emergencyRelation}
                        onChange={e => setForm({ ...form, emergencyRelation: e.target.value })}
                        placeholder="e.g. Spouse / Mother"
                        className="ds-input"
                      />
                    </div>
                    <div className="ds-form-group">
                      <label className="ds-label">Contact Phone</label>
                      <input
                        type="text"
                        value={form.emergencyPhone}
                        onChange={e => setForm({ ...form, emergencyPhone: e.target.value })}
                        placeholder="0719876543"
                        className="ds-input"
                      />
                    </div>
                  </div>

                  <div className="ds-form-group mt-3">
                    <label className="ds-label">Agreement / Document URL</label>
                    <input
                      type="text"
                      value={form.agreementUrl}
                      onChange={e => setForm({ ...form, agreementUrl: e.target.value })}
                      placeholder="https://drive.google.com/... or document link"
                      className="ds-input"
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="ds-modal-footer">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="ds-btn ds-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="employee-form"
                className="ds-btn ds-btn-primary"
              >
                {editingId ? 'Save Employee Changes' : 'Create Employee Profile'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Full Employee Dossier Modal */}
      {viewModalEmployee && (
        <div className="ds-modal-overlay">
          <div className="ds-modal">
            <div className="ds-modal-header">
              <h2 className="ds-modal-title">Employee Dossier</h2>
              <button
                onClick={() => setViewModalEmployee(null)}
                className="ds-btn ds-btn-ghost ds-btn-icon ds-btn-sm"
              >
                <X size={16} />
              </button>
            </div>

            <div className="ds-modal-body">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-brand-indigo/10 text-brand-indigo flex items-center justify-center text-xl font-bold border border-brand-indigo/20">
                  {viewModalEmployee.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 m-0">{viewModalEmployee.name}</h3>
                  <p className="text-xs text-slate-500 font-semibold m-0 mt-0.5">{viewModalEmployee.email}</p>
                  <span className={`inline-block mt-1 ds-badge ${roleColors[viewModalEmployee.role] || 'ds-badge-slate'}`}>
                    {roleLabels[viewModalEmployee.role] || viewModalEmployee.role}
                  </span>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase block">Monthly Base Salary</span>
                    <span className="font-bold text-emerald-600 text-sm">
                      Rs. {Number(viewModalEmployee.employeeInfo?.salary || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase block">Department</span>
                    <span className="font-bold text-slate-800">{viewModalEmployee.employeeInfo?.department || 'Sales'}</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase block">Phone</span>
                    <span className="font-bold text-slate-800">{viewModalEmployee.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase block">NIC</span>
                    <span className="font-mono font-bold text-slate-800">{viewModalEmployee.employeeInfo?.nic || 'N/A'}</span>
                  </div>
                </div>

                {/* Bank Details */}
                <div className="bg-blue-50/60 p-3.5 rounded-2xl border border-blue-100">
                  <p className="font-bold uppercase text-xs text-blue-700 tracking-wider m-0 mb-1 flex items-center gap-1.5">
                    <CreditCard size={13} /> Bank Account Information
                  </p>
                  <p className="font-bold text-slate-800 m-0">
                    {viewModalEmployee.employeeInfo?.bankName || 'No Bank Name Specified'}
                  </p>
                  <p className="font-mono text-slate-700 m-0 mt-0.5">
                    Account No: {viewModalEmployee.employeeInfo?.bankAccount || 'N/A'}
                  </p>
                  <p className="text-xs text-slate-500 m-0 mt-0.5">
                    Branch: {viewModalEmployee.employeeInfo?.bankBranch || 'Main Branch'}
                  </p>
                </div>

                {/* Emergency Contact */}
                <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-100">
                  <p className="font-bold uppercase text-xs text-amber-700 tracking-wider m-0 mb-1 flex items-center gap-1.5">
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
                      className="text-xs font-bold text-brand-indigo hover:underline"
                    >
                      View Document
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="ds-modal-footer">
              <button
                onClick={() => setViewModalEmployee(null)}
                className="ds-btn ds-btn-primary w-full"
              >
                Close Dossier
              </button>
            </div>
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
