import { trpc } from "@/lib/trpc";
import SignageLayout from "./SignageLayout";
import { ChefHat, Leaf, Wheat, Clock } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  breakfast: "Ontbijt", lunch: "Lunch", dinner: "Diner", snack: "Snack",
  drink: "Dranken", soup: "Soep", salad: "Salade", sandwich: "Broodjes", special: "Speciaal",
};

const CATEGORY_COLORS: Record<string, string> = {
  breakfast: "#f59e0b", lunch: "#627653", dinner: "#8B6914", snack: "#B87333",
  drink: "#42a5f5", soup: "#e74c3c", salad: "#66bb6a", sandwich: "#c4a68a", special: "#ab47bc",
};

interface Props {
  config: any;
  time: Date;
  locationId: number;
  onRefresh: () => void;
  isDemo?: boolean;
}

const DEMO_MENU = [
  { name: "Avocado Toast", description: "Sourdough, avocado, poached egg, chili flakes", category: "breakfast", price: "6.50", isVegetarian: true },
  { name: "Granola Bowl", description: "Yoghurt, granola, vers fruit, honing", category: "breakfast", price: "5.50", isVegetarian: true, isVegan: false },
  { name: "Croissant", description: "Vers gebakken, boter of jam", category: "breakfast", price: "3.50" },
  { name: "Caesar Salad", description: "Romaine, parmezaan, croutons, kip", category: "salad", price: "9.50" },
  { name: "Groene Salade", description: "Seizoensgroenten, feta, walnoten", category: "salad", price: "8.50", isVegetarian: true },
  { name: "Oma's Soep", description: "Dagverse soep — recept tegen eenzaamheid", category: "soup", price: "4.50", isVegetarian: true },
  { name: "Tomatensoep", description: "Huisgemaakt met basilicum", category: "soup", price: "4.00", isVegan: true },
  { name: "Club Sandwich", description: "Kip, bacon, ei, sla, tomaat", category: "sandwich", price: "8.50" },
  { name: "Veggie Wrap", description: "Hummus, gegrilde groenten, rucola", category: "sandwich", price: "7.50", isVegetarian: true, isVegan: true },
  { name: "Tosti Mr. Green", description: "Kaas, ham, tomaat op zuurdesem", category: "sandwich", price: "6.00" },
  { name: "Pasta Pesto", description: "Penne, groene pesto, pijnboompitten", category: "lunch", price: "10.50", isVegetarian: true },
  { name: "Bowl of the Day", description: "Wisselend — vraag de BOSS", category: "special", price: "11.00" },
];

export default function SignageKitchenDisplay({ config, time, locationId, onRefresh, isDemo }: Props) {
  const { data: menuItems } = trpc.signageDisplay.getKitchenMenu.useQuery(
    { locationId },
    { enabled: !isDemo, refetchInterval: 300000 }
  );

  const items = isDemo ? DEMO_MENU : (menuItems || []);
  const hour = time.getHours();
  const mealPeriod = hour < 11 ? "breakfast" : hour < 15 ? "lunch" : "dinner";
  const mealLabel = mealPeriod === "breakfast" ? "Ontbijt" : mealPeriod === "lunch" ? "Lunch" : "Diner";

  // Group items by category
  const grouped: Record<string, any[]> = {};
  items.forEach((item: any) => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });

  const categoryOrder = Object.keys(grouped).sort((a, b) => {
    if (a === mealPeriod) return -1;
    if (b === mealPeriod) return 1;
    return 0;
  });

  return (
    <SignageLayout theme="brown" locationName={config.location?.name} time={time} footerText="Daily fresh homemade" isDemo={isDemo}>
      <div className="h-full flex flex-col gap-4">
        {/* Title */}
        <div className="flex items-end justify-between shrink-0">
          <div>
            <div className="text-[9px] tracking-[5px] uppercase text-[#c4a68a]/60 font-semibold mb-2">Kitchen</div>
            <h2 className="text-[clamp(24px,4vw,36px)] font-black uppercase tracking-tight leading-none text-white">
              Daily Fresh<br />Homemade
            </h2>
          </div>
          <div className="flex items-center gap-2 bg-white/[0.04] px-3 py-1.5 rounded-full">
            <Clock className="w-3.5 h-3.5 text-[#c4a68a]" />
            <span className="text-[11px] text-[#c4a68a]">{mealLabel}</span>
          </div>
        </div>

        {/* Menu Grid */}
        <div className="flex-1 overflow-hidden">
          {categoryOrder.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 h-full auto-rows-min overflow-y-auto pr-1" style={{ scrollbarWidth: "none" }}>
              {categoryOrder.map((category) => (
                <div key={category} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 overflow-hidden">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/[0.06]">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${CATEGORY_COLORS[category] || "#627653"}20` }}>
                      <ChefHat className="w-3.5 h-3.5" style={{ color: CATEGORY_COLORS[category] || "#627653" }} />
                    </div>
                    <h3 className="text-[11px] font-semibold tracking-[2px] uppercase" style={{ color: CATEGORY_COLORS[category] || "#627653" }}>
                      {CATEGORY_LABELS[category] || category}
                    </h3>
                  </div>
                  <div className="space-y-2.5">
                    {grouped[category].slice(0, 5).map((item: any, i: number) => (
                      <div key={i} className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-[13px] font-medium truncate">{item.name}</p>
                            {item.isVegan && <Leaf className="w-3 h-3 text-green-500 shrink-0" />}
                            {item.isVegetarian && !item.isVegan && <Leaf className="w-3 h-3 text-green-400 shrink-0" />}
                            {item.isGlutenFree && <Wheat className="w-3 h-3 text-amber-400 shrink-0" />}
                          </div>
                          {item.description && (
                            <p className="text-[10px] text-white/30 mt-0.5 line-clamp-1">{item.description}</p>
                          )}
                        </div>
                        {item.price && (
                          <span className="text-[12px] font-mono text-[#c4a68a] shrink-0">\u20ac{parseFloat(item.price).toFixed(2)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <ChefHat className="w-10 h-10 text-[#c4a68a]/15 mx-auto mb-4" />
                <p className="text-base font-light text-white/25">Menu wordt geladen...</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom info bar */}
        <div className="grid grid-cols-3 gap-2 shrink-0">
          <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-2.5 text-center">
            <p className="text-[9px] text-[#c4a68a]/60 tracking-[2px] uppercase mb-0.5">Allergenen?</p>
            <p className="text-[10px] text-white/35">Vraag het de BOSS</p>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-2.5 text-center">
            <p className="text-[9px] text-[#c4a68a]/60 tracking-[2px] uppercase mb-0.5">Oma's Soep</p>
            <p className="text-[10px] text-white/35">Recept tegen eenzaamheid</p>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-2.5 text-center">
            <p className="text-[9px] text-[#c4a68a]/60 tracking-[2px] uppercase mb-0.5">Feedback?</p>
            <p className="text-[10px] text-white/35">Scan de QR code</p>
          </div>
        </div>
      </div>
    </SignageLayout>
  );
}
