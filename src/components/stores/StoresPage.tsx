'use client';

import { useState } from 'react';
import {
  Search,
  MapPin,
  Phone,
  Clock,
  Navigation,
  ExternalLink,
  ChevronRight,
  Store,
} from 'lucide-react';

// ── Data ──────────────────────────────────────────────────────────────────────

interface Showroom {
  id: string;
  name: string;
  emoji: string;
  bgFrom: string;
  bgTo: string;
  status: 'OPEN' | 'CLOSED';
  address: string;
  city: string;
  hours: string;
  phone: string;
  mapUrl: string;
  features: string[];
}

const showrooms: Showroom[] = [
  {
    id: 'store-mobile-hub',
    name: 'Mobile Hub',
    emoji: '🏬',
    bgFrom: 'from-blue-600',
    bgTo: 'to-indigo-700',
    status: 'OPEN',
    address: '123 Tech Avenue',
    city: 'Colombo 03',
    hours: '09:00 – 20:00',
    phone: '+94 11 255 5001',
    mapUrl: '#',
    features: ['Flagship Devices', 'Trade-In Centre', 'Repair Workshop', 'Free Parking'],
  },
  {
    id: 'store-tech-gadgets',
    name: 'Tech Gadgets',
    emoji: '🔧',
    bgFrom: 'from-violet-600',
    bgTo: 'to-purple-800',
    status: 'OPEN',
    address: '456 Gadget Street',
    city: 'Colombo 04',
    hours: '09:30 – 21:00',
    phone: '+94 11 255 5002',
    mapUrl: '#',
    features: ['Accessories Hub', 'Demo Stations', 'Expert Consultations', 'Gift Wrapping'],
  },
];

// ── Store Card ─────────────────────────────────────────────────────────────────

