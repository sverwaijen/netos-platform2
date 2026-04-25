import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Layers, DollarSign, ShieldCheck, Clock, Coffee, CalendarOff,
  Plus, Pencil, Trash2, Settings2, AlertTriangle, ChevronRight,
  Monitor, Users, Zap, Timer, Ban, CheckCircle2, Info, Building2,
} from "lucide-react";
import { useState, useMemo } from "react";
import RozAdminTab from "@/components/RozAdminTab";

const CHARGING_UNITS: Record<string, string> = {
  per_hour: "Per Hour", per_day: "Per Day", per_use: "Per Use",
  per_week: "Per Week", per_month: "Per Month",
};

const CONDITION_TYPES: Record<string, string> = {
  customer_type: "Customer Type", plan_type: "Plan Type", tier_type: "Tier Type",
  time_of_day: "Time of Day", day_of_week: "Day of Week",
  advance_booking: "Advance Booking", booking_length: "Booking Length", zone_access: "Zone Access",
};

const LIMIT_TYPES: Record<string, string> = {
  block_booking: "Block Booking", restrict_hours: "Restrict Hours",
  max_duration: "Max Duration", min_duration: "Min Duration",
  max_advance_days: "Max Advance Days", min_advance_hours: "Min Advance Hours",
  max_bookings_per_day: "Max Bookings/Day", max_bookings_per_week: "Max Bookings/Week",
  require_approval: "Require Approval",
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// ─── Resource Types Tab ───
function ResourceTypesTab() {
  const { data: types, isLoading } = trpc.resourceTypes.list.useQuery();
  const utils = trpc.useUtils();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "", icon: "Monitor", defaultCapacity: 1, chargingUnit: "per_hour" as const, timeSlotMinutes: 15 });
  const createMut = trpc.resourceTypes.create.useMutation({
    onSuccess: () => { utils.resourceTypes.list.invalidate(); setShowCreate(false); toast.success("Resource type created"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.resourceTypes.delete.useMutation({
    onSuccess: () => { utils.resourceTypes.list.invalidate(); toast.success("Resource type deactivated"); },
  });

  if (isLoading) return <div className="animate-pulse space-y-3">{[1,2,3].map((i: any) => <div key={i} className="h-20 bg-white/5 rounded-lg" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Resource Types</h3>
          <p className="text-sm text-muted-foreground mt-1">Define categories like Hot Desk, Meeting Room, Private Office with default pricing units and time slots.</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-[#627653] hover:bg-[#4e5f42]"><Plus className="w-4 h-4 mr-1" /> Add Type</Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1a1a] border-white/10">
            <DialogHeader><DialogTitle>New Resource Type</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Meeting Room" className="bg-white/5 border-white/10" /></div>
                <div><Label>Slug</Label><Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="meeting-room" className="bg-white/5 border-white/10" /></div>
              </div>
              <div><Label>Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-white/5 border-white/10" /></div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>Default Capacity</Label><Input type="number" value={form.defaultCapacity} onChange={e => setForm(f => ({ ...f, defaultCapacity: parseInt(e.target.value) || 1 }))} className="bg-white/5 border-white/10" /></div>
                <div>
                  <Label>Charging Unit</Label>
                  <Select value={form.chargingUnit} onValueChange={v => setForm(f => ({ ...f, chargingUnit: v as any }))}>
                    <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(CHARGING_UNITS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Time Slot (min)</Label><Input type="number" value={form.timeSlotMinutes} onChange={e => setForm(f => ({ ...f, timeSlotMinutes: parseInt(e.target.value) || 15 }))} className="bg-white/5 border-white/10" /></div>
              </div>
              <Button className="w-full bg-[#627653] hover:bg-[#4e5f42]" onClick={() => createMut.mutate(form)} disabled={createMut.isPending}>
                {createMut.isPending ? "Creating..." : "Create Resource Type"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {types?.map((t: any) => (
          <Card key={t.id} className="bg-white/[0.03] border-white/10 hover:bg-white/[0.06] transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#627653]/20 flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-[#627653]" />
                </div>
                <div>
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                    <span>Slug: {t.slug}</span>
                    <span>Capacity: {t.defaultCapacity}</span>
                    <span>{CHARGING_UNITS[t.chargingUnit]}</span>
                    <span>{t.timeSlotMinutes}min slots</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[#627653] border-[#627653]/30">{CHARGING_UNITS[t.chargingUnit]}</Badge>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => deleteMut.mutate({ id: t.id })}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!types || types.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">
            <Layers className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No resource types configured yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Resource Rates Tab ───
function ResourceRatesTab() {
  const { data: rates, isLoading } = trpc.resourceRates.list.useQuery();
  const { data: types } = trpc.resourceTypes.list.useQuery();
  const utils = trpc.useUtils();
  const [showCreate, setShowCreate] = useState(false);
  const [filterTypeId, setFilterTypeId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "", resourceTypeId: 0, creditCost: "5.00",
    chargingUnit: "per_hour" as const, maxPriceCap: "", initialFixedCost: "",
    initialFixedMinutes: 0, perAttendeePricing: false, isDefault: false,
    appliesToCustomerType: "all" as const, validTimeStart: "", validTimeEnd: "",
    sortOrder: 0,
  });

  const createMut = trpc.resourceRates.create.useMutation({
    onSuccess: () => { utils.resourceRates.list.invalidate(); setShowCreate(false); toast.success("Rate created"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.resourceRates.delete.useMutation({
    onSuccess: () => { utils.resourceRates.list.invalidate(); toast.success("Rate deactivated"); },
  });

  const filteredRates = useMemo(() => {
    if (!rates) return [];
    if (!filterTypeId) return rates;
    return rates.filter((r: any) => r.resourceTypeId === filterTypeId);
  }, [rates, filterTypeId]);

  const getTypeName = (id: number) => types?.find((t: any) => t.id === id)?.name ?? `Type #${id}`;

  if (isLoading) return <div className="animate-pulse space-y-3">{[1,2,3].map((i: any) => <div key={i} className="h-20 bg-white/5 rounded-lg" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Pricing Rates</h3>
          <p className="text-sm text-muted-foreground mt-1">Multi-rate pricing per resource type. Set standard, member, off-peak, and per-attendee rates with price caps.</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-[#627653] hover:bg-[#4e5f42]"><Plus className="w-4 h-4 mr-1" /> Add Rate</Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1a1a] border-white/10 max-w-lg">
            <DialogHeader><DialogTitle>New Pricing Rate</DialogTitle></DialogHeader>
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-4 pr-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Standard Rate" className="bg-white/5 border-white/10" /></div>
                  <div>
                    <Label>Resource Type</Label>
                    <Select value={String(form.resourceTypeId || "")} onValueChange={v => setForm(f => ({ ...f, resourceTypeId: parseInt(v) }))}>
                      <SelectTrigger className="bg-white/5 border-white/10"><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>{types?.map((t: any) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><Label>Credit Cost</Label><Input value={form.creditCost} onChange={e => setForm(f => ({ ...f, creditCost: e.target.value }))} className="bg-white/5 border-white/10" /></div>
                  <div>
                    <Label>Charging Unit</Label>
                    <Select value={form.chargingUnit} onValueChange={v => setForm(f => ({ ...f, chargingUnit: v as any }))}>
                      <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(CHARGING_UNITS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Max Price Cap</Label><Input value={form.maxPriceCap} onChange={e => setForm(f => ({ ...f, maxPriceCap: e.target.value }))} placeholder="Optional" className="bg-white/5 border-white/10" /></div>
                </div>
                <Separator className="bg-white/10" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Advanced Pricing</p>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Initial Fixed Cost</Label><Input value={form.initialFixedCost} onChange={e => setForm(f => ({ ...f, initialFixedCost: e.target.value }))} placeholder="e.g. 3.00" className="bg-white/5 border-white/10" /></div>
                  <div><Label>Initial Fixed Minutes</Label><Input type="number" value={form.initialFixedMinutes || ""} onChange={e => setForm(f => ({ ...f, initialFixedMinutes: parseInt(e.target.value) || 0 }))} placeholder="e.g. 30" className="bg-white/5 border-white/10" /></div>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Per-Attendee Pricing</Label>
                  <Switch checked={form.perAttendeePricing} onCheckedChange={v => setForm(f => ({ ...f, perAttendeePricing: v }))} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Default Rate</Label>
                  <Switch checked={form.isDefault} onCheckedChange={v => setForm(f => ({ ...f, isDefault: v }))} />
                </div>
                <Separator className="bg-white/10" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Targeting</p>
                <Select value={form.appliesToCustomerType} onValueChange={v => setForm(f => ({ ...f, appliesToCustomerType: v as any }))}>
                  <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem>
                    <SelectItem value="members_only">Members Only</SelectItem>
                    <SelectItem value="guests_only">Guests Only</SelectItem>
                    <SelectItem value="specific_tiers">Specific Tiers</SelectItem>
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Valid Time Start</Label><Input value={form.validTimeStart} onChange={e => setForm(f => ({ ...f, validTimeStart: e.target.value }))} placeholder="09:00" className="bg-white/5 border-white/10" /></div>
                  <div><Label>Valid Time End</Label><Input value={form.validTimeEnd} onChange={e => setForm(f => ({ ...f, validTimeEnd: e.target.value }))} placeholder="17:00" className="bg-white/5 border-white/10" /></div>
                </div>
                <Button className="w-full bg-[#627653] hover:bg-[#4e5f42]" onClick={() => createMut.mutate(form)} disabled={createMut.isPending}>
                  {createMut.isPending ? "Creating..." : "Create Rate"}
                </Button>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button variant={filterTypeId === null ? "default" : "outline"} size="sm" onClick={() => setFilterTypeId(null)} className={filterTypeId === null ? "bg-[#627653]" : ""}>All</Button>
        {types?.map((t: any) => (
          <Button key={t.id} variant={filterTypeId === t.id ? "default" : "outline"} size="sm" onClick={() => setFilterTypeId(t.id)} className={filterTypeId === t.id ? "bg-[#627653]" : ""}>{t.name}</Button>
        ))}
      </div>

      <div className="grid gap-3">
        {filteredRates.map((r: any) => (
          <Card key={r.id} className="bg-white/[0.03] border-white/10 hover:bg-white/[0.06] transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#b8a472]/20 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-[#b8a472]" />
                  </div>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {r.name}
                      {r.isDefault && <Badge className="bg-[#627653]/20 text-[#627653] text-[10px]">DEFAULT</Badge>}
                      {r.perAttendeePricing && <Badge variant="outline" className="text-[10px]">PER ATTENDEE</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                      <span>{getTypeName(r.resourceTypeId)}</span>
                      <span className="text-[#b8a472] font-medium">{r.creditCost}c {CHARGING_UNITS[r.chargingUnit]}</span>
                      {r.maxPriceCap && <span>Cap: {r.maxPriceCap}c</span>}
                      {r.initialFixedCost && <span>Setup: {r.initialFixedCost}c/{r.initialFixedMinutes}min</span>}
                      {r.validTimeStart && <span>{r.validTimeStart}–{r.validTimeEnd}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{r.appliesToCustomerType === "all" ? "All" : r.appliesToCustomerType?.replace("_", " ")}</Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => deleteMut.mutate({ id: r.id })}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredRates.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No rates configured{filterTypeId ? " for this type" : ""}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Resource Rules Tab ───
function ResourceRulesTab() {
  const { data: rules, isLoading } = trpc.resourceRules.list.useQuery();
  const utils = trpc.useUtils();
  const deleteMut = trpc.resourceRules.delete.useMutation({
    onSuccess: () => { utils.resourceRules.list.invalidate(); toast.success("Rule deactivated"); },
  });

  const getRuleIcon = (limitType: string) => {
    switch (limitType) {
      case "block_booking": return <Ban className="w-5 h-5 text-red-400" />;
      case "restrict_hours": return <Clock className="w-5 h-5 text-amber-400" />;
      case "max_duration": case "min_duration": return <Timer className="w-5 h-5 text-blue-400" />;
      case "require_approval": return <CheckCircle2 className="w-5 h-5 text-purple-400" />;
      default: return <ShieldCheck className="w-5 h-5 text-[#627653]" />;
    }
  };

  if (isLoading) return <div className="animate-pulse space-y-3">{[1,2,3].map((i: any) => <div key={i} className="h-20 bg-white/5 rounded-lg" />)}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold tracking-tight">Booking Rules Engine</h3>
        <p className="text-sm text-muted-foreground mt-1">Condition-based rules that control who can book what, when, and how. Rules are evaluated in order; "stop evaluation" halts further checks.</p>
      </div>

      <div className="space-y-3">
        {rules?.map((r: any, i: any) => (
          <Card key={r.id} className="bg-white/[0.03] border-white/10 hover:bg-white/[0.06] transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-muted-foreground font-mono">#{r.evaluationOrder}</span>
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                      {getRuleIcon(r.limitType)}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {r.name}
                      <Badge variant={r.scope === "global" ? "default" : "outline"} className={`text-[10px] ${r.scope === "global" ? "bg-amber-500/20 text-amber-400" : ""}`}>
                        {r.scope?.toUpperCase()}
                      </Badge>
                      {r.stopEvaluation && <Badge variant="outline" className="text-[10px] text-red-400 border-red-400/30">STOP</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      <span className="text-white/60">IF</span> {CONDITION_TYPES[r.conditionType]} {r.conditionValue ? JSON.stringify(r.conditionValue) : ""}
                      <span className="text-white/60 ml-2">THEN</span> {LIMIT_TYPES[r.limitType]} {r.limitValue ? JSON.stringify(r.limitValue) : ""}
                    </div>
                    {r.description && <p className="text-xs text-muted-foreground/60 mt-1">{r.description}</p>}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => deleteMut.mutate({ id: r.id })}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!rules || rules.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">
            <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No booking rules configured</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Booking Policies Tab ───
function BookingPoliciesTab() {
  const { data: policies, isLoading } = trpc.bookingPolicies.list.useQuery();
  const { data: types } = trpc.resourceTypes.list.useQuery();
  const { data: locations } = trpc.locations.list.useQuery();
  const utils = trpc.useUtils();
  const deleteMut = trpc.bookingPolicies.delete.useMutation({
    onSuccess: () => { utils.bookingPolicies.list.invalidate(); toast.success("Policy deactivated"); },
  });

  const getTypeName = (id: number | null) => id ? types?.find((t: any) => t.id === id)?.name ?? `Type #${id}` : "All Types";
  const getLocationName = (id: number | null) => id ? locations?.find((l: any) => l.id === id)?.name ?? `Loc #${id}` : "All Locations";

  if (isLoading) return <div className="animate-pulse space-y-3">{[1,2,3].map((i: any) => <div key={i} className="h-20 bg-white/5 rounded-lg" />)}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold tracking-tight">Booking Policies</h3>
        <p className="text-sm text-muted-foreground mt-1">Define buffer times, cancellation fees, no-show penalties, check-in windows, and approval requirements per location or resource type.</p>
      </div>

      <div className="grid gap-4">
        {policies?.map((p: any) => (
          <Card key={p.id} className="bg-white/[0.03] border-white/10">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-[#627653]" />
                  {p.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{getLocationName(p.locationId)}</Badge>
                  <Badge variant="outline" className="text-xs">{getTypeName(p.resourceTypeId)}</Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => deleteMut.mutate({ id: p.id })}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Timing</p>
                  <p>Buffer: {p.bufferMinutes}min</p>
                  <p>Min advance: {p.minAdvanceMinutes}min</p>
                  <p>Max advance: {p.maxAdvanceDays} days</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Duration</p>
                  <p>Min: {p.minDurationMinutes}min</p>
                  <p>Max: {p.maxDurationMinutes}min</p>
                  <p>Recurring: {p.allowRecurring ? "Yes" : "No"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Cancellation</p>
                  <p>Free cancel: {p.freeCancelMinutes}min</p>
                  <p>Late fee: {p.lateCancelFeePercent}%</p>
                  <p>No-show fee: {p.noShowFeePercent}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Check-in</p>
                  <p>Auto check-in: {p.autoCheckInMinutes}min</p>
                  <p>Auto cancel: {p.autoCancelNoCheckIn ? "Yes" : "No"}</p>
                  <p>Approval: {p.requireApproval ? "Required" : "No"}</p>
                  <p>Guests: {p.allowGuestBooking ? "Allowed" : "No"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!policies || policies.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">
            <Settings2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No booking policies configured</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Amenities Tab ───
function AmenitiesTab() {
  const { data: amenities, isLoading } = trpc.resourceAmenities.list.useQuery();

  const categoryColors: Record<string, string> = {
    tech: "text-blue-400 bg-blue-400/10", furniture: "text-amber-400 bg-amber-400/10",
    comfort: "text-green-400 bg-green-400/10", accessibility: "text-purple-400 bg-purple-400/10",
    catering: "text-pink-400 bg-pink-400/10",
  };

  if (isLoading) return <div className="animate-pulse space-y-3">{[1,2,3].map((i: any) => <div key={i} className="h-20 bg-white/5 rounded-lg" />)}</div>;

  const grouped = amenities?.reduce((acc: Record<string, any[]>, a: any) => {
    const cat = a.category ?? "tech";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(a);
    return acc;
  }, {} as Record<string, any[]>) ?? ({} as Record<string, any[]>);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold tracking-tight">Resource Amenities</h3>
        <p className="text-sm text-muted-foreground mt-1">Amenities that can be assigned to individual resources. Members see these when browsing available spaces.</p>
      </div>

      {(Object.entries(grouped) as [string, any[]][]).map(([cat, items]) => (
        <div key={cat}>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">{cat}</p>
          <div className="flex flex-wrap gap-2">
            {items?.map((a: any) => (
              <Badge key={a.id} variant="outline" className={`px-3 py-1.5 text-sm ${categoryColors[cat] ?? ""}`}>
                {a.icon && <span className="mr-1">{a.icon}</span>}
                {a.name}
              </Badge>
            ))}
          </div>
        </div>
      ))}
      {(!amenities || amenities.length === 0) && (
        <div className="text-center py-12 text-muted-foreground">
          <Coffee className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No amenities configured</p>
        </div>
      )}
    </div>
  );
}

// ─── Schedules Tab ───
function SchedulesTab() {
  const { data: schedules, isLoading } = trpc.resourceSchedules.list.useQuery();
  const { data: locations } = trpc.locations.list.useQuery();

  const getLocationName = (id: number | null) => id ? locations?.find((l: any) => l.id === id)?.name ?? `Loc #${id}` : "Global";

  if (isLoading) return <div className="animate-pulse space-y-3">{[1,2,3].map((i: any) => <div key={i} className="h-20 bg-white/5 rounded-lg" />)}</div>;

  const grouped = schedules?.reduce((acc: Record<string, any[]>, s: any) => {
    const key = String(s.locationId ?? 0);
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {} as Record<string, any[]>) ?? ({} as Record<string, any[]>);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold tracking-tight">Availability Schedules</h3>
        <p className="text-sm text-muted-foreground mt-1">Opening hours per location and day of week. Resources inherit their location's schedule unless overridden.</p>
      </div>

      {(Object.entries(grouped) as [string, any[]][]).map(([locId, items]) => (
        <Card key={locId} className="bg-white/[0.03] border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{getLocationName(parseInt(locId))}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {DAYS.map((day, i) => {
                const schedule = items?.find((s: any) => s.dayOfWeek === i);
                return (
                  <div key={i} className={`text-center p-2 rounded-lg ${schedule?.isActive ? "bg-[#627653]/10" : "bg-white/5 opacity-50"}`}>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{day.slice(0, 3)}</p>
                    {schedule ? (
                      <p className="text-xs font-medium mt-1">{schedule.openTime}–{schedule.closeTime}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">Closed</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
      {(!schedules || schedules.length === 0) && (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No schedules configured</p>
        </div>
      )}
    </div>
  );
}

// ─── Blocked Dates Tab ───
function BlockedDatesTab() {
  const { data: blocked, isLoading } = trpc.blockedDates.list.useQuery();
  const { data: locations } = trpc.locations.list.useQuery();
  const utils = trpc.useUtils();
  const deleteMut = trpc.blockedDates.delete.useMutation({
    onSuccess: () => { utils.blockedDates.list.invalidate(); toast.success("Blocked date removed"); },
  });

  const getLocationName = (id: number | null) => id ? locations?.find((l: any) => l.id === id)?.name ?? `Loc #${id}` : "All Locations";

  if (isLoading) return <div className="animate-pulse space-y-3">{[1,2,3].map((i: any) => <div key={i} className="h-20 bg-white/5 rounded-lg" />)}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold tracking-tight">Blocked Dates</h3>
        <p className="text-sm text-muted-foreground mt-1">Block specific dates for maintenance, holidays, or events. Resources cannot be booked during blocked periods.</p>
      </div>

      <div className="space-y-3">
        {blocked?.map((b: any) => (
          <Card key={b.id} className="bg-white/[0.03] border-white/10">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <CalendarOff className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <div className="font-medium">{b.reason || "Blocked Period"}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {new Date(b.startDate).toLocaleDateString()} – {new Date(b.endDate).toLocaleDateString()}
                    <span className="ml-2">{getLocationName(b.locationId)}</span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => deleteMut.mutate({ id: b.id })}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
        {(!blocked || blocked.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">
            <CalendarOff className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No blocked dates configured</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Resources Tab (CRUD for individual resources) ───
const RESOURCE_TYPES = ["desk", "meeting_room", "private_office", "open_space", "locker", "gym", "phone_booth", "event_space"];
const ZONES = ["zone_0", "zone_1", "zone_2", "zone_3"];

function ResourcesTab() {
  const { data: resources, isLoading } = trpc.resources.all.useQuery();
  const { data: locations } = trpc.locations.list.useQuery();
  const utils = trpc.useUtils();
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ locationId: 0, name: "", type: "desk", zone: "zone_0", capacity: 1, floor: "", creditCostPerHour: "5.00", areaM2: "" });
  const [editForm, setEditForm] = useState<any>({});
  const [filterLocation, setFilterLocation] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const createMut = trpc.resources.create.useMutation({
    onSuccess: () => { utils.resources.all.invalidate(); toast.success("Resource created"); setShowCreate(false); setForm({ locationId: 0, name: "", type: "desk", zone: "zone_0", capacity: 1, floor: "", creditCostPerHour: "5.00", areaM2: "" }); },
    onError: (e: any) => toast.error(e.message),
  });
  const updateMut = trpc.resources.update.useMutation({
    onSuccess: () => { utils.resources.all.invalidate(); toast.success("Resource updated"); setEditId(null); },
    onError: (e: any) => toast.error(e.message),
  });
  const deleteMut = trpc.resources.delete.useMutation({
    onSuccess: () => { utils.resources.all.invalidate(); toast.success("Resource deactivated"); },
  });

  const getLocationName = (id: number) => locations?.find((l: any) => l.id === id)?.name ?? `Loc #${id}`;

  const filtered = useMemo(() => {
    if (!resources) return [];
    return resources.filter((r: any) => {
      if (filterLocation !== "all" && r.locationId !== parseInt(filterLocation)) return false;
      if (filterType !== "all" && r.type !== filterType) return false;
      return true;
    });
  }, [resources, filterLocation, filterType]);

  if (isLoading) return <div className="animate-pulse space-y-3">{[1,2,3].map((i: any) => <div key={i} className="h-20 bg-white/5 rounded-lg" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">All Resources</h3>
          <p className="text-sm text-muted-foreground mt-1">Manage individual desks, meeting rooms, offices, and other bookable spaces across all locations.</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="bg-[#627653] hover:bg-[#4e5f42]"><Plus className="w-4 h-4 mr-1.5" /> Add Resource</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create New Resource</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Desk A1" /></div>
                <div><Label>Location</Label>
                  <Select value={String(form.locationId || "")} onValueChange={v => setForm(f => ({ ...f, locationId: parseInt(v) }))}>
                    <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                    <SelectContent>{locations?.map((l: any) => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>Type</Label>
                  <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{RESOURCE_TYPES.map((t: any) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Zone</Label>
                  <Select value={form.zone} onValueChange={v => setForm(f => ({ ...f, zone: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ZONES.map((z: any) => <SelectItem key={z} value={z}>{z.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Capacity</Label><Input type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: parseInt(e.target.value) || 1 }))} /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>Credits/Hour</Label><Input value={form.creditCostPerHour} onChange={e => setForm(f => ({ ...f, creditCostPerHour: e.target.value }))} /></div>
                <div><Label>Floor</Label><Input value={form.floor} onChange={e => setForm(f => ({ ...f, floor: e.target.value }))} placeholder="1" /></div>
                <div><Label>Area (m2)</Label><Input value={form.areaM2} onChange={e => setForm(f => ({ ...f, areaM2: e.target.value }))} placeholder="12.5" /></div>
              </div>
              <Button className="w-full bg-[#627653] hover:bg-[#4e5f42]" onClick={() => createMut.mutate(form)} disabled={createMut.isPending || !form.name || !form.locationId}>Create Resource</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={filterLocation} onValueChange={setFilterLocation}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Locations" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations?.map((l: any) => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {RESOURCE_TYPES.map((t: any) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="ml-auto text-sm text-muted-foreground self-center">{filtered.length} resources</div>
      </div>

      {/* Resource List */}
      <div className="space-y-2">
        {filtered.map((r: any) => (
          <Card key={r.id} className={`border-white/10 ${r.isActive ? "bg-white/[0.03]" : "bg-red-500/5 border-red-500/20"}`}>
            <CardContent className="p-4">
              {editId === r.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-3">
                    <div><Label className="text-xs">Name</Label><Input value={editForm.name ?? r.name} onChange={e => setEditForm((f: any) => ({ ...f, name: e.target.value }))} /></div>
                    <div><Label className="text-xs">Type</Label>
                      <Select value={editForm.type ?? r.type} onValueChange={v => setEditForm((f: any) => ({ ...f, type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{RESOURCE_TYPES.map((t: any) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label className="text-xs">Zone</Label>
                      <Select value={editForm.zone ?? r.zone} onValueChange={v => setEditForm((f: any) => ({ ...f, zone: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{ZONES.map((z: any) => <SelectItem key={z} value={z}>{z.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label className="text-xs">Capacity</Label><Input type="number" value={editForm.capacity ?? r.capacity} onChange={e => setEditForm((f: any) => ({ ...f, capacity: parseInt(e.target.value) || 1 }))} /></div>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div><Label className="text-xs">Credits/Hour</Label><Input value={editForm.creditCostPerHour ?? r.creditCostPerHour} onChange={e => setEditForm((f: any) => ({ ...f, creditCostPerHour: e.target.value }))} /></div>
                    <div><Label className="text-xs">Floor</Label><Input value={editForm.floor ?? r.floor ?? ""} onChange={e => setEditForm((f: any) => ({ ...f, floor: e.target.value }))} /></div>
                    <div><Label className="text-xs">Area (m2)</Label><Input value={editForm.areaM2 ?? r.areaM2 ?? ""} onChange={e => setEditForm((f: any) => ({ ...f, areaM2: e.target.value }))} /></div>
                    <div className="flex items-end gap-2">
                      <Button size="sm" className="bg-[#627653] hover:bg-[#4e5f42]" onClick={() => updateMut.mutate({ id: r.id, ...editForm })} disabled={updateMut.isPending}>Save</Button>
                      <Button size="sm" variant="outline" onClick={() => { setEditId(null); setEditForm({}); }}>Cancel</Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${r.isActive ? "bg-[#627653]/10" : "bg-red-500/10"}`}>
                      <Monitor className={`w-5 h-5 ${r.isActive ? "text-[#627653]" : "text-red-400"}`} />
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {r.name}
                        {!r.isActive && <Badge variant="outline" className="text-red-400 border-red-400/30 text-[10px]">Inactive</Badge>}
                        {r.isRozEligible && <Badge variant="outline" className="text-amber-400 border-amber-400/30 text-[10px]">ROZ</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3">
                        <span>{getLocationName(r.locationId)}</span>
                        <span>{r.type?.replace(/_/g, " ")}</span>
                        <span>{r.zone?.replace(/_/g, " ")}</span>
                        <span><Users className="w-3 h-3 inline mr-0.5" />{r.capacity}</span>
                        {r.floor && <span>Floor {r.floor}</span>}
                        {r.areaM2 && <span>{r.areaM2}m2</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-[#627653]/20 text-[#627653] border-0">{r.creditCostPerHour} cr/hr</Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditId(r.id); setEditForm({}); }}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    {r.isActive && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => { if (confirm("Deactivate this resource?")) deleteMut.mutate({ id: r.id }); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Monitor className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No resources found</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ───
export default function ResourceManagement() {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-[#627653] border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Resource Management</h1>
        <p className="text-muted-foreground mt-1">Configure resource types, pricing rates, booking rules, policies, amenities, and availability schedules.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard icon={<Layers className="w-5 h-5" />} label="Resource Types" endpoint="types" />
        <SummaryCard icon={<DollarSign className="w-5 h-5" />} label="Pricing Rates" endpoint="rates" />
        <SummaryCard icon={<ShieldCheck className="w-5 h-5" />} label="Booking Rules" endpoint="rules" />
        <SummaryCard icon={<Settings2 className="w-5 h-5" />} label="Policies" endpoint="policies" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="types" className="space-y-6">
        <TabsList className="bg-white/5 border border-white/10 p-1 h-auto flex-wrap">
          <TabsTrigger value="types" className="data-[state=active]:bg-[#627653] data-[state=active]:text-white">
            <Layers className="w-4 h-4 mr-1.5" /> Types
          </TabsTrigger>
          <TabsTrigger value="rates" className="data-[state=active]:bg-[#627653] data-[state=active]:text-white">
            <DollarSign className="w-4 h-4 mr-1.5" /> Rates
          </TabsTrigger>
          <TabsTrigger value="rules" className="data-[state=active]:bg-[#627653] data-[state=active]:text-white">
            <ShieldCheck className="w-4 h-4 mr-1.5" /> Rules
          </TabsTrigger>
          <TabsTrigger value="policies" className="data-[state=active]:bg-[#627653] data-[state=active]:text-white">
            <Settings2 className="w-4 h-4 mr-1.5" /> Policies
          </TabsTrigger>
          <TabsTrigger value="amenities" className="data-[state=active]:bg-[#627653] data-[state=active]:text-white">
            <Coffee className="w-4 h-4 mr-1.5" /> Amenities
          </TabsTrigger>
          <TabsTrigger value="schedules" className="data-[state=active]:bg-[#627653] data-[state=active]:text-white">
            <Clock className="w-4 h-4 mr-1.5" /> Schedules
          </TabsTrigger>
          <TabsTrigger value="blocked" className="data-[state=active]:bg-[#627653] data-[state=active]:text-white">
            <CalendarOff className="w-4 h-4 mr-1.5" /> Blocked
          </TabsTrigger>
          <TabsTrigger value="roz" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
            <Building2 className="w-4 h-4 mr-1.5" /> ROZ Huur
          </TabsTrigger>
          <TabsTrigger value="resources" className="data-[state=active]:bg-[#627653] data-[state=active]:text-white">
            <Monitor className="w-4 h-4 mr-1.5" /> Resources
          </TabsTrigger>
        </TabsList>

        <TabsContent value="types"><ResourceTypesTab /></TabsContent>
        <TabsContent value="rates"><ResourceRatesTab /></TabsContent>
        <TabsContent value="rules"><ResourceRulesTab /></TabsContent>
        <TabsContent value="policies"><BookingPoliciesTab /></TabsContent>
        <TabsContent value="amenities"><AmenitiesTab /></TabsContent>
        <TabsContent value="schedules"><SchedulesTab /></TabsContent>
        <TabsContent value="blocked"><BlockedDatesTab /></TabsContent>
        <TabsContent value="roz"><RozAdminTab /></TabsContent>
        <TabsContent value="resources"><ResourcesTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function SummaryCard({ icon, label, endpoint }: { icon: React.ReactNode; label: string; endpoint: string }) {
  const typesQ = trpc.resourceTypes.list.useQuery(undefined, { enabled: endpoint === "types" });
  const ratesQ = trpc.resourceRates.list.useQuery(undefined, { enabled: endpoint === "rates" });
  const rulesQ = trpc.resourceRules.list.useQuery(undefined, { enabled: endpoint === "rules" });
  const policiesQ = trpc.bookingPolicies.list.useQuery(undefined, { enabled: endpoint === "policies" });

  const count = endpoint === "types" ? typesQ.data?.length
    : endpoint === "rates" ? ratesQ.data?.length
    : endpoint === "rules" ? rulesQ.data?.length
    : policiesQ.data?.length;

  return (
    <Card className="bg-white/[0.03] border-white/10">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#627653]/20 flex items-center justify-center text-[#627653]">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-semibold">{count ?? "—"}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
