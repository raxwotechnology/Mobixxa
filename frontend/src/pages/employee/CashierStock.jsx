import { useState, useEffect } from 'react';
import { Package, AlertTriangle, Search } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { toast } from 'react-toastify';
import { getEmployeeNavGroups } from './employeeNav';
import useAuthStore from '../../store/authStore';
import API from '../../services/api';
import EmployeePageHeader, { EmployeeStatCard, EmployeeLoading, EmployeeTableWrap } from './EmployeePageHeader';
import { getImageUrl } from '../../utils/imageHelper';

const CashierStock = () => {
  const { user } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('all');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await API.get('/pos/products');
        setProducts(data);
      } catch {
        toast.error('Failed to load stock data');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filtered = products
    .filter((p) => {
      const matchSearch =
        p.name?.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search);
      const matchStock =
        stockFilter === 'all' ||
        (stockFilter === 'low' && p.stock > 0 && p.stock <= 10) ||
        (stockFilter === 'out' && p.stock <= 0) ||
        (stockFilter === 'ok' && p.stock > 10);
      return matchSearch && matchStock;
    })
    .sort((a, b) => (a.stock || 0) - (b.stock || 0));

  const total = products.length;
  const outOfStock = products.filter((p) => p.stock <= 0).length;
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 10).length;
  const inStock = products.filter((p) => p.stock > 10).length;

  if (loading) {
    return (
      <DashboardLayout navItems={getEmployeeNavGroups(user?.role)} title="Employee Portal">
        <EmployeeLoading />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={getEmployeeNavGroups(user?.role)} title="Employee Portal">
      <div className="animate-fade-in space-y-6">
        <EmployeePageHeader
          badge="INVENTORY"
          title="Stock View"
          subtitle="Check inventory status, pricing, and barcodes"
          icon={Package}
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <EmployeeStatCard label="Total Products" value={total} icon={Package} />
          <EmployeeStatCard label="In Stock" value={inStock} color="text-emerald-600" icon={Package} iconBg="bg-emerald-50 border-emerald-100/60" iconColor="text-emerald-600" />
          <EmployeeStatCard label="Low Stock (≤10)" value={lowStock} color="text-amber-600" icon={AlertTriangle} iconBg="bg-amber-50 border-amber-100/60" iconColor="text-amber-600" />
          <EmployeeStatCard label="Out of Stock" value={outOfStock} color="text-rose-600" icon={AlertTriangle} iconBg="bg-rose-50 border-rose-100/60" iconColor="text-rose-600" />
        </div>

        <div className="bg-white/60 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-white/40 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Search by name or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/80 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo shadow-sm"
            />
          </div>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="w-full sm:w-auto bg-white/80 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 cursor-pointer shadow-sm"
          >
            <option value="all">All Stock Statuses</option>
            <option value="ok">In Stock (&gt;10)</option>
            <option value="low">Low Stock (1-10)</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <EmployeeTableWrap>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-[10px] uppercase font-black tracking-wider text-slate-500 text-left">Product</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-[10px] uppercase font-black tracking-wider text-slate-500 text-left">Barcode</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-[10px] uppercase font-black tracking-wider text-slate-500 text-right">Price</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-[10px] uppercase font-black tracking-wider text-slate-500 text-right">Stock</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-[10px] uppercase font-black tracking-wider text-slate-500 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => {
                  const status = p.stock <= 0 ? 'out' : p.stock <= 10 ? 'low' : 'ok';
                  return (
                    <tr
                      key={p._id}
                      className={`hover:bg-slate-50/50 transition-colors ${
                        status === 'out' ? 'bg-rose-50/30' : status === 'low' ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center gap-3 min-w-0">
                          {p.images?.[0] ? (
                            <img
                              src={getImageUrl(p.images[0])}
                              alt=""
                              className="w-9 h-9 rounded-xl object-cover border border-slate-100 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                              <Package size={14} className="text-slate-400" />
                            </div>
                          )}
                          <span className="font-black text-slate-900 truncate max-w-[180px] sm:max-w-none">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 font-mono text-[10px] font-bold text-slate-500 whitespace-nowrap">
                        {p.barcode || p.sku || '—'}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-right font-black text-slate-900 whitespace-nowrap">
                        Rs. {p.price?.toLocaleString()}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                        <span
                          className={`text-sm font-black ${
                            status === 'out'
                              ? 'text-rose-500'
                              : status === 'low'
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                          }`}
                        >
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-center">
                        <span
                          className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full whitespace-nowrap ${
                            status === 'out'
                              ? 'bg-rose-100 text-rose-700'
                              : status === 'low'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {status === 'out' ? 'Out of Stock' : status === 'low' ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 font-black text-slate-400 text-[11px] uppercase tracking-wider">
                No products found
              </div>
            )}
          </EmployeeTableWrap>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CashierStock;
