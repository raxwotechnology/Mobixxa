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
  ShoppingBag,
  Loader2,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { getCheckoutProfile, getStores, createOrder, saveAddress } from "@/services/api";

const SRI_LANKA_DISTRICTS = [
  "Ampara",
  "Anuradhapura",
  "Badulla",
  "Batticaloa",
  "Colombo",
  "Galle",
  "Gampaha",
  "Hambantota",
  "Jaffna",
  "Kalutara",
  "Kandy",
  "Kegalle",
  "Kilinochchi",
  "Kurunegala",
  "Mannar",
  "Matale",
  "Matara",
  "Monaragala",
  "Mullaitivu",
  "Nuwara Eliya",
  "Polonnaruwa",
  "Puttalam",
  "Ratnapura",
  "Trincomalee",
  "Vavuniya",
];

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, clearCart } = useCart();

  // Delivery Method: 'delivery' (Courier) | 'pickup' (Branch Pickup)
  const [deliveryMethod, setDeliveryMethod] = useState("delivery");

  // Form State - strictly starts EMPTY with NO hardcoded dummy defaults
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    district: "",
    selectedBranchId: "",
    instructions: "",
  });

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("new");
  const [saveAddressForLater, setSaveAddressForLater] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [stores, setStores] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [formErrors, setFormErrors] = useState({});

  // Payment Method: 'card' | 'bnpl' | 'bank' | 'cod'
  const [paymentMethod, setPaymentMethod] = useState("card");

  // Mock Bank Transfer Receipt
  const [uploadedReceiptName, setUploadedReceiptName] = useState("");

  // Promo Code State
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState("");

  // Order Placement Loading & Idempotency Key
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [serverError, setServerError] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState("");

  // Generate unique idempotency key once per checkout session
  useEffect(() => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      setIdempotencyKey(crypto.randomUUID());
    } else {
      setIdempotencyKey(`IDEM-${Date.now()}-${Math.floor(Math.random() * 1000000)}`);
    }
  }, []);

  // Fetch branches and pre-fill profile data for logged-in users via API
  useEffect(() => {
    let isMounted = true;

    // Load available stores for branch pickup
    getStores()
      .then((res) => {
        if (!isMounted) return;
        const branchList = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.stores)
          ? res.data.stores
          : [];
        setStores(branchList);
        if (branchList.length > 0) {
          setFormData((prev) => ({
            ...prev,
            selectedBranchId: prev.selectedBranchId || branchList[0]._id,
          }));
        }
      })
      .catch((err) => {
        console.warn("Could not fetch stores list:", err.message);
      });

    // Check if user is logged in and fetch checkout profile
    getCheckoutProfile()
      .then((res) => {
        if (!isMounted) return;
        const profile = res.data;
        if (profile) {
          setIsLoggedIn(true);
          const addrs = profile.addresses || [];
          setSavedAddresses(addrs);

          const defaultAddr = addrs.find((a) => a.isDefault) || addrs[0];

          setFormData((prev) => ({
            ...prev,
            fullName: profile.fullName || "",
            phone: profile.phone || "",
            email: profile.email || "",
            addressLine1: defaultAddr?.line1 || defaultAddr?.street || "",
            addressLine2: defaultAddr?.line2 || "",
            city: defaultAddr?.city || "",
            district: defaultAddr?.district || "",
          }));

          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id || defaultAddr._id);
          }
        }
      })
      .catch((err) => {
        // 401 or not logged in - Guest user: fields remain completely empty
        setIsLoggedIn(false);
      })
      .finally(() => {
        if (isMounted) setLoadingProfile(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle saved address switch
  const handleAddressSelect = (addrId) => {
    setSelectedAddressId(addrId);
    if (addrId === "new") {
      setFormData((prev) => ({
        ...prev,
        addressLine1: "",
        addressLine2: "",
        city: "",
        district: "",
      }));
    } else {
      const selected = savedAddresses.find(
        (a) => (a.id || a._id) === addrId
      );
      if (selected) {
        setFormData((prev) => ({
          ...prev,
          addressLine1: selected.line1 || selected.street || "",
          addressLine2: selected.line2 || "",
          city: selected.city || "",
          district: selected.district || "",
        }));
      }
    }
  };

  // Helper to parse currency numbers safely
  const parseNum = (val) => {
    if (typeof val === "number") return val;
    if (!val) return 0;
    const clean = String(val).replace(/[^0-9.]/g, "");
    return parseFloat(clean) || 0;
  };

  const rawSubtotal = cartItems.reduce((acc, it) => {
    return acc + parseNum(it.price) * (it.quantity || 1);
  }, 0);

  const discountAmount = appliedPromo
    ? (rawSubtotal * appliedPromo.percent) / 100
    : 0;

  // Islandwide Courier delivery: FREE if over Rs 50,000, else flat Rs 350. Branch pickup is always Rs 0.
  const shippingFee =
    deliveryMethod === "pickup"
      ? 0
      : rawSubtotal >= 50000 || rawSubtotal === 0
      ? 0
      : 350;

  const finalTotalNum = Math.max(0, rawSubtotal - discountAmount + shippingFee);

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

  // Client-side Validation (matching Developer Spec Section 8)
  const validateForm = () => {
    const errors = {};

    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      errors.fullName = "Please enter your full name (at least 2 characters)";
    }

    // Sri Lankan mobile number validation: 07XXXXXXXX or +947XXXXXXXX
    const slPhoneRegex = /^(?:0|(?:\+94))7\d{8}$/;
    const cleanPhone = formData.phone.replace(/[\s-]/g, "");
    if (!formData.phone.trim() || !slPhoneRegex.test(cleanPhone)) {
      errors.phone = "Enter a valid mobile number (e.g. 0771234567 or +94771234567)";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      errors.email = "Enter a valid email address";
    }

    if (deliveryMethod === "delivery") {
      if (!formData.addressLine1.trim() || formData.addressLine1.trim().length < 5) {
        errors.addressLine1 = "Please enter your street address (at least 5 characters)";
      }
      if (!formData.city.trim() || formData.city.trim().length < 2) {
        errors.city = "Please enter your city/town";
      }
      if (!formData.district.trim() || !SRI_LANKA_DISTRICTS.includes(formData.district)) {
        errors.district = "Please select your district from the list";
      }
    } else if (deliveryMethod === "pickup") {
      if (!formData.selectedBranchId) {
        errors.selectedBranchId = "Please select a pickup branch";
      }
    }

    if (!paymentMethod) {
      errors.paymentMethod = "Please choose a payment method";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCompleteOrder = async () => {
    setServerError("");

    if (cartItems.length === 0) {
      setServerError("Your cart is empty. Please add items before checking out.");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsPlacingOrder(true);

    try {
      // If user selected "Save address for next time" and is logged in
      if (
        isLoggedIn &&
        saveAddressForLater &&
        deliveryMethod === "delivery" &&
        selectedAddressId === "new"
      ) {
        try {
          await saveAddress({
            line1: formData.addressLine1.trim(),
            line2: formData.addressLine2.trim(),
            city: formData.city.trim(),
            district: formData.district,
            isDefault: savedAddresses.length === 0,
          });
        } catch (addrErr) {
          console.warn("Address save failed:", addrErr.message);
        }
      }

      // Map cart items for backend order items contract
      const orderItems = cartItems.map((item) => ({
        productId: item.productId || item.id || item._id,
        name: item.name,
        image: item.image,
        quantity: Number(item.quantity) || 1,
        price: parseNum(item.price),
        color: item.color,
        storage: item.storage,
      }));

      const payload = {
        items: orderItems,
        deliveryMethod: deliveryMethod === "pickup" ? "pickup" : "courier",
        deliveryAddress:
          deliveryMethod === "delivery"
            ? {
                street: formData.addressLine1.trim(),
                line2: formData.addressLine2.trim(),
                city: formData.city.trim(),
                district: formData.district,
                country: "Sri Lanka",
              }
            : undefined,
        storeId:
          deliveryMethod === "pickup" ? formData.selectedBranchId : undefined,
        customerDetails: {
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
        },
        customerName: formData.fullName.trim(),
        customerPhone: formData.phone.trim(),
        customerEmail: formData.email.trim(),
        notes: formData.instructions.trim(),
        paymentMethod:
          paymentMethod === "card"
            ? "card"
            : paymentMethod === "bank"
            ? "bank_transfer"
            : paymentMethod === "bnpl"
            ? "koko"
            : "cod",
        voucherCode: appliedPromo?.code,
        deliveryFee: shippingFee,
        idempotencyKey,
      };

      // Call server POST /api/orders
      const response = await createOrder(payload, {
        headers: {
          "Idempotency-Key": idempotencyKey,
        },
      });

      const placedOrder = response.data;

      // Save latest order info for client hydration and verification
      try {
        localStorage.setItem(
          "mobixa_latest_order",
          JSON.stringify({
            orderId: placedOrder.orderNumber || placedOrder._id,
            date: new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric",
            }),
            items: cartItems,
            deliveryMethod,
            customer: formData,
            paymentMethod,
            subtotal: formatLKR(rawSubtotal),
            discount: discountAmount > 0 ? formatLKR(discountAmount) : null,
            total: formatLKR(finalTotalNum),
            status: "Confirmed • Processing",
          })
        );
      } catch (e) {
        console.error("Storage error:", e);
      }

      // Clear cart
      clearCart();

      // Redirect to confirmation screen with server order number / id
      const targetParam = placedOrder.orderNumber || placedOrder._id;
      router.push(`/order-success?orderId=${targetParam}`);
    } catch (err) {
      console.error("Order placement failed:", err);
      const errMsg =
        err.response?.data?.message ||
        "Could not place your order. Please review your details and try again.";
      setServerError(errMsg);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const selectedStoreDetails = stores.find(
    (s) => s._id === formData.selectedBranchId
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-24">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        {/* Top Breadcrumb & Progress Header */}
        <div className="space-y-3 pb-6 border-b border-slate-200/80">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 overflow-x-auto pb-1">
            <Link href="/shop" className="hover:text-blue-600 transition-colors">
              Cart
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-blue-600 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              Shipping & Contact
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span>Payment</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span>Confirmation</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                Secure Checkout
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Review your items and complete your order with guaranteed purchase protection.
              </p>
            </div>
            {isLoggedIn && (
              <span className="self-start sm:self-auto text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                Signed In Profile
              </span>
            )}
          </div>
        </div>

        {/* Global Error Banner */}
        {serverError && (
          <div className="mt-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Order Placement Error</p>
              <p className="text-xs mt-0.5">{serverError}</p>
            </div>
          </div>
        )}

        {/* Main 2-Column Checkout Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 mt-8">
          {/* COLUMN 1: Shipping, Contact & Payment (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Delivery Method Toggle */}
            <div className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <span>Delivery Method</span>
                </h3>
                <span className="text-xs font-semibold text-slate-500">
                  Step 1 of 2
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Islandwide Courier Delivery */}
                <button
                  type="button"
                  onClick={() => setDeliveryMethod("delivery")}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    deliveryMethod === "delivery"
                      ? "border-blue-600 bg-blue-50/40 ring-1 ring-blue-600/30"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        deliveryMethod === "delivery"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Truck className="w-4 h-4" />
                    </div>
                    {deliveryMethod === "delivery" && (
                      <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      Islandwide Courier Delivery
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Fast door-to-door delivery within 1–3 business days.
                    </p>
                    <span className="inline-block mt-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {rawSubtotal >= 50000 ? "FREE Delivery" : "Rs 350 Flat Fee"}
                    </span>
                  </div>
                </button>

                {/* Branch Pickup */}
                <button
                  type="button"
                  onClick={() => {
                    setDeliveryMethod("pickup");
                    if (paymentMethod === "cod") {
                      setPaymentMethod("card");
                    }
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    deliveryMethod === "pickup"
                      ? "border-blue-600 bg-blue-50/40 ring-1 ring-blue-600/30"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        deliveryMethod === "pickup"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Store className="w-4 h-4" />
                    </div>
                    {deliveryMethod === "pickup" && (
                      <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      Branch Pickup (Express)
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Collect directly from our store experience centers.
                    </p>
                    <span className="inline-block mt-2 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      Always Free (Rs 0)
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* 2. Customer Contact & Address Card */}
            <div className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span>
                    {deliveryMethod === "delivery"
                      ? "Shipping & Contact Details"
                      : "Pickup & Contact Details"}
                  </span>
                </h3>
              </div>

              {/* Saved Address Selector for Logged In Customers */}
              {isLoggedIn && savedAddresses.length > 0 && deliveryMethod === "delivery" && (
                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/60 space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    Choose Saved Address
                  </label>
                  <select
                    value={selectedAddressId}
                    onChange={(e) => handleAddressSelect(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-blue-200 text-xs sm:text-sm font-semibold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
                  >
                    {savedAddresses.map((addr) => (
                      <option key={addr.id || addr._id} value={addr.id || addr._id}>
                        {addr.label || "Saved Address"}: {addr.line1 || addr.street},{" "}
                        {addr.city}, {addr.district} {addr.isDefault ? "(Default)" : ""}
                      </option>
                    ))}
                    <option value="new">+ Use a new address</option>
                  </select>
                </div>
              )}

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
                      placeholder="e.g. Nimal Perera"
                      className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm text-slate-900 bg-slate-50/50 focus:outline-none focus:ring-2 ${
                        formErrors.fullName
                          ? "border-rose-400 focus:ring-rose-200"
                          : "border-slate-200 focus:ring-blue-500/30"
                      }`}
                    />
                    {formErrors.fullName && (
                      <span className="text-xs text-rose-600 block mt-1">
                        {formErrors.fullName}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Phone Number (Sri Lanka) *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="e.g. 0771234567 or +94771234567"
                      className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm text-slate-900 bg-slate-50/50 focus:outline-none focus:ring-2 ${
                        formErrors.phone
                          ? "border-rose-400 focus:ring-rose-200"
                          : "border-slate-200 focus:ring-blue-500/30"
                      }`}
                    />
                    {formErrors.phone && (
                      <span className="text-xs text-rose-600 block mt-1">
                        {formErrors.phone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Email Address *
                    </label>
                    <span className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-blue-600" />
                      Order confirmation & tracking sent here
                    </span>
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="e.g. customer@example.com"
                    className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm text-slate-900 bg-slate-50/50 focus:outline-none focus:ring-2 ${
                      formErrors.email
                        ? "border-rose-400 focus:ring-rose-200"
                        : "border-slate-200 focus:ring-blue-500/30"
                    }`}
                  />
                  {formErrors.email && (
                    <span className="text-xs text-rose-600 block mt-1">
                      {formErrors.email}
                    </span>
                  )}
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
                          className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm text-slate-900 bg-slate-50/50 focus:outline-none focus:ring-2 ${
                            formErrors.addressLine1
                              ? "border-rose-400 focus:ring-rose-200"
                              : "border-slate-200 focus:ring-blue-500/30"
                          }`}
                        />
                        {formErrors.addressLine1 && (
                          <span className="text-xs text-rose-600 block mt-1">
                            {formErrors.addressLine1}
                          </span>
                        )}
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
                          placeholder="Apartment, suite, unit (optional)"
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
                          placeholder="e.g. Dehiwala"
                          className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm text-slate-900 bg-slate-50/50 focus:outline-none focus:ring-2 ${
                            formErrors.city
                              ? "border-rose-400 focus:ring-rose-200"
                              : "border-slate-200 focus:ring-blue-500/30"
                          }`}
                        />
                        {formErrors.city && (
                          <span className="text-xs text-rose-600 block mt-1">
                            {formErrors.city}
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">
                          District (Sri Lanka) *
                        </label>
                        <select
                          value={formData.district}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              district: e.target.value,
                            })
                          }
                          className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm text-slate-900 bg-slate-50/50 focus:outline-none focus:ring-2 cursor-pointer ${
                            formErrors.district
                              ? "border-rose-400 focus:ring-rose-200"
                              : "border-slate-200 focus:ring-blue-500/30"
                          }`}
                        >
                          <option value="">-- Select District --</option>
                          {SRI_LANKA_DISTRICTS.map((dist) => (
                            <option key={dist} value={dist}>
                              {dist}
                            </option>
                          ))}
                        </select>
                        {formErrors.district && (
                          <span className="text-xs text-rose-600 block mt-1">
                            {formErrors.district}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Save address checkbox for logged in user */}
                    {isLoggedIn && selectedAddressId === "new" && (
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="checkbox"
                          id="saveAddressCheckbox"
                          checked={saveAddressForLater}
                          onChange={(e) => setSaveAddressForLater(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <label
                          htmlFor="saveAddressCheckbox"
                          className="text-xs text-slate-700 font-semibold cursor-pointer"
                        >
                          Save this address to my profile for next time
                        </label>
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Select Branch for Express Pickup *
                    </label>
                    <select
                      value={formData.selectedBranchId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedBranchId: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-xs sm:text-sm text-slate-900 bg-slate-50/50 cursor-pointer"
                    >
                      {stores.length > 0 ? (
                        stores.map((branch) => (
                          <option key={branch._id} value={branch._id}>
                            {branch.name} — {branch.city || branch.district || "Main Branch"}
                          </option>
                        ))
                      ) : (
                        <option value="">Colombo Flagship Center</option>
                      )}
                    </select>

                    {selectedStoreDetails && (
                      <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1">
                        <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-600" />
                          {selectedStoreDetails.address?.street || selectedStoreDetails.name},{" "}
                          {selectedStoreDetails.address?.city || selectedStoreDetails.city}
                        </p>
                        {selectedStoreDetails.phone && (
                          <p>Phone: {selectedStoreDetails.phone}</p>
                        )}
                        <p className="text-emerald-700 font-medium">
                          Opening Hours: Mon - Sat 9:00 AM - 7:00 PM
                        </p>
                      </div>
                    )}
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
                    placeholder="Gate code, landmark, or specific delivery preference..."
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-xs text-slate-900 bg-slate-50/50 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* 3. Payment Method Selection Card */}
            <div className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <span>Select Payment Method</span>
                </h3>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
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
                          Credit / Debit Card (Online Gateway)
                        </span>
                        <span className="text-xs text-slate-500">
                          Secure processing via Visa, Mastercard, AMEX
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <span className="text-xs font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        VISA
                      </span>
                      <span className="text-xs font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        MC
                      </span>
                    </div>
                  </div>
                  {paymentMethod === "card" && (
                    <div className="mt-3 pt-3 border-t border-blue-100 text-xs text-slate-600 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        You will be securely redirected to our bank-grade payment gateway. No card numbers are stored on our servers.
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. Buy Now Pay Later (Koko) */}
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
                          Buy Now Pay Later (Koko 3 Installments)
                        </span>
                        <span className="text-xs text-emerald-600 font-semibold">
                          Split into 3 interest-free payments of Rs{" "}
                          {formatLKR(Math.round(finalTotalNum / 3))}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                      0% Interest
                    </span>
                  </div>
                </div>

                {/* 3. Direct Bank Transfer */}
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
                        <span className="text-xs text-slate-500">
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
                        <div className="text-xs text-slate-500">
                          Branch: Colombo Fort
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Upload Deposit Slip / Transfer Screenshot (Optional)
                        </label>
                        <input
                          type="file"
                          onChange={(e) =>
                            setUploadedReceiptName(e.target.files?.[0]?.name || "")
                          }
                          className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                        />
                        {uploadedReceiptName && (
                          <span className="text-xs text-emerald-600 block mt-1">
                            Attached: {uploadedReceiptName}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Cash on Delivery (Courier) OR Pay at Branch (Pickup) */}
                {deliveryMethod === "delivery" ? (
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
                            Cash on Delivery (Courier)
                          </span>
                          <span className="text-xs text-slate-500">
                            Pay in cash directly to the courier upon receiving your package
                          </span>
                        </div>
                      </div>
                      <Banknote className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                ) : (
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
                            Pay at Branch on Collection
                          </span>
                          <span className="text-xs text-slate-500">
                            Pay via Cash or Card counter POS upon collecting your order
                          </span>
                        </div>
                      </div>
                      <Banknote className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* COLUMN 2: Order Summary & Placement (lg:col-span-5) */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-slate-200/90 rounded-[32px] p-6 sm:p-8 shadow-sm sticky top-24 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">
                  Order Summary
                </h3>
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  {cartItems.length} {cartItems.length === 1 ? "Item" : "Items"}
                </span>
              </div>

              {/* Cart Items List */}
              {cartItems.length === 0 ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Your cart is empty</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Add products from our catalog to proceed with checkout.
                    </p>
                  </div>
                  <Link
                    href="/shop"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 mt-2"
                  >
                    <span>Browse Products</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {cartItems.map((item, idx) => {
                    const unitPrice = parseNum(item.price);
                    const qty = Number(item.quantity) || 1;
                    const lineTotal = unitPrice * qty;

                    return (
                      <div
                        key={item.cartItemId || idx}
                        className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50/70 border border-slate-200/60"
                      >
                        {/* Thumbnail */}
                        <div
                          className="w-12 h-12 rounded-xl border border-slate-200 bg-white flex items-center justify-center flex-shrink-0 overflow-hidden"
                          style={{ backgroundColor: item.colorCode || "#ffffff" }}
                        >
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[10px] font-bold text-slate-700 text-center px-1">
                              {item.name?.split(" ")?.slice(0, 2)?.join(" ") || "ITEM"}
                            </span>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {item.name}
                          </h4>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                            {item.color && <span>{item.color}</span>}
                            {item.color && item.storage && <span>•</span>}
                            {item.storage && <span>{item.storage}</span>}
                          </div>
                          <div className="text-xs font-semibold text-slate-700 mt-0.5">
                            Qty: {qty} × Rs {formatLKR(unitPrice)}
                          </div>
                        </div>

                        <div className="text-xs font-bold text-slate-900 text-right">
                          Rs {formatLKR(lineTotal)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Promo Code Input */}
              {cartItems.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Have a Promo Code?
                  </label>
                  {appliedPromo ? (
                    <div className="flex items-center justify-between p-2.5 px-4 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-700">
                      <span className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-emerald-600" />
                        Promo &quot;{appliedPromo.code}&quot; applied (-{appliedPromo.percent}%)
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
                    <span className="text-xs text-rose-600 block mt-1">
                      {promoError}
                    </span>
                  )}
                </div>
              )}

              {/* Pricing Breakdown Table */}
              <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">
                    Rs {formatLKR(rawSubtotal)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span>
                    {deliveryMethod === "pickup"
                      ? "Express Branch Pickup"
                      : "Islandwide Courier Delivery"}
                  </span>
                  <span className="font-bold text-emerald-600 uppercase text-xs">
                    {shippingFee === 0 ? "FREE" : `Rs ${formatLKR(shippingFee)}`}
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
                disabled={isPlacingOrder || cartItems.length === 0}
                onClick={handleCompleteOrder}
                className="w-full bg-[#1967d2] hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-full text-base shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                {isPlacingOrder ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing Order...</span>
                  </span>
                ) : (
                  <>
                    <span>Complete & Place Order</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* Security & Guarantee Badges */}
              <div className="pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs text-slate-500">
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
