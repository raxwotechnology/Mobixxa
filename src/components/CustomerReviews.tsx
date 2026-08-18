'use client';

import { Star, Quote } from 'lucide-react';

const reviews = [
  {
    id: 'rev-1',
    name: 'Dilanka Perera',
    location: 'Colombo',
    avatar: '👨🏽',
    rating: 5,
    product: 'Google Pixel 10 Pro',
    text: 'Absolutely love my Pixel 10 Pro! The camera is insane and delivery was super fast. Mobixa is my go-to store for premium tech.',
  },
  {
    id: 'rev-2',
    name: 'Shalini Fernando',
    location: 'Kandy',
    avatar: '👩🏽',
    rating: 5,
    product: 'AirPods Pro 4',
    text: 'The AirPods are genuinely incredible. Noise cancellation is top notch. Mobixa had the best price and shipped in 24 hours!',
  },
  {
    id: 'rev-3',
    name: 'Ruwan Jayawardena',
    location: 'Galle',
    avatar: '👨🏽‍💼',
    rating: 5,
    product: 'MacBook Air M4',
    text: 'Ordered the MacBook Air M4 online. It arrived perfectly packaged with full warranty. 100% genuine product — highly recommend.',
  },
];

export default function CustomerReviews() {
  return (
    <section className="w-full bg-slate-50 py-12 lg:py-16">
      <div className="w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32">

        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-xs font-bold tracking-widest text-blue-600 uppercase mb-2">Happy Customers</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">What Our Customers Say</h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Trusted by 50,000+ customers across Sri Lanka. Real reviews from real buyers.
          </p>

          {/* Overall rating row */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={18} fill="#F59E0B" className="text-amber-400" />
              ))}
            </div>
            <span className="font-extrabold text-slate-900 text-lg">4.9</span>
            <span className="text-slate-400 text-sm">/ 5 · 12,400+ reviews</span>
          </div>
        </div>

        {/* Review cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {reviews.map(({ id, name, location, avatar, rating, product, text }) => (
            <div
              key={id}
              id={id}
              className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md hover:border-blue-100 transition-all duration-200 flex flex-col gap-4"
            >
              {/* Quote icon */}
              <Quote size={20} className="text-blue-200 shrink-0" />

              {/* Review text */}
              <p className="text-slate-600 text-sm leading-relaxed flex-1">"{text}"</p>

              {/* Stars */}
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i} size={13}
                    fill={i < rating ? '#F59E0B' : 'none'}
                    className={i < rating ? 'text-amber-400' : 'text-slate-200'}
                  />
                ))}
              </div>

              {/* Divider */}
              <div className="h-px bg-slate-100" />

              {/* Reviewer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{avatar}</span>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{name}</p>
                    <p className="text-slate-400 text-xs">{location}</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                  {product}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
