import { trpc } from "@/lib/trpc";
import SignageLayout from "./SignageLayout";
import { ChefHat, Leaf, Wheat, Clock } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  breakfast: "Ontbijt",
  lunch: "Lunch",
  dinner: "Diner",
  snack: "Snack",
  drink: "Dranken",
  soup: "Soep",
  salad: "Salade",
  sandwich: "Broodjes",
  special: "Speciaal",
};

const CATEGORY_COLORS: Record<string, string> = {
  breakfast: "#f59e0b",
  lunch: "#627653",
  dinner: "#8B6914",
  snack: "#B87333",
  drink: "#42a5f5",
  soup: "#e74c3c",
  salad: "#66bb6a",
  sandwich: "#c4a68a",
  special: "#ab47bc",
};

interface Props {
  config: any;
  time: Date;
  locationId: number;
  onRefresh: () => void;
}

export default function SignageKitchenDisplay({ config, time, locationId, onRefresh }: Props) {
  const { data: menuItems } = trpc.signageDisplay.getKitchenMenu.useQuery(
    { locationId },
    { refetchInterval: 300000 }
  );

  const hour = time.getHours();
  const mealPeriod = hour < 11 ? "breakfast" : hour < 15 ? "lunch" : "dinner";
  const mealLabel = mealPeriod === "breakfast" ? "Ontbijt" : mealPeriod === "lunch" ? "Lunch" : "Diner";

  // Group items by category
  const grouped: Record<string, any[]> = {};
  (menuItems || []).forEach((item: any) => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });

  // Prioritize current meal period
  const categoryOrder = Object.keys(grouped).sort((a, b) => {
    if (a === mealPeriod) return -1;
    if (b === mealPeriod) return 1;
    return 0;
  });

  return (
    <SignageLayout
      theme="brown"
      locationName={config.location?.name}
      time={time}
      footerText="Eat like a king"
    >
      <div className="h-full flex flex-col gap-5">
        {/* Title */}
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[10px] tracking-[4px] uppercase text-[#c4a68a]/60 font-semibold mb-2">
              Menukaart — {mealLabel}
            </div>
            <h2 className="text-3xl font-extralight">
              Daily Fresh <strong className="font-semibold">Homemade.</strong>
            </h2>
          </div>
          <div className="flex items-center gap-2 text-white/30">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{mealLabel} tot {mealPeriod === "breakfast" ? "11:00" : mealPeriod === "lunch" ? "15:00" : "19:00"}</span>
          </div>
        </div>

        {/* Menu Grid */}
        <div className="flex-1 overflow-hidden">
          {categoryOrder.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 h-full auto-rows-min">
              {categoryOrder.map((category) => (
                <div key={category} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 overflow-hidden">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${CATEGORY_COLORS[category] || "#627653"}20` }}>
                      <ChefHat className="w-4 h-4" style={{ color: CATEGORY_COLORS[category] || "#627653" }} />
                    </div>
                    <h3 className="text-sm font-semibold tracking-[2px] uppercase" style={{ color: CATEGORY_COLORS[category] || "#627653" }}>
                      {CATEGORY_LABELS[category] || category}
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {grouped[category].slice(0, 5).map((item: any, i: number) => (
                      <div key={item.id || i} className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-light">{item.name}</p>
                            {item.isVegan && <Leaf className="w-3 h-3 text-green-500" />}
                            {item.isVegetarian && <Leaf className="w-3 h-3 text-green-400" />}
                            {item.isGlutenFree && <Wheat className="w-3 h-3 text-amber-400" />}
                          </div>
                          {item.description && (
                            <p className="text-[11px] text-white/30 mt-0.5 line-clamp-1">{item.description}</p>
                          )}
                        </div>
                        {item.price && (
                          <span className="text-sm font-mono text-[#c4a68a] shrink-0">
                            €{parseFloat(item.price).toFixed(2)}
                          </span>
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
                <ChefHat className="w-12 h-12 text-[#c4a68a]/20 mx-auto mb-4" />
                <p className="text-lg font-light text-white/30">Menu wordt geladen...</p>
                <p className="text-sm text-white/15 mt-1">Neem contact op met de BOSS voor vragen</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom info bar */}
        <div className="grid grid-cols-3 gap-3 shrink-0">
          <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3 text-center">
            <p className="text-[10px] text-[#c4a68a]/60 tracking-[2px] uppercase mb-1">Allergenen?</p>
            <p className="text-[11px] text-white/40">Vraag het de BOSS</p>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3 text-center">
            <p className="text-[10px] text-[#c4a68a]/60 tracking-[2px] uppercase mb-1">Recept tegen eenzaamheid</p>
            <p className="text-[11px] text-white/40">Oma's Soep Pilot</p>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3 text-center">
            <p className="text-[10px] text-[#c4a68a]/60 tracking-[2px] uppercase mb-1">Feedback?</p>
            <p className="text-[11px] text-white/40">Scan de QR code</p>
          </div>
        </div>
      </div>
    </SignageLayout>
  );
}
