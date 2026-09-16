"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Sparkles, Zap, Flame, ShieldCheck, Clock } from "lucide-react";
import { deals, singleDeal } from "@/data/mockDeals";
import DealCard from "@/components/deals/DealCard";

function DealsContent() {
  const searchParams = useSearchParams();
  const isSingleView = searchParams.get("view") === "single";

  // Countdown Timer State starting at 09h 28m 05s
  const [timeLeft, setTimeLeft] = useState({
    hours: 9,
    minutes: 28,
    seconds: 5,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 9, minutes: 28, seconds: 5 }; // loop back
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num) => String(num).padStart(2, "0");

  const displayDeals = isSingleView ? [singleDeal] : deals;

  return (
    <div className="space-y-8 pb-16 relative overflow-hidden">
      {/* ========================================================================= */}
      {/* 1. HERO BANNER: MEGA DEALS & OFFERS */}
      {/* ========================================================================= */}
      <section className="mx-4 md:mx-8 mt-4">
        <div className="bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 text-white rounded-[36px] p-10 md:p-14 text-center relative overflow-hidden shadow-lg shadow-blue-500/15">
          {/* Subtle Ambient Backdrops */}
          <div className="absolute -top-16 -right-16 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-indigo-400/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-4">
            {/* Pill Badge at top center */}
            <div>
              <span className="bg-white/15 border border-white/20 text-white/90 text-xs px-4 py-1.5 rounded-full inline-flex items-center gap-1.5 font-medium shadow-xs">
                <Flame className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>Exclusive Promotions</span>
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
              Mega Deals &amp; Offers
            </h1>

            {/* Description */}
            <p className="max-w-2xl mx-auto text-blue-100 text-xs sm:text-sm leading-relaxed">
              Grab these authentic tech products at unbeatable promotional prices
              before they run out!
            </p>

            {/* Interactive Countdown Timer Bar */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-100/90 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-300" />
                <span>Offers Expire In:</span>
              </span>
              <div className="flex items-center gap-2">
                <div className="bg-blue-800/60 backdrop-blur-md border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs min-w-[54px]">
                  <span>{formatNumber(timeLeft.hours)}h</span>
                </div>
                <span className="text-white/60 font-bold">:</span>
                <div className="bg-blue-800/60 backdrop-blur-md border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs min-w-[54px]">
                  <span>{formatNumber(timeLeft.minutes)}m</span>
                </div>
                <span className="text-white/60 font-bold">:</span>
                <div className="bg-blue-800/60 backdrop-blur-md border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs min-w-[54px]">
                  <span>{formatNumber(timeLeft.seconds)}s</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. DECORATIVE DYNAMIC RIBBON CURVE BACKGROUND */}
      {/* ========================================================================= */}
      <div className="relative">
        {/* Sweeping Ribbon SVG Graphic */}
        <div className="absolute inset-0 top-12 -z-0 pointer-events-none opacity-20 overflow-hidden">
          <svg
            className="w-full h-full min-h-[450px]"
            viewBox="0 0 1440 320"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              fill="#2563eb"
              fillOpacity="0.35"
              d="M0,96L48,112C96,128,192,160,288,186.7C384,213,480,235,576,218.7C672,203,768,149,864,138.7C960,128,1056,160,1152,176C1248,192,1344,192,1392,192L1440,192L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
            />
          </svg>
        </div>

        {/* ======================================================================= */}
        {/* 3. DEALS CARDS GRID */}
        {/* ======================================================================= */}
        <section className="mx-4 md:mx-8 my-12 relative z-10">
          <div
            className={`grid gap-6 ${
              isSingleView
                ? "grid-cols-1 max-w-sm mx-auto"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
            }`}
          >
            {displayDeals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        </section>
      </div>

      {/* ========================================================================= */}
      {/* 4. PROMOTIONAL ASSURANCE FOOTNOTE STRIP */}
      {/* ========================================================================= */}
      <section className="mx-4 md:mx-8">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col sm:flex-row items-center justify-around gap-4 text-xs font-semibold text-slate-700">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-600" />
            <span>Fast Same-Day Islandwide Dispatch</span>
          </div>
          <span className="hidden sm:inline text-slate-300">|</span>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>100% Genuine Brand Warranties</span>
          </div>
          <span className="hidden sm:inline text-slate-300">|</span>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Exclusive Promo Discounts Guaranteed</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function DealsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <DealsContent />
    </Suspense>
  );
}

