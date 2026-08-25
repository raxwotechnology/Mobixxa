'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Smartphone, CheckCircle, Loader2, Calendar, Printer, Save, TrendingUp, ShieldCheck } from 'lucide-react';
import { createReload, getReloadStocks, saveReloadDailySheet, saveReloadSheetApi, getTodayReloadSheetApi } from '../../services/api';
import { toast } from 'react-toastify';

// Operator defaults with commission rates
const DEFAULT_RELOAD_ITEMS = [
  { operatorName: 'Dialog Reload Float',     color: '#e11d48', tag: 'E-Reload', commissionRate: 4, cardValue: 1 },
  { operatorName: 'Mobitel Reload Float',    color: '#059669', tag: 'E-Reload', commissionRate: 4, cardValue: 1 },
  { operatorName: 'Airtel E-Reload Float',   color: '#ef4444', tag: 'E-Reload', commissionRate: 5, cardValue: 1 },
  { operatorName: 'Hutch Ez-Reload Float',   color: '#f59e0b', tag: 'E-Reload', commissionRate: 5, cardValue: 1 },
  { operatorName: 'Ez-Cash Float / Wallet',  color: '#0284c7', tag: 'Wallet',   commissionRate: 2, cardValue: 1 },
  { operatorName: 'M-Cash Float / Wallet',   color: '#8b5cf6', tag: 'Wallet',   commissionRate: 2, cardValue: 1 },
  { operatorName: 'Scratch Cards (Dialog)',   color: '#e11d48', tag: 'Cards',    commissionRate: 0, cardValue: 100 },
  { operatorName: 'Scratch Cards (Mobitel)', color: '#059669', tag: 'Cards',    commissionRate: 0, cardValue: 100 },
];

// Legacy operator name map for ReloadStock backward compat
const LEGACY_OPERATOR_MAP = {
  Dialog:  'Dialog Reload Float',
  Mobitel: 'Mobitel Reload Float',
  Airtel:  'Airtel E-Reload Float',
  Hutch:   'Hutch Ez-Reload Float',
  EzCash:  'Ez-Cash Float / Wallet',
  mCash:   'M-Cash Float / Wallet',
};

const makeDefaultRow = (item) => ({
  operatorName: item.operatorName, color: item.color, tag: item.tag,
  cardValue: item.cardValue, commissionRate: item.commissionRate,
  openingStock: '', addedToday: '', eveningInHand: '',
});

