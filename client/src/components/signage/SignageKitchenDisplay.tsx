/**
 * SignageKitchenDisplay — Exact Cafe La55 menu styling
 * Dark brown bg (#2d1f14), cream text (#f5e6d0), copper accents (#c4a68a)
 * Two-column layout with organic S-curve dividers
 * Supports both portrait (9:16) and landscape (16:9)
 */
import { trpc } from "@/lib/trpc";
import { BRAND } from "@/lib/brand";
import { useState, useEffect, useMemo } from "react";
import { Leaf, Wheat, UtensilsCrossed, Coffee } from "lucide-react";

interface Props {
  config: any;
  time: Date;
  locationId: number;
  onRefresh: () => void;
  isDemo?: boolean;
  orientation?: "portrait" | "landscape";
}

// ─── Exact menu items from Cafe La55 PDF ─────────────────────────────
const DEMO_FOOD = {
  sandwiches: [
    { name: "Goat", price: "7.75" },
    { name: "Smashed Avocado", price: "7.75", isVegetarian: true },
    { name: "York", price: "6.95" },
    { name: "Smoked Chicken", price: "7.50" },
    { name: "Tuna", price: "6.95" },
    { name: "Egg Salad", price: "5.95", isVegetarian: true },
    { name: "Old Cheese", price: "7.50", isVegetarian: true },
    { name: "Chorizo", price: "7.75" },
  ],
  "salad bowls": [
    { name: "Dolce Vita", price: "7.50", priceL: "10.25" },
    { name: "Smoked Beef", price: "7.50", priceL: "10.25" },
    { name: "Beetroot & Goat Cheese", price: "7.50", priceL: "10.25", isVegetarian: true },
  ],
  soup: [
    { name: "Day Special", price: "3.95", description: "Dagverse soep — recept tegen eenzaamheid" },
  ],
  wraps: [
    { name: "Avocado", price: "7.25", isVegan: true },
    { name: "Tuna", price: "7.50" },
  ],
  toasted: [
    { name: "Just Say Cheese", price: "6.25", isVegetarian: true },
    { name: "Not So Cheezy", price: "6.25", isVegan: true },
    { name: "Toasted Brie", price: "7.50", isVegetarian: true },
    { name: "Tuna Melt", price: "6.95" },
  ],
  breakfast: [
    { name: "Croissant", price: "2.95" },
    { name: "Yoghurt Fruit Farm", price: "4.24", isVegetarian: true },
    { name: "Overnight Oats", price: "4.95", isVegan: true },
    { name: "Cinnamon Swirl", price: "3.75" },
  ],
  sweets: [
    { name: "Cake", price: "3.25" },
    { name: "Cookies", price: "2.75" },
    { name: "Brownie", price: "2.95" },
    { name: "Bananabread", price: "3.75" },
    { name: "Date-Mueslibar", price: "3.95" },
    { name: "Bread Pudding", price: "2.75" },
    { name: "Muffin", price: "3.75" },
  ],
};

const DEMO_DRINKS = {
  smoothies: [
    { name: "Green Machine", description: "Cucumber | Avocado | Apple | Spinach", price: "3.75" },
    { name: "Yellow Star", description: "Mango | Orange | Mint", price: "3.75" },
    { name: "Red Devil", description: "Strawberry | Beet | Banana", price: "3.75" },
    { name: "Tropical Carrot", description: "Carrot | Mango | Ginger", price: "3.75" },
    { name: "Blue Glow", description: "Blueberry | Ginger | Beet | Almond Milk", price: "3.75" },
  ],
  "warm drinks": [
    { name: "Americano", price: "2.95" },
    { name: "Espresso", price: "2.75" },
    { name: "Cappuccino", price: "3.25" },
    { name: "Latte", price: "3.35" },
    { name: "Latte Macchiato", price: "3.35" },
    { name: "Tea", price: "2.95" },
    { name: "Chocolate Milk", price: "3.25" },
  ],
  "cold drinks": [
    { name: "Fritz Kola | Sinas", price: "2.95" },
    { name: "Bos Ice Tea", price: "2.95" },
    { name: "Fever Tree Tonic", price: "2.95" },
    { name: "Orange/Apple Juice", price: "2.95" },
    { name: "Bundaberg Gingerbeer", price: "4.25" },
    { name: "Soof", price: "2.95" },
    { name: "Kombucha", price: "4.25" },
  ],
};

// ─── Category mapping from DB to display ─────────────────────────────
const DB_TO_FOOD_CATEGORY: Record<string, string> = {
  breakfast: "breakfast", lunch: "sandwiches", dinner: "specials",
  snack: "sweets", soup: "soup", salad: "salad bowls",
  sandwich: "sandwiches", special: "specials",
};

