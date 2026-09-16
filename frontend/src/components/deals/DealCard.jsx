"use client";

import React, { useState } from "react";
import { Bookmark, ShoppingBag, Check } from "lucide-react";

export default function DealCard({ deal }) {
  const [selectedSwatchIndex, setSelectedSwatchIndex] = useState(0);
  const [activeDot, setActiveDot] = useState(deal.activeDotIndex || 0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const activeSwatch = deal.swatches && deal.swatches.length > 0
    ? deal.swatches[selectedSwatchIndex] || deal.swatches[0]
    : null;
  const activeColor = activeSwatch ? activeSwatch.color : "#1c1c1e";

  const handleAddToCart = () => {
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-[32px] p-5 shadow-sm hover:shadow-md transition-all relative flex flex-col justify-between group">
      {/* ========================================================================= */}
      {/* 1. Inner Media Viewport with Top-Left Discount Pill */}
      {/* ========================================================================= */}
      <div
        className={`rounded-2xl h-64 p-6 flex items-center justify-center relative overflow-hidden select-none transition-colors duration-300 ${
          deal.darkContainer
            ? "bg-[#23252b] border border-slate-800"
            : "bg-slate-50/70 border border-slate-100"
        }`}
      >
        {/* Floating Top-Left Discount Pill */}
        <div className="absolute top-3 left-3 z-20">
          <span className="bg-[#ff3b30] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm tracking-wide">
            {deal.discount}
          </span>
        </div>

        {/* Ambient glow behind product */}
        <div
          className={`absolute inset-0 opacity-20 blur-3xl pointer-events-none rounded-2xl ${
            deal.darkContainer ? "bg-amber-400/30" : "bg-blue-400/25"
          }`}
        />

        {/* Device Visual Representation */}
        <div className="relative z-10 w-full h-full flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
          {deal.deviceType === "marshall-monitor" && (
            <MarshallHeadphonesIllustration color={activeColor} />
          )}
          {deal.deviceType === "marshall-emberton" && (
            <MarshallSpeakerIllustration color={activeColor} />
          )}
          {deal.deviceType === "ps5-pro" && <PS5ProIllustration />}
          {deal.deviceType === "pixel-10-pro" && (
            <Pixel10ProIllustration color={activeColor} />
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. Action Icons Row (Wishlist, Carousel Dots, Shopping Bag) */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between mt-4 px-2">
        {/* Wishlist / Bookmark Icon */}
        <button
          type="button"
          onClick={() => setIsWishlisted(!isWishlisted)}
          aria-label="Save to Wishlist"
          className={`p-1.5 rounded-full transition-colors ${
            isWishlisted
              ? "text-blue-600 bg-blue-50"
              : "text-slate-700 hover:text-blue-600 hover:bg-slate-100"
          }`}
        >
          <Bookmark
            className={`w-4 h-4 ${isWishlisted ? "fill-blue-600" : ""}`}
          />
        </button>

        {/* Carousel Pagination Dots */}
        <div className="flex items-center gap-1.5">
          {[...Array(deal.carouselDots)].map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveDot(i)}
              aria-label={`Carousel slide ${i + 1}`}
              className={`rounded-full transition-all duration-200 ${
                activeDot === i
                  ? "w-2.5 h-2.5 bg-slate-800 scale-110"
                  : "w-2 h-2 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>

        {/* Shopping Bag Button */}
        <button
          type="button"
          onClick={handleAddToCart}
          aria-label="Add to cart"
          className={`p-1.5 rounded-full transition-colors ${
            isAdded
              ? "text-emerald-600 bg-emerald-50"
              : "text-slate-700 hover:text-blue-600 hover:bg-slate-100"
          }`}
        >
          {isAdded ? (
            <Check className="w-4 h-4" />
          ) : (
            <ShoppingBag className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3. Product Typography (Title & Price) */}
      {/* ========================================================================= */}
      <div className="text-center mt-3">
        <h3 className="font-bold text-slate-900 text-base tracking-tight group-hover:text-blue-600 transition-colors">
          {deal.name}
        </h3>
        <div className="flex items-center justify-center gap-1.5 mt-1">
          <p className="text-xs text-slate-700 font-bold">
            From Rs {deal.price}
          </p>
          {deal.originalPrice && (
            <span className="text-[11px] text-slate-400 line-through">
              Rs {deal.originalPrice}
            </span>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. Color Swatches Row */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-center gap-2 mt-4 pt-2 min-h-[28px]">
        {deal.swatches && deal.swatches.length > 0 ? (
          deal.swatches.map((swatch, idx) => {
            const isSelected = selectedSwatchIndex === idx;
            return (
              <button
                key={swatch.name}
                type="button"
                onClick={() => setSelectedSwatchIndex(idx)}
                title={swatch.name}
                className={`w-5 h-5 rounded-full transition-all duration-150 relative flex items-center justify-center ${
                  isSelected
                    ? "ring-2 ring-blue-600 ring-offset-2 scale-110 shadow-xs"
                    : "hover:scale-110 border border-slate-300"
                }`}
                style={{ backgroundColor: swatch.color }}
              />
            );
          })
        ) : (
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Standard Edition
          </span>
        )}
      </div>
    </div>
  );
}

/* =========================================================================== */
/* HIGH-FIDELITY VECTOR GRAPHICS FOR DEALS VIEW                                */
/* =========================================================================== */

function MarshallHeadphonesIllustration({ color }) {
  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Headband Arc */}
      <div className="w-36 h-20 border-4 border-slate-900 rounded-t-full border-b-0 shadow-lg relative flex items-center justify-center">
        {/* Headband Leather Texture Pad */}
        <div
          className="w-32 h-3.5 rounded-full border border-amber-600/30 -mt-14 shadow-inner"
          style={{ backgroundColor: color === "#181818" ? "#222" : color }}
        />
        {/* Brass Extenders */}
        <div className="absolute -left-1 bottom-0 w-2.5 h-6 bg-gradient-to-b from-amber-400 to-amber-600 rounded-sm shadow-xs" />
        <div className="absolute -right-1 bottom-0 w-2.5 h-6 bg-gradient-to-b from-amber-400 to-amber-600 rounded-sm shadow-xs" />
      </div>

      {/* Earcups Row */}
      <div className="flex items-center justify-between w-40 -mt-2 z-10">
        {/* Left Earcup */}
        <div
          className="w-14 h-20 rounded-2xl shadow-2xl border-2 border-slate-800 p-1 flex flex-col items-center justify-center transform -rotate-6"
          style={{ backgroundColor: color }}
        >
          <div className="w-9 h-14 rounded-xl bg-slate-950 border border-amber-500/40 flex items-center justify-center shadow-inner">
            <span className="text-[8px] font-serif italic font-bold text-amber-200/90 tracking-widest">
              M
            </span>
          </div>
        </div>

        {/* Center Coiled Audio Cable Connector */}
        <div className="w-8 h-12 flex flex-col items-center justify-center opacity-60">
          <div className="w-2 h-4 bg-amber-500 rounded-xs shadow-xs" />
          <div className="w-0.5 h-6 bg-amber-400/80" />
        </div>

        {/* Right Earcup */}
        <div
          className="w-14 h-20 rounded-2xl shadow-2xl border-2 border-slate-800 p-1 flex flex-col items-center justify-center transform rotate-6"
          style={{ backgroundColor: color }}
        >
          <div className="w-9 h-14 rounded-xl bg-slate-950 border border-amber-500/40 flex items-center justify-center shadow-inner">
            <span className="text-[8px] font-serif italic font-bold text-amber-200/90 tracking-widest">
              M
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarshallSpeakerIllustration({ color }) {
  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Speaker Cabinet */}
      <div
        className="w-48 h-28 rounded-2xl p-2 shadow-2xl border-2 border-slate-700/80 flex flex-col justify-between relative transition-colors duration-300"
        style={{ backgroundColor: color }}
      >
        {/* Top Control Bar with Brass Knob */}
        <div className="flex items-center justify-between px-2 pt-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-xs" />
            <span className="text-[7px] font-mono text-slate-300">BATTERY</span>
          </div>
          {/* Iconic Multi-Directional Brass Knob */}
          <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-amber-500 via-amber-300 to-amber-600 shadow-md border border-amber-200 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-700" />
          </div>
          <div className="w-2 h-2 rounded-full bg-slate-800 border border-slate-600" />
        </div>

        {/* Iconic Front Metal Grille with Marshall Script */}
        <div className="h-18 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center relative shadow-inner overflow-hidden">
          {/* Grille mesh pattern */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(#d4af37 1px, transparent 1px)",
              backgroundSize: "4px 4px",
            }}
          />
          {/* Golden Script Marshall Script */}
          <div className="relative z-10 bg-slate-950/80 px-3 py-0.5 rounded-md border border-amber-400/30">
            <span className="text-xs font-serif italic font-black text-amber-300 tracking-wider">
              Marshall
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PS5ProIllustration() {
  return (
    <div className="flex items-center justify-center gap-3">
      {/* PS5 Pro Console Tower */}
      <div className="w-20 h-44 relative flex items-center justify-center">
        {/* Inner Dark Tech Core */}
        <div className="w-14 h-40 bg-slate-950 rounded-sm border-x border-slate-800 flex flex-col justify-between items-center py-2 shadow-2xl relative">
          {/* Blue Neon Glow Light Strip */}
          <div className="absolute -left-0.5 inset-y-2 w-0.5 bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          <div className="w-4 h-0.5 bg-slate-700 rounded-full" />
          <div className="w-5 h-1 bg-slate-800 rounded-xs" />
        </div>

        {/* Sculpted Curved White Fin Panels */}
        <div className="absolute inset-y-0 -left-1 w-5 bg-gradient-to-r from-slate-100 to-white rounded-l-2xl border-l border-slate-300 shadow-md transform -skew-y-3" />
        <div className="absolute inset-y-0 -right-1 w-5 bg-gradient-to-l from-slate-100 to-white rounded-r-2xl border-r border-slate-300 shadow-md transform skew-y-3" />
        
        {/* Stand */}
        <div className="absolute -bottom-1 w-16 h-2 bg-slate-800 rounded-full shadow-md" />
      </div>

      {/* DualSense Controller */}
      <div className="w-20 h-24 bg-white rounded-3xl p-1.5 shadow-xl border border-slate-200 flex flex-col justify-between relative transform rotate-6">
        {/* Touchpad with blue LED border */}
        <div className="w-10 h-6 bg-slate-900 rounded-md mx-auto mt-1 border border-blue-400 shadow-xs flex items-center justify-center">
          <span className="w-2 h-0.5 bg-blue-400 rounded-full" />
        </div>
        {/* Thumbsticks */}
        <div className="flex justify-around px-2 my-auto">
          <div className="w-3.5 h-3.5 rounded-full bg-slate-800 border border-slate-600" />
          <div className="w-3.5 h-3.5 rounded-full bg-slate-800 border border-slate-600" />
        </div>
        {/* Bottom handle grips */}
        <div className="flex justify-between px-1 text-[6px] font-bold text-slate-400">
          <span>PRO</span>
          <span>SONY</span>
        </div>
      </div>
    </div>
  );
}

function Pixel10ProIllustration({ color }) {
  return (
    <div className="flex items-center justify-center gap-3">
      {/* Front Screen */}
      <div className="w-18 h-42 bg-slate-950 rounded-[20px] p-1.5 shadow-xl border-2 border-slate-800 flex flex-col justify-between">
        <div className="w-1.5 h-1.5 rounded-full bg-slate-800 mx-auto mt-0.5" />
        <div className="h-30 rounded-[14px] bg-gradient-to-tr from-slate-900 via-blue-950 to-indigo-950 flex flex-col items-center justify-center text-center">
          <span className="text-[9px] font-bold text-white">Pixel 10 Pro</span>
          <span className="text-[7px] text-blue-300">Tensor G5</span>
        </div>
        <div className="w-6 h-0.5 bg-slate-600 rounded-full mx-auto mb-1" />
      </div>

      {/* Back with Visor */}
      <div
        className="w-18 h-42 rounded-[20px] p-1.5 shadow-xl border border-slate-700/30 flex flex-col items-center relative transition-colors duration-300"
        style={{ backgroundColor: color }}
      >
        <div className="w-full h-8 bg-slate-900 rounded-lg mt-3 flex items-center justify-around px-1.5 shadow-md border border-slate-800">
          <div className="w-3 h-3 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center">
            <span className="w-1 h-1 rounded-full bg-blue-400" />
          </div>
          <div className="w-3 h-3 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center">
            <span className="w-1 h-1 rounded-full bg-cyan-300" />
          </div>
          <div className="w-2 h-2 rounded-full bg-amber-400/90" />
        </div>
        <div className="mt-auto mb-3 w-3.5 h-3.5 rounded-full border border-slate-700/40 flex items-center justify-center">
          <span className="text-[7px] font-bold text-slate-700">G</span>
        </div>
      </div>
    </div>
  );
}
