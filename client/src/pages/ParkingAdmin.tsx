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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Car, ParkingCircle, Plus, BarChart3, Clock,
  CreditCard, Shield, Zap, MapPin, TrendingUp, Users,
  AlertTriangle, UserPlus, QrCode, Activity, Gauge,
} from "lucide-react";
import type { ParkingZone, ParkingPermit, ParkingSession } from "@shared/types";

// ─── Local view-model types ──────────────────────────────────────────
// The parking router uses a `function S(): any` shim over the
// drizzle pg-schema, so the trpc client cannot infer return shapes.
// These local types mirror the rows / objects that the parking
// endpoints actually return so we can drop every `any` callback param
// in this page.

// Mirrors the `parking_zones.type` mysqlEnum.
type ParkingZoneType = "indoor" | "outdoor" | "underground" | "rooftop";

// Mirrors the `parking_zones.accessMethod` mysqlEnum.
type ParkingAccessMethod = "barrier" | "anpr" | "manual" | "salto";

// SLA tiers used on parking pools and permits.
type SlaTier = "platinum" | "gold" | "silver" | "bronze";

// Mirrors the `parking_pools` row shape (the mysql schema does not
// export a $inferSelect type for this table).
type ParkingPool = {
  id: number;
  zoneId: number;
  companyId: number | null;
  name: string;
  guaranteedSpots: number;
  maxMembers: number | null;
  overflowPriceEur: string | null;
  overflowPriceDay: string | null;
  monthlyFeeEur: string | null;
  slaTier: string | null;
  isActive: boolean | null;
};

// Mirrors `PoolStatus` returned by `parkingPools.status` (see
// `server/parking/capacityEngine.ts`).
type ParkingPoolStatus = {
  poolId: number;
  poolName: string;
  guaranteedSpots: number;
  currentGuaranteedUsed: number;
  guaranteedAvailable: number;
  totalPoolMembers: number;
  isGuaranteedFull: boolean;
  overflowActive: number;
  overflowPriceEur: string;
  overflowPriceDay: string;
};

// Mirrors `CapacityState` returned by `parkingZones.capacity`.
type ParkingCapacityState = {
  zoneId: number;
  totalSpots: number;
  reservedSpots: number;
  floatingSpots: number;
  occupied: number;
  available: number;
  occupancyPercent: number;
  overbookingEnabled: boolean;
  overbookingRatio: number;
  maxPermitsAllowed: number;
  currentPermitsIssued: number;
  headroom: number;
  criticalRatio: number;
  predictedPeakToday: number;
  noShowRateAvg: number;
};

// Mirrors the `parking_access_log` row shape.
type ParkingAccessLogEntry = {
  id: number;
  zoneId: number;
  direction: string;
  method: string;
  licensePlate: string | null;
  qrToken: string | null;
  granted: boolean;
  responseTimeMs: number | null;
  timestamp: number;
};