// ─────────────────────────────────────────────────────────────────────────────
const ReloadModal = ({ isOpen, onClose, storeId, accountId, onSyncSuccess }) => {
  const [modalTab,         setModalTab]        = useState('sheet');
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
      // Primary: new ReloadSheet endpoint
      const todayRes = await getTodayReloadSheetApi(storeId ? { storeId, date: stockDate } : { date: stockDate });
      const todayData = todayRes?.data;
      setDataSource(todayData?.source || 'empty');

      if (todayData?.data && Array.isArray(todayData.data.operators) && todayData.data.operators.length > 0) {
        const stored = todayData.data.operators;
        const merged = DEFAULT_RELOAD_ITEMS.map((template) => {
          const found = stored.find((s) => s.operatorName === template.operatorName);
          if (found) {
            return {
              operatorName: found.operatorName, color: template.color, tag: template.tag,
              cardValue: template.cardValue, commissionRate: found.commissionRate ?? template.commissionRate,
              openingStock: found.openingStock ?? '', addedToday: found.addedToday ?? '', eveningInHand: found.eveningInHand ?? '',
            };
          }
          return makeDefaultRow(template);
        });
        stored.forEach((s) => {
          if (!merged.some((m) => m.operatorName === s.operatorName)) {
            merged.push({
              operatorName: s.operatorName, color: '#64748b', tag: 'Other', cardValue: 1,
              commissionRate: s.commissionRate ?? 4, openingStock: s.openingStock ?? '',
              addedToday: s.addedToday ?? '', eveningInHand: s.eveningInHand ?? '',
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
            operatorName: template.operatorName, color: template.color, tag: template.tag,
            cardValue: template.cardValue, commissionRate: template.commissionRate,
            openingStock: found.openingStock ?? '', addedToday: found.addedStock ?? '', eveningInHand: closingVal ?? '',
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
  const handleCellChange = (index, field, value) => {
    setSheetRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value === '' ? '' : Math.max(0, Number(value) || 0) };
      return updated;
    });
  };

  // ── Live calculations (instant, no page reload) ────────────────────────────
  const calculatedTotals = useMemo(() => {
    let totalAddedToday = 0, totalEveningInHand = 0;
    let totalSoldOutRevenue = 0, totalCommissionAmount = 0, totalNetRevenue = 0;
    const rows = sheetRows.map((r) => {
      const openingStock    = Number(r.openingStock    === '' ? 0 : (r.openingStock    ?? 0));
      const addedToday      = Number(r.addedToday      === '' ? 0 : (r.addedToday      ?? 0));
      const totalFloat      = openingStock + addedToday;
      const eveningInHand   = (r.eveningInHand === '' || r.eveningInHand == null) ? totalFloat : Number(r.eveningInHand);
      const todaySoldOut    = Math.max(0, totalFloat - eveningInHand);
      const commissionRate  = Number(r.commissionRate ?? 4);
      const commissionAmount = Number(((todaySoldOut * commissionRate) / 100).toFixed(2));
      const netRevenue      = Number((todaySoldOut - commissionAmount).toFixed(2));
      totalAddedToday       += addedToday;
      totalEveningInHand    += eveningInHand;
      totalSoldOutRevenue   += todaySoldOut;
      totalCommissionAmount += commissionAmount;
      totalNetRevenue       += netRevenue;
      return {
        ...r, _openingStock: openingStock, _addedToday: addedToday, _totalFloat: totalFloat,
        _eveningInHand: eveningInHand, _todaySoldOut: todaySoldOut,
        _commissionRate: commissionRate, _commissionAmount: commissionAmount, _netRevenue: netRevenue,
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

  // ── Save sheet ─────────────────────────────────────────────────────────────
  const handleSaveDailySheet = async () => {
    try {
      setSavingSheet(true);
      const { rows } = calculatedTotals;

      // Primary: new ReloadSheet API (Sprint 3)
      const sheetPayload = {
        storeId, date: stockDate, syncToDrawer: true,
        operators: rows.map((r) => ({
          operatorName: r.operatorName, openingStock: r._openingStock,
          addedToday: r._addedToday, eveningInHand: r._eveningInHand, commissionRate: r._commissionRate,
        })),
      };
      const sheetRes = await saveReloadSheetApi(sheetPayload);

      // Secondary: legacy ReloadStock (backward compat for existing reports)
      try {
        await saveReloadDailySheet({
          storeId, date: stockDate,
          items: rows.map((r) => {
            const legacyOp = Object.entries(LEGACY_OPERATOR_MAP).find(([, v]) => v === r.operatorName)?.[0] || r.operatorName;
            return { operator: legacyOp, cardValue: r.cardValue || 1, openingStock: r._openingStock, addedStock: r._addedToday, closingStock: r._eveningInHand };
          }),
        });
      } catch (e) { console.warn('[ReloadModal] Legacy ReloadStock save (non-fatal):', e?.message); }

      toast.success(sheetRes.data?.message || 'Daily Reload Sheet saved and synced to cash drawer! 📊✅');
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
      .filter((r) => r._totalFloat > 0 || r._todaySoldOut > 0)
      .map((r) => {
        const name = r.operatorName.replace('Float', 'Flt').replace('Wallet', 'Wlt').replace('Scratch Cards', 'SC');
        return '<tr>' +
          '<td>' + name + '</td>' +
          '<td style="text-align:right">' + r._totalFloat.toLocaleString() + '</td>' +
          '<td style="text-align:right">' + r._eveningInHand.toLocaleString() + '</td>' +
          '<td style="text-align:right;font-weight:bold">' + r._todaySoldOut.toLocaleString() + '</td>' +
          '<td style="text-align:right">' + r._commissionRate + '%</td>' +
          '<td style="text-align:right;font-weight:bold">' + r._netRevenue.toLocaleString() + '</td>' +
          '</tr>';
      })
      .join('');

    const html = '<!DOCTYPE html><html><head><title>Reload Slip ' + stockDate + '</title>' +
      '<style>body{font-family:"Courier New",monospace;width:80mm;margin:0 auto;padding:6px 8px;font-size:10px}' +
      '.c{text-align:center}.r{text-align:right}.b{font-weight:bold}' +
      '.hdr{border-bottom:2px dashed #000;padding-bottom:6px;margin-bottom:8px}' +
      '.ttl{font-size:14px;font-weight:bold}.sub{font-size:10px;color:#444;margin-top:2px}' +
      '.lbl{font-size:9px;font-weight:bold;text-transform:uppercase;border-bottom:1px solid #000;padding-bottom:3px;margin:8px 0 5px}' +
      'table{width:100%;border-collapse:collapse;font-size:9px}th{border-bottom:1px solid #555;padding:2px 0;font-size:8px}td{padding:2px 0}' +
      '.div{border-top:1px dashed #000;margin:6px 0}' +
      '.box{border:2px solid #000;padding:6px 8px;margin:8px 0 4px;text-align:center}' +
      '.big{font-size:16px;font-weight:bold;margin:3px 0}' +
      '.ft{font-size:8px;text-align:center;margin-top:8px;border-top:1px dashed #000;padding-top:5px;color:#444}</style></head><body>' +
      '<div class="hdr c"><div class="ttl">DAILY RELOAD SELL-OUT SLIP</div>' +
      '<div class="sub">Reload &amp; Scratch Card Bookkeeping</div>' +
      '<div class="sub b">Date: ' + stockDate + ' | Printed: ' + printTime + '</div></div>' +
      '<div class="lbl">Operator Breakdown</div>' +
      '<table><thead><tr><th style="min-width:28mm">Operator</th><th class="r">Float</th><th class="r">Eve</th><th class="r">Sold</th><th class="r">Comm</th><th class="r">Net</th></tr></thead>' +
      '<tbody>' + bodyRows + '</tbody></table>' +
      '<div class="div"></div>' +
      '<div class="box"><div style="font-size:9px;font-weight:bold">TOTAL RELOAD SOLD-OUT REVENUE</div>' +
      '<div class="big">Rs. ' + totalSoldOutRevenue.toLocaleString('en-LK', { minimumFractionDigits: 2 }) + '</div>' +
      '<div class="div" style="border-color:#555;margin:4px 0"></div>' +
      '<table style="font-size:9px"><tr><td>Commission charged:</td><td class="r b">Rs. ' + totalCommissionAmount.toLocaleString('en-LK', { minimumFractionDigits: 2 }) + '</td></tr>' +
      '<tr><td>Net Revenue (shop keeps):</td><td class="r b">Rs. ' + totalNetRevenue.toLocaleString('en-LK', { minimumFractionDigits: 2 }) + '</td></tr></table></div>' +
      '<div class="ft"><div>SR Mobile POS — Reload Float Bookkeeping</div><div>Synced to cash drawer</div></div>' +
      '<scr' + 'ipt>window.onload=function(){window.print();window.close()};</scr' + 'ipt>' +
      '</body></html>';

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
      setModalTab('sheet');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record credit reload');
    } finally {
      setSubmittingCredit(false);
    }
  };

  if (!isOpen) return null;
  const { rows, totalAddedToday, totalEveningInHand, totalSoldOutRevenue, totalCommissionAmount, totalNetRevenue } = calculatedTotals;

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
                  Track float, distributor stock &amp; auto-calculate daily sell-out
                  {dataSource === 'yesterday' && <span className="ml-2 text-amber-300 font-semibold"> • Opening pre-filled from yesterday&apos;s closing</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700">
                <button type="button" onClick={() => setModalTab('sheet')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${modalTab === 'sheet' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                  📊 Daily Sheet
                </button>
                <button type="button" onClick={() => setModalTab('credit')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${modalTab === 'credit' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                  🏷️ Credit Reload
                </button>
              </div>
              {modalTab === 'sheet' && (
                <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700">
                  <Calendar size={14} className="text-slate-400" />
                  <input type="date" value={stockDate} onChange={(e) => setStockDate(e.target.value)}
                    className="bg-transparent text-xs text-white font-bold outline-none cursor-pointer" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-50/50 space-y-4">
          {modalTab === 'sheet' ? (
            <>
              {/* Summary Metric Cards */}
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
                  <div className="text-[10px] font-bold text-blue-100 uppercase tracking-wider">🎯 Total Sold-Out Revenue (Rs.)</div>
                  <div className="text-2xl font-black mt-0.5">Rs. {totalSoldOutRevenue.toLocaleString()}</div>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-sm">
                  <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Commission Charged</div>
                  <div className="text-lg font-black text-amber-700 mt-0.5">Rs. {totalCommissionAmount.toLocaleString()}</div>
                </div>
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-3.5 rounded-2xl text-white shadow-md">
                  <div className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider">💰 Net Revenue (Shop Keeps)</div>
                  <div className="text-2xl font-black mt-0.5">Rs. {totalNetRevenue.toLocaleString()}</div>
                </div>
              </div>

              {/* Balance Grid Table */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-3.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-indigo-600" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">In-Hand Reload &amp; Scratch Card Balance Grid</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                    Formula: <strong>(Opening + Added) &minus; Evening = Sold Out</strong>
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase text-[10px]">
                      <tr>
                        <th className="p-3 min-w-[180px]">Operator &amp; Scratch Card</th>
                        <th className="p-3 text-center min-w-[110px]">Opening Stock (Rs.)</th>
                        <th className="p-3 text-center min-w-[110px] text-emerald-700">(+) Added Today</th>
                        <th className="p-3 text-center min-w-[100px] bg-slate-100/50">Total Float</th>
                        <th className="p-3 text-center min-w-[120px] text-indigo-700">Evening In-Hand (Rs.)</th>
                        <th className="p-3 text-center min-w-[110px] text-emerald-700 bg-emerald-50/50">Today Sold Out</th>
                        <th className="p-3 text-center min-w-[75px] text-amber-700">Comm. %</th>
                        <th className="p-3 text-center min-w-[100px] text-amber-600 bg-amber-50/30">Commission (Rs.)</th>
                        <th className="p-3 text-right min-w-[110px] text-teal-700 bg-teal-50/30">Net Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loading ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-slate-400">
                            <Loader2 size={24} className="animate-spin mx-auto mb-2 text-indigo-600" />
                            Loading daily reload sheet...
                          </td>
                        </tr>
                      ) : rows.map((row, idx) => (
                        <tr key={row.operatorName} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                              <div>
                                <div className="font-bold text-slate-900 text-[13px]">{row.operatorName}</div>
                                <div className="text-[10px] text-slate-400 font-semibold">{row.tag}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-2 text-center">
                            <input type="number" min="0" onWheel={(e) => e.target.blur()}
                              value={row.openingStock === '' ? '' : row.openingStock}
                              onChange={(e) => handleCellChange(idx, 'openingStock', e.target.value)}
                              placeholder="0"
                              className="w-full text-center py-1.5 px-2 font-mono font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-indigo-500 outline-none" />
                          </td>
                          <td className="p-2 text-center">
                            <input type="number" min="0" onWheel={(e) => e.target.blur()}
                              value={row.addedToday === '' ? '' : row.addedToday}
                              onChange={(e) => handleCellChange(idx, 'addedToday', e.target.value)}
                              placeholder="0"
                              className="w-full text-center py-1.5 px-2 font-mono font-bold text-emerald-700 bg-emerald-50/40 border border-emerald-200 rounded-lg text-xs focus:bg-white focus:border-emerald-500 outline-none" />
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-slate-700 bg-slate-100/50">
                            Rs. {Number(row._totalFloat).toLocaleString()}
                          </td>
                          <td className="p-2 text-center">
                            <input type="number" min="0" onWheel={(e) => e.target.blur()}
                              value={row.eveningInHand === '' ? '' : row.eveningInHand}
                              onChange={(e) => handleCellChange(idx, 'eveningInHand', e.target.value)}
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
                                onChange={(e) => handleCellChange(idx, 'commissionRate', e.target.value)}
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
            </>
          ) : (
            /* Credit Reload Tab */
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Customer Mobile Number *</label>
                    <input type="tel" required value={creditFormData.mobileNumber}
                      onChange={(e) => setCreditFormData({ ...creditFormData, mobileNumber: e.target.value })}
                      placeholder="0771234567" className="w-full p-2.5 text-sm font-semibold border border-slate-200 rounded-xl outline-none focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Customer Name (Optional)</label>
                    <input type="text" value={creditFormData.customerName}
                      onChange={(e) => setCreditFormData({ ...creditFormData, customerName: e.target.value })}
                      placeholder="e.g. Kamal" className="w-full p-2.5 text-sm font-semibold border border-slate-200 rounded-xl outline-none focus:border-amber-500" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Reload Amount (Rs.) *</label>
                  <input type="number" required value={creditFormData.amount}
                    onChange={(e) => setCreditFormData({ ...creditFormData, amount: e.target.value })}
                    placeholder="Enter amount (e.g. 500)"
                    className="w-full p-3 text-lg font-black text-amber-700 border-2 border-amber-200 rounded-xl outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Note / Reference (Optional)</label>
                  <input type="text" value={creditFormData.notes}
                    onChange={(e) => setCreditFormData({ ...creditFormData, notes: e.target.value })}
                    placeholder="e.g. Promised to pay tomorrow"
                    className="w-full p-2 text-xs font-medium border border-slate-200 rounded-xl outline-none" />
                </div>
                <button type="submit" disabled={submittingCredit}
                  className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-black rounded-xl text-sm shadow-md hover:from-amber-700 hover:to-amber-800 transition-all flex items-center justify-center gap-2">
                  {submittingCredit ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                  Save Credit Reload Entry
                </button>
              </form>
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        {modalTab === 'sheet' && (
          <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span>
                Sell-Out of <strong>Rs. {totalSoldOutRevenue.toLocaleString()}</strong> will sync to POS cash drawer.{' '}
                <span className="text-teal-700 font-bold">Net Revenue: Rs. {totalNetRevenue.toLocaleString()}</span>
              </span>
            </div>
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button type="button" onClick={handlePrintDailySlip}
                className="flex-1 sm:flex-none px-4 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors">
                <Printer size={15} />
                🖨️ Print 80mm Slip
              </button>
              <button type="button" onClick={handleSaveDailySheet} disabled={savingSheet}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-extrabold rounded-xl text-xs shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-60">
                {savingSheet
                  ? <><Loader2 size={16} className="animate-spin" />Saving...</>
                  : <><Save size={16} />💾 Save &amp; Sync to Cash Drawer</>
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReloadModal;
