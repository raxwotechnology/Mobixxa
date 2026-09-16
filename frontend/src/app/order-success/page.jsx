"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Package,
  Truck,
  ArrowRight,
  Download,
  Calendar,
  MapPin,
  CreditCard,
  Building2,
  Banknote,
  Home,
  FileText,
} from "lucide-react";

export default function OrderSuccessPage() {
  const [order, setOrder] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("mobixa_latest_order");
      if (stored) {
        setOrder(JSON.parse(stored));
        return;
      }
    } catch (e) {
      console.error(e);
    }

    // Default mock order if visited directly
    setOrder({
      orderId: "ORD-948102",
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
      items: [
        {
          id: "pixel-10-pro-xl",
          name: "Google Pixel 10 Pro XL",
          price: "339,900.00",
          color: "Obsidian",
          storage: "256GB",
          colorCode: "#1e1e20",
          quantity: 1,
        },
      ],
      deliveryMethod: "delivery",
      customer: {
        fullName: "Gayan Chanuka",
        phone: "+94 77 123 4567",
        email: "gayan@mobixa.lk",
        addressLine1: "No. 88, Tech Avenue",
        city: "Colombo",
        district: "Colombo",
      },
      paymentMethod: "card",
      subtotal: "339,900.00",
      total: "339,900.00",
      status: "Confirmed • Processing",
    });
  }, []);

  if (!order) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-20 pt-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Success Header Card */}
        <div className="bg-white border border-slate-200/90 rounded-[32px] p-8 sm:p-10 shadow-sm text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-sm animate-in zoom-in-75">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-1 rounded-full uppercase tracking-wider">
            Order Confirmed
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 mt-3 tracking-tight">
            Thank you for your order!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
            We&apos;ve received your order and our logistics team is preparing it for
            delivery with official warranty and insured courier handling.
          </p>

          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600">
            <div>
              <span className="text-slate-400 block text-[11px]">Order Number</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {order.orderId}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />
            <div>
              <span className="text-slate-400 block text-[11px]">Date</span>
              <span className="font-semibold text-slate-900">{order.date}</span>
            </div>
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />
            <div>
              <span className="text-slate-400 block text-[11px]">Total Amount</span>
              <span className="font-bold text-blue-600 text-sm">
                Rs {order.total}
              </span>
            </div>
          </div>
        </div>

        {/* Order Details & Summary Card */}
        <div className="bg-white border border-slate-200/90 rounded-[32px] p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">
              Purchased Items ({order.items?.length || 0})
            </h3>
            <button
              type="button"
              onClick={() => alert(`Downloading invoice for ${order.orderId}...`)}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Invoice (PDF)</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {order.items?.map((item, idx) => (
              <div
                key={item.cartItemId || idx}
                className="py-3 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl border border-slate-200 bg-white flex items-center justify-center flex-shrink-0 text-[8px] font-black text-slate-800"
                    style={{ backgroundColor: item.colorCode || "#ffffff" }}
                  >
                    {item.name?.split(" ")?.slice(0, 2)?.join(" ") || "ITEM"}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      {item.name}
                    </h4>
                    <div className="text-[11px] text-slate-500">
                      {item.color && <span>{item.color}</span>}
                      {item.color && item.storage && <span> • </span>}
                      {item.storage && <span>{item.storage}</span>}
                      <span> • Qty: {item.quantity || 1}</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs sm:text-sm font-bold text-slate-900">
                  Rs {item.price}
                </div>
              </div>
            ))}
          </div>

          {/* Delivery & Customer Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Recipient Details
              </span>
              <div className="font-bold text-slate-900">
                {order.customer?.fullName}
              </div>
              <div className="text-slate-600 mt-0.5">
                {order.customer?.phone}
              </div>
              <div className="text-slate-600">{order.customer?.email}</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                {order.deliveryMethod === "delivery"
                  ? "Delivery Destination"
                  : "Pickup Branch"}
              </span>
              {order.deliveryMethod === "delivery" ? (
                <>
                  <div className="font-semibold text-slate-900">
                    {order.customer?.addressLine1}
                  </div>
                  <div className="text-slate-600">
                    {order.customer?.city}, {order.customer?.district}
                  </div>
                  <div className="text-emerald-600 font-semibold mt-1">
                    Insured Islandwide Delivery
                  </div>
                </>
              ) : (
                <>
                  <div className="font-semibold text-slate-900">
                    {order.customer?.pickupBranch || "Colombo Flagship Showroom"}
                  </div>
                  <div className="text-emerald-600 font-semibold mt-1">
                    Ready for Collection in 2 Hours
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/dashboard"
              className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm py-3 px-6 rounded-full text-center transition-all shadow-md shadow-blue-500/20"
            >
              View Order in Dashboard
            </Link>
            <Link
              href="/shop"
              className="w-full sm:flex-1 border border-slate-300 hover:border-slate-800 text-slate-800 font-bold text-xs sm:text-sm py-3 px-6 rounded-full text-center transition-all bg-white"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
