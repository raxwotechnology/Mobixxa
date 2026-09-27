'use client';

import { useState, useEffect } from 'react';
import { Trash2, Search, ToggleLeft, ToggleRight, Edit, X, CheckCircle, Eye, AlertCircle, Users, ShieldCheck } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { getAdminUsers, updateUser, toggleUserStatus, deleteUser } from '../../services/api';
import { toast } from 'react-toastify';
import { adminNavGroups as navItems } from './adminNavItems';
import useAdminStoreStore from '../../store/adminStoreStore';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import { getImageUrl } from '../../utils/imageHelper';
import useAuthStore from '../../store/authStore';


const roleColors = {
  customer: 'ds-badge ds-badge-slate',
  manager: 'ds-badge ds-badge-blue',
  admin: 'ds-badge ds-badge-violet',
  cashier: 'ds-badge ds-badge-amber',
  deliveryGuy: 'ds-badge ds-badge-blue',
  stockEmployee: 'ds-badge ds-badge-slate',
};

export const ALL_PERMISSION_CATEGORIES = [
  {
    category: 'HR & Staff Management',
    items: [
      { key: 'employees', label: 'Employees Directory' },
      { key: 'users', label: 'User Access & Permissions' },
      { key: 'attendance', label: 'Attendance Management' },
      { key: 'leaves', label: 'Leaves & Holidays' },
      { key: 'payroll', label: 'Salary & Payroll Processing' },
      { key: 'salaryAdvances', label: 'Salary Advances' },
      { key: 'letters', label: 'Letters & Documents' },
      { key: 'targets', label: 'Staff Targets' },
    ]
  },
  {
    category: 'Business & Inventory Management',
    items: [
      { key: 'stores', label: 'Store Branches' },
      { key: 'categories', label: 'Product Categories' },
      { key: 'products', label: 'Products & Accessories' },
      { key: 'phones', label: 'Mobile Phones Catalog' },
      { key: 'inventory', label: 'Stock Reports & Transfers' },
    ]
  },
  {
    category: 'Sales, POS & Operations',
    items: [
      { key: 'orders', label: 'Orders & Invoices' },
      { key: 'warranty', label: 'IMEI & Device Warranty' },
      { key: 'returns', label: 'Returns & RMA Management' },
      { key: 'pos', label: 'POS Terminal Cashiering' },
      { key: 'repairs', label: 'Device Repair Jobs' },
      { key: 'reloads', label: 'Mobile Reloads & Card Stock' },
      { key: 'salesTracking', label: 'Live Sales Tracking' },
    ]
  },
  {
    category: 'Trade-In, Barcodes & Marketing',
    items: [
      { key: 'tradeIn', label: 'Phone Trade-In & Pre-Owned' },
      { key: 'vouchers', label: 'Discount Vouchers & Coupons' },
      { key: 'promotions', label: 'Promotions, Banners & Deals' },
      { key: 'barcodes', label: 'Barcode Management & Generator' },
    ]
  },
  {
    category: 'Suppliers & Purchasing',
    items: [
      { key: 'suppliers', label: 'Suppliers Directory' },
      { key: 'supplierPayments', label: 'Supplier Payments & Invoices' },
    ]
  },
  {
    category: 'Financial Management & Accounts',
    items: [
      { key: 'accounts', label: 'Manage Bank Accounts' },
      { key: 'cheques', label: 'Cheque Management & Clearance' },
      { key: 'hp', label: 'Hire Purchase & Installments' },
      { key: 'expenses', label: 'Expenses & Income Ledger' },
      { key: 'financials', label: 'Financials & P&L Statement' },
      { key: 'profitReports', label: 'Profit & Margins Reports' },
      { key: 'overtime', label: 'Overtime Pay Records' },
    ]
  },
  {
    category: 'Analytics & System Settings',
    items: [
      { key: 'reports', label: 'Executive Reports & Analytics' },
      { key: 'customerHistory', label: 'Customer Purchase History' },
      { key: 'predictions', label: 'AI Demand Predictions' },
      { key: 'settings', label: 'Store Settings & Customizer' },
    ]
  },
];

export const ALL_PERMISSION_KEYS = ALL_PERMISSION_CATEGORIES.flatMap(c => c.items.map(i => i.key));

