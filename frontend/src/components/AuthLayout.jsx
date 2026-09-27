"use client";

import { Smartphone } from "lucide-react";

const BRAND_POINTS = [
  "Real-time stock & sales tracking",
  "Secure staff and customer accounts",
  "Built for speed on any device",
];

// Shared full-viewport background for the Login / Create Account / Forgot Password cards.
export default function AuthLayout({ children }) {
  return (
    <div className="flex-1 w-full flex bg-white">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden bg-gradient-to-b from-[#1864d9] via-[#123e91] to-[#080d1e] text-white flex-col justify-center px-14">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute -top-24 -left-16 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-28 -right-10 w-96 h-96 bg-sky-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2.5 bg-white/10 border border-white/15 rounded-2xl px-4 py-2 mb-10 backdrop-blur-sm">
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-[#1557bf]" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-sm tracking-tight">Mobixa</span>
              <span className="text-xs font-bold text-blue-200 tracking-wider">
                MOBILE SHOP ERP
              </span>
            </div>
          </div>

          <h2 className="text-3xl font-bold leading-tight max-w-sm">
            Run your mobile shop the smart way.
          </h2>
          <p className="text-blue-100/80 text-sm mt-4 max-w-sm leading-relaxed">
            Inventory, sales, and staff all in one place — built for tech and
            smart device retailers.
          </p>

          <ul className="mt-10 space-y-4">
            {BRAND_POINTS.map((line) => (
              <li
                key={line}
                className="flex items-center gap-3 text-sm text-blue-50/90"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-sky-300 flex-shrink-0" />
                {line}
              </li>
            ))}
          </ul>
        </div>

        <div className="absolute bottom-8 left-14 right-14 z-10 flex items-center justify-between text-xs text-blue-200/70">
          <span>&copy; {new Date().getFullYear()} Mobixa</span>
          <div className="flex items-center gap-4">
            <a href="/help-center" className="hover:text-white transition-colors">
              Help
            </a>
            <a href="/privacy-policy" className="hover:text-white transition-colors">
              Privacy
            </a>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full flex justify-center auth-card-enter">
          {children}
        </div>
      </div>
    </div>
  );
}
