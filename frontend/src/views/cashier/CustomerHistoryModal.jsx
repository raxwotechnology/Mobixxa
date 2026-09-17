'use client';

import React, { useState, useEffect } from 'react';
import { X, History, ShoppingBag, Clock, Calendar, ExternalLink, Loader2 } from 'lucide-react';
import { getCustomerHistory } from '../../services/api';
import InvoiceModal from './InvoiceModal';

const CustomerHistoryModal = ({ isOpen, onClose, phone }) => {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);

  useEffect(() => {
    if (isOpen && phone) {
      fetchHistory();
    }
  }, [isOpen, phone]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      // Clean phone: remove spaces, dashes, parentheses and the '+' prefix for the URL param
      const cleanPhone = phone.replace(/[\s\-()+]/g, '');
      const { data } = await getCustomerHistory(cleanPhone);
      setHistory(data);
    } catch (err) {
      console.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-end bg-black/40 backdrop-blur-[2px] transition-opacity">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl">
              <History size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Customer History</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase">{phone}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="animate-spin" size={32} />
              <p className="text-sm font-medium">Fetching history...</p>
            </div>
          ) : !history || (!history.orders.length && !history.hpAgreements.length) ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 text-center">
              <ShoppingBag size={48} className="opacity-20" />
              <p className="text-sm">No purchase history found for this customer.</p>
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase">Orders</p>
                  <p className="text-xl font-bold text-indigo-700">{history.orders.length}</p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                  <p className="text-[10px] font-bold text-emerald-400 uppercase">Spent</p>
                  <p className="text-lg font-bold text-emerald-700">
                    Rs.{history.orders.reduce((s, o) => s + o.totalAmount, 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Purchase List */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ShoppingBag size={14} /> Recent Purchases
                </h4>
                <div className="space-y-3">
                  {history.orders.map((order) => (
                    <div key={order._id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-slate-400">#{order.invoiceNumber || order._id.slice(-6).toUpperCase()}</span>
                        <span className="text-xs font-bold text-indigo-600">Rs. {order.totalAmount.toLocaleString()}</span>
                      </div>
                      <div className="space-y-0.5 mb-1">
                        {order.items.map((item, idx) => (
                          <p key={idx} className="text-xs font-semibold text-slate-700 flex justify-between gap-2">
                            <span className="line-clamp-1">{item.name} <span className="text-slate-400 font-medium">x{item.quantity}</span></span>
                            <span className="text-slate-500 font-medium whitespace-nowrap">Rs. {item.price.toLocaleString()}</span>
                          </p>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold uppercase ${
                            order.paymentStatus === 'Paid' || order.paymentStatus === 'completed' ? 'text-emerald-600' : 'text-amber-600'
                          }`}>
                            {order.paymentStatus}
                          </span>
                          <button
                            onClick={() => setViewingOrder(order)}
                            className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800"
                          >
                            View Invoice <ExternalLink size={10} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* HP List */}
              {history.hpAgreements.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Clock size={14} /> Installment Plans
                  </h4>
                  <div className="space-y-3">
                    {history.hpAgreements.map((hp) => (
                      <div key={hp._id} className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-bold text-amber-600">HP AGREEMENT</span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            hp.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-200 text-amber-800'
                          }`}>
                            {hp.status}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-slate-500 font-medium">Balance:</span>
                          <span className="font-bold text-slate-800">Rs. {hp.balanceAmount.toLocaleString()}</span>
                        </div>
                        <div className="w-full h-1 bg-white rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-500" 
                            style={{ width: `${(hp.totalPaid/hp.netTotal)*100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 text-center">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-700 transition-all"
          >
            Close History
          </button>
        </div>
      </div>

      <InvoiceModal
        isOpen={!!viewingOrder}
        order={viewingOrder}
        onClose={() => setViewingOrder(null)}
      />
    </div>
  );
};

export default CustomerHistoryModal;
