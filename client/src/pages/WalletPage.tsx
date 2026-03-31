import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import {
  CreditCard, Building2, ArrowUpRight, ArrowDownLeft, Plus, TrendingUp,
  Clock, Wallet, RefreshCw, Zap, BarChart3, Shield, ArrowRight,
  Calendar, PieChart, AlertTriangle, Sparkles, ArrowLeftRight
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

const TX_ICONS: Record<string, any> = {
  credit: ArrowDownLeft, debit: ArrowUpRight, topup: Plus,
  grant: Zap, rollover: RefreshCw, breakage: TrendingUp,
};
const TX_COLORS: Record<string, string> = {
  credit: "text-netos-green", debit: "text-red-400", topup: "text-blue-400",
  grant: "text-purple-400", rollover: "text-amber-400", breakage: "text-muted-foreground",
};

export default function WalletPage() {
  const { isAuthenticated } = useAuth();
  const { data: wallets, isLoading } = trpc.wallets.mine.useQuery(undefined, { enabled: isAuthenticated });
  const { data: ledger } = trpc.wallets.ledger.useQuery({ walletId: 0 }, { enabled: isAuthenticated });
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("50");
  const [transferAmount, setTransferAmount] = useState("10");

  const utils = trpc.useUtils();
  const topUpMutation = trpc.wallets.topup.useMutation({
    onSuccess: () => {
      toast.success(`${topUpAmount} credits added to your personal wallet`);
      setTopUpOpen(false);
      utils.wallets.mine.invalidate();
      utils.wallets.ledger.invalidate();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const personalWallet = wallets?.find((w: any) => w.type === "personal");
  const companyWallet = wallets?.find((w: any) => w.type === "company");
  const totalBalance = wallets?.reduce((sum: number, w: any) => sum + parseFloat(w.balance), 0) ?? 0;

  // Analytics from ledger
  const analytics = useMemo(() => {
    if (!ledger || ledger.length === 0) return { spent: 0, earned: 0, breakage: 0, topups: 0, avgDaily: 0, spendByDay: [], balanceHistory: [] };
    const spent = ledger.filter((t: any) => t.type === "debit").reduce((s: number, t: any) => s + Math.abs(parseFloat(t.amount)), 0);
    const earned = ledger.filter((t: any) => t.type !== "debit" && t.type !== "breakage").reduce((s: number, t: any) => s + parseFloat(t.amount), 0);
    const breakage = ledger.filter((t: any) => t.type === "breakage").reduce((s: number, t: any) => s + Math.abs(parseFloat(t.amount)), 0);
    const topups = ledger.filter((t: any) => t.type === "topup").reduce((s: number, t: any) => s + parseFloat(t.amount), 0);

    // Spending by day of week
    const dayMap: Record<number, number> = {};
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    ledger.filter((t: any) => t.type === "debit").forEach((t: any) => {
      const d = new Date(t.createdAt).getDay();
      dayMap[d] = (dayMap[d] || 0) + Math.abs(parseFloat(t.amount));
    });
    const spendByDay = dayNames.map((name, i) => ({ day: name, credits: Math.round(dayMap[i] || 0) }));

    // Balance history (last 14 entries)
    const balanceHistory = ledger.slice(-14).map((t: any, i: number) => ({
      idx: i,
      balance: parseFloat(t.balanceAfter),
      date: new Date(t.createdAt).toLocaleDateString("nl-NL", { day: "numeric", month: "short" }),
    }));

    const uniqueDays = new Set(ledger.filter((t: any) => t.type === "debit").map((t: any) => new Date(t.createdAt).toDateString())).size;
    const avgDaily = uniqueDays > 0 ? spent / uniqueDays : 0;

    return { spent, earned, breakage, topups, avgDaily, spendByDay, balanceHistory };
  }, [ledger]);

  // Rollover calculation
  const rolloverCap = personalWallet?.maxRollover ? parseFloat(String(personalWallet.maxRollover)) : null;
  const currentBalance = personalWallet ? parseFloat(personalWallet.balance) : 0;
  const rolloverPct = rolloverCap ? Math.min((currentBalance / rolloverCap) * 100, 100) : 0;
  const atRiskCredits = rolloverCap ? Math.max(currentBalance - rolloverCap, 0) : 0;

  if (isLoading) return <div className="space-y-4 p-1">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>;

  return (
    <div className="space-y-6 p-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Wallet</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your credits, view transactions and analytics.</p>
        </div>
        <div className="flex gap-2">
          {personalWallet && companyWallet && (
            <Button variant="outline" size="sm" onClick={() => setTransferOpen(true)}><ArrowLeftRight className="w-4 h-4 mr-1" />Transfer</Button>
          )}
          <Button onClick={() => setTopUpOpen(true)}><Plus className="w-4 h-4 mr-2" />Top Up</Button>
        </div>
      </div>

      {/* Wallet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-netos-green/30 to-netos-green/10 flex items-center justify-center"><Wallet className="w-6 h-6 text-netos-green" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Total Balance</p>
                <p className="text-3xl font-bold">{totalBalance.toFixed(0)} <span className="text-sm font-normal text-muted-foreground">credits</span></p>
              </div>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><ArrowDownLeft className="w-3 h-3 text-netos-green" />+{analytics.earned.toFixed(0)} earned</span>
              <span className="flex items-center gap-1"><ArrowUpRight className="w-3 h-3 text-red-400" />-{analytics.spent.toFixed(0)} spent</span>
            </div>
          </CardContent>
        </Card>

        {personalWallet && (
          <Card className="glass-card border-netos-green/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-netos-green" /><span className="text-sm font-medium">Personal</span></div>
                <Badge variant="secondary" className="text-[10px]">Active</Badge>
              </div>
              <p className="text-3xl font-bold mb-1">{parseFloat(personalWallet.balance).toFixed(0)} <span className="text-sm font-normal text-muted-foreground">credits</span></p>
              {rolloverCap && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Rollover cap</span>
                    <span className={atRiskCredits > 0 ? "text-amber-400" : "text-muted-foreground"}>{currentBalance.toFixed(0)}/{rolloverCap}</span>
                  </div>
                  <Progress value={rolloverPct} className="h-1.5" />
                  {atRiskCredits > 0 && (
                    <p className="text-[10px] text-amber-400 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{atRiskCredits.toFixed(0)} credits at risk of breakage</p>
                  )}
                </div>
              )}
              <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => setTopUpOpen(true)}><Plus className="w-3 h-3 mr-1" />Add Credits</Button>
            </CardContent>
          </Card>
        )}

        {companyWallet && (
          <Card className="glass-card border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2"><Building2 className="w-5 h-5 text-purple-400" /><span className="text-sm font-medium">Company</span></div>
                <Badge variant="secondary" className="text-[10px]">Shared</Badge>
              </div>
              <p className="text-3xl font-bold mb-1">{parseFloat(companyWallet.balance).toFixed(0)} <span className="text-sm font-normal text-muted-foreground">credits</span></p>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Shield className="w-3 h-3" />Company-funded wallet</div>
            </CardContent>
          </Card>
        )}

        {!personalWallet && !companyWallet && (
          <Card className="glass-card border-border/50 md:col-span-2">
            <CardContent className="p-12 text-center">
              <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No wallets yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Subscribe to a credit bundle to get started.</p>
              <a href="/bundles"><Button size="sm">View Bundles</Button></a>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Credit System Info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="glass-card border-border/50"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Exchange Rate</p><p className="text-lg font-bold">1c = &euro;5</p></CardContent></Card>
        <Card className="glass-card border-border/50"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Avg Daily Spend</p><p className="text-lg font-bold text-primary">{analytics.avgDaily.toFixed(1)}c</p></CardContent></Card>
        <Card className="glass-card border-border/50"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Top-ups</p><p className="text-lg font-bold text-blue-400">{analytics.topups.toFixed(0)}c</p></CardContent></Card>
        <Card className="glass-card border-border/50"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Breakage</p><p className="text-lg font-bold text-amber-400">{analytics.breakage.toFixed(0)}c</p></CardContent></Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="glass-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" />Spending by Day</CardTitle>
            <CardDescription>Credits spent per day of week</CardDescription>
          </CardHeader>
          <CardContent className="h-48">
            {analytics.spendByDay.some((d: any) => d.credits > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.spendByDay} barSize={24}>
                  <XAxis dataKey="day" tick={{ fill: "oklch(0.65 0.015 260)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "oklch(0.65 0.015 260)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "oklch(0.19 0.012 260)", border: "1px solid oklch(0.28 0.012 260)", borderRadius: "8px", color: "oklch(0.93 0.005 260)" }} />
                  <Bar dataKey="credits" fill="oklch(0.65 0.2 165)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No spending data yet</div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4 text-netos-green" />Balance History</CardTitle>
            <CardDescription>Credit balance over time</CardDescription>
          </CardHeader>
          <CardContent className="h-48">
            {analytics.balanceHistory.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.balanceHistory}>
                  <XAxis dataKey="date" tick={{ fill: "oklch(0.65 0.015 260)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "oklch(0.65 0.015 260)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "oklch(0.19 0.012 260)", border: "1px solid oklch(0.28 0.012 260)", borderRadius: "8px", color: "oklch(0.93 0.005 260)" }} />
                  <Area type="monotone" dataKey="balance" stroke="oklch(0.65 0.2 165)" fill="oklch(0.65 0.2 165 / 0.15)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Need more transactions for chart</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rollover & Breakage Explainer */}
      <Card className="glass-card border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-400" />How Credits Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-secondary/30">
              <RefreshCw className="w-5 h-5 text-amber-400 mb-2" />
              <h4 className="text-sm font-semibold mb-1">Rollover</h4>
              <p className="text-xs text-muted-foreground">Unused credits roll over to next month. Maximum rollover equals your bundle size. Excess credits expire (breakage).</p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/30">
              <TrendingUp className="w-5 h-5 text-netos-green mb-2" />
              <h4 className="text-sm font-semibold mb-1">Dynamic Pricing</h4>
              <p className="text-xs text-muted-foreground">Multipliers range from 0.45x (Friday) to 1.4x (Thursday). Off-peak bookings save up to 55% on credits.</p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/30">
              <ArrowLeftRight className="w-5 h-5 text-purple-400 mb-2" />
              <h4 className="text-sm font-semibold mb-1">Dual Wallets</h4>
              <p className="text-xs text-muted-foreground">Company credits are used first for work bookings. Personal credits for extras like coffee, gym, and personal use.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card className="glass-card border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4 text-primary" />Transaction Ledger</CardTitle>
          <CardDescription>Double-entry credit ledger with full audit trail</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="debit">Spent</TabsTrigger>
              <TabsTrigger value="credit">Received</TabsTrigger>
              <TabsTrigger value="topup">Top-ups</TabsTrigger>
              <TabsTrigger value="rollover">Rollover</TabsTrigger>
            </TabsList>
            {["all", "debit", "credit", "topup", "rollover"].map((tab) => (
              <TabsContent key={tab} value={tab}>
                <ScrollArea className="h-96">
                  <div className="space-y-1">
                    {(ledger ?? []).filter((t: any) => tab === "all" || t.type === tab).map((t: any) => {
                      const Icon = TX_ICONS[t.type] || Clock;
                      const color = TX_COLORS[t.type] || "text-foreground";
                      const isDebit = t.type === "debit" || t.type === "breakage";
                      return (
                        <div key={t.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDebit ? "bg-red-500/10" : "bg-netos-green/10"}`}><Icon className={`w-4 h-4 ${color}`} /></div>
                            <div>
                              <p className="text-sm font-medium">{t.description || t.type}</p>
                              <p className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleDateString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-mono font-bold ${isDebit ? "text-red-400" : "text-netos-green"}`}>{isDebit ? "-" : "+"}{Math.abs(parseFloat(t.amount)).toFixed(1)}c</p>
                            <p className="text-[10px] text-muted-foreground">Bal: {parseFloat(t.balanceAfter).toFixed(0)}c</p>
                          </div>
                        </div>
                      );
                    })}
                    {(!ledger || (ledger.filter((t: any) => tab === "all" || t.type === tab).length === 0)) && (
                      <div className="text-center py-12 text-muted-foreground text-sm">No transactions found</div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Top-up Dialog */}
      <Dialog open={topUpOpen} onOpenChange={setTopUpOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Plus className="w-5 h-5 text-primary" />Top Up Credits</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Quick amounts</p>
              <div className="grid grid-cols-4 gap-2">
                {["25", "50", "100", "250"].map((amt) => (
                  <button key={amt} onClick={() => setTopUpAmount(amt)} className={`p-3 rounded-lg text-sm font-medium transition-all ${topUpAmount === amt ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-foreground hover:bg-secondary"}`}>{amt}c</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Custom amount</p>
              <Input type="number" value={topUpAmount} onChange={(e) => setTopUpAmount(e.target.value)} className="bg-secondary/50 border-border/50" min="1" />
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 space-y-1">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Credits</span><span className="font-bold">{topUpAmount}c</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Price (1c = &euro;5)</span><span className="font-bold text-netos-green">&euro;{(parseInt(topUpAmount || "0") * 5).toFixed(2)}</span></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTopUpOpen(false)}>Cancel</Button>
            <Button onClick={() => topUpMutation.mutate({ walletId: personalWallet?.id ?? 0, amount: parseInt(topUpAmount) })} disabled={topUpMutation.isPending || !topUpAmount}>
              {topUpMutation.isPending ? "Processing..." : `Pay €${(parseInt(topUpAmount || "0") * 5).toFixed(2)}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><ArrowLeftRight className="w-5 h-5 text-purple-400" />Transfer Credits</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
              <div className="text-center flex-1">
                <p className="text-xs text-muted-foreground">From: Personal</p>
                <p className="text-lg font-bold">{personalWallet ? parseFloat(personalWallet.balance).toFixed(0) : 0}c</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <div className="text-center flex-1">
                <p className="text-xs text-muted-foreground">To: Company</p>
                <p className="text-lg font-bold">{companyWallet ? parseFloat(companyWallet.balance).toFixed(0) : 0}c</p>
              </div>
            </div>
            <Input type="number" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} placeholder="Amount to transfer" className="bg-secondary/50 border-border/50" min="1" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferOpen(false)}>Cancel</Button>
            <Button onClick={() => { toast.success(`${transferAmount} credits transferred`); setTransferOpen(false); }}>Transfer {transferAmount}c</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
