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
      <div className="p-6 max-w-[1600px] mx-auto h-[calc(100vh-100px)] flex flex-col">
        {/* Page Title */}
        <div className="mb-6 bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white/40 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-indigo/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
          <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-indigo/10 flex items-center justify-center text-brand-indigo">
              <Users size={20} strokeWidth={2.5} />
            </div>
            Customer Management
          </h1>
          <p className="text-[10px] font-normal uppercase tracking-wider text-slate-500 mt-2">View and filter customer purchase history and credit status</p>
        </div>

        <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Left Sidebar: Customer List */}
          <div className="w-full md:w-80 lg:w-96 bg-white/60 backdrop-blur-md rounded-3xl border border-white/40 shadow-sm flex flex-col overflow-hidden">
            <div className="p-5 border-b border-white/40 space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search name or phone..."
                  className="w-full pl-12 pr-4 py-3 bg-white/80 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo shadow-sm transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {listLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="animate-spin text-brand-indigo" size={32} />
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="p-10 text-center text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <p>No customers found</p>
                </div>
              ) : (
                <div className="divide-y divide-white/20">
                  {filteredCustomers.map((customer) => (
                    <button
                      key={customer.phone}
                      onClick={() => handleSelectCustomer(customer)}
                      className={`w-full text-left p-5 hover:bg-white/80 transition-all flex items-center justify-between group ${
                        selectedCustomer?.phone === customer.phone ? 'bg-white shadow-sm border-l-4 border-l-brand-indigo' : 'border-l-4 border-l-transparent'
                      }`}
                    >
                      <div className="min-w-0">
                        <h4 className={`text-sm font-black truncate ${
                          selectedCustomer?.phone === customer.phone ? 'text-brand-indigo' : 'text-slate-800'
                        }`}>
                          {customer.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">
                          <Phone size={10} />
                          {customer.phone}
                        </div>
                      </div>
                      <ChevronRight size={16} className={`text-slate-300 group-hover:text-brand-indigo transition-all ${
                        selectedCustomer?.phone === customer.phone ? 'translate-x-1 text-brand-indigo' : ''
                      }`} strokeWidth={selectedCustomer?.phone === customer.phone ? 3 : 2} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Details & History */}
          <div className="flex-1 bg-white/60 backdrop-blur-md rounded-3xl border border-white/40 shadow-sm flex flex-col overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-indigo/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
            
            {!selectedCustomer ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                <div className="p-6 bg-white/50 rounded-[2rem] border border-white/60 shadow-sm">
                  <Users size={64} className="text-slate-300" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-black text-slate-500">Select a Customer</h3>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-2">Choose a customer from the left to view their details</p>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                {/* Detail Header */}
                <div className="p-6 border-b border-white/40 bg-white/40 backdrop-blur-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-brand-indigo/10 text-brand-indigo flex items-center justify-center">
                      <User size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900">{selectedCustomer.name}</h2>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-1">{selectedCustomer.phone}</p>
                    </div>
                  </div>

                  {history && (
                    <div className="flex gap-4">
                      <div className="bg-white/80 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/60 shadow-sm text-center">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Orders</p>
                        <p className="text-xl font-black text-slate-900">{history.orders.length}</p>
                      </div>
                      <div className="bg-white/80 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/60 shadow-sm text-center">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">HP Plans</p>
                        <p className="text-xl font-black text-indigo-600">{history.hpAgreements.length}</p>
                      </div>
                      <div className="bg-white/80 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/60 shadow-sm text-center">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Total Spent</p>
                        <p className="text-xl font-black text-emerald-600">Rs. {history.orders.reduce((s, o) => s + o.totalAmount, 0).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Detail Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {loading ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                      <Loader2 className="animate-spin text-brand-indigo" size={40} />
                      <p className="text-[10px] font-black uppercase tracking-wider">Loading history...</p>
                    </div>
                  ) : history ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Orders Section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-4 sticky top-0 bg-white/80 backdrop-blur-md py-3 px-2 rounded-2xl z-10 border border-white">
                          <div className="w-8 h-8 rounded-xl bg-brand-indigo/10 flex items-center justify-center text-brand-indigo">
                            <ShoppingBag size={16} strokeWidth={2.5} />
                          </div>
                          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Recent Purchases</h2>
                        </div>
                        
                        {history.orders.length === 0 ? (
                          <div className="p-8 text-center bg-white/40 rounded-3xl border border-dashed border-white text-[10px] font-black uppercase tracking-wider text-slate-400">No previous orders found</div>
                        ) : (
                          history.orders.map((order) => (
                            <div key={order._id} className="bg-white/60 backdrop-blur-sm p-5 rounded-3xl border border-white/60 hover:shadow-lg hover:shadow-brand-indigo/5 transition-all group">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <span className="text-[10px] font-black text-brand-indigo uppercase tracking-wider">Invoice {order.invoiceNumber}</span>
                                  <h4 className="text-sm font-black text-slate-800 mt-1 leading-tight">
                                    {order.items.map(i => i.name).join(', ')}
                                  </h4>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-black text-slate-900">Rs. {order.totalAmount.toLocaleString()}</p>
                                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between pt-4 border-t border-white/40">
                                <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                  order.paymentStatus === 'Paid' || order.paymentStatus === 'completed' ? 'bg-emerald-100/50 text-emerald-700' : 'bg-red-100/50 text-red-700'
                                }`}>
                                  {order.paymentStatus}
                                </span>
                                <button className="text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-brand-indigo flex items-center gap-1.5 transition-colors">
                                  View Receipt <ExternalLink size={12} strokeWidth={2.5} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* HP Section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-4 sticky top-0 bg-white/80 backdrop-blur-md py-3 px-2 rounded-2xl z-10 border border-white">
                          <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                            <Clock size={16} strokeWidth={2.5} />
                          </div>
                          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Installment Plans (HP)</h2>
                        </div>

                        {history.hpAgreements.length === 0 ? (
                          <div className="p-8 text-center bg-white/40 rounded-3xl border border-dashed border-white text-[10px] font-black uppercase tracking-wider text-slate-400">No HP agreements found</div>
                        ) : (
                          history.hpAgreements.map((hp) => (
                            <div key={hp._id} className="bg-white/60 backdrop-blur-sm p-6 rounded-3xl border border-white/60 hover:shadow-lg transition-all relative overflow-hidden">
                              <div className="absolute top-0 left-0 w-1 h-full bg-orange-400"></div>
                              <div className="flex justify-between items-start mb-6">
                                <div>
                                  <span className="text-[10px] font-black text-orange-500 uppercase tracking-wider">Agreement ID: {hp._id.slice(-8).toUpperCase()}</span>
                                  <h4 className="text-sm font-black text-slate-900 mt-1">Plan from {new Date(hp.startDate).toLocaleDateString()}</h4>
                                </div>
                                <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                  hp.status === 'Completed' ? 'bg-emerald-100/50 text-emerald-700' : 'bg-orange-100/50 text-orange-700'
                                }`}>
                                  {hp.status}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-4 mb-5">
                                <div className="bg-white/80 p-3 rounded-2xl border border-slate-100 shadow-sm">
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Net Total</p>
                                  <p className="text-xs font-black text-slate-900">Rs. {hp.netTotal.toLocaleString()}</p>
                                </div>
                                <div className="bg-white/80 p-3 rounded-2xl border border-slate-100 shadow-sm">
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Paid So Far</p>
                                  <p className="text-xs font-black text-emerald-600">Rs. {hp.totalPaid.toLocaleString()}</p>
                                </div>
                                <div className="bg-white/80 p-3 rounded-2xl border border-slate-100 shadow-sm">
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Balance</p>
                                  <p className="text-xs font-black text-red-600">Rs. {hp.balanceAmount.toLocaleString()}</p>
                                </div>
                              </div>

                              <div className="w-full h-2 bg-white rounded-full overflow-hidden mb-5 border border-slate-100">
                                <div 
                                  className="h-full bg-orange-400 rounded-full transition-all duration-500 relative"
                                  style={{ width: `${(hp.totalPaid/hp.netTotal)*100}%` }}
                                >
                                  <div className="absolute inset-0 bg-white/20"></div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-4 border-t border-white/40">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
                                  <Calendar size={12} strokeWidth={2.5} /> Next Due: {new Date(hp.nextDueDate).toLocaleDateString()}
                                </div>
                                <button className="text-[10px] font-black uppercase tracking-wider text-brand-indigo hover:text-indigo-700 transition-colors">Manage Plan</button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-[11px] font-black uppercase tracking-wider text-slate-400">
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