function ShowroomCard({ store }: { store: Showroom }) {
  const isOpen = store.status === 'OPEN';

  return (
    <div
      id={store.id}
      className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden"
    >
      {/* Visual header */}
      <div className={`relative h-48 bg-gradient-to-br ${store.bgFrom} ${store.bgTo} flex items-center justify-center overflow-hidden`}>
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)`,
            backgroundSize: '30px 30px',
          }}
        />

        {/* Corner circles */}
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
        <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/10 rounded-full" />

        {/* Store emoji */}
        <span className="relative z-10 text-7xl select-none drop-shadow-2xl transition-transform duration-300 group-hover:scale-110">
          {store.emoji}
        </span>

        {/* Status badge */}
        <div className={`absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black tracking-widest
          ${isOpen ? 'bg-emerald-500 text-white' : 'bg-slate-600 text-white'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-white animate-pulse' : 'bg-slate-300'}`} />
          {store.status} SHOWROOM
        </div>

        {/* Store name overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent p-4">
          <h2 className="text-white font-extrabold text-xl">{store.name}</h2>
          <p className="text-white/70 text-xs">{store.address}, {store.city}</p>
        </div>
      </div>

      {/* Info body */}
      <div className="p-6">
        {/* Contact details */}
        <div className="flex flex-col gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-blue-50 shrink-0">
              <MapPin size={15} className="text-blue-600" />
            </div>
            <p className="text-slate-700 text-sm font-medium">
              {store.address}, {store.city}, Sri Lanka
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-emerald-50 shrink-0">
              <Clock size={15} className="text-emerald-600" />
            </div>
            <p className="text-slate-700 text-sm font-medium">
              Open daily: <span className="font-bold text-slate-900">{store.hours}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-violet-50 shrink-0">
              <Phone size={15} className="text-violet-600" />
            </div>
            <a
              href={`tel:${store.phone.replace(/\s/g, '')}`}
              className="text-slate-700 text-sm font-medium hover:text-blue-600 transition-colors duration-200"
            >
              {store.phone}
            </a>
          </div>
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-2 mb-6">
          {store.features.map((f) => (
            <span
              key={f}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold"
            >
              <ChevronRight size={10} className="text-blue-500" />
              {f}
            </span>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-3">
          <a
            href={store.mapUrl}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-2xl transition-all duration-200 hover:shadow-md hover:shadow-blue-200 active:scale-[0.98]"
          >
            <Navigation size={15} />
            Get Directions
          </a>
          <a
            href={`tel:${store.phone.replace(/\s/g, '')}`}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-bold rounded-2xl transition-all duration-200 active:scale-[0.98]"
          >
            <Phone size={15} />
            Call Now
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function StoresPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('ALL');

  const cities = ['ALL', 'Colombo 03', 'Colombo 04'];

  const filtered = showrooms.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCity = cityFilter === 'ALL' || s.city === cityFilter;
    return matchSearch && matchCity;
  });

  return (
    <div className="w-full min-h-screen bg-white">
      {/* ── Page Hero Header ── */}
      <div className="relative w-full bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 pt-14 pb-14 overflow-hidden">
        {/* Shine circles */}
        <div className="absolute top-[-60px] left-[-60px] w-80 h-80 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute bottom-[-40px] right-[5%] w-64 h-64 bg-white/5 rounded-full pointer-events-none" />

        <div className="relative w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full bg-white/15 border border-white/25 text-white text-xs font-bold tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Official Flagship Boutiques
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-3">
            Our Stores &amp; Showrooms
          </h1>
          <p className="text-blue-100 text-base max-w-lg mb-8">
            Visit any of our premium Mobixa showrooms to experience the latest tech in person — with expert guidance on hand.
          </p>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="flex-1 min-w-64 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-white/15 border border-white/20 focus-within:bg-white/25 transition-colors duration-200">
              <Search size={16} className="text-white/70 shrink-0" />
              <input
                id="stores-search"
                type="text"
                placeholder="Search by store name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-white placeholder-white/50 text-sm outline-none"
              />
            </div>

            {/* City filters */}
            <div className="flex items-center gap-2">
              {cities.map((city) => (
                <button
                  key={city}
                  onClick={() => setCityFilter(city)}
                  className={`px-4 py-3 rounded-2xl text-xs font-bold tracking-widest transition-all duration-200
                    ${cityFilter === city
                      ? 'bg-white text-blue-700 shadow-md'
                      : 'bg-white/15 text-white/70 border border-white/20 hover:bg-white/25 hover:text-white'
                    }`}
                >
                  {city === 'ALL' ? `ALL CITIES (${showrooms.length})` : city.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Store Grid ── */}
      <div className="w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32 py-10">
        {/* Result count */}
        <div className="flex items-center gap-2 mb-6">
          <Store size={16} className="text-blue-600" />
          <p className="text-slate-600 text-sm font-semibold">
            {filtered.length} showroom{filtered.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
            {filtered.map((store) => (
              <ShowroomCard key={store.id} store={store} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <span className="text-6xl mb-4">🗺️</span>
            <p className="text-lg font-bold text-slate-600 mb-1">No showrooms found</p>
            <p className="text-sm">Try a different search or city filter.</p>
          </div>
        )}

        {/* CTA Banner */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-6 p-8 bg-gradient-to-r from-blue-700 to-blue-600 rounded-3xl relative overflow-hidden">
          <div className="absolute top-[-60px] left-[-60px] w-80 h-80 bg-white/5 rounded-full pointer-events-none" />
          <div className="relative flex-1">
            <p className="text-blue-200 text-xs font-bold tracking-widest uppercase mb-1">Can't Visit Us?</p>
            <h3 className="text-white text-2xl font-extrabold mb-1">Shop Online, Delivered to You</h3>
            <p className="text-blue-100 text-sm">Enjoy the same premium experience from the comfort of your home.</p>
          </div>
          <a
            href="/shop"
            className="relative shrink-0 flex items-center gap-2 px-6 py-3.5 bg-white text-blue-700 font-bold rounded-2xl transition-all duration-200 hover:shadow-lg hover:bg-blue-50 active:scale-[0.98]"
          >
            Shop Online
            <ExternalLink size={15} />
          </a>
        </div>
      </div>
    </div>
  );
}
