'use client';

import { RotateCcw, ShieldAlert, CheckCircle, RefreshCw, AlertCircle, FileText } from 'lucide-react';
import useSettingsStore from '../store/settingsStore';

const ReturnsPolicy = () => {
  const settings = useSettingsStore((s) => s.settings);
  const brandName = settings?.shopName || 'Mobixa';
  const brandPhone = settings?.phone || '+94 11 255 5000';

  const steps = [
    { num: '01', title: 'Submit Return Request', desc: 'Contact customer care or submit a return request from My Orders within 7 days of delivery.' },
    { num: '02', title: 'Pack Device & Box', desc: 'Ensure the mobile device, original box, charger, invoice receipt, and IMEI stickers are intact.' },
    { num: '03', title: 'Drop-off / Courier Pickup', desc: 'Drop off at any official Mobixa outlet or schedule a free courier pickup.' },
    { num: '04', title: 'Technical Inspection & Exchange', desc: 'Our technicians verify the hardware defect within 24 hours and issue a replacement unit or refund.' }
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Banner */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-lg space-y-3">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.15),transparent_60%)] pointer-events-none" />
          <span className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
            <RotateCcw size={12} /> 7-Day Guarantee & Warranty
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight m-0">Returns & Exchange Policy</h1>
          <p className="text-slate-300 text-xs sm:text-sm font-semibold max-w-2xl m-0">
            Hassle-free 7-day replacement guarantee and transparent return policies for your tech purchases.
          </p>
        </div>

        {/* Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
              <RefreshCw size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 m-0">7-Day Replacement Guarantee</h3>
              <p className="text-xs text-slate-500 font-semibold m-0 mt-1 leading-relaxed">If your purchased phone or accessory exhibits a manufacturing defect within 7 days, we issue an immediate replacement unit.</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 m-0">Official Warranty Support</h3>
              <p className="text-xs text-slate-500 font-semibold m-0 mt-1 leading-relaxed">All devices are covered by 1-Year Company / Agent Warranty or Mobixa Store Warranty with official repair support.</p>
            </div>
          </div>
        </div>

        {/* Return Steps */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <h2 className="text-xl font-bold text-slate-900 m-0">Simple 4-Step Return Process</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((s, i) => (
              <div key={i} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-2">
                <span className="text-2xl font-bold text-amber-600 block">{s.num}</span>
                <h4 className="text-sm font-bold text-slate-900 m-0">{s.title}</h4>
                <p className="text-xs text-slate-500 font-semibold m-0 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Terms */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
          <h2 className="text-xl font-bold text-slate-900 m-0">Return Eligibility Conditions</h2>
          <ul className="space-y-2 pl-5 m-0 list-disc">
            <li>Item must be returned with the original retail box, user manuals, warranty card, and untouched included accessories.</li>
            <li>The phone's serial number and IMEI must match the original invoice bill issued at purchase.</li>
            <li>Physical damage, water liquid damage, unauthorized jailbreaking/rooting, or display cracks are excluded from return eligibility.</li>
          </ul>
        </div>

      </div>
    </div>
  );
};

export default ReturnsPolicy;
