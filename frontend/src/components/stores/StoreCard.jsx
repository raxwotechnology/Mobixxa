"use client";

import React from "react";
import Link from "next/link";
import {
  MapPin,
  Clock,
  Phone,
  ArrowRight,
  Sparkles,
  Building2,
  Navigation,
} from "lucide-react";

export default function StoreCard({ store }) {
  return (
    <div className="bg-white border border-slate-200 rounded-[32px] p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      {/* ========================================================================= */}
      {/* 1. Showroom Image Viewport with Overlays */}
      {/* ========================================================================= */}
      <div className="h-72 rounded-2xl relative overflow-hidden select-none bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:scale-[1.01] transition-transform duration-300">
        {/* Architectural Tech Showroom Interior Graphic */}
        <ShowroomInteriorGraphic type={store.storeType} />

        {/* Top-Right Badge: OPEN SHOWROOM */}
        <div className="absolute top-4 right-4 z-20">
          <span className="bg-[#2080f0]/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse" />
            <span>{store.status}</span>
          </span>
        </div>

        {/* Top-Left Subtle City Tag */}
        <div className="absolute top-4 left-4 z-20">
          <span className="bg-black/50 backdrop-blur-md text-white/90 text-xs font-semibold px-2.5 py-1 rounded-full border border-white/20">
            {store.city}
          </span>
        </div>

        {/* Bottom-Left Overlay Pill: Branch Title */}
        <div className="absolute bottom-4 left-4 z-20">
          <div className="bg-slate-900/80 backdrop-blur-md text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold border border-slate-700/80 shadow-lg">
            <Building2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <span>{store.name}</span>
            {store.subtitle && (
              <span className="text-xs text-blue-300 font-semibold tracking-wider bg-blue-900/60 px-2 py-0.5 rounded-full border border-blue-500/30">
                {store.subtitle}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. Store Details */}
      {/* ========================================================================= */}
      <div className="space-y-3 mt-4">
        {/* Tagline text */}
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
          {store.tagline}
        </p>

        {/* Address Box */}
        <div className="border border-slate-200/80 bg-slate-50/50 rounded-xl px-4 py-2.5 flex items-center gap-2.5 text-xs text-slate-700 font-medium">
          <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span className="truncate">{store.address}</span>
        </div>

        {/* Info Row (Hours + Phone) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Left Pill: Hours */}
          <div className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600 font-semibold flex items-center gap-1.5 bg-white">
            <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span>{store.hours}</span>
          </div>

          {/* Right Pill: Phone */}
          <a
            href={`tel:${store.phone.replace(/\s+/g, "")}`}
            className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600 font-semibold flex items-center gap-1.5 bg-white hover:text-blue-600 hover:border-blue-300 transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <span>{store.phone}</span>
          </a>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. Action Button: EXPLORE BRANCH CATALOG */}
      {/* ========================================================================= */}
      <div className="mt-4 pt-1">
        <Link
          href={`/shop?branch=${encodeURIComponent(store.name)}`}
          className="w-full bg-[#1967d2] hover:bg-blue-700 text-white font-bold py-3.5 rounded-full text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-100"
        >
          <span>EXPLORE BRANCH CATALOG</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

/* =========================================================================== */
/* HIGH-RES MODERN SHOWROOM INTERIOR VECTOR GRAPHIC                            */
/* =========================================================================== */

function ShowroomInteriorGraphic({ type }) {
  const isFlagship = type === "flagship";

  return (
    <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
      {/* Interior Ambient Lighting & Ceiling Spotlights */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-blue-950/90" />

      {/* Ceiling Track Lights */}
      <div className="absolute top-0 inset-x-0 h-10 border-b border-slate-800/80 flex justify-around px-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-2.5 h-1.5 bg-slate-700 rounded-b-xs" />
            <div
              className={`w-12 h-28 bg-gradient-to-b ${
                isFlagship
                  ? "from-blue-400/20 to-transparent"
                  : "from-amber-300/15 to-transparent"
              } blur-xs pointer-events-none transform -rotate-6`}
            />
          </div>
        ))}
      </div>

      {/* Back Wall Illuminated Display Counters */}
      <div className="absolute inset-x-8 top-16 h-28 border border-slate-800/90 rounded-xl bg-slate-900/80 p-2.5 flex justify-between items-center shadow-inner">
        {/* Digital Banner Display */}
        <div className="w-1/3 h-full rounded-lg bg-gradient-to-r from-blue-900/60 to-indigo-900/60 border border-blue-500/30 p-2 flex flex-col justify-between">
          <span className="text-xs font-bold text-blue-300 flex items-center gap-1">
            <Sparkles className="w-2 h-2" /> {isFlagship ? "MOBIXA FLAGSHIP" : "PREMIUM LOUNGE"}
          </span>
          <span className="text-xs font-bold text-white">4K Retina Wall</span>
        </div>

        {/* Shelving with Gadget Silhouettes */}
        <div className="flex-1 ml-3 h-full flex items-center justify-around">
          <div className="flex flex-col items-center gap-1">
            <div className="w-5 h-8 rounded-sm bg-slate-800 border border-slate-700 shadow-sm" />
            <span className="w-4 h-0.5 bg-blue-500/60 rounded-full" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-6 h-6 rounded-md bg-slate-800 border border-slate-700 shadow-sm" />
            <span className="w-4 h-0.5 bg-amber-500/60 rounded-full" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-7 rounded-sm bg-slate-800 border border-slate-700 shadow-sm" />
            <span className="w-6 h-0.5 bg-cyan-500/60 rounded-full" />
          </div>
        </div>
      </div>

      {/* Foreground Polished Oak/Granite Device Testing Bar */}
      <div className="absolute -bottom-2 inset-x-4 h-24 bg-gradient-to-t from-slate-950 via-slate-900 to-slate-800/90 rounded-t-2xl border-t border-slate-700 p-2 flex items-center justify-around shadow-2xl">
        {/* Device Stand 1 */}
        <div className="flex flex-col items-center">
          <div className="w-6 h-11 bg-slate-950 rounded-sm border border-slate-700 shadow-md transform -rotate-3" />
          <div className="w-8 h-1 bg-blue-500 rounded-full mt-1" />
        </div>

        {/* Device Stand 2 (Centerpiece Tablet) */}
        <div className="flex flex-col items-center">
          <div className="w-14 h-10 bg-slate-950 rounded-md border border-cyan-400/60 shadow-lg flex items-center justify-center">
            <span className="text-[6px] font-mono text-cyan-300">DEMO LIVE</span>
          </div>
          <div className="w-10 h-1 bg-cyan-400 rounded-full mt-1" />
        </div>

        {/* Device Stand 3 */}
        <div className="flex flex-col items-center">
          <div className="w-6 h-11 bg-slate-950 rounded-sm border border-slate-700 shadow-md transform rotate-3" />
          <div className="w-8 h-1 bg-emerald-500 rounded-full mt-1" />
        </div>
      </div>
    </div>
  );
}
