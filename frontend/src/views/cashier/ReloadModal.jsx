'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Smartphone, CheckCircle, Loader2, Calendar, Printer, Lock,
  TrendingUp, CreditCard, Layers, Plus, DollarSign, Sparkles,
  Check, ArrowUpRight, ShieldCheck, RefreshCw, AlertCircle, Edit3, User, Phone
} from 'lucide-react';
import {
  createReload, getReloads, settleCreditReload, getReloadStocks,
  addReloadStock, closeReloadStock, adjustReloadStock
} from '../../services/api';
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
  stockId: null,
  status: 'open', // 'open' | 'closed' — locked once a closing is submitted
  openingStock: '',
  addedToday: '', // locked, server-derived sum of addLog entries — never typed directly
  eveningInHand: '',
  addLog: [],
});

// ─────────────────────────────────────────────────────────────────────────────
const ReloadModal = ({ isOpen, onClose, storeId, accountId, onSyncSuccess, userRole }) => {
  const [activeTab, setActiveTab] = useState('ereload'); // 'ereload' | 'cards' | 'summary' | 'credit'
  const [selectedNetwork, setSelectedNetwork] = useState('All'); // 'All' | 'Dialog' | 'Mobitel' | 'Airtel' | 'Hutch'
  const [stockDate, setStockDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState(() => OPERATORS_CONFIG.map(makeRowState));
  const canAdjust = userRole === 'admin' || userRole === 'manager';

  // Uncommitted In-Hand counts typed but not yet submitted as a closing —
  // keyed by operatorName. Kept separate from `rows` so a locked/closed
  // value can never be quietly retyped over.
  const [closingDraft, setClosingDraft] = useState({});
  const [closingBusy, setClosingBusy] = useState(null); // operatorName currently submitting

  // Admin/Manager-only correction of an already-closed item
  const [adjustTarget, setAdjustTarget] = useState(null); // row being adjusted, or null
  const [adjustValue, setAdjustValue] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [submittingAdjust, setSubmittingAdjust] = useState(false);

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

  // Credit Reload State & Ledger
  const [creditForm, setCreditForm] = useState({ mobileNumber: '', customerName: '', operator: 'Dialog', amount: '', notes: '' });
  const [submittingCredit, setSubmittingCredit] = useState(false);
  const [creditReloads, setCreditReloads] = useState([]);
  const [loadingCredits, setLoadingCredits] = useState(false);
  const [creditStatusFilter, setCreditStatusFilter] = useState('all'); // 'all' | 'pending' | 'paid'
  const [settleTarget, setSettleTarget] = useState(null); // credit entry pending confirmation, or null
  const [submittingSettle, setSubmittingSettle] = useState(false);

  // ── Data Fetching ──────────────────────────────────────────────────────────
  // Sole source of truth: getReloadStocks. It already carries the previous
  // day's closingStock forward as today's openingStock (backend-side) the
  // first time a date has no records yet, so Opening always reflects the
  // real running balance without this screen ever writing to it directly.
  const loadDailyData = async () => {
    try {
      setLoading(true);
      const { data } = await getReloadStocks({ date: stockDate, ...(storeId ? { storeId } : {}) });
      const serverStocks = Array.isArray(data) ? data : [];

      setRows(prev => prev.map(row => {
        // Exact operator-name match always wins. The legacy short-name
        // fallback (e.g. "Dialog" for "Dialog E-Reload") is only for items
        // that have never once been recorded under their real name — if
        // both happen to exist for this date, a plain .find() with an OR
        // condition would silently bind to whichever sorts first
        // alphabetically (the backend returns records operator-sorted),
        // which is almost always the legacy one, showing stale/wrong data
        // even though the real, correctly carried-forward record exists.
        const legacyName = Object.entries(LEGACY_MAP).find(([, v]) => v === row.operatorName)?.[0];
        const match = serverStocks.find(s => Number(s.cardValue || 1) === row.cardValue && s.operator === row.operatorName)
          || (legacyName ? serverStocks.find(s => Number(s.cardValue || 1) === row.cardValue && s.operator === legacyName) : undefined);
        if (!match) {
          // No record yet for this item today — nothing added, nothing closed.
          return { ...row, stockId: null, status: 'open', openingStock: 0, addedToday: 0, eveningInHand: '', addLog: [] };
        }
        return {
          ...row,
          stockId: match._id,
          status: match.status || 'open',
          openingStock: match.openingStock ?? 0,
          addedToday: match.addedStock ?? 0,
          eveningInHand: match.status === 'closed' ? (match.closingStock ?? 0) : '',
          addLog: match.addLog || [],
        };
      }));

      // Clear any stale unsubmitted drafts left over from a previous date/load.
      setClosingDraft({});
    } catch (err) {
      console.warn('Reload data fetch error:', err);
      toast.error('Failed to load reload & card stock for the selected date');
    } finally {
      setLoading(false);
    }
  };

  // ── Load Credit Reloads Ledger ─────────────────────────────────────────────
  const loadCreditReloads = async () => {
    try {
      setLoadingCredits(true);
      const { data } = await getReloads({
        isCredit: true,
        date: stockDate,
        ...(storeId ? { storeId } : {}),
      });
      setCreditReloads(Array.isArray(data) ? data : (data?.data || []));
    } catch (err) {
      console.warn('Failed to load credit reloads:', err);
    } finally {
      setLoadingCredits(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDailyData();
      if (activeTab === 'credit') loadCreditReloads();
    }
  }, [isOpen, stockDate, storeId, activeTab]); // eslint-disable-line

  // ── In-Hand draft entry (uncommitted until "Submit Closing") ───────────────
  const handleClosingDraftChange = (operatorName, val) => {
    setClosingDraft(prev => ({ ...prev, [operatorName]: val === '' ? '' : Math.max(0, Number(val) || 0) }));
  };

  // ── Add Stock: persists immediately as a log entry via the backend; the
  //     running total shown on the card is always server-derived afterward. ──
  const submitAddStock = async ({ operatorName, network, color, bgLight, border, tag, cardValue, commissionRate, qty, notes }) => {
    // addReloadStock responds { success, data: stockItem } — unwrap fully.
    const { data: { data } } = await addReloadStock({
      storeId,
      operator: operatorName,
      cardValue,
      qty,
      notes,
      date: stockDate,
    });

    setRows(prev => {
      const exists = prev.some(r => r.operatorName === operatorName && r.cardValue === cardValue);
      if (exists) {
        return prev.map(r => (r.operatorName === operatorName && r.cardValue === cardValue)
          ? { ...r, stockId: data._id, status: data.status, openingStock: data.openingStock, addedToday: data.addedStock, addLog: data.addLog || [] }
          : r);
      }
      return [...prev, {
        id: `custom_${Date.now()}`,
        operatorName, network, color, bgLight, border, tag, cardValue, commissionRate,
        stockId: data._id, status: data.status, openingStock: data.openingStock,
        addedToday: data.addedStock, eveningInHand: '', addLog: data.addLog || [],
      }];
    });
  };

  // ── Quick Add Reload Float Modal Submit ─────────────────────────────────────
  const handleAddReloadFloatSubmit = async (e) => {
    e.preventDefault();
    const amountVal = Number(addReloadForm.amount);
    if (!addReloadForm.amount || !Number.isFinite(amountVal) || amountVal <= 0) {
      toast.error('Please enter a valid float amount');
      return;
    }
    try {
      await submitAddStock({
        operatorName: addReloadForm.operatorName,
        network: 'Other', color: '#6366f1', bgLight: '#eef2ff', border: '#c7d2fe',
        tag: 'E-Reload', cardValue: 1, commissionRate: 4,
        qty: amountVal, notes: addReloadForm.notes,
      });
      toast.success(`+ Rs. ${amountVal.toLocaleString()} float added to ${addReloadForm.operatorName}! 📲`);
      setAddReloadForm({ operatorName: 'Dialog E-Reload', amount: '', notes: '' });
      setShowAddReloadModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add stock');
    }
  };

  // ── Quick Add Card Stock Modal Submit ───────────────────────────────────────
  const handleAddCardStockSubmit = async (e) => {
    e.preventDefault();
    const qtyVal = Number(addCardForm.quantity);
    const cardVal = Number(addCardForm.cardValue);
    if (!addCardForm.cardValue || !Number.isFinite(cardVal) || cardVal <= 0) {
      toast.error('Please enter a valid card denomination amount (e.g. 159)');
      return;
    }
    if (!qtyVal || qtyVal <= 0) {
      toast.error('Please enter valid quantity');
      return;
    }
    const netColors = { Dialog: '#e11d48', Mobitel: '#059669', Airtel: '#ef4444', Hutch: '#f59e0b' };
    try {
      await submitAddStock({
        operatorName: `${addCardForm.network} Card Rs. ${cardVal}`,
        network: addCardForm.network, color: netColors[addCardForm.network] || '#e11d48',
        bgLight: '#fff1f2', border: '#fecdd3', tag: 'Scratch Card', cardValue: cardVal, commissionRate: 4,
        qty: qtyVal, notes: addCardForm.notes,
      });
      toast.success(`+ ${qtyVal} pcs of ${addCardForm.network} Rs. ${cardVal} added! 💳`);
      setAddCardForm({ network: 'Dialog', cardValue: '100', quantity: '', notes: '' });
      setShowAddCardModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add card stock');
    }
  };

  // ── Submit Closing (In-Hand count) — one-directional lock ──────────────────
  const handleSubmitClosing = async (row) => {
    // The In-Hand box is pre-filled with today's running float (Opening +
    // Added) when staff hasn't typed a count yet — same fallback the input
    // displays — so submitting untouched closes as "nothing sold" rather
    // than being blocked. Explicitly clearing the box (typed to '') still
    // requires a real count before this will proceed.
    const draftVal = closingDraft[row.operatorName] ?? row._totalFloat;
    if (draftVal === undefined || draftVal === '') {
      toast.error('Please enter the physically counted In-Hand quantity first');
      return;
    }
    try {
      setClosingBusy(row.operatorName);
      // closeReloadStock responds { success, data: stockItem } — unwrap fully.
      const { data: { data } } = await closeReloadStock({
        stockId: row.stockId || undefined,
        storeId, operator: row.operatorName, cardValue: row.cardValue, date: stockDate,
        closingStock: draftVal,
      });
      setRows(prev => prev.map(r => (r.operatorName === row.operatorName && r.cardValue === row.cardValue)
        ? { ...r, stockId: data._id, status: data.status, closingStock: data.closingStock, eveningInHand: data.closingStock }
        : r));
      setClosingDraft(prev => { const next = { ...prev }; delete next[row.operatorName]; return next; });
      toast.success(`${row.operatorName} closed for the day — Sold locked in. ✅`);
      if (onSyncSuccess) onSyncSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit closing count');
    } finally {
      setClosingBusy(null);
    }
  };

  // ── Adjust a locked (closed) item — Admin/Manager only, logged ─────────────
  const openAdjustModal = (row) => {
    setAdjustTarget(row);
    setAdjustValue(String(row.eveningInHand ?? ''));
    setAdjustReason('');
  };

  const handleSubmitAdjust = async (e) => {
    e.preventDefault();
    if (!adjustTarget?.stockId) return;
    if (!adjustReason.trim()) {
      toast.error('Please enter a reason for this correction');
      return;
    }
    try {
      setSubmittingAdjust(true);
      // adjustReloadStock responds { success, data: stockItem } — unwrap fully.
      const { data: { data } } = await adjustReloadStock({
        stockId: adjustTarget.stockId,
        field: 'closingStock',
        newValue: Number(adjustValue) || 0,
        reason: adjustReason.trim(),
      });
      setRows(prev => prev.map(r => r.stockId === adjustTarget.stockId
        ? { ...r, closingStock: data.closingStock, eveningInHand: data.closingStock, openingStock: data.openingStock, addedToday: data.addedStock }
        : r));
      toast.success('Correction saved & logged ✅');
      setAdjustTarget(null);
      if (onSyncSuccess) onSyncSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save correction');
    } finally {
      setSubmittingAdjust(false);
    }
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
      // Closed items use the locked count. Open items preview against
      // whatever's been typed in the (uncommitted) In-Hand draft, or the
      // full float if nothing's been typed yet.
      const draft = closingDraft[r.operatorName];
      const inHand = r.status === 'closed'
        ? Number(r.eveningInHand || 0)
        : (draft === undefined || draft === '' ? totalFloat : Number(draft));

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
  }, [rows, closingDraft]);

  // Tab row subsets
  const ereloadRows = useMemo(() => calculations.computedRows.filter(r => r.tag === 'E-Reload' || r.tag === 'Wallet'), [calculations.computedRows]);
  const cardRows = useMemo(() => {
    return calculations.computedRows.filter(r => {
      if (r.tag !== 'Scratch Card') return false;
      if (r._inHand <= 0) return false; // hide denominations with no current stock
      if (selectedNetwork === 'All') return true;
      return r.network === selectedNetwork;
    });
  }, [calculations.computedRows, selectedNetwork]);

  // Quick-pick chips for the Add Card Stock denomination field — same
  // "currently has stock" rule as the Scratch Card Stock grid filter
  // (In-Hand pcs > 0), scoped to the network selected in that form. No
  // hardcoded/example values — a denomination drops off once sold out and
  // reappears once restocked, staying in sync with the grid.
  // "In stock at a glance" for the Card tab header — sums the same _inHand
  // pieces already shown in each card's In-Hand (Pcs) field, scoped to
  // whichever network filter is active (or all networks with stock, when
  // "All" is selected). No new stock calculation — reuses cardRows as-is.
  const cardStockSummary = useMemo(() => {
    const totalPcs = cardRows.reduce((a, r) => a + Number(r._inHand || 0), 0);
    const totalValue = cardRows.reduce((a, r) => a + Number(r._inHand || 0) * Number(r.cardValue || 0), 0);
    return { totalPcs, totalValue };
  }, [cardRows]);

  const cardDenomChips = useMemo(() => {
    const seen = new Set();
    const values = [];
    calculations.computedRows.forEach(r => {
      if (r.tag !== 'Scratch Card' || r.network !== addCardForm.network || r._inHand <= 0) return;
      if (seen.has(r.cardValue)) return;
      seen.add(r.cardValue);
      values.push(r.cardValue);
    });
    return values.sort((a, b) => a - b);
  }, [calculations.computedRows, addCardForm.network]);

  // Total Credit (outstanding, still owed) vs Collected Today (settled), both
  // scoped to the entries shown for the selected date.
  const totalCreditAmount = useMemo(() => {
    return creditReloads.filter(cr => !cr.creditSettled).reduce((acc, cr) => acc + (Number(cr.amount) || 0), 0);
  }, [creditReloads]);
  const totalCollectedAmount = useMemo(() => {
    return creditReloads.filter(cr => cr.creditSettled).reduce((acc, cr) => acc + (Number(cr.amount) || 0), 0);
  }, [creditReloads]);
  const filteredCreditReloads = useMemo(() => {
    if (creditStatusFilter === 'pending') return creditReloads.filter(cr => !cr.creditSettled);
    if (creditStatusFilter === 'paid') return creditReloads.filter(cr => cr.creditSettled);
    return creditReloads;
  }, [creditReloads, creditStatusFilter]);

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
      loadCreditReloads();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record credit reload');
    } finally {
      setSubmittingCredit(false);
    }
  };

  // ── Settle a pending credit reload — always in full, locked afterward ─────
  const handleConfirmSettleCredit = async () => {
    if (!settleTarget) return;
    try {
      setSubmittingSettle(true);
      const { data: { data: updated } } = await settleCreditReload(settleTarget._id, { paymentMethod: 'Cash' });
      setCreditReloads(prev => prev.map(cr => (cr._id === updated._id ? updated : cr)));
      toast.success(`Rs. ${Number(settleTarget.amount).toLocaleString()} collected from ${settleTarget.mobileNumber} ✅`);
      setSettleTarget(null);
      if (onSyncSuccess) onSyncSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to settle credit reload');
    } finally {
      setSubmittingSettle(false);
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
                        <div className="text-[10px] font-bold text-emerald-400 uppercase">In Stock</div>
                        <div className="text-sm font-mono font-black text-emerald-300">Rs. {Number(row._inHand).toLocaleString()}</div>
                        <div className="text-[9px] font-medium text-slate-500 uppercase mt-0.5">Float: Rs. {Number(row._totalFloat).toLocaleString()}</div>
                      </div>
                    </div>

                    {/* Inputs Section */}
                    <div className="grid grid-cols-2 gap-2.5 mb-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      <div>
                        <label className="text-[10px] font-bold text-emerald-400 block mb-1 uppercase tracking-wider">
                          (+) Added Float (Rs.)
                        </label>
                        <div className="w-full py-2 px-2.5 font-mono font-bold text-emerald-300 bg-slate-900 border border-emerald-500/30 rounded-lg text-sm flex items-center justify-between">
                          <span>Rs. {Number(row._added).toLocaleString()}</span>
                          <Lock size={11} className="text-emerald-500/50" />
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium mt-1.5">
                          {row.addLog?.length || 0} add{row.addLog?.length === 1 ? '' : 's'} logged today
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-indigo-400 block mb-1 uppercase tracking-wider">
                          Evening In-Hand (Rs.)
                        </label>
                        {row.status === 'closed' ? (
                          <div className="w-full py-2 px-2.5 font-mono font-bold text-slate-300 bg-slate-900 border border-slate-700 rounded-lg text-sm flex items-center justify-between">
                            <span>Rs. {Number(row.eveningInHand).toLocaleString()}</span>
                            <Lock size={11} className="text-slate-500" />
                          </div>
                        ) : (
                          <input
                            type="number"
                            min="0"
                            onWheel={(e) => e.target.blur()}
                            placeholder="0"
                            value={closingDraft[row.operatorName] ?? row._totalFloat}
                            onChange={(e) => handleClosingDraftChange(row.operatorName, e.target.value)}
                            className="w-full py-2 px-2.5 font-mono font-bold text-indigo-300 bg-slate-900 border border-indigo-500/30 rounded-lg text-sm focus:border-indigo-500 focus:bg-slate-800 outline-none transition-all"
                          />
                        )}
                        <div className="text-[10px] text-slate-500 font-medium mt-1.5 truncate">
                          Opening: Rs. {Number(row._opening).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {row.status === 'closed' ? (
                      canAdjust && (
                        <button
                          type="button"
                          onClick={() => openAdjustModal(row)}
                          className="w-full mb-2.5 py-1.5 rounded-lg border border-amber-500/30 text-amber-400 text-[10px] font-bold hover:bg-amber-500/10 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Edit3 size={11} /> Adjust (logged)
                        </button>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSubmitClosing(row)}
                        disabled={closingBusy === row.operatorName}
                        className="w-full mb-2.5 py-1.5 rounded-lg bg-indigo-600/90 hover:bg-indigo-600 text-white text-[10px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
                      >
                        {closingBusy === row.operatorName ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />}
                        Submit Closing
                      </button>
                    )}

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
                <div className="flex items-center gap-2 flex-wrap">
                  <CreditCard size={18} className="text-rose-400" />
                  <span className="text-sm font-black text-white uppercase tracking-wide">
                    Scratch Card Stock (Pieces)
                  </span>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
                    📦 In Stock: Rs. {cardStockSummary.totalValue.toLocaleString()} ({cardStockSummary.totalPcs} pcs)
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
                ) : cardRows.length === 0 ? (
                  <div className="col-span-full py-16 text-center text-slate-400">
                    <CreditCard size={32} className="mx-auto mb-3 text-slate-600" />
                    <p className="text-sm font-bold text-slate-300">
                      No card stock currently in hand{selectedNetwork !== 'All' ? ` for ${selectedNetwork}` : ''}.
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Use + Add Card Stock to add some.</p>
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
                      <div className="flex flex-col items-center justify-center px-2.5 py-1 rounded-xl min-w-[52px]" style={{ backgroundColor: `${row.color}20`, color: row.color }}>
                        <span className="text-[8px] font-bold uppercase leading-none">In Stock</span>
                        <span className="text-base font-black leading-tight mt-0.5">{row._inHand} <span className="text-[9px] font-bold">pcs</span></span>
                      </div>
                    </div>

                    {/* Card Inputs */}
                    <div className="grid grid-cols-2 gap-2 mb-2.5 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                      <div>
                        <label className="text-[9px] font-bold text-emerald-400 block mb-1 uppercase tracking-wider">
                          (+) Added (Pcs)
                        </label>
                        <div className="w-full py-1.5 px-2 font-mono font-bold text-emerald-300 bg-slate-900 border border-emerald-500/30 rounded-lg text-xs flex items-center justify-between">
                          <span>{row._added} pcs</span>
                          <Lock size={10} className="text-emerald-500/50" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-indigo-400 block mb-1 uppercase tracking-wider">
                          In-Hand (Pcs)
                        </label>
                        {row.status === 'closed' ? (
                          <div className="w-full py-2 px-2 font-mono font-black text-indigo-200 bg-indigo-950/50 border border-indigo-500/40 rounded-lg text-sm flex items-center justify-between">
                            <span>{row.eveningInHand} pcs</span>
                            <Lock size={11} className="text-indigo-400/60" />
                          </div>
                        ) : (
                          <input
                            type="number"
                            min="0"
                            onWheel={(e) => e.target.blur()}
                            placeholder="0"
                            value={closingDraft[row.operatorName] ?? row._totalFloat}
                            onChange={(e) => handleClosingDraftChange(row.operatorName, e.target.value)}
                            className="w-full py-2 px-2 font-mono font-black text-indigo-200 bg-indigo-950/50 border border-indigo-500/40 rounded-lg text-sm focus:border-indigo-400 focus:bg-slate-800 outline-none transition-all"
                          />
                        )}
                      </div>
                    </div>

                    <div className="text-[9px] text-slate-500 font-medium mb-2 truncate">
                      Opening: {row._opening} pcs • Float: {row._totalFloat} pcs
                    </div>

                    {row.status === 'closed' ? (
                      canAdjust && (
                        <button
                          type="button"
                          onClick={() => openAdjustModal(row)}
                          className="w-full mb-2.5 py-1 rounded-lg border border-amber-500/30 text-amber-400 text-[9px] font-bold hover:bg-amber-500/10 transition-colors cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Edit3 size={10} /> Adjust
                        </button>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSubmitClosing(row)}
                        disabled={closingBusy === row.operatorName}
                        className="w-full mb-2.5 py-1 rounded-lg bg-indigo-600/90 hover:bg-indigo-600 text-white text-[9px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 disabled:opacity-60"
                      >
                        {closingBusy === row.operatorName ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle size={10} />}
                        Submit Closing
                      </button>
                    )}

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
              TAB 4: CREDIT RELOAD & LIVE LEDGER
             ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'credit' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Left Form: Add Credit Reload */}
              <div className="lg:col-span-5 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-5">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base font-black text-white">🏷️ Record Credit Reload</h3>
                  <p className="text-xs text-slate-400 mt-1">Log reload given to a customer on credit.</p>
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
                    Save Credit Reload Entry
                  </button>
                </form>
              </div>

              {/* Right Side: Credit Reloads Ledger */}
              <div className="lg:col-span-7 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-3">
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <span>📋 Credit Reloads Ledger ({stockDate})</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {creditReloads.length} Credit {creditReloads.length === 1 ? 'entry' : 'entries'} on record
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Total Credit</span>
                      <span className="text-lg font-black text-amber-300 font-mono">
                        Rs. {totalCreditAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Collected Today</span>
                      <span className="text-lg font-black text-emerald-300 font-mono">
                        Rs. {totalCollectedAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Filter */}
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 w-fit">
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'pending', label: 'Pending' },
                    { key: 'paid', label: 'Paid' },
                  ].map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setCreditStatusFilter(f.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        creditStatusFilter === f.key
                          ? 'bg-amber-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto max-h-[380px] space-y-2 pr-1">
                  {loadingCredits ? (
                    <div className="py-16 text-center text-slate-400">
                      <Loader2 size={28} className="animate-spin mx-auto mb-2 text-amber-500" />
                      Loading credit reloads...
                    </div>
                  ) : filteredCreditReloads.length === 0 ? (
                    <div className="py-16 text-center text-slate-400">
                      <CreditCard size={40} className="mx-auto mb-2 text-slate-600" />
                      <p className="text-xs font-bold text-slate-300">
                        {creditReloads.length === 0 ? `No credit reloads recorded for ${stockDate}` : `No ${creditStatusFilter} entries`}
                      </p>
                      {creditReloads.length === 0 && (
                        <p className="text-[10px] text-slate-500 mt-1">Submit the form on the left to add a credit reload.</p>
                      )}
                    </div>
                  ) : (
                    filteredCreditReloads.map((cr) => (
                      <div
                        key={cr._id}
                        className="p-3.5 rounded-2xl border border-slate-800 bg-slate-950/80 hover:bg-slate-950 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-black text-xs shrink-0 border border-amber-500/20">
                            {cr.operator?.slice(0, 3).toUpperCase() || 'REL'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-white text-xs">{cr.mobileNumber}</span>
                              {cr.customerName && (
                                <span className="text-xs font-semibold text-slate-300">({cr.customerName})</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                              <span className="font-bold text-slate-300">{cr.operator}</span>
                              <span>•</span>
                              <span>{new Date(cr.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {cr.notes && (
                                <>
                                  <span>•</span>
                                  <span className="italic text-slate-400">{cr.notes}</span>
                                </>
                              )}
                            </div>
                            {cr.creditSettled && (
                              <div className="text-[10px] text-emerald-400 mt-0.5">
                                ✓ Paid {new Date(cr.creditSettledAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                                {cr.settledBy?.name ? ` by ${cr.settledBy.name}` : ''}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-black text-amber-400 text-sm font-mono">
                            Rs. {Number(cr.amount || 0).toLocaleString()}
                          </div>
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider mt-1 ${
                            cr.creditSettled
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {cr.creditSettled ? 'Paid' : 'Pending'}
                          </span>
                          {!cr.creditSettled && (
                            <button
                              type="button"
                              onClick={() => setSettleTarget(cr)}
                              className="block mt-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition-colors cursor-pointer"
                            >
                              Mark as Paid
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

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
              onClick={loadDailyData}
              disabled={loading}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
              title="Add Stock and Submit Closing already save immediately — this just re-fetches the latest figures"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Refresh
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 transition-all cursor-pointer"
            >
              <Printer size={16} /> Print Slip
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
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500">Rs.</span>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="Type this network's card value, e.g. 100"
                    value={addCardForm.cardValue}
                    onChange={(e) => setAddCardForm({ ...addCardForm, cardValue: e.target.value })}
                    className="w-full py-2.5 pl-8 pr-3 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-rose-500 bg-slate-950"
                  />
                </div>
                {cardDenomChips.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {cardDenomChips.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setAddCardForm({ ...addCardForm, cardValue: String(v) })}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                          addCardForm.cardValue === String(v)
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-slate-950 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                      >
                        Rs. {v}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500 mt-2">
                    No card stock currently in hand for {addCardForm.network} — type an amount below to add your first denomination.
                  </p>
                )}
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

      {/* ── POPUP MODAL 3: ADJUST LOCKED ITEM (Admin/Manager only) ─────────── */}
      {adjustTarget && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-150">
          <div className="bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-700 p-6 space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Edit3 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Adjust Closed Item</h3>
                  <p className="text-xs text-slate-400">{adjustTarget.operatorName} — {stockDate}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAdjustTarget(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-[11px] text-amber-300">
              This is a logged correction — it will be recorded with your name, the old value, and your reason.
            </div>

            <form onSubmit={handleSubmitAdjust} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Corrected In-Hand {adjustTarget.tag === 'Scratch Card' ? '(Pcs)' : '(Rs.)'} *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={adjustValue}
                  onChange={(e) => setAdjustValue(e.target.value)}
                  className="w-full py-2.5 px-3 border border-slate-700 rounded-xl text-sm font-mono font-black text-amber-400 outline-none focus:border-amber-500 bg-slate-950"
                />
                <div className="text-[10px] text-slate-500 mt-1">Current: {adjustTarget.eveningInHand} {adjustTarget.tag === 'Scratch Card' ? 'pcs' : ''}</div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Reason for Correction *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Miscounted at closing, recounted this morning"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-500 bg-slate-950"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustTarget(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdjust}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {submittingAdjust ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Save Correction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── POPUP MODAL 4: SETTLE CREDIT RELOAD CONFIRMATION ────────────────── */}
      {settleTarget && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-150">
          <div className="bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-700 p-6 space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Mark as Paid</h3>
                  <p className="text-xs text-slate-400">Confirm this credit has been collected</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSettleTarget(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Customer</span>
                <span className="font-bold text-white">{settleTarget.mobileNumber}{settleTarget.customerName ? ` (${settleTarget.customerName})` : ''}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Network</span>
                <span className="font-bold text-white">{settleTarget.operator}</span>
              </div>
              <div className="flex items-center justify-between text-sm pt-1.5 border-t border-slate-800 mt-1.5">
                <span className="text-slate-300 font-bold">Amount to Collect</span>
                <span className="font-black text-emerald-400 font-mono">Rs. {Number(settleTarget.amount).toLocaleString()}</span>
              </div>
            </div>

            <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-[11px] text-amber-300">
              This is final — once marked paid, it can't be flipped back to pending from this screen.
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSettleTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSettleCredit}
                disabled={submittingSettle}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {submittingSettle ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />} Confirm Paid
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ReloadModal;
