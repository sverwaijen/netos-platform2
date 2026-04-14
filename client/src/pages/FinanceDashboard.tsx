import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Euro,
  TrendingUp,
  TrendingDown,
  Building2,
  Receipt,
  PiggyBank,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

/** Month labels (abbreviated, Dutch) */
const MONTHS = ["Jan", "Feb", "Mrt", "Apr", "Mei", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];

/** Placeholder revenue data (will be replaced with real tRPC query) */
const DEMO_MONTHLY_REVENUE = [
  { month: "Jan", revenue: 34500, costs: 12400, bookings: 312 },
  { month: "Feb", revenue: 38200, costs: 13100, bookings: 345 },
  { month: "Mrt", revenue: 41800, costs: 13900, bookings: 378 },
  { month: "Apr", revenue: 39600, costs: 14200, bookings: 356 },
  { month: "Mei", revenue: 44100, costs: 13800, bookings: 401 },
  { month: "Jun", revenue: 47300, costs: 14500, bookings: 423 },
];

const DEMO_COMPANY_SPEND = [
  { name: "TechFlow BV", spend: 8420, credits: 4210, bookings: 89 },
  { name: "Green Ventures", spend: 6350, credits: 3175, bookings: 67 },
  { name: "Mediahub NL", spend: 5180, credits: 2590, bookings: 54 },
  { name: "Studio Bloom", spend: 4290, credits: 2145, bookings: 41 },
  { name: "CodeCraft BV", spend: 3870, credits: 1935, bookings: 38 },
  { name: "Legal Partners", spend: 3210, credits: 1605, bookings: 29 },
  { name: "DesignLab", spend: 2890, credits: 1445, bookings: 26 },
  { name: "StartupBase", spend: 2140, credits: 1070, bookings: 21 },
];

const DEMO_INVOICES = [
  { id: "INV-2026-041", company: "TechFlow BV", amount: 2840, status: "paid", date: "2026-04-01" },
  { id: "INV-2026-040", company: "Green Ventures", amount: 2150, status: "paid", date: "2026-04-01" },
  { id: "INV-2026-039", company: "Mediahub NL", amount: 1730, status: "pending", date: "2026-04-01" },
  { id: "INV-2026-038", company: "Studio Bloom", amount: 1430, status: "pending", date: "2026-04-01" },
  { id: "INV-2026-037", company: "CodeCraft BV", amount: 1290, status: "overdue", date: "2026-03-01" },
  { id: "INV-2026-036", company: "Legal Partners", amount: 1070, status: "paid", date: "2026-03-01" },
];

type Period = "month" | "quarter" | "year";

