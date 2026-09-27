"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Bookmark, ShoppingBag, Check, Eye, Star, Heart } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function ProductCard({ product }) {
  const [selectedSwatchIndex, setSelectedSwatchIndex] = useState(0);
  const [activeDot, setActiveDot] = useState(product.activeDotIndex || 0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const { addToCart, openCart } = useCart();

  const activeSwatch = (product.swatches && product.swatches[selectedSwatchIndex]) || product.swatches?.[0] || { color: '#1c1c1e' };
  const activeColor = activeSwatch.color;

  const rawPriceNum = typeof product.price === 'number'
    ? product.price
    : parseFloat(String(product.price || '0').replace(/,/g, '')) || 0;
  const kokoMonthly = Math.ceil(rawPriceNum / 3);
  const discountPercent = product.discount || 15;
  const originalPriceFormatted = product.originalPrice || (rawPriceNum > 0 ? (Math.round(rawPriceNum * 1.18)).toLocaleString() : null);
  const inStock = product.stock !== undefined ? product.stock > 0 : product.inStock !== false;
  const rating = product.rating || product.averageRating || 4.9;
  const reviewCount = product.numReviews || product.reviewCount || 128;
  const productId = product._id || product.id;

  const handleAddToCart = () => {
    if (!inStock) return;
    setIsAdded(true);
    addToCart(product, 1, activeSwatch);
    openCart();
    setTimeout(() => setIsAdded(false), 1500);
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-[32px] p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      {/* ========================================================================= */}
      {/* 1. Inner Image Container: Rounded Viewport */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 flex items-center justify-center h-60 sm:h-64 relative group overflow-hidden select-none">
        {/* Subtle radial lighting effect behind the device */}
        <div
          className="absolute inset-0 opacity-25 blur-2xl transition-colors duration-300 pointer-events-none rounded-2xl"
          style={{ backgroundColor: activeColor }}
        />

        {/* Floating Top-Left Discount & Category Pills */}
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5">
          <span className="bg-rose-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs uppercase tracking-wide">
            -{discountPercent}% OFF
          </span>
          {product.badge && (
            <span className="bg-white/90 backdrop-blur-sm border border-slate-200/60 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-xs">
              {product.badge}
            </span>
          )}
        </div>

        {/* Floating Top-Right Wishlist Button */}
        <button
          type="button"
          onClick={() => setIsWishlisted(!isWishlisted)}
          aria-label="Save to Wishlist"
          className={`absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-xs backdrop-blur-md ${
            isWishlisted
              ? "bg-rose-50 text-rose-500 border border-rose-200"
              : "bg-white/90 text-slate-400 hover:text-rose-500 hover:bg-white border border-slate-200/60"
          }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? "fill-rose-500" : ""}`} />
        </button>

        {/* Device Visual Representation */}
        <div className="relative z-10 w-full h-full flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
          {product.deviceType === "pixel-pro" && (
            <PixelProIllustration color={activeColor} />
          )}
          {product.deviceType === "pixel" && (
            <PixelStandardIllustration color={activeColor} />
          )}
          {product.deviceType === "fitbit" && (
            <FitbitIllustration color={activeColor} />
          )}
          {product.deviceType === "infinix" && (
            <InfinixIllustration color={activeColor} />
          )}
          {product.deviceType === "tablet" && (
            <TabletIllustration color={activeColor} />
          )}
          {product.deviceType === "laptop" && (
            <LaptopIllustration color={activeColor} />
          )}
          {product.deviceType === "earbuds" && (
            <EarbudsIllustration color={activeColor} />
          )}
          {product.deviceType === "charger" && (
            <ChargerIllustration color={activeColor} />
          )}
          {!product.deviceType && (
            <PixelProIllustration color={activeColor} />
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. Rating & Carousel Dots Row */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between mt-3 px-1">
        <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-full">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          <span className="text-[11px] font-bold text-amber-800">{rating}</span>
          <span className="text-[10px] text-amber-600/80 font-medium">({reviewCount})</span>
        </div>

        {/* Stock Status Pill */}
        <div className="text-[11px] font-semibold">
          {inStock ? (
            <span className="text-emerald-600 flex items-center gap-1 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> In Stock
            </span>
          ) : (
            <span className="text-rose-500 flex items-center gap-1 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Out of Stock
            </span>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. Product Details (Title & Price) */}
      {/* ========================================================================= */}
      <div className="mt-2 text-left">
        <Link href={`/product/${productId}`} className="block">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base tracking-tight hover:text-blue-600 transition-colors line-clamp-1">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-baseline gap-2 mt-1 flex-wrap">
          <span className="text-sm sm:text-base font-bold text-slate-900">
            Rs. {product.price}
          </span>
          {originalPriceFormatted && (
            <span className="text-xs text-slate-400 line-through">
              Rs. {originalPriceFormatted}
            </span>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. Koko Payment Mention Badge (Red, full text, never truncated) */}
      {/* ========================================================================= */}
      {rawPriceNum > 0 && (
        <div className="mt-2.5 py-1.5 px-2.5 rounded-xl bg-red-50/80 border border-red-200/70 flex items-center justify-between gap-1.5 text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="px-1.5 py-0.5 rounded-md bg-[#e11d48] text-white font-extrabold text-[10px] uppercase tracking-wider flex items-center justify-center flex-shrink-0 shadow-xs">
              koko
            </span>
            <span className="text-slate-800 font-medium text-[11px] leading-snug">
              Or 3 x <strong className="text-red-600 font-bold">Rs. {kokoMonthly.toLocaleString()}</strong> with Koko
            </span>
          </div>
          <span className="text-[10px] font-bold text-red-600 bg-red-100/80 border border-red-200 px-1.5 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0 whitespace-nowrap">
            3x Pay
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. Color Swatches Row */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          {product.swatches && product.swatches.map((swatch, idx) => {
            const isSelected = selectedSwatchIndex === idx;
            return (
              <button
                key={swatch.name}
                type="button"
                onClick={() => setSelectedSwatchIndex(idx)}
                title={swatch.name}
                className={`w-4 h-4 rounded-full transition-all duration-150 relative flex items-center justify-center ${
                  isSelected
                    ? "ring-2 ring-blue-600 ring-offset-1 scale-110 shadow-xs"
                    : "hover:scale-110 border border-slate-300"
                }`}
                style={{ backgroundColor: swatch.color }}
              />
            );
          })}
        </div>

        {/* Action Buttons: View & Add to Bag */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href={`/product/${productId}`}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-slate-200/80 transition-all flex items-center gap-1 shadow-2xs"
            title="View Product Details"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View</span>
          </Link>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!inStock}
            aria-label={inStock ? "Add to cart" : "Out of stock"}
            title={inStock ? "Add to cart" : "Out of stock"}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-1 shadow-sm active:scale-95 ${
              inStock
                ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
                : "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================== */
/* HIGH-FIDELITY VECTOR DEVICE ILLUSTRATIONS                                    */
/* =========================================================================== */

function PixelProIllustration({ color }) {
  return (
    <div className="flex items-center justify-center gap-3">
      {/* Front Screen View */}
      <div className="w-20 h-44 bg-slate-950 rounded-[22px] p-1.5 shadow-xl border-2 border-slate-800 flex flex-col justify-between relative">
        {/* Punch-hole selfie camera */}
        <div className="w-2 h-2 rounded-full bg-slate-800 mx-auto mt-0.5" />
        {/* Screen Display Wallpaper */}
        <div className="h-32 rounded-[16px] bg-gradient-to-tr from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center p-2 text-center">
          <span className="text-xs font-bold text-white tracking-tight">Pixel 10 Pro</span>
          <span className="text-[7px] text-blue-300">Tensor G5</span>
        </div>
        {/* Home bottom bar */}
        <div className="w-8 h-0.5 bg-slate-600 rounded-full mx-auto mb-1" />
      </div>

      {/* Back Body View with Camera Visor Bar */}
      <div
        className="w-20 h-44 rounded-[22px] p-1.5 shadow-xl border-2 border-slate-800/40 flex flex-col items-center relative transition-colors duration-300"
        style={{ backgroundColor: color }}
      >
        {/* Signature Pixel Camera Visor Bar */}
        <div className="w-full h-8 bg-slate-900 rounded-lg mt-3 flex items-center justify-around px-2 shadow-md border border-slate-800">
          <div className="w-3.5 h-3.5 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500/80" />
          </div>
          <div className="w-3.5 h-3.5 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/80" />
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400/90 shadow-sm" />
        </div>

        {/* Minimalist 'G' logo on back */}
        <div className="mt-auto mb-4 w-4 h-4 rounded-full border-2 border-slate-700/50 flex items-center justify-center">
          <span className="text-xs font-bold text-slate-700">G</span>
        </div>
      </div>
    </div>
  );
}

function PixelStandardIllustration({ color }) {
  return (
    <div className="flex items-center justify-center gap-3">
      {/* Front Screen */}
      <div className="w-18 h-40 bg-slate-950 rounded-[20px] p-1.5 shadow-xl border-2 border-slate-800 flex flex-col justify-between">
        <div className="w-1.5 h-1.5 rounded-full bg-slate-800 mx-auto mt-0.5" />
        <div className="h-28 rounded-[14px] bg-gradient-to-br from-emerald-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-bold text-white">Pixel 10</span>
          <span className="text-[7px] text-emerald-400">OLED 120Hz</span>
        </div>
        <div className="w-6 h-0.5 bg-slate-600 rounded-full mx-auto mb-1" />
      </div>

      {/* Back with Visor */}
      <div
        className="w-18 h-40 rounded-[20px] p-1.5 shadow-xl border border-slate-700/30 flex flex-col items-center relative transition-colors duration-300"
        style={{ backgroundColor: color }}
      >
        <div className="w-full h-7 bg-slate-900 rounded-lg mt-3 flex items-center justify-around px-2 shadow-sm border border-slate-800">
          <div className="w-3 h-3 rounded-full bg-slate-950 border border-slate-700" />
          <div className="w-3 h-3 rounded-full bg-slate-950 border border-slate-700" />
        </div>
        <div className="mt-auto mb-3 w-3.5 h-3.5 rounded-full border border-slate-700/40 flex items-center justify-center">
          <span className="text-[7px] font-bold text-slate-700">G</span>
        </div>
      </div>
    </div>
  );
}

function FitbitIllustration({ color }) {
  return (
    <div className="relative flex flex-col items-center justify-center py-2">
      {/* Silicone Band Top */}
      <div
        className="w-12 h-10 rounded-t-xl transition-colors duration-300 border-x border-t border-slate-400/20"
        style={{ backgroundColor: color }}
      />
      {/* Smartwatch Screen Pebble */}
      <div className="w-24 h-32 bg-slate-950 rounded-[26px] p-2 shadow-xl border-2 border-slate-700 z-10 flex flex-col items-center justify-between">
        <div className="flex items-center justify-between w-full text-xs text-blue-400 px-1 pt-0.5">
          <span>FITBIT</span>
          <span className="text-slate-400 font-mono">10:08</span>
        </div>
        <div className="text-center my-auto">
          <span className="text-xl font-bold text-white tracking-tight">8,420</span>
          <span className="text-xs text-emerald-400 block font-medium">Steps Today</span>
        </div>
        <div className="w-12 h-1 bg-emerald-500 rounded-full mb-1" />
      </div>
      {/* Silicone Band Bottom */}
      <div
        className="w-12 h-10 rounded-b-xl transition-colors duration-300 border-x border-b border-slate-400/20"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

function InfinixIllustration({ color }) {
  return (
    <div className="flex items-center justify-center gap-3">
      {/* Front Bezel */}
      <div className="w-20 h-44 bg-slate-950 rounded-[22px] p-1.5 shadow-xl border-2 border-slate-800 flex flex-col justify-between">
        <div className="w-2 h-2 rounded-full bg-slate-800 mx-auto mt-0.5" />
        <div className="h-32 rounded-[16px] bg-gradient-to-tr from-emerald-950 via-slate-900 to-teal-950 flex flex-col items-center justify-center p-2 text-center">
          <span className="text-xs font-bold text-white">Note 60 Ultra</span>
          <span className="text-[7px] text-teal-300">200MP OIS</span>
        </div>
        <div className="w-8 h-0.5 bg-slate-600 rounded-full mx-auto mb-1" />
      </div>

      {/* Back Matrix Camera Island */}
      <div
        className="w-20 h-44 rounded-[22px] p-1.5 shadow-xl border-2 border-slate-800/40 flex flex-col items-center relative transition-colors duration-300"
        style={{ backgroundColor: color }}
      >
        {/* Circular Matrix Island */}
        <div className="w-14 h-14 bg-slate-950 rounded-full mt-3 p-1.5 border-2 border-amber-500/50 shadow-md grid grid-cols-2 gap-1 items-center justify-items-center">
          <div className="w-3.5 h-3.5 rounded-full bg-slate-900 border border-amber-400/60" />
          <div className="w-3.5 h-3.5 rounded-full bg-slate-900 border border-slate-700" />
          <div className="w-3.5 h-3.5 rounded-full bg-slate-900 border border-slate-700" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm" />
        </div>
        <div className="mt-auto mb-4 text-[7px] font-bold tracking-widest text-slate-800/80 uppercase">
          INFINIX
        </div>
      </div>
    </div>
  );
}

function TabletIllustration({ color }) {
  return (
    <div
      className="w-36 h-48 rounded-2xl p-1.5 shadow-xl border-2 border-slate-700 flex flex-col justify-between transition-colors duration-300"
      style={{ backgroundColor: color }}
    >
      <div className="h-full bg-slate-950 rounded-xl p-2 flex flex-col justify-between border border-slate-800">
        <div className="flex justify-between items-center text-[7px] text-slate-400">
          <span>iPad Pro</span>
          <span>98%</span>
        </div>
        <div className="text-center my-auto">
          <span className="text-sm font-bold text-white block">Ultra Retina XDR</span>
          <span className="text-xs text-blue-400 font-mono">Apple M4 Chip</span>
        </div>
        <div className="w-10 h-0.5 bg-slate-600 rounded-full mx-auto" />
      </div>
    </div>
  );
}

function LaptopIllustration({ color }) {
  return (
    <div className="w-44 flex flex-col items-center">
      <div
        className="w-40 h-28 bg-slate-950 rounded-t-xl p-1.5 border-t border-x border-slate-700 shadow-lg flex flex-col justify-between"
      >
        <div className="w-1 h-1 rounded-full bg-slate-800 mx-auto" />
        <div className="h-20 bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 rounded-lg p-1.5 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-bold text-white">MacBook Air 15</span>
          <span className="text-[7px] text-amber-300">Liquid Retina</span>
        </div>
      </div>
      <div
        className="w-44 h-2.5 rounded-b-lg border-t border-slate-600 shadow-md transition-colors duration-300"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

function EarbudsIllustration({ color }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-20 h-24 rounded-[28px] p-2 shadow-lg border-2 border-slate-700 flex flex-col items-center justify-between transition-colors duration-300"
        style={{ backgroundColor: color }}
      >
        <div className="w-8 h-1 bg-slate-600 rounded-full mt-1" />
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[7px] font-mono text-slate-700 mb-1">Pixel Buds</span>
      </div>
      <div
        className="w-10 h-10 rounded-full shadow-md border-2 border-slate-700 flex items-center justify-center transition-colors duration-300"
        style={{ backgroundColor: color }}
      >
        <div className="w-4 h-4 rounded-full bg-slate-900 border border-slate-700" />
      </div>
    </div>
  );
}

function ChargerIllustration({ color }) {
  return (
    <div
      className="w-20 h-28 rounded-2xl p-2 shadow-xl border-2 border-slate-700 flex flex-col items-center justify-between transition-colors duration-300"
      style={{ backgroundColor: color }}
    >
      <div className="flex gap-2">
        <div className="w-1 h-3 bg-slate-400 rounded-sm" />
        <div className="w-1 h-3 bg-slate-400 rounded-sm" />
      </div>
      <div className="text-center">
        <span className="text-xs font-bold text-slate-800 block">65W</span>
        <span className="text-[7px] text-blue-600 font-bold uppercase">GaN Prime</span>
      </div>
      <div className="flex flex-col gap-1 w-full items-center mb-1">
        <div className="w-6 h-1.5 bg-slate-900 rounded-xs" />
        <div className="w-6 h-1.5 bg-slate-900 rounded-xs" />
      </div>
    </div>
  );
}
