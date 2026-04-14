import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, AlertTriangle, Download } from "lucide-react";

export default function SpendingAnalyticsPage() {
  // Demo data
  const spendingByUser = [
    { name: "Alice Johnson", amount: 2450, credits: 1225 },
    { name: "Bob Smith", amount: 1890, credits: 945 },
    { name: "Carol Williams", amount: 1650, credits: 825 },
    { name: "David Brown", amount: 1420, credits: 710 },
    { name: "Eva Garcia", amount: 980, credits: 490 },
  ];

  const spendingByTeam = [
    { name: "Engineering", amount: 5200, percentage: 35 },
    { name: "Design", amount: 3100, percentage: 21 },
    { name: "Sales", amount: 2800, percentage: 18 },
    { name: "Operations", amount: 2100, percentage: 14 },
    { name: "HR", amount: 1200, percentage: 12 },
  ];

  const resourceBreakdown = [
    { type: "Meeting Rooms", amount: 6500, percentage: 45, icon: "door" },
    { name: "Desk Space", amount: 5200, percentage: 36, icon: "desk" },
    { name: "Parking", amount: 2600, percentage: 18, icon: "car" },
    { name: "Other", amount: 400, percentage: 1, icon: "more" },
  ];

  const budgetUtilization = [
    { month: "January", allocated: 15000, spent: 12300, forecast: 13500 },
    { month: "February", allocated: 15000, spent: 13200, forecast: 14100 },
    { month: "March", allocated: 15000, spent: 14300, forecast: 14800 },
    { month: "April", allocated: 15000, spent: 0, forecast: 15200 },
  ];

  const thresholdAlerts = [
    { team: "Engineering", threshold: "80%", current: "84%", status: "exceeded" },
    { team: "Sales", threshold: "75%", current: "71%", status: "warning" },
    { team: "Operations", threshold: "70%", current: "68%", status: "ok" },
  ];

  const maxSpending = Math.max(...spendingByUser.map(u => u.amount));
  const maxBudget = Math.max(...spendingByTeam.map(t => t.amount));

  return (
    <div className="space-y-8 p-1">
      {/* Header */}
      <div>
        <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-3">Finance</div>
        <h1 className="text-[clamp(24px,3vw,36px)] font-extralight tracking-[-0.5px]">
          Spending <strong className="font-semibold">analytics.</strong>
        </h1>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-white/[0.04]">
        {[
          { label: "Total Spend (Month)", value: "€14,300", icon: TrendingUp, color: "#b8a472" },
          { label: "Active Users", value: "127", icon: Users, color: "#627653" },
          { label: "Avg Per User", value: "€112", icon: BarChart3, color: "#4a7c8a" },
          { label: "Budget Utilization", value: "95%", icon: AlertTriangle, color: "#b8a472" },
        ].map((item, i) => (
          <div key={i} className="bg-[#111] p-5">
            <item.icon className="w-4 h-4 mb-3" style={{ color: item.color }} />
            <div className="text-[10px] font-medium tracking-[2px] uppercase text-[#888] mb-1">{item.label}</div>
            <div className="text-2xl font-extralight">{item.value}</div>
          </div>
        ))}
      </div>

      {/* Spending by User */}
      <Card className="bg-[#111] border-white/[0.06]">
        <CardContent className="p-6">
          <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-1">Analysis</div>
          <h3 className="text-lg font-extralight mb-6">Spending by <strong className="font-semibold">user.</strong></h3>
          <div className="space-y-4">
            {spendingByUser.map((user, i) => {
              const percentage = (user.amount / maxSpending) * 100;
              return (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[13px] font-light">{user.name}</span>
                    <span className="text-[13px] font-light text-[#888]">€{user.amount.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#627653] rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Spending by Team & Resource Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-white/[0.04]">
        {/* Team Breakdown */}
        <Card className="bg-[#111] border-0">
          <CardContent className="p-6">
            <div className="text-[10px] font-medium tracking-[2px] uppercase text-[#888] mb-4">Team Distribution</div>
            <div className="space-y-4">
              {spendingByTeam.map((team, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[13px] font-light">{team.name}</span>
                    <span className="text-[13px] font-light text-[#888]">{team.percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#4a7c8a] rounded-full"
                      style={{ width: `${team.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Resource Type Breakdown */}
        <Card className="bg-[#111] border-0">
          <CardContent className="p-6">
            <div className="text-[10px] font-medium tracking-[2px] uppercase text-[#888] mb-4">Resource Types</div>
            <div className="space-y-4">
              {resourceBreakdown.map((resource, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[13px] font-light">{resource.name}</span>
                    <span className="text-[13px] font-light text-[#888]">{resource.percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#b8a472] rounded-full"
                      style={{ width: `${resource.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Utilization & Forecast */}
      <Card className="bg-[#111] border-white/[0.06]">
        <CardContent className="p-6">
          <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-1">Forecast</div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-extralight">Budget <strong className="font-semibold">utilization.</strong></h3>
            <button className="flex items-center gap-2 text-[11px] font-medium tracking-[1px] uppercase bg-[#627653]/10 text-[#627653] px-3 py-1.5 rounded-sm hover:bg-[#627653]/20 transition-colors">
              <Download className="w-3 h-3" />
              Export CSV
            </button>
          </div>
          <div className="space-y-[1px] bg-white/[0.04]">
            <div className="grid grid-cols-5 bg-[#111] p-3 text-[10px] font-medium tracking-[1px] uppercase text-[#888]">
              <div>Month</div>
              <div>Allocated</div>
              <div>Spent</div>
              <div>Forecast</div>
              <div>Status</div>
            </div>
            {budgetUtilization.map((month, i) => {
              const utilizationPct = month.spent > 0 ? Math.round((month.spent / month.allocated) * 100) : 0;
              return (
                <div key={i} className="grid grid-cols-5 bg-[#111] p-3 text-[13px] font-light items-center">
                  <div>{month.month}</div>
                  <div>€{month.allocated.toLocaleString()}</div>
                  <div>€{month.spent.toLocaleString()}</div>
                  <div>€{month.forecast.toLocaleString()}</div>
                  <div>
                    {utilizationPct === 0 ? (
                      <span className="text-[#888]">—</span>
                    ) : (
                      <span className={utilizationPct > 90 ? "text-orange-400" : "text-[#627653]"}>
                        {utilizationPct}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Threshold Alerts */}
      <Card className="bg-[#111] border-white/[0.06]">
        <CardContent className="p-6">
          <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-1">Alerts</div>
          <h3 className="text-lg font-extralight mb-6">Budget <strong className="font-semibold">thresholds.</strong></h3>
          <div className="space-y-3">
            {thresholdAlerts.map((alert, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-sm bg-white/[0.02] border border-white/[0.04]">
                <div className="flex-1">
                  <div className="text-[13px] font-light mb-1">{alert.team}</div>
                  <div className="text-[11px] text-[#888] font-light">Threshold: {alert.threshold}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className={`text-[13px] font-light ${alert.status === "exceeded" ? "text-orange-400" : alert.status === "warning" ? "text-yellow-400" : "text-[#627653]"}`}>
                      {alert.current}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: alert.status === "exceeded" ? "rgba(249, 115, 22, 0.1)" : alert.status === "warning" ? "rgba(234, 179, 8, 0.1)" : "rgba(98, 118, 83, 0.1)"
                    }}>
                    <AlertTriangle
                      className="w-4 h-4"
                      style={{
                        color: alert.status === "exceeded" ? "#f97316" : alert.status === "warning" ? "#eab308" : "#627653"
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
