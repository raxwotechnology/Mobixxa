'use client';

import { useState } from 'react';
import {
  HelpCircle, Search, ShoppingBag, Truck, RotateCcw, Wrench,
  ChevronDown, Phone, Mail, MessageCircle, Star, Clock, CheckCircle2,
} from 'lucide-react';
import useSettingsStore from '../store/settingsStore';

const RAXWO_PHONE = '0743573333';
const RAXWO_EMAIL = 'contact@raxwo.net';
const RAXWO_COMPANY = 'Raxwo Pvt Ltd';

const HelpCenter = () => {
  const settings = useSettingsStore((s) => s.settings);
  const brandName = settings?.shopName || RAXWO_COMPANY;

  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const categories = [
    { title: 'Orders & Payment', icon: ShoppingBag, desc: 'Payment methods, Koko installments & order status', color: 'bg-blue-50 text-blue-600 border-blue-100' },
    { title: 'Shipping & Delivery', icon: Truck, desc: 'Island-wide delivery timelines & courier tracking', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { title: 'Returns & Exchange', icon: RotateCcw, desc: '7-day replacement guarantee & refund policy', color: 'bg-amber-50 text-amber-600 border-amber-100' },
    { title: 'Mobile Repair & Support', icon: Wrench, desc: 'Device diagnostic & warranty claims', color: 'bg-violet-50 text-violet-600 border-violet-100' },
  ];

  const stats = [
    { icon: Clock, label: 'Support Hours', value: '9AM – 8PM Daily' },
    { icon: CheckCircle2, label: 'Response Time', value: 'Within 2 Hours' },
    { icon: Star, label: 'Customer Rating', value: '4.8 / 5 Stars' },
  ];

  const faqs = [
    {
      q: `How do I track my ${brandName} order?`,
      a: 'You can track your order by clicking "Track Order" in the top menu or visiting My Orders in your profile. You will also receive SMS updates with your courier tracking number.',
    },
    {
      q: 'What payment methods do you accept?',
      a: 'We accept Cash on Delivery (COD), Card Payments (Visa/MasterCard), Koko 3-month Installments, Bank Transfers, and Hire Purchase (HP) agreements for eligible devices.',
    },
    {
      q: 'What is your warranty policy for mobile phones and laptops?',
      a: 'All new mobile devices come with a 1-Year Company / Agent Warranty. Pre-owned and refurbished devices include a 6-Month Store Warranty with a 7-day checking guarantee.',
    },
    {
      q: 'How long does island-wide shipping take?',
      a: 'Orders within Colombo & Gampaha are delivered within 24 hours. Island-wide courier deliveries to outer districts take 2 to 3 working days.',
    },
    {
      q: 'Can I exchange or return a product?',
      a: 'Yes! We offer a 7-Day Replacement Guarantee for manufacturing defects. Products must be returned in original packaging with all accessories and box IMEI matching.',
    },
  ];

  const filteredFaqs = faqs.filter(
    (f) =>
      f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.a.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* ── Hero Banner (Light) ── */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-sky-400 shadow-lg">
          {/* subtle pattern overlay */}
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="relative z-10 px-8 py-12 sm:py-14 text-center space-y-5">
            <span className="inline-flex items-center gap-1.5 bg-white/20 text-white border border-white/30 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest">
              <HelpCircle size={12} /> Help Center
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-white m-0 leading-tight">
              How can we help you today?
            </h1>
            <p className="text-blue-100 text-sm max-w-md mx-auto m-0 font-medium">
              Search our knowledge base or browse topics for instant answers.
            </p>

            {/* Search */}
            <div className="max-w-md mx-auto relative mt-2">
              <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300 pointer-events-none" />
              <input
                type="text"
                placeholder="Search questions, shipping, warranty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/95 border-0 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-white/60 shadow-sm font-medium"
              />
            </div>
          </div>
        </div>

        {/* ── Stats Strip ── */}
        <div className="grid grid-cols-3 gap-4">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-xs">
                <div className="flex justify-center mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <Icon size={16} />
                  </div>
                </div>
                <p className="text-sm font-bold text-slate-900 m-0">{s.value}</p>
                <p className="text-xs text-slate-500 m-0 mt-0.5">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* ── Help Categories ── */}
        <div>
          <h2 className="text-base font-semibold text-slate-700 mb-3 px-1">Browse by Topic</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((cat, i) => {
              const Icon = cat.icon;
              return (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 text-left hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 ${cat.color}`}>
                    <Icon size={20} />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 m-0 group-hover:text-blue-600 transition-colors">{cat.title}</h3>
                  <p className="text-slate-500 text-xs m-0 mt-1 leading-relaxed">{cat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── FAQs ── */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 m-0">Frequently Asked Questions</h2>
            <p className="text-xs text-slate-500 m-0 mt-1">Quick solutions to common customer queries</p>
          </div>

          <div className="space-y-3">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-400 font-medium">
                No results found for &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              filteredFaqs.map((faq, index) => (
                <div key={index} className={`border rounded-xl overflow-hidden transition-all ${openFaq === index ? 'border-blue-200 shadow-xs' : 'border-slate-200'}`}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 cursor-pointer border-0 bg-transparent"
                  >
                    <span className={`text-sm font-medium ${openFaq === index ? 'text-blue-600' : 'text-slate-800'}`}>{faq.q}</span>
                    <ChevronDown
                      size={16}
                      className={`shrink-0 transition-transform ${openFaq === index ? 'rotate-180 text-blue-500' : 'text-slate-400'}`}
                    />
                  </button>
                  {openFaq === index && (
                    <div className="px-5 py-4 bg-blue-50/40 border-t border-blue-100 text-sm text-slate-600 font-medium leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Contact Support Card (Light) ── */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                  <MessageCircle size={18} className="text-white" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 m-0">Still need assistance?</h3>
              </div>
              <p className="text-sm text-slate-500 m-0">
                Our team at <span className="font-semibold text-slate-700">{RAXWO_COMPANY}</span> is here to help — 9:00 AM to 8:00 PM, every day.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 w-full md:w-auto justify-center shrink-0">
              <a
                href={`tel:${RAXWO_PHONE}`}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 no-underline transition-colors shadow-xs"
              >
                <Phone size={15} /> {RAXWO_PHONE}
              </a>
              <a
                href={`mailto:${RAXWO_EMAIL}`}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 no-underline transition-colors"
              >
                <Mail size={15} /> {RAXWO_EMAIL}
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HelpCenter;
