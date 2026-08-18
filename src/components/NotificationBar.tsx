'use client';

import { Phone, Flag } from 'lucide-react';

export default function NotificationBar() {
  return (
    <div className="w-full bg-[#0F172A] text-white py-2">
      <div className="w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32 flex items-center justify-between text-xs sm:text-sm">
        {/* Left: Brand subtitle */}
        <p className="text-slate-300 font-medium tracking-wide">
          <span className="text-blue-400 font-semibold">Mobixa</span>
          {' '}•{' '}
          <span className="hidden sm:inline">Next-Gen Technology &amp; Accessories Store</span>
          <span className="inline sm:hidden">Next-Gen Tech Store</span>
        </p>

        {/* Right: Phone + flag */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors duration-200 cursor-pointer group">
            <Phone
              size={13}
              className="text-blue-400 group-hover:text-blue-300 transition-colors duration-200"
            />
            <span className="font-medium">+94 11 255 5000</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <span className="text-base leading-none" title="Sri Lanka">🇱🇰</span>
            <span className="hidden sm:inline text-xs font-medium text-slate-400">LK</span>
          </div>
        </div>
      </div>
    </div>
  );
}