export default function FinanceDashboard() {
  const [period, setPeriod] = useState<Period>("month");

  // When real API is available, replace with:
  // const { data: stats, isLoading } = trpc.finance.stats.useQuery({ period });
  const isLoading = false;

  // Aggregate KPIs from demo data
  const currentMonth = DEMO_MONTHLY_REVENUE[DEMO_MONTHLY_REVENUE.length - 1];
  const prevMonth = DEMO_MONTHLY_REVENUE[DEMO_MONTHLY_REVENUE.length - 2];
  const revenueGrowth = prevMonth ? ((currentMonth.revenue - prevMonth.revenue) / prevMonth.revenue) * 100 : 0;
  const totalRevenue = DEMO_MONTHLY_REVENUE.reduce((sum, m) => sum + m.revenue, 0);
  const totalCosts = DEMO_MONTHLY_REVENUE.reduce((sum, m) => sum + m.costs, 0);
  const totalProfit = totalRevenue - totalCosts;
  const marginPct = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const totalBookings = DEMO_MONTHLY_REVENUE.reduce((sum, m) => sum + m.bookings, 0);

  const pendingInvoices = DEMO_INVOICES.filter((i) => i.status === "pending");
  const overdueInvoices = DEMO_INVOICES.filter((i) => i.status === "overdue");
  const totalOutstanding = [...pendingInvoices, ...overdueInvoices].reduce((s, i) => s + i.amount, 0);

  if (isLoading) {
    return (
      <div className="space-y-4 p-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 p-1">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-3">Finance</div>
          <h1 className="text-[clamp(24px,3vw,36px)] font-extralight tracking-[-0.5px]">
            CFO <strong className="font-semibold">dashboard.</strong>
          </h1>
        </div>
        <div className="flex gap-1">
          {(["month", "quarter", "year"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-[10px] font-medium tracking-[1px] uppercase rounded transition-colors ${
                period === p ? "bg-[#627653] text-white" : "text-[#888] hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              {p === "month" ? "Maand" : p === "quarter" ? "Kwartaal" : "Jaar"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-[1px] bg-white/[0.04]">
        {[
          {
            label: "Omzet (YTD)",
            value: `€${(totalRevenue / 1000).toFixed(1)}k`,
            icon: Euro,
            color: "#627653",
            delta: `+${revenueGrowth.toFixed(1)}%`,
            deltaPositive: revenueGrowth > 0,
          },
          {
            label: "Kosten (YTD)",
            value: `€${(totalCosts / 1000).toFixed(1)}k`,
            icon: TrendingDown,
            color: "#b8a472",
          },
          {
            label: "Marge",
            value: `${marginPct.toFixed(1)}%`,
            icon: PiggyBank,
            color: "#4a7c8a",
          },
          {
            label: "Bookings",
            value: totalBookings.toLocaleString(),
            icon: BarChart3,
            color: "#627653",
          },
          {
            label: "Openstaand",
            value: `€${totalOutstanding.toLocaleString()}`,
            icon: Receipt,
            color: overdueInvoices.length > 0 ? "#c75450" : "#b8a472",
          },
          {
            label: "Bedrijven",
            value: DEMO_COMPANY_SPEND.length,
            icon: Building2,
            color: "#627653",
          },
        ].map((item, i) => (
          <div key={i} className="bg-[#111] p-5">
            <item.icon className="w-4 h-4 mb-3" style={{ color: item.color }} />
            <div className="text-[10px] font-medium tracking-[2px] uppercase text-[#888] mb-1">{item.label}</div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-extralight">{item.value}</div>
              {item.delta && (
                <span className={`flex items-center text-[11px] ${item.deltaPositive ? "text-[#627653]" : "text-[#c75450]"}`}>
                  {item.deltaPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {item.delta}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Revenue chart (ASCII bar-chart style, works without chart library) */}
      <Card className="bg-[#111] border-white/[0.06]">
        <CardContent className="p-6">
          <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-1">Trend</div>
          <h3 className="text-lg font-extralight mb-6">
            Omzet vs. kosten <strong className="font-semibold">per maand.</strong>
          </h3>
          <div className="space-y-3">
            {DEMO_MONTHLY_REVENUE.map((m) => {
              const maxRev = Math.max(...DEMO_MONTHLY_REVENUE.map((r) => r.revenue));
              const revPct = (m.revenue / maxRev) * 100;
              const costPct = (m.costs / maxRev) * 100;
              return (
                <div key={m.month} className="flex items-center gap-4">
                  <div className="w-8 text-[11px] text-[#888] font-medium">{m.month}</div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-4 rounded-sm bg-[#627653]/70 transition-all"
                        style={{ width: `${revPct}%` }}
                      />
                      <span className="text-[11px] text-[#888]">€{(m.revenue / 1000).toFixed(1)}k</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 rounded-sm bg-[#b8a472]/50 transition-all"
                        style={{ width: `${costPct}%` }}
                      />
                      <span className="text-[10px] text-[#666]">€{(m.costs / 1000).toFixed(1)}k</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-6 mt-4 text-[10px] text-[#888]">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#627653]/70" />
              Omzet
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-2 rounded-sm bg-[#b8a472]/50" />
              Kosten
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two columns: Company spend + Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Credit spend per company */}
        <Card className="bg-[#111] border-white/[0.06]">
          <CardContent className="p-6">
            <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-1">Spending</div>
            <h3 className="text-lg font-extralight mb-6">
              Verbruik per <strong className="font-semibold">bedrijf.</strong>
            </h3>
            <div className="space-y-[1px] bg-white/[0.04]">
              <div className="grid grid-cols-4 bg-[#111] p-3 text-[10px] font-medium tracking-[1px] uppercase text-[#888]">
                <div>Bedrijf</div>
                <div className="text-right">Omzet</div>
                <div className="text-right">Credits</div>
                <div className="text-right">Bookings</div>
              </div>
              {DEMO_COMPANY_SPEND.map((c) => (
                <div key={c.name} className="grid grid-cols-4 bg-[#111] p-3 text-[13px] font-light items-center">
                  <div className="truncate">{c.name}</div>
                  <div className="text-right">€{c.spend.toLocaleString()}</div>
                  <div className="text-right text-[#888]">{c.credits.toLocaleString()}</div>
                  <div className="text-right text-[#888]">{c.bookings}</div>
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="mt-4 text-[10px] tracking-[1px] uppercase text-[#888] hover:text-white">
              <Download className="w-3 h-3 mr-2" />
              Export CSV
            </Button>
          </CardContent>
        </Card>

        {/* Recent invoices */}
        <Card className="bg-[#111] border-white/[0.06]">
          <CardContent className="p-6">
            <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-1">Facturatie</div>
            <h3 className="text-lg font-extralight mb-6">
              Recente <strong className="font-semibold">facturen.</strong>
            </h3>
            <div className="space-y-[1px] bg-white/[0.04]">
              <div className="grid grid-cols-4 bg-[#111] p-3 text-[10px] font-medium tracking-[1px] uppercase text-[#888]">
                <div>Nummer</div>
                <div>Bedrijf</div>
                <div className="text-right">Bedrag</div>
                <div className="text-right">Status</div>
              </div>
              {DEMO_INVOICES.map((inv) => (
                <div key={inv.id} className="grid grid-cols-4 bg-[#111] p-3 text-[13px] font-light items-center">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3 h-3 text-[#888]" />
                    {inv.id}
                  </div>
                  <div className="truncate">{inv.company}</div>
                  <div className="text-right">€{inv.amount.toLocaleString()}</div>
                  <div className="text-right">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium tracking-[1px] uppercase ${
                        inv.status === "paid"
                          ? "bg-[#627653]/20 text-[#627653]"
                          : inv.status === "pending"
                            ? "bg-[#b8a472]/20 text-[#b8a472]"
                            : "bg-[#c75450]/20 text-[#c75450]"
                      }`}
                    >
                      {inv.status === "paid" ? "Betaald" : inv.status === "pending" ? "Open" : "Verlopen"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* BTW Summary */}
      <Card className="bg-[#111] border-white/[0.06]">
        <CardContent className="p-6">
          <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-1">BTW</div>
          <h3 className="text-lg font-extralight mb-6">
            BTW <strong className="font-semibold">overzicht.</strong>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Omzet excl. BTW", value: `€${(totalRevenue / 1.21).toFixed(0)}` },
              { label: "BTW 21%", value: `€${(totalRevenue - totalRevenue / 1.21).toFixed(0)}` },
              { label: "Omzet incl. BTW", value: `€${totalRevenue.toLocaleString()}` },
              { label: "BTW afdracht (schatting)", value: `€${((totalRevenue - totalRevenue / 1.21) - (totalCosts - totalCosts / 1.21)).toFixed(0)}` },
            ].map((item, i) => (
              <div key={i}>
                <div className="text-[10px] font-medium tracking-[2px] uppercase text-[#888] mb-1">{item.label}</div>
                <div className="text-xl font-extralight">{item.value}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Integration info */}
      <div className="text-[11px] text-[#666] flex items-center gap-2 pb-4">
        <TrendingUp className="w-3 h-3" />
        Integration-ready voor Exact Online en Twinfield — neem contact op met de administrator.
      </div>
    </div>
  );
}
