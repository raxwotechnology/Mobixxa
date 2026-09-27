'use client';

import {
  ShieldCheck, Lock, Eye, Server, UserCheck,
  Mail, Phone, BadgeCheck, FileText,
} from 'lucide-react';
import useSettingsStore from '../store/settingsStore';

const RAXWO_PHONE = '0743573333';
const RAXWO_EMAIL = 'contact@raxwo.net';
const RAXWO_COMPANY = 'Raxwo Pvt Ltd';

const PrivacyPolicy = () => {
  const settings = useSettingsStore((s) => s.settings);
  const brandName = settings?.shopName || RAXWO_COMPANY;

  const sections = [
    {
      icon: Eye,
      color: 'bg-blue-50 text-blue-600 border-blue-100',
      accent: 'border-l-blue-400',
      title: '1. Information We Collect',
      points: [
        'Personal Contact Details: Name, email address, phone number, and delivery address when registering an account or placing orders.',
        'Payment & Billing Data: Payment method preferences, invoice records, and transaction history. Credit card details are processed through encrypted payment gateways.',
        'Account Credentials: Encrypted login passwords, profile avatar images, and loyalty points balances.',
      ],
    },
    {
      icon: Server,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      accent: 'border-l-emerald-400',
      title: '2. How We Use Your Data',
      points: [
        'Fulfilling smartphone, laptop, and accessory orders, doorstep deliveries, and warranty services.',
        'Sending order confirmation updates, invoice receipts, and delivery SMS notifications.',
        'Verifying identity for Hire Purchase (HP) installment agreements and warranty claims.',
        'Improving site security, preventing fraudulent transactions, and tailoring personalized deals.',
      ],
    },
    {
      icon: Lock,
      color: 'bg-violet-50 text-violet-600 border-violet-100',
      accent: 'border-l-violet-400',
      title: '3. Data Security & Storage',
      points: [
        'All communication between your browser and our servers is secured via 256-bit SSL encryption.',
        'Passwords and sensitive session tokens are salted and hashed using modern security algorithms.',
        'Store transaction databases are monitored around the clock with strict role-based authorization.',
      ],
    },
    {
      icon: UserCheck,
      color: 'bg-amber-50 text-amber-600 border-amber-100',
      accent: 'border-l-amber-400',
      title: '4. Information Sharing & Third Parties',
      points: [
        'We will never sell or rent your personal data to third-party marketers.',
        'Official Delivery Partners: Registered courier agents strictly for doorstep product delivery.',
        'Licensed Payment Gateways: Authorized providers such as PayHere and Koko Installments.',
        'Regulatory Authorities: Only when required by law to protect legal rights.',
      ],
    },
    {
      icon: ShieldCheck,
      color: 'bg-rose-50 text-rose-600 border-rose-100',
      accent: 'border-l-rose-400',
      title: '5. Your Privacy Rights',
      points: [
        'Access & Update: You can review and edit your profile details at any time from your account settings.',
        'Account Erasure: You may request deletion of your account and personal history by contacting our privacy team.',
        'Data Portability: Request a copy of your personal data in a machine-readable format.',
      ],
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* ── Hero Banner (Light) ── */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-400 shadow-lg">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="relative z-10 px-8 py-12 sm:py-14 flex flex-col sm:flex-row items-center gap-8">
            <div className="shrink-0 w-16 h-16 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center">
              <ShieldCheck size={34} className="text-white" />
            </div>
            <div className="space-y-2 text-center sm:text-left">
              <span className="inline-flex items-center gap-1.5 bg-white/20 text-white border border-white/30 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-widest">
                <BadgeCheck size={11} /> Privacy & Data Protection
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold text-white m-0 leading-tight">Privacy Policy</h1>
              <p className="text-emerald-100 text-sm m-0 font-medium max-w-xl">
                At <span className="font-semibold text-white">{brandName}</span>, we prioritize your trust and are committed to safeguarding your personal data.
              </p>
              <p className="text-xs text-emerald-200 m-0 pt-1 font-medium uppercase tracking-wider">Last Updated: September 2026</p>
            </div>
          </div>
        </div>

        {/* ── Intro Note ── */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-4 flex items-start gap-3">
          <FileText size={18} className="text-emerald-600 mt-0.5 shrink-0" />
          <p className="text-sm text-emerald-800 font-medium m-0 leading-relaxed">
            This Privacy Policy describes how <span className="font-semibold">{RAXWO_COMPANY}</span> collects, uses, and protects your personal information when you use our services, website, and mobile applications.
          </p>
        </div>

        {/* ── Policy Sections ── */}
        <div className="space-y-5">
          {sections.map((sec, index) => {
            const Icon = sec.icon;
            return (
              <div
                key={index}
                className={`bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs border-l-4 ${sec.accent} hover:shadow-sm transition-all`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${sec.color}`}>
                    <Icon size={20} />
                  </div>
                  <h2 className="text-base font-semibold text-slate-900 m-0">{sec.title}</h2>
                </div>
                <ul className="space-y-2 m-0 pl-0 list-none">
                  {sec.points.map((point, pi) => (
                    <li key={pi} className="flex items-start gap-2 text-sm text-slate-600 font-medium leading-relaxed">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* ── Contact Card ── */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-base font-semibold text-slate-900 m-0">Have questions about your data privacy?</h3>
              <p className="text-sm text-slate-500 m-0 mt-1">
                Contact our Privacy & Data Protection team at{' '}
                <span className="font-semibold text-slate-700">{RAXWO_COMPANY}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-3 justify-center shrink-0">
              <a
                href={`mailto:${RAXWO_EMAIL}`}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 no-underline transition-colors shadow-xs"
              >
                <Mail size={15} /> {RAXWO_EMAIL}
              </a>
              <a
                href={`tel:${RAXWO_PHONE}`}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 no-underline transition-colors"
              >
                <Phone size={15} /> {RAXWO_PHONE}
              </a>
            </div>
          </div>
        </div>

        {/* ── Footer Note ── */}
        <p className="text-center text-xs text-slate-400 pb-2 font-medium">
          &copy; {new Date().getFullYear()} {RAXWO_COMPANY}. All rights reserved.
        </p>

      </div>
    </div>
  );
};

export default PrivacyPolicy;
