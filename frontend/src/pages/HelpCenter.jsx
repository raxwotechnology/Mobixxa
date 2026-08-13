import { useState } from 'react';
import { HelpCircle, Search, ShoppingBag, Truck, RotateCcw, Wrench, ChevronDown, Phone, Mail, MessageSquare } from 'lucide-react';
import useSettingsStore from '../store/settingsStore';

const HelpCenter = () => {
  const settings = useSettingsStore((s) => s.settings);
  const brandName = settings?.shopName || 'Mobixa';
  const brandEmail = settings?.email || 'support@mobixa.com';
  const brandPhone = settings?.phone || '+94 11 255 5000';

  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const categories = [
    { title: 'Orders & Payment', icon: ShoppingBag, desc: 'Payment methods, Koko installments & order status' },
    { title: 'Shipping & Delivery', icon: Truck, desc: 'Island-wide delivery timelines & courier tracking' },
    { title: 'Returns & Exchange', icon: RotateCcw, desc: '7-day replacement guarantee & refund policy' },
    { title: 'Mobile Repair & Support', icon: Wrench, desc: 'Device diagnostic & warranty claims' },
  ];

  const faqs = [
    {
      q: `How do I track my ${brandName} order?`,
      a: 'You can track your order by clicking "Track Order" in the top menu or visiting My Orders in your profile. You will also receive SMS updates with your courier tracking number.'
    },
    {
      q: 'What payment methods do you accept?',
      a: 'We accept Cash on Delivery (COD), Card Payments (Visa/MasterCard), Koko 3-month Installments, Bank Transfers, and Hire Purchase (HP) agreements for eligible devices.'
    },
    {
      q: 'What is your warranty policy for mobile phones and laptops?',
      a: 'All new mobile devices come with a 1-Year Company / Agent Warranty. Pre-owned and refurbished devices include a 6-Month Store Warranty with a 7-day checking guarantee.'
    },
    {
      q: 'How long does island-wide shipping take?',
      a: 'Orders within Colombo & Gampaha are delivered within 24 hours. Island-wide courier deliveries to outer districts take 2 to 3 working days.'
    },
    {
      q: 'Can I exchange or return a product?',
      a: 'Yes! We offer a 7-Day Replacement Guarantee for manufacturing defects. Products must be returned in original packaging with all accessories and box IMEI matching.'
    }
  ];

  const filteredFaqs = faqs.filter(
    (f) => f.q.toLowerCase().includes(searchQuery.toLowerCase()) || f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-slate-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Banner */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-lg text-center space-y-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(2,132,199,0.2),transparent_70%)] pointer-events-none" />
          <div className="relative z-10 max-w-xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-1.5 bg-sky-500/20 text-sky-400 border border-sky-500/30 px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest">
              <HelpCircle size={12} /> Customer Service & Support
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight m-0">How can we help you today?</h1>
            <p className="text-slate-300 text-xs sm:text-sm font-semibold m-0">
              Search our knowledge base or browse help topics for instant answers to your questions.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative z-10 max-w-md mx-auto">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search questions, shipping, warranty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl py-3.5 pl-11 pr-4 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-5 text-left enterprise-card shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center mb-3">
                  <Icon size={20} />
                </div>
                <h3 className="text-sm font-black text-slate-900 m-0">{cat.title}</h3>
                <p className="text-slate-500 text-[11px] font-semibold m-0 mt-1">{cat.desc}</p>
              </div>
            );
          })}
        </div>

        {/* FAQs */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-900 m-0">Frequently Asked Questions</h2>
            <p className="text-xs text-slate-500 font-semibold m-0 mt-1">Quick solutions to common customer queries</p>
          </div>

          <div className="space-y-3">
            {filteredFaqs.map((faq, index) => (
              <div key={index} className="border border-slate-200/80 rounded-2xl overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 bg-slate-50/50 hover:bg-slate-50 cursor-pointer border-0"
                >
                  <span className="font-extrabold text-xs sm:text-sm text-slate-900">{faq.q}</span>
                  <ChevronDown size={16} className={`text-slate-400 transition-transform ${openFaq === index ? 'rotate-180 text-sky-600' : ''}`} />
                </button>
                {openFaq === index && (
                  <div className="px-5 py-4 bg-white border-t border-slate-100 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Support Callout */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-lg font-black text-white m-0">Still need assistance?</h3>
            <p className="text-xs text-slate-300 font-semibold m-0">Our customer care representatives are available 9:00 AM – 8:00 PM daily.</p>
          </div>
          <div className="flex flex-wrap gap-3 w-full md:w-auto justify-center">
            <a href={`tel:${brandPhone}`} className="bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs px-5 py-3 rounded-xl flex items-center gap-2 no-underline shadow-xs">
              <Phone size={14} /> {brandPhone}
            </a>
            <a href={`mailto:${brandEmail}`} className="bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs px-5 py-3 rounded-xl flex items-center gap-2 no-underline border border-white/20">
              <Mail size={14} /> Email Support
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HelpCenter;
