import React, { Suspense } from "react";
import Link from "next/link";
import {
  Truck,
  Clock,
  ShieldCheck,
  Cpu,
  Star,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Quote,
} from "lucide-react";
import { featureBadges, testimonials } from "@/data/mockHomeData";
import TechShowcase from "@/components/home/TechShowcase";
import CategoryExplorer from "@/components/home/CategoryExplorer";

// Helper map to dynamically render Lucide icons
const iconMap = {
  Truck,
  Clock,
  ShieldCheck,
  Cpu,
};

export default function HomePage() {
  return (
    <div className="space-y-12 pb-16">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION */}
      {/* ========================================================================= */}
      <section className="mx-4 md:mx-8 mt-4">
        <div className="bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 text-white rounded-[36px] p-8 md:p-14 lg:p-16 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between min-h-[480px] shadow-xl shadow-blue-500/20">
          {/* Subtle background decorative shapes */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-24 w-80 h-80 rounded-full bg-blue-400/20 blur-2xl pointer-events-none" />

          {/* Left Content */}
          <div className="relative z-10 max-w-xl space-y-6 text-center lg:text-left">
            {/* Translucent pill tag */}
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/25 px-4 py-1.5 rounded-full text-xs font-semibold text-white tracking-wide shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span># Next-Gen Technology</span>
            </div>

            {/* Subtitle & Main Headline */}
            <div className="space-y-2">
              <p className="text-blue-100 text-sm sm:text-base font-semibold tracking-wider uppercase">
                Welcome to
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] text-white">
                Mobixa <br />
                <span className="text-white/95">Premium Tech &amp;</span> <br />
                <span className="text-blue-200">SmartDevices.</span>
              </h1>
            </div>

            {/* Sub-text */}
            <p className="text-blue-100/90 text-sm sm:text-base leading-relaxed max-w-lg mx-auto lg:mx-0">
              Discover the latest smartphones, powerful laptops, immersive audio,
              and premium accessories curated for modern lifestyles. Upgrade your
              tech today.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                href="/shop"
                className="bg-white hover:bg-slate-50 text-blue-700 hover:text-blue-800 font-bold px-8 py-3.5 rounded-full text-sm inline-flex items-center gap-2.5 shadow-xl shadow-blue-950/20 hover:shadow-2xl hover:scale-[1.02] active:scale-100 transition-all duration-200"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-4 h-4 text-blue-700" />
              </Link>
              <Link
                href="/deals"
                className="bg-white/15 hover:bg-white/25 backdrop-blur-md text-white px-7 py-3.5 rounded-full text-sm font-semibold border border-white/30 hover:border-white/50 transition-all duration-200"
              >
                Tech Deals
              </Link>
            </div>
          </div>

          {/* Right Visual: Multi-Device Tech Showcase */}
          <div className="relative z-10 w-full lg:w-1/2 mt-10 lg:mt-0 flex justify-center">
            <TechShowcase />
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. VALUE PROPOSITION BADGES (4 PILLS ROW) */}
      {/* ========================================================================= */}
      <section className="mx-4 md:mx-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featureBadges.map((badge, idx) => {
            const IconComponent = iconMap[badge.icon] || ShieldCheck;
            const badgeTheme = [
              { bg: 'bg-blue-50/90', border: 'border-blue-100', text: 'text-blue-600', hoverBg: 'group-hover:bg-blue-600' },
              { bg: 'bg-amber-50/90', border: 'border-amber-100', text: 'text-amber-600', hoverBg: 'group-hover:bg-amber-600' },
              { bg: 'bg-emerald-50/90', border: 'border-emerald-100', text: 'text-emerald-600', hoverBg: 'group-hover:bg-emerald-600' },
              { bg: 'bg-indigo-50/90', border: 'border-indigo-100', text: 'text-indigo-600', hoverBg: 'group-hover:bg-indigo-600' },
            ][idx % 4];
            return (
              <div
                key={badge.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex items-center gap-4 group hover:border-slate-300"
              >
                {/* Refined clean light icon badge */}
                <div className={`w-12 h-12 rounded-2xl ${badgeTheme.bg} border ${badgeTheme.border} flex items-center justify-center ${badgeTheme.text} flex-shrink-0 ${badgeTheme.hoverBg} group-hover:text-white transition-all duration-200 shadow-xs`}>
                  <IconComponent className="w-5 h-5 transition-colors" />
                </div>
                {/* Text info */}
                <div className="flex flex-col">
                  <h3 className="text-sm font-bold text-slate-800 leading-tight">
                    {badge.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">
                    {badge.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. EXPLORE CATEGORIES + FILTERED PRODUCTS */}
      {/* ========================================================================= */}
      <Suspense fallback={null}>
        <CategoryExplorer />
      </Suspense>

      {/* ========================================================================= */}
      {/* 4. WHAT OUR CUSTOMERS SAY SECTION */}
      {/* ========================================================================= */}
      <section className="mx-4 md:mx-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              What Our Customers Say
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Trusted by tech enthusiasts everywhere
            </p>
          </div>

          {/* Testimonials 4-Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {testimonials.map((item) => (
              <div
                key={item.id}
                className="border border-slate-100 shadow-sm hover:shadow-md p-6 rounded-2xl bg-white flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 group"
              >
                <div className="space-y-4">
                  {/* Gold Star Rating Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < item.rating
                              ? "fill-amber-400 text-amber-400"
                              : "fill-slate-200 text-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                    <Quote className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-colors" />
                  </div>

                  {/* Testimonial Quote */}
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                </div>

                {/* Customer Avatar Initials + Name */}
                <div className="flex items-center gap-3 pt-5 mt-4 border-t border-slate-100">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm flex-shrink-0">
                    {item.initials}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900">
                      {item.name}
                    </span>
                    <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified Buyer
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
