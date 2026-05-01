import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import {
  ChefHat, Calendar, GripVertical, Plus, Trash2, Eye, EyeOff,
  Copy, Settings, Leaf, Wheat, Star, Search, Package, ArrowRight,
  Check, X, Edit3, Save, ChevronDown, ChevronRight, ToggleLeft, ToggleRight,
} from "lucide-react";
import { toast } from "sonner";
import type { MenuSeason, MenuItem, MenuArrangement } from "@shared/types";

// ─── Local view-model types ──────────────────────────────────────────
// `trpc.menuItems.bySeason` returns rows joined from menu_season_items +
// menu_items + menu_categories — see server/routers/menuRouter.ts.
type SeasonItem = MenuItem & {
  seasonItemId: number;
  priceEur: string | null;
  priceLargeEur: string | null;
  isAvailable: boolean | null;
  categoryName: string;
  categorySlug: string;
  categoryIcon: string | null;
};

// Mirrors the `quarter` mysqlEnum on `menu_seasons` and the
// `menuSeasons.clone` zod input.
type Quarter = "Q1" | "Q2" | "Q3" | "Q4";

type DragItem = { id?: number; seasonItemId?: number; menuItemId?: number; sortOrder?: number | null };

export default function MenuDashboard() {
  const [activeTab, setActiveTab] = useState<"seasons" | "items" | "arrangements">("seasons");
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);

  // ─── Queries ──────────────────────────────────────────────────────
  const { data: seasons, refetch: refetchSeasons } = trpc.menuSeasons.list.useQuery();
  const { data: categories } = trpc.menuCategories.list.useQuery();
  const { data: allItems, refetch: refetchItems } = trpc.menuItems.list.useQuery({});
  const activeSeason = seasons?.find((s: MenuSeason) => s.isActive);
  const effectiveSeasonId = selectedSeasonId || activeSeason?.id;

  const { data: seasonItems, refetch: refetchSeasonItems } = trpc.menuItems.bySeason.useQuery(
    { seasonId: effectiveSeasonId! },
    { enabled: !!effectiveSeasonId }
  );
  const { data: arrangements, refetch: refetchArrangements } = trpc.menuArrangements.list.useQuery(
    { seasonId: effectiveSeasonId },
    { enabled: !!effectiveSeasonId }
  );

  // ─── Mutations ────────────────────────────────────────────────────
  const activateSeason = trpc.menuSeasons.activate.useMutation({
    onSuccess: () => { refetchSeasons(); toast.success("Seizoen geactiveerd"); },
  });
  const addSeasonItem = trpc.menuSeasonItems.add.useMutation({
    onSuccess: () => { refetchSeasonItems(); toast.success("Gerecht toegevoegd aan seizoen"); },
  });
  const removeSeasonItem = trpc.menuSeasonItems.remove.useMutation({
    onSuccess: () => { refetchSeasonItems(); toast.success("Gerecht verwijderd uit seizoen"); },
  });
  const toggleAvailability = trpc.menuSeasonItems.toggleAvailability.useMutation({
    onSuccess: () => { refetchSeasonItems(); },
  });
  const cloneSeason = trpc.menuSeasons.clone.useMutation({
    onSuccess: (data) => {
      refetchSeasons();
      toast.success(`Seizoen gekloond met ${data.itemsCopied} gerechten`);
    },
  });

  // ─── Grouped season items ────────────────────────────────────────
  const groupedItems = useMemo(() => {
    if (!seasonItems) return {};
    const groups: Record<string, typeof seasonItems> = {};
    for (const item of seasonItems) {
      const cat = item.categoryName;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }
    return groups;
  }, [seasonItems]);

  // ─── Items NOT in current season (for drag source) ───────────────
  const availableItems = useMemo(() => {
    if (!allItems || !seasonItems) return allItems || [];
    const inSeason = new Set(seasonItems.map((si: SeasonItem) => si.id));
    let filtered = allItems.filter((item: MenuItem) => !inSeason.has(item.id));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((item: MenuItem) =>
        item.name.toLowerCase().includes(q) || item.subtitle?.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [allItems, seasonItems, searchQuery]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleDragStart = (item: MenuItem | SeasonItem) => {
    setDraggedItem(item);
  };

  const handleDropToSeason = () => {
    if (!draggedItem || !effectiveSeasonId) return;
    const itemId = draggedItem.menuItemId || draggedItem.id;
    if (!itemId) return;
    addSeasonItem.mutate({
      seasonId: effectiveSeasonId,
      menuItemId: itemId,
    });
    setDraggedItem(null);
  };

  const selectedSeason = seasons?.find((s: MenuSeason) => s.id === effectiveSeasonId);

  const tabs = [
    { id: "seasons" as const, label: "Seizoenen", icon: Calendar },
    { id: "items" as const, label: "Menukaart", icon: ChefHat },
    { id: "arrangements" as const, label: "Arrangementen", icon: Package },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-2">F&B Management</p>
          <h1 className="text-3xl font-extralight text-white">Menukaart Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          {activeSeason && (
            <div className="px-4 py-2 rounded-lg bg-[#627653]/20 border border-[#627653]/30 text-sm text-[#627653]">
              Actief: <strong>{activeSeason.name}</strong> ({activeSeason.quarter} {activeSeason.year})
            </div>
          )}
          <a href="/signage/display?screenId=menu" target="_blank" rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#627653] text-white text-sm hover:bg-[#627653]/80 transition-colors">
            <Eye className="w-4 h-4" /> Preview Signage
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Seizoenen", value: seasons?.length || 0, icon: Calendar, color: "#627653" },
          { label: "Gerechten", value: allItems?.length || 0, icon: ChefHat, color: "#b8a472" },
          { label: "In Seizoen", value: seasonItems?.length || 0, icon: Star, color: "#627653" },
          { label: "Arrangementen", value: arrangements?.length || 0, icon: Package, color: "#b8a472" },
        ].map((stat) => (
          <div key={stat.label} className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
              <span className="text-xs text-white/40 uppercase tracking-wider">{stat.label}</span>
            </div>
            <p className="text-2xl font-semibold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/[0.03] rounded-lg p-1 w-fit">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-all ${
              activeTab === tab.id ? "bg-[#627653] text-white" : "text-white/50 hover:text-white/70"
            }`}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ SEASONS TAB ═══ */}
      {activeTab === "seasons" && (
        <div className="space-y-4">
          {seasons?.map((season: MenuSeason) => (
            <div key={season.id}
              className={`glass-card rounded-xl p-5 border-l-4 transition-all cursor-pointer ${
                season.isActive ? "border-l-[#627653]" : "border-l-transparent"
              } ${selectedSeasonId === season.id ? "ring-1 ring-[#627653]/50" : ""}`}
              onClick={() => setSelectedSeasonId(season.id)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="text-lg font-medium text-white">{season.name}</h3>
                    <p className="text-sm text-white/40">{season.quarter} {season.year} &middot; {new Date(Number(season.startDate)).toLocaleDateString('nl-NL')} — {new Date(Number(season.endDate)).toLocaleDateString('nl-NL')}</p>
                  </div>
                  {season.isActive && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#627653]/20 text-[#627653]">
                      Actief
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); cloneSeason.mutate({
                    sourceSeasonId: season.id,
                    year: season.year,
                    quarter: (season.quarter === "Q4" ? "Q1" : `Q${parseInt(season.quarter[1]) + 1}`) as Quarter,
                    name: `Kopie van ${season.name}`,
                    startDate: season.endDate,
                    endDate: season.endDate,
                  }); }}
                    className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/70" title="Kloon seizoen">
                    <Copy className="w-4 h-4" />
                  </button>
                  {!season.isActive && (
                    <button onClick={(e) => { e.stopPropagation(); activateSeason.mutate({ id: season.id }); }}
                      className="px-3 py-1.5 rounded-lg bg-[#627653]/20 text-[#627653] text-sm hover:bg-[#627653]/30">
                      Activeren
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ MENU ITEMS TAB ═══ */}
      {activeTab === "items" && (
        <div className="grid grid-cols-3 gap-6">
          {/* Left: Available items (drag source) */}
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
              Gerechten Database
            </h3>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input type="text" placeholder="Zoek gerecht..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#627653]/50" />
            </div>
            <div className="space-y-1 max-h-[600px] overflow-y-auto">
              {availableItems.map((item: MenuItem) => (
                <div key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(item)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/[0.05] cursor-grab active:cursor-grabbing group">
                  <GripVertical className="w-3 h-3 text-white/20 group-hover:text-white/40" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{item.name}</p>
                    {item.subtitle && <p className="text-[11px] text-white/30 truncate">{item.subtitle}</p>}
                  </div>
                  {item.priceEur && <span className="text-xs text-[#b8a472] shrink-0">€{parseFloat(item.priceEur).toFixed(2)}</span>}
                  <button onClick={() => effectiveSeasonId && addSeasonItem.mutate({ seasonId: effectiveSeasonId, menuItemId: item.id })}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[#627653]/20">
                    <Plus className="w-3 h-3 text-[#627653]" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Season items (drop target) */}
          <div className="col-span-2 glass-card rounded-xl p-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDropToSeason}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
                {selectedSeason ? `${selectedSeason.name} — Menukaart` : "Selecteer een seizoen"}
              </h3>
              <span className="text-xs text-white/30">{seasonItems?.length || 0} gerechten</span>
            </div>

            {Object.entries(groupedItems).map(([category, items]) => (
              <div key={category} className="mb-4">
                <button onClick={() => toggleCategory(category)}
                  className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg hover:bg-white/[0.03] mb-1">
                  {expandedCategories.has(category) ? <ChevronDown className="w-4 h-4 text-[#627653]" /> : <ChevronRight className="w-4 h-4 text-white/40" />}
                  <span className="text-sm font-semibold text-[#b8a472] uppercase tracking-wider">{category}</span>
                  <span className="text-[10px] text-white/30 ml-auto">{items.length}</span>
                </button>
                {expandedCategories.has(category) && (
                  <div className="space-y-1 ml-6">
                    {items.map((item: SeasonItem) => (
                      <div key={item.seasonItemId}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg group transition-all ${
                          item.isAvailable ? "hover:bg-white/[0.03]" : "opacity-40 bg-white/[0.02]"
                        }`}>
                        <GripVertical className="w-3 h-3 text-white/20 cursor-grab" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-white">{item.name}</p>
                            {item.isVegan && <Leaf className="w-3 h-3 text-green-500" />}
                            {item.isVegetarian && <Leaf className="w-3 h-3 text-green-400" />}
                            {item.isGlutenFree && <Wheat className="w-3 h-3 text-amber-400" />}
                          </div>
                          {item.subtitle && <p className="text-[11px] text-white/30 truncate">{item.subtitle}</p>}
                        </div>
                        <span className="text-sm font-mono text-[#b8a472]">
                          €{parseFloat(item.priceEur ?? "0").toFixed(2)}
                          {item.priceLargeEur && <span className="text-white/30"> / €{parseFloat(item.priceLargeEur ?? "0").toFixed(2)}</span>}
                        </span>
                        <button onClick={() => toggleAvailability.mutate({ id: item.seasonItemId, isAvailable: !item.isAvailable })}
                          className="p-1 rounded hover:bg-white/5" title={item.isAvailable ? "Verbergen" : "Tonen"}>
                          {item.isAvailable ? <Eye className="w-3.5 h-3.5 text-white/40" /> : <EyeOff className="w-3.5 h-3.5 text-white/20" />}
                        </button>
                        <button onClick={() => removeSeasonItem.mutate({ id: item.seasonItemId })}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10">
                          <Trash2 className="w-3.5 h-3.5 text-red-400/60" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {(!seasonItems || seasonItems.length === 0) && (
              <div className="text-center py-16 text-white/20">
                <ChefHat className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-light">Sleep gerechten hierheen</p>
                <p className="text-sm mt-1">of selecteer eerst een seizoen</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ ARRANGEMENTS TAB ═══ */}
      {activeTab === "arrangements" && (
        <div className="glass-card rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">Arrangement</th>
                <th className="text-right px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">Prijs</th>
                <th className="text-right px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">Member Prijs</th>
                <th className="text-center px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">Actief</th>
              </tr>
            </thead>
            <tbody>
              {arrangements?.map((arr: MenuArrangement) => (
                <tr key={arr.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-5 py-3">
                    <p className="text-sm text-white">{arr.name}</p>
                    {arr.description && <p className="text-[11px] text-white/30">{arr.description}</p>}
                  </td>
                  <td className="px-5 py-3 text-right text-sm font-mono text-[#b8a472]">
                    €{parseFloat(arr.priceEur).toFixed(2)}
                  </td>
                  <td className="px-5 py-3 text-right text-sm font-mono text-[#627653]">
                    {arr.memberPriceEur ? `€${parseFloat(arr.memberPriceEur).toFixed(2)}` : "—"}
                  </td>
                  <td className="px-5 py-3 text-center">
                    {arr.isActive ? (
                      <span className="inline-flex items-center gap-1 text-[#627653]"><Check className="w-3 h-3" /></span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-white/20"><X className="w-3 h-3" /></span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
