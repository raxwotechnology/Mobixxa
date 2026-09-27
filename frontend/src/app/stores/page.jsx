"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, MapPin, Tag, Sparkles, Building2 } from "lucide-react";
import { stores } from "@/data/mockStores";
import StoreCard from "@/components/stores/StoreCard";

export default function StoresPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCityFilter, setSelectedCityFilter] = useState("ALL");

  const filteredStores = useMemo(() => {
    return stores.filter((store) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        store.name.toLowerCase().includes(q) ||
        store.city.toLowerCase().includes(q) ||
        store.address.toLowerCase().includes(q) ||
        store.tagline.toLowerCase().includes(q);

      const matchesCity =
        selectedCityFilter === "ALL" ||
        store.city.toLowerCase().includes(selectedCityFilter.toLowerCase());

      return matchesSearch && matchesCity;
    });
  }, [searchQuery, selectedCityFilter]);

  return (
    <div className="space-y-6 pb-16">
      {/* ========================================================================= */}
      {/* 1. Hero Banner: Our Stores & Showrooms */}
      {/* ========================================================================= */}
      <section className="mx-4 md:mx-8 mt-4">
        <div className="bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 text-white rounded-[36px] p-10 md:p-14 text-center relative overflow-hidden shadow-lg shadow-blue-500/15">
          {/* Decorative ambient elements */}
          <div className="absolute -top-16 -right-16 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-3">
            {/* Top Center Pill Badge */}
            <div>
              <span className="bg-white/15 border border-white/20 text-white/90 text-xs px-4 py-1.5 rounded-full inline-block font-medium shadow-xs">
                Official Flagship Boutiques
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
              Our Stores &amp; Showrooms
            </h1>

            {/* Description */}
            <p className="max-w-2xl mx-auto text-blue-100 text-xs sm:text-sm mt-3 leading-relaxed">
              Visit our tech showrooms across Sri Lanka to experience hands-on
              product demos and expert technical service.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. Search & Filter Toolbar */}
      {/* ========================================================================= */}
      <section className="mx-4 md:mx-8 my-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left Search Input Pill */}
          <div className="relative w-full md:max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Stores By City Or Branch Name..."
              className="w-full border border-blue-200 bg-white pl-11 pr-5 py-3 rounded-full text-xs placeholder:text-slate-400 focus:outline-none focus:border-blue-500 shadow-sm transition-colors"
            />
          </div>

          {/* Right Control Buttons */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            {/* ALL CITIES Pill Button */}
            <button
              type="button"
              onClick={() => setSelectedCityFilter("ALL")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-full shadow-md shadow-blue-500/20 uppercase tracking-wide transition-colors"
            >
              ALL CITIES ({stores.length})
            </button>

            {/* Tech Deals Link Button */}
            <Link
              href="/deals"
              className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs px-5 py-3 rounded-full shadow-sm flex items-center gap-2 transition-colors flex-shrink-0"
            >
              <Tag className="w-3.5 h-3.5 text-rose-500" />
              <span>Tech Deals</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. Showroom Cards Grid */}
      {/* ========================================================================= */}
      <section className="mx-4 md:mx-8 mb-16">
        {filteredStores.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredStores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              No Showrooms Found
            </h3>
            <p className="text-xs text-slate-500">
              We couldn&apos;t find any boutiques matching &ldquo;{searchQuery}&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCityFilter("ALL");
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-5 py-2.5 rounded-full transition-colors"
            >
              View All Showrooms
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
