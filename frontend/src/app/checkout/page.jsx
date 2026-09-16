"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Truck,
  Store,
  CreditCard,
  Building2,
  Banknote,
  ShieldCheck,
  Lock,
  Package,
  ArrowRight,
  CheckCircle2,
  Tag,
  AlertCircle,
  Clock,
  Sparkles,
  MapPin,
  ChevronRight,
} from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, cartTotal, clearCart } = useCart();

  // Delivery Method: 'delivery' | 'pickup'
  const [deliveryMethod, setDeliveryMethod] = useState("delivery");

  // Form State
  const [formData, setFormData] = useState({
    fullName: "Gayan Chanuka",
    phone: "+94 77 123 4567",
    email: "gayan@mobixa.lk",
    addressLine1: "No. 88, Tech Avenue",
    addressLine2: "Suite 4B",
    city: "Colombo",
    district: "Colombo",
    pickupBranch: "Colombo 03 - Flagship Experience Center",
    instructions: "Please call before delivery.",
  });

  // Pre-fill from localStorage if available
  useEffect(() => {
    try {
      const stored = localStorage.getItem("mobixa_user");
      if (stored) {
        const user = JSON.parse(stored);
        setFormData((prev) => ({
          ...prev,
          fullName: user.name || prev.fullName,
          email: user.email || prev.email,
        }));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Payment Method: 'card' | 'bnpl' | 'bank' | 'cod'
  const [paymentMethod, setPaymentMethod] = useState("card");

  // Mock Card Form State
  const [cardData, setCardData] = useState({
    number: "4532 •••• •••• 8891",
    expiry: "09/28",
    cvv: "•••",
    name: "Gayan Chanuka",
  });

  // Mock Bank Transfer Receipt
  const [uploadedReceiptName, setUploadedReceiptName] = useState("");

  // Promo Code State
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null); // { code: 'MOBI10', percent: 10 }
  const [promoError, setPromoError] = useState("");

  // Order Placement Loading
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Fallback items if cart is currently empty
  const displayItems =
    cartItems.length > 0
      ? cartItems
      : [
          {
            cartItemId: "pixel-10-pro-xl-default",
            id: "pixel-10-pro-xl",
            name: "Google Pixel 10 Pro XL",
            price: "339,900.00",
            color: "Obsidian",
            storage: "256GB",
            colorCode: "#1e1e20",
            quantity: 1,
          },
        ];

  // Calculate prices
  const parseNum = (val) => {
    if (typeof val === "number") return val;
    if (!val) return 0;
    const clean = String(val).replace(/[^0-9.]/g, "");
    return parseFloat(clean) || 0;
  };

  const rawSubtotal = displayItems.reduce((acc, it) => {
    return acc + parseNum(it.price) * (it.quantity || 1);
  }, 0);

  const discountAmount = appliedPromo
    ? (rawSubtotal * appliedPromo.percent) / 100
    : 0;

  const finalTotalNum = Math.max(0, rawSubtotal - discountAmount);

  const formatLKR = (amount) =>
    amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const handleApplyPromo = () => {
    setPromoError("");
    const cleaned = promoInput.trim().toUpperCase();
    if (cleaned === "MOBI10" || cleaned === "DISCOUNT10") {
      setAppliedPromo({ code: cleaned, percent: 10 });
    } else if (cleaned === "SAVE5") {
      setAppliedPromo({ code: cleaned, percent: 5 });
    } else {
      setPromoError("Invalid promo code. Try 'MOBI10' for 10% off.");
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoInput("");
    setPromoError("");
  };

  const handleCompleteOrder = () => {
    setIsPlacingOrder(true);

    const newOrderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const orderDetails = {
      orderId: newOrderId,
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
      items: displayItems,
      deliveryMethod,
      customer: formData,
      paymentMethod,
      subtotal: formatLKR(rawSubtotal),
      discount: discountAmount > 0 ? formatLKR(discountAmount) : null,
      total: formatLKR(finalTotalNum),
      status: "Confirmed • Processing",
    };

    try {
      localStorage.setItem("mobixa_latest_order", JSON.stringify(orderDetails));
      clearCart();
    } catch (e) {
      console.error(e);
    }

    setTimeout(() => {
      setIsPlacingOrder(false);
      router.push("/order-success");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-24">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        {/* ================================================================= */}
        {/* Top Breadcrumb & Progress Header                                  */}
        {/* ================================================================= */}
        <div className="space-y-3 pb-6 border-b border-slate-200/80">
          {/* Breadcrumb Stepper */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 overflow-x-auto pb-1">
            <Link href="/shop" className="hover:text-blue-600 transition-colors">
              Cart
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-blue-600 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              Shipping & Details
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span>Payment</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span>Confirmation</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Checkout
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Complete your order with secure islandwide insured delivery or
                branch pickup.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-1 rounded-full w-fit shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Official Warranty & 100% Genuine</span>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* Main 2-Column Architecture Grid                                   */}
        {/* ================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-8">
          {/* --------------------------------------------------------------- */}
          {/* COLUMN 1: Customer Details & Payment Methods (lg:col-span-7)     */}
          {/* --------------------------------------------------------------- */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Delivery Method Toggle */}
            <div className="bg-white border border-slate-200/90 rounded-[28px] p-2 sm:p-3 shadow-sm flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => setDeliveryMethod("delivery")}
                className={`flex-1 py-3 px-5 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                  deliveryMethod === "delivery"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>Islandwide Courier Delivery (1-3 Days)</span>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryMethod("pickup")}
                className={`flex-1 py-3 px-5 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                  deliveryMethod === "pickup"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Store className="w-4 h-4" />
                <span>Branch Pickup (Express Collection)</span>
              </button>
            </div>

            {/* 2. Shipping & Contact Information Card */}
            <div className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-black flex items-center justify-center">
                    1
                  </span>
                  <span>
                    {deliveryMethod === "delivery"
                      ? "Shipping & Contact Details"
                      : "Pickup & Contact Details"}
                  </span>
                </h3>
                <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                  Step 1 of 2
                </span>
              </div>

              <div className="space-y-4">
                {/* Full Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      placeholder="e.g. Gayan Chanuka"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-xs sm:text-sm text-slate-900 bg-slate-50/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Phone Number *
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="+94 77 123 4567"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-xs sm:text-sm text-slate-900 bg-slate-50/50"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Email Address *
                    </label>
                    <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-blue-600" />
                      Live Order Tracking Enabled
                    </span>
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="gayan@mobixa.lk"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-xs sm:text-sm text-slate-900 bg-slate-50/50"
                  />
                </div>

                {/* Address or Branch Selection */}
                {deliveryMethod === "delivery" ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">
                          Address Line 1 *
                        </label>
                        <input
                          type="text"
                          value={formData.addressLine1}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              addressLine1: e.target.value,
                            })
                          }
                          placeholder="Street Address, House No."
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-xs sm:text-sm text-slate-900 bg-slate-50/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">
                          Address Line 2 (Optional)
                        </label>
                        <input
                          type="text"
                          value={formData.addressLine2}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              addressLine2: e.target.value,
                            })
                          }
                          placeholder="Apartment, suite, unit"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-xs sm:text-sm text-slate-900 bg-slate-50/50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">
                          City / Town *
                        </label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) =>
                            setFormData({ ...formData, city: e.target.value })
                          }
                          placeholder="e.g. Colombo"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-xs sm:text-sm text-slate-900 bg-slate-50/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">
                          District *
                        </label>
                        <select
                          value={formData.district}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              district: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-xs sm:text-sm text-slate-900 bg-slate-50/50 cursor-pointer"
                        >
                          <option value="Colombo">Colombo</option>
                          <option value="Gampaha">Gampaha</option>
                          <option value="Kalutara">Kalutara</option>
                          <option value="Kandy">Kandy</option>
                          <option value="Galle">Galle</option>
                          <option value="Matara">Matara</option>
                          <option value="Kurunegala">Kurunegala</option>
                          <option value="Anuradhapura">Anuradhapura</option>
                          <option value="Jaffna">Jaffna</option>
                        </select>
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Select Branch for Express Pickup *
                    </label>
                    <select
                      value={formData.pickupBranch}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pickupBranch: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-xs sm:text-sm text-slate-900 bg-slate-50/50 cursor-pointer"
                    >
                      <option value="Colombo 03 - Flagship Experience Center">
                        Colombo 03 — Flagship Store (No. 88, Tech Avenue)
                      </option>
                      <option value="Kandy City Centre - Level 2 Showroom">
                        Kandy City Centre — Level 2 Tech Hub
                      </option>
                      <option value="Galle Fort - Digital Lounge">
                        Galle Fort — Digital Lounge Showroom
                      </option>
                    </select>
                    <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      Ready for collection within 2 hours of payment approval.
                    </p>
                  </div>
                )}

                {/* Special Instructions */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Delivery Instructions / Special Notes
                  </label>
                  <textarea
                    rows={2}
                    value={formData.instructions}
                    onChange={(e) =>
                      setFormData({ ...formData, instructions: e.target.value })
                    }
                    placeholder="Gate code, landmark, or specific delivery time preference..."
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-xs text-slate-900 bg-slate-50/50 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* 3. Payment Method Selection Card */}
            <div className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-black flex items-center justify-center">
                    2
                  </span>
                  <span>Select Payment Method</span>
                </h3>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  Encrypted SSL
                </span>
              </div>

              <div className="space-y-3">
                {/* 1. Credit / Debit Card */}
                <div
                  onClick={() => setPaymentMethod("card")}
                  className={`border rounded-2xl p-4 transition-all cursor-pointer ${
                    paymentMethod === "card"
                      ? "border-blue-600 bg-blue-50/30 ring-1 ring-blue-600/30"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          paymentMethod === "card"
                            ? "border-blue-600 bg-blue-600"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {paymentMethod === "card" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-slate-900 block">
                          Credit / Debit Card
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Visa, Mastercard, American Express
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        VISA
                      </span>
                      <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        MC
                      </span>
                    </div>
                  </div>

                  {paymentMethod === "card" && (
                    <div className="mt-4 pt-4 border-t border-blue-100 space-y-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Card Number
                        </label>
                        <input
                          type="text"
                          value={cardData.number}
                          onChange={(e) =>
                            setCardData({ ...cardData, number: e.target.value })
                          }
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-white text-slate-800"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            Expiry (MM/YY)
                          </label>
                          <input
                            type="text"
                            value={cardData.expiry}
                            onChange={(e) =>
                              setCardData({
                                ...cardData,
                                expiry: e.target.value,
                              })
                            }
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-white text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            CVV / CVC
                          </label>
                          <input
                            type="text"
                            value={cardData.cvv}
                            onChange={(e) =>
                              setCardData({ ...cardData, cvv: e.target.value })
                            }
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-white text-slate-800"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Buy Now Pay Later (Koko / Mintpay) */}
                <div
                  onClick={() => setPaymentMethod("bnpl")}
                  className={`border rounded-2xl p-4 transition-all cursor-pointer ${
                    paymentMethod === "bnpl"
                      ? "border-blue-600 bg-blue-50/30 ring-1 ring-blue-600/30"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          paymentMethod === "bnpl"
                            ? "border-blue-600 bg-blue-600"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {paymentMethod === "bnpl" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-slate-900 block">
                          Buy Now Pay Later (Koko / Mintpay)
                        </span>
                        <span className="text-[11px] text-emerald-600 font-semibold">
                          Split into 3 interest-free payments of Rs{" "}
                          {formatLKR(Math.round(finalTotalNum / 3))}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                      0% Interest
                    </span>
                  </div>

                  {paymentMethod === "bnpl" && (
                    <div className="mt-3 pt-3 border-t border-blue-100 text-xs text-slate-600 space-y-1.5">
                      <div className="flex justify-between">
                        <span>1st Payment (Today):</span>
                        <span className="font-bold text-slate-900">
                          Rs {formatLKR(Math.round(finalTotalNum / 3))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>2nd Payment (In 30 Days):</span>
                        <span className="font-bold text-slate-900">
                          Rs {formatLKR(Math.round(finalTotalNum / 3))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>3rd Payment (In 60 Days):</span>
                        <span className="font-bold text-slate-900">
                          Rs {formatLKR(Math.round(finalTotalNum / 3))}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Direct Bank Transfer / CDM Deposit */}
                <div
                  onClick={() => setPaymentMethod("bank")}
                  className={`border rounded-2xl p-4 transition-all cursor-pointer ${
                    paymentMethod === "bank"
                      ? "border-blue-600 bg-blue-50/30 ring-1 ring-blue-600/30"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          paymentMethod === "bank"
                            ? "border-blue-600 bg-blue-600"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {paymentMethod === "bank" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-slate-900 block">
                          Direct Bank Transfer / CDM Deposit
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Commercial Bank & Sampath Bank Accounts
                        </span>
                      </div>
                    </div>
                    <Building2 className="w-4 h-4 text-slate-400" />
                  </div>

                  {paymentMethod === "bank" && (
                    <div className="mt-4 pt-4 border-t border-blue-100 text-xs text-slate-700 space-y-3">
                      <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                        <div className="font-bold text-blue-900">
                          Commercial Bank of Ceylon
                        </div>
                        <div>Account No: 1000 482 9182</div>
                        <div>Account Name: Mobixa Tech (Pvt) Ltd</div>
                        <div className="text-[11px] text-slate-500">
                          Branch: Colombo Fort
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Upload Deposit Slip / Transfer Screenshot
                        </label>
                        <input
                          type="file"
                          onChange={(e) =>
                            setUploadedReceiptName(e.target.files?.[0]?.name || "")
                          }
                          className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                        />
                        {uploadedReceiptName && (
                          <span className="text-[11px] text-emerald-600 block mt-1">
                            ✓ Attached: {uploadedReceiptName}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Cash on Delivery / Showroom Pay */}
                <div
                  onClick={() => setPaymentMethod("cod")}
                  className={`border rounded-2xl p-4 transition-all cursor-pointer ${
                    paymentMethod === "cod"
                      ? "border-blue-600 bg-blue-50/30 ring-1 ring-blue-600/30"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          paymentMethod === "cod"
                            ? "border-blue-600 bg-blue-600"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {paymentMethod === "cod" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-slate-900 block">
                          Cash on Delivery / Pay at Showroom
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Pay securely upon receiving your package
                        </span>
                      </div>
                    </div>
                    <Banknote className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* --------------------------------------------------------------- */}
          {/* COLUMN 2: Order Summary & Placement (lg:col-span-5)             */}
          {/* --------------------------------------------------------------- */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-slate-200/90 rounded-[32px] p-6 sm:p-8 shadow-sm sticky top-24 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-lg font-extrabold text-slate-900">
                  Order Summary
                </h3>
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  {displayItems.length} {displayItems.length === 1 ? "Item" : "Items"}
                </span>
              </div>

              {/* Cart Items Preview */}
              <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
                {displayItems.map((item, idx) => (
                  <div
                    key={item.cartItemId || idx}
                    className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50/70 border border-slate-200/60"
                  >
                    {/* Thumbnail */}
                    <div
                      className="w-12 h-12 rounded-xl border border-slate-200 bg-white flex items-center justify-center flex-shrink-0 shadow-2xs"
                      style={{ backgroundColor: item.colorCode || "#ffffff" }}
                    >
                      <span className="text-[8px] font-black text-slate-800">
                        {item.name?.split(" ")?.slice(0, 2)?.join(" ") || "ITEM"}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                        {item.color && <span>{item.color}</span>}
                        {item.color && item.storage && <span>•</span>}
                        {item.storage && <span>{item.storage}</span>}
                      </div>
                      <div className="text-xs font-semibold text-slate-700 mt-0.5">
                        Qty: {item.quantity || 1}
                      </div>
                    </div>

                    <div className="text-xs font-bold text-slate-900 text-right">
                      Rs {item.price}
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo Code Pill Input */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Have a Promo Code?
                </label>
                {appliedPromo ? (
                  <div className="flex items-center justify-between p-2.5 px-4 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-700">
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-emerald-600" />
                      Promo &quot;{appliedPromo.code}&quot; applied (-10%)
                    </span>
                    <button
                      type="button"
                      onClick={handleRemovePromo}
                      className="text-slate-400 hover:text-slate-600 transition-colors text-xs cursor-pointer ml-2"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      placeholder="Try 'MOBI10'"
                      className="flex-1 px-4 py-2 rounded-full border border-slate-200 text-xs uppercase text-slate-800 placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      className="bg-slate-900 hover:bg-black text-white text-xs font-bold px-5 py-2 rounded-full transition-colors cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                )}
                {promoError && (
                  <span className="text-[11px] text-rose-600 block mt-1">
                    {promoError}
                  </span>
                )}
              </div>

              {/* Pricing Breakdown Table */}
              <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">
                    Rs {formatLKR(rawSubtotal)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Islandwide Insured Shipping</span>
                  <span className="font-bold text-emerald-600 uppercase text-[11px]">
                    FREE
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Estimated Tax & Duty</span>
                  <span className="text-slate-500 font-medium">Included</span>
                </div>

                {appliedPromo && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Discount ({appliedPromo.code})</span>
                    <span>- Rs {formatLKR(discountAmount)}</span>
                  </div>
                )}

                {/* Total Payable */}
                <div className="flex justify-between items-baseline pt-3 border-t border-slate-100">
                  <span className="text-sm font-bold text-slate-900">
                    Total Payable
                  </span>
                  <span className="text-2xl font-black text-slate-950">
                    Rs {formatLKR(finalTotalNum)}
                  </span>
                </div>
              </div>

              {/* Place Order CTA */}
              <button
                type="button"
                disabled={isPlacingOrder}
                onClick={handleCompleteOrder}
                className="w-full bg-[#1967d2] hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold py-4 rounded-full text-base shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                {isPlacingOrder ? (
                  <span>Securing Order...</span>
                ) : (
                  <>
                    <span>Complete & Place Order</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* Security & Guarantee Badges */}
              <div className="pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-[10px] text-slate-500">
                <div className="flex flex-col items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  <span>256-Bit SSL</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>1 Year Warranty</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Insured Courier</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
