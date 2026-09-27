'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2, Search, Printer, Eye, X, Sparkles, ChevronDown } from 'lucide-react';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/authStore';
import useSettingsStore from '../../store/settingsStore';
import { createStockReceipt, getStockReceipts, getSuppliers, getReceiptByGRN, getAccounts, getNextGrn, searchGrnNumbers, getStores } from '../../services/api';
import SupplierReturnsPanel from './SupplierReturnsPanel';

const StockReceivingPanel = ({ storeId, products }) => {
  const user = useAuthStore((s) => s.user);
  const settings = useSettingsStore((s) => s.settings);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(storeId || '');

  const [supplierId, setSupplierId] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [receivedAt, setReceivedAt] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ productId: '', qty: 1, unitCost: 0 }]);
  const [history, setHistory] = useState([]);
  const [range, setRange] = useState({ startDate: '', endDate: '' });
  const [grnSearch, setGrnSearch] = useState('');
  const [grnFilter, setGrnFilter] = useState('');
  const [viewGrn, setViewGrn] = useState(null);
  const [printQty, setPrintQty] = useState({});
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [accountId, setAccountId] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [nextGrn, setNextGrn] = useState('');
  const [grnSuggestions, setGrnSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState('entry'); // 'entry' or 'return'
  const [prefillReturn, setPrefillReturn] = useState(null);
  const grnInputRef = useRef(null);
  const suggestTimeoutRef = useRef(null);

  const productOptions = useMemo(
    () => (products || []).filter(Boolean).map((p) => ({ id: p._id, label: p.name })),
    [products]
  );

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const params = {};
      const storeToFilter = user?.role === 'admin' ? selectedStore : storeId;
      if (storeToFilter && storeToFilter !== 'all' && storeToFilter !== '') {
        params.storeId = storeToFilter;
      }
      const { data } = await getSuppliers(params);
      setSuppliers(data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const { data } = await getAccounts();
      setAccounts(data || []);
      const def = data.find(a => a.isDefault);
      if (def) setAccountId(def._id);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchSuppliers();
    fetchAccounts();
    // Load the next GRN number suggestion
    getNextGrn().then(({ data }) => setNextGrn(data.grnNumber || '')).catch(() => {});
    
    if (user?.role === 'admin') {
      getStores().then(res => setStores(res.data?.stores || res.data || [])).catch(() => {});
    }
  }, [storeId, selectedStore]);

  useEffect(() => {
    setSelectedStore(storeId || '');
  }, [storeId]);

  const fetchHistory = async () => {
    try {
      const params = {};
      const storeToFilter = user?.role === 'admin' ? selectedStore : storeId;
      if (storeToFilter && storeToFilter !== 'all' && storeToFilter !== '') {
        params.storeId = storeToFilter;
      }
      
      if (range.startDate) params.startDate = range.startDate;
      if (range.endDate) params.endDate = range.endDate;
      if (grnFilter) params.grnNumber = grnFilter;
      const { data } = await getStockReceipts(params);
      setHistory(data || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => { fetchHistory(); }, [storeId, selectedStore, range.startDate, range.endDate, grnFilter]);

  const addLine = () => setItems((prev) => [...prev, { productId: '', qty: 1, unitCost: 0 }]);
  const removeLine = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const updateLine = (idx, patch) => setItems((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));

  const grandTotal = useMemo(() => items.reduce((s, l) => s + (Number(l.qty) * Number(l.unitCost)), 0), [items]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (user?.role === 'admin' && !selectedStore) {
      toast.error('Please select a store');
      return;
    }
    if (!supplierId) {
      toast.error('Supplier is required');
      return;
    }
    const cleaned = items
      .map((l) => ({ ...l, qty: Number(l.qty), unitCost: Number(l.unitCost) }))
      .filter((l) => l.productId && l.qty > 0);
    if (cleaned.length === 0) {
      toast.error('Add at least one valid item');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        supplierId,
        invoiceNo: invoiceNo || undefined,
        receivedAt: receivedAt || undefined,
        notes: notes || undefined,
        items: cleaned,
        storeId: selectedStore || undefined,
        advanceAmount: Number(advanceAmount) || 0,
        paymentMethod: advanceAmount > 0 ? paymentMethod : undefined,
        accountId: advanceAmount > 0 ? accountId : undefined,
      };

      await createStockReceipt(payload);
      toast.success('GRN saved — stock updated automatically');
      setSupplierId('');
      setInvoiceNo('');
      setReceivedAt('');
      setNotes('');
      setAdvanceAmount(0);
      setItems([{ productId: '', qty: 1, unitCost: 0 }]);
      fetchHistory();
      // Refresh next GRN number
      getNextGrn().then(({ data }) => setNextGrn(data.grnNumber || '')).catch(() => {});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save receipt');
    } finally {
      setSaving(false);
    }
  };

  // GRN autocomplete handler
  const handleGrnInput = (val) => {
    setInvoiceNo(val);
    clearTimeout(suggestTimeoutRef.current);
    if (val.length >= 2) {
      suggestTimeoutRef.current = setTimeout(async () => {
        try {
          const { data } = await searchGrnNumbers(val);
          setGrnSuggestions(data || []);
          setShowSuggestions((data || []).length > 0);
        } catch { setGrnSuggestions([]); setShowSuggestions(false); }
      }, 300);
    } else {
      setGrnSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleGrnSearch = async () => {
    if (!grnSearch.trim()) return;
    try {
      const { data } = await getReceiptByGRN(grnSearch.trim());
      setViewGrn(data);
    } catch {
      toast.error('GRN not found');
      setViewGrn(null);
    }
  };

  const printVoucher = (receipt) => {
    const siteName = settings?.shopName || 'Mobixa';
    const logoUrl = settings?.logoUrl || settings?.logo || '';
    const itemRows = (receipt.items || []).map((it, i) => {
      const qty = printQty[`${receipt._id}_${i}`] || it.qty;
      return `<tr>
        <td style="padding:8px;border:1px solid #ddd">${i + 1}</td>
        <td style="padding:8px;border:1px solid #ddd">${it.productId?.name || 'N/A'}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center">${qty}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right">Rs. ${Number(it.unitCost).toFixed(2)}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right">Rs. ${(qty * Number(it.unitCost)).toFixed(2)}</td>
      </tr>`;
    }).join('');

    const total = (receipt.items || []).reduce((s, it, i) => {
      const qty = printQty[`${receipt._id}_${i}`] || it.qty;
      return s + qty * Number(it.unitCost);
    }, 0);

    const html = `<!DOCTYPE html><html><head><title>GRN Voucher - ${receipt.grnNumber || ''}</title>
    <style>body{font-family:'Poppins',sans-serif;padding:30px;max-width:800px;margin:0 auto}
    .header{text-align:center;border-bottom:3px solid #d946a0;padding-bottom:15px;margin-bottom:20px}
    .header h1{margin:5px 0;color:#1f1f1f;font-size:22px}
    .header p{margin:2px 0;color:#666;font-size:13px}
    .logo{width:60px;height:60px;border-radius:50%;object-fit:cover;margin-bottom:8px}
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px;font-size:13px}
    .info-grid div{padding:8px 12px;background:#fdf2f8;border-radius:8px}
    .info-grid strong{color:#d946a0}
    table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px}
    th{background:#d946a0;color:white;padding:10px 8px;text-align:left}
    .total-row{background:#fdf2f8;font-weight:bold;font-size:15px}
    .footer{text-align:center;margin-top:30px;padding-top:15px;border-top:2px dashed #eee;font-size:11px;color:#999}
    @media print{body{padding:15px}}</style></head><body>
    <div class="header">
      ${logoUrl ? `<img src="${logoUrl}" class="logo" onerror="this.style.display='none'" />` : ''}
      <h1>${siteName}</h1>
      <p style="font-size:16px;font-weight:700;color:#d946a0;margin-top:8px">GOODS RECEIVED NOTE (GRN)</p>
    </div>
    <div class="info-grid">
      <div><strong>GRN No:</strong> ${receipt.grnNumber || 'N/A'}</div>
      <div><strong>Date:</strong> ${new Date(receipt.receivedAt || receipt.createdAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</div>
      <div><strong>Supplier:</strong> ${receipt.supplierId?.name || 'N/A'}</div>
      <div><strong>Invoice:</strong> ${receipt.invoiceNo || 'N/A'}</div>
    </div>
    ${receipt.notes ? `<p style="font-size:12px;color:#666;margin-bottom:15px"><strong>Notes:</strong> ${receipt.notes}</p>` : ''}
    <table>
      <thead><tr><th>#</th><th>Product</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>${itemRows}
        <tr class="total-row"><td colspan="4" style="padding:10px;text-align:right;border:1px solid #ddd">Grand Total</td>
        <td style="padding:10px;text-align:right;border:1px solid #ddd">Rs. ${total.toFixed(2)}</td></tr>
      </tbody>
    </table>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:40px;font-size:12px">
      <div style="border-top:1px solid #333;padding-top:8px;text-align:center">Received By</div>
      <div style="border-top:1px solid #333;padding-top:8px;text-align:center">Authorized Signature</div>
    </div>
    <div class="footer">This is a system-generated voucher from ${siteName}</div>
    </body></html>`;

    const win = window.open('', '_blank', 'width=850,height=700');
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 400);
  };

  /* Removed blocking loading check to prevent UI lockups */

  return (
    <div>
      <h2 className="text-xl font-bold text-dark-navy mb-4"> GRN / Stock Receiving</h2>

      {/* GRN Search Bar */}
      <div className="bg-white rounded-2xl border border-card-border p-4 shadow-sm mb-6">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={grnSearch}
              onChange={(e) => setGrnSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGrnSearch()}
              placeholder="Search by GRN number (e.g., GRN-202604-0001)"
              className="w-full border border-card-border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
          </div>
          <button onClick={handleGrnSearch} className="bg-primary-blue text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-600">
            <Search size={16} className="inline mr-1" /> Search GRN
          </button>
        </div>
      </div>

      {/* GRN Detail Modal */}
      {viewGrn && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setViewGrn(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-card-border flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
              <div>
                <h2 className="text-lg font-bold text-dark-navy">GRN Details</h2>
                <p className="text-sm text-primary-blue font-semibold">{viewGrn.grnNumber}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => printVoucher(viewGrn)} className="flex items-center gap-1.5 bg-primary-blue text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-600">
                  <Printer size={15} /> Print
                </button>
                <button onClick={() => setViewGrn(null)} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={20} /></button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-muted-text">Supplier</p>
                  <p className="font-semibold text-dark-navy">{viewGrn.supplierId?.name || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-muted-text">Date Received</p>
                  <p className="font-semibold text-dark-navy">{new Date(viewGrn.receivedAt || viewGrn.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-muted-text">Invoice No</p>
                  <p className="font-semibold text-dark-navy">{viewGrn.invoiceNo || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-muted-text">Created By</p>
                  <p className="font-semibold text-dark-navy">{viewGrn.createdBy?.name || 'N/A'}</p>
                </div>
              </div>
              {viewGrn.notes && <p className="text-sm text-muted-text"><strong>Notes:</strong> {viewGrn.notes}</p>}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-4 py-2.5 font-medium text-muted-text">#</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-text">Product</th>
                      <th className="text-center px-4 py-2.5 font-medium text-muted-text">Received</th>
                      <th className="text-center px-4 py-2.5 font-medium text-muted-text">Print Qty</th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-text">Unit Price</th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-text">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-card-border">
                    {(viewGrn.items || []).map((it, i) => {
                      const pqKey = `${viewGrn._id}_${i}`;
                      const pq = printQty[pqKey] ?? it.qty;
                      return (
                        <tr key={i}>
                          <td className="px-4 py-2.5">{i + 1}</td>
                          <td className="px-4 py-2.5 font-medium">{it.productId?.name || 'N/A'}</td>
                          <td className="px-4 py-2.5 text-center">{it.qty}</td>
                          <td className="px-4 py-2.5 text-center">
                            <input
                              type="number"
                              min="0"
                              max={it.qty}
                              value={pq}
                              onChange={(e) => setPrintQty((prev) => ({ ...prev, [pqKey]: Number(e.target.value) }))}
                              className="w-16 border border-card-border rounded-lg py-1 px-2 text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary-blue"
                            />
                          </td>
                          <td className="px-4 py-2.5 text-right">Rs. {Number(it.unitCost).toFixed(2)}</td>
                          <td className="px-4 py-2.5 text-right font-semibold">Rs. {(pq * Number(it.unitCost)).toFixed(2)}</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-primary-blue/10 font-bold">
                      <td colSpan={5} className="px-4 py-3 text-right">Grand Total (Print Qty)</td>
                      <td className="px-4 py-3 text-right text-primary-blue">
                        Rs. {(viewGrn.items || []).reduce((s, it, i) => {
                          const pq = printQty[`${viewGrn._id}_${i}`] ?? it.qty;
                          return s + (pq * Number(it.unitCost));
                        }, 0).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mt-2">
                 Adjust <strong>Print Qty</strong> to print a voucher with different quantities (e.g. partial delivery). The printed voucher will use these quantities.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button 
          onClick={() => { setActiveTab('entry'); setPrefillReturn(null); }}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'entry' ? 'bg-primary-blue text-white shadow-md' : 'bg-white text-muted-text border border-card-border hover:bg-gray-50'}`}
        >
           New GRN Entry
        </button>
        {prefillReturn && (
          <button 
            className="px-4 py-2 rounded-xl text-sm font-bold bg-red-600 text-white shadow-md flex items-center gap-2"
          >
            ↩ Process Return for {prefillReturn.grnNumber}
          </button>
        )}
      </div>

      {activeTab === 'return' && prefillReturn ? (
        <div className="relative">
          <button 
            onClick={() => { setActiveTab('entry'); setPrefillReturn(null); }}
            className="absolute -top-12 right-0 text-sm font-bold text-primary-blue hover:underline"
          >
            Cancel & Back to Entry
          </button>
          <SupplierReturnsPanel 
            storeId={selectedStore || storeId} 
            products={products} 
            onSuccess={() => {
              setActiveTab('entry');
              setPrefillReturn(null);
              fetchHistory();
            }}
            prefillData={{
              supplierId: prefillReturn.supplierId?._id || prefillReturn.supplierId,
              notes: `Return from GRN: ${prefillReturn.grnNumber}`,
              items: prefillReturn.items.map(it => ({
                productId: it.productId?._id || it.productId,
                qty: it.qty,
                unitCostAtReturn: it.unitCost
              }))
            }} 
          />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-card-border p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-dark-navy text-base">New GRN Entry</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {user?.role === 'admin' && (
              <div>
                <label className="block text-sm font-medium text-dark-navy mb-1">Target Store *</label>
                <select 
                  value={selectedStore} 
                  onChange={(e) => setSelectedStore(e.target.value)} 
                  className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm bg-indigo-50 font-bold text-primary-blue focus:ring-2 focus:ring-primary-blue/20 outline-none"
                >
                  <option value="">-- All Stores / Global --</option>
                  {stores.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
            )}
            <div className={user?.role === 'admin' ? 'md:col-span-1' : 'md:col-span-2'}>
              <label className="block text-sm font-medium text-dark-navy mb-1">
                Supplier * {loading && <span className="text-xs animate-pulse text-primary-blue ml-2">Loading...</span>}
              </label>
              <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm bg-white focus:ring-2 focus:ring-primary-blue/20 outline-none">
                <option value="">Select supplier</option>
                {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
          <div>
            <label className="block text-sm font-medium text-dark-navy mb-1">Invoice / GRN No</label>
            <div className="relative">
              <input
                ref={grnInputRef}
                value={invoiceNo}
                onChange={(e) => handleGrnInput(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm"
                placeholder="Type to search past GRNs or leave blank to auto-generate"
              />
              {/* Suggestions Dropdown */}
              {showSuggestions && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-card-border rounded-xl shadow-xl overflow-hidden">
                  {/* Always show next GRN at top */}
                  {nextGrn && (
                    <button
                      type="button"
                      onMouseDown={() => { setInvoiceNo(nextGrn); setShowSuggestions(false); }}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-indigo-50 transition-colors text-left border-b border-card-border"
                    >
                      <span className="flex items-center gap-2 font-bold text-primary-blue">
                        <Sparkles size={13} /> {nextGrn}
                      </span>
                      <span className="text-xs bg-indigo-100 text-primary-blue font-bold px-2 py-0.5 rounded-full">Auto-Generate</span>
                    </button>
                  )}
                  {/* Past GRN suggestions */}
                  {grnSuggestions.length > 0 && (
                    <>
                      <div className="px-3 py-1 text-xs font-bold text-muted-text uppercase tracking-wide bg-gray-50">Past GRN Numbers</div>
                      {grnSuggestions.map((s, i) => (
                        <button
                          key={i}
                          type="button"
                          onMouseDown={() => { setInvoiceNo(s.grnNumber); setShowSuggestions(false); }}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-indigo-50 transition-colors text-left"
                        >
                          <span className="font-semibold text-dark-navy">{s.grnNumber}</span>
                          <span className="text-xs text-muted-text">{s.invoiceNo ? `INV: ${s.invoiceNo}` : new Date(s.date).toLocaleDateString()}</span>
                        </button>
                      ))}
                    </>
                  )}
                  {!nextGrn && grnSuggestions.length === 0 && (
                    <div className="px-4 py-3 text-sm text-muted-text">No matches found</div>
                  )}
                </div>
              )}
            </div>
            {/* Quick use chip */}
            {nextGrn && !invoiceNo && (
              <button
                type="button"
                onClick={() => setInvoiceNo(nextGrn)}
                className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-primary-blue hover:text-indigo-700 transition-colors"
              >
                <Sparkles size={11} /> Auto-use: <span className="font-mono">{nextGrn}</span>
              </button>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-navy mb-1">Date Received</label>
            <input type="date" value={receivedAt} onChange={(e) => setReceivedAt(e.target.value)} className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-dark-navy mb-1">Notes / Remarks</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={1} className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm resize-none" placeholder="Any additional notes..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-navy mb-1">Advance Payment (Optional)</label>
            <input type="number" value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm font-bold text-emerald-600" placeholder="0.00" />
          </div>
          {Number(advanceAmount) > 0 && (
            <div>
              <label className="block text-sm font-medium text-dark-navy mb-1">Payment Method</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm bg-white">
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="other">Card / Other</option>
              </select>
            </div>
          )}
          {Number(advanceAmount) > 0 && (
            <div>
              <label className="block text-sm font-medium text-dark-navy mb-1">Account</label>
              <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm bg-white">
                {accounts.map(a => <option key={a._id} value={a._id}>{a.name} (Rs. {a.balance?.toLocaleString()})</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="border-t border-card-border pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-dark-navy">Products Received</h3>
            <button type="button" onClick={addLine} className="inline-flex items-center gap-2 text-sm font-semibold text-primary-blue hover:underline">
              <Plus size={16} /> Add line
            </button>
          </div>

          <div className="space-y-3">
            {items.map((l, idx) => {
              // Check if same product exists in another row with different price
              const sameProductRows = items.filter((other, i) => i !== idx && other.productId === l.productId && l.productId !== '');
              const hasPriceConflict = sameProductRows.some(other => Math.abs(Number(other.unitCost) - Number(l.unitCost)) > 0.01);
              return (
                <div key={idx} className={`grid grid-cols-1 sm:grid-cols-12 gap-3 items-end p-3 rounded-xl ${hasPriceConflict ? 'bg-amber-50 border border-amber-200' : 'bg-transparent'}`}>
                  {hasPriceConflict && (
                    <div className="sm:col-span-12 text-xs font-semibold text-amber-700 flex items-center gap-1">
                       Same product with different price — this will create a separate price row in stock
                    </div>
                  )}
                  <div className="sm:col-span-5">
                    <label className="text-xs text-muted-text block mb-1">Product *</label>
                    <select
                      value={l.productId}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        // Auto-fill unitCost from existing row if same product already in list
                        const existingRow = items.find((r, i) => i !== idx && r.productId === selectedId && selectedId !== '');
                        if (existingRow) {
                          updateLine(idx, { productId: selectedId, unitCost: existingRow.unitCost });
                        } else {
                          updateLine(idx, { productId: selectedId });
                        }
                      }}
                      className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm bg-white"
                    >
                      <option value="">Select product</option>
                      {productOptions.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs text-muted-text block mb-1">Qty *</label>
                    <input type="number" min="1" value={l.qty} onChange={(e) => updateLine(idx, { qty: e.target.value })} className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs text-muted-text block mb-1">Unit Price (Rs.) *</label>
                    <input
                      type="number" min="0" step="0.01" value={l.unitCost}
                      onChange={(e) => updateLine(idx, { unitCost: e.target.value })}
                      className={`w-full border rounded-xl py-2.5 px-4 text-sm ${hasPriceConflict ? 'border-amber-400 bg-amber-50' : 'border-card-border'}`}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs text-muted-text block mb-1">Line Total</label>
                    <div className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm bg-gray-50 font-semibold text-primary-blue">
                      Rs. {(Number(l.qty) * Number(l.unitCost)).toFixed(2)}
                    </div>
                  </div>
                  <div className="sm:col-span-1 flex justify-end">
                    <button type="button" onClick={() => removeLine(idx)} disabled={items.length === 1} className="p-2 rounded-lg hover:bg-red-50 text-red-500 disabled:opacity-40" title="Remove">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between bg-primary-blue/10 rounded-xl px-4 py-3">
            <span className="font-bold text-dark-navy">Grand Total</span>
            <span className="font-bold text-lg text-primary-blue">Rs. {grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="bg-primary-blue hover:bg-emerald-600 text-white font-semibold px-6 py-2.5 rounded-xl disabled:opacity-50">
            {saving ? 'Saving...' : 'Save GRN & Update Stock'}
          </button>
        </div>
        </form>
      )}

      {/* GRN History */}
      <div className="mt-8 bg-white rounded-2xl border border-card-border p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="font-semibold text-dark-navy">GRN History</h3>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={grnFilter}
                onChange={(e) => setGrnFilter(e.target.value)}
                placeholder="Filter by GRN..."
                className="border border-card-border rounded-xl py-2 pl-8 pr-3 text-sm w-40"
              />
            </div>
            <input type="date" value={range.startDate} onChange={(e) => setRange((r) => ({ ...r, startDate: e.target.value }))} className="border border-card-border rounded-xl py-2 px-3 text-sm" />
            <input type="date" value={range.endDate} onChange={(e) => setRange((r) => ({ ...r, endDate: e.target.value }))} className="border border-card-border rounded-xl py-2 px-3 text-sm" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-2.5 font-medium text-muted-text">GRN No</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-text">Date</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-text">Supplier</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-text">Invoice</th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-text">Items</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-text">Total</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-text">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {history.slice(0, 50).map((r) => {
                const total = (r.items || []).reduce((s, it) => s + (it.qty * Number(it.unitCost || 0)), 0);
                return (
                  <tr key={r._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 font-semibold text-primary-blue">{r.grnNumber || '—'}</td>
                    <td className="px-4 py-2.5 text-muted-text">{new Date(r.receivedAt || r.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-2.5">{r.supplierId?.name || '—'}</td>
                    <td className="px-4 py-2.5 text-muted-text">{r.invoiceNo || '—'}</td>
                    <td className="px-4 py-2.5 text-center">{r.items?.length || 0}</td>
                    <td className="px-4 py-2.5 text-right font-semibold">Rs. {total.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setViewGrn(r)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500" title="View"><Eye size={15} /></button>
                        <button onClick={() => printVoucher(r)} className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600" title="Print Voucher"><Printer size={15} /></button>
                        <button 
                          onClick={() => {
                            setPrefillReturn(r);
                            setActiveTab('return');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }} 
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-600" 
                          title="Return Items"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {history.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-text">No GRN records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StockReceivingPanel;
