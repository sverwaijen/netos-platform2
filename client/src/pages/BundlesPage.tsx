import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Check, ShoppingCart, Zap, Building2, Users, Crown, User } from "lucide-react";

const AUDIENCE_ICONS: Record<string, any> = {
  freelancer: User,
  individual: Zap,
  smb: Users,
  business: Building2,
  corporate: Crown,
};

const AUDIENCE_LABELS: Record<string, string> = {
  freelancer: "Freelancer",
  individual: "Individual",
  smb: "Teams (MKB)",
  business: "Business",
  corporate: "Enterprise",
};

const CONTRACT_LABELS: Record<string, string> = {
  monthly: "Month-to-month",
  semi_annual: "6 months",
  annual: "12 months",
  multi_year: "24+ months",
};

export default function BundlesPage() {
  const [tab, setTab] = useState<"subscriptions" | "packages">("subscriptions");
  const { data: bundles, isLoading: bundlesLoading } = trpc.bundles.list.useQuery();
  const { data: packages, isLoading: packagesLoading } = trpc.creditPackages.list.useQuery();

  const isLoading = bundlesLoading || packagesLoading;

  if (isLoading) return <div className="space-y-4 p-1">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64" />)}</div>;

  const sorted = [...(bundles ?? [])].sort((a: any, b: any) => parseFloat(a.priceEur) - parseFloat(b.priceEur));
  const popular = sorted.find((b: any) => b.isPopular) || sorted[2];

  return (
    <div className="space-y-12 p-1">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto">
        <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-4">Pricing</div>
        <h1 className="text-[clamp(28px,3vw,42px)] font-extralight tracking-[-0.5px] leading-tight">
          Choose your <strong className="font-semibold">plan.</strong>
        </h1>
        <p className="text-[13px] text-[#888] font-light mt-4 leading-[1.7]">
          Predictable costs. Flexible credits. Every plan includes access to all locations.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex justify-center gap-[1px] bg-white/[0.04] max-w-md mx-auto">
        <button
          onClick={() => setTab("subscriptions")}
          className={`flex-1 py-3 text-[10px] font-semibold tracking-[3px] uppercase transition-all ${tab === "subscriptions" ? "bg-[#627653] text-white" : "bg-[#111] text-[#888] hover:text-white"}`}
        >
          Subscription Plans
        </button>
        <button
          onClick={() => setTab("packages")}
          className={`flex-1 py-3 text-[10px] font-semibold tracking-[3px] uppercase transition-all ${tab === "packages" ? "bg-[#627653] text-white" : "bg-[#111] text-[#888] hover:text-white"}`}
        >
          Credit Packages
        </button>
      </div>

      {tab === "subscriptions" ? (
        <>
          {/* Key info strip */}
          <div className="grid grid-cols-4 gap-[1px] bg-white/[0.04] max-w-4xl mx-auto">
            {[
              { label: "Exchange Rate", value: "1 credit = \u20AC5" },
              { label: "Rollover", value: "Up to 20%" },
              { label: "Multiplier Range", value: "0.45x \u2013 1.4x" },
              { label: "Overage", value: "List price" },
            ].map((item, i) => (
              <div key={i} className="bg-[#111] p-5 text-center">
                <div className="text-[10px] font-medium tracking-[2px] uppercase text-[#888] mb-1">{item.label}</div>
                <div className="text-sm font-light">{item.value}</div>
              </div>
            ))}
          </div>

          {/* Pricing grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-white/[0.04] max-w-5xl mx-auto">
            {sorted.map((bundle: any) => {
              const isPopular = bundle.id === popular?.id;
              const AudienceIcon = AUDIENCE_ICONS[bundle.targetAudience] || User;
              return (
                <div key={bundle.id} className={`bg-[#111] p-8 flex flex-col relative ${isPopular ? "ring-1 ring-[#627653]/40" : ""}`}>
                  {isPopular && <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#627653]" />}
                  {isPopular && <span className="text-[9px] font-semibold tracking-[3px] uppercase text-[#627653] mb-2">Most popular</span>}

                  {/* Audience badge */}
                  {bundle.targetAudience && (
                    <div className="flex items-center gap-2 mb-3">
                      <AudienceIcon className="w-3.5 h-3.5 text-[#b8a472]" />
                      <span className="text-[10px] font-medium tracking-[2px] uppercase text-[#b8a472]">
                        {AUDIENCE_LABELS[bundle.targetAudience] || bundle.targetAudience}
                      </span>
                    </div>
                  )}

                  <h3 className="text-lg font-light tracking-[0.5px]">{bundle.name}</h3>
                  <p className="text-[12px] text-[#888] font-light mt-1 mb-4 min-h-[32px]">{bundle.description}</p>

                  <div className="mt-2 mb-2">
                    <span className="text-[clamp(32px,4vw,48px)] font-extralight tracking-[-1px]">
                      {parseFloat(bundle.priceEur) === 0 ? "Free" : `\u20AC${parseFloat(bundle.priceEur).toFixed(0)}`}
                    </span>
                    {parseFloat(bundle.priceEur) > 0 && <span className="text-sm text-[#888] font-light ml-1">/month</span>}
                  </div>

                  <div className="text-sm text-[#627653] font-medium mb-1">{bundle.creditsPerMonth} credits/month</div>

                  {/* Price per credit */}
                  {bundle.pricePerCredit && (
                    <div className="text-[11px] text-[#888] font-light">
                      \u20AC{parseFloat(bundle.pricePerCredit).toFixed(2)}/credit
                    </div>
                  )}

                  {/* Contract & Rollover badges */}
                  <div className="flex flex-wrap gap-1.5 mt-3 mb-5">
                    {bundle.contractType && (
                      <span className="text-[9px] font-medium tracking-[1px] uppercase bg-white/[0.06] px-2 py-1 rounded-sm">
                        {CONTRACT_LABELS[bundle.contractType] || bundle.contractType}
                      </span>
                    )}
                    {(bundle.rolloverPercent ?? 0) > 0 && (
                      <span className="text-[9px] font-medium tracking-[1px] uppercase bg-[#627653]/10 text-[#627653] px-2 py-1 rounded-sm">
                        {bundle.rolloverPercent}% rollover
                      </span>
                    )}
                    {bundle.budgetControlLevel && bundle.budgetControlLevel !== "none" && (
                      <span className="text-[9px] font-medium tracking-[1px] uppercase bg-[#b8a472]/10 text-[#b8a472] px-2 py-1 rounded-sm">
                        {bundle.budgetControlLevel} controls
                      </span>
                    )}
                  </div>

                  <div className="w-full h-px bg-white/[0.06] mb-6" />
                  <ul className="space-y-3 flex-1">
                    {(bundle.features as string[] ?? []).map((f: string, i: number) => (
                      <li key={i} className="flex items-center gap-3 text-[13px] text-[#888] font-light">
                        <Check className="w-3.5 h-3.5 text-[#627653] shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => toast.info("Stripe subscription integration activating soon.")}
                    className={`mt-8 w-full py-[14px] text-[10px] font-semibold tracking-[3px] uppercase transition-all duration-300 ${
                      isPopular
                        ? "bg-[#627653] text-white hover:bg-[#4a5a3f]"
                        : "border border-white/10 bg-transparent text-white hover:bg-white/5"
                    }`}
                  >
                    {parseFloat(bundle.priceEur) === 0 ? "Get started" : "Subscribe"}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          {/* Credit Packages */}
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-2xl font-extralight mb-2">Buy credits <strong className="font-semibold">once.</strong></h2>
            <p className="text-[13px] text-[#888] font-light leading-[1.7]">
              Permanent credits that never expire. Bigger packages mean bigger savings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[1px] bg-white/[0.04] max-w-5xl mx-auto">
            {(packages ?? []).map((pkg: any, idx: number) => {
              const bestValue = idx === (packages?.length ?? 0) - 1;
              return (
                <div key={pkg.id} className={`bg-[#111] p-8 flex flex-col relative ${bestValue ? "ring-1 ring-[#b8a472]/40" : ""}`}>
                  {bestValue && <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#b8a472]" />}
                  {bestValue && <span className="text-[9px] font-semibold tracking-[3px] uppercase text-[#b8a472] mb-2">Best value</span>}

                  <h3 className="text-lg font-light tracking-[0.5px]">{pkg.name}</h3>
                  <p className="text-[12px] text-[#888] font-light mt-1 mb-4 min-h-[32px]">{pkg.description}</p>

                  <div className="mt-2 mb-2">
                    <span className="text-[clamp(32px,4vw,48px)] font-extralight tracking-[-1px]">
                      \u20AC{parseFloat(pkg.priceEur).toFixed(0)}
                    </span>
                  </div>

                  <div className="text-sm text-[#627653] font-medium mb-1">{pkg.credits} credits</div>
                  <div className="text-[11px] text-[#888] font-light">
                    \u20AC{parseFloat(pkg.pricePerCredit || "0").toFixed(2)}/credit
                  </div>

                  {parseFloat(pkg.discountPercent || "0") > 0 && (
                    <span className="mt-3 inline-block text-[9px] font-medium tracking-[1px] uppercase bg-[#627653]/10 text-[#627653] px-2 py-1 rounded-sm w-fit">
                      {parseFloat(pkg.discountPercent).toFixed(0)}% savings
                    </span>
                  )}

                  <div className="flex items-center gap-2 mt-3 text-[11px] text-[#b8a472] font-light">
                    <ShoppingCart className="w-3 h-3" /> Permanent &ndash; never expires
                  </div>

                  <div className="w-full h-px bg-white/[0.06] my-6" />

                  <button
                    onClick={() => toast.info("Stripe payment integration activating soon.")}
                    className={`w-full py-[14px] text-[10px] font-semibold tracking-[3px] uppercase transition-all duration-300 ${
                      bestValue
                        ? "bg-[#b8a472] text-black hover:bg-[#a89462]"
                        : "border border-white/10 bg-transparent text-white hover:bg-white/5"
                    }`}
                  >
                    Purchase
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Feature comparison */}
      <div className="max-w-4xl mx-auto">
        <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-4 text-center">Comparison</div>
        <h2 className="text-2xl font-extralight text-center mb-8">Plan <strong className="font-semibold">features.</strong></h2>
        <div className="border border-white/[0.06] overflow-hidden">
          <div className="grid grid-cols-6 gap-0 text-[11px]">
            {/* Header */}
            <div className="bg-[#111] p-4 font-medium border-b border-white/[0.06]">Feature</div>
            {["Flex", "Pro", "Team", "Business", "Enterprise"].map(t => (
              <div key={t} className="bg-[#111] p-4 font-medium text-center border-b border-l border-white/[0.06]">{t}</div>
            ))}
            {/* Rows */}
            {[
              { feature: "Contract", values: ["Monthly", "6-12 mo", "12 mo", "12-24 mo", "24-36 mo"] },
              { feature: "Rollover", values: ["0%", "10%", "15%", "20%", "Custom"] },
              { feature: "Budget controls", values: ["\u2013", "\u2013", "Basic", "Advanced", "Enterprise"] },
              { feature: "Price/credit", values: ["\u20AC2.50", "\u20AC2.00", "\u20AC1.60", "\u20AC1.25", "\u20AC0.90"] },
              { feature: "Wallet type", values: ["Personal", "Personal", "Company", "Company", "Company"] },
              { feature: "Overage rate", values: ["List", "List", "List", "List", "Custom"] },
              { feature: "Analytics", values: ["\u2013", "\u2013", "Basic", "Advanced", "Full"] },
              { feature: "Account manager", values: ["\u2013", "\u2013", "\u2013", "\u2013", "\u2713"] },
            ].map(({ feature, values }, ri) => (
              <div key={ri} className="contents">
                <div className="p-4 text-[#888] font-light border-b border-white/[0.06]">{feature}</div>
                {values.map((v, ci) => (
                  <div key={ci} className={`p-4 text-center font-light border-b border-l border-white/[0.06] ${v === "\u2713" ? "text-[#627653]" : "text-[#ccc]"}`}>{v}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-xl mx-auto pt-12 border-t border-white/[0.06]">
        <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-4 text-center">FAQ</div>
        <h2 className="text-2xl font-extralight text-center mb-8">Common <strong className="font-semibold">questions.</strong></h2>
        <div className="space-y-0">
          {[
            { q: "What happens to unused credits?", a: "Subscription credits roll over based on your plan tier (0-20%). Permanent credits from packages never expire." },
            { q: "Can I switch plans?", a: "Yes, you can upgrade or downgrade at any time. Changes take effect at the start of your next billing cycle." },
            { q: "How do multipliers work?", a: "Credit costs vary by day and time. Off-peak hours have lower multipliers (0.45x\u20130.7x), while peak times cost more (up to 1.4x)." },
            { q: "Company vs personal credits?", a: "Company credits are funded by your employer's subscription. Personal credits are your own purchases. Expiring credits are always used first (FIFO)." },
            { q: "What is overage?", a: "When your subscription credits run out, additional bookings are charged at the standard list price. You'll receive alerts at 80% and 100% usage." },
            { q: "What are permanent credits?", a: "Credits purchased as standalone packages never expire. They are only consumed after your subscription credits are used up." },
          ].map((faq, i) => (
            <div key={i} className="py-5 border-b border-white/[0.06]">
              <h4 className="text-sm font-medium mb-2">{faq.q}</h4>
              <p className="text-[13px] text-[#888] font-light leading-[1.7]">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
