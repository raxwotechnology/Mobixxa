'use client';

import { useState, useEffect, useMemo } from 'react';
import { FileDown } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import {
  getAdminOrders, getAdminProducts, getAdminUsers, getCustomerReturns, getTransactions,
  getPayrollReport,
} from '../../services/api';
import { toast } from 'react-toastify';
import { adminNavGroups as navItems } from './adminNavItems';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/exportUtils';

const AdminReports = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [returnsData, setReturnsData] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [returnStatusFilter, setReturnStatusFilter] = useState('all');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('all');
  const [incomeSourceFilter, setIncomeSourceFilter] = useState('all');
  const [salaryMonth, setSalaryMonth] = useState(new Date().getMonth() + 1);
  const [salaryYear, setSalaryYear] = useState(new Date().getFullYear());
  const [salaryRoleFilter, setSalaryRoleFilter] = useState('all');
  const [salaryEmployeeSearch, setSalaryEmployeeSearch] = useState('');
  const [payrollData, setPayrollData] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try { const { data } = await getAdminOrders(); setOrders(data); }
      catch { toast.error('Failed to load data'); }
      finally { setLoading(false); }
    };
    const fetchAll = async () => {
      try {
        const [u, p, o, r, e, i] = await Promise.all([
          getAdminUsers(),
          getAdminProducts(),
          getAdminOrders(),
          getCustomerReturns({}),
          getTransactions({ type: 'expense' }),
          getTransactions({ type: 'income' }),
        ]);
        setUsers(u.data || []);
        setProducts(p.data || []);
        setOrders(o.data || []);
        setReturnsData(r.data || []);
        setExpenses(e.data || []);
        setIncomes(i.data || []);
      } catch {
        toast.error('Failed to load report datasets');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    const fetchPayroll = async () => {
      try {
        const { data } = await getPayrollReport({
          month: salaryMonth,
          year: salaryYear,
          role: salaryRoleFilter,
          employeeName: salaryEmployeeSearch || undefined,
        });
        setPayrollData(data?.payrolls || []);
      } catch {
        setPayrollData([]);
      }
    };
    if (activeTab === 'salary') fetchPayroll();
  }, [activeTab, salaryMonth, salaryYear, salaryRoleFilter, salaryEmployeeSearch]);

  const filteredUsers = useMemo(
    () => (roleFilter === 'all' ? users : users.filter((u) => u.role === roleFilter)),
    [users, roleFilter]
  );
  const filteredProducts = useMemo(
    () => (categoryFilter === 'all' ? products : products.filter((p) => (p.categoryId?.name || 'Uncategorized') === categoryFilter)),
    [products, categoryFilter]
  );
  const filteredOrders = useMemo(
    () => (orderStatusFilter === 'all' ? orders : orders.filter((o) => o.orderStatus === orderStatusFilter)),
    [orders, orderStatusFilter]
  );
  const filteredReturns = useMemo(
    () => (returnStatusFilter === 'all' ? returnsData : returnsData.filter((r) => r.status === returnStatusFilter)),
    [returnsData, returnStatusFilter]
  );
  const filteredExpenses = useMemo(
    () => (expenseCategoryFilter === 'all' ? expenses : expenses.filter((e) => e.category === expenseCategoryFilter)),
    [expenses, expenseCategoryFilter]
  );
  const filteredIncomes = useMemo(
    () => (incomeSourceFilter === 'all' ? incomes : incomes.filter((i) => i.source === incomeSourceFilter)),
    [incomes, incomeSourceFilter]
  );

  const categories = [...new Set(products.map((p) => p.categoryId?.name || 'Uncategorized'))];
  const orderStatuses = [...new Set(orders.map((o) => o.orderStatus))];
  const returnStatuses = [...new Set(returnsData.map((r) => r.status))];
  const expenseCategories = [...new Set(expenses.map((e) => e.category))];
  const incomeSources = [...new Set(incomes.map((i) => i.source))];
  const payrollNames = [...new Set(payrollData.map((p) => p.employeeId?.name).filter(Boolean))];

  const exportCurrent = (type) => {
    const cfg = {
      users: {
        rows: filteredUsers,
        cols: [
          { label: 'Name', accessor: 'name' }, { label: 'Email', accessor: 'email' }, { label: 'Role', accessor: 'role' },
          { label: 'Phone', accessor: 'phone' }, { label: 'Active', accessor: (r) => (r.isActive ? 'Yes' : 'No') },
        ],
        title: 'Users Report',
      },
      products: {
        rows: filteredProducts,
        cols: [
          { label: 'Name', accessor: 'name' }, { label: 'Category', accessor: (r) => r.categoryId?.name || 'Uncategorized' },
          { label: 'Price', accessor: (r) => Number(r.price || 0).toFixed(2) }, { label: 'Stock', accessor: 'stock' },
          { label: 'Status', accessor: 'status' },
        ],
        title: 'Products Report',
      },
      orders: {
        rows: filteredOrders,
        cols: [
          { label: 'Order ID', accessor: (r) => String(r._id).slice(-8).toUpperCase() }, { label: 'Customer', accessor: (r) => r.userId?.name || 'N/A' },
          { label: 'Status', accessor: 'orderStatus' }, { label: 'Payment', accessor: 'paymentStatus' }, { label: 'Amount', accessor: (r) => Number(r.totalAmount || 0).toFixed(2) },
        ],
        title: 'Orders Report',
      },
      returns: {
        rows: filteredReturns,
        cols: [
          { label: 'RMA', accessor: 'holdBillNo' }, { label: 'Order', accessor: (r) => String(r.orderId?._id || r.orderId).slice(-8).toUpperCase() },
          { label: 'Customer', accessor: (r) => r.customerId?.name || 'N/A' }, { label: 'Status', accessor: 'status' },
        ],
        title: 'Returns Report',
      },
      expenses: {
        rows: filteredExpenses,
        cols: [
          { label: 'Title', accessor: 'title' }, { label: 'Category', accessor: 'category' },
          { label: 'Amount', accessor: (r) => Number(r.amount || 0).toFixed(2) }, { label: 'Status', accessor: 'status' },
        ],
        title: 'Expenses Report',
      },
      incomes: {
        rows: filteredIncomes,
        cols: [
          { label: 'Title', accessor: 'title' }, { label: 'Source', accessor: 'source' },
          { label: 'Amount', accessor: (r) => Number(r.amount || 0).toFixed(2) }, { label: 'Date', accessor: (r) => new Date(r.date).toLocaleDateString() },
        ],
        title: 'Incomes Report',
      },
      salary: {
        rows: payrollData,
        cols: [
          { label: 'Employee', accessor: (r) => r.employeeId?.name || 'N/A' },
          { label: 'Role Category', accessor: (r) => r.employeeId?.role || 'N/A' },
          { label: 'Period', accessor: (r) => `${r.month}/${r.year}` },
          { label: 'Basic', accessor: (r) => Number(r.basicSalary || 0).toFixed(2) },
          { label: 'Bonus', accessor: (r) => Number(r.bonuses || 0).toFixed(2) },
          { label: 'Deductions', accessor: (r) => Number(r.otherDeductions || 0).toFixed(2) },
          { label: 'Net Salary', accessor: (r) => Number(r.netSalary || 0).toFixed(2) },
        ],
        title: 'Salary Category Report',
      },
    }[activeTab];
    if (!cfg) return;
    if (type === 'csv') exportToCSV(cfg.rows, cfg.cols, cfg.title.toLowerCase().replace(/\s+/g, '-'));
    if (type === 'excel') exportToExcel(cfg.rows, cfg.cols, cfg.title.toLowerCase().replace(/\s+/g, '-'));
    if (type === 'pdf') exportToPDF(cfg.rows, cfg.cols, cfg.title);
  };

  if (loading) return <DashboardLayout navItems={navItems} title="Reports"><div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-slate-200 border-t-brand-fuchsia rounded-full animate-spin" /></div></DashboardLayout>;

  return (
    <DashboardLayout navItems={navItems} title="Reports">
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white/40 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-indigo/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <span className="text-2xl">📊</span> Categorized Reports
            </h1>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-2">Filter by category/role and export as PDF or Excel</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => exportCurrent('csv')} className="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors shadow-sm">CSV</button>
            <button onClick={() => exportCurrent('excel')} className="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-emerald-100/50 text-emerald-700 hover:bg-emerald-200/50 transition-colors shadow-sm">Excel</button>
            <button onClick={() => exportCurrent('pdf')} className="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-red-100/50 text-red-700 hover:bg-red-200/50 flex items-center gap-2 transition-colors shadow-sm"><FileDown size={14} strokeWidth={3} />PDF</button>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap bg-white/40 p-2 rounded-2xl backdrop-blur-sm border border-white/40 shadow-sm w-fit">
          {[
            ['users', 'Users/Employees'],
            ['products', 'Products'],
            ['orders', 'Orders'],
            ['returns', 'Returns'],
            ['expenses', 'Expenses'],
            ['incomes', 'Incomes'],
            ['salary', 'Salary Reports'],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${activeTab === id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-white hover:text-slate-900'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/40 p-6 shadow-sm">
          {activeTab === 'users' && (
            <>
              <div className="mb-4">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 mr-3">Role</label>
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo shadow-sm">
                  {['all', 'customer', 'cashier', 'manager', 'deliveryGuy', 'stockEmployee', 'admin'].map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Records: <span className="text-slate-700 font-black">{filteredUsers.length}</span></p>
            </>
          )}
          {activeTab === 'products' && (
            <>
              <div className="mb-4">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 mr-3">Category</label>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo shadow-sm">
                  <option value="all">all</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Records: <span className="text-slate-700 font-black">{filteredProducts.length}</span></p>
            </>
          )}
          {activeTab === 'orders' && (
            <>
              <div className="mb-4">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 mr-3">Status</label>
                <select value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo shadow-sm">
                  <option value="all">all</option>
                  {orderStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Records: <span className="text-slate-700 font-black">{filteredOrders.length}</span></p>
            </>
          )}
          {activeTab === 'returns' && (
            <>
              <div className="mb-4">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 mr-3">Status</label>
                <select value={returnStatusFilter} onChange={(e) => setReturnStatusFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo shadow-sm">
                  <option value="all">all</option>
                  {returnStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Records: <span className="text-slate-700 font-black">{filteredReturns.length}</span></p>
            </>
          )}
          {activeTab === 'expenses' && (
            <>
              <div className="mb-4">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 mr-3">Category</label>
                <select value={expenseCategoryFilter} onChange={(e) => setExpenseCategoryFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo shadow-sm">
                  <option value="all">all</option>
                  {expenseCategories.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Records: <span className="text-slate-700 font-black">{filteredExpenses.length}</span></p>
            </>
          )}
          {activeTab === 'incomes' && (
            <>
              <div className="mb-4">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 mr-3">Source</label>
                <select value={incomeSourceFilter} onChange={(e) => setIncomeSourceFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo shadow-sm">
                  <option value="all">all</option>
                  {incomeSources.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Records: <span className="text-slate-700 font-black">{filteredIncomes.length}</span></p>
            </>
          )}
          {activeTab === 'salary' && (
            <>
              <div className="mb-4 flex flex-wrap gap-4 items-center bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Month</label>
                  <input type="number" min="1" max="12" value={salaryMonth} onChange={(e) => setSalaryMonth(Number(e.target.value || 1))} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 w-20 shadow-sm" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Year</label>
                  <input type="number" value={salaryYear} onChange={(e) => setSalaryYear(Number(e.target.value || new Date().getFullYear()))} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 w-24 shadow-sm" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Role Category</label>
                  <select value={salaryRoleFilter} onChange={(e) => setSalaryRoleFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 shadow-sm">
                    {['all', 'cashier', 'manager', 'deliveryGuy', 'stockEmployee'].map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Search Employee</label>
                  <input
                    list="salary-employee-list"
                    value={salaryEmployeeSearch}
                    onChange={(e) => setSalaryEmployeeSearch(e.target.value)}
                    placeholder="Type name..."
                    className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 shadow-sm w-full sm:w-48"
                  />
                  <datalist id="salary-employee-list">
                    {payrollNames.map((name) => <option key={name} value={name} />)}
                  </datalist>
                </div>
              </div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-2">Total Records: <span className="text-slate-700 font-black">{payrollData.length}</span></p>
            </>
          )}
          <div className="mt-4 text-[10px] font-black uppercase tracking-wider text-slate-400 p-3 bg-brand-indigo/5 rounded-xl border border-brand-indigo/10 flex gap-2">
             <span className="text-sm">💡</span> Use the export buttons (CSV / Excel / PDF) to download the currently filtered report.
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mt-6">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-800 m-0">Detailed Preview</h3>
          </div>
          <div className="overflow-x-auto">
            {activeTab === 'users' && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Name</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Email</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Role</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Phone</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{u.name}</td>
                      <td className="px-6 py-4 text-slate-600">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">{u.role}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-mono text-xs">{u.phone || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${u.isActive ? 'bg-emerald-100/50 text-emerald-700' : 'bg-red-100/50 text-red-700'}`}>
                          {u.isActive ? 'Yes' : 'No'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'products' && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Name</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Category</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Price</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Stock</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{p.name}</td>
                      <td className="px-6 py-4 text-slate-600">
                        <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">{p.categoryId?.name || 'Uncategorized'}</span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">Rs. {Number(p.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">{p.stock}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${p.status === 'active' ? 'bg-emerald-100/50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'orders' && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Order</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Customer</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Status</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Payment</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((o) => (
                    <tr key={o._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-brand-indigo text-xs">#{String(o._id).slice(-8).toUpperCase()}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">{o.userId?.name || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">{o.orderStatus}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${o.paymentStatus === 'Paid' ? 'bg-emerald-100/50 text-emerald-700' : 'bg-orange-100/50 text-orange-700'}`}>
                          {o.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">Rs. {Number(o.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'returns' && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">RMA</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Order</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Customer</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReturns.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-800 text-xs">{r.holdBillNo}</td>
                      <td className="px-6 py-4 font-mono font-bold text-brand-indigo text-xs">#{String(r.orderId?._id || r.orderId).slice(-8).toUpperCase()}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">{r.customerId?.name || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${r.status === 'Completed' ? 'bg-emerald-100/50 text-emerald-700' : 'bg-orange-100/50 text-orange-700'}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'expenses' && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Title</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Category</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Amount</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExpenses.map((e) => (
                    <tr key={e._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{e.title}</td>
                      <td className="px-6 py-4">
                        <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">{e.category}</span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">Rs. {Number(e.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${e.status === 'Paid' ? 'bg-emerald-100/50 text-emerald-700' : 'bg-red-100/50 text-red-700'}`}>
                          {e.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'incomes' && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Title</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Source</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Amount</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredIncomes.map((i) => (
                    <tr key={i._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{i.title}</td>
                      <td className="px-6 py-4">
                        <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-50 text-brand-indigo">{i.source}</span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">Rs. {Number(i.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 text-slate-500 font-mono text-xs">{new Date(i.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'salary' && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Employee</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Role Category</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Period</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Basic</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Bonus</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Deductions</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payrollData.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{p.employeeId?.name || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">{p.employeeId?.role || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-mono text-xs">{p.month}/{p.year}</td>
                      <td className="px-6 py-4 text-slate-600">Rs. {Number(p.basicSalary || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 text-emerald-600 font-bold">+Rs. {Number(p.bonuses || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 text-red-600 font-bold">-Rs. {Number(p.otherDeductions || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 font-black text-slate-900">Rs. {Number(p.netSalary || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {((activeTab === 'users' && filteredUsers.length === 0)
              || (activeTab === 'products' && filteredProducts.length === 0)
              || (activeTab === 'orders' && filteredOrders.length === 0)
              || (activeTab === 'returns' && filteredReturns.length === 0)
              || (activeTab === 'expenses' && filteredExpenses.length === 0)
              || (activeTab === 'incomes' && filteredIncomes.length === 0)
              || (activeTab === 'salary' && payrollData.length === 0)) && (
              <div className="px-6 py-12 text-sm text-center font-bold text-slate-400 bg-slate-50/50">No records found for the selected filters.</div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminReports;
