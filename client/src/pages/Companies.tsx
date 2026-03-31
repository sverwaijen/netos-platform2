import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, TrendingUp } from "lucide-react";

const tierColors: Record<string, string> = {
  bronze: "bg-netos-bronze/20 text-netos-bronze",
  silver: "bg-netos-silver/20 text-netos-silver",
  gold: "bg-netos-gold/20 text-netos-gold",
};

export default function Companies() {
  const { data: companies, isLoading } = trpc.companies.list.useQuery();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Companies</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage enterprise accounts and team wallets</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="bg-card border-border/50 animate-pulse">
              <CardContent className="p-6"><div className="h-24" /></CardContent>
            </Card>
          ))
        ) : (
          (companies ?? []).map((c) => (
            <Card key={c.id} className="bg-card border-border/50 hover:border-primary/20 transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: c.primaryColor ?? "#1a1a2e" }}
                    >
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.slug}</div>
                    </div>
                  </div>
                  <Badge className={tierColors[c.tier ?? "bronze"] ?? ""} variant="secondary">
                    {c.tier}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <Users className="h-3 w-3" />
                      Members
                    </div>
                    <div className="text-lg font-semibold text-foreground">{c.memberCount}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <TrendingUp className="h-3 w-3" />
                      Spend
                    </div>
                    <div className="text-lg font-semibold text-foreground">€{parseFloat(c.totalSpend ?? "0").toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.primaryColor ?? "#1a1a2e" }} />
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.secondaryColor ?? "#e94560" }} />
                  <span className="text-xs text-muted-foreground ml-1">Brand colors</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {c.discountPercent}% discount
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
