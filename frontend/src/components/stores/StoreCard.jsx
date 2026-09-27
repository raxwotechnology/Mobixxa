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
  Star,
  ExternalLink,
  MessageSquare,
} from "lucide-react";

export default function StoreCard({ store }) {
  const rating = store.rating || 4.9;
  const reviewCount = store.reviewCount || 280;
  const googleReviewUrl = store.googleReviewUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((store.name || 'Store') + ' ' + (store.address || 'Colombo'))}`;
  const theme = store.theme || {
    cardBg: "from-blue-900/10 via-slate-50 to-white",
    accent: "bg-blue-600 hover:bg-blue-700 text-white",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    border: "border-blue-200/90 hover:border-blue-400",
    iconColor: "text-blue-600",
  };

  return (
    <div className={`bg-gradient-to-b ${theme.cardBg} border ${theme.border} rounded-[32px] p-5 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between group`}>
      {/* ========================================================================= */}
      {/* 1. Showroom Image Viewport with Overlays */}
      {/* ========================================================================= */}
      <div className="h-64 sm:h-72 rounded-2xl relative overflow-hidden select-none bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:scale-[1.01] transition-transform duration-300">
        {/* Architectural Tech Showroom Interior Graphic */}
        <ShowroomInteriorGraphic type={store.storeType} />

        {/* Top-Right Badge: OPEN SHOWROOM */}
        <div className="absolute top-4 right-4 z-20">
          <span className="bg-emerald-600/95 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-200 animate-pulse" />
            <span>{store.status || "OPEN SHOWROOM"}</span>
          </span>
        </div>

        {/* Top-Left Subtle City Tag */}
        <div className="absolute top-4 left-4 z-20">
          <span className="bg-black/60 backdrop-blur-md text-white/95 text-xs font-semibold px-3 py-1 rounded-full border border-white/20">
            {store.city}
          </span>
        </div>

        {/* Bottom-Left Overlay Pill: Branch Title */}
        <div className="absolute bottom-4 left-4 z-20">
          <div className="bg-slate-900/85 backdrop-blur-md text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold border border-slate-700/80 shadow-lg">
            <Building2 className={`w-4 h-4 ${theme.iconColor} flex-shrink-0`} />
            <span>{store.name}</span>
            {store.subtitle && (
              <span className={`text-[11px] font-bold tracking-wider px-2 py-0.5 rounded-full border ${theme.badge}`}>
                {store.subtitle}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. Store Details & Address */}
      {/* ========================================================================= */}
      <div className="space-y-3 mt-4">
        {/* Tagline text */}
        <p className="text-xs text-slate-600 leading-relaxed">
          {store.tagline}
        </p>

        {/* Full Address Box */}
        <div className="border border-slate-200/90 bg-white/90 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-slate-700 font-medium shadow-2xs">
          <MapPin className={`w-4 h-4 ${theme.iconColor} flex-shrink-0 mt-0.5`} />
          <div className="min-w-0 flex-1">
            <span className="font-bold text-slate-800 block text-xs">Address:</span>
            <span className="text-slate-600 text-xs block leading-snug">{store.address}</span>
          </div>
        </div>

        {/* Info Row (Hours + Phone) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Left Pill: Hours */}
          <div className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-semibold flex items-center gap-1.5 bg-white shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span>Open: {store.hours}</span>
          </div>

          {/* Right Pill: Phone */}
          <a
            href={`tel:${(store.phone || '').replace(/\s+/g, "")}`}
            className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-semibold flex items-center gap-1.5 bg-white hover:text-blue-600 hover:border-blue-300 transition-colors shadow-2xs"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <span>{store.phone}</span>
          </a>
        </div>

        {/* ======================================================================= */}
        {/* Google Reviews & Rating Card */}
        {/* ======================================================================= */}
        <div className="bg-white/95 rounded-2xl border border-slate-200/90 p-3.5 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-xs font-bold text-slate-900">{rating}</span>
              <span className="text-[11px] text-slate-500 font-medium">({reviewCount} reviews)</span>
            </div>

            {/* Google Review Link */}
            <a
              href={googleReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline bg-blue-50 hover:bg-blue-100/80 px-2.5 py-1 rounded-full transition-colors"
            >
              <span>Google Reviews</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Customer Review Quote */}
          {store.customerReview && (
            <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100 m-0 leading-relaxed">
              &ldquo;{store.customerReview}&rdquo;
              {store.reviewerName && (
                <span className="not-italic font-bold text-slate-800 text-[11px] block mt-1">
                  — {store.reviewerName} (Verified Customer)
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. Action Buttons Row: EXPLORE CATALOG + DIRECTIONS */}
      {/* ========================================================================= */}
      <div className="mt-4 pt-2 border-t border-slate-200/70 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <a
          href={googleReviewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold py-2.5 rounded-full text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-2xs hover:scale-[1.01]"
        >
          <Navigation className="w-3.5 h-3.5 text-blue-600" />
          <span>Get Directions</span>
        </a>

        <Link
          href={`/shop?branch=${encodeURIComponent(store.name)}`}
          className={`${theme.accent} font-bold py-2.5 rounded-full text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-100`}
        >
          <span>Explore Catalog</span>
          <ArrowRight className="w-3.5 h-3.5" />
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
