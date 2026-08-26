'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Smartphone, CheckCircle, Loader2, Calendar, Printer, Save, 
  TrendingUp, CreditCard, Layers, Plus, DollarSign, Sparkles, 
  Check, ArrowUpRight, ShieldCheck, RefreshCw, AlertCircle, Edit3 
} from 'lucide-react';
import { createReload, getReloadStocks, saveReloadDailySheet, saveReloadSheetApi, getTodayReloadSheetApi } from '../../services/api';
import { toast } from 'react-toastify';

// ── Master Config for Operators & Scratch Cards ───────────────────────────────
const OPERATORS_CONFIG = [
  // E-Reload Machines
  { id: 'dialog_ereload',  operatorName: 'Dialog E-Reload',     network: 'Dialog',  color: '#e11d48', bgLight: '#fff1f2', border: '#fecdd3', tag: 'E-Reload', cardValue: 1, commissionRate: 4 },
  { id: 'mobitel_ereload', operatorName: 'Mobitel E-Reload',    network: 'Mobitel', color: '#059669', bgLight: '#ecfdf5', border: '#a7f3d0', tag: 'E-Reload', cardValue: 1, commissionRate: 4 },
  { id: 'airtel_ereload',  operatorName: 'Airtel E-Reload',     network: 'Airtel',  color: '#ef4444', bgLight: '#fef2f2', border: '#fecaca', tag: 'E-Reload', cardValue: 1, commissionRate: 4 },
  { id: 'hutch_ereload',   operatorName: 'Hutch Ez-Reload',     network: 'Hutch',   color: '#f59e0b', bgLight: '#fffbeb', border: '#fde68a', tag: 'E-Reload', cardValue: 1, commissionRate: 4 },
  { id: 'ezcash_wallet',   operatorName: 'Ez-Cash Wallet',      network: 'Dialog',  color: '#0284c7', bgLight: '#f0f9ff', border: '#bae6fd', tag: 'Wallet',   cardValue: 1, commissionRate: 2 },
  { id: 'mcash_wallet',    operatorName: 'M-Cash Wallet',       network: 'Mobitel', color: '#8b5cf6', bgLight: '#f5f3ff', border: '#ddd6fe', tag: 'Wallet',   cardValue: 1, commissionRate: 2 },

  // Dialog Scratch Cards
  { id: 'dialog_card_50',   operatorName: 'Dialog Card Rs. 50',   network: 'Dialog',  color: '#e11d48', bgLight: '#fff1f2', border: '#fecdd3', tag: 'Scratch Card', cardValue: 50, commissionRate: 4 },
  { id: 'dialog_card_100',  operatorName: 'Dialog Card Rs. 100',  network: 'Dialog',  color: '#e11d48', bgLight: '#fff1f2', border: '#fecdd3', tag: 'Scratch Card', cardValue: 100, commissionRate: 4 },
  { id: 'dialog_card_200',  operatorName: 'Dialog Card Rs. 200',  network: 'Dialog',  color: '#e11d48', bgLight: '#fff1f2', border: '#fecdd3', tag: 'Scratch Card', cardValue: 200, commissionRate: 4 },
  { id: 'dialog_card_500',  operatorName: 'Dialog Card Rs. 500',  network: 'Dialog',  color: '#e11d48', bgLight: '#fff1f2', border: '#fecdd3', tag: 'Scratch Card', cardValue: 500, commissionRate: 4 },
  { id: 'dialog_card_1000', operatorName: 'Dialog Card Rs. 1000', network: 'Dialog',  color: '#e11d48', bgLight: '#fff1f2', border: '#fecdd3', tag: 'Scratch Card', cardValue: 1000, commissionRate: 4 },

  // Mobitel Scratch Cards
  { id: 'mobitel_card_50',   operatorName: 'Mobitel Card Rs. 50',   network: 'Mobitel', color: '#059669', bgLight: '#ecfdf5', border: '#a7f3d0', tag: 'Scratch Card', cardValue: 50, commissionRate: 4 },
  { id: 'mobitel_card_100',  operatorName: 'Mobitel Card Rs. 100',  network: 'Mobitel', color: '#059669', bgLight: '#ecfdf5', border: '#a7f3d0', tag: 'Scratch Card', cardValue: 100, commissionRate: 4 },
  { id: 'mobitel_card_200',  operatorName: 'Mobitel Card Rs. 200',  network: 'Mobitel', color: '#059669', bgLight: '#ecfdf5', border: '#a7f3d0', tag: 'Scratch Card', cardValue: 200, commissionRate: 4 },
  { id: 'mobitel_card_500',  operatorName: 'Mobitel Card Rs. 500',  network: 'Mobitel', color: '#059669', bgLight: '#ecfdf5', border: '#a7f3d0', tag: 'Scratch Card', cardValue: 500, commissionRate: 4 },
  { id: 'mobitel_card_1000', operatorName: 'Mobitel Card Rs. 1000', network: 'Mobitel', color: '#059669', bgLight: '#ecfdf5', border: '#a7f3d0', tag: 'Scratch Card', cardValue: 1000, commissionRate: 4 },

  // Airtel Scratch Cards
  { id: 'airtel_card_50',   operatorName: 'Airtel Card Rs. 50',   network: 'Airtel',  color: '#ef4444', bgLight: '#fef2f2', border: '#fecaca', tag: 'Scratch Card', cardValue: 50, commissionRate: 4 },
  { id: 'airtel_card_100',  operatorName: 'Airtel Card Rs. 100',  network: 'Airtel',  color: '#ef4444', bgLight: '#fef2f2', border: '#fecaca', tag: 'Scratch Card', cardValue: 100, commissionRate: 4 },
  { id: 'airtel_card_200',  operatorName: 'Airtel Card Rs. 200',  network: 'Airtel',  color: '#ef4444', bgLight: '#fef2f2', border: '#fecaca', tag: 'Scratch Card', cardValue: 200, commissionRate: 4 },
  { id: 'airtel_card_500',  operatorName: 'Airtel Card Rs. 500',  network: 'Airtel',  color: '#ef4444', bgLight: '#fef2f2', border: '#fecaca', tag: 'Scratch Card', cardValue: 500, commissionRate: 4 },

  // Hutch Scratch Cards
  { id: 'hutch_card_50',    operatorName: 'Hutch Card Rs. 50',    network: 'Hutch',   color: '#f59e0b', bgLight: '#fffbeb', border: '#fde68a', tag: 'Scratch Card', cardValue: 50, commissionRate: 4 },
  { id: 'hutch_card_100',   operatorName: 'Hutch Card Rs. 100',   network: 'Hutch',   color: '#f59e0b', bgLight: '#fffbeb', border: '#fde68a', tag: 'Scratch Card', cardValue: 100, commissionRate: 4 },
  { id: 'hutch_card_200',   operatorName: 'Hutch Card Rs. 200',   network: 'Hutch',   color: '#f59e0b', bgLight: '#fffbeb', border: '#fde68a', tag: 'Scratch Card', cardValue: 200, commissionRate: 4 },
  { id: 'hutch_card_500',   operatorName: 'Hutch Card Rs. 500',   network: 'Hutch',   color: '#f59e0b', bgLight: '#fffbeb', border: '#fde68a', tag: 'Scratch Card', cardValue: 500, commissionRate: 4 },
];

