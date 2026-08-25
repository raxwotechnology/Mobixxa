'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Smartphone, CheckCircle, Loader2, Calendar, Printer, Save, TrendingUp, CreditCard, DollarSign, Layers } from 'lucide-react';
import { createReload, getReloadStocks, saveReloadDailySheet, saveReloadSheetApi, getTodayReloadSheetApi } from '../../services/api';
import { toast } from 'react-toastify';

// Operator defaults with commission rates (4% default for Scratch Cards & E-Reload)
const DEFAULT_RELOAD_ITEMS = [
  // ── E-Reload Machine Floats ────────────────────────────────────────────────
  { operatorName: 'Dialog E-Reload Float',     network: 'Dialog',  color: '#e11d48', tag: 'E-Reload', commissionRate: 4, cardValue: 1 },
  { operatorName: 'Mobitel E-Reload Float',    network: 'Mobitel', color: '#059669', tag: 'E-Reload', commissionRate: 4, cardValue: 1 },
  { operatorName: 'Airtel E-Reload Float',     network: 'Airtel',  color: '#ef4444', tag: 'E-Reload', commissionRate: 4, cardValue: 1 },
  { operatorName: 'Hutch Ez-Reload Float',     network: 'Hutch',   color: '#f59e0b', tag: 'E-Reload', commissionRate: 4, cardValue: 1 },
  { operatorName: 'Ez-Cash Float / Wallet',    network: 'Dialog',  color: '#0284c7', tag: 'Wallet',   commissionRate: 2, cardValue: 1 },
  { operatorName: 'M-Cash Float / Wallet',     network: 'Mobitel', color: '#8b5cf6', tag: 'Wallet',   commissionRate: 2, cardValue: 1 },

  // ── Dialog Scratch Cards ──────────────────────────────────────────────────
  { operatorName: 'Dialog Scratch Card (Rs. 50)',   network: 'Dialog',  color: '#e11d48', tag: 'Scratch Card', commissionRate: 4, cardValue: 50 },
  { operatorName: 'Dialog Scratch Card (Rs. 100)',  network: 'Dialog',  color: '#e11d48', tag: 'Scratch Card', commissionRate: 4, cardValue: 100 },
  { operatorName: 'Dialog Scratch Card (Rs. 200)',  network: 'Dialog',  color: '#e11d48', tag: 'Scratch Card', commissionRate: 4, cardValue: 200 },
  { operatorName: 'Dialog Scratch Card (Rs. 500)',  network: 'Dialog',  color: '#e11d48', tag: 'Scratch Card', commissionRate: 4, cardValue: 500 },
  { operatorName: 'Dialog Scratch Card (Rs. 1000)', network: 'Dialog',  color: '#e11d48', tag: 'Scratch Card', commissionRate: 4, cardValue: 1000 },

  // ── Mobitel Scratch Cards ─────────────────────────────────────────────────
  { operatorName: 'Mobitel Scratch Card (Rs. 50)',   network: 'Mobitel', color: '#059669', tag: 'Scratch Card', commissionRate: 4, cardValue: 50 },
  { operatorName: 'Mobitel Scratch Card (Rs. 100)',  network: 'Mobitel', color: '#059669', tag: 'Scratch Card', commissionRate: 4, cardValue: 100 },
  { operatorName: 'Mobitel Scratch Card (Rs. 200)',  network: 'Mobitel', color: '#059669', tag: 'Scratch Card', commissionRate: 4, cardValue: 200 },
  { operatorName: 'Mobitel Scratch Card (Rs. 500)',  network: 'Mobitel', color: '#059669', tag: 'Scratch Card', commissionRate: 4, cardValue: 500 },
  { operatorName: 'Mobitel Scratch Card (Rs. 1000)', network: 'Mobitel', color: '#059669', tag: 'Scratch Card', commissionRate: 4, cardValue: 1000 },

  // ── Airtel Scratch Cards ──────────────────────────────────────────────────
  { operatorName: 'Airtel Scratch Card (Rs. 50)',   network: 'Airtel',  color: '#ef4444', tag: 'Scratch Card', commissionRate: 4, cardValue: 50 },
  { operatorName: 'Airtel Scratch Card (Rs. 100)',  network: 'Airtel',  color: '#ef4444', tag: 'Scratch Card', commissionRate: 4, cardValue: 100 },
  { operatorName: 'Airtel Scratch Card (Rs. 200)',  network: 'Airtel',  color: '#ef4444', tag: 'Scratch Card', commissionRate: 4, cardValue: 200 },
  { operatorName: 'Airtel Scratch Card (Rs. 500)',  network: 'Airtel',  color: '#ef4444', tag: 'Scratch Card', commissionRate: 4, cardValue: 500 },

  // ── Hutch Scratch Cards ───────────────────────────────────────────────────
  { operatorName: 'Hutch Scratch Card (Rs. 50)',    network: 'Hutch',   color: '#f59e0b', tag: 'Scratch Card', commissionRate: 4, cardValue: 50 },
  { operatorName: 'Hutch Scratch Card (Rs. 100)',   network: 'Hutch',   color: '#f59e0b', tag: 'Scratch Card', commissionRate: 4, cardValue: 100 },
  { operatorName: 'Hutch Scratch Card (Rs. 200)',   network: 'Hutch',   color: '#f59e0b', tag: 'Scratch Card', commissionRate: 4, cardValue: 200 },
  { operatorName: 'Hutch Scratch Card (Rs. 500)',   network: 'Hutch',   color: '#f59e0b', tag: 'Scratch Card', commissionRate: 4, cardValue: 500 },
];

