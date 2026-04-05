import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Thermometer, Droplets, Wind, Volume2, Sun, Users,
  Plus, Settings, Gauge, AlertTriangle, Zap, Monitor,
  Lightbulb, AirVent, ChevronRight,
} from "lucide-react";

const sensorIcons: Record<string, any> = {
  temperature: Thermometer,
  humidity: Droplets,
  co2: Wind,
  noise: Volume2,
  light: Sun,
  occupancy: Users,
  pm25: Wind,
  voc: Wind,
};

const sensorUnits: Record<string, string> = {
  temperature: "°C",
  humidity: "%",
  co2: "ppm",
  noise: "dB",
  light: "lux",
  occupancy: "",
  pm25: "µg/m³",
  voc: "ppb",
};

const sensorLabels: Record<string, string> = {
  temperature: "Temperatuur",
  humidity: "Luchtvochtigheid",
  co2: "CO₂",
  noise: "Geluid",
  light: "Licht",
  occupancy: "Bezetting",
  pm25: "Fijnstof (PM2.5)",
  voc: "VOC",
};

function getSensorStatus(type: string, value: number): { status: string; color: string } {
  switch (type) {
    case "temperature": return value < 18 ? { status: "Koud", color: "text-blue-400" } : value > 26 ? { status: "Warm", color: "text-red-400" } : { status: "Goed", color: "text-green-400" };
    case "humidity": return value < 30 ? { status: "Droog", color: "text-amber-400" } : value > 60 ? { status: "Vochtig", color: "text-blue-400" } : { status: "Goed", color: "text-green-400" };
    case "co2": return value > 1000 ? { status: "Hoog", color: "text-red-400" } : value > 800 ? { status: "Matig", color: "text-amber-400" } : { status: "Goed", color: "text-green-400" };
    case "noise": return value > 70 ? { status: "Luid", color: "text-red-400" } : value > 50 ? { status: "Matig", color: "text-amber-400" } : { status: "Stil", color: "text-green-400" };
    default: return { status: "OK", color: "text-green-400" };
  }
}

