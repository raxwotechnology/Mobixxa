'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Wrench, Plus, Search, Printer, Trash2, Edit2, CheckCircle2, 
  X, User, Calendar, DollarSign, CreditCard, ArrowRight, 
  AlertCircle, Smartphone, Info, RefreshCw, PlusCircle, Check,
  BarChart3, BarChart, ShoppingBag, ShieldCheck, Users, PackageOpen
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import EmployeeSelector from '../../components/EmployeeSelector';
import { adminNavGroups as navItems } from './adminNavItems';
import {
  getRepairs, createRepair, updateRepair, deliverRepair, deleteRepair,
  getEmployees, searchProducts, getAccounts, getStores
} from '../../services/api';
import useCurrencyStore from '../../store/currencyStore';
import useSettingsStore from '../../store/settingsStore';
import useAdminStoreStore from '../../store/adminStoreStore';
import { toast } from 'react-toastify';
import { getImageUrl } from '../../utils/imageHelper';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';

const statusColors = {
  received: 'ds-badge-blue',
  in_progress: 'ds-badge-blue',
  completed: 'ds-badge-green',
  delivered: 'ds-badge-slate',
  cancelled: 'ds-badge-red',
};

const AdminRepairs = () => {
  const isAdmin = true;
  const isEmployee = false;
  const { selectedStoreId } = useAdminStoreStore();
  const storeIdFilter = selectedStoreId !== 'all' ? selectedStoreId : undefined;
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals & Selection
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  
  // Printing Receipts
  const [printJob, setPrintJob] = useState(null); // { repair, type: 'handover' | 'invoice' }

  // Reference Data
  const [technicians, setTechnicians] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [stores, setStores] = useState([]);
  const settings = useSettingsStore((s) => s.settings);
  const { convertPrice, formatPrice } = useCurrencyStore();

  // Create Form State
  const [createForm, setCreateForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    deviceModel: '',
    deviceSerialNumber: '',
    reportedIssue: '',
    estimatedCost: 0,
    notes: '',
    storeId: '',
  });

  // Update Form State
  const [updateForm, setUpdateForm] = useState({
    status: 'received',
    technicians: [],
    partsUsed: [],
    repairFee: 0,
    notes: '',
  });

  // Parts search & custom addition
  const [partSearch, setPartSearch] = useState('');
  const [partSearchResults, setPartSearchResults] = useState([]);
  const [customPart, setCustomPart] = useState({ name: '', cost: 0 });

  // Checkout Form State
  const [checkoutForm, setCheckoutForm] = useState({
    paymentMethod: 'Cash',
    accountId: '',
  });

  const fetchRepairs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (isAdmin && storeIdFilter) {
        params.storeId = storeIdFilter;
      }
      const { data } = await getRepairs(params);
      setRepairs(data || []);
    } catch (err) {
      toast.error('Failed to load repair jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const { data } = await getEmployees({ includeManagers: true });
      setTechnicians(data || []);
    } catch (err) {
      console.error('Failed to fetch technicians', err);
    }
  };

  const fetchAccountsList = async () => {
    try {
      const params = {};
      if (isAdmin && storeIdFilter) {
        params.storeId = storeIdFilter;
      }
      const { data } = await getAccounts(params);
      setAccounts(data || []);
      
      // Auto-set default account
      const defaultAcc = data?.find(a => a.isDefault) || data?.[0];
      if (defaultAcc) {
        setCheckoutForm(prev => ({ ...prev, accountId: defaultAcc._id }));
      }
    } catch (err) {
      console.error('Failed to fetch accounts', err);
    }
  };

  const fetchStoresList = async () => {
    if (isAdmin) {
      try {
        const { data } = await getStores();
        setStores(data.stores || data || []);
      } catch (err) {
        console.error('Failed to fetch stores list', err);
      }
    }
  };

  useEffect(() => {
    fetchRepairs();
    fetchTechnicians();
    fetchAccountsList();
    fetchStoresList();
  }, [isAdmin, storeIdFilter]);

  // Product search for parts
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (partSearch.trim().length > 1) {
        try {
          const { data } = await searchProducts(partSearch);
          setPartSearchResults(data.products || []);
        } catch (err) {
          console.error(err);
        }
      } else {
        setPartSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [partSearch]);

  const handleOpenCreate = () => {
    setCreateForm({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      deviceModel: '',
      deviceSerialNumber: '',
      reportedIssue: '',
      estimatedCost: 0,
      notes: '',
      storeId: storeIdFilter || '',
    });
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    
    // Resolve storeId
    const targetStoreId = createForm.storeId || storeIdFilter;
    if (!targetStoreId) {
      toast.warning('Please select a store to log this repair job');
      return;
    }

    if (!createForm.customerName || !createForm.customerPhone || !createForm.deviceModel || !createForm.reportedIssue) {
      toast.warning('Please fill in all required fields');
      return;
    }

    try {
      const payload = { 
        ...createForm,
        storeId: targetStoreId 
      };
      const { data } = await createRepair(payload);
      toast.success('Repair job logged successfully!');
      setShowCreateModal(false);
      fetchRepairs();
      
      // Auto open print handover note receipt
      handlePrintReceipt(data, 'handover');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create repair job');
    }
  };

  const handleOpenUpdate = (repair) => {
    setSelectedRepair(repair);
    setUpdateForm({
      status: repair.status || 'received',
      technicians: repair.technicians?.map(t => t._id) || [],
      partsUsed: repair.partsUsed || [],
      repairFee: repair.repairFee || 0,
      notes: repair.notes || '',
    });
    setPartSearch('');
    setPartSearchResults([]);
    setCustomPart({ name: '', cost: 0 });
    setShowUpdateModal(true);
  };

  const handleAddInventoryPart = (product) => {
    // Check if already added
    const exists = updateForm.partsUsed.find(p => p.productId === product._id);
    if (exists) {
      toast.info('Item is already added. You can update its quantity in the list.');
      return;
    }

    // Check stock
    if (product.stock <= 0) {
      toast.warning('Warning: Selected item is out of stock in store inventory.');
    }

    const newPart = {
      productId: product._id,
      name: product.name,
      cost: product.priceLKR || product.price,
      qty: 1,
      isInventory: true
    };

    setUpdateForm(prev => ({
      ...prev,
      partsUsed: [...prev.partsUsed, newPart]
    }));
    setPartSearch('');
    setPartSearchResults([]);
  };

  const handleAddCustomPart = () => {
    if (!customPart.name.trim() || customPart.cost <= 0) {
      toast.warning('Please enter valid part name and cost');
      return;
    }

    const newPart = {
      name: customPart.name,
      cost: Number(customPart.cost),
      qty: 1,
      isInventory: false
    };

    setUpdateForm(prev => ({
      ...prev,
      partsUsed: [...prev.partsUsed, newPart]
    }));
    setCustomPart({ name: '', cost: 0 });
  };

  const handleRemovePart = (index) => {
    setUpdateForm(prev => ({
      ...prev,
      partsUsed: prev.partsUsed.filter((_, idx) => idx !== index)
    }));
  };

  const handlePartQtyChange = (index, newQty) => {
    if (newQty < 1) return;
    setUpdateForm(prev => ({
      ...prev,
      partsUsed: prev.partsUsed.map((p, idx) => idx === index ? { ...p, qty: Number(newQty) } : p)
    }));
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateRepair(selectedRepair._id, updateForm);
      toast.success('Repair job details updated successfully!');
      setShowUpdateModal(false);
      fetchRepairs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update repair job');
    }
  };

  const handleOpenCheckout = (repair) => {
    setSelectedRepair(repair);
    // Try to auto-select matching store account if available
    const storeAcc = accounts.find(a => String(a.storeId) === String(repair.storeId));
    if (storeAcc) {
      setCheckoutForm(prev => ({ ...prev, accountId: storeAcc._id }));
    }
    setShowCheckoutModal(true);
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!checkoutForm.accountId) {
      toast.warning('Please select a cash/bank account');
      return;
    }

    try {
      const { data } = await deliverRepair(selectedRepair._id, checkoutForm);
      toast.success(`Repair successfully delivered and logged to account!`);
      setShowCheckoutModal(false);
      fetchRepairs();
      
      // Auto open print invoice layout for delivered job
      handlePrintReceipt(data, 'invoice');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkout failed');
    }
  };

  const handleDeleteClick = (repair) => {
    setItemToDelete(repair);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      await deleteRepair(itemToDelete._id);
      toast.success('Repair job record deleted successfully');
      setDeleteModalOpen(false);
      setItemToDelete(null);
      fetchRepairs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete repair job');
    }
  };

  const handlePrintReceipt = (repair, type) => {
    setPrintJob({ repair, type });
    // Trigger print after state is registered and DOM compiles
    setTimeout(() => {
      window.print();
    }, 200);
  };

  // Metrics calculations for Reports Tab
  const totalJobsCount = repairs.length;
  const activeRepairsCount = repairs.filter(r => ['received', 'in_progress'].includes(r.status)).length;
  
  // Total Revenue (only delivered repairs)
  const deliveredRepairs = repairs.filter(r => r.status === 'delivered');
  const totalRevenue = deliveredRepairs.reduce((sum, r) => {
    const partsCost = r.partsUsed?.reduce((s, p) => s + (p.cost * p.qty), 0) || 0;
    return sum + (r.repairFee || 0) + partsCost;
  }, 0);

  // Projected Revenue (all non-cancelled repairs)
  const nonCancelledRepairs = repairs.filter(r => r.status !== 'cancelled');
  const projectedRevenue = nonCancelledRepairs.reduce((sum, r) => {
    const partsCost = r.partsUsed?.reduce((s, p) => s + (p.cost * p.qty), 0) || 0;
    return sum + (r.repairFee || 0) + partsCost;
  }, 0);

  // Technician statistics
  const techStats = technicians.map(tech => {
    const assignedJobs = repairs.filter(r => r.technicians?.some(t => t._id === tech._id));
    const completedJobs = assignedJobs.filter(r => ['completed', 'delivered'].includes(r.status));
    const incomeGenerated = completedJobs.reduce((sum, r) => {
      const partsCost = r.partsUsed?.reduce((s, p) => s + (p.cost * p.qty), 0) || 0;
      return sum + (r.repairFee || 0) + partsCost;
    }, 0);

    return {
      _id: tech._id,
      name: tech.name,
      role: tech.role,
      assigned: assignedJobs.length,
      completed: completedJobs.length,
      income: incomeGenerated
    };
  }).filter(t => t.assigned > 0 || t.income > 0).sort((a, b) => b.income - a.income);

  // Parts usage stats
  let totalInventoryPartsCount = 0;
  let totalExternalPartsCount = 0;
  let inventoryPartsCost = 0;
  let externalPartsCost = 0;
  const partFrequency = {};

  repairs.forEach(r => {
    if (r.status !== 'cancelled') {
      r.partsUsed?.forEach(p => {
        if (p.isInventory) {
          totalInventoryPartsCount += p.qty;
          inventoryPartsCost += p.cost * p.qty;
        } else {
          totalExternalPartsCount += p.qty;
          externalPartsCost += p.cost * p.qty;
        }
        partFrequency[p.name] = (partFrequency[p.name] || 0) + p.qty;
      });
    }
  });

  const topParts = Object.entries(partFrequency)
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // Calculate live totals for the update panel
  const currentPartsTotal = updateForm.partsUsed.reduce((sum, p) => sum + (p.cost * p.qty), 0);
  const currentGrandTotal = Number(updateForm.repairFee) + currentPartsTotal;

  // Filter repairs for main table
  const filteredRepairs = repairs
    .filter(r => {
      const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
      const term = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !term ||
        r.jobNo.toLowerCase().includes(term) ||
        r.customerName.toLowerCase().includes(term) ||
        r.customerPhone.toLowerCase().includes(term) ||
        r.deviceModel.toLowerCase().includes(term) ||
        (r.deviceSerialNumber && r.deviceSerialNumber.toLowerCase().includes(term));
      return matchesStatus && matchesSearch;
    });

  return (
    <DashboardLayout navItems={navItems} title="Admin Repairs Dashboard">
      <div className="ds-page">
        {/* Header Block */}
        <div className="ds-page-header">
          <div className="ds-page-header-left">
            <span className="ds-page-header-badge">Repairs</span>
            <h1>Repair Jobs</h1>
            <p>Log customer devices, manage technician tasks, parts replacements, and track ledger synchronization</p>
          </div>
          <div className="ds-page-header-right">
            <button
              onClick={handleOpenCreate}
              className="ds-btn ds-btn-primary"
            >
              <Plus size={14} /> Log Repair Job
            </button>
          </div>
        </div>

        {/* Filters, Search, and Tabs */}
        <div className="ds-card p-4 mb-6">
          <div className="ds-filter-bar mb-0 flex-col lg:flex-row gap-4">
            {/* Tabs */}
            <div className="flex gap-2 pb-1 overflow-x-auto scrollbar-hide flex-1">
              {['all', 'received', 'in_progress', 'completed', 'delivered', 'cancelled', 'reports'].map((status) => {
                let count = 0;
                if (status === 'all') count = repairs.length;
                else if (status === 'reports') count = '';
                else count = repairs.filter(r => r.status === status).length;
                
                const isSelected = filterStatus === status;
                
                return (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`ds-btn ds-btn-sm ${isSelected ? 'ds-btn-primary' : 'ds-btn-ghost'} whitespace-nowrap`}
                  >
                    {status === 'reports' ? 'Repairs Report' : status.replace('_', ' ')}
                    {status !== 'reports' && (
                      <span className={`ml-2 px-1.5 py-0.5 rounded-md text-xs font-bold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search Input (hide on reports tab) */}
            {filterStatus !== 'reports' && (
              <div className="relative w-full lg:w-72">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search ID, name, model..."
                  className="ds-search pl-9 w-full"
                />
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Display (Reports vs Table) */}
        {filterStatus === 'reports' ? (
          /* ════════════════ REPORTS TAB DASHBOARD ════════════════ */
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="ds-stats">
              <div className="ds-stat">
                <div className="ds-stat-icon bg-blue-50 text-blue-600">
                  <Wrench size={20} />
                </div>
                <h4 className="ds-stat-label">Total Jobs Logged</h4>
                <p className="ds-stat-value">{totalJobsCount}</p>
              </div>
              <div className="ds-stat">
                <div className="ds-stat-icon bg-amber-50 text-amber-600">
                  <RefreshCw className="animate-spin-slow" size={20} />
                </div>
                <h4 className="ds-stat-label">Active Repairs</h4>
                <p className="ds-stat-value">{activeRepairsCount}</p>
              </div>
              <div className="ds-stat">
                <div className="ds-stat-icon bg-emerald-50 text-emerald-600">
                  <DollarSign size={20} />
                </div>
                <h4 className="ds-stat-label">Delivered Income</h4>
                <p className="ds-stat-value text-emerald-600">{formatPrice(totalRevenue)}</p>
              </div>
              <div className="ds-stat">
                <div className="ds-stat-icon bg-purple-50 text-purple-600">
                  <ShoppingBag size={20} />
                </div>
                <h4 className="ds-stat-label">Projected Value</h4>
                <p className="ds-stat-value text-purple-600">{formatPrice(projectedRevenue)}</p>
              </div>
            </div>

            {/* Split Grid: Tech Performance & Parts Used */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tech Contribution */}
              <div className="ds-card">
                <div className="ds-card-header">
                  <h3 className="ds-card-title"><Users className="text-blue-600" size={20} /> Technician Work Distribution</h3>
                </div>
                <div className="ds-card-body p-0">
                  <div className="ds-table-wrap">
                    <table className="ds-table">
                      <thead>
                        <tr>
                          <th>Technician</th>
                          <th className="text-center">Assigned Jobs</th>
                          <th className="text-center">Completed</th>
                          <th className="text-right">Revenue Generated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {techStats.length === 0 ? (
                          <tr>
                            <td colSpan="4">
                              <div className="ds-empty">No technician allocations found in system repairs.</div>
                            </td>
                          </tr>
                        ) : (
                          techStats.map(tech => (
                            <tr key={tech._id}>
                              <td>
                                <span className="font-semibold text-gray-900 block">{tech.name}</span>
                                <span className="text-xs text-gray-500 uppercase">{tech.role}</span>
                              </td>
                              <td className="text-center font-bold text-gray-900">{tech.assigned}</td>
                              <td className="text-center">
                                <span className="ds-badge ds-badge-green">
                                  {tech.completed}
                                </span>
                              </td>
                              <td className="text-right font-bold text-emerald-600">{formatPrice(tech.income)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Parts Replacements & Stats */}
              <div className="ds-card">
                <div className="ds-card-header">
                  <h3 className="ds-card-title"><PackageOpen className="text-amber-500" size={20} /> Accessories & Parts Summary</h3>
                </div>
                <div className="ds-card-body space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
                      <span className="text-gray-500 text-xs uppercase font-bold block">Inventory Parts Replaced</span>
                      <span className="text-lg font-bold text-gray-900 block mt-0.5">{totalInventoryPartsCount} units</span>
                      <span className="text-xs text-emerald-600 font-semibold">Cost: {formatPrice(inventoryPartsCost)}</span>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
                      <span className="text-gray-500 text-xs uppercase font-bold block">External Custom Parts</span>
                      <span className="text-lg font-bold text-gray-900 block mt-0.5">{totalExternalPartsCount} units</span>
                      <span className="text-xs text-emerald-600 font-semibold">Cost: {formatPrice(externalPartsCost)}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-900 uppercase mb-2">Top Replaced Parts</h4>
                    <div className="space-y-2">
                      {topParts.length === 0 ? (
                        <p className="text-xs text-gray-500 italic text-center py-4">No parts replaced in any logs.</p>
                      ) : (
                        topParts.map((p, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-200 text-sm">
                            <span className="font-semibold text-gray-900">{p.name}</span>
                            <span className="ds-badge ds-badge-blue">
                              {p.qty} replaced
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ════════════════ REPAIR JOBS TABLE ════════════════ */
          loading ? (
            <div className="ds-card p-20 flex items-center justify-center">
              <div className="ds-loading"><div className="ds-spinner" /></div>
            </div>
          ) : filteredRepairs.length === 0 ? (
            <div className="ds-card p-20 text-center">
              <div className="ds-empty">
                <Info size={48} className="text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900">No Repair Jobs Found</h3>
                <p className="text-gray-500 text-sm mt-1">Try expanding your search query or status filter.</p>
              </div>
            </div>
          ) : (
            <div className="ds-card">
              <div className="ds-table-wrap">
                <table className="ds-table">
                  <thead>
                    <tr>
                      <th>Job No</th>
                      <th>Customer Details</th>
                      <th>Device Info</th>
                      <th>Reported Issue</th>
                      <th>Technicians</th>
                      <th>Total Cost</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRepairs.map((repair) => {
                      const partsTotal = repair.partsUsed?.reduce((sum, p) => sum + (p.cost * p.qty), 0) || 0;
                      const grandTotal = (repair.repairFee || 0) + partsTotal;
                      
                      return (
                        <tr key={repair._id}>
                          <td className="font-bold text-gray-900">
                            {repair.jobNo}
                            <span className="block text-xs text-gray-500 font-normal">
                              {new Date(repair.dateReceived || repair.createdAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td>
                            <div className="font-semibold text-gray-900">{repair.customerName}</div>
                            <div className="text-xs text-gray-500">{repair.customerPhone}</div>
                          </td>
                          <td>
                            <div className="font-semibold text-gray-900">{repair.deviceModel}</div>
                            {repair.deviceSerialNumber && (
                              <div className="text-xs text-gray-500">S/N: {repair.deviceSerialNumber}</div>
                            )}
                          </td>
                          <td>
                            <div className="line-clamp-2 max-w-xs text-gray-900">{repair.reportedIssue}</div>
                          </td>
                          <td>
                            {repair.technicians && repair.technicians.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {repair.technicians.map(t => (
                                  <span key={t._id} className="ds-badge ds-badge-slate">
                                    {t.name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-red-500 italic">Unassigned</span>
                            )}
                          </td>
                          <td className="font-bold text-gray-900">
                            {grandTotal > 0 ? formatPrice(grandTotal) : <span className="text-gray-500 text-xs">TBD</span>}
                          </td>
                          <td>
                            <span className={`ds-badge ${statusColors[repair.status] || 'ds-badge-slate'}`}>
                              {repair.status.toUpperCase().replace('_', ' ')}
                            </span>
                          </td>
                          <td className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handlePrintReceipt(repair, 'handover')}
                                title="Print Handover Note"
                                className="ds-btn ds-btn-ghost ds-btn-icon ds-btn-sm text-gray-600"
                              >
                                <Printer size={16} />
                              </button>

                              {repair.status !== 'delivered' && (
                                <button
                                  onClick={() => handleOpenUpdate(repair)}
                                  title="Update Job Info & Parts"
                                  className="ds-btn ds-btn-ghost ds-btn-icon ds-btn-sm text-amber-600"
                                >
                                  <Edit2 size={16} />
                                </button>
                              )}

                              {repair.status !== 'delivered' && (
                                <button
                                  onClick={() => handleOpenCheckout(repair)}
                                  title="Deliver & Checkout"
                                  className="ds-btn ds-btn-ghost ds-btn-icon ds-btn-sm text-emerald-600"
                                >
                                  <CheckCircle2 size={16} />
                                </button>
                              )}

                              {repair.status === 'delivered' && (
                                <button
                                  onClick={() => handlePrintReceipt(repair, 'invoice')}
                                  title="Print Invoice"
                                  className="ds-btn ds-btn-ghost ds-btn-sm text-emerald-600 font-bold flex items-center gap-1"
                                >
                                  <Printer size={14} /> Invoice
                                </button>
                              )}

                              {(isAdmin || !isEmployee) && (
                                <button
                                  onClick={() => handleDeleteClick(repair)}
                                  title="Delete Record"
                                  className="ds-btn ds-btn-ghost ds-btn-icon ds-btn-sm text-red-500"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </div>

      {/* ════════════════ PRINT LAYOUT WRAPPER ════════════════ */}
      {printJob && (
        <div id="pos-receipt-content" className="bg-white text-black p-4" style={{ fontFamily: 'monospace' }}>
          <div className="text-center pb-4 border-b border-black">
            {settings?.logo && (
              <img 
                src={getImageUrl(settings.logo)} 
                alt="Logo" 
                style={{ width: '48px', height: '48px', objectFit: 'contain', margin: '0 auto 6px', borderRadius: '8px' }} 
              />
            )}
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 2px' }}>
              {printJob.repair.storeId?.name || settings?.shopName || 'Mobixa'}
            </h2>
            <p style={{ fontSize: '11px', margin: '2px 0' }}>
              {printJob.repair.storeId?.address || settings?.address || ''}
            </p>
            <p style={{ fontSize: '11px', margin: '2px 0' }}>
              Tel: {printJob.repair.storeId?.phone || settings?.phone || ''}
            </p>
          </div>

          <div className="text-center my-3">
            <h3 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
              {printJob.type === 'handover' ? 'JOB RECEIPT / HANDOVER NOTE' : 'REPAIR SERVICE INVOICE'}
            </h3>
          </div>

          <div style={{ fontSize: '11px', borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '6px 0', margin: '8px 0' }}>
            <div className="flex justify-between">
              <span>Job No:</span>
              <strong>{printJob.repair.jobNo}</strong>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{new Date(printJob.repair.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span>{printJob.repair.status.toUpperCase()}</span>
            </div>
            {printJob.type === 'invoice' && printJob.repair.dateDelivered && (
              <div className="flex justify-between">
                <span>Date Delivered:</span>
                <span>{new Date(printJob.repair.dateDelivered).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Customer & Device */}
          <div style={{ fontSize: '11px', borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '8px' }}>
            <h4 style={{ margin: '0 0 4px', fontWeight: 700 }}>CUSTOMER DETAILS</h4>
            <div>Name: {printJob.repair.customerName}</div>
            <div>Phone: {printJob.repair.customerPhone}</div>
            {printJob.repair.customerEmail && <div>Email: {printJob.repair.customerEmail}</div>}
          </div>

          <div style={{ fontSize: '11px', borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '8px' }}>
            <h4 style={{ margin: '0 0 4px', fontWeight: 700 }}>DEVICE INFORMATION</h4>
            <div>Model: {printJob.repair.deviceModel}</div>
            {printJob.repair.deviceSerialNumber && <div>S/N or IMEI: {printJob.repair.deviceSerialNumber}</div>}
            <div style={{ marginTop: '4px' }}><strong>Issue:</strong> {printJob.repair.reportedIssue}</div>
            {printJob.repair.notes && <div className="mt-1 text-gray-700"><strong>Notes:</strong> {printJob.repair.notes}</div>}
          </div>

          {/* Pricing & Parts */}
          {printJob.type === 'handover' ? (
            <div className="text-right py-2" style={{ fontSize: '12px' }}>
              {printJob.repair.estimatedCost > 0 && (
                <div><strong>Estimated Cost:</strong> Rs. {printJob.repair.estimatedCost.toLocaleString()}</div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: '11px' }}>
              <h4 style={{ margin: '4px 0', fontWeight: 700 }}>REPLACEMENT PARTS & SERVICE</h4>
              
              <div style={{ borderBottom: '1px dashed #000', paddingBottom: '4px', marginBottom: '4px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 40px 80px', fontWeight: 700, fontSize: '10px' }}>
                  <span>Description</span>
                  <span className="text-center">Qty</span>
                  <span className="text-right">Price</span>
                </div>
                
                {/* Service Labor Fee */}
                {printJob.repair.repairFee > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 40px 80px', margin: '4px 0' }}>
                    <span>Labor / Repairing Fee</span>
                    <span className="text-center">1</span>
                    <span className="text-right">Rs. {printJob.repair.repairFee.toLocaleString()}</span>
                  </div>
                )}

                {/* Parts */}
                {printJob.repair.partsUsed && printJob.repair.partsUsed.map((part, index) => (
                  <div key={index} style={{ display: 'grid', gridTemplateColumns: '1.2fr 40px 80px', margin: '4px 0' }}>
                    <span>{part.name}</span>
                    <span className="text-center">{part.qty}</span>
                    <span className="text-right">Rs. {(part.cost * part.qty).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Grand Total */}
              <div className="text-right py-2" style={{ fontSize: '13px', fontWeight: 700 }}>
                <span>GRAND TOTAL: </span>
                <span>Rs. {((printJob.repair.repairFee || 0) + (printJob.repair.partsUsed?.reduce((sum, p) => sum + (p.cost * p.qty), 0) || 0)).toLocaleString()}</span>
              </div>

              <div style={{ fontSize: '10px', marginTop: '6px' }} className="flex justify-between border-t border-black pt-2">
                <span>Payment Method: <strong>{printJob.repair.paymentMethod || 'N/A'}</strong></span>
                <span>Billed By: {printJob.repair.createdBy?.name || 'Cashier'}</span>
              </div>
            </div>
          )}

          {/* Terms & Signatures */}
          <div className="mt-8 pt-4 border-t border-black text-xs text-gray-700" style={{ lineHeight: '1.3' }}>
            <h5 className="font-bold mb-1 text-black">Terms & Conditions:</h5>
            {printJob.type === 'handover' ? (
              <ol className="list-decimal pl-3 space-y-1">
                <li>Please produce this note when collecting your device.</li>
                <li>We are not responsible for any data loss. Please back up data before repair.</li>
                <li>Devices must be collected within 30 days of completion. Unclaimed devices may be sold to cover costs.</li>
                <li>Estimated cost is subject to change if additional faults are found during repair.</li>
              </ol>
            ) : (
              <ol className="list-decimal pl-3 space-y-1">
                <li>Repaired hardware components carry a 30-day warranty only.</li>
                <li>Warranty is void if device shows water damage, physical impact, or third-party tampering.</li>
                <li>Thank you for choosing {settings?.shopName || 'Mobixa'}!</li>
              </ol>
            )}

            <div className="flex justify-between mt-12 pt-6">
              <div className="text-center w-24 border-t border-black pt-1">
                Customer Signature
              </div>
              <div className="text-center w-24 border-t border-black pt-1">
                Receiver Signature
              </div>
            </div>

            <div className="text-center mt-6 text-xs text-gray-500">
              Printed on {new Date().toLocaleString()} | Powered by Mobixa ERP
            </div>
          </div>
          
          {/* Close button for screen rendering */}
          <div className="no-print mt-6 flex justify-center">
            <button
              onClick={() => setPrintJob(null)}
              className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-4 rounded-xl text-xs"
            >
              Close Print Preview
            </button>
          </div>
        </div>
      )}

      {/* ════════════════ MODAL: CREATE REPAIR JOB ════════════════ */}
      {showCreateModal && (
        <div className="ds-modal-overlay no-print" onClick={() => setShowCreateModal(false)}>
          <div className="ds-modal ds-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="ds-modal-header">
              <h3 className="ds-modal-title flex items-center gap-2">
                <Wrench className="text-primary-blue" /> Log Device Repair Job
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-all text-gray-400"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="ds-modal-body space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 flex gap-3 text-xs text-blue-800 mb-2">
                <Info size={16} className="shrink-0 mt-0.5 text-blue-600" />
                <div>
                  Enter the customer's details and reported issue. The system will generate a sequential **REP-XXXXX** job number and print-ready receipt.
                </div>
              </div>

              {isAdmin && !storeIdFilter && (
                <div className="ds-form-group">
                  <label className="ds-label">Target Store / Location *</label>
                  <select
                    required
                    value={createForm.storeId}
                    onChange={(e) => setCreateForm({...createForm, storeId: e.target.value})}
                    className="ds-select"
                  >
                    <option value="">-- Choose Store Location --</option>
                    {stores.map(store => (
                      <option key={store._id} value={store._id}>{store.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="ds-form-group">
                  <label className="ds-label">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={createForm.customerName}
                    onChange={(e) => setCreateForm({...createForm, customerName: e.target.value})}
                    placeholder="e.g. John Doe"
                    className="ds-input"
                  />
                </div>
                <div className="ds-form-group">
                  <label className="ds-label">Customer Phone *</label>
                  <input
                    type="text"
                    required
                    value={createForm.customerPhone}
                    onChange={(e) => setCreateForm({...createForm, customerPhone: e.target.value})}
                    placeholder="e.g. 0771234567"
                    className="ds-input"
                  />
                </div>
              </div>

              <div className="ds-form-group">
                <label className="ds-label">Customer Email</label>
                <input
                  type="email"
                  value={createForm.customerEmail}
                  onChange={(e) => setCreateForm({...createForm, customerEmail: e.target.value})}
                  placeholder="e.g. customer@email.com"
                  className="ds-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="ds-form-group">
                  <label className="ds-label">Device Model *</label>
                  <input
                    type="text"
                    required
                    value={createForm.deviceModel}
                    onChange={(e) => setCreateForm({...createForm, deviceModel: e.target.value})}
                    placeholder="e.g. iPhone 13 Pro"
                    className="ds-input"
                  />
                </div>
                <div className="ds-form-group">
                  <label className="ds-label">Serial / IMEI No</label>
                  <input
                    type="text"
                    value={createForm.deviceSerialNumber}
                    onChange={(e) => setCreateForm({...createForm, deviceSerialNumber: e.target.value})}
                    placeholder="IMEI or Serial Number"
                    className="ds-input"
                  />
                </div>
              </div>

              <div className="ds-form-group">
                <label className="ds-label">Reported Issue *</label>
                <input
                  type="text"
                  required
                  value={createForm.reportedIssue}
                  onChange={(e) => setCreateForm({...createForm, reportedIssue: e.target.value})}
                  placeholder="e.g. Display cracked / White screen / Battery drain"
                  className="ds-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="ds-form-group">
                  <label className="ds-label">Estimated Cost (Rs.)</label>
                  <input
                    type="number"
                    value={createForm.estimatedCost}
                    onChange={(e) => setCreateForm({...createForm, estimatedCost: Number(e.target.value)})}
                    className="ds-input"
                  />
                </div>
              </div>

              <div className="ds-form-group">
                <label className="ds-label">Internal / Intake Notes</label>
                <textarea
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({...createForm, notes: e.target.value})}
                  placeholder="Note physical scratches, liquid entry tags..."
                  rows="2"
                  className="ds-input"
                />
              </div>

              <div className="ds-modal-footer flex gap-3 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="ds-btn ds-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ds-btn ds-btn-primary"
                >
                  Create & Print Job Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════ MODAL: UPDATE / PROCEED REPAIR JOB ════════════════ */}
      {showUpdateModal && selectedRepair && (
        <div className="ds-modal-overlay no-print" onClick={() => setShowUpdateModal(false)}>
          <div className="ds-modal ds-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="ds-modal-header">
              <h3 className="ds-modal-title flex items-center gap-2">
                <Edit2 className="text-amber-500" /> Proceed Repair - Job #{selectedRepair.jobNo}
              </h3>
              <button
                onClick={() => setShowUpdateModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-all text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="ds-modal-body space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left col: Basic fields & Technicians */}
                <div className="space-y-4">
                  <div className="ds-form-group">
                    <label className="ds-label">Repair Job Status</label>
                    <select
                      value={updateForm.status}
                      onChange={(e) => setUpdateForm({...updateForm, status: e.target.value})}
                      className="ds-select"
                    >
                      <option value="received">Received / Intake</option>
                      <option value="in_progress">In Progress / Repairing</option>
                      <option value="completed">Completed / Ready</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="ds-form-group">
                    <label className="ds-label">Assign Technicians</label>
                    <p className="text-xs text-gray-500 mb-1.5">Assign one or more staff to work on this device:</p>
                    {technicians.length === 0 ? (
                      <p className="text-xs text-gray-500 italic">No employees found in store system.</p>
                    ) : (
                      <EmployeeSelector
                        alwaysOpen
                        multiple
                        employees={technicians}
                        value={updateForm.technicians}
                        onChange={(ids) => setUpdateForm({ ...updateForm, technicians: ids })}
                      />
                    )}
                  </div>

                  <div className="ds-form-group">
                    <label className="ds-label">Repairing Fee / Labor Fee (Rs.)</label>
                    <input
                      type="number"
                      value={updateForm.repairFee}
                      onChange={(e) => setUpdateForm({...updateForm, repairFee: Number(e.target.value)})}
                      className="ds-input"
                    />
                  </div>

                  <div className="ds-form-group">
                    <label className="ds-label">Repair Progress Notes</label>
                    <textarea
                      value={updateForm.notes}
                      onChange={(e) => setUpdateForm({...updateForm, notes: e.target.value})}
                      placeholder="Note parts replaced, issues resolved..."
                      rows="2"
                      className="ds-input"
                    />
                  </div>
                </div>

                {/* Right col: Parts Panel */}
                <div className="space-y-4 border-t md:border-t-0 md:border-l border-gray-200 md:pl-4">
                  <div>
                    <label className="ds-label flex justify-between">
                      <span>Replacement Parts Used</span>
                      <span className="text-xs text-blue-600 normal-case font-normal">Deducts inventory on checkout</span>
                    </label>

                    {/* Search store accessories */}
                    <div className="relative mb-2">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                        <Search size={14} />
                      </span>
                      <input
                        type="text"
                        value={partSearch}
                        onChange={(e) => setPartSearch(e.target.value)}
                        placeholder="Search store inventory..."
                        className="ds-search pl-8 w-full"
                      />
                      {partSearchResults.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 shadow-lg rounded-xl max-h-40 overflow-y-auto z-10 text-xs">
                          {partSearchResults.map(product => (
                            <button
                              key={product._id}
                              type="button"
                              onClick={() => handleAddInventoryPart(product)}
                              className="w-full text-left px-3 py-2 hover:bg-gray-50 flex justify-between items-center border-b border-gray-100 last:border-b-0"
                            >
                              <div className="max-w-[70%]">
                                <span className="font-semibold text-gray-900 block truncate">{product.name}</span>
                                <span className="block text-xs text-gray-500">Stock: {product.stock} | SKU: {product.sku || 'N/A'}</span>
                              </div>
                              <span className="text-blue-600 font-bold">Rs. {product.price?.toLocaleString()}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Add Custom / External Parts */}
                    <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 mb-3">
                      <p className="text-xs font-bold text-gray-900 mb-1.5 uppercase">Add Custom External Part</p>
                      <div className="grid grid-cols-5 gap-1.5">
                        <input
                          type="text"
                          placeholder="Part Name"
                          value={customPart.name}
                          onChange={(e) => setCustomPart({ ...customPart, name: e.target.value })}
                          className="col-span-3 p-1.5 text-xs border border-gray-200 rounded-lg bg-white"
                        />
                        <input
                          type="number"
                          placeholder="Cost"
                          value={customPart.cost || ''}
                          onChange={(e) => setCustomPart({ ...customPart, cost: Number(e.target.value) })}
                          className="col-span-2 p-1.5 text-xs border border-gray-200 rounded-lg bg-white"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddCustomPart}
                        className="mt-2 w-full py-1.5 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1"
                      >
                        <PlusCircle size={14} /> Add Custom Part
                      </button>
                    </div>

                    {/* Added Parts List */}
                    <div className="max-h-44 overflow-y-auto border border-gray-200 rounded-xl bg-gray-50 p-2 space-y-1.5">
                      {updateForm.partsUsed.length === 0 ? (
                        <p className="text-xs text-gray-500 italic text-center py-4">No parts added yet.</p>
                      ) : (
                        updateForm.partsUsed.map((part, idx) => (
                          <div key={idx} className="bg-white p-2 rounded-lg border border-gray-200 text-xs flex justify-between items-center">
                            <div className="max-w-[70%]">
                              <span className="font-semibold text-gray-900 block truncate">{part.name}</span>
                              <span className="text-xs text-gray-500">
                                {part.isInventory ? 'Inventory Part' : 'External Part'} | Rs. {part.cost.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="1"
                                value={part.qty}
                                onChange={(e) => handlePartQtyChange(idx, e.target.value)}
                                className="w-10 p-1 border border-gray-200 rounded text-center"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemovePart(idx)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-all"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Summary Live Calculation Box */}
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-800">
                    <div className="flex justify-between mb-1">
                      <span>Labor / Repair Fee:</span>
                      <span className="font-bold">Rs. {Number(updateForm.repairFee).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span>Parts Cost ({updateForm.partsUsed.length} items):</span>
                      <span className="font-bold">Rs. {currentPartsTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t border-emerald-200 pt-2 font-bold text-sm text-emerald-900">
                      <span>Live Grand Total:</span>
                      <span>Rs. {currentGrandTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="ds-modal-footer flex gap-3 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="ds-btn ds-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ds-btn ds-btn-primary"
                >
                  Save Progress
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════ MODAL: CHECKOUT & DELIVER REPAIR JOB ════════════════ */}
      {showCheckoutModal && selectedRepair && (
        <div className="ds-modal-overlay no-print" onClick={() => setShowCheckoutModal(false)}>
          <div className="ds-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ds-modal-header">
              <h3 className="ds-modal-title flex items-center gap-2">
                <CheckCircle2 className="text-emerald-500" /> Deliver & Checkout Job
              </h3>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-all text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="ds-modal-body space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex gap-3 text-xs text-amber-800">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600" />
                <div>
                  This action marks the job as **Delivered**, decrements accessories stock in inventory, and posts payment income directly into your centralized ledger.
                </div>
              </div>

              {/* Summary Detail */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Job Reference:</span>
                  <span className="font-bold text-gray-900">{selectedRepair.jobNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Customer Name:</span>
                  <span className="font-bold text-gray-900">{selectedRepair.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Device:</span>
                  <span className="font-bold text-gray-900">{selectedRepair.deviceModel}</span>
                </div>
                <div className="border-t border-gray-200 my-2 pt-2"></div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">Service Labor Fee:</span>
                  <span className="font-bold text-gray-900">Rs. {(selectedRepair.repairFee || 0).toLocaleString()}</span>
                </div>
                
                {selectedRepair.partsUsed && selectedRepair.partsUsed.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-gray-500 block">Parts Replacement:</span>
                    {selectedRepair.partsUsed.map((p, idx) => (
                      <div key={idx} className="flex justify-between pl-3 text-xs text-gray-600">
                        <span>{p.name} (x{p.qty}):</span>
                        <span>Rs. {(p.cost * p.qty).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="border-t-2 border-dashed border-gray-200 my-2 pt-2 flex justify-between font-bold text-sm text-gray-900">
                  <span>Grand Total Payable:</span>
                  <span>
                    Rs. {((selectedRepair.repairFee || 0) + (selectedRepair.partsUsed?.reduce((sum, p) => sum + (p.cost * p.qty), 0) || 0)).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="ds-form-group">
                <label className="ds-label">Payment Method</label>
                <select
                  value={checkoutForm.paymentMethod}
                  onChange={(e) => setCheckoutForm({...checkoutForm, paymentMethod: e.target.value})}
                  className="ds-select"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Card">Card</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div className="ds-form-group">
                <label className="ds-label">Debit Cash Drawer / Bank Account</label>
                <select
                  required
                  value={checkoutForm.accountId}
                  onChange={(e) => setCheckoutForm({...checkoutForm, accountId: e.target.value})}
                  className="ds-select"
                >
                  <option value="">-- Select Cash/Bank Account --</option>
                  {accounts.map(acc => (
                    <option key={acc._id} value={acc._id}>
                      {acc.name} ({acc.type}) - Balance: Rs. {acc.balance.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ds-modal-footer flex gap-3 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="ds-btn ds-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ds-btn ds-btn-primary bg-emerald-600 hover:bg-emerald-700 border-none"
                >
                  Deliver & Print Invoice
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
        itemName={itemToDelete ? `Repair Job #${itemToDelete.jobNo} (${itemToDelete.deviceModel})` : ''}
      />
    </DashboardLayout>
  );
};

export default AdminRepairs;
