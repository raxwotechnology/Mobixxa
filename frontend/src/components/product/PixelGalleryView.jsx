"use client";

import React from "react";

/**
 * PixelGalleryView
 * Renders high-fidelity vector illustrations of the Google Pixel 10 Pro XL
 * across 4 viewing angles:
 * 1. 'front' - Front screen display with Obsidian wallpaper & Gemini widgets
 * 2. 'rear'  - Signature camera visor bar & Google 'G' back plate
 * 3. 'side'  - Ultra-slim aerospace-grade aluminum chassis profile
 * 4. 'angled'- 3D perspective back view showing camera visor depth
 */
export default function PixelGalleryView({
  view = "front",
  color = "#1e1e20",
  colorName = "Obsidian",
  isThumbnail = false,
}) {
  // Determine accent & rim colors based on the chosen phone color
  const isLightColor = color === "#f2f1ec" || color === "#9bbada";
  const frameColor =
    color === "#1e1e20"
      ? "#2d2d30"
      : color === "#f2f1ec"
      ? "#d8d6cf"
      : color === "#9bbada"
      ? "#7ea1c4"
      : "#555d57";
  const visorFrame =
    color === "#1e1e20"
      ? "#262629"
      : color === "#f2f1ec"
      ? "#dedcd6"
      : color === "#9bbada"
      ? "#8caecf"
      : "#5a635c";
  const gLogoColor = isLightColor ? "#33383f" : "#ffffff";

  if (isThumbnail) {
    return (
      <div className="w-full h-full flex items-center justify-center pointer-events-none select-none">
        {view === "front" && (
          <div className="w-9 h-16 bg-slate-950 rounded-[10px] p-[2px] shadow-sm border border-slate-700 flex flex-col justify-between">
            <div className="w-1 h-1 rounded-full bg-slate-800 mx-auto mt-0.5" />
            <div
              className="h-11 rounded-[7px] p-0.5 flex flex-col items-center justify-between"
              style={{
                background: "linear-gradient(135deg, #090d16 0%, #171f38 50%, #05070d 100%)",
              }}
            >
              <span className="text-[5px] font-bold text-blue-200 mt-1">9:30</span>
              <div className="w-5 h-1 bg-white/20 rounded-full mb-1" />
            </div>
            <div className="w-3 h-0.5 bg-slate-500 rounded-full mx-auto mb-0.5" />
          </div>
        )}

        {view === "rear" && (
          <div
            className="w-9 h-16 rounded-[10px] p-[2px] shadow-sm border flex flex-col items-center relative transition-colors duration-300"
            style={{ backgroundColor: color, borderColor: frameColor }}
          >
            {/* Visor */}
            <div
              className="w-full h-3.5 rounded-sm mt-1 flex items-center justify-around px-0.5 shadow-xs border"
              style={{ backgroundColor: "#111317", borderColor: visorFrame }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
                <span className="w-0.5 h-0.5 rounded-full bg-blue-400" />
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-900 border border-slate-700" />
              <div className="w-1 h-1 rounded-sm bg-slate-800" />
            </div>
            {/* G Logo */}
            <div className="mt-auto mb-2 text-[6px] font-black" style={{ color: gLogoColor }}>
              G
            </div>
          </div>
        )}

        {view === "side" && (
          <div className="flex items-center justify-center h-16">
            <div
              className="w-2.5 h-16 rounded-full border shadow-sm relative flex flex-col items-center transition-colors duration-300"
              style={{ backgroundColor: frameColor, borderColor: "#33383f" }}
            >
              {/* Visor bump protrusion */}
              <div
                className="w-4 h-3.5 rounded-r-sm absolute -right-1 top-2 shadow-xs"
                style={{ backgroundColor: visorFrame }}
              />
              {/* Power button */}
              <div className="w-1 h-2 bg-slate-800 rounded-xs absolute -left-0.5 top-6" />
            </div>
          </div>
        )}

        {view === "angled" && (
          <div
            className="w-9 h-16 rounded-[10px] p-[2px] shadow-md border flex flex-col items-center relative transform -rotate-6 transition-transform duration-300"
            style={{ backgroundColor: color, borderColor: frameColor }}
          >
            <div
              className="w-full h-3.5 rounded-sm mt-1.5 flex items-center justify-around px-0.5 shadow-sm border"
              style={{ backgroundColor: "#111317", borderColor: visorFrame }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/90" />
              <span className="w-1 h-1 rounded-full bg-amber-400/90" />
            </div>
            <div className="mt-auto mb-2 text-[6px] font-black" style={{ color: gLogoColor }}>
              G
            </div>
          </div>
        )}
      </div>
    );
  }

  // Large Interactive Viewport High-Fidelity Renderings
  return (
    <div className="w-full h-full flex items-center justify-center relative select-none">
      {/* Dynamic ambient backdrop illumination matching active color */}
      <div
        className="absolute inset-0 opacity-20 blur-3xl transition-colors duration-500 rounded-[36px] pointer-events-none"
        style={{ backgroundColor: color }}
      />

      {/* ===================================================================== */}
      {/* 1. FRONT SCREEN DISPLAY VIEW                                          */}
      {/* ===================================================================== */}
      {view === "front" && (
        <div className="relative z-10 w-64 sm:w-72 h-[460px] sm:h-[490px] bg-slate-950 rounded-[38px] p-2.5 shadow-2xl border-[3px] border-slate-800 flex flex-col justify-between transition-all duration-300 animate-in fade-in zoom-in-95">
          {/* Top Speaker Slit & Center Punch Hole Camera */}
          <div className="relative w-full flex items-center justify-center pt-0.5">
            <div className="w-10 h-1 bg-slate-800 rounded-full absolute -top-1" />
            <div className="w-3.5 h-3.5 rounded-full bg-black border border-slate-700/80 flex items-center justify-center shadow-inner">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-900/60" />
            </div>
          </div>

          {/* Super Actua OLED Display Screen */}
          <div
            className="flex-1 my-1.5 rounded-[28px] overflow-hidden p-4 flex flex-col justify-between relative shadow-inner border border-slate-800/40"
            style={{
              background: "radial-gradient(ellipse at top, #1e293b 0%, #0f172a 45%, #020617 100%)",
            }}
          >
            {/* Status Bar */}
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 px-1">
              <span>9:30</span>
              <div className="flex items-center gap-1.5 text-slate-300 text-[10px]">
                <span>5G</span>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L12 22l7.03-4.39C20.26 16.07 21 14.12 21 12c0-4.97-4.03-9-9-9zm0 14c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
                </svg>
                <span>94%</span>
              </div>
            </div>

            {/* At a Glance Widget (Date & Weather) */}
            <div className="mt-3 px-1">
              <div className="text-white/80 text-xs font-medium flex items-center gap-1.5">
                <span>Tue, Sep 15</span>
                <span>•</span>
                <span>28°C Sunny</span>
              </div>
              <div className="mt-1 flex items-center gap-1 text-[11px] text-blue-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span>Tensor G5 Gemini Live</span>
              </div>
            </div>

            {/* Obsidian Mineral Wallpaper Visual Accent */}
            <div className="my-auto relative flex items-center justify-center">
              <div
                className="w-40 h-40 rounded-full opacity-40 blur-2xl transition-colors duration-500"
                style={{ backgroundColor: color }}
              />
              <div className="relative z-10 text-center">
                <div className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight font-mono">
                  09:30
                </div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-1">
                  Google Pixel 10 Pro XL
                </div>
              </div>
            </div>

            {/* Bottom Google Search Pill Widget */}
            <div className="w-full bg-white/10 backdrop-blur-md rounded-full py-2 px-3 flex items-center justify-between border border-white/15 shadow-sm">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.37 7.35 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.63 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                </svg>
                <span className="text-[11px] text-slate-300">Ask Gemini...</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-400/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400/80" />
              </div>
            </div>
          </div>

          {/* Gesture Navigation Home Bar */}
          <div className="w-20 h-1 bg-slate-500/80 rounded-full mx-auto mb-1" />
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. REAR CAMERA VISOR VIEW                                             */}
      {/* ===================================================================== */}
      {view === "rear" && (
        <div
          className="relative z-10 w-64 sm:w-72 h-[460px] sm:h-[490px] rounded-[38px] p-3 shadow-2xl border-[3px] flex flex-col items-center transition-all duration-500 animate-in fade-in zoom-in-95"
          style={{ backgroundColor: color, borderColor: frameColor }}
        >
          {/* Subtle satin sheen lighting across the matte backplate */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/20 rounded-[35px] pointer-events-none" />

          {/* Iconic Pixel Pro Triple Camera Visor Bar */}
          <div
            className="relative z-10 w-full h-20 rounded-2xl mt-4 px-3 py-2 flex items-center justify-between shadow-xl border"
            style={{ backgroundColor: "#0c0d11", borderColor: visorFrame }}
          >
            {/* Pill Cutout housing Dual 50MP Wide & 48MP Ultrawide Cameras */}
            <div className="w-28 h-12 bg-black rounded-full border border-slate-800 flex items-center justify-around px-2 shadow-inner">
              {/* 50MP Wide Camera Lens */}
              <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center relative group">
                <div className="w-5 h-5 rounded-full bg-slate-950 border border-slate-600 flex items-center justify-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500/80 shadow-xs" />
                </div>
              </div>
              {/* 48MP Ultrawide Camera Lens */}
              <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center">
                <div className="w-5 h-5 rounded-full bg-slate-950 border border-slate-600 flex items-center justify-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400/80 shadow-xs" />
                </div>
              </div>
            </div>

            {/* 48MP 5x Periscope Telephoto Lens (Rectangular Prism Cutout) */}
            <div className="w-10 h-10 rounded-xl bg-black border border-slate-800 flex items-center justify-center shadow-inner">
              <div className="w-6 h-6 rounded-md bg-slate-900 border border-slate-700 flex items-center justify-center">
                <div className="w-3.5 h-3.5 bg-slate-950 rounded-xs border border-indigo-500/40 shadow-sm" />
              </div>
            </div>

            {/* Right Visor Sensor Cluster: Dual-Tone Flash + Laser AF + Temp Sensor */}
            <div className="flex flex-col items-center justify-between h-12 py-0.5">
              {/* Dual-Tone LED Flash */}
              <div className="w-3.5 h-3.5 rounded-full bg-amber-200 border border-amber-300 shadow-md flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              </div>
              {/* Laser Autofocus / Mic */}
              <div className="w-2 h-2 rounded-full bg-slate-800 border border-slate-700" />
              {/* Temperature Sensor */}
              <div className="w-2 h-2 rounded-full bg-slate-900 border border-slate-700" />
            </div>
          </div>

          {/* Centered Minimalist Google 'G' Logo */}
          <div className="relative z-10 my-auto flex flex-col items-center">
            <div
              className="w-10 h-10 rounded-full border-2 flex items-center justify-center shadow-sm"
              style={{ borderColor: frameColor }}
            >
              <span className="text-xl font-black tracking-tighter" style={{ color: gLogoColor }}>
                G
              </span>
            </div>
            <span
              className="text-[10px] font-bold tracking-widest uppercase mt-3 opacity-60"
              style={{ color: gLogoColor }}
            >
              Tensor G5
            </span>
          </div>

          {/* Bottom Regulatory Text & Antenna Trim */}
          <div className="relative z-10 mb-3 text-center">
            <span className="text-[9px] font-medium opacity-50 uppercase tracking-widest" style={{ color: gLogoColor }}>
              Google Pixel 10 Pro XL
            </span>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. ULTRA-SLIM SIDE PROFILE VIEW                                       */}
      {/* ===================================================================== */}
      {view === "side" && (
        <div className="relative z-10 flex items-center justify-center h-[460px] sm:h-[490px] animate-in fade-in zoom-in-95">
          {/* Edge-on Aluminum Chassis Frame */}
          <div
            className="w-7 h-[460px] sm:h-[480px] rounded-full border-2 shadow-2xl relative flex flex-col items-center justify-between py-8 transition-colors duration-500"
            style={{ backgroundColor: frameColor, borderColor: "#3a4149" }}
          >
            {/* Top Antenna Band */}
            <div className="w-full h-1 bg-slate-800/80" />

            {/* Protruding Camera Visor Bump (Profile Stepped Transition) */}
            <div
              className="w-12 h-20 rounded-r-xl absolute -right-5 top-12 shadow-xl border-t-2 border-r-2 border-b-2 flex flex-col items-center justify-center p-1"
              style={{ backgroundColor: "#0c0d11", borderColor: visorFrame }}
            >
              <div className="w-2 h-14 bg-slate-800 rounded-full" />
            </div>

            {/* Power / Gemini Assistant Key */}
            <div className="w-2 h-8 bg-slate-900 rounded-l-xs absolute -left-1.5 top-36 border border-slate-700 shadow-sm" />

            {/* Volume Rocker Key */}
            <div className="w-2 h-16 bg-slate-900 rounded-l-xs absolute -left-1.5 top-48 border border-slate-700 shadow-sm" />

            {/* Bottom Antenna Band & SIM Slot Pin */}
            <div className="flex flex-col items-center gap-4 w-full">
              <div className="w-1 h-1 rounded-full bg-slate-900" />
              <div className="w-full h-1 bg-slate-800/80" />
            </div>
          </div>

          {/* Dimension spec callout badge */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full border border-slate-700 text-[11px] font-bold shadow-lg flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>8.5mm Ultra-Slim Profile</span>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. ANGLED PERSPECTIVE BACK VIEW                                       */}
      {/* ===================================================================== */}
      {view === "angled" && (
        <div className="relative z-10 w-64 sm:w-72 h-[460px] sm:h-[490px] flex items-center justify-center animate-in fade-in zoom-in-95">
          {/* 3D Angled Phone Chassis */}
          <div
            className="w-60 sm:w-64 h-[440px] sm:h-[460px] rounded-[36px] p-3 shadow-2xl border-[3px] flex flex-col items-center relative transform -rotate-6 skew-y-1 hover:rotate-0 transition-transform duration-500 ease-out"
            style={{ backgroundColor: color, borderColor: frameColor }}
          >
            {/* Satin Ambient Reflection Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/25 via-white/10 to-transparent rounded-[33px] pointer-events-none" />

            {/* 3D Visor with Shadow */}
            <div
              className="relative z-10 w-full h-20 rounded-2xl mt-4 px-3 py-2 flex items-center justify-between shadow-2xl border transform translate-x-1"
              style={{ backgroundColor: "#0c0d11", borderColor: visorFrame }}
            >
              {/* Pill Cutout with reflective lenses */}
              <div className="w-24 h-11 bg-black rounded-full border border-slate-800 flex items-center justify-around px-2 shadow-inner">
                <div className="w-7 h-7 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-blue-400 shadow-sm" />
                </div>
                <div className="w-7 h-7 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm" />
                </div>
              </div>

              {/* Periscope Cutout */}
              <div className="w-9 h-9 rounded-lg bg-black border border-slate-800 flex items-center justify-center">
                <div className="w-5 h-5 bg-slate-900 rounded-xs border border-indigo-400/50" />
              </div>

              {/* Flash Cluster */}
              <div className="w-3.5 h-3.5 rounded-full bg-amber-300 shadow-md flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              </div>
            </div>

            {/* G Logo */}
            <div className="relative z-10 my-auto flex flex-col items-center">
              <div
                className="w-10 h-10 rounded-full border-2 flex items-center justify-center shadow-md"
                style={{ borderColor: frameColor }}
              >
                <span className="text-xl font-black" style={{ color: gLogoColor }}>
                  G
                </span>
              </div>
            </div>

            <div className="relative z-10 mb-3 text-center">
              <span className="text-[10px] font-bold tracking-widest uppercase opacity-70" style={{ color: gLogoColor }}>
                {colorName} Finish
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
