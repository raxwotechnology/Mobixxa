"use client";

import React, { useState, useMemo } from "react";
import { SlidersHorizontal, Search, ChevronDown } from "lucide-react";
import { categories, products } from "@/data/mockProducts";
import ProductCard from "@/components/shop/ProductCard";

export default function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState("ALL PRODUCT");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("NEWEST");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Category filter
    if (selectedCategory !== "ALL PRODUCT") {
      list = list.filter((p) => p.category === selectedCategory);
    }

    // Search query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortOption === "PRICE_LOW") {
      list.sort(
        (a, b) =>
          parseFloat(a.price.replace(/,/g, "")) -
          parseFloat(b.price.replace(/,/g, ""))
      );
    } else if (sortOption === "PRICE_HIGH") {
      list.sort(
        (a, b) =>
          parseFloat(b.price.replace(/,/g, "")) -
          parseFloat(a.price.replace(/,/g, ""))
      );
    }

    return list;
  }, [selectedCategory, searchQuery, sortOption]);

  return (
    <div className="space-y-6 pb-12">
      {/* ========================================================================= */}
      {/* 1. Header Banner (Blue Hero Pill Card) */}
      {/* ========================================================================= */}
      <section className="mx-4 md:mx-8 mt-4">
        <div className="bg-[#1967d2] bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 text-white rounded-[36px] p-10 md:p-14 text-center relative overflow-hidden shadow-lg shadow-blue-500/15">
          {/* Subtle decorative glow circles */}
          <div className="absolute -top-16 -right-16 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-3">
            {/* Pill badge at top center */}
            <div>
              <span className="bg-white/15 border border-white/20 text-white/90 text-xs px-4 py-1.5 rounded-full inline-block font-medium shadow-xs">
                Official Hardware Catalog
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
              Explore All Products
            </h1>

            {/* Description */}
            <p className="max-w-2xl mx-auto text-blue-100 text-xs sm:text-sm mt-3 leading-relaxed">
              Find genuine smartphones, laptops, audio gear, and authentic mobile
              accessories with official islandwide warranty.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. Category Filter Strip */}
      {/* ========================================================================= */}
      <section className="mx-4 md:mx-8 my-6">
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`transition-all duration-200 cursor-pointer flex-shrink-0 ${
                  isActive
                    ? "bg-blue-600 text-white font-semibold shadow-sm px-5 py-2.5 rounded-full text-xs uppercase tracking-wider"
                    : "border border-blue-200/80 text-blue-900 bg-white hover:bg-blue-50 font-medium px-4 py-2 rounded-full text-xs uppercase whitespace-nowrap"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. Sub-Control Toolbar (Filters & Search) */}
      {/* ========================================================================= */}
      <section className="mx-4 md:mx-8 mb-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left: SHOW FILTERS Button */}
          <div className="relative w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowFiltersModal(!showFiltersModal)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 border border-blue-200 text-blue-700 bg-white hover:bg-blue-50 font-semibold px-5 py-2.5 rounded-full text-xs shadow-sm uppercase tracking-wide transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>SHOW FILTERS</span>
            </button>

            {/* Optional Filter Quick Toggles Popover */}
            {showFiltersModal && (
              <div className="absolute top-12 left-0 z-30 bg-white rounded-2xl p-4 shadow-xl border border-slate-200 w-64 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-800">Quick Filters</span>
                  <button
                    type="button"
                    onClick={() => setShowFiltersModal(false)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Close
                  </button>
                </div>
                <div className="space-y-2 text-xs text-slate-600">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                    <span>In Stock Only</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                    <span>Official Warranty</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded text-blue-600" />
                    <span>Islandwide Free Delivery</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Right Controls: Search Bar & Sort Dropdown */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {/* Search Bar */}
            <div className="relative flex-1 sm:flex-initial">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="border border-slate-200 bg-white pl-9 pr-4 py-2 rounded-full text-xs w-full sm:w-64 md:w-80 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors shadow-2xs"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="border border-slate-200 bg-white px-4 py-2.5 rounded-full text-xs font-semibold text-slate-700 flex items-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <span>{sortOption === "NEWEST" ? "NEWEST" : sortOption === "PRICE_LOW" ? "PRICE: LOW TO HIGH" : "PRICE: HIGH TO LOW"}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {showFilterDropdown && (
                <div className="absolute right-0 top-11 z-30 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 w-44">
                  <button
                    type="button"
                    onClick={() => {
                      setSortOption("NEWEST");
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors ${
                      sortOption === "NEWEST"
                        ? "text-blue-600 bg-blue-50"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    NEWEST
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSortOption("PRICE_LOW");
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors ${
                      sortOption === "PRICE_LOW"
                        ? "text-blue-600 bg-blue-50"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    PRICE: LOW TO HIGH
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSortOption("PRICE_HIGH");
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors ${
                      sortOption === "PRICE_HIGH"
                        ? "text-blue-600 bg-blue-50"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    PRICE: HIGH TO LOW
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. Product Cards Grid */}
      {/* ========================================================================= */}
      <section className="mx-4 md:mx-8 mb-16">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              No products found
            </h3>
            <p className="text-xs text-slate-500">
              We couldn&apos;t find any products matching your current filters or
              search keywords.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("ALL PRODUCT");
                setSearchQuery("");
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-5 py-2.5 rounded-full transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