export default function ParkingAdmin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [showCreateZone, setShowCreateZone] = useState(false);

  const zones = trpc.parkingZones.list.useQuery();
  const stats = trpc.parkingZones.stats.useQuery();
  const activeSessions = trpc.parkingSessions.active.useQuery();
  const pools = trpc.parkingPools.list.useQuery();

  const [newZone, setNewZone] = useState<{
    name: string;
    slug: string;
    totalSpots: number;
    reservedSpots: number;
    type: ParkingZoneType;
    accessMethod: ParkingAccessMethod;
    overbookingEnabled: boolean;
    payPerUseEnabled: boolean;
    locationId: number;
  }>({
    name: "", slug: "", totalSpots: 50, reservedSpots: 0,
    type: "outdoor", accessMethod: "anpr",
    overbookingEnabled: false, payPerUseEnabled: false,
    locationId: 1,
  });
  const createZone = trpc.parkingZones.create.useMutation({
    onSuccess: () => { zones.refetch(); setShowCreateZone(false); toast.success("Zone aangemaakt"); },
  });

  const occupancyPercent = stats.data ? Math.round(((stats.data.occupied) / Math.max(stats.data.totalSpots, 1)) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-light tracking-tight">Smart Parking</h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-1">Pools, vergunningen, overboeking & yield management</p>
        </div>
        <Dialog open={showCreateZone} onOpenChange={setShowCreateZone}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" />Zone toevoegen</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nieuwe parkeerzone</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Zone naam" value={newZone.name} onChange={e => setNewZone(p => ({ ...p, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }))} />
              <Select value={newZone.type} onValueChange={v => setNewZone(p => ({ ...p, type: v as ParkingZoneType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="outdoor">Buiten</SelectItem>
                  <SelectItem value="indoor">Binnen</SelectItem>
                  <SelectItem value="underground">Ondergronds</SelectItem>
                  <SelectItem value="rooftop">Dak</SelectItem>
                </SelectContent>
              </Select>
              <Select value={newZone.accessMethod} onValueChange={v => setNewZone(p => ({ ...p, accessMethod: v as ParkingAccessMethod }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="anpr">Kentekenherkenning (ANPR)</SelectItem>
                  <SelectItem value="barrier">Slagboom</SelectItem>
                  <SelectItem value="salto">Salto KS</SelectItem>
                  <SelectItem value="manual">Handmatig</SelectItem>
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" placeholder="Totaal plekken" value={newZone.totalSpots} onChange={e => setNewZone(p => ({ ...p, totalSpots: parseInt(e.target.value) || 0 }))} />
                <Input type="number" placeholder="Vaste plekken (Platinum)" value={newZone.reservedSpots} onChange={e => setNewZone(p => ({ ...p, reservedSpots: parseInt(e.target.value) || 0 }))} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Overboeking inschakelen</span>
                <Switch checked={newZone.overbookingEnabled} onCheckedChange={v => setNewZone(p => ({ ...p, overbookingEnabled: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Pay-per-use (passanten)</span>
                <Switch checked={newZone.payPerUseEnabled} onCheckedChange={v => setNewZone(p => ({ ...p, payPerUseEnabled: v }))} />
              </div>
              <Button className="w-full" onClick={() => createZone.mutate(newZone)} disabled={createZone.isPending}>Aanmaken</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4">
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
              <div className="p-2 rounded-lg bg-blue-500/10"><Users className="w-5 h-5 text-blue-500" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Pool</p>
                <p className="text-xl font-semibold">{(stats.data?.poolGuaranteed || 0) + (stats.data?.poolOverflow || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10"><QrCode className="w-5 h-5 text-purple-500" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Bezoekers</p>
                <p className="text-xl font-semibold">{stats.data?.visitors || 0}</p>
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
        <TabsList className="w-full overflow-x-auto flex">
          <TabsTrigger value="overview" className="text-xs sm:text-sm flex-shrink-0"><BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />Overzicht</TabsTrigger>
          <TabsTrigger value="pools" className="text-xs sm:text-sm flex-shrink-0"><Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />Pools</TabsTrigger>
          <TabsTrigger value="zones" className="text-xs sm:text-sm flex-shrink-0"><MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />Zones</TabsTrigger>
          <TabsTrigger value="yield" className="text-xs sm:text-sm flex-shrink-0"><Gauge className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />Yield</TabsTrigger>
          <TabsTrigger value="sessions" className="text-xs sm:text-sm flex-shrink-0"><Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />Sessies</TabsTrigger>
          <TabsTrigger value="permits" className="text-xs sm:text-sm flex-shrink-0"><Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />Vergunningen</TabsTrigger>
          <TabsTrigger value="access" className="text-xs sm:text-sm flex-shrink-0"><Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />Toegang</TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview" className="space-y-4">
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
                <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">{occupancyPercent}% bezet</span>
              </div>
              {/* Breakdown bar */}
              <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />Pool gegarandeerd: {stats.data?.poolGuaranteed || 0}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" />Pool overflow: {stats.data?.poolOverflow || 0}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />Members: {(stats.data?.occupied || 0) - (stats.data?.poolGuaranteed || 0) - (stats.data?.poolOverflow || 0) - (stats.data?.visitors || 0) - (stats.data?.payPerUse || 0)}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" />Bezoekers: {stats.data?.visitors || 0}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />Pay-per-use: {stats.data?.payPerUse || 0}</span>
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
                  {activeSessions.data.slice(0, 15).map((session: ParkingSession) => (
                    <div key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/20">
                      <div className="flex items-center gap-3">
                        <Car className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{session.licensePlate || `Sessie #${session.id}`}</p>
                          <p className="text-xs text-muted-foreground">
                            Sinds {new Date(Number(session.entryTime)).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
                            {session.entryMethod && ` · ${session.entryMethod.toUpperCase()}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {session.accessType === "pool_guaranteed" ? "Pool ✓" :
                           session.accessType === "pool_overflow" ? "Pool €" :
                           session.accessType === "visitor" ? "Bezoeker" :
                           session.accessType === "pay_per_use" ? "Pay-per-use" :
                           session.accessType === "external" ? "Extern" : "Member"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {Math.round((Date.now() - Number(session.entryTime)) / 60000)} min
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Pools Tab ── */}
        <TabsContent value="pools" className="space-y-4">
          <PoolsTab />
        </TabsContent>

        {/* ── Zones Tab ── */}
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
              {zones.data?.map((zone: ParkingZone) => (
                <Card key={zone.id} className="bg-card/50 border-border/30 hover:border-primary/30 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium">{zone.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {zone.type === "outdoor" ? "Buiten" : zone.type === "indoor" ? "Binnen" : zone.type === "underground" ? "Ondergronds" : "Dak"}
                          {" · "}{zone.accessMethod === "anpr" ? "ANPR" : zone.accessMethod === "barrier" ? "Slagboom" : zone.accessMethod === "salto" ? "Salto" : "Handmatig"}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {zone.overbookingEnabled && <Badge variant="outline" className="text-xs">Overboekt</Badge>}
                        {zone.payPerUseEnabled && <Badge variant="outline" className="text-xs">Pay-per-use</Badge>}
                        <Badge variant={zone.isActive ? "default" : "secondary"}>{zone.isActive ? "Actief" : "Inactief"}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground"><ParkingCircle className="w-3.5 h-3.5 inline mr-1" />{zone.totalSpots} plekken</span>
                      {(zone.reservedSpots ?? 0) > 0 && <span className="text-muted-foreground"><Shield className="w-3.5 h-3.5 inline mr-1" />{zone.reservedSpots} vast (Platinum)</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Yield Management Tab ── */}
        <TabsContent value="yield" className="space-y-4">
          <YieldTab zones={zones.data || []} />
        </TabsContent>

        {/* ── Sessions Tab ── */}
        <TabsContent value="sessions">
          <SessionsTab />
        </TabsContent>

        {/* ── Permits Tab ── */}
        <TabsContent value="permits">
          <PermitsTab />
        </TabsContent>

        {/* ── Access Log Tab ── */}
        <TabsContent value="access">
          <AccessLogTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Pools Tab ───────────────────────────────────────────────────

function PoolsTab() {
  const pools = trpc.parkingPools.list.useQuery();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<{
    zoneId: number;
    name: string;
    guaranteedSpots: number;
    maxMembers: number;
    overflowPriceEur: string;
    overflowPriceDay: string;
    monthlyFeeEur: string;
    slaTier: SlaTier;
  }>({
    zoneId: 1, name: "", guaranteedSpots: 30, maxMembers: 100,
    overflowPriceEur: "2.50", overflowPriceDay: "15.00", monthlyFeeEur: "500.00",
    slaTier: "gold",
  });
  const createPool = trpc.parkingPools.create.useMutation({
    onSuccess: () => { pools.refetch(); setShowCreate(false); toast.success("Pool aangemaakt"); },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-medium">Parkeer Pools</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Gedeelde vergunningen: N plekken voor M gebruikers</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-2" />Pool aanmaken</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nieuwe parkeer pool</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Pool naam (bijv. Bedrijf X)" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Gegarandeerde plekken</label>
                  <Input type="number" value={form.guaranteedSpots} onChange={e => setForm(p => ({ ...p, guaranteedSpots: parseInt(e.target.value) || 0 }))} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Max leden (0 = onbeperkt)</label>
                  <Input type="number" value={form.maxMembers} onChange={e => setForm(p => ({ ...p, maxMembers: parseInt(e.target.value) || 0 }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Overflow prijs/uur</label>
                  <Input value={form.overflowPriceEur} onChange={e => setForm(p => ({ ...p, overflowPriceEur: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Overflow dagmaximum</label>
                  <Input value={form.overflowPriceDay} onChange={e => setForm(p => ({ ...p, overflowPriceDay: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Maandelijks abonnement</label>
                <Input value={form.monthlyFeeEur} onChange={e => setForm(p => ({ ...p, monthlyFeeEur: e.target.value }))} />
              </div>
              <Select value={form.slaTier} onValueChange={v => setForm(p => ({ ...p, slaTier: v as SlaTier }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="platinum">Platinum (100% garantie)</SelectItem>
                  <SelectItem value="gold">Gold (99,5% garantie)</SelectItem>
                  <SelectItem value="silver">Silver (95% garantie)</SelectItem>
                  <SelectItem value="bronze">Bronze (daluren)</SelectItem>
                </SelectContent>
              </Select>
              <Button className="w-full" onClick={() => createPool.mutate(form)} disabled={createPool.isPending}>Pool aanmaken</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {pools.data?.length === 0 ? (
        <Card className="bg-card/50 border-border/30">
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Nog geen pools aangemaakt</p>
            <p className="text-xs text-muted-foreground mt-1">Maak een pool aan om plekken te delen met een groep gebruikers</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {pools.data?.map((pool: ParkingPool) => (
            <PoolCard key={pool.id} pool={pool} />
          ))}
        </div>
      )}
    </div>
  );
}

function PoolCard({ pool }: { pool: ParkingPool }) {
  const status = trpc.parkingPools.status.useQuery({ poolId: pool.id });
  const members = trpc.parkingPools.members.useQuery({ poolId: pool.id });

  const s = status.data as ParkingPoolStatus | undefined;
  const guaranteedPercent = s ? Math.round((s.currentGuaranteedUsed / Math.max(s.guaranteedSpots, 1)) * 100) : 0;

  return (
    <Card className="bg-card/50 border-border/30">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-medium">{pool.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {s?.totalPoolMembers || 0} leden · {pool.guaranteedSpots} gegarandeerde plekken
            </p>
          </div>
          <Badge variant={pool.slaTier === "platinum" ? "default" : pool.slaTier === "gold" ? "default" : "secondary"} className={
            pool.slaTier === "platinum" ? "bg-slate-700" :
            pool.slaTier === "gold" ? "bg-amber-600" :
            pool.slaTier === "silver" ? "bg-gray-400 text-gray-900" : "bg-orange-800"
          }>
            {(pool.slaTier ?? "").charAt(0).toUpperCase() + (pool.slaTier ?? "").slice(1)}
          </Badge>
        </div>

        {/* Pool occupancy bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Pool bezetting</span>
            <span>{s?.currentGuaranteedUsed || 0}/{s?.guaranteedSpots || pool.guaranteedSpots} gegarandeerd</span>
          </div>
          <div className="relative w-full h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${guaranteedPercent}%` }}
            />
          </div>
          {s?.isGuaranteedFull && (
            <p className="text-xs text-amber-500 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Pool vol — overflow actief ({s.overflowActive} auto's à €{s.overflowPriceEur}/uur)
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          <div className="bg-muted/30 rounded-lg p-2">
            <p className="text-lg font-semibold">{s?.guaranteedAvailable || 0}</p>
            <p className="text-[10px] text-muted-foreground">Vrij (garantie)</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-2">
            <p className="text-lg font-semibold">{s?.overflowActive || 0}</p>
            <p className="text-[10px] text-muted-foreground">Overflow</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-2">
            <p className="text-lg font-semibold">€{pool.monthlyFeeEur}</p>
            <p className="text-[10px] text-muted-foreground">Maand</p>
          </div>
        </div>

        {/* Members preview */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{members.data?.length || 0} leden gekoppeld</span>
          <Button variant="ghost" size="sm" className="text-xs h-7">
            <UserPlus className="w-3 h-3 mr-1" />Lid toevoegen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Yield Management Tab ────────────────────────────────────────

function YieldTab({ zones }: { zones: ParkingZone[] }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium">Yield Management & Overboeking</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Overboekingsadvies per zone op basis van het Critical Ratio model</p>
      </div>
      {zones.length === 0 ? (
        <Card className="bg-card/50 border-border/30">
          <CardContent className="py-8 text-center text-muted-foreground text-sm">Maak eerst een zone aan</CardContent>
        </Card>
      ) : (
        zones.map(zone => <YieldZoneCard key={zone.id} zone={zone} />)
      )}
    </div>
  );
}

function YieldZoneCard({ zone }: { zone: ParkingZone }) {
  const capacity = trpc.parkingZones.capacity.useQuery({ zoneId: zone.id });
  const c = capacity.data as ParkingCapacityState | undefined;

  return (
    <Card className="bg-card/50 border-border/30">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-medium">{zone.name}</h3>
            <p className="text-xs text-muted-foreground">{zone.totalSpots} plekken · {zone.overbookingEnabled ? "Overboeking aan" : "Overboeking uit"}</p>
          </div>
          <Badge variant={
            !c ? "secondary" :
            c.headroom > 10 ? "default" :
            c.headroom > 0 ? "secondary" : "destructive"
          } className={
            !c ? "" :
            c.headroom > 10 ? "bg-green-600" :
            c.headroom > 0 ? "bg-amber-600" : ""
          }>
            {!c ? "Laden..." : c.headroom > 10 ? "Laag risico" : c.headroom > 0 ? "Medium risico" : "Hoog risico"}
          </Badge>
        </div>

        {c && (
          <div className="space-y-4">
            {/* Key metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Bezetting</p>
                <p className="text-lg font-semibold">{c.occupancyPercent}%</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Vergunningen</p>
                <p className="text-lg font-semibold">{c.currentPermitsIssued}/{c.maxPermitsAllowed}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Headroom</p>
                <p className="text-lg font-semibold text-green-500">+{Math.max(0, c.headroom)}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">No-show rate</p>
                <p className="text-lg font-semibold">{(c.noShowRateAvg * 100).toFixed(0)}%</p>
              </div>
            </div>

            {/* Overbooking formula */}
            <div className="bg-muted/20 rounded-lg p-4 border border-border/20">
              <p className="text-xs font-medium mb-2">Overboekingsmodel</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                <span className="text-muted-foreground">Overboekingsratio:</span>
                <span>{c.overbookingRatio}x ({((c.overbookingRatio - 1) * 100).toFixed(0)}% extra)</span>
                <span className="text-muted-foreground">Critical ratio (Cu/(Cu+Co)):</span>
                <span>{(c.criticalRatio * 100).toFixed(1)}%</span>
                <span className="text-muted-foreground">Floating plekken:</span>
                <span>{c.floatingSpots} (totaal {c.totalSpots} − {c.reservedSpots} vast)</span>
                <span className="text-muted-foreground">Max vergunningen (veilig):</span>
                <span className="font-medium">{c.maxPermitsAllowed}</span>
              </div>
            </div>

            {/* Advice */}
            {c.headroom > 0 ? (
              <p className="text-xs text-green-500">
                U kunt veilig nog {c.headroom} vergunningen uitgeven op basis van de huidige no-show rate van {(c.noShowRateAvg * 100).toFixed(0)}%.
              </p>
            ) : (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Maximum bereikt. Meer vergunningen verhogen het risico op SLA-schendingen.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Sessions Tab ────────────────────────────────────────────────

function SessionsTab() {
  const sessions = trpc.parkingSessions.active.useQuery();

  return (
    <Card className="bg-card/50 border-border/30">
      <CardHeader><CardTitle className="text-base font-medium">Actieve sessies ({sessions.data?.length || 0})</CardTitle></CardHeader>
      <CardContent>
        {!sessions.data?.length ? (
          <p className="text-sm text-muted-foreground text-center py-8">Geen actieve parkeersessies</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 text-xs text-muted-foreground">
                  <th className="text-left py-2 px-2">Kenteken</th>
                  <th className="text-left py-2 px-2">Type</th>
                  <th className="text-left py-2 px-2">Methode</th>
                  <th className="text-left py-2 px-2">Sinds</th>
                  <th className="text-right py-2 px-2">Duur</th>
                </tr>
              </thead>
              <tbody>
                {sessions.data.map((s: ParkingSession) => (
                  <tr key={s.id} className="border-b border-border/10">
                    <td className="py-2 px-2 font-mono text-xs">{s.licensePlate || "—"}</td>
                    <td className="py-2 px-2">
                      <Badge variant="outline" className="text-[10px]">
                        {s.accessType === "pool_guaranteed" ? "Pool ✓" :
                         s.accessType === "pool_overflow" ? "Pool €" :
                         s.accessType === "visitor" ? "Bezoeker" :
                         s.accessType === "pay_per_use" ? "Betaald" :
                         s.accessType === "external" ? "Extern" : "Member"}
                      </Badge>
                    </td>
                    <td className="py-2 px-2 text-xs text-muted-foreground">{s.entryMethod?.toUpperCase() || "—"}</td>
                    <td className="py-2 px-2 text-xs">{new Date(Number(s.entryTime)).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="py-2 px-2 text-xs text-right">{Math.round((Date.now() - Number(s.entryTime)) / 60000)} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Permits Tab ─────────────────────────────────────────────────

function PermitsTab() {
  const permits = trpc.parkingPermits.list.useQuery();

  const tierColor = (tier: string) => {
    switch (tier) {
      case "platinum": return "bg-slate-700";
      case "gold": return "bg-amber-600";
      case "silver": return "bg-gray-400 text-gray-900";
      case "bronze": return "bg-orange-800";
      default: return "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Parkeervergunningen</h3>
        <Button size="sm" onClick={() => toast.info("Vergunning aanmaken via Pools of individueel")}><Plus className="w-4 h-4 mr-2" />Vergunning toevoegen</Button>
      </div>
      {permits.data?.length === 0 ? (
        <Card className="bg-card/50 border-border/30">
          <CardContent className="py-8 text-center text-muted-foreground text-sm">Nog geen vergunningen uitgegeven</CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {permits.data?.map((permit: ParkingPermit) => (
            <Card key={permit.id} className="bg-card/50 border-border/30">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium text-sm font-mono">{permit.licensePlate}</p>
                    <p className="text-xs text-muted-foreground">
                      {permit.type} · {permit.vehicleDescription || "Geen beschrijving"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {permit.slaTier && (
                    <Badge className={`text-[10px] ${tierColor(permit.slaTier)}`}>
                      {permit.slaTier.charAt(0).toUpperCase() + permit.slaTier.slice(1)}
                    </Badge>
                  )}
                  <Badge variant={permit.status === "active" ? "default" : "secondary"}>{permit.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Access Log Tab ──────────────────────────────────────────────

function AccessLogTab() {
  const accessLog = trpc.parkingAccess.log.useQuery({ limit: 50 });
  const slaStats = trpc.parkingSla.stats.useQuery();

  return (
    <div className="space-y-4">
      {/* SLA violations summary */}
      {slaStats.data && slaStats.data.total > 0 && (
        <Card className="bg-card/50 border-red-500/20 border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm font-medium">SLA Schendingen</p>
                <p className="text-xs text-muted-foreground">
                  {slaStats.data.total} totaal · {slaStats.data.pending} openstaand · €{slaStats.data.totalCompensation} compensatie
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-card/50 border-border/30">
        <CardHeader><CardTitle className="text-base font-medium">Toegangslog</CardTitle></CardHeader>
        <CardContent>
          {!accessLog.data?.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nog geen toegangsgebeurtenissen</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30 text-xs text-muted-foreground">
                    <th className="text-left py-2 px-2">Tijd</th>
                    <th className="text-left py-2 px-2">Richting</th>
                    <th className="text-left py-2 px-2">Kenteken</th>
                    <th className="text-left py-2 px-2">Methode</th>
                    <th className="text-left py-2 px-2">Status</th>
                    <th className="text-right py-2 px-2">Latency</th>
                  </tr>
                </thead>
                <tbody>
                  {accessLog.data.map((log: ParkingAccessLogEntry) => (
                    <tr key={log.id} className="border-b border-border/10">
                      <td className="py-2 px-2 text-xs">{new Date(Number(log.timestamp)).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</td>
                      <td className="py-2 px-2 text-xs">{log.direction === "entry" ? "↗ In" : "↙ Uit"}</td>
                      <td className="py-2 px-2 font-mono text-xs">{log.licensePlate || log.qrToken?.slice(0, 8) || "—"}</td>
                      <td className="py-2 px-2 text-xs">{log.method.toUpperCase()}</td>
                      <td className="py-2 px-2">
                        <Badge variant={log.granted ? "default" : "destructive"} className="text-[10px]">
                          {log.granted ? "Toegelaten" : "Geweigerd"}
                        </Badge>
                      </td>
                      <td className="py-2 px-2 text-xs text-right text-muted-foreground">{log.responseTimeMs || "—"}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
