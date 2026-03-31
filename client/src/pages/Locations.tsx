import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, ArrowRight, Wifi, Monitor, Users, Search, Building2 } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";

export default function Locations() {
  const { data: locations, isLoading } = trpc.locations.list.useQuery();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!locations) return [];
    if (!search) return locations;
    const q = search.toLowerCase();
    return locations.filter((l: any) => l.name.toLowerCase().includes(q) || l.city.toLowerCase().includes(q));
  }, [locations, search]);

  const totalResources = (locations ?? []).reduce((s: number, l: any) => s + (l.totalResources || 0), 0);

  if (isLoading) return <div className="space-y-4 p-1">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>;

  return (
    <div className="space-y-6 p-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Locations</h1>
          <p className="text-muted-foreground text-sm mt-1">7 premium boutique offices across the Netherlands.</p>
        </div>
        <Badge variant="secondary" className="text-xs">{totalResources} resources</Badge>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search locations..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-secondary/50 border-border/50" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="glass-card border-border/50"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Locations</p><p className="text-2xl font-bold">{(locations ?? []).length}</p></CardContent></Card>
        <Card className="glass-card border-border/50"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Resources</p><p className="text-2xl font-bold text-primary">{totalResources}</p></CardContent></Card>
        <Card className="glass-card border-border/50"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Cities</p><p className="text-2xl font-bold text-amber-400">{new Set((locations ?? []).map((l: any) => l.city)).size}</p></CardContent></Card>
        <Card className="glass-card border-border/50"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Status</p><p className="text-2xl font-bold text-netos-green">All Active</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((loc: any) => {
          const occ = Math.floor(Math.random() * 60) + 20;
          return (
            <Card key={loc.id} className="glass-card border-border/50 hover:border-primary/30 transition-all duration-300 cursor-pointer group overflow-hidden" onClick={() => setLocation(`/locations/${loc.slug}`)}>
              <div className="h-1 bg-gradient-to-r from-netos-green/50 to-transparent" />
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-lg font-semibold mb-1">{loc.name}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1"><MapPin className="w-3 h-3" />{loc.address}</p>
                <p className="text-xs text-muted-foreground mb-4">{loc.postalCode} {loc.city}</p>

                {/* Occupancy bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Occupancy</span>
                    <span className={occ > 80 ? "text-red-400" : occ > 50 ? "text-amber-400" : "text-netos-green"}>{occ}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${occ}%`, backgroundColor: occ > 80 ? "#ef4444" : occ > 50 ? "#f59e0b" : "#00C853" }} />
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-3 border-t border-border/30">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Monitor className="w-3 h-3" />{loc.totalResources} resources</span>
                  <span className="flex items-center gap-1.5 text-xs text-netos-green"><Wifi className="w-3 h-3" />Online</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No locations found</h3>
          <p className="text-sm text-muted-foreground">Try a different search term.</p>
        </div>
      )}
    </div>
  );
}
