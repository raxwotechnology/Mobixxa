'use client';

import { ShieldCheck, Lock, Eye, Server, UserCheck } from 'lucide-react';
import useSettingsStore from '../store/settingsStore';

const LegalPrivacy = () => {
  const settings = useSettingsStore((s) => s.settings);
  const brandName = settings?.shopName || 'Mobixa';
  const brandEmail = settings?.email || 'privacy@mobixa.com';

  const sections = [
    {
      icon: Eye,
      title: '1. Information We Collect',
      content: `We collect information you provide directly to us when using ${brandName}, including:
      - Personal Contact Details: Name, email address, phone number, and delivery address when registering an account or placing orders.
      - Payment & Billing Data: Payment method preferences, invoice records, and transaction history (Note: Credit card details are processed through encrypted payment gateways).
      - Account Credentials: Encrypted login passwords, profile avatar images, and loyalty points balances.`
    },
    {
      icon: Server,
      title: '2. How We Use Your Data',
      content: `Your information is utilized solely to deliver a seamless shopping and store service experience:
      - Fulfilling smartphone, laptop, and accessory orders, doorstep deliveries, and warranty services.
      - Sending order confirmation updates, invoice receipts, and delivery SMS notifications.
      - Verifying identity for Hire Purchase (HP) installment agreements and warranty claims.
      - Improving site security, preventing fraudulent transactions, and tailoring personalized deals.`
    },
    {
      icon: Lock,
      title: '3. Data Security & Storage',
      content: `We enforce industry-standard security protocols to protect your personal information from unauthorized access:
      - All communication between your browser and our servers is secured via 256-bit SSL encryption.
      - Passwords and sensitive session tokens are salted and hashed using modern security algorithms.
      - Store transaction databases are monitored around the clock with strict role-based authorization.`
    },
    {
      icon: UserCheck,
      title: '4. Information Sharing & Third Parties',
      content: `We respect your privacy and will never sell or rent your personal data to third-party marketers. Data is only shared with:
      - Official Delivery Partners: Registered courier agents strictly for doorstep product delivery.
      - Licensed Payment Gateways: Authorized banking and payment solution providers (e.g. PayHere, Koko Installments).
      - Regulatory Authorities: When required by law or to protect legal rights against fraudulent activities.`
    },
    {
      icon: ShieldCheck,
      title: '5. Your Privacy Rights',
      content: `As a customer, you retain full ownership of your data:
      - Access & Update: You can review and edit your profile details at any time from your account profile settings.
      - Account Erasure: You may request the deletion of your account and personal history by contacting our privacy compliance team.`
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 relative overflow-hidden shadow-lg">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_60%)] pointer-events-none" />
          <div className="relative z-10 space-y-3">
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
              <ShieldCheck size={12} /> Privacy & Data Protection Policy
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight m-0">Privacy Policy</h1>
            <p className="text-slate-300 text-xs sm:text-sm font-semibold max-w-2xl m-0">
              At {brandName}, we prioritize your trust and are committed to safeguarding your personal data and privacy.
            </p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider m-0 pt-2">
              Last Updated: July 2026
            </p>
          </div>
        </div>

        {/* Policy Sections */}
        <div className="space-y-6">
          {sections.map((sec, index) => {
            const Icon = sec.icon;
            return (
              <div key={index} className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs hover:border-slate-300 transition-all">
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-emerald-400 shrink-0 shadow-xs">
                    <Icon size={20} />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 m-0">{sec.title}</h2>
                </div>
                <div className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-line pl-1 sm:pl-13">
                  {sec.content}
                </div>
              </div>
            );
          })}
        </div>

        {/* Contact DPO Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
          <div>
            <h3 className="text-base font-bold text-slate-900 m-0">Have questions about your data privacy?</h3>
            <p className="text-xs text-slate-500 font-semibold m-0 mt-1">Our Privacy & Data Protection team is ready to assist you.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto shrink-0">
            <a
              href={`mailto:${brandEmail}`}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all text-center no-underline"
            >
              Email Privacy Team
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LegalPrivacy;
