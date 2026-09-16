"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Check, ShoppingBag, ArrowRight, ShieldCheck, Truck, RefreshCw } from "lucide-react";
import { products, relatedProducts, getProductById } from "@/data/mockProducts";
import ProductCard from "@/components/shop/ProductCard";
import PixelGalleryView from "@/components/product/PixelGalleryView";
import { useCart } from "@/context/CartContext";

export default function ProductDetailPage({ params }) {
  // In Next.js 15, params may be a Promise or plain object in client components
  const resolvedParams = params ? (params instanceof Promise || typeof params.then === "function" ? use(params) : params) : useParams();
  const productId = resolvedParams?.id || "pixel-10-pro-xl";
  const router = useRouter();
  const { addToCart, openCart } = useCart();

  const product = getProductById(productId);

  // Gallery view state (default to first view: 'front')
  const galleryViews = product.galleryViews || [
    { id: "front", label: "Front screen display view" },
    { id: "rear", label: "Rear camera visor view" },
    { id: "side", label: "Ultra-slim side profile view" },
    { id: "angled", label: "Angled perspective back view" },
  ];
  const [activeView, setActiveView] = useState(galleryViews[0].id);

  // Swatch / Color state (default to active Obsidian #1e1e20 or first swatch)
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const activeColorObj = product.swatches?.[selectedColorIndex] || {
    name: "Obsidian",
    color: "#1e1e20",
  };

  // Storage state (default to 256GB / first storage)
  const storages = product.storages || [
    { size: "256GB", price: product.price || "339,900.00" },
    { size: "512GB", price: "374,900.00" },
  ];
  const [selectedStorageIndex, setSelectedStorageIndex] = useState(0);
  const activeStorage = storages[selectedStorageIndex];

  // Feedback states for cart & buy
  const [isAdded, setIsAdded] = useState(false);
  const [isBuying, setIsBuying] = useState(false);

  // Add to cart handler
  const handleAddToCart = () => {
    addToCart(product, 1, activeColorObj, activeStorage);
    openCart();
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  // Buy it now handler
  const handleBuyNow = () => {
    addToCart(product, 1, activeColorObj, activeStorage);
    openCart();
  };

  // Active price display
  const currentPrice = activeStorage?.price || product.price;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-16">
      {/* Breadcrumbs navigation */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 pb-2">
        <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-blue-600 transition-colors">
            Shop
          </Link>
          <span>/</span>
          <span className="text-slate-400 capitalize">{product.category ? product.category.toLowerCase() : "Smart Phone"}</span>
          <span>/</span>
          <span className="text-slate-900 font-semibold truncate">
            {product.title || product.name}
          </span>
        </nav>
      </div>

      {/* ===================================================================== */}
      {/* 1. MAIN HERO GRID (2-Column Architecture)                             */}
      {/* ===================================================================== */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ------------------------------------------------------------------- */}
        {/* Left Visual Column (lg:col-span-6 flex gap-4)                       */}
        {/* ------------------------------------------------------------------- */}
        <div className="lg:col-span-6 flex flex-col-reverse sm:flex-row gap-4 items-start w-full">
          {/* Vertical Thumbnails Strip (4 items) */}
          <div className="flex flex-row sm:flex-col gap-3.5 w-full sm:w-20 flex-shrink-0 justify-center sm:justify-start overflow-x-auto sm:overflow-visible pb-2 sm:pb-0">
            {galleryViews.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveView(item.id)}
                  title={item.label}
                  aria-label={item.label}
                  className={`w-20 h-24 rounded-2xl flex items-center justify-center p-2 cursor-pointer transition-all ${
                    isActive
                      ? "border-2 border-slate-900 shadow-sm bg-white scale-[1.02]"
                      : "border border-slate-200/80 hover:border-slate-400 bg-slate-50 opacity-80 hover:opacity-100"
                  }`}
                >
                  <PixelGalleryView
                    view={item.id}
                    color={activeColorObj.color}
                    colorName={activeColorObj.name}
                    isThumbnail={true}
                  />
                </button>
              );
            })}
          </div>

          {/* Large Preview Viewport */}
          <div className="flex-1 w-full bg-white border border-slate-200 rounded-[36px] p-6 sm:p-8 min-h-[480px] sm:min-h-[540px] flex items-center justify-center relative shadow-sm overflow-hidden group">
            {/* View angle indicator badge */}
            <div className="absolute top-6 left-6 z-20 flex items-center gap-2">
              <span className="bg-slate-100/90 backdrop-blur-md border border-slate-200 text-slate-700 text-[11px] font-bold px-3 py-1 rounded-full shadow-2xs capitalize">
                {activeView} View
              </span>
              <span className="bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold px-3 py-1 rounded-full shadow-2xs">
                {activeColorObj.name}
              </span>
            </div>

            {/* Quick specs pill on bottom right */}
            <div className="hidden sm:flex absolute bottom-6 right-6 z-20 items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200/60 px-3 py-1 rounded-full">
              <span>Tensor G5</span>
              <span>•</span>
              <span>6.8" Super Actua</span>
            </div>

            {/* Render High-Fidelity Mockup */}
            <PixelGalleryView
              view={activeView}
              color={activeColorObj.color}
              colorName={activeColorObj.name}
              isThumbnail={false}
            />
          </div>
        </div>

        {/* ------------------------------------------------------------------- */}
        {/* Right Product Configurator Card (lg:col-span-6)                     */}
        {/* ------------------------------------------------------------------- */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-[36px] p-6 sm:p-10 shadow-sm w-full">
          {/* Google Brand Badge */}
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.37 7.35 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.63 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span className="text-xs font-bold text-slate-700 tracking-wider uppercase">
              Google
            </span>
            <span className="ml-auto text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
              In Stock • Official Warranty
            </span>
          </div>

          {/* Product Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
            {product.title || product.name}
          </h1>

          {/* Price */}
          <div className="text-lg font-bold text-slate-700 mt-1 flex items-baseline gap-2">
            <span>From Rs {currentPrice}</span>
            <span className="text-xs font-medium text-slate-400">
              (Incl. all taxes & warranty)
            </span>
          </div>

          {/* Color Selector */}
          <div className="mt-6">
            <div className="text-xs font-bold text-slate-900">
              Color:{" "}
              <span className="font-semibold text-slate-600">
                {activeColorObj.name}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-3 mt-2 w-fit">
              {product.swatches?.map((swatch, idx) => {
                const isSelected = selectedColorIndex === idx;
                return (
                  <button
                    key={swatch.name}
                    type="button"
                    onClick={() => setSelectedColorIndex(idx)}
                    title={swatch.name}
                    aria-label={`Select color ${swatch.name}`}
                    className={`w-12 h-12 rounded-xl border p-1 flex items-center justify-center cursor-pointer transition-all ${
                      isSelected
                        ? "border-2 border-slate-900 ring-2 ring-slate-900/10 scale-105"
                        : "border-slate-200 hover:border-slate-400 bg-white"
                    }`}
                  >
                    <div
                      className="w-full h-full rounded-lg shadow-inner border border-black/10 flex items-center justify-center"
                      style={{ backgroundColor: swatch.color }}
                    >
                      {isSelected && (
                        <Check
                          className={`w-3.5 h-3.5 ${
                            swatch.color === "#f2f1ec" || swatch.color === "#9bbada"
                              ? "text-slate-900"
                              : "text-white"
                          }`}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Storage Selector */}
          <div className="mt-6">
            <div className="text-xs font-bold text-slate-900">
              Storage:{" "}
              <span className="font-semibold text-slate-600">
                {activeStorage.size}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              {storages.map((storage, idx) => {
                const isSelected = selectedStorageIndex === idx;
                return (
                  <button
                    key={storage.size}
                    type="button"
                    onClick={() => setSelectedStorageIndex(idx)}
                    className={`transition-all duration-150 ${
                      isSelected
                        ? "border-2 border-slate-900 bg-slate-900 text-white px-6 py-2 rounded-xl text-xs font-bold shadow-xs"
                        : "border border-slate-200 bg-white text-slate-800 hover:border-slate-400 px-6 py-2 rounded-xl text-xs font-bold"
                    }`}
                  >
                    {storage.size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-4 mt-6">
            {/* Add to Cart */}
            <button
              type="button"
              onClick={handleAddToCart}
              className="bg-[#0a0f1d] hover:bg-black text-white px-8 py-3.5 rounded-full text-xs font-bold tracking-wide transition-all shadow-md active:scale-[0.98] flex items-center gap-2"
            >
              {isAdded ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Added to Cart!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>

            {/* Buy it now */}
            <button
              type="button"
              onClick={handleBuyNow}
              className="border border-slate-300 hover:border-slate-900 bg-white text-slate-900 px-8 py-3.5 rounded-full text-xs font-bold tracking-wide transition-all active:scale-[0.98]"
            >
              {isBuying ? "Processing..." : "Buy it now"}
            </button>
          </div>

          {/* Value props mini banners */}
          <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
              <span>Islandwide Delivery</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>1 Year Warranty</span>
            </div>
            <div className="flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
              <span>7 Days Return</span>
            </div>
          </div>

          {/* Specs & Description Box */}
          <div className="mt-6 bg-[#f8fafc] border border-slate-200/80 rounded-2xl p-5 text-[11px] sm:text-xs text-slate-600 leading-relaxed">
            <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
              Description
            </h4>
            <p className="mt-1.5 text-slate-600 leading-relaxed">
              {product.description ||
                "Buy the Google Pixel 10 Pro XL from GNB Sri Lanka, the most popular store to buy genuine Google Pixel phones in Sri Lanka. Tensor G5 with Gemini, a large 6.8-inch Super Actua LTPO display, and a pro triple-camera system — at the best price with premium customer support."}
            </p>

            <h4 className="font-bold text-slate-900 text-xs sm:text-sm mt-3.5">
              Key Features
            </h4>
            <ul className="mt-1.5 space-y-1.5 text-slate-600">
              {(
                product.keyFeatures || [
                  "Pro Triple Camera — 50MP wide, 48MP ultrawide, 48MP 5x telephoto, 100x Pro Res Zoom.",
                  '6.8" Super Actua LTPO — Adaptive 1-120Hz, up to 3000 nits.',
                  "Google Tensor G5 + Gemini — Next-gen on-device AI, Titan M2 security.",
                  "5200mAh Battery — Fast and Qi2 wireless charging.",
                  "IP68 & 7 years of Updates.",
                ]
              ).map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-900 mt-1.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <p className="mt-3.5 pt-3 border-t border-slate-200/70 text-[11px] text-slate-500 italic">
              {product.footerNote ||
                "Genuine Google Pixel product. Can be purchased at GNB Sri Lanka for the best price."}
            </p>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. "YOU MAY ALSO LIKE" SHOWCASE SECTION                                */}
      {/* ===================================================================== */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-14 mb-6 flex items-center justify-between">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          You may also like
        </h2>
        <Link
          href="/shop"
          className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
        >
          <span>View all products</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto px-4 md:px-8 mb-20">
        {relatedProducts.map((relProduct) => (
          <ProductCard key={relProduct.id} product={relProduct} />
        ))}
      </div>
    </div>
  );
}