const AdminUsers = () => {
  const { user, setUser } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggleModalOpen, setToggleModalOpen] = useState(false);
  const [userToToggle, setUserToToggle] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const { selectedStoreId } = useAdminStoreStore();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [employeePickerQuery, setEmployeePickerQuery] = useState('');
  const [employeePickerOpen, setEmployeePickerOpen] = useState(false);

  const DEFAULT_PERMISSIONS = ALL_PERMISSION_KEYS.reduce((acc, k) => {
    acc[k] = false;
    return acc;
  }, {});

  // Form State
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '', role: 'cashier', assignedStore: '', avatar: '',
    employeeInfo: { nic: '', salary: '', status: 'active' },
    permissions: { ...DEFAULT_PERMISSIONS },
    agreements: []
  });

  const fetchUsers = async () => {
    try {
      const { data } = await getAdminUsers(selectedStoreId !== 'all' ? { storeId: selectedStoreId } : {});
      setUsers(data);
    } catch (err) { toast.error('Failed to load users'); } 
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchUsers();
  }, [selectedStoreId]);

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name || '', email: user.email || '', password: '', phone: user.phone || '', 
        role: user.role || 'cashier', assignedStore: user.assignedStore?._id || user.assignedStore || '', 
        avatar: user.avatar || '',
        employeeInfo: { 
          nic: user.employeeInfo?.nic || '', 
          salary: user.employeeInfo?.salary || '', 
          status: user.employeeInfo?.status || 'active' 
        },
        permissions: { ...DEFAULT_PERMISSIONS, ...(user.permissions || {}) },
        agreements: user.agreements || []
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '', email: '', password: '', phone: '', role: 'cashier', assignedStore: selectedStoreId !== 'all' ? selectedStoreId : '', avatar: '',
        employeeInfo: { nic: '', salary: '', status: 'active' },
        permissions: { ...DEFAULT_PERMISSIONS },
        agreements: []
      });
    }
    setEmployeePickerQuery('');
    setEmployeePickerOpen(false);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      // Only send password if changed
      const payload = { ...formData };
      if (!payload.password) delete payload.password;
      const { data: updatedUser } = await updateUser(editingUser._id, payload);
      if (updatedUser && updatedUser._id === user?._id) {
        setUser({ ...user, ...updatedUser });
      }
      toast.success('Permissions updated successfully');
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save user');
    }
  };

  const handleToggleStatus = (userId, userName, currentStatus) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    setUserToToggle({ id: userId, name: userName, action });
    setToggleModalOpen(true);
  };

  const handleToggleConfirm = async () => {
    if (!userToToggle) return;
    try {
      await toggleUserStatus(userToToggle.id);
      toast.success(`User ${userToToggle.action}d successfully`);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to toggle status');
    } finally {
      setToggleModalOpen(false);
      setUserToToggle(null);
    }
  };

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const handleDeleteClick = (user) => {
    setItemToDelete({ id: user._id, name: user.name });
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {

      await deleteUser(itemToDelete.id);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) { toast.error('Failed to delete user'); }
  };

  const handlePermissionChange = (perm) => {
    setFormData(prev => ({
      ...prev,
      permissions: { ...prev.permissions, [perm]: !prev.permissions[perm] }
    }));
  };

  const filtered = users.filter((u) => {
    const matchesSearch = u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? u.isActive !== false : u.isActive === false);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const activeCount = users.filter((u) => u.isActive !== false).length;

  return (
    <DashboardLayout navItems={navItems} title="Users">
      <div className="ds-page">
        <div className="ds-page-header">
          <div className="ds-page-header-left">
            <span className="ds-page-header-badge">
              <Users size={11} /> User & Employee Management
            </span>
            <h1 className="text-2xl font-semibold text-slate-900 m-0">Team Directory</h1>
            <p className="text-slate-400 text-xs font-normal mt-1 m-0">{users.length} total accounts · {activeCount} active members</p>
          </div>
          <div className="ds-page-header-right">
            <button onClick={() => handleOpenModal()} className="ds-btn ds-btn-primary">
              <ShieldCheck size={16} /> Manage Access
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="ds-card">
          <div className="ds-filter-bar">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="ds-search pl-10" />
            </div>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="ds-select">
              <option value="all">All Roles</option>
              <option value="customer">Customer</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
              <option value="cashier">Cashier</option>
              <option value="deliveryGuy">Delivery</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="ds-select">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Deactivated</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="ds-loading"><div className="ds-spinner" /></div>
        ) : (
          <div className="ds-table-wrap mt-6">
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Employee / User</th>
                  <th>Contact</th>
                  <th>Role</th>
                  <th>Module Permissions</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div className="flex items-center gap-3.5">
                        {user.avatar ? (
                          <img src={getImageUrl(user.avatar)} alt={user.name} className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-xs" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-indigo to-brand-violet flex items-center justify-center text-white text-xs font-bold shadow-sm">
                            {user.name?.charAt(0)?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-800 text-sm m-0">{user.name}</p>
                          {user.employeeInfo?.nic && <p className="text-xs text-slate-400 font-mono mt-0.5 m-0">NIC: {user.employeeInfo.nic}</p>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="font-bold text-slate-700 text-xs m-0">{user.email}</p>
                      <p className="text-xs text-slate-400 mt-0.5 m-0">{user.phone || 'No phone'}</p>
                    </td>
                    <td>
                      <span className={roleColors[user.role] || 'ds-badge ds-badge-slate'}>
                        {user.role.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      {user.role === 'admin' ? (
                        <span className="ds-badge ds-badge-primary">
                          Full Admin Access
                        </span>
                      ) : (
                        <button
                          onClick={() => handleOpenModal(user)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                          title="Click to edit module permissions"
                        >
                          <ShieldCheck size={12} className="text-indigo-600" />
                          {Object.values(user.permissions || {}).filter(Boolean).length} / {ALL_PERMISSION_KEYS.length} Modules Enabled
                        </button>
                      )}
                    </td>
                    <td>
                      <select
                        value={user.isActive !== false ? 'active' : 'inactive'}
                        onChange={() => handleToggleStatus(user._id, user.name, user.isActive !== false)}
                        className={`ds-select text-xs w-auto py-1 ${user.isActive !== false ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : 'border-rose-200 text-rose-700 bg-rose-50'}`}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(user)}
                          className="ds-btn ds-btn-sm ds-btn-ghost"
                          title="Edit User & Set Permissions"
                        >
                          <ShieldCheck size={14} /> Edit Permissions
                        </button>
                        <button onClick={() => handleDeleteClick(user)} className="ds-btn ds-btn-sm ds-btn-icon ds-btn-danger" title="Delete Account">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="6" className="ds-empty">
                      No users found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal for Add/Edit Employee */}
        {isModalOpen && (
          <div className="ds-modal-overlay">
            <div className="ds-modal w-full max-w-4xl">
              <div className="ds-modal-header">
                <h2 className="ds-modal-title">{editingUser ? `Manage Access — ${editingUser.name}` : 'Select Employee'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="ds-btn ds-btn-icon ds-btn-ghost"><X size={20} /></button>
              </div>
              
              <div className="ds-modal-body">
                <form id="user-form" onSubmit={handleSaveUser} className="space-y-8">
                  {/* Existing Employee Search & Select */}
                  {!editingUser && (
                    <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-2xl p-5 space-y-2 relative">
                      <label className="ds-label">Already an employee? Search &amp; select instead of creating a duplicate</label>
                      <div className="relative">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          value={employeePickerQuery}
                          onChange={(e) => { setEmployeePickerQuery(e.target.value); setEmployeePickerOpen(true); }}
                          onFocus={() => setEmployeePickerOpen(true)}
                          onBlur={() => setTimeout(() => setEmployeePickerOpen(false), 150)}
                          placeholder="Search employee by name or email..."
                          className="ds-input pl-10"
                        />
                        {employeePickerOpen && employeePickerQuery.trim() !== '' && (
                          <div className="absolute z-20 mt-1.5 w-full max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg">
                            {users
                              .filter((u) => u.role !== 'customer' && (
                                u.name?.toLowerCase().includes(employeePickerQuery.toLowerCase()) ||
                                u.email?.toLowerCase().includes(employeePickerQuery.toLowerCase())
                              ))
                              .slice(0, 8)
                              .map((u) => (
                                <button
                                  type="button"
                                  key={u._id}
                                  onMouseDown={() => handleOpenModal(u)}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-left cursor-pointer border-b border-slate-100 last:border-0"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-indigo to-brand-violet flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                    {u.name?.charAt(0)?.toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-800 m-0 truncate">{u.name}</p>
                                    <p className="text-xs text-slate-400 m-0 truncate">{u.email}</p>
                                  </div>
                                </button>
                              ))}
                            {users.filter((u) => u.role !== 'customer' && (
                              u.name?.toLowerCase().includes(employeePickerQuery.toLowerCase()) ||
                              u.email?.toLowerCase().includes(employeePickerQuery.toLowerCase())
                            )).length === 0 && (
                              <p className="px-4 py-3 text-xs text-slate-400 font-medium">No matching employee. New staff are added first in Employees Directory.</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Selected Employee Identity (read-only — edit full profile in Employees Directory) */}
                  {editingUser && (
                    <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-5">
                      {formData.avatar ? (
                        <img src={getImageUrl(formData.avatar)} alt={formData.name} className="w-14 h-14 rounded-2xl object-cover shadow-sm flex-shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-indigo to-brand-violet flex items-center justify-center text-white text-lg font-bold shadow-sm flex-shrink-0">
                          {formData.name?.charAt(0)?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 m-0 truncate">{formData.name}</p>
                        <p className="text-xs text-slate-500 font-semibold m-0 truncate">{formData.email}</p>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mt-1 m-0">
                          {formData.role}{formData.employeeInfo.nic ? ` · NIC ${formData.employeeInfo.nic}` : ''}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg flex-shrink-0 text-right">
                        Edit profile, salary &amp; documents in Employees Directory
                      </span>
                    </div>
                  )}

                  {/* Granular Permissions Categorized */}
                  {editingUser && (
                  <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/80 pb-3 gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={18} className="text-brand-indigo" />
                          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider m-0">Module Access Permissions</h3>
                          <span className="text-xs font-bold bg-brand-indigo/10 text-brand-indigo px-2.5 py-0.5 rounded-full">
                            {Object.values(formData.permissions || {}).filter(Boolean).length} / {ALL_PERMISSION_KEYS.length} Active
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-1 m-0">Select exact features and modules this staff member can access across the system</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const allTrue = {};
                            ALL_PERMISSION_KEYS.forEach(k => allTrue[k] = true);
                            setFormData(prev => ({ ...prev, permissions: allTrue }));
                          }}
                          className="text-xs font-bold text-brand-indigo hover:text-indigo-800 bg-brand-indigo/10 px-3 py-1.5 rounded-xl transition-colors cursor-pointer shadow-2xs"
                        >
                          Select All ({ALL_PERMISSION_KEYS.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const allFalse = {};
                            ALL_PERMISSION_KEYS.forEach(k => allFalse[k] = false);
                            setFormData(prev => ({ ...prev, permissions: allFalse }));
                          }}
                          className="text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-200/80 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    {/* Categorized Permission Groups */}
                    <div className="space-y-5">
                      {ALL_PERMISSION_CATEGORIES.map((cat, ci) => {
                        const groupKeys = cat.items.map(i => i.key);
                        const isAllGroupSelected = groupKeys.every(k => formData.permissions[k]);
                        
                        return (
                          <div key={ci} className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-brand-indigo" />
                                {cat.category}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const newPerms = { ...formData.permissions };
                                  groupKeys.forEach(k => {
                                    newPerms[k] = !isAllGroupSelected;
                                  });
                                  setFormData(prev => ({ ...prev, permissions: newPerms }));
                                }}
                                className="text-xs font-bold text-slate-500 hover:text-brand-indigo transition-colors cursor-pointer"
                              >
                                {isAllGroupSelected ? 'Deselect Group' : 'Select Group'}
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                              {cat.items.map((mod) => {
                                const isChecked = formData.permissions[mod.key] || false;
                                return (
                                  <label
                                    key={mod.key}
                                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                                      isChecked
                                        ? 'bg-brand-indigo/5 border-brand-indigo/50 text-brand-indigo shadow-2xs'
                                        : 'bg-slate-50/50 border-slate-200/70 text-slate-700 hover:border-slate-300'
                                    }`}
                                  >
                                    <div
                                      className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors flex-shrink-0 ${
                                        isChecked
                                          ? 'bg-brand-indigo border-brand-indigo text-white'
                                          : 'bg-white border-slate-300'
                                      }`}
                                    >
                                      {isChecked && <CheckCircle size={12} className="text-white" />}
                                    </div>
                                    <span className="text-xs font-bold truncate">
                                      {mod.label}
                                    </span>
                                    <input
                                      type="checkbox"
                                      className="hidden"
                                      checked={isChecked}
                                      onChange={() => handlePermissionChange(mod.key)}
                                    />
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  )}
                </form>
              </div>

              {/* Actions */}
              <div className="ds-modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="ds-btn ds-btn-ghost">Cancel</button>
                {editingUser && (
                  <button type="submit" form="user-form" className="ds-btn ds-btn-primary">
                    Save Permissions
                  </button>
                )}
              </div>
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

      {/* Toggle Status Confirmation Modal */}
      {toggleModalOpen && userToToggle && (
        <div className="ds-modal-overlay">
          <div className="ds-modal w-full max-w-md">
            <div className="ds-modal-body pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-2xl ${userToToggle.action === 'deactivate' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg capitalize">{userToToggle.action} User</h3>
                  <p className="text-xs text-slate-500 font-medium">Confirm status change</p>
                </div>
              </div>
              
              <p className="text-sm text-slate-600 font-medium mb-6">
                Are you sure you want to <span className="font-bold text-slate-800">{userToToggle.action}</span> the employee account for <span className="font-bold text-dark-navy">"{userToToggle.name}"</span>?
              </p>
            </div>
            <div className="ds-modal-footer">
              <button 
                type="button" 
                onClick={() => { setToggleModalOpen(false); setUserToToggle(null); }} 
                className="ds-btn ds-btn-ghost"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleToggleConfirm} 
                className={`ds-btn ${userToToggle.action === 'deactivate' ? 'ds-btn-danger' : 'ds-btn-primary'}`}
              >
                Yes, Confirm
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default AdminUsers;
