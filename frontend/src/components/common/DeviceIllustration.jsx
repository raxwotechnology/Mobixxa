import React from 'react';

export function MarshallHeadphonesIllustration({ color = '#181818', className = '' }) {
  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* Headband Arc */}
      <div className="w-36 h-20 border-4 border-slate-900 rounded-t-full border-b-0 shadow-lg relative flex items-center justify-center">
        {/* Headband Leather Texture Pad */}
        <div
          className="w-32 h-3.5 rounded-full border border-amber-600/30 -mt-14 shadow-inner"
          style={{ backgroundColor: color === '#181818' ? '#222' : color }}
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
            <span className="text-xs font-serif italic font-bold text-amber-200/90 tracking-widest">
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
            <span className="text-xs font-serif italic font-bold text-amber-200/90 tracking-widest">
              M
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MarshallSpeakerIllustration({ color = '#1f1f1f', className = '' }) {
  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* Speaker Cabinet */}
      <div
        className="w-52 h-32 sm:w-60 sm:h-36 rounded-2xl p-2.5 shadow-2xl border-2 border-slate-700/80 flex flex-col justify-between relative transition-colors duration-300"
        style={{ backgroundColor: color }}
      >
        {/* Top Control Bar with Brass Knob */}
        <div className="flex items-center justify-between px-2 pt-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 shadow-xs animate-pulse" />
            <span className="text-[8px] font-mono text-slate-300 font-semibold tracking-wider">BATTERY 100%</span>
          </div>
          {/* Iconic Multi-Directional Brass Knob */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 via-amber-300 to-amber-600 shadow-md border border-amber-200 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-amber-700" />
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-600" />
          </div>
        </div>

        {/* Iconic Front Metal Grille with Marshall Script */}
        <div className="h-20 sm:h-24 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center relative shadow-inner overflow-hidden">
          {/* Grille mesh pattern */}
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage: 'radial-gradient(#d4af37 1.5px, transparent 1.5px)',
              backgroundSize: '5px 5px',
            }}
          />
          {/* Golden Script Marshall Script */}
          <div className="relative z-10 bg-slate-950/90 px-4 py-1 rounded-md border border-amber-400/40 shadow-lg">
            <span className="text-sm sm:text-base font-serif italic font-bold text-amber-300 tracking-wider">
              Marshall
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PS5ProIllustration({ className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-4 select-none ${className}`}>
      {/* PS5 Pro Console Tower */}
      <div className="w-22 h-48 relative flex items-center justify-center">
        {/* Inner Dark Tech Core */}
        <div className="w-16 h-44 bg-slate-950 rounded-sm border-x border-slate-800 flex flex-col justify-between items-center py-2.5 shadow-2xl relative">
          {/* Blue Neon Glow Light Strip */}
          <div className="absolute -left-0.5 inset-y-2 w-0.5 bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <div className="w-4 h-0.5 bg-slate-700 rounded-full" />
          <div className="w-6 h-1 bg-slate-800 rounded-xs" />
        </div>

        {/* Sculpted Curved White Fin Panels */}
        <div className="absolute inset-y-0 -left-1.5 w-6 bg-gradient-to-r from-slate-100 to-white rounded-l-2xl border-l border-slate-300 shadow-md transform -skew-y-3" />
        <div className="absolute inset-y-0 -right-1.5 w-6 bg-gradient-to-l from-slate-100 to-white rounded-r-2xl border-r border-slate-300 shadow-md transform skew-y-3" />
        
        {/* Stand */}
        <div className="absolute -bottom-1.5 w-20 h-2.5 bg-slate-800 rounded-full shadow-md" />
      </div>

      {/* DualSense Controller */}
      <div className="w-22 h-26 bg-white rounded-3xl p-2 shadow-xl border border-slate-200 flex flex-col justify-between relative transform rotate-6">
        {/* Touchpad with blue LED border */}
        <div className="w-12 h-7 bg-slate-900 rounded-md mx-auto mt-1 border border-blue-400 shadow-xs flex items-center justify-center">
          <span className="w-2.5 h-0.5 bg-blue-400 rounded-full" />
        </div>
        {/* Thumbsticks */}
        <div className="flex justify-around px-2 my-auto">
          <div className="w-4 h-4 rounded-full bg-slate-800 border border-slate-600" />
          <div className="w-4 h-4 rounded-full bg-slate-800 border border-slate-600" />
        </div>
        {/* Bottom handle grips */}
        <div className="flex justify-between px-1.5 text-[7px] font-bold text-slate-400">
          <span>PRO</span>
          <span>SONY</span>
        </div>
      </div>
    </div>
  );
}

export function PixelProIllustration({ color = '#1e1e20', className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-4 select-none ${className}`}>
      {/* Front Screen View */}
      <div className="w-22 h-48 bg-slate-950 rounded-[24px] p-2 shadow-xl border-2 border-slate-800 flex flex-col justify-between relative">
        <div className="w-2 h-2 rounded-full bg-slate-800 mx-auto mt-0.5" />
        <div className="h-34 rounded-[18px] bg-gradient-to-tr from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center p-2 text-center">
          <span className="text-xs font-bold text-white tracking-tight">Pixel 10 Pro</span>
          <span className="text-[8px] text-blue-300 font-mono">Tensor G5</span>
        </div>
        <div className="w-8 h-0.5 bg-slate-600 rounded-full mx-auto mb-1" />
      </div>

      {/* Back Body View with Camera Visor Bar */}
      <div
        className="w-22 h-48 rounded-[24px] p-2 shadow-xl border-2 border-slate-800/40 flex flex-col items-center relative transition-colors duration-300"
        style={{ backgroundColor: color }}
      >
        {/* Signature Pixel Camera Visor Bar */}
        <div className="w-full h-9 bg-slate-900 rounded-lg mt-3 flex items-center justify-around px-2 shadow-md border border-slate-800">
          <div className="w-4 h-4 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500/80" />
          </div>
          <div className="w-4 h-4 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/80" />
          </div>
          <div className="w-3 h-3 rounded-full bg-amber-400/90 shadow-sm" />
        </div>

        {/* Minimalist 'G' logo on back */}
        <div className="mt-auto mb-4 w-5 h-5 rounded-full border-2 border-slate-700/50 flex items-center justify-center">
          <span className="text-xs font-bold text-slate-700">G</span>
        </div>
      </div>
    </div>
  );
}

