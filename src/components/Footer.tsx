'use client';

import {
  Zap,
  Globe,
  Share2,
  Camera,
  Play,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
} from 'lucide-react';

const quickLinks = [
  { label: 'New Arrivals', href: '#' },
  { label: 'Tech Deals', href: '#' },
  { label: 'Our Boutiques', href: '#' },
  { label: 'Categories', href: '#' },
];

const customerService = [
  { label: 'Help Center', href: '#' },
  { label: 'Warranty Check', href: '#' },
  { label: 'Track Order', href: '#' },
  { label: 'Shipping Info', href: '#' },
  { label: 'Returns & Exchange', href: '#' },
  { label: 'Privacy Policy', href: '#' },
];

const socialLinks = [
  { Icon: Globe, href: '#', label: 'Website' },
  { Icon: Share2, href: '#', label: 'Share' },
  { Icon: Camera, href: '#', label: 'Instagram' },
  { Icon: Play, href: '#', label: 'YouTube' },
];

export default function Footer() {
  return (
    <footer className="w-full bg-[#0F172A] text-white">
      {/* ── Main Footer Grid ── */}
      <div className="w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32 py-14 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">

          {/* ── Column 1: Brand ── */}
          <div className="sm:col-span-2 lg:col-span-1">
            {/* Logo */}
            <a href="#" className="flex items-center gap-2 mb-5 group w-fit">
              <div className="w-9 h-9 flex items-center justify-center bg-blue-600 rounded-xl shadow-md group-hover:shadow-blue-500 transition-shadow duration-300">
                <Zap size={20} className="text-white" fill="white" />
              </div>
              <span className="text-xl font-extrabold tracking-tight group-hover:text-blue-400 transition-colors duration-200">
                Mobixa
              </span>
            </a>

            {/* Mission statement */}
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Redefining your digital lifestyle — curated premium tech, accessories,
              and next-gen gadgets delivered straight to your door with unmatched service.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-3">
              {socialLinks.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white transition-all duration-200 hover:scale-110"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* ── Column 2: Quick Links ── */}
          <div>
            <h3 className="text-xs font-bold tracking-widest text-blue-400 uppercase mb-5">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {quickLinks.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-white hover:gap-3 transition-all duration-200 group"
                  >
                    <ChevronRight
                      size={13}
                      className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -ml-1 shrink-0"
                    />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Column 3: Customer Service ── */}
          <div>
            <h3 className="text-xs font-bold tracking-widest text-blue-400 uppercase mb-5">
              Customer Service
            </h3>
            <ul className="space-y-3">
              {customerService.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-white hover:gap-3 transition-all duration-200 group"
                  >
                    <ChevronRight
                      size={13}
                      className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -ml-1 shrink-0"
                    />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Column 4: Contact Us ── */}
          <div>
            <h3 className="text-xs font-bold tracking-widest text-blue-400 uppercase mb-5">
              Contact Us
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 shrink-0 mt-0.5">
                  <MapPin size={15} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5 font-medium uppercase tracking-wide">Address</p>
                  <p className="text-sm text-slate-300 leading-snug">88 Tech Avenue,<br />Colombo 03, Sri Lanka</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 shrink-0 mt-0.5">
                  <Phone size={15} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5 font-medium uppercase tracking-wide">Phone</p>
                  <a href="tel:+94112555000" className="text-sm text-slate-300 hover:text-white transition-colors duration-200">
                    +94 11 255 5000
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 shrink-0 mt-0.5">
                  <Mail size={15} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5 font-medium uppercase tracking-wide">Support</p>
                  <a href="mailto:support@mobixa.com" className="text-sm text-slate-300 hover:text-white transition-colors duration-200">
                    support@mobixa.com
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <div className="border-t border-slate-800">
        <div className="w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            &copy; {new Date().getFullYear()}{' '}
            <span className="text-slate-400 font-semibold">Mobixa</span>. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-slate-300 transition-colors duration-200">Terms of Use</a>
            <span>·</span>
            <a href="#" className="hover:text-slate-300 transition-colors duration-200">Privacy Policy</a>
            <span>·</span>
            <a href="#" className="hover:text-slate-300 transition-colors duration-200">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
