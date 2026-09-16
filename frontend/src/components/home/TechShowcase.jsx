import React from "react";
import { Laptop, Smartphone, Watch, ShieldCheck, Zap, Sparkles } from "lucide-react";

export default function TechShowcase() {
  return (
    <div className="relative w-full max-w-lg lg:max-w-xl flex items-center justify-center p-4 select-none">
      {/* Background ambient glow effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-400/30 to-indigo-300/20 blur-3xl rounded-full transform -rotate-12 pointer-events-none" />

      {/* Floating Tag 1: Top Left */}
      <div className="absolute -top-2 left-4 sm:left-8 z-20 bg-white/15 backdrop-blur-md border border-white/30 rounded-2xl px-3.5 py-2 shadow-lg flex items-center gap-2 text-white animate-pulse">
        <Zap className="w-4 h-4 text-amber-300" />
        <span className="text-xs font-semibold tracking-wide">M3 Max &amp; A18 Pro</span>
      </div>

      {/* Floating Tag 2: Bottom Right */}
      <div className="absolute -bottom-2 right-4 sm:right-6 z-20 bg-slate-900/80 backdrop-blur-md border border-slate-700/80 rounded-2xl px-3.5 py-2 shadow-xl flex items-center gap-2 text-white">
        <ShieldCheck className="w-4 h-4 text-blue-400" />
        <span className="text-xs font-medium text-slate-200">Official Brand Warranty</span>
      </div>

      {/* Multi-Device Showcase Container */}
      <div className="relative z-10 w-full flex items-center justify-center">
        {/* Device 1: MacBook Pro (Center Background) */}
        <div className="w-[85%] sm:w-[88%] bg-slate-900 rounded-t-2xl p-2.5 pb-0 shadow-2xl border-t border-x border-slate-700/80 transform hover:scale-[1.02] transition-transform duration-300">
          {/* MacBook Screen Bezel */}
          <div className="rounded-t-xl bg-slate-950 p-2 border border-slate-800">
            {/* Screen Header Bar */}
            <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-800/80 text-[10px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500/80" />
                <span className="w-2 h-2 rounded-full bg-yellow-500/80" />
                <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-[9px] font-mono text-slate-400">macOS Sonoma • Mobixa Studio</span>
            </div>

            {/* Screen Content Graphic */}
            <div className="h-44 sm:h-52 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 rounded-b-lg p-3 flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-1 relative z-10">
                <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Flagship Ecosystem
                </span>
                <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Next-Gen Silicon Power
                </h4>
                <p className="text-[10px] sm:text-xs text-slate-300 max-w-[200px] sm:max-w-xs leading-relaxed">
                  Liquid Retina XDR display with ProMotion 120Hz.
                </p>
              </div>

              {/* Grid cards inside screen */}
              <div className="grid grid-cols-2 gap-2 relative z-10">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/10">
                  <span className="text-[9px] text-slate-300 block">Performance</span>
                  <span className="text-xs font-bold text-white">Up to 36h Battery</span>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/10">
                  <span className="text-[9px] text-slate-300 block">Graphics</span>
                  <span className="text-xs font-bold text-emerald-400">Hardware Ray Tracing</span>
                </div>
              </div>

              {/* Subtle background glow */}
              <div className="absolute -bottom-6 -right-6 w-36 h-36 bg-blue-500/20 rounded-full blur-xl" />
            </div>
          </div>
          {/* MacBook Base / Chin */}
          <div className="h-3.5 bg-gradient-to-b from-slate-700 to-slate-800 rounded-b-lg border-t border-slate-600 flex items-center justify-center">
            <div className="w-14 h-1 bg-slate-600/90 rounded-full" />
          </div>
        </div>

        {/* Device 2: iPhone Flagship (Overlapping Right Foreground) */}
        <div className="absolute -right-1 sm:right-2 bottom-1 w-32 sm:w-40 bg-slate-950 rounded-[28px] p-2 shadow-2xl border-2 border-slate-700/80 transform translate-y-3 sm:translate-y-4 hover:scale-105 transition-transform duration-300 z-20">
          {/* Dynamic Island */}
          <div className="w-10 sm:w-12 h-2.5 bg-black rounded-full mx-auto mb-1 flex items-center justify-end px-1">
            <span className="w-1 h-1 rounded-full bg-blue-500/80" />
          </div>
          {/* Screen Content */}
          <div className="h-44 sm:h-52 bg-gradient-to-b from-slate-900 via-blue-900 to-slate-950 rounded-[20px] p-2.5 flex flex-col justify-between border border-slate-800 relative overflow-hidden">
            <div className="text-center pt-1">
              <span className="text-[9px] font-mono text-slate-400">9:41 AM</span>
              <p className="text-[11px] font-bold text-white mt-1">Titanium Pro</p>
            </div>
            
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center my-auto shadow-inner">
              <Smartphone className="w-7 h-7 sm:w-8 sm:h-8 text-blue-300" />
            </div>

            <div className="bg-slate-900/90 rounded-xl p-1.5 border border-slate-700/60 text-center">
              <span className="text-[8px] text-blue-300 block font-medium">Camera System</span>
              <span className="text-[10px] font-bold text-white">48MP Fusion</span>
            </div>
          </div>
          {/* Home indicator */}
          <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mt-1.5" />
        </div>

        {/* Device 3: Smartwatch (Overlapping Left Foreground) */}
        <div className="absolute -left-2 sm:left-2 bottom-4 w-24 sm:w-28 bg-slate-900 rounded-[22px] p-2 shadow-2xl border-2 border-slate-700 transform -translate-y-2 hover:scale-105 transition-transform duration-300 z-20">
          <div className="h-28 sm:h-32 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-[16px] p-2 flex flex-col items-center justify-between border border-slate-800">
            <div className="flex items-center justify-between w-full text-[8px] text-amber-400 font-bold">
              <span>ULTRA</span>
              <span className="text-slate-400">10:09</span>
            </div>

            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shadow-inner">
              <Watch className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300" />
            </div>

            <div className="w-full text-center">
              <span className="text-[8px] text-slate-400 block">Battery</span>
              <span className="text-[10px] font-bold text-emerald-400">100% Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
