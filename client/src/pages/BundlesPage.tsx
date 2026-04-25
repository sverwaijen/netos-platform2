import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Check, CreditCard, Loader2, ExternalLink } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function BundlesPage() {
  const { data: bundles, isLoading } = trpc.bundles.list.useQuery();
  const { user } = useAuth();
  const { data: subStatus } = trpc.walletPayment.subscriptionStatus.useQuery(undefined, { enabled: !!user });

  const subscribeMutation = trpc.walletPayment.createSubscription.useMutation({
    onSuccess: (data) => {
      toast.info("Redirecting to Stripe checkout...");
      if (data.checkoutUrl) window.open(data.checkoutUrl, "_blank");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const portalMutation = trpc.walletPayment.customerPortal.useMutation({
    onSuccess: (data) => {
      toast.info("Opening Stripe customer portal...");
      window.open(data.portalUrl, "_blank");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubscribe = (bundleId: number, priceEur: string) => {
    if (!user) {
      window.location.href = getLoginUrl();
      return;
    }
    if (parseFloat(priceEur) === 0) {
      toast.info("Free plan is already active for all members.");
      return;
    }
    subscribeMutation.mutate({ bundleId });
  };

  const handleManageSubscription = () => {
    portalMutation.mutate();
  };

  if (isLoading) return <div className="space-y-4 p-1">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64" />)}</div>;

  const sorted = [...(bundles ?? [])].sort((a: any, b: any) => parseFloat(a.priceEur) - parseFloat(b.priceEur));
  const popular = sorted.find((b: any) => b.isPopular) || sorted[2];

  return (
    <div className="space-y-12 p-1">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto">
        <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#C4B89E] mb-4">Pricing</div>
        <h1 className="text-[clamp(28px,3vw,42px)] font-extralight tracking-[-0.5px] leading-tight">
          Choose your <strong className="font-semibold">plan.</strong>
        </h1>
        <p className="text-[13px] text-[#888] font-light mt-4 leading-[1.7]">
          Predictable costs. Flexible credits. Every plan includes access to all seven locations.
        </p>
      </div>

      {/* Active subscription banner */}
      {subStatus?.active && subStatus.plan && (
        <div className="max-w-3xl mx-auto bg-[#C4B89E]/10 border border-[#C4B89E]/20 p-5 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-semibold tracking-[2px] uppercase text-[#C4B89E] mb-1">Active Subscription</div>
            <div className="text-sm font-light">
              {subStatus.plan} plan
              {subStatus.cancelAtPeriodEnd && (
                <span className="text-[#ff6b6b] ml-2 text-xs">(Cancels at period end)</span>
              )}
            </div>
          </div>
          <button
            onClick={handleManageSubscription}
            disabled={portalMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 text-[10px] font-semibold tracking-[2px] uppercase border border-[#C4B89E]/40 hover:bg-[#C4B89E]/20 transition-all"
          >
            {portalMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
            Manage
          </button>
        </div>
      )}

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
          const isCurrentPlan = subStatus?.active && subStatus.plan === bundle.name;
          const isFree = parseFloat(bundle.priceEur) === 0;
          const isPending = subscribeMutation.isPending && subscribeMutation.variables?.bundleId === bundle.id;

          return (
            <div key={bundle.id} className={`bg-[#111] p-8 flex flex-col relative ${isPopular ? "ring-1 ring-[#C4B89E]/40" : ""}`}>
              {isPopular && <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#C4B89E]" />}
              {isPopular && <span className="text-[9px] font-semibold tracking-[3px] uppercase text-[#C4B89E] mb-4">Most popular</span>}
              {isCurrentPlan && <span className="text-[9px] font-semibold tracking-[3px] uppercase text-emerald-400 mb-4">Current plan</span>}
              <h3 className="text-lg font-light tracking-[0.5px]">{bundle.name}</h3>
              <p className="text-[12px] text-[#888] font-light mt-1 mb-4 min-h-[32px]">{bundle.description}</p>
              <div className="mt-2 mb-6">
                <span className="text-[clamp(32px,4vw,48px)] font-extralight tracking-[-1px]">
                  {isFree ? "Free" : `\u20AC${parseFloat(bundle.priceEur).toFixed(0)}`}
                </span>
                {!isFree && <span className="text-sm text-[#888] font-light ml-1">/month</span>}
              </div>
              <div className="text-sm text-[#C4B89E] font-medium mb-1">{bundle.creditsPerMonth} credits/month</div>
              {bundle.creditsPerMonth > 0 && (
                <div className="text-[11px] text-[#888] font-light mb-6">
                  Rollover: up to {bundle.creditsPerMonth} credits
                </div>
              )}
              <div className="w-full h-px bg-white/[0.06] mb-6" />
              <ul className="space-y-3 flex-1">
                {(bundle.features as string[] ?? []).map((f: string, i: number) => (
                  <li key={i} className="flex items-center gap-3 text-[13px] text-[#888] font-light">
                    <Check className="w-3.5 h-3.5 text-[#C4B89E] shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => isCurrentPlan ? handleManageSubscription() : handleSubscribe(bundle.id, bundle.priceEur)}
                disabled={isPending || portalMutation.isPending}
                className={`mt-8 w-full py-[14px] text-[10px] font-semibold tracking-[3px] uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
                  isCurrentPlan
                    ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20"
                    : isPopular
                    ? "bg-[#C4B89E] text-black hover:bg-[#b5a98e]"
                    : "border border-white/10 bg-transparent text-white hover:bg-white/5"
                }`}
              >
                {isPending ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...</>
                ) : isCurrentPlan ? (
                  <><CreditCard className="w-3.5 h-3.5" /> Manage subscription</>
                ) : isFree ? (
                  "Get started"
                ) : (
                  <><CreditCard className="w-3.5 h-3.5" /> Subscribe</>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* One-time top-up section */}
      {user && <TopUpSection />}

      {/* FAQ */}
      <div className="max-w-xl mx-auto pt-12 border-t border-white/[0.06]">
        <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#C4B89E] mb-4 text-center">FAQ</div>
        <h2 className="text-2xl font-extralight text-center mb-8">Common <strong className="font-semibold">questions.</strong></h2>
        <div className="space-y-0">
          {[
            { q: "What happens to unused credits?", a: "Credits roll over to the next month, up to your plan's rollover limit. Unused credits beyond the cap expire (breakage revenue)." },
            { q: "Can I switch plans?", a: "Yes, you can upgrade or downgrade at any time. Changes take effect at the start of your next billing cycle." },
            { q: "How do multipliers work?", a: "Credit costs vary by day and time. Off-peak hours have lower multipliers (0.45x\u20130.7x), while peak times cost more (up to 1.4x)." },
            { q: "How does Stripe payment work?", a: "Payments are securely processed by Stripe. You'll be redirected to a Stripe checkout page. Test with card 4242 4242 4242 4242." },
            { q: "Company vs personal credits?", a: "Company credits are funded by your employer's subscription. Personal credits are your own top-ups. Company credits are used first." },
          ].map((faq, i) => (
            <div key={i} className="py-5 border-b border-white/[0.06]">
              <h4 className="text-sm font-medium mb-2">{faq.q}</h4>
              <p className="text-[13px] text-[#888] font-light leading-[1.7]">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Test mode notice */}
      <div className="max-w-xl mx-auto text-center pb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-medium tracking-[1px] uppercase">
          <CreditCard className="w-3.5 h-3.5" />
          Stripe Test Mode &mdash; Use card 4242 4242 4242 4242
        </div>
      </div>
    </div>
  );
}

// ─── Top-up Section ──────────────────────────────────────────────────

function TopUpSection() {
  const topupMutation = trpc.walletPayment.createTopup.useMutation({
    onSuccess: (data) => {
      toast.info("Redirecting to Stripe checkout...");
      if (data.checkoutUrl) window.open(data.checkoutUrl, "_blank");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const topupOptions = [
    { credits: 10, price: 50 },
    { credits: 25, price: 115 },
    { credits: 50, price: 220 },
    { credits: 100, price: 400 },
  ];

  return (
    <div className="max-w-3xl mx-auto pt-12 border-t border-white/[0.06]">
      <div className="text-center mb-8">
        <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#C4B89E] mb-4">Top-up</div>
        <h2 className="text-2xl font-extralight">Need extra <strong className="font-semibold">credits?</strong></h2>
        <p className="text-[13px] text-[#888] font-light mt-2">One-time credit purchases. No subscription required.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-white/[0.04]">
        {topupOptions.map((opt: any) => {
          const isPending = topupMutation.isPending && topupMutation.variables?.amountEur === opt.price;
          return (
            <button
              key={opt.credits}
              onClick={() => topupMutation.mutate({ amountEur: opt.price })}
              disabled={topupMutation.isPending}
              className="bg-[#111] p-6 text-center hover:bg-[#1a1a1a] transition-all group"
            >
              <div className="text-2xl font-extralight tracking-[-0.5px] group-hover:text-[#C4B89E] transition-colors">
                {opt.credits}
              </div>
              <div className="text-[10px] font-medium tracking-[2px] uppercase text-[#888] mt-1">credits</div>
              <div className="text-sm font-light mt-3 text-[#C4B89E]">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : `\u20AC${opt.price}`}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
