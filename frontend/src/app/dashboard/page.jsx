"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  CreditCard,
  Calendar,
  FileText,
  Download,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  LogOut,
  Edit3,
  X,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  mockCustomer,
  mockHirePurchaseContract,
  mockRecentOrders,
} from "@/data/mockCustomerData";

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState(mockCustomer);
  const [contract, setContract] = useState(mockHirePurchaseContract);
  const [orders] = useState(mockRecentOrders);

  // Payment Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("card");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Load custom customer data from localStorage if available
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("mobixa_user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setCustomer((prev) => ({
          ...prev,
          name: parsed.name || prev.name,
          email: parsed.email || prev.email,
        }));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("mobixa_user");
    window.dispatchEvent(new Event("authChange"));
    router.push("/");
  };

  // Simulate paying an installment
  const handleConfirmPayment = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setPaymentSuccess(true);

      // Update schedule locally
      setContract((prev) => {
        const updatedSchedule = prev.paymentSchedule.map((item) => {
          if (item.status === "Upcoming Due") {
            return {
              ...item,
              status: "Paid",
              receiptId: `REC-2026-1001`,
            };
          }
          if (item.id === 6) {
            return {
              ...item,
              status: "Upcoming Due",
            };
          }
          return item;
        });

        const newPaidCount = prev.installmentsPaid + 1;
        return {
          ...prev,
          installmentsPaid: newPaidCount,
          nextDueDate: "November 05, 2026",
          paymentSchedule: updatedSchedule,
        };
      });

      setTimeout(() => {
        setIsPayModalOpen(false);
        setPaymentSuccess(false);
      }, 1500);
    }, 1000);
  };

  // Percentage paid calculation
  const progressPercent = Math.round(
    (contract.installmentsPaid / contract.totalInstallments) * 100
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-8">
        {/* ================================================================= */}
        {/* A. HEADER PROFILE BANNER                                          */}
        {/* ================================================================= */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white rounded-[32px] p-6 sm:p-8 shadow-xl shadow-blue-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

          {/* User Info Left */}
          <div className="flex items-center gap-4 sm:gap-6 relative z-10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/15 border-2 border-white/20 backdrop-blur-md flex items-center justify-center text-xl sm:text-2xl font-black text-white shadow-inner flex-shrink-0">
              {customer.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {customer.name}
                </h1>
                <span className="bg-white/20 backdrop-blur-sm border border-white/25 px-3 py-0.5 rounded-full text-xs font-semibold tracking-wide">
                  {customer.membership}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-xs sm:text-sm text-blue-100">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 opacity-80" />
                  {customer.email}
                </span>
                <span className="opacity-60">•</span>
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 opacity-80" />
                  {customer.phone}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons Right */}
          <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => alert("Profile details up to date.")}
              className="bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur-sm text-white px-5 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="bg-white text-blue-900 hover:bg-rose-50 hover:text-rose-600 px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* B. ACTIVE HIRE PURCHASE (HP) TRACKER WIDGET                       */}
        {/* ================================================================= */}
        <div className="bg-white border border-slate-200/90 rounded-[32px] p-6 sm:p-8 shadow-sm">
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Active Hire Purchase Plan
                </h2>
                <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-3 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Active Plan
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Contract Reference:{" "}
                <span className="font-semibold text-slate-700">
                  {contract.contractId}
                </span>{" "}
                • {contract.device}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPayModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-6 py-3 rounded-full shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all cursor-pointer flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>Pay Next Installment Now</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  alert(
                    "Downloading Contract Agreement HP-2026-0891 (PDF)..."
                  )
                }
                className="border border-slate-200 hover:border-slate-400 bg-white text-slate-700 text-xs font-semibold px-4 py-3 rounded-full transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Agreement (PDF)</span>
              </button>
            </div>
          </div>

          {/* Metrics Grid (4 Stat Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {/* Stat 1 */}
            <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Financed
              </span>
              <span className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1 block">
                {contract.totalValue}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Downpayment: {contract.downpaymentPaid}
              </span>
            </div>

            {/* Stat 2 */}
            <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Monthly Installment
              </span>
              <span className="text-lg sm:text-xl font-extrabold text-blue-600 mt-1 block">
                {contract.monthlyInstallment}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Fixed 0% APR Plan
              </span>
            </div>

            {/* Stat 3 */}
            <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Progress
              </span>
              <span className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1 block">
                {contract.installmentsPaid} of {contract.totalInstallments} Paid ({progressPercent}%)
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
                {contract.totalInstallments - contract.installmentsPaid} installments remaining
              </span>
            </div>

            {/* Stat 4 */}
            <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Next Payment Due
              </span>
              <span className="text-lg sm:text-xl font-extrabold text-amber-600 mt-1 block">
                {contract.nextDueDate}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Automatic reminder set
              </span>
            </div>
          </div>

          {/* Interactive Progress Bar */}
          <div className="mt-8">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
              <span>Installment Repayment Progress</span>
              <span className="text-blue-600">{progressPercent}% Completed</span>
            </div>

            {/* Bar Track */}
            <div className="h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400 rounded-full transition-all duration-700 ease-out shadow-xs"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Step Marks */}
            <div className="grid grid-cols-12 gap-1 text-[10px] text-slate-400 font-mono text-center mt-2">
              {Array.from({ length: 12 }).map((_, i) => {
                const isPaid = i < contract.installmentsPaid;
                const isCurrent = i === contract.installmentsPaid;
                return (
                  <div
                    key={i}
                    className={`py-1 rounded-sm flex flex-col items-center gap-0.5 ${
                      isPaid
                        ? "text-blue-600 font-bold"
                        : isCurrent
                        ? "text-amber-600 font-bold"
                        : "text-slate-400"
                    }`}
                  >
                    <span>M{i + 1}</span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isPaid
                          ? "bg-blue-600"
                          : isCurrent
                          ? "bg-amber-500 animate-ping"
                          : "bg-slate-300"
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* C. MONTHLY INSTALLMENT SCHEDULE TABLE                             */}
        {/* ================================================================= */}
        <div className="bg-white border border-slate-200/90 rounded-[32px] p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                Repayment Schedule
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Full breakdown of all 12 monthly installments
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">
                12-Month Plan
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Installment</th>
                    <th className="py-3.5 px-4 sm:px-6">Due Date</th>
                    <th className="py-3.5 px-4 sm:px-6">Amount</th>
                    <th className="py-3.5 px-4 sm:px-6">Status</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                  {contract.paymentSchedule.map((item) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        item.status === "Upcoming Due" ? "bg-amber-50/30" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900">
                        {item.month}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-slate-600">
                        {item.date}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900">
                        {item.amount}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6">
                        {item.status === "Paid" && (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-0.5 rounded-full text-xs font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Paid
                          </span>
                        )}
                        {item.status === "Upcoming Due" && (
                          <span className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-0.5 rounded-full text-xs font-bold animate-pulse">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Upcoming Due
                          </span>
                        )}
                        {item.status === "Pending" && (
                          <span className="inline-flex items-center bg-slate-100 border border-slate-200 text-slate-600 px-2.5 py-0.5 rounded-full text-xs font-medium">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        {item.status === "Upcoming Due" ? (
                          <button
                            type="button"
                            onClick={() => setIsPayModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-1.5 rounded-full shadow-xs transition-colors cursor-pointer"
                          >
                            Pay Now
                          </button>
                        ) : item.status === "Paid" ? (
                          <button
                            type="button"
                            onClick={() =>
                              alert(
                                `Downloading receipt ${item.receiptId || "REC"}...`
                              )
                            }
                            className="text-blue-600 hover:text-blue-800 font-semibold text-xs flex items-center gap-1 ml-auto cursor-pointer"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Receipt</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs font-mono">
                            Scheduled
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* D. RECENT ORDERS HISTORY                                          */}
        {/* ================================================================= */}
        <div className="bg-white border border-slate-200/90 rounded-[32px] p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              Order History
            </h3>
            <Link
              href="/shop"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
            >
              <span>Browse Catalog</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="p-4 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold text-xs flex-shrink-0">
                    ORD
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {order.id}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500">
                        {order.date}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                      {order.item}
                    </h4>
                    {order.specs && (
                      <span className="text-xs text-slate-500">
                        {order.specs}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 justify-between sm:justify-end">
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900 block">
                      {order.total}
                    </span>
                    <span
                      className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                        order.status === "Active HP"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      alert(`Viewing official invoice for ${order.id}`)
                    }
                    className="border border-slate-200 hover:border-slate-400 bg-white text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>Invoice</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MOCK PAYMENT MODAL                                                    */}
      {/* ===================================================================== */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-slate-900">
                Pay Monthly Installment
              </h3>
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {paymentSuccess ? (
              <div className="py-8 text-center animate-in zoom-in-95">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-black text-slate-900">
                  Payment Successful!
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Rs 24,718.00 received. Your installment schedule has been
                  updated.
                </p>
              </div>
            ) : (
              <div className="pt-4 space-y-4">
                {/* Summary box */}
                <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Installment:</span>
                    <span className="font-bold text-slate-900">Month 5</span>
                  </div>
                  <div className="flex justify-between text-slate-600 mt-1">
                    <span>Due Date:</span>
                    <span className="font-semibold text-slate-900">
                      Oct 05, 2026
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-extrabold text-sm mt-2 pt-2 border-t border-blue-200/60">
                    <span>Total Due:</span>
                    <span className="text-blue-600">Rs 24,718.00</span>
                  </div>
                </div>

                {/* Payment method selector */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-2">
                    Select Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod("card")}
                      className={`p-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                        selectedPaymentMethod === "card"
                          ? "border-blue-600 bg-blue-50/50 text-blue-700 ring-1 ring-blue-600"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod("bank")}
                      className={`p-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                        selectedPaymentMethod === "bank"
                          ? "border-blue-600 bg-blue-50/50 text-blue-700 ring-1 ring-blue-600"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Bank Transfer
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod("koko")}
                      className={`p-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                        selectedPaymentMethod === "koko"
                          ? "border-blue-600 bg-blue-50/50 text-blue-700 ring-1 ring-blue-600"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Koko Pay
                    </button>
                  </div>
                </div>

                {/* Confirm Button */}
                <button
                  type="button"
                  disabled={isProcessingPayment}
                  onClick={handleConfirmPayment}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3.5 rounded-full shadow-md shadow-blue-500/25 transition-all mt-4 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isProcessingPayment ? (
                    <span>Processing Payment...</span>
                  ) : (
                    <span>Confirm & Pay Rs 24,718.00</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
