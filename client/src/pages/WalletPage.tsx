import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet, ArrowUpRight, ArrowDownRight, CreditCard, Building2, User, RefreshCw, Plus } from "lucide-react";
import { toast } from "sonner";

const typeIcons: Record<string, any> = {
  grant: { icon: ArrowDownRight, color: "text-primary", bg: "bg-primary/10" },
  spend: { icon: ArrowUpRight, color: "text-destructive", bg: "bg-destructive/10" },
  rollover: { icon: RefreshCw, color: "text-chart-3", bg: "bg-chart-3/10" },
  breakage: { icon: ArrowUpRight, color: "text-muted-foreground", bg: "bg-muted" },
  topup: { icon: ArrowDownRight, color: "text-chart-1", bg: "bg-chart-1/10" },
  refund: { icon: ArrowDownRight, color: "text-primary", bg: "bg-primary/10" },
  transfer: { icon: RefreshCw, color: "text-chart-4", bg: "bg-chart-4/10" },
};

export default function WalletPage() {
  const { data: wallets, isLoading } = trpc.wallets.mine.useQuery();

  const personalWallet = wallets?.find((w) => w.type === "personal");
  const companyWallet = wallets?.find((w) => w.type === "company");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Credits & Wallet</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your personal and company credits</p>
        </div>
        <Button onClick={() => toast.info("Stripe top-up integration coming soon")}>
          <Plus className="h-4 w-4 mr-2" />
          Top Up
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Personal Wallet */}
        <Card className="bg-card border-border/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">Personal Wallet</div>
                <div className="text-xs text-muted-foreground">Your individual credits</div>
              </div>
            </div>
            <div className="text-4xl font-bold text-foreground mb-1">
              {personalWallet ? parseFloat(personalWallet.balance).toLocaleString() : "0"}
              <span className="text-lg text-muted-foreground ml-1">cr</span>
            </div>
            {personalWallet?.rolloverBalance && (
              <div className="text-xs text-muted-foreground">
                Rollover: {parseFloat(personalWallet.rolloverBalance)} cr
              </div>
            )}
          </CardContent>
        </Card>

        {/* Company Wallet */}
        <Card className="bg-card border-border/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-chart-3/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-chart-3/10">
                <Building2 className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">Company Wallet</div>
                <div className="text-xs text-muted-foreground">Shared team credits</div>
              </div>
            </div>
            <div className="text-4xl font-bold text-foreground mb-1">
              {companyWallet ? parseFloat(companyWallet.balance).toLocaleString() : "0"}
              <span className="text-lg text-muted-foreground ml-1">cr</span>
            </div>
            {companyWallet?.rolloverBalance && (
              <div className="text-xs text-muted-foreground">
                Rollover: {parseFloat(companyWallet.rolloverBalance)} cr
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Credit Info */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Credit System</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-secondary/30">
              <div className="text-sm font-medium text-foreground mb-1">1 Credit = €5</div>
              <div className="text-xs text-muted-foreground">Fixed exchange rate across all services</div>
            </div>
            <div className="p-4 rounded-lg bg-secondary/30">
              <div className="text-sm font-medium text-foreground mb-1">Rollover</div>
              <div className="text-xs text-muted-foreground">Max rollover = bundle size. Use or lose excess.</div>
            </div>
            <div className="p-4 rounded-lg bg-secondary/30">
              <div className="text-sm font-medium text-foreground mb-1">Dynamic Pricing</div>
              <div className="text-xs text-muted-foreground">0.45x - 1.4x multiplier based on day & time</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty state for ledger */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Wallet className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No transactions yet. Start by subscribing to a credit bundle.</p>
            <Button variant="outline" className="mt-4 bg-transparent" onClick={() => window.location.href = "/bundles"}>
              View Bundles
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
