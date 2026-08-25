'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Smartphone, CheckCircle, Loader2, Calendar, Printer, Save, TrendingUp, CreditCard, Layers, ShieldCheck, Plus, ArrowRight } from 'lucide-react';
import { createReload, getReloadStocks, saveReloadDailySheet, saveReloadSheetApi, getTodayReloadSheetApi } from '../../services/api';
import { toast } from 'react-toastify';

// ── Default Operator & Scratch Card Master Data ──────────────────────────────
const OPERATORS_CONFIG = [
  // E-Reload Machines
  { id: 'dialog_ereload',  operatorName: 'Dialog E-Reload Float',     network: 'Dialog',  color: '#e11d48', tag: 'E-Reload', cardValue: 1, commissionRate: 4 },
  { id: 'mobitel_ereload', operatorName: 'Mobitel E-Reload Float',    network: 'Mobitel', color: '#059669', tag: 'E-Reload', cardValue: 1, commissionRate: 4 },
  { id: 'airtel_ereload',  operatorName: 'Airtel E-Reload Float',     network: 'Airtel',  color: '#ef4444', tag: 'E-Reload', cardValue: 1, commissionRate: 4 },
  { id: 'hutch_ereload',   operatorName: 'Hutch Ez-Reload Float',     network: 'Hutch',   color: '#f59e0b', tag: 'E-Reload', cardValue: 1, commissionRate: 4 },
  { id: 'ezcash_wallet',   operatorName: 'Ez-Cash Float / Wallet',    network: 'Dialog',  color: '#0284c7', tag: 'Wallet',   cardValue: 1, commissionRate: 2 },
  { id: 'mcash_wallet',    operatorName: 'M-Cash Float / Wallet',     network: 'Mobitel', color: '#8b5cf6', tag: 'Wallet',   cardValue: 1, commissionRate: 2 },

  // Dialog Scratch Cards
  { id: 'dialog_card_50',   operatorName: 'Dialog Scratch Card Rs. 50',   network: 'Dialog',  color: '#e11d48', tag: 'Scratch Card', cardValue: 50, commissionRate: 4 },
  { id: 'dialog_card_100',  operatorName: 'Dialog Scratch Card Rs. 100',  network: 'Dialog',  color: '#e11d48', tag: 'Scratch Card', cardValue: 100, commissionRate: 4 },
  { id: 'dialog_card_200',  operatorName: 'Dialog Scratch Card Rs. 200',  network: 'Dialog',  color: '#e11d48', tag: 'Scratch Card', cardValue: 200, commissionRate: 4 },
  { id: 'dialog_card_500',  operatorName: 'Dialog Scratch Card Rs. 500',  network: 'Dialog',  color: '#e11d48', tag: 'Scratch Card', cardValue: 500, commissionRate: 4 },
  { id: 'dialog_card_1000', operatorName: 'Dialog Scratch Card Rs. 1000', network: 'Dialog',  color: '#e11d48', tag: 'Scratch Card', cardValue: 1000, commissionRate: 4 },

  // Mobitel Scratch Cards
  { id: 'mobitel_card_50',   operatorName: 'Mobitel Scratch Card Rs. 50',   network: 'Mobitel', color: '#059669', tag: 'Scratch Card', cardValue: 50, commissionRate: 4 },
  { id: 'mobitel_card_100',  operatorName: 'Mobitel Scratch Card Rs. 100',  network: 'Mobitel', color: '#059669', tag: 'Scratch Card', cardValue: 100, commissionRate: 4 },
  { id: 'mobitel_card_200',  operatorName: 'Mobitel Scratch Card Rs. 200',  network: 'Mobitel', color: '#059669', tag: 'Scratch Card', cardValue: 200, commissionRate: 4 },
  { id: 'mobitel_card_500',  operatorName: 'Mobitel Scratch Card Rs. 500',  network: 'Mobitel', color: '#059669', tag: 'Scratch Card', cardValue: 500, commissionRate: 4 },
  { id: 'mobitel_card_1000', operatorName: 'Mobitel Scratch Card Rs. 1000', network: 'Mobitel', color: '#059669', tag: 'Scratch Card', cardValue: 1000, commissionRate: 4 },

  // Airtel Scratch Cards
  { id: 'airtel_card_50',   operatorName: 'Airtel Scratch Card Rs. 50',   network: 'Airtel',  color: '#ef4444', tag: 'Scratch Card', cardValue: 50, commissionRate: 4 },
  { id: 'airtel_card_100',  operatorName: 'Airtel Scratch Card Rs. 100',  network: 'Airtel',  color: '#ef4444', tag: 'Scratch Card', cardValue: 100, commissionRate: 4 },
  { id: 'airtel_card_200',  operatorName: 'Airtel Scratch Card Rs. 200',  network: 'Airtel',  color: '#ef4444', tag: 'Scratch Card', cardValue: 200, commissionRate: 4 },
  { id: 'airtel_card_500',  operatorName: 'Airtel Scratch Card Rs. 500',  network: 'Airtel',  color: '#ef4444', tag: 'Scratch Card', cardValue: 500, commissionRate: 4 },

  // Hutch Scratch Cards
  { id: 'hutch_card_50',    operatorName: 'Hutch Scratch Card Rs. 50',    network: 'Hutch',   color: '#f59e0b', tag: 'Scratch Card', cardValue: 50, commissionRate: 4 },
  { id: 'hutch_card_100',   operatorName: 'Hutch Scratch Card Rs. 100',   network: 'Hutch',   color: '#f59e0b', tag: 'Scratch Card', cardValue: 100, commissionRate: 4 },
  { id: 'hutch_card_200',   operatorName: 'Hutch Scratch Card Rs. 200',   network: 'Hutch',   color: '#f59e0b', tag: 'Scratch Card', cardValue: 200, commissionRate: 4 },
  { id: 'hutch_card_500',   operatorName: 'Hutch Scratch Card Rs. 500',   network: 'Hutch',   color: '#f59e0b', tag: 'Scratch Card', cardValue: 500, commissionRate: 4 },
];

