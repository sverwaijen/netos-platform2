import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, ArrowRight, Wifi, Coffee, Monitor, Users } from "lucide-react";
import { useLocation } from "wouter";

export default function Locations() {
  const { data: locations, isLoading } = trpc.locations.list.useQuery();
  const [, setLocation] = useLocation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Locations</h1>
        <p className="text-muted-foreground text-sm mt-1">7 premium boutique offices across the Netherlands</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 7 }).map((_, i) => (
            <Card key={i} className="bg-card border-border/50 animate-pulse">
              <CardContent className="p-6"><div className="h-32" /></CardContent>
            </Card>
          ))
        ) : (
          (locations ?? []).map((loc) => (
            <Card
              key={loc.id}
              className="bg-card border-border/50 hover:border-primary/30 transition-all duration-300 cursor-pointer group"
              onClick={() => setLocation(`/locations/${loc.slug}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">{loc.name}</h3>
                <p className="text-sm text-muted-foreground mb-1">{loc.address}</p>
                <p className="text-xs text-muted-foreground mb-4">{loc.postalCode} {loc.city}</p>
                <div className="flex items-center gap-4 pt-4 border-t border-border/30">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Monitor className="h-3 w-3" />
                    {loc.totalResources} resources
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-primary">
                    <Wifi className="h-3 w-3" />
                    Active
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
