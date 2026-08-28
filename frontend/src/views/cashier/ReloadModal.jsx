'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Smartphone, 
  Phone, 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Plus, 
  Calendar, 
  Layers, 
  RefreshCw, 
  Calculator, 
  DollarSign, 
  Printer, 
  Save, 
  TrendingUp, 
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';
import { createReload, getReloads, getReloadStocks, saveReloadDailySheet } from '../../services/api';
import { toast } from 'react-toastify';

const DEFAULT_RELOAD_ITEMS = [
  { operator: 'Dialog', cardValue: 1, label: 'Dialog E-Reload Float', color: '#e11d48', tag: 'E-Reload' },
  { operator: 'Mobitel', cardValue: 1, label: 'Mobitel E-Reload Float', color: '#059669', tag: 'E-Reload' },
  { operator: 'Airtel', cardValue: 1, label: 'Airtel E-Reload Float', color: '#ef4444', tag: 'E-Reload' },
  { operator: 'Hutch', cardValue: 1, label: 'Hutch E-Reload Float', color: '#f59e0b', tag: 'E-Reload' },
  { operator: 'EzCash', cardValue: 1, label: 'EzCash Float / Wallet', color: '#0284c7', tag: 'Wallet' },
  { operator: 'mCash', cardValue: 1, label: 'mCash Float / Wallet', color: '#8b5cf6', tag: 'Wallet' },
  { operator: 'Dialog', cardValue: 100, label: 'Dialog Rs. 100 Scratch Cards', color: '#e11d48', tag: 'Cards' },
  { operator: 'Mobitel', cardValue: 100, label: 'Mobitel Rs. 100 Scratch Cards', color: '#059669', tag: 'Cards' },
  { operator: 'Airtel', cardValue: 100, label: 'Airtel Rs. 100 Scratch Cards', color: '#ef4444', tag: 'Cards' },
  { operator: 'Hutch', cardValue: 100, label: 'Hutch Rs. 100 Scratch Cards', color: '#f59e0b', tag: 'Cards' },
  { operator: 'Other', cardValue: 50, label: 'Rs. 50 Cards (Mixed)', color: '#64748b', tag: 'Cards' },
  { operator: 'Other', cardValue: 500, label: 'Rs. 500 Cards (Mixed)', color: '#64748b', tag: 'Cards' },
];

