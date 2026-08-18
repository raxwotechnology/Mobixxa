'use client';

import { Truck, Zap, ShieldCheck, Cpu } from 'lucide-react';

const features = [
  {
    id: 'feature-shipping',
    icon: Truck,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    title: 'Free Shipping',
    subtitle: 'On all devices nationwide',
  },
  {
    id: 'feature-dispatch',
    icon: Zap,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    title: 'Fast Dispatch',
    subtitle: 'Packed in 24 hours',
  },
  {
    id: 'feature-warranty',
    icon: ShieldCheck,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    title: 'Official Warranty',
    subtitle: 'Guaranteed 100% genuine',
  },
  {
    id: 'feature-tech',
    icon: Cpu,
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    title: 'Latest Tech',
    subtitle: 'Curated top-tier brands',
  },
];

export default function FeatureCards() {
  return (
    <section className="w-full bg-white py-8">
      <div className="w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          {features.map(({ id, icon: Icon, iconBg, iconColor, title, subtitle }) => (
            <div
              key={id}
              id={id}
              className="flex items-center gap-4 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all duration-200 group"
            >
              <div className={`w-12 h-12 flex items-center justify-center rounded-xl ${iconBg} shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                <Icon size={22} className={iconColor} />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-base">{title}</p>
                <p className="text-slate-500 text-xs sm:text-sm mt-0.5 leading-snug">{subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