// ─── SVG Wave Divider ────────────────────────────────────────────────
function WaveDivider({ vertical = false }: { vertical?: boolean }) {
  if (vertical) {
    return (
      <svg viewBox="0 0 40 600" className="h-full w-8 shrink-0 opacity-20" preserveAspectRatio="none">
        <path d="M20 0 C35 100, 5 200, 20 300 C35 400, 5 500, 20 600" stroke="#c4a68a" strokeWidth="1.5" fill="none" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 600 40" className="w-full h-6 shrink-0 opacity-20" preserveAspectRatio="none">
      <path d="M0 20 C100 5, 200 35, 300 20 C400 5, 500 35, 600 20" stroke="#c4a68a" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

// ─── Menu Section ────────────────────────────────────────────────────
function MenuSection({ title, items, showSizes = false, compact = false }: {
  title: string;
  items: any[];
  showSizes?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "mb-3" : "mb-5"}>
      <h3 className={`font-bold uppercase tracking-[3px] text-[#f5e6d0] ${compact ? "text-[10px] mb-1.5" : "text-[11px] mb-2"}`}>
        {title}
      </h3>
      {showSizes && (
        <div className="flex justify-end gap-6 mb-1 pr-1">
          <span className="text-[8px] text-[#c4a68a]/50 tracking-[2px] uppercase">Klein</span>
          <span className="text-[8px] text-[#c4a68a]/50 tracking-[2px] uppercase">Groot</span>
        </div>
      )}
      <div className={compact ? "space-y-0.5" : "space-y-1"}>
        {items.map((item, i) => (
          <div key={i}>
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className={`font-semibold text-[#f5e6d0] truncate ${compact ? "text-[11px]" : "text-[13px]"}`}>
                  {item.name}
                </span>
                {item.isVegan && <Leaf className="w-2.5 h-2.5 text-green-500 shrink-0" />}
                {item.isVegetarian && !item.isVegan && <Leaf className="w-2.5 h-2.5 text-green-400/60 shrink-0" />}
                {item.isGlutenFree && <Wheat className="w-2.5 h-2.5 text-amber-400 shrink-0" />}
              </div>
              {showSizes && item.priceL ? (
                <div className="flex gap-6 shrink-0">
                  <span className={`text-[#c4a68a] tabular-nums ${compact ? "text-[10px]" : "text-[12px]"}`}>€{item.price}</span>
                  <span className={`text-[#c4a68a] tabular-nums ${compact ? "text-[10px]" : "text-[12px]"}`}>€{item.priceL}</span>
                </div>
              ) : (
                <span className={`text-[#c4a68a] tabular-nums shrink-0 ${compact ? "text-[10px]" : "text-[12px]"}`}>
                  €{item.price}
                </span>
              )}
            </div>
            {item.description && (
              <p className={`text-[#c4a68a]/40 leading-tight mt-0.5 ${compact ? "text-[8px]" : "text-[9px]"}`}>
                {item.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SignageKitchenDisplay({ config, time, locationId, onRefresh, isDemo, orientation = "portrait" }: Props) {
  const { data: menuItems } = trpc.signageDisplay.getKitchenMenu.useQuery(
    { locationId },
    { enabled: !isDemo, refetchInterval: 300000 }
  );

  const [clock, setClock] = useState(time);
  const [section, setSection] = useState<"food" | "drinks">("food");

  useEffect(() => {
    const interval = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-rotate between food and drinks every 20s
  useEffect(() => {
    const interval = setInterval(() => {
      setSection(prev => prev === "food" ? "drinks" : "food");
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  // Build menu data from DB or demo
  const foodData = useMemo(() => {
    if (isDemo) return DEMO_FOOD;
    const grouped: Record<string, any[]> = {};
    (menuItems || []).forEach((item: any) => {
      const cat = DB_TO_FOOD_CATEGORY[item.category] || item.category;
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    });
    return grouped;
  }, [isDemo, menuItems]);

  const drinksData = useMemo(() => {
    if (isDemo) return DEMO_DRINKS;
    // Filter drink items from DB
    const drinkItems = (menuItems || []).filter((item: any) => item.category === "drink");
    if (drinkItems.length === 0) return DEMO_DRINKS;
    return { drinks: drinkItems };
  }, [isDemo, menuItems]);

  const timeStr = clock.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
  const isLandscape = orientation === "landscape";
  const compact = !isLandscape; // portrait needs smaller text

  return (
    <div className="fixed inset-0 overflow-hidden flex flex-col" style={{
      background: "linear-gradient(180deg, #2d1f14 0%, #1a1209 100%)",
      fontFamily: "'Montserrat', 'Inter', sans-serif",
    }}>
      {/* ═══ HEADER ═══ */}
      <div className={`flex items-center justify-between shrink-0 ${isLandscape ? "px-12 py-5" : "px-6 py-4"}`}>
        <div className="flex items-center gap-3">
          <UtensilsCrossed className={`text-[#c4a68a]/60 ${isLandscape ? "w-6 h-6" : "w-5 h-5"}`} />
          <div>
            <h1 className={`font-black uppercase tracking-[4px] text-[#f5e6d0] ${isLandscape ? "text-lg" : "text-sm"}`}>
              Mr.Green's Homemade Menu
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Section toggle indicator */}
          <div className="flex gap-1">
            <div className={`w-2 h-2 rounded-full transition-all ${section === "food" ? "bg-[#c4a68a]" : "bg-[#c4a68a]/20"}`} />
            <div className={`w-2 h-2 rounded-full transition-all ${section === "drinks" ? "bg-[#c4a68a]" : "bg-[#c4a68a]/20"}`} />
          </div>
          <span className={`font-extralight text-[#f5e6d0]/60 tabular-nums ${isLandscape ? "text-2xl" : "text-lg"}`}>{timeStr}</span>
        </div>
      </div>

      <WaveDivider />

      {/* ═══ MAIN CONTENT ═══ */}
      <div className={`flex-1 min-h-0 overflow-hidden ${isLandscape ? "px-12 py-4" : "px-5 py-3"}`}>
        {section === "food" ? (
          /* ─── FOOD SECTION ─── */
          <div className={`h-full flex ${isLandscape ? "gap-6" : "gap-3"}`}>
            {/* Left column */}
            <div className="flex-1 overflow-hidden">
              {Object.entries(foodData).slice(0, isLandscape ? 4 : 3).map(([cat, items]) => (
                <MenuSection
                  key={cat}
                  title={cat}
                  items={items}
                  showSizes={cat === "salad bowls"}
                  compact={compact}
                />
              ))}
            </div>

            <WaveDivider vertical />

            {/* Right column */}
            <div className="flex-1 overflow-hidden">
              {Object.entries(foodData).slice(isLandscape ? 4 : 3).map(([cat, items]) => (
                <MenuSection
                  key={cat}
                  title={cat}
                  items={items}
                  compact={compact}
                />
              ))}
            </div>
          </div>
        ) : (
          /* ─── DRINKS SECTION ─── */
          <div className={`h-full flex ${isLandscape ? "gap-6" : "gap-3"}`}>
            {/* Left column - Smoothies */}
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center gap-2 mb-4">
                <Coffee className="w-4 h-4 text-[#c4a68a]/60" />
                <h2 className={`font-black uppercase tracking-[4px] text-[#f5e6d0] ${isLandscape ? "text-base" : "text-xs"}`}>
                  Mr.Green's Drinks
                </h2>
              </div>
              {Object.entries(drinksData).slice(0, isLandscape ? 2 : 1).map(([cat, items]) => (
                <MenuSection key={cat} title={cat} items={items as any[]} compact={compact} />
              ))}
            </div>

            <WaveDivider vertical />

            {/* Right column - Hot & Cold */}
            <div className="flex-1 overflow-hidden">
              {Object.entries(drinksData).slice(isLandscape ? 2 : 1).map(([cat, items]) => (
                <MenuSection key={cat} title={cat} items={items as any[]} compact={compact} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══ FOOTER ═══ */}
      <div className={`shrink-0 border-t border-[#c4a68a]/10 ${isLandscape ? "px-12 py-4" : "px-5 py-3"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-[10px] text-[#f5e6d0]/25">
            <span className="flex items-center gap-1"><Leaf className="w-2.5 h-2.5 text-green-500" /> Vegan</span>
            <span className="flex items-center gap-1"><Leaf className="w-2.5 h-2.5 text-green-400/60" /> Vegetarisch</span>
            <span className="flex items-center gap-1"><Wheat className="w-2.5 h-2.5 text-amber-400" /> Glutenvrij</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[9px] text-[#c4a68a]/30">Allergenen? Vraag de BOSS</span>
            <span className="text-[9px] text-[#c4a68a]/20">•</span>
            <span className="text-[9px] text-[#c4a68a]/30">Prijzen incl. BTW</span>
          </div>
        </div>
      </div>

      {/* Demo badge */}
      {isDemo && (
        <div className="absolute top-3 right-3 bg-amber-500/20 text-amber-300 text-[8px] px-2 py-0.5 rounded-full border border-amber-500/20">
          Demo modus
        </div>
      )}
    </div>
  );
}
