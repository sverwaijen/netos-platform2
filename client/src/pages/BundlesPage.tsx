import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Check } from "lucide-react";

export default function BundlesPage() {
  const { data: bundles, isLoading } = trpc.bundles.list.useQuery();

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
          Predictable costs. Flexible credits. Every plan includes access to all seven locations.
        </p>
      </div>

      {/* Key info strip */}
      <div className="grid grid-cols-3 gap-[1px] bg-white/[0.04] max-w-3xl mx-auto">
        {[
          { label: "Exchange Rate", value: "1 credit = \u20AC5" },
          { label: "Rollover", value: "Max = bundle size" },
          { label: "Multiplier Range", value: "0.45x \u2013 1.4x" },
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
          return (
            <div key={bundle.id} className={`bg-[#111] p-8 flex flex-col relative ${isPopular ? "ring-1 ring-[#627653]/40" : ""}`}>
              {isPopular && <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#627653]" />}
              {isPopular && <span className="text-[9px] font-semibold tracking-[3px] uppercase text-[#627653] mb-4">Most popular</span>}
              <h3 className="text-lg font-light tracking-[0.5px]">{bundle.name}</h3>
              <p className="text-[12px] text-[#888] font-light mt-1 mb-4 min-h-[32px]">{bundle.description}</p>
              <div className="mt-2 mb-6">
                <span className="text-[clamp(32px,4vw,48px)] font-extralight tracking-[-1px]">
                  {parseFloat(bundle.priceEur) === 0 ? "Free" : `\u20AC${parseFloat(bundle.priceEur).toFixed(0)}`}
                </span>
                {parseFloat(bundle.priceEur) > 0 && <span className="text-sm text-[#888] font-light ml-1">/month</span>}
              </div>
              <div className="text-sm text-[#627653] font-medium mb-1">{bundle.creditsPerMonth} credits/month</div>
              {parseFloat(bundle.creditsPerMonth) > 0 && (
                <div className="text-[11px] text-[#888] font-light mb-6">
                  Rollover: up to {bundle.creditsPerMonth} credits
                </div>
              )}
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
                    : "border border-white/10 bg-transparent text-white hover:bg-white hover:text-white"
                }`}
              >
                {parseFloat(bundle.priceEur) === 0 ? "Get started" : "Subscribe"}
              </button>
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="max-w-xl mx-auto pt-12 border-t border-white/[0.06]">
        <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-4 text-center">FAQ</div>
        <h2 className="text-2xl font-extralight text-center mb-8">Common <strong className="font-semibold">questions.</strong></h2>
        <div className="space-y-0">
          {[
            { q: "What happens to unused credits?", a: "Credits roll over to the next month, up to your plan's rollover limit. Unused credits beyond the cap expire (breakage revenue)." },
            { q: "Can I switch plans?", a: "Yes, you can upgrade or downgrade at any time. Changes take effect at the start of your next billing cycle." },
            { q: "How do multipliers work?", a: "Credit costs vary by day and time. Off-peak hours have lower multipliers (0.45x\u20130.7x), while peak times cost more (up to 1.4x)." },
            { q: "Company vs personal credits?", a: "Company credits are funded by your employer's subscription. Personal credits are your own top-ups. Company credits are used first." },
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
