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

  // Exact PDF split: left categories (sandwiches, salad bowls) vs right categories (rest)
  const leftFoodCats = ["sandwiches", "salad bowls"];
  const rightFoodCats = ["soup", "wraps", "toasted", "breakfast", "sweets"];
  const leftDrinkCats = ["smoothies"];
  const rightDrinkCats = ["warm drinks", "cold drinks"];

  const leftFoodEntries = Object.entries(foodData).filter(([cat]) => leftFoodCats.includes(cat));
  const rightFoodEntries = Object.entries(foodData).filter(([cat]) => rightFoodCats.includes(cat));
  const leftDrinkEntries = Object.entries(drinksData).filter(([cat]) => leftDrinkCats.includes(cat));
  const rightDrinkEntries = Object.entries(drinksData).filter(([cat]) => rightDrinkCats.includes(cat));

  if (isLandscape) {
    // ═══ LANDSCAPE: keep existing horizontal layout ═══
    return (
      <div className="fixed inset-0 overflow-hidden flex flex-col" style={{
        background: "linear-gradient(180deg, #2d1f14 0%, #1a1209 100%)",
        fontFamily: "'Montserrat', 'Inter', sans-serif",
      }}>
        <div className="flex items-center justify-between shrink-0 px-12 py-5">
          <div className="flex items-center gap-3">
            <UtensilsCrossed className="w-6 h-6 text-[#c4a68a]/60" />
            <h1 className="font-black uppercase tracking-[4px] text-[#f5e6d0] text-lg">Mr.Green's Homemade Menu</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              <div className={`w-2 h-2 rounded-full transition-all ${section === "food" ? "bg-[#c4a68a]" : "bg-[#c4a68a]/20"}`} />
              <div className={`w-2 h-2 rounded-full transition-all ${section === "drinks" ? "bg-[#c4a68a]" : "bg-[#c4a68a]/20"}`} />
            </div>
            <span className="font-extralight text-[#f5e6d0]/60 tabular-nums text-2xl">{timeStr}</span>
          </div>
        </div>
        <WaveDivider />
        <div className="flex-1 min-h-0 overflow-hidden px-12 py-4">
          {section === "food" ? (
            <div className="h-full flex gap-6">
              <div className="flex-1 overflow-hidden">
                {Object.entries(foodData).slice(0, 4).map(([cat, items]) => (
                  <MenuSection key={cat} title={cat} items={items} showSizes={cat === "salad bowls"} compact={false} />
                ))}
              </div>
              <WaveDivider vertical />
              <div className="flex-1 overflow-hidden">
                {Object.entries(foodData).slice(4).map(([cat, items]) => (
                  <MenuSection key={cat} title={cat} items={items} compact={false} />
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex gap-6">
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                  <Coffee className="w-4 h-4 text-[#c4a68a]/60" />
                  <h2 className="font-black uppercase tracking-[4px] text-[#f5e6d0] text-base">Mr.Green's Drinks</h2>
                </div>
                {Object.entries(drinksData).slice(0, 2).map(([cat, items]) => (
                  <MenuSection key={cat} title={cat} items={items as any[]} compact={false} />
                ))}
              </div>
              <WaveDivider vertical />
              <div className="flex-1 overflow-hidden">
                {Object.entries(drinksData).slice(2).map(([cat, items]) => (
                  <MenuSection key={cat} title={cat} items={items as any[]} compact={false} />
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="shrink-0 border-t border-[#c4a68a]/10 px-12 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-[10px] text-[#f5e6d0]/25">
              <span className="flex items-center gap-1"><Leaf className="w-2.5 h-2.5 text-green-500" /> Vegan</span>
              <span className="flex items-center gap-1"><Leaf className="w-2.5 h-2.5 text-green-400/60" /> Vegetarisch</span>
              <span className="flex items-center gap-1"><Wheat className="w-2.5 h-2.5 text-amber-400" /> Glutenvrij</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[9px] text-[#c4a68a]/30">Allergenen? Vraag de BOSS</span>
              <span className="text-[9px] text-[#c4a68a]/20">·</span>
              <span className="text-[9px] text-[#c4a68a]/30">Prijzen incl. BTW</span>
            </div>
          </div>
        </div>
        {isDemo && (
          <div className="absolute top-3 right-3 bg-amber-500/20 text-amber-300 text-[8px] px-2 py-0.5 rounded-full border border-amber-500/20">Demo modus</div>
        )}
      </div>
    );
  }

  // ═══ PORTRAIT: Exact PDF split-panel layout with curved corners ═══
  return (
    <div className="fixed inset-0 overflow-hidden flex" style={{
      fontFamily: "'Montserrat', 'Inter', sans-serif",
    }}>
      {section === "food" ? (
        <>
          {/* ─── LEFT PANEL (food: lighter brown with curved corner) ─── */}
          <div className="relative flex flex-col overflow-hidden" style={{ width: "42%", background: "#6B4C3A" }}>
            {/* Curved bottom-right overlay */}
            <div className="absolute top-0 right-0 bottom-0 w-[30%]" style={{
              background: "#6B4C3A",
              borderRadius: "0 0 0 50%",
              transform: "translateX(50%)",
              zIndex: 1,
            }} />
            <div className="relative z-10 flex flex-col h-full p-[12%] pt-[8%]">
              {/* Croissant icon */}
              <svg viewBox="0 0 60 50" className="w-[16%] mb-[4%] opacity-85">
                <path d="M30 5 C20 5 10 12 8 22 C6 32 10 40 18 44 L22 36 C18 34 15 28 16 22 C17 16 22 12 30 12 C38 12 43 16 44 22 C45 28 42 34 38 36 L42 44 C50 40 54 32 52 22 C50 12 40 5 30 5Z" fill="#f5e6d0" opacity="0.85"/>
                <path d="M22 36 L18 44 C22 46 26 47 30 47 C34 47 38 46 42 44 L38 36 C35 38 32 39 30 39 C28 39 25 38 22 36Z" fill="#f5e6d0" opacity="0.6"/>
              </svg>
              <h1 className="text-[clamp(16px,4.8vw,28px)] font-black uppercase text-[#f5e6d0] leading-[1.05] tracking-tight mb-[6%]">
                Mr.Green's<br/>Homemade<br/>Menu
              </h1>
              {leftFoodEntries.map(([cat, items]) => (
                <MenuSection key={cat} title={cat} items={items} showSizes={cat === "salad bowls"} compact />
              ))}
            </div>
          </div>
          {/* ─── RIGHT PANEL (food: dark brown) ─── */}
          <div className="flex-1 overflow-auto p-[6%] pl-[8%]" style={{ background: "#2D1F14" }}>
            {rightFoodEntries.map(([cat, items]) => (
              <MenuSection key={cat} title={cat} items={items} compact />
            ))}
          </div>
        </>
      ) : (
        <>
          {/* ─── LEFT PANEL (drinks: dark brown) ─── */}
          <div className="relative flex flex-col overflow-hidden" style={{ width: "42%", background: "#2D1F14" }}>
            <div className="absolute top-0 right-0 bottom-0 w-[30%]" style={{
              background: "#2D1F14",
              borderRadius: "0 0 0 50%",
              transform: "translateX(50%)",
              zIndex: 1,
            }} />
            <div className="relative z-10 flex flex-col h-full p-[12%] pt-[8%]">
              {/* Cup icon */}
              <svg viewBox="0 0 50 50" className="w-[14%] mb-[4%]">
                <path d="M10 15 L10 38 C10 42 15 45 25 45 C35 45 40 42 40 38 L40 15Z" fill="none" stroke="#f5e6d0" strokeWidth="2.5" opacity="0.85"/>
                <path d="M15 8 C15 4 18 4 18 8" fill="none" stroke="#f5e6d0" strokeWidth="1.5" opacity="0.4"/>
                <path d="M23 6 C23 2 26 2 26 6" fill="none" stroke="#f5e6d0" strokeWidth="1.5" opacity="0.4"/>
                <path d="M31 8 C31 4 34 4 34 8" fill="none" stroke="#f5e6d0" strokeWidth="1.5" opacity="0.4"/>
              </svg>
              <h1 className="text-[clamp(16px,4.8vw,28px)] font-black uppercase text-[#f5e6d0] leading-[1.05] tracking-tight mb-[6%]">
                Mr.Green's<br/>Drinks
              </h1>
              <div className="w-8 h-px bg-[#c4a68a]/30 mb-[6%]" />
              {leftDrinkEntries.map(([cat, items]) => (
                <MenuSection key={cat} title={cat} items={items as any[]} compact />
              ))}
            </div>
          </div>
          {/* ─── RIGHT PANEL (drinks: lighter brown) ─── */}
          <div className="flex-1 overflow-auto p-[6%] pl-[8%]" style={{ background: "#6B4C3A" }}>
            {rightDrinkEntries.map(([cat, items]) => (
              <MenuSection key={cat} title={cat} items={items as any[]} compact />
            ))}
          </div>
        </>
      )}

      {/* Overlay: clock + section dots */}
      <div className="absolute top-3 right-3 flex items-center gap-3 z-20">
        <div className="flex gap-1">
          <div className={`w-2 h-2 rounded-full transition-all ${section === "food" ? "bg-[#c4a68a]" : "bg-[#c4a68a]/20"}`} />
          <div className={`w-2 h-2 rounded-full transition-all ${section === "drinks" ? "bg-[#c4a68a]" : "bg-[#c4a68a]/20"}`} />
        </div>
      </div>

      {/* Demo badge */}
      {isDemo && (
        <div className="absolute top-3 left-3 bg-amber-500/20 text-amber-300 text-[8px] px-2 py-0.5 rounded-full border border-amber-500/20 z-20">
          Demo modus
        </div>
      )}
    </div>
  );
}
