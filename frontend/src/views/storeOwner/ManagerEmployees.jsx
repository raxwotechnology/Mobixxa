'use client';

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
        <div className="ds-loading">
          <div className="ds-spinner" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} title={title}>
      <div className="ds-page">

        {/* Page Header */}
        <div className="ds-page-header">
          <div className="ds-page-header-left">
            <span className="ds-page-header-badge">Staff &amp; Roles</span>
            <h1>My Team</h1>
            <p>{employees.length} registered staff members</p>
          </div>
          <div className="ds-page-header-right">
            <button onClick={openCreate} className="ds-btn ds-btn-primary">
              <UserPlus size={14} /> Add Employee
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="ds-card" style={{ padding: '0.75rem 1rem' }}>
          <div className="ds-filter-bar">
            <div className="ds-search" style={{ maxWidth: '400px', width: '100%' }}>
              <Search size={16} />
              <input
                placeholder="Search employees by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filtered.length === 0 && (
          <div className="ds-empty">
            <Users size={40} className="ds-empty-icon" />
            <p className="ds-empty-title">No employees found</p>
            <p className="ds-empty-desc">Click "Add Employee" to register your first staff member</p>
          </div>
        )}

        {/* Employee Cards */}
        <div style={{ display: 'grid', gap: '1rem' }}>
          {filtered.map((emp) => {
            const roleBadgeClass =
              emp.role === 'manager'       ? 'ds-badge ds-badge-amber' :
              emp.role === 'cashier'       ? 'ds-badge ds-badge-amber' :
              emp.role === 'deliveryGuy'   ? 'ds-badge ds-badge-blue' :
              emp.role === 'stockEmployee' ? 'ds-badge ds-badge-green' :
                                            'ds-badge ds-badge-slate';
            const roleLabel =
              emp.role === 'deliveryGuy'   ? 'Delivery Rider' :
              emp.role === 'stockEmployee' ? 'Stock Employee' :
              emp.role === 'cashier'       ? 'Cashier' :
              emp.role === 'manager'       ? 'Manager' : emp.role;

            return (
              <div
                key={emp._id}
                className="ds-card"
                style={{
                  padding: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                  {/* Avatar + Identity */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div
                      style={{
                        width: '2.75rem', height: '2.75rem', borderRadius: 'var(--ds-r-md)',
                        background: 'linear-gradient(135deg, var(--ds-primary) 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 'var(--ds-text-md)',
                        flexShrink: 0,
                      }}
                    >
                      {emp.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, color: 'var(--ds-text-head)', fontSize: 'var(--ds-text-sm)', margin: 0 }}>{emp.name}</p>
                      <p style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-muted)', margin: '0.15rem 0 0' }}>{emp.email}</p>
                      {emp.phone && <p style={{ fontSize: 'var(--ds-text-2xs)', color: 'var(--ds-text-muted)', margin: '0.1rem 0 0' }}>{emp.phone}</p>}
                    </div>
                  </div>

                  {/* Badges + Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                    <span className={roleBadgeClass}>{roleLabel}</span>
                    {emp.assignedStore?.name && (
                      <span className="ds-badge ds-badge-slate">{emp.assignedStore.name}</span>
                    )}
                    <div style={{ display: 'flex', gap: '0.375rem', borderLeft: '1px solid var(--ds-border)', paddingLeft: '0.75rem' }}>
                      <button onClick={() => openEdit(emp)} className="ds-btn ds-btn-ghost ds-btn-icon ds-btn-sm" title="Edit">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => handleDeleteClick(emp)} className="ds-btn ds-btn-danger ds-btn-icon ds-btn-sm" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Meta Row */}
                <div style={{
                  marginTop: '1rem', paddingTop: '0.875rem',
                  borderTop: '1px solid var(--ds-border-soft)',
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: '0.5rem', fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-muted)',
                }}>
                  <span>Rs. {(emp.employeeInfo?.salary || 0).toLocaleString()}</span>
                  <span>{emp.employeeInfo?.department || '—'}</span>
                  <span>{emp.employeeInfo?.bankName || '—'}{emp.employeeInfo?.bankBranch ? ` (${emp.employeeInfo.bankBranch})` : ''}</span>
                  <span>EPF: {emp.employeeInfo?.epfNo || '—'}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add / Edit Modal */}
        {showAddModal && (
          <div className="ds-modal-overlay">
            <div className="ds-modal ds-modal-lg">
              <div className="ds-modal-header">
                <h2 className="ds-modal-title">
                  <UserPlus size={18} />
                  {editingId ? 'Edit Employee Info' : 'Register New Employee'}
                </h2>
                <button onClick={() => setShowAddModal(false)} className="ds-btn ds-btn-ghost ds-btn-icon ds-btn-sm">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEmployee}>
                <div className="ds-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>

                  {/* Basic Information */}
                  <p style={{ fontSize: 'var(--ds-text-xs)', fontWeight: 700, color: 'var(--ds-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Basic Information</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div className="ds-form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="ds-label">Full Name *</label>
                      <input required className="ds-input" value={newForm.name} onChange={(e) => setNewForm({ ...newForm, name: e.target.value })} placeholder="John Doe" />
                    </div>
                    <div className="ds-form-group">
                      <label className="ds-label">Email *</label>
                      <input required type="email" className="ds-input" value={newForm.email} onChange={(e) => setNewForm({ ...newForm, email: e.target.value })} placeholder="john@example.com" />
                    </div>
                    <div className="ds-form-group">
                      <label className="ds-label">Password {editingId ? '(Leave blank to keep same)' : '*'}</label>
                      <input required={!editingId} type="password" className="ds-input" value={newForm.password} onChange={(e) => setNewForm({ ...newForm, password: e.target.value })} placeholder={editingId ? '••••••••' : 'Min 6 characters'} />
                    </div>
                    <div className="ds-form-group">
                      <label className="ds-label">Phone</label>
                      <input className="ds-input" value={newForm.phone} onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })} placeholder="+94 7X XXX XXXX" />
                    </div>
                    <div className="ds-form-group">
                      <label className="ds-label">Role *</label>
                      <select className="ds-input ds-select" value={newForm.role} onChange={(e) => setNewForm({ ...newForm, role: e.target.value })}>
                        <option value="cashier">Cashier</option>
                        <option value="deliveryGuy">Delivery Rider</option>
                        <option value="stockEmployee">Stock Employee</option>
                        {user?.role === 'admin' && <option value="manager">Manager</option>}
                      </select>
                    </div>
                  </div>

                  {/* Employment Details */}
                  <p style={{ fontSize: 'var(--ds-text-xs)', fontWeight: 700, color: 'var(--ds-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Employment Details</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div className="ds-form-group">
                      <label className="ds-label">Monthly Salary (LKR)</label>
                      <input type="number" className="ds-input" value={newForm.salary} onChange={(e) => setNewForm({ ...newForm, salary: e.target.value })} placeholder="45000" />
                    </div>
                    <div className="ds-form-group">
                      <label className="ds-label">Department</label>
                      <input className="ds-input" value={newForm.department} onChange={(e) => setNewForm({ ...newForm, department: e.target.value })} placeholder="Sales / Logistics" />
                    </div>
                  </div>

                  {/* Bank & Statutory */}
                  <p style={{ fontSize: 'var(--ds-text-xs)', fontWeight: 700, color: 'var(--ds-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Bank &amp; Statutory Details</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="ds-form-group">
                      <label className="ds-label">Bank Name</label>
                      <input className="ds-input" value={newForm.bankName} onChange={(e) => setNewForm({ ...newForm, bankName: e.target.value })} placeholder="Bank of Ceylon" />
                    </div>
                    <div className="ds-form-group">
                      <label className="ds-label">Bank Branch</label>
                      <input className="ds-input" value={newForm.bankBranch} onChange={(e) => setNewForm({ ...newForm, bankBranch: e.target.value })} placeholder="Colombo Main" />
                    </div>
                    <div className="ds-form-group">
                      <label className="ds-label">Account Number</label>
                      <input className="ds-input" value={newForm.bankAccount} onChange={(e) => setNewForm({ ...newForm, bankAccount: e.target.value })} placeholder="XXXX XXXX XXXX" />
                    </div>
                    <div className="ds-form-group">
                      <label className="ds-label">EPF Number</label>
                      <input className="ds-input" value={newForm.epfNo} onChange={(e) => setNewForm({ ...newForm, epfNo: e.target.value })} placeholder="EPF-XXXXX" />
                    </div>
                    <div className="ds-form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="ds-label">ETF Number</label>
                      <input className="ds-input" value={newForm.etfNo} onChange={(e) => setNewForm({ ...newForm, etfNo: e.target.value })} placeholder="ETF-XXXXX" />
                    </div>
                  </div>
                </div>

                <div className="ds-modal-footer">
                  <button type="button" onClick={() => setShowAddModal(false)} className="ds-btn ds-btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={adding} className="ds-btn ds-btn-primary">
                    <UserPlus size={15} />
                    {adding ? 'Saving...' : editingId ? 'Update Employee' : 'Register Employee'}
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

