'use client';

import { Truck, MapPin, Clock, ShieldCheck, DollarSign, PackageCheck } from 'lucide-react';
import useSettingsStore from '../store/settingsStore';

const ShippingInfo = () => {
  const settings = useSettingsStore((s) => s.settings);
  const brandName = settings?.shopName || 'Mobixa';

  const methods = [
    {
      title: 'Same-Day Express Delivery',
      area: 'Colombo 1 - 15 & Inner Suburbs',
      time: 'Within 4 – 8 Hours',
      fee: 'LKR 450 – LKR 750',
      desc: 'Fast express courier dispatch for urgent smartphone and accessory orders placed before 2:00 PM.'
    },
    {
      title: 'Island-Wide Standard Courier',
      area: 'All Districts Across Sri Lanka',
      time: '2 – 3 Working Days',
      fee: 'LKR 550 (Free over LKR 50,000)',
      desc: 'Secure tracked doorstep shipping via trusted courier partners (Pronto, Domex, Prompt Xpress).'
    },
    {
      title: 'In-Store Pickup (Boutique Collect)',
      area: 'Official Mobixa Outlets',
      time: 'Ready in 1 Hour',
      fee: 'FREE',
      desc: 'Order online and pick up your items directly at your preferred store location at your convenience.'
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Banner */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-lg space-y-3">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.15),transparent_60%)] pointer-events-none" />
          <span className="inline-flex items-center gap-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest">
            <Truck size={12} /> Doorstep Delivery & Logistics
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight m-0">Shipping & Delivery Information</h1>
          <p className="text-slate-300 text-xs sm:text-sm font-semibold max-w-2xl m-0">
            We deliver smartphones, laptops, and tech accessories safely to any location in Sri Lanka with live tracking.
          </p>
        </div>

        {/* Methods */}
        <div className="space-y-6">
          <h2 className="text-xl font-black text-slate-900 m-0">Delivery Options & Rates</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {methods.map((m, i) => (
              <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                    <Truck size={20} />
                  </div>
                  <h3 className="text-base font-black text-slate-900 m-0">{m.title}</h3>
                  <div className="space-y-1.5 text-xs font-semibold text-slate-600">
                    <p className="m-0 flex items-center gap-2"><MapPin size={13} className="text-slate-400 shrink-0" /> {m.area}</p>
                    <p className="m-0 flex items-center gap-2"><Clock size={13} className="text-slate-400 shrink-0" /> {m.time}</p>
                    <p className="m-0 flex items-center gap-2 text-emerald-700 font-extrabold"><DollarSign size={13} className="shrink-0" /> {m.fee}</p>
                  </div>
                  <p className="text-slate-500 text-xs font-medium leading-relaxed m-0 pt-2 border-t border-slate-100">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security & Tracking */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <h2 className="text-xl font-black text-slate-900 m-0">Package Handling & Safety</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 m-0">Insured Transit</h4>
                <p className="text-xs text-slate-500 font-semibold m-0 mt-1 leading-relaxed">Every device parcel is tamper-sealed and insured against loss or physical damage during delivery transit.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
                <PackageCheck size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 m-0">Real-Time SMS Tracking</h4>
                <p className="text-xs text-slate-500 font-semibold m-0 mt-1 leading-relaxed">Receive instant SMS alerts with live tracking waybill numbers as soon as your parcel is dispatched.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ShippingInfo;