const LEGACY_MAP = {
  Dialog:  'Dialog E-Reload',
  Mobitel: 'Mobitel E-Reload',
  Airtel:  'Airtel E-Reload',
  Hutch:   'Hutch Ez-Reload',
  EzCash:  'Ez-Cash Wallet',
  mCash:   'M-Cash Wallet',
};

const makeRowState = (item) => ({
  id: item.id,
  operatorName: item.operatorName,
  network: item.network,
  color: item.color,
  bgLight: item.bgLight,
  border: item.border,
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

  // Quick Add Float Popup
  const [showAddReloadModal, setShowAddReloadModal] = useState(false);
  const [addReloadForm, setAddReloadForm] = useState({
    operatorName: 'Dialog E-Reload',
    amount: '',
    notes: '',
  });

  // Quick Add Card Popup
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [addCardForm, setAddCardForm] = useState({
    network: 'Dialog',
    cardValue: '100',
    quantity: '',
    notes: '',
  });

  // Credit Reload State
  const [creditForm, setCreditForm] = useState({ mobileNumber: '', customerName: '', operator: 'Dialog', amount: '', notes: '' });
  const [submittingCredit, setSubmittingCredit] = useState(false);

  // ── Data Fetching ──────────────────────────────────────────────────────────
  const loadDailyData = async () => {
    try {
      setLoading(true);
      let loaded = false;
      try {
        const res = await getTodayReloadSheetApi(storeId ? { storeId, date: stockDate } : { date: stockDate });
        if (res?.data?.data?.operators?.length > 0) {
          const serverOps = res.data.data.operators;
          setRows(prev => prev.map(row => {
            const match = serverOps.find(s => s.operatorName === row.operatorName || s.operatorName.includes(row.operatorName) || row.operatorName.includes(s.operatorName));
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
        // fallback
      }

      if (!loaded) {
        try {
          const { data: legacyData } = await getReloadStocks({ date: stockDate, ...(storeId ? { storeId } : {}) });
          if (Array.isArray(legacyData) && legacyData.length > 0) {
            setRows(prev => prev.map(row => {
              const legacyName = Object.entries(LEGACY_MAP).find(([, v]) => v === row.operatorName)?.[0];
              const match = legacyData.find(s => (s.operator === legacyName || s.operator === row.operatorName || row.operatorName.includes(s.operator)) && Number(s.cardValue || 1) === row.cardValue);
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

  // ── Cell Value Change ──────────────────────────────────────────────────────
  const handleInputChange = (operatorName, field, val) => {
    setRows(prev => prev.map(r => {
      if (r.operatorName === operatorName) {
        return { ...r, [field]: val === '' ? '' : Math.max(0, Number(val) || 0) };
      }
      return r;
    }));
  };

  // ── Quick Increment Shortcut (+1000, +2000, +5000) ─────────────────────────
  const handleQuickAddValue = (operatorName, amountToAdd) => {
    setRows(prev => prev.map(r => {
      if (r.operatorName === operatorName) {
        const cur = Number(r.addedToday || 0);
        return { ...r, addedToday: cur + amountToAdd };
      }
      return r;
    }));
  };

  // ── Quick Add Reload Float Modal Submit ─────────────────────────────────────
  const handleAddReloadFloatSubmit = (e) => {
    e.preventDefault();
    const amountVal = Number(addReloadForm.amount);
    if (!amountVal || amountVal <= 0) {
      toast.error('Please enter a valid float amount');
      return;
    }

    setRows(prev => {
      let found = false;
      const updated = prev.map(r => {
        if (r.operatorName === addReloadForm.operatorName) {
          found = true;
          const currentAdded = Number(r.addedToday || 0);
          return { ...r, addedToday: currentAdded + amountVal };
        }
        return r;
      });

      if (!found) {
        updated.push({
          id: `custom_ereload_${Date.now()}`,
          operatorName: addReloadForm.operatorName,
          network: 'Other',
          color: '#6366f1',
          bgLight: '#eef2ff',
          border: '#c7d2fe',
          tag: 'E-Reload',
          cardValue: 1,
          commissionRate: 4,
          openingStock: '',
          addedToday: amountVal,
          eveningInHand: '',
        });
      }
      return updated;
    });

    toast.success(`+ Rs. ${amountVal.toLocaleString()} float added to ${addReloadForm.operatorName}! 📲`);
    setAddReloadForm({ operatorName: 'Dialog E-Reload', amount: '', notes: '' });
    setShowAddReloadModal(false);
  };

  // ── Quick Add Card Stock Modal Submit ───────────────────────────────────────
  const handleAddCardStockSubmit = (e) => {
    e.preventDefault();
    const qtyVal = Number(addCardForm.quantity);
    const cardVal = Number(addCardForm.cardValue);
    if (!qtyVal || qtyVal <= 0) {
      toast.error('Please enter valid quantity');
      return;
    }

    const targetName = `${addCardForm.network} Card Rs. ${cardVal}`;

    setRows(prev => {
      let found = false;
      const updated = prev.map(r => {
        if (r.operatorName === targetName || (r.network === addCardForm.network && Number(r.cardValue) === cardVal && r.tag === 'Scratch Card')) {
          found = true;
          const currentAdded = Number(r.addedToday || 0);
          return { ...r, addedToday: currentAdded + qtyVal };
        }
        return r;
      });

      if (!found) {
        const netColors = { Dialog: '#e11d48', Mobitel: '#059669', Airtel: '#ef4444', Hutch: '#f59e0b' };
        updated.push({
          id: `custom_card_${Date.now()}`,
          operatorName: targetName,
          network: addCardForm.network,
          color: netColors[addCardForm.network] || '#e11d48',
          bgLight: '#fff1f2',
          border: '#fecdd3',
          tag: 'Scratch Card',
          cardValue: cardVal,
          commissionRate: 4,
          openingStock: '',
          addedToday: qtyVal,
          eveningInHand: '',
        });
      }
      return updated;
    });

    toast.success(`+ ${qtyVal} pcs of ${addCardForm.network} Rs. ${cardVal} added! 💳`);
    setAddCardForm({ network: 'Dialog', cardValue: '100', quantity: '', notes: '' });
    setShowAddCardModal(false);
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
    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 w-full max-w-7xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] border border-slate-700/80">
        
        {/* ── Top Header ─────────────────────────────────────────────────── */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white shrink-0 relative border-b border-slate-800">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <X size={20} />
          </button>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pr-12">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 shrink-0">
                <Smartphone size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2.5">
                  Reload &amp; Card Management
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    ⚡ Auto 4% Comm.
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Formula: (Opening + Added) &minus; In-Hand = Sold | Sold + 4% Comm = Net Total
                </p>
              </div>
            </div>

            {/* Navigation Tabs & Date Selector */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center bg-slate-800/90 p-1.5 rounded-2xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setActiveTab('ereload')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'ereload' 
                      ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/30' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone size={15} /> 📲 Reload
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('cards')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'cards' 
                      ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/30' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <CreditCard size={15} /> 💳 Card
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('summary')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'summary' 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers size={15} /> 📊 Summary
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('credit')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'credit' 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🏷️ Credit
                </button>
              </div>

              <div className="flex items-center gap-2 bg-slate-800/90 px-3.5 py-2 rounded-2xl border border-slate-700">
                <Calendar size={15} className="text-slate-400" />
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

        {/* ── Realtime KPI Metric Ribbon ─────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 bg-slate-950/60 border-b border-slate-800 shrink-0">
          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">(+) Added Today</div>
            <div className="text-lg font-black text-emerald-400 mt-1">+ Rs. {totalAdded.toLocaleString()}</div>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Evening In-Hand</div>
            <div className="text-lg font-black text-slate-300 mt-1">Rs. {totalInHand.toLocaleString()}</div>
          </div>
          <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 p-3 rounded-2xl border border-blue-500/30 text-white">
            <div className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">🎯 Gross Sold</div>
            <div className="text-xl font-black text-blue-100 mt-1">Rs. {totalGrossSold.toLocaleString()}</div>
          </div>
          <div className="bg-gradient-to-br from-amber-900/40 to-orange-900/40 p-3 rounded-2xl border border-amber-500/30">
            <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">4% Comm. Earned</div>
            <div className="text-lg font-black text-amber-400 mt-1">+ Rs. {totalCommission.toLocaleString()}</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-900/40 to-teal-900/40 p-3 rounded-2xl border border-emerald-500/40">
            <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">💰 Net Total (104%)</div>
            <div className="text-xl font-black text-emerald-400 mt-1">Rs. {totalNetImpact.toLocaleString()}</div>
          </div>
        </div>

        {/* ── Main Content Area ────────────────────────────────────────────── */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-slate-950 space-y-4">
          
          {/* ════════════════════════════════════════════════════════════════════
              TAB 1: RELOAD MACHINE FLOATS (MODERN POS CARD GRID)
             ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'ereload' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Smartphone size={18} className="text-indigo-400" />
                  <span className="text-sm font-black text-white uppercase tracking-wide">
                    Reload Machine Floats
                  </span>
                  <span className="text-xs text-slate-400 hidden sm:inline">• Enter Today Added Float &amp; Evening In-Hand</span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddReloadModal(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
                >
                  <Plus size={16} /> + Add Reload Float
                </button>
              </div>

              {/* Reload Operator Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                  <div className="col-span-full py-16 text-center text-slate-400">
                    <Loader2 size={32} className="animate-spin mx-auto mb-3 text-indigo-500" />
                    Loading reload floats...
                  </div>
                ) : ereloadRows.map((row) => (
                  <div 
                    key={row.operatorName} 
                    className="bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group"
                  >
                    {/* Top Accent Line */}
                    <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: row.color }} />

                    {/* Card Header */}
                    <div className="flex items-center justify-between mb-3 pt-1">
                      <div className="flex items-center gap-2.5">
                        <div className="w-4 h-4 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: row.color }} />
                        <div>
                          <h4 className="text-sm font-black text-white leading-tight">{row.operatorName}</h4>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{row.tag} • 4% Comm</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Total Float</div>
                        <div className="text-xs font-mono font-black text-slate-200">Rs. {Number(row._totalFloat).toLocaleString()}</div>
                      </div>
                    </div>

                    {/* Inputs Section */}
                    <div className="grid grid-cols-2 gap-2.5 mb-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      <div>
                        <label className="text-[10px] font-bold text-emerald-400 block mb-1 uppercase tracking-wider">
                          (+) Added Float (Rs.)
                        </label>
                        <input
                          type="number"
                          min="0"
                          onWheel={(e) => e.target.blur()}
                          placeholder="0"
                          value={row.addedToday === '' ? '' : row.addedToday}
                          onChange={(e) => handleInputChange(row.operatorName, 'addedToday', e.target.value)}
                          className="w-full py-2 px-2.5 font-mono font-bold text-emerald-300 bg-slate-900 border border-emerald-500/30 rounded-lg text-sm focus:border-emerald-500 focus:bg-slate-800 outline-none transition-all"
                        />
                        {/* Quick increment chips */}
                        <div className="flex items-center gap-1 mt-1.5">
                          <button
                            type="button"
                            onClick={() => handleQuickAddValue(row.operatorName, 1000)}
                            className="px-1.5 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold transition-colors cursor-pointer"
                          >
                            +1k
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickAddValue(row.operatorName, 2000)}
                            className="px-1.5 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold transition-colors cursor-pointer"
                          >
                            +2k
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickAddValue(row.operatorName, 5000)}
                            className="px-1.5 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold transition-colors cursor-pointer"
                          >
                            +5k
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-indigo-400 block mb-1 uppercase tracking-wider">
                          Evening In-Hand (Rs.)
                        </label>
                        <input
                          type="number"
                          min="0"
                          onWheel={(e) => e.target.blur()}
                          placeholder="0"
                          value={row.eveningInHand === '' ? '' : row.eveningInHand}
                          onChange={(e) => handleInputChange(row.operatorName, 'eveningInHand', e.target.value)}
                          className="w-full py-2 px-2.5 font-mono font-bold text-indigo-300 bg-slate-900 border border-indigo-500/30 rounded-lg text-sm focus:border-indigo-500 focus:bg-slate-800 outline-none transition-all"
                        />
                        <div className="text-[10px] text-slate-500 font-medium mt-1.5 truncate">
                          Opening: Rs. {Number(row._opening).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Live Calculation Ribbon */}
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase">Sold Out</div>
                        <div className="text-xs font-mono font-black text-emerald-400">Rs. {Number(row._soldAmount).toLocaleString()}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[9px] font-bold text-amber-400 uppercase">+4% Comm.</div>
                        <div className="text-xs font-mono font-bold text-amber-300">+ Rs. {Number(row._commAmount).toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] font-bold text-teal-400 uppercase">Net (104%)</div>
                        <div className="text-sm font-mono font-black text-teal-300">Rs. {Number(row._netAmount).toLocaleString()}</div>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              TAB 2: SCRATCH CARDS (MODERN POS CARD GRID)
             ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'cards' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CreditCard size={18} className="text-rose-400" />
                  <span className="text-sm font-black text-white uppercase tracking-wide">
                    Scratch Card Stock (Pieces)
                  </span>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Network Filter Pills */}
                  <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
                    {['All', 'Dialog', 'Mobitel', 'Airtel', 'Hutch'].map((net) => (
                      <button
                        key={net}
                        type="button"
                        onClick={() => setSelectedNetwork(net)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          selectedNetwork === net 
                            ? 'bg-rose-600 text-white shadow-md' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {net}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAddCardModal(true)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-500/25 transition-all cursor-pointer"
                  >
                    <Plus size={16} /> + Add Card Stock
                  </button>
                </div>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {loading ? (
                  <div className="col-span-full py-16 text-center text-slate-400">
                    <Loader2 size={32} className="animate-spin mx-auto mb-3 text-rose-500" />
                    Loading card inventory...
                  </div>
                ) : cardRows.map((row) => (
                  <div 
                    key={row.operatorName} 
                    className="bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all p-3.5 flex flex-col justify-between shadow-lg relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: row.color }} />

                    {/* Card Header */}
                    <div className="flex items-center justify-between mb-2.5 pt-1">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full" style={{ backgroundColor: `${row.color}25`, color: row.color }}>
                          {row.network}
                        </span>
                        <h4 className="text-sm font-black text-white mt-1">Rs. {row.cardValue} Card</h4>
                      </div>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs" style={{ backgroundColor: `${row.color}20`, color: row.color }}>
                        Rs.{row.cardValue}
                      </div>
                    </div>

                    {/* Card Inputs */}
                    <div className="grid grid-cols-2 gap-2 mb-2.5 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                      <div>
                        <label className="text-[9px] font-bold text-emerald-400 block mb-1 uppercase tracking-wider">
                          (+) Added (Pcs)
                        </label>
                        <input
                          type="number"
                          min="0"
                          onWheel={(e) => e.target.blur()}
                          placeholder="0"
                          value={row.addedToday === '' ? '' : row.addedToday}
                          onChange={(e) => handleInputChange(row.operatorName, 'addedToday', e.target.value)}
                          className="w-full py-1.5 px-2 font-mono font-bold text-emerald-300 bg-slate-900 border border-emerald-500/30 rounded-lg text-xs focus:border-emerald-500 focus:bg-slate-800 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-indigo-400 block mb-1 uppercase tracking-wider">
                          In-Hand (Pcs)
                        </label>
                        <input
                          type="number"
                          min="0"
                          onWheel={(e) => e.target.blur()}
                          placeholder="0"
                          value={row.eveningInHand === '' ? '' : row.eveningInHand}
                          onChange={(e) => handleInputChange(row.operatorName, 'eveningInHand', e.target.value)}
                          className="w-full py-1.5 px-2 font-mono font-bold text-indigo-300 bg-slate-900 border border-indigo-500/30 rounded-lg text-xs focus:border-indigo-500 focus:bg-slate-800 outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Live Metric Bar */}
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">Sold</span>
                        <span className="font-black text-emerald-400">{row._soldQty} pcs</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 block uppercase">Gross (104%)</span>
                        <span className="font-black text-teal-300">Rs. {Number(row._netAmount).toLocaleString()}</span>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              TAB 3: DAILY SUMMARY
             ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'summary' && (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-black text-white">📊 Daily Reload &amp; Card Bookkeeping Summary</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Summary breakdown with 4% commissions and cash drawer impact</p>
                </div>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer border border-slate-700"
                >
                  <Printer size={16} /> Print 80mm Receipt Slip
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="text-xs font-bold text-slate-400 uppercase">Reload Float Sales</div>
                  <div className="text-2xl font-black text-white mt-1">
                    Rs. {ereloadRows.reduce((a, b) => a + b._soldAmount, 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="text-xs font-bold text-slate-400 uppercase">Card Sales Value</div>
                  <div className="text-2xl font-black text-white mt-1">
                    Rs. {calculations.computedRows.filter(r => r.tag === 'Scratch Card').reduce((a, b) => a + b._soldAmount, 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-emerald-950/40 p-4 rounded-2xl border border-emerald-500/40">
                  <div className="text-xs font-bold text-emerald-400 uppercase">Total Shop Earnings (104%)</div>
                  <div className="text-2xl font-black text-emerald-300 mt-1">
                    Rs. {totalNetImpact.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-950 text-slate-400 font-extrabold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Item</th>
                      <th className="p-3 text-center">Type</th>
                      <th className="p-3 text-center">Sold Quantity</th>
                      <th className="p-3 text-center">Gross Sales</th>
                      <th className="p-3 text-center">4% Commission</th>
                      <th className="p-3 text-right">Net Total (104%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {calculations.computedRows.filter(r => r._soldAmount > 0 || r._added > 0).map((r) => (
                      <tr key={r.operatorName} className="hover:bg-slate-800/50">
                        <td className="p-3 font-bold text-slate-200">{r.operatorName}</td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold">
                            {r.tag}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono text-slate-300">
                          {r.tag === 'Scratch Card' ? `${r._soldQty} pcs` : `Rs. ${r._soldAmount}`}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-slate-200">
                          Rs. {r._soldAmount.toLocaleString()}
                        </td>
                        <td className="p-3 text-center font-mono text-amber-400 font-bold">
                          + Rs. {r._commAmount.toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-mono font-black text-teal-300">
                          Rs. {r._netAmount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              TAB 4: CREDIT RELOAD
             ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'credit' && (
            <div className="max-w-xl mx-auto bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-black text-white">🏷️ Record Credit Reload</h3>
                <p className="text-xs text-slate-400 mt-1">Log reload given to a customer on credit without drawer float addition.</p>
              </div>
              <form onSubmit={handleCreditSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">Select Network *</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['Dialog', 'Mobitel', 'Airtel', 'Hutch'].map((op) => (
                      <button
                        key={op}
                        type="button"
                        onClick={() => setCreditForm({ ...creditForm, operator: op })}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          creditForm.operator === op
                            ? 'bg-amber-500 text-slate-950 border-amber-500 font-black shadow-md'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                      >
                        {op}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">Mobile Number *</label>
                  <input
                    type="text"
                    value={creditForm.mobileNumber}
                    onChange={(e) => setCreditForm({ ...creditForm, mobileNumber: e.target.value })}
                    placeholder="0771234567"
                    required
                    className="w-full py-2.5 px-3 border border-slate-700 bg-slate-950 rounded-xl text-sm font-bold text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">Customer Name (Optional)</label>
                  <input
                    type="text"
                    value={creditForm.customerName}
                    onChange={(e) => setCreditForm({ ...creditForm, customerName: e.target.value })}
                    placeholder="Customer Name / NIC"
                    className="w-full py-2.5 px-3 border border-slate-700 bg-slate-950 rounded-xl text-sm text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">Reload Amount (Rs.) *</label>
                  <input
                    type="number"
                    min="1"
                    value={creditForm.amount}
                    onChange={(e) => setCreditForm({ ...creditForm, amount: e.target.value })}
                    placeholder="100"
                    required
                    className="w-full py-2.5 px-3 border border-slate-700 bg-slate-950 rounded-xl text-sm font-mono font-bold text-amber-400 outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">Notes</label>
                  <textarea
                    value={creditForm.notes}
                    onChange={(e) => setCreditForm({ ...creditForm, notes: e.target.value })}
                    placeholder="e.g. Regular customer, will settle tomorrow"
                    rows={2}
                    className="w-full py-2 px-3 border border-slate-700 bg-slate-950 rounded-xl text-xs text-white outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingCredit}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submittingCredit ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                  Record Credit Reload
                </button>
              </form>
            </div>
          )}
        </div>

        {/* ── Footer Actions ──────────────────────────────────────────────── */}
        <div className="p-4 bg-slate-950 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 border-t border-slate-800">
          <div className="text-xs text-slate-400 font-medium">
            Total Net Impact: <span className="text-emerald-400 font-black text-sm">Rs. {totalNetImpact.toLocaleString()}</span> (Includes 4% Commission)
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
            >
              <Printer size={16} /> Print Slip
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 transition-all cursor-pointer"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Daily Sheet &amp; Sync
            </button>
          </div>
        </div>

      </div>

      {/* ── POPUP MODAL 1: ADD RELOAD FLOAT FORM ─────────────────────────── */}
      {showAddReloadModal && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-150">
          <div className="bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-700 p-6 space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  <Smartphone size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">+ Add Reload Float</h3>
                  <p className="text-xs text-slate-400">Record new float added today</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddReloadModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddReloadFloatSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Select Machine / Operator *</label>
                <select
                  value={addReloadForm.operatorName}
                  onChange={(e) => setAddReloadForm({ ...addReloadForm, operatorName: e.target.value })}
                  className="w-full py-2.5 px-3 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-indigo-500 bg-slate-950"
                >
                  <option value="Dialog E-Reload">Dialog E-Reload</option>
                  <option value="Mobitel E-Reload">Mobitel E-Reload</option>
                  <option value="Airtel E-Reload">Airtel E-Reload</option>
                  <option value="Hutch Ez-Reload">Hutch Ez-Reload</option>
                  <option value="Ez-Cash Wallet">Ez-Cash Wallet</option>
                  <option value="M-Cash Wallet">M-Cash Wallet</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Added Float Amount (Rs.) *</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  placeholder="e.g. 5000"
                  value={addReloadForm.amount}
                  onChange={(e) => setAddReloadForm({ ...addReloadForm, amount: e.target.value })}
                  className="w-full py-2.5 px-3 border border-slate-700 rounded-xl text-sm font-mono font-black text-emerald-400 outline-none focus:border-indigo-500 bg-slate-950"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Notes / Distributor Info</label>
                <input
                  type="text"
                  placeholder="e.g. Cash payment / Bank transfer"
                  value={addReloadForm.notes}
                  onChange={(e) => setAddReloadForm({ ...addReloadForm, notes: e.target.value })}
                  className="w-full py-2 px-3 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-indigo-500 bg-slate-950"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddReloadModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus size={15} /> Add to Float
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── POPUP MODAL 2: ADD CARD STOCK FORM ───────────────────────────── */}
      {showAddCardModal && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-150">
          <div className="bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-700 p-6 space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">+ Add Card Stock</h3>
                  <p className="text-xs text-slate-400">Record scratch cards received today</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCardModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddCardStockSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Select Network *</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {['Dialog', 'Mobitel', 'Airtel', 'Hutch'].map((net) => (
                    <button
                      key={net}
                      type="button"
                      onClick={() => setAddCardForm({ ...addCardForm, network: net })}
                      className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        addCardForm.network === net
                          ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                          : 'bg-slate-950 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {net}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Card Denomination (Value) *</label>
                <select
                  value={addCardForm.cardValue}
                  onChange={(e) => setAddCardForm({ ...addCardForm, cardValue: e.target.value })}
                  className="w-full py-2.5 px-3 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-rose-500 bg-slate-950"
                >
                  <option value="50">Rs. 50 Card</option>
                  <option value="100">Rs. 100 Card</option>
                  <option value="200">Rs. 200 Card</option>
                  <option value="500">Rs. 500 Card</option>
                  <option value="1000">Rs. 1000 Card</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Added Quantity (Pieces) *</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  placeholder="e.g. 50 pcs"
                  value={addCardForm.quantity}
                  onChange={(e) => setAddCardForm({ ...addCardForm, quantity: e.target.value })}
                  className="w-full py-2.5 px-3 border border-slate-700 rounded-xl text-sm font-mono font-black text-rose-400 outline-none focus:border-rose-500 bg-slate-950"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Notes / Batch No</label>
                <input
                  type="text"
                  placeholder="e.g. Received from Dialog distributor"
                  value={addCardForm.notes}
                  onChange={(e) => setAddCardForm({ ...addCardForm, notes: e.target.value })}
                  className="w-full py-2 px-3 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-rose-500 bg-slate-950"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCardModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus size={15} /> Add to Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ReloadModal;
