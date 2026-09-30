"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Smartphone,
  Laptop,
  Watch,
  Headphones,
  Cable,
  Gamepad2,
  X,
  Search,
} from "lucide-react";
import { getCategories, getProducts, getFeaturedProducts } from "@/services/api";
import ProductCard from "@/components/ProductCard";

const iconMap = { Smartphone, Laptop, Watch, Headphones, Cable, Gamepad2 };

// Curated home page cards. `categorySlug` maps each card to a real Category
// document (see backend/models/Category.js); a null slug means no matching
// category exists yet in the database, so the card shows the empty state.
const CATEGORY_CARDS = [
  { id: "smartphones", name: "Smartphones", icon: "Smartphone", badge: "Hot", categorySlug: "smartphones" },
  { id: "laptops", name: "Laptops & Mac", icon: "Laptop", badge: "New", categorySlug: "laptops" },
  { id: "smartwatches", name: "Smartwatches", icon: "Watch", badge: null, categorySlug: "smart-watches" },
  { id: "audio", name: "Audio & Sound", icon: "Headphones", badge: "Sale", categorySlug: "earbuds" },
  { id: "accessories", name: "Accessories", icon: "Cable", badge: null, categorySlug: "accessories" },
  { id: "gaming", name: "Gaming Gear", icon: "Gamepad2", badge: "Popular", categorySlug: null },
];

const PRODUCTS_PER_CATEGORY = 8;

function badgeClasses(badge) {
  if (badge === "Hot") return "bg-rose-500 text-white";
  if (badge === "Sale") return "bg-amber-500 text-white";
  return "bg-blue-600 text-white";
}

function ProductSkeletonGrid({ count = PRODUCTS_PER_CATEGORY }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-slate-100 rounded-[32px] h-96 animate-pulse" />
      ))}
    </div>
  );
}

export default function CategoryExplorer() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const paramCategory = searchParams.get("category");

  const sectionRef = useRef(null);

  const [realCategories, setRealCategories] = useState(null); // null = still loading
  const [counts, setCounts] = useState({});
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [activeTotal, setActiveTotal] = useState(null);

  const categoryMap = useMemo(() => {
    const bySlug = new Map((realCategories || []).map((c) => [c.slug, c]));
    const map = {};
    CATEGORY_CARDS.forEach((card) => {
      const real = card.categorySlug ? bySlug.get(card.categorySlug) : null;
      map[card.id] = { ...card, realCategoryId: real?._id || null };
    });
    return map;
  }, [realCategories]);

  const selectedId =
    paramCategory && categoryMap[paramCategory] ? paramCategory : null;
  const selectedCard = selectedId ? categoryMap[selectedId] : null;

  // Load real categories once.
  useEffect(() => {
    let cancelled = false;
    getCategories()
      .then((res) => {
        if (!cancelled) setRealCategories(res.data || []);
      })
      .catch(() => {
        if (!cancelled) setRealCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Product counts for each card badge — same getProducts() call the filtered
  // list uses (just limit:1), so the count can never drift from reality.
  useEffect(() => {
    if (realCategories === null) return;
    let cancelled = false;
    Promise.all(
      CATEGORY_CARDS.map(async (card) => {
        const realId = categoryMap[card.id]?.realCategoryId;
        if (!realId) return [card.id, 0];
        try {
          const { data } = await getProducts({ category: realId, limit: 1 });
          return [card.id, data.total ?? 0];
        } catch {
          return [card.id, 0];
        }
      })
    ).then((entries) => {
      if (!cancelled) setCounts(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realCategories]);

  // Load the products section: featured by default, filtered when a category is selected.
  useEffect(() => {
    if (realCategories === null) return;
    let cancelled = false;
    setProductsLoading(true);

    const run = async () => {
      if (!selectedId) {
        try {
          const { data } = await getFeaturedProducts();
          if (!cancelled) {
            setProducts(data || []);
            setActiveTotal(null);
          }
        } catch {
          if (!cancelled) setProducts([]);
        }
        return;
      }

      const realId = categoryMap[selectedId]?.realCategoryId;
      if (!realId) {
        if (!cancelled) {
          setProducts([]);
          setActiveTotal(0);
        }
        return;
      }

      try {
        const { data } = await getProducts({
          category: realId,
          limit: PRODUCTS_PER_CATEGORY,
          sort: "newest",
        });
        if (!cancelled) {
          setProducts(data.products || []);
          setActiveTotal(data.total ?? 0);
          setCounts((prev) => ({ ...prev, [selectedId]: data.total ?? 0 }));
        }
      } catch {
        if (!cancelled) setProducts([]);
      }
    };

    run().finally(() => {
      if (!cancelled) setProductsLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, realCategories]);

  const handleCardClick = (id) => {
    const next = selectedId === id ? null : id;
    router.push(next ? `${pathname}?category=${next}` : pathname, { scroll: false });
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const clearSelection = () => {
    router.push(pathname, { scroll: false });
  };

  const headingTitle = selectedCard ? selectedCard.name : "Featured Products";
  const headingCount = selectedCard ? counts[selectedId] ?? activeTotal ?? 0 : products.length;

  return (
    <>
      {/* ========================================================================= */}
      {/* EXPLORE CATEGORIES STRIP */}
      {/* ========================================================================= */}
      <section className="mx-4 md:mx-8">
        <div className="bg-white rounded-[32px] p-6 sm:p-8 lg:p-10 border border-slate-200/80 shadow-sm space-y-6">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Explore Categories
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Discover curated smart devices and premium accessories
              </p>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 group flex-shrink-0"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {CATEGORY_CARDS.map((category) => {
              const IconComponent = iconMap[category.icon] || Smartphone;
              const isActive = selectedId === category.id;
              const count = counts[category.id];
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleCardClick(category.id)}
                  aria-pressed={isActive}
                  className={`group relative rounded-2xl p-4 border transition-all duration-200 flex flex-col items-center text-center cursor-pointer ${
                    isActive
                      ? "bg-blue-50 border-blue-500 shadow-lg shadow-blue-500/10"
                      : "bg-slate-50/80 hover:bg-white border-slate-200/70 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/5"
                  }`}
                >
                  {category.badge && (
                    <span
                      className={`absolute top-2 right-2 text-xs font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${badgeClasses(
                        category.badge
                      )}`}
                    >
                      {category.badge}
                    </span>
                  )}

                  <div
                    className={`w-12 h-12 rounded-xl border shadow-sm flex items-center justify-center transition-all duration-200 mb-3 ${
                      isActive
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white border-slate-200/80 text-slate-700 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600"
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>

                  <h3
                    className={`text-xs font-bold transition-colors ${
                      isActive ? "text-blue-700" : "text-slate-900 group-hover:text-blue-600"
                    }`}
                  >
                    {category.name}
                  </h3>
                  <span className="text-xs text-slate-500 mt-1">
                    {count === undefined ? "…" : `${count} Product${count === 1 ? "" : "s"}`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* PRODUCTS SECTION */}
      {/* ========================================================================= */}
      <section ref={sectionRef} className="mx-4 md:mx-8 scroll-mt-24">
        <div className="bg-white rounded-[32px] p-6 sm:p-8 lg:p-10 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {headingTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                {productsLoading ? "Loading products…" : `${headingCount} products`}
              </p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              {selectedCard && (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 rounded-full px-3 py-1.5 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
              {selectedCard?.realCategoryId && (
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 group flex-shrink-0"
                >
                  <span>See all {selectedCard.name}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
              )}
            </div>
          </div>

          {productsLoading ? (
            <ProductSkeletonGrid />
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-slate-50 rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                No products in this category yet.
              </h3>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
