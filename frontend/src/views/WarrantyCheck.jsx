'use client';

import { useState } from 'react';
import { Search, ShieldCheck, ShieldAlert, Calendar, CheckCircle2, Clock, Smartphone, Store, Phone, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { checkWarrantyByImei } from '../services/api';
import { toast } from 'react-toastify';

const WarrantyCheck = () => {
  const [imei, setImei] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!imei.trim()) {
      toast.error('Please enter an IMEI or Serial number');
      return;
    }
    setLoading(true);
    try {
      const { data } = await checkWarrantyByImei(imei.trim());
      setResult(data);
      if (!data.found) {
        toast.info('No warranty record found for this number.');
      } else {
        toast.success('Warranty status retrieved successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to check warranty');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ds-page py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 ds-badge-blue text-xs font-semibold px-3 py-1 rounded-full mb-3">
            <ShieldCheck size={14} /> Official Warranty Verification
          </span>
          <h1 className="ds-page-title text-2xl sm:text-3xl text-center">Check Device Warranty Status</h1>
          <p className="ds-page-subtitle text-center max-w-lg mx-auto mt-2">
            Enter your 15-digit IMEI number or Invoice / Serial ID printed on your purchase receipt to verify active warranty status.
          </p>
        </div>

        {/* Search Input Card */}
        <motion.div 
          className="ds-card mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <form onSubmit={handleCheck} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Smartphone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Enter 15-digit IMEI or Invoice No"
                value={imei}
                onChange={(e) => setImei(e.target.value)}
                className="ds-input pl-10 text-sm font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="ds-btn ds-btn-primary justify-center text-sm py-3 px-6 whitespace-nowrap cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <Search size={16} />
                  <span>Verify Warranty</span>
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Result Display */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {result.found ? (
              <div className={`ds-card ${result.isExpired ? 'border-rose-200 bg-rose-50/20' : 'border-emerald-200 bg-emerald-50/20'}`}>
                {/* Badge Banner */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      result.isExpired ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    }`}>
                      {result.isExpired ? <ShieldAlert size={22} /> : <ShieldCheck size={22} />}
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-slate-900 m-0">
                        {result.isExpired ? 'Warranty Expired' : 'Active Warranty Covered'}
                      </h2>
                      <p className="text-xs text-slate-500 m-0 mt-0.5 font-medium">
                        {result.isExpired ? 'Coverage period has ended' : `${result.daysRemaining} days remaining`}
                      </p>
                    </div>
                  </div>
                  <span className={result.isExpired ? 'ds-badge-red text-xs' : 'ds-badge-green text-xs'}>
                    {result.isExpired ? 'EXPIRED' : 'ACTIVE'}
                  </span>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="bg-white border border-slate-200/80 p-3.5 rounded-xl">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                      <Smartphone size={13} className="text-blue-600" /> Product Name
                    </p>
                    <p className="text-sm font-semibold text-slate-800 m-0">{result.productName}</p>
                  </div>

                  <div className="bg-white border border-slate-200/80 p-3.5 rounded-xl">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                      <FileText size={13} className="text-indigo-600" /> Invoice / Serial No
                    </p>
                    <p className="text-sm font-semibold text-slate-800 font-mono m-0">{result.invoiceNumber}</p>
                  </div>

                  <div className="bg-white border border-slate-200/80 p-3.5 rounded-xl">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                      <Calendar size={13} className="text-cyan-600" /> Purchase Date
                    </p>
                    <p className="text-sm font-semibold text-slate-800 m-0">
                      {new Date(result.purchaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>

                  <div className="bg-white border border-slate-200/80 p-3.5 rounded-xl">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                      <Clock size={13} className="text-emerald-600" /> Warranty Expiry
                    </p>
                    <p className="text-sm font-semibold text-slate-800 m-0">
                      {new Date(result.expiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} ({result.warrantyMonths} Months)
                    </p>
                  </div>

                  <div className="bg-white border border-slate-200/80 p-3.5 rounded-xl">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                      <Store size={13} className="text-amber-600" /> Issued Store
                    </p>
                    <p className="text-sm font-semibold text-slate-800 m-0">{result.storeName}</p>
                  </div>

                  <div className="bg-white border border-slate-200/80 p-3.5 rounded-xl">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                      <Phone size={13} className="text-rose-600" /> Store Hotline
                    </p>
                    <p className="text-sm font-semibold text-slate-800 m-0">{result.storePhone}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="ds-card p-8 text-center text-slate-500">
                <ShieldAlert size={36} className="mx-auto text-amber-500 mb-2" />
                <h3 className="text-base font-semibold text-slate-900 mb-1">No Warranty Record Found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto m-0">
                  Please verify that you typed the exact 15-digit IMEI or Invoice number printed on your receipt.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default WarrantyCheck;
