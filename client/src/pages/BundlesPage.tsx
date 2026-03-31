import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, Zap } from "lucide-react";
import { toast } from "sonner";

export default function BundlesPage() {
  const { data: bundles, isLoading } = trpc.bundles.list.useQuery();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Credit Bundles</h1>
        <p className="text-muted-foreground text-sm mt-1">Choose a plan that fits your workstyle. 1 Credit = €5.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="bg-card border-border/50 animate-pulse">
              <CardContent className="p-6"><div className="h-48" /></CardContent>
            </Card>
          ))
        ) : (
          (bundles ?? []).map((bundle) => (
            <Card
              key={bundle.id}
              className={`bg-card border-border/50 transition-all duration-300 relative ${
                bundle.isPopular ? "border-primary/50 glow-green" : "hover:border-primary/20"
              }`}
            >
              {bundle.isPopular && (
                <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                  <Zap className="h-3 w-3" />
                  Popular
                </div>
              )}
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-1">{bundle.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{bundle.description}</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold text-foreground">
                    {parseFloat(bundle.priceEur) === 0 ? "Free" : `€${parseFloat(bundle.priceEur)}`}
                  </span>
                  {parseFloat(bundle.priceEur) > 0 && <span className="text-sm text-muted-foreground">/month</span>}
                </div>
                <div className="text-sm text-primary font-medium mb-4">
                  {bundle.creditsPerMonth} credits/month
                </div>
                {bundle.creditsPerMonth > 0 && (
                  <div className="text-xs text-muted-foreground mb-4">
                    €{(parseFloat(bundle.priceEur) / bundle.creditsPerMonth).toFixed(2)}/credit
                    {" · "}
                    Max rollover: {bundle.creditsPerMonth} cr
                  </div>
                )}
                <div className="space-y-2 mb-6">
                  {(bundle.features as string[] ?? []).map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ChevronRight className="h-3 w-3 text-primary shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
                <Button
                  className="w-full"
                  variant={bundle.isPopular ? "default" : "outline"}
                  onClick={() => toast.info("Stripe subscription integration coming soon")}
                >
                  {parseFloat(bundle.priceEur) === 0 ? "Get Started" : "Subscribe"}
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
