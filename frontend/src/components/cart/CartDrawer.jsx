"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X,
  ArrowRight,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Clock,
  PackageOpen,
} from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function CartDrawer() {
  const {
    isCartOpen,
    closeCart,
    cartItems,
    activeTab,
    setActiveTab,
    removeFromCart,
    updateQuantity,
    cartCount,
    cartTotal,
  } = useCart();
  const router = useRouter();

  // Close drawer on ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isCartOpen) {
        closeCart();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCartOpen, closeCart]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isCartOpen]);

  const collections = [
    { label: "Android", href: "/shop?category=SMART+PHONE" },
    { label: "Apple", href: "/shop?category=SMART+PHONE" },
    { label: "Audio", href: "/shop?category=EARBUDS" },
    { label: "Gaming", href: "/deals" },
    { label: "Gadgets", href: "/shop?category=ACCESSORIES" },
    { label: "Accessories", href: "/shop?category=ACCESSORIES" },
  ];

  const handleCollectionClick = (href) => {
    closeCart();
    router.push(href);
  };

  const handleCheckout = () => {
    closeCart();
    router.push("/checkout");
  };

  return (
    <>
      {/* 1. Backdrop Overlay */}
      <div
        onClick={closeCart}
        aria-hidden="true"
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isCartOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />

      {/* 2. Drawer Sheet Card (Figma Style Floating Panel) */}
      <div
        className={`fixed top-3 bottom-3 right-3 w-full max-w-[440px] bg-white/95 backdrop-blur-xl rounded-[36px] shadow-2xl border border-blue-100/80 z-50 flex flex-col p-6 sm:p-8 overflow-hidden transition-all duration-300 ease-out ${
          isCartOpen
            ? "translate-x-0 pointer-events-auto"
            : "translate-x-[110%] pointer-events-none"
        }`}
      >
        {/* ================================================================= */}
        {/* Drawer Header: Segmented Pill Controls & Close Button             */}
        {/* ================================================================= */}
        <div className="flex items-center justify-between flex-shrink-0 pb-4 border-b border-slate-100">
          {/* Segmented Pill Controls */}
          <div className="bg-slate-100/80 p-1 rounded-full flex items-center gap-1 border border-slate-200/60">
            {/* Cart [count] button */}
            <button
              type="button"
              onClick={() => setActiveTab("cart")}
              className={`transition-all duration-200 cursor-pointer ${
                activeTab === "cart"
                  ? "bg-white shadow-sm text-blue-900 font-bold px-4 py-1.5 rounded-full text-xs flex items-center gap-1.5"
                  : "text-slate-500 hover:text-slate-800 font-medium px-4 py-1.5 rounded-full text-xs"
              }`}
            >
              <span>Cart</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === "cart"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {cartCount}
              </span>
            </button>

            {/* History button */}
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`transition-all duration-200 cursor-pointer ${
                activeTab === "history"
                  ? "bg-white shadow-sm text-blue-900 font-bold px-4 py-1.5 rounded-full text-xs flex items-center gap-1.5"
                  : "text-slate-500 hover:text-slate-800 font-medium px-4 py-1.5 rounded-full text-xs transition-colors"
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>History</span>
            </button>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close cart drawer"
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors ml-auto cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ================================================================= */}
        {/* Drawer Body: Switch between History & Cart tabs                   */}
        {/* ================================================================= */}
        {activeTab === "history" ? (
          /* History View */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4 overflow-y-auto">
            <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-4">
              <Clock className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              No recent orders
            </h3>
            <p className="text-xs text-slate-500 mt-2 max-w-xs leading-relaxed">
              When you purchase devices or accessories, your order tracking and
              history will appear here.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab("cart")}
              className="mt-6 text-xs font-bold text-blue-600 hover:text-blue-700 underline underline-offset-4 cursor-pointer"
            >
              Back to current cart
            </button>
          </div>
        ) : cartItems.length === 0 ? (
          /* =============================================================== */
          /* Empty Cart View (Matching Figma Pixel-for-Pixel)                 */
          /* =============================================================== */
          <div className="flex-1 flex flex-col justify-start overflow-y-auto pt-2 px-1">
            {/* Empty Cart Headline */}
            <h2 className="text-2xl sm:text-[26px] font-black text-slate-950 text-center mt-12 tracking-tight">
              Your cart is currently empty.
            </h2>

            {/* Subtitles */}
            <div className="text-xs text-slate-500 text-center mt-2 leading-relaxed">
              <p>Not sure where to start?</p>
              <p>Try these collections:</p>
            </div>

            {/* Collection Navigation Pills Stack */}
            <div className="space-y-3.5 mt-8 w-full max-w-sm mx-auto">
              {collections.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleCollectionClick(item.href)}
                  className="w-full border border-blue-200/90 hover:border-blue-500 bg-white hover:bg-blue-50/50 text-blue-900 font-semibold text-xs sm:text-sm py-3.5 px-6 rounded-full flex items-center justify-between transition-all duration-200 shadow-sm group cursor-pointer"
                >
                  <span className="tracking-tight">{item.label}</span>
                  <span className="text-blue-600 font-bold group-hover:translate-x-1 transition-transform duration-200">
                    →
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* =============================================================== */
          /* Populated Cart View                                              */
          /* =============================================================== */
          <div className="flex-1 flex flex-col justify-between overflow-hidden pt-4">
            {/* Scrollable Item List */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
              {cartItems.map((item) => {
                const itemKey = item.cartItemId || item.key || item.id;
                return (
                  <div
                    key={itemKey}
                    className="p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-2xl flex items-center gap-3.5 hover:bg-slate-50 transition-colors"
                  >
                    {/* Item Thumbnail Viewport */}
                    <div
                      className="w-16 h-16 rounded-xl border border-slate-200 bg-white flex items-center justify-center p-1.5 flex-shrink-0 relative shadow-2xs"
                      style={{
                        backgroundColor: item.colorCode || "#ffffff",
                      }}
                    >
                      <div className="w-10 h-10 rounded-lg bg-slate-950 flex flex-col items-center justify-center shadow-xs text-white">
                        <span className="text-[7px] font-black tracking-tighter">
                          {item.name?.split(" ")?.slice(0, 2)?.join(" ") || "DEVICE"}
                        </span>
                      </div>
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        {item.color && (
                          <span className="font-medium">{item.color}</span>
                        )}
                        {item.color && item.storage && <span>•</span>}
                        {item.storage && (
                          <span className="font-medium">{item.storage}</span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-slate-900 mt-1">
                        Rs {item.price}
                      </div>
                    </div>

                    {/* Quantity Selector & Trash */}
                    <div className="flex flex-col items-end justify-between h-14">
                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => removeFromCart(itemKey)}
                        aria-label={`Remove ${item.name} from cart`}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Increment / Decrement */}
                      <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-2 py-0.5 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => updateQuantity(itemKey, -1)}
                          aria-label="Decrease quantity"
                          className="text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-slate-900 px-1">
                          {item.quantity || 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(itemKey, 1)}
                          aria-label="Increase quantity"
                          className="text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Summary & Checkout Action */}
            <div className="pt-4 border-t border-slate-100 flex-shrink-0 space-y-3 mt-3">
              {/* Subtotal */}
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">
                  Rs {cartTotal}
                </span>
              </div>

              {/* Shipping */}
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Islandwide Shipping</span>
                <span className="font-bold text-emerald-600 uppercase text-[11px]">
                  FREE
                </span>
              </div>

              {/* Final Total */}
              <div className="flex items-center justify-between text-sm font-extrabold text-slate-950 pt-2 border-t border-slate-100">
                <span>Total</span>
                <span className="text-base text-blue-600">Rs {cartTotal}</span>
              </div>

              {/* Solid royal blue pill Proceed to Checkout */}
              <button
                type="button"
                onClick={handleCheckout}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm py-3.5 px-6 rounded-full flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 transition-all duration-200 cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
