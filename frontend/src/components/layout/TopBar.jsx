import React from "react";
import { Phone, Globe } from "lucide-react";

export default function TopBar() {
  return (
    <div className="bg-[#0a0f1d] text-slate-300 text-xs py-2 px-4 sm:px-6 flex justify-between items-center border-b border-slate-800/60 z-50">
      <div className="flex items-center gap-2 font-medium tracking-wide">
        <span className="text-amber-400 select-none">🔥</span>
        <span>Mobixa - Next-Gen Technology &amp; Accessories Store</span>
      </div>
      <div className="hidden sm:flex items-center gap-4 text-slate-400 font-medium">
        <a
          href="tel:+94112555000"
          className="flex items-center gap-1.5 hover:text-white transition-colors duration-200"
        >
          <Phone className="w-3.5 h-3.5 text-blue-400" />
          <span>+94 11 255 5000</span>
        </a>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5 hover:text-white cursor-pointer transition-colors duration-200">
          <Globe className="w-3.5 h-3.5 text-blue-400" />
          <span>LKR LK</span>
        </div>
      </div>
    </div>
  );
}
