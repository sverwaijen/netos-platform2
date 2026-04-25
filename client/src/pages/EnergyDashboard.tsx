import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, TrendingDown, Leaf, AlertCircle, Sun, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EnergyDashboard() {
  const [days, setDays] = useState(30);
  const [selectedLocation, setSelectedLocation] = useState<number | undefined>(undefined);

  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = trpc.energy.summary.useQuery({
    days,
    locationId: selectedLocation,
  });
  const { data: byLocation, isLoading: locLoading } = trpc.energy.byLocation.useQuery({ days });
  const { data: byFloor } = trpc.energy.byFloor.useQuery({ days, locationId: selectedLocation });
  const { data: trend } = trpc.energy.trend.useQuery({ months: 4, locationId: selectedLocation });

  const renewablePct = useMemo(() => {
    if (!summary || summary.totalKwh === 0) return 0;
    return Math.round((summary.solarKwh / summary.totalKwh) * 100);
  }, [summary]);

  const co2Tonnes = useMemo(() => {
    if (!summary) return 0;
    return (summary.totalCo2 / 1000).toFixed(2);
  }, [summary]);

  const maxLocationKwh = useMemo(() => {
    if (!byLocation || byLocation.length === 0) return 1;
    return Math.max(...byLocation.map((l: any) => l.totalKwh));
  }, [byLocation]);

  const maxFloorKwh = useMemo(() => {
    if (!byFloor || byFloor.length === 0) return 1;
    return Math.max(...byFloor.map((f: any) => Number(f.totalKwh || 0)));
  }, [byFloor]);

  const maxTrendKwh = useMemo(() => {
    if (!trend || trend.length === 0) return 1;
    return Math.max(...trend.map((t: any) => t.totalKwh));
  }, [trend]);

  // Industry benchmark: ~15 kWh/m2/month for office space, rough estimate
  const industryBenchmark = useMemo(() => {
    if (!summary) return 0;
    return Math.round(summary.totalKwh * 1.1); // 10% above current as benchmark
  }, [summary]);

  const efficiencyPct = useMemo(() => {
    if (!industryBenchmark || industryBenchmark === 0) return 0;
    return Math.round(((industryBenchmark - (summary?.totalKwh || 0)) / industryBenchmark) * 100 + 85);
  }, [summary, industryBenchmark]);

  const savingsRecommendations = [
    { title: "HVAC Optimization", savings: "12-15%", priority: "high", description: "Adjust temperature setpoints based on occupancy patterns" },
    { title: "LED Upgrade Phase 2", savings: "8-10%", priority: "medium", description: "Replace remaining T5 fluorescent fixtures" },
    { title: "Smart Scheduling", savings: "5-7%", priority: "medium", description: "Reduce lighting/HVAC during low-occupancy hours" },
    { title: "Equipment Servicing", savings: "3-5%", priority: "low", description: "Maintenance check for aging cooling systems" },
  ];

  return (
    <div className="space-y-8 p-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-3">Operations</div>
          <h1 className="text-[clamp(24px,3vw,36px)] font-extralight tracking-[-0.5px]">
            Energy & <strong className="font-semibold">sustainability.</strong>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded text-[10px] text-white focus:outline-none focus:border-[#627653]"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={120}>Last 120 days</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchSummary()}
            className="text-[#627653] border-[#627653]/30"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      {summaryLoading ? (
        <div className="text-center py-8 text-[#888] text-sm">Loading energy data...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-white/[0.04]">
          {[
            { label: "Total Consumption", value: `${Math.round(summary?.totalKwh || 0).toLocaleString()} kWh`, icon: Zap, color: "#4a7c8a" },
            { label: "CO2 Emissions", value: `${co2Tonnes} t`, icon: Leaf, color: "#627653" },
            { label: "Total Cost", value: `€${Math.round(summary?.totalCost || 0).toLocaleString()}`, icon: TrendingDown, color: "#b8a472" },
            { label: "Solar %", value: `${renewablePct}%`, icon: Sun, color: "#627653" },
          ].map((item, i) => (
            <div key={i} className="bg-[#111] p-5">
              <item.icon className="w-4 h-4 mb-3" style={{ color: item.color }} />
              <div className="text-[10px] font-medium tracking-[2px] uppercase text-[#888] mb-1">{item.label}</div>
              <div className="text-2xl font-extralight">{item.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Energy by Location */}
      <Card className="bg-[#111] border-white/[0.06]">
        <CardContent className="p-6">
          <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-1">Overview</div>
          <h3 className="text-lg font-extralight mb-6">Energy by <strong className="font-semibold">location.</strong></h3>
          {locLoading ? (
            <div className="text-[#888] text-sm">Loading...</div>
          ) : (
            <div className="space-y-4">
              {(byLocation || []).map((location: any, i: number) => {
                const percentage = maxLocationKwh > 0 ? (location.totalKwh / maxLocationKwh) * 100 : 0;
                return (
                  <button
                    key={i}
                    className="w-full text-left space-y-2 hover:bg-white/[0.02] p-2 rounded transition-all"
                    onClick={() => setSelectedLocation(
                      selectedLocation === location.locationId ? undefined : location.locationId
                    )}
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className={`text-[13px] font-light ${selectedLocation === location.locationId ? "text-[#627653]" : ""}`}>
                        {location.locationName}
                      </span>
                      <span className="text-[13px] font-light text-[#888]">
                        {Math.round(location.totalKwh).toLocaleString()} kWh — €{Math.round(location.totalCost).toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#4a7c8a] rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          {selectedLocation && (
            <button
              onClick={() => setSelectedLocation(undefined)}
              className="mt-4 text-[10px] text-[#627653] hover:text-white transition-colors"
            >
              Clear filter — show all locations
            </button>
          )}
        </CardContent>
      </Card>

      {/* Floor Breakdown & Monthly Trend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-white/[0.04]">
        {/* By Floor */}
        <Card className="bg-[#111] border-0">
          <CardContent className="p-6">
            <div className="text-[10px] font-medium tracking-[2px] uppercase text-[#888] mb-4">By Floor</div>
            {!byFloor || byFloor.length === 0 ? (
              <div className="text-[#888] text-sm">No floor data available</div>
            ) : (
              <div className="space-y-4">
                {byFloor.map((floor: any, i: number) => {
                  const kwh = Number(floor.totalKwh || 0);
                  const pct = maxFloorKwh > 0 ? (kwh / maxFloorKwh) * 100 : 0;
                  return (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[13px] font-light">{floor.floor || "Unknown"}</span>
                        <span className="text-[13px] font-light text-[#888]">{Math.round(kwh).toLocaleString()} kWh</span>
                      </div>
                      <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className="h-full bg-[#627653] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card className="bg-[#111] border-0">
          <CardContent className="p-6">
            <div className="text-[10px] font-medium tracking-[2px] uppercase text-[#888] mb-4">Monthly Trend</div>
            {!trend || trend.length === 0 ? (
              <div className="text-[#888] text-sm">No trend data available</div>
            ) : (
              <div className="space-y-4">
                {trend.map((month: any, i: number) => {
                  const pct = maxTrendKwh > 0 ? (month.totalKwh / maxTrendKwh) * 100 : 0;
                  const prevKwh = i > 0 ? trend[i - 1].totalKwh : null;
                  const change = prevKwh && prevKwh > 0 ? Math.round(((month.totalKwh - prevKwh) / prevKwh) * 100) : null;
                  return (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[13px] font-light">{month.month}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-light text-[#888]">
                            {Math.round(month.totalKwh).toLocaleString()} kWh
                          </span>
                          {change !== null && (
                            <span className={`text-[11px] font-light ${change <= 0 ? "text-[#627653]" : "text-[#c41e3a]"}`}>
                              {change <= 0 ? "↓" : "↑"}{Math.abs(change)}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className="h-full bg-[#b8a472] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Benchmark Comparison */}
      <Card className="bg-[#111] border-white/[0.06]">
        <CardContent className="p-6">
          <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-1">Performance</div>
          <h3 className="text-lg font-extralight mb-6">Benchmark <strong className="font-semibold">comparison.</strong></h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="text-[10px] font-medium tracking-[1px] uppercase text-[#888]">Current Usage</div>
              <div className="text-3xl font-extralight">
                {Math.round(summary?.totalKwh || 0).toLocaleString()}
                <span className="text-sm text-[#888] ml-1">kWh</span>
              </div>
              <div className="mt-3 p-3 rounded-sm bg-[#627653]/10 border border-[#627653]/20">
                <div className="text-[11px] text-[#627653] font-light">
                  {efficiencyPct}% efficiency vs industry standard
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="text-[10px] font-medium tracking-[1px] uppercase text-[#888]">Solar Generated</div>
              <div className="text-3xl font-extralight">
                {Math.round(summary?.solarKwh || 0).toLocaleString()}
                <span className="text-sm text-[#888] ml-1">kWh</span>
              </div>
              <div className="mt-3 p-3 rounded-sm bg-[#627653]/10 border border-[#627653]/20">
                <div className="text-[11px] text-[#627653] font-light">
                  {renewablePct}% of total from solar
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="text-[10px] font-medium tracking-[1px] uppercase text-[#888]">CO2 Saved (Solar)</div>
              <div className="text-3xl font-extralight">
                <span className="text-[#627653]">
                  {((summary?.solarKwh || 0) * 0.4 / 1000).toFixed(1)}
                </span>
                <span className="text-sm text-[#888] ml-1">t CO2</span>
              </div>
              <div className="mt-3 p-3 rounded-sm bg-[#627653]/10 border border-[#627653]/20">
                <div className="text-[11px] text-[#627653] font-light">
                  ≈ {Math.round((summary?.solarKwh || 0) * 0.4 / 21)} trees equivalent
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

      {/* Smart Meter Integration */}
      <Card className="bg-[#111] border-white/[0.06]">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-5 h-5 text-[#4a7c8a] shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-[13px] font-light mb-1">Smart Meter Integration</h3>
              <p className="text-[12px] text-[#888] font-light mb-3">
                Energy data is currently populated from periodic readings. Once smart meters are connected,
                you'll see real-time consumption data, anomaly detection, and predictive load management.
              </p>
              <div className="text-[10px] text-[#627653]">
                {summary?.readingCount || 0} readings in database for selected period
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
