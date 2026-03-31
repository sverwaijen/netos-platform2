import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Cpu, Wifi, WifiOff, Activity, Thermometer } from "lucide-react";
import { useState, useMemo } from "react";

export default function DevicesPage() {
  const { data: locations } = trpc.locations.list.useQuery();
  const { data: deviceStats } = trpc.devices.stats.useQuery();
  const [selectedLocation, setSelectedLocation] = useState<string>("");

  const { data: devices } = trpc.devices.byLocation.useQuery(
    { locationId: parseInt(selectedLocation) },
    { enabled: !!selectedLocation }
  );

  const firstLocationId = useMemo(() => locations?.[0]?.id?.toString() ?? "", [locations]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Devices & IoT</h1>
        <p className="text-muted-foreground text-sm mt-1">Monitor NETOS Netlink devices and sensors</p>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border/50">
          <CardContent className="pt-5 pb-4 px-4">
            <Cpu className="h-4 w-4 text-primary mb-2" />
            <div className="text-2xl font-bold text-foreground">{deviceStats?.total ?? 0}</div>
            <div className="text-xs text-muted-foreground">Total Devices</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="pt-5 pb-4 px-4">
            <Wifi className="h-4 w-4 text-primary mb-2" />
            <div className="text-2xl font-bold text-primary">{deviceStats?.online ?? 0}</div>
            <div className="text-xs text-muted-foreground">Online</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="pt-5 pb-4 px-4">
            <WifiOff className="h-4 w-4 text-destructive mb-2" />
            <div className="text-2xl font-bold text-destructive">{deviceStats?.offline ?? 0}</div>
            <div className="text-xs text-muted-foreground">Offline</div>
          </CardContent>
        </Card>
      </div>

      {/* Location filter */}
      <div className="flex items-center gap-3">
        <Select value={selectedLocation || firstLocationId} onValueChange={setSelectedLocation}>
          <SelectTrigger className="w-64 bg-secondary/50 border-border">
            <SelectValue placeholder="Select location" />
          </SelectTrigger>
          <SelectContent>
            {(locations ?? []).map((l) => (
              <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Device list */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Devices</CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedLocation && !firstLocationId ? (
            <p className="text-sm text-muted-foreground text-center py-8">Select a location to view devices</p>
          ) : (
            <div className="space-y-2">
              {(devices ?? []).map((d) => (
                <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${d.status === "online" ? "bg-primary" : d.status === "offline" ? "bg-destructive" : "bg-chart-3"}`} />
                    <div>
                      <div className="text-sm font-medium text-foreground">{d.name}</div>
                      <div className="text-xs text-muted-foreground">{d.serialNumber} · {d.type} · v{d.firmwareVersion}</div>
                    </div>
                  </div>
                  <Badge variant="secondary" className={d.status === "online" ? "bg-primary/20 text-primary" : d.status === "offline" ? "bg-destructive/20 text-destructive" : "bg-chart-3/20 text-chart-3"}>
                    {d.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