const LEGACY_MAP = {
  Dialog:  'Dialog E-Reload Float',
  Mobitel: 'Mobitel E-Reload Float',
  Airtel:  'Airtel E-Reload Float',
  Hutch:   'Hutch Ez-Reload Float',
  EzCash:  'Ez-Cash Float / Wallet',
  mCash:   'M-Cash Float / Wallet',
};

const makeRowState = (item) => ({
  id: item.id,
  operatorName: item.operatorName,
  network: item.network,
  color: item.color,
  tag: item.tag,
  cardValue: item.cardValue,
  commissionRate: item.commissionRate,
  openingStock: '',
  addedToday: '',
  eveningInHand: '',
});

// ─────────────────────────────────────────────────────────────────────────────
const ReloadModal = ({ isOpen, onClose, storeId, accountId, onSyncSuccess }) => {
  const [activeTab, setActiveTab] = useState('ereload'); // 'ereload' | 'cards' | 'summary' | 'credit'
  const [selectedNetwork, setSelectedNetwork] = useState('All'); // 'All' | 'Dialog' | 'Mobitel' | 'Airtel' | 'Hutch'
  const [stockDate, setStockDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState(() => OPERATORS_CONFIG.map(makeRowState));

  // Credit Reload State
  const [creditForm, setCreditForm] = useState({ mobileNumber: '', customerName: '', operator: 'Dialog', amount: '', notes: '' });
  const [submittingCredit, setSubmittingCredit] = useState(false);

  // ── Data Fetching ──────────────────────────────────────────────────────────
  const loadDailyData = async () => {
    try {
      setLoading(true);
      // Try fetching existing sheet
      let loaded = false;
      try {
        const res = await getTodayReloadSheetApi(storeId ? { storeId, date: stockDate } : { date: stockDate });
        if (res?.data?.data?.operators?.length > 0) {
          const serverOps = res.data.data.operators;
          setRows(prev => prev.map(row => {
            const match = serverOps.find(s => s.operatorName === row.operatorName);
            if (match) {
              return {
                ...row,
                openingStock: match.openingStock ?? '',
                addedToday: match.addedToday ?? '',
                eveningInHand: match.eveningInHand ?? '',
                commissionRate: match.commissionRate ?? row.commissionRate,
              };
            }
            return row;
          }));
          loaded = true;
        }
      } catch (err) {
        // Fallback to legacy
      }

      if (!loaded) {
        try {
          const { data: legacyData } = await getReloadStocks({ date: stockDate, ...(storeId ? { storeId } : {}) });
          if (Array.isArray(legacyData) && legacyData.length > 0) {
            setRows(prev => prev.map(row => {
              const legacyName = Object.entries(LEGACY_MAP).find(([, v]) => v === row.operatorName)?.[0];
              const match = legacyData.find(s => (s.operator === legacyName || s.operator === row.operatorName) && Number(s.cardValue || 1) === row.cardValue);
              if (match) {
                const closingVal = match.closingStock !== undefined && match.closingStock !== null ? match.closingStock : '';
                return {
                  ...row,
                  openingStock: match.openingStock ?? '',
                  addedToday: match.addedStock ?? '',
                  eveningInHand: closingVal,
                };
              }
              return row;
            }));
          }
        } catch (e) {
          // ignore
        }
      }
    } catch (err) {
      console.warn('Reload data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) loadDailyData();
  }, [isOpen, stockDate, storeId]); // eslint-disable-line

  // ── Input Changes ──────────────────────────────────────────────────────────
  const handleInputChange = (operatorName, field, val) => {
    setRows(prev => prev.map(r => {
      if (r.operatorName === operatorName) {
        return { ...r, [field]: val === '' ? '' : Math.max(0, Number(val) || 0) };
      }
      return r;
    }));
  };

  // ── Live Calculation (Sold, Commission, Net) ───────────────────────────────
  const calculations = useMemo(() => {
    let totalAdded = 0;
    let totalInHand = 0;
    let totalGrossSold = 0;
    let totalCommission = 0;
    let totalNetImpact = 0;

    const computedRows = rows.map(r => {
      const isCard = r.tag === 'Scratch Card';
      const multiplier = isCard ? (r.cardValue || 1) : 1;

      const opening = Number(r.openingStock === '' ? 0 : r.openingStock);
      const added = Number(r.addedToday === '' ? 0 : r.addedToday);
      const totalFloat = opening + added;
      const inHand = r.eveningInHand === '' || r.eveningInHand == null ? totalFloat : Number(r.eveningInHand);

      const soldQty = Math.max(0, totalFloat - inHand);
      const soldAmount = soldQty * multiplier;

      // 4% Commission calculation (Client Rule: 100 sold + 4% comm = 104 net gross)
      const commRate = Number(r.commissionRate ?? 4);
      const commAmount = Number(((soldAmount * commRate) / 100).toFixed(2));
      const netAmount = Number((soldAmount + commAmount).toFixed(2));

      totalAdded += (added * multiplier);
      totalInHand += (inHand * multiplier);
      totalGrossSold += soldAmount;
      totalCommission += commAmount;
      totalNetImpact += netAmount;

      return {
        ...r,
        _opening: opening,
        _added: added,
        _totalFloat: totalFloat,
        _inHand: inHand,
        _soldQty: soldQty,
        _soldAmount: soldAmount,
        _commRate: commRate,
        _commAmount: commAmount,
        _netAmount: netAmount,
      };
    });

    return {
      computedRows,
      totalAdded: Number(totalAdded.toFixed(2)),
      totalInHand: Number(totalInHand.toFixed(2)),
      totalGrossSold: Number(totalGrossSold.toFixed(2)),
      totalCommission: Number(totalCommission.toFixed(2)),
      totalNetImpact: Number(totalNetImpact.toFixed(2)),
    };
  }, [rows]);

  // Tab row subsets
  const ereloadRows = useMemo(() => calculations.computedRows.filter(r => r.tag === 'E-Reload' || r.tag === 'Wallet'), [calculations.computedRows]);
  const cardRows = useMemo(() => {
    return calculations.computedRows.filter(r => {
      if (r.tag !== 'Scratch Card') return false;
      if (selectedNetwork === 'All') return true;
      return r.network === selectedNetwork;
    });
  }, [calculations.computedRows, selectedNetwork]);

  // ── Save Sheet ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        storeId,
        date: stockDate,
        syncToDrawer: true,
        operators: calculations.computedRows.map(r => ({
          operatorName: r.operatorName,
          openingStock: r._opening,
          addedToday: r._added,
          eveningInHand: r._inHand,
          commissionRate: r._commRate,
        })),
      };

      try {
        await saveReloadSheetApi(payload);
      } catch (e) {
        // Fallback to legacy save
        await saveReloadDailySheet({
          storeId,
          date: stockDate,
          items: calculations.computedRows.map(r => ({
            operator: r.operatorName,
            cardValue: r.cardValue || 1,
            openingStock: r._opening,
            addedStock: r._added,
            closingStock: r._inHand,
          })),
        });
      }

      toast.success('Reload & Card Daily Sheet Saved Successfully! 📊✅');
      if (onSyncSuccess) onSyncSuccess();
      loadDailyData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save daily sheet');
    } finally {
      setSaving(false);
    }
  };

  // ── 80mm Print Slip ────────────────────────────────────────────────────────
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print receipt');
      return;
    }
    const { computedRows, totalGrossSold, totalCommission, totalNetImpact } = calculations;
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const activeRowsHtml = computedRows
      .filter(r => r._soldAmount > 0 || r._added > 0)
      .map(r => `
        <tr>
          <td style="padding: 4px 0; border-bottom: 1px dashed #cbd5e1; font-weight: bold;">${r.operatorName}</td>
          <td style="text-align: center; padding: 4px 0; border-bottom: 1px dashed #cbd5e1;">${r.tag === 'Scratch Card' ? `${r._soldQty} pcs` : `Rs.${r._soldAmount}`}</td>
          <td style="text-align: right; padding: 4px 0; border-bottom: 1px dashed #cbd5e1;">Rs.${r._commAmount}</td>
          <td style="text-align: right; padding: 4px 0; border-bottom: 1px dashed #cbd5e1; font-weight: bold;">Rs.${r._netAmount}</td>
        </tr>
      `).join('');

    const html = `
      <!DOCTYPE html>
      <html><head><title>SR Mobile Reload Slip</title>
      <style>
        body { font-family: 'Courier New', monospace; width: 78mm; margin: 0 auto; padding: 10px; font-size: 11px; color: #000; }
        .text-center { text-align: center; } .text-right { text-align: right; }
        .bold { font-weight: bold; } .divider { border-top: 1px dashed #000; margin: 8px 0; }
        table { width: 100%; border-collapse: collapse; }
      </style></head>
      <body onload="window.print(); setTimeout(()=>window.close(), 500);">
        <div class="text-center bold" style="font-size: 14px;">SR MOBILE POS</div>
        <div class="text-center bold">DAILY RELOAD & SCRATCH CARD SHEET</div>
        <div class="text-center" style="font-size: 10px; margin-bottom: 6px;">Date: ${stockDate} | Time: ${timeNow}</div>
        <div class="divider"></div>
        <table>
          <thead>
            <tr style="border-bottom: 1px solid #000; font-size: 10px;">
              <th style="text-align: left;">ITEM</th>
              <th style="text-align: center;">SOLD</th>
              <th style="text-align: right;">4% COMM</th>
              <th style="text-align: right;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${activeRowsHtml || '<tr><td colspan="4" style="text-align:center; padding:10px;">No sales recorded today</td></tr>'}
          </tbody>
        </table>
        <div class="divider"></div>
        <table>
          <tr><td>Total Sold Value:</td><td class="text-right bold">Rs. ${totalGrossSold.toLocaleString()}</td></tr>
          <tr><td>(+) 4% Commission:</td><td class="text-right bold">+ Rs. ${totalCommission.toLocaleString()}</td></tr>
          <tr style="font-size: 12px;"><td class="bold">NET EARNED (104%):</td><td class="text-right bold">Rs. ${totalNetImpact.toLocaleString()}</td></tr>
        </table>
        <div class="divider"></div>
        <div class="text-center" style="font-size: 9px; margin-top: 8px;">Printed via SR Mobile POS</div>
      </body></html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // ── Credit Reload Submit ───────────────────────────────────────────────────
  const handleCreditSubmit = async (e) => {
    e.preventDefault();
    if (!creditForm.mobileNumber || !creditForm.amount) {
      toast.error('Mobile Number and Amount are required');
      return;
    }
    try {
      setSubmittingCredit(true);
      await createReload({ ...creditForm, storeId, paymentMethod: 'Credit', type: 'Prepaid', accountId: null });
      toast.success('Credit Reload logged successfully! 🏷️');
      setCreditForm({ mobileNumber: '', customerName: '', operator: 'Dialog', amount: '', notes: '' });
      setActiveTab('ereload');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record credit reload');
    } finally {
      setSubmittingCredit(false);
    }
  };

  if (!isOpen) return null;
  const { totalAdded, totalInHand, totalGrossSold, totalCommission, totalNetImpact } = calculations;

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-7xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-slate-200">
        
        {/* ── Top Header ─────────────────────────────────────────────────── */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shrink-0 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all"
          >
            <X size={20} />
          </button>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pr-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shrink-0">
                <Smartphone size={24} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  Reload &amp; Scratch Card Daily Terminal
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Auto 4% Commission
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Formula: (Opening + Added) &minus; In-Hand = Sold | Sold + 4% Comm = Net Total
                </p>
              </div>
            </div>

            {/* Quick Navigation Tabs & Date */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setActiveTab('ereload')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'ereload' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone size={14} /> 📲 E-Reload
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('cards')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'cards' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <CreditCard size={14} /> 💳 Scratch Cards
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('summary')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'summary' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers size={14} /> 📊 Daily Summary
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('credit')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'credit' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🏷️ Credit Reload
                </button>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700">
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

        {/* ── Metric Summary Bar ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 p-3.5 bg-slate-100/80 border-b border-slate-200 shrink-0">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">(+) Added Today</div>
            <div className="text-base font-black text-emerald-600 mt-0.5">+ Rs. {totalAdded.toLocaleString()}</div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Evening In-Hand</div>
            <div className="text-base font-black text-slate-700 mt-0.5">Rs. {totalInHand.toLocaleString()}</div>
          </div>
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2.5 rounded-xl text-white shadow-sm">
            <div className="text-[10px] font-bold text-blue-100 uppercase tracking-wider">🎯 Gross Sold Value</div>
            <div className="text-lg font-black mt-0.5">Rs. {totalGrossSold.toLocaleString()}</div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-amber-200 shadow-sm">
            <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">4% Commission Earned</div>
            <div className="text-base font-black text-amber-700 mt-0.5">+ Rs. {totalCommission.toLocaleString()}</div>
          </div>
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-2.5 rounded-xl text-white shadow-sm">
            <div className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider">💰 Net Total (104%)</div>
            <div className="text-lg font-black mt-0.5">Rs. {totalNetImpact.toLocaleString()}</div>
          </div>
        </div>

        {/* ── Main Tab Content ─────────────────────────────────────────────── */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-50/50 space-y-4">
          
          {/* TAB 1: E-Reload Machine Floats */}
          {activeTab === 'ereload' && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-3 bg-slate-100/60 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone size={16} className="text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    E-Reload Machine Floats (Dialog, Mobitel, Airtel, Hutch)
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  Enter Added Float &amp; Evening In-Hand to calculate sales
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase text-[10px]">
                    <tr>
                      <th className="p-3 min-w-[200px]">Network / Machine</th>
                      <th className="p-3 text-center min-w-[120px]">Opening Float (Rs.)</th>
                      <th className="p-3 text-center min-w-[120px] text-emerald-700">(+) Added Today</th>
                      <th className="p-3 text-center min-w-[110px] bg-slate-100/60">Total Float</th>
                      <th className="p-3 text-center min-w-[130px] text-indigo-700">Evening In-Hand (Rs.)</th>
                      <th className="p-3 text-center min-w-[120px] text-emerald-700 bg-emerald-50/60">Sold Out</th>
                      <th className="p-3 text-center min-w-[110px] text-amber-700 bg-amber-50/40">4% Comm. (Rs.)</th>
                      <th className="p-3 text-right min-w-[120px] text-teal-700 bg-teal-50/40">Net Revenue (104%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400">
                          <Loader2 size={24} className="animate-spin mx-auto mb-2 text-indigo-600" />
                          Loading E-Reload machines...
                        </td>
                      </tr>
                    ) : ereloadRows.map((row) => (
                      <tr key={row.operatorName} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                            <div>
                              <div className="font-bold text-slate-900 text-[13px]">{row.operatorName}</div>
                              <div className="text-[10px] text-slate-400 font-semibold">{row.tag}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min="0"
                            onWheel={(e) => e.target.blur()}
                            value={row.openingStock === '' ? '' : row.openingStock}
                            onChange={(e) => handleInputChange(row.operatorName, 'openingStock', e.target.value)}
                            placeholder="0"
                            className="w-full text-center py-1.5 px-2 font-mono font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-indigo-500 outline-none"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min="0"
                            onWheel={(e) => e.target.blur()}
                            value={row.addedToday === '' ? '' : row.addedToday}
                            onChange={(e) => handleInputChange(row.operatorName, 'addedToday', e.target.value)}
                            placeholder="0"
                            className="w-full text-center py-1.5 px-2 font-mono font-bold text-emerald-700 bg-emerald-50/50 border border-emerald-200 rounded-lg text-xs focus:bg-white focus:border-emerald-500 outline-none"
                          />
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-slate-700 bg-slate-100/60">
                          Rs. {Number(row._totalFloat).toLocaleString()}
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min="0"
                            onWheel={(e) => e.target.blur()}
                            value={row.eveningInHand === '' ? '' : row.eveningInHand}
                            onChange={(e) => handleInputChange(row.operatorName, 'eveningInHand', e.target.value)}
                            placeholder="0"
                            className="w-full text-center py-1.5 px-2 font-mono font-black text-indigo-800 bg-indigo-50/50 border border-indigo-200 rounded-lg text-xs focus:bg-white focus:border-indigo-500 outline-none"
                          />
                        </td>
                        <td className="p-3 text-center font-mono font-black text-emerald-600 text-sm bg-emerald-50/60">
                          Rs. {Number(row._soldAmount).toLocaleString()}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-amber-700 bg-amber-50/40">
                          + Rs. {Number(row._commAmount).toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-mono font-black text-teal-700 text-sm bg-teal-50/40">
                          Rs. {Number(row._netAmount).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Scratch Cards */}
          {activeTab === 'cards' && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard size={18} className="text-rose-600" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Physical Scratch Card Stock (Pieces)
                  </span>
                </div>

                {/* Network Quick Selector Filter */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                  {['All', 'Dialog', 'Mobitel', 'Airtel', 'Hutch'].map((net) => (
                    <button
                      key={net}
                      type="button"
                      onClick={() => setSelectedNetwork(net)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        selectedNetwork === net ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {net}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase text-[10px]">
                    <tr>
                      <th className="p-3 min-w-[210px]">Scratch Card</th>
                      <th className="p-3 text-center min-w-[90px]">Value</th>
                      <th className="p-3 text-center min-w-[110px]">Opening (Pcs)</th>
                      <th className="p-3 text-center min-w-[110px] text-emerald-700">(+) Added (Pcs)</th>
                      <th className="p-3 text-center min-w-[120px] text-indigo-700">In-Hand (Pcs)</th>
                      <th className="p-3 text-center min-w-[100px] text-emerald-700 bg-emerald-50/60">Sold (Pcs)</th>
                      <th className="p-3 text-center min-w-[110px] text-blue-700 bg-blue-50/60">Gross (Rs.)</th>
                      <th className="p-3 text-center min-w-[100px] text-amber-700 bg-amber-50/40">4% Comm</th>
                      <th className="p-3 text-right min-w-[120px] text-teal-700 bg-teal-50/40">Net Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-400">
                          <Loader2 size={24} className="animate-spin mx-auto mb-2 text-rose-600" />
                          Loading scratch cards...
                        </td>
                      </tr>
                    ) : cardRows.map((row) => (
                      <tr key={row.operatorName} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                            <div>
                              <div className="font-bold text-slate-900 text-[13px]">{row.operatorName}</div>
                              <div className="text-[10px] text-slate-400 font-semibold">{row.network} Network</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-700">
                          Rs. {row.cardValue}
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min="0"
                            onWheel={(e) => e.target.blur()}
                            value={row.openingStock === '' ? '' : row.openingStock}
                            onChange={(e) => handleInputChange(row.operatorName, 'openingStock', e.target.value)}
                            placeholder="0"
                            className="w-full text-center py-1.5 px-2 font-mono font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-indigo-500 outline-none"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min="0"
                            onWheel={(e) => e.target.blur()}
                            value={row.addedToday === '' ? '' : row.addedToday}
                            onChange={(e) => handleInputChange(row.operatorName, 'addedToday', e.target.value)}
                            placeholder="0"
                            className="w-full text-center py-1.5 px-2 font-mono font-bold text-emerald-700 bg-emerald-50/50 border border-emerald-200 rounded-lg text-xs focus:bg-white focus:border-emerald-500 outline-none"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min="0"
                            onWheel={(e) => e.target.blur()}
                            value={row.eveningInHand === '' ? '' : row.eveningInHand}
                            onChange={(e) => handleInputChange(row.operatorName, 'eveningInHand', e.target.value)}
                            placeholder="0"
                            className="w-full text-center py-1.5 px-2 font-mono font-black text-indigo-800 bg-indigo-50/50 border border-indigo-200 rounded-lg text-xs focus:bg-white focus:border-indigo-500 outline-none"
                          />
                        </td>
                        <td className="p-3 text-center font-mono font-black text-emerald-700 bg-emerald-50/60 text-sm">
                          {row._soldQty} pcs
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-blue-700 bg-blue-50/60">
                          Rs. {Number(row._soldAmount).toLocaleString()}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-amber-700 bg-amber-50/40">
                          + Rs. {Number(row._commAmount).toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-mono font-black text-teal-700 text-sm bg-teal-50/40">
                          Rs. {Number(row._netAmount).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Daily Summary */}
          {activeTab === 'summary' && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-900">📊 Combined Daily Reload &amp; Scratch Card Summary</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Overall daily float, sales volume, and 4% commission breakdown.</p>
                </div>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-md"
                >
                  <Printer size={15} /> Print 80mm Slip
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="text-xs font-bold text-slate-500 uppercase">E-Reload Float Sales</div>
                  <div className="text-xl font-black text-slate-900 mt-1">
                    Rs. {ereloadRows.reduce((a, b) => a + b._soldAmount, 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="text-xs font-bold text-slate-500 uppercase">Scratch Cards Gross Sales</div>
                  <div className="text-xl font-black text-slate-900 mt-1">
                    Rs. {calculations.computedRows.filter(r => r.tag === 'Scratch Card').reduce((a, b) => a + b._soldAmount, 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                  <div className="text-xs font-bold text-emerald-700 uppercase">Total Shop Earnings (104%)</div>
                  <div className="text-2xl font-black text-emerald-700 mt-1">
                    Rs. {totalNetImpact.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Item</th>
                      <th className="p-3 text-center">Type</th>
                      <th className="p-3 text-center">Sold Quantity</th>
                      <th className="p-3 text-center">Gross Sales</th>
                      <th className="p-3 text-center">4% Commission</th>
                      <th className="p-3 text-right">Net Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {calculations.computedRows.filter(r => r._soldAmount > 0 || r._added > 0).map((r) => (
                      <tr key={r.operatorName} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-800">{r.operatorName}</td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                            {r.tag}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono">
                          {r.tag === 'Scratch Card' ? `${r._soldQty} pcs` : `Rs. ${r._soldAmount}`}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-slate-700">
                          Rs. {r._soldAmount.toLocaleString()}
                        </td>
                        <td className="p-3 text-center font-mono text-amber-700 font-bold">
                          + Rs. {r._commAmount.toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-mono font-black text-teal-700">
                          Rs. {r._netAmount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Credit Reload */}
          {activeTab === 'credit' && (
            <div className="max-w-xl mx-auto bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900">🏷️ Record Credit Reload</h3>
                <p className="text-xs text-slate-500 mt-1">Log reload given to a customer on credit without drawer float addition.</p>
              </div>
              <form onSubmit={handleCreditSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Select Network *</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['Dialog', 'Mobitel', 'Airtel', 'Hutch'].map((op) => (
                      <button
                        key={op}
                        type="button"
                        onClick={() => setCreditForm({ ...creditForm, operator: op })}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                          creditForm.operator === op
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
                  <label className="text-xs font-bold text-slate-700 block mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    value={creditForm.mobileNumber}
                    onChange={(e) => setCreditForm({ ...creditForm, mobileNumber: e.target.value })}
                    placeholder="0771234567"
                    required
                    className="w-full py-2.5 px-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Customer Name (Optional)</label>
                  <input
                    type="text"
                    value={creditForm.customerName}
                    onChange={(e) => setCreditForm({ ...creditForm, customerName: e.target.value })}
                    placeholder="Customer Name / NIC"
                    className="w-full py-2.5 px-3 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Reload Amount (Rs.) *</label>
                  <input
                    type="number"
                    min="1"
                    value={creditForm.amount}
                    onChange={(e) => setCreditForm({ ...creditForm, amount: e.target.value })}
                    placeholder="100"
                    required
                    className="w-full py-2.5 px-3 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Notes</label>
                  <textarea
                    value={creditForm.notes}
                    onChange={(e) => setCreditForm({ ...creditForm, notes: e.target.value })}
                    placeholder="e.g. Regular customer, will settle tomorrow"
                    rows={2}
                    className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingCredit}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  {submittingCredit ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                  Record Credit Reload
                </button>
              </form>
            </div>
          )}
        </div>

        {/* ── Footer Actions ──────────────────────────────────────────────── */}
        <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 border-t border-slate-800">
          <div className="text-xs text-slate-400 font-medium">
            Total Net Impact: <span className="text-emerald-400 font-bold text-sm">Rs. {totalNetImpact.toLocaleString()}</span> (Includes 4% Commission)
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition-colors"
            >
              <Printer size={16} /> Print Slip
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Daily Sheet &amp; Sync
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReloadModal;
