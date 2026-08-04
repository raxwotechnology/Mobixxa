import { useState, useEffect } from 'react';
import { Search, ShieldCheck, ShieldAlert, Smartphone, FileText, Calendar, Clock, Store, RefreshCw } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { adminNavGroups } from './adminNavItems';
import { managerNavGroups } from '../storeOwner/managerNavItems';
import { checkWarrantyByImei, getStoreOrders } from '../../services/api';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/authStore';

const AdminWarranty = () => {
  const { user } = useAuthStore();
  const [searchImei, setSearchImei] = useState('');
  const [loading, setLoading] = useState(false);
  const [warrantyDetail, setWarrantyDetail] = useState(null);
  const currentNavGroups = user?.role === 'manager' ? managerNavGroups : adminNavGroups;

  const handleLookup = async (e) => {
    e?.preventDefault();
    if (!searchImei.trim()) {
      toast.error('Enter an IMEI or Invoice number');
      return;
    }
    setLoading(true);
    try {
      const { data } = await checkWarrantyByImei(searchImei.trim());
      setWarrantyDetail(data);
      if (!data.found) {
        toast.info('No warranty record found.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lookup failed');
      setWarrantyDetail(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Warranty & IMEI Management" navItems={currentNavGroups}>
      <div className="space-y-6">
        {/* Header Title Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-brand-indigo/20 text-brand-indigo border border-brand-indigo/30 uppercase tracking-wider mb-2">
              <ShieldCheck size={14} /> IMEI Warranty Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-black m-0 tracking-tight">IMEI & Warranty Lookup</h1>
            <p className="text-slate-400 text-xs sm:text-sm m-0 mt-1">Search, verify, and monitor device warranty validity across all sales and stores.</p>
          </div>
        </div>

        {/* Quick Search Bar */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Scan or type IMEI / Serial Number / Invoice No..."
                value={searchImei}
                onChange={(e) => setSearchImei(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-brand-indigo focus:ring-4 focus:ring-brand-indigo/10 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-brand-indigo hover:bg-brand-violet text-white font-extrabold px-6 py-3.5 rounded-2xl transition-all shadow-md shadow-brand-indigo/20 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer whitespace-nowrap"
            >
              {loading ? 'Searching...' : 'Lookup IMEI'}
            </button>
          </form>
        </div>

        {/* Detailed Result View */}
        {warrantyDetail && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            {warrantyDetail.found ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      warrantyDetail.isExpired ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                    }`}>
                      {warrantyDetail.isExpired ? <ShieldAlert size={22} /> : <ShieldCheck size={22} />}
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-800 m-0">
                        {warrantyDetail.isExpired ? 'Warranty Expired' : 'Active Warranty'}
                      </h3>
                      <p className="text-xs text-slate-500 m-0">{warrantyDetail.daysRemaining} days remaining</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                    warrantyDetail.isExpired ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {warrantyDetail.isExpired ? 'EXPIRED' : 'ACTIVE COVERAGE'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-1">Product</span>
                    <span className="font-extrabold text-slate-800 text-sm block">{warrantyDetail.productName}</span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-1">IMEI / Serial</span>
                    <span className="font-extrabold text-brand-indigo text-sm block">{warrantyDetail.imei}</span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-1">Invoice No</span>
                    <span className="font-extrabold text-slate-800 text-sm block">{warrantyDetail.invoiceNumber}</span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-1">Customer</span>
                    <span className="font-extrabold text-slate-800 text-sm block">{warrantyDetail.customerName}</span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-1">Purchase Date</span>
                    <span className="font-extrabold text-slate-800 text-sm block">{new Date(warrantyDetail.purchaseDate).toLocaleDateString()}</span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-1">Expiry Date</span>
                    <span className="font-extrabold text-slate-800 text-sm block">{new Date(warrantyDetail.expiryDate).toLocaleDateString()} ({warrantyDetail.warrantyMonths}m)</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <ShieldAlert size={36} className="mx-auto text-amber-500 mb-2" />
                <p className="font-bold text-slate-700 m-0">No Warranty Record Found</p>
                <p className="text-xs text-slate-400 m-0 mt-1">Double check the IMEI or Invoice number typed above.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminWarranty;
