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
    <div className="min-h-[85vh] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <motion.span 
            className="inline-flex items-center gap-2 bg-brand-indigo/15 text-brand-indigo text-xs font-black px-4 py-2 rounded-full mb-4 uppercase tracking-wider border border-brand-indigo/25 shadow-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ShieldCheck size={14} /> Official Warranty Verification
          </motion.span>
          <motion.h1 
            className="text-3xl sm:text-5xl font-black tracking-tight mb-4 bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Check Device Warranty Status
          </motion.h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto font-medium">
            Enter your 15-digit IMEI number or Invoice / Serial ID printed on your purchase receipt to verify active warranty status.
          </p>
        </div>

        {/* Search Input Card */}
        <motion.div 
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl mb-8"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <form onSubmit={handleCheck} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Smartphone size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Enter 15-digit IMEI or Invoice No (e.g., 358923110293845)"
                value={imei}
                onChange={(e) => setImei(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl py-4 pl-12 pr-4 text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-indigo focus:ring-4 focus:ring-brand-indigo/20 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-fuchsia text-white font-black px-8 py-4 rounded-2xl transition-all hover:opacity-95 active:scale-95 disabled:opacity-50 shadow-lg shadow-brand-indigo/30 flex items-center justify-center gap-2 whitespace-nowrap text-sm cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <Search size={18} />
                  <span>Verify Warranty</span>
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Result Display */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {result.found ? (
              <div className={`border rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl ${
                result.isExpired
                  ? 'bg-rose-950/20 border-rose-800/40'
                  : 'bg-emerald-950/20 border-emerald-800/40'
              }`}>
                {/* Badge Banner */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-6 mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      result.isExpired ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {result.isExpired ? <ShieldAlert size={28} /> : <ShieldCheck size={28} />}
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-white m-0">
                        {result.isExpired ? 'Warranty Expired' : 'Active Warranty Covered'}
                      </h2>
                      <p className="text-xs text-slate-400 m-0 mt-0.5 font-medium">
                        {result.isExpired ? 'Coverage period has ended' : `${result.daysRemaining} days remaining`}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full border ${
                    result.isExpired
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {result.isExpired ? 'EXPIRED' : 'ACTIVE'}
                  </span>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
                  <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl">
                    <p className="text-slate-500 uppercase tracking-wider font-bold mb-1 flex items-center gap-1.5">
                      <Smartphone size={14} className="text-brand-indigo" /> Product Name
                    </p>
                    <p className="text-sm font-black text-white m-0">{result.productName}</p>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl">
                    <p className="text-slate-500 uppercase tracking-wider font-bold mb-1 flex items-center gap-1.5">
                      <FileText size={14} className="text-brand-violet" /> Invoice / Serial No
                    </p>
                    <p className="text-sm font-black text-white m-0">{result.invoiceNumber}</p>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl">
                    <p className="text-slate-500 uppercase tracking-wider font-bold mb-1 flex items-center gap-1.5">
                      <Calendar size={14} className="text-brand-cyan" /> Purchase Date
                    </p>
                    <p className="text-sm font-black text-white m-0">
                      {new Date(result.purchaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl">
                    <p className="text-slate-500 uppercase tracking-wider font-bold mb-1 flex items-center gap-1.5">
                      <Clock size={14} className="text-emerald-400" /> Warranty Expiry
                    </p>
                    <p className="text-sm font-black text-white m-0">
                      {new Date(result.expiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} ({result.warrantyMonths} Months)
                    </p>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl">
                    <p className="text-slate-500 uppercase tracking-wider font-bold mb-1 flex items-center gap-1.5">
                      <Store size={14} className="text-amber-400" /> Issued Store
                    </p>
                    <p className="text-sm font-black text-white m-0">{result.storeName}</p>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl">
                    <p className="text-slate-500 uppercase tracking-wider font-bold mb-1 flex items-center gap-1.5">
                      <Phone size={14} className="text-rose-400" /> Store Hotline
                    </p>
                    <p className="text-sm font-black text-white m-0">{result.storePhone}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 text-center text-slate-400">
                <ShieldAlert size={40} className="mx-auto text-amber-500 mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">No Warranty Record Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
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
