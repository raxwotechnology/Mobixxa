'use client';

import { useState, useEffect, useCallback } from 'react';
import { Wallet, Search, ArrowLeft, CreditCard, TrendingUp, TrendingDown, DollarSign, Calendar, Download, ChevronDown, X, FileText, FileSpreadsheet, RefreshCw } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { managerNavGroups as navItems } from './managerNavItems';
import { getSupplierPaymentSummary, getSupplierLedger, recordSupplierPayment, recordSupplierPurchase, getSupplierPayments } from '../../services/api';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ManagerSupplierPayments = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [payDescription, setPayDescription] = useState('');
  const [chequeDetails, setChequeDetails] = useState({ chequeNumber: '', bankName: '', chequeDate: '', accountNumber: '' });
  const [paying, setPaying] = useState(false);
  const [supplierToPay, setSupplierToPay] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState({ totalCost: '', amountPaid: '', description: '' });

  const fetchSummary = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const res = await getSupplierPaymentSummary();
      setSuppliers(res.data);
    } catch (err) {
      toast.error('Failed to load supplier payments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  // Auto-refresh when user switches back to this tab
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchSummary(true);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchSummary]);

  // Poll every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => fetchSummary(true), 30000);
    return () => clearInterval(timer);
  }, [fetchSummary]);

  const openLedger = async (supplier) => {
    setSelectedSupplier(supplier);
    setLedgerLoading(true);
    try {
      const res = await getSupplierLedger(supplier._id);
      setLedger(res.data);
    } catch (err) {
      toast.error('Failed to load ledger');
    } finally {
      setLedgerLoading(false);
    }
  };

  const handlePayment = async () => {
    const targetSupplier = supplierToPay || selectedSupplier;
    if (!targetSupplier) return;
    if (!payAmount || Number(payAmount) <= 0) return toast.error('Enter valid amount');
    if (payMethod === 'cheque' && (!chequeDetails.chequeNumber || !chequeDetails.bankName || !chequeDetails.chequeDate)) {
      return toast.error('Please fill in all required cheque details');
    }
    setPaying(true);
    try {
      await recordSupplierPayment(targetSupplier._id, {
        amount: Number(payAmount),
        paymentMethod: payMethod,
        description: payDescription || undefined,
        ...(payMethod === 'cheque' ? chequeDetails : {})
      });
      toast.success('Payment recorded successfully');
      setShowPayModal(false);
      setPayAmount('');
      setPayDescription('');
      setChequeDetails({ chequeNumber: '', bankName: '', chequeDate: '', accountNumber: '' });
      setSupplierToPay(null);
      if (selectedSupplier) {
        openLedger(selectedSupplier);
      }
      fetchSummary(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  const handlePurchase = async () => {
    if (!purchaseForm.totalCost || Number(purchaseForm.totalCost) <= 0) return toast.error('Enter total cost');
    setPaying(true);
    try {
      await recordSupplierPurchase(selectedSupplier._id, {
        totalCost: Number(purchaseForm.totalCost),
        amountPaid: Number(purchaseForm.amountPaid || 0),
        description: purchaseForm.description || undefined,
      });
      const paid = Number(purchaseForm.amountPaid || 0);
      const due = Number(purchaseForm.totalCost) - paid;
      toast.success(`Purchase recorded! ${due > 0 ? `Balance added: LKR ${due.toLocaleString()}` : 'Fully paid'}`);
      setShowPurchaseModal(false);
      setPurchaseForm({ totalCost: '', amountPaid: '', description: '' });
      openLedger(selectedSupplier);
      fetchSummary();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record purchase');
    } finally {
      setPaying(false);
    }
  };

  const exportCSV = () => {
    if (!ledger?.transactions?.length) return;
    const rows = [['Date', 'Type', 'Description', 'Amount', 'Balance']];
    ledger.transactions.forEach((t) => {
      rows.push([
        new Date(t.date).toLocaleDateString(),
        t.type,
        t.description || '',
        t.amount.toFixed(2),
        t.runningBalance.toFixed(2),
      ]);
    });
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supplier_ledger_${selectedSupplier?.name || 'export'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAllPaymentsExcel = async () => {
    try {
      const res = await getSupplierPayments();
      const rows = res.data.map(p => ({
        Supplier: p.supplierId?.name || 'Unknown',
        Amount: p.amount.toFixed(2),
        Date: new Date(p.date).toLocaleDateString(),
        Status: p.paymentMethod || 'cash',
        'Payment Method': p.paymentMethod || 'cash'
      }));
      const sheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, sheet, 'Supplier Payments');
      XLSX.writeFile(workbook, 'supplier_payments.xlsx');
      toast.success('Excel exported');
    } catch (e) { toast.error('Export failed'); }
  };

  const exportAllPaymentsPDF = async () => {
    try {
      const res = await getSupplierPayments();
      const doc = new jsPDF();
      doc.text('Supplier Payments Report', 14, 15);
      autoTable(doc, {
        head: [['Supplier', 'Amount (LKR)', 'Date', 'Payment Method']],
        body: res.data.map(p => [
          p.supplierId?.name || 'Unknown',
          p.amount.toFixed(2),
          new Date(p.date).toLocaleDateString(),
          p.paymentMethod || 'cash'
        ]),
        startY: 20
      });
      doc.save('supplier_payments.pdf');
      toast.success('PDF exported');
    } catch (e) { toast.error('Export failed'); }
  };

  const filtered = suppliers.filter((s) =>
    s.name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalDue = suppliers.reduce((s, sup) => s + (sup.balanceDue || 0), 0);
  const totalPurchased = suppliers.reduce((s, sup) => s + (sup.totalPurchased || 0), 0);
  const totalPaid = suppliers.reduce((s, sup) => s + (sup.totalPaid || 0), 0);

  // Ledger View
  if (selectedSupplier) {
    return (
      <DashboardLayout title="Supplier Payments">
        <div className="animate-fade-in space-y-6">
          {/* Back Button */}
          <button onClick={() => { setSelectedSupplier(null); setLedger(null); }}
            className="flex items-center gap-2 text-brand-indigo hover:text-brand-violet text-xs font-black uppercase tracking-wider bg-transparent border-0 cursor-pointer p-0 transition-colors">
            <ArrowLeft size={16} /> Back to Suppliers
          </button>

          {/* Supplier Header */}
          <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-indigo/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-xl font-black text-slate-800 m-0">{selectedSupplier.name}</h2>
                <p className="text-xs text-slate-400 font-bold m-0 mt-1">{selectedSupplier.phone} {selectedSupplier.email && `· ${selectedSupplier.email}`}</p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <button onClick={exportCSV} className="bg-white border border-slate-200 text-slate-650 hover:bg-slate-55 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors shadow-sm flex items-center gap-2 cursor-pointer">
                  <Download size={14} /> Export CSV
                </button>
                <button onClick={() => setShowPurchaseModal(true)} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors shadow-sm flex items-center gap-2 cursor-pointer">
                  <TrendingUp size={14} /> Record Purchase
                </button>
                <button onClick={() => setShowPayModal(true)} className="bg-brand-indigo hover:bg-brand-violet text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors shadow-md flex items-center gap-2 cursor-pointer">
                  <CreditCard size={14} /> Record Payment
                </button>
              </div>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              {[
                { label: 'Total Purchased', value: ledger?.totalPurchased || 0, color: 'text-slate-850', bg: 'bg-slate-100/50', icon: TrendingUp },
                { label: 'Total Paid', value: ledger?.totalPaid || 0, color: 'text-teal-700', bg: 'bg-teal-50', icon: TrendingDown },
                { label: 'Balance Due', value: ledger?.balanceDue || 0, color: ledger?.balanceDue > 0 ? 'text-rose-600' : 'text-teal-700', bg: ledger?.balanceDue > 0 ? 'bg-rose-50' : 'bg-teal-50', icon: Wallet },
              ].map((c, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 text-center flex flex-col items-center">
                  <c.icon size={20} className={`${c.color} mb-1.5`} />
                  <p className="text-[9px] uppercase font-black tracking-wider text-slate-400 m-0 mb-1">{c.label}</p>
                  <p className={`text-lg font-black m-0 ${c.color}`}>Rs. {c.value.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4.5 border-b border-slate-100">
              <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider m-0">Transaction Ledger</h3>
            </div>
            {ledgerLoading ? (
              <div className="py-16 text-center text-slate-400 font-bold text-xs uppercase tracking-wider">Loading...</div>
            ) : !ledger?.transactions?.length ? (
              <div className="py-16 text-center text-slate-400 font-bold text-xs uppercase tracking-wider">No transactions yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {['Date', 'Type', 'Description', 'Recorded By', 'Amount', 'Balance'].map((h) => (
                        <th key={h} className="px-6 py-3.5 text-left text-[10px] uppercase font-black tracking-wider text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ledger.transactions.map((t, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-slate-650 font-bold">{new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                            t.type === 'purchase' ? 'bg-amber-50 text-amber-700 border-amber-100/60' : 'bg-teal-50 text-teal-700 border-teal-100/60'
                          }`}>
                            {t.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-semibold max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">{t.description}</td>
                        <td className="px-6 py-4 text-slate-500 font-semibold">{t.createdBy?.name || '—'}</td>
                        <td className={`px-6 py-4 font-black ${t.type === 'purchase' ? 'text-rose-500' : 'text-teal-650'}`}>
                          {t.type === 'purchase' ? '+' : '-'} Rs. {t.amount.toLocaleString()}
                        </td>
                        <td className={`px-6 py-4 font-black ${t.runningBalance > 0 ? 'text-rose-550' : 'text-teal-650'}`}>
                          Rs. {t.runningBalance.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Payment Modal */}
        {showPayModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4" onClick={() => setShowPayModal(false)}>
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-slate-205 flex items-center justify-between">
                <h3 className="text-lg font-bold text-dark-navy flex items-center gap-2"><CreditCard size={20} className="text-brand-indigo" /> Record Payment</h3>
                <button onClick={() => setShowPayModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-400 font-semibold m-0">
                  Payment to <strong>{selectedSupplier.name}</strong> · Balance Due: <strong className="text-rose-500">Rs. {(ledger?.balanceDue || 0).toLocaleString()}</strong>
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Amount (Rs.) *</label>
                  <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="0.00"
                    className="w-full border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-transparent transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Payment Method</label>
                  <div className="flex gap-2">
                    {['cash', 'bank_transfer', 'cheque'].map((m) => (
                      <button key={m} onClick={() => setPayMethod(m)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border cursor-pointer transition-all ${
                          payMethod === m ? 'bg-brand-indigo border-brand-indigo text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}>
                        {m.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
                
                {payMethod === 'cheque' && (
                  <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl space-y-3">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider m-0">Cheque Details</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Cheque No. *</label>
                        <input type="text" value={chequeDetails.chequeNumber} onChange={(e) => setChequeDetails({...chequeDetails, chequeNumber: e.target.value})} placeholder="0000123"
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-transparent transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Bank Name *</label>
                        <input type="text" value={chequeDetails.bankName} onChange={(e) => setChequeDetails({...chequeDetails, bankName: e.target.value})} placeholder="BOC"
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-transparent transition-all" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Cheque Date *</label>
                        <input type="date" value={chequeDetails.chequeDate} onChange={(e) => setChequeDetails({...chequeDetails, chequeDate: e.target.value})}
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-transparent transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Account No.</label>
                        <input type="text" value={chequeDetails.accountNumber} onChange={(e) => setChequeDetails({...chequeDetails, accountNumber: e.target.value})} placeholder="Optional"
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-transparent transition-all" />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Note (optional)</label>
                  <input type="text" value={payDescription} onChange={(e) => setPayDescription(e.target.value)} placeholder="Payment reference..."
                    className="w-full border border-slate-200 rounded-xl py-2.5 px-4 text-xs focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-transparent transition-all" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={handlePayment} disabled={paying} className="flex-1 bg-brand-indigo hover:bg-brand-violet text-white py-3 rounded-xl font-bold transition-all shadow-md disabled:opacity-50 cursor-pointer text-xs uppercase tracking-wider">
                    {paying ? 'Processing...' : 'Record Payment'}
                  </button>
                  <button onClick={() => setShowPayModal(false)} className="flex-1 border border-slate-200 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-55 transition-all cursor-pointer text-xs uppercase tracking-wider">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Purchase Modal */}
        {showPurchaseModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4" onClick={() => setShowPurchaseModal(false)}>
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-lg font-bold text-dark-navy flex items-center gap-2"><TrendingUp size={20} className="text-brand-indigo" /> Record Purchase</h3>
                <button onClick={() => setShowPurchaseModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Total Cost (Rs.) *</label>
                  <input type="number" value={purchaseForm.totalCost} onChange={(e) => setPurchaseForm({ ...purchaseForm, totalCost: e.target.value })} placeholder="0.00"
                    className="w-full border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-transparent transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Amount Paid (Rs.)</label>
                  <input type="number" value={purchaseForm.amountPaid} onChange={(e) => setPurchaseForm({ ...purchaseForm, amountPaid: e.target.value })} placeholder="0.00"
                    className="w-full border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-transparent transition-all" />
                </div>
                {purchaseForm.totalCost && (
                  <div className="bg-rose-50 border border-rose-100/60 p-3 rounded-lg text-xs">
                    <strong className="text-rose-600">Balance to track: Rs. {(Number(purchaseForm.totalCost || 0) - Number(purchaseForm.amountPaid || 0)).toLocaleString()}</strong>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Description (optional)</label>
                  <input type="text" value={purchaseForm.description} onChange={(e) => setPurchaseForm({ ...purchaseForm, description: e.target.value })} placeholder="Stock batch, items..."
                    className="w-full border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-transparent transition-all" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={handlePurchase} disabled={paying} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold transition-all shadow-md cursor-pointer text-xs uppercase tracking-wider">
                    {paying ? 'Saving...' : 'Record Purchase'}
                  </button>
                  <button onClick={() => setShowPurchaseModal(false)} className="flex-1 border border-slate-200 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all cursor-pointer text-xs uppercase tracking-wider">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    );
  }

  // Summary View
  return (
    <DashboardLayout title="Supplier Payments">
      <div className="animate-fade-in space-y-6">
        {/* Operations Control Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white/40 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-indigo/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-brand-indigo/10 flex items-center justify-center text-brand-indigo">
                <Wallet size={20} strokeWidth={2.5} />
              </div>
              <h1 className="text-2xl font-semibold text-slate-900 m-0">Supplier Payments</h1>
            </div>
            <p className="text-[10px] font-normal uppercase tracking-wider text-slate-500 mt-2 m-0">Track supplier balances, purchases, and payments</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => fetchSummary(true)}
              disabled={loading}
              className="bg-white border border-slate-200 text-slate-650 hover:bg-slate-50 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { label: 'Total Purchased', value: totalPurchased, color: 'text-slate-800', bg: 'bg-slate-100/50', icon: TrendingUp },
            { label: 'Total Paid', value: totalPaid, color: 'text-teal-700', bg: 'bg-teal-50', icon: DollarSign },
            { label: 'Total Due', value: totalDue, color: totalDue > 0 ? 'text-rose-600' : 'text-teal-700', bg: totalDue > 0 ? 'bg-rose-50' : 'bg-teal-50', icon: Wallet },
          ].map((c, i) => (
            <div key={i} className="glass-card rounded-[1.8rem] p-5 flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center`}>
                <c.icon size={20} className={c.color} />
              </div>
              <div>
                <p className="text-[9px] uppercase font-black tracking-wider text-slate-400 m-0 mb-1">{c.label}</p>
                <p className={`text-xl font-black m-0 ${c.color}`}>Rs. {c.value.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search & Export */}
        <div className="glass-card rounded-[2rem] p-5 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search suppliers..."
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-transparent transition-all" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={exportAllPaymentsExcel} className="bg-teal-50 border border-teal-100/60 text-teal-755 hover:bg-teal-100 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors shadow-sm flex items-center gap-2 cursor-pointer">
              <FileSpreadsheet size={14} /> Excel Export
            </button>
            <button onClick={exportAllPaymentsPDF} className="bg-rose-50 border border-rose-100/65 text-rose-650 hover:bg-rose-100 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors shadow-sm flex items-center gap-2 cursor-pointer">
              <FileText size={14} /> PDF Export
            </button>
          </div>
        </div>

        {/* Supplier Table */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-slate-400 font-bold text-xs uppercase tracking-wider">Loading suppliers...</div>
          ) : !filtered.length ? (
            <div className="py-16 text-center text-slate-400 font-bold text-xs uppercase tracking-wider">No suppliers found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Supplier', 'Contact', 'Total Purchased', 'Total Paid', 'Balance Due', 'Actions'].map((h) => (
                      <th key={h} className="px-6 py-4 text-[10px] uppercase font-black tracking-wider text-slate-500 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => openLedger(s)}>
                      <td className="px-6 py-4.5">
                        <span className="font-black text-slate-800 text-xs">{s.name}</span>
                      </td>
                      <td className="px-6 py-4.5 text-slate-450 font-bold">{s.phone || s.email || '—'}</td>
                      <td className="px-6 py-4.5 font-black text-slate-850">Rs. {(s.totalPurchased || 0).toLocaleString()}</td>
                      <td className="px-6 py-4.5 font-black text-teal-700">Rs. {(s.totalPaid || 0).toLocaleString()}</td>
                      <td className="px-6 py-4.5">
                        <span className={`text-[10px] font-black tracking-wider px-2.5 py-1 rounded-md border ${
                          s.balanceDue > 0 ? 'bg-rose-50 text-rose-700 border-rose-100/60' : 'bg-teal-50 text-teal-700 border-teal-100/60'
                        }`}>
                          Rs. {(s.balanceDue || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4.5">
                        <button onClick={(e) => { e.stopPropagation(); setSupplierToPay(s); setShowPayModal(true); }}
                          className="bg-brand-indigo/10 text-brand-indigo hover:bg-brand-indigo hover:text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer">
                          Pay
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payment Modal for Summary View */}
        {showPayModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4" onClick={() => { setShowPayModal(false); setSupplierToPay(null); }}>
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-slate-205 flex items-center justify-between">
                <h3 className="text-lg font-bold text-dark-navy flex items-center gap-2"><CreditCard size={20} className="text-brand-indigo" /> Record Payment</h3>
                <button onClick={() => { setShowPayModal(false); setSupplierToPay(null); }} className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-400 font-semibold m-0">
                  Payment to <strong>{(supplierToPay || selectedSupplier)?.name}</strong> · Balance Due: <strong className="text-rose-500">Rs. {((supplierToPay || ledger)?.balanceDue || 0).toLocaleString()}</strong>
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Amount (Rs.) *</label>
                  <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="0.00"
                    className="w-full border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-transparent transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Payment Method</label>
                  <div className="flex gap-2">
                    {['cash', 'bank_transfer', 'cheque'].map((m) => (
                      <button key={m} onClick={() => setPayMethod(m)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border cursor-pointer transition-all ${
                          payMethod === m ? 'bg-brand-indigo border-brand-indigo text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-55'
                        }`}>
                        {m.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
                
                {payMethod === 'cheque' && (
                  <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl space-y-3">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider m-0">Cheque Details</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Cheque No. *</label>
                        <input type="text" value={chequeDetails.chequeNumber} onChange={(e) => setChequeDetails({...chequeDetails, chequeNumber: e.target.value})} placeholder="0000123"
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-transparent transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Bank Name *</label>
                        <input type="text" value={chequeDetails.bankName} onChange={(e) => setChequeDetails({...chequeDetails, bankName: e.target.value})} placeholder="BOC"
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-transparent transition-all" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Cheque Date *</label>
                        <input type="date" value={chequeDetails.chequeDate} onChange={(e) => setChequeDetails({...chequeDetails, chequeDate: e.target.value})}
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-transparent transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Account No.</label>
                        <input type="text" value={chequeDetails.accountNumber} onChange={(e) => setChequeDetails({...chequeDetails, accountNumber: e.target.value})} placeholder="Optional"
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-transparent transition-all" />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Note (optional)</label>
                  <input type="text" value={payDescription} onChange={(e) => setPayDescription(e.target.value)} placeholder="Payment reference..."
                    className="w-full border border-slate-200 rounded-xl py-2.5 px-4 text-xs focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-transparent transition-all" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={handlePayment} disabled={paying} className="flex-1 bg-brand-indigo hover:bg-brand-violet text-white py-3 rounded-xl font-bold transition-all shadow-md disabled:opacity-50 cursor-pointer text-xs uppercase tracking-wider">
                    {paying ? 'Processing...' : 'Record Payment'}
                  </button>
                  <button onClick={() => { setShowPayModal(false); setSupplierToPay(null); }} className="flex-1 border border-slate-200 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all cursor-pointer text-xs uppercase tracking-wider">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ManagerSupplierPayments;