const ReloadModal = ({ isOpen, onClose, storeId, accountId, onSyncSuccess }) => {
  const [modalTab, setModalTab] = useState('sheet'); // 'sheet' | 'credit'
  const [stockDate, setStockDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [savingSheet, setSavingSheet] = useState(false);
  const [sheetRows, setSheetRows] = useState([]);

  // Credit Reload State & List
  const [creditReloads, setCreditReloads] = useState([]);
  const [loadingCredits, setLoadingCredits] = useState(false);
  const [creditFormData, setCreditFormData] = useState({
    mobileNumber: '',
    customerName: '',
    operator: 'Dialog',
    amount: '',
    notes: ''
  });
  const [submittingCredit, setSubmittingCredit] = useState(false);

  // Load existing stock data and initialize rows
  const loadSheetData = async () => {
    try {
      setLoading(true);
      const params = {
        date: stockDate,
        ...(storeId ? { storeId } : {})
      };
      const { data } = await getReloadStocks(params);
      const serverStocks = Array.isArray(data) ? data : [];

      // Merge server data with default items
      const merged = DEFAULT_RELOAD_ITEMS.map((template) => {
        const found = serverStocks.find(
          (s) => s.operator === template.operator && Number(s.cardValue || 1) === template.cardValue
        );

        if (found) {
          return {
            _id: found._id,
            operator: found.operator,
            cardValue: Number(found.cardValue || 1),
            label: template.label,
            color: template.color,
            tag: template.tag,
            openingStock: found.openingStock || 0,
            addedStock: found.addedStock || 0,
            closingStock: found.closingStock !== undefined && found.closingStock !== null ? found.closingStock : (found.openingStock + (found.addedStock || 0)),
            notes: found.notes || ''
          };
        }

        return {
          operator: template.operator,
          cardValue: template.cardValue,
          label: template.label,
          color: template.color,
          tag: template.tag,
          openingStock: 0,
          addedStock: 0,
          closingStock: 0,
          notes: ''
        };
      });

      // Also append any custom operators from server that aren't in template
      serverStocks.forEach((s) => {
        const alreadyIn = merged.some(
          (m) => m.operator === s.operator && Number(m.cardValue || 1) === Number(s.cardValue || 1)
        );
        if (!alreadyIn) {
          merged.push({
            _id: s._id,
            operator: s.operator,
            cardValue: Number(s.cardValue || 1),
            label: `${s.operator} (${s.cardValue === 1 ? 'E-Reload' : `Rs. ${s.cardValue} Cards`})`,
            color: '#64748b',
            tag: s.cardValue === 1 ? 'E-Reload' : 'Cards',
            openingStock: s.openingStock || 0,
            addedStock: s.addedStock || 0,
            closingStock: s.closingStock !== undefined ? s.closingStock : (s.openingStock + (s.addedStock || 0)),
            notes: s.notes || ''
          });
        }
      });

      setSheetRows(merged);
    } catch (err) {
      console.error('Failed to fetch reload sheet data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Credit Reloads for selected date & store
  const fetchCreditReloads = async () => {
    try {
      setLoadingCredits(true);
      const params = {
        date: stockDate,
        isCredit: true,
        ...(storeId ? { storeId } : {})
      };
      const { data } = await getReloads(params);
      setCreditReloads(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch credit reload records:', err);
    } finally {
      setLoadingCredits(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSheetData();
      fetchCreditReloads();
    }
  }, [isOpen, stockDate, storeId]);

  // Handle cell changes in table
  const handleCellChange = (index, field, value) => {
    const updated = [...sheetRows];
    updated[index] = {
      ...updated[index],
      [field]: field === 'notes' ? value : Math.max(0, Number(value) || 0)
    };
    setSheetRows(updated);
  };

  // Calculations
  const calculatedTotals = useMemo(() => {
    let totalOpeningVal = 0;
    let totalAddedVal = 0;
    let totalAvailableVal = 0;
    let totalEveningInHandVal = 0;
    let totalSellOutVal = 0;

    const rowsWithCalc = sheetRows.map((r) => {
      const open = Number(r.openingStock || 0);
      const added = Number(r.addedStock || 0);
      const total = open + added;
      const closing = r.closingStock !== undefined && r.closingStock !== null && r.closingStock !== ''
        ? Number(r.closingStock)
        : total;
      const soldQty = Math.max(0, total - closing);
      const soldVal = soldQty * (r.cardValue || 1);

      totalOpeningVal += open * (r.cardValue || 1);
      totalAddedVal += added * (r.cardValue || 1);
      totalAvailableVal += total * (r.cardValue || 1);
      totalEveningInHandVal += closing * (r.cardValue || 1);
      totalSellOutVal += soldVal;

      return {
        ...r,
        totalStock: total,
        sellOutAmount: soldQty,
        sellOutValue: soldVal
      };
    });

    const estimatedMargin = totalSellOutVal * 0.04; // 4% typical discount margin

    return {
      rows: rowsWithCalc,
      totalOpeningVal,
      totalAddedVal,
      totalAvailableVal,
      totalEveningInHandVal,
      totalSellOutVal,
      estimatedMargin
    };
  }, [sheetRows]);

  const totalCreditAmount = useMemo(() => {
    return creditReloads.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  }, [creditReloads]);

  // Save the entire Daily Sheet
  const handleSaveDailySheet = async () => {
    try {
      setSavingSheet(true);
      const payload = {
        storeId,
        date: stockDate,
        items: sheetRows.map((r) => ({
          operator: r.operator || r.label || 'Other',
          cardValue: Number(r.cardValue) || 1,
          openingStock: Math.max(0, Number(r.openingStock) || 0),
          addedStock: Math.max(0, Number(r.addedStock) || 0),
          closingStock: Math.max(0, Number(r.closingStock !== undefined && r.closingStock !== null && r.closingStock !== '' ? r.closingStock : (Number(r.openingStock || 0) + Number(r.addedStock || 0))) || 0),
          notes: r.notes || ''
        }))
      };

      const res = await saveReloadDailySheet(payload);
      toast.success(res.data?.message || 'Daily Reload Sheet saved & synced successfully! 📊✅');
      await Promise.all([loadSheetData(), fetchCreditReloads()]);
      if (onSyncSuccess) onSyncSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save daily reload sheet');
    } finally {
      setSavingSheet(false);
    }
  };

  // Thermal Receipt Printing for Daily Summary Slip
  const handlePrintDailySlip = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup blocked! Please allow popups to print summary.');
      return;
    }

    const rows = calculatedTotals.rows;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Daily Reload Summary - ${stockDate}</title>
          <style>
            body { font-family: 'Courier New', monospace; width: 80mm; margin: 0 auto; padding: 8px; color: #000; }
            .text-center { text-align: center; }
            .text-left { text-align: left; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            .header { border-bottom: 1.5px dashed #000; padding-bottom: 6px; margin-bottom: 8px; }
            .title { font-size: 15px; font-weight: bold; }
            .subtitle { font-size: 11px; }
            .table { width: 100%; border-collapse: collapse; font-size: 10px; margin: 6px 0; }
            .table th { border-bottom: 1px solid #000; padding: 3px 0; text-align: left; }
            .table td { padding: 3px 0; }
            .divider { border-top: 1px dashed #000; margin: 6px 0; }
            .total-box { border: 1.5px solid #000; padding: 6px; margin: 8px 0; text-align: center; border-radius: 4px; }
            .footer { font-size: 9px; text-align: center; margin-top: 10px; border-top: 1px dashed #000; padding-top: 4px; }
          </style>
        </head>
        <body>
          <div class="header text-center">
            <div class="title">DAILY RELOAD SELL-OUT SLIP</div>
            <div class="subtitle">Date: ${stockDate}</div>
            <div class="subtitle">Generated: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Operator</th>
                <th class="text-center">Avail</th>
                <th class="text-center">Close</th>
                <th class="text-right">Sold (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(r => `
                <tr>
                  <td>${r.operator} ${r.cardValue > 1 ? `(${r.cardValue})` : ''}</td>
                  <td class="text-center">${r.totalStock}</td>
                  <td class="text-center">${r.closingStock}</td>
                  <td class="text-right bold">${Number(r.sellOutValue || 0).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="divider"></div>

          <div class="total-box">
            <div style="font-size: 10px; font-weight: bold;">TOTAL RELOAD SOLD TODAY</div>
            <div style="font-size: 18px; font-weight: bold; margin: 3px 0;">Rs. ${Number(calculatedTotals.totalSellOutVal).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</div>
            <div style="font-size: 9px;">Est. Commission (4%): Rs. ${Number(calculatedTotals.estimatedMargin).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</div>
          </div>

          <div class="footer">
            <p style="margin: 0;">SR Mobile POS — In-Hand Reload Bookkeeping</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Submit Credit Reload Form
  const handleSubmitCreditReload = async (e) => {
    e.preventDefault();
    if (!creditFormData.mobileNumber || !creditFormData.amount) {
      toast.error('Please enter mobile number and amount');
      return;
    }

    try {
      setSubmittingCredit(true);
      await createReload({
        mobileNumber: creditFormData.mobileNumber.trim(),
        customerName: creditFormData.customerName?.trim() || undefined,
        operator: creditFormData.operator,
        amount: Number(creditFormData.amount),
        notes: creditFormData.notes?.trim() || '',
        storeId,
        date: stockDate,
        paymentMethod: 'Credit',
        type: 'Prepaid',
        isCredit: true,
        status: 'Pending',
        accountId: null
      });
      toast.success('Credit reload logged successfully! 🏷️✅');
      setCreditFormData({
        mobileNumber: '',
        customerName: '',
        operator: 'Dialog',
        amount: '',
        notes: ''
      });
      await Promise.all([loadSheetData(), fetchCreditReloads()]);
      if (onSyncSuccess) onSyncSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record credit reload');
    } finally {
      setSubmittingCredit(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-5">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[94vh] flex flex-col border border-slate-200">
        
        {/* Top Header */}
        <div className="relative p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <Smartphone size={26} />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                  Daily Reload & Scratch Card Bookkeeping
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Live Sheet
                  </span>
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Track in-hand SIM float, distributor stock & auto-calculate daily sell-out revenue
                </p>
              </div>
            </div>

            {/* Navigation Tabs & Date Selector */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setModalTab('sheet')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    modalTab === 'sheet' 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📊 Daily Sheet
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('credit')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    modalTab === 'credit' 
                      ? 'bg-amber-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🏷️ Credit Reload ({creditReloads.length})
                </button>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700">
                <Calendar size={14} className="text-slate-400" />
                <input
                  type="date"
                  value={stockDate}
                  onChange={(e) => setStockDate(e.target.value)}
                  className="bg-transparent text-xs text-white font-bold outline-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 bg-slate-50/50 space-y-4">

          {modalTab === 'sheet' ? (
            <>
              {/* Summary Stats Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Opening Float</div>
                  <div className="text-base sm:text-lg font-black text-slate-800 mt-0.5">
                    Rs. {Number(calculatedTotals.totalOpeningVal).toLocaleString()}
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">(+) Added Today</div>
                  <div className="text-base sm:text-lg font-black text-emerald-600 mt-0.5">
                    + Rs. {Number(calculatedTotals.totalAddedVal).toLocaleString()}
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Evening In-Hand</div>
                  <div className="text-base sm:text-lg font-black text-slate-700 mt-0.5">
                    Rs. {Number(calculatedTotals.totalEveningInHandVal).toLocaleString()}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-3.5 rounded-2xl text-white shadow-md">
                  <div className="text-[11px] font-bold text-emerald-100 uppercase tracking-wider">🎯 Total Sold-Out Revenue</div>
                  <div className="text-xl sm:text-2xl font-black mt-0.5">
                    Rs. {Number(calculatedTotals.totalSellOutVal).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Editable Sheet Table */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-3.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-indigo-600" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      In-Hand Reload & Scratch Card Balance Grid
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                    Formula: <strong>(Opening + Added) - Evening Remaining = Sold Out</strong>
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase text-[10px]">
                      <tr>
                        <th className="p-3 min-w-[180px]">Operator / Item</th>
                        <th className="p-3 text-center min-w-[110px]">Opening Stock (Rs.)</th>
                        <th className="p-3 text-center min-w-[110px] text-emerald-700">(+) Added Today</th>
                        <th className="p-3 text-center min-w-[100px] bg-slate-100/50">Total Float</th>
                        <th className="p-3 text-center min-w-[120px] text-indigo-700">Evening In-Hand (Rs.)</th>
                        <th className="p-3 text-right min-w-[130px] font-black text-emerald-700 bg-emerald-50/50">Today Sold Out</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">
                            <Loader2 size={24} className="animate-spin mx-auto mb-2 text-indigo-600" />
                            Loading daily reload sheet...
                          </td>
                        </tr>
                      ) : (
                        calculatedTotals.rows.map((row, idx) => (
                          <tr key={`${row.operator}-${row.cardValue}`} className="hover:bg-slate-50/80 transition-colors">
                            
                            {/* Operator Name & Badge */}
                            <td className="p-3">
                              <div className="flex items-center gap-2.5">
                                <div 
                                  className="w-3 h-3 rounded-full shrink-0"
                                  style={{ backgroundColor: row.color }}
                                />
                                <div>
                                  <div className="font-bold text-slate-900 text-[13px]">{row.label}</div>
                                  <div className="text-[10px] text-slate-400 font-semibold">{row.tag}</div>
                                </div>
                              </div>
                            </td>

                            {/* Opening Stock Input */}
                            <td className="p-2 text-center">
                              <input
                                type="number"
                                onWheel={(e) => e.target.blur()}
                                value={row.openingStock || ''}
                                onChange={(e) => handleCellChange(idx, 'openingStock', e.target.value)}
                                placeholder="0"
                                className="w-full text-center py-1.5 px-2 font-mono font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-indigo-500 outline-none"
                              />
                            </td>

                            {/* Added Today Input */}
                            <td className="p-2 text-center">
                              <input
                                type="number"
                                onWheel={(e) => e.target.blur()}
                                value={row.addedStock || ''}
                                onChange={(e) => handleCellChange(idx, 'addedStock', e.target.value)}
                                placeholder="0"
                                className="w-full text-center py-1.5 px-2 font-mono font-bold text-emerald-700 bg-emerald-50/40 border border-emerald-200 rounded-lg text-xs focus:bg-white focus:border-emerald-500 outline-none"
                              />
                            </td>

                            {/* Total Available Float (Calculated) */}
                            <td className="p-3 text-center font-mono font-bold text-slate-700 bg-slate-100/50">
                              Rs. {Number(row.totalStock * (row.cardValue || 1)).toLocaleString()}
                            </td>

                            {/* Evening In-Hand Input */}
                            <td className="p-2 text-center">
                              <input
                                type="number"
                                onWheel={(e) => e.target.blur()}
                                value={row.closingStock !== undefined && row.closingStock !== null ? row.closingStock : ''}
                                onChange={(e) => handleCellChange(idx, 'closingStock', e.target.value)}
                                placeholder="0"
                                className="w-full text-center py-1.5 px-2 font-mono font-black text-indigo-800 bg-indigo-50/40 border border-indigo-200 rounded-lg text-xs focus:bg-white focus:border-indigo-500 outline-none"
                              />
                            </td>

                            {/* Total Sold Out Value */}
                            <td className="p-3 text-right font-mono font-black text-emerald-600 text-sm bg-emerald-50/50">
                              Rs. {Number(row.sellOutValue || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            /* Quick Credit Reload Tab: Form & Live Ledger */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Credit Reload Entry Form */}
              <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <span>🏷️ Record Credit Reload (ණය Reload)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Log reload given to customer on credit without adding cash into drawer float.
                  </p>
                </div>

                <form onSubmit={handleSubmitCreditReload} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Select Operator *</label>
                    <div className="grid grid-cols-4 gap-2">
                      {['Dialog', 'Mobitel', 'Airtel', 'Hutch'].map((op) => (
                        <button
                          key={op}
                          type="button"
                          onClick={() => setCreditFormData({ ...creditFormData, operator: op })}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            creditFormData.operator === op 
                              ? 'bg-amber-500 text-white border-amber-600 shadow-sm' 
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {op}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Customer Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      value={creditFormData.mobileNumber}
                      onChange={(e) => setCreditFormData({ ...creditFormData, mobileNumber: e.target.value })}
                      placeholder="0771234567"
                      className="w-full p-2.5 text-sm font-semibold border border-slate-200 rounded-xl outline-none focus:border-amber-500 bg-slate-50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Customer Name (Optional)</label>
                    <input
                      type="text"
                      value={creditFormData.customerName}
                      onChange={(e) => setCreditFormData({ ...creditFormData, customerName: e.target.value })}
                      placeholder="e.g. Kamal / Neighbor"
                      className="w-full p-2.5 text-sm font-semibold border border-slate-200 rounded-xl outline-none focus:border-amber-500 bg-slate-50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Reload Amount (Rs.) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={creditFormData.amount}
                      onChange={(e) => setCreditFormData({ ...creditFormData, amount: e.target.value })}
                      placeholder="Enter amount (e.g. 500)"
                      className="w-full p-3 text-lg font-black text-amber-700 border-2 border-amber-200 rounded-xl outline-none focus:border-amber-500 bg-amber-50/30 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Note / Reference (Optional)</label>
                    <input
                      type="text"
                      value={creditFormData.notes}
                      onChange={(e) => setCreditFormData({ ...creditFormData, notes: e.target.value })}
                      placeholder="e.g. Promised to pay tomorrow"
                      className="w-full p-2.5 text-xs font-medium border border-slate-200 rounded-xl outline-none bg-slate-50 focus:bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingCredit}
                    className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-black rounded-xl text-sm shadow-md hover:from-amber-700 hover:to-amber-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submittingCredit ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                    Save Credit Reload Entry
                  </button>
                </form>
              </div>

              {/* Credit Reload Ledger / History for Selected Date */}
              <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <span>📋 Credit Reloads Ledger ({stockDate})</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      {creditReloads.length} Credit {creditReloads.length === 1 ? 'entry' : 'entries'} on record
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block">Total Credit</span>
                    <span className="text-base font-black text-amber-800">
                      Rs. {totalCreditAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[380px] space-y-2">
                  {loadingCredits ? (
                    <div className="py-12 text-center text-slate-400">
                      <Loader2 size={24} className="animate-spin mx-auto mb-2 text-amber-600" />
                      Loading credit reloads...
                    </div>
                  ) : creditReloads.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">
                      <CreditCard size={36} className="mx-auto mb-2 text-slate-300" />
                      <p className="text-xs font-bold text-slate-600">No credit reloads recorded for {stockDate}</p>
                      <p className="text-[10px] text-slate-400 mt-1">Submit the form on the left to add a credit reload.</p>
                    </div>
                  ) : (
                    creditReloads.map((cr) => (
                      <div 
                        key={cr._id} 
                        className="p-3 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-slate-100/80 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black text-xs shrink-0">
                            {cr.operator?.slice(0, 3).toUpperCase() || 'REL'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-900 text-xs">{cr.mobileNumber}</span>
                              {cr.customerName && (
                                <span className="text-[11px] font-semibold text-slate-600">({cr.customerName})</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                              <span>{cr.operator}</span>
                              <span>•</span>
                              <span>{new Date(cr.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {cr.notes && (
                                <>
                                  <span>•</span>
                                  <span className="italic text-slate-500">{cr.notes}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-black text-amber-800 text-sm">
                            Rs. {Number(cr.amount || 0).toLocaleString()}
                          </div>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            cr.creditSettled 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {cr.creditSettled ? 'Settled' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer Actions */}
        {modalTab === 'sheet' && (
          <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span>
                Total Sell-Out of <strong>Rs. {Number(calculatedTotals.totalSellOutVal).toLocaleString()}</strong> will sync with active POS shift drawer.
              </span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={handlePrintDailySlip}
                className="flex-1 sm:flex-none px-4 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer size={15} />
                Print 80mm Slip
              </button>

              <button
                type="button"
                onClick={handleSaveDailySheet}
                disabled={savingSheet}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-extrabold rounded-xl text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {savingSheet ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving Sheet...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save & Sync to Cash Drawer
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ReloadModal;
