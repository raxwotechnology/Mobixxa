'use client';

import React, { useState } from 'react';
import { X, Smartphone, Phone, CreditCard, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { createReload } from '../../services/api';
import { toast } from 'react-toastify';

const ReloadModal = ({ isOpen, onClose, storeId, accountId }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    mobileNumber: '',
    operator: 'Dialog',
    amount: '',
    type: 'Prepaid',
    paymentMethod: 'Cash',
    notes: ''
  });

  const operators = [
    { name: 'Dialog', color: '#e11d48', logo: 'D' },
    { name: 'Mobitel', color: '#059669', logo: 'M' },
    { name: 'Hutch', color: '#f59e0b', logo: 'H' },
    { name: 'Airtel', color: '#ef4444', logo: 'A' },
    { name: 'SLT', color: '#0284c7', logo: 'S' },
    { name: 'Other', color: '#64748b', logo: 'O' }
  ];

  const types = ['Prepaid', 'Postpaid', 'Bill Payment'];
  const methods = ['Cash', 'Card', 'Bank Transfer'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.mobileNumber || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!accountId) {
      toast.error('Please select a target account in POS first');
      return;
    }

    try {
      setLoading(true);
      await createReload({
        ...formData,
        storeId,
        accountId
      });
      toast.success('Reload successful! ✅');
      setFormData({
        mobileNumber: '',
        operator: 'Dialog',
        amount: '',
        type: 'Prepaid',
        paymentMethod: 'Cash',
        notes: ''
      });
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process reload');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-2xl">
              <Smartphone size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Quick Reload</h2>
              <p className="text-white/80 text-sm">Mobile Top-up & Bill Payments</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Operator Selection */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {operators.map((op) => (
              <button
                key={op.name}
                type="button"
                onClick={() => setFormData({ ...formData, operator: op.name })}
                className={`flex flex-col items-center gap-1 p-2 rounded-2xl border-2 transition-all ${
                  formData.operator === op.name 
                    ? 'border-indigo-600 bg-indigo-50 shadow-sm' 
                    : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md"
                  style={{ backgroundColor: op.color }}
                >
                  {op.logo}
                </div>
                <span className="text-[10px] font-semibold text-slate-600">{op.name}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Mobile Number */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Mobile Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  required
                  placeholder="07x xxx xxxx"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  value={formData.mobileNumber}
                  onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                />
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Amount (Rs.)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rs.</span>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-bold text-indigo-600"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Type Selection */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Reload Type</label>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                {types.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: t })}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      formData.type === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Payment Method</label>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                {methods.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: m })}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      formData.paymentMethod === m ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Notes (Optional)</label>
            <textarea
              placeholder="Any additional details..."
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none h-20"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {!accountId && (
            <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-sm animate-pulse">
              <AlertCircle size={20} className="shrink-0" />
              <p className="font-semibold">Warning: No target account selected in POS. Please select an account to enable reloads.</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !accountId}
            className={`w-full py-4 rounded-2xl text-white font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all ${
              loading || !accountId
                ? 'bg-slate-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200'
            }`}
          >
            {loading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                <CheckCircle size={24} />
                Process Reload
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReloadModal;
