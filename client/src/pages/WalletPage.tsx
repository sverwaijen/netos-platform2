import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useState, useMemo, useEffect } from "react";
import { CreditCard, ArrowUpRight, ArrowDownRight, RefreshCw, TrendingUp, Clock, Package, Shield, Zap, Settings, Banknote, CheckCircle2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function WalletPage() {
  const { isAuthenticated } = useAuth();
  const { data: wallets, isLoading } = trpc.wallets.mine.useQuery(undefined, { enabled: isAuthenticated });
  const { data: ledger } = trpc.wallets.ledger.useQuery({ walletId: 0 }, { enabled: isAuthenticated });
  const { data: bundles = [] } = trpc.walletPayment.getBundles.useQuery();
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("50");
  const [autoTopUpOpen, setAutoTopUpOpen] = useState(false);
  const [autoTopUpThreshold, setAutoTopUpThreshold] = useState("10");
  const [autoTopUpAmount, setAutoTopUpAmount] = useState("50");
  const [bundleDialogOpen, setBundleDialogOpen] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "ideal">("ideal");
  const [paymentHistoryOpen, setPaymentHistoryOpen] = useState(false);

  const { data: paymentHistory = [] } = trpc.walletPayment.getPaymentHistory.useQuery(
    { limit: 20 },
    { enabled: isAuthenticated }
  );
  const { data: stripeStatus } = trpc.walletPayment.getStripeStatus.useQuery();

  // Handle return from Stripe checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const success = params.get("success");
    if (sessionId && success === "true") {
      // Fulfill the checkout on return
      fetch(`/api/trpc/walletPayment.handleCheckoutCompleted`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: { sessionId } }),
      }).then(() => {
        toast.success("Betaling geslaagd! Credits zijn toegevoegd.");
        // Clean up URL params
        window.history.replaceState({}, "", "/wallet");
      }).catch(() => {
        toast.info("Betaling wordt verwerkt...");
        window.history.replaceState({}, "", "/wallet");
      });
    }
    const cancelled = params.get("cancelled");
    if (cancelled === "true") {
      toast.info("Betaling geannuleerd.");
      window.history.replaceState({}, "", "/wallet");
    }
  }, []);

  const utils = trpc.useUtils();
  const topUpMutation = trpc.wallets.topup.useMutation({
    onSuccess: () => { toast.success("Credits added."); setTopUpOpen(false); utils.wallets.mine.invalidate(); utils.wallets.ledger.invalidate(); },
    onError: (err: any) => toast.error(err.message),
  });
  const autoTopUpMutation = trpc.wallets.setAutoTopUp.useMutation({
    onSuccess: () => { toast.success("Auto top-up settings saved."); setAutoTopUpOpen(false); utils.wallets.mine.invalidate(); },
    onError: (err: any) => toast.error(err.message),
  });
  const checkoutMutation = trpc.walletPayment.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
    onError: (err: any) => toast.error(err.message || "Betaling kon niet gestart worden"),
  });

  const personalWallet = wallets?.find((w: any) => w.type === "personal");
  const companyWallet = wallets?.find((w: any) => w.type === "company");
  const personalBalance = personalWallet ? parseFloat(personalWallet.balance) : 0;
  const personalPermanent = personalWallet ? parseFloat(personalWallet.permanentBalance ?? "0") : 0;
  const companyBalance = companyWallet ? parseFloat(companyWallet.balance) : 0;
  const companyPermanent = companyWallet ? parseFloat(companyWallet.permanentBalance ?? "0") : 0;
  const totalBalance = personalBalance + personalPermanent + companyBalance + companyPermanent;

  const analytics = useMemo(() => {
    if (!ledger || ledger.length === 0) return { spent: 0, earned: 0, breakage: 0, topups: 0, packages: 0, bonuses: 0, avgDaily: 0, spendByDay: [] };
    const spent = ledger.filter((t: any) => t.type === "spend").reduce((s: number, t: any) => s + Math.abs(parseFloat(t.amount)), 0);
    const earned = ledger.filter((t: any) => ["grant", "topup", "package_purchase", "bonus"].includes(t.type)).reduce((s: number, t: any) => s + parseFloat(t.amount), 0);
    const breakage = ledger.filter((t: any) => ["breakage", "expiration"].includes(t.type)).reduce((s: number, t: any) => s + Math.abs(parseFloat(t.amount)), 0);
    const topups = ledger.filter((t: any) => t.type === "topup").reduce((s: number, t: any) => s + parseFloat(t.amount), 0);
    const packages = ledger.filter((t: any) => t.type === "package_purchase").reduce((s: number, t: any) => s + parseFloat(t.amount), 0);
    const bonuses = ledger.filter((t: any) => t.type === "bonus").reduce((s: number, t: any) => s + parseFloat(t.amount), 0);
    const dayMap: Record<number, number> = {};
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    ledger.filter((t: any) => t.type === "spend").forEach((t: any) => {
      const d = new Date(t.createdAt).getDay();
      dayMap[d] = (dayMap[d] || 0) + Math.abs(parseFloat(t.amount));
    });
    const spendByDay = dayNames.map((name, i) => ({ day: name, credits: Math.round(dayMap[i] || 0) }));
    const uniqueDays = new Set(ledger.filter((t: any) => t.type === "spend").map((t: any) => new Date(t.createdAt).toDateString())).size;
    return { spent, earned, breakage, topups, packages, bonuses, avgDaily: uniqueDays > 0 ? spent / uniqueDays : 0, spendByDay };
  }, [ledger]);

  const rolloverPct = personalWallet?.rolloverPercent ?? 0;
  const rolloverCap = personalWallet?.maxRollover ? parseFloat(String(personalWallet.maxRollover)) : 0;
  const atRiskCredits = rolloverCap > 0 ? Math.max(personalBalance - rolloverCap, 0) : personalBalance;
  const expiresAt = personalWallet?.creditExpiresAt;
  const daysUntilExpiry = expiresAt ? Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  if (isLoading) return <div className="space-y-4 p-1">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>;

  return (
    <div className="space-y-8 p-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-3">Credits</div>
          <h1 className="text-[clamp(24px,3vw,36px)] font-extralight tracking-[-0.5px]">
            Your <strong className="font-semibold">wallet.</strong>
          </h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPaymentHistoryOpen(true)} className="flex items-center gap-2 px-4 py-2.5 border border-white/10 text-white text-[10px] font-semibold tracking-[3px] uppercase hover:bg-white/5 transition-all">
            <Banknote className="w-3.5 h-3.5" />Betalingen
          </button>
          <button onClick={() => setAutoTopUpOpen(true)} className="flex items-center gap-2 px-4 py-2.5 border border-white/10 text-white text-[10px] font-semibold tracking-[3px] uppercase hover:bg-white/5 transition-all">
            <Settings className="w-3.5 h-3.5" />Auto Top-Up
          </button>
          <button onClick={() => setBundleDialogOpen(true)} className="flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 bg-[#627653] text-white text-[10px] font-semibold tracking-[3px] uppercase hover:bg-[#4a5a3f] transition-all">
            <CreditCard className="w-3.5 h-3.5" />Opwaarderen
          </button>
        </div>
      </div>

      {/* Expiration warning */}
      {daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0 && personalBalance > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 flex items-center gap-3">
          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-[13px] text-amber-400 font-light">
            {personalBalance.toFixed(0)} subscription credits expire in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? "s" : ""}. Use them or they'll be lost (minus {rolloverPct}% rollover).
          </p>
        </div>
      )}

      {/* Wallet cards - split into subscription + permanent */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-[1px] bg-white/[0.04]">
        <div className="bg-[#111] p-4 md:p-6">
          <div className="text-[10px] font-medium tracking-[2px] uppercase text-[#888] mb-2">Total Balance</div>
          <div className="text-3xl md:text-[clamp(32px,4vw,48px)] font-extralight tracking-[-1px]">{totalBalance.toFixed(0)}<span className="text-sm text-[#888] ml-1">credits</span></div>
          <div className="flex gap-4 mt-3 text-[11px] text-[#888]">
            <span className="flex items-center gap-1"><ArrowUpRight className="w-3 h-3 text-[#627653]" />+{analytics.earned.toFixed(0)} in</span>
            <span className="flex items-center gap-1"><ArrowDownRight className="w-3 h-3 text-red-400" />-{analytics.spent.toFixed(0)} out</span>
          </div>
        </div>
        <div className="bg-[#111] p-6 border-l-2 border-[#627653]">
          <div className="text-[10px] font-medium tracking-[2px] uppercase text-[#888] mb-2">Subscription Credits</div>
          <div className="text-3xl font-extralight">{(personalBalance + companyBalance).toFixed(0)}<span className="text-sm text-[#888] ml-1">c</span></div>
          <div className="text-[11px] text-[#888] mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />Expiring {daysUntilExpiry !== null ? `in ${daysUntilExpiry}d` : "end of month"}
          </div>
        </div>
        <div className="bg-[#111] p-6 border-l-2 border-[#4a7c8a]">
          <div className="text-[10px] font-medium tracking-[2px] uppercase text-[#888] mb-2">Permanent Credits</div>
          <div className="text-3xl font-extralight">{(personalPermanent + companyPermanent).toFixed(0)}<span className="text-sm text-[#888] ml-1">c</span></div>
          <div className="text-[11px] text-[#4a7c8a] mt-1 flex items-center gap-1">
            <Package className="w-3 h-3" />Never expires
          </div>
        </div>
        <div className="bg-[#111] p-6 border-l-2 border-[#b8a472]">
          <div className="text-[10px] font-medium tracking-[2px] uppercase text-[#888] mb-2">Company</div>
          <div className="text-3xl font-extralight">{(companyBalance + companyPermanent).toFixed(0)}<span className="text-sm text-[#888] ml-1">c</span></div>
          <div className="text-[11px] text-[#888] mt-1">Shared pool</div>
        </div>
      </div>

      {/* Analytics strip */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-[1px] bg-white/[0.04]">
        {[
          { label: "Avg Daily", value: `${analytics.avgDaily.toFixed(1)}c`, icon: TrendingUp, color: "#b8a472" },
          { label: "Top-ups", value: `${analytics.topups.toFixed(0)}c`, icon: ArrowUpRight, color: "#627653" },
          { label: "Packages", value: `${analytics.packages.toFixed(0)}c`, icon: Package, color: "#4a7c8a" },
          { label: "Bonuses", value: `${analytics.bonuses.toFixed(0)}c`, icon: Zap, color: "#b8a472" },
          { label: "Expired", value: `${analytics.breakage.toFixed(0)}c`, icon: RefreshCw, color: "#888" },
          { label: "Auto Top-Up", value: personalWallet?.autoTopUpEnabled ? "On" : "Off", icon: Shield, color: personalWallet?.autoTopUpEnabled ? "#627653" : "#888" },
        ].map((item, i) => (
          <div key={i} className="bg-[#111] p-3 md:p-4 flex items-center gap-2">
            <item.icon className="w-4 h-4 shrink-0" style={{ color: item.color }} />
            <div className="min-w-0">
              <div className="text-[9px] text-[#888] tracking-[1px] uppercase truncate">{item.label}</div>
              <div className="text-base font-extralight">{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Rollover bar */}
      {(rolloverPct > 0 || rolloverCap > 0) && (
        <Card className="bg-[#111] border-white/[0.06]">
          <CardContent className="p-6">
            <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-3">Rollover Status</div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-[#888] font-light">{personalBalance.toFixed(0)} subscription credits</span>
              <span className="font-medium">{rolloverPct}% rollover</span>
            </div>
            <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full bg-[#627653] rounded-full transition-all duration-500" style={{ width: `${Math.min((personalBalance / Math.max(rolloverCap, 1)) * 100, 100)}%` }} />
            </div>
            <div className="flex justify-between mt-2 text-[11px] text-[#888] font-light">
              <span>Rollover: {Math.floor(personalBalance * rolloverPct / 100).toFixed(0)}c of {personalBalance.toFixed(0)}c</span>
              {atRiskCredits > 0 && <span className="text-amber-400">{atRiskCredits.toFixed(0)}c at risk of expiration</span>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Spending chart */}
      <Card className="bg-[#111] border-white/[0.06]">
        <CardContent className="p-6">
          <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-1">Analytics</div>
          <h3 className="text-lg font-extralight mb-6">Spending by <strong className="font-semibold">day.</strong></h3>
          <div className="h-48">
            {analytics.spendByDay.some((d) => d.credits > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.spendByDay}>
                  <XAxis dataKey="day" tick={{ fill: "#888", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#888", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 4, fontSize: 12, color: "#fff" }} />
                  <Bar dataKey="credits" fill="#627653" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[#888] text-sm font-light">No spending data yet</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transaction ledger */}
      <Card className="bg-[#111] border-white/[0.06]">
        <CardContent className="p-6">
          <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-1">Ledger</div>
          <h3 className="text-lg font-extralight mb-6">Transaction <strong className="font-semibold">history.</strong></h3>
          {(ledger ?? []).length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-8 h-8 text-[#888] mx-auto mb-3 opacity-30" />
              <p className="text-sm text-[#888] font-light">No transactions yet.</p>
            </div>
          ) : (
            <div className="space-y-0">
              {(ledger ?? []).slice(0, 50).map((tx: any, i: number) => {
                const amount = parseFloat(tx.amount);
                const isCredit = amount > 0;
                const typeLabel = (tx.type || "transaction").replace(/_/g, " ");
                const sourceLabel = tx.source ? ` (${tx.source})` : "";
                return (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-white/[0.03] last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded flex items-center justify-center ${isCredit ? "bg-[#627653]/10" : "bg-red-500/10"}`}>
                        {isCredit ? <ArrowUpRight className="w-3.5 h-3.5 text-[#627653]" /> : <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />}
                      </div>
                      <div>
                        <p className="text-sm font-light capitalize">{typeLabel}{sourceLabel}</p>
                        <p className="text-[11px] text-[#888]">{tx.description || ""}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${isCredit ? "text-[#627653]" : "text-red-400"}`}>
                        {isCredit ? "+" : ""}{amount.toFixed(1)}c
                      </p>
                      <p className="text-[11px] text-[#888]">{new Date(tx.createdAt).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top-up dialog */}
      <Dialog open={topUpOpen} onOpenChange={setTopUpOpen}>
        <DialogContent className="bg-[#111] border-white/[0.06] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-light text-lg">Top up credits</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Amount</label>
              <Input type="number" value={topUpAmount} onChange={(e) => setTopUpAmount(e.target.value)} className="mt-1 bg-white/[0.03] border-white/[0.06]" min={1} />
              <p className="text-[11px] text-[#888] mt-1">{topUpAmount ? `\u20AC${(parseFloat(topUpAmount) * 5).toFixed(0)}` : "\u20AC0"} at \u20AC5/credit</p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[10, 25, 50, 100].map((v) => (
                <button key={v} onClick={() => setTopUpAmount(String(v))} className={`py-2 text-sm border transition-all ${topUpAmount === String(v) ? "border-[#627653] bg-[#627653]/10 text-white" : "border-white/[0.06] text-[#888] hover:border-white/20"}`}>
                  {v}c
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTopUpOpen(false)} className="border-white/10 bg-transparent">Cancel</Button>
            <Button
              disabled={topUpMutation.isPending || !topUpAmount || parseFloat(topUpAmount) <= 0}
              onClick={() => {
                if (personalWallet) topUpMutation.mutate({ walletId: personalWallet.id, amount: parseFloat(topUpAmount) });
                else toast.error("No personal wallet found.");
              }}
              className="bg-[#627653] text-white hover:bg-[#4a5a3f]"
            >
              {topUpMutation.isPending ? "Processing..." : `Add ${topUpAmount}c`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auto top-up dialog */}
      <Dialog open={autoTopUpOpen} onOpenChange={setAutoTopUpOpen}>
        <DialogContent className="bg-[#111] border-white/[0.06] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-light text-lg">Auto Top-Up Settings</DialogTitle>
          </DialogHeader>
          <p className="text-[13px] text-[#888] font-light">Automatically add credits when your balance drops below a threshold.</p>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Threshold (credits)</label>
              <Input type="number" value={autoTopUpThreshold} onChange={(e) => setAutoTopUpThreshold(e.target.value)} className="mt-1 bg-white/[0.03] border-white/[0.06]" min={1} />
              <p className="text-[11px] text-[#888] mt-1">Top-up triggers when balance drops below this</p>
            </div>
            <div>
              <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Top-up amount (credits)</label>
              <Input type="number" value={autoTopUpAmount} onChange={(e) => setAutoTopUpAmount(e.target.value)} className="mt-1 bg-white/[0.03] border-white/[0.06]" min={1} />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            {personalWallet?.autoTopUpEnabled && (
              <Button variant="outline" onClick={() => {
                if (personalWallet) autoTopUpMutation.mutate({ walletId: personalWallet.id, enabled: false });
              }} className="border-red-500/20 text-red-400 bg-transparent hover:bg-red-500/10">
                Disable
              </Button>
            )}
            <Button variant="outline" onClick={() => setAutoTopUpOpen(false)} className="border-white/10 bg-transparent">Cancel</Button>
            <Button
              disabled={autoTopUpMutation.isPending}
              onClick={() => {
                if (personalWallet) autoTopUpMutation.mutate({ walletId: personalWallet.id, enabled: true, threshold: autoTopUpThreshold, amount: autoTopUpAmount });
                else toast.error("No personal wallet found.");
              }}
              className="bg-[#627653] text-white hover:bg-[#4a5a3f]"
            >
              {autoTopUpMutation.isPending ? "Saving..." : "Enable Auto Top-Up"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bundle selection dialog with iDEAL/card choice */}
      <Dialog open={bundleDialogOpen} onOpenChange={setBundleDialogOpen}>
        <DialogContent className="bg-[#111] border-white/[0.06] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-light text-lg">Credits opwaarderen</DialogTitle>
          </DialogHeader>
          <p className="text-[13px] text-[#888] font-light">Kies een bundel en betaal veilig via Stripe.</p>
          {bundles.length === 0 ? (
            <div className="text-center py-8 text-[#888]">Geen bundels beschikbaar</div>
          ) : (
            <div className="space-y-2">
              {bundles.map((bundle: any) => (
                <button
                  key={bundle.id}
                  onClick={() => setSelectedBundle(bundle)}
                  className={`w-full p-4 text-left border transition-all ${
                    selectedBundle?.id === bundle.id
                      ? "border-[#627653] bg-[#627653]/10"
                      : "border-white/[0.06] hover:border-white/20"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{bundle.name}</p>
                      <p className="text-[11px] text-[#888] mt-1">{bundle.creditsPerMonth} credits</p>
                      {bundle.description && (
                        <p className="text-[10px] text-[#888] mt-2">{bundle.description}</p>
                      )}
                    </div>
                    <p className="font-semibold text-[#627653]">&euro;{bundle.priceEur}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Payment method selection */}
          {stripeStatus?.configured && (
            <div className="mt-2">
              <div className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium mb-2">Betaalmethode</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPaymentMethod("ideal")}
                  className={`p-3 border text-left transition-all flex items-center gap-2 ${
                    paymentMethod === "ideal"
                      ? "border-[#627653] bg-[#627653]/10"
                      : "border-white/[0.06] hover:border-white/20"
                  }`}
                >
                  <Banknote className="w-4 h-4 text-[#cc6699]" />
                  <div>
                    <p className="text-sm font-medium">iDEAL</p>
                    <p className="text-[10px] text-[#888]">Nederlandse banken</p>
                  </div>
                </button>
                <button
                  onClick={() => setPaymentMethod("card")}
                  className={`p-3 border text-left transition-all flex items-center gap-2 ${
                    paymentMethod === "card"
                      ? "border-[#627653] bg-[#627653]/10"
                      : "border-white/[0.06] hover:border-white/20"
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-[#4a7c8a]" />
                  <div>
                    <p className="text-sm font-medium">Creditcard</p>
                    <p className="text-[10px] text-[#888]">Visa, Mastercard</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setBundleDialogOpen(false)} className="border-white/10 bg-transparent">Annuleren</Button>
            <Button
              disabled={!selectedBundle || checkoutMutation.isPending}
              onClick={() => {
                if (selectedBundle) {
                  checkoutMutation.mutate({ bundleId: selectedBundle.id, paymentMethod });
                }
              }}
              className="bg-[#627653] text-white hover:bg-[#4a5a3f]"
            >
              {checkoutMutation.isPending ? "Bezig..." : "Afrekenen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment history dialog */}
      <Dialog open={paymentHistoryOpen} onOpenChange={setPaymentHistoryOpen}>
        <DialogContent className="bg-[#111] border-white/[0.06] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-light text-lg">Betaalgeschiedenis</DialogTitle>
          </DialogHeader>
          {paymentHistory.length === 0 ? (
            <div className="text-center py-8 text-[#888]">
              <CreditCard className="w-6 h-6 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-light">Nog geen betalingen</p>
            </div>
          ) : (
            <div className="space-y-0 max-h-80 overflow-y-auto">
              {paymentHistory.map((tx: any) => {
                const statusColor = tx.status === "completed" ? "text-[#627653]" : tx.status === "failed" ? "text-red-400" : "text-amber-400";
                const statusLabel = tx.status === "completed" ? "Betaald" : tx.status === "failed" ? "Mislukt" : "In behandeling";
                return (
                  <div key={tx.id} className="flex items-center justify-between py-3 border-b border-white/[0.03] last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded flex items-center justify-center bg-[#627653]/10">
                        {tx.status === "completed" ? <CheckCircle2 className="w-3.5 h-3.5 text-[#627653]" /> : <Clock className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      <div>
                        <p className="text-sm font-light">{tx.description || `Top-up ${tx.creditsAdded}c`}</p>
                        <p className="text-[11px] text-[#888]">&euro;{parseFloat(tx.amount).toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-[11px] font-medium ${statusColor}`}>{statusLabel}</p>
                      <p className="text-[11px] text-[#888]">{new Date(tx.createdAt).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
