import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Monitor, Users, Wifi, Coffee, Lock } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

const typeLabels: Record<string, string> = {
  desk: "Smart Desk",
  meeting_room: "Meeting Room",
  private_office: "Private Office",
  open_space: "Open Space",
  phone_booth: "Phone Booth",
  locker: "Locker",
  gym: "Boutique Gym",
  event_space: "Event Space",
};

const zoneColors: Record<string, string> = {
  zone_0: "bg-muted text-muted-foreground",
  zone_1: "bg-chart-1/20 text-chart-1",
  zone_2: "bg-primary/20 text-primary",
  zone_3: "bg-chart-3/20 text-chart-3",
};

export default function LocationDetail() {
  const params = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const { data: location } = trpc.locations.bySlug.useQuery({ slug: params.slug ?? "" });
  const { data: resources } = trpc.resources.byLocation.useQuery(
    { locationId: location?.id ?? 0 },
    { enabled: !!location?.id }
  );
  const { data: multipliers } = trpc.multipliers.byLocation.useQuery(
    { locationId: location?.id ?? 0 },
    { enabled: !!location?.id }
  );

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const grouped = (resources ?? []).reduce((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type]!.push(r);
    return acc;
  }, {} as Record<string, NonNullable<typeof resources>>);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/locations")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{location?.name ?? "Loading..."}</h1>
          <p className="text-sm text-muted-foreground">{location?.address}, {location?.postalCode} {location?.city}</p>
        </div>
      </div>

      {/* Multipliers */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Day Multipliers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {(multipliers ?? []).map((m) => (
              <div key={m.id} className="text-center p-3 rounded-lg bg-secondary/50">
                <div className="text-xs text-muted-foreground mb-1">{dayNames[m.dayOfWeek]}</div>
                <div className={`text-sm font-bold ${parseFloat(m.multiplier) >= 1 ? "text-chart-3" : "text-primary"}`}>
                  {m.multiplier}x
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resources by type */}
      {Object.entries(grouped).map(([type, items]) => (
        <Card key={type} className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">{typeLabels[type] ?? type}</CardTitle>
              <Badge variant="secondary">{items!.length} available</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items!.slice(0, 9).map((r) => (
                <div key={r.id} className="p-4 rounded-lg bg-secondary/30 border border-border/30 hover:border-primary/30 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{r.name}</span>
                    <Badge className={zoneColors[r.zone] ?? ""} variant="secondary">
                      {r.zone.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {r.capacity} {r.capacity === 1 ? "person" : "people"}
                    </div>
                    <span className="text-xs font-medium text-primary">{r.creditCostPerHour} cr/hr</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-3 bg-transparent"
                    onClick={() => toast.info("Booking flow coming soon")}
                  >
                    Book Now
                  </Button>
                </div>
              ))}
              {items!.length > 9 && (
                <div className="p-4 rounded-lg bg-secondary/30 border border-border/30 flex items-center justify-center">
                  <span className="text-sm text-muted-foreground">+{items!.length - 9} more</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
