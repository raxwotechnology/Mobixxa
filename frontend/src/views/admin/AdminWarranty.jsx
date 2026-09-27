'use client';

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
      <div className="ds-page">
        {/* Header Title Banner */}
        <div className="ds-page-header">
          <div className="ds-page-header-left">
            <div className="ds-page-header-icon">
              <ShieldCheck size={20} strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="ds-page-title">Warranty Management</h1>
              <p className="ds-page-subtitle">Search, verify, and monitor device warranty validity across all sales and stores.</p>
            </div>
          </div>
        </div>

        {/* Quick Search Bar */}
        <div className="ds-card">
          <div className="ds-filter-bar p-4">
            <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3 w-full">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Scan or type IMEI / Serial Number / Invoice No..."
                  value={searchImei}
                  onChange={(e) => setSearchImei(e.target.value)}
                  className="ds-search pl-11 w-full"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="ds-btn ds-btn-primary"
              >
                {loading ? 'Searching...' : 'Lookup IMEI'}
              </button>
            </form>
          </div>
        </div>

        {/* Detailed Result View */}
        {warrantyDetail && (
          <div className="ds-card mt-6">
            <div className="ds-card-body">
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
                        <h3 className="text-base font-bold text-slate-800 m-0">
                          {warrantyDetail.isExpired ? 'Warranty Expired' : 'Active Warranty'}
                        </h3>
                        <p className="text-xs text-slate-500 m-0">{warrantyDetail.daysRemaining} days remaining</p>
                      </div>
                    </div>
                    <span className={`ds-badge ${
                      warrantyDetail.isExpired ? 'ds-badge-red' : 'ds-badge-green'
                    }`}>
                      {warrantyDetail.isExpired ? 'EXPIRED' : 'ACTIVE COVERAGE'}
                    </span>
                  </div>

                  <div className="ds-table-wrap">
                    <table className="ds-table w-full">
                      <tbody>
                        <tr>
                          <td className="text-slate-500 font-bold w-1/3">Product</td>
                          <td className="font-bold text-slate-900">{warrantyDetail.productName}</td>
                        </tr>
                        <tr>
                          <td className="text-slate-500 font-bold">IMEI / Serial</td>
                          <td className="font-bold text-brand-indigo">{warrantyDetail.imei}</td>
                        </tr>
                        <tr>
                          <td className="text-slate-500 font-bold">Invoice No</td>
                          <td className="font-bold text-slate-900">{warrantyDetail.invoiceNumber}</td>
                        </tr>
                        <tr>
                          <td className="text-slate-500 font-bold">Customer</td>
                          <td className="font-bold text-slate-900">{warrantyDetail.customerName}</td>
                        </tr>
                        <tr>
                          <td className="text-slate-500 font-bold">Purchase Date</td>
                          <td className="font-bold text-slate-900">{new Date(warrantyDetail.purchaseDate).toLocaleDateString()}</td>
                        </tr>
                        <tr>
                          <td className="text-slate-500 font-bold">Expiry Date</td>
                          <td className="font-bold text-slate-900">{new Date(warrantyDetail.expiryDate).toLocaleDateString()} ({warrantyDetail.warrantyMonths}m)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="ds-empty">
                  <ShieldAlert size={36} className="mx-auto text-amber-500 mb-2" />
                  <p className="font-bold text-slate-700 m-0">No Warranty Record Found</p>
                  <p className="text-xs text-slate-400 m-0 mt-1">Double check the IMEI or Invoice number typed above.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminWarranty;
