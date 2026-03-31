import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Check, Zap, ArrowRight, HelpCircle, CreditCard, RefreshCw, TrendingUp } from "lucide-react";

const TIER_GLOW: Record<string, string> = {
  "Basic Access": "", "Flex": "", "Professional": "border-primary/50",
  "Business": "border-amber-500/30", "Enterprise": "border-purple-500/30", "Full Time": "border-netos-green/50",
};

export default function BundlesPage() {
  const { data: bundles, isLoading } = trpc.bundles.list.useQuery();

  if (isLoading) return <div className="space-y-4 p-1">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}</div>;

  return (
    <div className="space-y-8 p-1">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Credit Bundles</h1>
        <p className="text-muted-foreground">Choose a plan that fits your workstyle. All plans include rollover credits and dynamic pricing.</p>
      </div>

      {/* Key info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
        <Card className="glass-card border-border/50"><CardContent className="p-4 text-center"><CreditCard className="w-5 h-5 text-primary mx-auto mb-2" /><p className="text-sm font-medium">1 Credit = &euro;5</p><p className="text-xs text-muted-foreground">Fixed exchange rate</p></CardContent></Card>
        <Card className="glass-card border-border/50"><CardContent className="p-4 text-center"><RefreshCw className="w-5 h-5 text-amber-400 mx-auto mb-2" /><p className="text-sm font-medium">Rollover</p><p className="text-xs text-muted-foreground">Max = bundle size</p></CardContent></Card>
        <Card className="glass-card border-border/50"><CardContent className="p-4 text-center"><TrendingUp className="w-5 h-5 text-netos-green mx-auto mb-2" /><p className="text-sm font-medium">0.45x - 1.4x</p><p className="text-xs text-muted-foreground">Dynamic multiplier</p></CardContent></Card>
      </div>

      {/* Bundle Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(bundles ?? []).map((bundle: any) => {
          const glow = TIER_GLOW[bundle.name] || "";
          return (
            <Card key={bundle.id} className={`glass-card border-border/50 transition-all duration-300 relative overflow-hidden ${bundle.isPopular ? "border-primary/50" : glow} hover:border-primary/30`}>
              {bundle.isPopular && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-netos-green to-emerald-400" />
              )}
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold">{bundle.name}</h3>
                  {bundle.isPopular && <Badge className="bg-primary/20 text-primary text-[10px]"><Zap className="w-3 h-3 mr-1" />Popular</Badge>}
                </div>
                <p className="text-sm text-muted-foreground mb-4 min-h-[40px]">{bundle.description}</p>

                <div className="mb-1">
                  <span className="text-3xl font-bold">{parseFloat(bundle.priceEur) === 0 ? "Free" : `€${parseFloat(bundle.priceEur)}`}</span>
                  {parseFloat(bundle.priceEur) > 0 && <span className="text-sm text-muted-foreground">/month</span>}
                </div>
                <div className="text-sm text-primary font-semibold mb-1">{bundle.creditsPerMonth} credits/month</div>
                {bundle.creditsPerMonth > 0 && (
                  <div className="text-xs text-muted-foreground mb-4">
                    &euro;{(parseFloat(bundle.priceEur) / bundle.creditsPerMonth).toFixed(2)}/credit · Rollover: {bundle.creditsPerMonth}cr max
                  </div>
                )}

                <div className="space-y-2 mb-6 pt-4 border-t border-border/30">
                  {(bundle.features as string[] ?? []).map((f: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-3.5 h-3.5 text-netos-green shrink-0" />{f}
                    </div>
                  ))}
                </div>

                <Button className="w-full" variant={bundle.isPopular ? "default" : "outline"} onClick={() => toast.info("Stripe subscription integration coming soon")}>
                  {parseFloat(bundle.priceEur) === 0 ? "Get Started" : "Subscribe"}<ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* FAQ */}
      <Card className="glass-card border-border/50 max-w-3xl mx-auto">
        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><HelpCircle className="w-4 h-4 text-primary" />Frequently Asked Questions</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { q: "What happens to unused credits?", a: "Credits roll over to the next month, up to your bundle size. Excess credits expire (breakage)." },
              { q: "How does dynamic pricing work?", a: "Off-peak hours (early mornings, evenings) have a 0.45x multiplier, while peak hours go up to 1.4x. This means your credits go further during quiet times." },
              { q: "Can I upgrade mid-month?", a: "Yes! Upgrading is prorated. You'll receive the difference in credits immediately." },
              { q: "What are company vs personal credits?", a: "Company credits are funded by your employer's subscription. Personal credits are your own top-ups. Company credits are used first." },
            ].map((faq, i) => (
              <div key={i} className="p-3 rounded-lg bg-secondary/30">
                <p className="text-sm font-medium mb-1">{faq.q}</p>
                <p className="text-xs text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
