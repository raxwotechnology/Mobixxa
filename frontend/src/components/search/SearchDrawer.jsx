"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X, ArrowRight, Smartphone, Laptop, Watch, Headphones, Zap } from "lucide-react";
import { useSearch } from "@/context/SearchContext";
import { products } from "@/data/mockProducts";
import { deals } from "@/data/mockDeals";

export default function SearchDrawer() {
  const { isSearchOpen, closeSearch, searchQuery, setSearchQuery } = useSearch();
  const inputRef = useRef(null);
  const router = useRouter();

  // Auto-focus input when search drawer opens
  useEffect(() => {
    if (isSearchOpen) {
      document.body.style.overflow = "hidden";
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 150);
      return () => clearTimeout(timer);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isSearchOpen]);

  // Handle ESC key press to close drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isSearchOpen) {
        closeSearch();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen, closeSearch]);

  const collections = [
    { label: "Android", href: "/shop?category=SMART+PHONE" },
    { label: "Apple", href: "/shop?brand=apple" },
    { label: "Audio", href: "/shop?category=EARBUDS" },
    { label: "Gaming", href: "/deals" },
    { label: "Gadgets", href: "/shop?category=ACCESSORIES" },
    { label: "Accessories", href: "/shop?category=ACCESSORIES" },
  ];

  const handleCollectionClick = (href) => {
    closeSearch();
    router.push(href);
  };

  const handleProductClick = (item) => {
    closeSearch();
    if (item.isDeal) {
      router.push("/deals");
    } else {
      router.push(`/product/${item.id}`);
    }
  };

  // Filtered search results
  const trimmedQuery = searchQuery.trim().toLowerCase();
  const allSearchable = [
    ...products.map((p) => ({ ...p, isDeal: false })),
    ...deals.map((d) => ({
      ...d,
      title: d.name,
      brand: d.name.includes("Marshall") ? "Marshall" : d.name.includes("PlayStation") ? "Sony" : "Brand",
      isDeal: true,
    })),
  ];

  const filteredProducts = trimmedQuery
    ? allSearchable.filter((p) => {
        const titleMatch = (p.title || p.name || "").toLowerCase().includes(trimmedQuery);
        const categoryMatch = (p.category || "").toLowerCase().includes(trimmedQuery);
        const brandMatch = (p.brand || "").toLowerCase().includes(trimmedQuery);
        return titleMatch || categoryMatch || brandMatch;
      })
    : [];

  return (
    <>
      {/* 1. Backdrop Overlay */}
      <div
        onClick={closeSearch}
        aria-hidden="true"
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isSearchOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />

      {/* 2. Floating Drawer Sheet Card */}
      <div
        className={`fixed inset-y-0 right-0 sm:top-3 sm:bottom-3 sm:right-3 w-full sm:max-w-[440px] bg-white/95 backdrop-blur-xl sm:rounded-[36px] shadow-2xl border border-blue-100/80 z-50 flex flex-col p-4 sm:p-8 overflow-hidden transition-all duration-300 ease-out ${
          isSearchOpen
            ? "translate-x-0 pointer-events-auto"
            : "translate-x-[110%] pointer-events-none"
        }`}
      >
        {/* ================================================================= */}
        {/* 3. Drawer Header: Search Pill Badge & Circular Close Button       */}
        {/* ================================================================= */}
        <div className="flex items-center justify-between flex-shrink-0">
          {/* Search Pill Badge (Left) */}
          <div className="bg-[#e0edff] text-[#1967d2] font-bold px-7 py-2 rounded-full text-xs tracking-wide shadow-sm select-none">
            Search
          </div>

          {/* Close Button (Right) */}
          <button
            type="button"
            onClick={closeSearch}
            aria-label="Close search drawer"
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors ml-auto cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ================================================================= */}
        {/* 4. Search Input Bar                                               */}
        {/* ================================================================= */}
        <div className="w-full border border-blue-200/90 rounded-full px-4 py-3 flex items-center gap-3 bg-white/80 shadow-inner mt-6 transition-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search For..."
            className="w-full bg-transparent text-slate-800 placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search query"
              className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* ================================================================= */}
        {/* 5. Drawer Body: Quick Collections OR Live Filter Results          */}
        {/* ================================================================= */}
        {!trimmedQuery ? (
          /* Empty Input: Quick Category Navigation */
          <div className="flex-1 overflow-y-auto pt-2">
            <div className="space-y-3.5 mt-8 w-full max-w-sm mx-auto">
              {collections.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleCollectionClick(item.href)}
                  className="w-full border border-blue-200/90 hover:border-blue-500 bg-white hover:bg-blue-50/50 text-[#1e3a8a] font-semibold text-xs sm:text-sm py-3.5 px-6 rounded-full flex items-center justify-between transition-all duration-200 shadow-sm group cursor-pointer"
                >
                  <span className="tracking-tight">{item.label}</span>
                  <span className="text-blue-600 font-bold group-hover:translate-x-1.5 transition-transform duration-200">
                    →
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Live Filter Results */
          <div className="flex-1 overflow-y-auto mt-6 pr-1 space-y-3">
            <div className="text-xs font-semibold text-slate-500 px-1">
              Found {filteredProducts.length}{" "}
              {filteredProducts.length === 1 ? "result" : "results"} for &quot;
              {searchQuery}&quot;
            </div>

            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className="p-3 bg-slate-50/80 hover:bg-blue-50/50 border border-slate-200/80 hover:border-blue-300 rounded-2xl flex items-center gap-3.5 transition-all cursor-pointer group shadow-2xs"
                >
                  {/* Thumbnail / Swatch Chip */}
                  <div className="w-12 h-12 rounded-xl border border-slate-200 bg-white flex items-center justify-center p-1 flex-shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-inner"
                      style={{
                        backgroundColor: product.swatches?.[0]?.color || "#0f172a",
                      }}
                    >
                      {product.brand?.[0] || "M"}
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                      {product.title || product.name}
                    </h4>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                      {product.category}
                    </span>
                    <span className="text-xs font-bold text-slate-900 mt-0.5 block">
                      From Rs {product.price}
                    </span>
                  </div>

                  {/* Arrow Indicator */}
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all flex-shrink-0 mr-1" />
                </div>
              ))
            ) : (
              <div className="text-center py-12 px-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
                  <Search className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  No devices found
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  No devices found matching &quot;{searchQuery}&quot;. Try
                  searching for &quot;Pixel&quot;, &quot;MacBook&quot;, or &quot;Fitbit&quot;.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
