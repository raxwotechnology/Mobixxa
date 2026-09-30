"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Package,
  Truck,
  ArrowRight,
  Download,
  Calendar,
  MapPin,
  Building2,
  Banknote,
  Home,
  FileText,
  ShoppingBag,
  Loader2,
} from "lucide-react";
import { getOrderById } from "@/services/api";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderParamId = searchParams.get("orderId");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchOrder = async () => {
      // 1. Try to fetch from server if orderId is available
      if (orderParamId) {
        try {
          const res = await getOrderById(orderParamId);
          if (res.data && isMounted) {
            const serverOrder = res.data;
            setOrder({
              orderId: serverOrder.orderNumber || serverOrder._id,
              date: new Date(serverOrder.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
                year: "numeric",
              }),
              items: serverOrder.items || [],
              deliveryMethod: serverOrder.deliveryMethod || (serverOrder.storeId ? "pickup" : "delivery"),
              customer: {
                fullName: serverOrder.customerDetails?.fullName || serverOrder.customerName || serverOrder.userId?.name || "Customer",
                phone: serverOrder.customerDetails?.phone || serverOrder.customerPhone || serverOrder.userId?.phone || "",
                email: serverOrder.customerDetails?.email || serverOrder.userId?.email || "",
                addressLine1: serverOrder.deliveryAddress?.street || "",
                city: serverOrder.deliveryAddress?.city || "",
                district: serverOrder.deliveryAddress?.district || "",
                pickupBranch: serverOrder.storeId?.name || "Mobixa Store",
              },
              paymentMethod: serverOrder.paymentMethod,
              subtotal: serverOrder.totalAmount?.toLocaleString("en-US", { minimumFractionDigits: 2 }),
              total: serverOrder.totalAmount?.toLocaleString("en-US", { minimumFractionDigits: 2 }),
              status: serverOrder.orderStatus || "Confirmed",
            });
            setLoading(false);
            return;
          }
        } catch (apiErr) {
          console.warn("Could not fetch order from API:", apiErr.message);
        }
      }

      // 2. Fallback to localStorage saved during checkout
      try {
        const stored = localStorage.getItem("mobixa_latest_order");
        if (stored && isMounted) {
          const parsed = JSON.parse(stored);
          if (!orderParamId || parsed.orderId === orderParamId) {
            setOrder(parsed);
            setLoading(false);
            return;
          }
        }
      } catch (storageErr) {
        console.warn("Storage read error:", storageErr);
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    fetchOrder();

    return () => {
      isMounted = false;
    };
  }, [orderParamId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-semibold text-slate-600">Retrieving your order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">No Recent Order Found</h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mt-1 mb-6">
          We couldn&apos;t locate this order. If you recently completed a checkout, please check your email or visit your account orders.
        </p>
        <Link
          href="/shop"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm py-3 px-6 rounded-full transition-all shadow-md shadow-blue-500/20"
        >
          Return to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
      {/* Success Header Card */}
      <div className="bg-white border border-slate-200/90 rounded-[32px] p-8 sm:p-10 shadow-sm text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-1 rounded-full uppercase tracking-wider">
          Order Confirmed
        </span>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-950 mt-3 tracking-tight">
          Thank you for your order!
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
          We&apos;ve received your order and our logistics team is preparing it for
          delivery with official warranty and insured courier handling.
        </p>

        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600">
          <div>
            <span className="text-slate-400 block text-xs">Order Number</span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              {order.orderId}
            </span>
          </div>
          <div className="h-6 w-px bg-slate-200 hidden sm:block" />
          <div>
            <span className="text-slate-400 block text-xs">Date</span>
            <span className="font-semibold text-slate-900">{order.date}</span>
          </div>
          <div className="h-6 w-px bg-slate-200 hidden sm:block" />
          <div>
            <span className="text-slate-400 block text-xs">Total Amount</span>
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
          <span className="text-xs font-semibold text-slate-500">
            Status: <span className="text-blue-600 font-bold uppercase">{order.status}</span>
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {order.items?.map((item, idx) => (
            <div
              key={item.cartItemId || item.productId || idx}
              className="py-3 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl border border-slate-200 bg-white flex items-center justify-center flex-shrink-0 text-xs font-bold text-slate-800 overflow-hidden"
                  style={{ backgroundColor: item.colorCode || "#ffffff" }}
                >
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    item.name?.split(" ")?.slice(0, 2)?.join(" ") || "ITEM"
                  )}
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                    {item.name}
                  </h4>
                  <div className="text-xs text-slate-500">
                    {item.color && <span>{item.color}</span>}
                    {item.color && item.storage && <span> • </span>}
                    {item.storage && <span>{item.storage}</span>}
                    <span> • Qty: {item.quantity || 1}</span>
                  </div>
                </div>
              </div>

              <div className="text-xs sm:text-sm font-bold text-slate-900">
                Rs {typeof item.price === "number" ? item.price.toLocaleString("en-US", { minimumFractionDigits: 2 }) : item.price}
              </div>
            </div>
          ))}
        </div>

        {/* Delivery & Customer Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Recipient Details
            </span>
            <div className="font-bold text-slate-900">
              {order.customer?.fullName}
            </div>
            {order.customer?.phone && (
              <div className="text-slate-600 mt-0.5">
                {order.customer?.phone}
              </div>
            )}
            {order.customer?.email && (
              <div className="text-slate-600">{order.customer?.email}</div>
            )}
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              {order.deliveryMethod === "delivery" || order.deliveryMethod === "courier"
                ? "Delivery Destination"
                : "Pickup Branch"}
            </span>
            {order.deliveryMethod === "delivery" || order.deliveryMethod === "courier" ? (
              <>
                <div className="font-semibold text-slate-900">
                  {order.customer?.addressLine1 || "Delivery Address"}
                </div>
                <div className="text-slate-600">
                  {[order.customer?.city, order.customer?.district].filter(Boolean).join(", ")}
                </div>
                <div className="text-emerald-600 font-semibold mt-1">
                  Insured Islandwide Delivery
                </div>
              </>
            ) : (
              <>
                <div className="font-semibold text-slate-900">
                  {order.customer?.pickupBranch || "Mobixa Experience Center"}
                </div>
                <div className="text-emerald-600 font-semibold mt-1">
                  Ready for Express Collection
                </div>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/orders"
            className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm py-3 px-6 rounded-full text-center transition-all shadow-md shadow-blue-500/20"
          >
            View My Orders
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
  );
}

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-20 pt-8">
      <Suspense
        fallback={
          <div className="min-h-[60vh] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        }
      >
        <OrderSuccessContent />
      </Suspense>
    </div>
  );
}
