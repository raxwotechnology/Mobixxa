'use client';

import { useState, useEffect } from 'react';
import { 
  User, 
  Search, 
  History, 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  ChevronRight,
  Phone,
  CreditCard,
  Calendar,
  ExternalLink,
  Users,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { getCustomerHistory, getAllCustomers } from '../../services/api';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/DashboardLayout';
import { adminNavGroups as navItems } from './adminNavItems';

const AdminCustomerHistory = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const q = searchTerm.toLowerCase();
      setFilteredCustomers(
        customers.filter(c => 
          c.name.toLowerCase().includes(q) || 
          c.phone.toLowerCase().includes(q)
        )
      );
    }
  }, [searchTerm, customers]);

  const fetchCustomers = async () => {
    try {
      setListLoading(true);
      const { data } = await getAllCustomers();
      setCustomers(data || []);
      setFilteredCustomers(data || []);
    } catch (err) {
      toast.error('Failed to load customer list');
    } finally {
      setListLoading(false);
    }
  };

  const handleSelectCustomer = async (customer) => {
    setSelectedCustomer(customer);
    setLoading(true);
    try {
      const searchPhone = customer.phone.replace(/[\s\-()+]/g, '');
      const { data } = await getCustomerHistory(searchPhone);
      setHistory(data);
    } catch (err) {
      toast.error('Failed to load history for this customer');
      setHistory(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout navItems={navItems} title="Customer History">
      <div className="ds-page">
        {/* Page Header */}
        <div className="ds-page-header">
          <div className="ds-page-header-left">
            <div className="ds-page-header-icon">
              <Users size={20} strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="ds-page-title">Customer History</h1>
              <p className="ds-page-subtitle">View and filter customer purchase history and credit status</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
          {/* Left Sidebar: Customer List */}
          <div className="w-full lg:w-80 ds-card p-0 flex flex-col overflow-hidden shrink-0">
            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search name or phone..."
                  className="ds-input pl-10 text-xs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[500px] lg:max-h-none divide-y divide-slate-100">
              {listLoading ? (
                <div className="p-8 flex items-center justify-center">
                  <Loader2 className="animate-spin text-slate-400" size={24} />
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  <p>No customers found</p>
                </div>
              ) : (
                filteredCustomers.map((customer) => (
                  <button
                    key={customer.phone}
                    onClick={() => handleSelectCustomer(customer)}
                    className={`w-full text-left p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group ${
                      selectedCustomer?.phone === customer.phone ? 'bg-slate-50 border-l-4 border-slate-900' : 'border-l-4 border-transparent'
                    }`}
                  >
                    <div className="min-w-0">
                      <h4 className={`text-xs font-semibold truncate ${
                        selectedCustomer?.phone === customer.phone ? 'text-slate-900 font-bold' : 'text-slate-800'
                      }`}>
                        {customer.name}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[0.7rem] text-slate-500 mt-1">
                        <Phone size={11} className="text-slate-400" />
                        {customer.phone}
                      </div>
                    </div>
                    <ChevronRight size={14} className={`text-slate-300 group-hover:text-slate-600 transition-colors ${
                      selectedCustomer?.phone === customer.phone ? 'text-slate-900' : ''
                    }`} />
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Panel: Details & History */}
          <div className="flex-1 ds-card p-0 flex flex-col overflow-hidden">
            {!selectedCustomer ? (
              <div className="p-16 flex flex-col items-center justify-center text-slate-400 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <Users size={28} />
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-semibold text-slate-700">Select a Customer</h3>
                  <p className="text-xs text-slate-400 mt-1">Choose a customer from the left to view their details</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                {/* Detail Header */}
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                      <User size={20} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">{selectedCustomer.name}</h2>
                      <p className="text-xs text-slate-500">{selectedCustomer.phone}</p>
                    </div>
                  </div>

                  {history && (
                    <div className="flex flex-wrap gap-3">
                      <div className="ds-stat p-3 min-w-[90px] bg-white border border-slate-200">
                        <div className="ds-stat-label">Orders</div>
                        <div className="ds-stat-value text-slate-900 text-lg">{history.orders.length}</div>
                      </div>
                      <div className="ds-stat p-3 min-w-[90px] bg-white border border-slate-200">
                        <div className="ds-stat-label">HP Plans</div>
                        <div className="ds-stat-value text-slate-900 text-lg">{history.hpAgreements.length}</div>
                      </div>
                      <div className="ds-stat p-3 min-w-[120px] bg-white border border-slate-200">
                        <div className="ds-stat-label">Total Spent</div>
                        <div className="ds-stat-value text-emerald-600 text-lg">Rs. {history.orders.reduce((s, o) => s + o.totalAmount, 0).toLocaleString()}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Detail Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {loading ? (
                    <div className="p-16 flex flex-col items-center justify-center text-slate-400 gap-3">
                      <Loader2 className="animate-spin text-slate-500" size={32} />
                      <p className="text-xs">Loading customer history...</p>
                    </div>
                  ) : history ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Orders Section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                          <ShoppingBag size={16} className="text-slate-600" />
                          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Recent Purchases</h3>
                        </div>
                        
                        {history.orders.length === 0 ? (
                          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                            No previous orders found
                          </div>
                        ) : (
                          history.orders.map((order) => (
                            <div key={order._id} className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <span className="text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider">Invoice {order.invoiceNumber}</span>
                                  <h4 className="text-xs font-semibold text-slate-800 mt-1 line-clamp-1">
                                    {order.items.map(i => i.name).join(', ')}
                                  </h4>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-bold text-slate-900">Rs. {order.totalAmount.toLocaleString()}</p>
                                  <p className="text-[0.7rem] text-slate-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 mt-2">
                                <span className={`ds-badge ${
                                  order.paymentStatus === 'Paid' || order.paymentStatus === 'completed' ? 'ds-badge-green' : 'ds-badge-red'
                                }`}>
                                  {order.paymentStatus}
                                </span>
                                <button className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 font-medium transition-colors">
                                  View Receipt <ExternalLink size={11} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* HP Section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                          <Clock size={16} className="text-slate-600" />
                          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Installment Plans (HP)</h3>
                        </div>

                        {history.hpAgreements.length === 0 ? (
                          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                            No HP agreements found
                          </div>
                        ) : (
                          history.hpAgreements.map((hp) => (
                            <div key={hp._id} className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <span className="text-[0.7rem] font-mono text-slate-400 uppercase tracking-wider">HP-{hp._id.slice(-6).toUpperCase()}</span>
                                  <h4 className="text-xs font-semibold text-slate-800 mt-0.5">Plan from {new Date(hp.startDate).toLocaleDateString()}</h4>
                                </div>
                                <span className={`ds-badge ${
                                  hp.status === 'Completed' ? 'ds-badge-green' : 'ds-badge-amber'
                                }`}>
                                  {hp.status}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-2 mb-3">
                                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                  <p className="text-[0.65rem] text-slate-400 uppercase font-semibold">Total</p>
                                  <p className="text-xs font-bold text-slate-800">Rs. {hp.netTotal.toLocaleString()}</p>
                                </div>
                                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                  <p className="text-[0.65rem] text-slate-400 uppercase font-semibold">Paid</p>
                                  <p className="text-xs font-bold text-emerald-600">Rs. {hp.totalPaid.toLocaleString()}</p>
                                </div>
                                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                  <p className="text-[0.65rem] text-slate-400 uppercase font-semibold">Balance</p>
                                  <p className="text-xs font-bold text-red-600">Rs. {hp.balanceAmount.toLocaleString()}</p>
                                </div>
                              </div>

                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                                <div 
                                  className="h-full bg-slate-900 rounded-full transition-all"
                                  style={{ width: `${Math.min(100, (hp.totalPaid/hp.netTotal)*100)}%` }}
                                />
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                                <div className="flex items-center gap-1.5 text-[0.7rem]">
                                  <Calendar size={11} className="text-slate-400" /> Due: {new Date(hp.nextDueDate).toLocaleDateString()}
                                </div>
                                <button className="text-xs font-semibold text-slate-700 hover:text-slate-900">Manage</button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-16 text-center text-xs text-slate-400">
                      Select a customer to view their detailed history
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminCustomerHistory;
