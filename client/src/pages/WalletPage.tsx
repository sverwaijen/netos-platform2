import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { CreditCard, ArrowUpRight, ArrowDownRight, RefreshCw, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function WalletPage() {
  const { isAuthenticated } = useAuth();
  const { data: wallets, isLoading } = trpc.wallets.mine.useQuery(undefined, { enabled: isAuthenticated });
  const { data: ledger } = trpc.wallets.ledger.useQuery({ walletId: 0 }, { enabled: isAuthenticated });
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("50");

  const utils = trpc.useUtils();
  const topUpMutation = trpc.wallets.topup.useMutation({
    onSuccess: () => { toast.success("Credits added."); setTopUpOpen(false); utils.wallets.mine.invalidate(); utils.wallets.ledger.invalidate(); },
    onError: (err: any) => toast.error(err.message),
  });

  const personalWallet = wallets?.find((w: any) => w.type === "personal");
  const companyWallet = wallets?.find((w: any) => w.type === "company");
  const totalBalance = wallets?.reduce((sum: number, w: any) => sum + parseFloat(w.balance), 0) ?? 0;

  const analytics = useMemo(() => {
    if (!ledger || ledger.length === 0) return { spent: 0, earned: 0, breakage: 0, topups: 0, avgDaily: 0, spendByDay: [] };
    const spent = ledger.filter((t: any) => t.type === "debit").reduce((s: number, t: any) => s + Math.abs(parseFloat(t.amount)), 0);
    const earned = ledger.filter((t: any) => t.type !== "debit" && t.type !== "breakage").reduce((s: number, t: any) => s + parseFloat(t.amount), 0);
    const breakage = ledger.filter((t: any) => t.type === "breakage").reduce((s: number, t: any) => s + Math.abs(parseFloat(t.amount)), 0);
    const topups = ledger.filter((t: any) => t.type === "topup").reduce((s: number, t: any) => s + parseFloat(t.amount), 0);
    const dayMap: Record<number, number> = {};
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    ledger.filter((t: any) => t.type === "debit").forEach((t: any) => {
      const d = new Date(t.createdAt).getDay();
      dayMap[d] = (dayMap[d] || 0) + Math.abs(parseFloat(t.amount));
    });
    const spendByDay = dayNames.map((name, i) => ({ day: name, credits: Math.round(dayMap[i] || 0) }));
    const uniqueDays = new Set(ledger.filter((t: any) => t.type === "debit").map((t: any) => new Date(t.createdAt).toDateString())).size;
    return { spent, earned, breakage, topups, avgDaily: uniqueDays > 0 ? spent / uniqueDays : 0, spendByDay };
  }, [ledger]);

  const rolloverCap = personalWallet?.maxRollover ? parseFloat(String(personalWallet.maxRollover)) : 0;
  const currentBalance = personalWallet ? parseFloat(personalWallet.balance) : 0;
  const rolloverPct = rolloverCap > 0 ? Math.min((currentBalance / rolloverCap) * 100, 100) : 0;
  const atRiskCredits = rolloverCap > 0 ? Math.max(currentBalance - rolloverCap, 0) : 0;

  if (isLoading) return <div className="space-y-4 p-1">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>;

  return (
    <div className="space-y-8 p-1">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-3">Credits</div>
          <h1 className="text-[clamp(24px,3vw,36px)] font-extralight tracking-[-0.5px]">
            Your <strong className="font-semibold">wallet.</strong>
          </h1>
        </div>
        <button onClick={() => setTopUpOpen(true)} className="flex items-center gap-2 px-5 py-3 bg-[#627653] text-white text-[10px] font-semibold tracking-[3px] uppercase hover:bg-[#4a5a3f] transition-all">
          <CreditCard className="w-3.5 h-3.5" />Top up
        </button>
      </div>

      {/* Wallet cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-white/[0.04]">
        <div className="bg-[#111] p-6">
          <div className="text-[10px] font-medium tracking-[2px] uppercase text-[#888] mb-2">Total Balance</div>
          <div className="text-[clamp(32px,4vw,48px)] font-extralight tracking-[-1px]">{totalBalance.toFixed(0)}<span className="text-sm text-[#888] ml-1">credits</span></div>
          <div className="flex gap-4 mt-3 text-[11px] text-[#888]">
            <span className="flex items-center gap-1"><ArrowUpRight className="w-3 h-3 text-[#627653]" />+{analytics.earned.toFixed(0)} in</span>
            <span className="flex items-center gap-1"><ArrowDownRight className="w-3 h-3 text-red-400" />-{analytics.spent.toFixed(0)} out</span>
          </div>
        </div>
        <div className="bg-[#111] p-6 border-l-2 border-[#627653]">
          <div className="text-[10px] font-medium tracking-[2px] uppercase text-[#888] mb-2">Personal</div>
          <div className="text-3xl font-extralight">{personalWallet ? parseFloat(personalWallet.balance).toFixed(0) : "0"}<span className="text-sm text-[#888] ml-1">c</span></div>
          {rolloverCap > 0 && <div className="text-[11px] text-[#888] mt-1">Rollover cap: {rolloverCap.toFixed(0)}c</div>}
        </div>
        <div className="bg-[#111] p-6 border-l-2 border-[#b8a472]">
          <div className="text-[10px] font-medium tracking-[2px] uppercase text-[#888] mb-2">Company</div>
          <div className="text-3xl font-extralight">{companyWallet ? parseFloat(companyWallet.balance).toFixed(0) : "0"}<span className="text-sm text-[#888] ml-1">c</span></div>
          <div className="text-[11px] text-[#888] mt-1">Shared pool</div>
        </div>
      </div>

      {/* Analytics strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-white/[0.04]">
        {[
          { label: "Exchange Rate", value: "1c = \u20AC5", icon: CreditCard, color: "#627653" },
          { label: "Avg Daily Spend", value: `${analytics.avgDaily.toFixed(1)}c`, icon: TrendingUp, color: "#b8a472" },
          { label: "Total Top-ups", value: `${analytics.topups.toFixed(0)}c`, icon: ArrowUpRight, color: "#627653" },
          { label: "Breakage", value: `${analytics.breakage.toFixed(0)}c`, icon: RefreshCw, color: "#888" },
        ].map((item, i) => (
          <div key={i} className="bg-[#111] p-5 flex items-center gap-3">
            <item.icon className="w-4 h-4" style={{ color: item.color }} />
            <div>
              <div className="text-[10px] text-[#888] tracking-[1px] uppercase">{item.label}</div>
              <div className="text-lg font-extralight">{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Rollover bar */}
      {rolloverCap > 0 && (
        <Card className="bg-[#111] border-white/[0.06]">
          <CardContent className="p-6">
            <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-3">Rollover Status</div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-[#888] font-light">{currentBalance.toFixed(0)} / {rolloverCap.toFixed(0)} credits</span>
              <span className="font-medium">{rolloverPct.toFixed(0)}%</span>
            </div>
            <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full bg-[#627653] rounded-full transition-all duration-500" style={{ width: `${rolloverPct}%` }} />
            </div>
            {atRiskCredits > 0 && <p className="text-[11px] text-amber-400 font-light mt-2">{atRiskCredits.toFixed(0)} credits at risk of breakage at month end.</p>}
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
                return (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-white/[0.03] last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded flex items-center justify-center ${isCredit ? "bg-[#627653]/10" : "bg-red-500/10"}`}>
                        {isCredit ? <ArrowUpRight className="w-3.5 h-3.5 text-[#627653]" /> : <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />}
                      </div>
                      <div>
                        <p className="text-sm font-light capitalize">{tx.type?.replace("_", " ") || "Transaction"}</p>
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
    </div>
  );
}
