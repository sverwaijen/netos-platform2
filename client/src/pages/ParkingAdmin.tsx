import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Car, ParkingCircle, Plus, Settings, BarChart3, Clock,
  CreditCard, Shield, Zap, MapPin, TrendingUp, Users,
} from "lucide-react";

export default function ParkingAdmin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedZone, setSelectedZone] = useState<number | null>(null);
  const [showCreateZone, setShowCreateZone] = useState(false);

  const zones = trpc.parkingZones.list.useQuery();
  const stats = trpc.parkingZones.stats.useQuery();
  const activeSessions = trpc.parkingSessions.active.useQuery();

  // Create zone form
  const [newZone, setNewZone] = useState({ name: "", slug: "", totalSpots: 50, type: "outdoor" as const, accessMethod: "barrier" as const, locationId: 1 });
  const createZone = trpc.parkingZones.create.useMutation({
    onSuccess: () => { zones.refetch(); setShowCreateZone(false); toast.success("Parking zone aangemaakt"); },
  });

  const occupancyPercent = stats.data ? Math.round(((stats.data.occupied) / Math.max(stats.data.totalSpots, 1)) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light tracking-tight">Smart Parking</h1>
          <p className="text-muted-foreground text-sm mt-1">Parkeerplaatsbeheer, reserveringen & analytics</p>
        </div>
        <Dialog open={showCreateZone} onOpenChange={setShowCreateZone}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" />Zone toevoegen</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nieuwe parkeerzone</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Zone naam" value={newZone.name} onChange={e => setNewZone(p => ({ ...p, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }))} />
              <Select value={newZone.type} onValueChange={v => setNewZone(p => ({ ...p, type: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="outdoor">Buiten</SelectItem>
                  <SelectItem value="indoor">Binnen</SelectItem>
                  <SelectItem value="underground">Ondergronds</SelectItem>
                  <SelectItem value="rooftop">Dak</SelectItem>
                </SelectContent>
              </Select>
              <Select value={newZone.accessMethod} onValueChange={v => setNewZone(p => ({ ...p, accessMethod: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="barrier">Slagboom</SelectItem>
                  <SelectItem value="anpr">Kentekenherkenning (ANPR)</SelectItem>
                  <SelectItem value="salto">Salto KS</SelectItem>
                  <SelectItem value="manual">Handmatig</SelectItem>
                </SelectContent>
              </Select>
              <Input type="number" placeholder="Aantal plekken" value={newZone.totalSpots} onChange={e => setNewZone(p => ({ ...p, totalSpots: parseInt(e.target.value) || 0 }))} />
              <Button className="w-full" onClick={() => createZone.mutate(newZone)} disabled={createZone.isPending}>
                Aanmaken
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10"><ParkingCircle className="w-5 h-5 text-emerald-500" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Totaal plekken</p>
                <p className="text-xl font-semibold">{stats.data?.totalSpots || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10"><Car className="w-5 h-5 text-red-500" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Bezet</p>
                <p className="text-xl font-semibold">{stats.data?.occupied || 0} <span className="text-xs text-muted-foreground">({occupancyPercent}%)</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10"><Zap className="w-5 h-5 text-green-500" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Beschikbaar</p>
                <p className="text-xl font-semibold">{stats.data?.available || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10"><Shield className="w-5 h-5 text-blue-500" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Gereserveerd</p>
                <p className="text-xl font-semibold">{stats.data?.reserved || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10"><TrendingUp className="w-5 h-5 text-amber-500" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Omzet (maand)</p>
                <p className="text-xl font-semibold">€{stats.data?.revenue?.toFixed(0) || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview"><BarChart3 className="w-4 h-4 mr-1" />Overzicht</TabsTrigger>
          <TabsTrigger value="zones"><MapPin className="w-4 h-4 mr-1" />Zones</TabsTrigger>
          <TabsTrigger value="sessions"><Clock className="w-4 h-4 mr-1" />Sessies</TabsTrigger>
          <TabsTrigger value="pricing"><CreditCard className="w-4 h-4 mr-1" />Tarieven</TabsTrigger>
          <TabsTrigger value="permits"><Shield className="w-4 h-4 mr-1" />Vergunningen</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Occupancy visualization */}
          <Card className="bg-card/50 border-border/30">
            <CardHeader><CardTitle className="text-base font-medium">Live bezetting</CardTitle></CardHeader>
            <CardContent>
              <div className="relative w-full h-8 bg-muted rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                  style={{
                    width: `${occupancyPercent}%`,
                    background: occupancyPercent > 80 ? "rgb(239 68 68)" : occupancyPercent > 50 ? "rgb(245 158 11)" : "rgb(34 197 94)",
                  }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                  {occupancyPercent}% bezet
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Active sessions */}
          <Card className="bg-card/50 border-border/30">
            <CardHeader><CardTitle className="text-base font-medium">Actieve sessies ({activeSessions.data?.length || 0})</CardTitle></CardHeader>
            <CardContent>
              {!activeSessions.data?.length ? (
                <p className="text-sm text-muted-foreground text-center py-8">Geen actieve parkeersessies</p>
              ) : (
                <div className="space-y-2">
                  {activeSessions.data.slice(0, 10).map(session => (
                    <div key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/20">
                      <div className="flex items-center gap-3">
                        <Car className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{session.licensePlate || `Sessie #${session.id}`}</p>
                          <p className="text-xs text-muted-foreground">
                            Sinds {new Date(Number(session.entryTime)).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {Math.round((Date.now() - Number(session.entryTime)) / 60000)} min
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="zones" className="space-y-4">
          {zones.data?.length === 0 ? (
            <Card className="bg-card/50 border-border/30">
              <CardContent className="py-12 text-center">
                <ParkingCircle className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Nog geen parkeerzones geconfigureerd</p>
                <Button size="sm" className="mt-4" onClick={() => setShowCreateZone(true)}>
                  <Plus className="w-4 h-4 mr-2" />Eerste zone aanmaken
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {zones.data?.map(zone => (
                <Card key={zone.id} className="bg-card/50 border-border/30 hover:border-primary/30 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium">{zone.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {zone.type === "outdoor" ? "Buiten" : zone.type === "indoor" ? "Binnen" : zone.type === "underground" ? "Ondergronds" : "Dak"} · {zone.accessMethod === "barrier" ? "Slagboom" : zone.accessMethod === "anpr" ? "ANPR" : zone.accessMethod === "salto" ? "Salto" : "Handmatig"}
                        </p>
                      </div>
                      <Badge variant={zone.isActive ? "default" : "secondary"}>{zone.isActive ? "Actief" : "Inactief"}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground"><ParkingCircle className="w-3.5 h-3.5 inline mr-1" />{zone.totalSpots} plekken</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sessions">
          <Card className="bg-card/50 border-border/30">
            <CardHeader><CardTitle className="text-base font-medium">Sessie geschiedenis</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-8">Sessie-overzicht wordt geladen uit de database. Gebruik de API om sessies te starten/stoppen.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing">
          <PricingTab />
        </TabsContent>

        <TabsContent value="permits">
          <PermitsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PricingTab() {
  const pricing = trpc.parkingPricing.list.useQuery();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", rateType: "hourly" as const, priceEur: "2.50", dayBeforeDiscount: 15, freeMinutes: 15 });
  const createPricing = trpc.parkingPricing.create.useMutation({
    onSuccess: () => { pricing.refetch(); setShowCreate(false); toast.success("Tarief aangemaakt"); },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Tarieven</h3>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-2" />Tarief toevoegen</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nieuw tarief</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Naam" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              <Select value={form.rateType} onValueChange={v => setForm(p => ({ ...p, rateType: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Per uur</SelectItem>
                  <SelectItem value="daily">Per dag</SelectItem>
                  <SelectItem value="monthly">Per maand</SelectItem>
                  <SelectItem value="flat">Vast tarief</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Prijs (EUR)" value={form.priceEur} onChange={e => setForm(p => ({ ...p, priceEur: e.target.value }))} />
              <Input type="number" placeholder="Dag-eerder korting (%)" value={form.dayBeforeDiscount} onChange={e => setForm(p => ({ ...p, dayBeforeDiscount: parseInt(e.target.value) || 0 }))} />
              <Input type="number" placeholder="Gratis minuten" value={form.freeMinutes} onChange={e => setForm(p => ({ ...p, freeMinutes: parseInt(e.target.value) || 0 }))} />
              <Button className="w-full" onClick={() => createPricing.mutate(form)}>Aanmaken</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {pricing.data?.length === 0 ? (
        <Card className="bg-card/50 border-border/30">
          <CardContent className="py-8 text-center text-muted-foreground text-sm">Nog geen tarieven ingesteld</CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {pricing.data?.map(rule => (
            <Card key={rule.id} className="bg-card/50 border-border/30">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{rule.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {rule.rateType === "hourly" ? "Per uur" : rule.rateType === "daily" ? "Per dag" : rule.rateType === "monthly" ? "Per maand" : "Vast"} · €{rule.priceEur}
                    {Number(rule.dayBeforeDiscount) > 0 && ` · ${rule.dayBeforeDiscount}% dag-eerder korting`}
                    {Number(rule.freeMinutes) > 0 && ` · ${rule.freeMinutes} min gratis`}
                  </p>
                </div>
                <Badge variant={rule.isActive ? "default" : "secondary"}>{rule.isActive ? "Actief" : "Inactief"}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function PermitsTab() {
  const permits = trpc.parkingPermits.list.useQuery();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Parkeervergunningen</h3>
        <Button size="sm" onClick={() => toast.info("Vergunning aanmaken - coming soon")}><Plus className="w-4 h-4 mr-2" />Vergunning toevoegen</Button>
      </div>
      {permits.data?.length === 0 ? (
        <Card className="bg-card/50 border-border/30">
          <CardContent className="py-8 text-center text-muted-foreground text-sm">Nog geen vergunningen uitgegeven</CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {permits.data?.map(permit => (
            <Card key={permit.id} className="bg-card/50 border-border/30">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{permit.licensePlate}</p>
                  <p className="text-xs text-muted-foreground">
                    {permit.type} · {permit.vehicleDescription || "Geen beschrijving"}
                  </p>
                </div>
                <Badge variant={permit.status === "active" ? "default" : "secondary"}>{permit.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
