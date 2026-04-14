/**
 * KitchenPrepDisplay — Interactive 65" touchscreen for kitchen preparation.
 * 16:9 landscape, large touch-friendly buttons.
 * Shows real-time orders in 3 columns: New | Preparing | Ready
 * Click order to bump status, see prep timer per order, auto-poll every 3 seconds.
 */
import { trpc } from "@/lib/trpc";
import { BRAND } from "@/lib/brand";
import { useState, useEffect, useMemo } from "react";
import {
  ChefHat, ArrowLeft, Clock, Leaf, CheckCircle2,
  ChevronRight, Search, X, AlertCircle, Zap,
} from "lucide-react";

export default function KitchenPrepDisplay() {
  const [time, setTime] = useState(new Date());
  const [locationId, setLocationId] = useState<number>(1); // Default, could be from URL/context
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [elapsedTimes, setElapsedTimes] = useState<Record<number, number>>({});

  // ─── Data ─────────────────────────────────────────────────────────
  const { data: preparations } = trpc.menuPreparations.allActive.useQuery(undefined, {
    refetchInterval: 120000,
  });

  const { data: selectedPrepRaw } = trpc.menuPreparations.byItem.useQuery(
    { menuItemId: selectedItemId! },
    { enabled: !!selectedItemId }
  );

  // Enrich selectedPrepRaw with item data from preparations list
  const selectedPrep = selectedPrepRaw && preparations
    ? preparations.find(p => p.id === selectedPrepRaw.id)
    : selectedPrepRaw as any;

  // Real-time orders polling every 3 seconds
  const { data: activeOrders, refetch: refetchOrders } = trpc.kioskOrders.getActiveOrders.useQuery(
    { locationId },
    { refetchInterval: 3000 }
  );

  const { data: orderStats } = trpc.kioskOrders.getOrderStats.useQuery(
    { locationId },
    { refetchInterval: 5000 }
  );

  const updateKitchenStatus = trpc.kioskOrders.updateKitchenStatus.useMutation({
    onSuccess: () => {
      refetchOrders();
    },
  });

  // ─── Clock ────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // ─── Track elapsed time for each order ─────────────────────────────
  useEffect(() => {
    if (!activeOrders) return;
    const interval = setInterval(() => {
      const newTimes: Record<number, number> = {};
      for (const order of activeOrders) {
        const now = new Date().getTime();
        const created = new Date(order.createdAt).getTime();
        newTimes[order.id] = Math.floor((now - created) / 1000);
      }
      setElapsedTimes(newTimes);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeOrders]);

  // ─── Group by kitchen status ───────────────────────────────────────
  const grouped = useMemo(() => {
    if (!activeOrders) return { new: [], preparing: [], ready: [] };
    const map: Record<string, typeof activeOrders> = { new: [], preparing: [], ready: [] };
    for (const order of activeOrders) {
      const status = order.kitchenStatus || "new";
      if (status in map) map[status].push(order);
    }
    return map;
  }, [activeOrders]);

  // ─── Group preparations by category ────────────────────────────────
  const prepGrouped = useMemo(() => {
    if (!preparations) return {};
    const map: Record<string, typeof preparations> = {};
    for (const prep of preparations) {
      const cat = prep.categoryName;
      if (!map[cat]) map[cat] = [];
      map[cat].push(prep);
    }
    return map;
  }, [preparations]);

  const prepCategories = Object.keys(prepGrouped);

  // ─── Filtered prep items ──────────────────────────────────────────
  const visiblePreps = useMemo(() => {
    let items = activeCategory ? (prepGrouped[activeCategory] || []) : (preparations || []);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter((p) =>
        p.itemName.toLowerCase().includes(q) || p.itemSubtitle?.toLowerCase().includes(q)
      );
    }
    return items;
  }, [preparations, prepGrouped, activeCategory, searchQuery]);

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
  const selectPrep = (id: number) => {
    setSelectedItemId(id);
    setCompletedSteps(new Set());
  };

  // ─── Bump order status ────────────────────────────────────────────
  const bumpOrderStatus = (orderId: number, currentStatus: string) => {
    const nextStatuses: Record<string, string> = {
      new: "preparing",
      preparing: "ready",
      ready: "picked_up",
    };
    const nextStatus = nextStatuses[currentStatus] || "new";
    updateKitchenStatus.mutate({ orderId, kitchenStatus: nextStatus as any });
  };

  const goBack = () => {
    setSelectedItemId(null);
    setCompletedSteps(new Set());
  };

  const timeStr = time.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

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
            <h1 className="text-3xl font-light text-white">{selectedPrep.itemName || "Bereiding"}</h1>
            {selectedPrep.itemSubtitle && (
              <p className="text-sm text-white/30 mt-1">{selectedPrep.itemSubtitle}</p>
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
  // ─── MAIN VIEW: Orders in 3 columns + Preparations ────────────────
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
            <h1 className="text-xl font-light text-white">Keuken Monitor</h1>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {/* Stats */}
          {orderStats && (
            <div className="flex gap-4 px-6 py-3 rounded-xl bg-white/[0.05]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#b8a472]" />
                <span className="text-sm text-white/70">Gem. prep: {orderStats.avgPrepTimeSeconds ? formatTime(orderStats.avgPrepTimeSeconds) : "-"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#b8a472]" />
                <span className="text-sm text-white/70">Klaar: {orderStats.readyCount}/{orderStats.totalOrdersToday}</span>
              </div>
            </div>
          )}
          <span className="text-2xl font-extralight text-white/60 tabular-nums">{timeStr}</span>
        </div>
      </div>

      {/* Orders in 3 columns */}
      <div className="flex-1 overflow-hidden flex gap-6 px-10 py-6">
        {/* NEW column */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-2 px-4 py-3 mb-4 bg-[#dc2626]/15 rounded-lg border border-[#dc2626]/30">
            <AlertCircle className="w-5 h-5 text-[#dc2626]" />
            <h2 className="text-lg font-semibold text-[#dc2626]">Nieuw ({grouped.new.length})</h2>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-4">
            {grouped.new.map((order: any) => (
              <button
                key={order.id}
                onClick={() => bumpOrderStatus(order.id, "new")}
                className="w-full p-4 rounded-xl bg-[#dc2626]/10 border-2 border-[#dc2626]/30 hover:bg-[#dc2626]/20 active:bg-[#dc2626]/25 transition-all text-left touch-manipulation">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white truncate">{order.orderNumber}</p>
                    <p className="text-xs text-white/50 mt-1">
                      {order.items?.map((item: any) => item.productName).join(", ") || "Geen items"}
                    </p>
                  </div>
                  <div className="text-right ml-2">
                    <p className="text-sm text-[#dc2626] font-medium">{formatTime(elapsedTimes[order.id] || 0)}</p>
                  </div>
                </div>
              </button>
            ))}
            {grouped.new.length === 0 && (
              <div className="flex items-center justify-center h-32 text-white/20">
                <p className="text-sm">Geen nieuwe bestellingen</p>
              </div>
            )}
          </div>
        </div>

        {/* PREPARING column */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-2 px-4 py-3 mb-4 bg-[#f59e0b]/15 rounded-lg border border-[#f59e0b]/30">
            <Clock className="w-5 h-5 text-[#f59e0b]" />
            <h2 className="text-lg font-semibold text-[#f59e0b]">Bereiden ({grouped.preparing.length})</h2>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-4">
            {grouped.preparing.map((order) => (
              <button
                key={order.id}
                onClick={() => bumpOrderStatus(order.id, "preparing")}
                className="w-full p-4 rounded-xl bg-[#f59e0b]/10 border-2 border-[#f59e0b]/30 hover:bg-[#f59e0b]/20 active:bg-[#f59e0b]/25 transition-all text-left touch-manipulation">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white truncate">{order.orderNumber}</p>
                    <p className="text-xs text-white/50 mt-1">
                      {order.items?.map((item: any) => item.productName).join(", ") || "Geen items"}
                    </p>
                  </div>
                  <div className="text-right ml-2">
                    <p className="text-sm text-[#f59e0b] font-medium">{formatTime(elapsedTimes[order.id] || 0)}</p>
                  </div>
                </div>
              </button>
            ))}
            {grouped.preparing.length === 0 && (
              <div className="flex items-center justify-center h-32 text-white/20">
                <p className="text-sm">Geen bestellingen in bereiding</p>
              </div>
            )}
          </div>
        </div>

        {/* READY column */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-2 px-4 py-3 mb-4 bg-[#22c55e]/15 rounded-lg border border-[#22c55e]/30">
            <CheckCircle2 className="w-5 h-5 text-[#22c55e]" />
            <h2 className="text-lg font-semibold text-[#22c55e]">Klaar ({grouped.ready.length})</h2>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-4">
            {grouped.ready.map((order) => (
              <button
                key={order.id}
                onClick={() => bumpOrderStatus(order.id, "ready")}
                className="w-full p-4 rounded-xl bg-[#22c55e]/10 border-2 border-[#22c55e]/30 hover:bg-[#22c55e]/20 active:bg-[#22c55e]/25 transition-all text-left touch-manipulation">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white truncate">{order.orderNumber}</p>
                    <p className="text-xs text-white/50 mt-1">
                      {order.items?.map((item: any) => item.productName).join(", ") || "Geen items"}
                    </p>
                  </div>
                  <div className="text-right ml-2">
                    <p className="text-sm text-[#22c55e] font-medium">{formatTime(elapsedTimes[order.id] || 0)}</p>
                  </div>
                </div>
              </button>
            ))}
            {grouped.ready.length === 0 && (
              <div className="flex items-center justify-center h-32 text-white/20">
                <p className="text-sm">Geen klare bestellingen</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: Preparations browser */}
      <div className="border-t border-[#627653]/15 shrink-0 h-64 flex flex-col">
        <div className="flex items-center justify-between px-10 py-3 bg-white/[0.02]">
          <h2 className="text-sm font-semibold text-white/60 uppercase">Recepten beschikbaar</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input type="text" placeholder="Zoeken..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 w-48 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-[#627653]/40" />
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 px-10 py-3 overflow-x-auto border-b border-[#627653]/15">
          <button onClick={() => setActiveCategory(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              !activeCategory ? "bg-[#627653] text-white" : "bg-white/[0.04] text-white/50 hover:bg-white/[0.06]"
            }`}>
            Alles
          </button>
          {prepCategories.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeCategory === cat ? "bg-[#627653] text-white" : "bg-white/[0.04] text-white/50 hover:bg-white/[0.06]"
              }`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Preps grid */}
        <div className="flex-1 overflow-y-auto px-10 py-3">
          <div className="grid grid-cols-6 gap-2">
            {visiblePreps.map((prep) => (
              <button key={prep.id} onClick={() => selectPrep(prep.menuItemId)}
                className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all text-left group">
                <p className="text-xs font-medium text-white truncate">{prep.itemName}</p>
                <p className="text-xs text-white/30 truncate">{(prep.steps as string[]).length} stappen</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
