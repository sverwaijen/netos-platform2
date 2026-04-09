/**
 * SignageMenuDisplay — Digital signage screen for Mr. Green menukaart.
 * Designed for 16:9 landscape displays (e.g., 65" TV).
 * Auto-rotates through categories, shows active season menu with prices.
 * Refreshes data every 60s to stay in sync with dashboard changes.
 */
import { trpc } from "@/lib/trpc";
import { BRAND } from "@/lib/brand";
import { useState, useEffect, useMemo } from "react";
import { Leaf, Wheat } from "lucide-react";

interface Props {
  config?: any;
  time?: Date;
  locationId?: number;
  onRefresh?: () => void;
}

export default function SignageMenuDisplay({ config, time: externalTime, locationId }: Props) {
  const [time, setTime] = useState(externalTime || new Date());
  const [activeCategoryIdx, setActiveCategoryIdx] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  // ─── Data ─────────────────────────────────────────────────────────
  const { data: menuData } = trpc.menuItems.activeMenu.useQuery(
    { locationId },
    { refetchInterval: 60000 }
  );

  // ─── Clock ────────────────────────────────────────────────────────
  useEffect(() => {
    if (externalTime) { setTime(externalTime); return; }
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, [externalTime]);

  // ─── Group items by category ──────────────────────────────────────
  const grouped = useMemo(() => {
    if (!menuData?.items) return [];
    const map: Record<string, { name: string; slug: string; items: any[] }> = {};
    for (const item of menuData.items) {
      const cat = item.categoryName;
      if (!map[cat]) map[cat] = { name: cat, slug: item.categorySlug, items: [] };
      map[cat].items.push(item);
    }
    return Object.values(map);
  }, [menuData]);

  // ─── Food categories only (for rotation) ─────────────────────────
  const foodCategories = useMemo(() =>
    grouped.filter((g) => !["koffie-thee", "frisdranken", "alcoholisch"].includes(g.slug)),
    [grouped]
  );
  const drinkCategories = useMemo(() =>
    grouped.filter((g) => ["koffie-thee", "frisdranken", "alcoholisch"].includes(g.slug)),
    [grouped]
  );

  // ─── Auto-rotate food categories every 12s ────────────────────────
  useEffect(() => {
    if (foodCategories.length <= 2) return;
    const interval = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setActiveCategoryIdx((prev) => (prev + 2) % foodCategories.length);
        setFadeIn(true);
      }, 400);
    }, 12000);
    return () => clearInterval(interval);
  }, [foodCategories.length]);

  // ─── Format time ──────────────────────────────────────────────────
  const timeStr = time.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
  const dateStr = time.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });

  // ─── Current visible food categories (show 2 at a time) ──────────
  const visibleFood = foodCategories.slice(activeCategoryIdx, activeCategoryIdx + 2);
  if (visibleFood.length < 2 && foodCategories.length > 1) {
    visibleFood.push(...foodCategories.slice(0, 2 - visibleFood.length));
  }

  // ─── Category dots ────────────────────────────────────────────────
  const totalPages = Math.ceil(foodCategories.length / 2);
  const currentPage = Math.floor(activeCategoryIdx / 2);

  if (!menuData || !menuData.season) {
    return (
      <div className="fixed inset-0 bg-[#0f1a0a] flex items-center justify-center">
        <div className="text-center">
          <img src={BRAND.logo} alt="Mr. Green" className="h-16 mx-auto mb-8 opacity-60" />
          <div className="w-10 h-10 border-2 border-[#627653] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0f1a0a] overflow-hidden flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ═══ TOP BAR ═══ */}
      <div className="flex items-center justify-between px-12 py-6 shrink-0">
        <img src={BRAND.logo} alt="Mr. Green" className="h-10 opacity-80" />
        <div className="flex items-center gap-6">
          <span className="text-[#627653]/60 text-sm capitalize">{dateStr}</span>
          <span className="text-3xl font-extralight text-white/80 tabular-nums">{timeStr}</span>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 flex px-12 pb-8 gap-8 min-h-0">
        {/* LEFT: Food categories (rotating) */}
        <div className={`flex-1 flex gap-8 transition-opacity duration-400 ${fadeIn ? "opacity-100" : "opacity-0"}`}>
          {visibleFood.map((category) => (
            <div key={category.slug} className="flex-1 flex flex-col">
              {/* Category header */}
              <div className="mb-4 pb-3 border-b border-[#627653]/20">
                <h2 className="text-xl font-light text-[#b8a472] tracking-wide">{category.name}</h2>
              </div>
              {/* Items */}
              <div className="flex-1 space-y-2 overflow-hidden">
                {category.items.map((item: any) => (
                  <div key={item.id} className="flex items-start justify-between gap-4 py-1.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-[15px] font-medium">{item.name}</span>
                        {item.isVegan && <Leaf className="w-3.5 h-3.5 text-green-500 shrink-0" />}
                        {item.isVegetarian && !item.isVegan && <Leaf className="w-3.5 h-3.5 text-green-400/60 shrink-0" />}
                      </div>
                      {item.subtitle && (
                        <p className="text-white/30 text-[12px] leading-tight mt-0.5 truncate">{item.subtitle}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[#b8a472] text-[15px] font-light tabular-nums">
                        {item.priceEur ? `€${parseFloat(item.priceEur).toFixed(2).replace(".", ",")}` : ""}
                      </span>
                      {item.priceLargeEur && (
                        <span className="text-white/20 text-[11px] block">
                          groot €{parseFloat(item.priceLargeEur).toFixed(2).replace(".", ",")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT: Drinks sidebar (always visible) */}
        <div className="w-[280px] shrink-0 flex flex-col">
          <div className="flex-1 space-y-6 overflow-hidden">
            {drinkCategories.map((category) => (
              <div key={category.slug}>
                <h3 className="text-xs font-semibold text-[#627653] uppercase tracking-[3px] mb-3 pb-2 border-b border-[#627653]/15">
                  {category.name}
                </h3>
                <div className="space-y-1.5">
                  {category.items.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <span className="text-white/70 text-[13px]">{item.name}</span>
                      <span className="text-[#b8a472]/70 text-[13px] tabular-nums">
                        {item.priceEur ? `€${parseFloat(item.priceEur).toFixed(2).replace(".", ",")}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Arrangements */}
          {menuData.arrangements.length > 0 && (
            <div className="mt-6 pt-4 border-t border-[#627653]/15">
              <h3 className="text-xs font-semibold text-[#b8a472] uppercase tracking-[3px] mb-3">Deals</h3>
              <div className="space-y-1.5">
                {menuData.arrangements.slice(0, 5).map((arr: any) => (
                  <div key={arr.id} className="flex items-center justify-between">
                    <span className="text-white/50 text-[12px]">{arr.name}</span>
                    <span className="text-[#b8a472]/60 text-[12px] tabular-nums">
                      €{parseFloat(arr.priceEur).toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ BOTTOM BAR ═══ */}
      <div className="flex items-center justify-between px-12 py-4 shrink-0 border-t border-[#627653]/10">
        <div className="flex items-center gap-4 text-[11px] text-white/20">
          <span className="flex items-center gap-1.5"><Leaf className="w-3 h-3 text-green-500" /> Vegan</span>
          <span className="flex items-center gap-1.5"><Leaf className="w-3 h-3 text-green-400/60" /> Vegetarisch</span>
        </div>
        {/* Page dots */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === currentPage ? "bg-[#627653] w-4" : "bg-white/10"
              }`} />
            ))}
          </div>
        )}
        <p className="text-[11px] text-white/15">
          {menuData.season.name} &middot; Prijzen incl. BTW
        </p>
      </div>
    </div>
  );
}