export function PixelStandardIllustration({ color = '#2d3135', className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-3 select-none ${className}`}>
      {/* Front Screen */}
      <div className="w-20 h-44 bg-slate-950 rounded-[20px] p-1.5 shadow-xl border-2 border-slate-800 flex flex-col justify-between">
        <div className="w-1.5 h-1.5 rounded-full bg-slate-800 mx-auto mt-0.5" />
        <div className="h-32 rounded-[14px] bg-gradient-to-br from-emerald-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-bold text-white">Pixel 10</span>
          <span className="text-[8px] text-emerald-400">OLED 120Hz</span>
        </div>
        <div className="w-6 h-0.5 bg-slate-600 rounded-full mx-auto mb-1" />
      </div>

      {/* Back with Visor */}
      <div
        className="w-20 h-44 rounded-[20px] p-1.5 shadow-xl border border-slate-700/30 flex flex-col items-center relative transition-colors duration-300"
        style={{ backgroundColor: color }}
      >
        <div className="w-full h-8 bg-slate-900 rounded-lg mt-3 flex items-center justify-around px-2 shadow-sm border border-slate-800">
          <div className="w-3.5 h-3.5 rounded-full bg-slate-950 border border-slate-700" />
          <div className="w-3.5 h-3.5 rounded-full bg-slate-950 border border-slate-700" />
        </div>
        <div className="mt-auto mb-3 w-4 h-4 rounded-full border border-slate-700/40 flex items-center justify-center">
          <span className="text-[8px] font-bold text-slate-700">G</span>
        </div>
      </div>
    </div>
  );
}

export function FitbitIllustration({ color = '#1e1e20', className = '' }) {
  return (
    <div className={`relative flex flex-col items-center justify-center py-2 select-none ${className}`}>
      <div
        className="w-14 h-12 rounded-t-xl transition-colors duration-300 border-x border-t border-slate-400/20"
        style={{ backgroundColor: color }}
      />
      <div className="w-28 h-36 bg-slate-950 rounded-[28px] p-2.5 shadow-xl border-2 border-slate-700 z-10 flex flex-col items-center justify-between">
        <div className="flex items-center justify-between w-full text-xs text-blue-400 px-1 pt-0.5">
          <span className="font-bold text-[10px]">FITBIT</span>
          <span className="text-slate-400 font-mono text-[10px]">10:08</span>
        </div>
        <div className="text-center my-auto">
          <span className="text-2xl font-bold text-white tracking-tight">8,420</span>
          <span className="text-xs text-emerald-400 block font-medium">Steps Today</span>
        </div>
        <div className="w-14 h-1 bg-emerald-500 rounded-full mb-1" />
      </div>
      <div
        className="w-14 h-12 rounded-b-xl transition-colors duration-300 border-x border-b border-slate-400/20"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

export function InfinixIllustration({ color = '#202b36', className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-3 select-none ${className}`}>
      <div className="w-20 h-44 bg-slate-950 rounded-[22px] p-1.5 shadow-xl border-2 border-slate-800 flex flex-col justify-between">
        <div className="w-2 h-2 rounded-full bg-slate-800 mx-auto mt-0.5" />
        <div className="h-32 rounded-[16px] bg-gradient-to-tr from-emerald-950 via-slate-900 to-teal-950 flex flex-col items-center justify-center p-2 text-center">
          <span className="text-xs font-bold text-white">Note 60 Ultra</span>
          <span className="text-[7px] text-teal-300">200MP OIS</span>
        </div>
        <div className="w-8 h-0.5 bg-slate-600 rounded-full mx-auto mb-1" />
      </div>
      <div
        className="w-20 h-44 rounded-[22px] p-1.5 shadow-xl border-2 border-slate-800/40 flex flex-col items-center relative transition-colors duration-300"
        style={{ backgroundColor: color }}
      >
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

export function TabletIllustration({ color = '#3d4450', className = '' }) {
  return (
    <div
      className={`w-40 h-52 sm:w-48 sm:h-60 rounded-2xl p-2 shadow-xl border-2 border-slate-700 flex flex-col justify-between transition-colors duration-300 select-none ${className}`}
      style={{ backgroundColor: color }}
    >
      <div className="h-full bg-slate-950 rounded-xl p-3 flex flex-col justify-between border border-slate-800">
        <div className="flex justify-between items-center text-[8px] text-slate-400">
          <span>iPad Pro</span>
          <span>98%</span>
        </div>
        <div className="text-center my-auto">
          <span className="text-base font-bold text-white block">Ultra Retina XDR</span>
          <span className="text-xs text-blue-400 font-mono">Apple M4 Chip</span>
        </div>
        <div className="w-12 h-1 bg-slate-600 rounded-full mx-auto" />
      </div>
    </div>
  );
}

export function LaptopIllustration({ color = '#8a8d91', className = '' }) {
  return (
    <div className={`w-48 sm:w-56 flex flex-col items-center select-none ${className}`}>
      <div className="w-44 sm:w-52 h-32 bg-slate-950 rounded-t-xl p-2 border-t border-x border-slate-700 shadow-lg flex flex-col justify-between">
        <div className="w-1.5 h-1.5 rounded-full bg-slate-800 mx-auto" />
        <div className="h-24 bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 rounded-lg p-2 flex flex-col items-center justify-center text-center">
          <span className="text-sm font-bold text-white">MacBook Air 15</span>
          <span className="text-[8px] text-amber-300">Liquid Retina</span>
        </div>
      </div>
      <div
        className="w-48 sm:w-56 h-3 rounded-b-lg border-t border-slate-600 shadow-md transition-colors duration-300"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

export function EarbudsIllustration({ color = '#f2f1ec', className = '' }) {
  return (
    <div className={`flex items-center gap-4 select-none ${className}`}>
      <div
        className="w-24 h-28 rounded-[32px] p-2.5 shadow-lg border-2 border-slate-700 flex flex-col items-center justify-between transition-colors duration-300"
        style={{ backgroundColor: color }}
      >
        <div className="w-10 h-1 bg-slate-600 rounded-full mt-1" />
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[8px] font-mono text-slate-700 mb-1">Pixel Buds</span>
      </div>
      <div
        className="w-12 h-12 rounded-full shadow-md border-2 border-slate-700 flex items-center justify-center transition-colors duration-300"
        style={{ backgroundColor: color }}
      >
        <div className="w-5 h-5 rounded-full bg-slate-900 border border-slate-700" />
      </div>
    </div>
  );
}

export function ChargerIllustration({ color = '#ffffff', className = '' }) {
  return (
    <div
      className={`w-24 h-32 rounded-2xl p-2.5 shadow-xl border-2 border-slate-700 flex flex-col items-center justify-between transition-colors duration-300 select-none ${className}`}
      style={{ backgroundColor: color }}
    >
      <div className="flex gap-2">
        <div className="w-1.5 h-4 bg-slate-400 rounded-sm" />
        <div className="w-1.5 h-4 bg-slate-400 rounded-sm" />
      </div>
      <div className="text-center">
        <span className="text-sm font-bold text-slate-800 block">65W</span>
        <span className="text-[8px] text-blue-600 font-bold uppercase">GaN Prime</span>
      </div>
      <div className="flex flex-col gap-1.5 w-full items-center mb-1">
        <div className="w-8 h-2 bg-slate-900 rounded-xs" />
        <div className="w-8 h-2 bg-slate-900 rounded-xs" />
      </div>
    </div>
  );
}

/**
 * Universal DeviceIllustration Component
 * Renders the accurate visual representation based on deviceType or identifier
 */
export default function DeviceIllustration({ deviceType = '', color = '#1c1c1e', className = '' }) {
  const normType = String(deviceType).toLowerCase().trim();

  if (normType.includes('emberton') || normType.includes('speaker')) {
    return <MarshallSpeakerIllustration color={color} className={className} />;
  }
  if (normType.includes('monitor') || normType.includes('headphone')) {
    return <MarshallHeadphonesIllustration color={color} className={className} />;
  }
  if (normType.includes('ps5') || normType.includes('playstation') || normType.includes('gaming')) {
    return <PS5ProIllustration className={className} />;
  }
  if (normType.includes('pixel-10-pro') || normType.includes('pixel-pro') || normType === 'pixel-10-pro-xl') {
    return <PixelProIllustration color={color} className={className} />;
  }
  if (normType.includes('pixel') || normType.includes('10a')) {
    return <PixelStandardIllustration color={color} className={className} />;
  }
  if (normType.includes('fitbit') || normType.includes('watch')) {
    return <FitbitIllustration color={color} className={className} />;
  }
  if (normType.includes('infinix')) {
    return <InfinixIllustration color={color} className={className} />;
  }
  if (normType.includes('tablet') || normType.includes('ipad')) {
    return <TabletIllustration color={color} className={className} />;
  }
  if (normType.includes('laptop') || normType.includes('macbook')) {
    return <LaptopIllustration color={color} className={className} />;
  }
  if (normType.includes('earbuds') || normType.includes('buds') || normType.includes('airpods')) {
    return <EarbudsIllustration color={color} className={className} />;
  }
  if (normType.includes('charger') || normType.includes('adapter')) {
    return <ChargerIllustration color={color} className={className} />;
  }

  // Fallback: Default to Pixel Pro or modern gadget silhouette
  return <PixelProIllustration color={color} className={className} />;
}
