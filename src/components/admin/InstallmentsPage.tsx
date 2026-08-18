'use client';

import { useState } from 'react';
import {
  Search,
  Calendar,
  User,
  Phone,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Filter,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  Eye,
  CreditCard,
  Building2,
  Printer,
  X,
  Sparkles,
} from 'lucide-react';

export interface InstallmentRecord {
  id: string;
  agreementNo: string;
  customerName: string;
  phone: string;
  nic: string;
  item: string;
  originalPrice: number;
  downPayment: number;
  totalPayable: number;
  remainingBalance: number;
  monthlyAmount: number;
  durationMonths: number;
  paidMonths: number;
  nextDueDate: string;
  status: 'ACTIVE' | 'OVERDUE' | 'COMPLETED';
}

const mockInstallments: InstallmentRecord[] = [
  {
    id: 'hp-1',
    agreementNo: 'HP-2026-0891',
    customerName: 'Kasun Kalhara Perera',
    phone: '077 123 4567',
    nic: '19928374928V',
    item: 'Google Pixel 10 Pro 256GB',
    originalPrice: 289999,
    downPayment: 50000,
    totalPayable: 251999,
    remainingBalance: 167999,
    monthlyAmount: 20999,
    durationMonths: 12,
    paidMonths: 4,
    nextDueDate: '2026-09-05',
    status: 'ACTIVE',
  },
  {
    id: 'hp-2',
    agreementNo: 'HP-2026-0854',
    customerName: 'Dilshan Madushanka',
    phone: '071 987 6543',
    nic: '19901238495V',
    item: 'iPhone 16 Pro Max 256GB',
    originalPrice: 449900,
    downPayment: 100000,
    totalPayable: 367395,
    remainingBalance: 244930,
    monthlyAmount: 30616,
    durationMonths: 12,
    paidMonths: 4,
    nextDueDate: '2026-08-10', // Past date -> Overdue
    status: 'OVERDUE',
  },
  {
    id: 'hp-3',
    agreementNo: 'HP-2026-0792',
    customerName: 'Nimesha Fernando',
    phone: '075 444 3322',
    nic: '199587654321',
    item: 'MacBook Air M4 15-inch',
    originalPrice: 549000,
    downPayment: 150000,
    totalPayable: 418950,
    remainingBalance: 0,
    monthlyAmount: 23275,
    durationMonths: 18,
    paidMonths: 18,
    nextDueDate: 'Completed',
    status: 'COMPLETED',
  },
  {
    id: 'hp-4',
    agreementNo: 'HP-2026-0912',
    customerName: 'Roshan Silva',
    phone: '076 888 1122',
    nic: '19882345678V',
    item: 'Samsung Galaxy S25 Ultra',
    originalPrice: 419900,
    downPayment: 80000,
    totalPayable: 356895,
    remainingBalance: 297412,
    monthlyAmount: 29741,
    durationMonths: 12,
    paidMonths: 2,
    nextDueDate: '2026-09-01',
    status: 'ACTIVE',
  },
  {
    id: 'hp-5',
    agreementNo: 'HP-2026-0820',
    customerName: 'Thilina Jayasinghe',
    phone: '070 555 9900',
    nic: '19934567891V',
    item: 'PlayStation 5 Pro 2TB',
    originalPrice: 319900,
    downPayment: 70000,
    totalPayable: 262395,
    remainingBalance: 174930,
    monthlyAmount: 29155,
    durationMonths: 9,
    paidMonths: 3,
    nextDueDate: '2026-08-12', // Past date -> Overdue
    status: 'OVERDUE',
  },
];

