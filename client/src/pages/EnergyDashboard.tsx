import { Card, CardContent } from "@/components/ui/card";
import { Zap, TrendingDown, Leaf, AlertCircle } from "lucide-react";

export default function EnergyDashboard() {
  // Demo data
  const energyByLocation = [
    { name: "Amsterdam HQ", consumption: 2840, unit: "kWh" },
    { name: "Rotterdam Office", consumption: 1560, unit: "kWh" },
    { name: "Utrecht Hub", consumption: 1240, unit: "kWh" },
    { name: "The Hague Branch", consumption: 890, unit: "kWh" },
  ];

  const energyByFloor = [
    { floor: "Ground Floor", consumption: 1200, occupancy: 65 },
    { floor: "First Floor", consumption: 1450, occupancy: 78 },
    { floor: "Second Floor", consumption: 980, occupancy: 52 },
    { floor: "Third Floor", consumption: 860, occupancy: 45 },
  ];

  const co2Footprint = [
    { month: "January", emissions: 2.45, reduction: 0 },
    { month: "February", emissions: 2.38, reduction: 3 },
    { month: "March", emissions: 2.31, reduction: 6 },
    { month: "April", emissions: 2.18, reduction: 11 },
  ];

  const benchmarkData = {
    currentUsage: 6530,
    industryBenchmark: 7200,
    efficiency: 91,
    improvement: 8,
  };

  const savingsRecommendations = [
    { title: "HVAC Optimization", savings: "12-15%", priority: "high", description: "Adjust temperature setpoints based on occupancy patterns" },
    { title: "LED Upgrade Phase 2", savings: "8-10%", priority: "medium", description: "Replace remaining T5 fluorescent fixtures" },
    { title: "Smart Scheduling", savings: "5-7%", priority: "medium", description: "Reduce lighting/HVAC during low-occupancy hours" },
    { title: "Equipment Servicing", savings: "3-5%", priority: "low", description: "Maintenance check for aging cooling systems" },
  ];

  const sustainabilityReport = {
    period: "April 2026",
    totalEmissions: 8.75,
    emissionReduction: 2.1,
    renewablePercentage: 42,
    treesEquivalent: 285,
  };

  const maxConsumption = Math.max(...energyByLocation.map(l => l.consumption));
  const maxFloor = Math.max(...energyByFloor.map(f => f.consumption));

  return (
    <div className="space-y-8 p-1">
      {/* Header */}
      <div>
        <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-3">Operations</div>
        <h1 className="text-[clamp(24px,3vw,36px)] font-extralight tracking-[-0.5px]">
          Energy & <strong className="font-semibold">sustainability.</strong>
        </h1>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-white/[0.04]">
        {[
          { label: "Current Consumption", value: "6,530 kWh", icon: Zap, color: "#4a7c8a" },
          { label: "CO2 Emissions", value: "2.18 t/mo", icon: Leaf, color: "#627653" },
          { label: "Efficiency Rating", value: "91%", icon: TrendingDown, color: "#b8a472" },
          { label: "Renewable %", value: "42%", icon: Leaf, color: "#627653" },
        ].map((item, i) => (
          <div key={i} className="bg-[#111] p-5">
            <item.icon className="w-4 h-4 mb-3" style={{ color: item.color }} />
            <div className="text-[10px] font-medium tracking-[2px] uppercase text-[#888] mb-1">{item.label}</div>
            <div className="text-2xl font-extralight">{item.value}</div>
          </div>
        ))}
      </div>

      {/* Energy Consumption by Location */}
      <Card className="bg-[#111] border-white/[0.06]">
        <CardContent className="p-6">
          <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-1">Overview</div>
          <h3 className="text-lg font-extralight mb-6">Energy by <strong className="font-semibold">location.</strong></h3>
          <div className="space-y-4">
            {energyByLocation.map((location, i) => {
              const percentage = (location.consumption / maxConsumption) * 100;
              return (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[13px] font-light">{location.name}</span>
                    <span className="text-[13px] font-light text-[#888]">{location.consumption} {location.unit}</span>
                  </div>
                  <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#4a7c8a] rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Energy by Floor & CO2 Footprint */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-white/[0.04]">
        {/* Energy by Floor */}
        <Card className="bg-[#111] border-0">
          <CardContent className="p-6">
            <div className="text-[10px] font-medium tracking-[2px] uppercase text-[#888] mb-4">By Floor</div>
            <div className="space-y-4">
              {energyByFloor.map((floor, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[13px] font-light">{floor.floor}</span>
                    <span className="text-[11px] text-[#888] font-light">↓ {floor.occupancy}% occ</span>
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#627653] rounded-full"
                          style={{ width: `${(floor.consumption / maxFloor) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-[13px] font-light text-[#888] w-12 text-right">{floor.consumption}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CO2 Footprint Trend */}
        <Card className="bg-[#111] border-0">
          <CardContent className="p-6">
            <div className="text-[10px] font-medium tracking-[2px] uppercase text-[#888] mb-4">CO2 Trend</div>
            <div className="space-y-4">
              {co2Footprint.map((month, i) => {
                const maxEmissions = Math.max(...co2Footprint.map(m => m.emissions));
                return (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[13px] font-light">{month.month}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-light text-[#888]">{month.emissions}t</span>
                        {month.reduction > 0 && (
                          <span className="text-[11px] text-[#627653] font-light">↓{month.reduction}%</span>
                        )}
                      </div>
                    </div>
                    <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#b8a472] rounded-full"
                        style={{ width: `${(month.emissions / maxEmissions) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Benchmark Comparison */}
      <Card className="bg-[#111] border-white/[0.06]">
        <CardContent className="p-6">
          <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-1">Performance</div>
          <h3 className="text-lg font-extralight mb-6">Benchmark <strong className="font-semibold">comparison.</strong></h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Current vs Benchmark */}
            <div className="space-y-4">
              <div className="text-[10px] font-medium tracking-[1px] uppercase text-[#888]">Current Usage</div>
              <div className="text-3xl font-extralight">{benchmarkData.currentUsage.toLocaleString()}<span className="text-sm text-[#888] ml-1">kWh</span></div>
              <div className="mt-3 p-3 rounded-sm bg-[#627653]/10 border border-[#627653]/20">
                <div className="text-[11px] text-[#627653] font-light">
                  {benchmarkData.efficiency}% vs industry standard
                </div>
              </div>
            </div>

            {/* Industry Benchmark */}
            <div className="space-y-4">
              <div className="text-[10px] font-medium tracking-[1px] uppercase text-[#888]">Industry Avg</div>
              <div className="text-3xl font-extralight">{benchmarkData.industryBenchmark.toLocaleString()}<span className="text-sm text-[#888] ml-1">kWh</span></div>
              <div className="mt-3 p-3 rounded-sm bg-white/[0.02] border border-white/[0.04]">
                <div className="text-[11px] text-[#888] font-light">
                  Based on comparable facilities
                </div>
              </div>
            </div>

            {/* YoY Improvement */}
            <div className="space-y-4">
              <div className="text-[10px] font-medium tracking-[1px] uppercase text-[#888]">YoY Change</div>
              <div className="text-3xl font-extralight"><span className="text-[#627653]">-{benchmarkData.improvement}%</span></div>
              <div className="mt-3 p-3 rounded-sm bg-[#627653]/10 border border-[#627653]/20">
                <div className="text-[11px] text-[#627653] font-light">
                  Improvement vs last year
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Savings Recommendations */}
      <Card className="bg-[#111] border-white/[0.06]">
        <CardContent className="p-6">
          <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-1">Actions</div>
          <h3 className="text-lg font-extralight mb-6">Savings <strong className="font-semibold">recommendations.</strong></h3>
          <div className="space-y-3">
            {savingsRecommendations.map((rec, i) => (
              <div key={i} className="p-4 rounded-sm bg-white/[0.02] border border-white/[0.04] space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-[13px] font-light text-foreground">{rec.title}</h4>
                    <p className="text-[11px] text-[#888] font-light mt-1">{rec.description}</p>
                  </div>
                  <span className={`text-[11px] font-medium tracking-[1px] uppercase px-2 py-1 rounded-sm shrink-0 ${
                    rec.priority === "high" ? "bg-orange-500/20 text-orange-400" :
                    rec.priority === "medium" ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-[#627653]/20 text-[#627653]"
                  }`}>
                    {rec.savings}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Sustainability Report */}
      <Card className="bg-[#111] border-white/[0.06]">
        <CardContent className="p-6">
          <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-1">Report</div>
          <h3 className="text-lg font-extralight mb-6">Sustainability <strong className="font-semibold">summary.</strong></h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Period", value: sustainabilityReport.period, subtext: "" },
              { label: "Total Emissions", value: sustainabilityReport.totalEmissions + " t CO2", subtext: "This month" },
              { label: "Emission Reduction", value: sustainabilityReport.emissionReduction + " t", subtext: "vs previous month" },
              { label: "Renewable Energy", value: sustainabilityReport.renewablePercentage + "%", subtext: "of total usage" },
              { label: "Trees Equivalent", value: sustainabilityReport.treesEquivalent, subtext: "offset potential" },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-sm bg-white/[0.02] border border-white/[0.04]">
                <div className="text-[10px] font-medium tracking-[1px] uppercase text-[#888] mb-2">{item.label}</div>
                <div className="text-2xl font-extralight mb-1">{item.value}</div>
                {item.subtext && <div className="text-[11px] text-[#888] font-light">{item.subtext}</div>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Smart Meter Integration Placeholder */}
      <Card className="bg-[#111] border-white/[0.06]">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-5 h-5 text-[#4a7c8a] shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-[13px] font-light mb-1">Smart Meter Integration</h3>
              <p className="text-[12px] text-[#888] font-light mb-3">
                Real-time energy monitoring is currently in integration phase. Once connected, you'll see live consumption data, anomaly detection, and predictive load management.
              </p>
              <button className="text-[11px] font-medium tracking-[1px] uppercase text-[#4a7c8a] hover:text-[#4a7c8a]/80 transition-colors">
                View integration status
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
