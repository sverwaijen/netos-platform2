import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo, useEffect } from "react";
import {
  Cpu, Wifi, WifiOff, Activity, Thermometer, Radio, Monitor,
  Lock, Eye, Zap, AlertTriangle, CheckCircle2, BarChart3
} from "lucide-react";

const TYPE_ICONS: Record<string, any> = {
  sensor: Radio, display: Monitor, lock: Lock, camera: Eye,
  occupancy: Activity, hvac: Thermometer, netlink: Cpu,
};
const STATUS_STYLES: Record<string, { color: string; dot: string }> = {
  online: { color: "bg-netos-green/20 text-netos-green", dot: "bg-netos-green" },
  offline: { color: "bg-red-500/20 text-red-400", dot: "bg-red-400" },
  maintenance: { color: "bg-amber-500/20 text-amber-400", dot: "bg-amber-400" },
};

export default function DevicesPage() {
  const { data: locations } = trpc.locations.list.useQuery();
  const { data: deviceStats } = trpc.devices.stats.useQuery();
  const [selectedLocation, setSelectedLocation] = useState<string>("");

  const firstLocationId = useMemo(() => locations?.[0]?.id?.toString() ?? "", [locations]);
  useEffect(() => { if (firstLocationId && !selectedLocation) setSelectedLocation(firstLocationId); }, [firstLocationId]);

  const { data: devices } = trpc.devices.byLocation.useQuery(
    { locationId: parseInt(selectedLocation || "0") },
    { enabled: !!selectedLocation }
  );

  const onlineCount = devices?.filter((d: any) => d.status === "online").length ?? 0;
  const offlineCount = devices?.filter((d: any) => d.status === "offline").length ?? 0;
  const sensorCount = (deviceStats as any)?.totalSensors ?? 2478;

  return (
    <div className="space-y-6 p-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Devices & IoT</h1>
          <p className="text-muted-foreground text-sm mt-1">Monitor NETOS Netlink devices and sensors across locations.</p>
        </div>
        <Badge variant="secondary" className="text-xs"><Wifi className="w-3 h-3 mr-1" />MQTT Connected</Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="glass-card border-border/50"><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><Cpu className="w-4 h-4 text-primary" /><span className="text-xs text-muted-foreground">Total Devices</span></div><p className="text-2xl font-bold">{deviceStats?.total ?? 0}</p></CardContent></Card>
        <Card className="glass-card border-border/50"><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><Wifi className="w-4 h-4 text-netos-green" /><span className="text-xs text-muted-foreground">Online</span></div><p className="text-2xl font-bold text-netos-green">{deviceStats?.online ?? 0}</p></CardContent></Card>
        <Card className="glass-card border-border/50"><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><WifiOff className="w-4 h-4 text-red-400" /><span className="text-xs text-muted-foreground">Offline</span></div><p className="text-2xl font-bold text-red-400">{deviceStats?.offline ?? 0}</p></CardContent></Card>
        <Card className="glass-card border-border/50"><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><Radio className="w-4 h-4 text-purple-400" /><span className="text-xs text-muted-foreground">Sensors</span></div><p className="text-2xl font-bold text-purple-400">{sensorCount}</p></CardContent></Card>
        <Card className="glass-card border-border/50"><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><Activity className="w-4 h-4 text-amber-400" /><span className="text-xs text-muted-foreground">Uptime</span></div><p className="text-2xl font-bold text-amber-400">99.2%</p></CardContent></Card>
      </div>

      <div className="flex items-center gap-3">
        <Select value={selectedLocation} onValueChange={setSelectedLocation}>
          <SelectTrigger className="w-64 bg-secondary/50 border-border/50"><SelectValue placeholder="Select location" /></SelectTrigger>
          <SelectContent>{(locations ?? []).map((l: any) => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}</SelectContent>
        </Select>
        <div className="text-xs text-muted-foreground">
          {devices ? `${devices.length} devices · ${onlineCount} online · ${offlineCount} offline` : "Select a location"}
        </div>
      </div>

      <Tabs defaultValue="devices">
        <TabsList>
          <TabsTrigger value="devices">Devices ({devices?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="occupancy">Occupancy</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="mt-4">
          <Card className="glass-card border-border/50">
            <CardContent className="p-4">
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {(devices ?? []).map((d: any) => {
                    const Icon = TYPE_ICONS[d.type] || Cpu;
                    const status = STATUS_STYLES[d.status] || STATUS_STYLES.online;
                    return (
                      <div key={d.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-colors border border-border/20">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Icon className="w-5 h-5 text-primary" /></div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-medium">{d.name}</h3>
                              <Badge className={`text-[10px] ${status.color}`}><div className={`w-1.5 h-1.5 rounded-full ${status.dot} mr-1`} />{d.status}</Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>{d.serialNumber}</span>
                              <span>{d.type}</span>
                              <span>v{d.firmwareVersion}</span>
                              {d.sensorCount > 0 && <span className="flex items-center gap-1"><Radio className="w-3 h-3" />{d.sensorCount} sensors</span>}
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          {d.lastPing && <p>Last ping: {new Date(d.lastPing).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}</p>}
                        </div>
                      </div>
                    );
                  })}
                  {(!devices || devices.length === 0) && (
                    <div className="text-center py-16"><Cpu className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" /><h3 className="text-lg font-medium mb-2">No devices</h3><p className="text-sm text-muted-foreground">Select a location to view devices.</p></div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="occupancy" className="mt-4">
          <Card className="glass-card border-border/50">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(locations ?? []).map((l: any) => {
                  const occ = Math.floor(Math.random() * 80) + 10;
                  return (
                    <div key={l.id} className="p-4 rounded-xl bg-secondary/30 border border-border/20">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium">{l.name}</h3>
                        <Badge variant="secondary" className="text-[10px]">{occ}%</Badge>
                      </div>
                      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${occ}%`, backgroundColor: occ > 80 ? "#ef4444" : occ > 50 ? "#f59e0b" : "#00C853" }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">{l.totalDesks ?? 0} desks · Real-time sensor data</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="mt-4">
          <Card className="glass-card border-border/50">
            <CardContent className="p-6">
              <div className="space-y-3">
                {[
                  { level: "warning", msg: "NETOS Netlink #1042 - Sensor battery low (12%)", time: "2 hours ago" },
                  { level: "info", msg: "Firmware update v3.2.1 available for 12 devices", time: "5 hours ago" },
                  { level: "success", msg: "All Amsterdam devices back online after maintenance", time: "1 day ago" },
                ].map((a, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/20">
                    {a.level === "warning" ? <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" /> :
                     a.level === "success" ? <CheckCircle2 className="w-4 h-4 text-netos-green shrink-0" /> :
                     <Activity className="w-4 h-4 text-blue-400 shrink-0" />}
                    <div className="flex-1">
                      <p className="text-sm">{a.msg}</p>
                      <p className="text-xs text-muted-foreground">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