export default function InstallmentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'OVERDUE' | 'COMPLETED'>('ALL');
  const [selectedRecord, setSelectedRecord] = useState<InstallmentRecord | null>(null);
  const [collectPaymentRecord, setCollectPaymentRecord] = useState<InstallmentRecord | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<any | null>(null);

  // Dynamic search matching Name, Phone, NIC, or Agreement No.
  const filteredRecords = mockInstallments.filter((record) => {
    const matchStatus = statusFilter === 'ALL' || record.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      record.customerName.toLowerCase().includes(q) ||
      record.phone.toLowerCase().includes(q) ||
      record.nic.toLowerCase().includes(q) ||
      record.agreementNo.toLowerCase().includes(q) ||
      record.item.toLowerCase().includes(q);

    return matchStatus && matchSearch;
  });

  // Calculate top metric totals
  const totalActiveSales = mockInstallments.filter((r) => r.status === 'ACTIVE' || r.status === 'OVERDUE').length;
  const totalOutstandingBalance = mockInstallments.reduce((acc, r) => acc + r.remainingBalance, 0);
  const totalCompletedAgreements = mockInstallments.filter((r) => r.status === 'COMPLETED').length;
  const totalOverdueCount = mockInstallments.filter((r) => r.status === 'OVERDUE').length;

  const handleRecordPayment = () => {
    if (!collectPaymentRecord) return;
    const receiptData = {
      receiptNo: 'REC-' + Math.floor(100000 + Math.random() * 900000),
      agreementNo: collectPaymentRecord.agreementNo,
      customerName: collectPaymentRecord.customerName,
      nic: collectPaymentRecord.nic,
      item: collectPaymentRecord.item,
      amountPaid: collectPaymentRecord.monthlyAmount,
      installmentNo: collectPaymentRecord.paidMonths + 1,
      totalMonths: collectPaymentRecord.durationMonths,
      newRemainingBalance: Math.max(0, collectPaymentRecord.remainingBalance - collectPaymentRecord.monthlyAmount),
      date: new Date().toLocaleString('en-LK', { dateStyle: 'medium', timeStyle: 'short' }),
    };

    setPaymentSuccess(receiptData);
    setCollectPaymentRecord(null);
  };

  return (
    <div className="w-full min-h-screen bg-slate-100 flex flex-col">
      {/* ── Page Header ── */}
      <div className="w-full bg-slate-900 text-white px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32 py-8 border-b border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-widest mb-3">
              <ShieldCheck size={14} className="text-yellow-400" />
              Hire Purchase Management
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-none">
              Installments &amp; Credit Sales Registry
            </h1>
            <p className="text-slate-400 text-sm mt-2 max-w-xl">
              Track customer Hire Purchase agreements, monitor monthly installment schedules, and process installment collections.
            </p>
          </div>

          <a
            href="/pos"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-blue-900/40 transition-all duration-200"
          >
            <Plus size={18} />
            New HP Sale (POS)
          </a>
        </div>
      </div>

      {/* ── Body Container ── */}
      <div className="w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32 py-8 space-y-8">

        {/* ── TOP METRIC CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Active Credit Sales */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FileText size={28} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Credit Sales</p>
              <p className="text-3xl font-extrabold text-slate-900 mt-1">{totalActiveSales}</p>
              <p className="text-[11px] text-blue-600 font-semibold mt-0.5">Agreements in progress</p>
            </div>
          </div>

          {/* Card 2: Total Outstanding Balance */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <DollarSign size={28} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Outstanding</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                Rs. {(totalOutstandingBalance / 1000000).toFixed(2)}M
              </p>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Rs. {totalOutstandingBalance.toLocaleString()}</p>
            </div>
          </div>

          {/* Card 3: Completed Agreements */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={28} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed Agreements</p>
              <p className="text-3xl font-extrabold text-slate-900 mt-1">{totalCompletedAgreements}</p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Fully paid &amp; settled</p>
            </div>
          </div>

          {/* Card 4: Overdue Payments */}
          <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle size={28} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overdue Payments</p>
              <p className="text-3xl font-extrabold text-rose-600 mt-1">{totalOverdueCount}</p>
              <p className="text-[11px] text-rose-500 font-bold mt-0.5">Requires collection follow-up</p>
            </div>
          </div>
        </div>

        {/* ── SEARCH & FILTER TOOLBAR ── */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-wrap items-center justify-between gap-4">
          {/* Dynamic Search */}
          <div className="flex-1 min-w-72 flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus-within:border-blue-500 focus-within:bg-white transition-all">
            <Search size={18} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by Customer Name, Phone, NIC (1992...), or Agreement No (HP-2026)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none font-medium"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600 text-xs">
                Clear
              </button>
            )}
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-2">
            {[
              { id: 'ALL', label: 'All Agreements' },
              { id: 'ACTIVE', label: 'Active' },
              { id: 'OVERDUE', label: 'Overdue' },
              { id: 'COMPLETED', label: 'Completed' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setStatusFilter(id as any)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-150
                  ${statusFilter === id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── INSTALLMENT REGISTRY TABLE ── */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-6">Agreement No.</th>
                  <th className="py-4 px-6">Customer &amp; NIC</th>
                  <th className="py-4 px-6">Purchased Item</th>
                  <th className="py-4 px-6">Total / Down Payment</th>
                  <th className="py-4 px-6">Remaining Balance</th>
                  <th className="py-4 px-6">Monthly Amount</th>
                  <th className="py-4 px-6">Next Due Date</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Agreement No */}
                    <td className="py-4 px-6 font-mono font-bold text-blue-600">
                      {record.agreementNo}
                    </td>

                    {/* Customer */}
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-900">{record.customerName}</p>
                      <p className="text-[11px] text-slate-400">NIC: {record.nic} · {record.phone}</p>
                    </td>

                    {/* Item */}
                    <td className="py-4 px-6 font-semibold text-slate-800">
                      {record.item}
                    </td>

                    {/* Total / Down */}
                    <td className="py-4 px-6">
                      <p className="font-extrabold text-slate-900">Rs. {record.originalPrice.toLocaleString()}</p>
                      <p className="text-[11px] text-slate-400">Down: Rs. {record.downPayment.toLocaleString()}</p>
                    </td>

                    {/* Remaining */}
                    <td className="py-4 px-6 font-extrabold text-slate-900">
                      Rs. {record.remainingBalance.toLocaleString()}
                    </td>

                    {/* Monthly */}
                    <td className="py-4 px-6">
                      <p className="font-extrabold text-blue-600">Rs. {record.monthlyAmount.toLocaleString()}</p>
                      <p className="text-[11px] text-slate-400">{record.paidMonths} / {record.durationMonths} months paid</p>
                    </td>

                    {/* Next Due */}
                    <td className="py-4 px-6 font-semibold">
                      {record.status === 'COMPLETED' ? (
                        <span className="text-emerald-600 font-bold">Settled</span>
                      ) : (
                        <span className={record.status === 'OVERDUE' ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                          {record.nextDueDate}
                        </span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-6">
                      {record.status === 'ACTIVE' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 font-extrabold text-[10px] border border-blue-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                          ACTIVE
                        </span>
                      )}
                      {record.status === 'OVERDUE' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-600 font-extrabold text-[10px] border border-rose-100">
                          <AlertTriangle size={12} />
                          OVERDUE
                        </span>
                      )}
                      {record.status === 'COMPLETED' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 font-extrabold text-[10px] border border-emerald-100">
                          <CheckCircle2 size={12} />
                          COMPLETED
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => setSelectedRecord(record)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                      >
                        View
                      </button>
                      {record.status !== 'COMPLETED' && (
                        <button
                          onClick={() => setCollectPaymentRecord(record)}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition-colors shadow-sm"
                        >
                          Collect Payment
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredRecords.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <FileText size={40} className="mb-2 text-slate-300" />
                <p className="text-base font-bold text-slate-600">No installment agreements found</p>
                <p className="text-xs">Try adjusting your search criteria or status filter.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── COLLECT PAYMENT MODAL ── */}
      {collectPaymentRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setCollectPaymentRecord(null)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <CreditCard size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Collect Monthly Installment</h3>
                <p className="text-xs text-slate-500">Agreement {collectPaymentRecord.agreementNo}</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2 text-xs mb-5">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-900">{collectPaymentRecord.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Item:</span>
                <span className="font-semibold text-slate-800">{collectPaymentRecord.item}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Installment Number:</span>
                <span className="font-bold text-blue-600">Month {collectPaymentRecord.paidMonths + 1} of {collectPaymentRecord.durationMonths}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-extrabold text-slate-900">
                <span>Amount Due Now:</span>
                <span className="text-blue-600">Rs. {collectPaymentRecord.monthlyAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCollectPaymentRecord(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-2xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordPayment}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-2xl shadow-md transition-colors"
              >
                Confirm Payment &amp; Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PAYMENT RECEIPT SUCCESS MODAL ── */}
      {paymentSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
            <div className="text-center pb-4 border-b border-dashed border-slate-200">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="font-extrabold text-slate-900 text-xl">Installment Receipt</h3>
              <p className="text-xs text-slate-500 font-mono">Receipt #{paymentSuccess.receiptNo}</p>
              <p className="text-[11px] text-slate-400">{paymentSuccess.date}</p>
            </div>

            <div className="py-4 border-b border-dashed border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Agreement No:</span>
                <span className="font-mono font-bold text-blue-600">{paymentSuccess.agreementNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-900">{paymentSuccess.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Item Purchased:</span>
                <span className="font-semibold text-slate-800">{paymentSuccess.item}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Installment:</span>
                <span className="font-bold">Month {paymentSuccess.installmentNo} of {paymentSuccess.totalMonths}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-emerald-600 pt-2 border-t border-slate-100">
                <span>Amount Paid:</span>
                <span>Rs. {paymentSuccess.amountPaid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>New Remaining Balance:</span>
                <span className="font-bold">Rs. {paymentSuccess.newRemainingBalance.toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-5 flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-2xl flex items-center justify-center gap-2"
              >
                <Printer size={16} />
                Print Receipt
              </button>
              <button
                onClick={() => setPaymentSuccess(null)}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-2xl shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW AGREEMENT DETAILS MODAL ── */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-lg p-6 relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedRecord(null)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Agreement Details</h3>
                <p className="text-xs text-blue-600 font-mono">{selectedRecord.agreementNo}</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Customer */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="font-bold text-slate-500 uppercase tracking-wider mb-2 text-[10px]">Customer Information</p>
                <p className="font-extrabold text-slate-900 text-sm mb-0.5">{selectedRecord.customerName}</p>
                <p className="text-slate-600">NIC: {selectedRecord.nic}</p>
                <p className="text-slate-600">Phone: {selectedRecord.phone}</p>
              </div>

              {/* Purchase Details */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="font-bold text-slate-500 uppercase tracking-wider mb-2 text-[10px]">Hardware Purchase &amp; Terms</p>
                <p className="font-extrabold text-slate-900 mb-1">{selectedRecord.item}</p>
                <div className="space-y-1 text-slate-700 mt-2">
                  <div className="flex justify-between"><span>Original Price:</span><span className="font-bold">Rs. {selectedRecord.originalPrice.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Down Payment Paid:</span><span className="font-bold">Rs. {selectedRecord.downPayment.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Total Payable:</span><span className="font-bold">Rs. {selectedRecord.totalPayable.toLocaleString()}</span></div>
                  <div className="flex justify-between text-blue-600 font-extrabold pt-1 border-t border-slate-200">
                    <span>Monthly Amount:</span><span>Rs. {selectedRecord.monthlyAmount.toLocaleString()} / mo</span>
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Payment Schedule Progress</span>
                  <span className="font-extrabold text-blue-600">{selectedRecord.paidMonths} / {selectedRecord.durationMonths} Months</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${(selectedRecord.paidMonths / selectedRecord.durationMonths) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedRecord(null)}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-2xl transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
