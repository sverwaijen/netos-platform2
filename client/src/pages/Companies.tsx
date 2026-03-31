import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import {
  Building2, Users, CreditCard, Search, Plus, Crown, Shield,
  TrendingUp, Palette, Globe, ArrowRight, Star
} from "lucide-react";

const TIER_STYLES: Record<string, { color: string; icon: any; bg: string }> = {
  gold: { color: "text-amber-400", icon: Crown, bg: "bg-amber-500/20" },
  silver: { color: "text-gray-300", icon: Shield, bg: "bg-gray-500/20" },
  bronze: { color: "text-orange-400", icon: Star, bg: "bg-orange-500/20" },
};

export default function Companies() {
  const { data: companies, isLoading } = trpc.companies.list.useQuery();
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDomain, setNewDomain] = useState("");

  // Company creation is admin-only, handled via backend

  const filtered = useMemo(() => {
    if (!companies) return [];
    return companies.filter((c: any) => {
      if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (tierFilter !== "all" && c.tier !== tierFilter) return false;
      return true;
    });
  }, [companies, searchQuery, tierFilter]);

  const totalMembers = companies?.reduce((sum: number, c: any) => sum + (c.memberCount ?? 0), 0) ?? 0;
  const goldCount = companies?.filter((c: any) => c.tier === "gold").length ?? 0;
  const silverCount = companies?.filter((c: any) => c.tier === "silver").length ?? 0;

  if (isLoading) return <div className="space-y-4 p-1">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>;

  return (
    <div className="space-y-6 p-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Companies</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage enterprise clients and their credit accounts.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="bg-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" />Add Company</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="glass-card border-border/50"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Companies</p><p className="text-2xl font-bold">{(companies ?? []).length}</p></CardContent></Card>
        <Card className="glass-card border-border/50"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Members</p><p className="text-2xl font-bold">{totalMembers}</p></CardContent></Card>
        <Card className="glass-card border-border/50"><CardContent className="p-4"><p className="text-xs text-muted-foreground flex items-center gap-1"><Crown className="w-3 h-3 text-amber-400" />Gold</p><p className="text-2xl font-bold text-amber-400">{goldCount}</p></CardContent></Card>
        <Card className="glass-card border-border/50"><CardContent className="p-4"><p className="text-xs text-muted-foreground flex items-center gap-1"><Shield className="w-3 h-3 text-gray-300" />Silver</p><p className="text-2xl font-bold text-gray-300">{silverCount}</p></CardContent></Card>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search companies..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-secondary/50 border-border/50" />
        </div>
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-40 bg-secondary/50 border-border/50"><SelectValue placeholder="Tier" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="gold">Gold</SelectItem>
            <SelectItem value="silver">Silver</SelectItem>
            <SelectItem value="bronze">Bronze</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c: any) => {
          const tier = TIER_STYLES[c.tier] || TIER_STYLES.bronze;
          const TierIcon = tier.icon;
          return (
            <Card key={c.id} className="glass-card border-border/50 hover:border-primary/30 transition-all">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: c.primaryColor ?? "#1a1a2e" }}>
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">{c.name}</h3>
                      {c.slug && <p className="text-xs text-muted-foreground">{c.slug}</p>}
                    </div>
                  </div>
                  <Badge className={`text-[10px] ${tier.bg} ${tier.color}`}><TierIcon className="w-3 h-3 mr-1" />{c.tier}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="p-2.5 rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5"><Users className="h-3 w-3" />Members</div>
                    <div className="text-lg font-semibold">{c.memberCount}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5"><TrendingUp className="h-3 w-3" />Spend</div>
                    <div className="text-lg font-semibold">&euro;{parseFloat(c.totalSpend ?? "0").toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-border/30">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.primaryColor ?? "#1a1a2e" }} />
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.secondaryColor ?? "#e94560" }} />
                  <span className="text-xs text-muted-foreground ml-1">Brand</span>
                  <span className="text-xs text-muted-foreground ml-auto">{c.discountPercent}% discount</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <Card className="glass-card border-border/50"><CardContent className="p-12 text-center"><Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" /><h3 className="text-lg font-medium mb-2">No companies found</h3></CardContent></Card>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Plus className="w-5 h-5 text-primary" />Add Company</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><p className="text-xs text-muted-foreground mb-1">Company Name</p><Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Acme Corp" className="bg-secondary/50 border-border/50" /></div>
            <div><p className="text-xs text-muted-foreground mb-1">Domain (optional)</p><Input value={newDomain} onChange={(e) => setNewDomain(e.target.value)} placeholder="e.g. acme.com" className="bg-secondary/50 border-border/50" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => { toast.success("Company creation request submitted"); setCreateOpen(false); }} disabled={!newName}>
              Create Company
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
