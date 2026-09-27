'use client';

import { useState, useEffect, useMemo } from 'react';
import { FileDown } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import EmployeeSelector from '../../components/EmployeeSelector';
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
  const [salaryEmployeeIds, setSalaryEmployeeIds] = useState([]);
  const [payrollData, setPayrollData] = useState([]);

  useEffect(() => {
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
          employeeIds: salaryEmployeeIds.length > 0 ? salaryEmployeeIds.join(',') : undefined,
        });
        setPayrollData(data?.payrolls || []);
      } catch {
        setPayrollData([]);
      }
    };
    if (activeTab === 'salary') fetchPayroll();
  }, [activeTab, salaryMonth, salaryYear, salaryRoleFilter, salaryEmployeeIds]);

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

  if (loading) return <DashboardLayout navItems={navItems} title="Reports"><div className="flex items-center justify-center h-64"><div className="ds-spinner" /></div></DashboardLayout>;

  return (
    <DashboardLayout navItems={navItems} title="Reports">
      <div className="ds-page">
        <div className="ds-page-header">
          <div className="ds-page-header-left">
            <span className="ds-page-header-badge">
              REPORTS
            </span>
            <h1>Categorized Reports</h1>
            <p>Filter by category/role and export as PDF or Excel</p>
          </div>
          <div className="ds-page-header-right flex items-center gap-2">
            <button onClick={() => exportCurrent('csv')} className="ds-btn ds-btn-secondary">CSV</button>
            <button onClick={() => exportCurrent('excel')} className="ds-btn ds-btn-secondary">Excel</button>
            <button onClick={() => exportCurrent('pdf')} className="ds-btn ds-btn-primary">
              <FileDown size={14} /> PDF
            </button>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap mb-4">
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
              className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-white hover:text-slate-900'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="ds-card mb-6">
          <div className="ds-filter-bar p-4">
            {activeTab === 'users' && (
              <div className="flex items-center gap-4">
                <div className="ds-form-group flex-row items-center m-0">
                  <label className="ds-label mr-3 mb-0">Role</label>
                  <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="ds-select">
                    {['all', 'customer', 'cashier', 'manager', 'deliveryGuy', 'stockEmployee', 'admin'].map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 m-0">Total Records: <span className="text-slate-700 font-bold">{filteredUsers.length}</span></p>
              </div>
            )}
            {activeTab === 'products' && (
              <div className="flex items-center gap-4">
                <div className="ds-form-group flex-row items-center m-0">
                  <label className="ds-label mr-3 mb-0">Category</label>
                  <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="ds-select">
                    <option value="all">all</option>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 m-0">Total Records: <span className="text-slate-700 font-bold">{filteredProducts.length}</span></p>
              </div>
            )}
            {activeTab === 'orders' && (
              <div className="flex items-center gap-4">
                <div className="ds-form-group flex-row items-center m-0">
                  <label className="ds-label mr-3 mb-0">Status</label>
                  <select value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value)} className="ds-select">
                    <option value="all">all</option>
                    {orderStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 m-0">Total Records: <span className="text-slate-700 font-bold">{filteredOrders.length}</span></p>
              </div>
            )}
            {activeTab === 'returns' && (
              <div className="flex items-center gap-4">
                <div className="ds-form-group flex-row items-center m-0">
                  <label className="ds-label mr-3 mb-0">Status</label>
                  <select value={returnStatusFilter} onChange={(e) => setReturnStatusFilter(e.target.value)} className="ds-select">
                    <option value="all">all</option>
                    {returnStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 m-0">Total Records: <span className="text-slate-700 font-bold">{filteredReturns.length}</span></p>
              </div>
            )}
            {activeTab === 'expenses' && (
              <div className="flex items-center gap-4">
                <div className="ds-form-group flex-row items-center m-0">
                  <label className="ds-label mr-3 mb-0">Category</label>
                  <select value={expenseCategoryFilter} onChange={(e) => setExpenseCategoryFilter(e.target.value)} className="ds-select">
                    <option value="all">all</option>
                    {expenseCategories.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 m-0">Total Records: <span className="text-slate-700 font-bold">{filteredExpenses.length}</span></p>
              </div>
            )}
            {activeTab === 'incomes' && (
              <div className="flex items-center gap-4">
                <div className="ds-form-group flex-row items-center m-0">
                  <label className="ds-label mr-3 mb-0">Source</label>
                  <select value={incomeSourceFilter} onChange={(e) => setIncomeSourceFilter(e.target.value)} className="ds-select">
                    <option value="all">all</option>
                    {incomeSources.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 m-0">Total Records: <span className="text-slate-700 font-bold">{filteredIncomes.length}</span></p>
              </div>
            )}
            {activeTab === 'salary' && (
              <div className="flex flex-wrap gap-4 items-center">
                <div className="ds-form-group flex-row items-center m-0">
                  <label className="ds-label mr-2 mb-0">Month</label>
                  <input type="number" min="1" max="12" value={salaryMonth} onChange={(e) => setSalaryMonth(Number(e.target.value || 1))} className="ds-input w-20" />
                </div>
                <div className="ds-form-group flex-row items-center m-0">
                  <label className="ds-label mr-2 mb-0">Year</label>
                  <input type="number" value={salaryYear} onChange={(e) => setSalaryYear(Number(e.target.value || new Date().getFullYear()))} className="ds-input w-24" />
                </div>
                <div className="ds-form-group flex-row items-center m-0">
                  <label className="ds-label mr-2 mb-0">Role</label>
                  <select value={salaryRoleFilter} onChange={(e) => setSalaryRoleFilter(e.target.value)} className="ds-select">
                    {['all', 'cashier', 'manager', 'deliveryGuy', 'stockEmployee'].map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="ds-form-group flex-row items-center m-0 w-full sm:w-auto">
                  <label className="ds-label mr-2 mb-0 flex-shrink-0">Employees</label>
                  <div className="w-full sm:w-64">
                    <EmployeeSelector
                      multiple
                      employees={users.filter((u) => u.role !== 'customer')}
                      value={salaryEmployeeIds}
                      onChange={setSalaryEmployeeIds}
                      triggerLabel="All employees"
                    />
                  </div>
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 m-0 mt-2 w-full">Total Records: <span className="text-slate-700 font-bold">{payrollData.length}</span></p>
              </div>
            )}
          </div>
        </div>

        <div className="ds-table-wrap">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 m-0">Detailed Preview</h3>
          </div>
          {activeTab === 'users' && (
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u._id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td><span className="ds-badge ds-badge-slate">{u.role}</span></td>
                    <td>{u.phone || '-'}</td>
                    <td>
                      <span className={`ds-badge ${u.isActive ? 'ds-badge-green' : 'ds-badge-red'}`}>
                        {u.isActive ? 'Yes' : 'No'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'products' && (
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p._id}>
                    <td>{p.name}</td>
                    <td><span className="ds-badge ds-badge-slate">{p.categoryId?.name || 'Uncategorized'}</span></td>
                    <td>Rs. {Number(p.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td>{p.stock}</td>
                    <td>
                      <span className={`ds-badge ${p.status === 'active' ? 'ds-badge-green' : 'ds-badge-slate'}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'orders' && (
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o) => (
                  <tr key={o._id}>
                    <td>#{String(o._id).slice(-8).toUpperCase()}</td>
                    <td>{o.userId?.name || 'N/A'}</td>
                    <td><span className="ds-badge ds-badge-slate">{o.orderStatus}</span></td>
                    <td>
                      <span className={`ds-badge ${o.paymentStatus === 'Paid' ? 'ds-badge-green' : 'ds-badge-amber'}`}>
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td>Rs. {Number(o.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'returns' && (
            <table className="ds-table">
              <thead>
                <tr>
                  <th>RMA</th>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredReturns.map((r) => (
                  <tr key={r._id}>
                    <td>{r.holdBillNo}</td>
                    <td>#{String(r.orderId?._id || r.orderId).slice(-8).toUpperCase()}</td>
                    <td>{r.customerId?.name || 'N/A'}</td>
                    <td>
                      <span className={`ds-badge ${r.status === 'Completed' ? 'ds-badge-green' : 'ds-badge-amber'}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'expenses' && (
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((e) => (
                  <tr key={e._id}>
                    <td>{e.title}</td>
                    <td><span className="ds-badge ds-badge-slate">{e.category}</span></td>
                    <td>Rs. {Number(e.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td>
                      <span className={`ds-badge ${e.status === 'Paid' ? 'ds-badge-green' : 'ds-badge-red'}`}>
                        {e.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'incomes' && (
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Source</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredIncomes.map((i) => (
                  <tr key={i._id}>
                    <td>{i.title}</td>
                    <td><span className="ds-badge ds-badge-primary">{i.source}</span></td>
                    <td>Rs. {Number(i.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td>{new Date(i.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'salary' && (
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Role Category</th>
                  <th>Period</th>
                  <th>Basic</th>
                  <th>Bonus</th>
                  <th>Deductions</th>
                  <th>Net</th>
                </tr>
              </thead>
              <tbody>
                {payrollData.map((p) => (
                  <tr key={p._id}>
                    <td>{p.employeeId?.name || 'N/A'}</td>
                    <td><span className="ds-badge ds-badge-slate">{p.employeeId?.role || 'N/A'}</span></td>
                    <td>{p.month}/{p.year}</td>
                    <td>Rs. {Number(p.basicSalary || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td>+Rs. {Number(p.bonuses || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td>-Rs. {Number(p.otherDeductions || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td>Rs. {Number(p.netSalary || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
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
            <div className="ds-empty">No records found for the selected filters.</div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
};

export default AdminReports;
