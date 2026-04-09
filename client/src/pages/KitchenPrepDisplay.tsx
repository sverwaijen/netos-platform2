/**
 * KitchenPrepDisplay — Interactive 65" touchscreen for kitchen preparation.
 * 16:9 landscape, large touch-friendly buttons.
 * Crew can tap a dish to see step-by-step preparation instructions from the Foodbook.
 * NOT an order system — all items are pre-prepared.
 */
import { trpc } from "@/lib/trpc";
import { BRAND } from "@/lib/brand";
import { useState, useEffect, useMemo } from "react";
import {
  ChefHat, ArrowLeft, Clock, Leaf, CheckCircle2,
  ChevronRight, Search, X,
} from "lucide-react";

export default function KitchenPrepDisplay() {
  const [time, setTime] = useState(new Date());
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  // ─── Data ─────────────────────────────────────────────────────────
  const { data: preparations } = trpc.menuPreparations.allActive.useQuery(undefined, {
    refetchInterval: 120000,
  });

  const { data: selectedPrep } = trpc.menuPreparations.byItem.useQuery(
    { menuItemId: selectedItemId! },
    { enabled: !!selectedItemId }
  );

  // ─── Clock ────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // ─── Group by category ────────────────────────────────────────────
  const grouped = useMemo(() => {
    if (!preparations) return {};
    const map: Record<string, typeof preparations> = {};
    for (const prep of preparations) {
      const cat = prep.categoryName;
      if (!map[cat]) map[cat] = [];
      map[cat].push(prep);
    }
    return map;
  }, [preparations]);

  const categories = Object.keys(grouped);

  // ─── Filtered items ───────────────────────────────────────────────
  const visibleItems = useMemo(() => {
    let items = activeCategory ? (grouped[activeCategory] || []) : (preparations || []);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter((p) =>
        p.itemName.toLowerCase().includes(q) || p.itemSubtitle?.toLowerCase().includes(q)
      );
    }
    return items;
  }, [preparations, grouped, activeCategory, searchQuery]);

  // ─── Toggle step completion ───────────────────────────────────────
  const toggleStep = (idx: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  // ─── Reset when selecting new item ────────────────────────────────
  const selectItem = (id: number) => {
    setSelectedItemId(id);
    setCompletedSteps(new Set());
  };

  const goBack = () => {
    setSelectedItemId(null);
    setCompletedSteps(new Set());
  };

  const timeStr = time.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });

  // ═══════════════════════════════════════════════════════════════════
  // ─── DETAIL VIEW: Preparation steps ──────────────────────────────
  // ═══════════════════════════════════════════════════════════════════
  if (selectedItemId && selectedPrep) {
    const steps = (selectedPrep.steps as string[]) || [];
    const allDone = completedSteps.size === steps.length && steps.length > 0;

    return (
      <div className="fixed inset-0 bg-[#0f1a0a] flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
        {/* Top bar */}
        <div className="flex items-center justify-between px-10 py-5 shrink-0 border-b border-[#627653]/15">
          <button onClick={goBack}
            className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-white/[0.05] hover:bg-white/[0.08] active:bg-white/[0.12] transition-all text-white/70 touch-manipulation">
            <ArrowLeft className="w-6 h-6" />
            <span className="text-lg">Terug</span>
          </button>
          <div className="text-center">
            <h1 className="text-3xl font-light text-white">{(selectedPrep as any).itemName || "Bereiding"}</h1>
            {(selectedPrep as any).itemSubtitle && (
              <p className="text-sm text-white/30 mt-1">{(selectedPrep as any).itemSubtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            {selectedPrep.prepTimeMinutes && (
              <div className="flex items-center gap-2 text-[#b8a472]/60">
                <Clock className="w-5 h-5" />
                <span className="text-lg">{selectedPrep.prepTimeMinutes} min</span>
              </div>
            )}
            <span className="text-2xl font-extralight text-white/60 tabular-nums">{timeStr}</span>
          </div>
        </div>

        {/* Steps */}
        <div className="flex-1 overflow-y-auto px-10 py-8">
          <div className="max-w-4xl mx-auto space-y-4">
            {steps.map((step, idx) => {
              const isDone = completedSteps.has(idx);
              return (
                <button key={idx} onClick={() => toggleStep(idx)}
                  className={`w-full flex items-start gap-6 p-6 rounded-2xl text-left transition-all touch-manipulation ${
                    isDone
                      ? "bg-[#627653]/15 border-2 border-[#627653]/30"
                      : "bg-white/[0.04] border-2 border-transparent hover:bg-white/[0.06] active:bg-white/[0.08]"
                  }`}>
                  {/* Step number / check */}
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 text-xl font-semibold transition-all ${
                    isDone
                      ? "bg-[#627653] text-white"
                      : "bg-white/[0.06] text-white/40"
                  }`}>
                    {isDone ? <CheckCircle2 className="w-7 h-7" /> : idx + 1}
                  </div>
                  {/* Step text */}
                  <p className={`text-xl leading-relaxed pt-3 transition-all ${
                    isDone ? "text-white/40 line-through" : "text-white"
                  }`}>
                    {step}
                  </p>
                </button>
              );
            })}
          </div>

          {/* All done indicator */}
          {allDone && (
            <div className="max-w-4xl mx-auto mt-8 p-8 rounded-2xl bg-[#627653]/20 border-2 border-[#627653]/30 text-center">
              <CheckCircle2 className="w-16 h-16 text-[#627653] mx-auto mb-4" />
              <p className="text-2xl font-light text-[#627653]">Bereiding compleet!</p>
            </div>
          )}

          {/* Notes */}
          {selectedPrep.notes && (
            <div className="max-w-4xl mx-auto mt-6 p-6 rounded-2xl bg-[#b8a472]/10 border border-[#b8a472]/20">
              <p className="text-sm font-semibold text-[#b8a472] uppercase tracking-wider mb-2">Notities</p>
              <p className="text-white/60">{selectedPrep.notes}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // ─── LIST VIEW: All dishes with preparations ─────────────────────
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="fixed inset-0 bg-[#0f1a0a] flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-10 py-5 shrink-0 border-b border-[#627653]/15">
        <div className="flex items-center gap-4">
          <img src={BRAND.logo} alt="Mr. Green" className="h-8 opacity-70" />
          <div className="h-8 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-[#627653]" />
            <h1 className="text-xl font-light text-white">Bereidingskaart</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <input type="text" placeholder="Zoek gerecht..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-10 py-3 w-72 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white text-lg placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-[#627653]/40 touch-manipulation" />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-white/5 touch-manipulation">
                <X className="w-5 h-5 text-white/40" />
              </button>
            )}
          </div>
          <span className="text-2xl font-extralight text-white/60 tabular-nums">{timeStr}</span>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 px-10 py-4 shrink-0 overflow-x-auto">
        <button onClick={() => setActiveCategory(null)}
          className={`px-6 py-3 rounded-xl text-base font-medium transition-all touch-manipulation whitespace-nowrap ${
            !activeCategory ? "bg-[#627653] text-white" : "bg-white/[0.04] text-white/50 hover:bg-white/[0.06]"
          }`}>
          Alles
        </button>
        {categories.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-6 py-3 rounded-xl text-base font-medium transition-all touch-manipulation whitespace-nowrap ${
              activeCategory === cat ? "bg-[#627653] text-white" : "bg-white/[0.04] text-white/50 hover:bg-white/[0.06]"
            }`}>
            {cat}
            <span className="ml-2 text-sm opacity-50">{grouped[cat]?.length}</span>
          </button>
        ))}
      </div>

      {/* Items grid */}
      <div className="flex-1 overflow-y-auto px-10 py-4">
        <div className="grid grid-cols-3 gap-4">
          {visibleItems.map((prep) => (
            <button key={prep.id} onClick={() => selectItem(prep.menuItemId)}
              className="flex items-center gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] active:bg-white/[0.08] transition-all text-left touch-manipulation group">
              <div className="w-14 h-14 rounded-xl bg-[#627653]/15 flex items-center justify-center shrink-0">
                <ChefHat className="w-6 h-6 text-[#627653]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-white truncate">{prep.itemName}</h3>
                {prep.itemSubtitle && (
                  <p className="text-sm text-white/30 truncate mt-0.5">{prep.itemSubtitle}</p>
                )}
                <p className="text-xs text-[#627653]/60 mt-1">
                  {(prep.steps as string[]).length} stappen
                </p>
              </div>
              <ChevronRight className="w-6 h-6 text-white/15 group-hover:text-white/30 shrink-0" />
            </button>
          ))}
        </div>

        {visibleItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-white/20">
            <ChefHat className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-xl font-light">Geen bereidingen gevonden</p>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-10 py-3 shrink-0 border-t border-[#627653]/10">
        <p className="text-xs text-white/15">Tik op een gerecht voor bereidingsinstructies</p>
        <p className="text-xs text-white/15">{preparations?.length || 0} recepten beschikbaar</p>
      </div>
    </div>
  );
}
