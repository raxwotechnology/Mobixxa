'use client';

import { useState, useEffect, useCallback } from 'react';
import { Wallet, Search, ArrowLeft, CreditCard, TrendingUp, TrendingDown, DollarSign, Calendar, Download, ChevronDown, X, FileText, FileSpreadsheet, Edit2, Trash2, Save, CheckCircle, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import { adminNavGroups as navItems } from './adminNavItems';
import { getSupplierPaymentSummary, getSupplierLedger, recordSupplierPayment, recordSupplierPurchase, getSupplierPayments, updateSupplierTransaction, deleteSupplierTransaction, updateSupplierChequeStatus, getAccounts } from '../../services/api';

import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AdminSupplierPayments = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [payAccountId, setPayAccountId] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [payDescription, setPayDescription] = useState('');
  const [chequeDetails, setChequeDetails] = useState({ chequeNumber: '', bankName: '', chequeDate: '', accountNumber: '' });
  const [paying, setPaying] = useState(false);
  const [supplierToPay, setSupplierToPay] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState({ totalCost: '', amountPaid: '', description: '' });
  const [editTx, setEditTx] = useState(null); // transaction being edited
  const [editForm, setEditForm] = useState({ amount: '', description: '', date: '' });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

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

  // Fetch on mount
  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  useEffect(() => { getAccounts().then(res => setAccounts(res.data || [])).catch(() => setAccounts([])); }, []);

  // Auto-refresh when user switches back to this tab
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchSummary(true);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchSummary]);

  // Poll every 30 seconds to catch GRN updates from other pages
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
    if ((payMethod === 'bank_transfer' || payMethod === 'cheque') && !payAccountId) {
      return toast.error('Select which bank account this payment is for');
    }
    setPaying(true);
    try {
      await recordSupplierPayment(targetSupplier._id, {
        amount: Number(payAmount),
        paymentMethod: payMethod,
        accountId: (payMethod === 'bank_transfer' || payMethod === 'cheque') ? payAccountId : undefined,
        description: payDescription || undefined,
        ...(payMethod === 'cheque' ? chequeDetails : {})
      });
      toast.success('Payment recorded successfully');
      setShowPayModal(false);
      setPayAmount('');
      setPayDescription('');
      setPayAccountId('');
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

  const handleEditTx = (t) => {
    setEditTx(t._id);
    setEditForm({
      amount: t.amount,
      description: t.description || '',
      date: t.date ? new Date(t.date).toISOString().split('T')[0] : '',
    });
  };

  const handleSaveTx = async () => {
    try {
      await updateSupplierTransaction(editTx, { amount: Number(editForm.amount), description: editForm.description, date: editForm.date });
      toast.success('Transaction updated');
      setEditTx(null);
      openLedger(selectedSupplier);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleDeleteClick = (transaction) => {
    setItemToDelete(transaction);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteSupplierTransaction(itemToDelete._id);
      toast.success('Transaction deleted');
      openLedger(selectedSupplier);
      fetchSummary(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
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
      <DashboardLayout navItems={navItems} title="Supplier Payments">
        <div className="ds-page">
          {/* Back Button */}
          <button 
            onClick={() => { setSelectedSupplier(null); setLedger(null); }}
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-transparent border-0 cursor-pointer p-0 mb-3"
          >
            <ArrowLeft size={16} /> Back to Suppliers
          </button>

          {/* Supplier Header */}
          <div className="ds-card p-6 bg-slate-50/50">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 m-0">{selectedSupplier.name}</h2>
                <p className="text-xs text-slate-500 mt-1 m-0">{selectedSupplier.phone} {selectedSupplier.email && `· ${selectedSupplier.email}`}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={exportCSV} className="ds-btn ds-btn-secondary text-xs">
                  <Download size={14} /> Export CSV
                </button>
                <button onClick={() => setShowPurchaseModal(true)} className="ds-btn ds-btn-secondary text-xs">
                  <TrendingUp size={14} /> Record Purchase
                </button>
                <button onClick={() => setShowPayModal(true)} className="ds-btn ds-btn-primary text-xs">
                  <CreditCard size={14} /> Record Payment
                </button>
              </div>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
              <div className="ds-stat bg-white">
                <div className="ds-stat-label">Total Purchased</div>
                <div className="ds-stat-value text-slate-900">LKR {(ledger?.totalPurchased || 0).toLocaleString()}</div>
                <p className="ds-stat-sub">Lifetime supplies</p>
              </div>
              <div className="ds-stat bg-white">
                <div className="ds-stat-label text-emerald-600">Total Paid</div>
                <div className="ds-stat-value text-emerald-600">LKR {(ledger?.totalPaid || 0).toLocaleString()}</div>
                <p className="ds-stat-sub">Disbursed amount</p>
              </div>
              <div className="ds-stat bg-white">
                <div className={`ds-stat-label ${ledger?.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>Balance Due</div>
                <div className={`ds-stat-value ${ledger?.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>LKR {(ledger?.balanceDue || 0).toLocaleString()}</div>
                <p className="ds-stat-sub">Pending settlement</p>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="ds-table-wrap">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider m-0">Transaction Ledger</h3>
            </div>
            {ledgerLoading ? (
              <div className="p-16 text-center text-slate-400 text-xs">Loading ledger...</div>
            ) : !ledger?.transactions?.length ? (
              <div className="p-16 text-center text-slate-400 text-xs">No transactions yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="ds-table">
                  <thead>
                    <tr>
                      {['Date', 'Type', 'Description', 'By', 'Amount', 'Balance', 'Actions'].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.transactions.map((t, i) => (
                      <tr key={i} className={editTx === t._id ? 'bg-slate-50' : ''}>
                        <td className="min-w-[100px] text-xs">
                          {editTx === t._id
                            ? <input type="date" value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })} className="ds-input text-xs py-1 px-2 w-auto" />
                            : new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td>
                          <span className={`ds-badge ${t.type === 'purchase' ? 'ds-badge-amber' : 'ds-badge-green'}`}>
                            {t.type === 'purchase' ? 'PURCHASE' : 'PAYMENT'}
                          </span>
                        </td>
                        <td className="text-slate-500 text-xs max-w-[200px] truncate">
                          {editTx === t._id
                            ? <input value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} className="ds-input text-xs py-1 px-2" />
                            : <span>{t.description}</span>}
                        </td>
                        <td className="text-slate-500 text-xs">{t.createdBy?.name || '—'}</td>
                        <td className={`font-semibold text-xs ${t.type === 'purchase' ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {editTx === t._id
                            ? <input type="number" value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: e.target.value })} className="ds-input text-xs py-1 px-2 w-24" />
                            : <>{t.type === 'purchase' ? '+' : '-'} LKR {t.amount.toLocaleString()}</>}
                        </td>
                        <td className={`font-bold text-xs ${t.runningBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          LKR {t.runningBalance.toLocaleString()}
                        </td>
                        <td>
                          {editTx === t._id ? (
                            <div className="flex gap-2">
                              <button onClick={handleSaveTx} className="ds-btn ds-btn-primary py-1 px-2.5 text-xs">Save</button>
                              <button onClick={() => setEditTx(null)} className="ds-btn ds-btn-secondary py-1 px-2.5 text-xs">Cancel</button>
                            </div>
                          ) : (
                            <div className="flex gap-1.5">
                              <button onClick={() => handleEditTx(t)} title="Edit" className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border-0 cursor-pointer">
                                <Edit2 size={13} />
                              </button>
                              <button onClick={() => handleDeleteClick(t)} title="Delete" className="p-1.5 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-lg border-0 cursor-pointer">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Cheque Tracking Section */}
          {ledger?.chequeSummary && ledger.chequeSummary.totalCheques > 0 && (
            <div className="ds-table-wrap">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center flex-wrap gap-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider m-0">Cheque Tracking</h3>
                <div className="flex gap-2 flex-wrap">
                  <span className="ds-badge ds-badge-green">Paid: {ledger.chequeSummary.paid}</span>
                  <span className="ds-badge ds-badge-amber">Pending: {ledger.chequeSummary.pending}</span>
                  <span className="ds-badge ds-badge-red">Bounced: {ledger.chequeSummary.bounced}</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="ds-table">
                  <thead>
                    <tr>
                      {['Cheque No', 'Bank', 'Cheque Date', 'Amount', 'Account', 'Status', 'Action'].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(ledger.chequeSummary.cheques || []).map((ch, ci) => (
                      <tr key={ci}>
                        <td className="font-semibold text-slate-900 text-xs">{ch.chequeNumber}</td>
                        <td className="text-slate-500 text-xs">{ch.bankName}</td>
                        <td className="text-slate-500 text-xs">{ch.chequeDate ? new Date(ch.chequeDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                        <td className="font-bold text-slate-900 text-xs">LKR {Number(ch.amount || 0).toLocaleString()}</td>
                        <td className="text-slate-500 text-xs">{ch.accountNumber || '—'}</td>
                        <td>
                          <span className={`ds-badge ${ch.status === 'paid' ? 'ds-badge-green' : ch.status === 'bounced' ? 'ds-badge-red' : 'ds-badge-amber'}`}>
                            {ch.status === 'paid' ? 'Paid' : ch.status === 'bounced' ? 'Bounced' : 'Pending'}
                          </span>
                        </td>
                        <td>
                          <select
                            value={ch.status}
                            onChange={async (e) => {
                              try {
                                await updateSupplierChequeStatus(ch.paymentId, { chequeStatus: e.target.value, status: e.target.value });
                                toast.success('Cheque status updated');
                                openLedger(selectedSupplier);
                              } catch { toast.error('Failed to update cheque status'); }
                            }}
                            className="ds-input py-1 px-2 text-xs w-auto cursor-pointer"
                          >
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="bounced">Bounced</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Payment Modal */}
        {showPayModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="ds-modal max-w-md w-full p-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-sm font-bold text-slate-900 m-0">Record Payment</h3>
                <button onClick={() => setShowPayModal(false)} className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-lg border-0 cursor-pointer"><X size={15} /></button>
              </div>
              <p className="text-xs text-slate-600 mb-4">
                Payment to <strong className="text-slate-900">{selectedSupplier.name}</strong> · Balance: <strong className="text-rose-600">LKR {(ledger?.balanceDue || 0).toLocaleString()}</strong>
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Amount (LKR) *</label>
                  <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="0.00"
                    className="ds-input" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['cash', 'bank_transfer', 'cheque'].map((m) => (
                      <button key={m} onClick={() => setPayMethod(m)}
                        className={`py-2 rounded-lg text-xs font-semibold border capitalize transition-colors ${payMethod === m ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
                        {m.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {(payMethod === 'bank_transfer' || payMethod === 'cheque') && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      {payMethod === 'cheque' ? 'Deposit To Account' : 'Bank Account'}
                    </label>
                    <select value={payAccountId} onChange={(e) => setPayAccountId(e.target.value)}
                      className="ds-input">
                      <option value="">Select account...</option>
                      {accounts.filter(a => a.type === 'Bank').map(a => (
                        <option key={a._id} value={a._id}>{a.name} — {a.bankName} ({a.accountNumber})</option>
                      ))}
                    </select>
                  </div>
                )}

                {payMethod === 'cheque' && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 m-0">Cheque Details</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[0.65rem] font-semibold text-slate-500 uppercase block mb-1">Cheque No. *</label>
                        <input type="text" value={chequeDetails.chequeNumber} onChange={(e) => setChequeDetails({...chequeDetails, chequeNumber: e.target.value})} placeholder="0000123"
                          className="ds-input text-xs py-1.5" />
                      </div>
                      <div>
                        <label className="text-[0.65rem] font-semibold text-slate-500 uppercase block mb-1">Bank Name *</label>
                        <input type="text" value={chequeDetails.bankName} onChange={(e) => setChequeDetails({...chequeDetails, bankName: e.target.value})} placeholder="BOC"
                          className="ds-input text-xs py-1.5" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[0.65rem] font-semibold text-slate-500 uppercase block mb-1">Cheque Date *</label>
                        <input type="date" value={chequeDetails.chequeDate} onChange={(e) => setChequeDetails({...chequeDetails, chequeDate: e.target.value})}
                          className="ds-input text-xs py-1.5" />
                      </div>
                      <div>
                        <label className="text-[0.65rem] font-semibold text-slate-500 uppercase block mb-1">Account No.</label>
                        <input type="text" value={chequeDetails.accountNumber} onChange={(e) => setChequeDetails({...chequeDetails, accountNumber: e.target.value})} placeholder="Optional"
                          className="ds-input text-xs py-1.5" />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Note (optional)</label>
                  <input type="text" value={payDescription} onChange={(e) => setPayDescription(e.target.value)} placeholder="Payment reference..."
                    className="ds-input" />
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setShowPayModal(false)} className="ds-btn ds-btn-secondary">
                    Cancel
                  </button>
                  <button onClick={handlePayment} disabled={paying} className="ds-btn ds-btn-primary flex-1 justify-center">
                    {paying ? 'Processing...' : `Pay LKR ${Number(payAmount || 0).toLocaleString()}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Purchase Modal */}
        {showPurchaseModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="ds-modal max-w-md w-full p-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-sm font-bold text-slate-900 m-0">Record Purchase</h3>
                <button onClick={() => setShowPurchaseModal(false)} className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-lg border-0 cursor-pointer"><X size={15} /></button>
              </div>
              <p className="text-xs text-slate-600 mb-3">
                Stock purchase from <strong className="text-slate-900">{selectedSupplier.name}</strong>
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Total Purchase Cost (LKR) *</label>
                  <input type="number" value={purchaseForm.totalCost} onChange={(e) => setPurchaseForm({...purchaseForm, totalCost: e.target.value})} placeholder="e.g. 10000"
                    className="ds-input font-bold" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Amount Paid Now (LKR)</label>
                  <input type="number" value={purchaseForm.amountPaid} onChange={(e) => setPurchaseForm({...purchaseForm, amountPaid: e.target.value})} placeholder="e.g. 5000 (optional)"
                    className="ds-input" />
                </div>
                {purchaseForm.totalCost && (
                  <div className="bg-rose-50 p-3 rounded-xl border border-rose-100 text-xs">
                    <strong className="text-rose-600">Balance to track: LKR {(Number(purchaseForm.totalCost || 0) - Number(purchaseForm.amountPaid || 0)).toLocaleString()}</strong>
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Description (optional)</label>
                  <input type="text" value={purchaseForm.description} onChange={(e) => setPurchaseForm({...purchaseForm, description: e.target.value})} placeholder="Stock batch, items..."
                    className="ds-input" />
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setShowPurchaseModal(false)} className="ds-btn ds-btn-secondary">
                    Cancel
                  </button>
                  <button onClick={handlePurchase} disabled={paying} className="ds-btn ds-btn-primary flex-1 justify-center">
                    {paying ? 'Processing...' : 'Record Purchase'}
                  </button>
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
    <DashboardLayout navItems={navItems} title="Supplier Payments">
      <div className="ds-page">
        <div className="ds-page-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Wallet size={20} strokeWidth={2} />
            </div>
            <div>
              <h1 className="ds-page-title">Supplier Payments</h1>
              <p className="ds-page-subtitle">Track supplier balances, purchases, and payments</p>
            </div>
          </div>
          <button
            onClick={() => fetchSummary(true)}
            disabled={loading}
            className="ds-btn ds-btn-secondary"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="ds-stat">
            <div className="ds-stat-label">Total Purchased</div>
            <div className="ds-stat-value text-slate-900">LKR {totalPurchased.toLocaleString()}</div>
            <p className="ds-stat-sub">Lifetime purchases</p>
          </div>
          <div className="ds-stat">
            <div className="ds-stat-label text-emerald-600">Total Paid</div>
            <div className="ds-stat-value text-emerald-600">LKR {totalPaid.toLocaleString()}</div>
            <p className="ds-stat-sub">Settled invoices</p>
          </div>
          <div className="ds-stat">
            <div className={`ds-stat-label ${totalDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>Total Due</div>
            <div className={`ds-stat-value ${totalDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>LKR {totalDue.toLocaleString()}</div>
            <p className="ds-stat-sub">Outstanding balance</p>
          </div>
        </div>

        {/* Search & Export */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Search suppliers..."
              className="ds-input pl-10" 
            />
          </div>
          <div className="flex gap-2">
            <button onClick={exportAllPaymentsExcel} className="ds-btn ds-btn-secondary text-xs">
              <FileSpreadsheet size={14} /> Excel
            </button>
            <button onClick={exportAllPaymentsPDF} className="ds-btn ds-btn-secondary text-xs">
              <FileText size={14} /> PDF
            </button>
          </div>
        </div>

        {/* Supplier Table */}
        <div className="ds-table-wrap">
          {loading ? (
            <div className="p-16 text-center text-slate-400 text-xs">Loading suppliers...</div>
          ) : !filtered.length ? (
            <div className="p-16 text-center text-slate-400 text-xs">No suppliers found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="ds-table">
                <thead>
                  <tr>
                    <th>Supplier</th>
                    <th>Contact</th>
                    <th>Total Purchased</th>
                    <th>Total Paid</th>
                    <th>Balance Due</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s._id} className="cursor-pointer" onClick={() => openLedger(s)}>
                      <td>
                        <span className="font-semibold text-slate-900 text-xs">{s.name}</span>
                      </td>
                      <td className="text-slate-500 text-xs">{s.phone || s.email || '—'}</td>
                      <td className="font-medium text-slate-800 text-xs">LKR {(s.totalPurchased || 0).toLocaleString()}</td>
                      <td className="font-medium text-emerald-600 text-xs">LKR {(s.totalPaid || 0).toLocaleString()}</td>
                      <td>
                        <span className={`ds-badge ${s.balanceDue > 0 ? 'ds-badge-red' : 'ds-badge-green'}`}>
                          LKR {(s.balanceDue || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="text-right">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSupplierToPay(s); setShowPayModal(true); }}
                          className="ds-btn ds-btn-primary py-1 px-3 text-xs"
                        >
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
      </div>

      {/* Payment Modal for Summary View */}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="ds-modal max-w-md w-full p-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900 m-0">Record Payment</h3>
              <button onClick={() => { setShowPayModal(false); setSupplierToPay(null); }} className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-lg border-0 cursor-pointer"><X size={15} /></button>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Payment to <strong className="text-slate-900">{(supplierToPay || selectedSupplier)?.name}</strong> · Balance: <strong className="text-rose-600">LKR {((supplierToPay || ledger)?.balanceDue || 0).toLocaleString()}</strong>
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Amount (LKR) *</label>
                <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="0.00"
                  className="ds-input" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {['cash', 'bank_transfer', 'cheque'].map((m) => (
                    <button key={m} onClick={() => setPayMethod(m)}
                      className={`py-2 rounded-lg text-xs font-semibold border capitalize transition-colors ${payMethod === m ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
                      {m.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {(payMethod === 'bank_transfer' || payMethod === 'cheque') && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {payMethod === 'cheque' ? 'Deposit To Account' : 'Bank Account'}
                  </label>
                  <select value={payAccountId} onChange={(e) => setPayAccountId(e.target.value)}
                    className="ds-input">
                    <option value="">Select account...</option>
                    {accounts.filter(a => a.type === 'Bank').map(a => (
                      <option key={a._id} value={a._id}>{a.name} — {a.bankName} ({a.accountNumber})</option>
                    ))}
                  </select>
                </div>
              )}

              {payMethod === 'cheque' && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 m-0">Cheque Details</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[0.65rem] font-semibold text-slate-500 uppercase block mb-1">Cheque No. *</label>
                      <input type="text" value={chequeDetails.chequeNumber} onChange={(e) => setChequeDetails({...chequeDetails, chequeNumber: e.target.value})} placeholder="0000123"
                        className="ds-input text-xs py-1.5" />
                    </div>
                    <div>
                      <label className="text-[0.65rem] font-semibold text-slate-500 uppercase block mb-1">Bank Name *</label>
                      <input type="text" value={chequeDetails.bankName} onChange={(e) => setChequeDetails({...chequeDetails, bankName: e.target.value})} placeholder="BOC"
                        className="ds-input text-xs py-1.5" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[0.65rem] font-semibold text-slate-500 uppercase block mb-1">Cheque Date *</label>
                      <input type="date" value={chequeDetails.chequeDate} onChange={(e) => setChequeDetails({...chequeDetails, chequeDate: e.target.value})}
                        className="ds-input text-xs py-1.5" />
                    </div>
                    <div>
                      <label className="text-[0.65rem] font-semibold text-slate-500 uppercase block mb-1">Account No.</label>
                      <input type="text" value={chequeDetails.accountNumber} onChange={(e) => setChequeDetails({...chequeDetails, accountNumber: e.target.value})} placeholder="Optional"
                        className="ds-input text-xs py-1.5" />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Note (optional)</label>
                <input type="text" value={payDescription} onChange={(e) => setPayDescription(e.target.value)} placeholder="Payment reference..."
                  className="ds-input" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => { setShowPayModal(false); setSupplierToPay(null); }} className="ds-btn ds-btn-secondary">
                  Cancel
                </button>
                <button onClick={handlePayment} disabled={paying} className="ds-btn ds-btn-primary flex-1 justify-center">
                  {paying ? 'Processing...' : `Pay LKR ${Number(payAmount || 0).toLocaleString()}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setItemToDelete(null); }}
        onConfirm={handleDeleteConfirm}
        itemName="this transaction"
      />
    </DashboardLayout>
  );
};

export default AdminSupplierPayments;