export default function RoomControl() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedZone, setSelectedZone] = useState<number | null>(null);
  const [showCreateZone, setShowCreateZone] = useState(false);

  const allZones = trpc.sensorReadings.allZonesLatest.useQuery();
  const zones = trpc.roomControlZones.list.useQuery();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light tracking-tight">Room Control</h1>
          <p className="text-muted-foreground text-sm mt-1">Klimaat, verlichting, sensoren & automatisering</p>
        </div>
        <Dialog open={showCreateZone} onOpenChange={setShowCreateZone}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" />Zone toevoegen</Button>
          </DialogTrigger>
          <CreateZoneDialog onClose={() => { setShowCreateZone(false); zones.refetch(); }} />
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview"><Gauge className="w-4 h-4 mr-1" />Overzicht</TabsTrigger>
          <TabsTrigger value="zones"><Monitor className="w-4 h-4 mr-1" />Zones</TabsTrigger>
          <TabsTrigger value="automation"><Zap className="w-4 h-4 mr-1" />Automatisering</TabsTrigger>
          <TabsTrigger value="alerts"><AlertTriangle className="w-4 h-4 mr-1" />Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {selectedZone ? (
            <ZoneDetail zoneId={selectedZone} onBack={() => setSelectedZone(null)} />
          ) : (
            <>
              {/* All zones sensor overview */}
              {allZones.data?.length === 0 ? (
                <Card className="bg-card/50 border-border/30">
                  <CardContent className="py-12 text-center">
                    <Thermometer className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">Nog geen zones geconfigureerd</p>
                    <Button size="sm" className="mt-4" onClick={() => setShowCreateZone(true)}>
                      <Plus className="w-4 h-4 mr-2" />Eerste zone aanmaken
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {allZones.data?.map(({ zone, readings }) => (
                    <Card
                      key={zone.id}
                      className="bg-card/50 border-border/30 hover:border-primary/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedZone(zone.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-medium text-sm">{zone.name}</h3>
                            <p className="text-[10px] text-muted-foreground">
                              {zone.floor && `Verdieping ${zone.floor} · `}
                              {zone.type === "meeting_room" ? "Vergaderruimte" : zone.type === "open_space" ? "Open ruimte" : zone.type === "private_office" ? "Kantoor" : zone.type === "common_area" ? "Gemeenschappelijk" : zone.type === "lobby" ? "Lobby" : "Keuken"}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            {zone.hvacEnabled && <AirVent className="w-3.5 h-3.5 text-blue-400" />}
                            {zone.lightingEnabled && <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />}
                            {zone.avEnabled && <Monitor className="w-3.5 h-3.5 text-purple-400" />}
                          </div>
                        </div>
                        {readings.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2">
                            {readings.slice(0, 4).map(r => {
                              const Icon = sensorIcons[r.sensorType] || Gauge;
                              const val = parseFloat(String(r.value));
                              const { status, color } = getSensorStatus(r.sensorType, val);
                              return (
                                <div key={r.id} className="flex items-center gap-2 p-1.5 rounded bg-muted/20">
                                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                                  <div>
                                    <p className="text-xs font-medium">{val}{sensorUnits[r.sensorType]}</p>
                                    <p className="text-[9px] text-muted-foreground">{sensorLabels[r.sensorType]}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">Geen sensordata</p>
                        )}
                        <div className="flex items-center justify-end mt-2">
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="zones" className="space-y-4">
          {zones.data?.length === 0 ? (
            <Card className="bg-card/50 border-border/30">
              <CardContent className="py-8 text-center text-muted-foreground text-sm">Geen zones</CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {zones.data?.map(zone => (
                <Card key={zone.id} className="bg-card/50 border-border/30">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{zone.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {zone.type} · {zone.floor ? `Verdieping ${zone.floor}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {zone.hvacEnabled && <Badge variant="outline" className="text-[10px]">HVAC</Badge>}
                      {zone.lightingEnabled && <Badge variant="outline" className="text-[10px]">Licht</Badge>}
                      {zone.avEnabled && <Badge variant="outline" className="text-[10px]">AV</Badge>}
                      {zone.blindsEnabled && <Badge variant="outline" className="text-[10px]">Zonwering</Badge>}
                      <Badge variant={zone.isActive ? "default" : "secondary"}>{zone.isActive ? "Actief" : "Inactief"}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="automation">
          <AutomationTab />
        </TabsContent>

        <TabsContent value="alerts">
          <AlertsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ZoneDetail({ zoneId, onBack }: { zoneId: number; onBack: () => void }) {
  const zone = trpc.roomControlZones.getById.useQuery({ id: zoneId });
  const readings = trpc.sensorReadings.latest.useQuery({ zoneId });
  const controlPoints = trpc.roomControlPoints.list.useQuery({ zoneId });
  const setTarget = trpc.roomControlPoints.setTarget.useMutation({
    onSuccess: () => { controlPoints.refetch(); toast.success("Instelling bijgewerkt"); },
  });

  if (!zone.data) return null;

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack}>← Terug naar overzicht</Button>

      <Card className="bg-card/50 border-border/30">
        <CardContent className="p-5">
          <h2 className="text-lg font-medium">{zone.data.name}</h2>
          <p className="text-sm text-muted-foreground">{zone.data.type} · {zone.data.floor ? `Verdieping ${zone.data.floor}` : ""}</p>
        </CardContent>
      </Card>

      {/* Sensor readings */}
      <Card className="bg-card/50 border-border/30">
        <CardHeader><CardTitle className="text-base font-medium">Sensordata</CardTitle></CardHeader>
        <CardContent>
          {readings.data?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Geen sensordata beschikbaar</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {readings.data?.map(r => {
                const Icon = sensorIcons[r.sensorType] || Gauge;
                const val = parseFloat(String(r.value));
                const { status, color } = getSensorStatus(r.sensorType, val);
                return (
                  <div key={r.id} className="p-3 rounded-lg bg-muted/20 border border-border/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`w-5 h-5 ${color}`} />
                      <span className="text-xs text-muted-foreground">{sensorLabels[r.sensorType]}</span>
                    </div>
                    <p className="text-2xl font-semibold">{val}<span className="text-sm text-muted-foreground ml-1">{sensorUnits[r.sensorType]}</span></p>
                    <Badge className={`mt-1 text-[10px] ${color.replace("text-", "bg-").replace("-400", "-500/10")} ${color}`}>{status}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Control points */}
      <Card className="bg-card/50 border-border/30">
        <CardHeader><CardTitle className="text-base font-medium">Besturing</CardTitle></CardHeader>
        <CardContent>
          {controlPoints.data?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Geen besturingspunten geconfigureerd</p>
          ) : (
            <div className="space-y-4">
              {controlPoints.data?.map(cp => (
                <div key={cp.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/20">
                  <div>
                    <p className="text-sm font-medium">{cp.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Huidig: {cp.currentValue || "—"}{cp.unit || ""} · Doel: {cp.targetValue || "—"}{cp.unit || ""}
                    </p>
                  </div>
                  {cp.isControllable && cp.type.includes("temp") && (
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="sm" onClick={() => setTarget.mutate({ id: cp.id, targetValue: String(parseFloat(cp.targetValue || "20") - 0.5) })}>-</Button>
                      <span className="text-sm font-medium w-12 text-center">{cp.targetValue || "20"}°C</span>
                      <Button variant="outline" size="sm" onClick={() => setTarget.mutate({ id: cp.id, targetValue: String(parseFloat(cp.targetValue || "20") + 0.5) })}>+</Button>
                    </div>
                  )}
                  {cp.isControllable && cp.type.includes("light") && (
                    <div className="w-32">
                      <Slider
                        defaultValue={[parseInt(cp.targetValue || "50")]}
                        max={100}
                        step={5}
                        onValueCommit={(v) => setTarget.mutate({ id: cp.id, targetValue: String(v[0]) })}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CreateZoneDialog({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    locationId: 1, name: "", floor: "", type: "meeting_room" as const,
    hvacEnabled: true, lightingEnabled: true, avEnabled: false, blindsEnabled: false,
  });
  const createZone = trpc.roomControlZones.create.useMutation({
    onSuccess: () => { onClose(); toast.success("Zone aangemaakt"); },
  });

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Nieuwe controle zone</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <Input placeholder="Zone naam" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        <Input placeholder="Verdieping" value={form.floor} onChange={e => setForm(p => ({ ...p, floor: e.target.value }))} />
        <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v as any }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="meeting_room">Vergaderruimte</SelectItem>
            <SelectItem value="open_space">Open ruimte</SelectItem>
            <SelectItem value="private_office">Kantoor</SelectItem>
            <SelectItem value="common_area">Gemeenschappelijk</SelectItem>
            <SelectItem value="lobby">Lobby</SelectItem>
            <SelectItem value="kitchen">Keuken</SelectItem>
          </SelectContent>
        </Select>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 text-sm"><Switch checked={form.hvacEnabled} onCheckedChange={v => setForm(p => ({ ...p, hvacEnabled: v }))} />HVAC</label>
          <label className="flex items-center gap-2 text-sm"><Switch checked={form.lightingEnabled} onCheckedChange={v => setForm(p => ({ ...p, lightingEnabled: v }))} />Verlichting</label>
          <label className="flex items-center gap-2 text-sm"><Switch checked={form.avEnabled} onCheckedChange={v => setForm(p => ({ ...p, avEnabled: v }))} />AV</label>
          <label className="flex items-center gap-2 text-sm"><Switch checked={form.blindsEnabled} onCheckedChange={v => setForm(p => ({ ...p, blindsEnabled: v }))} />Zonwering</label>
        </div>
        <Button className="w-full" onClick={() => createZone.mutate(form)} disabled={!form.name}>Aanmaken</Button>
      </div>
    </DialogContent>
  );
}

function AutomationTab() {
  const rules = trpc.automationRules.list.useQuery();
  const toggleRule = trpc.automationRules.toggle.useMutation({
    onSuccess: () => { rules.refetch(); toast.success("Regel bijgewerkt"); },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Automatiseringsregels</h3>
        <Button size="sm" onClick={() => toast.info("Regel aanmaken - coming soon")}><Plus className="w-4 h-4 mr-2" />Regel toevoegen</Button>
      </div>
      {rules.data?.length === 0 ? (
        <Card className="bg-card/50 border-border/30">
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            Nog geen automatiseringsregels. Maak regels aan om klimaat en verlichting automatisch aan te passen op basis van bezetting, schema of sensorwaarden.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {rules.data?.map(rule => (
            <Card key={rule.id} className="bg-card/50 border-border/30">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{rule.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Trigger: {rule.triggerType} → Actie: {rule.actionType}
                  </p>
                </div>
                <Switch checked={rule.isActive ?? false} onCheckedChange={v => toggleRule.mutate({ id: rule.id, isActive: v })} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AlertsTab() {
  const alerts = trpc.alertThresholds.list.useQuery();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Alert drempelwaarden</h3>
        <Button size="sm" onClick={() => toast.info("Alert toevoegen - coming soon")}><Plus className="w-4 h-4 mr-2" />Alert toevoegen</Button>
      </div>
      {alerts.data?.length === 0 ? (
        <Card className="bg-card/50 border-border/30">
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            Geen alerts geconfigureerd. Stel drempelwaarden in voor temperatuur, CO₂, geluid etc. om automatisch meldingen te ontvangen.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {alerts.data?.map(alert => (
            <Card key={alert.id} className="bg-card/50 border-border/30">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{sensorLabels[alert.sensorType] || alert.sensorType}</p>
                  <p className="text-xs text-muted-foreground">
                    {alert.operator} {String(alert.thresholdValue)}{sensorUnits[alert.sensorType] || ""} · Cooldown: {alert.cooldownMinutes} min
                  </p>
                </div>
                <Badge variant={alert.alertLevel === "critical" ? "destructive" : alert.alertLevel === "warning" ? "outline" : "secondary"}>
                  {alert.alertLevel}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
