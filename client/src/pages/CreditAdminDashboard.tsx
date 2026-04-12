import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Coins, Wallet, TrendingDown, FileSignature, Gift, Package } from "lucide-react";

export default function CreditAdminDashboard() {
  const { data: stats, isLoading } = trpc.creditAdmin.stats.useQuery();
  const { data: packages } = trpc.creditPackages.list.useQuery();
  const { data: bundles } = trpc.bundles.list.useQuery();

  if (isLoading) return <div className="space-y-4 p-1">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>;

  const s = stats ?? { totalWallets: 0, totalCreditsInCirculation: 0, totalPermanentCredits: 0, totalMonthlyBurn: 0, activeContracts: 0, totalBonusesPending: 0 };

  return (
    <div className="space-y-8 p-1">
      {/* Header */}
      <div>
        <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-3">Overview</div>
        <h1 className="text-[clamp(24px,3vw,36px)] font-extralight tracking-[-0.5px]">
          Credit <strong className="font-semibold">admin.</strong>
        </h1>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-[1px] bg-white/[0.04]">
        {[
          { label: "Total Wallets", value: s.totalWallets, icon: Wallet, color: "#627653" },
          { label: "Credits in Circulation", value: s.totalCreditsInCirculation.toLocaleString(), icon: Coins, color: "#627653" },
          { label: "Permanent Credits", value: s.totalPermanentCredits.toLocaleString(), icon: Package, color: "#4a7c8a" },
          { label: "Monthly Burn Rate", value: `${s.totalMonthlyBurn.toLocaleString()}c`, icon: TrendingDown, color: "#b8a472" },
          { label: "Active Contracts", value: s.activeContracts, icon: FileSignature, color: "#627653" },
          { label: "Pending Bonuses", value: s.totalBonusesPending, icon: Gift, color: "#b8a472" },
        ].map((item, i) => (
          <div key={i} className="bg-[#111] p-5">
            <item.icon className="w-4 h-4 mb-3" style={{ color: item.color }} />
            <div className="text-[10px] font-medium tracking-[2px] uppercase text-[#888] mb-1">{item.label}</div>
            <div className="text-2xl font-extralight">{item.value}</div>
          </div>
        ))}
      </div>

      {/* Subscription Plans overview */}
      <Card className="bg-[#111] border-white/[0.06]">
        <CardContent className="p-6">
          <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-1">Plans</div>
          <h3 className="text-lg font-extralight mb-6">Active <strong className="font-semibold">bundles.</strong></h3>
          <div className="space-y-[1px] bg-white/[0.04]">
            <div className="grid grid-cols-7 bg-[#111] p-3 text-[10px] font-medium tracking-[1px] uppercase text-[#888]">
              <div>Name</div><div>Audience</div><div>Credits/mo</div><div>Price</div><div>Price/credit</div><div>Rollover</div><div>Contract</div>
            </div>
            {(bundles ?? []).map((b: any) => (
              <div key={b.id} className="grid grid-cols-7 bg-[#111] p-3 text-[13px] font-light items-center">
                <div className="flex items-center gap-2">
                  {b.isPopular && <span className="w-1.5 h-1.5 rounded-full bg-[#627653]" />}
                  {b.name}
                </div>
                <div className="text-[#888] capitalize">{b.targetAudience || "\u2013"}</div>
                <div>{b.creditsPerMonth}</div>
                <div>\u20AC{parseFloat(b.priceEur).toFixed(0)}</div>
                <div>{b.pricePerCredit ? `\u20AC${parseFloat(b.pricePerCredit).toFixed(2)}` : "\u2013"}</div>
                <div>{b.rolloverPercent ?? 0}%</div>
                <div className="text-[#888] capitalize">{b.contractType?.replace("_", " ") || "\u2013"}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Credit Packages overview */}
      <Card className="bg-[#111] border-white/[0.06]">
        <CardContent className="p-6">
          <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-1">Packages</div>
          <h3 className="text-lg font-extralight mb-6">Credit <strong className="font-semibold">packages.</strong></h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-[1px] bg-white/[0.04]">
            {(packages ?? []).map((pkg: any) => (
              <div key={pkg.id} className="bg-[#111] p-5">
                <h4 className="text-sm font-light mb-2">{pkg.name}</h4>
                <div className="text-2xl font-extralight mb-1">{pkg.credits}<span className="text-sm text-[#888] ml-1">credits</span></div>
                <div className="text-[11px] text-[#888] font-light">\u20AC{parseFloat(pkg.priceEur).toFixed(0)} \u00b7 \u20AC{parseFloat(pkg.pricePerCredit || "0").toFixed(2)}/credit</div>
                {parseFloat(pkg.discountPercent || "0") > 0 && (
                  <span className="mt-2 inline-block text-[9px] font-medium tracking-[1px] uppercase bg-[#627653]/10 text-[#627653] px-2 py-0.5 rounded-sm">
                    {parseFloat(pkg.discountPercent).toFixed(0)}% off
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Credit Economy Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-white/[0.04]">
        <Card className="bg-[#111] border-0">
          <CardContent className="p-6">
            <div className="text-[10px] font-medium tracking-[2px] uppercase text-[#888] mb-2">Subscription vs Permanent</div>
            <div className="flex items-end gap-4 mt-4">
              <div>
                <div className="text-[11px] text-[#627653] mb-1">Subscription</div>
                <div className="text-xl font-extralight">{(s.totalCreditsInCirculation - s.totalPermanentCredits).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[11px] text-[#4a7c8a] mb-1">Permanent</div>
                <div className="text-xl font-extralight">{s.totalPermanentCredits.toLocaleString()}</div>
              </div>
            </div>
            <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden mt-4">
              <div className="h-full bg-[#627653] rounded-full" style={{ width: `${s.totalCreditsInCirculation > 0 ? ((s.totalCreditsInCirculation - s.totalPermanentCredits) / s.totalCreditsInCirculation * 100) : 50}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#111] border-0">
          <CardContent className="p-6">
            <div className="text-[10px] font-medium tracking-[2px] uppercase text-[#888] mb-2">Monthly Velocity</div>
            <div className="text-3xl font-extralight mt-4">{s.totalMonthlyBurn.toLocaleString()}<span className="text-sm text-[#888] ml-1">credits/mo</span></div>
            <p className="text-[11px] text-[#888] font-light mt-2">
              {s.totalCreditsInCirculation > 0
                ? `${((s.totalMonthlyBurn / s.totalCreditsInCirculation) * 100).toFixed(0)}% of circulation`
                : "No data"
              }
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[#111] border-0">
          <CardContent className="p-6">
            <div className="text-[10px] font-medium tracking-[2px] uppercase text-[#888] mb-2">Pending Actions</div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-light">Pending bonuses</span>
                <span className="text-lg font-extralight">{s.totalBonusesPending}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-light">Active contracts</span>
                <span className="text-lg font-extralight">{s.activeContracts}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