// Legacy operator map
const LEGACY_OPERATOR_MAP = {
  Dialog:  'Dialog E-Reload Float',
  Mobitel: 'Mobitel E-Reload Float',
  Airtel:  'Airtel E-Reload Float',
  Hutch:   'Hutch Ez-Reload Float',
  EzCash:  'Ez-Cash Float / Wallet',
  mCash:   'M-Cash Float / Wallet',
};

const makeDefaultRow = (item) => ({
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
  const [modalTab,         setModalTab]        = useState('ereload'); // 'ereload' | 'cards' | 'summary' | 'credit'
  const [cardNetworkFilter, setCardNetworkFilter] = useState('All');    // 'All' | 'Dialog' | 'Mobitel' | 'Airtel' | 'Hutch'
  const [stockDate,        setStockDate]        = useState(new Date().toISOString().split('T')[0]);
  const [loading,          setLoading]          = useState(false);
  const [savingSheet,      setSavingSheet]      = useState(false);
  const [sheetRows,        setSheetRows]        = useState(() => DEFAULT_RELOAD_ITEMS.map(makeDefaultRow));
  const [dataSource,       setDataSource]       = useState('empty');
  const [creditFormData,   setCreditFormData]   = useState({ mobileNumber: '', customerName: '', operator: 'Dialog', amount: '', notes: '' });
  const [submittingCredit, setSubmittingCredit] = useState(false);

  // ── Data loading ───────────────────────────────────────────────────────────
  const loadSheetData = async () => {
    try {
      setLoading(true);
      const todayRes = await getTodayReloadSheetApi(storeId ? { storeId, date: stockDate } : { date: stockDate });
      const todayData = todayRes?.data;
      setDataSource(todayData?.source || 'empty');

      if (todayData?.data && Array.isArray(todayData.data.operators) && todayData.data.operators.length > 0) {
        const stored = todayData.data.operators;
        const merged = DEFAULT_RELOAD_ITEMS.map((template) => {
          const found = stored.find((s) => s.operatorName === template.operatorName);
          if (found) {
            return {
              operatorName: found.operatorName,
              network: template.network,
              color: template.color,
              tag: template.tag,
              cardValue: template.cardValue,
              commissionRate: found.commissionRate ?? template.commissionRate,
              openingStock: found.openingStock ?? '',
              addedToday: found.addedToday ?? '',
              eveningInHand: found.eveningInHand ?? '',
            };
          }
          return makeDefaultRow(template);
        });
        stored.forEach((s) => {
          if (!merged.some((m) => m.operatorName === s.operatorName)) {
            merged.push({
              operatorName: s.operatorName,
              network: 'Other',
              color: '#64748b',
              tag: 'Other',
              cardValue: 1,
              commissionRate: s.commissionRate ?? 4,
              openingStock: s.openingStock ?? '',
              addedToday: s.addedToday ?? '',
              eveningInHand: s.eveningInHand ?? '',
            });
          }
        });
        setSheetRows(merged);
        return;
      }

      // Fallback: legacy ReloadStock
      const params = { date: stockDate, ...(storeId ? { storeId } : {}) };
      const { data: legacyData } = await getReloadStocks(params);
      const serverStocks = Array.isArray(legacyData) ? legacyData : [];
      const merged = DEFAULT_RELOAD_ITEMS.map((template) => {
        const legacyName = Object.entries(LEGACY_OPERATOR_MAP).find(([, v]) => v === template.operatorName)?.[0];
        const found = serverStocks.find(
          (s) => (s.operator === legacyName || s.operator === template.operatorName) && Number(s.cardValue || 1) === template.cardValue
        );
        if (found) {
          const closingVal = (found.closingStock !== undefined && found.closingStock !== null)
            ? found.closingStock : (found.openingStock + (found.addedStock || 0));
          return {
            operatorName: template.operatorName,
            network: template.network,
            color: template.color,
            tag: template.tag,
            cardValue: template.cardValue,
            commissionRate: template.commissionRate,
            openingStock: found.openingStock ?? '',
            addedToday: found.addedStock ?? '',
            eveningInHand: closingVal ?? '',
          };
        }
        return makeDefaultRow(template);
      });
      setSheetRows(merged);
    } catch (err) {
      console.error('Failed to fetch reload sheet data:', err);
      toast.error("Could not load today's reload data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isOpen) loadSheetData(); }, [isOpen, stockDate, storeId]); // eslint-disable-line

  // ── Cell changes ───────────────────────────────────────────────────────────
  const handleCellChange = (operatorName, field, value) => {
    setSheetRows((prev) => {
      return prev.map((row) => {
        if (row.operatorName === operatorName) {
          return { ...row, [field]: value === '' ? '' : Math.max(0, Number(value) || 0) };
        }
        return row;
      });
    });
  };

  // ── Live calculations (instant, no page reload) ────────────────────────────
  const calculatedTotals = useMemo(() => {
    let totalAddedToday = 0, totalEveningInHand = 0;
    let totalSoldOutRevenue = 0, totalCommissionAmount = 0, totalNetRevenue = 0;

    const rows = sheetRows.map((r) => {
      const isCard = r.tag === 'Scratch Card';
      const cardVal = r.cardValue || 1;

      const openingStock  = Number(r.openingStock  === '' ? 0 : (r.openingStock  ?? 0));
      const addedToday    = Number(r.addedToday    === '' ? 0 : (r.addedToday    ?? 0));
      const totalFloat    = openingStock + addedToday;
      const eveningInHand = (r.eveningInHand === '' || r.eveningInHand == null) ? totalFloat : Number(r.eveningInHand);

      // Sold Qty / Sold Amount
      const todaySoldQty = Math.max(0, totalFloat - eveningInHand);
      const todaySoldOut = isCard ? (todaySoldQty * cardVal) : todaySoldQty;

      // 4% Commission (Client Rule: Rs. 100 sold + 4% comm = 104 gross earned)
      const commissionRate   = Number(r.commissionRate ?? 4);
      const commissionAmount = Number(((todaySoldOut * commissionRate) / 100).toFixed(2));
      const netRevenue       = Number((todaySoldOut + commissionAmount).toFixed(2)); // Cash + 4% Comm

      totalAddedToday       += (isCard ? addedToday * cardVal : addedToday);
      totalEveningInHand    += (isCard ? eveningInHand * cardVal : eveningInHand);
      totalSoldOutRevenue   += todaySoldOut;
      totalCommissionAmount += commissionAmount;
      totalNetRevenue       += netRevenue;

      return {
        ...r,
        _openingStock: openingStock,
        _addedToday: addedToday,
        _totalFloat: totalFloat,
        _eveningInHand: eveningInHand,
        _todaySoldQty: todaySoldQty,
        _todaySoldOut: todaySoldOut,
        _commissionRate: commissionRate,
        _commissionAmount: commissionAmount,
        _netRevenue: netRevenue,
      };
    });

    return {
      rows,
      totalAddedToday:       Number(totalAddedToday.toFixed(2)),
      totalEveningInHand:    Number(totalEveningInHand.toFixed(2)),
      totalSoldOutRevenue:   Number(totalSoldOutRevenue.toFixed(2)),
      totalCommissionAmount: Number(totalCommissionAmount.toFixed(2)),
      totalNetRevenue:       Number(totalNetRevenue.toFixed(2)),
    };
  }, [sheetRows]);

  // Filtered rows by tab
  const ereloadRows = useMemo(() => calculatedTotals.rows.filter(r => r.tag === 'E-Reload' || r.tag === 'Wallet'), [calculatedTotals.rows]);
  const cardRows = useMemo(() => {
    return calculatedTotals.rows.filter(r => {
      if (r.tag !== 'Scratch Card') return false;
      if (cardNetworkFilter === 'All') return true;
      return r.network === cardNetworkFilter;
    });
  }, [calculatedTotals.rows, cardNetworkFilter]);

  // ── Save sheet ─────────────────────────────────────────────────────────────
  const handleSaveDailySheet = async () => {
    try {
      setSavingSheet(true);
      const { rows } = calculatedTotals;

      // Primary: new ReloadSheet API
      const sheetPayload = {
        storeId, date: stockDate, syncToDrawer: true,
        operators: rows.map((r) => ({
          operatorName: r.operatorName,
          openingStock: r._openingStock,
          addedToday: r._addedToday,
          eveningInHand: r._eveningInHand,
          commissionRate: r._commissionRate,
        })),
      };
      const sheetRes = await saveReloadSheetApi(sheetPayload);

      // Secondary: legacy ReloadStock
      try {
        await saveReloadDailySheet({
          storeId, date: stockDate,
          items: rows.map((r) => {
            const legacyOp = Object.entries(LEGACY_OPERATOR_MAP).find(([, v]) => v === r.operatorName)?.[0] || r.operatorName;
            return { operator: legacyOp, cardValue: r.cardValue || 1, openingStock: r._openingStock, addedStock: r._addedToday, closingStock: r._eveningInHand };
          }),
        });
      } catch (e) { console.warn('[ReloadModal] Legacy ReloadStock save (non-fatal):', e?.message); }

      toast.success(sheetRes.data?.message || 'Daily Reload & Scratch Card Sheet saved! 📊✅');
      loadSheetData();
      if (onSyncSuccess) onSyncSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save daily reload sheet');
    } finally {
      setSavingSheet(false);
    }
  };

  // ── 80mm thermal print ─────────────────────────────────────────────────────
  const handlePrintDailySlip = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) { toast.error('Popup blocked! Please allow popups to print.'); return; }
    const { rows, totalSoldOutRevenue, totalCommissionAmount, totalNetRevenue } = calculatedTotals;
    const printTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const bodyRows = rows
      .filter((r) => r._todaySoldOut > 0 || r._addedToday > 0)
      .map(
        (r) => `
        <tr>
          <td style="padding: 4px 0; border-bottom: 1px dashed #cbd5e1; font-weight: bold;">${r.operatorName}</td>
          <td style="text-align: center; padding: 4px 0; border-bottom: 1px dashed #cbd5e1;">${r.tag === 'Scratch Card' ? `${r._todaySoldQty} pcs` : `Rs.${r._todaySoldOut}`}</td>
          <td style="text-align: right; padding: 4px 0; border-bottom: 1px dashed #cbd5e1;">Rs.${r._commissionAmount}</td>
          <td style="text-align: right; padding: 4px 0; border-bottom: 1px dashed #cbd5e1; font-weight: bold;">Rs.${r._netRevenue}</td>
        </tr>`
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html><head><title>Reload & Card Sales Slip</title>
      <style>
        body { font-family: 'Courier New', monospace; width: 78mm; margin: 0 auto; padding: 10px; font-size: 11px; color: #000; }
        .text-center { text-align: center; } .text-right { text-align: right; }
        .bold { font-weight: bold; } .divider { border-top: 1px dashed #000; margin: 8px 0; }
        table { width: 100%; border-collapse: collapse; }
      </style></head>
      <body onload="window.print(); setTimeout(()=>window.close(), 500);">
        <div class="text-center bold" style="font-size: 14px;">SR MOBILE POS</div>
        <div class="text-center bold">DAILY RELOAD & SCRATCH CARD SHEET</div>
        <div class="text-center" style="font-size: 10px; margin-bottom: 8px;">Date: ${stockDate} | Time: ${printTime}</div>
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
            ${bodyRows || '<tr><td colspan="4" style="text-align:center; padding:10px;">No sales recorded today</td></tr>'}
          </tbody>
        </table>
        <div class="divider"></div>
        <table>
          <tr><td>Total Sold Value:</td><td class="text-right bold">Rs. ${totalSoldOutRevenue.toLocaleString()}</td></tr>
          <tr><td>(+) 4% Commission:</td><td class="text-right bold">Rs. ${totalCommissionAmount.toLocaleString()}</td></tr>
          <tr style="font-size: 12px;"><td class="bold">NET EARNED (104%):</td><td class="text-right bold">Rs. ${totalNetRevenue.toLocaleString()}</td></tr>
        </table>
        <div class="divider"></div>
        <div class="text-center" style="font-size: 9px; margin-top: 10px;">Printed via SR Mobile POS System</div>
      </body></html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // ── Credit reload submit ───────────────────────────────────────────────────
  const handleSubmitCreditReload = async (e) => {
    e.preventDefault();
    if (!creditFormData.mobileNumber || !creditFormData.amount) { toast.error('Please enter mobile number and amount'); return; }
    try {
      setSubmittingCredit(true);
      await createReload({ ...creditFormData, storeId, paymentMethod: 'Credit', type: 'Prepaid', accountId: null });
      toast.success('Credit Reload recorded successfully!');
      setCreditFormData({ mobileNumber: '', customerName: '', operator: 'Dialog', amount: '', notes: '' });
      setModalTab('ereload');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record credit reload');
    } finally {
      setSubmittingCredit(false);
    }
  };

  if (!isOpen) return null;
  const { totalAddedToday, totalEveningInHand, totalSoldOutRevenue, totalCommissionAmount, totalNetRevenue } = calculatedTotals;

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-5">
      <div className="bg-white w-full max-w-7xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[96vh] flex flex-col border border-slate-200">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="relative p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shrink-0">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors">
            <X size={20} />
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <Smartphone size={26} />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                  Reload &amp; Scratch Card Bookkeeping
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Live Sheet</span>
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Track E-Reload floats, Scratch Cards (Cards) &amp; Auto-calculate 4% Commission (100 Sold + 4 Comm = 104 Total)
                  {dataSource === 'yesterday' && <span className="ml-2 text-amber-300 font-semibold"> • Opening pre-filled from yesterday&apos;s closing</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Main Tabs */}
              <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700">
                <button type="button" onClick={() => setModalTab('ereload')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${modalTab === 'ereload' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                  <Smartphone size={14} /> 📲 E-Reload (Float)
                </button>
                <button type="button" onClick={() => setModalTab('cards')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${modalTab === 'cards' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                  <CreditCard size={14} /> 💳 Scratch Cards
                </button>
                <button type="button" onClick={() => setModalTab('summary')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${modalTab === 'summary' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                  <Layers size={14} /> 📊 Full Summary
                </button>
                <button type="button" onClick={() => setModalTab('credit')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${modalTab === 'credit' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                  🏷️ Credit Reload
                </button>
              </div>

              {/* Date Selector */}
              <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700">
                <Calendar size={14} className="text-slate-400" />
                <input type="date" value={stockDate} onChange={(e) => setStockDate(e.target.value)}
                  className="bg-transparent text-xs text-white font-bold outline-none cursor-pointer" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-50/50 space-y-4">
          
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">(+) Added Today (Rs.)</div>
              <div className="text-lg font-black text-emerald-600 mt-0.5">+ Rs. {totalAddedToday.toLocaleString()}</div>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Evening In-Hand (Rs.)</div>
              <div className="text-lg font-black text-slate-700 mt-0.5">Rs. {totalEveningInHand.toLocaleString()}</div>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-3.5 rounded-2xl text-white shadow-md">
              <div className="text-[10px] font-bold text-blue-100 uppercase tracking-wider">🎯 Total Sold Value</div>
              <div className="text-2xl font-black mt-0.5">Rs. {totalSoldOutRevenue.toLocaleString()}</div>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-sm">
              <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">4% Commission Earned</div>
              <div className="text-lg font-black text-amber-700 mt-0.5">+ Rs. {totalCommissionAmount.toLocaleString()}</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-3.5 rounded-2xl text-white shadow-md">
              <div className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider">💰 Net Revenue (104%)</div>
              <div className="text-2xl font-black mt-0.5">Rs. {totalNetRevenue.toLocaleString()}</div>
            </div>
          </div>

          {/* TAB 1: E-Reload Machine Floats */}
          {modalTab === 'ereload' && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-3.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone size={18} className="text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">📲 E-Reload Machine Float Balance</span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                  Formula: <strong>(Opening Float + Added) &minus; Evening In-Hand = Sold Out</strong>
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase text-[10px]">
                    <tr>
                      <th className="p-3 min-w-[200px]">Operator / Machine</th>
                      <th className="p-3 text-center min-w-[120px]">Opening Float (Rs.)</th>
                      <th className="p-3 text-center min-w-[120px] text-emerald-700">(+) Added Float</th>
                      <th className="p-3 text-center min-w-[110px] bg-slate-100/50">Total Float</th>
                      <th className="p-3 text-center min-w-[130px] text-indigo-700">Evening In-Hand (Rs.)</th>
                      <th className="p-3 text-center min-w-[120px] text-emerald-700 bg-emerald-50/50">Today Sold Out</th>
                      <th className="p-3 text-center min-w-[80px] text-amber-700">Comm. %</th>
                      <th className="p-3 text-center min-w-[110px] text-amber-600 bg-amber-50/30">4% Comm. (Rs.)</th>
                      <th className="p-3 text-right min-w-[120px] text-teal-700 bg-teal-50/30">Total Net Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-400">
                          <Loader2 size={24} className="animate-spin mx-auto mb-2 text-indigo-600" />
                          Loading E-Reload float balance...
                        </td>
                      </tr>
                    ) : ereloadRows.map((row) => (
                      <tr key={row.operatorName} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                            <div>
                              <div className="font-black text-slate-900 text-[13px]">{row.operatorName}</div>
                              <div className="text-[10px] text-slate-400 font-semibold">{row.tag}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-2 text-center">
                          <input type="number" min="0" onWheel={(e) => e.target.blur()}
                            value={row.openingStock === '' ? '' : row.openingStock}
                            onChange={(e) => handleCellChange(row.operatorName, 'openingStock', e.target.value)}
                            placeholder="0"
                            className="w-full text-center py-1.5 px-2 font-mono font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-indigo-500 outline-none" />
                        </td>
                        <td className="p-2 text-center">
                          <input type="number" min="0" onWheel={(e) => e.target.blur()}
                            value={row.addedToday === '' ? '' : row.addedToday}
                            onChange={(e) => handleCellChange(row.operatorName, 'addedToday', e.target.value)}
                            placeholder="0"
                            className="w-full text-center py-1.5 px-2 font-mono font-bold text-emerald-700 bg-emerald-50/40 border border-emerald-200 rounded-lg text-xs focus:bg-white focus:border-emerald-500 outline-none" />
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-slate-700 bg-slate-100/50">
                          Rs. {Number(row._totalFloat).toLocaleString()}
                        </td>
                        <td className="p-2 text-center">
                          <input type="number" min="0" onWheel={(e) => e.target.blur()}
                            value={row.eveningInHand === '' ? '' : row.eveningInHand}
                            onChange={(e) => handleCellChange(row.operatorName, 'eveningInHand', e.target.value)}
                            placeholder="0"
                            className="w-full text-center py-1.5 px-2 font-mono font-black text-indigo-800 bg-indigo-50/40 border border-indigo-200 rounded-lg text-xs focus:bg-white focus:border-indigo-500 outline-none" />
                        </td>
                        <td className="p-3 text-center font-mono font-black text-emerald-600 text-sm bg-emerald-50/50">
                          Rs. {Number(row._todaySoldOut).toLocaleString()}
                        </td>
                        <td className="p-2 text-center">
                          <div className="flex items-center justify-center gap-0.5">
                            <input type="number" min="0" max="100" step="0.5" onWheel={(e) => e.target.blur()}
                              value={row.commissionRate}
                              onChange={(e) => handleCellChange(row.operatorName, 'commissionRate', e.target.value)}
                              className="w-12 text-center py-1.5 px-1 font-mono font-bold text-amber-700 bg-amber-50/40 border border-amber-200 rounded-lg text-xs focus:bg-white focus:border-amber-500 outline-none" />
                            <span className="text-[10px] text-amber-600 font-bold">%</span>
                          </div>
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-amber-700 bg-amber-50/30">
                          Rs. {Number(row._commissionAmount).toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-mono font-black text-teal-700 text-sm bg-teal-50/30">
                          Rs. {Number(row._netRevenue).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Scratch Cards */}
          {modalTab === 'cards' && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden space-y-3 p-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard size={18} className="text-rose-600" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">💳 Scratch Card Inventory (By Network &amp; Card Value)</span>
                </div>

                {/* Network Filters */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  {['All', 'Dialog', 'Mobitel', 'Airtel', 'Hutch'].map((net) => (
                    <button key={net} type="button" onClick={() => setCardNetworkFilter(net)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${cardNetworkFilter === net ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
                      {net}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase text-[10px]">
                    <tr>
                      <th className="p-3 min-w-[210px]">Scratch Card Item</th>
                      <th className="p-3 text-center min-w-[90px]">Card Value</th>
                      <th className="p-3 text-center min-w-[110px]">Opening (Pcs)</th>
                      <th className="p-3 text-center min-w-[110px] text-emerald-700">(+) Added (Pcs)</th>
                      <th className="p-3 text-center min-w-[120px] text-indigo-700">Evening In-Hand (Pcs)</th>
                      <th className="p-3 text-center min-w-[100px] text-emerald-700 bg-emerald-50/50">Sold (Pcs)</th>
                      <th className="p-3 text-center min-w-[120px] text-blue-700 bg-blue-50/50">Gross Sold (Rs.)</th>
                      <th className="p-3 text-center min-w-[100px] text-amber-600 bg-amber-50/30">4% Comm (Rs.)</th>
                      <th className="p-3 text-right min-w-[120px] text-teal-700 bg-teal-50/30">Total Net Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-400">
                          <Loader2 size={24} className="animate-spin mx-auto mb-2 text-rose-600" />
                          Loading scratch card stock...
                        </td>
                      </tr>
                    ) : cardRows.map((row) => (
                      <tr key={row.operatorName} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                            <div>
                              <div className="font-black text-slate-900 text-[13px]">{row.operatorName}</div>
                              <div className="text-[10px] text-slate-400 font-semibold">{row.network} Network</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-700">
                          Rs. {row.cardValue}
                        </td>
                        <td className="p-2 text-center">
                          <input type="number" min="0" onWheel={(e) => e.target.blur()}
                            value={row.openingStock === '' ? '' : row.openingStock}
                            onChange={(e) => handleCellChange(row.operatorName, 'openingStock', e.target.value)}
                            placeholder="0"
                            className="w-full text-center py-1.5 px-2 font-mono font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-indigo-500 outline-none" />
                        </td>
                        <td className="p-2 text-center">
                          <input type="number" min="0" onWheel={(e) => e.target.blur()}
                            value={row.addedToday === '' ? '' : row.addedToday}
                            onChange={(e) => handleCellChange(row.operatorName, 'addedToday', e.target.value)}
                            placeholder="0"
                            className="w-full text-center py-1.5 px-2 font-mono font-bold text-emerald-700 bg-emerald-50/40 border border-emerald-200 rounded-lg text-xs focus:bg-white focus:border-emerald-500 outline-none" />
                        </td>
                        <td className="p-2 text-center">
                          <input type="number" min="0" onWheel={(e) => e.target.blur()}
                            value={row.eveningInHand === '' ? '' : row.eveningInHand}
                            onChange={(e) => handleCellChange(row.operatorName, 'eveningInHand', e.target.value)}
                            placeholder="0"
                            className="w-full text-center py-1.5 px-2 font-mono font-black text-indigo-800 bg-indigo-50/40 border border-indigo-200 rounded-lg text-xs focus:bg-white focus:border-indigo-500 outline-none" />
                        </td>
                        <td className="p-3 text-center font-mono font-black text-emerald-700 bg-emerald-50/50 text-sm">
                          {row._todaySoldQty} pcs
                        </td>
                        <td className="p-3 text-center font-mono font-black text-blue-700 bg-blue-50/50">
                          Rs. {Number(row._todaySoldOut).toLocaleString()}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-amber-700 bg-amber-50/30">
                          + Rs. {Number(row._commissionAmount).toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-mono font-black text-teal-700 text-sm bg-teal-50/30">
                          Rs. {Number(row._netRevenue).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Full Summary */}
          {modalTab === 'summary' && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-900">📊 Full Daily Reload &amp; Scratch Card Summary</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Combined breakdown of E-Reload floats and Physical Scratch Cards with 4% Commission totals.</p>
                </div>
                <button type="button" onClick={handlePrintDailySlip}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-md">
                  <Printer size={15} /> Print 80mm Slip
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="text-xs font-bold text-slate-500 uppercase">E-Reload Float Sales</div>
                  <div className="text-xl font-black text-slate-900 mt-1">
                    Rs. {ereloadRows.reduce((acc, r) => acc + r._todaySoldOut, 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="text-xs font-bold text-slate-500 uppercase">Scratch Cards Gross Sales</div>
                  <div className="text-xl font-black text-slate-900 mt-1">
                    Rs. {calculatedTotals.rows.filter(r => r.tag === 'Scratch Card').reduce((acc, r) => acc + r._todaySoldOut, 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
                  <div className="text-xs font-bold text-emerald-700 uppercase">Total Shop Earnings (104%)</div>
                  <div className="text-2xl font-black text-emerald-700 mt-1">
                    Rs. {totalNetRevenue.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Item</th>
                      <th className="p-3 text-center">Tag</th>
                      <th className="p-3 text-center">Sold</th>
                      <th className="p-3 text-center">Gross Sales</th>
                      <th className="p-3 text-center">4% Commission</th>
                      <th className="p-3 text-right">Net Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {calculatedTotals.rows.filter(r => r._todaySoldOut > 0 || r._addedToday > 0).map((r) => (
                      <tr key={r.operatorName} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-800">{r.operatorName}</td>
                        <td className="p-3 text-center"><span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">{r.tag}</span></td>
                        <td className="p-3 text-center font-mono">{r.tag === 'Scratch Card' ? `${r._todaySoldQty} pcs` : `Rs.${r._todaySoldOut}`}</td>
                        <td className="p-3 text-center font-mono font-bold text-slate-700">Rs. {r._todaySoldOut.toLocaleString()}</td>
                        <td className="p-3 text-center font-mono text-amber-700 font-bold">+ Rs. {r._commissionAmount.toLocaleString()}</td>
                        <td className="p-3 text-right font-mono font-black text-teal-700">Rs. {r._netRevenue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Credit Reload Tab */}
          {modalTab === 'credit' && (
            <div className="max-w-xl mx-auto bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900">🏷️ Record Credit Reload</h3>
                <p className="text-xs text-slate-500 mt-1">Log reload given to a customer on credit without adding cash to drawer float.</p>
              </div>
              <form onSubmit={handleSubmitCreditReload} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Select Operator *</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['Dialog', 'Mobitel', 'Airtel', 'Hutch'].map((op) => (
                      <button key={op} type="button" onClick={() => setCreditFormData({ ...creditFormData, operator: op })}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${creditFormData.operator === op ? 'bg-amber-500 text-white border-amber-600 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}>
                        {op}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Mobile Number *</label>
                  <input type="text" value={creditFormData.mobileNumber} onChange={(e) => setCreditFormData({ ...creditFormData, mobileNumber: e.target.value })}
                    placeholder="0771234567" required
                    className="w-full py-2.5 px-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Customer Name (Optional)</label>
                  <input type="text" value={creditFormData.customerName} onChange={(e) => setCreditFormData({ ...creditFormData, customerName: e.target.value })}
                    placeholder="Name or NIC"
                    className="w-full py-2.5 px-3 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Reload Amount (Rs.) *</label>
                  <input type="number" min="1" value={creditFormData.amount} onChange={(e) => setCreditFormData({ ...creditFormData, amount: e.target.value })}
                    placeholder="100" required
                    className="w-full py-2.5 px-3 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Notes / Reason</label>
                  <textarea value={creditFormData.notes} onChange={(e) => setCreditFormData({ ...creditFormData, notes: e.target.value })}
                    placeholder="e.g. Regular customer, will pay tomorrow" rows={2}
                    className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-amber-500" />
                </div>
                <button type="submit" disabled={submittingCredit}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2">
                  {submittingCredit ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                  Record Credit Reload
                </button>
              </form>
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 border-t border-slate-800">
          <div className="text-xs text-slate-400 font-medium">
            Total Net Value Added to Cash Drawer: <span className="text-emerald-400 font-bold text-sm">Rs. {totalNetRevenue.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button type="button" onClick={handlePrintDailySlip}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition-colors">
              <Printer size={16} /> Print Slip
            </button>
            <button type="button" onClick={handleSaveDailySheet} disabled={savingSheet}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all">
              {savingSheet ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Daily Sheet &amp; Sync Cash
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReloadModal;
