'use client';

import React, { useState, useEffect } from 'react';
import { X, Smartphone, Phone, CreditCard, CheckCircle, AlertCircle, Loader2, Plus, Calendar, Layers, RefreshCw, Calculator, DollarSign } from 'lucide-react';
import { createReload, getReloadStocks, addReloadStock, closeReloadStock } from '../../services/api';
import { toast } from 'react-toastify';

const ReloadModal = ({ isOpen, onClose, storeId, accountId }) => {
  const [modalTab, setModalTab] = useState('quick'); // 'quick' | 'stock'
  const [loading, setLoading] = useState(false);

  // Quick reload form
  const [formData, setFormData] = useState({
    mobileNumber: '',
    customerName: '',
    operator: 'Dialog',
    amount: '',
    type: 'Prepaid',
    paymentMethod: 'Cash',
    notes: ''
  });

  // Daily Stock tracker state
  const [stockDate, setStockDate] = useState(new Date().toISOString().split('T')[0]);
  const [stocks, setStocks] = useState([]);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isCloseStockOpen, setIsCloseStockOpen] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState(null);
  const [closingInput, setClosingInput] = useState(0);

  const [addStockForm, setAddStockForm] = useState({
    operator: 'Dialog',
    cardValue: 100, // 1 for total currency value, or 50, 100, 500 for card denomination
    openingStock: 0,
    addedStock: 0,
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
  const methods = ['Cash', 'Card', 'Bank Transfer', 'Credit'];

  const fetchStocks = async () => {
    try {
      setLoadingStocks(true);
      const params = {
        date: stockDate,
        ...(storeId ? { storeId } : {})
      };
      const { data } = await getReloadStocks(params);
      setStocks(data || []);
    } catch {
      // ignore
    } finally {
      setLoadingStocks(false);
    }
  };

  useEffect(() => {
    if (isOpen && modalTab === 'stock') {
      fetchStocks();
    }
  }, [isOpen, modalTab, stockDate, storeId]);

  const handleSubmitQuick = async (e) => {
    e.preventDefault();
    if (!formData.mobileNumber || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.paymentMethod !== 'Credit' && !accountId) {
      // If no target account is selected in POS, proceed with default
    }

    try {
      setLoading(true);
      await createReload({
        ...formData,
        storeId,
        accountId: formData.paymentMethod === 'Credit' ? null : accountId
      });
      toast.success(formData.paymentMethod === 'Credit' ? 'Credit Reload recorded successfully! 🏷️✅' : 'Reload successful! ✅');
      setFormData({
        mobileNumber: '',
        customerName: '',
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

  const handleSaveStock = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await addReloadStock({
        ...addStockForm,
        date: stockDate,
        storeId
      });
      toast.success('In-hand stock updated successfully! ✅');
      setIsAddStockOpen(false);
      setAddStockForm({ operator: 'Dialog', cardValue: 100, openingStock: 0, addedStock: 0, notes: '' });
      fetchStocks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save stock');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseStock = async (e) => {
    e.preventDefault();
    if (!selectedStockItem) return;
    try {
      setLoading(true);
      await closeReloadStock({
        stockId: selectedStockItem._id,
        closingStock: Number(closingInput)
      });
      toast.success('Evening in-hand count updated & Sell-Out calculated! 🌙✅');
      setIsCloseStockOpen(false);
      setSelectedStockItem(null);
      fetchStocks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update evening balance');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const totalSellOutRevenue = stocks.reduce((sum, s) => sum + (s.sellOutValue || 0), 0);

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="relative p-5 bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-600 text-white shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex items-center justify-between pr-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 rounded-2xl">
                <Smartphone size={28} />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-wide">Reload & Card Management</h2>
                <p className="text-white/80 text-xs">Top-ups & In-Hand Daily Sell-out Tracker</p>
              </div>
            </div>
            {/* Tabs */}
            <div className="flex bg-black/20 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setModalTab('quick')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${modalTab === 'quick' ? 'bg-white text-indigo-700 shadow-sm' : 'text-white/80 hover:text-white'}`}
              >
                ⚡ Quick Top-up
              </button>
              <button
                type="button"
                onClick={() => setModalTab('stock')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${modalTab === 'stock' ? 'bg-white text-indigo-700 shadow-sm' : 'text-white/80 hover:text-white'}`}
              >
                📊 In-Hand Stock Tracker
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {modalTab === 'quick' ? (
            <form onSubmit={handleSubmitQuick} className="space-y-5">
              {/* Operator Selection */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
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
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-base shadow-md"
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
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Mobile Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      required
                      placeholder="07x xxx xxxx"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                      value={formData.mobileNumber}
                      onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                    />
                  </div>
                </div>

                {/* Amount */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Amount (Rs.)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">Rs.</span>
                    <input
                      type="number"
                      required
                      placeholder="0.00"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-600"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Type Selection */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Reload Type</label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    {types.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: t })}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                          formData.type === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Payment Method</label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    {methods.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setFormData({ ...formData, paymentMethod: m })}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                          formData.paymentMethod === m ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Credit Customer Details when Credit is selected */}
              {formData.paymentMethod === 'Credit' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                    <span>🏷️ Credit Reload (Pay Later)</span>
                  </div>
                  <p className="text-[11px] text-amber-700 leading-tight">
                    This reload will be tracked under customer debt. No physical cash will be added to the drawer.
                  </p>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Customer Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Kamal Perera / Shop neighbor"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Notes (Optional)</label>
                <textarea
                  placeholder="Any transaction notes..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-16"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-white font-bold text-base shadow-md bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center gap-2 transition-all"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                Process Instant Reload
              </button>
            </form>
          ) : (
            /* ──────── In-Hand Stock & Daily Sell-Out Tracker Tab ──────── */
            <div className="space-y-5">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-indigo-600" />
                  <span className="text-xs font-bold text-slate-700">Date:</span>
                  <input
                    type="date"
                    value={stockDate}
                    onChange={(e) => setStockDate(e.target.value)}
                    className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg font-bold outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAddStockOpen(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm"
                  >
                    <Plus size={14} /> Add In-Hand Stock
                  </button>
                  <button
                    onClick={fetchStocks}
                    className="p-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700"
                    title="Refresh"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>

              {/* Total Summary Banner */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 rounded-2xl shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs text-white/80 font-semibold uppercase">Daily Sold-Out Revenue</div>
                  <div className="text-2xl font-black">Rs. {totalSellOutRevenue.toLocaleString()}</div>
                </div>
                <div className="text-right text-xs text-white/90">
                  Formula: <span className="font-bold">(Opening + Added) - Closing Remaining</span>
                </div>
              </div>

              {/* Stocks Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase font-black tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3">Operator / Item</th>
                      <th className="p-3 text-center">Opening</th>
                      <th className="p-3 text-center">Added</th>
                      <th className="p-3 text-center">Total In-Hand</th>
                      <th className="p-3 text-center">Evening In-Hand</th>
                      <th className="p-3 text-center font-bold text-emerald-700">Sold Out</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loadingStocks ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400">Loading stock records...</td>
                      </tr>
                    ) : stocks.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400">
                          No reload card stock records found for this date. Click <strong>"Add In-Hand Stock"</strong> to record today's opening/added cards.
                        </td>
                      </tr>
                    ) : (
                      stocks.map((item) => {
                        const cardLabel = item.cardValue === 1 ? 'E-Reload Balance' : `Rs. ${item.cardValue} Cards`;
                        return (
                          <tr key={item._id} className="hover:bg-slate-50 font-medium">
                            <td className="p-3">
                              <div className="font-bold text-slate-900">{item.operator}</div>
                              <div className="text-[11px] text-slate-500">{cardLabel}</div>
                            </td>
                            <td className="p-3 text-center font-mono">{item.openingStock}</td>
                            <td className="p-3 text-center font-mono text-emerald-600 font-bold">+{item.addedStock}</td>
                            <td className="p-3 text-center font-mono font-black text-indigo-700 bg-indigo-50/50">{item.totalStock}</td>
                            <td className="p-3 text-center font-mono">
                              {item.closingStock !== undefined && item.closingStock !== null ? (
                                <span className="font-bold text-slate-800">{item.closingStock}</span>
                              ) : (
                                <span className="text-amber-600 italic text-[11px]">Pending EOD</span>
                              )}
                            </td>
                            <td className="p-3 text-center font-mono font-black text-emerald-600 text-sm">
                              {item.sellOutQty || 0}
                              <div className="text-[10px] text-emerald-700 font-normal">Rs. {(item.sellOutValue || 0).toLocaleString()}</div>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => {
                                  setSelectedStockItem(item);
                                  setClosingInput(item.closingStock || 0);
                                  setIsCloseStockOpen(true);
                                }}
                                className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold border border-indigo-200"
                              >
                                Count Evening
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Add Stock Modal */}
        {isAddStockOpen && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-base text-slate-900">Add / Register In-Hand Stock</h3>
                <button onClick={() => setIsAddStockOpen(false)}><X size={18} /></button>
              </div>
              <form onSubmit={handleSaveStock} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Operator</label>
                  <select
                    className="w-full p-2 border rounded-xl text-xs font-bold"
                    value={addStockForm.operator}
                    onChange={(e) => setAddStockForm({ ...addStockForm, operator: e.target.value })}
                  >
                    {operators.map(o => <option key={o.name} value={o.name}>{o.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Card Value / Denomination (Rs.)</label>
                  <select
                    className="w-full p-2 border rounded-xl text-xs font-bold"
                    value={addStockForm.cardValue}
                    onChange={(e) => setAddStockForm({ ...addStockForm, cardValue: Number(e.target.value) })}
                  >
                    <option value={100}>Rs. 100 Scratch Cards</option>
                    <option value={50}>Rs. 50 Scratch Cards</option>
                    <option value={200}>Rs. 200 Scratch Cards</option>
                    <option value={500}>Rs. 500 Scratch Cards</option>
                    <option value={1000}>Rs. 1,000 Scratch Cards</option>
                    <option value={1}>E-Reload Balance (LKR)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Opening Stock</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded-xl text-xs font-bold"
                      value={addStockForm.openingStock}
                      onChange={(e) => setAddStockForm({ ...addStockForm, openingStock: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Added Today</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded-xl text-xs font-bold"
                      value={addStockForm.addedStock}
                      onChange={(e) => setAddStockForm({ ...addStockForm, addedStock: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-md hover:bg-emerald-700"
                >
                  Save Stock Entry
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Evening Close Modal */}
        {isCloseStockOpen && selectedStockItem && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-base text-slate-900">
                  🌙 Count Evening Balance ({selectedStockItem.operator})
                </h3>
                <button onClick={() => setIsCloseStockOpen(false)}><X size={18} /></button>
              </div>
              <form onSubmit={handleCloseStock} className="space-y-4">
                <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1 text-slate-600">
                  <div>Opening Stock: <strong>{selectedStockItem.openingStock}</strong></div>
                  <div>Added Stock: <strong>+{selectedStockItem.addedStock}</strong></div>
                  <div>Total In-Hand: <strong className="text-indigo-600">{selectedStockItem.totalStock}</strong></div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Enter Evening Remaining In-Hand Cards / Balance:</label>
                  <input
                    type="number"
                    required
                    className="w-full p-3 border-2 border-indigo-500 rounded-xl text-base font-black text-indigo-700 outline-none"
                    value={closingInput}
                    onChange={(e) => setClosingInput(e.target.value)}
                  />
                </div>
                <div className="bg-emerald-50 p-3 rounded-xl text-xs text-emerald-800 font-semibold">
                  Estimated Sold Out: <strong>{Math.max(0, (selectedStockItem.totalStock || 0) - Number(closingInput))} cards</strong>
                  {' '}(Rs. {(Math.max(0, (selectedStockItem.totalStock || 0) - Number(closingInput)) * (selectedStockItem.cardValue || 1)).toLocaleString()})
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow-md hover:bg-indigo-700"
                >
                  Save & Calculate Daily Sell-Out
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ReloadModal;
